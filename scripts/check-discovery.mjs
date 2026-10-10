import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '../.event-test-tools.local/node_modules/@electric-sql/pglite/dist/index.js'

const db = new PGlite()
try {
  await db.exec(`create role anon; create role authenticated;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth,storage to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner_id text,metadata jsonb);
    alter table storage.objects enable row level security;
    grant select,insert,update,delete on storage.objects to authenticated;`)
  for (const name of ['20261010013449_create_profiles_and_categories.sql', '20261010042701_create_events_and_event_media.sql', '20261010052653_public_event_discovery.sql']) await db.exec(await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8'))
  const owner = '20000000-0000-4000-8000-000000000001'
  const visitor = '20000000-0000-4000-8000-000000000002'
  await db.query('insert into auth.users values ($1,$3),($2,$3)', [owner, visitor, { display_name: 'Prueba' }])
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner])
  await db.exec(`insert into public.events(category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity)
    select (select id from public.categories limit 1), 'Evento ' || n,'Descripción','2099-10-11 20:00','2099-10-11 22:00','Dirección',-34.6,-58.38,10 from generate_series(1,7) n;
    update public.events set cancelled_at=now() where title='Evento 2';
    update public.events set visibility='unlisted' where title='Evento 3';
    update public.events set cancelled_at=now(),archived_at=now() where title='Evento 4';
    update public.events set starts_at='2020-01-01 12:00',ends_at='2020-01-01 14:00' where title='Evento 5';
    update public.events set latitude=10,longitude=20 where title='Evento 6';
    update public.events set latitude=0,longitude=179 where title='Evento 7';`)
  async function role(id) { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id ?? '']); await db.exec(`set role ${id ? 'authenticated' : 'anon'}`) }
  const query = 'select title from public.discover_public_events($1,$2,$3,$4)'
  await role(visitor)
  assert.deepEqual((await db.query(query, [-35,-34,-59,-58])).rows.map(r => r.title), ['Evento 1'])
  assert.equal((await db.query(query, [-10,10,170,-170])).rows[0].title, 'Evento 7')
  assert.equal((await db.query(query, [0,1,0,1])).rows.length, 0)
  assert.equal((await db.query(query, [-91,91,-180,180])).rows.length, 0)
  await role(owner)
  assert.deepEqual((await db.query(query, [-35,-34,-59,-58])).rows.map(r => r.title), ['Evento 1'])
  await role(null)
  await assert.rejects(db.query(query, [-35,-34,-59,-58]), /permission denied/)
  console.log('PASS: SQL real local, RLS invoker, public/active/time/area filters, owner exclusions, antimeridian, invalid bounds, empty, anonymous denial.')
} finally { await db.close() }
