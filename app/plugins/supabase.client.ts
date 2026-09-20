import { createBrowserClient } from '@supabase/ssr'
export default defineNuxtPlugin(() => {
  const c = useRuntimeConfig().public
  return { provide: { supabase: c.supabaseUrl && c.supabasePublishableKey ? createBrowserClient(c.supabaseUrl, c.supabasePublishableKey) : null } }
})
