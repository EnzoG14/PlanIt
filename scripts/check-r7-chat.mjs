import { readFile, writeFile, unlink } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

// Reuse the isolated PostgreSQL bootstrap and role/Storage SQL scaffolds of B1.
// The generated runner is temporary; tests below execute the real public RPCs.
const source = (await readFile('scripts/check-r7-media.mjs','utf8')).replace(/\r\n/g,'\n')
const setup = source.slice(0,source.indexOf('const tests = String.raw`'))
  .replace("docs/qa/r7-block-1/sql", "docs/qa/r7-block-2/sql")
const fixtureStart = source.indexOf("  record('R7-B1-TC-01:")
const fixtureEnd = source.indexOf('  const r=await reserve();')
const fixtures = source.slice(fixtureStart,fixtureEnd)
const tests = await readFile('scripts/fixtures/r7-chat-tests.mjs','utf8')
const runner = setup + '\nconst tests = ' + JSON.stringify(fixtures + tests) + '\n' + source.slice(source.indexOf('const cleanup ='))
  .replaceAll("codex/r7-block-1", "codex/r7-block-2")
  .replaceAll("base:'5adf8e4'", "base:'3f2a498'")
  .replace("scripts/.r7-media-run.local.mjs", "scripts/.r7-chat-run.local.mjs")
const temp='scripts/.r7-chat-bootstrap.local.mjs'
await writeFile(temp,runner)
try {
  const {stdout,stderr}=await promisify(execFile)(process.execPath,[temp],{windowsHide:true,timeout:180000,maxBuffer:8*1024*1024})
  console.log(stdout);if(stderr)console.error(stderr)
} catch(error){console.error(error.stdout,error.stderr);throw error}
finally {await unlink(temp)}
