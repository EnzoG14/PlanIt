import assert from 'node:assert/strict'
import {readFile,writeFile} from 'node:fs/promises'
const dir='docs/qa/r7-block-6/remote/'
const json=async file=>JSON.parse((await readFile(dir+file,'utf8')).replace(/^\uFEFF/,''))
const before=(await json('before.json')).rows[0].metadata
const after=(await json('after.json')).rows[0].metadata
const sql=(await readFile('supabase/migrations/20261017180932_r7_story_gc.sql','utf8')).replace(/\r\n/g,'\n')
assert.equal(before.migrations.length,46);assert.equal(after.migrations.length,47)
assert.equal(after.migrations.at(-1).version,'20261017180932')
assert.equal(before.table,null);assert.equal(before.functions,null)
assert.equal(after.table.rls,true)
assert.equal(after.table.anon_select,false);assert.equal(after.table.authenticated_select,false);assert.equal(after.table.service_select,false)
assert.deepEqual(after.policies,before.policies)
assert.deepEqual(after.read_functions,before.read_functions)
const matches=[...sql.matchAll(/create function ([a-z_]+)\.([a-z_0-9]+)\([\s\S]*?as \$\$([\s\S]*?)\$\$;/g)]
assert.equal(matches.length,5);assert.equal(after.functions.length,5)
for(const [,schema,name,body] of matches){
 const remote=after.functions.find(f=>f.schema===schema&&f.name===name)
 assert.ok(remote,name);assert.equal(remote.body.replace(/\r\n/g,'\n').trim(),body.trim(),name)
 assert.equal(remote.definer,true);assert.ok(remote.config.includes('search_path=""'))
 assert.equal(remote.anon_execute,false);assert.equal(remote.authenticated_execute,false)
 assert.equal(remote.service_execute,schema==='public')
}
assert.equal(after.constraints.length,5)
assert.ok(after.indexes.some(s=>s.includes('story_gc_ready')))
const a=await json('advisors-before.json'),b=await json('advisors-after.json')
const levels=rows=>Object.fromEntries(['ERROR','WARN','INFO'].map(level=>[level,rows.filter(r=>r.level===level).length]))
assert.equal(levels(b).ERROR,0)
await writeFile(dir+'summary.json',JSON.stringify({project:'planit-v2',ref:'iepeqmvzjguwlhnecsdq',migration:'20261017180932',result:'PASS',
 server_version:after.server_version,migrations:{before:46,after:47},functions_verified:5,
 rls_acl_constraints_indexes:'PASS',existing_read_functions_and_policies_unchanged:true,
 advisors_before:levels(a),advisors_after:levels(b),
 limits:'Catalog verification only. No deployed worker, cron activation, physical Storage deletion or HTTP/JWT acceptance performed.'},null,2)+'\n')
console.log('PASS: 47 migrations, 5/5 function bodies/ACL, RLS, constraints/indexes; existing policies/read functions unchanged; no advisor ERROR')
