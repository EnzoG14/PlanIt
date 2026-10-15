import assert from 'node:assert/strict'
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const out = 'docs/qa/r6-block-9'
const read = async path => JSON.parse(await readFile(path,'utf8'))
const stages = {}
for (const stage of ['sql','contract','ui','r5','regression','checks','regression-ui']) {
  const data = await read(`${out}/${stage}.json`)
  stages[stage] = Object.values(Object.fromEntries(data.results.map(r=>[r.name,r])))
  const expected = {sql:7,contract:5,ui:6,r5:11,regression:16,checks:5,'regression-ui':5}[stage]
  assert.equal(stages[stage].length,expected,`Incomplete ${stage}; do not generate a final report`)
}
const source = await readFile('docs/requirements/RELEASE_6_REQUIREMENTS.md','utf8')
const criteria = [...source.matchAll(/^- \*\*(RF-R6-\d{2}\.CA-\d{2}):\*\* (.+)$/gm)].map(m=>({id:m[1],literal:m[2].trim()}))
assert.equal(criteria.length,24); assert.equal(new Set(criteria.map(c=>c.id)).size,24)
const cases = [
  ['occupancy','occupancy','A, evento 10/4/6/40% y archivado','B/C/D/anon no acceden al panel ni RPC'],
  ['occupancy','occupancy','Fórmula 4/10 y fracción sin redondear, organizador excluido','Cero confirmados y capacidad no utilizable; nunca negativo/NaN'],
  ['occupancy','occupancy','Alta, retiro y retorno modifican KPI al refrescar','Carrera por última plaza no crea sobrecupo ni respuesta antigua'],
  ['occupancy','occupancy','Dueño lee evento propio público/oculto','Participante, link-only, follower, ajeno, sin UID y anon denegados'],
  ['demographics','demographics','Cohortes autorizadas ≥5; edad y sexo agrupados','Categoría 1..4 suprime dimensión completa antes del payload'],
  ['periods','periods','Ventana inicial 30 días AR y primera alta','Reingreso es reincorporación; no duplica nuevas inscripciones'],
  ['demographics','demographics','NULL/unknown y cumpleaños/29 de febrero','No DOB/sexo individual/ID; diferencias residuales aceptadas D04'],
  ['demographics','demographics','Sin población empty; suficientes datos available','Suppressed y error diferenciados; sin gráficos ficticios'],
  ['periods','periods','Presets 7/30/90 y manual≤366, día/semana','Fechas malformadas, bucket inválido y rango excesivo rechazados'],
  ['periods','periods','Recalcular tres flujos sólo en [desde,hasta)','Medianoche/lunes/semanas parciales no incluyen historia externa'],
  ['periods','periods','Rango válido carga con fechas inclusivas en UI','Desde>hasta e igualdad/rango inválido dan mensaje, no cero falso'],
  ['periods','periods','Último rango/evento vigente controla la respuesta','Respuesta tardía/logout/offline no conserva datos antiguos'],
  ['csv','csv','Dos descargas separadas del dueño','Otros actores, vacío y contexto cambiado no descargan'],
  ['csv','csv','Cabeceras BOM/;/CRLF; mismos buckets y cantidades que gráfico','Cambiar filtro/sesión o respuesta ajena invalida archivo'],
  ['csv','csv','Parser Python independiente y roundtrip Unicode/quotes','Fórmulas con prefijos/control neutralizadas; sin PII'],
  ['csv','csv','Descarga válida y cancelación explícita','Vacío, timeout, 5001 filas o >10MiB no producen parcial exitoso'],
  ['event-full','event-full','Última inscripción confirmed registra aviso owner','Antes de completar cupo no hay aviso; rollback revierte ambos'],
  ['event-full-inbox','event-full','Bandeja identifica nombre actual autorizado y estado leído','Archivado/sin ownership oculta nombre y target; revalidación al clic'],
  ['event-full','event-full','Una plaza libre no origina aviso','Edición de cupo, cancelado/rechazado y duplicado no notifican'],
  ['event-full','event-full','D07 lleno→libre→lleno por alta/rejoin genera nuevo episodio','Carreras/reintento/ack perdido no duplican; cuentas ajenas sin lectura'],
  ['compare','compare','Seleccionar 2 y hasta 10 eventos propios','0/1/11/duplicados/NULL no producen comparación válida'],
  ['compare','compare','4/10=40% y15/20=75%; paridad RPC individual','Capacidad inválida muestra N/D; no divide por cero'],
  ['compare','compare','Cambiar selección y filtros, conservar archivados','Carrera de selección descarta respuesta previa y errores borran filas'],
  ['compare','compare','Propios de todos los estados, N/D explicado','Mezcla con ajeno/inexistente rechaza todo; sin títulos/porcentajes ajenos'],
]
async function assertions(directory) {
  const found=[]
  for (const e of await readdir(directory,{withFileTypes:true})) {
    const path=`${directory}/${e.name}`
    if(e.isDirectory()) found.push(...await assertions(path))
    else if(e.name.endsWith('.json') && e.name!=='run.json') {
      let data; try{data=await read(path)}catch{continue}
      const tests=data.results?.filter(r=>r.test).map(r=>({test:r.test,result:r.result,width:r.width}))??[]
      if(tests.length) found.push({path,tests})
    }
  }
  return found
}
for(let i=0;i<criteria.length;i++) {
  const [sqlName,uiName,positive,adversarial]=cases[i]
  const sql=stages.sql.find(r=>r.name===sqlName),ui=stages.ui.find(r=>r.name===uiName)
  const sqlAssertions=await assertions(sql.directory),uiAssertions=await assertions(ui.directory)
  assert.ok(sqlAssertions.length && uiAssertions.length,`Missing assertion evidence ${criteria[i].id}`)
  Object.assign(criteria[i],{case_id:`R6-TC-${criteria[i].id.slice(6,8)}-${criteria[i].id.slice(-2)}`,positive,adversarial,actors:{sql:{A:'50000000-0000-4000-8000-000000000001',B:'50000000-0000-4000-8000-000000000002',C:'50000000-0000-4000-8000-000000000003',D:'50000000-0000-4000-8000-000000000004',anon:'anon without UID'},ui_owner:'20000000-0000-4000-8000-000000000001',roles:'A owner; B confirmed; C removed/cancelled/link-only/follower; D foreign. Extra synthetic actors and dynamically generated event IDs are created in the cited local runner.'},dataset:'Synthetic fixture defined by the hashed source runner; no real participant data.',sql_local:sql.result==='PASS'?'PASS parcial':'FAIL',ui_fixture:ui.result==='PASS'?'PASS parcial':'FAIL',http_jwt_real:'BLOCKED',realtime_real:'BLOCKED',integral:'NOT RUN',human:'PENDIENTE',evidence:{sql:sql.directory,ui:ui.directory,sql_assertions:sqlAssertions,ui_assertions:uiAssertions}})
}
const audit=await read(`${out}/audit.json`),http=await read(`${out}/http-anon.json`),pwa=await read(`${out}/pwa/results.json`),a11y=await read(`${out}/accessibility-extended/results.json`)
const metrics=await Promise.all([320,360,375,390,768,1280].map(w=>read(`${out}/accessibility-extended/metrics-${w}.json`)))
const contrast=(a,b)=>{const l=x=>{const rgb=x.match(/\d+/g).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]};const x=l(a),y=l(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
const sampleContrast=contrast(metrics[0].text,'rgb(246,245,253)')
assert.ok(sampleContrast>=4.5)
const failures=Object.entries(stages).flatMap(([stage,rows])=>rows.filter(r=>r.result==='FAIL').map(r=>({stage,name:r.name,evidence:r.directory,error:r.error})))
const summary={requirements_sha256:createHash('sha256').update(source).digest('hex'),base:audit.base,branch:'codex/r6-block-9',generated_at:new Date().toISOString(),decision:'NO-GO',state:'Implementado; QA pendiente',reason:'JWT autenticado/Realtime reales y aceptación humana pendientes; hallazgo zoom CSS documentado; resultados por capa no otorgan GO.',stages,criteria,audit:{result:audit.result,evidence:`${out}/audit.json`},http_anonymous:{result:http.result,evidence:`${out}/http-anon.json`},pwa:{result:pwa.result,scope:pwa.environment},accessibility:{result:a11y.result,normal_text_contrast:sampleContrast,css_zoom:a11y.results.filter(r=>r.measurement),native_zoom:'NOT RUN'},failures,migrations:{created:0,local_new:0,remote_applied:0,remote_verified_new:0,existing_replayed:37,remote_inventory:37},human_acceptance:'PENDIENTE'}
await writeFile(`${out}/summary.json`,JSON.stringify(summary,null,2)+'\n')

// Hash every captured artifact; exclude this ledger itself to avoid recursion.
const inventory=[]
async function inventoryFiles(path) {
  for(const entry of await readdir(path,{withFileTypes:true})) {
    const file=path+'/'+entry.name
    if(entry.isDirectory()) await inventoryFiles(file)
    else if(!['evidence-index.json','report-command.txt'].includes(entry.name)) {
      const bytes=await readFile(file)
      inventory.push({path:file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')})
    }
  }
}
await inventoryFiles(out)
await writeFile(out+'/evidence-index.json',JSON.stringify({generated_at:new Date().toISOString(),files:inventory},null,2)+'\n')

const table=criteria.map(c=>`| ${c.id} | ${c.literal} | ${c.sql_local} | ${c.ui_fixture} | BLOCKED | BLOCKED | NOT RUN | [casos y evidencia](r6-block-9/summary.json) |`).join('\n')
const counts=Object.entries(stages).map(([stage,rows])=>`| ${stage} | ${rows.filter(r=>r.result==='PASS').length}/${rows.length} PASS | [manifiesto](r6-block-9/${stage}.json) |`).join('\n')
const report=`# Release 6 — QA integral · Bloque 9

**Decisión: NO-GO. Estado: Implementado; QA pendiente. 0/24 CA aceptados integralmente.**

15/10/2026, Argentina. Base integrada \`${audit.base}\`, rama \`codex/r6-block-9\`. B0–B8 integrados: PR #63–#71, incluido B7 #70 después de la espera acordada. R5 conserva GO/Validado por aceptación humana; no se reclasifican sus NOT RUN técnicos. [Baseline](r6-block-9/git-baseline.txt), [resumen computable](r6-block-9/summary.json), [reproducción](r6-block-9/README.md). HEAD final y PR: [acta de entrega](r6-block-9/delivery.json).

## Resultados y límites

| Capa/suite | Resultado | Evidencia |
| --- | --- | --- |
${counts}
| Catálogo remoto READ ONLY | ${audit.result}; PostgreSQL ${audit.server_version},37 versiones,16 tablas RLS,88 funciones | [auditoría](r6-block-9/audit.json), [catálogo](r6-block-9/catalog.json) |
| HTTP anónimo real | ${http.result};9 denegaciones401; no JWT de usuario | [HTTP](r6-block-9/http-anon.json) |
| Service Worker/offline shell | ${pwa.result}; Edge real, shell anónimo localhost | [PWA](r6-block-9/pwa/results.json) |
| Accesibilidad ampliada | ${a11y.result}; foco3px,targets muestreados≥44px,contraste texto/fondo ${sampleContrast.toFixed(2)}:1; zoom CSS falla en4 anchos | [mediciones](r6-block-9/accessibility-extended/results.json) |
| JWT autenticado A/B/C/D y Realtime real | BLOCKED; faltan cuentas/fixtures autorizados | No sustituir con SET ROLE/WebSocket simulado |
| Dispositivo físico,instalación/upgrade,lector,zoom nativo,Excel real | NOT RUN | Emulación/parser no certifica estas superficies |
| Aceptación humana R6 | PENDIENTE | Requiere declaración expresa del responsable |

Las suites SQL usan PostgreSQL local real con scaffolds Auth/Storage y claims SQL; no PostgREST autenticado. La UI ejecuta React compilado y SDK real con Auth/REST/WebSocket interceptados. Todas las pruebas nuevas viven en B9: etiquetas SHA históricas dentro de runners heredados no son la versión de esta auditoría; mandan los manifiestos B9 y hashes de fuente. No se copiaron resultados históricos como pruebas nuevas.

## Los 24 CA oficiales

Transcripción literal desde requisitos versionados. Cada fila tiene caso positivo/adversarial, actor,dataset,fuente SHA y aserciones ejecutadas en summary.json. PASS parcial significa cobertura técnica de la suite citada; no prueba de aceptación funcional completa.

| CA | Texto literal | SQL local | UI fixtures | HTTP JWT | Realtime real | Integral | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- |
${table}

## Seguridad, decisiones e integridad

- RPC owner-only: ocupación,demografía,series,export y comparación; UID/ownership antes de agregar,DEFINER/search_path vacío y EXECUTE authenticated. B7 conserva tres RPC INVOKER restringidas. Productor privado INVOKER sin EXECUTE de clientes. [Firmas/ACL](r6-block-9/audit.json); comparación completa de cuerpos/ACL/config con replay en la suite R5 edit-profile.
- A/B/C/D/anon/sin UID,public/unlisted,cancelled/removed,ended/cancelled/archived; acceso directo y mezcla de IDs rechazada íntegramente. Perfil completo privado; sin DOB/sexo individual/email en DTO/CSV. Realtime publica sólo messages/notifications; no demografía/historial. SQL y mocks no certifican entrega/revocación remota.
- D04/D08 vigentes: k5 y supresión completa por dimensión,edad al día AR; riesgo residual de inferencia temporal/multievento **aceptado expresamente en B3**. No volver a exigir anonimato absoluto ni presentarlo como garantía probada.
- D03: inicial30,presets7/30/90,manual≤366 y semanas parciales; tres flujos por historial. D05/D06: snapshot≤5000filas/10MiB/15s,CSV separados sin demografía; mismo conjunto de buckets que la gráfica y neutralización reversible de fórmulas. D07: aviso atómico por cada episodio libre→lleno,con reintentos,carreras,rollback y rejoin. D09/D10: 2–10 propios de todos los estados; misma fórmula que panel. D01/D11 conservan precisión de presentación y actualización existentes,sin nueva promesa push.
- Historial remoto37/37 y cuerpos coincidentes con replay; B8 aparece aplicada y se verifica por catálogo actual,aunque el seguimiento integrado conservaba1/1/0/0. B9 no aplicó ninguna migración ni creó nuevas. Mantener independientes aplicación histórica y verificación nueva de catálogo.
- Asesores actuales:50 hallazgos WARN de DEFINER authenticated,1 WARN de protección de contraseñas y1 INFO de tabla RLS sin políticas (enlaces server-only). Se mantienen; no son nuevos cambios B9. [Asesores y enlaces de remediación](r6-block-9/advisors.json). npm audit:0 vulnerabilidades, [resultado](r6-block-9/npm-audit.json).

## Defectos, discrepancias y gate

- **P0/P1 de producto confirmados en lo ejecutado: ninguno.** Esto no acredita las capas bloqueadas.
- **P2 R6-B9-01 — desbordamiento con zoom CSS200%:** documento640px a viewport320/360/375/390;768/1280 pasan. La base limita el ancho mínimo a320px; al escalar por2 produce640px y el dock puede recortarse. [Captura390](r6-block-9/accessibility-extended/css-zoom-200-390.png), [mediciones](r6-block-9/accessibility-extended/results.json). Texto200% pasa. Investigar reflow y confirmar con zoom nativo antes de proponer corrección; esta reproducción CSS no se presenta como prueba WCAG de zoom nativo. Sin cambios de producto B9.
- **P2 de harness corregido:** contrato B1 no resolvía imports añadidos B3–B8 al ejecutar un data URL. Se resuelven contra archivos reales; todas las aserciones se conservan. [Intento original](r6-block-9/contract/occupancy/attempt-1/run.json), [repetición](r6-block-9/contract/occupancy/attempt-2/run.json). El probe HTTP inicial usó p_before_created_at en lugar de p_before_at:404 de llamada inválida, no fallo de autorización; [intento](r6-block-9/http-anon-attempt-1.json) y resultado corregido conservados.
- **P2 R6-B9-02 — harness histórico de Mis eventos:** falla la aserción «other routes preserve the current header» en \`/me\` (1 menú Cuenta observado frente a0 esperado), igual que en B8. El menú coincide con la navegación vigente; no se modifica la expectativa en esta auditoría. [stderr reproducible](r6-block-9/regression-ui/my-events-refresh/attempt-1/stderr.txt). Las fallas quedan además en summary.failures.
- **P2 documental:** STATUS de main aún hablaba de PR #70 pendiente y marcas B8 anteriores; se corrige el corte actual manteniendo las bitácoras históricas. R5 PLAN conserva NO-GO histórico,pero STATUS/reporte/acta posteriores acreditan GO humano. DESIGN.md normativo se mantiene; Impeccable detecta sidecar antiguo y no se regenera.
- **Bloqueos de entrega:** sin JWT autenticado ni Realtime real ni aceptación humana R6. Resolver esos pendientes, revisar hallazgo zoom y todos los FAIL antes del GO. PR draft no autoriza merge/deploy/DDL ni nueva release.

## Auditoría visual Amanecer

App real con fixtures en320/360/375/390/768/1280,fuente local,foco,altura corta,reduced-motion,errores,offline y aislamiento. Revisión visual de comparación320,zoom CSS390 y bandeja1280: composición y datos legibles en tamaño normal,estado por texto,tabla/tarjetas equivalentes y aviso identifica evento. [Capturas](r6-block-9/ui/), [detector mecánico sin hallazgos](r6-block-9/impeccable-detector.json). Muestreo de contraste no acredita toda la interfaz ni lector real.

| Dimensión Impeccable | Nota/4 | Base |
| --- | --- | --- |
| Accesibilidad |3| Foco/contraste/semántica medidos;lector y zoom nativo pendientes |
| Rendimiento |2| EXPLAIN sintético y lazy routes;chunk Mapbox grande y dispositivo sin medir |
| Theming |4| Tokens Amanecer,modo claro aprobado,fuente local;sin tema oscuro requerido |
| Responsive |2| Seis anchos/texto200 pasan;zoom CSS estrecho falla |
| Integridad |4| Producto y jerarquía preservados,detector sin hallazgos |
| Total |15/20| Evaluación acotada,no certificación WCAG ni aceptación |

Recomendación para trabajo posterior autorizado: investigar R6-B9-01 con Impeccable adapt y confirmar el resultado con polish; no ejecutar rediseño ni reparación de sidecar dentro de B9.
`
await writeFile('docs/qa/RELEASE_6_TEST_REPORT.md',report)
const acceptancePath='docs/qa/RELEASE_6_ACCEPTANCE.md'
let acceptance=await readFile(acceptancePath,'utf8')
const start=acceptance.indexOf('| CA |',acceptance.indexOf('## Matriz oficial')),end=acceptance.indexOf('### Fuente oficial íntegra',start)
assert.ok(start>=0&&end>start)
acceptance=acceptance.slice(0,start)+`| CA | Texto literal | SQL | UI fixtures | HTTP JWT | Realtime real | Integral | Evidencia |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n${table}\n\n`+acceptance.slice(end)
const adenda='**B9 — 15/10/2026:** QA integral ejecutada sobre B0–B8 integrados,base120d50a. [Reporte](RELEASE_6_TEST_REPORT.md) y [24 casos/evidencias por capa](r6-block-9/summary.json). **NO-GO,0/24 aceptados integralmente**: JWT/Realtime reales bloqueados y firma humana pendiente;UI con fixtures y SQL no los sustituyen. D04 B3 vigente,con riesgo residual aceptado.\n\n'
if(!acceptance.includes('**B9 —')) acceptance=acceptance.replace('## Convenciones de QA',adenda+'## Convenciones de QA')
await writeFile(acceptancePath,acceptance)
const summaryFailures=failures.length+a11y.results.filter(r=>r.result==='FAIL').length
console.log(JSON.stringify({criteria:24,accepted:0,decision:'NO-GO',suite_failures:failures,css_zoom_failures:a11y.results.filter(r=>r.result==='FAIL').length}))
// A NO-GO is a valid audit outcome; actual failing tests still return nonzero.
if(summaryFailures) process.exitCode=1
