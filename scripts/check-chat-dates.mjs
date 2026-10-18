import assert from 'node:assert/strict'
import { argentinaDay, chatDay, chatDayLabel, chatTime, isChatContinuation } from '../src/lib/chatDates.ts'

assert.equal(chatTime('2026-10-14T00:02:00.123456'), '00:02')
assert.equal(chatTime('2026-10-14T23:59:00'), '23:59')
assert.equal(chatDay('2026-10-14T23:59:00'), '2026-10-14')
assert.equal(argentinaDay(new Date('2027-01-01T02:59:59Z')), '2026-12-31')
assert.equal(argentinaDay(new Date('2027-01-01T03:00:00Z')), '2027-01-01')
assert.equal(chatDayLabel('2027-01-01', '2027-01-01'), 'Hoy')
assert.equal(chatDayLabel('2026-12-31', '2027-01-01'), 'Ayer')
assert.equal(chatDayLabel('2028-02-29', '2028-03-01'), 'Ayer')
assert.equal(chatDayLabel('2026-10-14', '2026-10-18'), '14 de octubre de 2026')
const message = { sender_id: 'alice', created_at: '2026-10-14T23:59:00' }
assert.equal(isChatContinuation(message), false)
assert.equal(isChatContinuation({ ...message, created_at: '2026-10-14T23:59:30' }, message), true)
assert.equal(isChatContinuation({ ...message, sender_id: 'bob' }, message), false)
assert.equal(isChatContinuation({ ...message, created_at: '2026-10-15T00:00:00' }, message), false)
console.log('PASS chat dates: Argentina midnight, 24h, fractional seconds, leap day, month/year rollover')
