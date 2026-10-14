import assert from 'node:assert/strict'
import { readFile, writeFile, unlink, mkdir } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'

// R3 fixture calls a confirmed guest "foreign" for administration. B2 now grants
// that guest social reading, while all administrative expectations stay intact.
const source = await readFile('scripts/check-attendees-ui.mjs','utf8')
const heading = "foreign.getByRole('heading', { name: 'Asistentes no disponibles' })"
const marker = "        if (path === '/rest/v1/rpc/get_event_attendees') {"
assert.equal(source.split(heading).length,2); assert.equal(source.split(marker).length,2)
const adapted = source.replace(heading,"foreign.getByRole('heading', { name: 'Participantes', exact: true })")
  .replace(marker,`        if (path === '/rest/v1/rpc/get_event_social_participants') return reply({participants:rows.filter(row=>row.status==='confirmed').slice(0,1).map(({user_id,display_name,username})=>({user_id,display_name,username,avatar:null})),next_cursor:null})
${marker}`)
const target = 'scripts/check-r5-admin-ui.local.mjs'
const out = process.env.PLANIT_UI_OUTPUT ?? 'docs/qa/r5-block-2/admin-ui'
await mkdir(out,{recursive:true}); await writeFile(target,adapted)
try {
  const {stdout,stderr} = await promisify(execFile)(process.execPath,[target],{windowsHide:true,timeout:300000,maxBuffer:4*1024*1024,env:{...process.env,PLANIT_UI_OUTPUT:out}})
  console.log(stdout)
  await writeFile(`${out}/adaptation.json`,JSON.stringify({source:'scripts/check-attendees-ui.mjs',sha256:createHash('sha256').update(source).digest('hex'),adaptation:'Confirmed guest opens social list; mock existing B1 RPC; admin denial/assertions unchanged',stdout,stderr},null,2)+'\n')
} finally { await unlink(target) }
