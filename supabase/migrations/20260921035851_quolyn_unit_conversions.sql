create table public.quolyn_units(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.quolyn_workspaces,code text not null check(code ~ '^[a-z][a-z0-9_]{0,15}$' and code not in('each','box','m2','ft2','lm')),label text not null,dimension text not null check(dimension in('area','length','count')),base_factor numeric not null check(base_factor>0 and base_factor<=1000000000),unique(workspace_id,code));
alter table public.quolyn_units enable row level security;
revoke all on public.quolyn_units from anon,authenticated;
grant select,insert,update on public.quolyn_units to authenticated;
create policy member_read on public.quolyn_units for select to authenticated using(quolyn_private.member(workspace_id));
create policy owner_insert on public.quolyn_units for insert to authenticated with check(quolyn_private.owner(workspace_id));
create policy owner_update on public.quolyn_units for update to authenticated using(quolyn_private.owner(workspace_id)) with check(quolyn_private.owner(workspace_id));
create trigger immutable_workspace before update on public.quolyn_units for each row execute function quolyn_private.immutable_workspace();
create trigger audit_change after insert or update on public.quolyn_units for each row execute function quolyn_private.audit_change();
create function quolyn_private.unit_definition(w uuid,code text) returns jsonb language plpgsql stable security definer set search_path='' as $$ declare r public.quolyn_units; begin
case code when 'm2' then return '{"dimension":"area","factor":"1"}';when 'ft2' then return '{"dimension":"area","factor":"0.09290304"}';when 'lm' then return '{"dimension":"length","factor":"1"}';when 'each' then return '{"dimension":"count","factor":"1"}';else
select * into r from public.quolyn_units where workspace_id=w and quolyn_units.code=unit_definition.code;
if r.id is null then raise exception 'Unconfigured unit: %',code; end if;return jsonb_build_object('dimension',r.dimension,'factor',r.base_factor::text);end case;
end $$;
create function quolyn_private.convert_qty_w(w uuid,q numeric,f text,t text) returns numeric language plpgsql stable security invoker set search_path='' as $$ declare a jsonb;b jsonb;begin
if f=t then return q;end if;
a:=quolyn_private.unit_definition(w,f);b:=quolyn_private.unit_definition(w,t);
if a->>'dimension'<>b->>'dimension' then raise exception 'Incompatible dimensions: % to %',f,t;end if;
return q*(a->>'factor')::numeric/(b->>'factor')::numeric(60,30);
end $$;
revoke all on function quolyn_private.unit_definition(uuid,text),quolyn_private.convert_qty_w(uuid,numeric,text,text) from public,anon,authenticated;
create or replace function quolyn_private.product_limit() returns trigger language plpgsql security definer set search_path='' as $$ begin
perform pg_advisory_xact_lock(hashtextextended(new.workspace_id::text,1));
if not exists(select 1 from public.quolyn_products where workspace_id=new.workspace_id and (id=new.id or (new.sku is not null and sku=new.sku))) and (select count(*) from public.quolyn_products where workspace_id=new.workspace_id)>=10000 then raise exception 'Workspace limit is 10000 products';end if;
new.updated_at:=now();return new;end $$;

create or replace function quolyn_private.save_quote(w uuid,p jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare qid uuid; oldq public.quolyn_quotes; ws public.quolyn_workspaces; cust public.quolyn_customers; prod public.quolyn_products; l jsonb; clean jsonb; snaps jsonb:='[]'; errors jsonb:='[]'; warns jsonb:='[]'; qty numeric; bill numeric; packs numeric; delivered numeric; price bigint; disc int; tax int; gross bigint; discount_amount bigint; net bigint; tax_amount bigint; total bigint:=0; line_total bigint; n bigint; pos int:=0; req uuid; c uuid; included boolean; reviewed boolean; unit text; pu text; descr text; reason text; cost bigint; margin bigint; parent uuid; rev int:=1; num text; stage text; problems jsonb; new_id boolean;
begin
if not quolyn_private.member(w) then raise exception 'Access denied'; end if;
if jsonb_typeof(p->'lines')<>'array' or jsonb_array_length(p->'lines')>100 then raise exception 'Maximum 100 lines'; end if;
select * into ws from public.quolyn_workspaces where id=w;
c:=nullif(p->>'customer_id','')::uuid;
select * into cust from public.quolyn_customers where workspace_id=w and id=c;
if c is not null and cust.id is null then raise exception 'Customer outside workspace'; end if;
req:=(p->>'request_id')::uuid; if req is null then raise exception 'Request ID required'; end if;
perform pg_advisory_xact_lock(hashtextextended(w::text||req::text,0));
select id into qid from public.quolyn_quotes where workspace_id=w and request_id=req; if qid is not null then return qid; end if;
qid:=nullif(p->>'id','')::uuid;
if qid is null then select id into qid from public.quolyn_quotes where workspace_id=w and request_id=req; if qid is not null then return qid; end if; end if;
if qid is not null then
select * into oldq from public.quolyn_quotes where id=qid and workspace_id=w for update;
if oldq.id is null then raise exception 'Quote not found'; end if;
if oldq.version is distinct from (p->>'version')::int then raise exception 'Conflicting edit: reload the quote'; end if;
if oldq.status in('sent','accepted','rejected','expired') then
parent:=coalesce(oldq.parent_id,oldq.id); perform pg_advisory_xact_lock(hashtextextended(parent::text,0));
select max(revision)+1 into rev from public.quolyn_quotes where id=parent or parent_id=parent; num:=oldq.number; qid:=null;
end if;
end if;
new_id:=qid is null;
if qid is null then
if num is null then update public.quolyn_quote_counters set value=value+1 where workspace_id=w returning value into n; num:=ws.quote_prefix||'-'||lpad(n::text,5,'0'); end if;
insert into public.quolyn_quotes(workspace_id,customer_id,enquiry_id,number,revision,parent_id,request_id,currency) values(w,c,nullif(p->>'enquiry_id','')::uuid,num,rev,parent,req,ws.currency) returning id into qid;
else delete from public.quolyn_quote_lines where quote_id=qid; end if;
if nullif(p->>'enquiry_id','') is not null and exists(select 1 from public.quolyn_enquiries e where e.id=(p->>'enquiry_id')::uuid and e.workspace_id=w and e.original_text ~* '(next month|next week|second week)' and e.delivery_date is null) then errors:=errors||jsonb_build_array('Resolve the relative delivery date in the enquiry'); end if;
if cust.id is null or cust.name='' or cust.address='' then errors:=errors||jsonb_build_array('Customer name and billing address required'); end if;
if ws.name='' or ws.address='' then errors:=errors||jsonb_build_array('Distributor name and address required'); end if;
if cust.id is not null and cust.currency<>ws.currency then errors:=errors||jsonb_build_array('Customer currency mismatch'); end if;
for l in select value from jsonb_array_elements(p->'lines') loop
pos:=pos+1; prod:=null; qty:=null; bill:=null; packs:=null; delivered:=null; line_total:=null; margin:=null; problems:='[]';
included:=coalesce((l->>'included')::boolean,true); reviewed:=coalesce((l->>'reviewed')::boolean,false);
if nullif(l->>'product_id','') is not null then select * into prod from public.quolyn_products where workspace_id=w and id=(l->>'product_id')::uuid; if prod.id is null then raise exception 'Product outside workspace'; end if; end if;
descr:=coalesce(nullif(l->>'description',''),prod.name,'Manual item');
unit:=nullif(l->>'unit',''); pu:=coalesce(prod.price_unit,nullif(l->>'price_unit',''));
price:=case when prod.id is not null then coalesce(nullif(l->>'override_minor','')::bigint,prod.price_minor) else coalesce(nullif(l->>'override_minor','')::bigint,nullif(l->>'price_minor','')::bigint) end;
disc:=coalesce(nullif(l->>'discount_bps','')::int,cust.discount_bps,0);
tax:=coalesce(prod.tax_bps,nullif(l->>'tax_bps','')::int);
reason:=coalesce(l->>'override_reason','');
if price<0 or disc not between 0 and 10000 or tax not between 0 and 10000 then raise exception 'Invalid price or rate'; end if;
if nullif(l->>'enquiry_line_id','') is not null and not exists(select 1 from public.quolyn_enquiry_lines el where el.id=(l->>'enquiry_line_id')::uuid and el.workspace_id=w and el.state='confirmed') then problems:=problems||jsonb_build_array('Linked enquiry line requires confirmation'); end if;
if prod.id is null and coalesce(l->>'description','')='' then problems:=problems||jsonb_build_array('Manual item requires an explicit description'); end if;
if not reviewed then problems:=problems||jsonb_build_array('Explicit review required'); end if;
if coalesce((l->>'requirements_resolved')::boolean,false)=false then problems:=problems||jsonb_build_array('Critical requirements unresolved'); end if;
if nullif(l->>'override_minor','') is not null and reason='' then problems:=problems||jsonb_build_array('Price override requires a reason'); end if;
if prod.id is not null then
if not prod.active then problems:=problems||jsonb_build_array('Product is inactive'); end if;
if prod.currency<>ws.currency then problems:=problems||jsonb_build_array('Product currency mismatch'); end if;
if prod.updated_at<now()-interval '90 days' then warns:=warns||jsonb_build_array('Line '||pos||': price older than 90 days'); end if;
end if;
begin
qty:=nullif(l->>'quantity','')::numeric;
if qty is null or qty<=0 or qty>100000000 or unit is null or pu is null or price is null or tax is null then raise exception 'Quantity, units, price and explicit tax required'; end if;
if prod.coverage is not null and prod.coverage_unit is not null and unit<>'box' then packs:=ceil(quolyn_private.convert_qty_w(w,qty,unit,prod.coverage_unit)/prod.coverage); delivered:=packs*prod.coverage; end if;
if unit='box' and prod.coverage is not null and prod.coverage_unit is not null then packs:=qty;delivered:=qty*prod.coverage;end if;
if unit='box' and pu<>'box' then if delivered is null then raise exception 'Pack coverage required';end if;bill:=quolyn_private.convert_qty_w(w,delivered,prod.coverage_unit,pu);
elsif pu='box' and unit<>'box' then if packs is null then raise exception 'Pack coverage required'; end if; bill:=packs;
elsif l->>'billing'='delivered' then if delivered is null then raise exception 'Delivered coverage unavailable'; end if; bill:=quolyn_private.convert_qty_w(w,delivered,prod.coverage_unit,pu);
else bill:=quolyn_private.convert_qty_w(w,qty,unit,pu); end if;
gross:=round(bill*price); discount_amount:=round(gross*disc/10000.0); net:=gross-discount_amount; tax_amount:=round(net*tax/10000.0); line_total:=net+tax_amount;
if prod.cost_minor is not null and prod.cost_unit=pu then margin:=net-round(bill*prod.cost_minor); if net>0 and margin*10000.0/net<ws.margin_warning_bps then warns:=warns||jsonb_build_array('Line '||pos||': low or negative margin'); end if; end if;
exception when others then problems:=problems||jsonb_build_array(SQLERRM); line_total:=null;
end;
if disc>ws.discount_warning_bps then warns:=warns||jsonb_build_array('Line '||pos||': discount above threshold'); end if;
if included then
if jsonb_array_length(problems)>0 then errors:=errors||jsonb_build_array(jsonb_build_object('line',pos,'issues',problems)); end if;
if line_total is not null then total:=total+line_total; end if;
end if;
clean:=jsonb_build_object('description',descr,'sku',prod.sku,'quantity',qty::text,'unit',unit,'price_unit',pu,'price_minor',price::text,'discount_bps',disc,'tax_bps',tax,'included',included,'reviewed',reviewed,'requirements_resolved',coalesce((l->>'requirements_resolved')::boolean,false),'packs',packs::text,'delivered',delivered::text,'coverage',prod.coverage::text,'coverage_unit',prod.coverage_unit,'billing',coalesce(l->>'billing','requested'),'billable',bill::text,'effective_conversion_factor',case when qty>0 then (bill/qty)::text end,'net_minor',case when line_total is not null then net::text end,'tax_minor',case when line_total is not null then tax_amount::text end,'total_minor',line_total::text);
insert into public.quolyn_quote_lines(workspace_id,quote_id,product_id,enquiry_line_id,position,description,quantity,unit,price_unit,price_minor,discount_bps,tax_bps,reviewed,included,data) values(w,qid,prod.id,nullif(l->>'enquiry_line_id','')::uuid,pos,descr,qty,unit,pu,price,disc,tax,reviewed,included,clean||jsonb_build_object('product_id',prod.id,'enquiry_line_id',l->>'enquiry_line_id','override_minor',l->>'override_minor','override_reason',reason,'margin_minor',margin::text,'manual_discount_bps',nullif(l->>'discount_bps','')::int));
snaps:=snaps||jsonb_build_array(clean);
end loop;
if not exists(select 1 from public.quolyn_quote_lines where quote_id=qid and quolyn_quote_lines.included) then errors:=errors||jsonb_build_array('At least one included line required'); end if;
stage:=case when oldq.status='ready' or parent is not null then 'needs review' else 'draft' end;
update public.quolyn_quotes set customer_id=c,currency=ws.currency,request_id=req,status=stage,version=case when new_id then 1 else version+1 end,issue_date=coalesce(nullif(p->>'issue_date','')::date,current_date),expiry_date=coalesce(nullif(p->>'expiry_date','')::date,current_date+ws.validity_days),notes=coalesce(p->>'notes',''),terms=coalesce(p->>'terms',ws.terms),validation=jsonb_build_object('errors',errors,'warnings',warns),total_minor=case when errors='[]'::jsonb then total else null end,snapshot=jsonb_build_object('distributor',jsonb_build_object('name',ws.name,'address',ws.address,'logo_path',ws.logo_path),'customer',jsonb_build_object('name',cust.name,'address',cust.address,'contact_name',cust.contact_name,'email',cust.email,'tax_reference',cust.tax_reference,'payment_terms',cust.payment_terms),'lines',snaps,'currency',ws.currency),updated_at=now() where id=qid;
insert into public.quolyn_activity_logs(workspace_id,actor_id,entity_id,event,details) values(w,auth.uid(),qid,'quote.saved',jsonb_build_object('lines',pos,'unresolved',jsonb_array_length(errors),'revision',rev));
return qid;
end $$;


