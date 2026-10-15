import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { argentinaToday, addDays, periodFromDates, presetPeriod, bucketStarts, parseParticipationSeries } from '../src/features/analytics/periods.ts'
const tests=[]
const check=(name,fn)=>{fn();tests.push({test:name,result:'PASS'})}
check('Argentina date independent of host zone, includes today and leap day',()=>{
  assert.equal(argentinaToday(new Date('2026-01-01T02:59:59Z')),'2025-12-31')
  assert.equal(argentinaToday(new Date('2026-01-01T03:00:00Z')),'2026-01-01')
  assert.deepEqual(presetPeriod(7,'2024-03-01'),{from:'2024-02-24T00:00:00',to:'2024-03-02T00:00:00',bucket:'day'})
  assert.equal(addDays('2024-02-28',1),'2024-02-29');assert.equal(addDays('2023-12-31',1),'2024-01-01')
  for(const days of [7,30,90]) assert.equal(bucketStarts(presetPeriod(days,'2026-10-15')).length,days)
})
check('Inclusive form to half-open RPC and validation including missing/malformed dates',()=>{
  assert.equal(periodFromDates('2026-01-01','2026-01-01','day').to,'2026-01-02T00:00:00')
  for(const [start,end] of [['','2026-01-01'],['2026-02-30','2026-03-01'],['2026-01-02','2026-01-01'],['2024-01-01','2025-01-01'],['0000-01-01','0000-01-02'],['9999-12-31','9999-12-31']])assert.throws(()=>periodFromDates(start,end,'day'))
  assert.equal(bucketStarts(periodFromDates('2024-01-01','2024-12-31','day')).length,366)
  assert.equal(bucketStarts(periodFromDates('2023-01-01','2024-01-01','week')).length,54)
  assert.equal(bucketStarts(periodFromDates('2026-10-14','2026-10-20','week'))[0],'2026-10-12T00:00:00')
})
const period=presetPeriod(7,'2026-10-15')
const dto={event_id:'fixture',...period,as_of:'2026-10-15T12:00:00',points:bucketStarts(period).map(bucket_start=>({bucket_start,new_confirmations:1,reconfirmations:2,departures:3}))}
check('Strict DTO shape and request identity/range/bucket; ordered complete buckets and safe counts',()=>{
  assert.deepEqual(parseParticipationSeries(dto,'fixture',period),dto)
  const changes=[v=>v.event_id='other',v=>v.from='2026-10-01T00:00:00',v=>v.to+='Z',v=>v.bucket='week',v=>v.as_of+='Z',v=>v.points.pop(),v=>v.points.reverse(),v=>v.points[0].new_confirmations=-1,v=>v.points[0].departures=Infinity,v=>v.points[0].reconfirmations=1.5,v=>v.points[0].user_id='PRIVATE',v=>v.email='PRIVATE']
  for(const change of changes){const bad=structuredClone(dto);change(bad);assert.throws(()=>parseParticipationSeries(bad,'fixture',period))}
})
await mkdir('docs/qa/r6-block-4',{recursive:true})
await writeFile('docs/qa/r6-block-4/contract.json',JSON.stringify({tests,result:'PASS'},null,2)+'\n')
console.log(`${tests.length} period contract groups PASS`)
