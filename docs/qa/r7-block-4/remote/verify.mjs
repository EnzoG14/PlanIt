import assert from 'node:assert/strict'
import { readFile,writeFile } from 'node:fs/promises'
const root='docs/qa/r7-block-4/remote/'
const json=async p=>JSON.parse((await readFile(root+p,'utf8')).replace(/^\uFEFF/,''))
const before=(await json('before.json')).rows[0].metadata,after=(await json('after.json')).rows[0].metadata
const sql=(await readFile('supabase/migrations/20261016193248_r7_stories.sql','utf8')).replace(/\r\n/g,'\n')
const functions=[...sql.matchAll(/create (?:or replace )?function (public|planit_private)\.(\w+)\([\s\S]*?as \$\$([\s\S]*?)\$\$;/g)]
assert.equal(functions.length,11);assert.equal(after.functions.length,11)
const checks=functions.map(([,schema,name,body])=>{
 const remote=after.functions.find(f=>f.schema===schema&&f.name===name)
 assert.ok(remote);assert.equal(remote.body.replace(/\r\n/g,'\n'),body)
 assert.ok(remote.definer&&remote.config.includes('search_path=""'));assert.equal(remote.anon_execute,false)
 const client=['can_read_story','can_read_r7_media','publish_event_story','get_event_stories'].includes(name)
 assert.equal(remote.authenticated_execute,client)
 // Supabase public-schema default ACL also grants service_role the two new
 // authenticated RPCs. Private helpers retain their explicitly closed ACL.
 assert.equal(remote.service_execute,['get_r7_story_image_target','get_event_stories','publish_event_story'].includes(name))
 return {schema,name,body:'MATCH',acl:'PASS',search_path:'PASS'}
})
assert.equal(before.migrations.length,45);assert.equal(after.migrations.length,46)
assert.deepEqual(after.migrations.filter(m=>m.version!=='20261016193248'),before.migrations)
assert.equal(after.migrations.at(-1).version,'20261016193248')
assert.deepEqual(after.story_table,{rls:true,anon_select:false,authenticated_select:true,authenticated_insert:false,authenticated_update:false,authenticated_delete:false})
assert.equal(after.columns.length,6);assert.ok(after.columns.every(c=>c.nullable==='NO'))
assert.ok(after.columns.filter(c=>c.name.endsWith('_at')).every(c=>c.type==='timestamp without time zone'))
assert.equal(after.constraints.filter(c=>c.type==='f'&&c.definition.includes('ON DELETE RESTRICT')).length,3)
assert.ok(after.constraints.some(c=>c.name==='stories_lifetime'&&c.type==='c'))
assert.equal(after.indexes.length,5);assert.equal(after.triggers.length,2)
assert.deepEqual(after.policies.filter(p=>p.tablename!=='stories'),before.policies)
assert.equal(after.policies.filter(p=>p.tablename==='stories').length,1)
const prior=await json('security-before.json'),next=await json('security-after.json')
assert.ok(!next.some(a=>a.level==='ERROR'))
const added=next.filter(a=>!prior.some(b=>b.cache_key===a.cache_key))
const summary={project:'planit-v2',project_ref:'iepeqmvzjguwlhnecsdq',authorization:'User requested remote database migrations in this chat, 2026-10-16',
 migration:'20261016193248_r7_stories.sql',marks:{created:true,local_sql:'PASS',remote_applied_with_approval:true,remote_verified_catalog:true},
 remote_version:after.server_version,migrations:{before:45,after:46,pending:0,extra_already_applied:'20261016154257_r7_push_jobs.sql'},
 functions:checks,table_rls_acl:'PASS',constraints_indexes_triggers:'PASS',storage_files_policies_unchanged:true,
 security:{before:prior.length,after:next.length,errors:0,added:added.map(a=>({name:a.name,level:a.level,cache_key:a.cache_key}))},
 http_jwt_storage:'NOT RUN',edge_story_reader_deployed:false,result:'PASS'}
await writeFile(root+'summary.json',JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify(summary,null,2))
