import { createServerClient } from '@supabase/ssr'
import type { H3Event } from 'h3'
export function serverDb(event: H3Event) {
  const c=useRuntimeConfig(event).public
  if(!c.supabaseUrl || !c.supabasePublishableKey) throw createError({statusCode:503,message:'Supabase is not configured'})
  setHeader(event,'Cache-Control','private, no-store')
  return createServerClient(c.supabaseUrl,c.supabasePublishableKey,{cookies:{getAll:()=>Object.entries(parseCookies(event)).map(([name,value])=>({name,value:value??''})),setAll: cookies=>cookies.forEach(({name,value,options})=>setCookie(event,name,value,options))}})
}
export async function authenticatedDb(event: H3Event) { const db=serverDb(event); const {data,error}=await db.auth.getUser(); if(error || !data.user) throw createError({statusCode:401,message:'Sign in required'}); return db }
