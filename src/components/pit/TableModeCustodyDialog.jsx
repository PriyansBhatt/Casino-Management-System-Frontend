import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import chipCustodyApi from '../../api/chipCustodyApi'
import { getErrorMessage } from '../../utils/errorUtils'
import { Dialog } from './AddPlayerDialog'
import DenominationQuantityInput from './DenominationQuantityInput'

export const TABLE_CUSTODY_ACTIONS = Object.freeze({
  CHIP_IN: 'CHIP_IN',
  RETURN: 'RETURN',
})

const money = (value) => `NPR ${Number(value || 0).toLocaleString('en-IN')}`
const newIdempotencyKey = () => globalThis.crypto?.randomUUID?.() || null

const normalizedDenominations = (denominations, quantities) => Object.fromEntries(
  denominations
    .map((denomination) => [String(denomination), Number(quantities[denomination] || 0)])
    .filter(([, quantity]) => quantity > 0),
)

const TableModeCustodyDialog = ({
  mode,
  player,
  tableId,
  tableCode,
  denominations,
  operational,
  pending,
  onSubmit,
  onAuthorizationError,
  onClose,
}) => {
  const chipIn = mode === TABLE_CUSTODY_ACTIONS.CHIP_IN
  const [inventory, setInventory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [quantities, setQuantities] = useState({})
  const [submitError, setSubmitError] = useState('')
  const sequenceRef = useRef(0)
  const requestRef = useRef(null)

  const loadCustody = useCallback(async () => {
    const sequence = ++sequenceRef.current
    setLoading(true)
    setLoadError('')
    try {
      const confirmed = chipIn
        ? await chipCustodyApi.getCustomerSessionInventory(player.customerSessionId)
        : await chipCustodyApi.getTableInventory(tableId)
      if (sequence !== sequenceRef.current) return null
      setInventory(confirmed)
      return confirmed
    } catch (error) {
      if (sequence !== sequenceRef.current) return null
      if (error?.response?.status === 403 && await onAuthorizationError?.(error)) return null
      if (sequence !== sequenceRef.current) return null
      setInventory(null)
      setLoadError(getErrorMessage(error))
      return null
    } finally {
      if (sequence === sequenceRef.current) setLoading(false)
    }
  }, [chipIn, onAuthorizationError, player.customerSessionId, tableId])

  useEffect(() => {
    loadCustody()
    return () => { sequenceRef.current += 1 }
  }, [loadCustody])

  const transfer = useMemo(
    () => normalizedDenominations(denominations, quantities),
    [denominations, quantities],
  )
  const signature = JSON.stringify(transfer)
  const total = Object.entries(transfer).reduce(
    (sum, [denomination, quantity]) => sum + Number(denomination) * quantity, 0,
  )
  const displayedAvailability = Object.fromEntries(denominations.map(
    (denomination) => [denomination, Number(inventory?.denominations?.[denomination] || 0)],
  ))
  const exceedsAvailability = Object.entries(transfer).some(
    ([denomination, quantity]) => quantity > Number(displayedAvailability[denomination] || 0),
  )
  const confirmedAvailability = Boolean(inventory?.initialized)
  const canSubmit = operational && confirmedAvailability && !loading && !loadError
    && !pending && total > 0 && !exceedsAvailability

  useEffect(() => {
    requestRef.current = null
    setSubmitError('')
  }, [mode, player.customerSessionId, signature])

  useEffect(() => {
    const escape = (event) => { if (event.key === 'Escape' && !pending) onClose() }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [onClose, pending])

  const confirm = async () => {
    if (!canSubmit) return
    if (!requestRef.current || requestRef.current.signature !== signature) {
      const idempotencyKey = newIdempotencyKey()
      if (!idempotencyKey) {
        setSubmitError('Secure request processing is unavailable in this browser.')
        return
      }
      requestRef.current = {
        signature,
        payload: { denominations: transfer, idempotencyKey },
      }
    }
    setSubmitError('')
    const outcome = await onSubmit(player, mode, requestRef.current.payload)
    if (!outcome?.success) {
      setSubmitError(outcome?.message || 'The custody transfer could not be confirmed.')
      if (!outcome?.lost) await loadCustody()
    }
  }

  const availabilityLabel = chipIn ? 'Available in customer custody' : 'Available in table custody'
  const actionTitle = chipIn ? 'CHIP-IN' : 'RETURN'

  return (
    <Dialog title={actionTitle} onClose={onClose} disabled={pending}>
      <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex justify-between gap-3">
          <div><strong>{player.customerName}</strong><p className="text-sm font-semibold text-slate-500">{player.customerCode}</p></div>
          <div className="text-right"><strong>{tableCode}</strong><p className="font-mono text-xs text-slate-500">{player.sessionCode}</p></div>
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-600">
          {chipIn
            ? 'Move physical chips from customer-session custody to table custody. This does not record a WIN or LOSS.'
            : 'Return physical chips from aggregate table custody to this customer session. This does not end the table assignment or close the casino session.'}
        </p>
      </section>

      {loading && <StateMessage>Loading custody…</StateMessage>}
      {!loading && loadError && (
        <section className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p role="alert" className="font-bold">{loadError}</p>
          <button type="button" onClick={loadCustody} className="mt-3 min-h-11 rounded-xl border border-red-300 px-4 font-black">Retry</button>
        </section>
      )}
      {!loading && !loadError && inventory && !inventory.initialized && (
        <StateMessage>Physical custody is not initialized. This transfer cannot proceed.</StateMessage>
      )}
      {!loading && !loadError && inventory?.initialized && (
        <>
          <section className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
            <span className="text-sm font-black uppercase tracking-wide">Current {chipIn ? 'customer-session' : 'table'} custody</span>
            <strong className="text-xl">{money(inventory.totalValue)}</strong>
          </section>
          <div className="mt-4">
            <DenominationQuantityInput denominations={denominations} quantities={quantities}
              availability={displayedAvailability} availabilityLabel={availabilityLabel}
              totalLabel={chipIn ? 'Total physical CHIP-IN' : 'Total physical RETURN'}
              onChange={setQuantities} disabled={pending || !operational} />
          </div>
          <section className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-black">Confirm {actionTitle}</p>
            {total > 0 ? (
              <>
                <p className="mt-2 text-sm font-semibold text-amber-900">
                  {Object.entries(transfer).map(([denomination, quantity]) => `NPR ${Number(denomination).toLocaleString('en-IN')} × ${quantity}`).join(' · ')}
                </p>
                <p className="mt-1 text-lg font-black text-amber-900">Total: {money(total)}</p>
              </>
            ) : <p className="mt-2 text-sm font-semibold text-amber-900">Select at least one chip denomination quantity.</p>}
            {exceedsAvailability && <p className="mt-2 text-sm font-black text-red-700">Entered quantities exceed the latest confirmed custody availability.</p>}
            {!operational && <p className="mt-2 text-sm font-black text-red-700">This table is no longer available for operational changes.</p>}
          </section>
        </>
      )}

      {submitError && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{submitError}</p>}
      <div className="mt-5 flex gap-3">
        <button type="button" onClick={onClose} disabled={pending}
          className="min-h-12 flex-1 rounded-xl border border-slate-300 font-black disabled:opacity-40">Cancel</button>
        <button type="button" onClick={confirm} disabled={!canSubmit}
          className="min-h-12 flex-1 rounded-xl bg-amber-400 font-black text-slate-950 disabled:opacity-40">
          {pending ? 'Posting…' : `Confirm ${actionTitle}`}
        </button>
      </div>
    </Dialog>
  )
}

const StateMessage = ({ children }) => (
  <p className="mt-4 rounded-xl bg-slate-100 p-4 text-sm font-bold text-slate-600">{children}</p>
)

export default TableModeCustodyDialog
