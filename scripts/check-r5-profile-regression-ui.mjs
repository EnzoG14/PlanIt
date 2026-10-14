import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { createServer } from 'node:http'
import { resolve, extname } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'

// Preserve historical runners/evidence. B2's public-bio fixture was explicitly
// deferred then; use a private minimal identity here, with B3 public coverage in
// check-r5-profile-ui.mjs. All list/admin expectations are unchanged.
const source=await readFile('scripts/check-r5-participants-ui.mjs','utf8')
const old="row?{...row,bio:'Authorized fixture bio; B3 deferred'}"
assert.equal(source.split(old).length,2)
const adapted=source.replace(old,'row?{display_name:row.display_name,username:row.username,avatar:row.avatar}')
const root=resolve('dist'),mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png'}
const server=createServer(async(req,res)=>{
  const file=resolve(root,`.${new URL(req.url,'http://localhost').pathname}`)
  if(!file.startsWith(root)) {res.writeHead(403);res.end();return}
  try {res.setHeader('Content-Type',mime[extname(file)]??'application/octet-stream');res.end(await readFile(file))}
  catch {res.setHeader('Content-Type','text/html');res.end(await readFile(resolve(root,'index.html')))}
})
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
await mkdir('.r5-check.local',{recursive:true})
const target='.r5-check.local/participants-ui.mjs'
await writeFile(target,adapted)
const env={...process.env,PLANIT_UI_ORIGIN:`http://127.0.0.1:${server.address().port}`,PLANIT_PLAYWRIGHT_PATH:process.env.PLANIT_PLAYWRIGHT_PATH??'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'}
const out=process.env.PLANIT_UI_OUTPUT??'docs/qa/r5-block-3'
try {
  for(const [name,path] of [['participants-ui',target],['admin-ui','scripts/check-r5-admin-ui.mjs']]) {
    await mkdir(`${out}/${name}`,{recursive:true})
    const {stdout,stderr}=await promisify(execFile)(process.execPath,[path],{windowsHide:true,timeout:300000,maxBuffer:4*1024*1024,env:{...env,PLANIT_UI_OUTPUT:`${out}/${name}`}})
    console.log(stdout)
    await writeFile(`${out}/${name}/regression.json`,JSON.stringify({source:name==='participants-ui'?'scripts/check-r5-participants-ui.mjs':'scripts/check-r5-admin-ui.mjs',adaptation:name==='participants-ui'?'Private identity fixture; public bio tested by B3 suite':'Existing B2 adaptation, no changes',source_sha256:name==='participants-ui'?createHash('sha256').update(source).digest('hex'):null,stdout,stderr,result:'PASS'},null,2)+'\n')
  }
} finally {await unlink(target);server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
