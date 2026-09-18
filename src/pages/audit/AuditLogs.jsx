import { useEffect, useRef, useState } from 'react'
import { getAuditLogs } from '../../api/auditApi'
import useAuth from '../../hooks/useAuth'
import { actorLabel, detailsLabel, timestampLabel, auditCsv, createAuditReader } from '../../utils/auditLogRead'

const blank = { search: '', businessDate: '', from: '', to: '', module: '', action: '', actorId: '' }
const button = 'rounded border px-3 py-2 disabled:opacity-50'
export default function AuditLogs() {
  const { user } = useAuth()
  const allowed = ['SUPER_ADMIN', 'DIRECTOR'].includes(user?.role)
  const [view, setView] = useState({ loading: true, data: null, error: '', page: 0 })
  const [filters, setFilters] = useState({ ...blank })
  const [selected, setSelected] = useState(null)
  const reader = useRef(null)
  if (!reader.current) reader.current = createAuditReader(getAuditLogs, setView)
  useEffect(() => { const model = reader.current; model.activate(); if (allowed) model.load(); return () => model.dispose() }, [allowed, user?.username])
  if (!allowed) return <p role="alert">Only Director or Super Admin may read audit logs.</p>
  const load = (next, page = 0) => { setSelected(null); reader.current.load(Object.fromEntries(Object.entries(next).filter(([, value]) => value)), page) }
  const change = (name, value) => { const next = { ...filters, [name]: value }; setFilters(next); load(next) }
  const exportPage = () => {
    if (!view.data || view.loading || view.error) return
    const url = URL.createObjectURL(new Blob([auditCsv(view.data.items)], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = 'audit-current-page.csv'; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url)
  }
  const fields = [['search','Search','text'],['businessDate','Business Date','date'],['from','Date From (inclusive)','datetime-local'],['to','Date To (exclusive)','datetime-local'],['module','Module','text'],['action','Action','text'],['actorId','Actor UUID','text']]
  return <div className="space-y-5">
    <header><h1 className="text-2xl font-bold">Audit Logs</h1><p>Read-only history of recorded system actions.</p><p className="text-sm text-slate-600">Actor names are current directory labels. Times are stored local timestamps; Business Date is recorded separately.</p></header>
    <div className="grid gap-3 md:grid-cols-3">{fields.map(([name,label,type]) => <label key={name}>{label}<input className="block w-full rounded border p-2" aria-label={label} type={type} maxLength={name === 'search' ? 200 : 100} value={filters[name]} onChange={e => change(name,e.target.value)} /></label>)}</div>
    <div className="flex gap-2"><button className={button} onClick={() => { setFilters({ ...blank }); load(blank) }}>Reset</button><button className={button} onClick={() => load(filters, view.page)}>Refresh</button><button className={button} disabled={view.loading || !view.data?.items.length || Boolean(view.error)} onClick={exportPage}>Export Current Page</button></div>
    {view.loading && <p role="status">Loading audit records...</p>}
    {view.error && <p role="alert">{view.error}</p>}
    {view.data && !view.loading && <>
      <p>Showing {view.data.items.length} records</p>
      {!view.data.items.length ? <p>No audit records match these filters</p> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr>{['Time','Business Date','Actor','Action','Module','Reference','Details','View'].map(label => <th className="p-2" key={label}>{label}</th>)}</tr></thead><tbody>{view.data.items.map(row => <tr key={row.id} className="border-t"><td className="p-2">{timestampLabel(row.performedAt)}</td><td>{row.businessDate || 'Not recorded'}</td><td>{actorLabel(row.actor)}{row.actor?.username && <small className="block">@{row.actor.username}</small>}</td><td>{row.actionType || 'Not recorded'}</td><td>{row.moduleName || 'Not recorded'}</td><td className="break-all">{row.entityId || 'Not recorded'}</td><td className="max-w-xs break-words">{detailsLabel(row)}</td><td><button className={button} onClick={() => setSelected(row)}>View</button></td></tr>)}</tbody></table></div>}
      <div className="flex gap-2"><button className={button} disabled={view.data.page === 0} onClick={() => load(filters,view.data.page-1)}>Previous</button><button className={button} disabled={!view.data.hasNext} onClick={() => load(filters,view.data.page+1)}>Next</button></div>
    </>}
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><section role="dialog" aria-modal="true" aria-label="Audit record" className="max-h-[90vh] w-full max-w-xl overflow-auto rounded bg-white p-6"><h2 className="text-xl font-bold">Audit record</h2><dl>{[['Audit ID',selected.id],['Timestamp',timestampLabel(selected.performedAt)],['Business Date',selected.businessDate],['Actor',actorLabel(selected.actor)],['Username',selected.actor?.username],['Actor ID',selected.actor?.id],['Action',selected.actionType],['Module',selected.moduleName],['Entity ID',selected.entityId],['Safe Details',detailsLabel(selected)]].map(([label,value]) => <div className="my-2 break-words" key={label}><dt className="font-semibold">{label}</dt><dd className="whitespace-pre-wrap">{value || 'Not recorded'}</dd></div>)}</dl><button className={button} onClick={() => setSelected(null)}>Close</button></section></div>}
  </div>
}
