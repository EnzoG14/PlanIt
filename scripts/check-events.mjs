import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/features/events/validation.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const { validateEvent, argentinaTimestamp, argentinaNow, formatEventTime, formatEventEndTime, eventEndTimestamp, updateEventValues, validateImages } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
const categoryId = '10000000-0000-4000-8000-000000000001'
const userA = '20000000-0000-4000-8000-000000000001'
const userB = '20000000-0000-4000-8000-000000000002'
const eventId = '30000000-0000-4000-8000-000000000001'
const values = { title: 'Encuentro', description: 'Una descripción', start_date: '2099-10-11', start_time: '20:00', end_date: '2099-10-11', end_time: '22:00', category_id: categoryId, capacity: '10', location_name: '', address: 'Av. Corrientes 123, Buenos Aires', latitude: '-34.60', longitude: '-58.38' }
const categories = [{ id: categoryId, name: 'Social', is_active: true }]
const now = new Date('2026-10-10T15:00:00Z')
assert.equal(argentinaNow(now), '2026-10-10T12:00:00')
assert.equal(argentinaTimestamp('2026-02-30', '12:00'), null)
assert.equal(argentinaTimestamp('2099-10-11', '24:00'), null)
assert.equal(argentinaTimestamp('2099-10-11', '20:00'), '2099-10-11T20:00:00')
assert.match(formatEventTime('2099-10-11T20:00:00'), /20:00/)
assert.deepEqual(validateEvent(values, categories, [], now), {})
assert.equal(formatEventEndTime('2099-10-11T22:00:00'), '22:00')
assert.deepEqual(validateEvent({ ...values, end_date: '' }, categories, [], now), {})
assert.equal(eventEndTimestamp({ ...values, end_date: '' }), '2099-10-11T22:00:00')
const overnight = updateEventValues(values, 'end_time', '02:00')
assert.equal(eventEndTimestamp(overnight), '2099-10-12T02:00:00')
assert.deepEqual(validateEvent(overnight, categories, [], now), {})
assert.equal(eventEndTimestamp(updateEventValues(overnight, 'end_time', '23:00')), '2099-10-11T23:00:00')
assert.equal(eventEndTimestamp(updateEventValues(overnight, 'start_date', '2099-12-31')), '2100-01-01T02:00:00')
assert.equal(eventEndTimestamp(updateEventValues({ ...overnight, start_date: '2028-02-28' }, 'end_time', '02:00')), '2028-02-29T02:00:00')
const multiDay = { ...values, end_date: '2099-10-14' }
assert.equal(eventEndTimestamp(updateEventValues(multiDay, 'title', 'Otro nombre')), '2099-10-14T22:00:00')
assert.equal(eventEndTimestamp(updateEventValues(multiDay, 'end_time', '23:00')), '2099-10-11T23:00:00')
assert.ok(validateEvent(updateEventValues(values, 'end_time', '20:00'), categories, [], now).end_time)
assert.ok(validateEvent(updateEventValues(values, 'end_time', '25:00'), categories, [], now).end_time)

for (const field of ['title', 'description', 'start_date', 'start_time', 'end_time', 'category_id', 'capacity', 'address', 'latitude', 'longitude']) assert.ok(validateEvent({ ...values, [field]: '' }, categories, [], now)[field], field)
for (const capacity of ['0', '-1', '1.5', '2147483648', 'Infinity']) assert.ok(validateEvent({ ...values, capacity }, categories, [], now).capacity)
for (const latitude of ['91', '-91', 'NaN', 'Infinity']) assert.ok(validateEvent({ ...values, latitude }, categories, [], now).latitude)
for (const longitude of ['181', '-181', 'NaN', 'Infinity']) assert.ok(validateEvent({ ...values, longitude }, categories, [], now).longitude)
assert.ok(validateEvent(values, [{ ...categories[0], is_active: false }], [], now).category_id)
assert.ok(validateEvent({ ...values, start_date: '2026-10-10', start_time: '12:00' }, categories, [], now).start_time)
assert.ok(validateEvent({ ...values, end_time: '20:00' }, categories, [], now).end_time)
assert.ok(validateEvent({ ...values, title: '😀'.repeat(121) }, categories, [], now).title)
const photo = { type: 'image/png', size: 5242880 }
assert.equal(validateImages(Array(10).fill(photo)), undefined)
assert.ok(validateImages(Array(11).fill(photo)))
assert.ok(validateImages([{ ...photo, size: 5242881 }]))
assert.ok(validateImages([{ ...photo, size: 0 }]))
assert.ok(validateImages([{ ...photo, type: 'image/svg+xml' }]))
console.log('PASS: required fields, future/end dates, Argentina time, category, coordinates, cupo, 10-image/type/size limits.')

if (process.argv.includes('--postgres')) {
  // Temporary test dependency; no production dependency or remote connection.
  const { PGlite } = await import('../.event-test-tools.local/node_modules/@electric-sql/pglite/dist/index.js')
  const db = new PGlite()
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema storage;
    create table auth.users (id uuid primary key, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, storage to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text, owner_id text, metadata jsonb, unique(bucket_id,name));
    alter table storage.objects enable row level security;
    grant select, insert, update, delete on storage.objects to authenticated;
  `)
  await db.exec(await readFile(new URL('../supabase/migrations/20261010013449_create_profiles_and_categories.sql', import.meta.url), 'utf8'))
  await db.exec(await readFile(new URL('../supabase/migrations/20261010042701_create_events_and_event_media.sql', import.meta.url), 'utf8'))
  await db.query('insert into auth.users values ($1,$3),($2,$3)', [userA, userB, { display_name: 'Prueba R1' }])
  await db.query("insert into public.categories(id,name,slug) values ($1,'Prueba','prueba')", [categoryId])
  async function role(user) { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user ?? '']); await db.exec(`set role ${user ? 'authenticated' : 'anon'}`) }
  const args = [eventId, 'Evento prueba', 'Descripción', '2099-10-11 20:00', '2099-10-11 22:00', categoryId, 10, 'Dirección', -34.6, -58.38, null, []]
  const create = data => db.query('select public.create_event($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)::text as id', data)
  await role(null)
  await assert.rejects(create(args), /permission denied/)
  await assert.rejects(db.query('select * from public.events'), /permission denied/)
  await role(userA)
  for (const [index, invalid, pattern] of [[1, '', /events_title_valid/], [2, ' ', /events_description_valid/], [3, '2020-01-01', /start_not_future/], [4, '2099-10-11 19:00', /events_dates_valid/], [6, 0, /events_capacity_valid/], [8, 91, /events_coordinates_valid/], [9, 'NaN', /events_coordinates_valid/], [11, Array(11).fill('bad'), /invalid_image_count/]]) {
    const bad = [...args]; bad[index] = invalid
    await assert.rejects(create(bad), pattern)
    assert.equal((await db.query('select count(*)::int as n from public.events')).rows[0].n, 0)
  }
  await db.exec('reset role'); await db.query('update public.categories set is_active = false where id = $1', [categoryId]); await role(userA)
  await assert.rejects(create(args), /category_inactive/)
  await db.exec('reset role'); await db.query('update public.categories set is_active = true where id = $1', [categoryId]); await role(userA)
  await assert.rejects(db.query('insert into public.events(organizer_id) values ($1)', [userB]), /permission denied/)
  assert.equal((await create(args)).rows[0].id, eventId)
  const event = (await db.query('select * from public.events where id=$1', [eventId])).rows[0]
  assert.equal(event.organizer_id, userA); assert.equal(event.visibility, 'public')
  assert.equal((await create(args)).rows[0].id, eventId)
  assert.equal((await db.query('select count(*)::int as n from public.events')).rows[0].n, 1)
  await role(userB)
  assert.equal((await db.query('select id from public.events where visibility=$1 and latitude between -35 and -34 and longitude between -59 and -58 and cancelled_at is null and archived_at is null', ['public'])).rows[0].id, eventId)
  await assert.rejects(db.query("update public.events set title='Ajeno' where id=$1", [eventId]), /permission denied/)
  await assert.rejects(db.query('delete from public.events where id=$1', [eventId]), /permission denied/)
  await assert.rejects(create(args), /duplicate key/)
  await role(userA)
  const paths = Array.from({ length: 10 }, (_, index) => `${userA}/photos/${index}.png`)
  for (const path of paths) await db.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values ('event_media',$1,$2,$3)", [path, userA, { mimetype: 'image/png', size: 100 }])
  const photoId = '30000000-0000-4000-8000-000000000002'
  const withImages = [...args]; withImages[0] = photoId; withImages[11] = paths
  assert.equal((await create(withImages)).rows[0].id, photoId)
  assert.equal((await db.query('select count(*)::int as n from public.event_images where event_id=$1', [photoId])).rows[0].n, 10)
  const fileId = (await db.query('select file_id from public.event_images where event_id=$1 limit 1', [photoId])).rows[0].file_id
  await assert.rejects(db.query('insert into public.event_images(event_id,file_id,sort_order) values ($1,$2,10)', [photoId, fileId]), /event_images_order_valid/)
  assert.equal((await db.query('delete from storage.objects where name=$1 returning name', [paths[0]])).rows.length, 0)
  await role(userB)
  assert.equal((await db.query('select * from public.event_images where event_id=$1', [photoId])).rows.length, 10)
  await assert.rejects(db.query('insert into public.event_images(event_id,file_id) values ($1,$2)', [photoId, fileId]), /invalid_image_owner|row-level security/)
  await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values ('event_media',$1)", [`${userA}/bad.png`]), /row-level security/)
  await role(userA)
  const atomicPath = `${userA}/atomic.png`
  await db.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values ('event_media',$1,$2,$3)", [atomicPath, userA, { mimetype: 'image/png', size: 100 }])
  const missingImage = [...args]; missingImage[0] = '30000000-0000-4000-8000-000000000003'; missingImage[11] = [atomicPath, `${userA}/missing.png`]
  await assert.rejects(create(missingImage), /invalid_image/)
  assert.equal((await db.query('select count(*)::int as n from public.events where id=$1', [missingImage[0]])).rows[0].n, 0)
  assert.equal((await db.query('select count(*)::int as n from public.files where storage_path=$1', [atomicPath])).rows[0].n, 0, 'A failure on photo 2 must roll back photo 1 and event')
  await db.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values ('event_media',$1,$2,$3)", [`${userA}/staged.png`, userA, { mimetype: 'image/png', size: 100 }])
  assert.equal((await db.query('delete from storage.objects where name=$1 returning name', [`${userA}/staged.png`])).rows.length, 1)
  await db.exec('reset role'); await db.query("update public.events set visibility='unlisted' where id=$1", [photoId]); await role(userB)
  assert.equal((await db.query('select * from public.event_images where event_id=$1', [photoId])).rows.length, 0)
  assert.equal((await db.query('select * from public.files where id=$1', [fileId])).rows.length, 0)
  assert.equal((await db.query('select * from storage.objects where name=$1', [paths[0]])).rows.length, 0)
  await role(userA)
  assert.equal((await db.query('select id from public.events where id=$1', [photoId])).rows.length, 1)
  await db.exec('reset role')
  const rls = (await db.query("select relname,relrowsecurity from pg_class where oid in ('public.events'::regclass,'public.files'::regclass,'public.event_images'::regclass)")).rows
  assert.ok(rls.every(row => row.relrowsecurity))
  console.log('PASS: real PostgreSQL migration, rollback, identity/grants/RLS, public geographic query, idempotency, active categories, private Storage, 10-image limit, read permissions and staged cleanup.')
  await db.close()
}
