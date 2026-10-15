import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'

// Extend the real local B1 harness; never connect to remote or rewrite B1 evidence.
const out = process.env.PLANIT_SQL_OUTPUT ?? 'docs/qa/r5-block-5/sql'
const source = await readFile('scripts/check-r5-social.mjs', 'utf8')
const marker = '  const avatarPath = `${bId}/avatar.png`'
assert.equal(source.split(marker).length, 2)
const tests = String.raw`
  {
    const catalog=JSON.parse(await readFile(process.env.PLANIT_R5_FULL_CATALOG??'docs/qa/r5-block-5/remote/catalog.json','utf8')).rows[0].metadata;
    assert.deepEqual(catalog.migrations.map(m=>m.version),migrations.map(m=>m.file.split('_')[0]));
    const local=(await admin.query("select n.nspname as schema,p.proname as name,pg_get_function_identity_arguments(p.oid) as identity_arguments,pg_get_functiondef(p.oid) as definition,p.prosecdef as definer,p.proconfig as config,has_function_privilege('anon',p.oid,'execute') as anon_execute,has_function_privilege('authenticated',p.oid,'execute') as authenticated_execute from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','planit_private') and p.prokind='f'")).rows;
    const comparison=catalog.functions.filter(f=>f.name!=='rls_auto_enable').map(f=>{
      const l=local.find(l=>l.schema===f.schema&&l.name===f.name&&l.identity_arguments===f.identity_arguments);
      return {name:f.schema+'.'+f.name,body:!!l&&hash(l.definition)===hash(f.definition),acl:!!l&&l.anon_execute===f.anon_execute&&l.authenticated_execute===f.authenticated_execute,config:!!l&&l.definer===f.definer&&JSON.stringify(l.config)===JSON.stringify(f.config)};
    });
    assert.ok(comparison.every(r=>r.body&&r.acl&&r.config)); assert.ok(catalog.tables.every(t=>t.rls));
    await writeFile(out+'/remote-comparison.json',JSON.stringify({migrations:catalog.migrations.length,rls_tables:catalog.tables.length,functions:comparison,result:'PASS'},null,2));
    record('B5 fresh remote READ ONLY catalog matches full local migration replay, function bodies, ACL and search_path');
    const target='85000000-0000-4000-8000-000000000001';
    await admin.query('insert into auth.users values($1,$2)',[target,{display_name:'Perfil privado fixture'}]);
    await admin.query("update public.profiles set username='private_fixture',bio='Bio sólo accepted',birth_date='2001-01-01',sex='other',visibility='private' where id=$1",[target]);
    const owner=await connect(); await role(owner,target);
    const setVisibility=visibility=>value(owner,'select public.update_my_social_profile($1,$2,null,null,null,null,$3,$4)',['private_fixture','Perfil privado fixture','Bio sólo accepted',visibility]);
    const events=(client,cursor=null)=>value(client,'select public.get_social_profile_events($1,$2,$3,30)',[target,cursor?.starts_at??null,cursor?.id??null]);
    const avatarPath=target+'/private.png';
    await owner.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values('avatars',$1,$2,'{\"mimetype\":\"image/png\",\"size\":1024,\"cacheControl\":\"max-age=0\"}')",[avatarPath,target]);
    const file=await value(owner,'select public.set_my_avatar($1)',[avatarPath]);
    const ids=Array.from({length:34},(_,i)=>'86000000-0000-4000-8000-'+String(i+1).padStart(12,'0'));
    for(const id of ids) await admin.query("insert into public.events(id,organizer_id,category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity,visibility) values($1,$2,$3,'Evento público','Descripción','2099-01-01T18:00:00','2099-01-01T20:00:00','Dirección',0,0,10,'public')",[id,target,cat]);
    const hidden='86000000-0000-4000-8000-000000000099';
    await admin.query("insert into public.events(id,organizer_id,category_id,title,description,starts_at,ends_at,address,latitude,longitude,capacity,visibility) values($1,$2,$3,'EVENTO_OCULTO','Descripción','2099-01-02T18:00:00','2099-01-02T20:00:00','Dirección',0,0,10,'unlisted')",[hidden,target,cat]);
    await admin.query('insert into public.event_access_grants(event_id,user_id) values($1,$2),($1,$3)',[hidden,aId,cId]);
    await a.query('select public.register_for_event($1)',[hidden]);
    let audiences=0;
    for(const status of [null,'pending','rejected','accepted']) for(const direction of [null,'outgoing','incoming']) {
      await admin.query('delete from public.user_follows where followed_id=$1 or follower_id=$1',[target]);
      await admin.query('delete from public.user_blocks where blocker_id=$1 or blocked_id=$1',[target]);
      for(const [client,id] of [[a,aId],[c,cId],[d,dId]]) {
        if(status) await admin.query("insert into public.user_follows(follower_id,followed_id,status,responded_at) values($1,$2,$3,case when $3='pending' then null else clock_timestamp() at time zone 'America/Argentina/Buenos_Aires' end)",[id,target,status]);
        if(direction) await admin.query('insert into public.user_blocks(blocker_id,blocked_id) values($1,$2)',direction==='outgoing'?[id,target]:[target,id]);
        const projection=await profile(client,target);
        if(direction) {assert.deepEqual(projection,{unavailable:true}); await denied(events(client));}
        else {
          assert.deepEqual(Object.keys(projection).sort(),status==='accepted'?['avatar','bio','display_name','username']:['avatar','display_name','username']);
          assert.equal(projection.avatar,target);
          if(status==='accepted') {
            const first=await events(client),second=await events(client,first.next_cursor);
            assert.equal(first.events.length,30); assert.equal(second.events.length,4);
            assert.deepEqual([...first.events,...second.events].map(e=>e.id),ids.toReversed());
            assert.ok(first.events.every(e=>Object.keys(e).sort().join(',')==='category_id,ends_at,id,location_name,starts_at,title'));
          } else {
            await denied(events(client)); await denied(value(client,'select public.get_social_counts($1)',[target]));
            await denied(value(client,"select public.list_social_follows($1,'followers')",[target]));
          }
        }
        assert.equal((await client.query('select * from public.profiles where id=$1',[target])).rowCount,0);
        assert.equal((await client.query('select * from public.files where id=$1',[file])).rowCount,0);
        assert.equal((await client.query("select * from storage.objects where bucket_id='avatars' and name=$1",[avatarPath])).rowCount,0);
        assert.equal(await value(admin,'select public.get_social_avatar_for_signing($1,$2)',[id,target]),direction?null:avatarPath);
        audiences++;
      }
      assert.equal((await a.query('select * from public.events where id=$1',[hidden])).rowCount,1);
      assert.equal((await c.query('select * from public.events where id=$1',[hidden])).rowCount,1);
    }
    assert.equal(audiences,36);
    record('B5 CA01..04/D01/D02: 36 private audiences, confirmed/grant-only/stranger × none/pending/rejected/accepted × bilateral blocks; exact columns, public-only 30+4 events, direct profiles/files/Storage denied, signing gate');
    await admin.query('delete from public.user_blocks where blocker_id=$1 or blocked_id=$1',[target]);
    await admin.query('delete from public.user_follows where followed_id=$1 or follower_id=$1',[target]);
    const requested=await follow(c,target); await denied(events(c));
    await value(owner,'select public.resolve_follow_request($1,$2,$3)',[cId,requested.request_version,'accepted']);
    assert.equal((await events(c)).events.length,30);
    const another=await connect(); await role(another,cId);
    assert.ok('bio' in await profile(another,target));
    await c.query('select public.unfollow_user($1)',[target]);
    await denied(events(another)); assert.ok(!('bio' in await profile(another,target)));
    await setVisibility('public'); assert.ok('bio' in await profile(c,target));
    await setVisibility('private'); await denied(events(c));
    const pending=await follow(c,target); await setVisibility('public');
    assert.equal(await value(admin,'select status from public.user_follows where follower_id=$1 and followed_id=$2',[cId,target]),'accepted');
    await setVisibility('private'); assert.ok('bio' in await profile(c,target));
    const first=await events(c); await block(owner,cId);
    await denied(events(c,first.next_cursor)); assert.deepEqual(await profile(c,target),{unavailable:true});
    await unblock(owner,cId); assert.ok(!('bio' in await profile(c,target))); await denied(events(c));
    record('B5 changes across sessions and pages: acceptance grants, unfollow revokes, public→private denies strangers and retains accepted, block kills cursor access, unblock never restores follow');
    for(const client of [anon,missing]) { await denied(profile(client,target)); await denied(events(client)); }
    assert.deepEqual(await profile(c,'85000000-0000-4000-8000-000000000099'),{unavailable:true});
    const own=await profile(owner,target); assert.deepEqual(Object.keys(own).sort(),['avatar','bio','display_name','username']);
    assert.ok(!(await events(owner)).events.some(e=>e.id===hidden));
    await denied(value(c,'select public.get_social_avatar_for_signing($1,$2)',[cId,target]));
    await admin.query('update public.profiles set bio=null where id=$1',[target]);
    const retry=await follow(c,target); await value(owner,'select public.resolve_follow_request($1,$2,$3)',[cId,retry.request_version,'accepted']);
    assert.equal((await profile(c,target)).bio,null); assert.equal((await events(c)).events.length,30);
    record('B5 anonymous/missing UID denied; unknown neutral; own social projection excludes demographics/unlisted; null bio keeps accepted capability; privileged signing cannot be called by client');
  }
`
await mkdir('.r5-check.local',{recursive:true}); await mkdir(out,{recursive:true})
const path='.r5-check.local/private-profile.mjs'
await writeFile(path,source.replace(marker,tests+marker).replace("base:'da4379f',branch:'codex/r5-block-1'","base:'24c24cee44725cfa2fa4c2a3668474e891417ad3',branch:'codex/r5-block-5'"))
try {
  const {stdout,stderr}=await promisify(execFile)(process.execPath,[path],{windowsHide:true,timeout:300000,maxBuffer:4*1024*1024,env:{...process.env,PLANIT_SQL_OUTPUT:out}})
  console.log(stdout)
  await writeFile(`${out}/harness.json`,JSON.stringify({harness:'scripts/check-r5-social.mjs',sha256:createHash('sha256').update(source).digest('hex'),extension:'scripts/check-r5-private-profile.mjs',stdout,stderr},null,2)+'\n')
} finally { await unlink(path) }
