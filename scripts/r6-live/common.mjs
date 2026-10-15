import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
export const project = 'iepeqmvzjguwlhnecsdq'
const args=process.argv.slice(2)
export const stage=args[0], runId=args[args.indexOf('--run-id')+1]
assert.ok(args.includes('--remote') && args[args.indexOf('--project-ref')+1]===project,'Explicit authorized project/remote flags required')
assert.match(runId??'',/^[a-z0-9-]{4,40}$/)
export const privateDir=`.r6-live.local/${runId}`, out=`docs/qa/r6-block-9/followup/${runId}`
const env=await readFile('.env.local','utf8')
const field=name=>env.match(new RegExp(`^${name}=(.+)$`,'m'))?.[1].trim().replace(/^['"]|['"]$/g,'')
export const url=field('VITE_SUPABASE_URL'), key=field('VITE_SUPABASE_PUBLISHABLE_KEY')
assert.equal(url,`https://${project}.supabase.co`)
export const client=()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})
export async function load(){const m=JSON.parse(await readFile(`${privateDir}/manifest.json`,'utf8'));assert.equal(m.project,project);assert.equal(m.run_id,runId);return m}
export async function save(m){await mkdir(privateDir,{recursive:true});await writeFile(`${privateDir}/manifest.json`,JSON.stringify(m,null,2)+'\n')}
export async function rpc(c,name,args={}){const {data,error}=await c.rpc(name,args).abortSignal(AbortSignal.timeout(30000));if(error)throw Object.assign(new Error(`RPC ${name} failed (${error.code})`),{code:error.code});return data}
export async function login(account){const c=client();const {data,error}=await c.auth.signInWithPassword({email:account.email,password:account.password});if(error||!data.session)throw new Error('QA login failed');assert.equal(data.user.id,account.id);return c}
export async function identities(m){return Object.fromEntries(await Promise.all(Object.entries(m.users).filter(([role])=>['A','B','C','D'].includes(role)).map(async([role,account])=>[role,await login(account)])))}
export async function logout(clients){await Promise.allSettled(Object.values(clients).map(async c=>{await c.removeAllChannels();c.realtime.disconnect();await c.auth.signOut({scope:'local'})}))}
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
export function dayAfter(day,n=1){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
export async function evidence(name,results,extra={}){await mkdir(out,{recursive:true});const data={run_id:runId,project,captured_at:new Date().toISOString(),environment:'Real remote HTTPS/Auth/PostgREST/Postgres Changes on planit-v2; dedicated synthetic QA fixtures',result:results.every(r=>r.result==='PASS')?'PASS':'FAIL',results,...extra};try { const previous=await readFile(`${out}/${name}.json`);await writeFile(`${out}/${name}-previous-${Date.now()}.json`,previous) } catch(e) { if(e.code!=='ENOENT')throw e } await writeFile(`${out}/${name}.json`,JSON.stringify(data,null,2)+'\n');console.log(`${data.result}: ${name} (${results.length} cases)`);return data}
export function event(m,name){assert.ok(m.events[name]?.id,'Unknown QA event');return m.events[name].id}
