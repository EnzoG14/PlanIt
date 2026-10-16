import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const out='docs/qa/r7-block-3/storage-fix/'
const before=JSON.parse(await readFile(out+'before.json','utf8')).rows[0]
const after=JSON.parse(await readFile(out+'after.json','utf8')).rows[0]
const sql=await readFile('supabase/migrations/20261016182333_r7_storage_upload_preflight.sql','utf8')
const expected=sql.split('as $$')[1].split('$$;')[0].trim().replace(/\r\n/g,'\n')
assert.notEqual(before.body.trim(),expected)
assert.equal(after.body.trim(),expected)
assert.equal(before.migration_applied,false)
assert.equal(after.migration_applied,true)
for(const row of [before,after]){
  assert.equal(row.anon_execute,false)
  assert.equal(row.authenticated_execute,true)
  assert.equal(row.definer,true)
  assert.ok(row.config.includes('search_path=""'))
  assert.equal(row.storage_rls,true)
}
console.log('PASS: remote function body matches migration; version recorded; Auth-only ACL, search_path and Storage RLS preserved')
