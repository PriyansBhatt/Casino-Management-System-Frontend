import { useEffect, useMemo, useRef, useState } from 'react'
import { Dialog } from './AddPlayerDialog'
import DenominationQuantityInput from './DenominationQuantityInput'

export const TABLE_RESULT_ACTIONS = Object.freeze({ WIN: 'WIN', LOSS: 'LOSS' })

const money = (value) => `NPR ${Number(value || 0).toLocaleString('en-IN')}`

const normalizedDenominations = (denominations, quantities) => Object.fromEntries(
  denominations
    .map((denomination) => [String(denomination), Number(quantities[denomination] || 0)])
    .filter(([, quantity]) => quantity > 0),
)

const TableModeResultDialog = ({
  resultType,
  player,
  tableCode,
  tableName,
  denominations,
  operational,
  pending,
  onSubmit,
  onClose,
}) => {
  const [quantities, setQuantities] = useState({})
  const [submitError, setSubmitError] = useState('')
  const requestRef = useRef(null)
  const secureRequestAvailable = Boolean(globalThis.crypto?.randomUUID)

  const resultDenominations = useMemo(
    () => normalizedDenominations(denominations, quantities),
    [denominations, quantities],
  )
  const signature = JSON.stringify(resultDenominations)
  const total = Object.entries(resultDenominations).reduce(
    (sum, [denomination, quantity]) => sum + Number(denomination) * quantity, 0,
  )
  const activePlayer = player.status === 'ACTIVE'
  const canSubmit = operational && activePlayer && secureRequestAvailable && !pending && total > 0

  useEffect(() => {
    requestRef.current = null
    setSubmitError('')
  }, [player.assignmentId, resultType, signature])

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
          denominations: resultDenominations,
          idempotencyKey: globalThis.crypto.randomUUID(),
        },
      }
    }
    setSubmitError('')
    const outcome = await onSubmit(player, resultType, requestRef.current.payload)
    if (!outcome?.success) {
      setSubmitError(outcome?.message || `The verified ${resultType} could not be confirmed.`)
    }
  }

  return (
    <Dialog title={`Record verified ${resultType}`} onClose={onClose} disabled={pending}>
      <section className={`mt-4 rounded-xl border p-4 ${resultType === TABLE_RESULT_ACTIONS.WIN
        ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
        <div className="flex justify-between gap-3">
          <div><strong>{player.customerName}</strong><p className="text-sm font-semibold text-slate-500">{player.customerCode}</p></div>
          <div className="text-right"><strong>{tableCode}</strong><p className="text-xs font-semibold text-slate-500">{tableName || 'Table'} · {player.sessionCode}</p></div>
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-700">
          This records a verified gaming result. It does not move physical chip custody.
        </p>
      </section>

      <div className="mt-4">
        <DenominationQuantityInput denominations={denominations} quantities={quantities}
          totalLabel={`Total verified ${resultType}`} onChange={setQuantities}
          disabled={pending || !operational || !activePlayer} />
      </div>

      <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="font-black">Confirm verified {resultType}</p>
        {total > 0 ? (
          <>
            <p className="mt-2 text-sm font-semibold text-slate-700">
              {Object.entries(resultDenominations).map(([denomination, quantity]) => `NPR ${Number(denomination).toLocaleString('en-IN')} × ${quantity}`).join(' · ')}
            </p>
            <p className="mt-1 text-xl font-black">{money(total)}</p>
          </>
        ) : <p className="mt-2 text-sm font-semibold text-slate-600">Select at least one chip denomination quantity.</p>}
        {!activePlayer && <p className="mt-2 text-sm font-black text-red-700">This player assignment is no longer ACTIVE.</p>}
        {!operational && <p className="mt-2 text-sm font-black text-red-700">This table is no longer available for operational changes.</p>}
        {!secureRequestAvailable && <p className="mt-2 text-sm font-black text-red-700">Secure request processing is unavailable in this browser.</p>}
      </section>

      {submitError && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{submitError}</p>}
      <div className="mt-5 flex gap-3">
        <button type="button" onClick={onClose} disabled={pending}
          className="min-h-12 flex-1 rounded-xl border border-slate-300 font-black disabled:opacity-40">Cancel</button>
        <button type="button" onClick={confirm} disabled={!canSubmit}
          className={`min-h-12 flex-1 rounded-xl font-black text-white disabled:opacity-40 ${resultType === TABLE_RESULT_ACTIONS.WIN
            ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {pending ? 'Recording…' : `Record ${resultType}`}
        </button>
      </div>
    </Dialog>
  )
}

export default TableModeResultDialog
