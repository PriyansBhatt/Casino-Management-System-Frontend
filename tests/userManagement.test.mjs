import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { USER_ROLES, createUserManager, filteredUsers, isSelf, validatePassword } from '../src/utils/userManagement.js'
import { isDeferredTestRoute } from '../src/utils/testEnvironment.js'
const row = (patch = {}) => ({ id: 'u1', username: 'Alice', fullName: 'Alice Example', email: null, role: 'CASHIER', status: 'ACTIVE', staff: { id: 's1', employeeCode: 'EMP-1' }, ...patch })
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b }); return { promise, resolve, reject } }
let id=0
async function bundle(entry, ui=false) {
 const out=await build({entryPoints:[entry],bundle:true,write:false,format:'esm',jsx:'automatic',define:{'import.meta.env.VITE_USE_MOCK_ADMIN':'"true"'},plugins:[{name:'test-boundaries',setup(b){
  b.onResolve({filter:/axiosInstance$/},()=>({path:'api',namespace:'stub'}))
  if(ui){
   b.onResolve({filter:/^react$/},()=>({path:'react',namespace:'stub'}))
   b.onResolve({filter:/^react\/jsx-runtime$/},()=>({path:'jsx',namespace:'stub'}))
   b.onResolve({filter:/hooks\/useAuth$/},()=>({path:'auth',namespace:'stub'}))
   b.onResolve({filter:/api\/adminApi$/},()=>({path:'admin',namespace:'stub'}))
  }
  b.onLoad({filter:/.*/,namespace:'stub'},({path})=>({contents:({api:'export default globalThis.__a1Api',admin:'export default globalThis.__a1Admin',auth:'export default () => ({user:globalThis.__a1Actor})',react:'export const useState=(...a)=>globalThis.__a1Hooks.useState(...a);export const useRef=(...a)=>globalThis.__a1Hooks.useRef(...a);export const useEffect=(...a)=>globalThis.__a1Hooks.useEffect(...a);',jsx:'export const jsx=(type,props)=>({type,props});export const jsxs=jsx;export const Fragment="fragment";'})[path]}))
 }}]})
 return import('data:text/javascript;base64,'+Buffer.from(out.outputFiles[0].text).toString('base64')+'#'+(++id))
}
test('User Management remains authoritative under T0 and only SUPER_ADMIN allowed',async()=>{
 assert.equal(isDeferredTestRoute('/admin/users'),false)
 for(const path of ['/admin/roles','/admin/departments','/admin/permissions','/admin/system-settings','/settings','/accounts/reports','/store/unknown','/analytics','/notifications','/demo'])assert.equal(isDeferredTestRoute(path),true)
 for(const path of ['/admin/system-lock','/admin/business-date'])assert.equal(isDeferredTestRoute(path),false)
 const {canAccessRoute}=await bundle('src/utils/accessControl.js')
 for(const role of ['SUPER_ADMIN','DIRECTOR','RECEPTIONIST','CASHIER','PIT_SUPERVISOR','DEALER','ADMIN','MANAGER','AUDITOR'])assert.equal(canAccessRoute({role},'/admin/users'),role==='SUPER_ADMIN')
})
test('approved operational and Accounts roles and BCrypt-safe confirmation validation',()=>{
 assert.deepEqual(USER_ROLES,['SUPER_ADMIN','DIRECTOR','RECEPTIONIST','CASHIER','PIT_SUPERVISOR','DEALER','STORE_MANAGER','ACCOUNTANT_HEAD','ACCOUNTS_MANAGER'])
 assert.equal(validatePassword('valid password','valid password'),'valid password')
 for(const [a,b] of [['short','short'],['valid password','different'],['é'.repeat(37),'é'.repeat(37)],['      ','      ']])assert.throws(()=>validatePassword(a,b))
 assert.equal(isSelf({username:'Alice'},row()),true)
})
test('directory filters and ordering preserve real staff linkage',()=>{
 const rows=[row({id:'2',username:'Zed'}),row()]
 assert.equal(filteredUsers(rows,{search:'EMP-1',role:'CASHIER',status:'ACTIVE'})[0].username,'Alice')
 assert.equal(filteredUsers(rows,{search:'missing'}).length,0)
})
test('all user API methods are real even if legacy mock flag is enabled',async()=>{
 const calls=[];globalThis.localStorage={getItem:()=>null};globalThis.__a1Api={get:async(...a)=>{calls.push(['GET',...a]);return {data:[row()]}},post:async(...a)=>{calls.push(['POST',...a]);return {data:{success:true,data:row()}}},patch:async(...a)=>{calls.push(['PATCH',...a]);return {data:{success:true,data:row()}}}}
 try{const {default:api}=await bundle('src/api/adminApi.js');await api.getUsers();await api.createUser({});await api.changeUserRole('u1',{});await api.toggleUserStatus('u1',{});await api.resetUserPassword('u1',{});assert.deepEqual(calls.map(c=>c.slice(0,2)),[['GET','/users'],['POST','/users'],['PATCH','/users/u1/role'],['PATCH','/users/u1/status'],['POST','/users/u1/password']]);globalThis.__a1Api.get=async()=>{throw Error('offline')};await assert.rejects(api.getUsers(),/offline/)}finally{delete globalThis.localStorage}
})
test('loading failures are unavailable; empty success is an actual empty list',async()=>{
 const api={getUsers:async()=>{throw Error('offline')}};const model=createUserManager(api,()=>{});await model.load();assert.equal(model.state.rows,null);assert.equal(model.state.error,'offline');api.getUsers=async()=>[];await model.load();assert.deepEqual(model.state.rows,[])
})
test('late directory responses cannot restore stale data; unmounted responses ignored',async()=>{
 const first=deferred();let calls=0;const model=createUserManager({getUsers:()=>++calls===1?first.promise:Promise.resolve([])},()=>{});const pending=model.load();await model.load();first.resolve([row()]);await pending;assert.deepEqual(model.state.rows,[])
 const next=deferred();let notifications=0;const dead=createUserManager({getUsers:()=>next.promise},()=>notifications++);const load=dead.load();dead.dispose();next.resolve([row()]);await load;assert.equal(notifications,1)
})
test('synchronous submission guard, frozen target and confirmed success survives refresh failure',async()=>{
 const post=deferred(),calls=[];const api={changeUserRole:(...args)=>{calls.push(args);return post.promise},getUsers:async()=>{throw Error('refresh offline')}};const model=createUserManager(api,()=>{});const target=row({id:'original'});const payload={role:'DEALER',expectedRole:'CASHIER'};let closed=0
 const pending=model.submit('role',target,payload,'Role changed',()=>closed++);target.id='different';payload.role='DIRECTOR';assert.equal(await model.submit('role',target,payload,'duplicate'),false);post.resolve(row());assert.equal(await pending,true);assert.equal(calls.length,1);assert.equal(calls[0][0],'original');assert.equal(calls[0][1].role,'DEALER');assert.equal(model.state.message,'Role changed');assert.equal(model.state.error,'refresh offline');assert.equal(model.state.rows,null);assert.equal(closed,1)
})
test('create, activate/deactivate and password reset dispatch once; conflicts remain explicit',async()=>{
 const calls=[];const api={getUsers:async()=>[],createUser:async p=>calls.push(['create',p]),toggleUserStatus:async(id,p)=>calls.push(['status',id,p]),resetUserPassword:async(id,p)=>calls.push(['password',id,p])};const model=createUserManager(api,()=>{})
 for(const action of ['create','status','password'])assert.equal(await model.submit(action,row(),{},'done'),true)
 assert.deepEqual(calls.map(c=>c[0]),['create','status','password']);api.createUser=async()=>{throw {response:{data:{message:'Username or email conflicts'}}}};assert.equal(await model.submit('create',null,{},'wrong'),false);assert.match(model.state.error,/conflicts/);assert.equal(model.state.message,'')
})
function harness(){const slots=[];let cursor=0;const effects=[];return {hooks:{useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v}]},useRef(initial){const i=cursor++;return slots[i] ||= {current:initial}},useEffect(f){effects.push(f)}},render(fn){cursor=0;return fn()},effects}}
function nodes(tree){if(!tree||typeof tree!=='object')return [];return [tree,...Object.values(tree.props||{}).flatMap(value=>Array.isArray(value)?value.flatMap(nodes):nodes(value))]}
const text=node=>JSON.stringify(node?.props?.children)
const tick=()=>new Promise(resolve=>setTimeout(resolve,0))
test('rendered page protects self actions, has no delete/login fiction and clears reset passwords on failure',async()=>{
 const h=harness();globalThis.__a1Hooks=h.hooks;globalThis.__a1Actor={username:'Alice',role:'SUPER_ADMIN'};globalThis.__a1Admin={getUsers:async()=>[row()],resetUserPassword:async()=>{throw Error('offline')}}
 const {default:Page}=await bundle('src/pages/admin/Users.jsx',true);let tree=h.render(Page);assert.match(JSON.stringify(tree),/Unavailable/);h.effects[0]();await tick();tree=h.render(Page)
 assert.match(JSON.stringify(tree),/EMP-1/);assert.doesNotMatch(JSON.stringify(tree),/Delete User|Last Login|Change Role|Deactivate/)
 nodes(tree).find(n=>n.type==='button'&&text(n)==='"Reset Password"').props.onClick();tree=h.render(Page)
 let fields=nodes(tree).filter(n=>n.type==='input'&&n.props.type==='password');fields.forEach(n=>n.props.onChange({target:{value:'replacement'}}));tree=h.render(Page)
 await nodes(tree).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});tree=h.render(Page);assert.match(JSON.stringify(tree),/Acknowledge/)
 nodes(tree).find(n=>n.type==='input'&&n.props.type==='checkbox').props.onChange({target:{checked:true}});tree=h.render(Page);fields=nodes(tree).filter(n=>n.type==='input'&&n.props.type==='password');fields.forEach(n=>n.props.onChange({target:{value:'replacement'}}));tree=h.render(Page)
 await nodes(tree).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});tree=h.render(Page);assert.ok(nodes(tree).filter(n=>n.type==='input'&&n.props.type==='password').every(n=>n.props.value===''));assert.match(JSON.stringify(tree),/offline/)
 globalThis.__a1Actor={username:'director',role:'DIRECTOR'};assert.match(JSON.stringify(h.render(Page)),/Only SUPER_ADMIN/)
})

test('legacy null and unknown authority preserves directory and blocks authority mutations',async()=>{
 const rows=[row(),row({id:'null-role',username:'Legacy role',role:null}),row({id:'null-status',username:'Legacy status',status:null}),row({id:'unknown',username:'Unknown account',role:'FUTURE_ROLE',status:'LEGACY'})]
 let writes=0;const model=createUserManager({getUsers:async()=>rows,changeUserRole:async()=>writes++,toggleUserStatus:async()=>writes++},()=>{})
 await model.load();assert.equal(model.state.rows.length,4);assert.equal(model.state.error,'')
 assert.equal(filteredUsers(rows,{status:'ACTIVE'}).length,2)
 for(const target of rows.slice(1))for(const action of ['role','status'])assert.equal(await model.submit(action,target,{},'wrong'),false)
 assert.equal(writes,0);assert.equal(await model.submit('role',rows[0],{role:'DEALER',expectedRole:'CASHIER'},'changed'),true);assert.equal(writes,1)
 const h=harness();globalThis.__a1Hooks=h.hooks;globalThis.__a1Actor={username:'root',role:'SUPER_ADMIN'};globalThis.__a1Admin={getUsers:async()=>rows}
 const {default:Page}=await bundle('src/pages/admin/Users.jsx',true);h.render(Page);h.effects[0]();await tick();const tree=h.render(Page)
 const entries=nodes(tree).filter(n=>n.type==='tr'&&n.props.className==='border-t');assert.equal(entries.length,4)
 const normal=entries.find(n=>JSON.stringify(n).includes('Alice'));assert.equal(nodes(normal).find(n=>n.type==='button'&&text(n)==='"Change Role"').props.disabled,false)
 for(const entry of entries.filter(n=>n!==normal)){
  assert.match(JSON.stringify(entry),/Unknown/)
  const buttons=nodes(entry).filter(n=>n.type==='button'&&text(n)!=='"Reset Password"');assert.equal(buttons.length,2);assert.ok(buttons.every(n=>n.props.disabled))
  buttons.forEach(n=>n.props.onClick());assert.equal(nodes(h.render(Page)).some(n=>n.props?.role==='dialog'),false)
 }
})
