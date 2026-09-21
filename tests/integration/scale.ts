import {createClient} from '@supabase/supabase-js'
import {readFileSync,writeFileSync} from 'node:fs'
import {randomBytes,randomUUID} from 'node:crypto'
import assert from 'node:assert/strict'
const c=JSON.parse(readFileSync('/tmp/quolyn-local-status.json','utf8'))
assert.match(c.API_URL,/^http:\/\/(127\.0\.0\.1|localhost):/,'Scale test must use local Supabase')
const admin=createClient(c.API_URL,c.SERVICE_ROLE_KEY,{auth:{persistSession:false}}),client=createClient(c.API_URL,c.ANON_KEY,{auth:{persistSession:false}})
const email=`quolyn-scale-${randomUUID()}@example.invalid`,password=randomBytes(32).toString('base64url')
function ok(r:any){if(r.error)throw r.error;return r.data}
const user=ok(await admin.auth.admin.createUser({email,password,email_confirm:true})).user
ok(await client.auth.signInWithPassword({email,password}))
const w=ok(await client.rpc('create_workspace',{p_name:'Temporary 10,000-product scale test'})),started=performance.now()
for(let offset=0;offset<10000;offset+=50){ok(await client.from('quolyn_products').insert(Array.from({length:50},(_,i)=>({workspace_id:w,sku:'SCALE-'+String(offset+i).padStart(5,'0'),name:`Fictional grey tile ${offset+i}`,price_unit:'m2',selling_unit:'m2',price_minor:10000+offset+i,tax_bps:1800,currency:'INR',source:'automated-local-scale-test'}))))}
const insertedMs=performance.now()-started
assert.equal((await client.from('quolyn_products').select('id',{count:'exact',head:true}).eq('workspace_id',w)).count,10000)
assert((await client.from('quolyn_products').insert({workspace_id:w,sku:'OVER-LIMIT',name:'Must be rejected'})).error)
const existing=ok(await client.from('quolyn_products').select('*').eq('workspace_id',w).eq('sku','SCALE-00000').single())
ok(await client.from('quolyn_products').upsert({...existing,name:'Updated at capacity'}))
const before=performance.now(),page=ok(await client.rpc('catalogue_page',{w,q:'grey tile',page_number:100}));const searchMs=performance.now()-before
assert.equal(page.count,9999);assert.equal(page.rows.length,50)
ok(await client.from('quolyn_product_aliases').insert({workspace_id:w,product_id:existing.id,alias:'scale-alias-verification'}))
assert.equal(ok(await client.rpc('catalogue_page',{w,q:'scale-alias-verification'})).rows[0].id,existing.id)
const matched=ok(await client.rpc('search_products',{w,q:'SCALE-00000'}));assert.equal(matched[0].id,existing.id)
const report={environment:'local Supabase, ordinary authenticated HTTP client',products:10000,batchSize:50,insertSeconds:Number((insertedMs/1000).toFixed(2)),paginatedSearchMs:Number(searchMs.toFixed(1)),capacityRejection:true,updateAtCapacity:true,aliasSearch:true,exactSkuMatch:true,measuredAt:new Date().toISOString()}
writeFileSync('artifacts/scale-results.json',JSON.stringify(report,null,2));console.log(report)
// Remove only the temporary fixture workspace created above.
for(const table of ['product_aliases','products','activity_logs','quote_counters','workspace_members'])ok(await admin.from('quolyn_'+table).delete().eq('workspace_id',w))
ok(await admin.from('quolyn_workspaces').delete().eq('id',w));ok(await admin.auth.admin.deleteUser(user.id))
