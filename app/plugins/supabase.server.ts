import { createServerClient } from '@supabase/ssr'
import { parseCookies, setCookie, setHeader } from 'h3'
export default defineNuxtPlugin(() => {
  const c = useRuntimeConfig().public, event = useRequestEvent()!
  const supabase = c.supabaseUrl && c.supabasePublishableKey ? createServerClient(c.supabaseUrl, c.supabasePublishableKey, { cookies: {
    getAll: () => Object.entries(parseCookies(event)).map(([name,value]) => ({ name, value: value ?? '' })),
    setAll: cookies => { cookies.forEach(({name,value,options}) => setCookie(event,name,value,options)); setHeader(event,'Cache-Control','private, no-store') }
  } }) : null
  return { provide: { supabase } }
})
