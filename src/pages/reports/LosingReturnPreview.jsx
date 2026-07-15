import { useState } from 'react'

const summaryCards = [
  {
    label: 'Cash-Out Paid Today',
    value: 'NPR 8,78,000',
    icon: '💸',
    border: 'border-emerald-200',
  },
  {
    label: 'Losing Return Paid',
    value: 'NPR 18,000',
    icon: '🧾',
    border: 'border-yellow-300',
  },
  {
    label: 'Transport / Other Return',
    value: 'NPR 12,000',
    icon: '🚕',
    border: 'border-sky-200',
  },
  {
    label: 'Total Outflow Today',
    value: 'NPR 9,08,000',
    icon: '💰',
    border: 'border-purple-200',
  },
  {
    label: 'Pending Review',
    value: '3',
    icon: '👁',
    border: 'border-amber-300',
  },
  {
    label: 'Mismatch / Fraud Risk',
    value: '1',
    icon: '⚠',
    border: 'border-red-300',
  },
]

const customers = {
  '051': {
    initials: 'PT',
    name: 'Priya Tamang',
    cid: 'CID-1005',
    category: 'VIP',
    session: 'SES-2026-07-15-051',
    totalBuyIn: 'NPR 4,00,000',
    verifiedTableLoss: 'NPR 1,80,000',
    verifiedMachineLoss: 'NPR 0',
    totalVerifiedLoss: 'NPR 1,80,000',
    unresolvedChips: 'NPR 40,000',
    eligibleReturn: 'NPR 18,000',
  },
  '087': {
    initials: 'RS',
    name: 'Raj Sharma',
    cid: 'CID-1001',
    category: 'VIP',
    session: 'SES-2026-07-15-087',
    totalBuyIn: 'NPR 2,50,000',
    verifiedWin: 'NPR 55,000',
    verifiedLoss: 'NPR 0',
    expectedRemainingChips: 'NPR 3,05,000',
    unresolvedChips: 'NPR 0',
  },
  '026': {
    initials: 'SR',
    name: 'Suresh Rai',
    cid: 'CID-1004',
    category: 'Standard',
    session: 'SES-2026-07-15-026',
    totalBuyIn: 'NPR 60,000',
    verifiedLoss: 'NPR 35,000',
    totalCashOut: 'NPR 0',
    unresolvedChips: 'NPR 0',
  },
}

const outflowTransactions = [
  {
    id: 'CO-2026-07-15-001',
    time: '18:42',
    type: 'Cash-Out',
    badge: '087',
    customer: 'Raj Sharma',
    base: 'Buy-In NPR 2,50,000',
    paid: 'NPR 3,05,000',
    currency: 'NPR',
    method: 'Cash',
    status: 'Posted',
  },
  {
    id: 'LR-2026-07-15-002',
    time: '19:11',
    type: 'Losing Return',
    badge: '051',
    customer: 'Priya Tamang',
    base: 'Verified Loss NPR 1,80,000',
    paid: 'NPR 18,000',
    currency: 'NPR',
    method: 'Chips',
    status: 'Mismatch Found',
  },
  {
    id: 'TR-2026-07-15-003',
    time: '17:08',
    type: 'Transport',
    badge: '026',
    customer: 'Suresh Rai',
    base: 'Loss NPR 35,000',
    paid: 'NPR 12,000',
    currency: 'NPR',
    method: 'Cash',
    status: 'Posted',
  },
  {
    id: 'CO-2026-07-15-004',
    time: '20:24',
    type: 'Cash-Out',
    badge: '112',
    customer: 'Daniel Smith',
    base: 'Buy-In NPR 15,00,000',
    paid: 'INR 80,000',
    currency: 'INR',
    method: 'Bank',
    status: 'Posted',
  },
  {
    id: 'LR-2026-07-15-005',
    time: '16:50',
    type: 'Losing Return',
    badge: '044',
    customer: 'Amit Verma',
    base: 'Verified Loss NPR 55,000',
    paid: 'NPR 5,500',
    currency: 'NPR',
    method: 'Cash',
    status: 'Auto Calculated',
  },
]

const inputClass =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'

const labelClass =
  'mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500'

const Field = ({ label, children }) => (
  <label className="block">
    <span className={labelClass}>{label}</span>
    {children}
  </label>
)

const CurrencyToggle = ({ value, onChange }) => (
  <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
    {['NPR', 'INR'].map((currency) => (
      <button
        key={currency}
        type="button"
        onClick={() => onChange(currency)}
        className={`rounded-md px-3 py-2 text-sm font-extrabold ${
          value === currency
            ? 'bg-yellow-400 text-slate-950'
            : 'text-slate-500 hover:bg-white'
        }`}
      >
        {currency}
      </button>
    ))}
  </div>
)

const PaymentMethodToggle = ({ value, onChange, includeChips = false }) => {
  const methods = includeChips ? ['Cash', 'Chips'] : ['Cash', 'Bank', 'QR', 'Card']

  return (
    <div className={`grid rounded-lg border border-slate-200 bg-slate-50 p-1 ${includeChips ? 'grid-cols-2' : 'grid-cols-4'}`}>
      {methods.map((method) => (
        <button
          key={method}
          type="button"
          onClick={() => onChange(method)}
          className={`rounded-md px-3 py-2 text-sm font-extrabold ${
            value === method
              ? 'bg-yellow-400 text-slate-950'
              : 'text-slate-500 hover:bg-white'
          }`}
        >
          {method}
        </button>
      ))}
    </div>
  )
}

const CustomerPreview = ({ customer }) => {
  if (!customer) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm font-medium text-slate-500">
        Verify badge/CID to fetch customer session
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-yellow-100 text-sm font-bold text-yellow-700">
          {customer.initials}
        </div>
        <div>
          <p className="font-bold text-slate-950">
            {customer.name} · {customer.cid}
          </p>
          <p className="text-xs text-slate-500">
            {customer.category} · Session {customer.session}
          </p>
        </div>
      </div>
    </div>
  )
}

const Row = ({ label, value, danger = false, success = false }) => (
  <div className="flex items-center justify-between gap-4 text-sm">
    <span className="font-medium text-slate-500">{label}</span>
    <span
      className={`font-extrabold ${
        danger ? 'text-red-600' : success ? 'text-emerald-600' : 'text-slate-900'
      }`}
    >
      {value}
    </span>
  </div>
)

const DenominationGrid = () => (
  <div className="grid grid-cols-5 gap-2">
    {[
      { chip: '500', qty: '0', total: '0' },
      { chip: '1000', qty: '5', total: '5,000' },
      { chip: '5000', qty: '20', total: '1,00,000' },
      { chip: '10000', qty: '10', total: '1,00,000' },
      { chip: '25000', qty: '4', total: '1,00,000' },
    ].map((item) => (
      <div key={item.chip} className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-center">
        <p className="text-[10px] font-bold text-slate-500">NPR</p>
        <p className="text-xs font-bold text-slate-700">{item.chip}</p>
        <input
          className="mt-2 h-8 w-full rounded-md border border-slate-200 bg-white text-center text-sm outline-none focus:border-yellow-400"
          defaultValue={item.qty}
        />
        <p className="mt-1 text-xs font-bold text-slate-500">{item.total}</p>
      </div>
    ))}
  </div>
)

const CashOutReturnControl = () => {
  const [losingBadge, setLosingBadge] = useState('051')
  const [cashOutBadge, setCashOutBadge] = useState('087')
  const [claimBadge, setClaimBadge] = useState('026')

  const [losingCurrency, setLosingCurrency] = useState('NPR')
  const [cashOutCurrency, setCashOutCurrency] = useState('NPR')
  const [claimCurrency, setClaimCurrency] = useState('NPR')

  const [losingMethod, setLosingMethod] = useState('Chips')
  const [cashOutMethod, setCashOutMethod] = useState('Cash')
  const [claimMethod, setClaimMethod] = useState('Cash')

  const losingCustomer = customers[losingBadge]
  const cashOutCustomer = customers[cashOutBadge]
  const claimCustomer = customers[claimBadge]

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-950">
            <span className="mr-2 text-yellow-500">◆</span>
            Cash-Out & Return Control
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Customer cash-out, losing return, transportation claim, verified wallet balance, and suspicious payout control.
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="font-extrabold">Control rule:</span> Mismatch cases must create review case with audit log.
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {summaryCards.map((card) => (
          <div key={card.label} className={`rounded-2xl border ${card.border} bg-white p-5 shadow-sm`}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
                {card.label}
              </p>
              <span className="text-lg">{card.icon}</span>
            </div>
            <p className="mt-4 font-serif text-2xl font-bold text-slate-950">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-red-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-red-700">
              ↩ Losing Return Claim
            </h2>
          </div>

          <div className="space-y-4 p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <Field label="Badge / CID">
                <input
                  className={inputClass}
                  value={losingBadge}
                  onChange={(event) => setLosingBadge(event.target.value)}
                />
              </Field>
              <div className="flex items-end">
                <button className="h-11 rounded-lg bg-yellow-400 px-5 text-sm font-extrabold text-slate-950 hover:bg-yellow-300">
                  Verify
                </button>
              </div>
            </div>

            <CustomerPreview customer={losingCustomer} />

            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Row label="Total Buy-In" value={losingCustomer?.totalBuyIn || '—'} />
              <Row label="Verified Table Loss" value={losingCustomer?.verifiedTableLoss || '—'} />
              <Row label="Verified Machine Loss" value={losingCustomer?.verifiedMachineLoss || '—'} />
              <Row label="Total Verified Loss" value={losingCustomer?.totalVerifiedLoss || '—'} />
              <Row label="Unresolved Chips" value={losingCustomer?.unresolvedChips || '—'} danger />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Claimed Loss">
                <input className={inputClass} defaultValue="NPR 2,20,000" />
              </Field>
              <Field label="System Eligible Return 10%">
                <input className={inputClass} value={losingCustomer?.eligibleReturn || 'NPR 0'} readOnly />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Payment Currency">
                <CurrencyToggle value={losingCurrency} onChange={setLosingCurrency} />
              </Field>
              <Field label="Payment Mode">
                <PaymentMethodToggle value={losingMethod} onChange={setLosingMethod} includeChips />
              </Field>
            </div>

            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-700">
              Return paid in chips can be used again for play but is not eligible for another losing return.
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <span className="font-extrabold">Mismatch detected:</span> claimed loss exceeds verified loss; unresolved chip exposure exists.
            </div>

            <Field label="Remarks">
              <input className={inputClass} placeholder="Reason / supervisor note" />
            </Field>

            <button className="w-full rounded-lg bg-yellow-400 px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-yellow-300">
              Post Losing Return
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-emerald-700">
              💰 Cash-Out / Win Payment
            </h2>
          </div>

          <div className="space-y-4 p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <Field label="Badge / CID">
                <input
                  className={inputClass}
                  value={cashOutBadge}
                  onChange={(event) => setCashOutBadge(event.target.value)}
                />
              </Field>
              <div className="flex items-end">
                <button className="h-11 rounded-lg bg-yellow-400 px-5 text-sm font-extrabold text-slate-950 hover:bg-yellow-300">
                  Verify
                </button>
              </div>
            </div>

            <CustomerPreview customer={cashOutCustomer} />

            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Row label="Total Buy-In" value={cashOutCustomer?.totalBuyIn || '—'} />
              <Row label="Verified Win" value={cashOutCustomer?.verifiedWin || '—'} />
              <Row label="Verified Loss" value={cashOutCustomer?.verifiedLoss || '—'} />
              <Row label="Expected Remaining Chips" value={cashOutCustomer?.expectedRemainingChips || '—'} success />
              <Row label="Unresolved Chips" value={cashOutCustomer?.unresolvedChips || '—'} />
            </div>

            <Field label="Returned Chips Denomination Wise">
              <DenominationGrid />
            </Field>

            <Row label="Returned Chips Total" value="NPR 3,05,000" success />

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Payment Currency">
                <CurrencyToggle value={cashOutCurrency} onChange={setCashOutCurrency} />
              </Field>
              <Field label="Payment Method">
                <PaymentMethodToggle value={cashOutMethod} onChange={setCashOutMethod} />
              </Field>
            </div>

            <Field label="Reference ID">
              <input className={inputClass} placeholder="Required for QR, Card, Bank" />
            </Field>

            <Field label="Same Customer Verified?">
              <select className={inputClass} defaultValue="Yes">
                <option>Yes</option>
                <option>No</option>
              </select>
            </Field>

            <Field label="Remarks">
              <input className={inputClass} placeholder="Optional remarks" />
            </Field>

            <button className="w-full rounded-lg bg-yellow-400 px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-yellow-300">
              Post Cash-Out
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-sky-700">
              🚕 Transportation / Other Claim
            </h2>
          </div>

          <div className="space-y-4 p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <Field label="Badge / CID">
                <input
                  className={inputClass}
                  value={claimBadge}
                  onChange={(event) => setClaimBadge(event.target.value)}
                />
              </Field>
              <div className="flex items-end">
                <button className="h-11 rounded-lg bg-yellow-400 px-5 text-sm font-extrabold text-slate-950 hover:bg-yellow-300">
                  Verify
                </button>
              </div>
            </div>

            <CustomerPreview customer={claimCustomer} />

            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Row label="Total Buy-In" value={claimCustomer?.totalBuyIn || '—'} />
              <Row label="Total Verified Loss" value={claimCustomer?.verifiedLoss || '—'} />
              <Row label="Total Cash-Out" value={claimCustomer?.totalCashOut || '—'} />
              <Row label="Unresolved Chips" value={claimCustomer?.unresolvedChips || '—'} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Claim Type">
                <select className={inputClass}>
                  <option>Transportation</option>
                  <option>Food / Service Return</option>
                  <option>Hotel Adjustment</option>
                  <option>Other Approved Claim</option>
                </select>
              </Field>

              <Field label="Claim Amount">
                <input className={inputClass} defaultValue="NPR 12,000" />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Payment Currency">
                <CurrencyToggle value={claimCurrency} onChange={setClaimCurrency} />
              </Field>
              <Field label="Payment Method">
                <PaymentMethodToggle value={claimMethod} onChange={setClaimMethod} />
              </Field>
            </div>

            <Field label="Reference ID">
              <input className={inputClass} placeholder="Required for QR, Card, Bank" />
            </Field>

            <Field label="Issued By">
              <input className={inputClass} defaultValue="Anil Cashier" readOnly />
            </Field>

            <Field label="Reason / Remarks">
              <textarea
                className="min-h-[84px] w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                defaultValue="Late-night customer transport return"
              />
            </Field>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              No mandatory approval required.
            </div>

            <button className="w-full rounded-lg bg-yellow-400 px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-yellow-300">
              Post Claim
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">
            Today’s Outflow Transactions
          </h2>

          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Filter
            </button>
            <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50">
              Excel
            </button>
            <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50">
              PDF
            </button>
            <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Print
            </button>
          </div>
        </div>

        <div className="border-b border-slate-200 px-4 pt-4">
          <div className="flex flex-wrap gap-2">
            {['Cash-Outs', 'Losing Returns', 'Transport / Other', 'Mismatch / Review', 'All Outflows'].map((tab, index) => (
              <button
                key={tab}
                className={`rounded-t-lg px-4 py-3 text-sm font-extrabold ${
                  index === 0
                    ? 'border-b-2 border-yellow-400 bg-yellow-50 text-yellow-700'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Badge</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Buy-In / Loss</th>
                <th className="px-4 py-3">Paid Amount</th>
                <th className="px-4 py-3">Currency</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {outflowTransactions.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 font-mono text-xs font-bold text-slate-700">{row.id}</td>
                  <td className="px-4 py-4 text-slate-700">{row.time}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-lg border px-3 py-1 text-xs font-bold ${
                        row.type === 'Cash-Out'
                          ? 'border-sky-200 bg-sky-50 text-sky-700'
                          : row.type === 'Losing Return'
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-purple-200 bg-purple-50 text-purple-700'
                      }`}
                    >
                      {row.type}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-1 font-mono text-sm font-bold text-yellow-700">
                      {row.badge}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-bold text-slate-950">{row.customer}</td>
                  <td className="px-4 py-4 text-slate-700">{row.base}</td>
                  <td className="px-4 py-4 font-bold text-slate-950">{row.paid}</td>
                  <td className="px-4 py-4 text-slate-700">{row.currency}</td>
                  <td className="px-4 py-4 text-slate-700">{row.method}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase ${
                        row.status === 'Mismatch Found'
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : row.status === 'Auto Calculated'
                            ? 'border-sky-200 bg-sky-50 text-sky-700'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default CashOutReturnControl