import { useEffect, useMemo, useRef, useState } from 'react'
import cashierApi from '../../api/cashierApi'
import receptionApi from '../../api/receptionApi'
import useAuth from '../../hooks/useAuth'
import { getErrorMessage } from '../../utils/errorUtils'

const PAGE_SIZE = 8

const initialTransactions = [
  {
    id: 'BI-2026-07-15-001',
    type: 'CHIP_BUY_IN',
    time: '18:42',
    badge: '001',
    cid: 'CID-1001',
    customer: 'Raj Sharma',
    currency: 'NPR',
    originalAmount: 250000,
    exchangeRate: 1,
    nprAmount: 250000,
    paymentMethod: 'Cash',
    reference: '',
    machineType: '',
    machineNumber: '',
    source: '',
    shift: '',
    remarks: '',
    cashier: 'Prototype record',
    status: 'DEMO RECORD',
  },
  {
    id: 'BI-2026-07-15-002',
    type: 'CHIP_BUY_IN',
    time: '19:11',
    badge: '002',
    cid: 'CID-1002',
    customer: 'Amit Verma',
    currency: 'NPR',
    originalAmount: 30000,
    exchangeRate: 1,
    nprAmount: 30000,
    paymentMethod: 'Cash',
    reference: '',
    machineType: '',
    machineNumber: '',
    source: '',
    shift: '',
    remarks: '',
    cashier: 'Prototype record',
    status: 'DEMO RECORD',
  },
  {
    id: 'MC-2026-07-15-003',
    type: 'MACHINE_CASH_IN',
    time: '17:08',
    badge: '003',
    cid: 'CID-1003',
    customer: 'Daniel Smith',
    currency: 'INR',
    originalAmount: 15000,
    exchangeRate: 1.6,
    nprAmount: 24000,
    paymentMethod: 'Bank',
    reference: 'TXN-884291',
    machineType: 'Slot Machine',
    machineNumber: 'Slot-07',
    source: '',
    shift: '',
    remarks: '',
    cashier: 'Prototype record',
    status: 'DEMO RECORD',
  },
  {
    id: 'BI-2026-07-15-004',
    type: 'CHIP_BUY_IN',
    time: '20:24',
    badge: '005',
    cid: 'CID-1005',
    customer: 'Priya Tamang',
    currency: 'NPR',
    originalAmount: 400000,
    exchangeRate: 1,
    nprAmount: 400000,
    paymentMethod: 'Card',
    reference: 'CARD-190382',
    machineType: '',
    machineNumber: '',
    source: '',
    shift: '',
    remarks: '',
    cashier: 'Prototype record',
    status: 'DEMO RECORD',
  },
  {
    id: 'TP-2026-07-15-005',
    type: 'TIPS',
    time: '20:15',
    badge: '',
    cid: '',
    customer: '',
    currency: 'NPR',
    originalAmount: 18400,
    exchangeRate: 1,
    nprAmount: 18400,
    paymentMethod: 'Cash',
    reference: '',
    machineType: '',
    machineNumber: '',
    source: 'Gaming Floor',
    shift: 'Day 13:00–23:00',
    remarks: 'Good table performance',
    cashier: 'Prototype record',
    status: 'DEMO RECORD',
  },
]

const emptyChipForm = {
  customerSearch: '',
  customer: null,
  currency: 'NPR',
  amount: '',
  exchangeRate: '1.60',
  paymentMethod: 'Cash',
  reference: '',
  denominations: {
    500: 0,
    1000: 0,
    5000: 0,
    10000: 0,
    25000: 0,
  },
  remarks: '',
}

const emptyMachineForm = {
  customerSearch: '',
  customer: null,
  currency: 'NPR',
  amount: '',
  exchangeRate: '1.60',
  paymentMethod: 'Cash',
  reference: '',
  machineType: 'Slot Machine',
  machineNumber: '',
  remarks: '',
}

const emptyTipsForm = {
  source: 'Gaming Floor',
  shift: 'Day 13:00–23:00',
  currency: 'NPR',
  amount: '',
  exchangeRate: '1.60',
  paymentMethod: 'Cash',
  reference: '',
  remarks: '',
}

const formatNpr = (value) =>
  `NPR ${Number(value || 0).toLocaleString('en-IN')}`

const formatOriginal = (currency, value) =>
  `${currency} ${Number(value || 0).toLocaleString('en-IN')}`

const getCurrentTime = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

const getCurrentTimeFromTimestamp = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

const paymentModeLabel = (mode) =>
  ({ CASH: 'Cash', BANK: 'Bank', QR: 'QR', CARD: 'Card' })[mode] || mode || 'Unknown'

const transactionTypeLabel = {
  CHIP_BUY_IN: 'Chip Buy-In',
  MACHINE_CASH_IN: 'Machine Cash-In',
  TIPS: 'Tips Collection',
}

const typePrefix = {
  CHIP_BUY_IN: 'BI',
  MACHINE_CASH_IN: 'MC',
  TIPS: 'TP',
}

const requiresReference = (paymentMethod) =>
  ['QR', 'Card', 'Bank'].includes(paymentMethod)

const paymentModeMap = {
  Cash: 'CASH',
  Bank: 'BANK',
  QR: 'QR',
  Card: 'CARD',
}

const createIdempotencyKey = () =>
  globalThis.crypto?.randomUUID?.() ||
  `buyin-${Date.now()}-${Math.random().toString(36).slice(2)}`

const mapBackendCustomer = (customer) => ({
  id: customer.id,
  cid: customer.customerCode || 'Code unavailable',
  name: customer.fullName || 'Name unavailable',
  initials: String(customer.fullName || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase(),
  phone: customer.phone || '',
  nationality: customer.nationality || '',
  category: customer.category || 'Category unavailable',
  status: customer.status || 'Status unavailable',
  hasActiveSession: Boolean(customer.hasActiveSession),
  activeSessionId: customer.activeSessionId || null,
})

const inputClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'

const selectClass = inputClass

const buttonBase =
  'inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50'

const Field = ({ label, required, error, children, hint }) => (
  <label className="block">
    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </span>
    {children}
    {hint && !error && (
      <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>
    )}
    {error && (
      <span className="mt-1.5 block text-xs font-bold text-red-600">{error}</span>
    )}
  </label>
)

const CurrencyToggle = ({ value, onChange }) => (
  <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
    {['NPR', 'INR'].map((currency) => (
      <button
        key={currency}
        type="button"
        onClick={() => onChange(currency)}
        className={`rounded-lg px-3 py-2.5 text-sm font-black transition ${
          value === currency
            ? 'bg-amber-400 text-slate-950 shadow-sm'
            : 'text-slate-500 hover:bg-white'
        }`}
      >
        {currency}
      </button>
    ))}
  </div>
)

const CustomerCard = ({ customer, onClear }) => {
  if (!customer) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
        <p className="text-sm font-bold text-slate-600">
          Verify a customer code, name, phone or nationality.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          The customer must have an active reception session.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-black text-amber-700">
          {customer.initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-slate-950">{customer.name}</p>
            <span className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-black text-emerald-700">
              ACTIVE SESSION
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {customer.cid} · {customer.phone || 'Phone unavailable'} · {customer.category}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {customer.sessionCode || 'Session code unavailable'} · Badge unavailable
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-black text-slate-500 hover:text-red-600"
        >
          Clear
        </button>
      </div>
    </div>
  )
}

const SummaryCard = ({ label, value, note, icon, tone = 'slate' }) => {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50/60',
    sky: 'border-sky-200 bg-sky-50/60',
    purple: 'border-purple-200 bg-purple-50/60',
    amber: 'border-amber-200 bg-amber-50/60',
    cyan: 'border-cyan-200 bg-cyan-50/60',
    slate: 'border-slate-200 bg-white',
  }

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.17em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 font-serif text-xl font-black text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{note}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
          {icon}
        </span>
      </div>
    </div>
  )
}

const Panel = ({ title, description, children, footer }) => (
  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 px-5 py-4">
      <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-800">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      )}
    </div>
    <div className="p-5">{children}</div>
    {footer}
  </section>
)

const CashCollectionBuyIn = () => {
  const { user } = useAuth()
  const [customers, setCustomers] = useState([])
  const [businessDate, setBusinessDate] = useState(null)
  const [isLoadingContext, setIsLoadingContext] = useState(true)
  const [contextError, setContextError] = useState(null)
  const [reconciliationFinalized, setReconciliationFinalized] = useState(false)
  const [isVerifyingCustomer, setIsVerifyingCustomer] = useState(false)
  const [transactions, setTransactions] = useState(initialTransactions)
  const [activeForm, setActiveForm] = useState('CHIP_BUY_IN')
  const [historyType, setHistoryType] = useState('ALL')
  const [historySearch, setHistorySearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('ALL')
  const [currencyFilter, setCurrencyFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [chipForm, setChipForm] = useState(emptyChipForm)
  const [machineForm, setMachineForm] = useState(emptyMachineForm)
  const [tipsForm, setTipsForm] = useState(emptyTipsForm)
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState(null)
  const [posting, setPosting] = useState(false)
  const chipSubmissionRef = useRef({ key: null, signature: null })

  const cashierDisplay = user?.fullName || user?.username || 'Authenticated user unavailable'
  const cashierRole = user?.role || 'Role unavailable'
  const businessDateValue = businessDate?.businessDate || null

  useEffect(() => {
    let active = true

    const loadContext = async () => {
      setIsLoadingContext(true)
      setContextError(null)

      const [customersResult, businessDateResult, reconciliationResult, buyInHistoryResult] = await Promise.allSettled([
        receptionApi.getCustomers(),
        receptionApi.getCurrentOpenBusinessDate(),
        cashierApi.getCurrentCashierReconciliation(),
        cashierApi.getCurrentBusinessDateBuyIns(),
      ])

      if (!active) return

      const errors = []

      if (customersResult.status === 'fulfilled') {
        const records = Array.isArray(customersResult.value)
          ? customersResult.value
          : []
        setCustomers(records.map(mapBackendCustomer))
      } else {
        setCustomers([])
        errors.push('Unable to load the customer directory.')
      }

      if (businessDateResult.status === 'fulfilled') {
        setBusinessDate(businessDateResult.value)
        if (!businessDateResult.value) {
          errors.push('No business date is currently open.')
        }
      } else {
        setBusinessDate(null)
        errors.push('Unable to load the current business date.')
      }

      if (reconciliationResult.status === 'fulfilled') {
        setReconciliationFinalized(reconciliationResult.value?.lifecycleStatus === 'SUBMITTED')
      } else {
        setReconciliationFinalized(false)
        errors.push('Unable to verify cashier reconciliation status.')
      }

      if (buyInHistoryResult.status === 'fulfilled') {
        const persisted = (Array.isArray(buyInHistoryResult.value) ? buyInHistoryResult.value : [])
          .map((item) => mapPersistedBuyIn(item.transaction, { cid: item.customerCode, name: item.customerName }))
        setTransactions((current) => mergePersistedTransactions(current, persisted))
      } else {
        errors.push('Unable to load persisted Chip Buy-In history.')
      }

      setContextError(errors.length ? errors.join(' ') : null)
      setIsLoadingContext(false)
    }

    loadContext()

    return () => {
      active = false
    }
  }, [])

  const summary = useMemo(() => {
    const persistedChipTransactions = transactions.filter(
      (transaction) =>
        transaction.type === 'CHIP_BUY_IN' && transaction.status === 'PERSISTED',
    )
    const sumByType = (type) =>
      transactions
        .filter((transaction) => transaction.type === type)
        .reduce((total, transaction) => total + transaction.nprAmount, 0)

    const nonCash = persistedChipTransactions
      .filter((transaction) =>
        ['QR', 'Card', 'Bank'].includes(transaction.paymentMethod),
      )
      .reduce((total, transaction) => total + transaction.nprAmount, 0)

    const cashReceived = persistedChipTransactions
      .filter((transaction) => transaction.paymentMethod === 'Cash')
      .reduce((total, transaction) => total + transaction.nprAmount, 0)

    return {
      chip: persistedChipTransactions.reduce(
        (total, transaction) => total + transaction.nprAmount,
        0,
      ),
      machine: sumByType('MACHINE_CASH_IN'),
      tips: sumByType('TIPS'),
      total: persistedChipTransactions.reduce(
        (total, transaction) => total + transaction.nprAmount,
        0,
      ),
      nonCash,
      cashReceived,
      count: persistedChipTransactions.length,
    }
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    const query = historySearch.trim().toLowerCase()

    return transactions.filter((transaction) => {
      const typeMatches =
        historyType === 'ALL' || transaction.type === historyType
      const methodMatches =
        methodFilter === 'ALL' ||
        transaction.paymentMethod === methodFilter
      const currencyMatches =
        currencyFilter === 'ALL' || transaction.currency === currencyFilter
      const queryMatches =
        !query ||
        transaction.id.toLowerCase().includes(query) ||
        transaction.customer.toLowerCase().includes(query) ||
        transaction.cid.toLowerCase().includes(query) ||
        transaction.badge.toLowerCase().includes(query) ||
        transaction.reference.toLowerCase().includes(query) ||
        transaction.machineNumber.toLowerCase().includes(query) ||
        transaction.source.toLowerCase().includes(query)

      return typeMatches && methodMatches && currencyMatches && queryMatches
    })
  }, [
    currencyFilter,
    historySearch,
    historyType,
    methodFilter,
    transactions,
  ])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / PAGE_SIZE),
  )

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 3000)
  }

  const findCustomer = (query) => {
    const normalized = query.trim().toLowerCase()

    if (!normalized) {
      return null
    }

    return customers.find(
      (customer) =>
        customer.cid.toLowerCase() === normalized ||
        customer.name.toLowerCase().includes(normalized) ||
        customer.phone.toLowerCase().includes(normalized) ||
        customer.nationality.toLowerCase().includes(normalized),
    )
  }

  const getVerifiedActiveCustomer = async (query) => {
    if (isLoadingContext) {
      throw new Error('Customer data is still loading. Please wait.')
    }

    const found = findCustomer(query)

    if (!found) {
      throw new Error('No matching backend customer was found.')
    }

    if (String(found.status).toUpperCase() !== 'ACTIVE') {
      throw new Error('This customer is not active.')
    }

    const activeSession = await receptionApi.getActiveSession(found.id)

    if (!activeSession) {
      throw new Error('This customer does not have an active reception session.')
    }

    return {
      ...found,
      sessionId: activeSession.id || found.activeSessionId,
      sessionCode: activeSession.sessionCode || 'Session code unavailable',
      sessionBusinessDate: activeSession.businessDate || null,
      entryTime: activeSession.entryTime || null,
    }
  }

  const mapPersistedBuyIn = (buyIn, customer) => ({
    id: buyIn.buyInCode || buyIn.id,
    backendId: buyIn.id,
    type: 'CHIP_BUY_IN',
    time: buyIn.createdAt ? getCurrentTimeFromTimestamp(buyIn.createdAt) : '—',
    customerId: buyIn.customerId,
    badge: '',
    cid: customer?.cid || '',
    customer: customer?.name || '',
    currency: 'NPR',
    originalAmount: Number(buyIn.amountReceived || 0),
    exchangeRate: 1,
    nprAmount: Number(buyIn.totalChipValueIssued || 0),
    paymentMethod: paymentModeLabel(buyIn.paymentMode),
    reference: buyIn.paymentReference || '',
    machineType: '',
    machineNumber: '',
    source: '',
    shift: '',
    remarks: buyIn.remarks || '',
    cashier: buyIn.createdBy?.username || 'Backend user',
    status: 'PERSISTED',
  })

  const mergePersistedTransactions = (current, incoming) => {
    const byBackendId = new Map()
    incoming.filter((item) => item.backendId)
      .forEach((item) => byBackendId.set(item.backendId, item))
    current.filter((item) => item.status === 'PERSISTED' && item.backendId)
      .forEach((item) => {
        if (!byBackendId.has(item.backendId)) {
          byBackendId.set(item.backendId, item)
        }
      })
    return [
      ...byBackendId.values(),
      ...current.filter((item) => item.status !== 'PERSISTED'),
    ]
  }

  const refreshCurrentBusinessDateBuyIns = async () => {
    const records = await cashierApi.getCurrentBusinessDateBuyIns()
    const persisted = (Array.isArray(records) ? records : [])
      .map((item) => mapPersistedBuyIn(item.transaction, { cid: item.customerCode, name: item.customerName }))
    setTransactions((current) => mergePersistedTransactions(current, persisted))
  }

  const refreshPersistedChipBuyIns = async (customer) => {
    const records = await cashierApi.getBuyInsBySession(customer.sessionId)
    const persisted = Array.isArray(records)
      ? records.map((record) => mapPersistedBuyIn(record, customer))
      : []
    setTransactions((current) => mergePersistedTransactions(current, persisted))
  }

  const verifyChipCustomer = async () => {
    setIsVerifyingCustomer(true)

    try {
      const found = await getVerifiedActiveCustomer(chipForm.customerSearch)
      setChipForm((current) => ({ ...current, customer: found }))
      await refreshPersistedChipBuyIns(found)
      setErrors((current) => ({ ...current, chipCustomer: '' }))
      showToast(`${found.name} verified for chip buy-in.`)
    } catch (error) {
      setChipForm((current) => ({ ...current, customer: null }))
      setErrors((current) => ({
        ...current,
        chipCustomer: error.message || 'Unable to verify the customer session.',
      }))
    } finally {
      setIsVerifyingCustomer(false)
    }
  }

  const verifyMachineCustomer = async () => {
    setIsVerifyingCustomer(true)

    try {
      const found = await getVerifiedActiveCustomer(machineForm.customerSearch)
      setMachineForm((current) => ({ ...current, customer: found }))
      setErrors((current) => ({ ...current, machineCustomer: '' }))
      showToast(`${found.name} verified for machine cash-in.`)
    } catch (error) {
      setMachineForm((current) => ({ ...current, customer: null }))
      setErrors((current) => ({
        ...current,
        machineCustomer: error.message || 'Unable to verify the customer session.',
      }))
    } finally {
      setIsVerifyingCustomer(false)
    }
  }

  const parseAmount = (value) =>
    Number(String(value || '').replaceAll(',', '').trim())

  const convertedAmount = (currency, amount, rate) => {
    const numericAmount = parseAmount(amount)
    const numericRate = parseAmount(rate)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return 0
    }

    if (currency === 'NPR') {
      return numericAmount
    }

    if (!Number.isFinite(numericRate) || numericRate <= 0) {
      return 0
    }

    return Math.round(numericAmount * numericRate)
  }

  const chipDenominationTotal = useMemo(
    () =>
      Object.entries(chipForm.denominations).reduce(
        (total, [denomination, quantity]) =>
          total + Number(denomination) * Number(quantity || 0),
        0,
      ),
    [chipForm.denominations],
  )

  const validateChip = () => {
    const nextErrors = {}
    const amount = parseAmount(chipForm.amount)
    const nprAmount = convertedAmount(
      chipForm.currency,
      chipForm.amount,
      chipForm.exchangeRate,
    )

    if (!chipForm.customer) {
      nextErrors.chipCustomer = 'Verify a customer before posting.'
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      nextErrors.chipAmount = 'Enter a valid amount greater than zero.'
    }

    if (
      chipForm.currency === 'INR' &&
      (!Number.isFinite(parseAmount(chipForm.exchangeRate)) ||
        parseAmount(chipForm.exchangeRate) <= 0)
    ) {
      nextErrors.chipRate = 'Enter a valid INR to NPR exchange rate.'
    }

    if (
      requiresReference(chipForm.paymentMethod) &&
      !chipForm.reference.trim()
    ) {
      nextErrors.chipReference = `Reference is required for ${chipForm.paymentMethod}.`
    }

    if (chipDenominationTotal <= 0) {
      nextErrors.chipDenominations =
        'Enter at least one chip denomination quantity.'
    }

    if (chipDenominationTotal !== nprAmount) {
      nextErrors.chipDenominations = `Chip total ${formatNpr(
        chipDenominationTotal,
      )} must equal the NPR transaction value ${formatNpr(nprAmount)}.`
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const canPostChipBuyIn = useMemo(() => {
    const amount = parseAmount(chipForm.amount)
    return Boolean(
      chipForm.customer?.id &&
        chipForm.customer?.sessionId &&
        chipForm.currency === 'NPR' &&
        Number.isFinite(amount) &&
        amount > 0 &&
        chipDenominationTotal > 0 &&
        amount === chipDenominationTotal &&
        (!requiresReference(chipForm.paymentMethod) || chipForm.reference.trim()) &&
        businessDateValue &&
        !reconciliationFinalized &&
        !posting,
    )
  }, [businessDateValue, chipDenominationTotal, chipForm, posting, reconciliationFinalized])

  const validateMachine = () => {
    const nextErrors = {}
    const amount = parseAmount(machineForm.amount)

    if (!machineForm.customer) {
      nextErrors.machineCustomer = 'Verify a customer before posting.'
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      nextErrors.machineAmount = 'Enter a valid amount greater than zero.'
    }

    if (
      machineForm.currency === 'INR' &&
      (!Number.isFinite(parseAmount(machineForm.exchangeRate)) ||
        parseAmount(machineForm.exchangeRate) <= 0)
    ) {
      nextErrors.machineRate = 'Enter a valid INR to NPR exchange rate.'
    }

    if (
      requiresReference(machineForm.paymentMethod) &&
      !machineForm.reference.trim()
    ) {
      nextErrors.machineReference = `Reference is required for ${machineForm.paymentMethod}.`
    }

    if (!machineForm.machineNumber.trim()) {
      nextErrors.machineNumber = 'Machine number is required.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const validateTips = () => {
    const nextErrors = {}
    const amount = parseAmount(tipsForm.amount)

    if (!Number.isFinite(amount) || amount <= 0) {
      nextErrors.tipsAmount = 'Enter a valid amount greater than zero.'
    }

    if (
      tipsForm.currency === 'INR' &&
      (!Number.isFinite(parseAmount(tipsForm.exchangeRate)) ||
        parseAmount(tipsForm.exchangeRate) <= 0)
    ) {
      nextErrors.tipsRate = 'Enter a valid INR to NPR exchange rate.'
    }

    if (
      requiresReference(tipsForm.paymentMethod) &&
      !tipsForm.reference.trim()
    ) {
      nextErrors.tipsReference = `Reference is required for ${tipsForm.paymentMethod}.`
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const createTransactionId = (type) => {
    const nextNumber = transactions.length + 1
    return `${typePrefix[type]}-${businessDateValue || 'NO-OPEN-DATE'}-${String(nextNumber).padStart(
      3,
      '0',
    )}`
  }

  const postChipBuyIn = async () => {
    if (!validateChip() || posting || chipForm.currency !== 'NPR') {
      return
    }

    const amountReceived = parseAmount(chipForm.amount)
    const payloadWithoutKey = {
      customerId: chipForm.customer.id,
      customerSessionId: chipForm.customer.sessionId,
      amountReceived,
      paymentMode: paymentModeMap[chipForm.paymentMethod],
      totalChipValueIssued: chipDenominationTotal,
      paymentReference: requiresReference(chipForm.paymentMethod)
        ? chipForm.reference.trim()
        : null,
      remarks: chipForm.remarks.trim() || null,
    }
    const signature = JSON.stringify(payloadWithoutKey)

    if (chipSubmissionRef.current.signature !== signature) {
      chipSubmissionRef.current = {
        key: createIdempotencyKey(),
        signature,
      }
    }

    setPosting(true)
    setErrors({})
    try {
      const created = await cashierApi.createBuyIn({
        ...payloadWithoutKey,
        idempotencyKey: chipSubmissionRef.current.key,
      })

      await refreshCurrentBusinessDateBuyIns()
      setCurrentPage(1)
      setChipForm((current) => ({
        ...emptyChipForm,
        customerSearch: current.customerSearch,
        customer: current.customer,
      }))
      chipSubmissionRef.current = { key: null, signature: null }
      showToast(
        `Chip Buy-In ${created.buyInCode} posted successfully. ${formatNpr(
          created.amountReceived,
        )} received.`,
      )
    } catch (error) {
      const status = error.response?.status
      const backendMessage = getErrorMessage(error)
      const message =
        status === 409
          ? backendMessage || 'This transaction conflicts with an earlier submission.'
          : backendMessage
      setErrors((current) => ({ ...current, chipSubmit: message }))
      showToast(message, 'error')
    } finally {
      setPosting(false)
    }
  }

  const postTransaction = (type) => {
    const isValid =
      type === 'CHIP_BUY_IN'
        ? validateChip()
        : type === 'MACHINE_CASH_IN'
          ? validateMachine()
          : validateTips()

    if (!isValid || posting) {
      return
    }

    setPosting(true)

    const form =
      type === 'CHIP_BUY_IN'
        ? chipForm
        : type === 'MACHINE_CASH_IN'
          ? machineForm
          : tipsForm

    const customer = type === 'TIPS' ? null : form.customer
    const originalAmount = parseAmount(form.amount)
    const exchangeRate =
      form.currency === 'NPR' ? 1 : parseAmount(form.exchangeRate)
    const nprAmount = convertedAmount(
      form.currency,
      form.amount,
      form.exchangeRate,
    )

    const transaction = {
      id: createTransactionId(type),
      type,
      time: getCurrentTime(),
      customerId: customer?.id || null,
      badge: '',
      cid: customer?.cid || '',
      customer: customer?.name || '',
      currency: form.currency,
      originalAmount,
      exchangeRate,
      nprAmount,
      paymentMethod: form.paymentMethod,
      reference: form.reference.trim(),
      machineType:
        type === 'MACHINE_CASH_IN' ? form.machineType : '',
      machineNumber:
        type === 'MACHINE_CASH_IN'
          ? form.machineNumber.trim()
          : '',
      source: type === 'TIPS' ? form.source : '',
      shift: type === 'TIPS' ? form.shift : '',
      remarks: form.remarks.trim(),
      cashier: cashierDisplay,
      status: 'LOCAL ONLY',
    }

    setTransactions((current) => [transaction, ...current])
    setCurrentPage(1)

    if (type === 'CHIP_BUY_IN') {
      setChipForm(emptyChipForm)
    } else if (type === 'MACHINE_CASH_IN') {
      setMachineForm(emptyMachineForm)
    } else {
      setTipsForm(emptyTipsForm)
    }

    setErrors({})
    showToast(`${transactionTypeLabel[type]} added to local prototype history.`)
    setPosting(false)
  }

  const exportCsv = () => {
    const header = [
      'Transaction ID',
      'Type',
      'Business Date',
      'Time',
      'Badge',
      'CID',
      'Customer',
      'Currency',
      'Original Amount',
      'Exchange Rate',
      'NPR Amount',
      'Payment Method',
      'Reference',
      'Machine Type',
      'Machine Number',
      'Source',
      'Shift',
      'Cashier',
      'Status',
      'Remarks',
    ]

    const rows = filteredTransactions.map((transaction) => [
      transaction.id,
      transactionTypeLabel[transaction.type],
      businessDateValue || 'No open business date',
      transaction.time,
      transaction.badge,
      transaction.cid,
      transaction.customer,
      transaction.currency,
      transaction.originalAmount,
      transaction.exchangeRate,
      transaction.nprAmount,
      transaction.paymentMethod,
      transaction.reference,
      transaction.machineType,
      transaction.machineNumber,
      transaction.source,
      transaction.shift,
      transaction.cashier,
      transaction.status,
      transaction.remarks,
    ])

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`)
          .join(','),
      )
      .join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = `cash-collection-${businessDateValue || 'no-open-date'}.csv`
    anchor.click()

    URL.revokeObjectURL(url)
    showToast('CSV exported successfully.')
  }

  const clearHistoryFilters = () => {
    setHistorySearch('')
    setMethodFilter('ALL')
    setCurrencyFilter('ALL')
    setHistoryType('ALL')
    setCurrentPage(1)
  }

  const renderChipForm = () => {
    const converted = convertedAmount(
      chipForm.currency,
      chipForm.amount,
      chipForm.exchangeRate,
    )

    return (
      <Panel
        title="Chip Buy-In"
        description="Verify the customer, collect payment and issue chips by denomination."
      >
        {reconciliationFinalized && <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-black text-amber-800">CASHIER RECONCILIATION SUBMITTED — new Chip Buy-Ins are disabled for this Business Date.</div>}
        <div className="grid gap-5 xl:grid-cols-[1fr_0.95fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Field
                label="Customer Code, Name, Phone or Nationality"
                required
                error={errors.chipCustomer}
              >
                <input
                  value={chipForm.customerSearch}
                  onChange={(event) =>
                    setChipForm((current) => ({
                      ...current,
                      customerSearch: event.target.value,
                      customer: null,
                    }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      verifyChipCustomer()
                    }
                  }}
                  className={inputClass}
                  placeholder="Search the real customer directory"
                />
              </Field>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={verifyChipCustomer}
                  disabled={isLoadingContext || isVerifyingCustomer}
                  className={`${buttonBase} bg-amber-400 text-slate-950 hover:bg-amber-300`}
                >
                  {isVerifyingCustomer ? 'Verifying…' : 'Verify Customer'}
                </button>
              </div>
            </div>

            <CustomerCard
              customer={chipForm.customer}
              onClear={() =>
                setChipForm((current) => ({
                  ...current,
                  customer: null,
                  customerSearch: '',
                }))
              }
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Currency" required>
                <CurrencyToggle
                  value={chipForm.currency}
                  onChange={(currency) =>
                    setChipForm((current) => ({
                      ...current,
                      currency,
                    }))
                  }
                />
              </Field>

              <Field
                label="Amount Received"
                required
                error={errors.chipAmount}
              >
                <input
                  inputMode="decimal"
                  value={chipForm.amount}
                  onChange={(event) =>
                    setChipForm((current) => ({
                      ...current,
                      amount: event.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="Enter amount"
                />
              </Field>
            </div>

            {chipForm.currency === 'INR' && (
              <div className="space-y-3">
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                  INR real posting is not yet enabled. Select NPR to post a Chip Buy-In.
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="INR to NPR Exchange Rate"
                  required
                  error={errors.chipRate}
                >
                  <input
                    inputMode="decimal"
                    value={chipForm.exchangeRate}
                    onChange={(event) =>
                      setChipForm((current) => ({
                        ...current,
                        exchangeRate: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Converted NPR Value">
                  <input
                    readOnly
                    value={formatNpr(converted)}
                    className={`${inputClass} bg-slate-50 font-black`}
                  />
                </Field>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Payment Method" required>
                <select
                  value={chipForm.paymentMethod}
                  onChange={(event) =>
                    setChipForm((current) => ({
                      ...current,
                      paymentMethod: event.target.value,
                      reference:
                        event.target.value === 'Cash'
                          ? ''
                          : current.reference,
                    }))
                  }
                  className={selectClass}
                >
                  <option>Cash</option>
                  <option>QR</option>
                  <option>Card</option>
                  <option>Bank</option>
                </select>
              </Field>

              <Field
                label="Reference / Transaction ID"
                required={requiresReference(chipForm.paymentMethod)}
                error={errors.chipReference}
              >
                <input
                  value={chipForm.reference}
                  onChange={(event) =>
                    setChipForm((current) => ({
                      ...current,
                      reference: event.target.value,
                    }))
                  }
                  disabled={!requiresReference(chipForm.paymentMethod)}
                  className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-400`}
                  placeholder={
                    requiresReference(chipForm.paymentMethod)
                      ? 'Enter payment reference'
                      : 'Not required for cash'
                  }
                />
              </Field>
            </div>

            <Field label="Remarks">
              <textarea
                rows={3}
                value={chipForm.remarks}
                onChange={(event) =>
                  setChipForm((current) => ({
                    ...current,
                    remarks: event.target.value,
                  }))
                }
                className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                placeholder="Optional cashier note"
              />
            </Field>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Chip Denominations
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Enter quantities only. Total is calculated automatically.
                </p>
              </div>
              <span className="rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-800 shadow-sm">
                {formatNpr(chipDenominationTotal)}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {Object.entries(chipForm.denominations).map(
                ([denomination, quantity]) => (
                  <div
                    key={denomination}
                    className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                  >
                    <div>
                      <p className="text-xs font-black text-slate-500">NPR</p>
                      <p className="font-black text-slate-900">
                        {Number(denomination).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setChipForm((current) => ({
                          ...current,
                          denominations: {
                            ...current.denominations,
                            [denomination]: Math.max(
                              0,
                              Number(quantity) - 1,
                            ),
                          },
                        }))
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 font-black hover:bg-slate-100"
                    >
                      −
                    </button>
                    <input
                      min="0"
                      type="number"
                      value={quantity}
                      onChange={(event) =>
                        setChipForm((current) => ({
                          ...current,
                          denominations: {
                            ...current.denominations,
                            [denomination]: Math.max(
                              0,
                              Number(event.target.value),
                            ),
                          },
                        }))
                      }
                      className="h-9 w-16 rounded-lg border border-slate-200 text-center text-sm font-black outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setChipForm((current) => ({
                          ...current,
                          denominations: {
                            ...current.denominations,
                            [denomination]: Number(quantity) + 1,
                          },
                        }))
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 font-black hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>
                ),
              )}
            </div>

            {errors.chipDenominations && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                {errors.chipDenominations}
              </p>
            )}

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-amber-800">
                  Transaction NPR value
                </span>
                <span className="font-black text-amber-900">
                  {formatNpr(converted)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-amber-800">
                  Difference
                </span>
                <span
                  className={`font-black ${
                    chipDenominationTotal === converted
                      ? 'text-emerald-700'
                      : 'text-red-700'
                  }`}
                >
                  {formatNpr(converted - chipDenominationTotal)}
                </span>
              </div>
            </div>

            {errors.chipSubmit && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                {errors.chipSubmit}
              </p>
            )}

            <button
              type="button"
              disabled={!canPostChipBuyIn}
              onClick={postChipBuyIn}
              className="mt-4 h-12 w-full rounded-xl bg-amber-400 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:opacity-50"
            >
              {posting ? 'Posting…' : 'Post Chip Buy-In'}
            </button>
          </div>
        </div>
      </Panel>
    )
  }

  const renderMachineForm = () => {
    const converted = convertedAmount(
      machineForm.currency,
      machineForm.amount,
      machineForm.exchangeRate,
    )

    return (
      <Panel
        title="Machine Cash-In"
        description="Redeem a customer payment into a slot or automatic roulette wallet."
      >
        <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Field
                label="Customer Code, Name, Phone or Nationality"
                required
                error={errors.machineCustomer}
              >
                <input
                  value={machineForm.customerSearch}
                  onChange={(event) =>
                    setMachineForm((current) => ({
                      ...current,
                      customerSearch: event.target.value,
                      customer: null,
                    }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      verifyMachineCustomer()
                    }
                  }}
                  className={inputClass}
                  placeholder="Search the real customer directory"
                />
              </Field>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={verifyMachineCustomer}
                  disabled={isLoadingContext || isVerifyingCustomer}
                  className={`${buttonBase} bg-sky-500 text-white hover:bg-sky-400`}
                >
                  {isVerifyingCustomer ? 'Verifying…' : 'Verify Customer'}
                </button>
              </div>
            </div>

            <CustomerCard
              customer={machineForm.customer}
              onClear={() =>
                setMachineForm((current) => ({
                  ...current,
                  customer: null,
                  customerSearch: '',
                }))
              }
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Currency" required>
                <CurrencyToggle
                  value={machineForm.currency}
                  onChange={(currency) =>
                    setMachineForm((current) => ({
                      ...current,
                      currency,
                    }))
                  }
                />
              </Field>
              <Field
                label="Amount Received"
                required
                error={errors.machineAmount}
              >
                <input
                  inputMode="decimal"
                  value={machineForm.amount}
                  onChange={(event) =>
                    setMachineForm((current) => ({
                      ...current,
                      amount: event.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="Enter amount"
                />
              </Field>
            </div>

            {machineForm.currency === 'INR' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="INR to NPR Exchange Rate"
                  required
                  error={errors.machineRate}
                >
                  <input
                    inputMode="decimal"
                    value={machineForm.exchangeRate}
                    onChange={(event) =>
                      setMachineForm((current) => ({
                        ...current,
                        exchangeRate: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Converted NPR Value">
                  <input
                    readOnly
                    value={formatNpr(converted)}
                    className={`${inputClass} bg-slate-50 font-black`}
                  />
                </Field>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Payment Method" required>
                <select
                  value={machineForm.paymentMethod}
                  onChange={(event) =>
                    setMachineForm((current) => ({
                      ...current,
                      paymentMethod: event.target.value,
                      reference:
                        event.target.value === 'Cash'
                          ? ''
                          : current.reference,
                    }))
                  }
                  className={selectClass}
                >
                  <option>Cash</option>
                  <option>QR</option>
                  <option>Card</option>
                  <option>Bank</option>
                </select>
              </Field>

              <Field
                label="Reference / Transaction ID"
                required={requiresReference(machineForm.paymentMethod)}
                error={errors.machineReference}
              >
                <input
                  value={machineForm.reference}
                  onChange={(event) =>
                    setMachineForm((current) => ({
                      ...current,
                      reference: event.target.value,
                    }))
                  }
                  disabled={!requiresReference(machineForm.paymentMethod)}
                  className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-400`}
                  placeholder={
                    requiresReference(machineForm.paymentMethod)
                      ? 'Enter payment reference'
                      : 'Not required for cash'
                  }
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Machine Type" required>
                <select
                  value={machineForm.machineType}
                  onChange={(event) =>
                    setMachineForm((current) => ({
                      ...current,
                      machineType: event.target.value,
                    }))
                  }
                  className={selectClass}
                >
                  <option>Slot Machine</option>
                  <option>Automatic Roulette</option>
                  <option>Electronic Table Game</option>
                </select>
              </Field>
              <Field
                label="Machine Number"
                required
                error={errors.machineNumber}
              >
                <input
                  value={machineForm.machineNumber}
                  onChange={(event) =>
                    setMachineForm((current) => ({
                      ...current,
                      machineNumber: event.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="Example: Slot-07 or AR-01"
                />
              </Field>
            </div>

            <Field label="Remarks">
              <textarea
                rows={3}
                value={machineForm.remarks}
                onChange={(event) =>
                  setMachineForm((current) => ({
                    ...current,
                    remarks: event.target.value,
                  }))
                }
                className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                placeholder="Optional cashier note"
              />
            </Field>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
            <h3 className="text-sm font-black text-slate-900">
              Machine Wallet Preview
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              This amount will appear as a pending cashier load in Slot &
              Machine Gaming.
            </p>

            <div className="mt-5 space-y-3 rounded-xl bg-white p-4 shadow-sm">
              <PreviewRow
                label="Customer"
                value={machineForm.customer?.name || 'Not verified'}
              />
              <PreviewRow
                label="Machine"
                value={
                  machineForm.machineNumber
                    ? `${machineForm.machineType} · ${machineForm.machineNumber}`
                    : 'Not selected'
                }
              />
              <PreviewRow
                label="Original payment"
                value={formatOriginal(
                  machineForm.currency,
                  parseAmount(machineForm.amount),
                )}
              />
              <PreviewRow
                label="Wallet value"
                value={formatNpr(converted)}
                strong
              />
              <PreviewRow
                label="Cashier"
                value={`${cashierDisplay} · ${cashierRole}`}
              />
              <PreviewRow
                label="Status after posting"
                value="Pending machine redemption"
              />
            </div>

            <button
              type="button"
              disabled={posting}
              onClick={() => postTransaction('MACHINE_CASH_IN')}
              className="mt-4 h-12 w-full rounded-xl bg-sky-500 text-sm font-black text-white transition hover:bg-sky-400 disabled:opacity-50"
            >
              {posting ? 'Posting…' : 'Post Machine Cash-In'}
            </button>
          </div>
        </div>
      </Panel>
    )
  }

  const renderTipsForm = () => {
    const converted = convertedAmount(
      tipsForm.currency,
      tipsForm.amount,
      tipsForm.exchangeRate,
    )

    return (
      <Panel
        title="Tips Collection"
        description="Record tips collected by department and cashier shift."
      >
        <div className="grid gap-5 xl:grid-cols-[1fr_0.75fr]">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Source / Department" required>
                <select
                  value={tipsForm.source}
                  onChange={(event) =>
                    setTipsForm((current) => ({
                      ...current,
                      source: event.target.value,
                    }))
                  }
                  className={selectClass}
                >
                  <option>Gaming Floor</option>
                  <option>Slot & Machine Gaming</option>
                  <option>F&B / Kitchen / Bar</option>
                  <option>CRM / GRE</option>
                  <option>Reception / Gate</option>
                </select>
              </Field>

              <Field label="Collected From / Shift" required>
                <select
                  value={tipsForm.shift}
                  onChange={(event) =>
                    setTipsForm((current) => ({
                      ...current,
                      shift: event.target.value,
                    }))
                  }
                  className={selectClass}
                >
                  <option>Day 13:00–23:00</option>
                  <option>Night 23:00–07:00</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Currency" required>
                <CurrencyToggle
                  value={tipsForm.currency}
                  onChange={(currency) =>
                    setTipsForm((current) => ({
                      ...current,
                      currency,
                    }))
                  }
                />
              </Field>

              <Field
                label="Amount Collected"
                required
                error={errors.tipsAmount}
              >
                <input
                  inputMode="decimal"
                  value={tipsForm.amount}
                  onChange={(event) =>
                    setTipsForm((current) => ({
                      ...current,
                      amount: event.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="Enter collected amount"
                />
              </Field>
            </div>

            {tipsForm.currency === 'INR' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="INR to NPR Exchange Rate"
                  required
                  error={errors.tipsRate}
                >
                  <input
                    inputMode="decimal"
                    value={tipsForm.exchangeRate}
                    onChange={(event) =>
                      setTipsForm((current) => ({
                        ...current,
                        exchangeRate: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Converted NPR Value">
                  <input
                    readOnly
                    value={formatNpr(converted)}
                    className={`${inputClass} bg-slate-50 font-black`}
                  />
                </Field>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Payment Method" required>
                <select
                  value={tipsForm.paymentMethod}
                  onChange={(event) =>
                    setTipsForm((current) => ({
                      ...current,
                      paymentMethod: event.target.value,
                      reference:
                        event.target.value === 'Cash'
                          ? ''
                          : current.reference,
                    }))
                  }
                  className={selectClass}
                >
                  <option>Cash</option>
                  <option>QR</option>
                  <option>Card</option>
                  <option>Bank</option>
                </select>
              </Field>

              <Field
                label="Reference / Transaction ID"
                required={requiresReference(tipsForm.paymentMethod)}
                error={errors.tipsReference}
              >
                <input
                  value={tipsForm.reference}
                  onChange={(event) =>
                    setTipsForm((current) => ({
                      ...current,
                      reference: event.target.value,
                    }))
                  }
                  disabled={!requiresReference(tipsForm.paymentMethod)}
                  className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-400`}
                  placeholder={
                    requiresReference(tipsForm.paymentMethod)
                      ? 'Enter payment reference'
                      : 'Not required for cash'
                  }
                />
              </Field>
            </div>

            <Field label="Remarks">
              <textarea
                rows={3}
                value={tipsForm.remarks}
                onChange={(event) =>
                  setTipsForm((current) => ({
                    ...current,
                    remarks: event.target.value,
                  }))
                }
                className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                placeholder="Optional collection note"
              />
            </Field>
          </div>

          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
            <h3 className="text-sm font-black text-slate-900">
              Collection Preview
            </h3>

            <div className="mt-5 space-y-3 rounded-xl bg-white p-4 shadow-sm">
              <PreviewRow label="Source" value={tipsForm.source} />
              <PreviewRow label="Shift" value={tipsForm.shift} />
              <PreviewRow
                label="Original amount"
                value={formatOriginal(
                  tipsForm.currency,
                  parseAmount(tipsForm.amount),
                )}
              />
              <PreviewRow
                label="Reporting value"
                value={formatNpr(converted)}
                strong
              />
              <PreviewRow label="Collected by" value={`${cashierDisplay} · ${cashierRole}`} />
              <PreviewRow label="Time" value={getCurrentTime()} />
            </div>

            <button
              type="button"
              disabled={posting}
              onClick={() => postTransaction('TIPS')}
              className="mt-4 h-12 w-full rounded-xl bg-purple-500 text-sm font-black text-white transition hover:bg-purple-400 disabled:opacity-50"
            >
              {posting ? 'Posting…' : 'Post Tips Collection'}
            </button>
          </div>
        </div>
      </Panel>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="space-y-5 p-4 sm:p-5 lg:p-6">
        <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rotate-45 bg-amber-400" />
              <h1 className="font-serif text-3xl font-black tracking-tight text-slate-950">
                Cash Collection & Buy-In
              </h1>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Record chip buy-ins, machine wallet loads and tips from one
              focused transaction workspace.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-slate-500">
              <span>Cashier: {cashierDisplay}</span>
              <span>Role: {cashierRole}</span>
              <span>Business Date: {isLoadingContext ? 'Loading…' : businessDateValue || 'Not open'}</span>
              <span>Opening Cash: Unavailable</span>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span className="font-black">Reporting rule:</span> NPR is the
            reporting currency for real Chip Buy-In posting. INR remains disabled for that workflow.
          </div>
        </section>

        {isLoadingContext && (
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-700">
            Loading the real customer directory and current business date…
          </div>
        )}

        {contextError && !isLoadingContext && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {contextError}
          </div>
        )}

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-black">Integration status:</span> Chip Buy-In transactions are posted to the backend. Machine Cash-In and Tips Collection remain prototype-only.
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <SummaryCard
            label="Chip Buy-In Today"
            value={formatNpr(summary.chip)}
            note="Persisted for verified session"
            icon="💵"
            tone="emerald"
          />
          <SummaryCard
            label="Machine Cash-In Today"
            value={formatNpr(summary.machine)}
            note="Pending machine loads"
            icon="🎰"
            tone="sky"
          />
          <SummaryCard
            label="Tips Collected Today"
            value={formatNpr(summary.tips)}
            note="All departments"
            icon="🎁"
            tone="purple"
          />
          <SummaryCard
            label="Total Received"
            value={formatNpr(summary.total)}
            note={`${summary.count} persisted chip buy-ins only`}
            icon="💰"
            tone="amber"
          />
          <SummaryCard
            label="Non-Cash Received"
            value={formatNpr(summary.nonCash)}
            note="Persisted chip buy-ins"
            icon="💳"
            tone="cyan"
          />
          <SummaryCard
            label="Cash Received"
            value={formatNpr(summary.cashReceived)}
            note="Persisted chip buy-ins"
            icon="👤"
            tone="slate"
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              {
                key: 'CHIP_BUY_IN',
                label: 'Chip Buy-In',
                note: 'Customer payment to chips',
                icon: '💵',
              },
              {
                key: 'MACHINE_CASH_IN',
                label: 'Machine Cash-In',
                note: 'Cashier load for machine play',
                icon: '🎰',
              },
              {
                key: 'TIPS',
                label: 'Tips Collection',
                note: 'Department or shift tips',
                icon: '🎁',
              },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveForm(tab.key)
                  setErrors({})
                }}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  activeForm === tab.key
                    ? 'border-amber-300 bg-amber-50 shadow-sm'
                    : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                    {tab.icon}
                  </span>
                  <div>
                    <p className="text-sm font-black text-slate-900">
                      {tab.label}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {tab.note}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {activeForm === 'CHIP_BUY_IN' && renderChipForm()}
        {activeForm === 'MACHINE_CASH_IN' && renderMachineForm()}
        {activeForm === 'TIPS' && renderTipsForm()}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-800">
                  Today&apos;s Transactions
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Search, filter, export and print posted transactions.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={exportCsv}
                  className={`${buttonBase} border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50`}
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast(
                      'Print dialog opened. Choose “Save as PDF” to create a PDF.',
                    )
                    window.print()
                  }}
                  className={`${buttonBase} border border-red-200 bg-white text-red-700 hover:bg-red-50`}
                >
                  PDF
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className={`${buttonBase} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
                >
                  Print
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-slate-50/60 p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_180px_160px_auto]">
              <input
                type="search"
                value={historySearch}
                onChange={(event) => {
                  setHistorySearch(event.target.value)
                  setCurrentPage(1)
                }}
                className={inputClass}
                placeholder="Search ID, customer, badge, CID, reference, machine..."
              />
              <select
                value={methodFilter}
                onChange={(event) => {
                  setMethodFilter(event.target.value)
                  setCurrentPage(1)
                }}
                className={selectClass}
              >
                <option value="ALL">All Methods</option>
                <option>Cash</option>
                <option>QR</option>
                <option>Card</option>
                <option>Bank</option>
              </select>
              <select
                value={currencyFilter}
                onChange={(event) => {
                  setCurrencyFilter(event.target.value)
                  setCurrentPage(1)
                }}
                className={selectClass}
              >
                <option value="ALL">All Currencies</option>
                <option>NPR</option>
                <option>INR</option>
              </select>
              <button
                type="button"
                onClick={clearHistoryFilters}
                className={`${buttonBase} border border-slate-200 bg-white text-slate-700 hover:bg-slate-100`}
              >
                Clear Filters
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ['ALL', 'All Transactions'],
                ['CHIP_BUY_IN', 'Chip Buy-Ins'],
                ['MACHINE_CASH_IN', 'Machine Cash-Ins'],
                ['TIPS', 'Tips Collected'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setHistoryType(key)
                    setCurrentPage(1)
                  }}
                  className={`rounded-lg px-3 py-2 text-xs font-black transition ${
                    historyType === key
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {[
                    'Transaction ID',
                    'Type',
                    'Time',
                    'Customer / Source',
                    'Badge / CID',
                    'Original Amount',
                    'NPR Value',
                    'Payment',
                    'Reference',
                    'Machine',
                    'Status',
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {paginatedTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 font-mono text-xs font-black text-sky-700">
                      {transaction.id}
                    </td>
                    <td className="px-4 py-4">
                      <TypeBadge type={transaction.type} />
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                      {transaction.time}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-black text-slate-900">
                        {transaction.type === 'TIPS'
                          ? transaction.source
                          : transaction.customer}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {transaction.type === 'TIPS'
                          ? transaction.shift
                          : transaction.cid}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {transaction.badge || '—'}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                      {formatOriginal(
                        transaction.currency,
                        transaction.originalAmount,
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm font-black text-slate-950">
                      {formatNpr(transaction.nprAmount)}
                    </td>
                    <td className="px-4 py-4">
                      <PaymentBadge method={transaction.paymentMethod} />
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {transaction.reference || '—'}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {transaction.machineNumber || '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {paginatedTransactions.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-5 py-16 text-center text-sm text-slate-500"
                    >
                      No transactions match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {paginatedTransactions.length} of{' '}
              {filteredTransactions.length} matching transactions
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-black disabled:opacity-40"
              >
                Previous
              </button>
              <span className="rounded-lg bg-slate-900 px-3 py-2 font-black text-white">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(totalPages, page + 1),
                  )
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-black disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </main>

      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[200] max-w-sm rounded-xl border px-4 py-3 text-sm font-bold shadow-xl ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}

const PreviewRow = ({ label, value, strong }) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
    <span className="text-xs font-semibold text-slate-500">{label}</span>
    <span
      className={`text-right text-sm ${
        strong
          ? 'font-black text-slate-950'
          : 'font-bold text-slate-700'
      }`}
    >
      {value}
    </span>
  </div>
)

const TypeBadge = ({ type }) => {
  const styles = {
    CHIP_BUY_IN:
      'border-amber-200 bg-amber-50 text-amber-700',
    MACHINE_CASH_IN:
      'border-sky-200 bg-sky-50 text-sky-700',
    TIPS: 'border-purple-200 bg-purple-50 text-purple-700',
  }

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${styles[type]}`}
    >
      {transactionTypeLabel[type]}
    </span>
  )
}

const PaymentBadge = ({ method }) => {
  const styles = {
    Cash: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    QR: 'border-sky-200 bg-sky-50 text-sky-700',
    Card: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    Bank: 'border-purple-200 bg-purple-50 text-purple-700',
  }

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${styles[method]}`}
    >
      {method}
    </span>
  )
}

export default CashCollectionBuyIn
