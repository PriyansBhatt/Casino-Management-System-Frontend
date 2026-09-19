import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { readFile } from 'node:fs/promises'
import { actionsFor, decode, intent, createAccountsManager, fileMetadata, ACCOUNTS_ROLES } from '../src/utils/accounts.js'
import { isDeferredTestRoute } from '../src/utils/testEnvironment.js'
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`, actor=id(1)
const receipt={id:id(5),version:1,operationId:id(6)}, bill={id:id(5),recorded_by:actor,invoice_reference:'INV',status:'DRAFT',version:0,revision:1,business_date:'2026-09-19',held_stage:null,verification_id:null}
const snapshot={partyName:'Supplier',invoice:{partyId:id(3),invoiceDate:'2026-09-19',currency:'NPR',subtotal:'100.00',discount:'0.00',tax:'0.00',total:'100.00',lines:[{description:'Goods',amount:'100.00'}],sources:[]},sourceSnapshots:[],evidenceIds:[]}
const detail={bill,snapshot,evidence:[],verification:null}, page={items:[],page:0,size:50,hasMore:false}
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k),values:()=>[...m.values()]}}
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}}
function model(api={},opts={}){let who=actor;const manager=createAccountsManager({api:{read:async()=>page,mutate:async()=>receipt,...api},user:{id:actor,role:'STORE_MANAGER',...opts.user},storage:opts.storage||storage(),resolveActor:()=>who});return {manager,changeActor:()=>{who=id(9)}}}
const operation=()=>intent('submit',{id:bill.id,label:'Original bill'},{expectedVersion:0,reason:''},'original-key')
test('responsibility controls, original preparer and verifier identity are distinct',()=>{
 for(const role of ['STORE_MANAGER','ACCOUNTANT_HEAD']){assert.deepEqual(actionsFor({id:actor,role},detail),['corrections','upload','submit']);assert.deepEqual(actionsFor({id:id(2),role},detail),[])}
 for(const role of ['SUPER_ADMIN','ADMIN','CASHIER','DIRECTOR','ACCOUNTS_MANAGER'])assert.deepEqual(actionsFor({id:actor,role},detail),[])
 const submitted={...detail,bill:{...bill,status:'SUBMITTED'}};assert.ok(actionsFor({id:id(2),role:'ACCOUNTS_MANAGER'},submitted).includes('verify'))
 const verified={...detail,bill:{...bill,status:'AWAITING_DIRECTOR_APPROVAL'},verification:{actor_id:id(2)}}
 assert.ok(actionsFor({id:id(3),role:'DIRECTOR'},verified).includes('approve'));assert.deepEqual(actionsFor({id:id(2),role:'DIRECTOR'},verified),[]);assert.deepEqual(actionsFor({id:actor,role:'DIRECTOR'},verified),[])
 for(const status of ['REJECTED','APPROVED_FOR_PAYMENT'])for(const role of ACCOUNTS_ROLES)assert.deepEqual(actionsFor({id:actor,role},{...detail,bill:{...bill,status}}),[])
 const held={...detail,bill:{...bill,status:'HELD',held_stage:'VERIFICATION'}};assert.deepEqual(actionsFor({id:id(2),role:'ACCOUNTS_MANAGER'},held),['resume','return','reject']);assert.deepEqual(actionsFor({id:actor,role:'STORE_MANAGER'},held),[])
})
test('strict decoding rejects unavailable/malformed authority and wrong target/page',async()=>{
 for(const kind of ['context','bills','detail','receipt','evidence','decisions','revisions','parties','sources'])for(const value of [null,{},[],{items:[]}])assert.throws(()=>decode(kind,value))
 assert.equal(decode('detail',detail),detail);assert.deepEqual(decode('context',{currency:'NPR',businessDate:null,actorId:actor,role:'STORE_MANAGER',username:'Operator'}),{currency:'NPR',businessDate:null,actorId:actor,role:'STORE_MANAGER',username:'Operator'})
 const m=model({read:async()=>detail});await m.manager.load('detail','detail',{id:id(99)});assert.equal(m.manager.state.detail.data,null)
 const n=model();await n.manager.load('main','bills',{page:1,size:50});assert.equal(n.manager.state.main.data,null)
})
for(const channel of ['main','detail','context','parties','sources','history'])test(`stale ${channel} cannot overwrite newer data or errors`,async()=>{
 const first=deferred(),second=deferred();let calls=0;const m=model({read:()=>++calls===1?first.promise:second.promise})
 const a=m.manager.load(channel,'bills'),b=m.manager.load(channel,'bills');second.resolve(page);await b;first.reject(Error('stale'));await a;assert.equal(m.manager.state[channel].data,page);assert.equal(m.manager.state[channel].error,'')
 m.manager.dispose()
})
test('frozen target and synchronous duplicate submission protection',async()=>{
 const payload={expectedVersion:4},target={id:bill.id};const op=intent('submit',target,payload,'key');payload.expectedVersion=99;target.id=id(9)
 const pending=deferred(),sent=[];const m=model({mutate:async o=>{sent.push(o);return pending.promise}});const first=m.manager.submit(op);assert.equal(await m.manager.submit(op),null);await new Promise(r=>setImmediate(r));assert.equal(sent.length,1);assert.equal(sent[0].target.id,bill.id);assert.equal(sent[0].payload.expectedVersion,4);pending.resolve(receipt);await first
})
test('uncertain retry keeps original actor payload target and key across remount',async()=>{
 const s=storage(),sent=[];const first=model({mutate:async o=>{sent.push(o);throw Error('timeout')}},{storage:s});await assert.rejects(first.manager.submit(operation()))
 const second=model({mutate:async o=>{sent.push(o);return receipt}},{storage:s});await second.manager.submit(null,async()=>{},true);assert.deepEqual(sent[0],sent[1]);assert.equal(second.manager.recovery.operation,null)
})
test('confirmed success survives refresh failure, malformed success remains uncertain',async()=>{
 const m=model();await m.manager.submit(operation(),async()=>{throw Error('refresh unavailable')});assert.match(m.manager.state.message,/Recorded successfully.*Refresh failed/);assert.equal(m.manager.state.mutationError,'')
 const bad=model({mutate:async()=>({})});await assert.rejects(bad.manager.submit(operation()));assert.ok(bad.manager.recovery.operation)
})
test('actor changes and unmount prevent reads and post-success refresh from crossing authority',async()=>{
 const read=deferred(),m=model({read:()=>read.promise});const promise=m.manager.load('main','bills');m.changeActor();read.resolve(page);await promise;assert.equal(m.manager.state.main.data,null);await assert.rejects(m.manager.submit(operation()),/Authentication/)
 const post=deferred(),n=model({mutate:()=>post.promise});let refreshed=false;const pending=n.manager.submit(operation(),()=>{refreshed=true});await new Promise(r=>setImmediate(r));n.manager.dispose();post.resolve(receipt);await pending;assert.equal(refreshed,false)
})
test('upload recovery saves metadata only and requires exact original bytes on retry',async()=>{
 const file=new File(['binary-evidence'],'invoice.pdf',{type:'application/pdf'}),meta=await fileMetadata(file),s=storage(),sent=[]
 const op=intent('upload',{id:bill.id},{expectedVersion:0,invoiceDocument:true,replacesId:null,file:meta},'upload-key')
 const m=model({mutate:async(o,f)=>{sent.push([o,f]);throw Error('upload timeout')}},{storage:s});await assert.rejects(m.manager.submit(op,undefined,false,file));assert.doesNotMatch(s.values().join(),/binary-evidence|auth_token|password/)
 const n=model({mutate:async(o,f)=>{sent.push([o,f]);return receipt}},{storage:s});await assert.rejects(n.manager.submit(null,undefined,true,new File(['changed'],'invoice.pdf',{type:'application/pdf'})),/exact original/);assert.equal(sent.length,1);await n.manager.submit(null,undefined,true,file);assert.equal(sent.length,2);assert.deepEqual(sent[0][0],sent[1][0])
 await assert.rejects(fileMetadata(new File(['x'],'x.txt',{type:'text/plain'})))
})
test('failed upload stays failed and does not publish a successful evidence row',async()=>{
 const file=new File(['bad'],'invoice.pdf',{type:'application/pdf'}),meta=await fileMetadata(file);const m=model({mutate:async()=>{const e=Error('invalid document');e.response={status:400};throw e}})
 await assert.rejects(m.manager.submit(intent('upload',{id:bill.id},{expectedVersion:0,file:meta}),undefined,false,file));assert.equal(m.manager.state.message,'');assert.equal(m.manager.recovery.operation,null)
})
test('routes allow only the four AC1 roles; Super Admin cannot bypass encoded paths',async()=>{
 const out=await build({entryPoints:['src/utils/accessControl.js'],bundle:true,write:false,format:'esm'});const access=await import('data:text/javascript;base64,'+Buffer.from(out.outputFiles[0].text).toString('base64'))
 for(const role of [...ACCOUNTS_ROLES,'SUPER_ADMIN','ADMIN','CASHIER','ACCOUNTS','RECEPTIONIST','PIT_SUPERVISOR','DEALER'])for(const path of ['/accounts','/accounts/bills','/ACCOUNTS/BILLS/','/%61ccounts/bills'])assert.equal(access.canAccessRoute({role},path),ACCOUNTS_ROLES.includes(role))
 for(const role of ACCOUNTS_ROLES)assert.equal(access.canAccessRoute({role},'/accounts/cheque-payments'),false)
 for(const role of ['STORE_MANAGER','ACCOUNTANT_HEAD','ACCOUNTS_MANAGER'])assert.equal(access.getDefaultRouteForRole(role),'/accounts/bills')
 assert.equal(isDeferredTestRoute('/accounts/bills'),false);assert.equal(isDeferredTestRoute('/accounts'),false);assert.equal(isDeferredTestRoute('/accounts/reports'),true)
 const routes=await readFile('src/routes/AppRoutes.jsx','utf8');assert.doesNotMatch(routes,/import (Bills|CashExpenses|ChequePayments|VendorPaymentHistory|AccountsReports) /)
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
 const result=await build({entryPoints:['src/pages/accounts/AccountsBills.jsx'],bundle:true,write:false,format:'esm',jsx:'automatic',plugins:[{name:'accounts-page',setup(b){
  for(const [filter,path] of [[/^react$/,'react'],[/^react\/jsx-runtime$/,'jsx'],[/hooks\/useAuth$/,'auth'],[/api\/accountsApi$/,'api'],[/components\/ui\/PendingOperation$/,'pending']])b.onResolve({filter},()=>({path,namespace:'page'}))
  b.onLoad({filter:/.*/,namespace:'page'},({path})=>({contents:{react:'export const useState=(...a)=>globalThis.__accountsHooks.useState(...a);export const useMemo=(...a)=>globalThis.__accountsHooks.useMemo(...a);export const useRef=(...a)=>globalThis.__accountsHooks.useRef(...a);export const useEffect=(...a)=>globalThis.__accountsHooks.useEffect(...a)',jsx:'export const jsx=(type,props,key)=>({type,props,key});export const jsxs=jsx;export const Fragment="fragment";',auth:'export default()=>({user:globalThis.__accountsUser})',api:'export default globalThis.__accountsPageApi',pending:'export default()=>null'}[path]}))
 }}]});return (await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64')+'#'+Math.random())).default
}

test('production page renders each responsibility and hides mutation or mock UI appropriately',async()=>{
 const original={localStorage:globalThis.localStorage,sessionStorage:globalThis.sessionStorage}
 try {
  for(const role of [...ACCOUNTS_ROLES,'SUPER_ADMIN']) {
   const viewer={id:isPreparerRole(role)?actor:role==='ACCOUNTS_MANAGER'?id(2):id(3),role}
   globalThis.localStorage={getItem:k=>k==='auth_token'?'token':JSON.stringify(viewer)};globalThis.sessionStorage=storage()
   const h=hookHarness();globalThis.__accountsHooks=h.hooks;globalThis.__accountsUser=viewer
   const shown={...detail,bill:{...bill,status:role==='DIRECTOR'?'AWAITING_DIRECTOR_APPROVAL':role==='ACCOUNTS_MANAGER'?'SUBMITTED':'DRAFT',verification_id:role==='DIRECTOR'?id(7):null},verification:role==='DIRECTOR'?{id:id(7),actor_id:id(2),actor_name:'Verifier',revision:1,action:'VERIFY',decided_at:'2026-09-19T10:00:00',evidence_digest:'a'.repeat(64)}:null}
   let calls=0
   globalThis.__accountsPageApi={read:async(kind,params={})=>{calls++;if(kind==='context')return{businessDate:'2026-09-19',currency:'NPR',actorId:viewer.id,role:viewer.role,username:'Operator'};if(kind==='detail')return shown;return{...page,size:params.size||50,page:params.page||0,items:kind==='bills'?[{...shown.bill,party_name:'Supplier',total:'100.00'}]:[]}}}
   const Page=await pageBundle();h.render(Page);await h.effects();let tree=expand(h.render(Page));await h.effects();tree=expand(h.render(Page))
   const buttons=label=>nodes(tree,n=>n.type==='button'&&n.props.children===label)
   if(role==='SUPER_ADMIN'){assert.match(JSON.stringify(tree),/not permitted/);assert.equal(calls,0);h.dispose();continue}
   assert.equal(buttons('New Bill').length>0,isPreparerRole(role));assert.equal(buttons('View').length,1);buttons('View')[0].props.onClick();h.render(Page);await h.effects();tree=expand(h.render(Page));await h.effects();tree=expand(h.render(Page))
   assert.equal(buttons('Submit for Verification').length>0,isPreparerRole(role));assert.equal(buttons('Verify Invoice').length>0,role==='ACCOUNTS_MANAGER');assert.equal(buttons('Approve for Payment').length>0,role==='DIRECTOR')
   assert.doesNotMatch(JSON.stringify(tree),/2083-03-04|Cheque Payments|Pay Now|Sample Vendor/)
   if(role==='DIRECTOR')assert.match(JSON.stringify(tree),/Verifier/)
   h.dispose()
  }
 }finally{globalThis.localStorage=original.localStorage;globalThis.sessionStorage=original.sessionStorage;delete globalThis.__accountsHooks;delete globalThis.__accountsUser;delete globalThis.__accountsPageApi}
})
function isPreparerRole(role){return ['STORE_MANAGER','ACCOUNTANT_HEAD'].includes(role)}

test('username-only login obtains authoritative ownership identity from context',async()=>{
 const m=createAccountsManager({api:{read:async()=>({currency:'NPR',businessDate:null,actorId:actor,role:'STORE_MANAGER',username:'Preparer'})},user:{username:'Preparer',role:'STORE_MANAGER'},storage:storage(),resolveActor:()=> 'Preparer'})
 assert.equal(await m.load('context','context'),true);assert.ok(actionsFor({role:'STORE_MANAGER',id:m.state.context.data.actorId},detail).includes('submit'));assert.deepEqual(actionsFor({role:'STORE_MANAGER'},detail),[])
 const wrong=createAccountsManager({api:{read:async()=>({currency:'NPR',businessDate:null,actorId:actor,role:'STORE_MANAGER',username:'Other'})},user:{username:'Preparer',role:'STORE_MANAGER'},storage:storage(),resolveActor:()=> 'Preparer'})
 assert.equal(await wrong.load('context','context'),false);assert.equal(wrong.state.context.data,null)
})

test('money remains exact strings and numeric money responses fail closed',()=>{
 assert.throws(()=>decode('detail',{...detail,snapshot:{...snapshot,invoice:{...snapshot.invoice,total:100}}}))
 assert.equal(decode('detail',{...detail,snapshot:{...snapshot,invoice:{...snapshot.invoice,total:'999999999999.99'}}}).snapshot.invoice.total,'999999999999.99')
})
for(const failure of [false,true])test(`late document ${failure?'error':'bytes'} cannot cross selection or authentication`,async()=>{
 const d=deferred(),m=model({document:()=>d.promise});let delivered=0
 const pending=m.manager.download(id(5),id(9),()=>delivered++);m.manager.invalidate('download')
 if(failure)d.reject(Error('old download failed'));else d.resolve(new Blob(['old evidence']))
 assert.equal(await pending,false);assert.equal(delivered,0)
 const late=deferred(),n=model({document:()=>late.promise});const request=n.manager.download(id(5),id(9),()=>delivered++);n.changeActor();late.resolve(new Blob(['private']));assert.equal(await request,false);assert.equal(delivered,0)
})

 test('production manual refresh cannot restore a previously selected bill',async()=>{
 const original={localStorage:globalThis.localStorage,sessionStorage:globalThis.sessionStorage}
 const viewer={id:actor,role:'STORE_MANAGER'}, gate=deferred();let hold=false
 try{
  globalThis.localStorage={getItem:k=>k==='auth_token'?'token':JSON.stringify(viewer)};globalThis.sessionStorage=storage()
  const h=hookHarness();globalThis.__accountsHooks=h.hooks;globalThis.__accountsUser=viewer
  const second={...bill,id:id(8),invoice_reference:'SECOND'}
  globalThis.__accountsPageApi={read:async(kind,params={})=>{
   if(kind==='context')return{businessDate:'2026-09-19',currency:'NPR',actorId:actor,role:viewer.role,username:'Operator'}
   if(kind==='detail')return{...detail,bill:params.id===id(8)?second:bill}
   if(kind==='bills'&&hold)await gate.promise
   return{...page,size:params.size||50,page:params.page||0,items:kind==='bills'?[bill,second].map(b=>({...b,party_name:'Supplier',total:'100.00'})):[]}
  }}
  const Page=await pageBundle();const render=()=>expand(h.render(Page));render();await h.effects();let tree=render();await h.effects();tree=render()
  const button=(label,index=0)=>nodes(tree,n=>n.type==='button'&&n.props.children===label)[index]
  button('View').props.onClick();render();await h.effects();tree=render();await h.effects();tree=render()
  const chooseSecond=button('View',1).props.onClick;hold=true;const refresh=button('Refresh').props.onClick();chooseSecond();render();await h.effects();tree=render()
  gate.resolve();await refresh;render();await h.effects();tree=render()
  const panel=nodes(tree,n=>n.props?.['aria-label']==='Bill detail')[0];assert.match(JSON.stringify(panel),/SECOND/)
  h.dispose()
 }finally{globalThis.localStorage=original.localStorage;globalThis.sessionStorage=original.sessionStorage;delete globalThis.__accountsHooks;delete globalThis.__accountsUser;delete globalThis.__accountsPageApi}
})
