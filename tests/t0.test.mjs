import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { resolveConfig } from 'vite'
import { mockFlags, testEnvironmentDefines, isDeferredTestRoute } from '../src/utils/testEnvironment.js'
let bundleId=0
async function bundle(entry, define = {}, stubApi = false) {
 const result = await build({entryPoints:[entry],bundle:true,write:false,format:'esm',jsx:'automatic',define,plugins:[{name:'boundaries',setup(b){
  b.onResolve({filter:/^react$/},()=>({path:'react',namespace:'stub'}))
  b.onResolve({filter:/^react-hook-form$/},()=>({path:'form',namespace:'stub'}))
  b.onResolve({filter:/axiosInstance$/},()=>({path:'api',namespace:'stub'}))
  b.onResolve({filter:/hooks\/useBusinessStatus$/},()=>({path:'status',namespace:'stub'}))
  b.onResolve({filter:/hooks\/useAuth$/},()=>({path:'auth',namespace:'stub'}))
  b.onResolve({filter:/^react-router-dom$/},()=>({path:'router',namespace:'stub'}))
  b.onResolve({filter:/^react\/jsx-runtime$/},()=>({path:'jsx',namespace:'stub'}))
  b.onLoad({filter:/.*/,namespace:'stub'},({path})=>({contents:({react:'export const forwardRef=f=>f; export const createContext=()=>({Provider: "provider"}); export const useState=(...a)=>globalThis.__t0Hooks.useState(...a); export const useRef=(...a)=>globalThis.__t0Hooks.useRef(...a); export const useEffect=(...a)=>globalThis.__t0Hooks.useEffect(...a); export const useCallback=f=>f; export const useMemo=f=>f();',form:'export const useForm=()=>({register:()=>({}),handleSubmit:f=>f,reset:()=>{}});',status:'export default () => ({error: "offline"})',api:'export default globalThis.__t0Api',auth:'export default () => ({isAuthenticated:true,user:{id:"actor",username:"Real Operator",role:"SUPER_ADMIN"},logout:()=>{}})',router:'export const useLocation=()=>({pathname:"/hr/attendance"}); export const useNavigate=()=>()=>{}; export const Outlet="outlet", NavLink="nav";',jsx:'export const jsx=(type,props)=>({type,props}); export const jsxs=jsx; export const Fragment="fragment";'})[path]}))
 }}]})
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64')+'#'+(++bundleId))
}
test('normal Vite development and production force every discovered mock flag off',async()=>{
 for(const mode of ['development','production']){
  const config=await resolveConfig({mode},mode==='production'?'build':'serve')
  for(const flag of mockFlags)assert.equal(config.define['import.meta.env.'+flag],'"false"')
 }
 const forced=testEnvironmentDefines(Object.fromEntries(mockFlags.map(f=>[f,'true'])))
 for(const flag of mockFlags)assert.equal(forced['import.meta.env.'+flag],'"false"')
 assert.equal(Object.keys(testEnvironmentDefines({VITE_AUTHORITATIVE_TEST_MODE:'false'})).length,1)
})
test('Business Status uses backend even with legacy mocks requested and rejects failures/malformed responses',async()=>{
 let calls=0
 globalThis.__t0Api={get:async path=>{calls++;assert.equal(path,'/business-status/current');return {data:{success:true,data:{businessDate:'2026-09-17',businessDateOpen:true,systemLocked:true}}}}}
 try{
  const api=(await bundle('src/api/businessStatusApi.js',testEnvironmentDefines({VITE_USE_MOCK_BUSINESS_STATUS:'true'}))).default
  const status=await api.getBusinessStatus();assert.equal(status.businessDate,'2026-09-17');assert.equal(status.isLocked,true);assert.equal(calls,1)
  globalThis.__t0Api.get=async()=>{throw Error('offline')};await assert.rejects(api.getBusinessStatus(),/offline/)
  globalThis.__t0Api.get=async()=>({data:{success:false}});await assert.rejects(api.getBusinessStatus(),/unavailable/)
  globalThis.__t0Api.get=async()=>({data:{success:true,data:{}}});await assert.rejects(api.getBusinessStatus(),/unavailable/)
 }finally{delete globalThis.__t0Api}
})
test('deferred routes never return their prototype component; authoritative routes retain theirs',async()=>{
 const {TestScopeContent}=await bundle('src/components/layout/TestScope.jsx',testEnvironmentDefines({}))
 const child={prototype:'must not mount'}
 for(const path of ['/store/purchase','/accounts/bills','/analytics/management','/notifications','/demo/control-panel','/testing/checklist','/admin/roles','/admin/departments','/settings','/STORE/PURCHASE','/%73tore/purchase','/audit-logs/id']){
  assert.equal(isDeferredTestRoute(path),true)
  const view=TestScopeContent({path,children:child});assert.notEqual(view,child);assert.match(JSON.stringify(view),/Deferred \/ Not available/)
 }
 for(const path of ['/dashboard','/reception','/customers','/cashier/buy-in','/chip-control','/cashier/cash-out','/cashier/reconciliation','/pit/tables','/slot-machines','/crm-gre','/fnb','/hr/roster','/reports/running-funds','/admin/business-date','/admin/system-lock','/admin/users','/Admin/Users/','/audit-logs'])assert.equal(TestScopeContent({path,children:child}),child)
})
test('shared T0 header has real user identity and no fake shift, notification count or date',async()=>{
 const {default:Layout}=await bundle('src/components/layout/MainLayout.jsx',testEnvironmentDefines({}))
 const tree=JSON.stringify(Layout({children:'operational page'}))
 assert.match(tree,/Business Status unavailable/);assert.match(tree,/Real Operator/);assert.match(tree,/SUPER_ADMIN/);assert.match(tree,/Authoritative system test/)
 assert.doesNotMatch(tree,/SHIFT|13:00|23:00|2083|🔔/)
})

function hookHarness() {
 const slots=[]; let cursor=0; const effects=[]
 const hooks={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>{slots[i]=v}]},useRef(initial){const i=cursor++;return slots[i] ||= {current:initial}},useEffect(f){effects.push(f)}}
 return {hooks,render(component,props={}){cursor=0;effects.length=0;return component(props)},effects}
}
test('Business Status accepts closed/locked contracts and rejects missing authority and transport failures',async()=>{
 globalThis.__t0Api={get:async()=>{}}
 try {
  const api=(await bundle('src/api/businessStatusApi.js',testEnvironmentDefines({}))).default
  for(const systemLocked of [true,false]) {
   globalThis.__t0Api.get=async()=>({data:{success:true,data:{businessDate:null,businessDateOpen:false,systemLocked}}})
   const result=await api.getBusinessStatus();assert.equal(result.businessDate,null);assert.equal(result.businessDateOpen,false);assert.equal(result.isLocked,systemLocked)
  }
  for(const data of [{businessDateOpen:true,systemLocked:false},{businessDate:'2026-09-17',systemLocked:false},{businessDateOpen:false}]){
   globalThis.__t0Api.get=async()=>({data:{success:true,data}});await assert.rejects(api.getBusinessStatus(),/unavailable/)
  }
  for(const message of ['HTTP 500','timeout','Network Error']) {globalThis.__t0Api.get=async()=>{throw Error(message)};await assert.rejects(api.getBusinessStatus(),new RegExp(message))}
 } finally {delete globalThis.__t0Api}
})
test('failed refresh clears prior status and late responses cannot restore stale authority',async()=>{
 const h=hookHarness();globalThis.__t0Hooks=h.hooks
 globalThis.__t0Api={get:async()=>({data:{success:true,data:{businessDate:'2026-09-17',businessDateOpen:true,systemLocked:false}}})}
 try {
  const {BusinessStatusProvider:Provider}=await bundle('src/context/BusinessStatusContext.jsx',testEnvironmentDefines({}))
  let view=()=>h.render(Provider).props.value
  await view().refreshBusinessStatus();assert.equal(view().businessStatus.businessDate,'2026-09-17')
  let resolveOld;globalThis.__t0Api.get=()=>new Promise(resolve=>{resolveOld=resolve})
  const old=view().refreshBusinessStatus();assert.equal(view().businessStatus,null)
  globalThis.__t0Api.get=async()=>{throw Error('offline')}
  await view().refreshBusinessStatus();assert.equal(view().businessStatus,null);assert.equal(view().isSystemLocked,null);assert.equal(view().error,'offline')
  resolveOld({data:{success:true,data:{businessDate:'2026-09-16',businessDateOpen:true,systemLocked:false}}});await old
  assert.equal(view().businessStatus,null);assert.equal(view().error,'offline')
 }finally{delete globalThis.__t0Hooks;delete globalThis.__t0Api;delete globalThis.localStorage}
})
test('System Lock-only presentation retains real API and never loads unsupported Admin settings',async()=>{
 const h=hookHarness();globalThis.__t0Hooks=h.hooks;const calls=[]
 globalThis.localStorage={getItem:()=>null}
 globalThis.__t0Api={get:async path=>{calls.push(path);return {data:{success:true,data:{locked:true}}}}}
 try{
  const {default:Settings}=await bundle('src/pages/admin/SystemSettings.jsx',testEnvironmentDefines({}))
  const tree=JSON.stringify(h.render(Settings,{lockOnly:true}));for(const effect of [...h.effects])effect();await new Promise(resolve=>setTimeout(resolve,0))
  assert.deepEqual(calls,['/system-lock']);assert.match(tree,/System Lock/);assert.doesNotMatch(tree,/Urgent Cash Limit|Default Currency|Save Settings|Losing return review rule/)
 }finally{delete globalThis.__t0Hooks;delete globalThis.__t0Api;delete globalThis.localStorage}
})

test('T0 login audit side effect cannot call unsupported Audit POST or redirect an authenticated actor',async()=>{
 let calls=0;globalThis.localStorage={getItem:()=>null};globalThis.__t0Api={post:async()=>{calls++;throw Error('403')}}
 try {const {safeLogAuditEvent}=await bundle('src/services/auditService.js',testEnvironmentDefines({}));assert.equal(await safeLogAuditEvent({action:'LOGIN'}),null);assert.equal(calls,0)}
 finally{delete globalThis.localStorage;delete globalThis.__t0Api}
})

test('existing role rules remain authoritative before the T0 content boundary',async()=>{
 const {canAccessRoute}=await bundle('src/utils/accessControl.js',testEnvironmentDefines({}))
 for(const role of ['SUPER_ADMIN','DIRECTOR','CASHIER','RECEPTIONIST','DEALER','PIT_SUPERVISOR','SURVEILLANCE_OFFICER','HR_MANAGER','EMPLOYEE','ADMIN']) {
  assert.equal(canAccessRoute({role},'/customers'),['SUPER_ADMIN','DIRECTOR','RECEPTIONIST'].includes(role))
  assert.equal(canAccessRoute({role},'/cashier/buy-in'),['SUPER_ADMIN','DIRECTOR','CASHIER'].includes(role))
  assert.equal(canAccessRoute({role},'/pit/tables/example/mode'),['SUPER_ADMIN','PIT_SUPERVISOR','DEALER'].includes(role))
  assert.equal(isDeferredTestRoute('/hr/leave/me'),false)
 }
 assert.equal(canAccessRoute(null,'/customers'),false)
})
