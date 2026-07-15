import { useState } from 'react'

const summaryCards = [
  { label: 'Opening Cash', value: 'NPR 250,000.00', sub: 'At shift start', icon: '💰', border: 'border-yellow-300' },
  { label: 'Total Cash In', value: 'NPR 1,735,450.00', sub: 'Buy-in, machine in, tips', icon: '↗', border: 'border-emerald-200' },
  { label: 'Total Cash Out', value: 'NPR 1,256,300.00', sub: 'Cash-outs, returns, adjustments', icon: '↘', border: 'border-red-200' },
  { label: 'Bank Deposits Today', value: 'NPR 620,000.00', sub: '3 deposits', icon: '🏦', border: 'border-sky-200' },
  { label: 'Operational Cash Expenses', value: 'NPR 185,450.00', sub: '12 expenses', icon: '🧾', border: 'border-amber-200' },
  { label: 'Expected Closing Cash', value: 'NPR 173,700.00', sub: 'Calculated', icon: '🧮', border: 'border-purple-200' },
  { label: 'Actual Counted Cash', value: 'NPR 173,700.00', sub: 'Counted', icon: '✅', border: 'border-emerald-200' },
  { label: 'Difference / Variance', value: 'NPR 0.00', sub: 'Balanced', icon: '🟢', border: 'border-emerald-300' },
]

const bankDeposits = [
  { id: 'BD-0523-003', time: '08:45 PM', bank: 'Nabil Bank', amount: 'NPR 250,000.00', slip: 'SLP-88921', status: 'Verified' },
  { id: 'BD-0523-002', time: '06:30 PM', bank: 'Global IME Bank', amount: 'NPR 220,000.00', slip: 'SLP-88912', status: 'Verified' },
  { id: 'BD-0523-001', time: '04:15 PM', bank: 'NICA Asia Bank', amount: 'NPR 150,000.00', slip: 'SLP-88873', status: 'Verified' },
]

const cashExpenses = [
  { voucher: 'EXP-0523-012', category: 'Petty Cash Issue', amount: 'NPR 25,000.00', purpose: 'Small change for table games', requestedBy: 'Ramesh Gurung', approvedBy: 'Manoj Karki', status: 'Approved' },
  { voucher: 'EXP-0523-011', category: 'Employee Meal', amount: 'NPR 18,450.00', purpose: 'Staff meal - evening shift', requestedBy: 'Anita Rai', approvedBy: 'Manoj Karki', status: 'Approved' },
  { voucher: 'EXP-0523-010', category: 'Transportation', amount: 'NPR 15,000.00', purpose: 'Guest drop facility', requestedBy: 'Ramesh Gurung', approvedBy: 'Manoj Karki', status: 'Approved' },
  { voucher: 'EXP-0523-009', category: 'Supplies Purchase', amount: 'NPR 12,000.00', purpose: 'Office & cleaning supplies', requestedBy: 'Anita Rai', approvedBy: 'Manoj Karki', status: 'Approved' },
]

const transactionLogs = [
  { time: '10:20 PM', type: 'Cash Out', source: 'Petty cash issue - table 5', reference: 'EXP-0523-012', amount: 'NPR 25,000.00', recordedBy: 'Ramesh Gurung', status: 'Posted' },
  { time: '09:15 PM', type: 'Cash In', source: 'Returned cash from table 2', reference: 'RCT-7231', amount: 'NPR 12,500.00', recordedBy: 'Ramesh Gurung', status: 'Posted' },
  { time: '08:05 PM', type: 'Cash Out', source: 'Refund - player', reference: 'RFND-55418', amount: 'NPR 8,750.00', recordedBy: 'Ramesh Gurung', status: 'Posted' },
  { time: '07:10 PM', type: 'Cash In', source: 'Manual adjustment', reference: 'ADJ-19021', amount: 'NPR 5,000.00', recordedBy: 'Ramesh Gurung', status: 'Posted' },
  { time: '05:55 PM', type: 'Cash Out', source: 'Emergency cash issue', reference: 'EXP-0523-010', amount: 'NPR 15,000.00', recordedBy: 'Ramesh Gurung', status: 'Posted' },
  { time: '04:30 PM', type: 'Cash In', source: 'Chip buy-in - Table 12', reference: 'BUY-88321', amount: 'NPR 45,000.00', recordedBy: 'Ramesh Gurung', status: 'Posted' },
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

const SmallStatus = ({ children, color = 'green' }) => {
  const cls =
    color === 'green'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : color === 'red'
        ? 'border-red-200 bg-red-50 text-red-700'
        : color === 'yellow'
          ? 'border-yellow-300 bg-yellow-50 text-yellow-700'
          : 'border-sky-200 bg-sky-50 text-sky-700'

  return (
    <span className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase ${cls}`}>
      {children}
    </span>
  )
}

const MiniTable = ({ title, action, children }) => (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
      <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-slate-700">
        {title}
      </h3>
      {action && (
        <button className="text-xs font-extrabold text-yellow-700 hover:underline">
          {action}
        </button>
      )}
    </div>
    {children}
  </div>
)

const CashierReconciliation = () => {
  const [activeTab, setActiveTab] = useState('Shift Closing Reconciliation')

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-950">
            <span className="mr-2 text-yellow-500">◆</span>
            Cashier Reconciliation
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Shift closing, bank deposits, operational cash expenses, and cashier cash movement control.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
            🏦 New Bank Deposit
          </button>
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
            🧾 Record Cash Expense
          </button>
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
            ↔ Cash In / Out Entry
          </button>
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
            ▶ Start Reconciliation
          </button>
          <button className="rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-extrabold text-slate-950 shadow-sm hover:bg-yellow-300">
            🔒 Close Shift
          </button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        {summaryCards.map((card) => (
          <div key={card.label} className={`rounded-2xl border ${card.border} bg-white p-5 shadow-sm`}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                {card.label}
              </p>
              <span>{card.icon}</span>
            </div>
            <p
              className={`mt-4 font-serif text-xl font-bold ${
                card.label.includes('Cash In') || card.label.includes('Actual') || card.label.includes('Difference')
                  ? 'text-emerald-600'
                  : card.label.includes('Cash Out')
                    ? 'text-red-600'
                    : 'text-slate-950'
              }`}
            >
              {card.value}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{card.sub}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_420px]">
        <div className="space-y-5">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex gap-2 overflow-x-auto border-b border-slate-200 px-4 pt-4">
              {['Shift Closing Reconciliation', 'Bank Deposits', 'Cash Expenses', 'Cash Transactions Log'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`shrink-0 rounded-t-lg px-4 py-3 text-sm font-extrabold ${
                    activeTab === tab
                      ? 'border-b-2 border-yellow-400 bg-yellow-50 text-yellow-700'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-5">
              <h2 className="mb-5 text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">
                Shift Closing Reconciliation Details
              </h2>

              <div className="grid gap-4 lg:grid-cols-4">
                <Field label="Business Date">
                  <input className={inputClass} value="May 23, 2025" readOnly />
                </Field>
                <Field label="Shift">
                  <select className={inputClass}>
                    <option>Evening Shift (3 PM - 11 PM)</option>
                    <option>Day Shift (7 AM - 3 PM)</option>
                    <option>Night Shift (11 PM - 7 AM)</option>
                  </select>
                </Field>
                <Field label="Cashier Name">
                  <input className={inputClass} value="Ramesh Gurung" readOnly />
                </Field>
                <Field label="Opened At">
                  <input className={inputClass} value="May 23, 2025 03:00 PM" readOnly />
                </Field>
                <Field label="Closing Time">
                  <input className={inputClass} value="May 23, 2025 11:00 PM" readOnly />
                </Field>
                <Field label="Opening Cash">
                  <input className={inputClass} value="NPR 250,000.00" readOnly />
                </Field>
                <Field label="Chip Buy-In Total">
                  <input className={inputClass} value="NPR 905,250.00" readOnly />
                </Field>
                <Field label="Machine Cash-In Total">
                  <input className={inputClass} value="NPR 612,700.00" readOnly />
                </Field>
                <Field label="Tips Collected">
                  <input className={inputClass} value="NPR 217,500.00" readOnly />
                </Field>
                <Field label="Other Cash In">
                  <input className={inputClass} value="NPR 0.00" readOnly />
                </Field>
                <Field label="Cash-Out Total">
                  <input className={inputClass} value="NPR 1,112,800.00" readOnly />
                </Field>
                <Field label="Losing Return Paid">
                  <input className={inputClass} value="NPR 98,900.00" readOnly />
                </Field>
                <Field label="Transportation / Other Return">
                  <input className={inputClass} value="NPR 44,600.00" readOnly />
                </Field>
                <Field label="Other Cash Out">
                  <input className={inputClass} value="NPR 0.00" readOnly />
                </Field>
                <Field label="Bank Deposit Total">
                  <input className={inputClass} value="NPR 620,000.00" readOnly />
                </Field>
                <Field label="Operational Cash Expense">
                  <input className={inputClass} value="NPR 185,450.00" readOnly />
                </Field>
                <Field label="Other Adjustments">
                  <input className={inputClass} value="NPR 0.00" readOnly />
                </Field>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <Field label="Expected Closing Cash Calculated">
                  <input className={inputClass} value="NPR 173,700.00" readOnly />
                </Field>
                <Field label="Actual Counted Cash">
                  <input className={inputClass} defaultValue="NPR 173,700.00" />
                </Field>
                <Field label="Difference / Variance">
                  <input className={`${inputClass} font-extrabold text-emerald-600`} value="NPR 0.00" readOnly />
                </Field>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <Field label="Verified By">
                  <select className={inputClass}>
                    <option>Sita Thapa (Floor Manager)</option>
                    <option>Cashier Supervisor</option>
                  </select>
                </Field>

                <Field label="Approved By">
                  <select className={inputClass}>
                    <option>Manoj Karki (Finance Manager)</option>
                    <option>Director Admin</option>
                  </select>
                </Field>

                <Field label="Remarks">
                  <input className={inputClass} defaultValue="All cash verified and balanced." />
                </Field>
              </div>

              <div className="mt-6 rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
                <p className="font-extrabold">Calculation Formula:</p>
                <p className="mt-1">
                  Opening Cash + Total Cash In - Total Cash Out - Bank Deposits - Operational Cash Expenses +/- Other Adjustments = Expected Closing Cash
                </p>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  Save Draft
                </button>
                <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  Print Summary
                </button>
                <button className="rounded-lg border border-yellow-400 bg-yellow-50 px-4 py-2.5 text-sm font-bold text-yellow-700 hover:bg-yellow-100">
                  Submit for Approval
                </button>
                <button className="rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-yellow-300">
                  Close Shift
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <MiniTable title="Bank Deposits" action="View All">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-3">Deposit ID</th>
                      <th className="px-3 py-3">Bank</th>
                      <th className="px-3 py-3">Amount</th>
                      <th className="px-3 py-3">Slip</th>
                      <th className="px-3 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bankDeposits.map((row) => (
                      <tr key={row.id}>
                        <td className="px-3 py-3 font-mono">{row.id}</td>
                        <td className="px-3 py-3">{row.bank}</td>
                        <td className="px-3 py-3 font-bold">{row.amount}</td>
                        <td className="px-3 py-3">{row.slip}</td>
                        <td className="px-3 py-3"><SmallStatus>{row.status}</SmallStatus></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </MiniTable>

            <MiniTable title="Cash Expenses" action="View All">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-3">Voucher</th>
                      <th className="px-3 py-3">Category</th>
                      <th className="px-3 py-3">Amount</th>
                      <th className="px-3 py-3">Approved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cashExpenses.map((row) => (
                      <tr key={row.voucher}>
                        <td className="px-3 py-3 font-mono">{row.voucher}</td>
                        <td className="px-3 py-3">{row.category}</td>
                        <td className="px-3 py-3 font-bold">{row.amount}</td>
                        <td className="px-3 py-3"><SmallStatus>{row.status}</SmallStatus></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </MiniTable>

            <MiniTable title="Cash Transactions Log" action="View All">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-3">Time</th>
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3">Source</th>
                      <th className="px-3 py-3">Amount</th>
                      <th className="px-3 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactionLogs.slice(0, 4).map((row) => (
                      <tr key={`${row.time}-${row.reference}`}>
                        <td className="px-3 py-3">{row.time}</td>
                        <td className={`px-3 py-3 font-bold ${row.type === 'Cash In' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {row.type}
                        </td>
                        <td className="px-3 py-3">{row.source}</td>
                        <td className="px-3 py-3 font-bold">{row.amount}</td>
                        <td className="px-3 py-3"><SmallStatus>{row.status}</SmallStatus></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </MiniTable>
          </div>
        </div>

        <aside className="space-y-5">
          <MiniTable title="Recent Bank Deposits" action="View All">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-3">Deposit ID</th>
                  <th className="px-3 py-3">Bank</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bankDeposits.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-3 font-mono">{row.id}</td>
                    <td className="px-3 py-3">{row.bank}</td>
                    <td className="px-3 py-3 font-bold">{row.amount}</td>
                    <td className="px-3 py-3"><SmallStatus>{row.status}</SmallStatus></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </MiniTable>

          <MiniTable title="Recent Cash Expenses" action="View All">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-3">Voucher</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cashExpenses.slice(0, 4).map((row) => (
                  <tr key={row.voucher}>
                    <td className="px-3 py-3 font-mono">{row.voucher}</td>
                    <td className="px-3 py-3 font-bold">{row.amount}</td>
                    <td className="px-3 py-3"><SmallStatus>{row.status}</SmallStatus></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </MiniTable>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-100 text-3xl text-yellow-700">
                🧾
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-950">Reconciliation Status</h3>
                <p className="mt-1 text-sm text-slate-500">Shift closing verification</p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <SmallStatus color="blue">In Progress</SmallStatus>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pending Approvals</span>
                <SmallStatus color="yellow">2</SmallStatus>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Verified Time</span>
                <span className="font-bold text-slate-900">May 23, 2025 10:40 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Verified By</span>
                <span className="font-bold text-slate-900">Sita Thapa</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-700">
            <p className="font-extrabold">Balanced</p>
            <p className="mt-2">
              Expected closing cash and actual counted cash match. Shift can be submitted for approval.
            </p>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default CashierReconciliation