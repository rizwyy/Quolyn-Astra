create schema if not exists quolyn_private;
revoke all on schema quolyn_private from public;
grant usage on schema quolyn_private to authenticated;
create extension if not exists pg_trgm with schema extensions;
create table public.quolyn_profiles(id uuid primary key references auth.users(id) on delete cascade, display_name text, created_at timestamptz not null default now());
create table public.quolyn_workspaces(id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 160), address text not null default '', currency text not null default 'INR' check(currency ~ '^[A-Z]{3}$'), tax_bps int check(tax_bps between 0 and 10000), validity_days int not null default 30 check(validity_days between 1 and 365), quote_prefix text not null default 'QUO', discount_warning_bps int not null default 1500, margin_warning_bps int not null default 1500, terms text not null default '', logo_path text, created_at timestamptz not null default now());
create table public.quolyn_workspace_members(workspace_id uuid not null references public.quolyn_workspaces(id), user_id uuid not null references auth.users(id), role text not null check(role in ('owner','member')), primary key(workspace_id,user_id));
create index members_user on public.quolyn_workspace_members(user_id,workspace_id);
create or replace function quolyn_private.member(w uuid) returns boolean language sql stable security definer set search_path='' as $$ select auth.uid() is not null and exists(select 1 from public.quolyn_workspace_members where workspace_id=w and user_id=auth.uid()); $$;
create or replace function quolyn_private.owner(w uuid) returns boolean language sql stable security definer set search_path='' as $$ select auth.uid() is not null and exists(select 1 from public.quolyn_workspace_members where workspace_id=w and user_id=auth.uid() and role='owner'); $$;
create table public.quolyn_products(id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.quolyn_workspaces, sku text, manufacturer_code text, name text not null, description text not null default '', category text not null default '', brand text not null default '', active boolean not null default true, attributes jsonb not null default '{}', selling_unit text not null default 'each', price_unit text not null default 'each', price_minor bigint check(price_minor>=0), cost_minor bigint check(cost_minor>=0), cost_unit text, pack_unit text, coverage numeric check(coverage>0), coverage_unit text, currency text not null default 'INR', tax_bps int check(tax_bps between 0 and 10000), stock_status text not null default 'Unknown', lead_time text not null default '', source text not null default 'manual', updated_at timestamptz not null default now(), unique(workspace_id,id), unique(workspace_id,sku), check(length(name)>0 or sku is not null));
create index products_search on public.quolyn_products using gin(to_tsvector('simple',coalesce(sku,'')||' '||name||' '||description));
create index products_trgm on public.quolyn_products using gin(name extensions.gin_trgm_ops);
create index products_workspace on public.quolyn_products(workspace_id);
create table public.quolyn_product_aliases(id uuid primary key default gen_random_uuid(), workspace_id uuid not null, product_id uuid not null, alias text not null, foreign key(workspace_id,product_id) references public.quolyn_products(workspace_id,id), unique(workspace_id,product_id,alias));
create table public.quolyn_customers(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.quolyn_workspaces, name text not null,contact_name text not null default '',email text not null default '',phone text not null default '',address text not null default '',tax_reference text not null default '',currency text not null default 'INR',discount_bps int not null default 0 check(discount_bps between 0 and 10000),payment_terms text not null default '',notes text not null default '',created_at timestamptz not null default now(),unique(workspace_id,id));
create table public.quolyn_catalogue_imports(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.quolyn_workspaces,file_path text not null, state text not null default 'preview' check(state in('preview','processing','complete','failed')),summary jsonb not null default '{}',created_at timestamptz not null default now(),unique(workspace_id,id));
create table public.quolyn_enquiries(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.quolyn_workspaces,customer_id uuid,title text not null,source text not null check(source in('email','WhatsApp','phone','walk-in','other')),original_text text not null check(length(original_text)<=16000),received_date date not null default current_date,delivery_date date,notes text not null default '',analysis_notes jsonb not null default '[]',created_at timestamptz not null default now(),unique(workspace_id,id),foreign key(workspace_id,customer_id) references public.quolyn_customers(workspace_id,id));
create table public.quolyn_enquiry_lines(id uuid primary key default gen_random_uuid(),workspace_id uuid not null,enquiry_id uuid not null,position int not null default 0,original_text text not null default '',description text not null,quantity numeric check(quantity>0),unit text,brand text,sku text,requirements jsonb not null default '{}',missing jsonb not null default '[]',delivery text,product_id uuid,state text not null default 'unmatched' check(state in('unmatched','needs clarification','suggested','confirmed','excluded')),clarification text not null default '',exclusion_reason text not null default '',manual boolean not null default false,corrections int not null default 0,unique(workspace_id,id),foreign key(workspace_id,enquiry_id) references public.quolyn_enquiries(workspace_id,id) on delete cascade,foreign key(workspace_id,product_id) references public.quolyn_products(workspace_id,id),check(state<>'excluded' or length(exclusion_reason)>0),check(state<>'confirmed' or (quantity is not null and unit is not null and missing='[]'::jsonb and (product_id is not null or manual))));
create table public.quolyn_match_candidates(id uuid primary key default gen_random_uuid(),workspace_id uuid not null,line_id uuid not null,product_id uuid not null,reasons jsonb not null default '[]',strength text not null,created_at timestamptz not null default now(),foreign key(workspace_id,line_id) references public.quolyn_enquiry_lines(workspace_id,id) on delete cascade,foreign key(workspace_id,product_id) references public.quolyn_products(workspace_id,id));
create table public.quolyn_quote_counters(workspace_id uuid primary key references public.quolyn_workspaces, value bigint not null default 0);
create table public.quolyn_quotes(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.quolyn_workspaces,customer_id uuid,enquiry_id uuid,number text not null,revision int not null default 1,parent_id uuid,request_id uuid not null,version int not null default 1,status text not null default 'draft' check(status in('draft','needs review','ready','sent','accepted','rejected','expired')),currency text not null,issue_date date not null default current_date,expiry_date date,notes text not null default '',terms text not null default '',snapshot jsonb not null default '{}',validation jsonb not null default '[]',total_minor bigint,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),sent_at timestamptz,accepted_at timestamptz,rejected_at timestamptz,unique(workspace_id,id),unique(workspace_id,request_id),unique(workspace_id,number,revision),foreign key(workspace_id,customer_id) references public.quolyn_customers(workspace_id,id),foreign key(workspace_id,enquiry_id) references public.quolyn_enquiries(workspace_id,id),foreign key(workspace_id,parent_id) references public.quolyn_quotes(workspace_id,id));
create table public.quolyn_quote_lines(id uuid primary key default gen_random_uuid(),workspace_id uuid not null,quote_id uuid not null,product_id uuid,enquiry_line_id uuid,position int not null,description text not null,quantity numeric,unit text,price_unit text,price_minor bigint,discount_bps int,tax_bps int,reviewed boolean not null default false,included boolean not null default true,data jsonb not null,foreign key(workspace_id,quote_id) references public.quolyn_quotes(workspace_id,id),foreign key(workspace_id,product_id) references public.quolyn_products(workspace_id,id),foreign key(workspace_id,enquiry_line_id) references public.quolyn_enquiry_lines(workspace_id,id));
create table public.quolyn_quote_documents(id uuid primary key default gen_random_uuid(),workspace_id uuid not null,quote_id uuid not null,quote_version int not null,path text not null,created_at timestamptz not null default now(),foreign key(workspace_id,quote_id) references public.quolyn_quotes(workspace_id,id));
create table public.quolyn_activity_logs(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.quolyn_workspaces,actor_id uuid references auth.users,entity_id uuid,event text not null,details jsonb not null default '{}',created_at timestamptz not null default now());
create table quolyn_private.analysis_limits(workspace_id uuid not null,user_id uuid not null,hour timestamptz not null,count int not null,primary key(workspace_id,user_id,hour));
alter table quolyn_private.analysis_limits enable row level security;

create function quolyn_private.immutable_workspace() returns trigger language plpgsql set search_path='' as $$ begin if new.workspace_id<>old.workspace_id then raise exception 'Workspace reassignment denied'; end if; return new; end $$;
create function quolyn_private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$ declare r jsonb; begin r:=case when TG_OP='DELETE' then to_jsonb(old) else to_jsonb(new) end; insert into public.quolyn_activity_logs(workspace_id,actor_id,entity_id,event) values((r->>'workspace_id')::uuid,auth.uid(),(r->>'id')::uuid,TG_TABLE_NAME||'.'||lower(TG_OP)); return coalesce(new,old); end $$;

do $$ declare t text; begin
foreach t in array array['quolyn_profiles','quolyn_workspaces','quolyn_workspace_members','quolyn_products','quolyn_product_aliases','quolyn_customers','quolyn_catalogue_imports','quolyn_enquiries','quolyn_enquiry_lines','quolyn_match_candidates','quolyn_quote_counters','quolyn_quotes','quolyn_quote_lines','quolyn_quote_documents','quolyn_activity_logs'] loop
execute format('alter table public.%I enable row level security',t);
execute format('revoke all on public.%I from anon,authenticated',t);
end loop;
foreach t in array array['quolyn_products','quolyn_product_aliases','quolyn_customers','quolyn_catalogue_imports','quolyn_enquiries','quolyn_enquiry_lines','quolyn_match_candidates','quolyn_quotes','quolyn_quote_lines','quolyn_quote_documents','quolyn_activity_logs'] loop
execute format('grant select on public.%I to authenticated',t);
execute format('create policy member_read on public.%I for select to authenticated using(quolyn_private.member(workspace_id))',t);
execute format('create trigger immutable_workspace before update on public.%I for each row execute function quolyn_private.immutable_workspace()',t);
execute format('create index on public.%I(workspace_id)',t);
end loop;
foreach t in array array['quolyn_products','quolyn_product_aliases','quolyn_customers','quolyn_catalogue_imports','quolyn_enquiries','quolyn_enquiry_lines'] loop
execute format('grant insert,update on public.%I to authenticated',t);
execute format('create policy member_insert on public.%I for insert to authenticated with check(quolyn_private.member(workspace_id))',t);
execute format('create policy member_update on public.%I for update to authenticated using(quolyn_private.member(workspace_id)) with check(quolyn_private.member(workspace_id))',t);
execute format('create trigger audit_change after insert or update or delete on public.%I for each row execute function quolyn_private.audit_change()',t);
end loop;
end $$;
grant delete on public.quolyn_enquiry_lines,public.quolyn_product_aliases to authenticated;
create policy member_delete on public.quolyn_enquiry_lines for delete to authenticated using(quolyn_private.member(workspace_id));
create policy member_delete on public.quolyn_product_aliases for delete to authenticated using(quolyn_private.member(workspace_id));
grant select on public.quolyn_workspaces,public.quolyn_workspace_members,public.quolyn_profiles to authenticated;
grant update(name,address,currency,tax_bps,validity_days,quote_prefix,discount_warning_bps,margin_warning_bps,terms,logo_path) on public.quolyn_workspaces to authenticated;
create policy workspace_read on public.quolyn_workspaces for select to authenticated using(quolyn_private.member(id));
create policy workspace_update on public.quolyn_workspaces for update to authenticated using(quolyn_private.owner(id)) with check(quolyn_private.owner(id));
create policy member_read on public.quolyn_workspace_members for select to authenticated using(quolyn_private.member(workspace_id));
create policy profile_read on public.quolyn_profiles for select to authenticated using(id=(select auth.uid()));

create function quolyn_private.create_workspace(p_name text) returns uuid language plpgsql security definer set search_path='' as $$ declare w uuid; begin
if auth.uid() is null then raise exception 'Authentication required'; end if;
perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
select workspace_id into w from public.quolyn_workspace_members where user_id=auth.uid() limit 1;
if w is not null then return w; end if;
insert into public.quolyn_profiles(id) values(auth.uid()) on conflict do nothing;
insert into public.quolyn_workspaces(name) values(p_name) returning id into w;
insert into public.quolyn_workspace_members values(w,auth.uid(),'owner');
insert into public.quolyn_quote_counters(workspace_id) values(w); return w; end $$;
create function public.create_workspace(p_name text) returns uuid language sql security invoker set search_path='' as $$ select quolyn_private.create_workspace(p_name); $$;

create function public.search_products(w uuid,q text) returns setof public.quolyn_products language sql stable security invoker set search_path='' as $$
select p.* from public.quolyn_products p where p.workspace_id=w and (q='' or p.sku ilike q or p.manufacturer_code ilike q or exists(select 1 from public.quolyn_product_aliases a where a.product_id=p.id and a.workspace_id=w and a.alias ilike '%'||q||'%') or to_tsvector('simple',coalesce(p.sku,'')||' '||p.name||' '||p.description) @@ plainto_tsquery('simple',q) or p.name ilike '%'||q||'%' or extensions.similarity(p.name,q)>0.12)
order by case when lower(p.sku)=lower(q) then 0 when lower(p.manufacturer_code)=lower(q) then 1 when exists(select 1 from public.quolyn_product_aliases a where a.product_id=p.id and lower(a.alias)=lower(q)) then 2 else 3 end, extensions.similarity(p.name,q) desc limit 5; $$;

create function quolyn_private.convert_qty(q numeric, f text, t text) returns numeric language plpgsql immutable set search_path='' as $$ begin
if f=t then return q; elsif f='ft2' and t='m2' then return q*0.09290304; elsif f='m2' and t='ft2' then return q/0.09290304; else raise exception 'Missing conversion: % to %',f,t; end if; end $$;

create function quolyn_private.save_quote(w uuid,p jsonb) returns uuid language plpgsql security definer set search_path='' as $$
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
qid:=nullif(p->>'id','')::uuid;
if qid is null then select id into qid from public.quolyn_quotes where workspace_id=w and request_id=req; if qid is not null then return qid; end if; end if;
if qid is not null then
select * into oldq from public.quolyn_quotes where id=qid and workspace_id=w for update;
if oldq.id is null then raise exception 'Quote not found'; end if;
if oldq.version<>(p->>'version')::int then raise exception 'Conflicting edit: reload the quote'; end if;
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
if cust.id is null or cust.name='' or cust.address='' then errors:=errors||jsonb_build_array('Customer name and billing address required'); end if;
if ws.name='' or ws.address='' then errors:=errors||jsonb_build_array('Distributor name and address required'); end if;
if cust.id is not null and cust.currency<>ws.currency then errors:=errors||jsonb_build_array('Customer currency mismatch'); end if;
for l in select value from jsonb_array_elements(p->'lines') loop
pos:=pos+1; prod:=null; qty:=null; bill:=null; packs:=null; delivered:=null; line_total:=null; margin:=null; problems:='[]';
included:=coalesce((l->>'included')::boolean,true); reviewed:=coalesce((l->>'reviewed')::boolean,false);
if nullif(l->>'product_id','') is not null then select * into prod from public.quolyn_products where workspace_id=w and id=(l->>'product_id')::uuid; if prod.id is null then raise exception 'Product outside workspace'; end if; end if;
descr:=coalesce(nullif(l->>'description',''),prod.name,'Manual item');
unit:=nullif(l->>'unit',''); pu:=coalesce(prod.price_unit,nullif(l->>'price_unit',''));
price:=coalesce(nullif(l->>'override_minor','')::bigint,prod.price_minor,nullif(l->>'price_minor','')::bigint);
disc:=coalesce(nullif(l->>'discount_bps','')::int,cust.discount_bps,0);
tax:=coalesce(prod.tax_bps,nullif(l->>'tax_bps','')::int);
reason:=coalesce(l->>'override_reason','');
if price<0 or disc not between 0 and 10000 or tax not between 0 and 10000 then raise exception 'Invalid price or rate'; end if;
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
if prod.coverage is not null and prod.coverage_unit is not null and unit<>'box' then packs:=ceil(quolyn_private.convert_qty(qty,unit,prod.coverage_unit)/prod.coverage); delivered:=packs*prod.coverage; end if;
if pu='box' and unit<>'box' then if packs is null then raise exception 'Pack coverage required'; end if; bill:=packs;
elsif l->>'billing'='delivered' then if delivered is null then raise exception 'Delivered coverage unavailable'; end if; bill:=quolyn_private.convert_qty(delivered,prod.coverage_unit,pu);
else bill:=quolyn_private.convert_qty(qty,unit,pu); end if;
gross:=round(bill*price); discount_amount:=round(gross*disc/10000.0); net:=gross-discount_amount; tax_amount:=round(net*tax/10000.0); line_total:=net+tax_amount;
if prod.cost_minor is not null and prod.cost_unit=pu then margin:=net-round(bill*prod.cost_minor); if net>0 and margin*10000.0/net<ws.margin_warning_bps then warns:=warns||jsonb_build_array('Line '||pos||': low or negative margin'); end if; end if;
exception when others then problems:=problems||jsonb_build_array(SQLERRM); line_total:=null;
end;
if disc>ws.discount_warning_bps then warns:=warns||jsonb_build_array('Line '||pos||': discount above threshold'); end if;
if included then
if jsonb_array_length(problems)>0 then errors:=errors||jsonb_build_array(jsonb_build_object('line',pos,'issues',problems)); end if;
if line_total is not null then total:=total+line_total; end if;
end if;
clean:=jsonb_build_object('description',descr,'sku',prod.sku,'quantity',qty::text,'unit',unit,'price_unit',pu,'price_minor',price::text,'discount_bps',disc,'tax_bps',tax,'included',included,'reviewed',reviewed,'requirements_resolved',coalesce((l->>'requirements_resolved')::boolean,false),'packs',packs::text,'delivered',delivered::text,'coverage',prod.coverage::text,'coverage_unit',prod.coverage_unit,'billing',coalesce(l->>'billing','requested'),'billable',bill::text,'net_minor',case when line_total is not null then net::text end,'tax_minor',case when line_total is not null then tax_amount::text end,'total_minor',line_total::text);
insert into public.quolyn_quote_lines(workspace_id,quote_id,product_id,enquiry_line_id,position,description,quantity,unit,price_unit,price_minor,discount_bps,tax_bps,reviewed,included,data) values(w,qid,prod.id,nullif(l->>'enquiry_line_id','')::uuid,pos,descr,qty,unit,pu,price,disc,tax,reviewed,included,clean||jsonb_build_object('product_id',prod.id,'enquiry_line_id',l->>'enquiry_line_id','override_minor',l->>'override_minor','override_reason',reason,'margin_minor',margin::text));
snaps:=snaps||jsonb_build_array(clean);
end loop;
if not exists(select 1 from public.quolyn_quote_lines where quote_id=qid and included) then errors:=errors||jsonb_build_array('At least one included line required'); end if;
stage:=case when oldq.status='ready' or parent is not null then 'needs review' else 'draft' end;
update public.quolyn_quotes set customer_id=c,status=stage,version=case when new_id then 1 else version+1 end,issue_date=coalesce(nullif(p->>'issue_date','')::date,current_date),expiry_date=coalesce(nullif(p->>'expiry_date','')::date,current_date+ws.validity_days),notes=coalesce(p->>'notes',''),terms=coalesce(p->>'terms',ws.terms),validation=jsonb_build_object('errors',errors,'warnings',warns),total_minor=case when errors='[]'::jsonb then total else null end,snapshot=jsonb_build_object('distributor',jsonb_build_object('name',ws.name,'address',ws.address,'logo_path',ws.logo_path),'customer',jsonb_build_object('name',cust.name,'address',cust.address,'contact_name',cust.contact_name,'email',cust.email,'tax_reference',cust.tax_reference,'payment_terms',cust.payment_terms),'lines',snaps,'currency',ws.currency),updated_at=now() where id=qid;
insert into public.quolyn_activity_logs(workspace_id,actor_id,entity_id,event,details) values(w,auth.uid(),qid,'quote.saved',jsonb_build_object('lines',pos,'unresolved',jsonb_array_length(errors),'revision',rev));
return qid;
end $$;
create function public.save_quote(w uuid,p jsonb) returns uuid language sql security invoker set search_path='' as $$ select quolyn_private.save_quote(w,p); $$;
create function quolyn_private.transition_quote(w uuid,q uuid,v int,target text) returns void language plpgsql security definer set search_path='' as $$ declare r public.quolyn_quotes; begin
if not quolyn_private.member(w) then raise exception 'Access denied'; end if;
select * into r from public.quolyn_quotes where id=q and workspace_id=w for update;
if r.id is null or r.version<>v then raise exception 'Conflicting edit: reload'; end if;
if not ((r.status in('draft','needs review') and target='ready') or (r.status='ready' and target in('sent','needs review','expired')) or (r.status='sent' and target in('accepted','rejected','expired'))) then raise exception 'Invalid status transition'; end if;
if target in('ready','sent') and (r.validation->'errors'<>'[]'::jsonb or r.total_minor is null) then raise exception 'Resolve all review blockers'; end if;
if target='ready' and (r.expiry_date is null or r.expiry_date<r.issue_date or r.expiry_date<current_date) then raise exception 'Check issue and expiry dates'; end if;
update public.quolyn_quotes set status=target,version=version+1,updated_at=now(),sent_at=case when target='sent' then now() else sent_at end,accepted_at=case when target='accepted' then now() else accepted_at end,rejected_at=case when target='rejected' then now() else rejected_at end where id=q;
insert into public.quolyn_activity_logs(workspace_id,actor_id,entity_id,event) values(w,auth.uid(),q,'quote.'||target);
end $$;
create function public.transition_quote(w uuid,q uuid,v int,target text) returns void language sql security invoker set search_path='' as $$ select quolyn_private.transition_quote(w,q,v,target); $$;

create function quolyn_private.analysis_limit(w uuid) returns void language plpgsql security definer set search_path='' as $$ declare c int; begin
if not quolyn_private.member(w) then raise exception 'Access denied'; end if;
insert into quolyn_private.analysis_limits values(w,auth.uid(),date_trunc('hour',now()),1) on conflict(workspace_id,user_id,hour) do update set count=analysis_limits.count+1 returning count into c;
if c>30 then raise exception 'Analysis limit reached (30/hour)'; end if;
if (select sum(count) from quolyn_private.analysis_limits where workspace_id=w and hour=date_trunc('hour',now()))>150 then raise exception 'Workspace analysis limit reached'; end if;
end $$;
create function public.analysis_limit(w uuid) returns void language sql security invoker set search_path='' as $$ select quolyn_private.analysis_limit(w); $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('catalogue-imports','catalogue-imports',false,10485760,array['text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/octet-stream']),
('quote-documents','quote-documents',false,10485760,array['application/pdf','text/csv']),
('workspace-assets','workspace-assets',false,2097152,array['image/png','image/jpeg']) on conflict(id) do nothing;
create policy quolyn_storage_read on storage.objects for select to authenticated using(bucket_id in('catalogue-imports','quote-documents','workspace-assets') and quolyn_private.member((storage.foldername(name))[1]::uuid));
create policy quolyn_storage_insert on storage.objects for insert to authenticated with check((bucket_id in('catalogue-imports','quote-documents') and quolyn_private.member((storage.foldername(name))[1]::uuid)) or (bucket_id='workspace-assets' and quolyn_private.owner((storage.foldername(name))[1]::uuid)));

revoke all on all functions in schema quolyn_private from public,anon,authenticated;
grant execute on function quolyn_private.member(uuid),quolyn_private.owner(uuid),quolyn_private.create_workspace(text),quolyn_private.save_quote(uuid,jsonb),quolyn_private.transition_quote(uuid,uuid,int,text),quolyn_private.analysis_limit(uuid) to authenticated;
revoke all on function public.create_workspace(text),public.save_quote(uuid,jsonb),public.transition_quote(uuid,uuid,int,text),public.search_products(uuid,text),public.analysis_limit(uuid) from public,anon;
grant execute on function public.create_workspace(text),public.save_quote(uuid,jsonb),public.transition_quote(uuid,uuid,int,text),public.search_products(uuid,text),public.analysis_limit(uuid) to authenticated;
