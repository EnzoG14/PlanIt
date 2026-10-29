import assert from 'node:assert/strict'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

// Existing compiled-app/Auth/REST/Phoenix fixture harness, served on an isolated
// local port. No live user session, remote writes or actual Push are involved.
const source = (await readFile('scripts/check-r6-event-full-ui.mjs', 'utf8')).replace(/\r\n/g, '\n')
const marker = 'try {\n  for (const width of baseline'
assert.equal(source.split(marker).length, 2)
const bootstrap = source.slice(0, source.indexOf(marker))
  .replace('`docs/qa/r6-block-7/ui/${baseline ? \'before-event-full\' : \'after\'}`', '`docs/qa/event-change-notifications/ui/${baseline ? \'before\' : \'after\'}`')
const tests = String.raw`
try {
  for(const width of baseline?[390,1280]:[320,375,390,768,1280]) {
    notices=[{...notice(1,'event_update'),title:'Evento actualizado',body:'Se actualizó “Encuentro de primavera”. Cambios: fecha y horario, lugar. Revisá los datos del evento.'},
      {...notice(2,'event_cancelled'),title:'Evento cancelado',body:'Se canceló “Encuentro de primavera”.'}];
    archived=false;targetOverride=undefined;mode='success';
    const {context,page}=await setup(width);
    await inbox(page);await badge(page,2);
    if(!baseline) {
      await page.locator('.notification-kind').filter({hasText:'Evento actualizado'}).waitFor();
      await page.locator('.notification-kind').filter({hasText:'Evento cancelado'}).waitFor();
    }
    await page.evaluate(()=>document.fonts.ready);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:out+'/inbox-'+width+'.png',fullPage:true});
    if(!baseline&&width===390) {
      const row=page.locator('.notification-row').filter({has:page.getByRole('heading',{name:'Evento actualizado',exact:true})});
      const read=row.getByRole('button',{name:'Marcar leído',exact:true});await read.focus();await page.keyboard.press('Enter');await badge(page,1);
      await row.getByText('Leído',{exact:true}).waitFor();
      targetOverride=null;await row.getByRole('button',{name:'Ver evento',exact:true}).click();
      await page.getByText('El recurso ya no está disponible o no tenés permiso para consultarlo.',{exact:true}).waitFor();
      assert.ok(page.url().endsWith('/notifications'));assert.equal(await row.getByRole('button',{name:'Ver evento'}).count(),0);
      targetOverride=undefined;
      const added={...notice(3,'event_update'),title:'Nuevo cambio recibido'};notices.push(added);emit(added);
      await page.getByRole('heading',{name:'Nuevo cambio recibido',exact:true}).waitFor();await badge(page,2);
      assert.equal(await page.locator('.notification-row').count(),3);
      const cancelled=page.locator('.notification-row').filter({has:page.getByRole('heading',{name:'Evento cancelado',exact:true})});
      await cancelled.getByRole('button',{name:'Ver evento',exact:true}).click();await page.waitForURL('**/events/'+eventId);
      check('Keyboard read and unread count; revoked destination denied; Realtime fixture adds one notice; cancellation opens authorized event');
    }
    if(!baseline) {
      await inbox(page);await page.evaluate(()=>{document.documentElement.style.fontSize='200%'});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.setViewportSize({width,height:420});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
    check('Width '+width+': labels, wrapping and screenshot'+(baseline?' before change':' plus enlarged text/short viewport'));
    await context.close();
  }
  assert.deepEqual(errors,[]);
`;
const cleanup = source.slice(source.indexOf('} catch (error) { failure = error.stack;'))
const temp = 'scripts/.event-change-notifications-ui-run.local.mjs'
await writeFile(temp, bootstrap + tests + cleanup)
try {
  const { stdout, stderr } = await promisify(execFile)(process.execPath, [temp, ...process.argv.slice(2)], { windowsHide: true, timeout: 120000, maxBuffer: 2 * 1024 * 1024 })
  process.stdout.write(stdout); process.stderr.write(stderr)
} catch (error) {
  process.stdout.write(error.stdout ?? ''); process.stderr.write(error.stderr ?? ''); process.exitCode = 1
} finally { await unlink(temp) }
