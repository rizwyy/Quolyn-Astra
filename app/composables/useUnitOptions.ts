export async function useUnitOptions() {
 const db=useDb(),w=useWorkspace()
 const {data}=await useAsyncData('unit-options-'+w.value!.id,async()=>check(await db.from('quolyn_units').select('code').eq('workspace_id',w.value!.id)))
 return computed(()=>['each','box','m2','ft2','lm',...(data.value??[]).map(u=>u.code)])
}
