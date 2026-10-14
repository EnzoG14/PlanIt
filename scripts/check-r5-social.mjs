import assert from 'node:assert/strict'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:net'
import { createHash, randomUUID } from 'node:crypto'

// Real local PostgreSQL and SET ROLE. Auth/Storage are SQL scaffolds, not real
// JWT, PostgREST, Storage transport or Realtime. Never connect to remote DB.
const toolsRoot = process.env.PLANIT_TEST_TOOLS_DIR ?? '.participation-test-tools.local/node_modules'
const [{ default: pg }, { initdb, pg_ctl }] = await Promise.all([
  import(pathToFileURL(resolve(toolsRoot, 'pg/lib/index.js')).href),
  import(pathToFileURL(resolve(toolsRoot, '@embedded-postgres/windows-x64/dist/index.js')).href),
])
const run = promisify(execFile)
const directory = resolve(`.r5-postgres-${Date.now()}.local`)
const out = process.env.PLANIT_SQL_OUTPUT ?? 'docs/qa/r5-block-1'
const probe = createServer()
await new Promise(r => probe.listen(0, '127.0.0.1', r))
const port = probe.address().port
await new Promise(r => probe.close(r))
const clients = [], results = [], migrations = []
const users = Array.from({ length: 4 }, (_, i) => `50000000-0000-4000-8000-00000000000${i + 1}`)
const [aId, bId, cId, dId] = users
const hash = value => createHash('sha256').update(value.replace(/\r\n/g, '\n')).digest('hex')
let started = false, version, remoteComparison, failure
const record = test => { results.push({ test, result: 'PASS' }); console.log(`PASS: ${test}`) }
async function connect() {
  const c = new pg.Client({ host: '127.0.0.1', port, user: 'postgres', database: 'postgres', connectionTimeoutMillis: 5000, query_timeout: 10000 })
  await c.connect(); clients.push(c); await c.query("set statement_timeout = '8s'"); return c
}
async function role(c, id) {
  await c.query('reset role')
  await c.query("select set_config('request.jwt.claim.sub',$1,false)", [id ?? ''])
  await c.query(`set role ${id ? 'authenticated' : 'anon'}`)
}
const value = async (c, sql, args = []) => Object.values((await c.query(sql, args)).rows[0])[0]
const denied = promise => assert.rejects(promise, error => error.code === '42501')
const invalid = promise => assert.rejects(promise, error => error.code === '22023')
const follow = (c, target) => value(c, 'select public.follow_user($1)', [target])
const block = (c, target) => c.query('select public.block_user($1)', [target])
const unblock = (c, target) => c.query('select public.unblock_user($1)', [target])
const profile = (c, target) => value(c, 'select public.get_social_profile($1)', [target])
const privacy = (c, id, visibility, username) => value(c,
  'select public.update_my_social_profile($1,$2,null,null,null,null,$3,$4)',
  [username ?? `fixture_${users.indexOf(id)}`, `Persona ${users.indexOf(id)}`, 'Bio de fixture', visibility])
const dm = (c, target) => value(c, 'select public.get_or_create_direct_conversation($1)', [target])
const send = (c, conversation, id = randomUUID(), body = 'Texto de fixture') => value(c,
  'select public.send_direct_message($1,$2,$3)', [conversation, id, body])

try {
  await mkdir(out, { recursive: true })
  await run(initdb, ['-D', directory, '-U', 'postgres', '-A', 'trust', '--encoding=UTF8', '--locale=C'], { windowsHide: true, timeout: 30000 })
  await run(pg_ctl, ['-D', directory, '-l', `${directory}/server.log`, '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start'], { windowsHide: true, timeout: 30000 }); started = true
  const admin = await connect()
  version = await value(admin, 'select version()')
  await admin.query(`create role anon; create role authenticated; create role service_role;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key,raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth,storage to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner_id text,metadata jsonb);
    alter table storage.objects enable row level security;
    grant select,insert,update,delete on storage.objects to authenticated;
    create function public.rls_auto_enable() returns event_trigger language plpgsql as $$ begin end $$;`)
  // Reconfirm the baseline against a fresh remote READ ONLY catalog, if provided.
  const catalogPath = process.env.PLANIT_R5_CATALOG
  const catalog = catalogPath ? JSON.parse(await readFile(catalogPath, 'utf8')).rows[0].metadata : null
  const files = (await readdir('supabase/migrations')).filter(f => f.endsWith('.sql')).sort()
  const historical = files.filter(f => f.split('_')[0] <= '20261014120006')
  if (catalog) assert.deepEqual(catalog.migrations.map(m => m.version), historical.map(f => f.split('_')[0]))
  for (const file of files) {
    const sql = await readFile(`supabase/migrations/${file}`, 'utf8')
    if (sql.trim()) await admin.query(sql)
    migrations.push({ file, sha256_lf: hash(sql) })
    if (catalog && file === historical.at(-1)) {
      const local = (await admin.query(`select n.nspname as schema,p.proname as name,
        pg_get_function_identity_arguments(p.oid) as identity_arguments,pg_get_functiondef(p.oid) as definition,
        p.prosecdef as definer,p.proconfig as config,has_function_privilege('anon',p.oid,'execute') as anon_execute,
        has_function_privilege('authenticated',p.oid,'execute') as authenticated_execute
        from pg_proc p join pg_namespace n on n.oid=p.pronamespace
        where n.nspname in ('public','planit_private') and p.prokind='f'`)).rows
      remoteComparison = catalog.functions.filter(f => f.name !== 'rls_auto_enable').map(f => {
        const l = local.find(l => l.schema === f.schema && l.name === f.name && l.identity_arguments === f.identity_arguments)
        return { name: `${f.schema}.${f.name}`, body: !!l && hash(l.definition) === hash(f.definition),
          acl: !!l && l.anon_execute === f.anon_execute && l.authenticated_execute === f.authenticated_execute,
          config: !!l && l.definer === f.definer && JSON.stringify(l.config) === JSON.stringify(f.config) }
      })
      assert.ok(remoteComparison.every(r => r.body && r.acl && r.config))
      await writeFile(`${out}/remote-baseline.json`, JSON.stringify({ remote_version: catalog.server_version,
        migrations: catalog.migrations, tables: catalog.tables.map(t => ({ name: t.name, rls: t.rls })),
        functions: remoteComparison, result: 'PASS' }, null, 2) + '\n')
      record('Fresh remote read-only baseline: 25 migrations and 55 bodies/ACL/config match local replay')
    }
  }
  for (const [i, id] of users.entries()) await admin.query('insert into auth.users values($1,$2)', [id, { display_name: `Persona ${i}` }])
  await admin.query("update public.profiles set username='fixture_' || (right(id::text,1)::int-1),bio='Bio de fixture',birth_date='2000-01-01',sex='other'")
  const [a, b, c, d, anon, missing] = await Promise.all(Array.from({ length: 6 }, connect))
  await Promise.all([role(a,aId),role(b,bId),role(c,cId),role(d,dId),role(anon,null),role(missing,null)])
  await missing.query('set role authenticated')

  assert.equal((await a.query('select * from public.profiles')).rowCount, 1)
  assert.equal((await a.query('select * from public.profiles where id=$1',[bId])).rowCount, 0)
  await denied(anon.query('select * from public.profiles'))
  await denied(a.query("update public.profiles set visibility='private'"))
  await denied(a.query('update public.profiles set avatar_file_id=null'))
  assert.equal((await a.query("update public.profiles set bio='Forbidden' where id=$1",[bId])).rowCount,0)
  for (const table of ['user_follows','user_blocks','conversations','messages']) {
    await denied(a.query(`delete from public.${table}`))
    await denied(anon.query(`select * from public.${table}`))
  }
  await denied(a.query('insert into public.user_blocks(blocker_id,blocked_id) values($1,$2)',[aId,bId]))
  await denied(a.query("insert into public.user_follows(follower_id,followed_id,status) values($1,$2,'pending')",[aId,bId]))
  for (const actor of [anon,missing]) {
    await denied(profile(actor,bId)); await denied(follow(actor,bId)); await denied(block(actor,bId)); await denied(dm(actor,bId))
    await denied(privacy(actor,aId,'public'))
  }
  await invalid(follow(a,aId)); await invalid(block(a,aId)); await invalid(dm(a,aId))
  await denied(a.query('select planit_private.lock_social_pair($1)',[bId]))
  await denied(a.query('select public.get_social_avatar_for_signing($1,$2)',[aId,bId]))
  const acl = (await admin.query(`select n.nspname as schema,p.proname,p.proconfig,
      has_function_privilege('anon',p.oid,'execute') as anon from pg_proc p
      join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','planit_private') and p.prokind='f'`)).rows
  assert.ok(acl.every(f => !f.anon))
  assert.ok(acl.filter(f => f.proname !== 'rls_auto_enable').every(f => f.proconfig?.includes('search_path=""')))
  assert.equal(await value(admin,"select count(*)::int from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity"),0)
  record('A/B/C/D/anon: own profiles only; PATCH visibility/avatar and forged writes denied; DEFINER ACL/search_path audited')

  // Cross-product revalidation, no cached results and no sensitive fields.
  let combinations = 0
  for (const visibility of ['public','private']) for (const status of [null,'pending','accepted','rejected']) for (const direction of [null,'outgoing','incoming']) {
    await admin.query('delete from public.user_follows'); await admin.query('delete from public.user_blocks')
    await admin.query('update public.profiles set visibility=$1 where id=$2',[visibility,bId])
    for (const viewer of [aId,cId,dId]) if (status) await admin.query(`insert into public.user_follows(follower_id,followed_id,status,responded_at)
        values($1,$2,$3,case when $3='pending' then null else clock_timestamp() at time zone 'America/Argentina/Buenos_Aires' end)`,[viewer,bId,status])
    for (const viewer of [aId,cId,dId]) if (direction) await admin.query('insert into public.user_blocks(blocker_id,blocked_id) values($1,$2)',direction==='outgoing'?[viewer,bId]:[bId,viewer])
    for (const viewer of [a,c,d]) {
      const p = await profile(viewer,bId)
      if (direction) assert.deepEqual(p,{unavailable:true})
      else assert.deepEqual(Object.keys(p).sort(), (visibility==='public'||status==='accepted'?['avatar','bio','display_name','username']:['avatar','display_name','username']))
      combinations++
    }
  }
  assert.equal(combinations,72)
  await admin.query('delete from public.user_follows'); await admin.query('delete from public.user_blocks')
  record('72 profile audience combinations: public/private × none/pending/accepted/rejected × bilateral block × three viewers')

  await privacy(b,bId,'private')
  const first = await follow(a,bId)
  assert.equal(first.status,'pending'); assert.deepEqual(await follow(a,bId),first)
  const pendingPage = await value(b,'select public.list_follow_requests(null,null,1)')
  assert.equal(pendingPage.requests.length,1)
  assert.equal(pendingPage.requests[0].request_version,first.request_version)
  assert.equal((await value(c,'select public.list_follow_requests()')).requests.length,0)
  await invalid(value(b,'select public.list_follow_requests(null,$1)',[aId]))
  await invalid(value(b,'select public.list_follow_requests(null,null,0)'))
  await denied(value(a,"select public.list_social_follows($1,'followers')",[bId]))
  await denied(value(a,'select public.get_social_counts($1)',[bId]))
  assert.equal((await c.query('select * from public.user_follows')).rowCount,0)
  await denied(value(c,'select public.resolve_follow_request($1,$2,$3)',[aId,first.request_version,'accepted']))
  assert.equal(await value(b,'select public.resolve_follow_request($1,$2,$3)',[aId,first.request_version,'rejected']),'rejected')
  assert.equal(await value(b,'select public.resolve_follow_request($1,$2,$3)',[aId,first.request_version,'rejected']),'rejected')
  const renewed = await follow(a,bId)
  assert.notEqual(renewed.request_version,first.request_version)
  await denied(value(b,'select public.resolve_follow_request($1,$2,$3)',[aId,first.request_version,'accepted']))
  await value(b,'select public.resolve_follow_request($1,$2,$3)',[aId,renewed.request_version,'accepted'])
  await invalid(value(b,'select public.resolve_follow_request($1,$2,$3)',[aId,renewed.request_version,'rejected']))
  assert.ok('bio' in await profile(a,bId))
  assert.equal((await value(a,"select public.list_social_follows($1,'followers')",[bId])).users[0].user_id,aId)
  await a.query('select public.unfollow_user($1)',[bId]); await a.query('select public.unfollow_user($1)',[bId])
  assert.ok(!('bio' in await profile(a,bId)))
  record('Follow/resolve/unfollow: idempotent active request, rejected renewal, stale generation denied, accepted revocation')

  await privacy(b,bId,'public')
  await follow(a,bId); await follow(c,bId); await follow(d,bId)
  const followersPage = await value(a,"select public.list_social_follows($1,'followers',null,1)",[bId])
  const followersNext = await value(a,"select public.list_social_follows($1,'followers',$2,1)",[bId,followersPage.next_cursor])
  assert.notEqual(followersPage.users[0].user_id,followersNext.users[0].user_id)
  assert.equal((await value(a,'select public.get_social_counts($1)',[bId])).followers,3)
  await block(a,cId)
  assert.equal((await value(a,'select public.get_social_counts($1)',[bId])).followers,2)
  assert.equal((await value(a,"select public.list_social_follows($1,'followers')",[bId])).users.length,2)
  assert.equal((await value(b,'select public.get_social_counts($1)',[bId])).followers,3)
  await unblock(a,cId)
  for(const viewer of [a,c,d]) await viewer.query('select public.unfollow_user($1)',[bId])
  record('Requests/follows/counts: own pending only; private audience gate; keyset pages; bilateral viewer filtering before count/pagination')

  // D04 0/1/N, rejected untouched, rollback injected after profile UPDATE.
  assert.equal((await privacy(b,bId,'public')).accepted_requests,0)
  await privacy(b,bId,'private'); await follow(a,bId)
  assert.equal((await privacy(b,bId,'public')).accepted_requests,1)
  assert.equal((await privacy(b,bId,'public')).accepted_requests,0)
  await privacy(b,bId,'private'); await a.query('select public.unfollow_user($1)',[bId])
  await follow(a,bId); const reject = await follow(c,bId)
  await value(b,'select public.resolve_follow_request($1,$2,$3)',[cId,reject.request_version,'rejected'])
  await follow(d,bId)
  await admin.query(`create function planit_private.r5_test_fail_accept() returns trigger language plpgsql as $$ begin
    if new.status='accepted' then raise exception 'injected_accept_failure'; end if; return new; end $$;
    create trigger r5_test_fail_accept before update on public.user_follows for each row execute function planit_private.r5_test_fail_accept()`)
  await assert.rejects(privacy(b,bId,'public'), /injected_accept_failure/)
  assert.equal(await value(admin,'select visibility from public.profiles where id=$1',[bId]),'private')
  assert.equal(await value(admin,"select count(*)::int from public.user_follows where followed_id=$1 and status='pending'",[bId]),2)
  await admin.query('drop trigger r5_test_fail_accept on public.user_follows; drop function planit_private.r5_test_fail_accept()')
  assert.equal((await privacy(b,bId,'public')).accepted_requests,2)
  assert.equal(await value(admin,'select status from public.user_follows where follower_id=$1 and followed_id=$2',[cId,bId]),'rejected')
  await privacy(b,bId,'private')
  assert.ok('bio' in await profile(a,bId))
  await assert.rejects(privacy(b,bId,'public','fixture_0'),e=>e.code==='23505')
  assert.equal(await value(admin,'select visibility from public.profiles where id=$1',[bId]),'private')
  record('D04 0/1/N, repeat, public→private retains accepted; rejected unchanged; injected failure and invalid username roll back')

  const conversation = await dm(a,bId)
  assert.equal(await dm(b,aId),conversation)
  const messageId = randomUUID()
  assert.equal(await send(a,conversation,messageId),messageId)
  assert.equal(await send(a,conversation,messageId),messageId)
  await invalid(send(a,conversation,messageId,'Different'))
  for (const body of ['', ' ', '\u00a0\u200b'.replace('\u200b',''), 'x'.repeat(2001)]) await invalid(send(a,conversation,randomUUID(),body))
  await denied(send(c,conversation))
  assert.equal((await c.query('select * from public.messages where conversation_id=$1',[conversation])).rowCount,0)
  await denied(value(c,'select public.get_direct_messages($1)',[conversation]))
  assert.equal((await value(b,'select public.get_direct_messages($1)',[conversation])).messages.length,1)
  await block(a,bId); await block(a,bId)
  assert.deepEqual(await profile(a,bId),{unavailable:true}); assert.deepEqual(await profile(b,aId),{unavailable:true})
  assert.equal(await value(admin,'select count(*)::int from public.user_follows where $1 in (follower_id,followed_id) and $2 in (follower_id,followed_id)',[aId,bId]),0)
  assert.equal((await b.query('select * from public.user_blocks')).rowCount,0)
  await denied(follow(a,bId)); await denied(follow(b,aId)); await denied(dm(b,aId))
  await denied(send(a,conversation)); await denied(send(b,conversation))
  assert.equal(await send(a,conversation,messageId),messageId)
  assert.equal((await value(a,'select public.get_direct_messages($1)',[conversation])).messages.length,1)
  assert.equal((await value(b,'select public.list_direct_conversations()')).conversations[0].read_only,true)
  await block(b,aId); await unblock(a,bId)
  await denied(send(a,conversation)); await unblock(b,aId)
  assert.equal(await dm(a,bId),conversation)
  assert.equal(await value(admin,'select count(*)::int from public.user_follows where follower_id=$1 and followed_id=$2',[aId,bId]),0)
  await send(b,conversation)
  record('DM canonical pair, sender/body/UUID retry, bilateral block cleans follows, historical read, own unblock only, no restoration')

  // Stable message cursor and no event-chat mixing.
  const page1 = await value(a,'select public.get_direct_messages($1,null,null,1)',[conversation])
  const page2 = await value(a,'select public.get_direct_messages($1,$2,$3,1)',[conversation,page1.next_cursor.created_at,page1.next_cursor.id])
  assert.notEqual(page1.messages[0].id,page2.messages[0].id); assert.equal(page2.next_cursor,null)
  await invalid(value(a,'select public.get_direct_messages($1,null,$2)',[conversation,messageId]))
  await invalid(value(a,'select public.get_direct_messages($1,null,null,51)',[conversation]))
  record('DM pagination uses server timestamp + UUID, disjoint pages and bounded cursor validation')

  const now = "clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'"
  const cat = await value(admin,'select id from public.categories limit 1')
  const event = async visibility => value(admin,`insert into public.events(organizer_id,category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity,visibility)
    values($1,$2,'Evento fixture','Descripción',(${now})+interval '1 day',(${now})+interval '2 days','Dirección',0,0,10,$3) returning id`,[aId,cat,visibility])
  const pub = await event('public'), hidden = await event('unlisted')
  await admin.query('insert into public.event_access_grants(event_id,user_id) values($1,$2),($1,$3)',[hidden,bId,cId])
  await b.query('select public.register_for_event($1)',[hidden])
  await b.query('select public.register_for_event($1)',[pub])
  await d.query('select public.register_for_event($1)',[pub])
  await denied(value(c,'select public.get_event_social_participants($1)',[hidden]))
  await denied(value(d,'select public.get_event_social_participants($1)',[hidden]))
  assert.equal((await value(b,'select public.get_event_social_participants($1)',[hidden])).participants.length,1)
  await denied(value(b,'select public.get_event_attendees($1)',[hidden]))
  await privacy(a,aId,'private')
  await denied(value(c,'select public.get_social_profile_events($1)',[aId]))
  await follow(c,aId); await privacy(a,aId,'public')
  const eventProfile = await value(c,'select public.get_social_profile_events($1)',[aId])
  assert.deepEqual(eventProfile.events.map(e=>e.id),[pub])
  const groupMessage = randomUUID()
  await b.query('select public.send_event_chat_message($1,$2,$3)',[hidden,groupMessage,'Grupo fixture'])
  await block(a,bId)
  assert.equal((await value(a,'select public.get_event_social_participants($1)',[hidden])).participants.length,0)
  assert.equal((await b.query('select * from public.get_event_organizer($1)',[hidden])).rowCount,0)
  assert.equal((await b.query('select * from public.events where id=$1',[hidden])).rowCount,1)
  assert.equal((await b.query('select * from public.events where id=$1',[pub])).rowCount,1)
  await denied(value(b,'select public.get_social_profile_events($1)',[aId]))
  const attendees = await value(a,'select public.get_event_attendees($1)',[hidden])
  assert.equal(attendees.attendees[0].display_name,'Perfil no disponible'); assert.equal(attendees.attendees[0].username,'')
  assert.equal((await value(a,"select public.get_event_attendees($1,'confirmed','Persona 1')",[hidden])).attendees.length,0)
  const grants = await value(a,'select public.get_event_access_grants($1)',[hidden])
  assert.equal(grants.grants.find(g=>g.user_id===bId).display_name,'Perfil no disponible')
  assert.equal((await b.query('select * from public.get_event_chat_messages($1)',[hidden])).rows[0].display_name,'Persona 1')
  await b.query('select public.send_event_chat_message($1,$2,$3)',[hidden,randomUUID(),'Grupo bajo bloqueo'])
  const eventConversation = await value(admin,'select id from public.conversations where event_id=$1',[hidden])
  await denied(send(a,eventConversation))
  await denied(value(a,'select public.get_direct_messages($1)',[eventConversation]))
  await a.query('select public.revoke_event_access($1,$2)',[hidden,bId])
  await denied(value(b,'select public.get_event_social_participants($1)',[hidden]))
  await denied(b.query('select * from public.get_event_chat($1)',[hidden]))
  await a.query('select public.restore_event_access($1,$2)',[hidden,bId])
  await b.query('select public.request_rejoin($1)',[hidden])
  const rejoin = await value(a,'select public.get_event_rejoin_requests($1)',[hidden])
  assert.equal(rejoin.requests[0].display_name,'Perfil no disponible')
  await unblock(a,bId)
  await denied(value(b,'select public.get_event_social_participants($1)',[hidden]))
  record('R3/R4: grant-only denied social participants; public-only social events; C01 neutral admin identities; C02 event access intact; group chat unchanged; revoked/removed denied')

  const avatarPath = `${bId}/avatar.png`
  await b.query(`insert into storage.objects(bucket_id,name,owner_id,metadata) values('avatars',$1,$2,'{"mimetype":"image/png","size":1024,"cacheControl":"max-age=0"}')`,[avatarPath,bId])
  const avatarId = await value(b,'select public.set_my_avatar($1)',[avatarPath])
  assert.equal(await value(b,'select public.set_my_avatar($1)',[avatarPath]),avatarId)
  assert.equal((await a.query("select * from storage.objects where bucket_id='avatars'")).rowCount,0)
  assert.equal((await a.query('select * from public.files where id=$1',[avatarId])).rowCount,0)
  assert.equal((await b.query('delete from storage.objects where name=$1',[avatarPath])).rowCount,0)
  await denied(value(a,'select public.set_my_avatar($1)',[avatarPath]))
  await denied(a.query('insert into public.event_images(event_id,file_id,sort_order) values($1,$2,0)',[pub,avatarId]))
  await assert.rejects(admin.query('update public.profiles set avatar_file_id=$1 where id=$2',[avatarId,aId]),e=>e.code==='23514')
  assert.equal(await value(admin,'select public.get_social_avatar_for_signing($1,$2)',[aId,bId]),avatarPath)
  await block(a,bId)
  assert.equal(await value(admin,'select public.get_social_avatar_for_signing($1,$2)',[aId,bId]),null)
  assert.equal(await value(admin,'select public.get_social_avatar_for_signing($1,$2)',[bId,aId]),null)
  await unblock(a,bId)
  await denied(value(b,'select public.set_my_avatar($1)',[`${bId}/missing.png`]))
  const cachedAvatarPath = `${bId}/unsafe-cache.png`
  await b.query(`insert into storage.objects(bucket_id,name,owner_id,metadata) values('avatars',$1,$2,'{"mimetype":"image/png","size":1024,"cacheControl":"max-age=3600"}')`,[cachedAvatarPath,bId])
  await denied(value(b,'select public.set_my_avatar($1)',[cachedAvatarPath]))
  assert.equal(await value(admin,'select avatar_file_id from public.profiles where id=$1',[bId]),avatarId)
  await value(b,'select public.set_my_avatar(null)')
  assert.equal(await value(admin,'select avatar_file_id from public.profiles where id=$1',[bId]),null)
  assert.equal((await b.query('delete from storage.objects where name=$1',[avatarPath])).rowCount,0)
  record('Avatar SQL: immutable private bucket, owner/purpose/metadata, no third-party direct signing, bilateral signing gate, failed replace retains previous reference')

  const directNotification = randomUUID()
  await admin.query("insert into public.notifications(id,recipient_id,conversation_id,type,title) values($1,$2,$3,'fixture','Fixture')",[directNotification,aId,conversation])
  assert.equal(await value(a,'select public.get_notification_target($1)',[directNotification]),null)
  record('Notification target never constructs an event URL for a direct conversation; no new DM notification producer')

  // Real lock waits. Winner remains uncommitted while loser waits on profiles.
  async function race(label, winner, winnerSql, winnerArgs, loser, loserSql, loserArgs, expectDenied = false) {
    await winner.query('begin')
    await winner.query(winnerSql,winnerArgs)
    const pid = await value(loser,'select pg_backend_pid()')
    const pending = loser.query(loserSql,loserArgs).then(result=>({result}),error=>({error}))
    let waiting = false
    for (let i=0;i<100;i++) {
      waiting = await value(admin,"select coalesce((select wait_event_type='Lock' from pg_stat_activity where pid=$1),false)",[pid])
      if (waiting) break
      await new Promise(r=>setTimeout(r,10))
    }
    assert.ok(waiting,`${label}: real lock wait required`)
    await winner.query('commit')
    const outcome = await pending
    if(expectDenied) assert.equal(outcome.error?.code,'42501')
    else { if(outcome.error) throw outcome.error }
    record(`Concurrency: ${label}; observed PostgreSQL lock wait, completed without deadlock`)
    return outcome.result
  }
  await admin.query('delete from public.user_follows'); await admin.query('delete from public.user_blocks')
  await privacy(b,bId,'private')
  const privacySql = 'select public.update_my_social_profile($1,$2,null,null,null,null,$3,$4)'
  const privacyArgs = ['fixture_1','Persona 1','Bio de fixture','public']
  await race('privacy wins vs follow',b,privacySql,privacyArgs,a,'select public.follow_user($1)',[bId])
  assert.equal(await value(admin,'select status from public.user_follows where follower_id=$1 and followed_id=$2',[aId,bId]),'accepted')
  await a.query('select public.unfollow_user($1)',[bId]); await privacy(b,bId,'private')
  await race('follow wins vs privacy',a,'select public.follow_user($1)',[bId],b,privacySql,privacyArgs)
  assert.equal(await value(admin,'select status from public.user_follows where follower_id=$1 and followed_id=$2',[aId,bId]),'accepted')
  await privacy(b,bId,'private')
  await race('block wins vs privacy',a,'select public.block_user($1)',[bId],b,privacySql,privacyArgs)
  assert.equal(await value(admin,'select count(*)::int from public.user_follows where follower_id=$1 and followed_id=$2',[aId,bId]),0)
  await unblock(a,bId); await privacy(b,bId,'private'); await follow(a,bId)
  await race('privacy wins vs block',b,privacySql,privacyArgs,a,'select public.block_user($1)',[bId])
  assert.equal(await value(admin,'select count(*)::int from public.user_follows where follower_id=$1 and followed_id=$2',[aId,bId]),0)
  await unblock(a,bId)
  await race('block wins vs send',a,'select public.block_user($1)',[bId],b,'select public.send_direct_message($1,$2,$3)',[conversation,randomUUID(),'Denied race'],true)
  await unblock(a,bId)
  await race('send wins vs block',a,'select public.send_direct_message($1,$2,$3)',[conversation,randomUUID(),'Committed before block'],b,'select public.block_user($1)',[aId])
  await denied(send(a,conversation)); await unblock(b,aId)
  await race('block wins vs follow',a,'select public.block_user($1)',[bId],b,'select public.follow_user($1)',[aId],true)
  await unblock(a,bId)
  const concurrentDm = await race('A→C and C→A create same DM',a,'select public.get_or_create_direct_conversation($1)',[cId],c,'select public.get_or_create_direct_conversation($1)',[aId])
  assert.equal(Object.values(concurrentDm.rows[0])[0],await dm(a,cId))
  await race('privacy vs third-party follow',b,privacySql,privacyArgs,c,'select public.follow_user($1)',[bId])
  // Two separate sessions for the same actor, not two operations on one connection.
  const b2 = await connect(); await role(b2,bId)
  await privacy(b,bId,'private')
  await race('same actor simultaneous private→public',b,privacySql,privacyArgs,b2,privacySql,privacyArgs)
  await race('opposite block directions',a,'select public.block_user($1)',[bId],b,'select public.block_user($1)',[aId])
  await unblock(a,bId); await unblock(b,aId)
  const raceAvatarPath = `${bId}/race-avatar.png`
  await b.query(`insert into storage.objects(bucket_id,name,owner_id,metadata) values('avatars',$1,$2,'{"mimetype":"image/png","size":1024,"cacheControl":"max-age=0"}')`,[raceAvatarPath,bId])
  const deletion = await race('avatar registration wins vs deletion',b,'select public.set_my_avatar($1)',[raceAvatarPath],b2,'delete from storage.objects where name=$1',[raceAvatarPath])
  assert.equal(deletion.rowCount,0)
  const deletedAvatarPath = `${bId}/deleted-avatar.png`
  await b.query(`insert into storage.objects(bucket_id,name,owner_id,metadata) values('avatars',$1,$2,'{"mimetype":"image/png","size":1024,"cacheControl":"max-age=0"}')`,[deletedAvatarPath,bId])
  await race('avatar deletion wins vs registration',b,'delete from storage.objects where name=$1',[deletedAvatarPath],b2,'select public.set_my_avatar($1)',[deletedAvatarPath],true)
  assert.equal(await value(admin,"select count(*)::int from public.user_follows where followed_id=$1 and status='pending'",[bId]),0)
  await a.query('begin isolation level repeatable read')
  await assert.rejects(follow(a,bId),e=>e.code==='40001'); await a.query('rollback')
  record('Frozen snapshots rejected; concurrent mutations leave no residual pending requests')

  // Retain invariants independent of API callers.
  await assert.rejects(admin.query("insert into public.conversations(kind,user_low_id,user_high_id) values('direct',$1,$1)",[aId]),e=>e.code==='23514')
  await assert.rejects(admin.query("insert into public.conversations(kind,user_low_id,user_high_id) values('direct',$1,$2)",[bId,aId]),e=>e.code==='23514')
  await assert.rejects(admin.query("insert into public.user_blocks(blocker_id,blocked_id) values($1,$1)",[aId]),e=>e.code==='23514')
  await assert.rejects(admin.query("insert into public.user_follows(follower_id,followed_id,status) values($1,$1,'pending')",[aId]),e=>e.code==='23514')
  const indexNames = (await admin.query("select indexname from pg_indexes where tablename in ('user_follows','user_blocks','conversations','messages')")).rows.map(r=>r.indexname)
  for (const name of ['user_follows_followed_idx','user_follows_pending_idx','user_blocks_blocked_idx','conversations_direct_pair_key','messages_conversation_created_idx']) assert.ok(indexNames.includes(name))
  const plan = (await admin.query('explain select * from public.messages where conversation_id=$1 order by created_at desc,id desc limit 30',[conversation])).rows
  await writeFile(`${out}/explain.json`,JSON.stringify({environment:'Tiny local fixtures, not a production performance benchmark',plan,indexNames},null,2)+'\n')
  record('Canonical/no-self checks and required FK/cursor indexes; local EXPLAIN recorded')
} catch (error) {
  failure = { message: error.message, code: error.code ?? null }
  throw error
} finally {
  // ROLLBACK all sessions first, so test failures never leave a lock hanging.
  await Promise.allSettled(clients.map(c=>c.query('rollback')))
  await Promise.allSettled(clients.map(c=>c.end()))
  if (started) await run(pg_ctl,['-D',directory,'-m','fast','-w','stop'],{windowsHide:true,timeout:30000})
  await mkdir(out,{recursive:true})
  await writeFile(`${out}/sql-results.json`,JSON.stringify({
    base:'da4379f',branch:'codex/r5-block-1',version,
    environment:'Real local PostgreSQL; SET ROLE authenticated/anon; SQL Auth/Storage scaffolds. No HTTP JWT, deployed Edge, Storage transport or Realtime.',
    migrations,results,failure,result:failure?'FAIL':'PASS',remote_baseline_compared:!!remoteComparison,
  },null,2)+'\n')
}
