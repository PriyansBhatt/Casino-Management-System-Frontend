import { useCallback, useEffect, useRef, useState } from 'react'
import useAuth from '../../hooks/useAuth'
import api from '../../api/fnbApi'
import FnbRequestForm from './FnbRequestForm'
import { FNB_TABS, canMutateFnb, actions, createGate, createSubmission, recordsCsv } from '../../utils/fnb'
const errorText=e=>e.response?.data?.message||e.message||'F&B unavailable'
export default function FnbKitchenBar() {
 const {user}=useAuth(), mutate=canMutateFnb(user?.role)
 const [tab,setTab]=useState('Overview'),[filters,setFilters]=useState({q:'',type:'',status:'',businessDate:'',from:'',to:''})
 const [page,setPage]=useState(null),[overview,setOverview]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[formKey,setFormKey]=useState(0),[pending,setPending]=useState([])
 const gate=useRef(createGate()),mounted=useRef(true),submission=useRef(createSubmission({namespace:user?.id||user?.username,requireStorage:true}))
 const refreshPending=()=>{try{setPending(submission.current.pendingCreates())}catch(e){setError(errorText(e))}}
 useEffect(()=>{refreshPending()},[])
 const reload=useCallback(async()=>{
  const generation=gate.current.next();setPage(null);setOverview(null);setLoading(true);setError('')
  const params=Object.fromEntries(Object.entries(tab==='Records'?filters:{q:filters.q,type:filters.type,status:filters.status,live:true}).filter(([,v])=>v!==''))
  try { const [records,summary]=await Promise.all([api.records(params),api.overview()]);
   if(records.currentBusinessDate!==summary.businessDate)throw new Error('Business Date changed during refresh. Refresh again.')
   if(gate.current.current(generation)&&mounted.current){setPage(records);setOverview(summary)}
  }catch(e){if(gate.current.current(generation)&&mounted.current)setError(errorText(e));throw e}
  finally{if(gate.current.current(generation)&&mounted.current)setLoading(false)}
 },[tab,filters])
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;gate.current.next()}},[])
 useEffect(()=>{reload().catch(()=>{})},[reload])
 const invalidate=()=>{gate.current.next();setPage(null);setOverview(null);setLoading(true)}
 const perform=async(target,payload,operation)=>{
  if(!mutate)return;let frozen;try{frozen=submission.current.begin(target,payload)}catch(e){setError(errorText(e));return}if(!frozen)return
  setBusy(true);setError('');setMessage('');let confirmed=false, rejected=false
  try{await operation(frozen);confirmed=true;if(mounted.current){setMessage('Request saved successfully.');setFormKey(k=>k+1);try{await reload()}catch{setMessage('Request saved successfully. Refresh failed; reload for current records.')}}}
  catch(e){rejected=e.response?.status>=400&&e.response?.status<500&&![408,429].includes(e.response?.status);if(mounted.current){setError(errorText(e));if(e.response?.status===409){invalidate();try{await reload()}catch{}setError(errorText(e))}}}
  finally{submission.current.finish(confirmed||rejected);if(mounted.current){setBusy(false);refreshPending()}}
 }
 const save=payload=>perform('create',payload,f=>api.create({...f.payload,idempotencyKey:f.key}))
 const change=(row,status)=>{const id=row.id;return perform(id,{status,expectedVersion:row.version},f=>api.change(f.target,f.payload))}
 const csv=()=>{if(!page)return;const url=URL.createObjectURL(new Blob([recordsCsv(page.records)],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='fnb-records.csv';a.click();URL.revokeObjectURL(url)}
 return <div className="space-y-5"><h1 className="text-3xl font-bold">F&B / Kitchen / Bar</h1><p>All guest food and beverages are complimentary. Times are Kathmandu local time.</p>
 <nav className="flex flex-wrap gap-3">{FNB_TABS.map(t=><button disabled={busy} key={t} className={`rounded border p-3 ${t===tab?'bg-amber-400':'bg-white'}`} onClick={()=>{invalidate();setTab(t)}}>{t}</button>)}</nav>
 <p>Current OPEN Business Date: {overview?.businessDate||'Unavailable'}</p>
 <div className="flex flex-wrap gap-3"><button disabled={busy} className="rounded border p-3" onClick={()=>reload().catch(()=>{})}>Refresh</button>{tab!=='New Request'&&<>
 <input disabled={busy} aria-label="Customer, CID, item or location" placeholder="Customer / CID / item / location" value={filters.q} onChange={e=>{invalidate();setFilters(f=>({...f,q:e.target.value}))}}/>
 <select disabled={busy} aria-label="Type" value={filters.type} onChange={e=>{invalidate();setFilters(f=>({...f,type:e.target.value}))}}><option value="">All</option><option value="FOOD">Food</option><option value="BEVERAGE">Beverage</option></select>
 <select disabled={busy} aria-label="Status" value={filters.status} onChange={e=>{invalidate();setFilters(f=>({...f,status:e.target.value}))}}><option value="">All statuses</option>{(tab==='Records'?['PENDING','PREPARING','READY','DELIVERED','CANCELLED']:['PENDING','PREPARING','READY']).map(s=><option key={s}>{s}</option>)}</select>
 {tab==='Records'&&['businessDate','from','to'].map(k=><label key={k}>{k}<input disabled={busy} type="date" value={filters[k]} onChange={e=>{invalidate();setFilters(f=>({...f,[k]:e.target.value}))}}/></label>)}
 </>}</div>
 {message&&<p role="status" className="rounded bg-emerald-50 p-3 text-emerald-800">{message}</p>}{error&&<p role="alert" className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
 {mutate&&pending.length>0&&<section className="space-y-3 rounded border border-amber-400 bg-amber-50 p-4"><h2 className="font-bold">Unconfirmed requests</h2><p>Retry these saved requests to resolve their outcome. The original Business Date and request key are preserved, even after rollover. Do not re-enter them as new requests.</p>{pending.map(p=><div key={p.key} className="flex flex-wrap items-center gap-3"><span>{p.payload.item} × {p.payload.quantity} · {p.payload.location} · Customer: {p.payload.customerId} · Business Date: {p.payload.expectedBusinessDate}</span><button disabled={busy} className="rounded border p-3" onClick={()=>save(p.payload)}>Retry saved request</button></div>)}</section>}
 {loading?<p>Loading authoritative requests…</p>:!page?<p>Authoritative F&B data unavailable.</p>:<>
 {tab==='Overview'&&<><p>Live counts include earlier Business Dates. Delivered totals use the operational Business Date recorded at delivery. Original request Business Dates are preserved. Cards are unfiltered; filters below scope the live list.</p><div className="grid gap-3 md:grid-cols-4">{[['active','Active Requests'],['pending','Pending'],['preparing','Preparing'],['ready','Ready'],['delivered','Delivered — Business Date'],['food','Food Quantity Issued — Business Date'],['beverage','Beverage Quantity Issued — Business Date']].map(([k,label])=><div className="rounded border bg-white p-4" key={k}><p>{label}</p><b>{overview?.available?overview.metrics[k]:'Unavailable'}</b></div>)}</div></>}
 {tab==='New Request'?(mutate?<FnbRequestForm key={formKey} busy={busy} businessDate={overview?.businessDate} onSave={save}/>:<p>DIRECTOR access is read-only.</p>):<>
 <p>Up to 100 records, newest first. {tab==='Records'?'Dates filter persisted Business Date.':'Live requests include outstanding work from earlier Business Dates.'}</p>
 {tab==='Records'&&<button className="rounded border p-3" onClick={csv}>Export loaded CSV</button>}
 <div className="overflow-auto rounded border bg-white"><table className="w-full text-left text-sm"><thead><tr>{['Request / Business Date','Times','Customer / CID','Type / Department','Item / Quantity','Location / Remarks','Status','Staff','Actions'].map(h=><th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{page.records.map(r=><tr className="border-t" key={r.id}><td className="p-3">{r.id}<br/>{r.businessDate}</td><td>{r.requestedAt}<br/>Delivered: {r.deliveredAt||'Not delivered'}<br/>Delivery Business Date: {r.deliveredBusinessDate||'Not delivered'}</td><td>{r.customerName}<br/>{r.customerCode}</td><td>{r.type}<br/>{r.department}</td><td>{r.item}<br/>{r.quantity}</td><td>{r.location}<br/>{r.remarks}</td><td>{r.status}</td><td>Requested: {r.requester}<br/>Handled: {r.handler||'Not handled'}</td><td>{mutate&&actions(r.status).map(s=><button disabled={busy||!overview?.available} key={s} className="m-1 rounded border p-3" onClick={()=>change(r,s)}>{s}</button>)}</td></tr>)}</tbody></table>{page.records.length===0&&<p className="p-4">No requests in this scope.</p>}</div>
 </>}
 </>}
 </div>
}
