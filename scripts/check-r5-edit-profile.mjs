import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'
const out=process.env.PLANIT_SQL_OUTPUT??'docs/qa/r5-block-4/sql'
const source=await readFile('scripts/check-r5-social.mjs','utf8')
const marker='  const avatarPath = `${bId}/avatar.png`'
assert.equal(source.split(marker).length,2)
const tests=`
  {
    const catalog=JSON.parse(await readFile(process.env.PLANIT_R5_FULL_CATALOG??'docs/qa/r5-block-4/remote/catalog.json','utf8')).rows[0].metadata;
    assert.deepEqual(catalog.migrations.map(m=>m.version),migrations.map(m=>m.file.split('_')[0]));
    const local=(await admin.query("select n.nspname as schema,p.proname as name,pg_get_function_identity_arguments(p.oid) as identity_arguments,pg_get_functiondef(p.oid) as definition,p.prosecdef as definer,p.proconfig as config,has_function_privilege('anon',p.oid,'execute') as anon_execute,has_function_privilege('authenticated',p.oid,'execute') as authenticated_execute from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','planit_private') and p.prokind='f'")).rows;
    const comparison=catalog.functions.filter(f=>f.name!=='rls_auto_enable').map(f=>{
      const l=local.find(l=>l.schema===f.schema&&l.name===f.name&&l.identity_arguments===f.identity_arguments);
      return {name:f.schema+'.'+f.name,body:!!l&&hash(l.definition)===hash(f.definition),acl:!!l&&l.anon_execute===f.anon_execute&&l.authenticated_execute===f.authenticated_execute,config:!!l&&l.definer===f.definer&&JSON.stringify(l.config)===JSON.stringify(f.config)};
    });
    assert.ok(comparison.every(r=>r.body&&r.acl&&r.config));
    assert.ok(catalog.tables.every(t=>t.rls));
    await writeFile(out+'/remote-comparison.json',JSON.stringify({migrations:catalog.migrations.length,rls_tables:catalog.tables.length,functions:comparison,result:'PASS'},null,2)+'\\n');
    record('Read-only catalog migration versions, RLS tables and function bodies/ACL/config match full local replay');
  }
  {
    const ownerId='84000000-0000-4000-8000-000000000001';
    await admin.query('insert into auth.users values($1,$2)',[ownerId,{display_name:'Edición fixture'}]);
    const owner=await connect(); await role(owner,ownerId);
    const sql='select public.update_my_social_profile($1,$2,$3,$4,$5,$6,$7,$8)';
    const args=['editor_fixture','Nombre visible','Nombre privado','Apellido privado','2000-02-29','other','Biografía guardada','private'];
    await value(owner,sql,args);
    const saved=(await owner.query('select * from public.profiles where id=$1',[ownerId])).rows[0];
    assert.equal(saved.username,args[0]); assert.equal(saved.first_name,args[2]); assert.equal(saved.last_name,args[3]); assert.equal(saved.sex,args[5]); assert.equal(saved.bio,args[6]);
    assert.equal(saved.visibility,'private');
    const anotherSession=await connect(); await role(anotherSession,ownerId);
    assert.equal(await value(anotherSession,'select bio from public.profiles where id=$1',[ownerId]),args[6]);
    assert.equal((await c.query('select * from public.profiles where id=$1',[ownerId])).rowCount,0);
    assert.equal((await c.query("update public.profiles set display_name='Ataque' where id=$1",[ownerId])).rowCount,0);
    assert.deepEqual(Object.keys(await profile(c,ownerId)).sort(),['avatar','display_name','username']);
    await denied(value(anon,sql,args)); await denied(value(missing,sql,args));
    for (const [index,bad,code] of [[0,'UPPER','23514'],[0,'ab','23514'],[0,'x'.repeat(25),'23514'],[1,'x','23514'],[6,'x'.repeat(501),'23514'],[7,'hidden','23514'],[5,'invalid','23514']]) {
      const invalidArgs=[...args];invalidArgs[index]=bad;
      await assert.rejects(value(owner,sql,invalidArgs),error=>error.code===code);
    }
    const duplicate=[...args];duplicate[0]=await value(c,'select username from public.profiles where id=$1',[cId]);
    await assert.rejects(value(owner,sql,duplicate),error=>error.code==='23505');
    assert.equal(await value(owner,'select username from public.profiles where id=$1',[ownerId]),args[0]);
    const request=await follow(c,ownerId);assert.equal(request.status,'pending');
    const published=[...args];published[7]='public';assert.equal((await value(owner,sql,published)).accepted_requests,1);
    assert.equal((await value(owner,sql,published)).accepted_requests,0);
    await value(owner,sql,args);
    assert.equal((await profile(c,ownerId)).bio,args[6]);
    assert.equal(await value(admin,"select status from public.user_follows where follower_id=$1 and followed_id=$2",[cId,ownerId]),'accepted');
    await c.query('select public.unfollow_user($1)',[ownerId]);
    assert.deepEqual(Object.keys(await profile(c,ownerId)).sort(),['avatar','display_name','username']);
    record('B4 CA01..04: editable personal fields persist across owner sessions; foreign SELECT/PATCH and anonymous RPC denied; constraints/username unique rollback; public transition autoaccepts once; private retains accepted and third-party projections stay minimal');
    const one=ownerId+'/84000000-0000-4000-8000-000000000011.png';
    const two=ownerId+'/84000000-0000-4000-8000-000000000012.webp';
    const staging=ownerId+'/84000000-0000-4000-8000-000000000013.jpg';
    for(const [path,mime,size] of [[one,'image/png',1024],[two,'image/webp',2048],[staging,'image/jpeg',1024]]) await owner.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values('avatars',$1,$2,$3)",[path,ownerId,{mimetype:mime,size,cacheControl:'max-age=0'}]);
    const first=await value(owner,'select public.set_my_avatar($1)',[one]);
    await denied(value(c,'select public.set_my_avatar($1)',[one]));
    const second=await value(owner,'select public.set_my_avatar($1)',[two]);assert.notEqual(first,second);
    assert.equal(await value(owner,'select public.set_my_avatar($1)',[two]),second);
    assert.equal((await owner.query('delete from storage.objects where name=$1',[one])).rowCount,0);
    assert.equal((await owner.query('delete from storage.objects where name=$1',[staging])).rowCount,1);
    await denied(value(owner,'select public.set_my_avatar($1)',[staging]));
    assert.equal(await value(owner,'select avatar_file_id from public.profiles where id=$1',[ownerId]),second);
    for(const [suffix,mimetype,size] of [['bad','image/svg+xml',1024],['large','image/png',5242881],['empty','image/png',0]]) {
      const path=ownerId+'/'+suffix+'.png';
      await owner.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values('avatars',$1,$2,$3)",[path,ownerId,{mimetype,size,cacheControl:'max-age=0'}]);
      await assert.rejects(value(owner,'select public.set_my_avatar($1)',[path]),error=>error.code==='23514');
      assert.equal(await value(owner,'select avatar_file_id from public.profiles where id=$1',[ownerId]),second);
    }
    await value(owner,'select public.set_my_avatar(null)');
    assert.equal(await value(anotherSession,'select avatar_file_id from public.profiles where id=$1',[ownerId]),null);
    assert.equal((await owner.query('delete from storage.objects where name=$1',[two])).rowCount,0);
    record('B4 avatar: owner path, replacement and idempotence, unregistered cleanup, registered retention, invalid MIME/size and failed replace rollback; removal persists in another session');
  }
`
await mkdir('.r5-check.local',{recursive:true});await mkdir(out,{recursive:true})
const path='.r5-check.local/edit-profile.mjs'
await writeFile(path,source.replace(marker,tests+marker).replace("base:'da4379f',branch:'codex/r5-block-1'","base:'286d38ecf7e461ebd9218a6f71e8ff10a41e0bae',branch:'codex/r5-block-4'"))
try {
 const {stdout,stderr}=await promisify(execFile)(process.execPath,[path],{windowsHide:true,timeout:300000,maxBuffer:4*1024*1024,env:{...process.env,PLANIT_SQL_OUTPUT:out}})
 console.log(stdout)
 await writeFile(out+'/harness.json',JSON.stringify({harness:'scripts/check-r5-social.mjs',sha256:createHash('sha256').update(source).digest('hex'),extension:'scripts/check-r5-edit-profile.mjs',stdout,stderr},null,2)+'\n')
} finally {await unlink(path)}
