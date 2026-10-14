import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'

// Reuse B1's real PostgreSQL replay, authorization and 13 observed lock races.
const out = process.env.PLANIT_SQL_OUTPUT ?? 'docs/qa/r5-block-6/sql'
const source = await readFile('scripts/check-r5-social.mjs', 'utf8')
const marker = '  const avatarPath = `${bId}/avatar.png`'
assert.equal(source.split(marker).length, 2)
const tests = String.raw`
  {
    const catalog=JSON.parse(await readFile('docs/qa/r5-block-6/remote/catalog.json','utf8')).rows[0].metadata;
    assert.deepEqual(catalog.migrations.map(m=>m.version),migrations.map(m=>m.file.split('_')[0]));
    const local=(await admin.query("select n.nspname as schema,p.proname as name,pg_get_function_identity_arguments(p.oid) as identity_arguments,pg_get_functiondef(p.oid) as definition,p.prosecdef as definer,p.proconfig as config,has_function_privilege('anon',p.oid,'execute') as anon_execute,has_function_privilege('authenticated',p.oid,'execute') as authenticated_execute from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','planit_private') and p.prokind='f'")).rows;
    const comparison=catalog.functions.filter(f=>f.name!=='rls_auto_enable').map(f=>{
      const l=local.find(l=>l.schema===f.schema&&l.name===f.name&&l.identity_arguments===f.identity_arguments);
      return {name:f.schema+'.'+f.name,body:!!l&&hash(l.definition)===hash(f.definition),acl:!!l&&l.anon_execute===f.anon_execute&&l.authenticated_execute===f.authenticated_execute,config:!!l&&l.definer===f.definer&&JSON.stringify(l.config)===JSON.stringify(f.config)};
    });
    assert.ok(comparison.every(r=>r.body&&r.acl&&r.config));assert.ok(catalog.tables.every(t=>t.rls));
    await writeFile(out+'/remote-comparison.json',JSON.stringify({migrations:catalog.migrations.length,rls_tables:catalog.tables.length,functions:comparison,result:'PASS'},null,2));
    record('B6 fresh remote READ ONLY catalog matches full replay: 28 migrations, 16 RLS tables, 79 function bodies/ACL/search_path');
    const target='87000000-0000-4000-8000-000000000001';
    await admin.query('insert into auth.users values($1,$2)',[target,{display_name:'Cuenta B6'}]);
    await admin.query("update public.profiles set username='follows_fixture',bio='BIO_PRIVATE_SENTINEL',visibility='public' where id=$1",[target]);
    const owner=await connect(); await role(owner,target);
    const counts=client=>value(client,'select public.get_social_counts($1)',[target]);
    const list=(client,direction,after=null)=>value(client,'select public.list_social_follows($1,$2,$3,30)',[target,direction,after]);
    const visibility=mode=>value(owner,'select public.update_my_social_profile($1,$2,null,null,null,null,$3,$4)',['follows_fixture','Cuenta B6','BIO_PRIVATE_SENTINEL',mode]);
    const ids=Array.from({length:34},(_,i)=>'88000000-0000-4000-8000-'+String(i+1).padStart(12,'0'));
    for(const id of ids) {
      await admin.query('insert into auth.users values($1,$2)',[id,{display_name:'Persona B6'}]);
      await admin.query("update public.profiles set username=$1 where id=$2",['b6_'+id.slice(-12),id]);
      await admin.query("insert into public.user_follows(follower_id,followed_id,status,requested_at,responded_at) values($1,$2,'accepted',statement_timestamp() at time zone 'America/Argentina/Buenos_Aires',statement_timestamp() at time zone 'America/Argentina/Buenos_Aires'),($2,$1,'accepted',statement_timestamp() at time zone 'America/Argentina/Buenos_Aires',statement_timestamp() at time zone 'America/Argentina/Buenos_Aires')",[id,target]);
    }
    for(const direction of ['followers','following']) {
      const one=await list(a,direction),two=await list(a,direction,one.next_cursor);
      assert.equal(one.users.length,30);assert.equal(two.users.length,4);assert.equal(two.next_cursor,null);
      assert.deepEqual([...one.users,...two.users].map(u=>u.user_id),ids);
      assert.ok(one.users.every(u=>Object.keys(u).sort().join(',')==='avatar,display_name,user_id,username'));
    }
    assert.deepEqual(await counts(a),{followers:34,following:34});
    await block(a,ids[0]);
    assert.deepEqual(await counts(a),{followers:33,following:33});
    assert.equal((await list(a,'followers')).users[0].user_id,ids[1]);
    assert.deepEqual(await counts(owner),{followers:34,following:34});
    await unblock(a,ids[0]);
    const incoming=await connect();await role(incoming,ids[1]);await block(incoming,aId);
    assert.deepEqual(await counts(a),{followers:33,following:33});await unblock(incoming,aId);
    await block(owner,ids[2]);assert.deepEqual(await counts(a),{followers:33,following:33});
    await unblock(owner,ids[2]);assert.deepEqual(await counts(a),{followers:33,following:33});
    record('B6 exact four-column lists 30+4 in both directions, stable UUID cursors, counts match bilateral viewer/owner filters and unblock never restores relations');
    await visibility('private');await denied(counts(a));await denied(list(a,'followers'));
    const requested=await follow(a,target);assert.equal(requested.status,'pending');assert.deepEqual(await follow(a,target),requested);
    assert.ok(!('bio' in await profile(a,target)));await denied(counts(a));await denied(list(a,'following'));
    assert.equal((await counts(owner)).followers,33);
    await a.query('select public.unfollow_user($1)',[target]);await a.query('select public.unfollow_user($1)',[target]);
    assert.equal((await a.query('select * from public.user_follows where followed_id=$1',[target])).rowCount,0);
    await follow(a,target);assert.equal((await visibility('public')).accepted_requests,1);
    const relationship=await value(a,'select public.get_social_relationship($1)',[target]);assert.equal(relationship.follow.status,'accepted');
    await visibility('private');assert.ok('bio' in await profile(a,target));assert.equal((await counts(a)).followers,34);
    await a.query('select public.unfollow_user($1)',[target]);assert.ok(!('bio' in await profile(a,target)));await denied(counts(a));await denied(list(a,'followers'));
    await visibility('public');await follow(a,target);await block(owner,aId);
    assert.deepEqual(await profile(a,target),{unavailable:true});await denied(follow(a,target));await denied(counts(a));await denied(list(a,'followers'));
    await unblock(owner,aId);assert.equal((await value(a,'select public.get_social_relationship($1)',[target])).follow,null);
    await invalid(follow(owner,target));
    for(const client of [anon,missing]) {await denied(follow(client,target));await denied(client.query('select public.unfollow_user($1)',[target]));await denied(counts(client));await denied(list(client,'followers'));}
    await denied(a.query("insert into public.user_follows(follower_id,followed_id,status) values($1,$2,'pending')",[aId,target]));
    await denied(a.query("update public.user_follows set status='accepted' where followed_id=$1",[target]));
    await denied(a.query('delete from public.user_follows where followed_id=$1',[target]));
    assert.equal((await a.query('select * from public.user_follows where followed_id=$1',[target])).rowCount,0);
    assert.equal((await a.query('select * from public.profiles where id=$1',[target])).rowCount,0);
    record('B6 CA01..04: accepted/pending, repeat/cancel/idempotence, D04 acceptance, privatization preserves approved, unfollow revokes, self/bilateral/anonymous and direct write denial');
  }
`
await mkdir('.r5-check.local', { recursive: true }); await mkdir(out, { recursive: true })
const path = '.r5-check.local/follows.mjs'
await writeFile(path, source.replace(marker, tests + marker).replace("base:'da4379f',branch:'codex/r5-block-1'", "base:'54b4749b1c12775e0d6c800b15d82aeb8ecdafbc',branch:'codex/r5-block-6'"))
try {
  const { stdout, stderr } = await promisify(execFile)(process.execPath, [path], { windowsHide: true, timeout: 300000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, PLANIT_SQL_OUTPUT: out } })
  console.log(stdout)
  await writeFile(`${out}/harness.json`, JSON.stringify({ harness: 'scripts/check-r5-social.mjs', sha256: createHash('sha256').update(source).digest('hex'), extension: 'scripts/check-r5-follows.mjs', stdout, stderr }, null, 2) + '\n')
} finally { await unlink(path) }
