import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const source = await readFile('scripts/check-r5-profile-ui.mjs', 'utf8')
const prefix = source.slice(0, source.indexOf('const results=[], errors=[]'))
  .replace("'docs/qa/r5-block-3/ui'", "'docs/qa/r5-block-7/follow-notifications/ui'")
const tests = String.raw`
const results=[],errors=[],sockets=[];let failure;
const noteId='93000000-0000-4000-8000-000000000001';
let notices=[],pending=false,writes=0;
const emit=row=>{for(const socket of sockets) for(const [topic,join] of socket.joins) {
  const bindings=join.bindings.filter(b=>b.table==='notifications'&&b.event==='INSERT'&&b.filter==='recipient_id=eq.'+viewer);
  if(socket.id===viewer&&bindings.length) socket.ws.send(JSON.stringify([join.joinRef,null,topic,'postgres_changes',{ids:bindings.map(b=>b.id),data:{schema:'public',table:'notifications',type:'INSERT',commit_timestamp:'2026-10-14T20:00:00Z',errors:null,columns:[],record:row,old_record:{}}}]));
}};
const setup=async(id,width)=>{
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  await context.addInitScript(value=>localStorage.setItem('sb-iepeqmvzjguwlhnecsdq-auth-token',JSON.stringify(value)),{...session,access_token:'fixture-'+id,user:{...user,id}});
  await context.routeWebSocket('wss://iepeqmvzjguwlhnecsdq.supabase.co/realtime/**',ws=>{
    const socket={ws,id,joins:new Map()};sockets.push(socket);
    ws.onMessage(raw=>{const [joinRef,ref,topic,type,payload]=JSON.parse(String(raw));
      if(type==='phx_join') {const bindings=(payload.config?.postgres_changes??[]).map((binding,index)=>({...binding,id:index+1}));socket.joins.set(topic,{joinRef,bindings});ws.send(JSON.stringify([joinRef,ref,topic,'phx_reply',{status:'ok',response:{postgres_changes:bindings}}]));}
      else if(type==='phx_leave') {socket.joins.delete(topic);ws.send(JSON.stringify([joinRef,ref,topic,'phx_reply',{status:'ok',response:{}}]));}
      else if(type==='heartbeat') ws.send(JSON.stringify([joinRef,ref,topic,'phx_reply',{status:'ok',response:{}}]));
    });ws.onClose(()=>socket.joins.clear());
  });
  await context.route('https://iepeqmvzjguwlhnecsdq.supabase.co/**',async route=>{
    const url=new URL(route.request().url()),path=url.pathname,args=route.request().postDataJSON();
    const reply=(data)=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
    if(path==='/auth/v1/user') return reply({...user,id});
    if(path==='/rest/v1/profiles') return reply({username:'fixture_self',display_name:'Mi perfil fixture',first_name:null,last_name:null,birth_date:null,sex:null,bio:null,visibility:'private',avatar_file_id:null});
    if(path==='/rest/v1/notifications') return route.fulfill({status:200,headers:{'access-control-expose-headers':'content-range','content-range':'0-0/'+(id===viewer?notices.filter(n=>!n.read_at).length:0)},body:''});
    if(path.endsWith('/get_notifications')) return reply(id===viewer?notices:[]);
    if(path.endsWith('/get_notification_changes')) return reply(id===viewer?notices.filter(n=>args.p_ids.includes(n.id)):[]);
    if(path.endsWith('/mark_notification_read')) {const row=notices.find(n=>n.id===args.p_id);row.read_at='2026-10-14T18:00:00';return reply(row.read_at);}
    if(path.endsWith('/get_notification_target')) return reply(id===viewer?'/me/follow-requests':null);
    if(path.endsWith('/get_social_profile')) return reply({display_name:'Perfil privado fixture',username:'perfil_privado',avatar:null});
    if(path.endsWith('/get_social_relationship')) return reply({visibility:'private',follow:pending?{status:'pending'}:null});
    if(path.endsWith('/get_social_counts')) return reply({followers:0,following:0});
    if(path.endsWith('/follow_user')) {
      writes++;assert.equal(id,target);assert.deepEqual(args,{p_target_id:viewer});
      if(!pending) {pending=true;const row={id:noteId,type:'follow_request',title:'Nueva solicitud de seguimiento',body:'Recibiste una solicitud de seguimiento. Revisá tus solicitudes pendientes.',created_at:'2026-10-14T17:00:00',read_at:null,target:'/me/follow-requests'};notices.push(row);emit(row);}
      return reply({status:'pending',request_version:noteId});
    }
    if(path.endsWith('/list_follow_requests')) return reply({requests:pending?[{follower_id:target,request_version:noteId,requested_at:'2026-10-14T17:00:00',display_name:'Solicitante fixture',username:'solicitante',avatar:null}]:[],next_cursor:null});
    return reply([]);
  });
  const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));return {context,page};
};
try {
  for(const width of [390,1280]) {
    notices=[];pending=false;writes=0;
    const receiver=await setup(viewer,width),sender=await setup(target,width);
    await receiver.page.goto(origin+'/me');await receiver.page.getByRole('heading',{name:'Mi perfil',exact:true}).waitFor();
    await receiver.page.waitForFunction(()=>document.querySelector('.notifications-bell')?.getAttribute('aria-label')==='Notificaciones');
    await sender.page.goto(origin+'/users/'+viewer);await sender.page.getByRole('button',{name:'Solicitar seguimiento',exact:true}).click();
    await sender.page.getByRole('button',{name:'Cancelar solicitud',exact:true}).waitFor();assert.equal(writes,1);
    await receiver.page.getByRole('link',{name:'Notificaciones, 1 no leídas',exact:true}).waitFor();
    assert.equal(await sender.page.locator('.notifications-badge').count(),0);
    await receiver.page.locator('.notifications-bell').click();await receiver.page.getByRole('heading',{name:'Nueva solicitud de seguimiento',exact:true}).waitFor();
    await receiver.page.getByText('Seguimiento',{exact:true}).waitFor();
    emit(notices[0]);await receiver.page.getByRole('button',{name:'Ver solicitudes',exact:true}).waitFor();assert.equal(await receiver.page.locator('.notification-row').count(),1);
    await receiver.page.screenshot({path:out+'/notification-'+width+'.png'});
    await receiver.page.getByRole('button',{name:'Ver solicitudes',exact:true}).click();await receiver.page.waitForURL('**/me/follow-requests');await receiver.page.getByText('Solicitante fixture',{exact:true}).waitFor();
    assert.ok(notices[0].read_at);await receiver.page.waitForFunction(()=>!document.querySelector('.notifications-badge'));
    await receiver.page.screenshot({path:out+'/requests-'+width+'.png'});
    await receiver.page.goto(origin+'/notifications');await receiver.page.getByRole('heading',{name:'Nueva solicitud de seguimiento',exact:true}).waitFor();
    notices.unshift({...notices[0],id:'93000000-0000-4000-8000-000000000002',title:'Solicitud recuperada',created_at:'2026-10-14T18:00:00',read_at:null});
    for(const socket of sockets.filter(s=>s.id===viewer)) for(const [topic,join] of socket.joins) socket.ws.send(JSON.stringify([join.joinRef,null,topic,'phx_error',{}]));
    await receiver.page.getByRole('heading',{name:'Solicitud recuperada',exact:true}).waitFor();await receiver.page.getByRole('link',{name:'Notificaciones, 1 no leídas',exact:true}).waitFor();
    assert.equal(await receiver.page.locator('.notification-row').count(),2);
    for(const fixture of [receiver,sender]) {assert.ok(await fixture.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await fixture.context.close();}
    results.push({width,result:'PASS',test:'Two fixture sessions:follow mutation→notification INSERT WebSocket→badge without reload;recipient-only UI;dedup;mark read and safe requests target;reconnect catch-up'});
    console.log('PASS '+width+': follow request notification realtime fixture');
  }
  assert.deepEqual(errors,[]);
} catch(error) {failure=error.stack;throw error;}
finally {await writeFile(out+'/results.json',JSON.stringify({environment:'Actual Vite build + Supabase SDK; mocked HTTP and Phoenix WebSocket; not remote JWT or Realtime transport proof',results,errors,failure,result:failure?'FAIL':'PASS'},null,2));await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
`
await mkdir('.r5-check.local', { recursive: true })
const path = '.r5-check.local/request-notifications-ui.mjs'
await writeFile(path, prefix + tests)
try {
  const { stdout, stderr } = await promisify(execFile)(process.execPath, [path], { windowsHide: true, timeout: 120000, maxBuffer: 4 * 1024 * 1024 })
  console.log(stdout); console.error(stderr)
} finally { await unlink(path) }
