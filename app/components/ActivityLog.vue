<script setup lang="ts">
const props=defineProps<{entityId?:string}>(),db=useDb(),w=useWorkspace()
const {data,error}=await useAsyncData('activity-'+(props.entityId||'all'),async()=>{let q=db.from('quolyn_activity_logs').select('id,event,created_at').eq('workspace_id',w.value!.id).order('created_at',{ascending:false}).limit(props.entityId?12:6);if(props.entityId)q=q.eq('entity_id',props.entityId);return check(await q)})
</script>
<template><div><h3>Recent activity</h3><p v-if="error" class="error">Could not load activity.</p><ul v-else-if="data?.length" class="activity"><li v-for="a in data" :key="a.id">{{a.event.replace('quolyn_','').replaceAll('.',' · ').replaceAll('_',' ')}}<time>{{new Date(a.created_at).toLocaleString()}}</time></li></ul><p v-else class="muted">Your workspace activity will appear here.</p></div></template>
