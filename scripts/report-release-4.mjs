import assert from 'node:assert/strict'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const root='docs/qa/r4-block-9'
const commands=JSON.parse(await readFile(`${root}/commands.json`,'utf8'))
const byCommand=new Map(commands.results.map(r=>[r.check,r]))
const acceptancePath='docs/qa/RELEASE_4_ACCEPTANCE.md'
const acceptance=await readFile(acceptancePath,'utf8')
const baseline=execFileSync('git',['show',`${commands.base}:${acceptancePath}`],{encoding:'utf8'})
const rows=text=>text.split(/\r?\n/).filter(l=>/^\| RF-R4-\d{2}\.CA-\d{2} \|/.test(l)).map(l=>l.split('|').map(s=>s.trim()))
const original=rows(baseline),current=rows(acceptance)
assert.equal(original.length,39);assert.deepEqual(current.map(r=>[r[1],r[2]]),original.map(r=>[r[1],r[2]]),'Never alter the 39 literal criteria')
const groups={
  '01':['search','search:ui'],'02':['search','search:ui','filters:ui'],
  '03':['search','filters:ui','r4:boundaries'],'04':['search','filters:ui','r4:boundaries'],
  '05':['interests','interests:ui'],'06':['suggestions','suggestions:ui'],
  '07':['event-links','event-links:ui','invite'],
  '08':['invite','invite:ui','hidden-access'],'09':['event-access','event-access:ui','invite'],
}
const resultFor=names=>names.every(n=>byCommand.get(`check:${n}`)?.result==='PASS')?'PASS':names.some(n=>byCommand.get(`check:${n}`)?.result==='FAIL')?'FAIL':'NOT RUN'
const evidenceFor=names=>names.map(n=>({command:`npm run check:${n}`,source:`scripts/check-${n.replace(':ui','-ui').replace('r4:','r4-')}.mjs`,result:byCommand.get(`check:${n}`)?.result??'NOT RUN',directory:`${root}/check-${n.replaceAll(':','-')}`}))
const ca=current.map(r=>({id:r[1],literal:r[2],scenario:r[3],localResult:resultFor(groups[r[1].slice(6,8)]),evidence:evidenceFor(groups[r[1].slice(6,8)]),httpJwtResult:'NOT RUN',humanAcceptance:'NOT RUN',state:'Implementado; QA pendiente'}))
const d=[['search','search:ui'],['search'],['search','search:ui'],['search','filters:ui'],['search:ui','filters:ui'],['r4:boundaries','search'],['search','filters:ui'],['r4:boundaries','filters:ui'],['search'],['search','search:ui','discovery:ui'],['search:ui','filters:ui'],['filters:ui','search:ui']]
const p=[['interests','interests:ui'],['interests','interests:ui'],['interests'],['interests:ui'],['suggestions'],['suggestions','suggestions:ui'],['suggestions','hidden-access']]
const h=[['event-links'],['hidden-access','invite'],['invite','hidden-access'],['invite'],['invite'],['event-links'],['event-links','invite'],['invite','event-access'],['invite'],['invite'],['hidden-access','event-links'],['hidden-access','invite','event-access'],['invite','hidden-access'],['event-access'],['event-access','event-links'],['event-access','rejoin'],['event-access'],['event-access'],['hidden-access'],['event-access','hidden-access'],['invite:ui'],['interests:ui','suggestions:ui','r4:ui'],['event-links','hidden-access'],['event-links','event-actions'],['hidden-access','event-links'],['hidden-access','invite'],['event-links','event-links:ui'],['hidden-access','invite']]
const plan=await readFile('docs/qa/RELEASE_4_TEST_PLAN.md','utf8')
const scenarios=[]
for(const [prefix,list] of [['D',d],['P',p],['H',h]])for(let i=0;i<list.length;i++){
  const id=`${prefix}${String(i+1).padStart(2,'0')}`,row=plan.split(/\r?\n/).find(l=>l.startsWith(`| ${id} |`))?.split('|').map(s=>s.trim())
  assert.ok(row,`Missing scenario ${id}`)
  scenarios.push({id,scenario:row[2],expected:row[3],localResult:resultFor(list[i]),evidence:evidenceFor(list[i]),httpJwtResult:'NOT RUN',limit:prefix==='H'?'SQL Auth/Storage scaffolding or intercepted UI; not HTTP JWT/Storage/Realtime end-to-end':id==='D08'?'Insecure context/timeout unit; denied-GPS fallback browser fixture; not physical GPS':'Local SQL or UI fixture'})
}
await writeFile(`${root}/traceability.json`,JSON.stringify({base:commands.base,criteriaCount:ca.length,literalSha256:createHash('sha256').update(JSON.stringify(ca.map(c=>[c.id,c.literal]))).digest('hex'),criteria:ca,scenarios},null,2)+'\n')
const matrix=['# R4 B9 · Trazabilidad de ejecución local','','Los resultados SQL y navegador son locales/fixtures. HTTP JWT funcional y aceptación humana: **NOT RUN** en los 39 CA.','', '| CA | Resultado local | Caso reproducible |','| --- | --- | --- |',...ca.map(c=>`| ${c.id} | ${c.localResult} | ${c.evidence.map(e=>`[${e.command}](../../../${e.source})`).join(' · ')} |`),'','## Escenarios D/P/H','','| Caso | Resultado local | Pruebas |','| --- | --- | --- |',...scenarios.map(c=>`| ${c.id} | ${c.localResult} | ${c.evidence.map(e=>e.command).join(' · ')} |`),'','Cada directorio indicado en [traceability.json](traceability.json) contiene los resultados/afirmaciones de su suite, y [commands.json](commands.json) conserva comandos, duración, salida e intentos. El PASS combinado no acredita la capa remota.','']
await writeFile(`${root}/TRACEABILITY.md`,matrix.join('\n'))
// Inventory every new artifact by bytes and SHA; historical directories are never rewritten.
async function inventory(directory){let files=[];for(const item of await readdir(directory,{withFileTypes:true})){const path=`${directory}/${item.name}`;if(item.isDirectory())files.push(...await inventory(path));else if(item.name!=='artifacts.json'&&!item.name.endsWith('.log')){const bytes=await readFile(path);files.push({path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')})}}return files}
await writeFile(`${root}/artifacts.json`,JSON.stringify({base:commands.base,files:await inventory(root)},null,2)+'\n')
console.log(JSON.stringify({criteria:ca.length,localPass:ca.filter(c=>c.localResult==='PASS').length,scenarios:scenarios.length,scenarioPass:scenarios.filter(c=>c.localResult==='PASS').length,commands:commands.results.length,failed:commands.results.filter(c=>c.result!=='PASS').map(c=>c.check)}))
