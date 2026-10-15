import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'

// Extend the real local B1 harness without modifying previous evidence.
const out = process.env.PLANIT_SQL_OUTPUT ?? 'docs/qa/r5-block-7/sql'
const source = await readFile('scripts/check-r5-social.mjs', 'utf8')
const marker = '  // Retain invariants independent of API callers.'
assert.equal(source.split(marker).length, 2)
const tests = String.raw`
  {
    const catalog=JSON.parse(await readFile(process.env.PLANIT_R5_FULL_CATALOG??'docs/qa/r5-block-7/remote/catalog.json','utf8')).rows[0].metadata;
    assert.deepEqual(catalog.migrations.map(m=>m.version),migrations.map(m=>m.file.split('_')[0]));
    const local=(await admin.query("select n.nspname as schema,p.proname as name,pg_get_function_identity_arguments(p.oid) as identity_arguments,pg_get_functiondef(p.oid) as definition,p.prosecdef as definer,p.proconfig as config,has_function_privilege('anon',p.oid,'execute') as anon_execute,has_function_privilege('authenticated',p.oid,'execute') as authenticated_execute from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','planit_private') and p.prokind='f'")).rows;
    const comparison=catalog.functions.filter(f=>f.name!=='rls_auto_enable').map(f=>{
      const l=local.find(l=>l.schema===f.schema&&l.name===f.name&&l.identity_arguments===f.identity_arguments);
      return {name:f.schema+'.'+f.name,body:!!l&&hash(l.definition)===hash(f.definition),acl:!!l&&l.anon_execute===f.anon_execute&&l.authenticated_execute===f.authenticated_execute,config:!!l&&l.definer===f.definer&&JSON.stringify(l.config)===JSON.stringify(f.config)};
    });
    assert.ok(comparison.every(r=>r.body&&r.acl&&r.config));assert.ok(catalog.tables.every(t=>t.rls));
    await writeFile(out+'/remote-comparison.json',JSON.stringify({migrations:catalog.migrations.length,rls_tables:catalog.tables.length,functions:comparison,result:'PASS'},null,2));
    record('B7 fresh READ ONLY remote matches 28 migrations,16 RLS tables,79 application function bodies/ACL/config');
    const ownerId='97000000-0000-4000-8000-000000000001';
    const ids=Array.from({length:34},(_,i)=>'98000000-0000-4000-8000-'+String(i+1).padStart(12,'0'));
    for(const id of [ownerId,...ids]) await admin.query('insert into auth.users values($1,$2)',[id,{display_name:'Persona B7'}]);
    await admin.query("update public.profiles set username='requests_owner',bio='BIO_PRIVATE_B7',visibility='private' where id=$1",[ownerId]);
    const owner=await connect(),otherOwner=await connect(),sender=await connect();
    await role(owner,ownerId);await role(otherOwner,ownerId);await role(sender,ids[0]);
    const list=(client,cursor=null)=>value(client,'select public.list_follow_requests($1,$2,30)',[cursor?.requested_at??null,cursor?.follower_id??null]);
    const resolveSql='select public.resolve_follow_request($1,$2,$3)';
    const resolve=(client,id,version,decision)=>value(client,resolveSql,[id,version,decision]);
    const ownEdge=async(client,id)=>(await client.query('select request_version,status from public.user_follows where followed_id=$1 and follower_id=$2',[ownerId,id])).rows[0]??null;
    assert.equal((await list(owner)).requests.length,0);
    for(const id of ids) await admin.query("insert into public.user_follows(follower_id,followed_id,status,requested_at) values($1,$2,'pending','2026-10-14T10:00:00')",[id,ownerId]);
    const one=await list(owner),two=await list(owner,one.next_cursor);
    assert.equal(one.requests.length,30);assert.equal(two.requests.length,4);assert.equal(two.next_cursor,null);
    assert.deepEqual([...one.requests,...two.requests].map(r=>r.follower_id),ids);
    assert.ok(one.requests.every(r=>Object.keys(r).sort().join(',')==='avatar,display_name,follower_id,request_version,requested_at,username'));
    assert.equal((await list(sender)).requests.length,0);assert.equal((await list(a)).requests.length,0);
    await denied(list(anon));await denied(list(missing));
    let version=one.requests[0].request_version;
    await invalid(resolve(sender,ids[0],version,'accepted'));await denied(resolve(a,ids[0],version,'accepted'));
    assert.equal(await ownEdge(a,ids[0]),null);
    await denied(owner.query("update public.user_follows set status='accepted' where followed_id=$1",[ownerId]));
    await denied(owner.query('delete from public.user_follows where followed_id=$1',[ownerId]));
    assert.equal(await resolve(owner,ids[0],version,'accepted'),'accepted');
    assert.equal(await resolve(owner,ids[0],version,'accepted'),'accepted');
    await invalid(resolve(owner,ids[0],version,'rejected'));
    assert.ok('bio' in await profile(sender,ownerId));
    assert.equal((await value(owner,'select public.get_social_counts($1)',[ownerId])).followers,1);
    assert.equal((await list(owner)).requests.length,30); // 33 total, first page30
    await sender.query('select public.unfollow_user($1)',[ownerId]);
    assert.ok(!('bio' in await profile(sender,ownerId)));
    version=(await follow(sender,ownerId)).request_version;
    await resolve(owner,ids[0],version,'rejected');assert.equal((await ownEdge(owner,ids[0])).status,'rejected');
    assert.ok(!('bio' in await profile(sender,ownerId)));
    const renewed=await follow(sender,ownerId);assert.notEqual(renewed.request_version,version);assert.equal(renewed.status,'pending');
    await denied(resolve(owner,ids[0],version,'accepted'));assert.equal((await ownEdge(owner,ids[0])).request_version,renewed.request_version);
    record('B7 CA01..04: exact pending projection,30+4 timestamp/UUID tie pagination,recipient only,allowlisted reconciliation,accept visibility/counts,reject/new version immediately,old version denied,RLS direct writes denied');

    async function pending() {
      await admin.query('delete from public.user_blocks where blocker_id=$1 or blocked_id=$1',[ownerId]);
      await admin.query('delete from public.user_follows where followed_id=$1',[ownerId]);
      await admin.query("update public.profiles set visibility='private' where id=$1",[ownerId]);
      return (await follow(sender,ownerId)).request_version;
    }
    // Real overlapping connections, including expected opposite-resolution errors.
    async function overlap(label,winner,sql,args,loser,otherSql,otherArgs,errorCode=null) {
      await winner.query('begin');await winner.query(sql,args);
      const pid=await value(loser,'select pg_backend_pid()');
      const waitingQuery=loser.query(otherSql,otherArgs).then(result=>({result}),error=>({error}));
      let waits=false;
      for(let i=0;i<100;i++) {waits=await value(admin,"select coalesce((select wait_event_type='Lock' from pg_stat_activity where pid=$1),false)",[pid]);if(waits) break;await new Promise(r=>setTimeout(r,10));}
      assert.ok(waits,label+': actual lock wait');await winner.query('commit');const outcome=await waitingQuery;
      if(errorCode) assert.equal(outcome.error?.code,errorCode);else if(outcome.error) throw outcome.error;
      record('B7 concurrency '+label+': observed Lock; no deadlock');
    }
    for(const decision of ['accepted','rejected']) {
      version=await pending();
      await overlap('duplicate '+decision,owner,resolveSql,[ids[0],version,decision],otherOwner,resolveSql,[ids[0],version,decision]);
      assert.equal((await ownEdge(owner,ids[0])).status,decision);
      version=await pending();
      await overlap(decision+' wins vs opposite',owner,resolveSql,[ids[0],version,decision],otherOwner,resolveSql,[ids[0],version,decision==='accepted'?'rejected':'accepted'],'22023');
    }
    const publicSql='select public.update_my_social_profile($1,$2,null,null,null,null,$3,$4)';
    const publicArgs=['requests_owner','Persona B7','BIO_PRIVATE_B7','public'];
    for(const decision of ['accepted','rejected']) {
      version=await pending();
      await overlap(decision+' wins vs privacy',owner,resolveSql,[ids[0],version,decision],otherOwner,publicSql,publicArgs);
      assert.equal((await ownEdge(owner,ids[0])).status,decision);assert.equal((await list(owner)).requests.length,0);
      version=await pending();
      await overlap('privacy wins vs '+decision,owner,publicSql,publicArgs,otherOwner,resolveSql,[ids[0],version,decision],decision==='rejected'?'22023':null);
      assert.equal((await ownEdge(owner,ids[0])).status,'accepted');assert.equal((await list(owner)).requests.length,0);
      version=await pending();
      await overlap('block wins vs '+decision,sender,'select public.block_user($1)',[ownerId],owner,resolveSql,[ids[0],version,decision],'42501');
      assert.equal(await ownEdge(owner,ids[0]),null);assert.equal((await list(owner)).requests.length,0);
      version=await pending();
      await overlap(decision+' wins vs block',owner,resolveSql,[ids[0],version,decision],sender,'select public.block_user($1)',[ownerId]);
      assert.equal(await ownEdge(owner,ids[0]),null);
      version=await pending();
      await overlap('cancel wins vs '+decision,sender,'select public.unfollow_user($1)',[ownerId],owner,resolveSql,[ids[0],version,decision],'42501');
      assert.equal(await ownEdge(owner,ids[0]),null);
      version=await pending();
      await overlap(decision+' wins vs cancel',owner,resolveSql,[ids[0],version,decision],sender,'select public.unfollow_user($1)',[ownerId]);
      assert.equal(await ownEdge(owner,ids[0]),null);
    }
    version=await pending();
    await sender.query('select public.unfollow_user($1)',[ownerId]);
    await overlap('renewal wins vs stale resolution',sender,'select public.follow_user($1)',[ownerId],owner,resolveSql,[ids[0],version,'accepted'],'42501');
    assert.equal((await ownEdge(owner,ids[0])).status,'pending');assert.notEqual((await ownEdge(owner,ids[0])).request_version,version);
    version=await pending();await owner.query('begin');await resolve(owner,ids[0],version,'accepted');await owner.query('rollback');
    assert.equal((await ownEdge(owner,ids[0])).status,'pending');assert.ok(!('bio' in await profile(sender,ownerId)));
    record('B7 explicit resolution rollback preserves pending and private gate; D04 rejected intact; block/cancel never restore relations');
  }
`
await mkdir('.r5-check.local', { recursive: true }); await mkdir(out, { recursive: true })
const path = '.r5-check.local/requests.mjs'
await writeFile(path, source.replace(marker, tests + marker).replace("base:'da4379f',branch:'codex/r5-block-1'", "base:'cbb05479388d508cb910b98ca6837d0d55614d36',branch:'codex/r5-block-7'"))
try {
  const { stdout, stderr } = await promisify(execFile)(process.execPath, [path], { windowsHide: true, timeout: 300000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, PLANIT_SQL_OUTPUT: out } })
  console.log(stdout)
  await writeFile(`${out}/harness.json`, JSON.stringify({ harness: 'scripts/check-r5-social.mjs', sha256: createHash('sha256').update(source).digest('hex'), extension: 'scripts/check-r5-requests.mjs', stdout, stderr }, null, 2) + '\n')
} finally { await unlink(path) }
