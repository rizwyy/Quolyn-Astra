import {createClient} from '@supabase/supabase-js'
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs'
import {randomUUID,randomBytes} from 'node:crypto'
const config=JSON.parse(readFileSync('/tmp/quolyn-local-status.json','utf8'))
if(!/^http:\/\/(127\.0\.0\.1|localhost):/.test(config.API_URL))throw new Error('Fixture administrator is restricted to the local Supabase stack')
const db=createClient(config.API_URL,config.SERVICE_ROLE_KEY,{auth:{persistSession:false}})
const path='/tmp/quolyn-local-test-accounts.json'
const fixtures=existsSync(path)?JSON.parse(readFileSync(path,'utf8')):{password:randomBytes(32).toString('base64url'),users:Array.from({length:2},()=>({id:'',email:`quolyn-local-${randomUUID()}@example.invalid`}))}
for(const user of fixtures.users){const r=await db.auth.admin.createUser({email:user.email,password:fixtures.password,email_confirm:true});if(r.error&&!r.error.message.includes('already'))throw r.error;if(r.data.user)user.id=r.data.user.id}
writeFileSync(path,JSON.stringify(fixtures),{mode:0o600});mkdirSync('artifacts',{recursive:true})
writeFileSync('artifacts/.env.local-tests',`TEST_FIXTURES=${path}\nTEST_SUPABASE_URL=${config.API_URL}\nTEST_SUPABASE_ANON_KEY=${config.ANON_KEY}\nNUXT_PUBLIC_SUPABASE_URL=${config.API_URL}\nNUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${config.ANON_KEY}\n`,{mode:0o600})
console.log('Local test users and environment prepared. No credentials printed.')
