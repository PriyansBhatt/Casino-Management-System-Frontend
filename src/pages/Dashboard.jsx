import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const summaryCards = [
  {
    id: 'active-customers',
    label: 'Active Customers',
    value: '6',
    description: 'Currently inside casino',
    icon: '👥',
    tone: 'blue',
    path: '/reception',
  },
  {
    id: 'buy-in',
    label: 'Buy-In Today',
    value: 'NPR 22,40,000',
    description: 'Cashier collections',
    icon: '↘',
    tone: 'green',
    path: '/cashier/buy-in',
  },
  {
    id: 'cash-out',
    label: 'Cash-Out Today',
    value: 'NPR 8,78,000',
    description: 'Customer payouts',
    icon: '↗',
    tone: 'blue',
    path: '/cashier/cash-out',
  },
  {
    id: 'losing-return',
    label: 'Losing Return Paid',
    value: 'NPR 5,500',
    description: 'Verified return paid',
    icon: '↪',
    tone: 'amber',
    path: '/cashier/cash-out',
  },
  {
    id: 'active-tables',
    label: 'Active Tables',
    value: '5',
    description: 'Out of 9 gaming tables',
    icon: '🎲',
    tone: 'purple',
    path: '/pit/tables',
  },
  {
    id: 'active-machines',
    label: 'Active Machines',
    value: '4',
    description: 'Slots and auto roulette',
    icon: '🎮',
    tone: 'purple',
    path: '/slot-machines',
  },
  {
    id: 'unresolved-chips',
    label: 'Unresolved Chips',
    value: 'NPR 9,28,000',
    description: 'Requires wallet review',
    icon: '🔗',
    tone: 'red',
    path: '/chip-control',
  },
  {
    id: 'cashier-variance',
    label: 'Cashier Variance',
    value: 'NPR 0',
    description: 'Current shift balanced',
    icon: '⚖',
    tone: 'green',
    path: '/cashier/reconciliation',
  },
  {
    id: 'cash-income',
    label: 'Daily Cash Income',
    value: 'NPR 18,72,000',
    description: 'Posted cash received',
    icon: '💵',
    tone: 'green',
    path: '/cashier/reconciliation',
  },
  {
    id: 'cash-expense',
    label: 'Daily Cash Expense',
    value: 'NPR 2,46,500',
    description: 'Approved operating expense',
    icon: '🧾',
    tone: 'red',
    path: '/cashier/reconciliation',
  },
  {
    id: 'purchase-approvals',
    label: 'Purchase Approvals',
    value: '2',
    description: 'Awaiting director review',
    icon: '📦',
    tone: 'amber',
    path: '/store/purchase',
  },
  {
    id: 'bills-pending',
    label: 'Bills Pending',
    value: '1',
    description: 'Awaiting account verification',
    icon: '📄',
    tone: 'amber',
    path: '/accounts',
  },
]

const customers = [
  {
    badge: '087',
    initials: 'RS',
    name: 'Raj Sharma',
    cid: 'CID-1001',
    category: 'VIP',
    location: 'Baccarat Table 2',
    buyIn: 250000,
    buyInDisplay: 'NPR 2,50,000',
    exposure: 195000,
    exposureDisplay: 'NPR 1,95,000',
    status: 'PLAYING',
    statusTone: 'blue',
  },
  {
    badge: '044',
    initials: 'AV',
    name: 'Amit Verma',
    cid: 'CID-1002',
    category: 'Normal',
    location: 'Slot Machine 7',
    buyIn: 30000,
    buyInDisplay: 'NPR 30,000',
    exposure: 23000,
    exposureDisplay: 'NPR 23,000',
    status: 'ACTIVE',
    statusTone: 'green',
  },
  {
    badge: '112',
    initials: 'DS',
    name: 'Daniel Smith',
    cid: 'CID-1003',
    category: 'VVIP',
    location: 'Roulette Table 1',
    buyIn: 1500000,
    buyInDisplay: 'NPR 15,00,000',
    exposure: 410000,
    exposureDisplay: 'NPR 4,10,000',
    status: 'PLAYING',
    statusTone: 'blue',
  },
  {
    badge: '026',
    initials: 'SR',
    name: 'Suresh Rai',
    cid: 'CID-1004',
    category: 'Standard',
    location: 'Mini Flush 1',
    buyIn: 60000,
    buyInDisplay: 'NPR 60,000',
    exposure: 0,
    exposureDisplay: 'NPR 0',
    status: 'EXIT PENDING',
    statusTone: 'amber',
  },
  {
    badge: '051',
    initials: 'PT',
    name: 'Priya Tamang',
    cid: 'CID-1005',
    category: 'VIP',
    location: 'Cashier',
    buyIn: 400000,
    buyInDisplay: 'NPR 4,00,000',
    exposure: 220000,
    exposureDisplay: 'NPR 2,20,000',
    status: 'AT CASHIER',
    statusTone: 'amber',
  },
  {
    badge: '099',
    initials: 'AK',
    name: 'Ahmed Khan',
    cid: 'CID-1006',
    category: 'Standard',
    location: 'Bar Lounge',
    buyIn: 80000,
    buyInDisplay: 'NPR 80,000',
    exposure: 80000,
    exposureDisplay: 'NPR 80,000',
    status: 'SERVICE REQUESTED',
    statusTone: 'purple',
  },
]

const initialAttentionItems = [
  {
    id: 1,
    module: 'Purchase Approval',
    title: 'Next-day kitchen procurement',
    description: 'Chicken 25 kg requires director approval.',
    priority: 'HIGH',
    tone: 'red',
    actionLabel: 'Review',
    path: '/store/purchase',
  },
  {
    id: 2,
    module: 'Cashier Reconciliation',
    title: 'Shift reconciliation pending',
    description: 'Current cashier shift has not been submitted for approval.',
    priority: 'MEDIUM',
    tone: 'amber',
    actionLabel: 'Open',
    path: '/cashier/reconciliation',
  },
  {
    id: 3,
    module: 'Accounts',
    title: 'Purchase bill pending verification',
    description: 'One received bill is awaiting accounts verification.',
    priority: 'MEDIUM',
    tone: 'blue',
    actionLabel: 'Verify',
    path: '/accounts',
  },
  {
    id: 4,
    module: 'Reception / Gate',
    title: 'Exit clearance pending',
    description: 'Badge 026 requires exit and badge-return confirmation.',
    priority: 'MEDIUM',
    tone: 'amber',
    actionLabel: 'Review',
    path: '/reception',
  },
  {
    id: 5,
    module: 'Slot & Machine Gaming',
    title: 'Machine maintenance pending',
    description: 'Two machines are currently marked for maintenance.',
    priority: 'LOW',
    tone: 'blue',
    actionLabel: 'View',
    path: '/slot-machines',
  },
]

const approvalQueue = [
  {
    id: 'APR-001',
    type: 'Purchase',
    item: 'Next-day chicken procurement 25 kg',
    department: 'F&B / Kitchen',
    amount: 'NPR 18,750',
    status: 'Pending Director',
    path: '/store/purchase',
  },
  {
    id: 'APR-002',
    type: 'Expense',
    item: 'Emergency slot machine repair',
    department: 'Maintenance',
    amount: 'NPR 32,000',
    status: 'Pending Director',
    path: '/store/purchase',
  },
]

const hourlyCashMovement = [
  { hour: '10h', cashIn: 120000, cashOut: 40000 },
  { hour: '11h', cashIn: 180000, cashOut: 70000 },
  { hour: '12h', cashIn: 240000, cashOut: 95000 },
  { hour: '13h', cashIn: 310000, cashOut: 150000 },
  { hour: '14h', cashIn: 390000, cashOut: 210000 },
  { hour: '15h', cashIn: 480000, cashOut: 280000 },
  { hour: '16h', cashIn: 560000, cashOut: 340000 },
  { hour: '17h', cashIn: 650000, cashOut: 430000 },
  { hour: '18h', cashIn: 760000, cashOut: 510000 },
  { hour: '19h', cashIn: 910000, cashOut: 620000 },
  { hour: '20h', cashIn: 1080000, cashOut: 750000 },
  { hour: '21h', cashIn: 1320000, cashOut: 890000 },
]

const toneClasses = {
  blue: {
    card: 'border-sky-200 bg-gradient-to-br from-white to-sky-50',
    icon: 'bg-sky-100 text-sky-700',
    text: 'text-sky-700',
    badge: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  green: {
    card: 'border-emerald-200 bg-gradient-to-br from-white to-emerald-50',
    icon: 'bg-emerald-100 text-emerald-700',
    text: 'text-emerald-700',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  amber: {
    card: 'border-amber-200 bg-gradient-to-br from-white to-amber-50',
    icon: 'bg-amber-100 text-amber-700',
    text: 'text-amber-700',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  red: {
    card: 'border-red-200 bg-gradient-to-br from-white to-red-50',
    icon: 'bg-red-100 text-red-700',
    text: 'text-red-700',
    badge: 'border-red-200 bg-red-50 text-red-700',
  },
  purple: {
    card: 'border-purple-200 bg-gradient-to-br from-white to-purple-50',
    icon: 'bg-purple-100 text-purple-700',
    text: 'text-purple-700',
    badge: 'border-purple-200 bg-purple-50 text-purple-700',
  },
}

const quickActions = [
  {
    label: 'Cashier Reconciliation',
    icon: '🧾',
    path: '/cashier/reconciliation',
  },
  {
    label: 'Review Purchases',
    icon: '📦',
    path: '/store/purchase',
  },
  {
    label: 'Review Bills',
    icon: '📄',
    path: '/accounts',
  },
  {
    label: 'Gaming Floor',
    icon: '🎲',
    path: '/pit/tables',
  },
  {
    label: 'Customer Wallets',
    icon: '🔗',
    path: '/chip-control',
  },
  {
    label: 'Reports',
    icon: '📊',
    path: '/reports',
  },
]

const Dashboard = () => {
  const navigate = useNavigate()

  const [businessDate, setBusinessDate] = useState('2026-07-15')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [attentionItems, setAttentionItems] = useState(initialAttentionItems)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showApprovals, setShowApprovals] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState(
    new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
  )

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return customers.filter((customer) => {
      const matchesSearch =
        !normalizedSearch ||
        customer.name.toLowerCase().includes(normalizedSearch) ||
        customer.cid.toLowerCase().includes(normalizedSearch) ||
        customer.badge.includes(normalizedSearch) ||
        customer.location.toLowerCase().includes(normalizedSearch)

      const matchesStatus =
        statusFilter === 'ALL' || customer.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [search, statusFilter])

  const maximumCashValue = Math.max(
    ...hourlyCashMovement.flatMap((item) => [item.cashIn, item.cashOut]),
  )

  const goTo = (path) => {
    if (path) {
      navigate(path)
    }
  }

  const refreshDashboard = () => {
    setLastRefreshed(
      new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    )
  }

  const dismissAttention = (id) => {
    setAttentionItems((currentItems) =>
      currentItems.filter((item) => item.id !== id),
    )
  }

  const exportCustomerOverview = () => {
    const headers = [
      'Badge',
      'Customer',
      'CID',
      'Category',
      'Location',
      'Buy-In',
      'Wallet / Exposure',
      'Status',
    ]

    const rows = filteredCustomers.map((customer) => [
      customer.badge,
      customer.name,
      customer.cid,
      customer.category,
      customer.location,
      customer.buyInDisplay,
      customer.exposureDisplay,
      customer.status,
    ])

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
          .join(','),
      )
      .join('\n')

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `management-dashboard-${businessDate}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="space-y-5 p-4 sm:p-5 lg:p-6">
        {/* Page heading */}
        <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rotate-45 bg-amber-400" />

              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Management Dashboard
              </h1>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Director overview of daily casino operations, finance, gaming,
              approvals and customer activity.
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Business Date: {businessDate}</span>
              <span>•</span>
              <span>Day Shift 13:00–23:00</span>
              <span>•</span>
              <span>Last refreshed: {lastRefreshed}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-sm">
              <span className="text-sm">📅</span>

              <input
                type="date"
                value={businessDate}
                onChange={(event) => setBusinessDate(event.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
              />
            </label>

            <button
              type="button"
              onClick={refreshDashboard}
              className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
            >
              ↻ Refresh
            </button>

            <button
              type="button"
              onClick={() => setShowApprovals(true)}
              className="relative h-10 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
            >
              Pending Approvals
              {approvalQueue.length > 0 && (
                <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-[11px] text-white">
                  {approvalQueue.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="h-10 rounded-lg bg-amber-400 px-4 text-sm font-black text-slate-950 shadow-sm transition hover:bg-amber-300"
            >
              View Reports
            </button>
          </div>
        </section>

        {/* Quick actions */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">
                Quick Actions
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Open frequently used management and operational pages.
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => goTo(action.path)}
                className="flex min-h-[64px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-left transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 hover:shadow-md"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-lg shadow-sm">
                  {action.icon}
                </span>

                <span className="text-sm font-bold leading-5 text-slate-800">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Summary cards */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const tone = toneClasses[card.tone] || toneClasses.blue

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => goTo(card.path)}
                className={`group min-h-[145px] rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${tone.card}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                      {card.label}
                    </p>

                    <p className="mt-4 break-words font-serif text-2xl font-black leading-tight text-slate-950">
                      {card.value}
                    </p>
                  </div>

                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${tone.icon}`}
                  >
                    {card.icon}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    {card.description}
                  </span>

                  <span
                    className={`text-sm font-black transition group-hover:translate-x-1 ${tone.text}`}
                  >
                    →
                  </span>
                </div>
              </button>
            )
          })}
        </section>

        {/* Main operational content */}
        <section className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_410px]">
          {/* Customer overview */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">
                    Active Customer Overview
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Current customer location, buy-in, wallet exposure and
                    operational status.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search badge, CID, customer or location..."
                    className="h-10 min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white sm:min-w-[280px]"
                  />

                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-amber-400"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PLAYING">Playing</option>
                    <option value="ACTIVE">Active</option>
                    <option value="AT CASHIER">At Cashier</option>
                    <option value="EXIT PENDING">Exit Pending</option>
                    <option value="SERVICE REQUESTED">
                      Service Requested
                    </option>
                  </select>

                  <button
                    type="button"
                    onClick={exportCustomerOverview}
                    className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    Export CSV
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50"
                  >
                    Print
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full border-collapse">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-left">
                    {[
                      'Badge',
                      'Customer',
                      'Location',
                      'Buy-In',
                      'Wallet / Exposure',
                      'Status',
                      'Action',
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.map((customer) => {
                    const statusTone =
                      toneClasses[customer.statusTone] || toneClasses.blue

                    return (
                      <tr
                        key={customer.badge}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-4">
                          <span className="inline-flex min-w-[52px] justify-center rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 font-mono text-sm font-black text-amber-700">
                            {customer.badge}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-black text-amber-700">
                              {customer.initials}
                            </span>

                            <div>
                              <p className="text-sm font-black text-slate-900">
                                {customer.name}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-500">
                                {customer.cid} · {customer.category}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                          {customer.location}
                        </td>

                        <td className="px-4 py-4 text-sm font-bold text-slate-800">
                          {customer.buyInDisplay}
                        </td>

                        <td
                          className={`px-4 py-4 text-sm font-black ${
                            customer.exposure > 150000
                              ? 'text-red-600'
                              : customer.exposure === 0
                                ? 'text-emerald-600'
                                : 'text-slate-800'
                          }`}
                        >
                          {customer.exposureDisplay}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black tracking-wide ${statusTone.badge}`}
                          >
                            {customer.status}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(customer)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    )
                  })}

                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-14 text-center text-sm text-slate-500"
                      >
                        No active customers match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {filteredCustomers.length} of {customers.length} active
                customers
              </span>

              <button
                type="button"
                onClick={() => navigate('/reception')}
                className="font-black text-amber-700 hover:text-amber-800"
              >
                View reception activity →
              </button>
            </div>
          </div>

          {/* Management attention */}
          <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">
                  Management Attention
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Operational tasks requiring review or approval.
                </p>
              </div>

              <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-black text-red-700">
                {attentionItems.length}
              </span>
            </div>

            <div className="max-h-[620px] space-y-3 overflow-y-auto p-4">
              {attentionItems.map((item) => {
                const tone = toneClasses[item.tone] || toneClasses.blue

                return (
                  <article
                    key={item.id}
                    className={`rounded-xl border p-4 ${tone.card}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p
                          className={`text-[10px] font-black uppercase tracking-[0.16em] ${tone.text}`}
                        >
                          {item.module}
                        </p>

                        <h3 className="mt-2 text-sm font-black text-slate-900">
                          {item.title}
                        </h3>
                      </div>

                      <span className={`rounded-full border px-2 py-1 text-[9px] font-black ${tone.badge}`}>
                        {item.priority}
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      {item.description}
                    </p>

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => goTo(item.path)}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white transition hover:bg-slate-800"
                      >
                        {item.actionLabel}
                      </button>

                      <button
                        type="button"
                        onClick={() => dismissAttention(item.id)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100"
                      >
                        Dismiss
                      </button>
                    </div>
                  </article>
                )
              })}

              {attentionItems.length === 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-10 text-center">
                  <div className="text-3xl">✓</div>

                  <p className="mt-3 text-sm font-black text-emerald-700">
                    No pending management items
                  </p>

                  <p className="mt-1 text-xs text-emerald-600">
                    All current operational items have been reviewed.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </section>

        {/* Finance and approvals */}
        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
          {/* Financial summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">
                  Daily Financial Summary
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Consolidated movement for the selected business date.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/cashier/reconciliation')}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-amber-300 hover:bg-amber-50"
              >
                Open Reconciliation
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <FinancialRow
                label="Cash In"
                amount="NPR 18,72,000"
                percent={100}
                tone="green"
              />

              <FinancialRow
                label="Cash Out"
                amount="NPR 8,78,000"
                percent={47}
                tone="red"
              />

              <FinancialRow
                label="Operating Expenses"
                amount="NPR 2,46,500"
                percent={13}
                tone="amber"
              />

              <FinancialRow
                label="Net Cash Movement"
                amount="NPR 7,47,500"
                percent={40}
                tone="blue"
              />
            </div>

            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                    Current Cash Position
                  </p>

                  <p className="mt-1 text-sm text-emerald-700">
                    Cash movement is positive and current cashier variance is
                    zero.
                  </p>
                </div>

                <span className="text-xl font-black text-emerald-700">
                  Balanced
                </span>
              </div>
            </div>
          </div>

          {/* Approval queue */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">
                  Approval Queue
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Requests awaiting authorized action.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowApprovals(true)}
                className="text-xs font-black text-amber-700 hover:text-amber-800"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {approvalQueue.map((approval) => (
                <button
                  key={approval.id}
                  type="button"
                  onClick={() => goTo(approval.path)}
                  className="block w-full px-5 py-4 text-left transition hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[9px] font-black uppercase text-sky-700">
                        {approval.type}
                      </span>

                      <p className="mt-2 text-sm font-black text-slate-900">
                        {approval.item}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {approval.department} · {approval.amount}
                      </p>
                    </div>

                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[9px] font-black uppercase text-amber-700">
                      Pending
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-4">
              <button
                type="button"
                onClick={() => navigate('/store/purchase')}
                className="w-full rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-amber-300"
              >
                Review Purchase Approvals
              </button>
            </div>
          </div>
        </section>

        {/* Cash chart */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">
                Cash Movement by Hour
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Cash-in and cash-out activity for the current shift.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-amber-400" />
                Cash In
              </span>

              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-sky-500" />
                Cash Out
              </span>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="flex min-w-[760px] items-end gap-3">
              {hourlyCashMovement.map((item) => (
                <div
                  key={item.hour}
                  className="group flex min-w-[48px] flex-1 flex-col items-center"
                >
                  <div className="relative mb-2 hidden rounded-lg bg-slate-900 px-3 py-2 text-center text-[10px] text-white shadow-lg group-hover:block">
                    <div>In: NPR {formatNumber(item.cashIn)}</div>
                    <div>Out: NPR {formatNumber(item.cashOut)}</div>
                  </div>

                  <div className="flex h-[240px] w-full items-end justify-center gap-1 rounded-lg bg-slate-50 px-2 pt-4">
                    <div
                      title={`Cash In: NPR ${formatNumber(item.cashIn)}`}
                      className="w-3 rounded-t bg-amber-400 transition hover:bg-amber-300"
                      style={{
                        height: `${Math.max(
                          8,
                          (item.cashIn / maximumCashValue) * 100,
                        )}%`,
                      }}
                    />

                    <div
                      title={`Cash Out: NPR ${formatNumber(item.cashOut)}`}
                      className="w-3 rounded-t bg-sky-500 transition hover:bg-sky-400"
                      style={{
                        height: `${Math.max(
                          8,
                          (item.cashOut / maximumCashValue) * 100,
                        )}%`,
                      }}
                    />
                  </div>

                  <span className="mt-2 text-[11px] font-bold text-slate-500">
                    {item.hour}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Selected customer modal */}
      {selectedCustomer && (
        <ModalOverlay onClose={() => setSelectedCustomer(null)}>
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  Active Customer
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Customer Operational Overview
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-100 text-lg font-black text-amber-700">
                  {selectedCustomer.initials}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-slate-950">
                      {selectedCustomer.name}
                    </h3>

                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-700">
                      {selectedCustomer.category}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedCustomer.cid} · Badge {selectedCustomer.badge}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <DetailCard
                  label="Current Location"
                  value={selectedCustomer.location}
                />

                <DetailCard
                  label="Operational Status"
                  value={selectedCustomer.status}
                />

                <DetailCard
                  label="Today Buy-In"
                  value={selectedCustomer.buyInDisplay}
                />

                <DetailCard
                  label="Wallet / Exposure"
                  value={selectedCustomer.exposureDisplay}
                />
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => navigate('/chip-control')}
                  className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  Open Wallet
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/reception')}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  Reception Record
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/crm-gre')}
                  className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700 transition hover:bg-amber-100"
                >
                  CRM Services
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Approval modal */}
      {showApprovals && (
        <ModalOverlay onClose={() => setShowApprovals(false)}>
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  Management Approval Queue
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Pending Approvals
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowApprovals(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="max-h-[70vh] divide-y divide-slate-100 overflow-y-auto">
              {approvalQueue.map((approval) => (
                <div
                  key={approval.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-black uppercase text-sky-700">
                        {approval.type}
                      </span>

                      <span className="text-xs font-bold text-slate-400">
                        {approval.id}
                      </span>
                    </div>

                    <h3 className="mt-2 text-sm font-black text-slate-900">
                      {approval.item}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {approval.department} · {approval.amount}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowApprovals(false)
                        goTo(approval.path)
                      }}
                      className="rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800"
                    >
                      Review Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end border-t border-slate-200 bg-slate-50 p-4">
              <button
                type="button"
                onClick={() => setShowApprovals(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}

const FinancialRow = ({ label, amount, percent, tone }) => {
  const barClasses = {
    green: 'bg-emerald-500',
    red: 'bg-red-500',
    amber: 'bg-amber-400',
    blue: 'bg-sky-500',
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          {label}
        </span>

        <span className="text-sm font-black text-slate-900">{amount}</span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${barClasses[tone] || barClasses.blue}`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  )
}

const DetailCard = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
      {label}
    </p>

    <p className="mt-2 text-sm font-black text-slate-900">{value}</p>
  </div>
)

const ModalOverlay = ({ children, onClose }) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        onClose()
      }
    }}
  >
    {children}
  </div>
)

const formatNumber = (value) =>
  new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(value)

export default Dashboard