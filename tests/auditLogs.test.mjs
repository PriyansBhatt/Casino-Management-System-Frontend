import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { readFile } from 'node:fs/promises'
import { auditPage, actorLabel, detailsLabel, auditCsv, createAuditReader } from '../src/utils/auditLogRead.js'
import { isDeferredTestRoute } from '../src/utils/testEnvironment.js'
const row = patch => ({ id:'audit-1',performedAt:'2026-09-03T16:39:33',businessDate:'2026-09-02',actionType:'USER_CREATED',moduleName:'USER_MANAGEMENT',entityId:'entity-1',actor:{id:'actor-1',username:'root',fullName:'管理者'},safeDetails:'role=CASHIER',detailsWithheld:false,...patch })
const page = (items=[],p=0,hasNext=false) => ({items,page:p,size:50,hasNext})
const deferred = () => { let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject} }
let id=0
async function bundle(entry, ui=false) {
 const out=await build({entryPoints:[entry],bundle:true,write:false,format:'esm',jsx:'automatic',define:{'import.meta.env.VITE_USE_MOCK_ADMIN':'"true"'},plugins:[{name:'test-boundaries',setup(b){
  b.onResolve({filter:/axiosInstance$/},()=>({path:'api',namespace:'stub'}))
  if(ui){
   b.onResolve({filter:/^react$/},()=>({path:'react',namespace:'stub'}))
   b.onResolve({filter:/^react\/jsx-runtime$/},()=>({path:'jsx',namespace:'stub'}))
   b.onResolve({filter:/hooks\/useAuth$/},()=>({path:'auth',namespace:'stub'}))
   b.onResolve({filter:/api\/auditApi$/},()=>({path:'audit',namespace:'stub'}))
  }
  b.onLoad({filter:/.*/,namespace:'stub'},({path})=>({contents:({api:'export default globalThis.__auApi',audit:'export const getAuditLogs=(...args)=>globalThis.__auRead(...args)',auth:'export default () => ({user:globalThis.__a1Actor})',react:'export const useState=(...a)=>globalThis.__a1Hooks.useState(...a);export const useRef=(...a)=>globalThis.__a1Hooks.useRef(...a);export const useEffect=(...a)=>globalThis.__a1Hooks.useEffect(...a);',jsx:'export const jsx=(type,props)=>({type,props});export const jsxs=jsx;export const Fragment="fragment";'})[path]}))
 }}]})
 return import('data:text/javascript;base64,'+Buffer.from(out.outputFiles[0].text).toString('base64')+'#'+(++id))
}

function harness(){const slots=[];let cursor=0;const effects=[];return {hooks:{useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v}]},useRef(initial){const i=cursor++;return slots[i] ||= {current:initial}},useEffect(f){effects.push(f)}},render(fn){cursor=0;return fn()},effects}}
function nodes(tree){if(!tree||typeof tree!=='object')return [];return [tree,...Object.values(tree.props||{}).flatMap(value=>Array.isArray(value)?value.flatMap(nodes):nodes(value))]}
const text=node=>JSON.stringify(node?.props?.children)
const tick=()=>new Promise(resolve=>setTimeout(resolve,0))

test('only canonical audit route restored and authority excludes legacy roles',async()=>{
 for(const path of ['/audit-logs','/admin/users','/admin/system-lock'])assert.equal(isDeferredTestRoute(path),false)
 for(const path of ['/audit-logs/id','/audit/reports','/admin/roles','/settings'])assert.equal(isDeferredTestRoute(path),true)
 const {canAccessRoute}=await bundle('src/utils/accessControl.js')
 for(const role of ['SUPER_ADMIN','DIRECTOR','ADMIN','AUDITOR','COMPLIANCE_OFFICER','SURVEILLANCE_OFFICER','CASHIER','RECEPTIONIST','PIT_SUPERVISOR','DEALER'])assert.equal(canAccessRoute({role},'/audit-logs'),['SUPER_ADMIN','DIRECTOR'].includes(role))
})
test('API unwraps authoritative slice; client audit never POSTs',async()=>{
 const calls=[];globalThis.__auApi={get:async(...args)=>{calls.push(args);return {data:{success:true,data:page([row()])}}}}
 const {getAuditLogs}=await bundle('src/api/auditApi.js');assert.equal((await getAuditLogs({module:'HR'})).items.length,1);assert.deepEqual(calls,[['/audit-logs',{params:{module:'HR'}}]])
 globalThis.__auApi.get=async()=>({data:{success:false,data:[]}});await assert.rejects(getAuditLogs())
 const service=await import('../src/services/auditService.js');assert.equal(await service.logAuditEvent({password:'secret'}),null);assert.equal(await service.safeLogAuditEvent({}),null)
 const source=await readFile('src/api/auditApi.js','utf8');assert.doesNotMatch(source,/localStorage|seedAudit|\.post\(|exportAuditLogs|getAuditLogById/)
})
test('DTO rejects malformed page and excludes unsupported fields',()=>{
 assert.throws(()=>auditPage([]));assert.throws(()=>auditPage({...page(),size:101}));assert.throws(()=>auditPage(page([row({detailsWithheld:true,safeDetails:'secret'})])))
 const clean=auditPage(page([row({remarks:'SECRET',passwordHash:'HASH',actor:{id:'a',username:'u',role:'SUPER_ADMIN'}})]));assert.doesNotMatch(JSON.stringify(clean),/SECRET|HASH|SUPER_ADMIN/)
})
test('loading error and empty are distinct; failure clears prior rows',async()=>{
 let fail=false;const model=createAuditReader(async()=>{if(fail)throw Error('private details');return page([row()])},()=>{})
 const pending=model.load();assert.equal(model.state.loading,true);assert.equal(model.state.data,null);await pending;assert.equal(model.state.data.items.length,1)
 fail=true;await model.load();assert.equal(model.state.data,null);assert.match(model.state.error,/unavailable/);assert.doesNotMatch(model.state.error,/private/)
 const empty=createAuditReader(async()=>page(),()=>{});await empty.load();assert.deepEqual(empty.state.data.items,[])
})
test('pagination and changed filters invalidate old requests and reset page',async()=>{
 const old=deferred(),calls=[];const model=createAuditReader(async params=>{calls.push(params);return calls.length===1?old.promise:page([row()],params.page)},()=>{})
 const pending=model.load({module:'old'},3);await model.load({module:'new'});old.resolve(page([],3));await pending;assert.equal(model.state.page,0);assert.equal(model.state.filters.module,'new');assert.equal(model.state.data.items.length,1)
 await model.load({module:'new'},1);assert.equal(model.state.page,1)
 const late=deferred();let updates=0;const dead=createAuditReader(()=>late.promise,()=>updates++);const load=dead.load();dead.dispose();late.resolve(page());await load;assert.equal(updates,1)
})
test('actor and persisted Business Date have no reconstructed authority',()=>{
 assert.equal(actorLabel(null),'Not recorded');assert.equal(actorLabel({id:'missing'}),'Unknown user');assert.equal(actorLabel({username:'u'}),'u');assert.equal(actorLabel(row().actor),'管理者')
 assert.equal(auditPage(page([row()])).items[0].businessDate,'2026-09-02');assert.equal(detailsLabel(row({detailsWithheld:true,safeDetails:null})),'Details withheld')
})
test('CSV current rows only; Unicode quoting and formula protection; withheld data absent',()=>{
 const rows=['=X','+X','-X','@X'].map(x=>row({actionType:x,safeDetails:'你好, "quote"\nline'}));rows.push(row({detailsWithheld:true,safeDetails:null,remarks:'WITHHELD_SECRET'}))
 const csv=auditCsv(rows);for(const prefix of ['=','+','-','@'])assert.ok(csv.includes("'"+prefix+'X'));assert.ok(csv.includes('你好, ""quote""\nline'));assert.match(csv,/Details withheld/);assert.doesNotMatch(csv,/WITHHELD_SECRET/);assert.equal(csv.charCodeAt(0),0xfeff)
})
test('rendered page shows safe table and detail, clears selection on filter change',async()=>{
 const h=harness();globalThis.__a1Hooks=h.hooks;globalThis.__a1Actor={username:'director',role:'DIRECTOR'};globalThis.__auRead=async()=>page([row({detailsWithheld:true,safeDetails:null})],0,true)
 const {default:Page}=await bundle('src/pages/audit/AuditLogs.jsx',true);let tree=h.render(Page);h.effects[0]();tree=h.render(Page);assert.match(JSON.stringify(tree),/Loading audit records/);await tick();tree=h.render(Page)
 assert.match(JSON.stringify(tree),/管理者/);assert.match(JSON.stringify(tree),/Details withheld/);assert.doesNotMatch(JSON.stringify(tree),/Severity|historical role|Print|PDF|Create Audit|Delete Audit/)
 const button=label=>nodes(tree).find(n=>n.type==='button'&&text(n)===JSON.stringify(label))
 assert.equal(button('Previous').props.disabled,true);assert.equal(button('Next').props.disabled,false)
 button('View').props.onClick();tree=h.render(Page);assert.ok(nodes(tree).some(n=>n.props?.role==='dialog'));assert.match(JSON.stringify(tree),/Actor ID/)
 nodes(tree).find(n=>n.type==='input'&&n.props['aria-label']==='Search').props.onChange({target:{value:'changed'}});tree=h.render(Page);assert.equal(nodes(tree).some(n=>n.props?.role==='dialog'),false)
 globalThis.__a1Actor={role:'CASHIER'};assert.match(JSON.stringify(h.render(Page)),/Only Director/)
})

test('CSV neutralizes formulas after leading whitespace and controls without changing display',()=>{
 for(const whitespace of [' ', '\t', '\r\n', '\u00a0', '\u0000', ' \t'])for(const symbol of ['=','+','-','@']){
  const value=whitespace+symbol+'SUM(1,2)';const record=row({safeDetails:value});const csv=auditCsv([record]);
  assert.ok(csv.includes('"\''+value+'"'));assert.equal(record.safeDetails,value)
 }
 assert.ok(auditCsv([row({safeDetails:null})]).includes('Not recorded'))
})

test('malformed display fields fail closed; nullable persisted fields stay honest',()=>{
 for(const patch of [{performedAt:{}},{moduleName:[]},{actor:'wrong'},{actor:{id:'id',fullName:{}}}])assert.throws(()=>auditPage(page([row(patch)])))
 const nullable=row({performedAt:null,businessDate:null,entityId:null,actionType:null,moduleName:null,actor:null,safeDetails:null});assert.equal(auditPage(page([nullable])).items[0].businessDate,null)
})
