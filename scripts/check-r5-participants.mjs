import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'

// Extend the existing real-PostgreSQL harness without duplicating scaffolding or
// overwriting B1 evidence. No remote connection. Business writes are fixtures.
const out = process.env.PLANIT_SQL_OUTPUT ?? 'docs/qa/r5-block-2/sql'
const source = await readFile('scripts/check-r5-social.mjs', 'utf8')
const marker = '  const avatarPath = `${bId}/avatar.png`'
assert.equal(source.split(marker).length, 2)
const tests = `
  {
  const socialEvent = await event('public'), emptyEvent = await event('public');
  await admin.query('update public.events set capacity=80 where id=$1',[socialEvent]);
  const ids = Array.from({length:34},(_,i)=>'80000000-0000-4000-8000-'+String(i+1).padStart(12,'0'));
  const actor = await connect();
  for (const id of ids) {
    await admin.query('insert into auth.users values($1,$2)',[id,{display_name:'Persona participante'}]);
    await admin.query("update public.profiles set visibility='private',birth_date='2001-01-01',sex='other',bio='Reservada' where id=$1",[id]);
    await role(actor,id); await actor.query('select public.register_for_event($1)',[socialEvent]);
  }
  const participants = (client,id,after=null,limit=30) => value(client,'select public.get_event_social_participants($1,$2,$3)',[id,after,limit]);
  const first = await participants(a,socialEvent), second = await participants(a,socialEvent,first.next_cursor);
  assert.equal(first.participants.length,30); assert.equal(second.participants.length,4); assert.equal(second.next_cursor,null);
  assert.deepEqual([...first.participants,...second.participants].map(row=>row.user_id),ids);
  for(const row of first.participants) assert.deepEqual(Object.keys(row).sort(),['avatar','display_name','user_id','username']);
  assert.equal(JSON.stringify(first).includes('Reservada'),false);
  assert.deepEqual((await participants(a,emptyEvent)).participants,[]);
  await role(actor,ids[0]); assert.equal((await participants(actor,socialEvent)).participants.length,30);
  await denied(value(actor,'select public.get_event_attendees($1)',[socialEvent]));
  for(const client of [b,c,d,anon,missing]) await denied(participants(client,socialEvent));
  await invalid(participants(a,socialEvent,null,0)); await invalid(participants(a,socialEvent,null,51));
  record('B2 CA01/02/03/04: 34 private confirmed identities, exact four-field projection, organizer/confirmed only, empty and unrelated events, stable 30+4 cursor, admin isolation and invalid limits');
  await block(a,ids[0]); await role(actor,ids[1]); await block(actor,aId);
  const filtered = await participants(a,socialEvent);
  assert.equal(filtered.participants.length,30); assert.equal(filtered.participants[0].user_id,ids[2]);
  assert.deepEqual((await participants(a,socialEvent,filtered.next_cursor)).participants.map(row=>row.user_id),ids.slice(32));
  for(const id of ids.slice(0,2)) assert.deepEqual(await profile(a,id),{unavailable:true});
  await role(actor,ids[2]); await actor.query('select public.leave_event($1)',[socialEvent]);
  await denied(participants(actor,socialEvent));
  assert.equal((await participants(a,socialEvent)).participants.some(row=>row.user_id===ids[2]),false);
  await role(actor,ids[3]);
  const participation = await value(admin,'select id from public.event_participations where event_id=$1 and user_id=$2',[socialEvent,ids[3]]);
  await a.query('select public.remove_participant($1,$2)',[socialEvent,participation]);
  await denied(participants(actor,socialEvent));
  assert.equal((await participants(a,socialEvent)).participants.some(row=>row.user_id===ids[3]),false);
  record('B2 D01/R3/R4: both block directions filtered before pagination, direct profiles neutral; leave/removal immediately deny social list without granting admin or changing group chat');
  }
`
await mkdir('.r5-check.local', { recursive:true }); await mkdir(out,{recursive:true})
const target = '.r5-check.local/participants.mjs'
await writeFile(target,source.replace(marker,tests+marker).replace("base:'da4379f',branch:'codex/r5-block-1'","base:'1bcef5af3397b54bae8cc18e6336092639c2b964',branch:'codex/r5-block-2'"))
try {
  const {stdout,stderr} = await promisify(execFile)(process.execPath,[target],{windowsHide:true,timeout:300000,maxBuffer:4*1024*1024,env:{...process.env,PLANIT_SQL_OUTPUT:out}})
  console.log(stdout)
  await writeFile(`${out}/harness.json`,JSON.stringify({harness:'scripts/check-r5-social.mjs',sha256:createHash('sha256').update(source).digest('hex'),extension:'scripts/check-r5-participants.mjs',stdout,stderr},null,2)+'\n')
} finally { await unlink(target) }
