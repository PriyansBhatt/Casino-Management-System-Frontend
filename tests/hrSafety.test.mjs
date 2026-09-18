import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { createHrSafety, freezeHrIntent } from '../src/utils/hrSafety.js'
import { hrResponse, hrTimestamp } from '../src/utils/hrResponses.js'
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12,'0')}`
const at='2026-09-10T12:00:00Z', local='2026-09-10T12:00:00'
const employee={id:id(1),username:'employee',fullName:'Employee A'}
const staff={staffProfileId:id(2),userId:id(1),employeeCode:'E1',username:'employee',fullName:'Employee A'}
const master={id:id(3),code:'DAY',name:'Day',description:null,active:true,createdAt:local,updatedAt:local}
const shift={...master,startTime:'09:00:00',endTime:'17:00:00',crossesMidnight:false,lateGraceMinutes:5,earlyCheckInMinutes:10}
const profile={...staff,department:null,jobTitle:null,employmentStatus:'ACTIVE',employmentType:'FULL_TIME',dateOfJoining:'2026-09-01',createdAt:local,updatedAt:local}
const attendance=(n=4,date='2026-09-10')=>({attendanceId:id(n),employee:{...employee,fullName:`Employee ${n}`},businessDate:date,status:'OPEN',checkInAt:at,checkOutAt:null,workedMinutes:null,rosterAssignmentId:null,scheduled:false,shiftCode:null,shiftName:null,rosterDate:null,scheduledStartAt:null,scheduledEndAt:null,attendanceScheduleStatus:'UNSCHEDULED',lateByMinutes:0,earlyDepartureMinutes:null,createdAt:at,updatedAt:at})
const correction=n=>({correctionId:id(n),attendanceId:id(4),correctionType:'CHECK_IN_TIME',previousCheckInAt:at,newCheckInAt:at,previousCheckOutAt:null,newCheckOutAt:null,previousWorkedMinutes:null,newWorkedMinutes:null,reason:'Correction',correctedBy:employee,correctedAt:at})
const leave=(n=5)=>({requestId:id(n),staff:{...staff,fullName:`Leave employee ${n}`},leaveType:master,startDate:'2026-09-10',endDate:'2026-09-11',calendarDays:2,reason:'Leave',status:'PENDING',reviewedBy:null,reviewedAt:null,reviewReason:null,cancelledBy:null,cancelledAt:null,cancellationReason:null,submittedAt:local,createdAt:local,updatedAt:local})
const roster=(n=6)=>({id:id(n),staff,shift,rosterDate:'2026-09-10',scheduledStart:local,scheduledEnd:'2026-09-10T20:00:00',status:'SCHEDULED',remarks:null,cancellationReason:null,cancelledBy:null,cancelledAt:null,createdAt:local,updatedAt:local})
const envelope=data=>({data:{success:true,data}})
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject}}
const tick=()=>new Promise(r=>setTimeout(r,0))
let serial=0
async function bundle(entry, pages=false){
 const result=await build({entryPoints:[entry],bundle:true,write:false,format:'esm',jsx:'automatic',plugins:[{name:'hr-boundaries',setup(b){
  b.onResolve({filter:/axiosInstance$/},()=>({path:'axios',namespace:'hr'}))
  if(pages){
   for(const [filter,path] of [[/^react$/,'react'],[/^react\/jsx-runtime$/,'jsx'],[/useAuth$/,'auth'],[/hooks\/useToast$/,'toast'],[/api\/attendanceApi$/,'attendance'],[/api\/hrApi$/,'hrApi'],[/components\/(ui|layout)\//,'component'],[/\/MyLeave$/,'leaveComponents']]) b.onResolve({filter},args=>({path:path==='component'?args.path.split('/').at(-1):path,namespace:'hr'}))
  }
  b.onLoad({filter:/.*/,namespace:'hr'},({path})=>({contents:({axios:'export default globalThis.__hrAxios',react:'export const useState=(...a)=>globalThis.__hrHooks.useState(...a);export const useRef=(...a)=>globalThis.__hrHooks.useRef(...a);export const useEffect=(...a)=>globalThis.__hrHooks.useEffect(...a);export const useMemo=(...a)=>globalThis.__hrHooks.useMemo(...a);export const useCallback=(f,d)=>globalThis.__hrHooks.useMemo(()=>f,d);',jsx:'export const jsx=(type,props,key)=>({type,props,key});export const jsxs=jsx;export const Fragment="fragment";',auth:'export default()=>({user:globalThis.__hrUser})',toast:'export default()=>({showToast:v=>globalThis.__hrToasts.push(v)})',attendance:'export default new Proxy({}, {get:(_,k)=>(...a)=>globalThis.__hrApi[k](...a)})',hrApi:'export default new Proxy({}, {get:(_,k)=>(...a)=>globalThis.__hrApi[k](...a)})',leaveComponents:'export const Field=p=>({type:"label",props:{...p,children:[p.label,p.children]}});export const Actions=p=>({type:"Actions",props:p});export const Header=p=>({type:"Header",props:p});export const LeaveTable=p=>({type:"LeaveTable",props:p});export const Overlay=p=>({type:"Overlay",props:p});export const Status=p=>({type:"Status",props:p});export const formatDateTime=v=>v;'})[path] || `export default p=>({type:${JSON.stringify(path)},props:p})`}))
 }}]})
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64')+'#'+(++serial))
}
function harness(){
 const slots=[],effects=[];let cursor=0,unmounted=false,late=0
 const same=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]))
 return { get late(){return late}, hooks:{
  useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],v=>{if(unmounted)late++;slots[i]=typeof v==='function'?v(slots[i]):v}]},
  useRef(initial){const i=cursor++;return slots[i] ||= {current:initial}},
  useMemo(fn,deps){const i=cursor++;if(!slots[i]||!same(slots[i].deps,deps))slots[i]={deps,value:fn()};return slots[i].value},
  useEffect(fn,deps){const i=cursor++;if(!slots[i]||!same(slots[i].deps,deps)){const old=slots[i];slots[i]={deps,fn};effects.push(()=>{old?.cleanup?.();slots[i].cleanup=fn()})}},
 },render(fn){cursor=0;const tree=expand(fn());while(effects.length)effects.shift()();return tree},unmount(){unmounted=true;slots.forEach(v=>v?.cleanup?.())}}
}
function expand(node){if(Array.isArray(node))return node.map(expand);if(!node||typeof node!=='object')return node;if(typeof node.type==='function')return expand(node.type(node.props));return{...node,props:{...node.props,children:expand(node.props?.children)}}}
function nodes(node){if(Array.isArray(node))return node.flatMap(nodes);return node&&typeof node==='object'?[node,...nodes(node.props?.children)]:[]}
const text=n=>Array.isArray(n)?n.map(text).join(' '):n&&typeof n==='object'?text(n.props?.children):String(n??'')
const find=(t,type,p=()=>true)=>nodes(t).find(n=>n.type===type&&p(n.props))
const button=(t,label)=>find(t,'Button',p=>text(p.children)===label)||find(t,'button',p=>text(p.children)===label)
const field=(t,label)=>{const n=find(t,'label',p=>p.label===label||text(p.children).startsWith(label));return nodes(n).find(v=>['input','textarea','select'].includes(v.type))}
const event={preventDefault(){}}
async function page(name,api={}){
 let h=harness();globalThis.__hrHooks=h.hooks;globalThis.__hrUser={id:id(99),username:'director',role:'DIRECTOR'};globalThis.__hrToasts=[]
 globalThis.__hrApi={getReport:async()=>[],getAttendanceCorrections:async()=>[],getLeaveRequests:async()=>[],getLeaveTypes:async()=>[master],getStaff:async()=>[profile],getDepartments:async()=>[],getShiftDefinitions:async()=>[shift],getRosterAssignments:async()=>[],...api}
 const {default:Page}=await bundle(`src/pages/hr/${name}.jsx`,true);let key=Page().key
 const render=()=>{const root=Page();if(root.key!==key){h.unmount();h=harness();globalThis.__hrHooks=h.hooks;key=root.key}return h.render(root.type)}
 render();await tick();return {get h(){return h},render}
}
test('HR contracts reject failed/missing envelopes and invalid list types; real empty and current null accepted',()=>{
 for(const value of [null,{},0,'',false])assert.throws(()=>hrResponse(envelope(value),'attendance',{list:true}))
 for(const value of [{},{data:{}},{data:{success:false,data:[]}},{data:{success:true}}])assert.throws(()=>hrResponse(value,'attendance',{list:true}))
 assert.deepEqual(hrResponse(envelope([]),'attendance',{list:true}),[])
 assert.equal(hrResponse(envelope(null),'attendance',{nullable:true}),null)
 assert.throws(()=>hrResponse(envelope(null),'attendance'))
})
test('HR DTO types, invalid calendar timestamps, IDs, minutes, statuses and wrong targets rejected',()=>{
 const fixtures={attendance:attendance(),correction:correction(7),leave:leave(),roster:roster(),shift,staff:profile,master,candidate:{userId:id(1),username:'a',fullName:null,role:'DIRECTOR',status:'ACTIVE'}}
 for(const [kind,value] of Object.entries(fixtures)){assert.equal(hrResponse(envelope(value),kind),value);assert.throws(()=>hrResponse(envelope({}),kind))}
 for(const patch of [{attendanceId:4},{status:'LEGACY'},{lateByMinutes:null},{workedMinutes:-1},{checkInAt:'2026-02-30T12:00:00Z'},{checkInAt:'2026-09-10T24:00:00Z'},{checkInAt:local}])assert.throws(()=>hrResponse(envelope({...attendance(),...patch}),'attendance'))
 assert.throws(()=>hrResponse(envelope([attendance()]),'attendance',{list:true,date:'2026-09-11'}))
 assert.throws(()=>hrResponse(envelope(correction(7)),'correction',{target:id(8)}))
 assert.throws(()=>hrResponse(envelope(leave()),'leave',{target:id(8)}))
 for(const t of ['2026-02-30T12:00:00','2026-09-10T12:60:00','2026-09-10T12:00:00+99:00'])assert.equal(hrTimestamp(t),false)
 assert.equal(hrTimestamp('2026-09-10T12:00:00.123456789Z',true),true)
})
test('active HR API helpers validate reads and writes and preserve rejected HTTP errors',async()=>{
 globalThis.__hrAxios={get:async()=>envelope([]),post:async()=>envelope({}),patch:async()=>envelope({})}
 const {default:api}=await bundle('src/api/hrApi.js');const {default:att}=await bundle('src/api/attendanceApi.js')
 for(const [name,args] of [['getDepartments',[]],['getJobTitles',[]],['getStaff',[]],['getStaffCandidates',[]],['getShiftDefinitions',[]],['getRosterAssignments',[]],['getLeaveTypes',[]],['getAvailableLeaveTypes',[]],['getMyLeaveRequests',[]],['getLeaveRequests',[]]])assert.deepEqual(await api[name](...args),[])
 globalThis.__hrAxios.get=async()=>envelope(null);await assert.rejects(api.getRosterAssignments());assert.equal(await att.getCurrent(),null)
 await assert.rejects(api.approveLeaveRequest(id(5),{}));await assert.rejects(att.createAttendanceCorrection(id(4),{}))
 for(const status of [400,401,403,404,409]){const error=Object.assign(Error('backend explanation'),{response:{status}});globalThis.__hrAxios.get=async()=>{throw error};await assert.rejects(api.getLeaveRequest(id(5)),e=>e===error)}
})
test('generation and unmount invalidate both late successes and late failures',()=>{
 const gate=createHrSafety();const a=gate.begin('list');const b=gate.begin('list');assert.equal(a(),false);assert.equal(b(),true);gate.dispose();assert.equal(b(),false);gate.mount();assert.equal(b(),false)
})
test('frozen intent is isolated, duplicate click blocked, success and refresh failure separated, retry after definite error',async()=>{
 const gate=createHrSafety(), wait=deferred(), mutable={id:id(4),operation:'correct',payload:{reason:'A'}};const intent=freezeHrIntent(mutable);mutable.id=id(5);mutable.payload.reason='B';let calls=0,success=0,warning=0,failure=0
 const opts={busy(){},success(){success++},failure(){failure++},refresh:async()=>{throw Error()},warning(){warning++}}
 const execute=async frozen=>{calls++;assert.equal(frozen.id,id(4));assert.equal(frozen.payload.reason,'A');await wait.promise}
 const pending=gate.submit(intent,execute,opts);await gate.submit(intent,execute,opts);assert.equal(calls,1);wait.resolve();await pending;assert.equal(success,1);assert.equal(warning,1);assert.equal(failure,0);await gate.submit(intent,execute,opts);assert.equal(calls,1)
 const next=freezeHrIntent({id:id(6)});await gate.submit(next,async()=>{throw Error()},opts);assert.equal(failure,1);await gate.submit(next,async()=>{},opts);assert.equal(success,2)
})
test('actor change prevents an old confirmation transmitting or updating state',async()=>{
 let actor='A',calls=0;const gate=createHrSafety(()=>actor==='A');actor='B';await gate.submit(freezeHrIntent({id:id(4)}),async()=>calls++,{busy(){throw Error()},success(){},failure(){},refresh(){},warning(){}});assert.equal(calls,0)
})
test('Attendance Date A cannot replace Date B, including after unmount',async()=>{
 const a=deferred(),b=deferred();let calls=0;const p=await page('AttendanceManagement',{getReport:()=>++calls===1?a.promise:b.promise})
 let t=p.render();field(t,'Attendance Business Date').props.onChange({target:{value:'2026-09-11'}});t=p.render();find(t,'form').props.onSubmit(event);b.resolve([attendance(5,'2026-09-11')]);await tick();a.resolve([attendance()]);await tick();t=p.render();assert.match(text(t),/Employee 5/);assert.doesNotMatch(text(t),/Employee 4/);p.h.unmount();assert.equal(p.h.late,0)
})
test('Attendance correction history A cannot populate B',async()=>{
 const a=deferred(),b=deferred();const p=await page('AttendanceManagement',{getReport:async()=>[attendance(4),attendance(5)],getAttendanceCorrections:x=>x===id(4)?a.promise:b.promise})
 let t=p.render();nodes(t).filter(n=>n.type==='Button'&&text(n.props.children)==='Review')[0].props.onClick();t=p.render();nodes(t).filter(n=>n.type==='Button'&&text(n.props.children)==='Review')[1].props.onClick();b.resolve([{...correction(8),attendanceId:id(5),reason:'B history'}]);await tick();a.resolve([{...correction(7),reason:'A history'}]);await tick();t=p.render();assert.match(text(t),/B history/);assert.doesNotMatch(text(t),/A history/);p.h.unmount()
})
test('Attendance confirmation submits frozen A after selecting B, only once, retaining success after refresh failure',async()=>{
 const pending=deferred(),calls=[];let reads=0;const p=await page('AttendanceManagement',{getReport:async()=>{if(++reads>1)throw Error('refresh failed');return[attendance(4),attendance(5)]},createAttendanceCorrection:async(...args)=>{calls.push(args);return pending.promise}})
 let t=p.render();nodes(t).filter(n=>n.type==='Button'&&text(n.props.children)==='Review')[0].props.onClick();await tick();t=p.render();button(t,'Correct Attendance').props.onClick();t=p.render();field(t,'Reason').props.onChange({target:{value:'Correct clock'}});t=p.render();nodes(t).filter(n=>n.type==='form').at(-1).props.onSubmit(event);t=p.render();assert.match(find(t,'ConfirmDialog').props.description,/Employee 4/)
 nodes(t).filter(n=>n.type==='Button'&&text(n.props.children)==='Review')[1].props.onClick();t=p.render();const confirm=find(t,'ConfirmDialog').props.onConfirm;confirm();confirm();assert.equal(calls.length,1);assert.equal(calls[0][0],id(4));pending.resolve(correction(7));await tick();t=p.render();assert.match(text(t),/Attendance updated, but refreshed data could not be loaded/);assert.equal(globalThis.__hrToasts.filter(t=>t.type==='success').length,1);assert.equal(globalThis.__hrToasts.filter(t=>t.type==='error').length,0);p.h.unmount()
})
test('Leave detail A cannot replace B and filter invalidation discards older list',async()=>{
 const a=deferred(),b=deferred();const p=await page('LeaveManagement',{getLeaveRequests:async()=>[leave(5),leave(6)],getLeaveRequest:x=>x===id(5)?a.promise:b.promise})
 let t=p.render();find(t,'LeaveTable').props.onSelect(leave(5));find(t,'LeaveTable').props.onSelect(leave(6));b.resolve(leave(6));await tick();a.resolve(leave(5));await tick();t=p.render();assert.match(text(t),/Leave employee 6/);assert.doesNotMatch(text(t),/Leave employee 5/);p.h.unmount()
 const old=deferred();let count=0;const q=await page('LeaveManagement',{getLeaveRequests:()=>++count===1?old.promise:Promise.resolve([leave(6)])});t=q.render();field(t,'Status').props.onChange({target:{value:'APPROVED'}});t=q.render();find(t,'form').props.onSubmit(event);await tick();old.resolve([leave(5)]);await tick();t=q.render();assert.equal(find(t,'LeaveTable').props.rows[0].requestId,id(6));q.h.unmount()
})
test('Leave approval freezes A, blocks duplicate submit and keeps success when refresh fails',async()=>{
 const calls=[],pending=deferred();let reads=0;const p=await page('LeaveManagement',{getLeaveRequests:async()=>{if(++reads>1)throw Error();return[leave(5),leave(6)]},getLeaveRequest:async x=>leave(x===id(5)?5:6),approveLeaveRequest:async(...a)=>{calls.push(a);return pending.promise}})
 let t=p.render();find(t,'LeaveTable').props.onSelect(leave(5));await tick();t=p.render();button(t,'Approve').props.onClick();t=p.render();nodes(t).filter(n=>n.type==='form').at(-1).props.onSubmit(event);t=p.render();find(t,'LeaveTable').props.onSelect(leave(6));await tick();t=p.render();const confirm=find(t,'ConfirmDialog').props.onConfirm;confirm();confirm();assert.equal(calls.length,1);assert.equal(calls[0][0],id(5));pending.resolve(leave());await tick();t=p.render();assert.match(text(t),/Leave updated, but refreshed data could not be loaded/);assert.equal(globalThis.__hrToasts.filter(v=>v.type==='success').length,1);p.h.unmount()
})
test('Roster date A cannot replace B; old reference response cannot replace refreshed context',async()=>{
 const a=deferred(),ref=deferred();let count=0,refs=0;const p=await page('ShiftRosterManagement',{getRosterAssignments:()=>++count===1?a.promise:Promise.resolve([roster(7)]),getShiftDefinitions:()=>++refs===1?ref.promise:Promise.resolve([{...shift,name:'New shift'}])})
 let t=p.render();button(t,'Shift Definitions').props.onClick();await tick();ref.resolve([{...shift,name:'Old shift'}]);a.resolve([roster(6)]);await tick();t=p.render();assert.match(text(t),/New shift/);assert.doesNotMatch(text(t),/Old shift/);button(t,'Roster').props.onClick();await tick();t=p.render();field(t,'From Date').props.onChange({target:{value:'2026-09-12'}});t=p.render();assert.match(find(t,'ErrorState').props.description,/Apply filters/);find(t,'form').props.onSubmit(event);await tick();t=p.render();assert.equal(nodes(t).filter(n=>n.type==='Button'&&text(n.props.children)==='View').length,1);p.h.unmount()
})
test('Roster cancellation freezes assignment, guards duplicate click, success survives failed refresh',async()=>{
 const calls=[],pending=deferred();let reads=0;const p=await page('ShiftRosterManagement',{getRosterAssignments:async()=>{if(++reads>1)throw Error();return[roster(6),roster(7)]},cancelRosterAssignment:async(...a)=>{calls.push(a);return pending.promise}})
 let t=p.render();button(t,'View').props.onClick();t=p.render();button(t,'Cancel Assignment').props.onClick();t=p.render();field(t,'Cancellation Reason').props.onChange({target:{value:'Schedule changed'}});t=p.render();nodes(t).filter(n=>n.type==='form').at(-1).props.onSubmit(event);t=p.render();assert.match(find(t,'ConfirmDialog').props.description,/2026-09-10/);const confirm=find(t,'ConfirmDialog').props.onConfirm;confirm();confirm();assert.equal(calls.length,1);assert.equal(calls[0][0],id(6));pending.resolve(roster());await tick();t=p.render();assert.match(text(t),/Schedule updated, but refreshed data could not be loaded/);p.h.unmount()
})
test('Unmount suppresses pending page callbacks',async()=>{
 const wait=deferred();const p=await page('AttendanceManagement',{getReport:()=>wait.promise});p.h.unmount();wait.resolve([attendance()]);await tick();assert.equal(p.h.late,0)
})
test('Roster creation freezes staff, date, shift and payload before confirmation',async()=>{
 const calls=[];const p=await page('ShiftRosterManagement',{createRosterAssignment:async payload=>{calls.push(payload);return roster()}})
 let t=p.render();button(t,'Create Assignment').props.onClick();t=p.render()
 for(const [label,value] of [['Staff Member',id(2)],['Roster Date','2026-09-10']]){field(t,label).props.onChange({target:{value}});t=p.render()}
 const editorShift=()=>nodes(t).filter(n=>n.type==='label'&&text(n).startsWith('Shift')).at(-1)
 nodes(editorShift()).find(n=>n.type==='select').props.onChange({target:{value:id(3)}});t=p.render()
 nodes(t).filter(n=>n.type==='form').at(-1).props.onSubmit(event);t=p.render()
 field(t,'Roster Date').props.onChange({target:{value:'2026-09-12'}});t=p.render()
 field(t,'Staff Member').props.onChange({target:{value:id(8)}});t=p.render()
 nodes(editorShift()).find(n=>n.type==='select').props.onChange({target:{value:id(9)}});t=p.render()
 const confirm=find(t,'ConfirmDialog').props.onConfirm;await confirm();assert.deepEqual(calls,[{staffProfileId:id(2),shiftDefinitionId:id(3),rosterDate:'2026-09-10',remarks:null}]);p.h.unmount()
})
test('Roster date change discards a pending old-date response',async()=>{
 const a=deferred();let count=0;const p=await page('ShiftRosterManagement',{getRosterAssignments:()=>++count===1?a.promise:Promise.resolve([{...roster(7),rosterDate:'2026-09-12'}])})
 let t=p.render();field(t,'From Date').props.onChange({target:{value:'2026-09-12'}});t=p.render();find(t,'form').props.onSubmit(event);await tick();a.resolve([{...roster(6),rosterDate:'2026-09-10'}]);await tick();t=p.render();assert.match(text(t),/2026-09-12/);assert.doesNotMatch(text(t),/2026-09-10/);p.h.unmount()
})
test('Malformed successful Attendance list is unavailable, never a valid empty result',async()=>{
 const p=await page('AttendanceManagement',{getReport:async()=>hrResponse(envelope(null),'attendance',{list:true})});const t=p.render();assert.match(find(t,'ErrorState').props.description,/invalid authoritative response/);assert.equal(find(t,'EmptyState'),undefined);p.h.unmount()
})
test('Roster nullable missing shift reference is accepted but malformed timestamps are rejected',()=>{
 const value={...roster(),shift:null,scheduledStart:null,scheduledEnd:null};assert.equal(hrResponse(envelope(value),'roster'),value)
 assert.throws(()=>hrResponse(envelope({...roster(),scheduledEnd:'bad'}),'roster'))
 assert.throws(()=>hrResponse(envelope({...leave(),calendarDays:'2'}),'leave'))
})
test('Auth identity change blocks an existing page confirmation callback',async()=>{
 const calls=[];const p=await page('ShiftRosterManagement',{getRosterAssignments:async()=>[roster()],cancelRosterAssignment:async(...args)=>calls.push(args)})
 let t=p.render();button(t,'View').props.onClick();t=p.render();button(t,'Cancel Assignment').props.onClick();t=p.render();field(t,'Cancellation Reason').props.onChange({target:{value:'Cancel'}});t=p.render();nodes(t).filter(n=>n.type==='form').at(-1).props.onSubmit(event);t=p.render();const confirm=find(t,'ConfirmDialog').props.onConfirm
 globalThis.__hrUser={id:id(98),username:'newdirector',role:'DIRECTOR'};p.render();await confirm();assert.equal(calls.length,0);p.h.unmount()
})
test('Leave rejection freezes request and reason even if editor changes',async()=>{
 const calls=[];const p=await page('LeaveManagement',{getLeaveRequests:async()=>[leave()],getLeaveRequest:async()=>leave(),rejectLeaveRequest:async(...a)=>{calls.push(a);return leave()}})
 let t=p.render();find(t,'LeaveTable').props.onSelect(leave());await tick();t=p.render();button(t,'Reject').props.onClick();t=p.render();field(t,'Reason').props.onChange({target:{value:'Original reason'}});t=p.render();nodes(t).filter(n=>n.type==='form').at(-1).props.onSubmit(event);t=p.render();field(t,'Reason').props.onChange({target:{value:'Changed reason'}});t=p.render();await find(t,'ConfirmDialog').props.onConfirm();assert.deepEqual(calls,[[id(5),{reason:'Original reason'}]]);p.h.unmount()
})
test('Manual report refresh supersedes automatic load and suppresses its late failure',async()=>{
 const old=deferred();let calls=0;const p=await page('AttendanceManagement',{getReport:()=>++calls===1?old.promise:Promise.resolve([attendance(5)])});let t=p.render();find(t,'form').props.onSubmit(event);await tick();old.reject(Error('old failure'));await tick();t=p.render();assert.match(text(t),/Employee 5/);assert.equal(find(t,'ErrorState'),undefined);p.h.unmount()
})
test('Backend nullable leave references and legacy candidate authority are preserved',()=>{
 const value={...leave(),staff:null,leaveType:null};assert.equal(hrResponse(envelope(value),'leave'),value)
 const candidate={userId:id(1),username:'legacy',fullName:null,role:null,status:null};assert.equal(hrResponse(envelope(candidate),'candidate'),candidate)
 for(const patch of [{staff:{}},{leaveType:{}},{reviewReason:{}},{cancellationReason:[]}])assert.throws(()=>hrResponse(envelope({...leave(),...patch}),'leave'))
 assert.throws(()=>hrResponse(envelope({...roster(),remarks:{}}),'roster'))
})
test('Instant comparison retains Java nanoseconds, zero worked minutes and timezone offsets',()=>{
 const row={...attendance(),status:'CLOSED',workedMinutes:0,checkInAt:'2026-09-10T12:00:00.123456Z',checkOutAt:'2026-09-10T17:45:00.123457+05:45'}
 assert.equal(hrResponse(envelope(row),'attendance'),row)
 assert.throws(()=>hrResponse(envelope({...row,checkOutAt:'2026-09-10T12:00:00.123455Z'}),'attendance'))
 assert.throws(()=>hrResponse(envelope({...row,checkOutAt:row.checkInAt}),'attendance'))
 for(const stamp of ['2026-09-10T12:00:00','2026-09-10T12:00:00.123456789','2026-09-10T12:00:00Z','2026-09-10T12:00:00.12+05:45'])assert.equal(hrTimestamp(stamp),true)
 for(const value of [NaN,Infinity,'0',-1,0.5])assert.throws(()=>hrResponse(envelope({...attendance(),lateByMinutes:value}),'attendance'))
})
test('Frozen HR payload copy preserves actual value types and isolates nested arrays',()=>{
 const source={text:'x',number:0,flag:false,optional:null,omitted:undefined,rows:[{id:id(1)}]};const result=freezeHrIntent(source)
 source.rows[0].id=id(2);assert.equal(result.rows[0].id,id(1));assert.equal(result.flag,false);assert.equal(result.number,0);assert.equal(result.optional,null);assert.ok(Object.hasOwn(result,'omitted'));assert.ok(Object.isFrozen(result.rows[0]));assert.throws(()=>result.rows.push({}))
})
test('Leave late detail failure cannot clear current loading state or replace current selection',async()=>{
 const a=deferred(),b=deferred();const p=await page('LeaveManagement',{getLeaveRequests:async()=>[leave(5),leave(6)],getLeaveRequest:x=>x===id(5)?a.promise:b.promise})
 let t=p.render();find(t,'LeaveTable').props.onSelect(leave(5));find(t,'LeaveTable').props.onSelect(leave(6));a.reject(Error('old failure'));await tick();t=p.render();assert.ok(find(t,'Loading',v=>v.message==='Loading leave request…'));assert.equal(globalThis.__hrToasts.length,0)
 b.resolve(leave(6));await tick();t=p.render();assert.match(text(t),/Leave employee 6/);assert.equal(find(t,'Loading'),undefined);p.h.unmount()
})
test('Leave cancellation freezes ID and reason and rejects a second target while pending',async()=>{
 const calls=[],pending=deferred();const p=await page('LeaveManagement',{getLeaveRequests:async()=>[leave(5),leave(6)],getLeaveRequest:async x=>leave(x===id(5)?5:6),cancelLeaveRequest:async(...a)=>{calls.push(a);return pending.promise}})
 let t=p.render();find(t,'LeaveTable').props.onSelect(leave(5));await tick();t=p.render();button(t,'Cancel Request').props.onClick();t=p.render();field(t,'Reason').props.onChange({target:{value:'Original cancellation'}});t=p.render();nodes(t).filter(n=>n.type==='form').at(-1).props.onSubmit(event);t=p.render();const confirm=find(t,'ConfirmDialog').props.onConfirm
 find(t,'LeaveTable').props.onSelect(leave(6));await tick();t=p.render();assert.match(find(t,'ConfirmDialog').props.description,/Leave employee 5/);confirm();confirm();assert.deepEqual(calls,[[id(5),{reason:'Original cancellation'}]]);pending.resolve(leave());await tick();p.h.unmount()
})
test('Leave reload invalidates open maintenance forms before reference failure',async()=>{
 let reads=0;const p=await page('LeaveManagement',{getLeaveTypes:async()=>{if(++reads>2)throw Error('references failed');return[master]}})
 let t=p.render();button(t,'Leave Types').props.onClick();await tick();t=p.render();button(t,'Edit').props.onClick();t=p.render();assert.ok(field(t,'Name'))
 find(t,'PageHeader').props.actions.props.onClick();await tick();t=p.render();assert.equal(field(t,'Name'),undefined);assert.ok(find(t,'ErrorState'));assert.equal(find(t,'ConfirmDialog').props.isOpen,false);p.h.unmount()
})
test('Leave type update freezes target and payload and blocks synchronous duplicate click',async()=>{
 const calls=[],wait=deferred();const p=await page('LeaveManagement',{updateLeaveType:async(...a)=>{calls.push(a);return wait.promise}})
 let t=p.render();button(t,'Leave Types').props.onClick();await tick();t=p.render();button(t,'Edit').props.onClick();t=p.render();field(t,'Name').props.onChange({target:{value:'New name'}});t=p.render();nodes(t).filter(n=>n.type==='form').at(-1).props.onSubmit(event);t=p.render();field(t,'Name').props.onChange({target:{value:'Later name'}});t=p.render();const confirm=find(t,'ConfirmDialog').props.onConfirm;confirm();confirm();assert.equal(calls.length,1);assert.equal(calls[0][0],master.id);assert.equal(calls[0][1].name,'New name');wait.resolve(master);await tick();p.h.unmount()
})
test('Shift update freezes target, times and flags; successful mutation survives reference refresh failure',async()=>{
 let reads=0;const calls=[],wait=deferred();const p=await page('ShiftRosterManagement',{getShiftDefinitions:async()=>{if(++reads>2)throw Error('references failed');return[shift]},updateShiftDefinition:async(...a)=>{calls.push(a);return wait.promise}})
 let t=p.render();button(t,'Shift Definitions').props.onClick();await tick();t=p.render();button(t,'Edit').props.onClick();t=p.render();field(t,'Name').props.onChange({target:{value:'Reviewed shift'}});t=p.render();find(t,'form').props.onSubmit(event);t=p.render();field(t,'Name').props.onChange({target:{value:'Other shift'}});t=p.render();const confirm=find(t,'ConfirmDialog').props.onConfirm;confirm();confirm();assert.equal(calls.length,1);assert.equal(calls[0][0],shift.id);assert.equal(calls[0][1].name,'Reviewed shift');assert.equal(calls[0][1].startTime,'09:00');assert.equal(calls[0][1].crossesMidnight,false);wait.resolve(shift);await tick();t=p.render();assert.match(text(t),/Schedule updated, but refreshed data could not be loaded/);assert.equal(globalThis.__hrToasts.filter(v=>v.type==='success').length,1);p.h.unmount()
})
test('Obsolete partial roster refresh cannot attach a warning to a newer successful tab load',async()=>{
 let reads=0,refs=0;const slow=deferred();const p=await page('ShiftRosterManagement',{getRosterAssignments:async()=>{if(++reads===2)throw Error('old refresh failed');return[roster()]},getShiftDefinitions:()=>++refs===2?slow.promise:Promise.resolve([shift]),cancelRosterAssignment:async()=>roster()})
 let t=p.render();button(t,'View').props.onClick();t=p.render();button(t,'Cancel Assignment').props.onClick();t=p.render();field(t,'Cancellation Reason').props.onChange({target:{value:'Cancel'}});t=p.render();nodes(t).filter(n=>n.type==='form').at(-1).props.onSubmit(event);t=p.render();find(t,'ConfirmDialog').props.onConfirm();await tick();t=p.render();button(t,'Shift Definitions').props.onClick();await tick();slow.resolve([shift]);await tick();t=p.render();assert.doesNotMatch(text(t),/refreshed data could not be loaded/);assert.match(text(t),/Day/);p.h.unmount()
})
test('Malformed leave and roster lists render unavailable rather than empty',async()=>{
 for(const [name,method,kind] of [['LeaveManagement','getLeaveRequests','leave'],['ShiftRosterManagement','getRosterAssignments','roster']]){
  const p=await page(name,{[method]:async()=>hrResponse(envelope([{}]),kind,{list:true})});const t=p.render();assert.ok(find(t,'ErrorState'));assert.equal(find(t,'EmptyState'),undefined);p.h.unmount()
 }
})
test('Keyed authentication boundary drops old reads across logout and another login',async()=>{
 const old=deferred();let reads=0;const p=await page('AttendanceManagement',{getReport:()=>++reads===1?old.promise:Promise.resolve([attendance(5)])});const oldHarness=p.h
 globalThis.__hrUser=null;p.render();globalThis.__hrUser={id:id(98),username:'other',role:'SUPER_ADMIN'};p.render();await tick();old.resolve([attendance(4)]);await tick();const t=p.render();assert.match(text(t),/Employee 5/);assert.doesNotMatch(text(t),/Employee 4/);assert.equal(oldHarness.late,0);p.h.unmount()
})
test('A pending mutation blocks a distinct target and finishes without post-unmount callbacks',async()=>{
 const gate=createHrSafety(),wait=deferred();let calls=0,updates=0;const options={busy(){updates++},success(){updates++},failure(){updates++},refresh(){updates++},warning(){updates++}}
 const first=gate.submit(freezeHrIntent({id:id(1)}),async()=>{calls++;await wait.promise},options)
 await gate.submit(freezeHrIntent({id:id(2)}),async()=>calls++,options);assert.equal(calls,1);gate.dispose();wait.resolve();await first;assert.equal(updates,1);assert.equal(gate.pending,false)
})
test('Roster update freezes assignment and date after selection changes',async()=>{
 const calls=[];const p=await page('ShiftRosterManagement',{getRosterAssignments:async()=>[roster(6),roster(7)],updateRosterAssignment:async(...a)=>{calls.push(a);return roster()}})
 let t=p.render();button(t,'View').props.onClick();t=p.render();button(t,'Edit Assignment').props.onClick();t=p.render();field(t,'Roster Date').props.onChange({target:{value:'2026-09-12'}});t=p.render();nodes(t).filter(n=>n.type==='form').at(-1).props.onSubmit(event);t=p.render();nodes(t).filter(n=>n.type==='Button'&&text(n.props.children)==='View')[1].props.onClick();t=p.render();field(t,'Roster Date').props.onChange({target:{value:'2026-09-13'}});t=p.render();await find(t,'ConfirmDialog').props.onConfirm();assert.deepEqual(calls,[[id(6),{shiftDefinitionId:id(3),rosterDate:'2026-09-12',remarks:null}]]);p.h.unmount()
})
test('Backend mutation DTOs validate successfully; absent mutation bodies are not valid contracts',async()=>{
 let value;globalThis.__hrAxios={post:async()=>envelope(value),patch:async()=>envelope(value)};const {default:api}=await bundle('src/api/hrApi.js');const {default:att}=await bundle('src/api/attendanceApi.js')
 for(const [name,row] of [['approveLeaveRequest',leave()],['rejectLeaveRequest',leave()],['cancelLeaveRequest',leave()],['updateLeaveType',master],['updateShiftDefinition',shift],['updateRosterAssignment',roster()],['cancelRosterAssignment',roster()]]){value=row;assert.equal(await api[name](row.requestId||row.id,{}),row)}
 value=correction(7);assert.equal(await att.createAttendanceCorrection(id(4),{}),value)
 value=null;await assert.rejects(api.createShiftDefinition({}));globalThis.__hrAxios.post=async()=>({status:204,data:''});await assert.rejects(api.createRosterAssignment({}))
})
