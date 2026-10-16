import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { calendarInstant, createEventCalendar, eventGoogleCalendarUrl, calendarMimeType } from '../src/features/events/calendar.ts'
const out = 'docs/qa/r7-block-7/unit'
const event = { id: '30000000-0000-4000-8000-000000000007', title: 'Encuentro en Buenos Aires', starts_at: '2026-12-31T23:30:00', ends_at: '2027-01-01T01:00:00', location_name: 'Salón', address: 'Corrientes 123, Buenos Aires', visibility: 'public', state: 'open' }
const now = new Date('2026-10-16T12:34:56Z')
if (process.argv.includes('--timezone-child')) {
  console.log(JSON.stringify({ start: calendarInstant(event.starts_at).toISOString(), ics: createEventCalendar(event, now), google: eventGoogleCalendarUrl(event) }))
  process.exit(0)
}
const { default: ICAL } = await import(pathToFileURL(resolve(process.env.PLANIT_ICAL_PATH ?? '.r7-calendar.local/node_modules/ical.js/dist/ical.js')).href)
const results = []
const check = (name, fn) => { fn(); results.push({ name, result: 'PASS' }); console.log('PASS:', name) }
const parsed = input => new ICAL.Component(ICAL.parse(input))
check('UTC conversion independent of host timezone (AR, UTC, Tokyo, New York, Madrid)', () => {
  const outputs = ['America/Argentina/Buenos_Aires', 'UTC', 'Asia/Tokyo', 'America/New_York', 'Europe/Madrid'].map(TZ => {
    const run = spawnSync(process.execPath, [process.argv[1], '--timezone-child'], { env: { ...process.env, TZ }, encoding: 'utf8', windowsHide: true })
    assert.equal(run.status, 0, run.stderr)
    return JSON.parse(run.stdout)
  })
  for (const output of outputs) assert.deepEqual(output, outputs[0])
  assert.equal(outputs[0].start, '2027-01-01T02:30:00.000Z')
})
check('Date validation, leap year, fractional SQL timestamps, midnight/month/year boundaries', () => {
  assert.equal(calendarInstant('2028-02-29 23:59:59.123456').toISOString(), '2028-03-01T02:59:59.000Z')
  assert.equal(calendarInstant('2026-04-30T23:30:00').toISOString(), '2026-05-01T02:30:00.000Z')
  for (const value of ['2026-02-29T10:00:00', '2026-02-30T10:00:00', '2026-13-01T10:00:00', '2026-01-01T24:00:00', '2026-01-01T10:60:00', '2026-01-01T10:00:60', '2026-01-01T10:00:00Z', '2026-01-01T10:00:00-03:00', 'invalid', '', '0000-01-01T10:00:00', '9999-12-31T23:00:00']) assert.throws(() => calendarInstant(value))
  for (const ends_at of [event.starts_at, '2026-12-30T23:30:00']) {
    assert.throws(() => createEventCalendar({ ...event, ends_at }, now))
    assert.throws(() => eventGoogleCalendarUrl({ ...event, ends_at }))
  }
  assert.throws(() => createEventCalendar({ ...event, id: 'injected\r\nATTENDEE:secret' }, now))
  assert.throws(() => createEventCalendar({ ...event, title: '  ' }, now))
  assert.throws(() => createEventCalendar(event, new Date('invalid')))
})
const complex = { ...event, title: '¡Música 🎉; café, mate \\ baile!\r\nBEGIN:VEVENT\nATTENDEE:injection\rCierre ' + 'á🎶'.repeat(40), location_name: 'Club; Norte', address: 'Calle 1, piso 2 \\ patio\r\nBuenos Aires' }
const ics = createEventCalendar(complex, now)
check('Independent ical.js parser: one VEVENT, escaping/injection/UTF-8 folding round trip', () => {
  assert.equal(ics.replace(/\r\n/g, '').includes('\n'), false)
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75)
  const root = parsed(ics), events = root.getAllSubcomponents('vevent')
  assert.equal(events.length, 1)
  const item = events[0]
  assert.equal(item.getFirstPropertyValue('summary'), complex.title.replace(/\r\n|\r/g, '\n'))
  assert.equal(item.getFirstPropertyValue('location'), 'Club; Norte · Calle 1, piso 2 \\ patio\nBuenos Aires')
  assert.equal(item.getAllProperties('attendee').length, 0)
  assert.equal(item.getFirstPropertyValue('dtstart').toString(), '2027-01-01T02:30:00Z')
  assert.equal(item.getFirstPropertyValue('dtend').toString(), '2027-01-01T04:00:00Z')
  assert.equal(item.getFirstPropertyValue('dtstamp').toString(), '2026-10-16T12:34:56Z')
  assert.equal(root.getFirstPropertyValue('version'), '2.0')
})
check('Stable UID, optional location, exact export allowlist, no metadata/token/link leaks', () => {
  const extra = { ...event, description: 'PRIVATE_DESCRIPTION', invite_url: 'PRIVATE_INVITE', attendees: ['PRIVATE_PERSON'], birth_date: 'PRIVATE_DOB', access_token: 'PRIVATE_TOKEN', visibility: 'unlisted' }
  const output = createEventCalendar(extra, now), url = eventGoogleCalendarUrl(extra)
  assert.ok(!output.includes('PRIVATE_') && !url.includes('PRIVATE_'))
  const props = parsed(output).getFirstSubcomponent('vevent').getAllProperties().map(p => p.name).sort()
  assert.deepEqual(props, ['dtend', 'dtstamp', 'dtstart', 'location', 'summary', 'uid'])
  assert.equal(parsed(output).getFirstSubcomponent('vevent').getFirstPropertyValue('uid'), parsed(createEventCalendar({ ...event, title: 'Changed' }, now)).getFirstSubcomponent('vevent').getFirstPropertyValue('uid'))
  assert.equal(parsed(createEventCalendar({ ...event, location_name: null, address: '' }, now)).getFirstSubcomponent('vevent').hasProperty('location'), false)
  assert.equal(calendarMimeType, 'text/calendar;charset=utf-8')
})
check('Google prefill origin/route, UTC dates, IANA zone and Unicode parameter round trip', () => {
  const url = new URL(eventGoogleCalendarUrl(complex))
  assert.equal(url.origin, 'https://calendar.google.com')
  assert.equal(url.pathname, '/calendar/r/eventedit')
  assert.deepEqual([...url.searchParams.keys()].sort(), ['action', 'dates', 'etz', 'location', 'stz', 'text'])
  assert.equal(url.searchParams.get('action'), 'TEMPLATE')
  assert.equal(url.searchParams.get('dates'), '20270101T023000Z/20270101T040000Z')
  assert.equal(url.searchParams.get('text'), complex.title)
  assert.equal(url.searchParams.get('stz'), 'America/Argentina/Buenos_Aires')
  assert.equal(url.searchParams.get('etz'), 'America/Argentina/Buenos_Aires')
})
await mkdir(out, { recursive: true })
await writeFile(`${out}/unicode.ics`, ics)
await writeFile(`${out}/event.ics`, createEventCalendar(event, now))
await writeFile(`${out}/results.json`, JSON.stringify({ parser: 'ical.js 2.2.1 (QA-only, ignored install)', results }, null, 2) + '\n')
