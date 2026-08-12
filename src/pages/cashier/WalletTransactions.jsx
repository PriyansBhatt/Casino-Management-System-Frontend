import { useMemo, useState } from 'react'

const BUSINESS_DATE = '2026-07-15'
const PAGE_SIZE = 6

const initialWallets = [
  {
    badge: '001',
    cid: 'CID-1001',
    name: 'Raj Sharma',
    initials: 'RS',
    category: 'VIP',
    buyIn: 100000,
    tableWin: 60000,
    tableLoss: 90000,
    machineWin: 0,
    machineLoss: 0,
    totalReturns: 10000,
    finalCashOut: 0,
    eligibleReturn: 9000,
    nonEligibleReturn: 8000,
    expectedHolding: 50000,
    unresolved: 0,
    status: 'ACTIVE',
    location: 'Baccarat Table 2',
    note: '',
  },
  {
    badge: '002',
    cid: 'CID-1002',
    name: 'Amit Verma',
    initials: 'AV',
    category: 'STANDARD',
    buyIn: 30000,
    tableWin: 0,
    tableLoss: 30000,
    machineWin: 0,
    machineLoss: 0,
    totalReturns: 10000,
    finalCashOut: 0,
    eligibleReturn: 3000,
    nonEligibleReturn: 0,
    expectedHolding: 0,
    unresolved: 0,
    status: 'CLOSED',
    location: 'Cashier',
    note: '',
  },
  {
    badge: '003',
    cid: 'CID-1003',
    name: 'Daniel Smith',
    initials: 'DS',
    category: 'VVIP',
    buyIn: 1500000,
    tableWin: 510000,
    tableLoss: 220000,
    machineWin: 0,
    machineLoss: 0,
    totalReturns: 300000,
    finalCashOut: 800000,
    eligibleReturn: 22000,
    nonEligibleReturn: 20000,
    expectedHolding: 410000,
    unresolved: 40000,
    status: 'REVIEW',
    location: 'Roulette Table 1',
    note: '',
  },
  {
    badge: '004',
    cid: 'CID-1004',
    name: 'Suresh Rai',
    initials: 'SR',
    category: 'STANDARD',
    buyIn: 60000,
    tableWin: 22000,
    tableLoss: 60000,
    machineWin: 0,
    machineLoss: 0,
    totalReturns: 22000,
    finalCashOut: 0,
    eligibleReturn: 6000,
    nonEligibleReturn: 6000,
    expectedHolding: 0,
    unresolved: 0,
    status: 'CLOSED',
    location: 'Mini Flush 1',
    note: '',
  },
  {
    badge: '005',
    cid: 'CID-1005',
    name: 'Priya Tamang',
    initials: 'PT',
    category: 'VIP',
    buyIn: 400000,
    tableWin: 100000,
    tableLoss: 350000,
    machineWin: 0,
    machineLoss: 0,
    totalReturns: 50000,
    finalCashOut: 0,
    eligibleReturn: 35000,
    nonEligibleReturn: 30000,
    expectedHolding: 45000,
    unresolved: 15000,
    status: 'REVIEW',
    location: 'Baccarat Table 1',
    note: '',
  },
  {
    badge: '006',
    cid: 'CID-1007',
    name: 'Chen Wei',
    initials: 'CW',
    category: 'VIP',
    buyIn: 250000,
    tableWin: 20000,
    tableLoss: 100000,
    machineWin: 0,
    machineLoss: 0,
    totalReturns: 10000,
    finalCashOut: 0,
    eligibleReturn: 10000,
    nonEligibleReturn: 10000,
    expectedHolding: 80000,
    unresolved: 30000,
    status: 'REVIEW',
    location: 'Roulette Table 2',
    note: '',
  },
]

const initialTransactions = [
  {
    id: 'WT-001',
    badge: '001',
    time: '17:20',
    type: 'PARTIAL_RETURN',
    source: 'Cashier',
    amount: -10000,
    balance: 50000,
    remarks: 'Partial chip return.',
  },
  {
    id: 'WT-002',
    badge: '001',
    time: '16:45',
    type: 'TABLE_LOSS',
    source: 'Baccarat',
    amount: -40000,
    balance: 60000,
    remarks: '',
  },
  {
    id: 'WT-003',
    badge: '001',
    time: '16:00',
    type: 'TABLE_WIN',
    source: 'Baccarat',
    amount: 20000,
    balance: 100000,
    remarks: '',
  },
  {
    id: 'WT-004',
    badge: '001',
    time: '15:20',
    type: 'TABLE_LOSS',
    source: 'Roulette',
    amount: -50000,
    balance: 80000,
    remarks: '',
  },
  {
    id: 'WT-005',
    badge: '001',
    time: '14:35',
    type: 'TABLE_WIN',
    source: 'Roulette',
    amount: 40000,
    balance: 130000,
    remarks: '',
  },
]

const formatNpr = (value) =>
  `NPR ${Number(value || 0).toLocaleString('en-IN')}`

const getCurrentTime = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

const statusStyles = {
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CLOSED: 'border-slate-200 bg-slate-100 text-slate-600',
  REVIEW: 'border-amber-200 bg-amber-50 text-amber-700',
}

const transactionLabels = {
  BUY_IN: 'Buy-In',
  TABLE_WIN: 'Table Win',
  TABLE_LOSS: 'Table Loss',
  MACHINE_WIN: 'Machine Win',
  MACHINE_LOSS: 'Machine Loss',
  PARTIAL_RETURN: 'Partial Return',
  FINAL_CASH_OUT: 'Final Cash-Out',
  LOSING_RETURN: 'Losing Return',
  ADJUSTMENT: 'Adjustment',
  NOTE: 'Note',
}

const ChipControl = () => {
  const [wallets, setWallets] = useState(initialWallets)
  const [transactions, setTransactions] = useState(initialTransactions)
  const [selectedBadge, setSelectedBadge] = useState('001')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [highExposureOnly, setHighExposureOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [actionModal, setActionModal] = useState(null)
  const [actionAmount, setActionAmount] = useState('')
  const [actionRemarks, setActionRemarks] = useState('')
  const [toast, setToast] = useState(null)

  const selectedWallet =
    wallets.find((wallet) => wallet.badge === selectedBadge) || wallets[0]

  const summary = useMemo(() => {
    return {
      activeWallets: wallets.filter((wallet) => wallet.status !== 'CLOSED')
        .length,
      totalBuyIn: wallets.reduce((sum, wallet) => sum + wallet.buyIn, 0),
      totalPlay: wallets.reduce(
        (sum, wallet) =>
          sum +
          wallet.tableWin +
          wallet.tableLoss +
          wallet.machineWin +
          wallet.machineLoss,
        0,
      ),
      totalReturns: wallets.reduce(
        (sum, wallet) => sum + wallet.totalReturns + wallet.finalCashOut,
        0,
      ),
      expectedHolding: wallets.reduce(
        (sum, wallet) => sum + wallet.expectedHolding,
        0,
      ),
      highExposure: wallets.filter(
        (wallet) => wallet.expectedHolding >= 100000,
      ).length,
    }
  }, [wallets])

  const filteredWallets = useMemo(() => {
    const query = search.trim().toLowerCase()

    return wallets.filter((wallet) => {
      const matchesSearch =
        !query ||
        wallet.badge.includes(query) ||
        wallet.cid.toLowerCase().includes(query) ||
        wallet.name.toLowerCase().includes(query) ||
        wallet.location.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'ALL' || wallet.status === statusFilter

      const matchesCategory =
        categoryFilter === 'ALL' || wallet.category === categoryFilter

      const matchesExposure =
        !highExposureOnly || wallet.expectedHolding >= 100000

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesExposure
      )
    })
  }, [
    categoryFilter,
    highExposureOnly,
    search,
    statusFilter,
    wallets,
  ])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredWallets.length / PAGE_SIZE),
  )

  const paginatedWallets = filteredWallets.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 3000)
  }

  const openAction = (type) => {
    setActionModal(type)
    setActionAmount('')
    setActionRemarks('')
  }

  const applyAction = () => {
    if (!selectedWallet) {
      return
    }

    const amount = Number(actionAmount.replaceAll(',', ''))

    if (
      actionModal !== 'NOTE' &&
      (!Number.isFinite(amount) || amount <= 0)
    ) {
      showToast('Enter a valid amount greater than zero.', 'error')
      return
    }

    if (actionModal === 'NOTE' && !actionRemarks.trim()) {
      showToast('Enter a note before saving.', 'error')
      return
    }

    if (
      actionModal === 'CASH_OUT' &&
      amount > selectedWallet.expectedHolding
    ) {
      showToast(
        'Cash-out cannot exceed the expected holding.',
        'error',
      )
      return
    }

    if (
      actionModal === 'LOSING_RETURN' &&
      amount > selectedWallet.eligibleReturn
    ) {
      showToast(
        'Losing return cannot exceed the eligible amount.',
        'error',
      )
      return
    }

    setWallets((currentWallets) =>
      currentWallets.map((wallet) => {
        if (wallet.badge !== selectedWallet.badge) {
          return wallet
        }

        if (actionModal === 'CASH_OUT') {
          const nextHolding = wallet.expectedHolding - amount
          return {
            ...wallet,
            totalReturns: wallet.totalReturns + amount,
            expectedHolding: nextHolding,
            status: nextHolding === 0 ? 'CLOSED' : wallet.status,
          }
        }

        if (actionModal === 'LOSING_RETURN') {
          return {
            ...wallet,
            eligibleReturn: wallet.eligibleReturn - amount,
            totalReturns: wallet.totalReturns + amount,
          }
        }

        if (actionModal === 'ADJUSTMENT') {
          return {
            ...wallet,
            expectedHolding: wallet.expectedHolding + amount,
            unresolved: Math.max(0, wallet.unresolved - amount),
          }
        }

        if (actionModal === 'NOTE') {
          return {
            ...wallet,
            note: actionRemarks.trim(),
          }
        }

        return wallet
      }),
    )

    const signedAmount =
      actionModal === 'ADJUSTMENT'
        ? amount
        : actionModal === 'NOTE'
          ? 0
          : -amount

    setTransactions((current) => [
      {
        id: `WT-${String(current.length + 1).padStart(3, '0')}`,
        badge: selectedWallet.badge,
        time: getCurrentTime(),
        type:
          actionModal === 'CASH_OUT'
            ? 'PARTIAL_RETURN'
            : actionModal === 'LOSING_RETURN'
              ? 'LOSING_RETURN'
              : actionModal === 'ADJUSTMENT'
                ? 'ADJUSTMENT'
                : 'NOTE',
        source: 'Chip Control',
        amount: signedAmount,
        balance:
          actionModal === 'NOTE'
            ? selectedWallet.expectedHolding
            : actionModal === 'ADJUSTMENT'
              ? selectedWallet.expectedHolding + amount
              : selectedWallet.expectedHolding - amount,
        remarks: actionRemarks.trim(),
      },
      ...current,
    ])

    showToast(
      actionModal === 'NOTE'
        ? 'Wallet note saved.'
        : 'Wallet transaction posted successfully.',
    )

    setActionModal(null)
    setActionAmount('')
    setActionRemarks('')
  }

  const exportCsv = () => {
    const header = [
      'Badge',
      'CID',
      'Customer',
      'Category',
      'Location',
      'Buy-In',
      'Game Play',
      'Win',
      'Loss',
      'Returns',
      'Eligible Return',
      'Non-Eligible Return',
      'Expected Holding',
      'Status',
      'Note',
    ]

    const rows = filteredWallets.map((wallet) => [
      wallet.badge,
      wallet.cid,
      wallet.name,
      wallet.category,
      wallet.location,
      wallet.buyIn,
      wallet.tableWin +
        wallet.tableLoss +
        wallet.machineWin +
        wallet.machineLoss,
      wallet.tableWin + wallet.machineWin,
      wallet.tableLoss + wallet.machineLoss,
      wallet.totalReturns + wallet.finalCashOut,
      wallet.eligibleReturn,
      wallet.nonEligibleReturn,
      wallet.expectedHolding,
      wallet.status,
      wallet.note,
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
    anchor.download = `chip-control-${BUSINESS_DATE}.csv`
    anchor.click()
    URL.revokeObjectURL(url)

    showToast('Chip Control CSV exported.')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="space-y-5 p-4 sm:p-5 lg:p-6">
        <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rotate-45 bg-amber-400" />
              <h1 className="font-serif text-3xl font-black tracking-tight text-slate-950">
                Chip Control
              </h1>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Monitor customer chip positions, review expected holdings and
              complete wallet actions from one page.
            </p>

            <p className="mt-2 text-xs font-semibold text-slate-500">
              Business Date: {BUSINESS_DATE}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="h-10 rounded-xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-700 hover:bg-emerald-50"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-100"
            >
              Print
            </button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <SummaryCard
            label="Active Wallets"
            value={summary.activeWallets}
            note="Currently open customer wallets"
            icon="👥"
            tone="sky"
          />
          <SummaryCard
            label="Total Buy-In Chips"
            value={formatNpr(summary.totalBuyIn)}
            note="All customer chip purchases"
            icon="🎲"
            tone="emerald"
          />
          <SummaryCard
            label="Total Game Play"
            value={formatNpr(summary.totalPlay)}
            note="Table and machine activity"
            icon="📈"
            tone="purple"
          />
          <SummaryCard
            label="Total Cash-Out / Returns"
            value={formatNpr(summary.totalReturns)}
            note="Partial and final returns"
            icon="↪"
            tone="cyan"
          />
          <SummaryCard
            label="Expected Holding"
            value={formatNpr(summary.expectedHolding)}
            note="Customer chips expected in wallet"
            icon="💼"
            tone="amber"
          />
          <SummaryCard
            label="High Exposure Wallets"
            value={summary.highExposure}
            note="Expected holding at or above NPR 100,000"
            icon="🎯"
            tone="rose"
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Search badge, CID, customer or location..."
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                />

                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value)
                    setCurrentPage(1)
                  }}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-amber-400"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="REVIEW">Review Required</option>
                  <option value="CLOSED">Closed</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(event) => {
                    setCategoryFilter(event.target.value)
                    setCurrentPage(1)
                  }}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-amber-400"
                >
                  <option value="ALL">All Categories</option>
                  <option value="STANDARD">Standard</option>
                  <option value="VIP">VIP</option>
                  <option value="VVIP">VVIP</option>
                </select>

                <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-600">
                  <input
                    type="checkbox"
                    checked={highExposureOnly}
                    onChange={(event) => {
                      setHighExposureOnly(event.target.checked)
                      setCurrentPage(1)
                    }}
                  />
                  High Exposure
                </label>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1220px] border-collapse text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    {[
                      'Badge',
                      'Customer / CID',
                      'Location',
                      'Buy-In',
                      'Game Play',
                      'Win / Loss',
                      'Returns',
                      'Eligible Return',
                      'Non-Eligible Return',
                      'Expected Holding',
                      'Status',
                      'Action',
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
                  {paginatedWallets.map((wallet) => {
                    const totalWin =
                      wallet.tableWin + wallet.machineWin
                    const totalLoss =
                      wallet.tableLoss + wallet.machineLoss
                    const totalPlay = totalWin + totalLoss

                    return (
                      <tr
                        key={wallet.badge}
                        onClick={() => setSelectedBadge(wallet.badge)}
                        className={`cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 ${
                          selectedBadge === wallet.badge
                            ? 'bg-amber-50/60'
                            : ''
                        }`}
                      >
                        <td className="px-4 py-4">
                          <span className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 font-mono text-sm font-black text-amber-700">
                            {wallet.badge}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-xs font-black text-amber-700">
                              {wallet.initials}
                            </span>
                            <div>
                              <p className="text-sm font-black text-slate-950">
                                {wallet.name}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {wallet.cid} · {wallet.category}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-700">
                          {wallet.location}
                        </td>

                        <td className="px-4 py-4 text-sm font-black text-slate-900">
                          {formatNpr(wallet.buyIn)}
                        </td>

                        <td className="px-4 py-4 text-sm font-bold text-slate-700">
                          {formatNpr(totalPlay)}
                        </td>

                        <td className="px-4 py-4">
                          <p className="text-sm font-black text-emerald-700">
                            Win {formatNpr(totalWin)}
                          </p>
                          <p className="mt-1 text-sm font-black text-red-600">
                            Loss {formatNpr(totalLoss)}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-sm font-bold text-slate-700">
                          {formatNpr(
                            wallet.totalReturns + wallet.finalCashOut,
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm font-black text-purple-700">
                          {formatNpr(wallet.eligibleReturn)}
                        </td>

                        <td className="px-4 py-4 text-sm font-black text-sky-700">
                          {formatNpr(wallet.nonEligibleReturn)}
                        </td>

                        <td className="px-4 py-4 text-sm font-black text-amber-700">
                          {formatNpr(wallet.expectedHolding)}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${
                              statusStyles[wallet.status]
                            }`}
                          >
                            {wallet.status}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setSelectedBadge(wallet.badge)
                            }}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-100"
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    )
                  })}

                  {paginatedWallets.length === 0 && (
                    <tr>
                      <td
                        colSpan={12}
                        className="px-5 py-16 text-center text-sm text-slate-500"
                      >
                        No customer wallets match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {paginatedWallets.length} of{' '}
                {filteredWallets.length} wallets
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
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-black text-amber-700">
                  {selectedWallet.initials}
                </span>

                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-black text-slate-950">
                    {selectedWallet.name}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedWallet.cid} · Badge {selectedWallet.badge}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {selectedWallet.location}
                  </p>
                </div>

                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${
                    statusStyles[selectedWallet.status]
                  }`}
                >
                  {selectedWallet.status}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <DetailCard
                  label="Total Buy-In"
                  value={formatNpr(selectedWallet.buyIn)}
                />
                <DetailCard
                  label="Eligible Losing Return"
                  value={formatNpr(selectedWallet.eligibleReturn)}
                  tone="purple"
                />
                <DetailCard
                  label="Total Game Play"
                  value={formatNpr(
                    selectedWallet.tableWin +
                      selectedWallet.tableLoss +
                      selectedWallet.machineWin +
                      selectedWallet.machineLoss,
                  )}
                />
                <DetailCard
                  label="Total Returns"
                  value={formatNpr(
                    selectedWallet.totalReturns +
                      selectedWallet.finalCashOut,
                  )}
                />
              </div>

              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-700">
                  Expected Holding
                </p>
                <p className="mt-2 font-serif text-3xl font-black text-slate-950">
                  {formatNpr(selectedWallet.expectedHolding)}
                </p>
              </div>

              {selectedWallet.note && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                    Wallet Note
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {selectedWallet.note}
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-700">
                Wallet Actions
              </h3>

              <div className="mt-3 grid gap-2">
                <button
                  type="button"
                  onClick={() => openAction('CASH_OUT')}
                  disabled={selectedWallet.expectedHolding <= 0}
                  className="h-11 rounded-xl bg-sky-500 text-sm font-black text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  Cash-Out / Return
                </button>

                <button
                  type="button"
                  onClick={() => openAction('LOSING_RETURN')}
                  disabled={selectedWallet.eligibleReturn <= 0}
                  className="h-11 rounded-xl bg-purple-500 text-sm font-black text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  Post Losing Return
                </button>

                <button
                  type="button"
                  onClick={() => openAction('ADJUSTMENT')}
                  className="h-11 rounded-xl border border-amber-300 bg-amber-50 text-sm font-black text-amber-700 transition hover:bg-amber-100"
                >
                  Authorized Adjustment
                </button>

                <button
                  type="button"
                  onClick={() => openAction('NOTE')}
                  className="h-11 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 transition hover:bg-slate-100"
                >
                  Add Wallet Note
                </button>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-3">
                <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-700">
                  Recent Wallet Activity
                </h3>
              </div>

              <div className="divide-y divide-slate-100">
                {transactions
                  .filter(
                    (transaction) =>
                      transaction.badge === selectedWallet.badge,
                  )
                  .slice(0, 5)
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className="grid grid-cols-[52px_1fr_auto] gap-3 px-4 py-3"
                    >
                      <span className="text-xs font-semibold text-slate-500">
                        {transaction.time}
                      </span>

                      <div>
                        <p className="text-xs font-black text-slate-800">
                          {transactionLabels[transaction.type]}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {transaction.source}
                        </p>
                      </div>

                      <span
                        className={`text-xs font-black ${
                          transaction.amount >= 0
                            ? 'text-emerald-700'
                            : 'text-red-600'
                        }`}
                      >
                        {transaction.amount === 0
                          ? 'Note'
                          : formatNpr(transaction.amount)}
                      </span>
                    </div>
                  ))}

                {transactions.filter(
                  (transaction) =>
                    transaction.badge === selectedWallet.badge,
                ).length === 0 && (
                  <p className="px-4 py-8 text-center text-sm text-slate-500">
                    No wallet activity recorded.
                  </p>
                )}
              </div>
            </section>
          </aside>
        </section>
      </main>

      {actionModal && (
        <ModalOverlay onClose={() => setActionModal(null)}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-black text-slate-950">
                    {actionModal === 'CASH_OUT'
                      ? 'Cash-Out / Return'
                      : actionModal === 'LOSING_RETURN'
                        ? 'Post Losing Return'
                        : actionModal === 'ADJUSTMENT'
                          ? 'Authorized Adjustment'
                          : 'Add Wallet Note'}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedWallet.name} · Badge {selectedWallet.badge}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-500 hover:bg-slate-100"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-4 p-5">
              {actionModal !== 'NOTE' && (
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                    Amount <span className="text-red-500">*</span>
                  </span>

                  <input
                    inputMode="decimal"
                    value={actionAmount}
                    onChange={(event) =>
                      setActionAmount(event.target.value)
                    }
                    placeholder="Enter NPR amount"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-amber-400"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    {actionModal === 'LOSING_RETURN'
                      ? `Maximum eligible: ${formatNpr(
                          selectedWallet.eligibleReturn,
                        )}`
                      : `Current expected holding: ${formatNpr(
                          selectedWallet.expectedHolding,
                        )}`}
                  </p>
                </label>
              )}

              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                  {actionModal === 'NOTE'
                    ? 'Wallet Note'
                    : 'Reason / Remarks'}
                  {['ADJUSTMENT', 'NOTE'].includes(actionModal) && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </span>

                <textarea
                  rows={4}
                  value={actionRemarks}
                  onChange={(event) =>
                    setActionRemarks(event.target.value)
                  }
                  placeholder="Enter reason or note"
                  className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-amber-400"
                />
              </label>

              {actionModal === 'ADJUSTMENT' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Authorized adjustments require a reason and should be
                  connected to your backend audit log.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={applyAction}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800"
              >
                Confirm
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

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

const SummaryCard = ({ label, value, note, icon, tone }) => {
  const tones = {
    sky: 'border-sky-200 bg-sky-50/60',
    emerald: 'border-emerald-200 bg-emerald-50/60',
    purple: 'border-purple-200 bg-purple-50/60',
    cyan: 'border-cyan-200 bg-cyan-50/60',
    amber: 'border-amber-200 bg-amber-50/60',
    rose: 'border-rose-200 bg-rose-50/60',
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
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {note}
          </p>
        </div>

        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
          {icon}
        </span>
      </div>
    </div>
  )
}

const DetailCard = ({ label, value, tone = 'slate' }) => (
  <div
    className={`rounded-xl border p-4 ${
      tone === 'purple'
        ? 'border-purple-200 bg-purple-50'
        : 'border-slate-200 bg-slate-50'
    }`}
  >
    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
      {label}
    </p>
    <p className="mt-2 text-sm font-black text-slate-950">{value}</p>
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

export default ChipControl
