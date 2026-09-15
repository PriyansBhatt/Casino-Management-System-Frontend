import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {build} from 'esbuild'
import {validateOverview,validateCandidates,canStart,canEnd,startTarget,endTarget,loadMachines,requestGuard,confirmedThenRefresh,machineCsv,canManageMachines,isMachineRoute,UNAVAILABLE} from '../src/utils/machines.js'
import {createMutationStore} from '../src/utils/pit.js'
const date='2026-09-15'
const lifecycle={businessDate:date,businessDateOpen:true,systemLocked:false,businessDateHealth:'HEALTHY',continuationOverrideActive:false}
const machine={id:'m',machineCode:'S1',displayName:'Slot',machineType:'SLOT',operationalStatus:'AVAILABLE',activePlay:null}
const scope={businessDate:date,businessDateStatus:'OPEN',machines:[machine],lifecycle}
const candidate={customerId:'c',customerCode:'C1',customerName:'Customer',customerSessionId:'s',sessionCode:'S1',businessDate:date}
test('overview accepts authoritative empty list without fabricating failed reads',()=>{
 assert.equal(validateOverview({...scope,machines:[]}).machines.length,0)
 for(const value of [null,{}, {...scope,machines:null},{...scope,machines:[{...machine,operationalStatus:'demo'}]}])assert.throws(()=>validateOverview(value))
 assert.equal(validateOverview({...scope,businessDate:null,businessDateStatus:'UNAVAILABLE'}).businessDate,null)
})
test('financial functionality is explicitly unavailable',()=>{
 assert.equal(UNAVAILABLE.length,4)
 UNAVAILABLE.forEach(v=>assert.match(v,/Not available/))
 assert.doesNotMatch(UNAVAILABLE.join(''),/NPR 0/)
})
test('roles: only SUPER_ADMIN manages; roulette cannot start',()=>{
 for(const role of ['DIRECTOR','CASHIER','PIT_SUPERVISOR','DEALER','ADMIN','RECEPTIONIST'])assert.equal(canManageMachines(role),false)
 assert.equal(canStart(machine,scope,'SUPER_ADMIN'),true)
 assert.equal(canStart({...machine,machineType:'AUTOMATIC_ROULETTE'},scope,'SUPER_ADMIN'),false)
 assert.equal(canStart({...machine,operationalStatus:'OUT_OF_SERVICE'},scope,'SUPER_ADMIN'),false)
})
test('start requires explicit verified current-date customer/session',()=>{
 assert.throws(()=>startTarget(machine,null,scope))
 assert.throws(()=>validateCandidates([{...candidate,businessDate:'2026-09-14'}],date))
 assert.throws(()=>validateCandidates([{customerName:'free text'}],date))
 const op=startTarget(machine,validateCandidates([candidate],date)[0],scope)
 assert.equal(op.payload.customerSessionId,'s');assert.equal(op.payload.expectedBusinessDate,date)
})
test('date rollover and failed lifecycle disable new activity',async()=>{
 const loaded=await loadMachines({overview:async()=>scope,operationalStatus:async()=>({...lifecycle,businessDate:'2026-09-16'})})
 assert.equal(loaded.lifecycle,null);assert.equal(canStart(machine,loaded,'SUPER_ADMIN'),false)
 const failed=await loadMachines({overview:async()=>scope,operationalStatus:async()=>{throw Error('offline')}})
 assert.equal(canStart(machine,failed,'SUPER_ADMIN'),false)
 await assert.rejects(loadMachines({overview:async()=>{throw Error('offline')},operationalStatus:async()=>lifecycle}))
})
test('end play after rollover retains original assignment date and requires settlement permission',()=>{
 const active={...machine,operationalStatus:'IN_USE',activePlay:{id:'play',businessDate:date}}
 assert.equal(canEnd(active,scope,'SUPER_ADMIN'),true)
 const rolled={...scope,businessDate:'2026-09-16',lifecycle:{...lifecycle,businessDate:'2026-09-16'}}
 assert.equal(canEnd(active,rolled,'SUPER_ADMIN'),true)
 assert.equal(endTarget(active,rolled,'SUPER_ADMIN').payload.expectedBusinessDate,date)
 assert.equal(endTarget(active,rolled,'SUPER_ADMIN').playId,'play')
 assert.equal(canEnd(active,{...rolled,lifecycle:null},'SUPER_ADMIN'),false)
 assert.equal(canEnd(active,{...rolled,lifecycle:{...rolled.lifecycle,systemLocked:true}},'SUPER_ADMIN'),false)
 assert.equal(canEnd(active,scope,'DIRECTOR'),false)
})
test('generation invalidation prevents stale selection and directory overwrite',()=>{
 const guard=requestGuard(),old=guard.next(),fresh=guard.next()
 assert.equal(old(),false);assert.equal(fresh(),true);guard.invalidate();assert.equal(fresh(),false)
})
test('double submit is blocked synchronously and targets are frozen',async()=>{
 const store=createMutationStore(()=> 'key');let finish
 const work=store.run(startTarget(machine,candidate,scope),()=>new Promise(resolve=>{finish=resolve}))
 await assert.rejects(store.run({},async()=>{}),/progress/)
 assert.throws(()=>{store.operation.payload.customerSessionId='other'})
 finish({});await work;assert.equal(store.pending,false)
})
test('uncertain start/end retries retain identical keys and target across recreation',async()=>{
 for(const kind of ['start','end']){
  const storage=new Map(),adapter={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}
  const store=createMutationStore(()=>kind+'-key',adapter)
  const target={...startTarget(machine,candidate,scope),kind,playId:kind==='end'?'p':undefined}
  await assert.rejects(store.run(target,async()=>{throw Error('offline')}))
  const recovered=createMutationStore(()=>assert.fail('new key'),adapter)
  await recovered.run(null,async op=>{assert.equal(op.payload.idempotencyKey,kind+'-key');assert.equal(op.machineId,'m')},true)
  assert.equal(storage.size,0)
 }
})
test('confirmed success survives secondary refresh failure',async()=>{
 let success=false,warning=''
 await confirmedThenRefresh(async()=>({}),async()=>{throw Error('offline')},()=>{success=true},v=>{warning=v})
 assert.equal(success,true);assert.match(warning,/succeeded/)
})
test('CSV protects formulas, contains actual play Business Date and no money columns',()=>{
 const csv=machineCsv([{...machine,displayName:'=SUM(1)',location:'@x',activePlay:{...candidate}}])
 assert.ok(csv.includes('"\'=SUM(1)"'));assert.ok(csv.includes('"\'@x"'));assert.ok(csv.includes(date))
 assert.doesNotMatch(csv,/Wallet|Win|Loss|NPR/)
})
test('page uses real API, removes prototype authority and hides header placeholders',async()=>{
 const page=await readFile('src/pages/pit/SlotMachineGaming.jsx','utf8'),api=await readFile('src/api/machineApi.js','utf8')
 assert.doesNotMatch(page,/initialMachines|initialPendingLoads|redeemLoad|setFinalWin|setFinalLoss|nowTime|recorder/)
 assert.match(api,/axios.post/);assert.match(api,/eligible-players/);assert.match(page,/does not exit the casino/)
 const permissions=await readFile('src/constants/routePermissions.js','utf8')
 assert.match(permissions,/'\/slot-machines': \[ROLES.SUPER_ADMIN, ROLES.DIRECTOR\]/)
 assert.equal(isMachineRoute('/slot-machines'),true);assert.equal(isMachineRoute('/pit/tables'),false)
 const layout=await readFile('src/components/layout/MainLayout.jsx','utf8');assert.match(layout,/!isMachine &&/)
 await build({entryPoints:['src/pages/pit/SlotMachineGaming.jsx'],bundle:true,write:false,format:'esm',platform:'browser'})
})
