import assert from 'node:assert/strict'
import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
const read=async p=>JSON.parse(await readFile(p,'utf8'))
const root='docs/qa/r6-block-9/followup',live='20261015-01',visual='20261015-02'
const layers={}
for(const [name,run] of [['prepare',live],['http',live],['realtime',live],['browser',live],['ui',visual],['native',visual],['close',live],['close_visual',visual]]){
 const file=`${root}/${run}/${name==='close_visual'?'close':name}.json`,data=await read(file)
 assert.equal(data.result,'PASS',`Unresolved layer ${name}`);layers[name]={result:data.result,cases:data.results.length,evidence:file,scope:data.environment}
}
for(const stage of ['checks','regression-ui']){
 const file=`${root}/${live}/regressions/${stage}.json`,data=await read(file)
 const latest=Object.values(Object.fromEntries(data.results.map(r=>[r.name,r])));assert.equal(latest.length,5);assert.ok(latest.every(r=>r.result==='PASS'))
 layers[stage]={result:'PASS',cases:latest.length,evidence:file}
}
const sourceFiles=['src/index.css','src/styles/amanecer.css','src/pages/event-analytics.css','src/pages/my-events.css','src/components/AppLayout.tsx','scripts/check-my-events-refresh-ui.mjs']
const source_sha256=Object.fromEntries(await Promise.all(sourceFiles.map(async p=>[p,createHash('sha256').update((await readFile(p,'utf8')).replace(/\r\n/g,'\n')).digest('hex')])))
const requirements=await readFile('docs/requirements/RELEASE_6_REQUIREMENTS.md','utf8')
const criteria=[...requirements.matchAll(/^- \*\*(RF-R6-\d{2}\.CA-\d{2}):\*\* (.+)$/gm)].map(m=>({id:m[1],literal:m[2].trim(),http_jwt:'PASS parcial',ui:'PASS parcial; fixtures B9 + app/JWT real follow-up',realtime:m[1].startsWith('RF-R6-05')?'PASS real':'N/A; no live analytics subscription required',integral:'NOT RUN',human:'PENDIENTE',evidence:m[1].startsWith('RF-R6-05')?[layers.realtime.evidence,layers.browser.evidence]:[layers.http.evidence,layers.ui.evidence]}))
assert.equal(criteria.length,24)
const summary={decision:'NO-GO',state:'Implementado; QA humana/dispositivos pendiente',accepted_integral:0,criteria,layers,source_sha256,defects:[{id:'R6-B9-01',state:'RESUELTO',proof:[layers.ui.evidence,layers.native.evidence],scope:'Reflow/legible event titles and reachable last controls; CSS/native200% six widths four routes'},{id:'R6-B9-02',state:'RESUELTO',proof:layers['regression-ui'].evidence,scope:'Current profile keeps one closed functional Account menu; keyboard/focus/back covered'}],remote_footprint:{dedicated_users_created:14,existing_users_verified_without_profile_changes:2,qa_users_reused_for_visual_confirmation:14,archived_events:layers.close.cases+layers.close_visual.cases,deleted_users:0,deleted_events:0,ddl:0,migrations:0},remaining:['Human acceptance of 24 CA','Physical mobile/device/assistive reader validation','Actual Excel application; CSV parser and browser bytes checked separately'],historical_evidence:'Original B9 files and their 600 hashes retained unchanged; failed follow-up attempts retained as previous snapshots'}
await writeFile(`${root}/summary.json`,JSON.stringify(summary,null,2)+'\n')
const rel=p=>p.replace('docs/qa/','')
const table=Object.entries(layers).map(([k,v])=>`| ${k} | PASS (${v.cases} casos/suites) | [evidencia](${rel(v.evidence)}) |`).join('\n')
const block=`<!-- R6-FOLLOWUP:begin -->
## Seguimiento — correcciones y QA real, 15/10/2026

**Dos P2 resueltos. JWT autenticado y Realtime reales PASS en el alcance ejecutado. R6 sigue NO-GO: aceptación humana pendiente,0/24 CA aceptados integralmente.** [Resumen actual y 24 CA](r6-block-9/followup/summary.json).

Se mantuvo la PR #72 y Amanecer. Se eliminó el mínimo rígido del body; cabecera/dock se envuelven, se reserva la altura medida del dock para scroll/foco y las composiciones estrechas conservan títulos, KPI y controles. El test de Mis eventos ahora exige un menú Cuenta cerrado y funcional en /me, con apertura,Escape y retorno de foco. No se elimina la navegación válida para satisfacer una aserción histórica.

| Capa | Resultado | Fuente |
| --- | --- | --- |
${table}

- HTTP: A/B/C/D/anon contra cinco RPC, perfil/historial/avisos directos,owner/hidden/link-only/follow/archivados,comparación mixta,demografía5+5/supresión,series con historial real,CSV y bloqueo R5. Dos registros HTTP simultáneos compiten por una plaza. Aserciones siempre con publishable key y JWT de login normal.
- Realtime: cuatro JWT distintos,espera SUBSCRIBED,última plaza,reintento confirmado,libre→lleno y rejoin aprobado;cuatro episodios únicos. B/C/D intentan escuchar el filtro de A y no reciben nada durante15s después de la entrega positiva. La recuperación consulta la bandeja tras reconectar. El intento inicial falló por usar id en lugar de request_id en el harness; se conservó y se repitió en un evento QA nuevo,sin cambiar la RPC.
- App real: REST/WebSocket sin interceptar;CSV descargados coinciden byte a byte con las respuestas autorizadas y el período mostrado;A→B limpia el panel privado. Bandeja y campana se actualizan con la app abierta antes de generar el aviso,sin recarga;la interrupción de red se reconcilia sin duplicación y B no recibe el aviso ajeno.
- UI: cuatro superficies×seis anchos,normal y CSS200%,títulos legibles y último control desplazable sobre el dock. Zoom nativo Edge200% por tabs.setZoom/getZoom:24 casos;innerWidth se reduce a la mitad,outerWidth estable,visualViewport.scale=1 y body.zoom=1. Es zoom del navegador bajo viewport emulado,no dispositivo físico ni pinch/DPR forzado. Las capturas nativas son del viewport para no alterar el ancho al capturar fullPage.
- Datos:14 usuarios QA nuevos;las dos cuentas previas sólo se verificaron. La confirmación visual reutilizó esos14 usuarios con eventos nuevos. Se archivaron ${summary.remote_footprint.archived_events} eventos QA mediante RPC,comprobando cancelación+archivo;sin DELETE ni pérdida de historiales,DDL o migraciones. Credencial administrativa sólo en aprovisionador;su copia local fue retirada y las sesiones cerradas. Nada de claves,tokens o contraseñas en Git/evidencia.
- Build/lint y cinco regresiones UI compartidas PASS;advertencias históricas conservadas. El detector marca estilos heredados fuera de paleta en archivos existentes;ninguna corrección introduce colores ni cambia DESIGN/sidecar. Fuente,contraste y reglas Amanecer conservados.

Quedan aceptación humana y comprobaciones físicas/lector/Excel. No se trasladan automáticamente los PASS de estas capas a la aceptación integral. Los fallos y NOT RUN del informe inicial inferior son su fotografía histórica,superada sólo en los puntos acreditados aquí. [Reproducción y limpieza](r6-block-9/followup/README.md). Sin merge/deploy ni siguiente bloque.
<!-- R6-FOLLOWUP:end -->

`
const reportPath='docs/qa/RELEASE_6_TEST_REPORT.md';let report=await readFile(reportPath,'utf8')
report=report.replace(/<!-- R6-FOLLOWUP:begin -->[\s\S]*?<!-- R6-FOLLOWUP:end -->\n*/,'')
report=report.replace(/^## Informe B9 inicial — histórico\r?\n/gm,'')
report=report.replace(/(# Release 6[^\n]*\r?\n)/,'$1\n'+block+'## Informe B9 inicial — histórico\n')
await writeFile(reportPath,report)
const acceptancePath='docs/qa/RELEASE_6_ACCEPTANCE.md';let acceptance=await readFile(acceptancePath,'utf8')
acceptance=acceptance.replace(/^\| RF-R6-[^\n]+/gm,line=>{const id=line.split('|')[1].trim();const c=criteria.find(c=>c.id===id);assert.ok(c);return `| ${c.id} | ${c.literal} | PASS parcial B9 | PASS parcial real+fixtures | PASS parcial real | ${c.realtime} | NOT RUN | [seguimiento](r6-block-9/followup/summary.json) |`})
if(!acceptance.includes('**Seguimiento B9 —')) acceptance=acceptance.replace('## Convenciones de QA','**Seguimiento B9 — 15/10/2026:** P2 resueltos;HTTP/JWT y Realtime reales comprobados con datos QA aislados. [Alcance exacto por capa](r6-block-9/followup/summary.json). NO-GO y0/24 aceptados integralmente: falta aceptación humana. Los bloqueos técnicos de B9 inicial son históricos.\n\n## Convenciones de QA')
await writeFile(acceptancePath,acceptance)
const statusPath='docs/implementation/RELEASE_6_STATUS.md';let status=await readFile(statusPath,'utf8')
status=status.replace(/\*\*Estado global:\*\*[^\n]+/,'**Estado global:** B9 corregido y QA HTTP/JWT/Realtime real ejecutada; **NO-GO, QA humana pendiente** (15/10/2026). P2 zoom y harness Mis eventos resueltos;[alcance y evidencias](../qa/r6-block-9/followup/summary.json).0/24 CA aceptados integralmente. R5 conserva GO humano;sin nuevas migraciones,merge o deploy.')
status=status.replace(/^\| 9 \|[^\n]+/m,'| 9 | QA integral y seguimiento | Implementado; QA humana pendiente; NO-GO | codex/r6-block-9; [PR #72 draft](https://github.com/EnzoG14/PlanIt/pull/72) | 120d50a | 0/0/0/0 nuevas | 24 CA trazados;JWT/Realtime real PASS parcial;dos P2 resueltos;aceptación0/24 | NO |')
if(!status.includes('### B9 — Seguimiento')) status+='\n\n### B9 — Seguimiento autorizado,15/10/2026\n\n- [Reporte actual](../qa/RELEASE_6_TEST_REPORT.md),[pruebas y fuentes](../qa/r6-block-9/followup/summary.json). Dos P2 corregidos,14 usuarios QA dedicados y23 eventos QA archivados,sin borrar historiales ni tocar datos ajenos. HTTP/JWT real,Realtime real y app real verificados;aceptación humana pendiente. Rama/PR72 conservadas y evidencia inicial intacta. Sin DDL,merge,deploy o nueva release.\n'
await writeFile(statusPath,status)
console.log('Follow-up report updated: two P2 resolved, real transport PASS; human GO pending')
