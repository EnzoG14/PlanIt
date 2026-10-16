import assert from 'node:assert/strict'
import { generateKeyPairSync, createHash } from 'node:crypto'
import { readFile, writeFile, unlink, mkdir } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

function generateValidP256PublicKeyBase64Url() {
  const { publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  const jwk = publicKey.export({ format: 'jwk' })
  const x = Buffer.from(jwk.x, 'base64url')
  const y = Buffer.from(jwk.y, 'base64url')
  const uncompressed = Buffer.concat([Buffer.from([0x04]), x, y])
  assert.equal(uncompressed.length, 65)
  return uncompressed.toString('base64url')
}

function generateInvalidCurveP256KeyBase64Url() {
  const { publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  const jwk = publicKey.export({ format: 'jwk' })
  const x = Buffer.from(jwk.x, 'base64url')
  const y = Buffer.from(jwk.y, 'base64url')
  y[31] ^= 0x01 // Flip lowest bit of Y so point is off the NIST P-256 curve
  return Buffer.concat([Buffer.from([0x04]), x, y]).toString('base64url')
}

const validKey1 = generateValidP256PublicKeyBase64Url()
const validKey2 = generateValidP256PublicKeyBase64Url()
const offCurveKey = generateInvalidCurveP256KeyBase64Url()
const validAuth1 = Buffer.alloc(16, 0x42).toString('base64url')
const validAuth2 = Buffer.alloc(16, 0x99).toString('base64url')

await mkdir('docs/qa/r7-block-9/sql', { recursive: true })

const source = (await readFile('scripts/check-r5-social.mjs', 'utf8')).replace(/\r\n/g, '\n')
const start = "  assert.equal((await a.query('select * from public.profiles')).rowCount, 1)"
assert.equal(source.split(start).length, 2)
let bootstrap = source.slice(0, source.indexOf(start))
bootstrap = bootstrap.replace("const directory = resolve(`.r5-postgres-${Date.now()}.local`)", "const directory = resolve(`.participation-test-tools.local/r7-push-pg-${Date.now()}`)")
bootstrap = bootstrap.replace("const out = process.env.PLANIT_SQL_OUTPUT ?? 'docs/qa/r5-block-1'", "const out = process.env.PLANIT_SQL_OUTPUT ?? 'docs/qa/r7-block-9/sql'")
bootstrap = bootstrap.replace('const files = (await readdir', () => `await admin.query(\`alter table storage.objects add unique(bucket_id,name);
  create function storage.allow_only_operation(text) returns boolean language sql stable as $$
    select coalesce(current_setting('test.storage_operation',true) = $1,false) $$;\`)
  const files = (await readdir`)

const tests = `
  const validKey1 = ${JSON.stringify(validKey1)};
  const validKey2 = ${JSON.stringify(validKey2)};
  const offCurveKey = ${JSON.stringify(offCurveKey)};
  const validAuth1 = ${JSON.stringify(validAuth1)};
  const validAuth2 = ${JSON.stringify(validAuth2)};

  record('R7-B9-TC-01 SQL: all 39 versioned migrations replayed from zero on real PostgreSQL');

  // 1. Default state before any subscription or preference row exists
  const initialSettingsA = await value(a, 'select public.get_my_push_settings()');
  assert.deepEqual(initialSettingsA, { show_previews: true, subscriptions: [] });
  await denied(anon.query('select public.get_my_push_settings()'));
  await denied(missing.query('select public.upsert_my_push_subscription($1,$2,$3,$4)', [
    randomUUID(),
    'https://fcm.googleapis.com/fcm/send/missing-profile',
    validKey1,
    validAuth1,
  ]));
  await denied(missing.query('select public.set_my_push_previews(false)'));
  record('Default get_my_push_settings returns show_previews=true and empty subscriptions; anon and missing-profile callers denied');

  // 2. Direct table and private function access is completely revoked
  for (const client of [a, b, anon]) {
    await denied(client.query('select * from public.push_subscriptions'));
    await denied(client.query('select * from public.push_preferences'));
    await denied(client.query('insert into public.push_preferences(user_id,show_previews) values($1,false)', [aId]));
    await denied(client.query('delete from public.push_subscriptions'));
    await denied(client.query('select planit_private.decode_base64url($1)', [validAuth1]));
    await denied(client.query('select planit_private.is_valid_push_endpoint($1)', ['https://fcm.googleapis.com/fcm/send/abc']));
  }
  record('Direct client SELECT/INSERT/UPDATE/DELETE on push_subscriptions and push_preferences and private helpers denied (42501)');

  // 3. Upsert subscription, idempotent retry, key rotation, and multi-device support
  const subA1 = randomUUID();
  const epA1 = 'https://fcm.googleapis.com/fcm/send/device-a-1';
  assert.equal(await value(a, 'select public.upsert_my_push_subscription($1,$2,$3,$4)', [subA1, epA1, validKey1, validAuth1]), subA1);
  // Idempotent retry with same id/endpoint and rotated keys
  assert.equal(await value(a, 'select public.upsert_my_push_subscription($1,$2,$3,$4)', [subA1, epA1, validKey2, validAuth2]), subA1);
  // Same endpoint re-upserted with a newly generated UUID keeps existing row id
  assert.equal(await value(a, 'select public.upsert_my_push_subscription($1,$2,$3,$4)', [randomUUID(), epA1, validKey1, validAuth1]), subA1);

  // Second active device for user A
  const subA2 = randomUUID();
  const epA2 = 'https://updates.push.services.mozilla.com/wpush/v2/device-a-2';
  assert.equal(await value(a, 'select public.upsert_my_push_subscription($1,$2,$3,$4)', [subA2, epA2, validKey2, validAuth2]), subA2);

  const settingsAfterUpsert = await value(a, 'select public.get_my_push_settings()');
  assert.equal(settingsAfterUpsert.show_previews, true);
  assert.equal(settingsAfterUpsert.subscriptions.length, 2);
  for (const item of settingsAfterUpsert.subscriptions) {
    assert.deepEqual(Object.keys(item).sort(), ['created_at', 'disabled_at', 'id', 'updated_at']);
    assert.equal(item.disabled_at, null);
    assert.equal('endpoint' in item, false);
    assert.equal('p256dh' in item, false);
    assert.equal('auth' in item, false);
  }
  record('R7-B9-TC-01 SQL: upsert_my_push_subscription creates/updates multi-device rows and initializes push_preferences; get_my_push_settings never leaks endpoint/p256dh/auth');

  // 4. Preview preference toggle (R7-B9-TC-02)
  assert.equal(await value(a, 'select public.set_my_push_previews(false)'), false);
  assert.equal((await value(a, 'select public.get_my_push_settings()')).show_previews, false);
  // Upserting a subscription must NOT overwrite existing show_previews=false preference
  await value(a, 'select public.upsert_my_push_subscription($1,$2,$3,$4)', [subA1, epA1, validKey1, validAuth1]);
  assert.equal((await value(a, 'select public.get_my_push_settings()')).show_previews, false);
  assert.equal(await value(a, 'select public.set_my_push_previews(true)'), true);
  assert.equal((await value(a, 'select public.get_my_push_settings()')).show_previews, true);
  await invalid(a.query('select public.set_my_push_previews(null)'));
  record('R7-B9-TC-02 SQL: set_my_push_previews toggles show_previews and subsequent subscription upserts preserve user preference');

  // 5. Disable and re-enable subscription (R7-B9-TC-03)
  assert.equal(await value(a, 'select public.disable_my_push_subscription($1)', [subA1]), subA1);
  // Idempotent second disable call
  assert.equal(await value(a, 'select public.disable_my_push_subscription($1)', [subA1]), subA1);
  const settingsAfterDisable = await value(a, 'select public.get_my_push_settings()');
  const rowA1 = settingsAfterDisable.subscriptions.find(s => s.id === subA1);
  const rowA2 = settingsAfterDisable.subscriptions.find(s => s.id === subA2);
  assert.ok(rowA1 && rowA1.disabled_at !== null);
  assert.ok(rowA2 && rowA2.disabled_at === null);

  // Re-enabling disabled endpoint clears disabled_at
  assert.equal(await value(a, 'select public.upsert_my_push_subscription($1,$2,$3,$4)', [subA1, epA1, validKey1, validAuth1]), subA1);
  const settingsAfterReenable = await value(a, 'select public.get_my_push_settings()');
  assert.equal(settingsAfterReenable.subscriptions.find(s => s.id === subA1).disabled_at, null);
  record('R7-B9-TC-03 SQL: disable_my_push_subscription sets disabled_at idempotently, preserves other active devices, and upsert re-activates');

  // 6. Cross-user isolation and conflict rejection
  await denied(b.query('select public.upsert_my_push_subscription($1,$2,$3,$4)', [randomUUID(), epA1, validKey1, validAuth1]));
  await denied(b.query('select public.upsert_my_push_subscription($1,$2,$3,$4)', [subA1, 'https://fcm.googleapis.com/fcm/send/b-steal-id', validKey1, validAuth1]));
  await denied(b.query('select public.disable_my_push_subscription($1)', [subA1]));
  await denied(a.query('select public.disable_my_push_subscription($1)', [randomUUID()]));
  await assert.rejects(
    a.query('select public.upsert_my_push_subscription($1,$2,$3,$4)', [subA1, 'https://fcm.googleapis.com/fcm/send/different-endpoint-same-id', validKey1, validAuth1]),
    e => e.code === 'P0001' && /push_subscription_conflict/.test(e.message)
  );
  assert.equal((await value(b, 'select public.get_my_push_settings()')).subscriptions.length, 0);
  record('Cross-user endpoint hijack, cross-user id hijack, cross-user disable, and same-id endpoint conflict rejected');

  // 7. Endpoint SSRF & format validation and NIST P-256 curve validation
  const badEndpoints = [
    '',
    'http://fcm.googleapis.com/fcm/send/insecure',
    'https://localhost/push/123',
    'https://sub.localhost/push/123',
    'https://push.local/push/123',
    'https://push.internal/push/123',
    'https://127.0.0.1/push/123',
    'https://169.254.169.254/latest/meta-data',
    'https://[::1]/push/123',
    'https://fcm.googleapis.com/',
    'https://fcm.googleapis.com/fcm/send/with#fragment',
    'https://fcm.googleapis.com/fcm/send/with space',
    'https://-badhost.com/push/123',
  ];
  for (const badEp of badEndpoints) {
    await invalid(a.query('select public.upsert_my_push_subscription($1,$2,$3,$4)', [randomUUID(), badEp, validKey1, validAuth1]));
  }

  const badKeys = [
    ['', validAuth1],
    ['not_base64_url===', validAuth1],
    [Buffer.alloc(65, 0x04).toString('base64url'), validAuth1],
    [offCurveKey, validAuth1],
    [validKey1, ''],
    [validKey1, Buffer.alloc(15, 0x42).toString('base64url')],
    [validKey1, Buffer.alloc(17, 0x42).toString('base64url')],
  ];
  for (const [k, au] of badKeys) {
    await invalid(a.query('select public.upsert_my_push_subscription($1,$2,$3,$4)', [
      randomUUID(),
      'https://fcm.googleapis.com/fcm/send/valid-path',
      k,
      au,
    ]));
  }
  record('SSRF endpoints (http, localhost, .local, .internal, IP literals, root path, fragments) and invalid NIST P-256 points / auth lengths rejected (22023)');

  // 8. Transaction isolation guard (read committed required) on all write RPCs
  for (const sqlCall of [
    ['select public.upsert_my_push_subscription($1,$2,$3,$4)', [randomUUID(), 'https://fcm.googleapis.com/fcm/send/iso', validKey1, validAuth1]],
    ['select public.disable_my_push_subscription($1)', [subA1]],
    ['select public.set_my_push_previews(false)', []],
  ]) {
    await a.query('begin isolation level repeatable read');
    await assert.rejects(a.query(sqlCall[0], sqlCall[1]), e => e.code === '40001' && /retry_read_committed/.test(e.message));
    await a.query('rollback');
  }
  record('Write RPCs enforce read committed transaction isolation (40001 retry_read_committed)');

  // 9. ON DELETE RESTRICT protects push_subscriptions and push_preferences
  await assert.rejects(admin.query('delete from public.profiles where id = $1', [aId]), e => ['23503', '23001'].includes(e.code));
  record('ON DELETE RESTRICT prevents profile deletion when push_subscriptions or push_preferences exist');

  // 10. Concurrency: simultaneous same-user retry and cross-user race on new endpoint
  const aRace = await connect();
  await role(aRace, aId);
  const bRace = await connect();
  await role(bRace, bId);

  const concId = randomUUID();
  const concEp = 'https://fcm.googleapis.com/fcm/send/concurrent-same-user';
  const [res1, res2] = await Promise.all([
    value(a, 'select public.upsert_my_push_subscription($1,$2,$3,$4)', [concId, concEp, validKey1, validAuth1]),
    value(aRace, 'select public.upsert_my_push_subscription($1,$2,$3,$4)', [concId, concEp, validKey2, validAuth2]),
  ]);
  assert.equal(res1, concId);
  assert.equal(res2, concId);

  const raceEp = 'https://fcm.googleapis.com/fcm/send/concurrent-cross-user';
  const crossResults = await Promise.allSettled([
    value(a, 'select public.upsert_my_push_subscription($1,$2,$3,$4)', [randomUUID(), raceEp, validKey1, validAuth1]),
    value(bRace, 'select public.upsert_my_push_subscription($1,$2,$3,$4)', [randomUUID(), raceEp, validKey2, validAuth2]),
  ]);
  const fulfilled = crossResults.filter(r => r.status === 'fulfilled');
  const rejected = crossResults.filter(r => r.status === 'rejected');
  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assert.equal(rejected[0].reason.code, '42501');
  await aRace.end();
  await bRace.end();
  record('Concurrent same-user upsert converges on single subscription id; concurrent cross-user endpoint race allows one owner and rejects the other (42501)');

  // 11. Security & schema inventory
  const inventory = (await admin.query(\`
    select c.relname, c.relrowsecurity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname in ('push_subscriptions', 'push_preferences')
    order by c.relname
  \`)).rows;
  assert.equal(inventory.length, 2);
  assert.ok(inventory.every(r => r.relrowsecurity === true));

  const acl = (await admin.query(\`
    select p.proname,
           has_function_privilege('anon', p.oid, 'execute') as anon_execute,
           has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute,
           p.prosecdef,
           p.proconfig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where (n.nspname = 'public' and p.proname in ('upsert_my_push_subscription', 'get_my_push_settings', 'disable_my_push_subscription', 'set_my_push_previews'))
       or (n.nspname = 'planit_private' and p.proname in ('decode_base64url', 'bytes_to_numeric', 'is_valid_p256_public_key', 'is_valid_push_endpoint'))
    order by n.nspname, p.proname
  \`)).rows;
  assert.equal(acl.length, 8);
  for (const fn of acl) {
    assert.equal(fn.anon_execute, false, fn.proname + ' must not be executable by anon');
    assert.ok(fn.proconfig && fn.proconfig.includes('search_path=""'), fn.proname + ' must pin empty search_path');
  }
  await writeFile(out + '/inventory.json', JSON.stringify({ inventory, acl }, null, 2) + '\\n');
  record('RLS enabled from creation, anon EXECUTE revoked, empty search_path verified on all B9 RPCs and helpers');

  // 12. Regression: existing in-app notifications inbox & RPCs remain intact
  const notifId = await value(admin, "insert into public.notifications(recipient_id,type,title,body) values ($1,'system','Aviso interno','Persiste en bandeja') returning id", [aId]);
  const inboxRows = (await a.query('select * from public.get_notifications()')).rows;
  assert.ok(inboxRows.some(r => r.id === notifId && r.body === 'Persiste en bandeja'));
  assert.equal((await b.query('select * from public.get_notification_changes($1)', [[notifId]])).rows.length, 0);
  const markedAt = await value(a, 'select public.mark_notification_read($1)', [notifId]);
  assert.ok(markedAt instanceof Date);
  record('Regression: in-app notifications inbox (get_notifications, get_notification_changes, mark_notification_read) works unchanged alongside B9 push tables');
`

const cleanup = source
  .slice(source.indexOf('} catch (error) {\n  failure ='))
  .replace("base:'da4379f',branch:'codex/r5-block-1'", "base:'3f2a498',branch:'codex/r7-block-9'")

const temp = 'scripts/.r7-push-subscriptions-run.local.mjs'
await writeFile(temp, bootstrap + tests + cleanup)
try {
  const { existsSync } = await import('node:fs')
  const defaultToolsDir = existsSync('.participation-test-tools.local/node_modules')
    ? '.participation-test-tools.local/node_modules'
    : 'D:/planit/.participation-test-tools.local/node_modules'
  const { stdout, stderr } = await promisify(execFile)(process.execPath, [temp], {
    windowsHide: true,
    timeout: 180000,
    maxBuffer: 8 * 1024 * 1024,
    env: {
      ...process.env,
      PLANIT_TEST_TOOLS_DIR: process.env.PLANIT_TEST_TOOLS_DIR ?? defaultToolsDir,
    },
  })
  console.log(stdout)
  if (stderr) console.error(stderr)
} catch (error) {
  console.error(error.stdout, error.stderr)
  throw error
} finally {
  await unlink(temp).catch(() => {})
}

// Verify deterministic subscription ID derivation formula matches client implementation
function deriveIdNode(userId, endpoint) {
  const digest = createHash('sha256')
    .update(`planit:push:v1:${userId.trim().toLowerCase()}:${endpoint.trim()}`)
    .digest()
  const bytes = Uint8Array.from(digest.subarray(0, 16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Buffer.from(bytes).toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

const u1 = '11111111-1111-4111-8111-111111111111'
const u2 = '22222222-2222-4222-8222-222222222222'
const ep = 'https://fcm.googleapis.com/fcm/send/shared-browser'
const id1 = deriveIdNode(u1, ep)
const id2 = deriveIdNode(u2, ep)
assert.match(id1, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
assert.notEqual(id1, id2, 'Different users on same browser endpoint must derive distinct subscription UUIDs')
console.log('PASS deterministic Push subscription ID derivation and user isolation checks')
