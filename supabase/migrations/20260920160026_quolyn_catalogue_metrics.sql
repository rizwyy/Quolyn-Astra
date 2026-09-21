create function public.catalogue_page(w uuid,q text default '',category_filter text default '',brand_filter text default '',active_filter text default 'all',page_number int default 0) returns jsonb language sql stable security invoker set search_path='' as $$
with matched as (
 select p.* from public.quolyn_products p where p.workspace_id=w
 and (q='' or p.sku ilike '%'||q||'%' or p.name ilike '%'||q||'%' or p.description ilike '%'||q||'%' or p.manufacturer_code ilike '%'||q||'%' or exists(select 1 from public.quolyn_product_aliases a where a.product_id=p.id and a.workspace_id=w and a.alias ilike '%'||q||'%'))
 and (category_filter='' or p.category ilike '%'||category_filter||'%') and (brand_filter='' or p.brand ilike '%'||brand_filter||'%')
 and (active_filter='all' or p.active=(active_filter='active'))
), paged as (select * from matched order by name,id limit 50 offset greatest(0,least(page_number,200))*50)
select jsonb_build_object('rows',coalesce((select jsonb_agg(paged) from paged),'[]'::jsonb),'count',(select count(*) from matched)); $$;
create function public.dashboard_metrics(w uuid) returns jsonb language sql stable security invoker set search_path='' as $$
select jsonb_build_object(
'new_enquiries',(select count(*) from public.quolyn_enquiries where workspace_id=w and created_at>=now()-interval '7 days'),
'review_enquiries',(select count(*) from public.quolyn_enquiries e where workspace_id=w and (not exists(select 1 from public.quolyn_enquiry_lines l where l.enquiry_id=e.id) or exists(select 1 from public.quolyn_enquiry_lines l where l.enquiry_id=e.id and l.state not in('confirmed','excluded')))),
'draft_quotes',(select count(*) from public.quolyn_quotes where workspace_id=w and status='draft'),
'review_quotes',(select count(*) from public.quolyn_quotes where workspace_id=w and status='needs review'),
'ready_quotes',(select count(*) from public.quolyn_quotes where workspace_id=w and status='ready'),
'unresolved',(select count(*) from public.quolyn_enquiry_lines where workspace_id=w and state not in('confirmed','excluded'))); $$;
revoke all on function public.catalogue_page(uuid,text,text,text,text,int),public.dashboard_metrics(uuid) from public,anon;
grant execute on function public.catalogue_page(uuid,text,text,text,text,int),public.dashboard_metrics(uuid) to authenticated;
