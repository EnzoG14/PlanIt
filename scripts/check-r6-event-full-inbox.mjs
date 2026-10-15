import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'

// Real local PostgreSQL replay and roles; no remote SQL or simulated JWT claims
// presented as transport verification. Reuse the established R5 fixtures/races.
const out = process.env.PLANIT_SQL_OUTPUT ?? 'docs/qa/r6-block-7/sql'
const source = await readFile('scripts/check-r5-social.mjs', 'utf8')
const marker = '  // Retain invariants independent of API callers.'
assert.equal(source.split(marker).length, 2)
const tests = String.raw`
  {
    await admin.query('delete from public.user_blocks');
    await admin.query("select set_config('request.jwt.claim.sub',$1,false)",[aId]);
    const id=await event('public');
    await admin.query("update public.events set title='Nombre actual · Música',capacity=1 where id=$1",[id]);
    await b.query('select public.register_for_event($1)',[id]);
    const notice=(await a.query("select * from public.notifications where event_id=$1 and type='event_full'",[id])).rows[0];
    assert.ok(notice); assert.equal(notice.title,'Cupo completo');
    const changed=async(client,ids=[notice.id])=>(await client.query('select * from public.get_notification_changes($1)',[ids])).rows;
    const list=async client=>(await client.query('select * from public.get_notifications()')).rows;
    const target=client=>value(client,'select public.get_notification_target($1)',[notice.id]);
    const assertProjection=async(title,destination)=>{
      const row=(await changed(a))[0];assert.equal(row.title,title);assert.equal(row.target,destination);
      assert.equal((await list(a)).find(n=>n.id===notice.id).title,title);
      assert.equal(await target(a),destination);
      assert.deepEqual(Object.keys(row).sort(),['id','type','title','body','read_at','created_at','target'].sort());
    };
    await assertProjection('Nombre actual · Música','/events/'+id);
    await admin.query("update public.events set title='Renombrado <script> & mate',visibility='unlisted' where id=$1",[id]);
    await assertProjection('Renombrado <script> & mate','/events/'+id);
    await admin.query('update public.events set cancelled_at=localtimestamp where id=$1',[id]);
    await assertProjection('Renombrado <script> & mate','/events/'+id);
    await admin.query('update public.events set archived_at=localtimestamp where id=$1',[id]);
    await assertProjection('Cupo completo',null);
    record('B7 CA02: producer unchanged; both inbox paths project current authorized title, including old notices; public/unlisted/cancelled resolve; archived hides title and target');

    const firstRead=await value(a,'select public.mark_notification_read($1)',[notice.id]);
    assert.deepEqual(await value(a,'select public.mark_notification_read($1)',[notice.id]),firstRead);
    assert.deepEqual((await changed(a))[0].read_at,firstRead);
    for(const client of [b,c,d]){
      assert.equal((await changed(client)).length,0);assert.ok(!(await list(client)).some(n=>n.id===notice.id));
      assert.equal(await target(client),null);
      await denied(client.query('select public.mark_notification_read($1)',[notice.id]));
      assert.equal((await client.query('select * from public.notifications where id=$1',[notice.id])).rowCount,0);
      assert.equal((await client.query('update public.notifications set read_at=localtimestamp where id=$1',[notice.id])).rowCount,0);
    }
    for(const client of [anon,missing]){
      await denied(client.query('select * from public.get_notifications()'));
      await denied(client.query('select * from public.get_notification_changes($1)',[[notice.id]]));
      await denied(client.query('select public.mark_notification_read($1)',[notice.id]));
    }
    await denied(anon.query('select public.get_notification_target($1)',[notice.id]));
    assert.equal(await target(missing),null);
    record('B7 CA04: guessed UUID cannot read/list/change/mark/resolve another inbox; anon and missing UID denied; owner read_at remains idempotent');

    const foreign=await event('public');
    await admin.query("update public.events set organizer_id=$2,title='FOREIGN_TITLE_SENTINEL' where id=$1",[foreign,dId]);
    await admin.query('update public.notifications set event_id=$2 where id=$1',[notice.id,foreign]);
    await assertProjection('Cupo completo',null);
    await admin.query('update public.notifications set event_id=null where id=$1',[notice.id]);
    await assertProjection('Cupo completo',null);
    await admin.query('update public.notifications set conversation_id=$2 where id=$1',[notice.id,eventConversation]);
    await assertProjection('Cupo completo',null);
    record('B7 adversarial stored notice: visible foreign event, missing event and chat reference never bypass event_full ownership or become a chat target');

    const dmId=await dm(a,bId),dmNotice=randomUUID(),followNotice=randomUUID(),eventNotice=randomUUID(),chatNotice=randomUUID(),systemNotice=randomUUID();
    await admin.query("insert into public.notifications(id,recipient_id,conversation_id,type,title) values($1,$2,$3,'direct_message','DM original')",[dmNotice,aId,dmId]);
    await admin.query("insert into public.notifications(id,recipient_id,type,title) values($1,$2,'follow_request','Seguimiento original'),($3,$2,'system','Sistema original')",[followNotice,aId,systemNotice]);
    await admin.query("insert into public.notifications(id,recipient_id,event_id,type,title) values($1,$2,$3,'event_update','Evento original')",[eventNotice,aId,pub]);
    await admin.query("insert into public.notifications(id,recipient_id,conversation_id,type,title) values($1,$2,$3,'chat','Chat original')",[chatNotice,aId,eventConversation]);
    const rows=await changed(a,[dmNotice,followNotice,eventNotice,chatNotice,systemNotice]);
    const expected=new Map([[dmNotice,['DM original','/messages/'+dmId]],[followNotice,['Seguimiento original','/me/follow-requests']],[eventNotice,['Evento original','/events/'+pub]],[chatNotice,['Chat original','/events/'+hidden+'/chat']],[systemNotice,['Sistema original',null]]]);
    for(const row of rows)assert.deepEqual([row.title,row.target],expected.get(row.id));
    assert.equal(rows.length,5);
    record('B7 compatibility: event_update, chat, follow_request, direct_message and system preserve titles, targets and wire shape');

    await invalid(a.query('select * from public.get_notifications($1,null)',['2026-10-15T10:00:00']));
    await invalid(a.query('select * from public.get_notification_changes(null)'));
    await invalid(a.query('select * from public.get_notification_changes($1)',[Array(101).fill(notice.id)]));
    assert.equal((await changed(a,[])).length,0);assert.equal((await changed(a,[notice.id,notice.id])).length,1);
    const bulk=Array.from({length:65},()=>randomUUID());
    await admin.query("insert into public.notifications(id,recipient_id,event_id,type,title,created_at) select unnest($1::uuid[]),$2,$3,'event_full','Cupo completo','2099-01-01'::timestamp",[bulk,aId,pub]);
    const seen=new Set();let cursor=null;let pages=0;
    while(true){const page=(await a.query('select * from public.get_notifications($1,$2)',[cursor?.created_at??null,cursor?.id??null])).rows;
      assert.ok(page.length<=31);for(const row of page.slice(0,30)){assert.ok(!seen.has(row.id));seen.add(row.id);}
      pages++;if(page.length<=30)break;cursor=page[29];assert.ok(pages<10);
    }
    assert.ok(bulk.every(id=>seen.has(id)));assert.ok(pages>=3);
    record('B7 cursor contract: 31-row lookahead, tied timestamps across pages, no missing/duplicate UUIDs, batch100 bound and invalid inputs retained');

    const catalog=(await admin.query("select p.proname,p.prosecdef,p.provolatile,p.proconfig,has_function_privilege('anon',p.oid,'execute') anon_execute,has_function_privilege('authenticated',p.oid,'execute') authenticated_execute from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('get_notifications','get_notification_changes','get_notification_target')")).rows;
    assert.equal(catalog.length,3);for(const row of catalog){assert.equal(row.prosecdef,false);assert.equal(row.provolatile,'s');assert.deepEqual(row.proconfig,['search_path=""']);assert.equal(row.anon_execute,false);assert.equal(row.authenticated_execute,true);}
    assert.equal(await value(admin,"select relrowsecurity from pg_class where oid='public.notifications'::regclass"),true);
    assert.equal(await value(admin,"select count(*)::int from pg_publication_tables where pubname='supabase_realtime' and tablename='notifications'"),1);
    const sizes=[];
    for(const size of [0,1,10,100,1000]){
      const benchUser=randomUUID();await admin.query('insert into auth.users values($1,$2)',[benchUser,{display_name:'B7 benchmark'}]);
      const bench=await connect();await role(bench,benchUser);
      const benchEvent=await event('public');await admin.query('update public.events set organizer_id=$2 where id=$1',[benchEvent,benchUser]);
      await admin.query("insert into public.notifications(recipient_id,event_id,type,title) select $1,$3,'event_full','Cupo completo' from generate_series(1,$2)",[benchUser,size,benchEvent]);
      const samples=[];for(let i=0;i<20;i++){const start=performance.now();assert.equal((await list(bench)).length,Math.min(size,31));samples.push(performance.now()-start);}
      const plan=(await bench.query('explain(analyze,buffers,format json) select * from public.get_notifications()')).rows;
      sizes.push({count:size,samples_ms:samples,max_ms:Math.max(...samples),plan});
    }
    await writeFile(out+'/benchmark.json',JSON.stringify({environment:'Local synthetic PostgreSQL; 20 samples/size; no production SLA',sizes},null,2)+'\n');
    await writeFile(out+'/catalog.json',JSON.stringify(catalog,null,2)+'\n');
    record('B7 invoker/STABLE/empty search_path/authenticated-only EXECUTE, notifications RLS/publication preserved; bounded inbox benchmark 0/1/10/100/1000');
  }
`
await mkdir('.r6-check.local', { recursive: true })
await mkdir(out, { recursive: true })
const path = '.r6-check.local/event-full-inbox.mjs'
await writeFile(path, source.replace(marker, () => tests + marker).replace("base:'da4379f',branch:'codex/r5-block-1'", "base:'9311c0142e4c945656e8aa0fe9c89c1a37b4135b',branch:'codex/r6-block-7'"))
try {
  const { stdout, stderr } = await promisify(execFile)(process.execPath, [path], {
    windowsHide: true, timeout: 300000, maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, PLANIT_SQL_OUTPUT: out },
  })
  console.log(stdout)
  await writeFile(out + '/harness.json', JSON.stringify({ inherited: 'scripts/check-r5-social.mjs', source_sha256: createHash('sha256').update(source).digest('hex'), extension: 'scripts/check-r6-event-full-inbox.mjs', stdout, stderr }, null, 2) + '\n')
} finally { await unlink(path) }
