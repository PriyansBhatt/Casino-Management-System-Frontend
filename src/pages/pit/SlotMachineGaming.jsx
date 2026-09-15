import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import useAuth from '../../hooks/useAuth'
import api from '../../api/machineApi'
import { lifecycleAllows } from '../../utils/chipControl'
import { UNAVAILABLE, canManageMachines, canStart, canEnd, loadMachines, requestGuard, validateCandidates, startTarget, endTarget, machineCsv, machineMutationStore, confirmedThenRefresh } from '../../utils/machines'
const button='rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold disabled:opacity-40'
const field='w-full rounded-lg border border-slate-300 p-2'
const emptyMaster={machineCode:'',displayName:'',machineType:'SLOT',location:''}
function Machines({user}) {
  const [scope,setScope]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('')
  const [query,setQuery]=useState(''),[type,setType]=useState(''),[status,setStatus]=useState('')
  const [dialog,setDialog]=useState(null),[detail,setDetail]=useState(null),[detailError,setDetailError]=useState('')
  const [search,setSearch]=useState(''),[candidates,setCandidates]=useState(null),[selected,setSelected]=useState(null),[searchError,setSearchError]=useState('')
  const [master,setMaster]=useState(emptyMaster)
  const pageGuard=useRef(requestGuard()),detailGuard=useRef(requestGuard()),searchGuard=useRef(requestGuard())
  const store=machineMutationStore(user.id||user.username)
  useSyncExternalStore(store.subscribe,store.version)
  const blocked=store.pending||store.uncertain,manage=canManageMachines(user.role)
  const invalidateDialog=useCallback(()=>{
    detailGuard.current.invalidate();searchGuard.current.invalidate();setDialog(null);setDetail(null);setSelected(null);setCandidates(null);setSearch('');setSearchError('')
  },[])
  const refresh=useCallback(async()=>{
    const current=pageGuard.current.next();setLoading(true);setScope(null);setError('');invalidateDialog()
    try {const result=await loadMachines(api);if(current())setScope(result);return result}
    catch(e){if(current())setError(e?.response?.data?.message||e.message);throw e}
    finally {if(current())setLoading(false)}
  },[invalidateDialog])
  useEffect(()=>{
    refresh().catch(()=>{})
    return ()=>{pageGuard.current.invalidate();detailGuard.current.invalidate();searchGuard.current.invalidate()}
  },[refresh])
  useEffect(()=>{
    const onFocus=()=>{if(!store.pending&&!store.uncertain)refresh().catch(()=>{})}
    window.addEventListener('focus',onFocus)
    return ()=>window.removeEventListener('focus',onFocus)
  },[refresh,store])
  useEffect(()=>{
    const current=searchGuard.current.next();setSelected(null);setCandidates(null);setSearchError('')
    if(dialog?.kind!=='start'||search.trim().length<2)return
    const timer=setTimeout(async()=>{
      try{const rows=validateCandidates(await api.candidates(search.trim()),scope?.businessDate);if(current())setCandidates(rows)}
      catch(e){if(current())setSearchError(e?.response?.data?.message||e.message)}
    },250)
    return ()=>{clearTimeout(timer);searchGuard.current.invalidate()}
  },[search,dialog,scope?.businessDate])
  const perform=async(target,retry=false)=>{
    if(store.pending)return
    setNotice('');setError('')
    try{
      await confirmedThenRefresh(()=>store.run(target,api.mutate,retry),refresh,()=>setNotice('Operation succeeded.'),setNotice)
    }catch(e){setError(store.uncertain?'Outcome unconfirmed. The original request is retained; resolve it before starting another operation.':e?.response?.data?.message||e.message)}
  }
  const recover=async()=>{
    if(store.pending||!store.operation)return
    if(store.operation.idempotent)return perform(null,true)
    try{
      const rows=(await api.overview()).machines,op=store.operation
      const found=rows.find(m=>op.kind==='create'?m.machineCode===op.payload.machineCode.toUpperCase():m.id===op.machineId)
      const confirmed=op.kind==='create'?found&&found.displayName===op.payload.displayName.trim()&&found.machineType===op.payload.machineType&&(found.location||'')===op.payload.location.trim():found?.operationalStatus===op.payload.status
      if(!confirmed){setError('Completion is not established. Keep the saved request and verify the machine before continuing.');return}
      store.confirmRecovered();setNotice('Requested machine state confirmed.');setError('')
      try{await refresh()}catch{setNotice('Requested state confirmed; latest overview could not be refreshed.')}
    }catch(e){setError('Recovery read failed. The saved request is retained.')}
  }
  const show=async(machine,kind='view')=>{
    invalidateDialog();setDialog({kind,machine});setDetailError('')
    const current=detailGuard.current.next()
    try{const value=await api.detail(machine.id);if(current())setDetail(value)}
    catch(e){if(current())setDetailError(e?.response?.data?.message||e.message)}
  }
  const rows=scope?.machines
  const filtered=useMemo(()=>rows?.filter(m=>(!query||`${m.machineCode} ${m.displayName} ${m.location||''} ${m.activePlay?.customerCode||''}`.toLowerCase().includes(query.toLowerCase()))&&(!type||m.machineType===type)&&(!status||m.operationalStatus===status))||[],[rows,query,type,status])
  const machine=detail?.machine
  const count=s=>rows?rows.filter(m=>!s||m.operationalStatus===s).length:'Unavailable'
  const exportCsv=()=>{
    if(!rows)return
    const url=URL.createObjectURL(new Blob([machineCsv(filtered)],{type:'text/csv;charset=utf-8;'})),a=document.createElement('a')
    a.href=url;a.download='machines.csv';a.click();URL.revokeObjectURL(url)
  }
  const newActivity=Boolean(scope?.businessDate)&&lifecycleAllows(scope?.lifecycle,false)
  return <div className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold">Slot &amp; Machine Gaming</h1><p>Business Date: {scope?.businessDate||'Unavailable'} · {scope?.businessDateStatus||'Unavailable'}</p><p>Machine availability and Slot play only.</p></div><div className="flex gap-2"><button className={button} disabled={loading||blocked} onClick={()=>refresh().catch(()=>{})}>Refresh</button>{manage&&<button className={button} disabled={!newActivity||blocked} onClick={()=>{invalidateDialog();setMaster(emptyMaster);setDialog({kind:'create'})}}>Add Machine</button>}</div></header>
    {notice&&<p role="status" className="rounded bg-green-50 p-3">{notice}</p>}{error&&<p role="alert" className="rounded bg-red-50 p-3">{error}</p>}
    {store.uncertain&&<section className="rounded border border-amber-400 p-4"><p>Unconfirmed {store.operation.kind} · {store.operation.machineCode||store.operation.machineId||store.operation.payload.machineCode} · Business Date {store.operation.payload.expectedBusinessDate}. The frozen request is retained across dialog closure. Keep this application open until resolved.</p><button className={button} disabled={store.pending||!manage} onClick={recover}>{store.operation.idempotent?'Retry exact saved request':'Check authoritative completion'}</button></section>}
    <section className="grid gap-3 sm:grid-cols-4">{[['Total Machines',count()],['Available',count('AVAILABLE')],['In Use',count('IN_USE')],['Out of Service',count('OUT_OF_SERVICE')]].map(([label,value])=><div key={label} className="rounded-xl border bg-white p-4"><p>{label}</p><strong className="text-2xl">{value}</strong></div>)}</section>
    {!manage&&<p>Read only. Machine management is restricted to SUPER_ADMIN.</p>}
    {!newActivity&&<p>New activity unavailable: current Business Date / lifecycle must allow it. Existing records remain readable.</p>}
    {loading&&<p>Loading authoritative machines…</p>}
    <div className="flex flex-wrap gap-2"><input aria-label="Search machines" className={field+' max-w-sm'} placeholder="Machine code, name, location, customer code" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Machine type" className={button} value={type} onChange={e=>setType(e.target.value)}><option value="">All types</option><option>SLOT</option><option>AUTOMATIC_ROULETTE</option></select><select aria-label="Machine status" className={button} value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option>{['AVAILABLE','IN_USE','OUT_OF_SERVICE'].map(s=><option key={s}>{s}</option>)}</select><button className={button} disabled={!rows} onClick={exportCsv}>Export CSV</button><button className={button} disabled>Print / PDF unavailable</button></div>
    {rows&&<div className="overflow-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead><tr>{['Machine','Type','Location','Status','Current Player','Started','Action'].map(s=><th className="p-3" key={s}>{s}</th>)}</tr></thead><tbody>{filtered.map(m=><tr className="border-t" key={m.id}><td className="p-3"><strong>{m.machineCode}</strong><p>{m.displayName}</p></td><td>{m.machineType}{m.machineType==='AUTOMATIC_ROULETTE'&&<p>Play workflow not configured</p>}</td><td>{m.location||'Not specified'}</td><td>{m.operationalStatus}</td><td>{m.activePlay?<>{m.activePlay.customerCode} · {m.activePlay.customerName}<p>{m.activePlay.sessionCode} · {m.activePlay.businessDate}</p></>:'No active play'}</td><td>{m.activePlay?.startedAt||'—'}</td><td><button className={button} onClick={()=>show(m)}>View</button>{canStart(m,scope,user.role)&&<button className={button} disabled={blocked} onClick={()=>show(m,'start')}>Start Play</button>}{canEnd(m,scope,user.role)&&<button className={button} disabled={blocked} onClick={()=>show(m,'end')}>End Play</button>}</td></tr>)}</tbody></table>{!filtered.length&&<p className="p-4">No matching machines.</p>}</div>}
    <section className="rounded-xl border bg-slate-50 p-4"><h2 className="font-bold">Financial features unavailable</h2>{UNAVAILABLE.map(text=><p key={text}>{text}</p>)}</section>
    {dialog&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><section role="dialog" aria-label="Machine workflow" className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-auto rounded-xl bg-white p-5"><div className="flex justify-between"><h2 className="text-xl font-bold">{dialog.kind==='create'?'Add Machine':dialog.machine.machineCode}</h2><button className={button} onClick={invalidateDialog}>Close</button></div>
      {dialog.kind==='create'?<form onSubmit={e=>{e.preventDefault();if(!blocked&&manage&&newActivity)perform({kind:'create',idempotent:false,payload:{...master,expectedBusinessDate:scope.businessDate}})}} className="space-y-3">
        <label>Machine code<input required pattern="[A-Za-z0-9][A-Za-z0-9_-]{0,39}" maxLength={40} className={field} value={master.machineCode} disabled={blocked} onChange={e=>setMaster({...master,machineCode:e.target.value})}/></label><label>Display name<input required maxLength={120} className={field} value={master.displayName} disabled={blocked} onChange={e=>setMaster({...master,displayName:e.target.value})}/></label><label>Type<select className={field} value={master.machineType} disabled={blocked} onChange={e=>setMaster({...master,machineType:e.target.value})}><option>SLOT</option><option>AUTOMATIC_ROULETTE</option></select></label><label>Location<input maxLength={120} className={field} value={master.location} disabled={blocked} onChange={e=>setMaster({...master,location:e.target.value})}/></label><p>Creates an AVAILABLE machine. Automatic Roulette play remains unavailable.</p><button className={button} disabled={blocked||!newActivity}>Create Machine</button>
      </form>:<>{detailError&&<p role="alert">{detailError}</p>}{!detail&&!detailError&&<p>Loading authoritative detail…</p>}{machine&&<>
        <p>{machine.displayName} · {machine.machineType} · {machine.operationalStatus} · {machine.location||'Location not specified'}</p>
        {machine.machineType==='AUTOMATIC_ROULETTE'&&<p>Play workflow not configured. Multi-seat play is deferred.</p>}
        {machine.activePlay&&<p>{machine.activePlay.customerCode} · {machine.activePlay.customerName} · {machine.activePlay.sessionCode} · Business Date {machine.activePlay.businessDate} · Started {machine.activePlay.startedAt}</p>}
        {dialog.kind==='start'&&<><p>Select an authoritative ACTIVE customer with an OPEN, unexited Reception session for {scope?.businessDate}.</p><input aria-label="Search eligible customers" className={field} placeholder="Search customer code or name" value={search} disabled={blocked} onChange={e=>{searchGuard.current.invalidate();setSelected(null);setCandidates(null);setSearch(e.target.value)}}/>{searchError&&<p role="alert">{searchError}</p>}{candidates?.map(c=><button key={c.customerSessionId} className={button+(selected?.customerSessionId===c.customerSessionId?' bg-yellow-100':'')} disabled={blocked} onClick={()=>setSelected(c)}>{c.customerCode} · {c.customerName} · {c.sessionCode} · {c.businessDate}</button>)}{candidates?.length===0&&<p>No eligible current-date sessions found.</p>}{selected&&<p>Verified session: {selected.sessionCode} · {selected.businessDate}</p>}<button className={button} disabled={blocked||!selected||!canStart(machine,scope,user.role)} onClick={()=>{try{perform(startTarget(machine,selected,scope))}catch(e){setError(e.message)}}}>Confirm Start Play</button></>}
        {dialog.kind==='end'&&<><p>End Play releases this Slot only and retains its original Business Date, including after rollover. It does not exit the casino, cash out, redeem money, record WIN/LOSS, or change chips, Losing Return or reconciliation.</p><button className={button} disabled={blocked||!canEnd(machine,scope,user.role)} onClick={()=>perform(endTarget(machine,scope,user.role))}>Confirm End Play</button></>}
        {dialog.kind==='view'&&manage&&machine.operationalStatus!=='IN_USE'&&<button className={button} disabled={blocked||!newActivity} onClick={()=>perform({kind:'status',idempotent:false,machineId:machine.id,machineCode:machine.machineCode,payload:{expectedStatus:machine.operationalStatus,status:machine.operationalStatus==='AVAILABLE'?'OUT_OF_SERVICE':'AVAILABLE',expectedBusinessDate:scope.businessDate}})}>{machine.operationalStatus==='AVAILABLE'?'Mark Out of Service':'Restore Available'}</button>}
        <h3 className="font-bold">Recent completed plays (latest {detail.historyLimit})</h3>{detail.recentPlays.length===0?<p>No completed plays.</p>:detail.recentPlays.map(p=><p key={p.id}>{p.customerCode} · {p.customerName} · {p.sessionCode} · {p.businessDate} · {p.startedAt} → {p.endedAt}</p>)}
      </>}</>}
    </section></div>}
  </div>
}
export default function SlotMachineGaming(){const {user}=useAuth();return <Machines key={`${user?.id||user?.username}:${user?.role}`} user={user}/>}
