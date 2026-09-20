<script setup lang="ts">
const name=ref(''),{error,busy,run}=useAction(),db=useDb()
async function create(){await run(async()=>{check(await db.rpc('create_workspace',{p_name:name.value}));useWorkspace().value=null;await navigateTo('/')})}
</script>
<template><div class="narrow panel"><div class="eyebrow">LET’S GET YOU SET UP</div><h1>Your business, your workspace.</h1><p class="muted">Create a private space for your catalogue, enquiries and quotations.</p><form @submit.prevent="create"><label>Business name<input v-model="name" required maxlength="160" placeholder="Your distributor business"></label><p class="error" role="alert">{{error}}</p><button class="primary" :disabled="busy">Create workspace →</button></form></div></template>
