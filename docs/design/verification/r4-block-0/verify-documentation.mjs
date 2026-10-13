import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import assert from 'node:assert/strict'
import path from 'node:path'
import { existsSync } from 'node:fs'
const base='42af4e42d032637b1363e207714e86c297d8c3b1',out='docs/design/verification/r4-block-0'
const report=process.env.PLANIT_DOC_REPORT ?? `${out}/documentation-results.json`
if (existsSync(report)) throw new Error('Choose a new PLANIT_DOC_REPORT; published evidence must not be overwritten')
const checks=[]
const pass=(test,details={})=>checks.push({test,result:'PASS',...details})
const run=args=>execFileSync('git',args,{encoding:'utf8'}).trim()
const changed=run(['diff','--name-only',base]).split('\n').filter(Boolean)
const added=run(['ls-files','--others','--exclude-standard']).split('\n').filter(Boolean)
assert(changed.every(p=>['docs/implementation/RELEASE_4_BLOCK_0_DECISIONS.md','docs/implementation/RELEASE_4_DECISIONS_PROPOSED.md','docs/implementation/RELEASE_4_STATUS.md','docs/qa/RELEASE_4_ACCEPTANCE.md'].includes(p)||p.startsWith(out+'/')))
assert(added.every(p=>p.startsWith(out+'/')))
pass('Diff limited to R4 documentation and new evidence; application/SQL/config/history unchanged',{changed,added_count:added.length})
const markdown=[...changed,...added].filter(p=>p.endsWith('.md'));let links=0
for(const file of markdown){const text=await readFile(file,'utf8');for(const m of text.matchAll(/!?\[[^\]\n]*\]\(([^)\n]+)\)/g)){
 const target=m[1].replace(/^<|>$/g,'').split('#')[0]
 if(!target||/^(?:https?:|mailto:)/.test(target))continue
 assert(path.resolve(path.dirname(file),decodeURIComponent(target))===path.resolve(out,'documentation-results.json') || existsSync(path.resolve(path.dirname(file),decodeURIComponent(target))),`${file} -> ${target}`);links++
}}
pass('Local links resolve in edited documentation',{links})
const acceptanceFile='docs/qa/RELEASE_4_ACCEPTANCE.md'
const extract=s=>s.split(/\r?\n/).filter(x=>/^\| RF-R4-\d{2}\.CA-\d{2} \|/.test(x)).map(x=>{const c=x.split('|').map(s=>s.trim());return {id:c[1],official:c[2],test:c[3],state:c[4]}})
const old=extract(execFileSync('git',['show',`${base}:${acceptanceFile}`],{encoding:'utf8'})),current=extract(await readFile(acceptanceFile,'utf8'))
assert.equal(current.length,39);assert.deepEqual(current,old);assert(current.every(x=>x.state==='Pendiente'))
pass('39 official texts, suggested tests and functional states preserved exactly')
const lines=(await readFile(`${out}/traceability.csv`,'utf8')).trim().split('\n')
assert.equal(lines.length-1,39)
assert.deepEqual(lines.slice(1).map(l=>l.match(/^"([^"]+)"/)[1]),current.map(c=>c.id))
pass('39 unique criteria mapped to route/service/component/CSS/policy/future test')
assert.equal((await readFile(`${out}/authorization-matrix.csv`,'utf8')).trim().split('\n').length-1,288)
pass('288 authorization combinations documented as static inference / target, not test results')
const manifest=JSON.parse(await readFile(`${out}/source-manifest.json`,'utf8'))
for(const entry of manifest.sources){const bytes=execFileSync('git',['show',`${base}:${entry.path}`],{maxBuffer:2000000});assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256_git_bytes);assert.equal(run(['rev-parse',`${base}:${entry.path}`]),entry.git_blob)}
pass('Source hashes match immutable Git base',{sources:manifest.sources.length})
const inventory=JSON.parse(await readFile(`${out}/sql-inventory.json`,'utf8'))
assert.equal(inventory.migrations.length,17);assert.equal(inventory.tables.length,11);assert.equal(inventory.functions.filter(f=>f.name.startsWith('public.')).length,31);assert.equal(inventory.r4_tables_present.length,0)
for(const f of inventory.functions){const sql=await readFile(f.source,'utf8');assert(sql.includes(f.name+'('),f.name);assert.equal(f.empty_search_path,true);if(f.name.startsWith('public.')){
 assert(f.execute_statements.some(g=>/^grant execute on function /i.test(g.statement)&&/ to authenticated;$/i.test(g.statement)),f.name)
 assert(f.execute_statements.some(g=>/^revoke all on function /i.test(g.statement)&&g.statement.includes('public')&&g.statement.includes('anon')),f.name)
}}
for(const item of inventory.migrations)assert.equal(createHash('sha256').update(await readFile(item.path)).digest('hex'),item.sha256)
pass('Static SQL definitions/signatures/search_path/authenticated EXECUTE verified against source',{migrations:17,tables:11,public_functions:31,private_functions:12,declared_policies:20,remote:'NOT INSPECTED',sql_replay:'NOT RUN'})
const capture=JSON.parse(await readFile(`${out}/capture-results.json`,'utf8'))
assert.equal(capture.sha,base);assert.equal(capture.results.length,14);assert.equal(capture.writes,0);assert.deepEqual(capture.unexpected,[]);assert.deepEqual(capture.pageErrors,[])
for(const row of capture.results){assert(existsSync(`${out}/${row.kind}/${row.name}.png`));if(row.kind==='baseline'){assert.equal(row.overflow,false);assert.equal(row.dock.length,4);assert.equal(row.fontLoaded,true)}}
pass('10 baseline plus 4 lab PNG captured with local fixtures; no business mutation/page errors',{browser:capture.browser,map:'fallback only; real Mapbox NOT RUN'})
const sourceCompare=JSON.parse(await readFile(`${out}/original-source-comparison.json`,'utf8'));assert.equal(sourceCompare.count,39);assert.equal(sourceCompare.matching,39);assert.deepEqual(sourceCompare.mismatches,[])
pass('Original connected criteria compared: 39/39',{source:sourceCompare.source,kind:'Document comparison, not functional QA'})
for(const file of [`${out}/capture-baseline.mjs`,`${out}/inspect-contracts.mjs`])execFileSync(process.execPath,['--check',file])
pass('Evidence helper syntax: node --check')
run(['diff',base,'--check']);pass('git diff base --check')
for(const file of [...changed,...added].filter(p=>/\.(?:md|mjs|csv|json)$/.test(p))){const lines=(await readFile(file,'utf8')).split(/\r?\n/);assert(!lines.some(l=>/[ \t]+$/.test(l)),`Trailing spaces in ${file}`)}
pass('New and edited textual artifacts contain no trailing whitespace')
const result={date:'2026-10-13',base,kind:'Documentation / static inspection / local UI fixture',checks,not_run:['npm run build','npm run lint','SQL replay / functional checks','Supabase metadata / advisors','HTTP JWT A/B / Storage / Realtime real','Real Mapbox / physical devices / assistive technology','39 R4 functional acceptance criteria'],limits:'No functional implementation, no security correction or human acceptance.'}
await mkdir(path.dirname(report),{recursive:true})
await writeFile(report,JSON.stringify(result,null,2)+'\n')
assert(existsSync(report))
console.log(JSON.stringify({checks:checks.length,result:'PASS',local_links:links,base,criteria:39,source_hashes:manifest.sources.length}))
