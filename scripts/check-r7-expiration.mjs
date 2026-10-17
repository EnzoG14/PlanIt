import { readFile, writeFile, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

// Reuse the established real PostgreSQL harness. Auth/Storage operations remain
// labelled SQL scaffolds; this never connects to a remote project.
const source = (await readFile('scripts/check-r7-media.mjs','utf8')).replace(/\r\n/g,'\n')
const setup = source.slice(0,source.indexOf('const tests = String.raw`'))
  .replace('docs/qa/r7-block-1/sql','docs/qa/r7-block-6/sql')
const fixtures = source.slice(source.indexOf("  record('R7-B1-TC-01:"),source.indexOf('  const r=await reserve();'))
const story = await readFile('scripts/fixtures/r7-stories-tests.mjs','utf8')
const definitions = story.slice(0,story.indexOf('  const r=await prepared(),sid='))
const tests = await readFile('scripts/fixtures/r7-expiration-tests.mjs','utf8')
const runner = setup+'\nconst tests = '+JSON.stringify(fixtures+definitions+tests)+'\n'+source.slice(source.indexOf('const cleanup ='))
  .replaceAll('codex/r7-block-1','codex/r7-block-6').replaceAll("base:'5adf8e4'","base:'0beac19'")
  .replaceAll('scripts/.r7-media-run.local.mjs','scripts/.r7-expiration-run.local.mjs')
const temp='scripts/.r7-expiration-bootstrap.local.mjs'
await writeFile(temp,runner)
try {
  const {stdout,stderr}=await promisify(execFile)(process.execPath,[temp],{windowsHide:true,timeout:180000,maxBuffer:8*1024*1024})
  console.log(stdout);if(stderr)console.error(stderr)
} catch(error){console.error(error.stdout,error.stderr);throw error}
finally {await unlink(temp)}
