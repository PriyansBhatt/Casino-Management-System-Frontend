const money = (value) => `NPR ${Number(value || 0).toLocaleString('en-IN')}`

const DenominationQuantityInput = ({
  denominations,
  quantities,
  availability,
  availabilityLabel = 'Available in table custody',
  totalLabel = 'Total physical return',
  onChange,
  disabled,
}) => {
  const setQuantity = (denomination, rawValue) => {
    const parsed = Number(rawValue)
    const whole = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0
    const maximum = availability?.[denomination]
    const next = maximum == null ? whole : Math.min(whole, Number(maximum))
    onChange({ ...quantities, [denomination]: next })
  }

  const total = denominations.reduce(
    (sum, denomination) => sum + denomination * Number(quantities[denomination] || 0), 0,
  )

  return (
    <div className="space-y-3">
      {denominations.map((denomination) => {
        const quantity = Number(quantities[denomination] || 0)
        const maximum = availability?.[denomination]
        return (
          <div key={denomination} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-slate-200 p-3">
            <div>
              <p className="font-black text-slate-900">NPR {Number(denomination).toLocaleString('en-IN')}</p>
              {maximum != null && <p className="text-xs font-semibold text-slate-500">{availabilityLabel}: {maximum}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" disabled={disabled || quantity === 0}
                aria-label={`Decrease NPR ${denomination} quantity`}
                onClick={() => setQuantity(denomination, quantity - 1)}
                className="h-11 w-11 rounded-xl border border-slate-300 text-xl font-black disabled:opacity-40">−</button>
              <input type="number" min="0" step="1" inputMode="numeric" value={quantity}
                aria-label={`NPR ${denomination} quantity`}
                disabled={disabled} onChange={(event) => setQuantity(denomination, event.target.value)}
                className="h-11 w-20 rounded-xl border border-slate-300 text-center text-lg font-black outline-none focus:border-amber-400" />
              <button type="button" disabled={disabled || (maximum != null && quantity >= Number(maximum))}
                aria-label={`Increase NPR ${denomination} quantity`}
                onClick={() => setQuantity(denomination, quantity + 1)}
                className="h-11 w-11 rounded-xl bg-amber-400 text-xl font-black text-slate-950 disabled:opacity-40">+</button>
            </div>
          </div>
        )
      })}
      <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-white">
        <span className="text-sm font-black uppercase tracking-wide">{totalLabel}</span>
        <strong className="text-xl">{money(total)}</strong>
      </div>
      <button type="button" disabled={disabled || total === 0}
        onClick={() => onChange({})} className="min-h-11 text-sm font-black text-slate-500 disabled:opacity-40">
        Clear quantities
      </button>
    </div>
  )
}

export default DenominationQuantityInput
