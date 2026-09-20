create function quolyn_private.product_limit() returns trigger language plpgsql security definer set search_path='' as $$ begin
perform pg_advisory_xact_lock(hashtextextended(new.workspace_id::text,1));
if (select count(*) from public.quolyn_products where workspace_id=new.workspace_id)>=10000 then raise exception 'Workspace limit is 10000 products'; end if;
new.updated_at:=now(); return new; end $$;
create trigger product_limit before insert on public.quolyn_products for each row execute function quolyn_private.product_limit();
create function quolyn_private.touch_product() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at:=now(); return new; end $$;
create trigger product_timestamp before update on public.quolyn_products for each row execute function quolyn_private.touch_product();
create function quolyn_private.store_analysis(w uuid,e uuid,result jsonb,replace_reviewed boolean) returns void language plpgsql security definer set search_path='' as $$ declare l jsonb; pos int:=0; begin
if not quolyn_private.member(w) then raise exception 'Access denied'; end if;
perform 1 from public.quolyn_enquiries where id=e and workspace_id=w for update;
if not found then raise exception 'Enquiry not found'; end if;
if exists(select 1 from public.quolyn_enquiry_lines where enquiry_id=e and (state in('confirmed','excluded') or corrections>0)) and not replace_reviewed then raise exception 'Reanalysis would replace reviewed work. Confirm explicitly.'; end if;
if jsonb_array_length(result->'lines')>60 then raise exception 'Maximum 60 extracted lines'; end if;
-- Quoted lines cannot be removed; create another enquiry instead.
delete from public.quolyn_enquiry_lines where enquiry_id=e and workspace_id=w;
for l in select value from jsonb_array_elements(result->'lines') loop
pos:=pos+1;
insert into public.quolyn_enquiry_lines(workspace_id,enquiry_id,position,original_text,description,quantity,unit,brand,sku,requirements,missing,delivery,state) values(w,e,pos,l->>'original_text',l->>'description',nullif(l->>'quantity','')::numeric,l->>'unit',l->>'brand',l->>'sku',coalesce(l->'requirements','{}'),coalesce(l->'missing','[]'),l->>'delivery','needs clarification');
end loop;
update public.quolyn_enquiries set analysis_notes=result->'notes' where id=e;
insert into public.quolyn_activity_logs(workspace_id,actor_id,entity_id,event,details) values(w,auth.uid(),e,'enquiry.analysis',jsonb_build_object('line_count',pos));
end $$;
create function public.store_analysis(w uuid,e uuid,result jsonb,replace_reviewed boolean default false) returns void language sql security invoker set search_path='' as $$ select quolyn_private.store_analysis(w,e,result,replace_reviewed); $$;
create function quolyn_private.record_document(w uuid,q uuid,v int,p text) returns void language plpgsql security definer set search_path='' as $$ begin
if not quolyn_private.member(w) or not exists(select 1 from public.quolyn_quotes where workspace_id=w and id=q and version=v) then raise exception 'Access denied or quote changed'; end if;
if p not like w::text||'/'||q::text||'/%' or not exists(select 1 from storage.objects where bucket_id='quote-documents' and name=p) then raise exception 'Invalid document path'; end if;
insert into public.quolyn_quote_documents(workspace_id,quote_id,quote_version,path) values(w,q,v,p);
insert into public.quolyn_activity_logs(workspace_id,actor_id,entity_id,event) values(w,auth.uid(),q,'document.generated');
end $$;
create function public.record_document(w uuid,q uuid,v int,p text) returns void language sql security invoker set search_path='' as $$ select quolyn_private.record_document(w,q,v,p); $$;
revoke all on function quolyn_private.product_limit(),quolyn_private.touch_product(),quolyn_private.store_analysis(uuid,uuid,jsonb,boolean),quolyn_private.record_document(uuid,uuid,int,text) from public,anon,authenticated;
grant execute on function quolyn_private.store_analysis(uuid,uuid,jsonb,boolean),quolyn_private.record_document(uuid,uuid,int,text) to authenticated;
revoke all on function public.store_analysis(uuid,uuid,jsonb,boolean),public.record_document(uuid,uuid,int,text) from public,anon;
grant execute on function public.store_analysis(uuid,uuid,jsonb,boolean),public.record_document(uuid,uuid,int,text) to authenticated;
