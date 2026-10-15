import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { attendeesCsv, statisticsCsv, serializeCsv, neutralizeCsvText, parseAttendeeExport, MAX_EXPORT_BYTES, checkExportSize } from '../src/features/analytics/csv.ts'
import { bucketStarts, presetPeriod } from '../src/features/analytics/periods.ts'
const out='docs/qa/r6-block-5/contract'
await mkdir(out,{recursive:true})
const results=[]
const check=(test,fn)=>{fn();results.push({test,result:'PASS'})}
const dto={version:1,event_id:'event',event_title:'Encuentro; "primavera"',as_of:'2026-10-15T12:00:00',rows:[{username:'ana',display_name:'Ána\nLópez',status:'confirmed',first_registered_at:'2026-10-01T12:00:00'}]}
check('DTO strict allowlist, version, event, valid times, status and 5000-row bound',()=>{
  assert.deepEqual(parseAttendeeExport(dto,'event'),dto)
  for(const bad of [null,{}, {...dto,version:2},{...dto,event_id:'other'},{...dto,email:'private'}, {...dto,as_of:'invalid'}, {...dto,rows:[{...dto.rows[0],birth_date:'private'}]}, {...dto,rows:[{...dto.rows[0],status:'removed'}]}, {...dto,rows:Array(5001).fill(dto.rows[0])}])assert.throws(()=>parseAttendeeExport(bad,'event'))
  assert.equal(parseAttendeeExport({...dto,rows:Array(5000).fill(dto.rows[0])},'event').rows.length,5000)
})
const hostile=['=HYPERLINK("https://example.invalid")','+1+2','-cmd','@SUM(A1:A2)','\t=SUM(1)','\r\n @SUM(1)',' \u0000=1','\u200B=1','\u00A0+1',"'original","'=original",'Ána; "López"\nsegunda línea','normal']
const restore=v=>v.startsWith("''") || /^'[\s\p{Cc}\p{Cf}]*[=+\-@]/u.test(v)?v.slice(1):v
check('Formula prefixes after whitespace/control/format; apostrophe escaping reversible',()=>{
  for(const v of hostile){const safe=neutralizeCsvText(v);assert.equal(restore(safe),v);assert.ok(!/^[\s\p{Cc}\p{Cf}]*[=+\-@]/u.test(safe))}
})
check('UTF8 byte boundary, final serialization size and invalid number/row shape',()=>{
  checkExportSize('a'.repeat(MAX_EXPORT_BYTES));assert.throws(()=>checkExportSize('é'.repeat(MAX_EXPORT_BYTES/2+1)))
  assert.throws(()=>serializeCsv(['a'],[['x'.repeat(MAX_EXPORT_BYTES)]]))
  assert.throws(()=>serializeCsv(['a'],[[1,2]]));for(const n of [NaN,Infinity,-1,0.5,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>serializeCsv(['a'],[[n]]))
  assert.throws(()=>parseAttendeeExport({...dto,event_title:'x'.repeat(MAX_EXPORT_BYTES)},'event'))
})
const period=presetPeriod(7,'2026-10-15'),series={event_id:'event',...period,as_of:dto.as_of,points:bucketStarts(period).map((bucket_start,i)=>({bucket_start,new_confirmations:i,reconfirmations:2,departures:1}))}
check('Separate columns, same period/buckets/counts, no demographics; empty means no file',()=>{
  assert.equal(attendeesCsv({...dto,rows:[]}),null)
  assert.equal(statisticsCsv('title',{...series,points:series.points.map(p=>({...p,new_confirmations:0,reconfirmations:0,departures:0}))}),null)
  assert.ok(!statisticsCsv('title',series).match(/birth_date|email|sex|user_id/))
})
await writeFile(`${out}/formula-fixture.csv`,serializeCsv(['texto'],hostile.map(v=>[v])))
await writeFile(`${out}/asistentes.csv`,attendeesCsv(dto))
await writeFile(`${out}/estadisticas.csv`,statisticsCsv('Encuentro',series))
// Python's standard csv module is an independent reader, not the serializer's inverse.
const py=process.env.PLANIT_PYTHON_PATH??'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
const source=String.raw`import csv,json,sys
from pathlib import Path
p=Path(sys.argv[1])
def read(name):
    with (p/name).open(encoding='utf-8-sig',newline='') as f:return list(csv.reader(f,delimiter=';',strict=True))
hostile=json.loads(sys.argv[2]); rows=read('formula-fixture.csv')
assert rows==[['texto']]+[[v] for v in hostile]
a=read('asistentes.csv');assert a[1]==['Encuentro; "primavera"','ana','Ána\nLópez','confirmed','2026-10-01T12:00:00']
s=read('estadisticas.csv');assert len(s)==8
for i,row in enumerate(s[1:]):assert row[1:4]==['2026-10-09T00:00:00','2026-10-16T00:00:00','day'] and list(map(int,row[5:]))==[i,2,1]
assert (p/'asistentes.csv').read_bytes().startswith(b'\xef\xbb\xbf')
print('PASS Python csv strict: quoted semicolon/unicode/newline round trip, exact series counts and BOM')`
const stdout=execFileSync(py,['-c',source,out,JSON.stringify(hostile.map(neutralizeCsvText))],{encoding:'utf8',windowsHide:true})
results.push({test:stdout.trim(),result:'PASS'})
await writeFile(`${out}/results.json`,JSON.stringify({results,result:'PASS',excel:'NOT RUN; independent Python CSV reader is not Excel formula execution'},null,2)+'\n')
console.log(results)
