import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const root = 'docs/qa/r7-block-1/remote/'
const catalog = JSON.parse(await readFile(root+'catalog.json','utf8')).rows[0].metadata
const migration = (await readFile('supabase/migrations/20261016131118_r7_media_contract.sql','utf8')).replace(/\r\n/g,'\n')
const functions = [...migration.matchAll(/create (?:or replace )?function (public|planit_private)\.(\w+)[\s\S]*?as \$\$([\s\S]*?)\$\$;/gi)]
assert.ok(functions.length > 15)
const userExecutable = new Set(['can_read_r7_media','can_upload_r7_media','reserve_event_media_upload','get_event_media_upload_state','get_event_chat_messages'])
const compared = functions.map(([,schema,name,body])=>{
  const deployed = catalog.functions.find(f=>f.schema===schema&&f.name===name)
  assert.ok(deployed, name)
  assert.equal(deployed.body.replace(/\r\n/g,'\n'), body, name+' body')
  assert.equal(deployed.anon_execute,false,name+' anon')
  assert.equal(deployed.authenticated_execute,userExecutable.has(name),name+' authenticated')
  assert.ok(deployed.config.includes('search_path=""'),name+' search_path')
  if (['get_r7_media_validation_target','complete_r7_media_validation'].includes(name)) assert.equal(deployed.service_execute,true)
  return { schema,name,body_sha256:createHash('sha256').update(body).digest('hex'),body_matches:true,acl_matches:true }
})
assert.equal(catalog.migrations.length,38)
assert.equal(catalog.migrations.at(-1).version,'20261016131118')
assert.equal(catalog.body_nullable,true)
assert.ok(catalog.tables.every(t=>t.rls&&!t.anon_select&&!t.authenticated_insert&&!t.authenticated_update&&!t.authenticated_delete))
assert.equal(catalog.tables.find(t=>t.name==='message_attachments').authenticated_select,true)
assert.ok(catalog.tables.filter(t=>t.schema==='planit_private').every(t=>!t.authenticated_select))
const selects=catalog.policies.filter(p=>p.schemaname==='storage'&&p.cmd==='SELECT')
assert.deepEqual(selects.map(p=>p.policyname).sort(),['avatars_select_own','event_media_select_visible'])
assert.ok(selects.find(p=>p.policyname==='event_media_select_visible').qual.includes('allow_only_operation'))
assert.ok(catalog.storage_helpers.length===1)
const advisors=JSON.parse(await readFile(root+'security-advisors.json','utf8'))
assert.ok(!advisors.some(a=>a.level==='ERROR'))
const result={date_argentina:'2026-10-16',project_ref:'iepeqmvzjguwlhnecsdq',
  authorization:'User explicitly requested applying pending remote migrations in this chat.',
  version:'20261016131118',created:true,local_sql:'PASS',remote_applied_with_approval:true,remote_verified:true,
  migration_sha256:createHash('sha256').update(migration).digest('hex'),server_version:catalog.server_version,
  history_count:catalog.migrations.length,pending_after_dry_run:0,functions:compared,
  rls_acl:'PASS',storage_policy_inventory:'PASS',advisors:{errors:0,warnings:advisors.filter(a=>a.level==='WARN').length,names:[...new Set(advisors.map(a=>a.name))]},
  scope:'Catalog/history/function bodies/ACL/RLS verification. Real Auth/JWT/Storage HTTP and Edge deploy NOT RUN.',result:'PASS'}
await writeFile(root+'summary.json',JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify({result:result.result,functions_compared:compared.length,history:38,pending:0,advisors:result.advisors}))
