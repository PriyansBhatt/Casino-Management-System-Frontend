import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { readFile } from 'node:fs/promises'
import { dailyReport,reconciliationPage,createReportReader,reportCsv,money,TENDERS } from '../src/utils/reports.js'
import { isDeferredTestRoute } from '../src/utils/testEnvironment.js'
const tenders=()=>Object.fromEntries(TENDERS.map(t=>[t,{count:0,amount:'0.00'}]))
const daily=(patch={})=>({businessDate:'2026-09-02',status:'CLOSED',windowStart:'2026-09-02T09:00:00+05:45',windowEnd:'2026-09-03T09:00:00+05:45',sessionEntries:0,distinctGuestsEntered:0,buyIn:tenders(),cashOut:tenders(),losingReturnCount:0,losingReturnAmountPaid:'0.00',customerWins:'0.00',customerLosses:'0.00',submittedCount:0,reopenedCount:0,aggregateSubmittedVariance:null,...patch})
const row=(patch={})=>({id:'r1',businessDate:'2026-09-02',cashierId:'u1',cashierUsername:'cashier',cashierName:'Current label',lifecycleStatus:'SUBMITTED',status:'BALANCED',calculationBasis:'SUBMITTED_SNAPSHOT',openingCash:'100.00',expectedClosingCash:'110.00',actualClosingCash:'110.00',variance:'0.00',submittedAt:'2026-09-03T08:00:00',reopenedAt:null,...patch})
const page=(patch={})=>({businessDate:'2026-09-02',status:'CLOSED',items:[],page:0,size:50,hasNext:false,...patch})
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject}}
let id=0
async function bundle(entry,ui=false){
 const out=await build({entryPoints:[entry],bundle:true,write:false,format:'esm',jsx:'automatic',plugins:[{name:'boundaries',setup(b){
  b.onResolve({filter:/axiosInstance$/},()=>({path:'api',namespace:'stub'}))
  if(ui){for(const [filter,path] of [[/^react$/,'react'],[/^react\/jsx-runtime$/,'jsx'],[/hooks\/useAuth$/,'auth'],[/api\/reportApi$/,'reports']])b.onResolve({filter},()=>({path,namespace:'stub'}))}
  b.onLoad({filter:/.*/,namespace:'stub'},({path})=>({contents:({api:'export default globalThis.__rpApi',reports:'export const getManagementReport=(...a)=>globalThis.__rpRead(...a)',auth:'export default()=>({user:{id:"director",role:"DIRECTOR"}})',react:'export const useState=(...a)=>globalThis.__rpHooks.useState(...a);export const useRef=(...a)=>globalThis.__rpHooks.useRef(...a);export const useEffect=(...a)=>globalThis.__rpHooks.useEffect(...a);',jsx:'export const jsx=(type,props)=>({type,props});export const jsxs=jsx;export const Fragment="fragment";'})[path]}))
 }}]});return import('data:text/javascript;base64,'+Buffer.from(out.outputFiles[0].text).toString('base64')+'#'+(++id))
}
test('management roles and T0 containment agree',async()=>{
 const {canAccessRoute}=await bundle('src/utils/accessControl.js')
 for(const role of ['DIRECTOR','SUPER_ADMIN','ADMIN','AUDITOR','CASHIER','RECEPTIONIST','DEALER','PIT_SUPERVISOR','SURVEILLANCE_OFFICER','COMPLIANCE_OFFICER'])for(const path of ['/reports','/reports/running-funds'])assert.equal(canAccessRoute({role},path),['DIRECTOR','SUPER_ADMIN'].includes(role))
 for(const path of ['/reports','/reports/running-funds'])assert.equal(isDeferredTestRoute(path),false)
 for(const path of ['/reports/daily-business','/REPORTS/TRANSACTIONS','/%72eports/customer-transactions','/reports/losing-return-preview','/analytics/management','/accounts/reports'])assert.equal(isDeferredTestRoute(path),true)
})
test('API is GET only and rejects failed envelopes; historical selection is independent',async()=>{
 const calls=[];globalThis.__rpApi={get:async(...a)=>{calls.push(a);return{data:{success:true,data:daily()}}}}
 const api=await bundle('src/api/reportApi.js');await api.getManagementReport('daily','2026-09-02');assert.deepEqual(calls[0],['/reports/daily-operations',{params:{businessDate:'2026-09-02'}}]);await api.getManagementReport('reconciliations','2026-09-02',2);assert.deepEqual(calls[1][1].params,{businessDate:'2026-09-02',page:2,size:50})
 globalThis.__rpApi.get=async()=>({data:{success:false,data:daily()}});await assert.rejects(api.getManagementReport('daily'));await assert.rejects(api.getDailyBusinessReport())
 assert.doesNotMatch(await readFile('src/api/reportApi.js','utf8'),/localStorage|\.post\(|\.put\(|\.patch\(|\.delete\(/)
})
test('daily validates money counts tender set date and null variance',()=>{
 assert.equal(dailyReport(daily()).aggregateSubmittedVariance,null);assert.equal(money(null),'Unavailable');assert.equal(money('0.00'),'NPR 0.00')
 for(const patch of [{sessionEntries:-1},{customerWins:null},{cashOut:{}},{customerLosses:{}},{submittedCount:0,aggregateSubmittedVariance:0},{submittedCount:1,aggregateSubmittedVariance:null},{businessDate:'2026-02-30'},{windowEnd:'2026-09-03T08:59:00+05:45'}])assert.throws(()=>dailyReport(daily(patch)))
 assert.throws(()=>dailyReport(daily(),'2026-09-03'));assert.throws(()=>dailyReport(daily({buyIn:{...tenders(),INR:{count:0,amount:'0.00'}}})))
 assert.doesNotMatch(JSON.stringify(dailyReport(daily({phone:'SECRET',outstandingCustomerChipPosition:500}))),/SECRET|outstandingCustomer/)
})
test('snapshots validate and allowlist saved fields, reopened closing fields masked',()=>{
 const reopened=row({lifecycleStatus:'REOPENED',calculationBasis:'REOPENED_SAVED_RECORD',status:null,actualClosingCash:null,variance:null,reopenedAt:'2026-09-03T08:30:00',remarks:'SECRET',cashReceived:999})
 const r=reconciliationPage(page({items:[reopened]}));assert.equal(r.items[0].actualClosingCash,null);assert.doesNotMatch(JSON.stringify(r),/SECRET|cashReceived/)
 for(const patch of [{items:[row({actualClosingCash:null})]},{items:[row({cashierName:{bad:1}})]},{size:101},{page:1},{hasNext:true},{items:[row(),row()]}])assert.throws(()=>reconciliationPage(page(patch)))
})
test('failed current date still permits historical data; error does not fabricate empty',async()=>{
 const reader=createReportReader(async(v,date)=>{if(!date)throw Error();return daily()},()=>{})
 await reader.load('daily');assert.equal(reader.state.data,null);assert.match(reader.state.error,/unavailable/)
 await reader.load('daily','2026-09-02');assert.equal(reader.state.data.sessionEntries,0)
})
test('date tab page refresh clearing and disposal invalidate late responses',async()=>{
 const old=deferred();let calls=0
 const reader=createReportReader(async(view,date,p)=>++calls===1?old.promise:page({page:p}),()=>{})
 const pending=reader.load('daily','2026-09-02');await reader.load('reconciliations','2026-09-02',1);old.resolve(daily());await pending;assert.equal(reader.state.data.page,1)
 for(const action of ['clear','dispose']){const late=deferred();let updates=0;const r=createReportReader(()=>late.promise,()=>updates++);const p=r.load('daily');r[action]();const before=updates;late.resolve(daily());await p;assert.equal(updates,before);assert.equal(r.state.data,null)}
 const fail=createReportReader(async()=>{throw Error('secret')},()=>{});await fail.load('daily');assert.equal(fail.state.data,null);assert.doesNotMatch(fail.state.error,/secret/)
})
test('CSV BOM quoting Unicode controls and current-page privacy',()=>{
 const rows=['=X','+X','-X','@X'].map((s,i)=>row({id:String(i),cashierName:'\u0001 \t'+s,cashierUsername:'名, "quote"\r\nline',phone:'SECRET',remarks:'SECRET'}))
 const text=reportCsv('reconciliations',page({items:rows}));assert.equal(text.charCodeAt(0),0xfeff);for(const s of ['=X','+X','-X','@X'])assert.ok(text.includes("'\u0001 \t"+s));assert.ok(text.includes('名, ""quote""\r\nline'));assert.doesNotMatch(text,/SECRET|Cash Received|Cash Paid/);assert.match(text,/2026-09-02/)
 assert.match(reportCsv('daily',daily()),/Submitted variance/);assert.match(reportCsv('daily',daily()),/Unavailable/)
})
function harness(){const slots=[];let cursor=0;const effects=[];return{effects,hooks:{useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v]},useRef(initial){const i=cursor++;return slots[i]||=( {current:initial})},useEffect(f){effects.push(f)}},render(f){cursor=0;return f()}}}
function nodes(t){if(!t||typeof t!=='object')return[];return[t,...Object.values(t.props||{}).flatMap(v=>Array.isArray(v)?v.flatMap(nodes):nodes(v))]}
const tick=()=>new Promise(r=>setTimeout(r,0))
test('rendered two views distinguish loading empty error and clear detail on scope change',async()=>{
 const h=harness();globalThis.__rpHooks=h.hooks;globalThis.__rpRead=async v=>v==='daily'?daily():page({items:[row()]})
 const {default:Page}=await bundle('src/pages/reports/RunningFundsReport.jsx',true);const Reports=Page().type
 let tree=h.render(Reports);assert.match(JSON.stringify(tree),/Loading report/);const dispose=h.effects[0]();await tick();tree=h.render(Reports)
 assert.match(JSON.stringify(tree),/Buy-In by tender|Buy-In/);assert.doesNotMatch(JSON.stringify(tree),/Profit|Print|PDF|unresolvedCashiers/)
 nodes(tree).find(n=>n.type==='button'&&n.props.children==='Cashier Reconciliation').props.onClick();await tick();tree=h.render(Reports)
 nodes(tree).find(n=>n.type==='button'&&n.props.children==='View').props.onClick();tree=h.render(Reports);assert.ok(nodes(tree).some(n=>n.props?.role==='dialog'))
 nodes(tree).find(n=>n.type==='input').props.onChange({target:{value:''}});tree=h.render(Reports);assert.ok(!nodes(tree).some(n=>n.props?.role==='dialog'));assert.match(JSON.stringify(tree),/Select an existing/)
 globalThis.__rpRead=async()=>{throw Error()};nodes(tree).find(n=>n.type==='input').props.onChange({target:{value:'2026-09-02'}});await tick();tree=h.render(Reports);assert.match(JSON.stringify(tree),/Report unavailable/);assert.doesNotMatch(JSON.stringify(tree),/No records for/)
 globalThis.__rpRead=async()=>page();nodes(tree).find(n=>n.type==='input').props.onChange({target:{value:'2026-09-02'}});await tick();tree=h.render(Reports);assert.match(JSON.stringify(tree),/No records for this Business Date/);dispose()
})

test('decimal strings retain large monetary digits in UI and CSV; binary numbers rejected',()=>{
 const exact='12345678901234567.89'
 const value=dailyReport(daily({customerWins:exact,buyIn:{...tenders(),CASH:{count:1,amount:exact}}}))
 assert.equal(value.customerWins,exact);assert.equal(money(exact),'NPR 12,345,678,901,234,567.89')
 assert.ok(reportCsv('daily',value).includes(exact))
 for(const bad of [1.1,0,NaN,Infinity,'1e3','1.234',' 1','01','',true])assert.throws(()=>dailyReport(daily({customerWins:bad})))
})
test('reopened reports reject prior actual variance or result leaking into the contract',()=>{
 const reopened=row({lifecycleStatus:'REOPENED',calculationBasis:'REOPENED_SAVED_RECORD',actualClosingCash:null,variance:null,status:null,reopenedAt:'2026-09-03T08:30:00'})
 assert.equal(reconciliationPage(page({items:[reopened]})).items[0].variance,null)
 for(const patch of [{actualClosingCash:'110.00'},{variance:'0.00'},{status:'BALANCED'},{reopenedAt:null}])assert.throws(()=>reconciliationPage(page({items:[{...reopened,...patch}]})))
 const csv=reportCsv('reconciliations',page({items:[reopened]}));assert.match(csv,/Unavailable/);assert.doesNotMatch(csv,/BALANCED|110\.00.*110\.00/)
})
test('malformed calendar timestamps fail closed',()=>{
 for(const submittedAt of ['2026-02-30T12:00:00','2026-09-02T24:00:00','2026-09-02T12:60:00','2026-09-02T12:00garbage'])assert.throws(()=>reconciliationPage(page({items:[row({submittedAt})]})))
})
test('date A cannot overwrite date B, and late refresh failure cannot clear new success',async()=>{
 const old=deferred();let calls=0
 const next=daily({businessDate:'2026-09-03',windowStart:'2026-09-03T09:00:00+05:45',windowEnd:'2026-09-04T09:00:00+05:45'})
 const reader=createReportReader(async()=>++calls===1?old.promise:next,()=>{})
 const pending=reader.load('daily','2026-09-02');await reader.load('daily','2026-09-03');old.resolve(daily());await pending;assert.equal(reader.state.data.businessDate,'2026-09-03')
 const slow=deferred();calls=0;const refresh=createReportReader(async()=>++calls===1?slow.promise:daily(),()=>{})
 const first=refresh.load('daily','2026-09-02');await refresh.load('daily','2026-09-02');slow.reject(Error('late'));await first;assert.equal(refresh.state.error,'');assert.equal(refresh.state.data.businessDate,'2026-09-02')
})
