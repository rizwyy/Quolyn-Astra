// One-time maintenance for this development stack after MCP assigns migration timestamps.
import {readFileSync,readdirSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
const files=readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort()
const commands=files.map(file=>{const [version,...rest]=file.slice(0,-4).split('_');const name=rest.join('_');return `insert into supabase_migrations.schema_migrations(version,name,statements) values('${version}','${name}',ARRAY[$quolyn_migration$${readFileSync('supabase/migrations/'+file,'utf8')}$quolyn_migration$]) on conflict(version) do nothing;`})
commands.unshift("delete from supabase_migrations.schema_migrations where version in ('20260920013141','20260920020713','20260921035842','20260921040411');")
execFileSync('docker',['exec','-i','supabase_db_Quolyn-Astra','psql','-U','postgres','-v','ON_ERROR_STOP=1'],{input:commands.join('\n'),stdio:['pipe','ignore','inherit']})
console.log('Local migration history aligned with the applied files.')
