import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
const root = 'docs/qa/r5-block-8/message-notifications/remote'
const record = JSON.parse(await readFile(`${root}/application.json`, 'utf8'))
const sql = await readFile('supabase/migrations/20261014225216_direct_message_notifications.sql', 'utf8')
const catalog = record.catalog
assert.equal(catalog.migration_count, 30); assert.equal(catalog.applied, 1)
const definitions = [...sql.matchAll(/create (?:or replace )?function ([\w.]+)[\s\S]*?as \$\$([\s\S]*?)\$\$;/gi)]
assert.equal(definitions.length, 2)
for (const [, name, body] of definitions) {
  const current = catalog.functions.find(fn => `${fn.schema}.${fn.name}` === name)
  assert.ok(current, name)
  assert.equal(current.body.replace(/\r\n/g, '\n').trim(), body.replace(/\r\n/g, '\n').trim(), name)
  assert.equal(current.definer, false)
  assert.deepEqual(current.config, ['search_path=""'])
  assert.equal(current.anon_execute, false)
  assert.equal(current.authenticated_execute, name === 'public.get_notification_target')
}
assert.equal(catalog.trigger.length, 1)
assert.equal(catalog.trigger[0].name, 'messages_notify_direct_message')
assert.equal(catalog.trigger[0].enabled, 'O')
assert.match(catalog.trigger[0].definition, /AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION planit_private.notify_direct_message\(\)/)
assert.equal(catalog.rls.length, 3); assert.ok(catalog.rls.every(table => table.enabled))
for (const name of ['notifications_read_own','notifications_mark_own','messages_read_member','conversations_read_member']) assert.ok(catalog.policies.some(policy => policy.name === name))
assert.ok(catalog.publication.includes('messages')); assert.ok(catalog.publication.includes('notifications'))
assert.equal(record.advisors.unchanged, true)
assert.deepEqual(record.post_dry_run, { upToDate: true, migrations: [] })
await writeFile(`${root}/verification.json`, JSON.stringify({ result: 'PASS', checked_at: new Date().toISOString(), source_commit: record.source_commit, checks: ['30 migrations synchronized; authorized version present','Two remote function bodies equal versioned SQL','Invoker/search_path/ACL correct','Enabled AFTER INSERT trigger correct','Conversations/messages/notifications RLS and policies present','Realtime publication intact','Security advisor groups/counts unchanged','No pending migrations'], limits: 'Catalog/ACL/source verification only; no authenticated HTTP JWT, user messages, remote fixtures or Realtime delivery tested.' }, null, 2) + '\n')
console.log('PASS: remote ledger, exact function bodies, trigger, ACL/RLS, publication and advisors')
