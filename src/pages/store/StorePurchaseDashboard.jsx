import { useEffect, useMemo, useRef, useState } from 'react'
import useAuth from '../../hooks/useAuth'
import api from '../../api/storeApi'
import PendingOperation from '../../components/ui/PendingOperation'
import { actorIdentity } from '../../utils/persistedOperation'
import { STORE_TABS, canReadStore, canWriteStore, createStoreManager, freezeIntent, positiveQuantity, requestPayload, storeCsv, units, requestStatuses, procurementStatuses, movementTypes } from '../../utils/store'

const input = 'rounded border border-slate-300 bg-white p-2 text-sm'
const button = 'rounded border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-40'
const label = value => value.replaceAll('_',' ')
const operationLabel = kind => ({createItem:'Create Item',editItem:'Edit Item',createRequest:'Create Request',opening:'Record Opening Stock',adjust:'Adjust Inventory',issue:'Issue Stock',procure:'Create Procurement',receive:'Receive Goods',order:'Mark Ordered',cancelRequest:'Cancel Request Remainder',cancelProcurement:'Cancel Procurement Remainder'})[kind]
const shown = value => value == null || value === '' ? 'Unavailable' : String(value)
const empty = {data:null,loading:false,error:''}
const kindForTab = ['requests','items','procurements','movements']
function Field({title,children}) {return <label className="flex flex-col gap-1 text-sm"><span>{title}</span>{children}</label>}
function Table({head,children}) {return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{head.map(h=><th key={h} className="border-b p-3">{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>}
const Cell = ({children}) => <td className="border-b p-3 align-top">{children}</td>

export default function StorePurchaseDashboard() {
  const {user}=useAuth(), actor=actorIdentity(user), role=user?.role
  const [view,setView]=useState({}),[tab,setTab]=useState(0),[query,setQuery]=useState(''),[status,setStatus]=useState(''),[page,setPage]=useState(0)
  const [recordItem,setRecordItem]=useState(null)
  const [selected,setSelected]=useState(null),[dialog,setDialog]=useState(null),[form,setForm]=useState({}),[error,setError]=useState('')
  const [staffSearch,setStaffSearch]=useState(''),[itemSearch,setItemSearch]=useState(''),[staff,setStaff]=useState(null),[lines,setLines]=useState([])
  const manager=useMemo(()=>createStoreManager(api,{actor,role,publish:setView}),[actor,role])
  const kind=kindForTab[tab], mutable=canWriteStore(role), detail=view.detail?.data?.request.id===selected?view.detail:(view.detail?.loading||view.detail?.error?view.detail:empty)
  const blocked=view.working||manager.recovery.pending||Boolean(manager.recovery.operation)||Boolean(manager.recovery.issue)
  const params={q:query,page,size:50,...(kind==='movements'?{type:status,...(recordItem?{itemId:recordItem.id}:{})}:kind!=='items'?{status}:{})}
  const state=view.main?.context===JSON.stringify({kind,params})?view.main:empty
  const refreshRef=useRef(null)
  const reload=async()=>{
    const [list,details]=await Promise.all([manager.load('main',kind,params),
      selected?manager.load('detail','detail',{id:selected}):Promise.resolve(true)])
    if(!list||!details)throw Error('Refresh unavailable')
  }
  refreshRef.current=reload
  useEffect(()=>{manager.activate();setView({});setSelected(null);setDialog(null);return()=>manager.dispose()},[manager])
  useEffect(()=>{if(canReadStore(role))manager.load('main',kind,params)},[manager,kind,query,status,page,recordItem])
  useEffect(()=>{if(dialog?.kind==='createRequest'){setStaff(null);manager.load('staff','staff',{q:staffSearch,size:50,page:0})}},[manager,dialog?.kind,staffSearch])
  useEffect(()=>{if(dialog?.kind==='createRequest')manager.load('referenceItems','items',{q:itemSearch,active:true,size:50,page:0})},[manager,dialog?.kind,itemSearch])
  if(!canReadStore(role))return <p role="alert">Store is available to SUPER_ADMIN and DIRECTOR only.</p>
  const invalidateScope=()=>{manager.invalidate('main');manager.invalidate('detail');setSelected(null)}
  const changeTab=n=>{invalidateScope();setTab(n);setRecordItem(null);setQuery('');setStatus('');setPage(0);setSelected(null);manager.invalidate('detail');setDialog(null)}
  const select=async row=>{setSelected(row.id);await manager.load('detail','detail',{id:row.id})}
  const open=(operation,target=null)=>{
    if(!mutable||blocked)return
    setError('');setDialog({kind:operation,target:target?JSON.parse(JSON.stringify(target)):null});setStaff(null);setLines([])
    setForm({code:target?.code||'',name:target?.name||'',category:target?.category||'',unit:target?.unit||'PCS',active:target?.active??true,
      quantity:operation==='procure'?String(target.outstandingQuantity):'',reason:'',externalReference:'',supplierReference:target?.supplierReference||'',type:'ADJUSTMENT_IN',requiredDate:'',remarks:''})
    if(operation==='createRequest'){setStaffSearch('');setItemSearch('')}
  }
  const close=()=>{setDialog(null);setError('');manager.invalidate('staff');manager.invalidate('referenceItems')}
  const update=(key,value)=>setForm(v=>({...v,[key]:value}))
  const submit=async event=>{
    event.preventDefault();if(!dialog||blocked)return
    try {
      const {kind:operation,target}=dialog;let path,payload
      if(operation==='createItem'||operation==='editItem') {
        if(!/^[A-Z0-9_-]{1,50}$/.test(form.code.trim().toUpperCase())||!form.name.trim()||!form.category.trim())throw Error('Enter a valid code, item name and category.')
        path=target?`items/${target.id}`:'items';payload={code:form.code.trim().toUpperCase(),name:form.name.trim(),category:form.category.trim(),unit:form.unit,active:form.active,...(target?{expectedVersion:target.version}:{})}
      } else if(operation==='createRequest') {
        if(!staff||!(view.staff?.data?.items||[]).some(s=>s.id===staff.id))throw Error('Select a current authoritative staff result.')
        path='requests';payload=requestPayload(staff,lines,form.requiredDate,form.remarks)
      } else if(['issue','procure','receive','opening','adjust'].includes(operation)) {
        const quantity=positiveQuantity(form.quantity)
        path=operation==='issue'?`request-lines/${target.id}/issues`:operation==='procure'?`request-lines/${target.id}/procurements`:operation==='receive'?`procurements/${target.id}/receive`:`items/${target.id}/${operation==='opening'?'opening-stock':'adjustments'}`
        payload=operation==='adjust'?{quantity,type:form.type,reason:form.reason.trim()}:{quantity,externalReference:form.externalReference.trim()||null}
        if(operation==='adjust'&&!payload.reason)throw Error('A correction reason is required.')
      } else {
        path=operation==='cancelRequest'?`requests/${target.id}/cancel-remaining`:`procurements/${target.id}/${operation==='order'?'order':'cancel'}`
        payload={expectedVersion:target.version,...(operation==='order'?{supplierReference:form.supplierReference.trim()||null}:{reason:form.reason.trim()})}
        if(operation!=='order'&&!payload.reason)throw Error('A cancellation reason is required.')
      }
      const targetLabel=target?.reference||target?.itemCode||target?.code||staff?.name||payload.code
      const intent=freezeIntent(operation,path,payload,targetLabel,undefined,target||{staff,lines})
      if(!window.confirm(`Confirm ${operationLabel(operation)} for ${targetLabel}?${payload.quantity?` Quantity: ${payload.quantity}.`:''}${operation==='receive'?' Receiving adds inventory only. Issue request stock separately.':''}${operation==='cancelRequest'||operation==='cancelProcurement'?' Historical movements remain unchanged.':''}`))return
      const result=await manager.submit(intent,()=>refreshRef.current())
      if(result&&manager.isCurrent())close()
    }catch(e){if(manager.isCurrent())setError(e?.response?.data?.message||e.message)}
  }
  const download=()=>{
    if(!state.data||state.loading||state.error)return
    const blob=new Blob([storeCsv(kind,state.data.items)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a')
    link.href=url;link.download=`store-${kind}-page-${page+1}.csv`;link.click();URL.revokeObjectURL(url)
  }
  return <main className="space-y-5 p-6">
    <div><h1 className="text-2xl font-bold">Store / Purchase</h1><p className="text-sm text-slate-600">Quantity inventory and department fulfilment. Receiving adds stock; issuing fulfils a request.</p>{!mutable&&<p>DIRECTOR · Read-only</p>}</div>
    <nav className="flex flex-wrap gap-2" aria-label="Store sections">{STORE_TABS.map((name,n)=><button className={`${button} ${tab===n?'font-bold ring-2 ring-slate-700':''}`} key={name} onClick={()=>changeTab(n)}>{name}</button>)}</nav>
    <PendingOperation key={`${actor}:${role}`} store={manager.recovery} allowed={mutable} retry={()=>manager.submit(null,()=>refreshRef.current(),true)} />
    {view.message&&<p role="status" className="rounded bg-green-50 p-3">{view.message}</p>}{view.mutationError&&<p role="alert" className="text-red-700">{view.mutationError}</p>}
    <div className="flex flex-wrap items-center gap-3">
      <input aria-label="Search current Store section" className={input} placeholder="Search references, items or departments" value={query} maxLength={100} onChange={e=>{invalidateScope();setQuery(e.target.value);setPage(0)}} />
      {kind!=='items'&&<select aria-label="Status or movement type" className={input} value={status} onChange={e=>{invalidateScope();setStatus(e.target.value);setPage(0)}}><option value="">All {kind==='movements'?'types':'statuses'}</option>{(kind==='requests'?requestStatuses:kind==='procurements'?procurementStatuses:movementTypes).map(s=><option key={s} value={s}>{label(s)}</option>)}</select>}
      {kind==='movements'&&recordItem&&<span>Item: {recordItem.code} <button className={button} onClick={()=>{invalidateScope();setRecordItem(null);setPage(0)}}>Clear item filter</button></span>}
      <button className={button} onClick={()=>reload().catch(()=>{})}>Refresh</button>
      {mutable&&kind==='items'&&<button className={button} disabled={blocked} onClick={()=>open('createItem')}>New Item</button>}
      {mutable&&kind==='requests'&&<button className={button} disabled={blocked} onClick={()=>open('createRequest')}>New Request</button>}
      {['items','movements'].includes(kind)&&<button className={button} disabled={!state.data||state.loading||!!state.error} onClick={download}>Export current page CSV</button>}
    </div>
    {state.loading&&<p role="status">Loading authoritative Store data…</p>}{state.error&&<p role="alert" className="text-red-700">Unavailable: {state.error}</p>}
    {state.data&&!state.loading&&<>
      {!state.data.items.length?<p>No records match this page and filter.</p>:kind==='items'?<Table head={['Item','Category / Unit','Quantity balance','Status','Actions']}>{state.data.items.map(r=><tr key={r.id}><Cell><strong>{r.code}</strong><div>{r.name}</div></Cell><Cell>{r.category} / {r.unit}</Cell><Cell>{r.quantityBalance}</Cell><Cell>{r.active?'Active':'Inactive'}</Cell><Cell><button className={button} onClick={()=>{changeTab(3);setRecordItem({id:r.id,code:r.code})}}>View records</button>{mutable&&<div className="flex flex-wrap gap-2"><button className={button} disabled={blocked} onClick={()=>open('editItem',r)}>Edit / Status</button>{r.active&&!r.hasMovements&&r.quantityBalance===0&&<button className={button} disabled={blocked} onClick={()=>open('opening',r)}>Opening Stock</button>}{r.active&&<button className={button} disabled={blocked} onClick={()=>open('adjust',r)}>Adjust</button>}</div>}</Cell></tr>)}</Table>
      :kind==='requests'?<Table head={['Reference / Recorded','Department / Requester','Status','Required date','Details']}>{state.data.items.map(r=><tr key={r.id}><Cell>{r.reference}<div>{r.createdAt.replace('T',' ')}</div><small>Recorded by {r.recordedByName}</small></Cell><Cell>{r.departmentName}<div>{r.requesterName}</div></Cell><Cell>{label(r.status)}</Cell><Cell>{shown(r.requiredDate)}</Cell><Cell><button className={button} onClick={()=>select(r)}>View request</button></Cell></tr>)}</Table>
      :kind==='procurements'?<Table head={['Procurement / Request','Item / Department','Quantity / Received / Remaining','Status / Supplier','Dates','Actions']}>{state.data.items.map(r=><tr key={r.id}><Cell>{r.reference}<div>{r.requestReference}</div></Cell><Cell>{r.itemCode} · {r.itemName}<div>{r.departmentName}</div></Cell><Cell>{r.quantity} / {r.receivedQuantity} / {r.outstandingQuantity} {r.unit}</Cell><Cell>{label(r.status)}<div>{shown(r.supplierReference)}</div></Cell><Cell>Created: {r.createdAt.replace('T',' ')}<div>Ordered: {shown(r.orderedAt)}</div>{r.cancelledAt&&<div>Cancelled: {r.cancelledAt}</div>}</Cell><Cell>{mutable&&<div className="flex flex-wrap gap-2">{r.status==='PENDING'&&<button className={button} disabled={blocked} onClick={()=>open('order',r)}>Mark Ordered</button>}{r.status==='ORDERED'&&<button className={button} disabled={blocked} onClick={()=>open('receive',r)}>Receive</button>}{['PENDING','ORDERED'].includes(r.status)&&<button className={button} disabled={blocked} onClick={()=>open('cancelProcurement',r)}>Cancel remainder</button>}</div>}</Cell></tr>)}</Table>
      :<Table head={['Movement / Timestamp','Item','Type','In / Out','Balance after','Request / Procurement / Department','Actor / Business Date']}>{state.data.items.map(r=><tr key={r.id}><Cell>{r.reference}<div>{r.performedAt.replace('T',' ')}</div></Cell><Cell>{r.itemCode} · {r.itemName}<div>{r.unit}</div></Cell><Cell>{label(r.movementType)}</Cell><Cell>{['ISSUE','ADJUSTMENT_OUT'].includes(r.movementType)?`— / ${r.quantity}`:`${r.quantity} / —`}</Cell><Cell>{r.balanceAfter}</Cell><Cell>{shown(r.requestReference)}<div>{shown(r.procurementReference)}</div><div>{shown(r.departmentName)}</div></Cell><Cell>{r.performedByName}<div>{r.businessDate||'No OPEN Business Date at recording'}</div></Cell></tr>)}</Table>}
      <div className="flex gap-3"><button className={button} disabled={page===0} onClick={()=>{invalidateScope();setPage(p=>p-1)}}>Previous</button><span>Page {page+1} · up to {state.data.size} records</span><button className={button} disabled={!state.data.hasNext} onClick={()=>{invalidateScope();setPage(p=>p+1)}}>Next</button></div>
    </>}
    {selected&&kind==='requests'&&<section className="space-y-3 rounded border bg-white p-4"><h2 className="text-lg font-bold">Request details</h2>{detail.loading&&<p>Loading request…</p>}{detail.error&&<p role="alert">Unavailable: {detail.error}</p>}{detail.data&&<><p>{detail.data.request.reference} · {detail.data.request.departmentName} · {label(detail.data.request.status)}</p>{detail.data.request.remarks&&<p>{detail.data.request.remarks}</p>}
      <Table head={['Item','Requested','Issued','Cancelled','Outstanding','Available','Active procurement','Actions']}>{detail.data.lines.map(l=><tr key={l.id}><Cell>{l.itemCode} · {l.itemName}<div>{l.unit}{!l.active?' · Inactive':''}</div></Cell><Cell>{l.requestedQuantity}</Cell><Cell>{l.issuedQuantity}</Cell><Cell>{l.cancelledQuantity}</Cell><Cell>{l.outstandingQuantity}</Cell><Cell>{l.availableQuantity}</Cell><Cell>{l.procurementReference||'None'}<div>{l.procurementStatus&&label(l.procurementStatus)}</div></Cell><Cell>{mutable&&l.active&&l.outstandingQuantity>0&&<div className="flex flex-wrap gap-2"><button className={button} disabled={blocked||l.availableQuantity===0} onClick={()=>open('issue',{...l,requestReference:detail.data.request.reference,departmentName:detail.data.request.departmentName})}>Issue quantity</button><button className={button} disabled={blocked||!!l.procurementId} onClick={()=>open('procure',{...l,requestReference:detail.data.request.reference,departmentName:detail.data.request.departmentName})}>Create procurement</button></div>}</Cell></tr>)}</Table>
      {mutable&&['PENDING','PARTIALLY_FULFILLED'].includes(detail.data.request.status)&&<button className={button} disabled={blocked||detail.data.lines.some(l=>l.outstandingQuantity>0&&l.procurementId)} onClick={()=>open('cancelRequest',detail.data.request)}>Cancel remaining request</button>}<p className="text-sm">Active procurement must be cancelled before cancelling its request remainder. Available inventory is rechecked by the server when issuing.</p>
    </>}</section>}
    {dialog&&mutable&&<div role="dialog" aria-modal="true" aria-label="Store operation" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"><form onSubmit={submit} className="max-h-[90vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-xl bg-white p-6"><h2 className="text-xl font-bold">{operationLabel(dialog.kind)} · {dialog.target?.reference||dialog.target?.itemCode||dialog.target?.code||'New record'}</h2>
      {['createItem','editItem'].includes(dialog.kind)?<div className="grid grid-cols-2 gap-3"><Field title="Code"><input required maxLength={50} className={input} value={form.code} disabled={dialog.target?.hasHistory} onChange={e=>update('code',e.target.value)}/></Field><Field title="Name"><input required maxLength={150} className={input} value={form.name} onChange={e=>update('name',e.target.value)}/></Field><Field title="Category"><input required maxLength={100} className={input} value={form.category} onChange={e=>update('category',e.target.value)}/></Field><Field title="Unit"><select className={input} value={form.unit} disabled={dialog.target?.hasHistory} onChange={e=>update('unit',e.target.value)}>{units.map(u=><option key={u}>{u}</option>)}</select></Field><label><input type="checkbox" checked={form.active} onChange={e=>update('active',e.target.checked)}/> Active</label><p>Current balance cannot be edited. Use opening stock or a reasoned adjustment.</p></div>
      :dialog.kind==='createRequest'?<>
        <Field title="Find active requester"><input className={input} value={staffSearch} maxLength={100} onChange={e=>{setStaff(null);manager.invalidate('staff');setStaffSearch(e.target.value)}}/></Field>
        {view.staff?.loading&&<p>Loading staff…</p>}{view.staff?.error&&<p role="alert">Staff unavailable: {view.staff.error}</p>}
        <select aria-label="Requester" className={input} value={staff?.id||''} disabled={!view.staff?.data} onChange={e=>setStaff(view.staff.data.items.find(s=>s.id===e.target.value)||null)}><option value="">Select requester</option>{view.staff?.data?.items.map(s=><option key={s.id} value={s.id}>{s.employeeCode} · {s.name} · {s.departmentName}</option>)}</select>
        <p>Department: {staff?.departmentName||'Select requester'} (derived by backend)</p>
        <Field title="Find active item"><input className={input} value={itemSearch} maxLength={100} onChange={e=>{manager.invalidate('referenceItems');setItemSearch(e.target.value)}}/></Field>
        {view.referenceItems?.error&&<p role="alert">Items unavailable: {view.referenceItems.error}</p>}
        <select aria-label="Add item line" className={input} value="" disabled={!view.referenceItems?.data} onChange={e=>{const item=view.referenceItems.data.items.find(i=>i.id===e.target.value);if(item&&!lines.some(l=>l.itemId===item.id))setLines([...lines,{itemId:item.id,label:`${item.code} · ${item.name} (${item.unit})`,quantity:''}])}}><option value="">Add item line</option>{view.referenceItems?.data?.items.filter(i=>!lines.some(l=>l.itemId===i.id)).map(i=><option key={i.id} value={i.id}>{i.code} · {i.name} ({i.unit})</option>)}</select>
        {lines.map((l,n)=><div className="flex items-center gap-3" key={l.itemId}><span>{l.label}</span><input aria-label={`Quantity for ${l.label}`} required inputMode="numeric" pattern="[1-9][0-9]*" className={input} value={l.quantity} onChange={e=>setLines(lines.map((v,index)=>index===n?{...v,quantity:e.target.value}:v))}/><button type="button" className={button} onClick={()=>setLines(lines.filter(v=>v.itemId!==l.itemId))}>Remove</button></div>)}
        <Field title="Required date (optional)"><input type="date" className={input} value={form.requiredDate} onChange={e=>update('requiredDate',e.target.value)}/></Field><Field title="Remarks (optional)"><textarea maxLength={1000} className={input} value={form.remarks} onChange={e=>update('remarks',e.target.value)}/></Field>
      </>:<>
        {dialog.target.requestReference&&<p>{dialog.target.requestReference} · {dialog.target.departmentName}</p>}
        {['issue','procure'].includes(dialog.kind)&&<p>Requested: {dialog.target.requestedQuantity} · Already issued: {dialog.target.issuedQuantity} · Cancelled: {dialog.target.cancelledQuantity}</p>}
        {dialog.kind==='receive'&&<p>Ordered: {dialog.target.quantity} · Already received: {dialog.target.receivedQuantity}</p>}
        {dialog.kind==='adjust'&&<p>This records an inventory correction. Previous movements cannot be edited or reversed by this form.</p>}
        {['issue','procure','receive','opening','adjust'].includes(dialog.kind)&&<><p>{dialog.target.outstandingQuantity!=null?`Remaining: ${dialog.target.outstandingQuantity}. `:''}{dialog.target.availableQuantity!=null?`Available: ${dialog.target.availableQuantity}. `:''}{dialog.target.quantityBalance!=null?`Current balance: ${dialog.target.quantityBalance}. `:''}{dialog.target.unit}</p><Field title="Explicit quantity"><input required inputMode="numeric" pattern="[1-9][0-9]*" className={input} value={form.quantity} onChange={e=>update('quantity',e.target.value)}/></Field></>}
        {dialog.kind==='receive'&&<p>Receipt increases inventory only. Issue remaining request quantity separately after receiving.</p>}
        {dialog.kind==='adjust'&&<Field title="Direction"><select className={input} value={form.type} onChange={e=>update('type',e.target.value)}><option value="ADJUSTMENT_IN">Increase</option><option value="ADJUSTMENT_OUT">Decrease</option></select></Field>}
        {['adjust','cancelRequest','cancelProcurement'].includes(dialog.kind)&&<Field title="Reason"><textarea required maxLength={500} className={input} value={form.reason} onChange={e=>update('reason',e.target.value)}/></Field>}
        {dialog.kind==='order'&&<Field title="Supplier reference (optional)"><input maxLength={200} className={input} value={form.supplierReference} onChange={e=>update('supplierReference',e.target.value)}/></Field>}
        {['opening','issue','receive','procure'].includes(dialog.kind)&&<Field title="External reference (optional)"><input maxLength={200} className={input} value={form.externalReference} onChange={e=>update('externalReference',e.target.value)}/></Field>}
      </>}
      {error&&<p role="alert" className="text-red-700">{error}</p>}<div className="flex gap-3"><button className={button} type="submit" disabled={blocked}>Review and confirm</button><button className={button} type="button" disabled={view.working} onClick={close}>Close</button></div>
    </form></div>}
  </main>
}
