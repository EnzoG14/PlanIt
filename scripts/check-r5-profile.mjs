import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'

// Extend the real local B1 harness; never connect to remote or rewrite B1 evidence.
const out = process.env.PLANIT_SQL_OUTPUT ?? 'docs/qa/r5-block-3/sql'
const source = await readFile('scripts/check-r5-social.mjs', 'utf8')
const marker = '  const avatarPath = `${bId}/avatar.png`'
assert.equal(source.split(marker).length, 2)
const tests = `
  {
    const target = '81000000-0000-4000-8000-000000000001';
    await admin.query('insert into auth.users values($1,$2)',[target,{display_name:'Perfil público fixture'}]);
    await admin.query("update public.profiles set username='perfil_fixture', bio='Bio autorizada',birth_date='2001-01-01',sex='other',visibility='public' where id=$1",[target]);
    const owner = await connect(); await role(owner,target);
    const events = (client,cursor=null,limit=30) => value(client,'select public.get_social_profile_events($1,$2,$3,$4)',[target,cursor?.starts_at??null,cursor?.id??null,limit]);
    assert.deepEqual(Object.keys(await profile(c,target)).sort(),['avatar','bio','display_name','username']);
    assert.deepEqual((await events(c)).events,[]);
    await denied(profile(anon,target)); await denied(events(anon)); await denied(events(missing));
    assert.equal((await c.query('select * from public.profiles where id=$1',[target])).rowCount,0);
    const ids=Array.from({length:34},(_,i)=>'82000000-0000-4000-8000-'+String(i+1).padStart(12,'0'));
    for (const id of ids) await admin.query(
      "insert into public.events(id,organizer_id,category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity,visibility) values($1,$2,$3,'Plan público','Descripción','2099-01-01T18:00:00','2099-01-01T20:00:00','Dirección',0,0,10,'public')",[id,target,cat]);
    const hiddenId='82000000-0000-4000-8000-000000000101';
    await admin.query("insert into public.events(id,organizer_id,category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity,visibility) values($1,$2,$3,'Oculto','Descripción','2099-01-02T18:00:00','2099-01-02T20:00:00','Dirección',0,0,10,'unlisted')",[hiddenId,target,cat]);
    await admin.query('insert into public.event_access_grants(event_id,user_id) values($1,$2)',[hiddenId,cId]);
    const first=await events(c), second=await events(c,first.next_cursor);
    assert.equal(first.events.length,30); assert.equal(second.events.length,4); assert.equal(second.next_cursor,null);
    assert.deepEqual([...first.events,...second.events].map(e=>e.id),ids.toReversed());
    for(const e of first.events) assert.deepEqual(Object.keys(e).sort(),['category_id','ends_at','id','location_name','starts_at','title']);
    assert.equal((await events(owner)).events.some(e=>e.id===hiddenId),false);
    await invalid(events(c,null,0)); await invalid(events(c,null,51));
    await invalid(value(c,'select public.get_social_profile_events($1,null,$2,30)',[target,ids[0]]));
    record('B3 CA01/02/03/04: allowlisted public identity/bio, empty state, anon/no UID denied, direct profiles private, stable equal-date 30+4 pagination; unlisted excluded even for owner/grant');
    await admin.query("update public.events set cancelled_at=localtimestamp where id=$1",[ids[0]]);
    await admin.query("update public.events set cancelled_at=localtimestamp,archived_at=localtimestamp where id=$1",[ids[1]]);
    await admin.query("update public.events set starts_at='2000-01-01',ends_at='2000-01-02' where id=$1",[ids[2]]);
    await admin.query("select set_config('request.jwt.claim.sub',$1,false)",[target]);
    await admin.query("update public.events set visibility='unlisted' where id=$1",[ids[3]]);
    await admin.query("select set_config('request.jwt.claim.sub','',false)");
    const refreshed=await events(c);
    assert.equal(refreshed.events.length,30); assert.equal(refreshed.next_cursor,null);
    assert.ok(refreshed.events.every(e=>!ids.slice(0,4).includes(e.id)));
    await admin.query("update public.profiles set visibility='private' where id=$1",[target]);
    assert.deepEqual(Object.keys(await profile(c,target)).sort(),['avatar','display_name','username']); await denied(events(c));
    const request=await follow(c,target); await denied(events(c));
    await value(owner,'select public.resolve_follow_request($1,$2,$3)',[cId,request.request_version,'rejected']); await denied(events(c));
    const renewed=await follow(c,target);
    await value(owner,'select public.resolve_follow_request($1,$2,$3)',[cId,renewed.request_version,'accepted']);
    assert.equal((await events(c)).events.length,30); assert.equal((await profile(c,target)).bio,'Bio autorizada');
    await c.query('select public.unfollow_user($1)',[target]); await denied(events(c));
    record('B3 D02: cancelled/archived/expired/visibility withdrawn excluded; private pending/rejected denied, accepted bio+public only, unfollow revokes');
    await admin.query("update public.profiles set visibility='public',bio=null where id=$1",[target]);
    assert.ok(Object.hasOwn(await profile(c,target),'bio')); assert.equal((await profile(c,target)).bio,null);
    await block(c,target); assert.deepEqual(await profile(c,target),{unavailable:true}); await denied(events(c));
    await unblock(c,target); await block(owner,cId); assert.deepEqual(await profile(c,target),{unavailable:true}); await denied(events(c));
    await unblock(owner,cId); assert.equal((await events(c)).events.length,30);
    record('B3 D01: null bio retains capability, both block directions suppress entire profile and events; unblock restores public gate');
  }
`
await mkdir('.r5-check.local',{recursive:true}); await mkdir(out,{recursive:true})
const path='.r5-check.local/profile.mjs'
await writeFile(path,source.replace(marker,tests+marker).replace("base:'da4379f',branch:'codex/r5-block-1'","base:'4ef0b34a789082352f8b1ca831f75761fb6e6b17',branch:'codex/r5-block-3'"))
try {
  const {stdout,stderr}=await promisify(execFile)(process.execPath,[path],{windowsHide:true,timeout:300000,maxBuffer:4*1024*1024,env:{...process.env,PLANIT_SQL_OUTPUT:out}})
  console.log(stdout)
  await writeFile(`${out}/harness.json`,JSON.stringify({harness:'scripts/check-r5-social.mjs',sha256:createHash('sha256').update(source).digest('hex'),extension:'scripts/check-r5-profile.mjs',stdout,stderr},null,2)+'\n')
} finally { await unlink(path) }
