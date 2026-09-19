import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { readFile } from 'node:fs/promises'
import { isStoreRoute,canReadStore,canWriteStore,decodePage,decodeDetail,decodeReceipt,decodeRow,positiveQuantity,requestPayload,freezeIntent,createStoreManager,storeCsv,STORE_TABS } from '../src/utils/store.js'
import { isDeferredTestRoute } from '../src/utils/testEnvironment.js'
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`, now='2026-09-18T10:00:00'
const item={id:id(1),code:'A',name:'Paper',category:'Goods',unit:'PCS',active:true,quantityBalance:0,version:0,hasHistory:false,hasMovements:false,createdAt:now}
const staff={id:id(2),employeeCode:'E1',name:'Employee',departmentId:id(3),departmentName:'Kitchen'}
const request={id:id(4),reference:'SR-4',departmentId:id(3),departmentName:'Kitchen',requesterStaffProfileId:id(2),requesterName:'Employee',recordedByUserId:id(9),recordedByName:'Recorder',createdAt:now,requiredDate:null,remarks:null,status:'PENDING',version:0,cancelledAt:null,cancellationReason:null}
const line={id:id(5),itemId:id(1),itemCode:'A',itemName:'Paper',unit:'PCS',active:true,requestedQuantity:10,issuedQuantity:6,cancelledQuantity:0,outstandingQuantity:4,availableQuantity:0,procurementId:null,procurementReference:null,procurementStatus:null}
const procurement={id:id(6),reference:'SP-6',requestLineId:id(5),requestId:id(4),requestReference:'SR-4',departmentName:'Kitchen',itemId:id(1),itemCode:'A',itemName:'Paper',unit:'PCS',quantity:4,receivedQuantity:0,outstandingQuantity:4,status:'ORDERED',supplierReference:null,createdAt:now,orderedAt:now,cancelledAt:null,cancellationReason:null,version:1}
const movement={id:id(7),reference:'SM-7',itemId:id(1),itemCode:'A',itemName:'Paper',unit:'PCS',movementType:'OPENING',quantity:6,balanceAfter:6,requestLineId:null,requestReference:null,procurementId:null,procurementReference:null,departmentName:null,performedBy:id(9),performedByName:'Recorder',performedAt:now,businessDate:null,reason:null,externalReference:null}
const rows={items:item,staff,requests:request,procurements:procurement,movements:movement}
const page=(kind,overrides={})=>({items:[rows[kind]],page:0,size:50,hasNext:false,...overrides})
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}}
const storage=()=>{const map=new Map();return{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}}
function model(api={},extra={}){let state={},actor='actor';const manager=createStoreManager({list:async kind=>page(kind),detail:async()=>({request,lines:[line]}),mutate:async()=>({id:id(8),reference:'SM-8'}),...api},{actor,role:'SUPER_ADMIN',publish:s=>{state=s},resolveActor:()=>actor,storage:storage(),...extra});return {manager,get state(){return state},changeActor:()=>{actor='another'}}}
const intent=()=>freezeIntent('issue',`request-lines/${id(5)}/issues`,{quantity:4},'A','key')

test('exactly four tabs and strict role authority',()=>{
 assert.deepEqual(STORE_TABS,['Requests','Inventory','Procurement / Receiving','Records'])
 for(const role of ['SUPER_ADMIN','DIRECTOR','ADMIN','CASHIER','PIT_SUPERVISOR','DEALER','RECEPTIONIST','STORE_KEEPER',null]){assert.equal(canReadStore(role),['SUPER_ADMIN','DIRECTOR'].includes(role));assert.equal(canWriteStore(role),role==='SUPER_ADMIN')}
})
test('bounded DTO contracts reject every missing field and invalid numbers',()=>{
 for(const [kind,row] of Object.entries(rows)){
  assert.equal(decodePage(kind,page(kind)).items[0],row)
  for(const key of Object.keys(row)){const invalid={...row};delete invalid[key];assert.throws(()=>decodeRow(kind,invalid),/malformed/)}
 }
 for(const patch of [{size:101},{size:0},{page:-1},{hasNext:'true'},{items:null},{items:[{...item,quantityBalance:'0'}]},{items:[{...item,quantityBalance:-1}]},{items:[{...item,version:Number.MAX_SAFE_INTEGER+1}]}])assert.throws(()=>decodePage('items',page('items',patch)))
 assert.throws(()=>decodeDetail({request,lines:[{...line,outstandingQuantity:5}]}));assert.throws(()=>decodePage('procurements',page('procurements',{items:[{...procurement,receivedQuantity:5}]})))
 assert.throws(()=>decodeReceipt({id:'bad',reference:'x'}));assert.equal(decodeRow('movements',movement).businessDate,null)
})
test('request has authoritative staff id only, immutable requested quantities, duplicate lines rejected',()=>{
 const payload=requestPayload(staff,[{itemId:id(1),quantity:'10'}],'',' hi ')
 assert.deepEqual(payload,{staffProfileId:id(2),requiredDate:null,remarks:'hi',lines:[{itemId:id(1),quantity:10}]})
 assert.throws(()=>requestPayload(staff,[{itemId:id(1),quantity:1},{itemId:id(1),quantity:1}],'',''))
 for(const n of ['1.2','2e3','-1','0','','2147483648',null])assert.throws(()=>positiveQuantity(n))
 assert.equal(positiveQuantity('2147483647'),2147483647)
})
for(const channel of ['main','staff','referenceItems','detail'])test(`stale ${channel} success/error cannot replace a newer scope`,async()=>{
 const a=deferred(),b=deferred();let n=0
 const m=model({list:()=>++n===1?a.promise:b.promise,detail:()=>++n===1?a.promise:b.promise})
 const kind=channel==='detail'?'detail':channel==='staff'?'staff':'items',params={id:id(4)}
 const first=m.manager.load(channel,kind,params),second=m.manager.load(channel,kind,params)
 const value=kind==='detail'?{request,lines:[line]}:page(kind);b.resolve(value);await second;a.reject(Error('old failure'));await first
 assert.equal(m.state[channel].data,value);assert.equal(m.state[channel].error,'');assert.equal(m.state[channel].loading,false)
})
for(const kind of ['requests','items','procurements','movements'])test(`latest ${kind} filter wins and failure clears prior authority`,async()=>{
 const a=deferred();let n=0;const m=model({list:()=>++n===1?a.promise:Promise.resolve(page(kind,{items:[]}))})
 const old=m.manager.load('main',kind,{q:'old'});await m.manager.load('main',kind,{q:'new'});a.resolve(page(kind));await old;assert.deepEqual(m.state.main.data.items,[])
 const bad=model({list:async()=>{throw Error('offline')}});await bad.manager.load('main',kind);assert.equal(bad.state.main.data,null);assert.match(bad.state.main.error,/offline/)
})
test('unmount, remount and actor changes invalidate pending reads',async()=>{
 const a=deferred();const m=model({list:()=>a.promise});const p=m.manager.load('main','items');m.manager.dispose();m.manager.activate();a.resolve(page('items'));await p;assert.equal(m.state.main.data,null)
 const b=deferred();const next=model({list:()=>b.promise});const pending=next.manager.load('main','items');next.changeActor();b.resolve(page('items'));await pending;assert.equal(next.state.main.data,null);await assert.rejects(next.manager.submit(intent()),/authentication/)
})
test('intent is deeply frozen before confirmation and double submission is synchronous',async()=>{
 const raw={quantity:4},saved=freezeIntent('issue',`request-lines/${id(5)}/issues`,raw,'A','key');raw.quantity=9;assert.equal(saved.payload.quantity,4);assert.throws(()=>{saved.payload.quantity=5})
 const d=deferred();let calls=0;const m=model({mutate:()=>{calls++;return d.promise}});const first=m.manager.submit(saved);assert.equal(await m.manager.submit(saved),null);await new Promise(r=>setImmediate(r));assert.equal(calls,1);d.resolve({id:id(8),reference:'SM-8'});await first
})
test('uncertain mutation survives remount and retries original actor/key/target/payload',async()=>{
 const store=storage(),sent=[];const m=model({mutate:async op=>{sent.push(op);throw Error('timeout')}},{storage:store})
 await assert.rejects(m.manager.submit(intent()),/timeout/);m.manager.dispose()
 const next=model({mutate:async op=>{sent.push(op);return{id:id(8),reference:'SM-8'}}},{storage:store})
 assert.equal(next.manager.recovery.operation.operationKey,'key');await next.manager.submit(null,null,true)
 assert.deepEqual(sent[0],sent[1]);assert.equal(next.manager.recovery.operation,null)
})
test('discard changes only local recovery, confirmed success survives failed refresh',async()=>{
 let calls=0;const m=model({mutate:async()=>{calls++;throw Error('network')}});await assert.rejects(m.manager.submit(intent()));m.manager.recovery.discard();assert.equal(calls,1);assert.equal(m.manager.recovery.operation,null)
 const ok=model();await ok.manager.submit(intent(),async()=>{throw Error('refresh')});assert.match(ok.state.message,/Recorded successfully.*Refresh failed/);assert.equal(ok.state.mutationError,'')
})
test('Director cannot submit or recover mutation, changed actor cannot retry',async()=>{
 const director=model({}, {role:'DIRECTOR'});await director.manager.load('main','items');await assert.rejects(director.manager.submit(intent()),/access/)
 const m=model({mutate:async()=>{throw Error('timeout')}});await assert.rejects(m.manager.submit(intent()));m.changeActor();await assert.rejects(m.manager.submit(null,null,true),/authentication/)
})
test('CSV uses only supplied authoritative page and protects formulas/quotes/newlines without reasons',()=>{
 for(const prefix of ['=','+','-','@',' \t=','\r\n@','\u0001-']){const csv=storeCsv('items',[{...item,name:prefix+'formula'}]);assert.ok(csv.includes(`"'${prefix}formula"`))}
 const csv=storeCsv('movements',[{...movement,itemName:'Rice, "खाना"\nbox',reason:'PRIVATE',externalReference:'PRIVATE'}]);assert.ok(csv.startsWith('\uFEFF'));assert.match(csv,/Business Date/);assert.match(csv,/Unavailable/);assert.ok(csv.includes('"Rice, ""खाना""\nbox"'));assert.doesNotMatch(csv,/PRIVATE/)
})
test('Store promoted in T0, other unsupported routes stay deferred',()=>{
 for(const path of ['/store','/store/purchase','/store/dashboard','/procurement/list'])assert.equal(isDeferredTestRoute(path),false)
 for(const path of ['/store/unknown','/procurement/vendor-quotations','/procurement/purchase-orders','/accounts/reports'])assert.equal(isDeferredTestRoute(path),true)
})
async function bundle(entry){const result=await build({entryPoints:[entry],bundle:true,write:false,format:'esm',plugins:[{name:'store-boundary',setup(b){b.onResolve({filter:/axiosInstance$/},()=>({path:'axios',namespace:'sp1'}));b.onLoad({filter:/.*/,namespace:'sp1'},()=>({contents:'export default globalThis.__storeAxios'}))}}]});return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))}
test('production API posts exact frozen payload and never loads prototype data',async()=>{
 const calls=[];globalThis.__storeAxios={post:async(...args)=>{calls.push(args);return{data:{success:true,data:{id:id(8),reference:'SM-8'}}}}};
 try {const {default:api}=await bundle('src/api/storeApi.js');await api.mutate(intent());assert.equal(calls[0][0],`/store/request-lines/${id(5)}/issues`);assert.deepEqual(calls[0][1],{quantity:4,idempotencyKey:'key'});await assert.rejects(api.mutate({...intent(),target:{path:'../cashouts'}}),/Invalid saved/)}finally{delete globalThis.__storeAxios}
})
test('routes no longer import active prototypes and header hides fake placeholders',async()=>{
 const routes=await readFile('src/routes/AppRoutes.jsx','utf8');assert.doesNotMatch(routes,/import (ProcurementList|PurchaseOrders|VendorQuotations|StoreReview|StockManagement)/)
 assert.match(routes,/path="\/store\/purchase"/);assert.match(routes,/Quotations and formal purchase orders are outside Store SP1/)
 const header=await readFile('src/components/layout/MainLayout.jsx','utf8');assert.match(header,/!isStore && !isFnb/)
})

function hookHarness(){
 const slots=[];let cursor=0;const pending=[]
 const same=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]))
 return {hooks:{
  useState(initial){const n=cursor++;if(!(n in slots))slots[n]=typeof initial==='function'?initial():initial;return[slots[n],v=>{slots[n]=typeof v==='function'?v(slots[n]):v}]},
  useRef(initial){const n=cursor++;return slots[n]??=( {current:initial})},
  useMemo(fn,deps){const n=cursor++;if(!slots[n]||!same(slots[n].deps,deps))slots[n]={value:fn(),deps};return slots[n].value},
  useEffect(fn,deps){const n=cursor++;if(!slots[n]||!same(slots[n].deps,deps)){slots[n]?.cleanup?.();slots[n]={deps};pending.push(()=>{slots[n].cleanup=fn()})}},
 },render(Page){cursor=0;return Page()},async effects(){while(pending.length)pending.shift()();await new Promise(r=>setImmediate(r))},dispose(){slots.forEach(s=>s?.cleanup?.())}}
}
const expand=value=>{
 if(Array.isArray(value))return value.map(expand)
 if(!value||typeof value!=='object')return value
 if(typeof value.type==='function')return expand(value.type(value.props||{}))
 return {...value,props:{...value.props,children:expand(value.props?.children)}}
}
function nodes(tree,predicate){if(Array.isArray(tree))return tree.flatMap(v=>nodes(v,predicate));if(!tree||typeof tree!=='object')return[];return [...(predicate(tree)?[tree]:[]),...nodes(tree.props?.children,predicate)]}
async function pageBundle(){
 const result=await build({entryPoints:['src/pages/store/StorePurchaseDashboard.jsx'],bundle:true,write:false,format:'esm',jsx:'automatic',plugins:[{name:'store-page',setup(b){
  for(const [filter,path] of [[/^react$/,'react'],[/^react\/jsx-runtime$/,'jsx'],[/hooks\/useAuth$/,'auth'],[/api\/storeApi$/,'api'],[/components\/ui\/PendingOperation$/,'pending']])b.onResolve({filter},()=>({path,namespace:'page'}))
  b.onLoad({filter:/.*/,namespace:'page'},({path})=>({contents:{react:'export const useState=(...a)=>globalThis.__storeHooks.useState(...a);export const useMemo=(...a)=>globalThis.__storeHooks.useMemo(...a);export const useRef=(...a)=>globalThis.__storeHooks.useRef(...a);export const useEffect=(...a)=>globalThis.__storeHooks.useEffect(...a)',jsx:'export const jsx=(type,props,key)=>({type,props,key});export const jsxs=jsx;export const Fragment="fragment";',auth:'export default()=>({user:globalThis.__storeUser})',api:'export default globalThis.__storePageApi',pending:'export default()=>null'}[path]}))
 }}]});return (await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64')+'#'+Math.random())).default
}
test('production four-tab page renders actual zero, department request detail, and Director restrictions',async()=>{
 const original={localStorage:globalThis.localStorage,sessionStorage:globalThis.sessionStorage}
 try{
  globalThis.localStorage={getItem:k=>k==='auth_token'?'token':JSON.stringify({id:'actor'})};globalThis.sessionStorage=storage()
  for(const role of ['SUPER_ADMIN','DIRECTOR']){
   const h=hookHarness();globalThis.__storeHooks=h.hooks;globalThis.__storeUser={id:'actor',role};globalThis.__storePageApi={list:async kind=>page(kind),detail:async()=>({request,lines:[line]})}
   const Page=await pageBundle();h.render(Page);await h.effects();let tree=expand(h.render(Page))
   assert.ok(JSON.stringify(tree).includes('SR-4'));assert.ok(JSON.stringify(tree).includes('Kitchen'))
   const button=text=>nodes(tree,n=>n.type==='button'&&n.props.children===text)[0]
   assert.equal(!!button('New Request'),role==='SUPER_ADMIN');button('View request').props.onClick();await h.effects();tree=expand(h.render(Page));assert.ok(JSON.stringify(tree).includes('Outstanding'))
   button('Inventory').props.onClick();h.render(Page);await h.effects();tree=expand(h.render(Page));assert.ok(JSON.stringify(tree).includes('Quantity balance'));assert.equal(!!button('New Item'),role==='SUPER_ADMIN')
   assert.doesNotMatch(JSON.stringify(tree),/Purchase Orders|Bills to Accounts|Vehicle|Net W\/L|2083-03-04/);h.dispose()
  }
 }finally{globalThis.localStorage=original.localStorage;globalThis.sessionStorage=original.sessionStorage;delete globalThis.__storeHooks;delete globalThis.__storeUser;delete globalThis.__storePageApi}
})
test('wrong-target detail and wrong-page responses fail closed',async()=>{
 const a=model({detail:async()=>({request:{...request,id:id(99)},lines:[line]})});await a.manager.load('detail','detail',{id:id(4)});assert.equal(a.state.detail.data,null);assert.match(a.state.detail.error,/malformed/)
 const b=model({list:async()=>page('items',{page:1})});await b.manager.load('main','items',{page:0});assert.equal(b.state.main.data,null)
})

test('late mutation completion after identity change cannot close or populate the replacement view',async()=>{
 const d=deferred();const m=model({mutate:()=>d.promise});const result=m.manager.submit(intent());await new Promise(r=>setImmediate(r));m.changeActor();d.resolve({id:id(8),reference:'SM-8'});assert.equal(await result,null);assert.equal(m.manager.isCurrent(),false);assert.equal(m.state.message,'')
})

test('Store route header containment handles router case and URL decoding',()=>{
 for(const path of ['/store','/STORE/PURCHASE','/%73tore/purchase','/store/dashboard'])assert.equal(isStoreRoute(path),true)
 for(const path of ['/storehouse','/customers','/%zz'])assert.equal(isStoreRoute(path),false)
})
test('all authoritative quantities remain within PostgreSQL integer range',()=>{
 for(const [kind,row] of Object.entries({...rows,lines:line}))for(const key of Object.keys(row).filter(k=>/quantity|balance/i.test(k))) {
  assert.throws(()=>decodeRow(kind,{...row,[key]:2147483648}),/malformed/)
 }
 assert.equal(decodeRow('items',{...item,quantityBalance:2147483647}).quantityBalance,2147483647)
})

test('slow list refresh cannot initiate obsolete detail after a newer selection',async()=>{
 const original={localStorage:globalThis.localStorage,sessionStorage:globalThis.sessionStorage}
 const slow=deferred(),other={...request,id:id(40),reference:'SR-40'};let reads=0;const details=[]
 try {
  globalThis.localStorage={getItem:k=>k==='auth_token'?'token':JSON.stringify({id:'actor'})};globalThis.sessionStorage=storage()
  const h=hookHarness();globalThis.__storeHooks=h.hooks;globalThis.__storeUser={id:'actor',role:'DIRECTOR'}
  globalThis.__storePageApi={list:async()=>++reads===2?slow.promise:page('requests',{items:[request,other]}),detail:async target=>{details.push(target);return {request:target===other.id?other:request,lines:[line]}}}
  const Page=await pageBundle();h.render(Page);await h.effects();let tree=expand(h.render(Page))
  nodes(tree,n=>n.type==='button'&&n.props.children==='View request')[0].props.onClick();await h.effects();tree=expand(h.render(Page))
  const selectOther=nodes(tree,n=>n.type==='button'&&n.props.children==='View request')[1].props.onClick
  const refresh=nodes(tree,n=>n.type==='button'&&n.props.children==='Refresh')[0];assert.ok(refresh);refresh.props.onClick();await h.effects();tree=expand(h.render(Page))
  selectOther();await h.effects();h.render(Page)
  const before=details.length;assert.equal(details.at(-1),other.id)
  slow.resolve(page('requests',{items:[request,other]}));await h.effects();assert.equal(details.length,before);h.dispose()
 }finally {globalThis.localStorage=original.localStorage;globalThis.sessionStorage=original.sessionStorage;delete globalThis.__storeHooks;delete globalThis.__storeUser;delete globalThis.__storePageApi}
})

test('request status change immediately clears old detail authority',async()=>{
 const original={localStorage:globalThis.localStorage,sessionStorage:globalThis.sessionStorage}
 try {
  globalThis.localStorage={getItem:k=>k==='auth_token'?'token':JSON.stringify({id:'actor'})};globalThis.sessionStorage=storage()
  const h=hookHarness();globalThis.__storeHooks=h.hooks;globalThis.__storeUser={id:'actor',role:'SUPER_ADMIN'}
  globalThis.__storePageApi={list:async kind=>page(kind),detail:async()=>({request,lines:[line]})}
  const Page=await pageBundle();h.render(Page);await h.effects();let tree=expand(h.render(Page))
  nodes(tree,n=>n.type==='button'&&n.props.children==='View request')[0].props.onClick();await h.effects();tree=expand(h.render(Page))
  assert.match(JSON.stringify(tree),/Request details/)
  nodes(tree,n=>n.type==='select'&&n.props['aria-label']==='Status or movement type')[0].props.onChange({target:{value:'FULFILLED'}})
  tree=expand(h.render(Page));assert.doesNotMatch(JSON.stringify(tree),/Request details|Issue quantity/);h.dispose()
 }finally {globalThis.localStorage=original.localStorage;globalThis.sessionStorage=original.sessionStorage;delete globalThis.__storeHooks;delete globalThis.__storeUser;delete globalThis.__storePageApi}
})
