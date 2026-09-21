-- Exact identifiers outrank aliases, then keyword matches, then fuzzy text.
create or replace function public.search_products(w uuid,q text) returns setof public.quolyn_products language sql stable security invoker set search_path='' as $$
select p.* from public.quolyn_products p where p.workspace_id=w and length(q)<=1000 and (q='' or lower(p.sku)=lower(q) or lower(p.manufacturer_code)=lower(q) or exists(select 1 from public.quolyn_product_aliases a where a.product_id=p.id and a.workspace_id=w and a.alias ilike '%'||q||'%') or to_tsvector('simple',coalesce(p.sku,'')||' '||p.name||' '||p.description) @@ plainto_tsquery('simple',q) or p.name ilike '%'||q||'%' or extensions.similarity(p.name,q)>0.12)
order by case when lower(p.sku)=lower(q) then 0 when lower(p.manufacturer_code)=lower(q) then 1 when exists(select 1 from public.quolyn_product_aliases a where a.product_id=p.id and a.workspace_id=w and lower(a.alias)=lower(q)) then 2 when to_tsvector('simple',coalesce(p.sku,'')||' '||p.name||' '||p.description) @@ plainto_tsquery('simple',q) then 3 else 4 end,extensions.similarity(p.name,q) desc,p.id limit 5; $$;
create or replace function quolyn_private.suggest_products(w uuid,l uuid,q text) returns setof public.quolyn_products language plpgsql security definer set search_path='' as $$ declare p public.quolyn_products; reason text; label text; begin
if not quolyn_private.member(w) or not exists(select 1 from public.quolyn_enquiry_lines where id=l and workspace_id=w) then raise exception 'Access denied';end if;
if length(q)>1000 then raise exception 'Search too long';end if;
delete from public.quolyn_match_candidates where line_id=l and workspace_id=w;
for p in select * from public.search_products(w,q) loop
if lower(p.sku)=lower(q) then reason:='Exact SKU';label:='Strong match';
elsif lower(p.manufacturer_code)=lower(q) then reason:='Exact manufacturer code';label:='Strong match';
elsif exists(select 1 from public.quolyn_product_aliases a where a.workspace_id=w and a.product_id=p.id and lower(a.alias)=lower(q)) then reason:='Catalogue alias';label:='Possible match';
elsif to_tsvector('simple',coalesce(p.sku,'')||' '||p.name||' '||p.description) @@ plainto_tsquery('simple',q) then reason:='Catalogue keyword match';label:='Possible match';
else reason:='Fuzzy text similarity; confirm product identity';label:=case when extensions.similarity(p.name,q)>=0.3 then 'Possible match' else 'Weak match' end;end if;
insert into public.quolyn_match_candidates(workspace_id,line_id,product_id,reasons,strength) values(w,l,p.id,jsonb_build_array(reason,'Specification checks are separate; unknown attributes are not confirmed'),label);return next p;
end loop;return;end $$;
create or replace function quolyn_private.analysis_limit(w uuid) returns void language plpgsql security definer set search_path='' as $$ declare c int; begin
if not quolyn_private.member(w) then raise exception 'Access denied';end if;
-- Serialize the workspace total as well as each user's counter.
perform pg_advisory_xact_lock(hashtextextended('analysis:'||w::text,0));
insert into quolyn_private.analysis_limits values(w,auth.uid(),date_trunc('hour',now()),1) on conflict(workspace_id,user_id,hour) do update set count=analysis_limits.count+1 returning count into c;
if c>30 then raise exception 'Analysis limit reached (30/hour)';end if;
if (select sum(count) from quolyn_private.analysis_limits where workspace_id=w and hour=date_trunc('hour',now()))>150 then raise exception 'Workspace analysis limit reached';end if;
end $$;
