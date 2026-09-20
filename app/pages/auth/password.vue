<script setup lang="ts">
definePageMeta({layout:'auth'});const password=ref(''),{error,busy,run}=useAction(),db=useDb()
async function save(){await run(async()=>{check(await db.auth.updateUser({password:password.value}));await navigateTo('/')})}
</script>
<template><form class="auth-card" @submit.prevent="save"><h1>Choose a new password</h1><label>New password<input v-model="password" type="password" minlength="10" required></label><p class="error" role="alert">{{error}}</p><button class="primary" :disabled="busy">Update password</button></form></template>
