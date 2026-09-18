import { useEffect, useRef, useState } from 'react'
import useAuth from '../../hooks/useAuth'
import { getManagementReport } from '../../api/reportApi'
import { TENDERS, createReportReader, money, cashierLabel, reportCsv } from '../../utils/reports'

const button='rounded border px-4 py-2 font-semibold disabled:opacity-50'
const box='rounded-xl border bg-white p-4'
const Metric=({label,value})=><div><dt className="text-sm text-slate-600">{label}</dt><dd className="mt-1 font-bold">{value}</dd></div>
function Reports() {
  const [view,setView]=useState('daily'),[date,setDate]=useState(''),[page,setPage]=useState(0)
  const [state,setState]=useState({loading:true,error:'',data:null}),[selected,setSelected]=useState(null)
  const reader=useRef(null)
  useEffect(()=>{
    const model=createReportReader(getManagementReport,next=>{setState(next);if(next.data)setDate(next.data.businessDate)})
    reader.current=model;model.load('daily')
    return ()=>{model.dispose();reader.current=null}
  },[])
  const load=(nextView=view,nextDate=date,nextPage=0)=>{
    setSelected(null);setView(nextView);setDate(nextDate);setPage(nextPage)
    if(nextDate)reader.current?.load(nextView,nextDate,nextPage)
    else reader.current?.clear()
  }
  const data=state.data
  const exportLoaded=()=>{
    if(!data||state.loading||state.error)return
    const url=URL.createObjectURL(new Blob([reportCsv(view,data)],{type:'text/csv;charset=utf-8'}))
    const a=document.createElement('a');a.href=url;a.download=`reports-${view}-${data.businessDate}${view==='reconciliations'?`-page-${page+1}`:''}.csv`;a.click();URL.revokeObjectURL(url)
  }
  return <div className="space-y-5">
    <header><h1 className="text-3xl font-bold">Reports</h1><p>Authoritative operational summaries and saved cashier reconciliation records.</p></header>
    <div className="flex flex-wrap gap-3">
      {['daily','reconciliations'].map(v=><button key={v} className={button} aria-pressed={view===v} onClick={()=>load(v,date)}>{v==='daily'?'Daily Operations':'Cashier Reconciliation'}</button>)}
    </div>
    <div className="flex flex-wrap items-end gap-3">
      <label>Business Date<input type="date" aria-label="Business Date" className="ml-3 rounded border p-2" value={date} onChange={e=>load(view,e.target.value)}/></label>
      <button className={button} onClick={()=>{setSelected(null);date?load(view,date,page):reader.current?.load(view,'',0)}}>Refresh</button>
      <button className={button} disabled={!data||state.loading||!!state.error||(view==='reconciliations'&&!data.items.length)} onClick={exportLoaded}>{view==='daily'?'Export CSV':'Export Current Page'}</button>
    </div>
    {state.loading&&<p role="status">Loading report...</p>}
    {state.error&&<p role="alert" className={box}>{state.error}</p>}
    {data&&<p>Business Date: {data.businessDate} · {data.status}</p>}
    {data&&view==='daily'&&<>
      <p className="text-sm">Kathmandu operational window: {data.windowStart} to {data.windowEnd} (exclusive). Records use their persisted Business Date.</p>
      <section className={box}><h2 className="font-bold">Guest Activity</h2><dl className="mt-3 grid gap-4 sm:grid-cols-2"><Metric label="Entry sessions" value={data.sessionEntries}/><Metric label="Distinct guests entered" value={data.distinctGuestsEntered}/></dl><p className="mt-3 text-sm">Entries belong to this Business Date. Exit-event Business Date is not recorded.</p></section>
      <div className="grid gap-4 lg:grid-cols-2">{[['buyIn','Buy-In'],['cashOut','Cash-Out']].map(([key,label])=><section className={box} key={key}><h2 className="font-bold">{label} by tender</h2><table className="mt-3 w-full text-left"><thead><tr><th>Tender</th><th>Count</th><th>Amount</th></tr></thead><tbody>{TENDERS.map(t=><tr key={t}><td>{t}</td><td>{data[key][t].count}</td><td>{money(data[key][t].amount)}</td></tr>)}</tbody></table></section>)}</div>
      <section className={box}><h2 className="font-bold">Losing Return — persisted CASH payouts</h2><dl className="mt-3 flex gap-8"><Metric label="Payout count" value={data.losingReturnCount}/><Metric label="Amount paid" value={money(data.losingReturnAmountPaid)}/></dl></section>
      <section className={box}><h2 className="font-bold">Verified Gaming — customer results</h2><dl className="mt-3 flex gap-8"><Metric label="Customer WIN" value={money(data.customerWins)}/><Metric label="Customer LOSS" value={money(data.customerLosses)}/></dl></section>
      <section className={box}><h2 className="font-bold">Reconciliation summary</h2><dl className="mt-3 flex flex-wrap gap-8"><Metric label="Submitted" value={data.submittedCount}/><Metric label="Reopened" value={data.reopenedCount}/><Metric label="Submitted variance" value={money(data.aggregateSubmittedVariance)}/></dl><p className="mt-3 text-sm">Reopened records are excluded. No submissions means variance is unavailable.</p></section>
    </>}
    {data&&view==='reconciliations'&&<section className={box}>
      <p className="mb-4">Saved submission values only. Cashier labels are current directory labels. Reopened closing amounts, variance and result are unavailable. Opening and expected closing are saved values, not live calculations.</p>
      {data.items.length===0?<p>No records for this Business Date{page>0?' on this page':''}.</p>:<div className="overflow-x-auto"><table className="w-full text-left"><thead><tr>{['Cashier','Status','Opening Cash','Expected Closing','Actual Closing','Variance','Submitted','Action'].map(x=><th className="p-2" key={x}>{x}</th>)}</tr></thead><tbody>{data.items.map(r=><tr key={r.id} className={r.lifecycleStatus==='REOPENED'?'bg-amber-50':'border-t'}><td className="p-2">{cashierLabel(r)}</td><td>{r.lifecycleStatus}<br/>{r.status || 'Result unavailable'}{r.lifecycleStatus==='REOPENED'&&<p>Closing result unavailable</p>}</td>{['openingCash','expectedClosingCash','actualClosingCash','variance'].map(k=><td className="p-2" key={k}>{money(r[k])}</td>)}<td>{r.submittedAt.replace('T',' ')}</td><td><button className={button} onClick={()=>setSelected(r)}>View</button></td></tr>)}</tbody></table></div>}
      <div className="mt-4 flex gap-3"><button className={button} disabled={page===0} onClick={()=>load(view,date,page-1)}>Previous</button><span>Page {page+1}</span><button className={button} disabled={!data.hasNext} onClick={()=>load(view,date,page+1)}>Next</button></div>
    </section>}
    {selected&&<div role="dialog" aria-modal="true" aria-label="Saved reconciliation" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"><section className={box+' max-h-[90vh] overflow-auto'}><h2 className="text-xl font-bold">Saved reconciliation</h2><p>{cashierLabel(selected)} — current directory label</p><dl className="my-4 grid gap-3 sm:grid-cols-2">{[['Business Date',selected.businessDate],['Lifecycle',selected.lifecycleStatus],['Result',selected.status || 'Unavailable'],['Basis',selected.calculationBasis],['Opening Cash',money(selected.openingCash)],['Expected Closing',money(selected.expectedClosingCash)],['Actual Closing',money(selected.actualClosingCash)],['Variance',money(selected.variance)],['Submitted',selected.submittedAt],['Reopened',selected.reopenedAt||'Not reopened']].map(([label,value])=><Metric key={label} label={label} value={value}/>)}</dl><p>Tender breakdowns were not saved with this submission and are unavailable.</p><button className={button+' mt-4'} onClick={()=>setSelected(null)}>Close</button></section></div>}
  </div>
}
export default function RunningFundsReport(){const {user}=useAuth();return <Reports key={`${user?.id||user?.username}:${user?.role}`}/>}
