import assert from 'node:assert/strict'
import { readFile,writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const root='docs/qa/r7-block-2/remote/'
const catalog=JSON.parse(await readFile(root+'catalog.json','utf8')).rows[0].metadata
const sql=(await readFile('supabase/migrations/20261016141952_r7_chat_attachments.sql','utf8')).replace(/\r\n/g,'\n')
const functions=[...sql.matchAll(/create function public\.(\w+)[\s\S]*?as \$\$([\s\S]*?)\$\$;/g)]
assert.equal(functions.length,2)
const compared=functions.map(([,name,body])=>{
 const deployed=catalog.functions.find(f=>f.name===name)
 assert.equal(deployed.body.replace(/\r\n/g,'\n'),body,name)
 assert.equal(deployed.anon_execute,false)
 assert.equal(deployed.authenticated_execute,true)
 assert.equal(deployed.definer,true)
 assert.ok(deployed.config.includes('search_path=""'))
 return {name,body_matches:true,acl_matches:true,sha256:createHash('sha256').update(body).digest('hex')}
})
assert.equal(catalog.migrations.length,39)
assert.equal(catalog.migrations.at(-1),'20261016141952')
assert.ok(catalog.tables.every(t=>t.rls&&!t.authenticated_insert&&!t.authenticated_update&&!t.authenticated_delete))
const advisors=JSON.parse(await readFile(root+'security-advisors.json','utf8'))
assert.equal(advisors.filter(a=>a.level==='ERROR').length,0)
const before=JSON.parse(await readFile('docs/qa/r7-block-1/remote/security-advisors.json','utf8'))
const summary={date_argentina:'2026-10-16',project_ref:'iepeqmvzjguwlhnecsdq',authorization:'User explicitly requested remote migrations in this chat',migration:'20261016141952',created:true,local_sql:'PASS',remote_applied_with_approval:true,remote_verified:true,history_count:39,pending_after_dry_run:0,functions:compared,rls_acl:'PASS',advisors:{errors:0,warnings:advisors.filter(a=>a.level==='WARN').length,before_warnings:before.filter(a=>a.level==='WARN').length,names:[...new Set(advisors.map(a=>a.name))]},scope:'Catalog/history/function bodies/ACL/RLS. HTTP/JWT/Storage integration NOT RUN. No Edge deployment.',result:'PASS'}
await writeFile(root+'summary.json',JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify(summary))
