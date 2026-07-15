import { useMemo, useState } from 'react'

const summaryCards = [
  {
    label: 'Chip Buy-In Today',
    value: 'NPR 22,40,000',
    sub: 'INR 38,500',
    icon: '💵',
    border: 'border-emerald-200',
  },
  {
    label: 'Machine Cash-In Today',
    value: 'NPR 3,80,000',
    sub: 'INR 12,000',
    icon: '🎰',
    border: 'border-sky-200',
  },
  {
    label: 'Tips Collected Today',
    value: 'NPR 18,400',
    sub: 'INR 0',
    icon: '🎁',
    border: 'border-purple-200',
  },
  {
    label: 'Total Cash Received',
    value: 'NPR 26,38,400',
    sub: 'INR 50,500',
    icon: '💰',
    border: 'border-yellow-300',
  },
  {
    label: 'QR/Card/Bank Received',
    value: 'NPR 4,50,000',
    sub: 'INR 2,000',
    icon: '💳',
    border: 'border-cyan-200',
  },
  {
    label: 'Active Cashier Session',
    value: 'Anil Cashier',
    sub: '24 Transactions',
    icon: '👤',
    border: 'border-orange-200',
  },
]

const transactions = [
  {
    id: 'BI-2026-07-15-001',
    type: 'Chip Buy-In',
    time: '18:42',
    badge: '087',
    customer: 'Raj Sharma',
    currency: 'NPR',
    amount: '2,50,000',
    method: 'Cash',
    reference: '—',
    status: 'Posted',
  },
  {
    id: 'BI-2026-07-15-002',
    type: 'Chip Buy-In',
    time: '19:11',
    badge: '044',
    customer: 'Amit Verma',
    currency: 'NPR',
    amount: '30,000',
    method: 'Cash',
    reference: '—',
    status: 'Posted',
  },
  {
    id: 'BI-2026-07-15-003',
    type: 'Machine Cash-In',
    time: '17:08',
    badge: '112',
    customer: 'Daniel Smith',
    currency: 'INR',
    amount: '15,000',
    method: 'Bank',
    reference: 'TXN-884291',
    status: 'Posted',
  },
  {
    id: 'BI-2026-07-15-004',
    type: 'Chip Buy-In',
    time: '20:24',
    badge: '051',
    customer: 'Priya Tamang',
    currency: 'NPR',
    amount: '4,00,000',
    method: 'Card',
    reference: 'CARD-190382',
    status: 'Posted',
  },
]

const customerByBadge = {
  '087': {
    initials: 'RS',
    name: 'Raj Sharma',
    cid: 'CID-1001',
    category: 'VIP',
    session: 'SES-2026-07-15-087',
  },
  '112': {
    initials: 'DS',
    name: 'Daniel Smith',
    cid: 'CID-1003',
    category: 'VVIP',
    session: 'SES-2026-07-15-112',
  },
  '044': {
    initials: 'AV',
    name: 'Amit Verma',
    cid: 'CID-1002',
    category: 'Normal',
    session: 'SES-2026-07-15-044',
  },
}

const inputClass =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'

const selectClass = inputClass

const labelClass =
  'mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500'

const Field = ({ label, children }) => (
  <label className="block">
    <span className={labelClass}>{label}</span>
    {children}
  </label>
)

const CustomerPreview = ({ customer }) => {
  if (!customer) {
    return (
      <div className="flex h-full min-h-[74px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm font-medium text-slate-500">
        Verify badge/CID to fetch customer session
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-yellow-100 text-sm font-bold text-yellow-700">
          {customer.initials}
        </div>
        <div>
          <p className="font-bold text-slate-950">{customer.name}</p>
          <p className="text-xs text-slate-500">
            {customer.cid} · {customer.category}
          </p>
          <p className="text-xs text-slate-500">Session {customer.session}</p>
        </div>
        <span className="ml-auto rounded-full border border-emerald-200 bg-white px-2 py-1 text-xs font-bold text-emerald-700">
          ✓
        </span>
      </div>
    </div>
  )
}

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

const CashCollectionBuyIn = () => {
  const [chipBadge, setChipBadge] = useState('087')
  const [machineBadge, setMachineBadge] = useState('112')
  const [chipCurrency, setChipCurrency] = useState('NPR')
  const [machineCurrency, setMachineCurrency] = useState('NPR')
  const [tipsCurrency, setTipsCurrency] = useState('NPR')
  const [activeTab, setActiveTab] = useState('chip')

  const chipCustomer = customerByBadge[chipBadge]
  const machineCustomer = customerByBadge[machineBadge]

  const filteredTransactions = useMemo(() => {
    if (activeTab === 'chip') return transactions.filter((row) => row.type === 'Chip Buy-In')
    if (activeTab === 'machine') return transactions.filter((row) => row.type === 'Machine Cash-In')
    if (activeTab === 'tips') return []
    return transactions
  }, [activeTab])

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-950">
            <span className="mr-2 text-yellow-500">◆</span>
            Cash Collection & Buy-In
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Record chip buy-ins, machine cash-ins, and tips collected in NPR or INR.
          </p>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Anil Cashier · Business Date 15 July 2026 · Opening Cash NPR 5,000,000
          </p>
        </div>

        <div className="rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <span className="font-extrabold">Rule:</span> All reporting values are stored in NPR.
          Original currency and amount are also stored.
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl border ${card.border} bg-white p-5 shadow-sm`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-2xl">
                {card.icon}
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
                  {card.label}
                </p>
                <p className="mt-2 font-serif text-xl font-bold text-slate-950">{card.value}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">{card.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-yellow-300 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-yellow-700">
              💵 Chip Buy-In
            </h2>
          </div>

          <div className="space-y-4 p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <Field label="Daily Badge Number / CID">
                <input
                  value={chipBadge}
                  onChange={(event) => setChipBadge(event.target.value)}
                  className={inputClass}
                  placeholder="087 or CID-1001"
                />
              </Field>
              <div className="flex items-end">
                <button
                  type="button"
                  className="h-11 rounded-lg bg-yellow-400 px-5 text-sm font-extrabold text-slate-950 hover:bg-yellow-300"
                >
                  Verify
                </button>
              </div>
            </div>

            <CustomerPreview customer={chipCustomer} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Currency">
                <CurrencyToggle value={chipCurrency} onChange={setChipCurrency} />
              </Field>
              <Field label="Amount Received">
                <input className={inputClass} defaultValue="2,50,000" />
              </Field>
            </div>

            {chipCurrency === 'INR' && (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Exchange Rate">
                  <input className={inputClass} defaultValue="1.60" />
                </Field>
                <Field label="Converted NPR Value">
                  <input className={inputClass} defaultValue="4,00,000" readOnly />
                </Field>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Payment Method">
                <select className={selectClass}>
                  <option>Cash</option>
                  <option>QR</option>
                  <option>Card</option>
                  <option>Bank</option>
                </select>
              </Field>
              <Field label="Transaction Time Auto">
                <input className={inputClass} defaultValue="18:42" readOnly />
              </Field>
            </div>

            <Field label="Reference / Transaction ID">
              <input className={inputClass} placeholder="Required for QR, Card, Bank" />
            </Field>

            <Field label="Chip Denominations Quantity">
              <div className="grid grid-cols-5 gap-2">
                {['500', '1000', '5000', '10000', '25000'].map((amount) => (
                  <div key={amount} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <p className="text-[10px] font-bold text-slate-500">NPR</p>
                    <p className="text-xs font-bold text-slate-700">{amount}</p>
                    <input
                      className="mt-2 h-8 w-full rounded-md border border-slate-200 bg-white text-center text-sm outline-none focus:border-yellow-400"
                      defaultValue="0"
                    />
                  </div>
                ))}
              </div>
            </Field>

            <Field label="Remarks">
              <input className={inputClass} placeholder="Optional remarks" />
            </Field>

            <button className="w-full rounded-lg bg-yellow-400 px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-yellow-300">
              Post Buy-In
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-sky-700">
              🎰 Machine Cash-In
            </h2>
          </div>

          <div className="space-y-4 p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <Field label="Daily Badge Number / CID">
                <input
                  value={machineBadge}
                  onChange={(event) => setMachineBadge(event.target.value)}
                  className={inputClass}
                  placeholder="112 or CID-1003"
                />
              </Field>
              <div className="flex items-end">
                <button
                  type="button"
                  className="h-11 rounded-lg bg-yellow-400 px-5 text-sm font-extrabold text-slate-950 hover:bg-yellow-300"
                >
                  Verify
                </button>
              </div>
            </div>

            <CustomerPreview customer={machineCustomer} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Currency">
                <CurrencyToggle value={machineCurrency} onChange={setMachineCurrency} />
              </Field>
              <Field label="Amount Received">
                <input className={inputClass} defaultValue="1,00,000" />
              </Field>
            </div>

            {machineCurrency === 'INR' && (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Exchange Rate">
                  <input className={inputClass} defaultValue="1.60" />
                </Field>
                <Field label="Converted NPR Value">
                  <input className={inputClass} defaultValue="1,60,000" readOnly />
                </Field>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Payment Method">
                <select className={selectClass}>
                  <option>Bank</option>
                  <option>Cash</option>
                  <option>QR</option>
                  <option>Card</option>
                </select>
              </Field>
              <Field label="Reference / Transaction ID">
                <input className={inputClass} defaultValue="TXN-884291" />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Machine Type">
                <select className={selectClass}>
                  <option>Slot Machine</option>
                  <option>8-Seater Machine</option>
                  <option>Electronic Roulette</option>
                </select>
              </Field>
              <Field label="Machine Number">
                <input className={inputClass} defaultValue="Slot-07" />
              </Field>
            </div>

            <Field label="Remarks">
              <input className={inputClass} placeholder="Optional remarks" />
            </Field>

            <button className="w-full rounded-lg bg-sky-500 px-5 py-3 text-sm font-extrabold text-white hover:bg-sky-400">
              Post Machine Cash-In
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-purple-700">
              🎁 Tips Collected
            </h2>
          </div>

          <div className="space-y-4 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Source / Department">
                <select className={selectClass}>
                  <option>Gaming Floor</option>
                  <option>Slot Machine</option>
                  <option>F&B / Kitchen / Bar</option>
                  <option>CRM / GRE</option>
                </select>
              </Field>
              <Field label="Collected From / Shift">
                <select className={selectClass}>
                  <option>Day 13:00–23:00</option>
                  <option>Night 23:00–07:00</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Currency">
                <CurrencyToggle value={tipsCurrency} onChange={setTipsCurrency} />
              </Field>
              <Field label="Amount Collected">
                <input className={inputClass} defaultValue="18,400" />
              </Field>
            </div>

            {tipsCurrency === 'INR' && (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Exchange Rate">
                  <input className={inputClass} defaultValue="1.60" />
                </Field>
                <Field label="Converted NPR Value">
                  <input className={inputClass} defaultValue="29,440" readOnly />
                </Field>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Payment Method">
                <select className={selectClass}>
                  <option>Cash</option>
                  <option>QR</option>
                  <option>Card</option>
                  <option>Bank</option>
                </select>
              </Field>
              <Field label="Collected Time Auto">
                <input className={inputClass} defaultValue="20:15" readOnly />
              </Field>
            </div>

            <Field label="Reference / Transaction ID">
              <input className={inputClass} placeholder="Required for QR, Card, Bank" />
            </Field>

            <Field label="Collected By">
              <input className={inputClass} defaultValue="Anil Cashier" readOnly />
            </Field>

            <Field label="Remarks">
              <input className={inputClass} defaultValue="Good table performance" />
            </Field>

            <button className="w-full rounded-lg bg-purple-500 px-5 py-3 text-sm font-extrabold text-white hover:bg-purple-400">
              Post Tips Collection
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">
            Today's Transactions
          </h2>

          <div className="flex flex-wrap gap-2">
            <input
              className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm outline-none placeholder:text-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
              placeholder="Search..."
            />
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
            {[
              { key: 'chip', label: 'Chip Buy-Ins' },
              { key: 'machine', label: 'Machine Cash-Ins' },
              { key: 'tips', label: 'Tips Collected' },
              { key: 'all', label: 'All Transactions' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-t-lg px-4 py-3 text-sm font-extrabold ${
                  activeTab === tab.key
                    ? 'border-b-2 border-yellow-400 bg-yellow-50 text-yellow-700'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Buy-In ID</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Badge</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Currency</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3">Reference / Transaction ID</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-10 text-center text-sm font-medium text-slate-500">
                    No tips transactions shown in this prototype table yet.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-mono text-xs font-bold text-slate-700">
                      {row.id}
                    </td>
                    <td className="px-4 py-4 text-slate-700">{row.time}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-1 font-mono text-sm font-bold text-yellow-700">
                        {row.badge}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-950">{row.customer}</td>
                    <td className="px-4 py-4 text-slate-700">{row.currency}</td>
                    <td className="px-4 py-4 font-bold text-slate-950">{row.amount}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-lg border px-3 py-1 text-xs font-bold ${
                          row.method === 'Cash'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : row.method === 'Bank'
                              ? 'border-purple-200 bg-purple-50 text-purple-700'
                              : 'border-sky-200 bg-sky-50 text-sky-700'
                        }`}
                      >
                        {row.method}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{row.reference}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase text-emerald-700">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 text-sm text-slate-500">
          <span>Showing {filteredTransactions.length} entries</span>
          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50">
              ‹
            </button>
            <button className="rounded-lg bg-yellow-400 px-3 py-1.5 font-bold text-slate-950">
              1
            </button>
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50">
              ›
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CashCollectionBuyIn