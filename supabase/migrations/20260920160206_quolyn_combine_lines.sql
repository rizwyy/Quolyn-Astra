create function quolyn_private.combine_lines(w uuid,target_id uuid,source_id uuid) returns void language plpgsql security definer set search_path='' as $$ declare a public.quolyn_enquiry_lines;b public.quolyn_enquiry_lines; begin
if not quolyn_private.member(w) or target_id=source_id then raise exception 'Invalid selection'; end if;
perform 1 from public.quolyn_enquiry_lines where workspace_id=w and id in(target_id,source_id) order by id for update;
select * into a from public.quolyn_enquiry_lines where workspace_id=w and id=target_id;
select * into b from public.quolyn_enquiry_lines where workspace_id=w and id=source_id;
if a.id is null or b.id is null or a.enquiry_id<>b.enquiry_id or a.description<>b.description or a.unit is distinct from b.unit or a.quantity is null or b.quantity is null then raise exception 'Only duplicate descriptions with known quantities and identical units can combine'; end if;
update public.quolyn_enquiry_lines set quantity=a.quantity+b.quantity,state='needs clarification',missing='["Combined quantity requires review"]',corrections=corrections+1 where id=target_id;
delete from public.quolyn_enquiry_lines where id=source_id;
end $$;
create function public.combine_lines(w uuid,target_id uuid,source_id uuid) returns void language sql security invoker set search_path='' as $$ select quolyn_private.combine_lines(w,target_id,source_id); $$;
revoke all on function public.combine_lines(uuid,uuid,uuid),quolyn_private.combine_lines(uuid,uuid,uuid) from public,anon;
grant execute on function public.combine_lines(uuid,uuid,uuid),quolyn_private.combine_lines(uuid,uuid,uuid) to authenticated;
