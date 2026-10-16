import { pathToFileURL } from 'node:url'
const { chromium } = await import(pathToFileURL(process.env.PLANIT_PLAYWRIGHT_PATH ?? 'C:/Users/enzog/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href)
import { mkdir, writeFile } from 'node:fs/promises'
import { eventGoogleCalendarUrl } from '../src/features/events/calendar.ts'
const out='docs/qa/r7-block-7/google'
await mkdir(out,{recursive:true})
const event={id:'30000000-0000-4000-8000-000000000007',title:'PlanIt QA calendario 🎉',starts_at:'2026-12-31T23:30:00',ends_at:'2027-01-01T01:00:00',location_name:'Centro cultural',address:'Corrientes 123, Buenos Aires',visibility:'public',state:'open'}
const browser=await chromium.launch({headless:true,channel:'msedge'})
const page=await browser.newPage()
let result
try {
 const response=await page.goto(eventGoogleCalendarUrl(event),{waitUntil:'domcontentloaded',timeout:30000})
 await page.screenshot({path:`${out}/prefill-attempt.png`,fullPage:true})
 const url=new URL(page.url())
 result={result:'BLOCKED',httpStatus:response?.status(),finalOrigin:url.origin,finalPath:url.pathname,title:await page.title(),reason:url.origin === 'https://accounts.google.com' ? 'Google requires authentication in the fresh browser; no login or save performed.' : 'Automated inspection does not certify the prefilled editor; manual verification required. No login or save performed.',prefillVerified:false}
} catch(error) { result={result:'BLOCKED',reason:error.message,prefillVerified:false} }
finally {await browser.close()}
await writeFile(`${out}/attempt.json`,JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify(result))
