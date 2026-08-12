import { useMemo, useState } from 'react'

const ACTIONS = {
  LOSING_RETURN: 'LOSING_RETURN',
  CASH_OUT: 'CASH_OUT',
  TRANSPORT: 'TRANSPORT',
}

const BUSINESS_DATE = '2026-07-15'

const initialTransactions = [
  {
    id: 'CO-2026-07-15-001',
    businessDate: BUSINESS_DATE,
    timestamp: '2026-07-15T18:42:00',
    time: '18:42',
    type: 'Cash-Out',
    badge: '087',
    customer: 'Raj Sharma',
    basis: 'Buy-In NPR 2,50,000',
    amount: '3,05,000',
    currency: 'NPR',
    payment: 'Cash',
    reference: '—',
  },
  {
    id: 'LR-2026-07-15-002',
    businessDate: BUSINESS_DATE,
    timestamp: '2026-07-15T19:11:00',
    time: '19:11',
    type: 'Losing Return',
    badge: '051',
    customer: 'Priya Tamang',
    basis: 'Verified Loss NPR 1,80,000',
    amount: '18,000',
    currency: 'NPR',
    payment: 'Chips',
    reference: '—',
  },
  {
    id: 'TR-2026-07-15-003',
    businessDate: BUSINESS_DATE,
    timestamp: '2026-07-15T17:08:00',
    time: '17:08',
    type: 'Transport',
    badge: '026',
    customer: 'Suresh Rai',
    basis: 'Transportation',
    amount: '12,000',
    currency: 'NPR',
    payment: 'Cash',
    reference: '—',
  },
]

const LosingReturnPreview = () => {
  const [activeAction, setActiveAction] = useState(ACTIONS.CASH_OUT)
  const [transactions, setTransactions] = useState(initialTransactions)
  const [feedback, setFeedback] = useState(null)

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type })
    window.setTimeout(() => setFeedback(null), 3000)
  }

  const postTransaction = (transaction) => {
    const now = new Date()

    setTransactions((current) => [
      {
        ...transaction,
        id: `${transaction.prefix}-${BUSINESS_DATE}-${String(
          current.length + 1,
        ).padStart(3, '0')}`,
        businessDate: BUSINESS_DATE,
        timestamp: now.toISOString(),
        time: now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
        amount: formatNumber(transaction.amount),
        reference: transaction.reference || '—',
      },
      ...current,
    ])

    showFeedback(`${transaction.type} posted successfully.`)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="space-y-5 p-4 sm:p-5 lg:p-6">
        <header className="border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rotate-45 bg-amber-400" />

                <h1 className="font-serif text-3xl font-black tracking-tight text-slate-950">
                  Cash-Out & Return Control
                </h1>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Verify customers, process payouts and manage customer return
                claims.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              Business Date: <strong>{BUSINESS_DATE}</strong> · Cashier:{' '}
              <strong>Anil Cashier</strong>
            </div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Cash-Out Paid Today"
            value="NPR 3,05,000"
            icon="💸"
            tone="green"
          />

          <SummaryCard
            label="Losing Return Paid"
            value="NPR 23,500"
            icon="🧾"
            tone="amber"
          />

          <SummaryCard
            label="Transport / Other Return"
            value="NPR 12,000"
            icon="🚕"
            tone="blue"
          />

          <SummaryCard
            label="Total Outflow Today"
            value="NPR 3,40,500"
            icon="💰"
            tone="purple"
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="grid gap-2 md:grid-cols-3">
            <ActionTab
              active={activeAction === ACTIONS.LOSING_RETURN}
              icon="↩"
              title="Losing Return Claim"
              description="Verified loss return processing"
              tone="red"
              onClick={() => setActiveAction(ACTIONS.LOSING_RETURN)}
            />

            <ActionTab
              active={activeAction === ACTIONS.CASH_OUT}
              icon="💰"
              title="Cash-Out / Win Payment"
              description="Customer chip and wallet payout"
              tone="green"
              onClick={() => setActiveAction(ACTIONS.CASH_OUT)}
            />

            <ActionTab
              active={activeAction === ACTIONS.TRANSPORT}
              icon="🚕"
              title="Transportation / Other Claim"
              description="Transport and approved service returns"
              tone="blue"
              onClick={() => setActiveAction(ACTIONS.TRANSPORT)}
            />
          </div>
        </section>

        {feedback && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-bold ${
              feedback.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {feedback.message}
          </div>
        )}

        <section>
          {activeAction === ACTIONS.LOSING_RETURN && (
            <LosingReturnForm
              onPost={postTransaction}
              onError={(message) => showFeedback(message, 'error')}
            />
          )}

          {activeAction === ACTIONS.CASH_OUT && (
            <CashOutForm
              onPost={postTransaction}
              onError={(message) => showFeedback(message, 'error')}
            />
          )}

          {activeAction === ACTIONS.TRANSPORT && (
            <TransportClaimForm
              onPost={postTransaction}
              onError={(message) => showFeedback(message, 'error')}
            />
          )}
        </section>

        <TransactionsSection transactions={transactions} />
      </main>
    </div>
  )
}

const ActionTab = ({
  active,
  icon,
  title,
  description,
  tone,
  onClick,
}) => {
  const tones = {
    red: active
      ? 'border-red-300 bg-red-50 text-red-700 shadow-sm'
      : 'border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50/50',

    green: active
      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm'
      : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/50',

    blue: active
      ? 'border-sky-300 bg-sky-50 text-sky-700 shadow-sm'
      : 'border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50/50',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[78px] items-center gap-4 rounded-xl border px-5 py-4 text-left transition ${tones[tone]}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
        {icon}
      </span>

      <span>
        <span className="block text-sm font-black">{title}</span>

        <span className="mt-1 block text-xs text-slate-500">
          {description}
        </span>
      </span>
    </button>
  )
}

const LosingReturnForm = ({ onPost, onError }) => {
  const [customerQuery, setCustomerQuery] = useState('051')
  const [verified, setVerified] = useState(false)
  const [claimedLoss, setClaimedLoss] = useState('180000')
  const [currency, setCurrency] = useState('NPR')
  const [paymentMode, setPaymentMode] = useState('CHIPS')
  const [remarks, setRemarks] = useState('')

  const eligibleReturn = verified
    ? Math.round(Number(claimedLoss || 0) * 0.1)
    : 0

  const postLosingReturn = () => {
    const numericLoss = Number(claimedLoss)

    if (!verified) {
      onError('Verify the customer before posting a losing return.')
      return
    }

    if (!Number.isFinite(numericLoss) || numericLoss <= 0 || eligibleReturn <= 0) {
      onError('Enter a valid claimed loss greater than zero.')
      return
    }

    onPost({
      prefix: 'LR',
      type: 'Losing Return',
      badge: '051',
      customer: 'Priya Tamang',
      basis: `Verified Loss NPR ${formatNumber(numericLoss)}`,
      amount: eligibleReturn,
      currency,
      payment: paymentMode === 'CHIPS' ? 'Chips' : 'Cash',
      reference: '',
      remarks: remarks.trim(),
    })

    setClaimedLoss('')
    setRemarks('')
    setVerified(false)
  }

  return (
    <FormShell
      title="Losing Return Claim"
      description="Verify the customer and calculate the eligible losing return from verified net loss."
      tone="red"
    >
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <VerificationField
            value={customerQuery}
            onChange={setCustomerQuery}
            onVerify={() => setVerified(Boolean(customerQuery.trim()))}
          />

          {verified ? (
            <VerifiedCustomerCard
              name="Priya Tamang"
              cid="CID-1005"
              badge="051"
              category="VIP"
            />
          ) : (
            <VerificationPlaceholder />
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <InfoRow label="Total Buy-In" value={verified ? 'NPR 4,00,000' : '—'} />
            <InfoRow
              label="Verified Table Loss"
              value={verified ? 'NPR 1,80,000' : '—'}
            />
            <InfoRow
              label="Verified Machine Loss"
              value={verified ? 'NPR 0' : '—'}
            />
            <InfoRow
              label="Total Verified Loss"
              value={verified ? 'NPR 1,80,000' : '—'}
              strong
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Claimed Loss">
              <input
                type="number"
                min="0"
                value={claimedLoss}
                onChange={(event) => setClaimedLoss(event.target.value)}
                className="form-input"
              />
            </Field>

            <ReadOnlyValue
              label="System Eligible Return 10%"
              value={`NPR ${formatNumber(eligibleReturn)}`}
            />
          </div>

          <ToggleGroup
            label="Payment Currency"
            value={currency}
            options={['NPR', 'INR']}
            onChange={setCurrency}
          />

          <ToggleGroup
            label="Payment Mode"
            value={paymentMode}
            options={['CASH', 'CHIPS']}
            onChange={setPaymentMode}
          />

          {paymentMode === 'CHIPS' && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
              A return paid in chips may be reused for play, but it is excluded
              from future losing-return calculations.
            </div>
          )}

          <Field label="Remarks">
            <textarea
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              rows={4}
              placeholder="Reason or cashier note"
              className="form-input resize-none"
            />
          </Field>

          <button
            type="button"
            onClick={postLosingReturn}
            className="h-12 w-full rounded-xl bg-amber-400 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            Post Losing Return
          </button>
        </div>
      </div>
    </FormShell>
  )
}

const CashOutForm = ({ onPost, onError }) => {
  const denominations = [500, 1000, 5000, 10000, 25000]
  const [customerQuery, setCustomerQuery] = useState('087')
  const [verified, setVerified] = useState(false)
  const [quantities, setQuantities] = useState({
    500: 0,
    1000: 5,
    5000: 20,
    10000: 10,
    25000: 4,
  })
  const [currency, setCurrency] = useState('NPR')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [reference, setReference] = useState('')
  const [remarks, setRemarks] = useState('')

  const returnedTotal = useMemo(
    () =>
      denominations.reduce(
        (total, denomination) =>
          total + denomination * Number(quantities[denomination] || 0),
        0,
      ),
    [quantities],
  )

  const changeQuantity = (denomination, change) => {
    setQuantities((current) => ({
      ...current,
      [denomination]: Math.max(
        0,
        Number(current[denomination] || 0) + change,
      ),
    }))
  }

  const referenceRequired = paymentMethod !== 'CASH'

  const postCashOut = () => {
    if (!verified) {
      onError('Verify the customer before posting a cash-out.')
      return
    }

    if (returnedTotal <= 0) {
      onError('Enter at least one returned chip denomination.')
      return
    }

    if (referenceRequired && !reference.trim()) {
      onError(`Reference is required for ${paymentMethod}.`)
      return
    }

    onPost({
      prefix: 'CO',
      type: 'Cash-Out',
      badge: '087',
      customer: 'Raj Sharma',
      basis: 'Buy-In NPR 2,50,000',
      amount: returnedTotal,
      currency,
      payment: paymentMethod,
      reference: reference.trim(),
      remarks: remarks.trim(),
    })

    setQuantities({ 500: 0, 1000: 0, 5000: 0, 10000: 0, 25000: 0 })
    setReference('')
    setRemarks('')
    setVerified(false)
  }

  return (
    <FormShell
      title="Cash-Out / Win Payment"
      description="Verify the customer and process returned chips or wallet cash-out."
      tone="green"
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_1.15fr]">
        <div className="space-y-4">
          <VerificationField
            value={customerQuery}
            onChange={setCustomerQuery}
            onVerify={() => setVerified(Boolean(customerQuery.trim()))}
          />

          {verified ? (
            <VerifiedCustomerCard
              name="Raj Sharma"
              cid="CID-1001"
              badge="087"
              category="VIP"
            />
          ) : (
            <VerificationPlaceholder />
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <InfoRow label="Total Buy-In" value={verified ? 'NPR 2,50,000' : '—'} />
            <InfoRow label="Verified Win" value={verified ? 'NPR 55,000' : '—'} />
            <InfoRow label="Verified Loss" value={verified ? 'NPR 0' : '—'} />
            <InfoRow
              label="Expected Remaining Chips"
              value={verified ? 'NPR 3,05,000' : '—'}
              success
              strong
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              Returned Chips Denomination Wise
            </p>

            <div className="grid gap-2 sm:grid-cols-5">
              {denominations.map((denomination) => (
                <DenominationInput
                  key={denomination}
                  denomination={denomination}
                  quantity={quantities[denomination]}
                  onDecrease={() => changeQuantity(denomination, -1)}
                  onIncrease={() => changeQuantity(denomination, 1)}
                  onChange={(value) =>
                    setQuantities((current) => ({
                      ...current,
                      [denomination]: Math.max(0, Number(value) || 0),
                    }))
                  }
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
            <span className="text-sm font-bold text-slate-600">
              Returned Chips Total
            </span>

            <span className="text-xl font-black text-emerald-700">
              NPR {formatNumber(returnedTotal)}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ToggleGroup
              label="Payment Currency"
              value={currency}
              options={['NPR', 'INR']}
              onChange={setCurrency}
            />

            <ToggleGroup
              label="Payment Method"
              value={paymentMethod}
              options={['CASH', 'BANK', 'QR', 'CARD']}
              onChange={setPaymentMethod}
            />
          </div>

          <Field
            label={`Reference ID${referenceRequired ? ' *' : ''}`}
          >
            <input
              type="text"
              value={reference}
              disabled={!referenceRequired}
              onChange={(event) => setReference(event.target.value)}
              placeholder={
                referenceRequired
                  ? 'Enter transaction reference'
                  : 'Optional for cash payment'
              }
              className="form-input disabled:bg-slate-100 disabled:text-slate-400"
            />
          </Field>

          <Field label="Remarks">
            <textarea
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              rows={3}
              placeholder="Optional remarks"
              className="form-input resize-none"
            />
          </Field>

          <button
            type="button"
            onClick={postCashOut}
            className="h-12 w-full rounded-xl bg-amber-400 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            Post Cash-Out
          </button>
        </div>
      </div>
    </FormShell>
  )
}

const TransportClaimForm = ({ onPost, onError }) => {
  const [customerQuery, setCustomerQuery] = useState('026')
  const [verified, setVerified] = useState(false)
  const [claimType, setClaimType] = useState('Transportation')
  const [amount, setAmount] = useState('12000')
  const [currency, setCurrency] = useState('NPR')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [reference, setReference] = useState('')
  const [remarks, setRemarks] = useState(
    'Late-night customer transport return',
  )

  const referenceRequired = paymentMethod !== 'CASH'

  const postClaim = () => {
    const numericAmount = Number(amount)

    if (!verified) {
      onError('Verify the customer before posting a claim.')
      return
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      onError('Enter a valid claim amount greater than zero.')
      return
    }

    if (referenceRequired && !reference.trim()) {
      onError(`Reference is required for ${paymentMethod}.`)
      return
    }

    onPost({
      prefix: 'TR',
      type: claimType,
      badge: '026',
      customer: 'Suresh Rai',
      basis: claimType,
      amount: numericAmount,
      currency,
      payment: paymentMethod,
      reference: reference.trim(),
      remarks: remarks.trim(),
    })

    setAmount('')
    setReference('')
    setRemarks('')
    setVerified(false)
  }

  return (
    <FormShell
      title="Transportation / Other Claim"
      description="Process transportation, hotel, food, gift, emergency or other approved returns."
      tone="blue"
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <VerificationField
            value={customerQuery}
            onChange={setCustomerQuery}
            onVerify={() => setVerified(Boolean(customerQuery.trim()))}
          />

          {verified ? (
            <VerifiedCustomerCard
              name="Suresh Rai"
              cid="CID-1004"
              badge="026"
              category="Standard"
            />
          ) : (
            <VerificationPlaceholder />
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <InfoRow label="Total Buy-In" value={verified ? 'NPR 60,000' : '—'} />
            <InfoRow
              label="Total Verified Loss"
              value={verified ? 'NPR 35,000' : '—'}
            />
            <InfoRow label="Total Cash-Out" value={verified ? 'NPR 0' : '—'} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Claim Type">
              <select
                value={claimType}
                onChange={(event) => setClaimType(event.target.value)}
                className="form-input"
              >
                <option>Transportation</option>
                <option>Hotel</option>
                <option>Food</option>
                <option>Gift</option>
                <option>Emergency</option>
                <option>Medical</option>
                <option>Other</option>
              </select>
            </Field>

            <Field label="Claim Amount">
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="form-input"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ToggleGroup
              label="Payment Currency"
              value={currency}
              options={['NPR', 'INR']}
              onChange={setCurrency}
            />

            <ToggleGroup
              label="Payment Method"
              value={paymentMethod}
              options={['CASH', 'BANK', 'QR', 'CARD']}
              onChange={setPaymentMethod}
            />
          </div>

          <Field
            label={`Reference ID${referenceRequired ? ' *' : ''}`}
          >
            <input
              type="text"
              value={reference}
              disabled={!referenceRequired}
              onChange={(event) => setReference(event.target.value)}
              placeholder={
                referenceRequired
                  ? 'Enter transaction reference'
                  : 'Optional for cash payment'
              }
              className="form-input disabled:bg-slate-100 disabled:text-slate-400"
            />
          </Field>

          <ReadOnlyValue label="Issued By" value="Anil Cashier" />

          <Field label="Reason / Remarks">
            <textarea
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              rows={4}
              className="form-input resize-none"
            />
          </Field>

          <button
            type="button"
            onClick={postClaim}
            className="h-12 w-full rounded-xl bg-amber-400 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            Post Claim
          </button>
        </div>
      </div>
    </FormShell>
  )
}

const FormShell = ({ title, description, tone, children }) => {
  const tones = {
    red: 'border-red-200 text-red-700',
    green: 'border-emerald-200 text-emerald-700',
    blue: 'border-sky-200 text-sky-700',
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className={`border-b px-5 py-4 ${tones[tone]}`}>
        <h2 className="text-sm font-black uppercase tracking-[0.17em]">
          {title}
        </h2>

        <p className="mt-1 text-xs normal-case tracking-normal text-slate-500">
          {description}
        </p>
      </div>

      <div className="p-5">{children}</div>
    </section>
  )
}

const VerificationField = ({ value, onChange, onVerify }) => (
  <div>
    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
      Badge / CID / Customer Name
    </p>

    <div className="flex gap-2">
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="form-input"
        placeholder="Enter badge, CID or customer"
      />

      <button
        type="button"
        onClick={onVerify}
        className="shrink-0 rounded-xl bg-amber-400 px-5 text-sm font-black text-slate-950 hover:bg-amber-300"
      >
        Verify
      </button>
    </div>
  </div>
)

const VerifiedCustomerCard = ({ name, cid, badge, category }) => (
  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-sm font-black text-amber-700">
      {name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')}
    </span>

    <div className="min-w-0 flex-1">
      <p className="font-black text-slate-950">{name}</p>

      <p className="mt-1 text-xs text-slate-500">
        {cid} · Badge {badge} · {category}
      </p>
    </div>

    <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[10px] font-black text-emerald-700">
      VERIFIED
    </span>
  </div>
)

const VerificationPlaceholder = () => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
    Verify badge, CID or customer name to fetch the active customer session.
  </div>
)

const DenominationInput = ({
  denomination,
  quantity,
  onDecrease,
  onIncrease,
  onChange,
}) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
    <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
      NPR
    </p>

    <p className="text-sm font-black text-slate-900">
      {formatNumber(denomination)}
    </p>

    <div className="mt-3 flex items-center gap-1">
      <button
        type="button"
        onClick={onDecrease}
        className="h-8 w-8 rounded-lg border border-slate-200 bg-white font-black"
      >
        −
      </button>

      <input
        type="number"
        min="0"
        value={quantity}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white text-center text-sm font-black outline-none"
      />

      <button
        type="button"
        onClick={onIncrease}
        className="h-8 w-8 rounded-lg border border-slate-200 bg-white font-black"
      >
        +
      </button>
    </div>

    <p className="mt-2 text-center text-xs font-semibold text-slate-500">
      {formatNumber(denomination * quantity)}
    </p>
  </div>
)

const ToggleGroup = ({ label, value, options, onChange }) => (
  <div>
    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
      {label}
    </p>

    <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`min-h-9 rounded-lg px-2 text-xs font-black transition ${
            value === option
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-slate-500 hover:bg-white'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  </div>
)

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
      {label}
    </span>

    {children}
  </label>
)

const ReadOnlyValue = ({ label, value }) => (
  <div>
    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
      {label}
    </p>

    <div className="flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-900">
      {value}
    </div>
  </div>
)

const InfoRow = ({ label, value, success, strong }) => (
  <div className="flex items-center justify-between gap-4 border-b border-slate-200 py-2 last:border-b-0">
    <span className="text-sm text-slate-500">{label}</span>

    <span
      className={`text-sm ${
        success
          ? 'font-black text-emerald-700'
          : strong
            ? 'font-black text-slate-950'
            : 'font-bold text-slate-800'
      }`}
    >
      {value}
    </span>
  </div>
)

const SummaryCard = ({ label, value, icon, tone }) => {
  const tones = {
    green: 'border-emerald-200 from-white to-emerald-50',
    amber: 'border-amber-200 from-white to-amber-50',
    blue: 'border-sky-200 from-white to-sky-50',
    purple: 'border-violet-200 from-white to-violet-50',
  }

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${
        tones[tone]
      }`}
    >
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          {label}
        </p>

        <span>{icon}</span>
      </div>

      <p className="mt-5 font-serif text-2xl font-black text-slate-950">
        {value}
      </p>
    </div>
  )
}

const TransactionsSection = ({ transactions }) => (
  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 px-5 py-4">
      <h2 className="text-sm font-black uppercase tracking-[0.17em] text-slate-700">
        Today&apos;s Outflow Transactions
      </h2>

      <p className="mt-1 text-xs text-slate-500">
        Newly posted records appear here immediately.
      </p>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px]">
        <thead className="bg-slate-50">
          <tr>
            {[
              'Transaction ID',
              'Time',
              'Type',
              'Badge',
              'Customer',
              'Basis',
              'Paid Amount',
              'Currency',
              'Payment',
              'Reference',
              'Status',
            ].map((heading) => (
              <th
                key={heading}
                className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-slate-500"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {transactions.map((transaction) => (
            <TransactionRow key={transaction.id} {...transaction} />
          ))}
        </tbody>
      </table>
    </div>
  </section>
)

const TransactionRow = ({
  id,
  time,
  type,
  badge,
  customer,
  basis,
  amount,
  currency,
  payment,
  reference,
}) => (
  <tr className="border-t border-slate-100 hover:bg-slate-50">
    <td className="px-4 py-4 font-mono text-xs font-black text-slate-700">
      {id}
    </td>
    <td className="px-4 py-4 text-sm text-slate-600">{time}</td>
    <td className="px-4 py-4 text-sm font-bold text-slate-700">{type}</td>
    <td className="px-4 py-4">
      <span className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 font-mono text-xs font-black text-amber-700">
        {badge}
      </span>
    </td>
    <td className="px-4 py-4 text-sm font-black text-slate-900">
      {customer}
    </td>
    <td className="px-4 py-4 text-sm text-slate-600">{basis}</td>
    <td className="px-4 py-4 text-sm font-black text-slate-900">
      {amount}
    </td>
    <td className="px-4 py-4 text-sm text-slate-600">{currency}</td>
    <td className="px-4 py-4 text-sm text-slate-600">{payment}</td>
    <td className="px-4 py-4 text-sm text-slate-600">{reference}</td>
    <td className="px-4 py-4">
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
        POSTED
      </span>
    </td>
  </tr>
)

const formatNumber = (value) =>
  Number(value || 0).toLocaleString('en-IN')

export default LosingReturnPreview
