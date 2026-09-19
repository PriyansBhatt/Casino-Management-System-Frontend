import { useEffect, useMemo, useRef, useState } from 'react'
import useAuth from '../../hooks/useAuth'
import api from '../../api/accountsApi'
import PendingOperation from '../../components/ui/PendingOperation'
import { ACCOUNTS_ROLES, BILL_STATES, isPreparer, actionsFor, intent, fileMetadata, createAccountsManager } from '../../utils/accounts'

const emptyInvoice = () => ({ partyId: '', invoiceReference: '', invoiceDate: '', dueDate: '', currency: 'NPR', subtotal: '', discount: '0', tax: '0', total: '', lines: [{ description: '', amount: '' }], sources: [] })
const labels = { submit: 'Submit for Verification', verify: 'Verify Invoice', approve: 'Approve for Payment', hold: 'Hold', resume: 'Resume Review', return: 'Return for Correction', reject: 'Reject Bill', corrections: 'Save Correction', create: 'Create Draft', party: 'Create Party', upload: 'Store Evidence' }
const field = 'rounded border border-slate-300 p-2 w-full'
const button = 'rounded border px-3 py-2 disabled:opacity-40'
function ReadState({ value }) { return value?.loading ? <p role="status">Loading authoritative records…</p> : value?.error ? <p role="alert" className="text-red-700">{value.error}</p> : null }
export default function AccountsBills() {
  const { user } = useAuth(), [storedState, setState] = useState({}), [search, setSearch] = useState(''), [status, setStatus] = useState(''), [page, setPage] = useState(0)
  const authority = `${user?.id || user?.username}:${user?.role}`, state = storedState.owner === authority ? storedState : {}
  const manager = useMemo(() => createAccountsManager({ api, user, notify: next => setState({ ...next, owner: authority }) }), [user?.id, user?.username, user?.role])
  const [selected, setSelected] = useState(null), [form, setForm] = useState(null), [confirmation, setConfirmation] = useState(null), [reason, setReason] = useState(''), [error, setError] = useState('')
  const [partyForm, setPartyForm] = useState(null), [partySearch, setPartySearch] = useState(''), [sourceType, setSourceType] = useState('PROCUREMENT'), [sourceSearch, setSourceSearch] = useState('')
  const [file, setFile] = useState(null), [invoiceDocument, setInvoiceDocument] = useState(true), [replacesId, setReplacesId] = useState(''), [preparing, setPreparing] = useState(false), [historyKind, setHistoryKind] = useState('decisions'), [historyPage, setHistoryPage] = useState(0)
  const preparation = useRef(0), detail = state.detail?.data, canPrepare = isPreparer(user?.role), allowed = actionsFor({ ...user, id: state.context?.data?.actorId }, detail)
  const locked = state.working || preparing || Boolean(confirmation), businessDate = state.context?.data?.businessDate
  useEffect(() => { manager.activate(); setSelected(null); setForm(null); setConfirmation(null); setPartyForm(null); setFile(null); setPreparing(false); manager.load('context','context'); return () => { preparation.current++; manager.dispose() } }, [manager])
  useEffect(() => { manager.load('main','bills',{ q: search, status, page, size: 25 }) }, [manager, search, status, page])
  useEffect(() => { if (canPrepare) manager.load('parties','parties',{ q: partySearch, size: 100 }) }, [manager, canPrepare, partySearch])
  useEffect(() => { if (form) manager.load('sources','sources',{ type: sourceType, q: sourceSearch, size: 50 }) }, [manager, Boolean(form), sourceType, sourceSearch])
  useEffect(() => { if (selected) manager.load('history',historyKind,{ id: selected, page: historyPage, size: 25 }); else manager.invalidate('history') }, [manager, selected, historyKind, historyPage])
  const select = id => { preparation.current++; setSelected(id); setForm(null); setFile(null); setReason(''); setError(''); setReplacesId(''); setHistoryPage(0); manager.invalidate('download'); manager.invalidate('history'); manager.load('detail','detail',{ id }) }
  const refresh = async result => {
    const scope = preparation.current
    manager.invalidate('history')
    setConfirmation(null); setForm(null); setPartyForm(null); setFile(null)
    const outcomes = await Promise.all([manager.load('main','bills',{ q: search, status, page, size: 25 }), manager.load('context','context'), ...(canPrepare ? [manager.load('parties','parties',{ q: partySearch, size: 100 })] : [])])
    if (!manager.isCurrent() || scope !== preparation.current) return
    if (result && confirmation?.operationType !== 'party' && manager.recovery.operation?.operationType !== 'party') {
      // Bill selection is bound to the completed result, never a newly selected row.
      const ok = await manager.load('detail','detail',{ id: result.id }); outcomes.push(ok); if (!manager.isCurrent() || scope !== preparation.current) return; setSelected(result.id); setHistoryPage(0); setReplacesId('')
      if (ok) outcomes.push(await manager.load('history',historyKind,{ id: result.id, page: 0, size: 25 }))
    } else if (selected) {
      outcomes.push(await manager.load('detail','detail',{ id: selected }))
      if (!manager.isCurrent() || scope !== preparation.current) return
      outcomes.push(await manager.load('history',historyKind,{ id: selected, page: historyPage, size: 25 }))
    }
    if (!manager.isCurrent() || scope !== preparation.current) return
    if (outcomes.some(ok => !ok)) throw Error('Refresh failed')
  }
  const execute = async retry => {
    const scope = preparation.current
    setError(''); const kind = retry ? manager.recovery.operation?.operationType : confirmation?.operationType
    try { await manager.submit(confirmation, async result => { if (kind === 'party') { setConfirmation(null); setPartyForm(null); if (!await manager.load('parties','parties',{ q: '', size: 100 })) throw Error('Refresh failed') } else await refresh(result) }, retry, file) }
    catch (e) { if (manager.isCurrent() && scope === preparation.current) setError(e?.response?.data?.message || e.message) }
  }
  const target = () => ({ id: detail.bill.id, label: `${detail.snapshot.partyName} / ${detail.bill.invoice_reference} / revision ${detail.bill.revision}`, amount: detail.snapshot.invoice.total, revision: detail.bill.revision, evidenceIds: detail.snapshot.evidenceIds, verification: detail.verification ? { id: detail.verification.id, actor: detail.verification.actor_name || detail.verification.actor_id, time: detail.verification.decided_at, evidenceDigest: detail.verification.evidence_digest } : null })
  const review = action => {
    if (['hold','return','reject'].includes(action) && !reason.trim()) { setError('A reason is required.'); return }
    setError(''); setConfirmation(intent(action, target(), { expectedVersion: detail.bill.version, reason: reason.trim() }))
  }
  const prepareUpload = async () => {
    if (preparing || !detail) return
    const n = ++preparation.current, frozenTarget = target(), version = detail.bill.version, originalFile = file
    setPreparing(true); setError('')
    try { const meta = await fileMetadata(originalFile); if (n === preparation.current) setConfirmation(intent('upload', frozenTarget, { expectedVersion: version, invoiceDocument, replacesId: replacesId || null, file: meta })) }
    catch (e) { if (n === preparation.current) setError(e.message) } finally { if (n === preparation.current) setPreparing(false) }
  }
  const save = e => {
    e.preventDefault(); setError('')
    const invoice = { ...form.invoice, dueDate: form.invoice.dueDate || null }
    setConfirmation(intent(form.id ? 'corrections' : 'create', { id: form.id, label: invoice.invoiceReference, amount: invoice.total }, { invoice, expectedVersion: form.version, expectedBusinessDate: form.id ? null : businessDate }))
  }
  const download = async e => {
    setError('')
    try { await manager.download(selected, e.id, blob => {
      const url = URL.createObjectURL(blob)
      try { const a = document.createElement('a'); a.href = url; a.download = e.original_name; a.click() }
      finally { setTimeout(() => URL.revokeObjectURL(url), 1000) }
    }) } catch (error) { setError(error.message || 'Evidence unavailable.') }
  }
  if (!ACCOUNTS_ROLES.includes(user?.role)) return <p role="alert">Accounts access is not permitted.</p>
  return <main className="space-y-5 p-6">
    <div><h1 className="text-2xl font-bold">Accounts · Bill Register</h1><p>Verification and vendor bills share this register. Approval authorizes a future payment; AC1 never pays a bill.</p></div>
    <p>New recording Business Date: {state.context?.data ? businessDate || 'Unavailable — no OPEN Business Date' : 'Unavailable'}. Existing reviews retain the original recording date.</p>
    <ReadState value={state.context} />
    {state.message && <p role="status" className="rounded bg-green-50 p-3">{state.message}</p>}{(error || state.mutationError) && <p role="alert" className="text-red-700">{error || state.mutationError}</p>}
    <PendingOperation store={manager.recovery} retry={() => execute(true)} changed={() => setConfirmation(null)} />
    {manager.recovery.operation?.operationType === 'upload' && <label>Reselect the exact original file to retry (bytes are never saved in browser recovery)<input type="file" accept="application/pdf,image/jpeg,image/png" onChange={e => setFile(e.target.files?.[0] || null)} /></label>}
    <div className="flex flex-wrap gap-3">
      <input aria-label="Search bills" className={field + ' max-w-xs'} placeholder="Invoice reference or party" value={search} disabled={locked} onChange={e => { setSearch(e.target.value); setPage(0) }} />
      <select aria-label="Bill state" className={field + ' max-w-xs'} value={status} disabled={locked} onChange={e => { setStatus(e.target.value); setPage(0) }}><option value="">All visible bills</option>{BILL_STATES.map(s => <option key={s}>{s}</option>)}</select>
      <button className={button} disabled={locked} onClick={() => refresh().catch(e => setError(e.message))}>Refresh</button>
      {canPrepare && <><button className={button} disabled={locked || !businessDate || Boolean(manager.recovery.operation)} onClick={() => { setForm({ id: null, version: null, invoice: emptyInvoice() }); setPartyForm(null) }}>New Bill</button><button className={button} disabled={locked} onClick={() => setPartyForm({ code: '', name: '', kind: 'SUPPLIER' })}>New Party</button></>}
    </div>
    <ReadState value={state.main} />
    {state.main?.data && <><div className="overflow-x-auto rounded border bg-white"><table className="w-full text-left"><thead><tr>{['Party','Invoice','Recorded Business Date','NPR total','State','Revision',''].map(t => <th key={t} className="p-3">{t}</th>)}</tr></thead><tbody>{state.main.data.items.map(b => <tr key={b.id} className="border-t"><td className="p-3">{b.party_name}</td><td>{b.invoice_reference}</td><td>{b.business_date}</td><td>{b.total}</td><td>{b.status}</td><td>{b.revision}</td><td><button className={button} disabled={locked} onClick={() => select(b.id)}>View</button></td></tr>)}</tbody></table>{state.main.data.items.length === 0 && <p className="p-4">No bills in this authorized view.</p>}</div><div className="flex gap-3"><button disabled={locked || page === 0} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page + 1}</span><button disabled={locked || !state.main.data.hasMore} onClick={() => setPage(page + 1)}>Next</button></div></>}
    {partyForm && canPrepare && storedState.owner === authority && <form className="space-y-3 rounded border bg-white p-4" onSubmit={e => { e.preventDefault(); setConfirmation(intent('party',{ label: partyForm.name },partyForm)) }}><h2>Stable Party Identity</h2><p>Use the existing party when available. Party identities cannot be renamed in AC1.</p>{['code','name'].map(k => <label key={k}>{k}<input className={field} required value={partyForm[k]} disabled={locked} onChange={e => setPartyForm({ ...partyForm,[k]: e.target.value })} /></label>)}<select className={field} disabled={locked} value={partyForm.kind} onChange={e => setPartyForm({ ...partyForm,kind: e.target.value })}>{['SUPPLIER','HOTEL','OTHER'].map(v => <option key={v}>{v}</option>)}</select><button className={button} disabled={locked}>Review Party Creation</button><button type="button" className={button} disabled={locked} onClick={() => setPartyForm(null)}>Cancel</button></form>}
    {form && canPrepare && storedState.owner === authority && <form onSubmit={save} className="space-y-3 rounded border bg-white p-4"><h2 className="text-lg font-bold">{form.id ? 'Correct Returned / Draft Bill' : 'New Draft Bill'}</h2><label>Find existing party<input className={field} value={partySearch} disabled={locked} onChange={e => setPartySearch(e.target.value)} /></label><ReadState value={state.parties} />
      <label>Party<select className={field} required value={form.invoice.partyId} disabled={locked || !state.parties?.data} onChange={e => setForm({ ...form,invoice: { ...form.invoice,partyId: e.target.value } })}><option value="">Select stable party</option>{state.parties?.data?.items.map(p => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></label>
      <div className="grid gap-3 md:grid-cols-3">{['invoiceReference','invoiceDate','dueDate','subtotal','discount','tax','total'].map(k => <label key={k}>{k} {['subtotal','discount','tax','total'].includes(k) && '(NPR)'}<input className={field} type={k.endsWith('Date') ? 'date' : 'text'} required={k !== 'dueDate'} disabled={locked} value={form.invoice[k] ?? ''} onChange={e => setForm({ ...form,invoice: { ...form.invoice,[k]: e.target.value } })} /></label>)}</div>
      <p>Enter explicit invoice amounts. Lines must sum to subtotal; total = subtotal − discount + tax. No rounding or tax rates are supplied.</p>
      {form.invoice.lines.map((line,index) => <div key={index} className="flex gap-2"><input aria-label={`Line ${index + 1} description`} className={field} required disabled={locked} value={line.description} onChange={e => setForm({ ...form,invoice: { ...form.invoice,lines: form.invoice.lines.map((l,i) => i === index ? { ...l,description: e.target.value } : l) } })} /><input aria-label={`Line ${index + 1} NPR amount`} className={field} required disabled={locked} value={line.amount} onChange={e => setForm({ ...form,invoice: { ...form.invoice,lines: form.invoice.lines.map((l,i) => i === index ? { ...l,amount: e.target.value } : l) } })} /><button type="button" disabled={locked || form.invoice.lines.length === 1} onClick={() => setForm({ ...form,invoice: { ...form.invoice,lines: form.invoice.lines.filter((_,i) => i !== index) } })}>Remove</button></div>)}
      <button type="button" className={button} disabled={locked || form.invoice.lines.length >= 100} onClick={() => setForm({ ...form,invoice: { ...form.invoice,lines: [...form.invoice.lines,{ description: '',amount: '' }] } })}>Add Line</button>
      <fieldset className="space-y-2 rounded border p-3"><legend>Read-only Source References (optional)</legend><select disabled={locked} value={sourceType} onChange={e => { manager.invalidate('sources'); setSourceType(e.target.value) }}>{['PROCUREMENT','RECEIPT','HOTEL'].map(v => <option key={v}>{v}</option>)}</select><input aria-label="Search sources" placeholder="Search reference" value={sourceSearch} disabled={locked} onChange={e => setSourceSearch(e.target.value)} /><ReadState value={state.sources} /><select value="" disabled={locked || !state.sources?.data || form.invoice.sources.length >= 20} onChange={e => { if (e.target.value && !form.invoice.sources.some(s => s.type === sourceType && s.id === e.target.value)) setForm({ ...form,invoice: { ...form.invoice,sources: [...form.invoice.sources,{ type: sourceType,id: e.target.value }] } }) }}><option value="">Add source</option>{state.sources?.data?.items.map(s => <option key={s.id} value={s.id}>{s.reference}</option>)}</select>{form.invoice.sources.map((s,i) => <p key={s.type + s.id}>{s.type} · {s.id} <button type="button" disabled={locked} onClick={() => setForm({ ...form,invoice: { ...form.invoice,sources: form.invoice.sources.filter((_,n) => n !== i) } })}>Remove link</button></p>)}</fieldset>
      <button className={button} disabled={locked || !state.parties?.data || (!form.id && !businessDate)}>Review Bill</button><button type="button" className={button} disabled={locked} onClick={() => setForm(null)}>Cancel</button>
    </form>}
    <ReadState value={state.detail} />
    {detail && <section className="space-y-4 rounded border bg-white p-5" aria-label="Bill detail"><h2 className="text-xl font-bold">{detail.snapshot.partyName} · {detail.bill.invoice_reference}</h2><p>{detail.bill.status} · Revision {detail.bill.revision} · Recording Business Date {detail.bill.business_date}</p><p>Invoice date {detail.snapshot.invoice.invoiceDate} · Due {detail.snapshot.invoice.dueDate || 'Not supplied'}</p><p>Subtotal NPR {detail.snapshot.invoice.subtotal} − Discount {detail.snapshot.invoice.discount} + Tax {detail.snapshot.invoice.tax} = <strong>NPR {detail.snapshot.invoice.total}</strong></p><ul>{detail.snapshot.invoice.lines.map((l,i) => <li key={i}>{l.description} — NPR {l.amount}</li>)}</ul><ul>{detail.snapshot.sourceSnapshots.map(s => <li key={s.type + s.id}>{s.type}: {s.reference} · {s.id}</li>)}</ul>
      <p>Original preparer: {detail.bill.recorded_by}. Corrections require this person with a current preparer role. No reassignment or takeover is available in AC1.</p>
      {detail.verification && <p className="rounded bg-blue-50 p-3">Verified by {detail.verification.actor_name || detail.verification.actor_id} at {detail.verification.decided_at}; revision {detail.verification.revision}. Evidence digest: {detail.verification.evidence_digest}</p>}
      <h3 className="font-bold">Current Evidence</h3>{detail.evidence.length === 0 && <p>No stored invoice evidence. Verification is unavailable until a valid invoice document is uploaded.</p>}{detail.evidence.map(e => <p key={e.id}><button className={button} onClick={() => download(e)}>Download {e.original_name}</button> · {e.invoice_document ? 'Invoice' : 'Supporting document'} · {e.uploader} · {e.uploaded_at} · SHA-256 {e.checksum}</p>)}
      {allowed.includes('upload') && <div className="space-y-2 rounded border p-3"><input aria-label="Invoice evidence" type="file" accept="application/pdf,image/jpeg,image/png" disabled={locked} onChange={e => setFile(e.target.files?.[0] || null)} /><label><input type="checkbox" checked={invoiceDocument} disabled={locked} onChange={e => setInvoiceDocument(e.target.checked)} /> Invoice document</label><select value={replacesId} disabled={locked} onChange={e => setReplacesId(e.target.value)}><option value="">Add evidence</option>{detail.evidence.map(e => <option key={e.id} value={e.id}>Replace {e.original_name} (preserve history)</option>)}</select><button className={button} disabled={locked || !file} onClick={prepareUpload}>Review Upload</button><p>PDF/JPEG/PNG, up to 5 MiB (5,242,880 bytes). Server validation and successful storage are required.</p></div>}
      {allowed.includes('corrections') && <button className={button} disabled={locked} onClick={() => setForm({ id: detail.bill.id,version: detail.bill.version,invoice: JSON.parse(JSON.stringify(detail.snapshot.invoice)) })}>Edit Bill</button>}
      {allowed.some(a => ['hold','return','reject'].includes(a)) && <label>Review reason<textarea className={field} maxLength={1000} disabled={locked} value={reason} onChange={e => setReason(e.target.value)} /></label>}
      <div className="flex flex-wrap gap-3">{allowed.filter(a => !['upload','corrections'].includes(a)).map(a => <button className={button} key={a} disabled={locked || Boolean(manager.recovery.operation)} onClick={() => review(a)}>{labels[a]}</button>)}</div>
      <h3 className="font-bold">History</h3><select disabled={locked} value={historyKind} onChange={e => { setHistoryKind(e.target.value); setHistoryPage(0) }}>{['decisions','revisions','evidence'].map(v => <option key={v}>{v}</option>)}</select><ReadState value={state.history} />{state.history?.data?.items.map((h,i) => <div key={h.id || h.revision || i} className="border-b p-2">{historyKind === 'evidence' ? <button className={button} onClick={() => download(h)}>Download {h.original_name} · {h.uploaded_at} · replaces {h.replaces_id || 'none'}</button> : historyKind === 'decisions' ? <p>{h.action} · {h.stage} · revision {h.revision} · {h.actor_name} · {h.decided_at} · {h.reason}</p> : <details><summary>Revision {h.revision} · {h.actor_name} · {h.created_at}</summary><pre className="whitespace-pre-wrap break-words">{JSON.stringify(h.snapshot,null,2)}</pre></details>}</div>)}<button disabled={locked || historyPage === 0} onClick={() => setHistoryPage(historyPage - 1)}>Previous history</button> <button disabled={locked || !state.history?.data?.hasMore} onClick={() => setHistoryPage(historyPage + 1)}>Next history</button>
    </section>}
    {confirmation && storedState.owner === authority && <section role="dialog" aria-modal="true" aria-label="Confirm Accounts operation" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"><div className="max-h-[85vh] max-w-2xl overflow-auto rounded bg-white p-6"><h2 className="text-xl font-bold">{labels[confirmation.operationType]}</h2><p>{confirmation.target.label} · {confirmation.target.amount != null && `NPR ${confirmation.target.amount}`} · Version {confirmation.payload.expectedVersion ?? 'new'}</p>{confirmation.operationType === 'reject' && <p className="font-bold text-red-700">Final rejection: this bill cannot be edited, reopened or resubmitted in AC1.</p>}{confirmation.operationType === 'approve' && <p>Authorize this exact verified revision and evidence set for future payment. This does not mark the bill paid.</p>}<pre className="whitespace-pre-wrap break-words">{JSON.stringify({ target: confirmation.target, payload: confirmation.payload },null,2)}</pre><button className={button} disabled={state.working} onClick={() => execute(false)}>Confirm {labels[confirmation.operationType]}</button><button className={button} disabled={state.working} onClick={() => setConfirmation(null)}>Cancel</button></div></section>}
  </main>
}
