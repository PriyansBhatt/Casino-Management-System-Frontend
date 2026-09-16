import test from 'node:test'
import assert from 'node:assert/strict'
import { persistedOperation } from '../src/utils/persistedOperation.js'
import { durableBuyIn, durableCashOut, durableCustody, durableReconciliation } from '../src/utils/durableSubmissions.js'
import { createSubmission } from '../src/utils/crm.js'
const memory = () => { const data = new Map(); return { data, getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v), removeItem: k => data.delete(k) } }
const input = { operationType: 'Buy-In', expectedBusinessDate: '2026-09-02', target: { customerId: 'c' }, payload: { customerId: 'c', denominations: { 500: 2 }, remarks: 'original' } }
const options = storage => ({ module: 'buy-in', actor: 'A', storage, resolveActor: () => 'A', newKey: () => 'original-key' })
const uncertain = () => { throw new Error('response lost after commit') }
test('persist before POST; reload/remount preserve exact key, date and immutable payload; no implicit resend', async () => {
 const storage=memory(), first=persistedOperation(options(storage)); let committed
 await assert.rejects(first.run(input, op=>{ assert.equal(storage.data.size,1); committed=op; return uncertain() }))
 const second=persistedOperation(options(storage)); assert.deepEqual(second.operation,committed)
 assert.throws(()=>{second.operation.payload.denominations[500]=99},TypeError)
 await assert.rejects(second.run({...input,payload:{customerId:'different'}},()=>assert.fail()), /uncertain/)
 let count=0; await second.run(null,op=>{assert.deepEqual(op,committed);count++;return {id:'receipt'}},{retry:true})
 assert.equal(count,1); assert.equal(storage.data.size,0); assert.equal(second.operation,null)
})
test('write failure and corrupt storage fail closed before POST; reads remain constructible', async () => {
 const broken={getItem:()=>null,setItem:()=>{throw Error('quota')},removeItem:()=>{}}
 const store=persistedOperation(options(broken)); await assert.rejects(store.run(input,()=>assert.fail()),/storage/)
 const storage=memory(); storage.setItem('i1b:v1:buy-in:A','{bad'); const corrupt=persistedOperation(options(storage))
 assert.ok(corrupt.issue); await assert.rejects(corrupt.run(input,()=>assert.fail()),/storage/)
 corrupt.discard(); assert.equal(corrupt.issue,'')
})
test('actor change during preflight and cross-tab login blocks transmission',async()=>{
 const storage=memory();let actor='A';const store=persistedOperation({...options(storage),resolveActor:()=>actor})
 await assert.rejects(store.run(input,()=>assert.fail(),{preflight:async()=>{actor='B'}}),/Authentication changed/)
 assert.equal(storage.data.size,0);actor='A';await assert.rejects(store.run(input,uncertain));actor='B'
 await assert.rejects(store.run(null,()=>assert.fail(),{retry:true}),/Authentication changed/)
 assert.equal(store.operation.actorIdentity,'A')
})
test('synchronous guard covers persistence and POST; discard only removes local record',async()=>{
 const storage=memory(), store=persistedOperation(options(storage));let release;const pending=store.run(input,()=>new Promise(r=>release=r))
 await Promise.resolve();assert.equal(await store.run(input,()=>assert.fail()),null);release({id:'one'});await pending
 await assert.rejects(store.run(input,uncertain));store.discard();assert.equal(store.operation,null);assert.equal(storage.data.size,0)
})
for (const kind of ['buy-in','cash-out','losing-return','custody','reconciliation']) test(`${kind}: lost receipt reload uses original payload, success survives refresh failure`,async()=>{
 const storage=memory(), opts=options(storage);let sent, warnings=[]
 const make=()=>kind==='buy-in'?durableBuyIn(opts):kind==='custody'?durableCustody(opts):kind==='reconciliation'?durableReconciliation(opts,(date,counts,remarks,key)=>({expectedBusinessDate:date,denominations:counts,remarks,idempotencyKey:key}),()=>{}):durableCashOut(opts)
 const post=async(...args)=>{sent=structuredClone(args);throw Error('lost')}
 const h={post,onSuccess:()=>{},success:()=>{},preflight:async()=>{},refresh:async()=>{throw Error('GET failed')},warning:m=>warnings.push(m),onWarning:m=>warnings.push(m)}
 const payload={customerId:'c',customerSessionId:'s',denominations:{500:2},amountReceived:1000,expectedBusinessDate:'2026-09-02'}
 const op={kind:kind==='losing-return'?'return':'cash',date:'2026-09-02',customerName:'Customer',payload}
 const invoke=(adapter,retry=false)=>kind==='buy-in'?adapter.run(retry?null:payload,h,retry):kind==='custody'?adapter.run(retry?null:{kind:'FLOAT',mode:'RETURN',date:'2026-09-02',tableId:'t',denominations:{500:2}},h,retry):kind==='reconciliation'?adapter.run({date:'2026-09-02',counts:{500:2},remarks:'same',expectedReopenedAt:'2026-09-02T12:00:00'},h):adapter.run(h)
 const first=make();if(kind==='cash-out'||kind==='losing-return')first.prepare(op)
 await assert.rejects(invoke(first));const original=sent
 const second=make();assert.ok(second.store.operation);h.post=async(...args)=>{assert.deepEqual(args,original);return {id:'original'}}
 await invoke(second,true);assert.equal(second.store.operation,null);assert.equal(storage.data.size,0);assert.match(warnings.join(),/posted successfully/)
})
test('superseded reconciliation clears only obsolete local record and never generates a replacement request',async()=>{
 const storage=memory(),store=persistedOperation({...options(storage),module:'reconciliation'})
 await assert.rejects(store.run({...input,operationType:'Reconciliation'},uncertain))
 const error={response:{status:409,data:{message:'This reconciliation submission has been superseded.'}}}
 await assert.rejects(store.run(null,()=>Promise.reject(error),{retry:true}))
 assert.equal(store.operation,null);assert.equal(storage.data.size,0)
})
test('CRM saved create recovery reuses original persisted signature/key and explicit discard',()=>{
 const storage=memory();const first=createSubmission({storage,namespace:'A'}),payload={customerId:'c',cost:'12.00'}
 const created=first.begin('create:hotel',payload);first.finish(false)
 const second=createSubmission({storage,namespace:'A'});assert.equal(second.pendingCreates()[0].key,created.key)
 const retry=second.begin('create:hotel',payload,true);assert.equal(retry.key,created.key);second.finish(false)
 second.discard(second.pendingCreates()[0].signature);assert.equal(second.pendingCreates().length,0)
})

test('CRM requires current authenticated owner and blocks edited creates until explicit discard',()=>{
 const previous=globalThis.localStorage, auth=memory(), storage=memory();globalThis.localStorage=auth
 auth.setItem('auth_token','synthetic-test-token');auth.setItem('user_data',JSON.stringify({id:'A'}))
 try {
  const submission=createSubmission({storage,namespace:'A',requireStorage:true})
  const original=submission.begin('create:transport',{customerId:'c',cost:'20'});submission.finish(false)
  assert.throws(()=>submission.begin('create:transport',{customerId:'different',cost:'20'}),/uncertain/)
  assert.ok(submission.pendingCreates()[0].createdAt)
  auth.setItem('user_data',JSON.stringify({id:'B'}))
  assert.throws(()=>submission.begin('create:transport',{customerId:'c',cost:'20'},true),/Authentication changed/)
  assert.equal(submission.pendingCreates()[0].key,original.key)
 } finally {globalThis.localStorage=previous}
})
test('adapter synchronous guard remains active through secondary refresh',async()=>{
 const adapter=durableBuyIn(options(memory()));let release, confirmed
 const begun=new Promise(r=>confirmed=r)
 const first=adapter.run(input.payload,{post:async()=>({id:'one'}),onSuccess:()=>confirmed(),refresh:()=>new Promise(r=>release=r),onWarning:()=>{}})
 await begun;await Promise.resolve();assert.equal(adapter.pending,true)
 assert.equal(await adapter.run(input.payload,{post:()=>assert.fail()}),null)
 release();await first;assert.equal(adapter.pending,false)
})


test('older mounted store cannot overwrite or discard a newer uncertain receipt', async () => {
 const storage = memory(), older = persistedOperation(options(storage)), newer = persistedOperation(options(storage))
 await assert.rejects(newer.run(input, uncertain))
 const saved = [...storage.data.values()][0]
 await assert.rejects(older.run(input, () => assert.fail()), /storage changed/)
 assert.throws(() => older.discard(), /storage changed/)
 assert.equal([...storage.data.values()][0], saved)
})
test('preflight interleaving and runtime corruption fail closed without replacing recovery data', async () => {
 const storage = memory(), older = persistedOperation(options(storage)), newer = persistedOperation(options(storage))
 let release
 const waiting = older.run(input, () => assert.fail(), { preflight: () => new Promise(r => release = r) })
 await assert.rejects(newer.run(input, uncertain)); const saved = [...storage.data.values()][0]
 release(); await assert.rejects(waiting, /storage changed/)
 assert.equal([...storage.data.values()][0], saved)
 const restored = persistedOperation(options(storage))
 storage.setItem('i1b:v1:buy-in:A', '{corrupt')
 await assert.rejects(restored.run(null, () => assert.fail(), { retry: true }), /storage changed/)
 assert.equal(storage.getItem('i1b:v1:buy-in:A'), '{corrupt')
})
test('confirmed older response never removes a replacement local receipt', async () => {
 const storage = memory(), store = persistedOperation(options(storage)); let release; const warnings = []
 const waiting = store.run(input, () => new Promise(r => release = r), { warning: m => warnings.push(m) })
 await Promise.resolve()
 const key = 'i1b:v1:buy-in:A', replacement = JSON.parse(storage.getItem(key)); replacement.operationKey = 'newer-key'
 storage.setItem(key, JSON.stringify(replacement)); release({ id: 'confirmed' })
 assert.deepEqual(await waiting, { id: 'confirmed' }); assert.equal(JSON.parse(storage.getItem(key)).operationKey, 'newer-key')
 assert.match(warnings.join(), /succeeded/)
})
test('production Pit and Slot stores clear definite first rejection but retain uncertain retries', async () => {
 const { createMutationStore } = await import('../src/utils/pit.js')
 const previous = globalThis.localStorage, auth = memory(); globalThis.localStorage = auth
 auth.setItem('auth_token', 'test'); auth.setItem('user_data', JSON.stringify({ id: 'A' }))
 try {
  for (const prefix of ['pit-pending', 'machine-pending']) {
   const storage = memory(), store = createMutationStore(undefined, storage, `${prefix}:A`, 'A')
   const rejected = { response: { status: 409 } }
   await assert.rejects(store.run({ kind: 'create', idempotent: false, payload: {} }, () => Promise.reject(rejected)))
   assert.equal(store.operation, null); assert.equal(storage.data.size, 0)
   await assert.rejects(store.run({ kind: 'keyed', idempotent: true, payload: {} }, uncertain))
   const original = store.operation
   await assert.rejects(store.run(null, () => Promise.reject(rejected), true))
   assert.deepEqual(store.operation, original); assert.equal(store.uncertain, true)
  }
 } finally { globalThis.localStorage = previous }
})
test('recovery panel retries preserve parent feedback; only discard invokes changed', async () => {
 const { build } = await import('esbuild')
 const bundled = await build({ entryPoints: ['src/components/ui/PendingOperation.jsx'], bundle: true, write: false, format: 'esm', jsx: 'automatic', plugins: [{ name: 'test-hooks', setup(build) {
  build.onResolve({ filter: /^react(?:\/jsx-runtime)?$/ }, args => ({ path: args.path, namespace: 'test-react' }))
  build.onLoad({ filter: /.*/, namespace: 'test-react' }, () => ({ contents: 'export const useState = v => [v, () => {}]; export const useEffect = () => {}; export const jsx = (type, props) => ({type, props}); export const jsxs = jsx;' }))
 } }] })
 const { default: Panel } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`)
 const previousAuth = globalThis.localStorage, previousWindow = globalThis.window, auth = memory()
 globalThis.localStorage = auth; auth.setItem('auth_token', 'test'); auth.setItem('user_data', JSON.stringify({ id: 'A' }))
 globalThis.window = { confirm: () => true }
 try {
  let feedback = '', changes = 0, discarded = false
  const store = { operation: { actorIdentity: 'A', target: {}, payload: {} }, discard: () => { discarded = true } }
  const tree = Panel({ store, retry: async () => { feedback = 'Transaction succeeded; refresh failed' }, changed: () => { changes++; feedback = '' } })
  const buttons = []; const visit = node => { if (!node || typeof node !== 'object') return; if (node.type === 'button') buttons.push(node); for (const child of [node.props?.children].flat()) visit(child) }; visit(tree)
  await buttons[0].props.onClick(); assert.equal(changes, 0); assert.match(feedback, /succeeded/)
  buttons[1].props.onClick(); await Promise.resolve(); assert.equal(discarded, true); assert.equal(changes, 1)
 } finally { globalThis.localStorage = previousAuth; globalThis.window = previousWindow }
})

test('paired cross-tab auth events reload once and unrelated/session storage events are ignored', async () => {
 const { build } = await import('esbuild')
 const bundle = await build({ entryPoints: ['src/context/AuthContext.jsx'], bundle: true, write: false, format: 'esm', jsx: 'automatic', plugins: [{ name: 'auth-test', setup(build) {
  build.onResolve({ filter: /^react(?:\/jsx-runtime)?$/ }, args => ({ path: args.path, namespace: 'hooks' }))
  build.onLoad({ filter: /.*/, namespace: 'hooks' }, () => ({ contents: 'export const createContext = () => ({Provider: "provider"}); export const useState = v => [v, () => {}]; export const useEffect = fn => globalThis.__authEffects.push(fn); export const jsx = (type,props) => ({type,props});' }))
  build.onResolve({ filter: /^\.\.\// }, args => ({ path: args.path, namespace: 'deps' }))
  build.onLoad({ filter: /.*/, namespace: 'deps' }, args => ({ contents: args.path.includes('tokenStorage') ? 'export default {getToken:()=>"token",getUser:()=>({id:"B"})}' : args.path.includes('auditConstants') ? 'export const AUDIT_ACTIONS={}, AUDIT_MODULES={}, AUDIT_SEVERITY={}' : args.path.includes('auditService') ? 'export const safeLogAuditEvent=()=>{}' : 'export default {}' }))
 } }] })
 const previous = globalThis.window; globalThis.__authEffects = []; let listener, reloads = 0
 const local = {}; globalThis.window = { localStorage: local, location: { reload: () => reloads++ }, addEventListener: (_, fn) => { listener = fn }, removeEventListener: () => {} }
 try {
  const { AuthProvider } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
  AuthProvider({ children: null }); const cleanups = globalThis.__authEffects.map(fn => fn())
  listener({key:'user_data', storageArea:{}}); listener({key:'unrelated', storageArea:local}); assert.equal(reloads,0)
  listener({key:'auth_token',storageArea:local}); listener({key:'user_data',storageArea:local}); assert.equal(reloads,1)
  cleanups.forEach(fn=>fn?.())
 } finally { globalThis.window = previous; delete globalThis.__authEffects }
})

test('custody HTTP success without optional response details still confirms and refreshes', async () => {
 const adapter = durableCustody(options(memory())); let confirmed = 0, refreshed = 0
 await adapter.run({kind:'OPENING', date:'2026-09-02', denominations:{500:2}}, {post:async()=>undefined, preflight:async()=>{}, success:()=>confirmed++, refresh:async()=>refreshed++})
 assert.equal(confirmed,1); assert.equal(refreshed,1); assert.equal(adapter.store.operation,null)
})
test('cash-out confirmation draft cannot change before persistence', () => {
 const adapter = durableCashOut(options(memory())), original = {kind:'cash',payload:{denominations:{500:2}}}
 const target = adapter.prepare(original); original.payload.denominations[500] = 99
 assert.equal(target.payload.denominations[500],2); assert.throws(()=>{target.payload.denominations[500]=3},TypeError)
})
test('empty stored record and malformed envelope fail closed', async () => {
 for (const raw of ['', JSON.stringify({version:1,module:'buy-in',actorIdentity:'A',operationKey:'key',operationType:'Buy-In',createdAt:new Date().toISOString(),target:[],payload:{},expectedBusinessDate:null})]) {
  const storage=memory(); storage.setItem('i1b:v1:buy-in:A',raw)
  const store=persistedOperation(options(storage)); assert.ok(store.issue)
  await assert.rejects(store.run(input,()=>assert.fail()),/storage/)
 }
})
