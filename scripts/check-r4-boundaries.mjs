import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import ts from 'typescript'

async function moduleFrom(path, stripImports = false) {
  const source = await readFile(path,'utf8')
  const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText
  // Pure date validators do not call Supabase; avoid initializing a browser client in Node.
  return import(`data:text/javascript;base64,${Buffer.from(stripImports?compiled.replace(/^import .*;$/gm,''):compiled).toString('base64')}`)
}
const {validDay,dateRangeError,normalizeFilters,filtersToSearch} = await moduleFrom('src/features/events/search.ts',true)
assert.equal(validDay('2028-02-29'),true)
for(const day of ['2026-02-29','2026-04-31','2026-13-01','2026-00-01','2026-01-00'])assert.equal(validDay(day),false,day)
assert.ok(dateRangeError('2026-02-29','2026-03-01'))
assert.ok(dateRangeError('2026-03-02','2026-03-01'))
assert.deepEqual(normalizeFilters({dateFrom:'2026-02-29',dateTo:'2026-03-01',q:'rock',radiusKm:10}),{dateFrom:'',dateTo:'',q:'rock',radiusKm:10,categoryIds:[]})
assert.equal(filtersToSearch({q:'',categoryIds:[],dateFrom:'2028-02-29',dateTo:'2028-02-29',radiusKm:null}),'?from=2028-02-29&to=2028-02-29')
const {getCurrentLocation} = await moduleFrom('src/features/location/geolocation.ts')
const descriptors = Object.fromEntries(['window','navigator'].map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]))
try {
  Object.defineProperty(globalThis,'window',{configurable:true,value:{isSecureContext:false}})
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{geolocation:{getCurrentPosition(){throw new Error('Must not call GPS in insecure context')}}}})
  await assert.rejects(getCurrentLocation(),/HTTPS/)
  globalThis.window.isSecureContext=true
  for(const [code,message] of [[1,/No autorizaste/],[2,/No pudimos/],[3,/Se agotó/]]) {
    globalThis.navigator.geolocation.getCurrentPosition=(_success,error,options)=>{assert.equal(options.timeout,10000);error({code})}
    await assert.rejects(getCurrentLocation(),message)
  }
  globalThis.navigator.geolocation.getCurrentPosition=success=>success({coords:{latitude:-34.6,longitude:-58.38}})
  assert.deepEqual(await getCurrentLocation(),{latitude:-34.6,longitude:-58.38})
} finally {
  for(const name of ['window','navigator']) { if(descriptors[name])Object.defineProperty(globalThis,name,descriptors[name]);else delete globalThis[name] }
}
const output=process.env.PLANIT_UI_OUTPUT??'docs/qa/r4-block-9/boundaries'
await mkdir(output,{recursive:true})
await writeFile(`${output}/results.json`,JSON.stringify({environment:'Actual TypeScript validators transpiled in Node; simulated navigator/window; no browser GPS or remote service',results:[{test:'D06 valid leap day vs invalid calendar date and inverted range; invalid dates never serialized',result:'PASS'},{test:'D08 insecure context, GPS denied/unavailable/timeout/success with actual getCurrentLocation',result:'PASS'}]},null,2)+'\n')
console.log('PASS: D06 calendar boundaries and D08 geolocation failure modes')
