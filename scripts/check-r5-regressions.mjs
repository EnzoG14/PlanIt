import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'

// Run existing suites against all migrations. Only redirect evidence paths;
// never overwrite previous release evidence or change test expectations here.
const run = promisify(execFile)
const out = process.env.PLANIT_SQL_OUTPUT ?? 'docs/qa/r5-block-1'
const available = ['profile','chat','notifications','interests','hidden-access','event-links',
  'invite','event-access','gallery','attendees','rejoin','event-actions','edit-event']
const requested=process.argv.slice(2)
const suites=requested.length?requested:available
if(suites.some(name=>!available.includes(name))) throw new Error('Unknown regression suite')
let results = []
if(requested.length) {
  const previous=JSON.parse(await readFile(`${out}/regressions.json`,'utf8'))
  results=previous.results.filter(r=>!suites.includes(r.suite))
}
await mkdir(`${out}/regressions`,{recursive:true})
async function check(name) {
  const target=`scripts/check-${name}.r5.local.mjs`
  const source=await readFile(`scripts/check-${name}.mjs`,'utf8')
  const redirected=source.replaceAll(/docs\/design\/verification\/[A-Za-z0-9-]+/g,`${out}/regressions/${name}`)
    .replaceAll(/docs\/qa\/r4-block-[0-9]+/g,`${out}/regressions/${name}`)
  await writeFile(target,redirected)
  const startedAt=new Date().toISOString()
  try {
    const {stdout,stderr}=await run(process.execPath,[target],{windowsHide:true,timeout:300000,maxBuffer:4*1024*1024,
      env:{...process.env,PLANIT_UI_OUTPUT:`${out}/regressions/${name}`,PLANIT_SQL_OUTPUT:`${out}/regressions/${name}`}})
    results.push({suite:name,result:'PASS',startedAt,finishedAt:new Date().toISOString(),stdout,stderr,
      source_sha256:createHash('sha256').update(source).digest('hex')})
    console.log(`PASS: existing ${name} suite`)
  } catch(error) {
    results.push({suite:name,result:'FAIL',startedAt,finishedAt:new Date().toISOString(),stdout:error.stdout,stderr:error.stderr})
    console.log(`FAIL: existing ${name} suite`)
  } finally {await unlink(target)}
}
for(let i=0;i<suites.length;i+=3) await Promise.all(suites.slice(i,i+3).map(check))
await writeFile(`${out}/regressions.json`,JSON.stringify({environment:'Existing suites; all 28 migrations; real local PostgreSQL with SQL Auth/Storage scaffolds; redirected evidence only',results,
  result:results.every(r=>r.result==='PASS')?'PASS':'FAIL'},null,2)+'\n')
if(results.some(r=>r.result==='FAIL')) process.exitCode=1
