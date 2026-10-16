import assert from 'node:assert/strict'
import {readFile,writeFile,mkdir,unlink} from 'node:fs/promises'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
const [stage,...args]=process.argv.slice(2),run=args[args.indexOf('--run-id')+1]
assert.ok(['checks','regression-ui','ui'].includes(stage),'Choose checks/regression-ui/ui')
assert.match(run??'',/^[a-z0-9-]{4,40}$/)
const out=`docs/qa/r6-block-9/followup/${run}/regressions`
const source=await readFile('scripts/check-r6-release.mjs','utf8'),marker="const out = 'docs/qa/r6-block-9'"
assert.equal(source.split(marker).length,2)
await mkdir('.r6-check.local',{recursive:true})
const path=`.r6-check.local/followup-${stage}.mjs`
await writeFile(path,source.replace(marker,`const out = '${out}'`))
try{const r=await promisify(execFile)(process.execPath,[path,stage],{windowsHide:true,timeout:900000,maxBuffer:8*1024*1024});console.log(r.stdout)}catch(e){console.log(e.stdout??'');console.error(e.stderr??'');process.exitCode=1}finally{await unlink(path)}
