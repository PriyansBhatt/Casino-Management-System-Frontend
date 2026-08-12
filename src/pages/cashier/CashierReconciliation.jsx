import { useMemo, useState } from 'react'

const BUSINESS_DATE = '2026-07-21'
const CASHIER_NAME = 'Ramesh Gurung'
const OPENING_CASH = 250000
const CHIP_BUY_IN = 905250
const MACHINE_CASH_IN = 612700
const TIPS_COLLECTED = 217500
const BASE_CASH_OUT = 1256300

const initialDeposits = [
  {
    id: 'BD-0721-003',
    bank: 'Nabil Bank',
    amount: 150000,
    slip: 'SLP-88921',
    time: '20:45',
    status: 'VERIFIED',
  },
  {
    id: 'BD-0721-002',
    bank: 'Global IME Bank',
    amount: 120000,
    slip: 'SLP-88912',
    time: '18:30',
    status: 'VERIFIED',
  },
  {
    id: 'BD-0721-001',
    bank: 'NIC Asia Bank',
    amount: 100000,
    slip: 'SLP-88873',
    time: '16:15',
    status: 'VERIFIED',
  },
]

const initialExpenses = [
  {
    voucher: 'EXP-0721-012',
    category: 'Petty Cash',
    amount: 25000,
    purpose: 'Small change for table games',
    requestedBy: 'Ramesh Gurung',
    approvedBy: 'Manoj Karki',
    status: 'APPROVED',
  },
  {
    voucher: 'EXP-0721-011',
    category: 'Employee Meal',
    amount: 18450,
    purpose: 'Staff meal - evening shift',
    requestedBy: 'Anita Rai',
    approvedBy: 'Manoj Karki',
    status: 'APPROVED',
  },
  {
    voucher: 'EXP-0721-010',
    category: 'Transportation',
    amount: 15000,
    purpose: 'Guest drop facility',
    requestedBy: 'Ramesh Gurung',
    approvedBy: 'Manoj Karki',
    status: 'APPROVED',
  },
  {
    voucher: 'EXP-0721-009',
    category: 'Supplies',
    amount: 127000,
    purpose: 'Office and cleaning supplies',
    requestedBy: 'Anita Rai',
    approvedBy: 'Manoj Karki',
    status: 'APPROVED',
  },
]

const initialMovements = [
  {
    id: 'MOV-0721-004',
    time: '21:10',
    type: 'CASH_IN',
    amount: 0,
    source: 'Opening balance confirmed',
    reference: 'SHIFT-0721',
    remarks: '',
  },
]

const emptyDeposit = {
  bank: '',
  amount: '',
  slip: '',
  remarks: '',
}

const emptyExpense = {
  category: '',
  amount: '',
  purpose: '',
  approvedBy: 'Manoj Karki',
}

const emptyMovement = {
  type: 'CASH_IN',
  amount: '',
  source: '',
  reference: '',
  remarks: '',
}

const money = (value) =>
  `NPR ${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const numberValue = (value) => {
  const parsed = Number(String(value).replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

const currentTime = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

const inputClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'

const labelClass =
  'mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500'

const Field = ({ label, children }) => (
  <label className="block">
    <span className={labelClass}>{label}</span>
    {children}
  </label>
)

const SummaryCard = ({ label, value, detail, icon, tone = 'slate' }) => {
  const tones = {
    slate: 'border-slate-200 from-white to-slate-50',
    green: 'border-emerald-200 from-white to-emerald-50',
    red: 'border-red-200 from-white to-red-50',
    blue: 'border-sky-200 from-white to-sky-50',
    amber: 'border-amber-200 from-white to-amber-50',
    purple: 'border-violet-200 from-white to-violet-50',
  }

  return (
    <article
      className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${tones[tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.17em] text-slate-500">
          {label}
        </p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
          {icon}
        </span>
      </div>
      <p className="mt-4 font-serif text-xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  )
}

const StatusBadge = ({ children, tone = 'green' }) => {
  const tones = {
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    blue: 'border-sky-200 bg-sky-50 text-sky-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

const Modal = ({ title, description, onClose, children, footer }) => (
  <div
    className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}
  >
    <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="font-serif text-2xl font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-500 hover:bg-slate-100"
        >
          ×
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
      <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4">
        {footer}
      </div>
    </div>
  </div>
)

const CashierReconciliation = () => {
  const [deposits, setDeposits] = useState(initialDeposits)
  const [expenses, setExpenses] = useState(initialExpenses)
  const [movements, setMovements] = useState(initialMovements)
  const [actualCash, setActualCash] = useState('173700')
  const [adjustment, setAdjustment] = useState('0')
  const [shift, setShift] = useState('Day Shift 13:00–23:00')
  const [verifiedBy, setVerifiedBy] = useState('Sita Thapa (Floor Manager)')
  const [approvedBy, setApprovedBy] = useState('Manoj Karki (Finance Manager)')
  const [remarks, setRemarks] = useState('All cash verified and balanced.')
  const [status, setStatus] = useState('NOT_STARTED')
  const [modal, setModal] = useState(null)
  const [depositForm, setDepositForm] = useState(emptyDeposit)
  const [expenseForm, setExpenseForm] = useState(emptyExpense)
  const [movementForm, setMovementForm] = useState(emptyMovement)
  const [toast, setToast] = useState(null)

  const totals = useMemo(() => {
    const depositsTotal = deposits.reduce((sum, row) => sum + row.amount, 0)
    const expensesTotal = expenses.reduce((sum, row) => sum + row.amount, 0)
    const manualCashIn = movements
      .filter((row) => row.type === 'CASH_IN')
      .reduce((sum, row) => sum + row.amount, 0)
    const manualCashOut = movements
      .filter((row) => row.type === 'CASH_OUT')
      .reduce((sum, row) => sum + row.amount, 0)
    const totalCashIn = CHIP_BUY_IN + MACHINE_CASH_IN + TIPS_COLLECTED + manualCashIn
    const totalCashOut = BASE_CASH_OUT + manualCashOut
    const expected =
      OPENING_CASH +
      totalCashIn -
      totalCashOut -
      depositsTotal -
      expensesTotal +
      numberValue(adjustment)
    const variance = numberValue(actualCash) - expected

    return {
      depositsTotal,
      expensesTotal,
      manualCashIn,
      manualCashOut,
      totalCashIn,
      totalCashOut,
      expected,
      variance,
    }
  }, [actualCash, adjustment, deposits, expenses, movements])

  const isBalanced = Math.abs(totals.variance) < 0.01
  const isClosed = status === 'CLOSED'

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 2800)
  }

  const startReconciliation = () => {
    if (isClosed) return
    setStatus('IN_PROGRESS')
    showToast('Reconciliation started. Enter the counted cash and verify the totals.')
  }

  const saveDraft = () => {
    if (isClosed) return
    setStatus('DRAFT')
    showToast('Reconciliation draft saved.')
  }

  const submitForApproval = () => {
    if (status === 'NOT_STARTED') {
      showToast('Start reconciliation before submitting.', 'error')
      return
    }
    if (!actualCash.trim()) {
      showToast('Enter the actual counted cash.', 'error')
      return
    }
    if (!isBalanced) {
      showToast('Variance must be zero before submission.', 'error')
      return
    }
    setStatus('SUBMITTED')
    showToast('Reconciliation submitted for approval.')
  }

  const closeShift = () => {
    if (status !== 'SUBMITTED') {
      showToast('Submit the balanced reconciliation for approval first.', 'error')
      return
    }
    if (!isBalanced) {
      showToast('The shift cannot close while a variance exists.', 'error')
      return
    }
    setStatus('CLOSED')
    showToast('Shift closed successfully.')
  }

  const addDeposit = () => {
    const amount = numberValue(depositForm.amount)
    if (!depositForm.bank || amount <= 0 || !depositForm.slip.trim()) {
      showToast('Bank, amount and deposit slip are required.', 'error')
      return
    }

    const newDeposit = {
      id: `BD-${BUSINESS_DATE.replaceAll('-', '').slice(4)}-${String(
        deposits.length + 1,
      ).padStart(3, '0')}`,
      bank: depositForm.bank,
      amount,
      slip: depositForm.slip.trim(),
      time: currentTime(),
      status: 'VERIFIED',
    }

    setDeposits((current) => [newDeposit, ...current])
    setDepositForm(emptyDeposit)
    setModal(null)
    showToast('Bank deposit recorded.')
  }

  const addExpense = () => {
    const amount = numberValue(expenseForm.amount)
    if (!expenseForm.category || amount <= 0 || !expenseForm.purpose.trim()) {
      showToast('Category, amount and purpose are required.', 'error')
      return
    }

    const newExpense = {
      voucher: `EXP-${BUSINESS_DATE.replaceAll('-', '').slice(4)}-${String(
        expenses.length + 1,
      ).padStart(3, '0')}`,
      category: expenseForm.category,
      amount,
      purpose: expenseForm.purpose.trim(),
      requestedBy: CASHIER_NAME,
      approvedBy: expenseForm.approvedBy,
      status: 'APPROVED',
    }

    setExpenses((current) => [newExpense, ...current])
    setExpenseForm(emptyExpense)
    setModal(null)
    showToast('Cash expense recorded.')
  }

  const addMovement = () => {
    const amount = numberValue(movementForm.amount)
    if (amount <= 0 || !movementForm.source.trim()) {
      showToast('Amount and source are required.', 'error')
      return
    }

    const newMovement = {
      id: `MOV-${BUSINESS_DATE.replaceAll('-', '').slice(4)}-${String(
        movements.length + 1,
      ).padStart(3, '0')}`,
      time: currentTime(),
      type: movementForm.type,
      amount,
      source: movementForm.source.trim(),
      reference: movementForm.reference.trim() || '—',
      remarks: movementForm.remarks.trim(),
    }

    setMovements((current) => [newMovement, ...current])
    setMovementForm(emptyMovement)
    setModal(null)
    showToast('Cash movement recorded.')
  }

  const statusPresentation = {
    NOT_STARTED: { label: 'NOT STARTED', tone: 'slate' },
    IN_PROGRESS: { label: 'IN PROGRESS', tone: 'blue' },
    DRAFT: { label: 'DRAFT SAVED', tone: 'amber' },
    SUBMITTED: { label: 'SUBMITTED', tone: 'green' },
    CLOSED: { label: 'SHIFT CLOSED', tone: 'green' },
  }[status]

  return (
    <div className="space-y-5 text-slate-900">
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-black tracking-tight text-slate-950">
            <span className="mr-2 text-amber-400">◆</span>
            Cashier Reconciliation
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Count the cashier balance, record final cash movements and close the shift from one page.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isClosed}
            onClick={() => setModal('deposit')}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            🏦 New Bank Deposit
          </button>
          <button
            type="button"
            disabled={isClosed}
            onClick={() => setModal('expense')}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            🧾 Record Cash Expense
          </button>
          <button
            type="button"
            disabled={isClosed}
            onClick={() => setModal('movement')}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ↔ Cash In / Out Entry
          </button>
          <button
            type="button"
            disabled={status !== 'NOT_STARTED'}
            onClick={startReconciliation}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ▶ Start Reconciliation
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <SummaryCard label="Opening Cash" value={money(OPENING_CASH)} detail="Shift opening float" icon="💰" tone="amber" />
        <SummaryCard label="Total Cash In" value={money(totals.totalCashIn)} detail="Buy-in, machines, tips and entries" icon="↗" tone="green" />
        <SummaryCard label="Total Cash Out" value={money(totals.totalCashOut)} detail="Payouts and manual cash out" icon="↘" tone="red" />
        <SummaryCard label="Bank Deposits" value={money(totals.depositsTotal)} detail={`${deposits.length} recorded deposits`} icon="🏦" tone="blue" />
        <SummaryCard label="Cash Expenses" value={money(totals.expensesTotal)} detail={`${expenses.length} approved expenses`} icon="🧾" tone="amber" />
        <SummaryCard label="Expected Cash" value={money(totals.expected)} detail="System calculated" icon="🧮" tone="purple" />
        <SummaryCard label="Counted Cash" value={money(numberValue(actualCash))} detail="Entered by cashier" icon="✅" tone="green" />
        <SummaryCard label="Variance" value={money(totals.variance)} detail={isBalanced ? 'Balanced' : 'Needs correction'} icon={isBalanced ? '●' : '⚠'} tone={isBalanced ? 'green' : 'red'} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.17em] text-slate-700">
                Shift Closing Reconciliation
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Verify the system totals, enter counted cash and submit the balanced shift.
              </p>
            </div>
            <StatusBadge tone={statusPresentation.tone}>{statusPresentation.label}</StatusBadge>
          </div>

          <div className="space-y-6 p-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Business Date">
                <input className={inputClass} value={BUSINESS_DATE} readOnly />
              </Field>
              <Field label="Shift">
                <select
                  className={inputClass}
                  value={shift}
                  disabled={isClosed}
                  onChange={(event) => setShift(event.target.value)}
                >
                  <option>Day Shift 13:00–23:00</option>
                  <option>Night Shift 23:00–07:00</option>
                </select>
              </Field>
              <Field label="Cashier Name">
                <input className={inputClass} value={CASHIER_NAME} readOnly />
              </Field>
              <Field label="Opening Cash">
                <input className={inputClass} value={money(OPENING_CASH)} readOnly />
              </Field>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-600">
                System Totals
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <ReadOnlyMetric label="Chip Buy-In" value={money(CHIP_BUY_IN)} />
                <ReadOnlyMetric label="Machine Cash-In" value={money(MACHINE_CASH_IN)} />
                <ReadOnlyMetric label="Tips Collected" value={money(TIPS_COLLECTED)} />
                <ReadOnlyMetric label="Manual Cash-In" value={money(totals.manualCashIn)} />
                <ReadOnlyMetric label="Base Cash-Out" value={money(BASE_CASH_OUT)} />
                <ReadOnlyMetric label="Manual Cash-Out" value={money(totals.manualCashOut)} />
                <ReadOnlyMetric label="Deposits" value={money(totals.depositsTotal)} />
                <ReadOnlyMetric label="Expenses" value={money(totals.expensesTotal)} />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Field label="Other Adjustment (+ / -)">
                <input
                  type="number"
                  className={inputClass}
                  value={adjustment}
                  disabled={isClosed}
                  onChange={(event) => setAdjustment(event.target.value)}
                />
              </Field>
              <Field label="Expected Closing Cash">
                <input className={`${inputClass} font-black`} value={money(totals.expected)} readOnly />
              </Field>
              <Field label="Actual Counted Cash">
                <input
                  type="number"
                  className={`${inputClass} font-black`}
                  value={actualCash}
                  disabled={isClosed}
                  onChange={(event) => setActualCash(event.target.value)}
                  placeholder="Enter counted cash"
                />
              </Field>
            </div>

            <div
              className={`rounded-xl border p-4 ${
                isBalanced
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black">{isBalanced ? 'Cash is balanced' : 'Cash variance detected'}</p>
                  <p className="mt-1 text-sm">
                    {isBalanced
                      ? 'The counted cash matches the calculated closing balance.'
                      : 'Review the counted cash, adjustment, deposit and expense entries.'}
                  </p>
                </div>
                <p className="font-serif text-2xl font-black">{money(totals.variance)}</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Field label="Verified By">
                <select
                  className={inputClass}
                  value={verifiedBy}
                  disabled={isClosed}
                  onChange={(event) => setVerifiedBy(event.target.value)}
                >
                  <option>Sita Thapa (Floor Manager)</option>
                  <option>Cashier Supervisor</option>
                  <option>Director Admin</option>
                </select>
              </Field>
              <Field label="Approved By">
                <select
                  className={inputClass}
                  value={approvedBy}
                  disabled={isClosed}
                  onChange={(event) => setApprovedBy(event.target.value)}
                >
                  <option>Manoj Karki (Finance Manager)</option>
                  <option>Director Admin</option>
                </select>
              </Field>
              <Field label="Remarks">
                <input
                  className={inputClass}
                  value={remarks}
                  disabled={isClosed}
                  onChange={(event) => setRemarks(event.target.value)}
                  placeholder="Optional reconciliation note"
                />
              </Field>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-black">Calculation</p>
              <p className="mt-1">
                Opening Cash + Total Cash In − Total Cash Out − Bank Deposits − Cash Expenses ± Adjustment = Expected Closing Cash
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={isClosed}
                onClick={saveDraft}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                Print Summary
              </button>
              <button
                type="button"
                disabled={isClosed}
                onClick={submitForApproval}
                className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-black text-amber-700 hover:bg-amber-100 disabled:opacity-50"
              >
                Submit for Approval
              </button>
              <button
                type="button"
                disabled={isClosed}
                onClick={closeShift}
                className="rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-amber-300 disabled:opacity-50"
              >
                Close Shift
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-xl">🧾</span>
              <div>
                <h3 className="font-black text-slate-950">Shift Status</h3>
                <p className="text-xs text-slate-500">Current reconciliation progress</p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <InfoRow label="Status" value={<StatusBadge tone={statusPresentation.tone}>{statusPresentation.label}</StatusBadge>} />
              <InfoRow label="Business Date" value={BUSINESS_DATE} />
              <InfoRow label="Cashier" value={CASHIER_NAME} />
              <InfoRow label="Verified By" value={verifiedBy} />
              <InfoRow label="Approved By" value={approvedBy} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">
              Entry Totals
            </h3>
            <div className="mt-4 space-y-3 text-sm">
              <InfoRow label="Bank Deposits" value={deposits.length} />
              <InfoRow label="Cash Expenses" value={expenses.length} />
              <InfoRow label="Manual Movements" value={movements.length} />
            </div>
          </div>

          <div
            className={`rounded-2xl border p-5 text-sm ${
              isBalanced
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            <p className="font-black">{isBalanced ? 'Ready to submit' : 'Action required'}</p>
            <p className="mt-2">
              {isBalanced
                ? 'The expected and counted cash values match.'
                : 'Correct the variance before submitting or closing the shift.'}
            </p>
          </div>
        </aside>
      </section>

      {modal === 'deposit' && (
        <Modal
          title="New Bank Deposit"
          description="Record cash deposited from the cashier shift."
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" onClick={() => setModal(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">Cancel</button>
              <button type="button" onClick={addDeposit} className="rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-black text-slate-950">Save Deposit</button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bank">
              <select className={inputClass} value={depositForm.bank} onChange={(event) => setDepositForm((current) => ({ ...current, bank: event.target.value }))}>
                <option value="">Select bank</option>
                <option>Nabil Bank</option>
                <option>Global IME Bank</option>
                <option>NIC Asia Bank</option>
                <option>Himalayan Bank</option>
              </select>
            </Field>
            <Field label="Amount">
              <input type="number" className={inputClass} value={depositForm.amount} onChange={(event) => setDepositForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Enter amount" />
            </Field>
            <Field label="Deposit Slip / Reference">
              <input className={inputClass} value={depositForm.slip} onChange={(event) => setDepositForm((current) => ({ ...current, slip: event.target.value }))} placeholder="Enter slip number" />
            </Field>
            <Field label="Remarks">
              <input className={inputClass} value={depositForm.remarks} onChange={(event) => setDepositForm((current) => ({ ...current, remarks: event.target.value }))} placeholder="Optional note" />
            </Field>
          </div>
        </Modal>
      )}

      {modal === 'expense' && (
        <Modal
          title="Record Cash Expense"
          description="Record an approved operational cash expense."
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" onClick={() => setModal(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">Cancel</button>
              <button type="button" onClick={addExpense} className="rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-black text-slate-950">Save Expense</button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <select className={inputClass} value={expenseForm.category} onChange={(event) => setExpenseForm((current) => ({ ...current, category: event.target.value }))}>
                <option value="">Select category</option>
                <option>Petty Cash</option>
                <option>Employee Meal</option>
                <option>Transportation</option>
                <option>Supplies</option>
                <option>Emergency Expense</option>
              </select>
            </Field>
            <Field label="Amount">
              <input type="number" className={inputClass} value={expenseForm.amount} onChange={(event) => setExpenseForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Enter amount" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Purpose">
                <input className={inputClass} value={expenseForm.purpose} onChange={(event) => setExpenseForm((current) => ({ ...current, purpose: event.target.value }))} placeholder="Reason for expense" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Approved By">
                <select className={inputClass} value={expenseForm.approvedBy} onChange={(event) => setExpenseForm((current) => ({ ...current, approvedBy: event.target.value }))}>
                  <option>Manoj Karki</option>
                  <option>Director Admin</option>
                  <option>Cashier Supervisor</option>
                </select>
              </Field>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'movement' && (
        <Modal
          title="Cash In / Out Entry"
          description="Record a controlled manual cash movement for this shift."
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" onClick={() => setModal(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">Cancel</button>
              <button type="button" onClick={addMovement} className="rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-black text-slate-950">Post Entry</button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Movement Type">
              <select className={inputClass} value={movementForm.type} onChange={(event) => setMovementForm((current) => ({ ...current, type: event.target.value }))}>
                <option value="CASH_IN">Cash In</option>
                <option value="CASH_OUT">Cash Out</option>
              </select>
            </Field>
            <Field label="Amount">
              <input type="number" className={inputClass} value={movementForm.amount} onChange={(event) => setMovementForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Enter amount" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Source / Reason">
                <input className={inputClass} value={movementForm.source} onChange={(event) => setMovementForm((current) => ({ ...current, source: event.target.value }))} placeholder="Describe the cash movement" />
              </Field>
            </div>
            <Field label="Reference">
              <input className={inputClass} value={movementForm.reference} onChange={(event) => setMovementForm((current) => ({ ...current, reference: event.target.value }))} placeholder="Optional reference" />
            </Field>
            <Field label="Remarks">
              <input className={inputClass} value={movementForm.remarks} onChange={(event) => setMovementForm((current) => ({ ...current, remarks: event.target.value }))} placeholder="Optional note" />
            </Field>
          </div>
        </Modal>
      )}

      {toast && (
        <div className={`fixed bottom-5 right-5 z-[200] max-w-sm rounded-xl border px-4 py-3 text-sm font-bold shadow-xl ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

const ReadOnlyMetric = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3">
    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
    <p className="mt-2 text-sm font-black text-slate-900">{value}</p>
  </div>
)

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
    <span className="text-slate-500">{label}</span>
    <span className="text-right font-bold text-slate-900">{value}</span>
  </div>
)

export default CashierReconciliation
