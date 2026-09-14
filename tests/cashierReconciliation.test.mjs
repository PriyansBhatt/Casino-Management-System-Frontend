import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'
import { NOTES, emptyCounts, money, noteCount, openingAmount, reconciliation, loadReconciliation, ready,
  resetDraft, frozenCount, createReconciliationSubmission, requestGuard, lifecycleLabel, resultLabel,
  CASH_PAID_DETAIL, canOperate, canManage } from '../src/utils/cashierReconciliation.js'
const date = '2026-09-02'
const bucket = () => Object.fromEntries(['CASH','BANK','CARD','QR'].map((m) => [m,{ amount:0,count:0 }]))
const live = (extra = {}) => ({ id:null, businessDate:date, cashierUsername:'cashier', lifecycleStatus:'OPEN', status:'NOT_SUBMITTED', calculationBasis:'LIVE',
  openingCash:0, physicalCashReceived:0, physicalCashPaid:0, expectedClosingCash:0, actualClosingCash:null, variance:null,
  buyInTenders:bucket(), cashOutTenders:bucket(), losingReturnTenders:bucket(), denominations:{}, ...extra })
const saved = (extra = {}) => ({ ...live(), id:'r', lifecycleStatus:'SUBMITTED', status:'BALANCED', calculationBasis:'SUBMITTED_SNAPSHOT',
  actualClosingCash:0, variance:0, physicalCashReceived:null, physicalCashPaid:null,
  buyInTenders:null, cashOutTenders:null, losingReturnTenders:null, submittedAt:'2026-09-02T18:00:00', ...extra })
const opening = { id:'o',cashierUserId:'u',cashierUsername:'cashier',businessDate:date,openingCashAmount:0 }
const status = { businessDate:date,businessDateOpen:true,systemLocked:false,businessDateHealth:'HEALTHY',continuationOverrideActive:false }
const api = (extra = {}) => ({ getCurrentOpenBusinessDate:async()=>({ businessDate:date,status:'OPEN' }),getOperationalStatus:async()=>status,
  current:async()=>live(), opening:async()=>opening,management:async()=>[], ...extra })
const input = () => ({ date, counts:emptyCounts(),remarks:'' })
const deferred = () => { let resolve; const promise = new Promise((r)=>{ resolve=r }); return {promise,resolve} }
const callbacks = (extra={}) => ({preflight:async()=>{},post:async()=>saved(),success:()=>{},refresh:async()=>{},warning:()=>{},...extra})

test('authoritative zero is distinct from unavailable and malformed live/snapshot responses',()=>{
  assert.equal(money(0),'NPR 0'); for(const v of [null,undefined,'',NaN]) assert.equal(money(v),'Unavailable')
  assert.equal(reconciliation(live(),date).physicalCashReceived,0)
  assert.equal(reconciliation(saved(),date).physicalCashReceived,null)
  for(const v of [null,live({lifecycleStatus:undefined}),live({physicalCashPaid:null}),live({buyInTenders:{}}),saved({physicalCashPaid:0}),saved({variance:null})]) assert.throws(()=>reconciliation(v,date))
})
test('roles preserve own operations and management separation',async()=>{
  const bundle=await build({entryPoints:['src/utils/accessControl.js'],bundle:true,write:false,format:'esm',platform:'node'})
  const {canAccessRoute}=await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
  for(const r of ['CASHIER','DIRECTOR','SUPER_ADMIN']) assert.equal(canAccessRoute({role:r},'/cashier/reconciliation'),true)
  for(const r of ['ADMIN','MANAGER','PIT_SUPERVISOR','DEALER','RECEPTIONIST','COMPLIANCE_OFFICER','SURVEILLANCE_OFFICER']) assert.equal(canAccessRoute({role:r},'/cashier/reconciliation'),false)
  assert.equal(canOperate('DIRECTOR'),false); assert.equal(canManage('DIRECTOR'),true);assert.equal(canManage('CASHIER'),false)
})
test('real date prerequisites and submitted freeze fail closed',async()=>{
  const scope=await loadReconciliation(api(),'CASHIER','cashier'); assert.equal(scope.date,date);assert.equal(ready(scope,'CASHIER'),true)
  assert.equal(ready({...scope,record:saved()},'CASHIER'),false)
  assert.equal(ready({...scope,status:null},'CASHIER'),false)
  const absent=await loadReconciliation(api({getCurrentOpenBusinessDate:async()=>null}),'CASHIER','cashier');assert.equal(absent.record,null);assert.equal(ready(absent,'CASHIER'),false)
})
test('failed reads produce unavailable state, never stale values or fabricated zero',async()=>{
  const scope=await loadReconciliation(api({current:async()=>{throw new Error('offline')}}),'CASHIER','cashier')
  assert.equal(scope.record,null);assert.match(scope.errors.record,/offline/);assert.equal(ready(scope,'CASHIER'),false)
  const malformed=await loadReconciliation(api({opening:async()=>undefined}),'CASHIER','cashier')
  assert.equal(ready(malformed,'CASHIER'),false);assert.ok(malformed.errors.opening)
})
test('Director management read omits own mutation prerequisites; saved review stays explicit',async()=>{
  const scope=await loadReconciliation(api({current:()=>assert.fail(),opening:()=>assert.fail(),management:async()=>[saved()]}),'DIRECTOR','director')
  assert.equal(scope.record,null);assert.equal(scope.management.length,1);assert.equal(scope.management[0].buyInTenders,null)
})
test('wrong cashier and date rollover during load are rejected',async()=>{
  const scope=await loadReconciliation(api({current:async()=>live({cashierUsername:'other'})}),'CASHIER','cashier');assert.equal(scope.record,null)
  let n=0; await assert.rejects(loadReconciliation(api({getCurrentOpenBusinessDate:async()=>({status:'OPEN',businessDate:n++ ? '2026-09-03':date})}),'CASHIER','cashier'),/changed/)
})
for(const name of ['load','preview'])test(`stale ${name} cannot overwrite a newer generation`,async()=>{
  const guard=requestGuard(),a=deferred(),b=deferred();let display=null
  const run=async(p)=>{const current=guard.next();const value=await p;if(current())display=value}
  const old=run(a.promise),newer=run(b.promise);b.resolve('new');await newer;a.resolve('old');await old;assert.equal(display,'new')
  const last=run(Promise.resolve('edited'));guard.invalidate();await last;assert.equal(display,'new')
})
test('rollover and reopen discard old draft; same-date refresh can preserve count',()=>{
  const old={date,record:live()}
  assert.equal(resetDraft(old,{date:'2026-09-03',record:live()}),true)
  assert.equal(resetDraft({date,record:saved()},{date,record:live({lifecycleStatus:'REOPENED'})}),true)
  assert.equal(resetDraft(old,{date,record:live()}),false)
})
test('notes are exact supported integers and frontend total is only a counting aid',()=>{
  assert.deepEqual(NOTES,[1000,500,100,50,20,10,5]);assert.equal(noteCount(emptyCounts()).total,0)
  assert.equal(noteCount({1000:2,5:1}).total,2005)
  for(const q of [1.5,-1,null,undefined,true,'text',2147483648])assert.throws(()=>noteCount({1000:q}))
  assert.throws(()=>noteCount({25:1}));assert.equal(noteCount({1000:2147483647}).total,2147483647000)
})
test('Opening Cash precision is rejected, not rounded; decimal text retained',()=>{
  assert.equal(openingAmount('0.00'),'0.00');assert.equal(openingAmount('123.45'),'123.45')
  for(const q of ['1.001','-1','1e3','100000000000000000','NaN'])assert.throws(()=>openingAmount(q))
})
test('frozen count contains expected date, remarks, key and independent denomination copy',()=>{
  const counts={1000:2};const target=frozenCount(date,counts,' reason ','key');counts[1000]=7
  assert.deepEqual(target,{expectedBusinessDate:date,denominations:{1000:2},remarks:'reason',idempotencyKey:'key'})
  assert.throws(()=>{target.denominations[1000]=9})
})
test('synchronous submit guard covers preflight; confirmed operation consumes its key',async()=>{
  let keys=0,calls=0;const submit=createReconciliationSubmission(()=>`k${++keys}`),wait=deferred()
  const cb=callbacks({preflight:()=>wait.promise,post:async()=>{calls++;return saved()}})
  const first=submit.run(input(),cb);assert.equal(await submit.run(input(),cb),null);wait.resolve();await first;assert.equal(calls,1);assert.equal(submit.target,null)
  await submit.run(input(),callbacks());assert.equal(keys,2)
})
test('uncertain retry retains frozen date/count/key despite caller changes and skips fresh-mutation gate',async()=>{
  const submit=createReconciliationSubmission(()=> 'same');let first
  await assert.rejects(submit.run(input(),callbacks({post:async(target)=>{first=target;throw new Error('timeout')}})),/unconfirmed/)
  assert.equal(submit.uncertain,true)
  await submit.run({date:'2026-09-03',counts:{1000:1},remarks:'changed'},callbacks({preflight:()=>assert.fail(),post:async(target)=>{assert.strictEqual(target,first);return saved()}}))
  assert.equal(submit.uncertain,false)
})
test('malformed successful response remains unconfirmed with same retry key',async()=>{
  const submit=createReconciliationSubmission(()=> 'key')
  await assert.rejects(submit.run(input(),callbacks({post:async()=>undefined})),/SUBMITTED could not be verified/)
  assert.equal(submit.uncertain,true);assert.equal(submit.target.idempotencyKey,'key')
  await submit.run(input(),callbacks());assert.equal(submit.uncertain,false)
})
test('REOPENED response never falsely confirms submission',async()=>{
  const submit=createReconciliationSubmission(()=> 'key')
  await assert.rejects(submit.run(input(),callbacks({post:async()=>saved({lifecycleStatus:'REOPENED',calculationBasis:'LAST_SUBMISSION_SNAPSHOT'})})),/unconfirmed/)
})
test('confirmed SUBMITTED plus refresh failure remains successful',async()=>{
  const submit=createReconciliationSubmission(()=> 'key');let success=false,warning
  const result=await submit.run(input(),callbacks({success:()=>{success=true},refresh:async()=>{throw new Error('offline')},warning:(v)=>{warning=v}}))
  assert.equal(success,true);assert.equal(result.lifecycleStatus,'SUBMITTED');assert.match(warning,/submitted successfully/);assert.equal(submit.target,null)
})
test('lifecycle and result are separately labelled without invented OPEN/BALANCED',()=>{
  assert.equal(lifecycleLabel('OPEN'),'Not Submitted');assert.equal(lifecycleLabel('REOPENED'),'Reopened');assert.equal(lifecycleLabel(null),'Unavailable')
  assert.equal(resultLabel('OVER'),'Over');assert.equal(resultLabel(undefined),'Not calculated / unavailable')
})
test('page connects real authority, count invalidation, CASH-only losing return and hidden fake header',async()=>{
  const page=await readFile('src/pages/cashier/CashierReconciliation.jsx','utf8'),apiSource=await readFile('src/api/reconciliationApi.js','utf8'),layout=await readFile('src/components/layout/MainLayout.jsx','utf8')
  assert.doesNotMatch(page,/useBusinessStatus|2083-03-04|safeLogAuditEvent/);assert.doesNotMatch(apiSource,/MOCK|mock/)
  assert.equal(CASH_PAID_DETAIL,'CASH Cash-Outs + CASH Losing Returns');assert.match(page,/detail=\{CASH_PAID_DETAIL\}/)
  assert.match(page,/Losing Return — CASH payouts only.*cashOnly/)
  assert.match(page,/previewGuard.current.invalidate\(\); setPreview\(null\); setReviewed\(false\)/)
  assert.match(page,/setCounts\(emptyCounts\(\)\)/);assert.match(page,/setInterval\(focus, 45000\)/)
  assert.match(page,/addEventListener\('focus'/);assert.match(page,/expectedBusinessDate: scope.date/)
  assert.match(page,/if \(busy.current \|\| submission.current.pending/)
  assert.match(layout,/isReconciliation \?/);assert.match(layout,/!isReconciliation &&/)
  await build({entryPoints:['src/pages/cashier/CashierReconciliation.jsx'],bundle:true,write:false,format:'esm',platform:'browser'})
})
