import { currentActor } from '../../utils/persistedOperation.js'
import { useEffect, useState } from 'react'
export default function PendingOperation({ store, retry, allowed = true, changed = () => {} }) {
  const [, render] = useState(0), [error, setError] = useState('')
  useEffect(() => store.subscribe(() => render(n => n + 1)), [store])
  const operation = store.operation
  const wrongActor = operation && currentActor() !== operation.actorIdentity
  if (!operation && !store.issue) return null
  if (wrongActor) return <p role="alert">Authentication changed. Sign in as the original operator to recover their pending operation.</p>
  const act = async (fn) => { setError(''); try { await fn() } catch (e) { setError(e?.response?.data?.message || e.message) } }
  return <section className="my-4 rounded-lg border border-amber-400 bg-amber-50 p-4" aria-label="Pending operation recovery">
    <strong>{operation ? 'OUTCOME UNCERTAIN' : 'Recovery storage unavailable'}</strong>
    {operation && <p className="break-words">{operation.operationType} · {operation.target.label || operation.target.customerId || operation.payload.customerId || operation.target.tableId || 'Saved operation'} · Business Date: {operation.expectedBusinessDate || 'Recording-date policy applies'} · {operation.target.amount != null ? `NPR ${operation.target.amount} · ` : ''}{operation.createdAt}</p>}
    {store.issue && <p role="alert">{store.issue}</p>}{error && <p role="alert">{error}</p>}
    <div className="mt-2 flex gap-3">{operation && <button type="button" disabled={!allowed || store.pending || Boolean(store.issue)} onClick={() => act(retry)}>Retry Original</button>}
      <button type="button" disabled={store.pending} onClick={() => { if (window.confirm('Discarding the local recovery record does NOT reverse a transaction that may already have completed on the server. Check the authoritative outcome before starting a new transaction.')) act(() => { store.discard(); changed() }) }}>Discard Local Pending Operation</button></div>
  </section>
}
