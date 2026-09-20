<script setup lang="ts">
definePageMeta({layout:'auth'})
const db=useNuxtApp().$supabase, route=useRoute(), email=ref(''), password=ref(''), mode=ref('login')
const {error,busy,notice,run}=useAction(),hydrated=ref(false)
onMounted(()=>{hydrated.value=true})
async function submit(){await run(async()=>{
 if(!db) throw new Error('Supabase is not configured. See the setup guide.')
 const base=window.location.origin
 if(mode.value==='login'){check(await db.auth.signInWithPassword({email:email.value,password:password.value}));await navigateTo('/')}
 else if(mode.value==='register'){const r=check(await db.auth.signUp({email:email.value,password:password.value,options:{emailRedirectTo:base+'/api/auth/callback'}}));if(r.session) await navigateTo('/');else notice.value='Check your email to confirm your account.'}
 else {check(await db.auth.resetPasswordForEmail(email.value,{redirectTo:base+'/api/auth/callback?next=recovery'}));notice.value='If an account exists, a recovery link will arrive by email.'}
})}
</script>
<template><div class="auth-card"><div class="eyebrow">YOUR QUOTATION WORKSPACE</div><h1>{{ mode==='login'?'Welcome back.':mode==='register'?'Start your workspace.':'Reset your password.' }}</h1><p class="muted">From enquiry to accurate quote.</p><form @submit.prevent="submit"><label>Email address<input v-model="email" type="email" required autocomplete="email" placeholder="you@company.com"></label><label v-if="mode!=='recover'">Password<input v-model="password" type="password" required minlength="10" :autocomplete="mode==='register'?'new-password':'current-password'" placeholder="At least 10 characters"></label><p v-if="error || route.query.error" class="alert error" role="alert">{{ error || route.query.error }}</p><p v-if="notice" class="alert success">{{ notice }}</p><button class="primary wide" :disabled="busy||!hydrated">{{ busy?'Please wait…':mode==='login'?'Sign in →':mode==='register'?'Create account →':'Send recovery link' }}</button></form><div class="row between"><button class="link" @click="mode=mode==='login'?'register':'login'">{{ mode==='login'?'Create an account':'Back to sign in' }}</button><button v-if="mode==='login'" class="link" @click="mode='recover'">Forgot password?</button></div><p class="fine">Pilot workspace · Your team reviews every quotation.</p></div></template>
