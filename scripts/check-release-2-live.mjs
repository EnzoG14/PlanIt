// Opt-in, read-only QA against planit-v2. Never logs credentials or user content.
import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { loadEnv } from 'vite'
import { createClient } from '@supabase/supabase-js'

const output = 'docs/qa/evidence/release-2/live-readonly.json'
const results = []
const clients = []
let browser
const check = (test, status = 'PASS', detail) => {
  results.push({ test, status, ...(detail ? { detail } : {}) })
  console.log(`${status}: ${test}`)
}
const rows = async request => {
  const { data, error } = await request
  assert.equal(error, null, `REST failed (${error?.code ?? 'unknown'})`)
  return data ?? []
}
try {
  assert.ok(process.argv.includes('--readonly'), 'Explicit --readonly required; no signup or data mutations supported')
  const env = loadEnv('production', process.cwd(), 'VITE_')
  assert.equal(env.VITE_SUPABASE_URL, 'https://iepeqmvzjguwlhnecsdq.supabase.co')
  assert.ok(env.VITE_SUPABASE_PUBLISHABLE_KEY?.startsWith('sb_publishable_'))
  const accounts = JSON.parse(await readFile('.auth-test.local', 'utf8'))
  assert.ok(accounts.length >= 2, 'Two existing local test accounts required')
  const sessions = []
  for (const account of accounts.slice(0, 2)) {
    const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
    clients.push(client)
    const { data, error } = await client.auth.signInWithPassword({ email: account.email, password: account.password })
    assert.equal(error, null, `Test login failed (${error?.code ?? 'unknown'})`)
    assert.ok(data.session, 'Real session required')
    sessions.push(data.session)
  }
  assert.notEqual(sessions[0].user.id, sessions[1].user.id)
  check('Two isolated real Auth sessions; distinct identities')
  const profiles = []
  const chats = []
  const homePages = [], inboxPages = []
  let totalHome = 0, totalNotices = 0, totalPhotos = 0
  for (let i = 0; i < 2; i++) {
    const client = clients[i], ownId = sessions[i].user.id, otherId = sessions[1 - i].user.id
    const own = await rows(client.from('profiles').select('id,display_name,username,bio,avatar_file_id'))
    assert.equal(own.length, 1); assert.equal(own[0].id, ownId); profiles.push(own[0])
    assert.deepEqual(await rows(client.from('profiles').select('id,birth_date,sex').eq('id', otherId)), [])
    check(`Account ${i + 1}: own profile; direct cross-account private columns hidden by real REST/RLS`)
    const notices = await rows(client.from('notifications').select('id,recipient_id,read_at').limit(100))
    assert.ok(notices.every(row => row.recipient_id === ownId))
    assert.deepEqual(await rows(client.from('notifications').select('id').eq('recipient_id', otherId)), [])
    const inbox = await rows(client.rpc('get_notifications', { p_before_at: null, p_before_id: null }))
    inboxPages.push(inbox)
    totalNotices += inbox.length
    assert.ok(inbox.every(row => !Object.hasOwn(row, 'recipient_id')))
    check(`Account ${i + 1}: notification RPC and direct REST recipient isolation (${inbox.length} visible)`)
    const home = await rows(client.rpc('get_home_events', { p_before_starts_at: null, p_before_id: null, p_limit: 30 }))
    homePages.push(home)
    totalHome += home.length
    for (const event of home) {
      assert.equal(event.visibility, 'public'); assert.equal(event.cancelled_at, null); assert.equal(event.archived_at, null)
      const stored = await rows(client.from('events').select('id,title,category_id,starts_at').eq('id', event.id))
      assert.equal(stored.length, 1)
      for (const field of ['id', 'title', 'category_id', 'starts_at']) assert.equal(stored[0][field], event[field])
      const organizer = await rows(client.rpc('get_event_organizer', { p_event_id: event.id }))
      assert.ok(organizer.length === 1)
      assert.deepEqual(Object.keys(organizer[0]).sort(), ['display_name', 'username'])
      if (event.image_path) {
        const signed = await client.storage.from('event_media').createSignedUrl(event.image_path, 60)
        assert.equal(signed.error, null)
        const response = await fetch(signed.data.signedUrl, { signal: AbortSignal.timeout(15000) })
        assert.equal(response.status, 200); await response.arrayBuffer(); totalPhotos++
      }
    }
    check(`Account ${i + 1}: Home RPC and persisted detail/social projection (${home.length} rows)`)
    const conversations = await rows(client.from('conversations').select('id,event_id').limit(20))
    chats.push(conversations)
    for (const conversation of conversations) {
      const header = await rows(client.rpc('get_event_chat', { p_event_id: conversation.event_id }))
      assert.equal(header[0].conversation_id, conversation.id)
      const history = await rows(client.rpc('get_event_chat_messages', { p_event_id: conversation.event_id, p_before_at: null, p_before_id: null }))
      assert.ok(history.every(row => !Object.hasOwn(row, 'email') && !Object.hasOwn(row, 'birth_date') && !Object.hasOwn(row, 'sex')))
    }
    check(`Account ${i + 1}: authorized chat header/history REST (${conversations.length} conversations)`)
    for (const section of ['organizing', 'participating']) await rows(client.rpc('get_my_events', { p_section: section, p_offset: 0 }))
    check(`Account ${i + 1}: R1 My events organizing/participating RPC smoke`)
  }
  let outsiders = 0
  for (let i = 0; i < 2; i++) for (const chat of chats[1 - i]) {
    if (chats[i].some(own => own.id === chat.id)) continue
    assert.deepEqual(await rows(clients[i].from('messages').select('id').eq('conversation_id', chat.id)), [])
    const denied = await clients[i].rpc('get_event_chat_messages', { p_event_id: chat.event_id, p_before_at: null, p_before_id: null })
    assert.ok(denied.error || denied.data?.length === 0)
    outsiders++
  }
  check('Direct outsider chat/history access', outsiders ? 'PASS' : 'PENDING', outsiders ? `${outsiders} existing inaccessible conversations` : 'No disjoint membership in the existing test data')
  const anon = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  for (const table of ['profiles', 'conversations', 'messages', 'notifications']) {
    const denied = await anon.from(table).select('id').limit(1)
    assert.ok(denied.error, `Anonymous ${table} SELECT must be denied`)
  }
  for (const rpc of ['get_home_events', 'get_notifications']) assert.ok((await anon.rpc(rpc)).error)
  check('Anonymous real REST SELECT and RPC denied')

  const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
  browser = await chromium.launch({ headless: true, channel: 'msedge' })
  for (let i = 0; i < 2; i++) {
    const context = await browser.newContext({ viewport: i ? { width:1280,height:900 } : { width:375,height:812 }, timezoneId: 'Asia/Tokyo' })
    await context.addInitScript(session => localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token', JSON.stringify(session)), sessions[i])
    const page = await context.newPage(); page.setDefaultTimeout(15000)
    const origin = process.env.PLANIT_UI_ORIGIN ?? 'http://127.0.0.1:4180'
    await page.goto(origin + '/me')
    await page.getByText('@' + profiles[i].username, { exact: true }).waitFor()
    assert.equal(await page.getByText('@' + profiles[1-i].username, { exact:true }).count(), 0)
    await page.reload(); await page.getByText('@' + profiles[i].username, { exact:true }).waitFor()
    check(`Real browser ${i+1}: own profile, no other identity, reload restores session`)
    await page.goto(origin + '/home'); await page.getByRole('heading', { name:'Inicio',exact:true }).waitFor()
    await page.locator('[aria-busy="false"]').first().waitFor()
    assert.equal(await page.getByRole('heading', { name:'No se pudo cargar Inicio' }).count(), 0)
    if (homePages[i][0]) {
      const event = homePages[i][0]
      await page.locator(`a[href="/events/${event.id}"]`).first().click()
      await page.getByRole('heading', { name:event.title,exact:true }).waitFor()
      const social = await rows(clients[i].rpc('get_event_organizer', { p_event_id:event.id }))
      await page.getByText('@' + social[0].username, { exact:true }).waitFor()
      if (event.image_path) await page.locator('.event-hero img').evaluate(image => image.decode())
      check(`Real browser ${i+1}: Home card opens persisted detail, organizer and available photo`)
    }
    await page.goto(origin + '/notifications')
    await page.locator('section[aria-label="Tus avisos"][aria-busy="false"]').waitFor()
    assert.equal(await page.getByRole('heading', { name:'No se pudo cargar',exact:true }).count(), 0)
    if (inboxPages[i][0]) {
      await page.getByRole('heading', { name:inboxPages[i][0].title,exact:true }).waitFor()
      assert.ok(await page.locator('.notification-row time').first().getAttribute('datetime'))
      check(`Real browser ${i+1}: persisted notification content and timestamp displayed`)
    } else {
      await page.getByRole('heading', { name:'Todavía no tenés notificaciones',exact:true }).waitFor()
      assert.equal(await page.locator('.notification-row').count(),0)
      check(`Real browser ${i+1}: empty notification inbox is explicit`)
    }
    check(`Real browser ${i+1}: Home and notification inbox read against live REST`)
    if (chats[i][0]) {
      await page.goto(origin + '/events/' + chats[i][0].event_id + '/chat')
      await page.getByRole('heading', { name:(await rows(clients[i].rpc('get_event_chat', { p_event_id:chats[i][0].event_id })))[0].title,exact:true }).waitFor()
      await page.getByText('Mensajes en tiempo real.', { exact:true }).waitFor()
      assert.equal(await page.getByRole('heading', { name:'No se pudo cargar',exact:true }).count(),0)
      check(`Real browser ${i+1}: existing authorized chat opens`)
      check(`Real browser ${i+1}: authenticated Realtime channel connects (not message delivery)`)
    }
    await context.close()
  }
  check('Notification mark-read E2E', 'PENDING', 'Read-only run; no writes')
  check('Real send/delivery/reconnect/expiry and closed-event E2E', 'PENDING', 'No messages inserted and no event state changed; fixtures/SQL cover these cases separately')
  check('Real Storage signed photo download', totalPhotos ? 'PASS' : 'PENDING', `${totalPhotos} existing home photos fetched`)
  if (!totalHome) check('Populated Home/categories/detail browser E2E', 'PENDING', 'No available events for these accounts; not seeded')
  if (!totalNotices) check('Empty real notification inboxes', 'PASS')
} catch (error) {
  check('Live read-only run', 'FAIL', error instanceof assert.AssertionError ? 'Assertion failed; inspect the script and last completed check locally' : error?.name ?? 'request_failed')
  process.exitCode = 1
} finally {
  if (browser) await browser.close()
  for (const client of clients) { await client.removeAllChannels(); await client.auth.signOut({ scope: 'local' }) }
  await mkdir('docs/qa/evidence/release-2', { recursive:true })
  await writeFile(output, JSON.stringify({ environment:'Real Auth/REST/Storage and Edge; existing local test accounts; no fixtures, signup, SQL or data mutations', results }, null, 2))
}
