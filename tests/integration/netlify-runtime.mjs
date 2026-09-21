// Run after NITRO_PRESET=netlify npm run build. No .env is loaded at runtime.
import assert from 'node:assert/strict'
delete process.env.NUXT_PUBLIC_SUPABASE_URL
delete process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const { default: handler } = await import('../../.netlify/functions-internal/server/main.mjs')
const origin = 'https://quolyn.netlify.app'
async function request(path, options = {}) {
  return handler(new Request(origin + path, { ...options, headers: { host: 'quolyn.netlify.app', ...options.headers } }))
}
for (const [path, location] of [['/', '/auth/login'], ['/setup', '/auth/login'], ['/quotes', '/auth/login']]) {
  const response = await request(path)
  assert.equal(response.status, 302, path)
  assert.equal(response.headers.get('location'), location, path)
  console.log('PASS', path, 'redirects to', location)
}
const login = await request('/auth/login')
assert.equal(login.status, 200)
const html = await login.text()
assert(html.includes('Welcome back.'))
const url = html.match(/supabaseUrl:"([^"]+)"/)?.[1]
const key = html.match(/supabasePublishableKey:"([^"]+)"/)?.[1]
assert.equal(url, 'https://ahctcbpvbrdeoqrtwvva.supabase.co')
assert(key?.startsWith('sb_publishable_'))
assert(!html.includes('sb_secret_'))
console.log('PASS server and browser configuration survive without runtime environment variables')
const auth = await fetch(url + '/auth/v1/settings', { headers: { apikey: key } })
assert.equal(auth.status, 200)
console.log('PASS deployed public configuration connects to Supabase Auth')
const blocked = await request('/api/quotes/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: crypto.randomUUID(), version: 1, format: 'pdf' }) })
assert.equal(blocked.status, 401)
console.log('PASS protected export still rejects anonymous access')
