import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {FNB_TABS,canMutateFnb,department,actions,validQuantity,createPayload,createGate,createSubmission,recordsCsv,isFnbRoute} from '../src/utils/fnb.js'
const page=readFileSync(new URL('../src/pages/fnb/FnbKitchenBar.jsx',import.meta.url),'utf8')
const form=readFileSync(new URL('../src/pages/fnb/FnbRequestForm.jsx',import.meta.url),'utf8')
test('exactly four tabs and no prototype financial authority',()=>{assert.deepEqual(FNB_TABS,['Overview','New Request','Live Requests','Records']);assert.doesNotMatch(page+form,/initialOrders|foodItems|beverageItems|payment|estimatedCost|price|money\(|window.print|PDF/);assert.match(page,/complimentary/)})
test('role authority and aliases',()=>{assert.equal(canMutateFnb('SUPER_ADMIN'),true);for(const r of ['DIRECTOR','ADMIN','MANAGER','CASHIER','RECEPTIONIST'])assert.equal(canMutateFnb(r),false);assert.ok(isFnbRoute('/fnb/kitchen-kot'));const routes=readFileSync(new URL('../src/constants/routePermissions.js',import.meta.url),'utf8');assert.match(routes,/'\/fnb': \[ROLES.SUPER_ADMIN, ROLES.DIRECTOR\]/)})
test('food and beverage routing',()=>{assert.equal(department('FOOD'),'KITCHEN');assert.equal(department('BEVERAGE'),'BAR');assert.equal(department('unknown'),'Unavailable')})
test('strict positive bounded quantity',()=>{for(const v of ['1','2','2147483647'])assert.ok(validQuantity(v));for(const v of ['0','-1','1.2','1e2','2abc','2147483648','',null])assert.equal(validQuantity(v),false)})
test('authoritative selection and displayed Business Date required',()=>{const f={type:'FOOD',item:' Rice ',quantity:'2',location:' Floor ',remarks:''};assert.throws(()=>createPayload(f,null,'2026-09-15'));assert.throws(()=>createPayload(f,{id:'id'},null));const p=createPayload(f,{id:'id'},'2026-09-15');assert.equal(p.expectedBusinessDate,'2026-09-15');assert.equal(p.customerId,'id');assert.equal(p.quantity,2);assert.equal(p.item,'Rice');assert.equal(p.customerSessionId,null)})
test('forward status actions and terminal states',()=>{assert.deepEqual(actions('PENDING'),['PREPARING','CANCELLED']);assert.deepEqual(actions('PREPARING'),['READY','CANCELLED']);assert.deepEqual(actions('READY'),['DELIVERED','CANCELLED']);for(const s of ['DELIVERED','CANCELLED','legacy'])assert.deepEqual(actions(s),[])})
test('late requests discarded',()=>{const gate=createGate(),old=gate.next();gate.next();assert.equal(gate.current(old),false);assert.match(form,/gate.current.current\(generation\)/);assert.match(page,/gate.current.current\(generation\)/)})
test('synchronous duplicate protection and frozen uncertain retries',()=>{const storage=new Map(),adapter={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};let submit=createSubmission({storage:adapter,namespace:'actor'});const p={expectedBusinessDate:'2026-09-15',quantity:2};const a=submit.begin('create',p);assert.equal(submit.begin('create',p),null);assert.ok(Object.isFrozen(a.payload));submit.finish(false);submit=createSubmission({storage:adapter,namespace:'actor'});assert.equal(submit.begin('create',p).key,a.key);submit.finish(true);assert.notEqual(submit.begin('create',p).key,a.key)})
test('rollover handled without frontend date inference',()=>{assert.match(page,/records.currentBusinessDate!==summary.businessDate/);assert.match(page,/e.response\?\.status===409/);assert.doesNotMatch(page+form,/new Date\(|2083/);assert.match(page,/expectedVersion:row.version/)})
test('confirmed mutation remains successful after refresh failure',()=>{assert.match(page,/confirmed=true/);assert.match(page,/Request saved successfully\. Refresh failed/);assert.match(page,/finish\(confirmed\|\|rejected\)/)})
test('unavailable is distinct from zero and stale data is cleared',()=>{assert.match(page,/setPage\(null\);setOverview\(null\)/);assert.match(page,/overview\?\.available\?overview.metrics\[k\]:'Unavailable'/);assert.match(page,/Authoritative F&B data unavailable/)})
test('records filter persisted dates and bound loaded CSV',()=>{assert.match(page,/businessDate:'',from:'',to:''/);assert.match(page,/Up to 100 records/);assert.match(page,/recordsCsv\(page.records\)/)})
test('CSV Unicode escaping and formula safety',()=>{const csv=recordsCsv([{id:'=1+1',businessDate:'2026-09-15',item:'चिया,"Tea"\nHot',quantity:2,customerName:'+cmd',location:'@formula',remarks:'-formula'}]);assert.ok(csv.includes('"\'=1+1"'));assert.ok(csv.includes('"\'+cmd"'));assert.ok(csv.includes('"\'@formula"'));assert.ok(csv.includes('"\'-formula"'));assert.ok(csv.includes('चिया,""Tea""\nHot'));assert.ok(csv.includes('Business Date'));assert.ok(csv.includes('2026-09-15'))})
test('shared fake header is hidden only on F&B routes',()=>{const header=readFileSync(new URL('../src/components/layout/MainLayout.jsx',import.meta.url),'utf8');assert.match(header,/!isFnb && !isCrm/);assert.match(header,/isFnbRoute\(pathname\)/)})

test('uncertain create is recoverable after reload and Business Date rollover',()=>{
 const memory=new Map(), storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)}
 let submit=createSubmission({storage,namespace:'actor'})
 const original={customerId:'customer',expectedBusinessDate:'2026-09-15',item:'Tea',quantity:2,location:'Floor'}
 const first=submit.begin('create',original);submit.finish(false)
 submit=createSubmission({storage,namespace:'actor'})
 const [saved]=submit.pendingCreates();assert.deepEqual(saved.payload,original)
 assert.equal(saved.payload.expectedBusinessDate,'2026-09-15')
 assert.equal(submit.begin(saved.target,saved.payload).key,first.key)
 submit.finish(true);assert.deepEqual(submit.pendingCreates(),[])
 assert.match(page,/save\(p.payload\)/);assert.match(page,/Retry saved request/)
})
