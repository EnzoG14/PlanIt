import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { generateKeyPairSync } from 'node:crypto'
import { readFile, unlink, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'

// Reuse the isolated PostgreSQL, Auth roles and migration replay from the lifecycle suite.
const source = (await readFile('scripts/check-event-lifecycle.mjs', 'utf8')).replaceAll('\r\n', '\n')
const marker = '  const id = await create(), other = await create(stranger)'
assert.equal(source.split(marker).length, 2)
const bootstrap = source.slice(0, source.indexOf(marker)).replace('lifecycle-', 'participation-notices-')
const jwk = generateKeyPairSync('ec', { namedCurve: 'prime256v1' }).publicKey.export({ format: 'jwk' })
const publicKey = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, 'base64url'), Buffer.from(jwk.y, 'base64url')]).toString('base64url')
const checks = String.raw`
  const register = (client, event) => client.query('select public.register_for_event($1)', [event])
  const part = event => scalar(admin, 'select id from public.event_participations where event_id=$1 and user_id=$2', [event, guest])
  const drop = (client, event, id) => client.query('select public.remove_participant($1,$2)', [event, id])
  const request = (client, event) => scalar(client, 'select public.request_rejoin($1)', [event])
  const resolveRequest = (client, event, id, decision) =>
    client.query('select public.resolve_rejoin($1,$2,$3)', [event, id, decision])
  const notices = async (event, type, user = guest) => (await admin.query(
    'select * from public.notifications where event_id=$1 and type=$2 and recipient_id=$3', [event, type, user])).rows
  const notice = async (...args) => (await notices(...args))[0]
  const target = (client, id) => scalar(client, 'select public.get_notification_target($1)', [id])
  const reminders = (client, on) => scalar(client, 'select public.set_my_event_reminders($1)', [on])
  const settings = client => scalar(client, 'select public.get_my_push_settings()')
  const worker = await connect()
  await worker.query('set role service_role')
  for (const client of [a, b]) {
    await client.query('select public.upsert_my_push_subscription($1,$2,$3,$4)',
      [randomUUID(), 'https://fcm.googleapis.com/fcm/send/' + randomUUID(), KEY_FIXTURE, Buffer.alloc(16, 7).toString('base64url')])
  }
  const deliver = async n => {
    await worker.query('select * from public.claim_push_jobs(100)')
    const job = (await admin.query('select * from planit_private.push_jobs where notification_id=$1', [n.id])).rows[0]
    assert.ok(job?.lease_token, 'expected a push lease for ' + n.type)
    return scalar(worker, 'select public.get_push_job_delivery($1,$2,$3)', [n.id, job.subscription_id, job.lease_token])
  }

  const event = await create()
  await register(b, event)
  const participant = await part(event)
  await Promise.all([drop(a, event, participant), drop(a2, event, participant)])
  assert.equal((await notices(event, 'participation_removed')).length, 1)
  assert.equal((await deliver(await notice(event, 'participation_removed'))).payload.target, '/events/' + event)
  const requester = await connect(guest)
  const requests = await Promise.allSettled([request(b, event), request(requester, event)])
  assert.equal(requests.filter(outcome => outcome.status === 'fulfilled').length, 1)
  assert.match(requests.find(outcome => outcome.status === 'rejected').reason.message, /rejoin_already_pending/)
  const requestId = requests.find(outcome => outcome.status === 'fulfilled').value
  const incoming = await notice(event, 'rejoin_requested', owner)
  assert.equal(incoming.rejoin_request_id, requestId)
  assert.equal(await target(a, incoming.id), '/events/' + event + '/rejoin-requests')
  assert.equal(await target(c, incoming.id), null)
  assert.equal((await deliver(incoming)).payload.target, '/events/' + event + '/rejoin-requests')
  await admin.query('update public.events set capacity=1 where id=$1', [event])
  await register(c, event)
  await assert.rejects(resolveRequest(a, event, requestId, 'approved'), /event_full/)
  assert.equal(await notice(event, 'rejoin_approved'), undefined)
  await c.query('select public.leave_event($1)', [event])
  assert.equal(await notice(event, 'participation_removed', stranger), undefined)
  const approvals = await Promise.allSettled([resolveRequest(a, event, requestId, 'approved'), resolveRequest(a2, event, requestId, 'approved')])
  assert.equal(approvals.filter(outcome => outcome.status === 'fulfilled').length, 1)
  const approved = await notice(event, 'rejoin_approved')
  assert.equal(approved.rejoin_request_id, requestId)
  assert.equal(await target(a, incoming.id), '/events/' + event)
  assert.equal((await deliver(incoming)).payload.target, '/events/' + event)
  assert.equal(await target(b, approved.id), '/events/' + event)
  await b.query('select public.set_my_push_previews(false)')
  assert.equal((await deliver(approved)).payload.title, 'Nuevo aviso en PlanIt')
  await b.query('select public.set_my_push_previews(true)')
  await drop(a, event, participant)
  const secondRequest = await request(b, event)
  await resolveRequest(a, event, secondRequest, 'rejected')
  const rejected = await notice(event, 'rejoin_rejected')
  assert.equal(rejected.rejoin_request_id, secondRequest)
  assert.equal((await deliver(rejected)).payload.target, '/events/' + event)
  check('Participation transitions, concurrent retries, full event, voluntary leave, routes and push previews')

  const makeHidden = async id => {
    await admin.query("update public.events set visibility='unlisted' where id=$1", [id])
    await admin.query("insert into public.event_access_grants(event_id,user_id,status) values($1,$2,'active')", [id, guest])
  }
  const revoke = id => a.query('select public.revoke_event_access($1,$2)', [id, guest])
  const hidden = await create()
  await makeHidden(hidden)
  await register(b, hidden)
  await revoke(hidden)
  const revoked = await notice(hidden, 'participation_removed')
  assert.equal(await target(b, revoked.id), null)
  const row = (await b.query('select * from public.get_notification_changes($1)', [[revoked.id]])).rows[0]
  assert.equal(row.title, 'Inscripción dada de baja')
  assert.equal(row.body, 'El organizador dio de baja tu inscripción.')
  const revokedPayload = (await deliver(revoked)).payload
  assert.equal(revokedPayload.target, '/notifications')
  assert.equal(revokedPayload.body, row.body)
  await action(a, event)
  await remove(a, event)
  assert.equal(await scalar(admin, 'select count(*)::int from public.notifications where event_id=$1', [event]), 0)
  check('Revocation hides private details and permanent deletion cleans up notices with request references')

  const generate = () => scalar(admin, 'select planit_private.generate_event_reminders()')
  const moveStart = (id, minutes) => admin.query(
    "update public.events set starts_at=(clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')+make_interval(mins=>$2), ends_at=(clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')+interval '3 hours' where id=$1",
    [id, minutes])
  const scheduled = async minutes => {
    const id = await create()
    await moveStart(id, minutes)
    return id
  }
  assert.equal((await settings(c)).event_reminders_enabled, true)
  await assert.rejects(reminders(anon, false), error => error.code === '42501')
  await assert.rejects(reminders(b, null), error => error.code === '22023')
  await assert.rejects(scalar(b, 'select planit_private.generate_event_reminders()'), error => error.code === '42501')
  await reminders(c, false)
  assert.equal((await settings(c)).event_reminders_enabled, false)
  assert.equal((await settings(b)).event_reminders_enabled, true)
  const soon = await scheduled(59), outside = await scheduled(61), late = await scheduled(45), cancelled = await scheduled(59)
  for (const id of [soon, outside, late, cancelled]) await register(b, id)
  await register(c, soon)
  await action(a, cancelled)
  assert.equal(await generate(), 1)
  assert.equal(await generate(), 0)
  for (const id of [outside, late, cancelled]) assert.equal(await notice(id, 'event_reminder'), undefined)
  assert.equal(await notice(soon, 'event_reminder', owner), undefined)
  assert.equal(await notice(soon, 'event_reminder', stranger), undefined)
  const reminder = await notice(soon, 'event_reminder')
  assert.match(reminder.body, /Inicio previsto: \d\d\/\d\d\/\d{4} a las \d\d:\d\d \(hora argentina\)/)
  assert.equal(await target(b, reminder.id), '/events/' + soon)
  const delivery = await deliver(reminder)
  assert.equal(delivery.payload.title, 'Recordatorio de evento')
  assert.ok(delivery.ttl <= 14 * 60)
  await b.query('select public.clear_notifications()')
  await moveStart(soon, 58)
  assert.equal(await generate(), 0)
  await moveStart(outside, 58)
  assert.equal(await generate(), 1)
  await reminders(c, true)
  assert.equal(await generate(), 1)
  const withoutPush = await notice(soon, 'event_reminder', stranger)
  assert.equal(await target(c, withoutPush.id), '/events/' + soon)
  assert.equal(await scalar(admin, 'select count(*)::int from planit_private.push_jobs where notification_id=$1', [withoutPush.id]), 0)
  check('Reminder window, defaults, opt-out, reprogramming and deduplication after clearing the inbox')

  for (const change of ['leave', 'cancel', 'reschedule', 'disable-and-reenable', 'hidden-revocation']) {
    const id = await scheduled(57)
    if (change === 'hidden-revocation') await makeHidden(id)
    await register(b, id)
    assert.equal(await generate(), 1)
    const queued = await notice(id, 'event_reminder')
    if (change === 'leave') await b.query('select public.leave_event($1)', [id])
    if (change === 'cancel') await action(a, id)
    if (change === 'reschedule') await moveStart(id, 56)
    if (change === 'disable-and-reenable') {
      await reminders(b, false)
      await reminders(b, true)
    }
    if (change === 'hidden-revocation') await revoke(id)
    assert.equal(await deliver(queued), null, change)
    assert.equal(await scalar(admin, 'select state from planit_private.push_jobs where notification_id=$1', [queued.id]), 'discarded', change)
  }
  check('Pending reminder push is discarded after opt-out, leave, cancellation, reschedule or revocation')
`
const cleanup = source.slice(source.lastIndexOf('} finally {'))
const temp = 'scripts/.participation-notifications-run.local.mjs'
await writeFile(temp, bootstrap + checks.replace('KEY_FIXTURE', JSON.stringify(publicKey)) + cleanup)
try {
  const { stdout, stderr } = await promisify(execFile)(process.execPath, [temp], { windowsHide: true, timeout: 180000 })
  process.stdout.write(stdout)
  process.stderr.write(stderr)
} catch (error) {
  process.stdout.write(error.stdout ?? '')
  process.stderr.write(error.stderr ?? '')
  process.exitCode = 1
} finally {
  await unlink(temp)
}
