export default defineNuxtRouteMiddleware(async to => {
  if (to.path.startsWith('/auth') || to.path==='/setup') return
  const db=useNuxtApp().$supabase
  if (!db) return navigateTo('/setup')
  const {data,error}=await db.auth.getUser()
  if(error || !data.user) return navigateTo('/auth/login')
  const w=useWorkspace()
  if(!w.value) { const r=await db.from('quolyn_workspaces').select('*').limit(1).maybeSingle(); if(r.error) throw createError({statusCode:500,message:r.error.message}); w.value=r.data }
  if(!w.value && to.path!=='/onboarding') return navigateTo('/onboarding')
})
