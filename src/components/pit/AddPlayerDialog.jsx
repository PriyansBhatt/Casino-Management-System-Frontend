import { useCallback, useEffect, useId, useRef, useState } from 'react'
import pitApi from '../../api/pitApi'
import { getErrorMessage } from '../../utils/errorUtils'

const AddPlayerDialog = ({
  operationId,
  tableCode,
  operational,
  pending,
  onAssign,
  onAuthorizationError,
  onClose,
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [selected, setSelected] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [uncertain, setUncertain] = useState(false)
  const sequenceRef = useRef(0)

  const search = useCallback(async (value) => {
    const sequence = ++sequenceRef.current
    setSearching(true)
    setSearchError('')
    try {
      const response = await pitApi.getEligiblePitTablePlayers(operationId, value)
      if (sequence === sequenceRef.current) setResults(response)
    } catch (error) {
      if (sequence === sequenceRef.current
        && error?.response?.status === 403
        && await onAuthorizationError?.(error)) return
      if (sequence === sequenceRef.current) {
        setResults([])
        setSearchError(getErrorMessage(error))
      }
    } finally {
      if (sequence === sequenceRef.current) setSearching(false)
    }
  }, [onAuthorizationError, operationId])

  useEffect(() => {
    const normalized = query.trim()
    setSelected(null)
    setSubmitError('')
    setUncertain(false)
    if (normalized.length < 2) {
      sequenceRef.current += 1
      setResults([])
      setSearching(false)
      return undefined
    }
    const timer = window.setTimeout(() => search(normalized), 300)
    return () => window.clearTimeout(timer)
  }, [query, search])

  useEffect(() => () => { sequenceRef.current += 1 }, [])

  useEffect(() => {
    const escape = (event) => { if (event.key === 'Escape' && !pending) onClose() }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [onClose, pending])

  const confirm = async () => {
    if (!selected || !operational || uncertain) return
    setSubmitError('')
    const outcome = await onAssign(selected)
    if (!outcome?.success) {
      setSubmitError(outcome?.message || 'Player assignment could not be confirmed.')
      setUncertain(Boolean(outcome?.uncertain))
      if (!outcome?.lost) search(query.trim())
    }
  }

  return (
    <Dialog title="Add Player" onClose={onClose} disabled={pending}>
      <p className="text-sm font-semibold text-slate-600">Search an active casino session by customer code, name, or session code.</p>
      <input autoFocus type="search" value={query} disabled={pending}
        aria-label="Search eligible players"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Enter at least 2 characters"
        className="mt-4 h-12 w-full rounded-xl border border-slate-300 px-4 text-base outline-none focus:border-amber-400" />
      <div className="mt-4 max-h-[38vh] space-y-2 overflow-y-auto">
        {query.trim().length < 2 && <Hint>Enter at least 2 characters.</Hint>}
        {searching && <Hint>Searching eligible casino sessions…</Hint>}
        {searchError && <ErrorText>{searchError}</ErrorText>}
        {!searching && !searchError && query.trim().length >= 2 && results.length === 0 && <Hint>No matching sessions found.</Hint>}
        {results.map((result) => (
          <button key={result.customerSessionId} type="button" disabled={!result.eligible || pending}
            onClick={() => setSelected(result)}
            className={`w-full rounded-xl border p-4 text-left ${selected?.customerSessionId === result.customerSessionId
              ? 'border-amber-400 bg-amber-50' : result.eligible ? 'border-slate-200 bg-white' : 'cursor-not-allowed border-slate-200 bg-slate-100 opacity-70'}`}>
            <div className="flex justify-between gap-3"><strong>{result.customerName}</strong><span className="font-mono text-xs font-black">{result.customerCode}</span></div>
            <p className="mt-1 font-mono text-xs text-slate-500">{result.sessionCode} · {result.badge || 'Badge unavailable'}</p>
            {!result.eligible && <p className="mt-2 text-xs font-bold text-red-600">{result.ineligibilityReason}</p>}
          </button>
        ))}
      </div>
      {selected && (
        <section className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-black">Assign {selected.customerName} to {tableCode}?</p>
          <p className="mt-1 text-sm text-slate-600">{selected.customerCode} · {selected.sessionCode}</p>
          <p className="mt-2 text-xs font-semibold text-slate-600">This assigns the current OPEN casino session to this table. It does not create a session or move chips.</p>
        </section>
      )}
      {submitError && <ErrorText>{submitError}</ErrorText>}
      {uncertain && <Hint>Do not resubmit yet. Close this dialog and refresh the authoritative table snapshot before retrying.</Hint>}
      <div className="mt-5 flex gap-3">
        <button type="button" onClick={onClose} disabled={pending} className="min-h-12 flex-1 rounded-xl border border-slate-300 font-black">Cancel</button>
        <button type="button" onClick={confirm} disabled={!selected || !operational || pending || uncertain}
          className="min-h-12 flex-1 rounded-xl bg-amber-400 font-black text-slate-950 disabled:opacity-40">
          {pending ? 'Assigning…' : 'Confirm Assignment'}
        </button>
      </div>
    </Dialog>
  )
}

export const Dialog = ({ title, children, onClose, disabled }) => {
  const titleId = useId()
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-4"
      role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3"><h2 id={titleId} className="text-2xl font-black">{title}</h2>
          <button type="button" onClick={onClose} disabled={disabled} aria-label={`Close ${title}`}
            className="h-11 w-11 rounded-xl border border-slate-200 text-xl font-black disabled:opacity-40">×</button></div>
        {children}
      </div>
    </div>
  )
}

const Hint = ({ children }) => <p className="rounded-xl bg-slate-100 p-3 text-sm font-semibold text-slate-600">{children}</p>
const ErrorText = ({ children }) => <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{children}</p>

export default AddPlayerDialog
