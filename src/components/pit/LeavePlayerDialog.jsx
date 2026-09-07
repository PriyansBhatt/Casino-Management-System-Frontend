import { useEffect, useMemo, useRef, useState } from 'react'
import DenominationQuantityInput from './DenominationQuantityInput'
import { Dialog } from './AddPlayerDialog'

const money = (value) => `NPR ${Number(value || 0).toLocaleString('en-IN')}`

const normalizedDenominations = (denominations, quantities) => Object.fromEntries(
  denominations
    .map((denomination) => [String(denomination), Number(quantities[denomination] || 0)])
    .filter(([, quantity]) => quantity > 0),
)

const LeavePlayerDialog = ({
  player,
  tableCode,
  denominations,
  availability,
  operational,
  pending,
  onLeave,
  onClose,
}) => {
  const [quantities, setQuantities] = useState({})
  const [zeroConfirmed, setZeroConfirmed] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const requestRef = useRef(null)
  const secureRequestAvailable = Boolean(globalThis.crypto?.randomUUID)

  const settlement = useMemo(
    () => normalizedDenominations(denominations, quantities),
    [denominations, quantities],
  )
  const signature = JSON.stringify(settlement)
  const total = Object.entries(settlement).reduce(
    (sum, [denomination, quantity]) => sum + Number(denomination) * quantity, 0,
  )
  const activePlayer = player.status === 'ACTIVE'
  const exceedsAvailability = Object.entries(settlement).some(
    ([denomination, quantity]) => quantity > Number(availability?.[denomination] || 0),
  )
  const canSubmit = operational && activePlayer && secureRequestAvailable && !pending
    && !exceedsAvailability && (total > 0 || zeroConfirmed)

  useEffect(() => {
    requestRef.current = null
    setSubmitError('')
    setZeroConfirmed(false)
  }, [player.assignmentId, signature])

  useEffect(() => {
    const escape = (event) => { if (event.key === 'Escape' && !pending) onClose() }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [onClose, pending])

  const confirm = async () => {
    if (!canSubmit) return
    if (!requestRef.current || requestRef.current.signature !== signature) {
      requestRef.current = {
        signature,
        payload: {
          denominations: settlement,
          idempotencyKey: globalThis.crypto.randomUUID(),
        },
      }
    }

    setSubmitError('')
    const outcome = await onLeave(player, requestRef.current.payload)
    if (!outcome?.success) {
      setSubmitError(outcome?.message || 'Table leave could not be confirmed.')
    }
  }

  return (
    <Dialog title="Leave Table" onClose={onClose} disabled={pending}>
      <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex justify-between gap-3">
          <div><strong>{player.customerName}</strong><p className="text-sm font-semibold text-slate-500">{player.customerCode}</p></div>
          <div className="text-right"><strong>{tableCode}</strong><p className="font-mono text-xs text-slate-500">{player.sessionCode}</p></div>
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-600">
          This ends only the customer’s assignment to this Pit Table. The casino session remains OPEN.
          Enter any physical chips to return from aggregate table custody to the customer session first.
        </p>
      </section>

      <div className="mt-4">
        <DenominationQuantityInput denominations={denominations} quantities={quantities}
          availability={availability} onChange={setQuantities} disabled={pending || !operational} />
      </div>

      <section className={`mt-4 rounded-xl border p-4 ${total === 0
        ? 'border-amber-300 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
        <p className="font-black">Settlement confirmation</p>
        {total === 0 ? (
          <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm font-semibold text-amber-900">
            <input type="checkbox" checked={zeroConfirmed} disabled={pending || !operational}
              onChange={(event) => setZeroConfirmed(event.target.checked)} className="mt-0.5 h-5 w-5" />
            <span>Leave Table Without Returning Chips. The table assignment will end and no physical chips will be returned to the customer session.</span>
          </label>
        ) : (
          <>
            <p className="mt-2 text-sm font-semibold text-emerald-900">
              Return {Object.entries(settlement).map(([denomination, quantity]) => `NPR ${Number(denomination).toLocaleString('en-IN')} × ${quantity}`).join(' · ')}.
            </p>
            <p className="mt-1 text-lg font-black text-emerald-900">Total physical return: {money(total)}</p>
          </>
        )}
        {!operational && <p className="mt-3 text-sm font-black text-red-700">This table is no longer available for operational changes.</p>}
        {!activePlayer && <p className="mt-3 text-sm font-black text-red-700">This player assignment is no longer ACTIVE.</p>}
        {exceedsAvailability && <p className="mt-3 text-sm font-black text-red-700">Entered quantities exceed the latest confirmed table custody.</p>}
        {!secureRequestAvailable && <p className="mt-3 text-sm font-black text-red-700">Secure request processing is unavailable in this browser.</p>}
      </section>

      {submitError && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{submitError}</p>}
      <div className="mt-5 flex gap-3">
        <button type="button" onClick={onClose} disabled={pending}
          className="min-h-12 flex-1 rounded-xl border border-slate-300 font-black disabled:opacity-40">Cancel</button>
        <button type="button" onClick={confirm}
          disabled={!canSubmit}
          className="min-h-12 flex-1 rounded-xl bg-red-600 font-black text-white disabled:opacity-40">
          {pending ? 'Leaving…' : total === 0 ? 'Confirm Leave Without Chips' : 'Confirm Return & Leave'}
        </button>
      </div>
    </Dialog>
  )
}

export default LeavePlayerDialog
