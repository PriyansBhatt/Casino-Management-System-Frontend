import { useMemo, useState } from 'react'

const departmentRequests = [
  {
    id: 'REQ-2026-07-10-028',
    department: 'F&B / Kitchen / Bar',
    item: 'Food & Beverage Supplies',
    quantity: 12,
    requestedBy: 'Ramesh K.',
    storeStatus: 'PENDING_REVIEW',
    approvalStatus: 'PENDING',
    requestType: 'URGENT',
  },
  {
    id: 'REQ-2026-07-10-027',
    department: 'Housekeeping',
    item: 'Cleaning Material',
    quantity: 6,
    requestedBy: 'Sita M.',
    storeStatus: 'PENDING_REVIEW',
    approvalStatus: 'PENDING',
    requestType: 'NORMAL',
  },
  {
    id: 'REQ-2026-07-10-026',
    department: 'Gaming Floor / Pit',
    item: 'Table Supplies',
    quantity: 6,
    requestedBy: 'Deepak L.',
    storeStatus: 'PROCUREMENT_NEEDED',
    approvalStatus: 'PENDING',
    requestType: 'NEXT_DAY',
  },
  {
    id: 'REQ-2026-07-10-025',
    department: 'Reception / Gate',
    item: 'Guest Supplies',
    quantity: 4,
    requestedBy: 'Anita P.',
    storeStatus: 'APPROVED',
    approvalStatus: 'APPROVED',
    requestType: 'NORMAL',
  },
  {
    id: 'REQ-2026-07-10-024',
    department: 'Maintenance',
    item: 'Electrical Items',
    quantity: 5,
    requestedBy: 'Suresh T.',
    storeStatus: 'PENDING_REVIEW',
    approvalStatus: 'PENDING',
    requestType: 'NORMAL',
  },
  {
    id: 'REQ-2026-07-10-023',
    department: 'Security',
    item: 'Uniform Fabric',
    quantity: 3,
    requestedBy: 'Mahesh G.',
    storeStatus: 'PROCUREMENT_NEEDED',
    approvalStatus: 'PENDING',
    requestType: 'NEXT_DAY',
  },
  {
    id: 'REQ-2026-07-10-022',
    department: 'IT Department',
    item: 'Printer Cartridge',
    quantity: 2,
    requestedBy: 'Prakash J.',
    storeStatus: 'APPROVED',
    approvalStatus: 'PENDING',
    requestType: 'NORMAL',
  },
  {
    id: 'REQ-2026-07-10-021',
    department: 'F&B / Kitchen / Bar',
    item: 'Beverage Stock',
    quantity: 10,
    requestedBy: 'Ramesh K.',
    storeStatus: 'PENDING_REVIEW',
    approvalStatus: 'PENDING',
    requestType: 'URGENT',
  },
]

const lowStockItems = [
  {
    item: 'Playing Cards — Standard',
    department: 'Gaming Floor / Pit',
    currentStock: '6 decks',
    reorderLevel: '20 decks',
    status: 'CRITICAL',
  },
  {
    item: 'House Cleaning Liquid',
    department: 'Housekeeping',
    currentStock: '2 units',
    reorderLevel: '10 units',
    status: 'LOW',
  },
  {
    item: 'Whisky 750ml',
    department: 'F&B / Kitchen / Bar',
    currentStock: '4 bottles',
    reorderLevel: '15 bottles',
    status: 'LOW',
  },
  {
    item: 'Frozen Chicken',
    department: 'F&B / Kitchen / Bar',
    currentStock: '5 kg',
    reorderLevel: '20 kg',
    status: 'CRITICAL',
  },
  {
    item: 'Staff Uniform Shirt',
    department: 'Security',
    currentStock: '8 pieces',
    reorderLevel: '30 pieces',
    status: 'LOW',
  },
]

const goodsReceiving = [
  {
    grn: 'GRN-260610-015',
    vendor: 'Fresh & Green Suppliers',
    department: 'F&B / Kitchen / Bar',
    deliveryStatus: 'RECEIVED',
    verifiedBy: 'Ramesh K.',
    billStatus: 'BILL_RECEIVED',
  },
  {
    grn: 'GRN-260610-014',
    vendor: 'Shree Clean Solutions',
    department: 'Housekeeping',
    deliveryStatus: 'RECEIVED',
    verifiedBy: 'Sita M.',
    billStatus: 'BILL_PENDING',
  },
  {
    grn: 'GRN-260610-013',
    vendor: 'Ace Cards Pvt. Ltd.',
    department: 'Gaming Floor / Pit',
    deliveryStatus: 'RECEIVED',
    verifiedBy: 'Deepak L.',
    billStatus: 'BILL_RECEIVED',
  },
  {
    grn: 'GRN-260610-012',
    vendor: 'Electro Power Pvt. Ltd.',
    department: 'Maintenance',
    deliveryStatus: 'PARTIAL',
    verifiedBy: 'Suresh T.',
    billStatus: 'BILL_PENDING',
  },
  {
    grn: 'GRN-260610-011',
    vendor: 'Uniform World',
    department: 'Security',
    deliveryStatus: 'RECEIVED',
    verifiedBy: 'Mahesh G.',
    billStatus: 'BILL_RECEIVED',
  },
]

const billsForwarded = [
  {
    bill: 'BILL-260610-007',
    vendor: 'Fresh & Green Suppliers',
    amount: 24850,
    forwardedDate: '10 Jul 2026',
    accountsStatus: 'UNDER_VERIFICATION',
    paymentMethod: 'Bank Transfer',
  },
  {
    bill: 'BILL-260610-006',
    vendor: 'Ace Cards Pvt. Ltd.',
    amount: 18600,
    forwardedDate: '10 Jul 2026',
    accountsStatus: 'VERIFIED',
    paymentMethod: 'NEFT',
  },
  {
    bill: 'BILL-260610-005',
    vendor: 'Electro Power Pvt. Ltd.',
    amount: 16420,
    forwardedDate: '10 Jul 2026',
    accountsStatus: 'VERIFIED',
    paymentMethod: 'Bank Transfer',
  },
  {
    bill: 'BILL-260610-004',
    vendor: 'Shree Clean Solutions',
    amount: 8950,
    forwardedDate: '09 Jul 2026',
    accountsStatus: 'UNDER_VERIFICATION',
    paymentMethod: 'NEFT',
  },
  {
    bill: 'BILL-260610-003',
    vendor: 'Uniform World',
    amount: 12750,
    forwardedDate: '09 Jul 2026',
    accountsStatus: 'APPROVED',
    paymentMethod: 'Bank Transfer',
  },
]

const workflowSteps = [
  { number: 1, title: 'Department Request', value: 28, note: 'New Today' },
  { number: 2, title: 'Store Review', value: 13, note: 'Under Review' },
  { number: 3, title: 'Procurement List', value: 7, note: 'In Progress' },
  { number: 4, title: 'Director Approval', value: 4, note: 'Pending' },
  { number: 5, title: 'Vendor', value: 6, note: 'Orders Sent' },
  { number: 6, title: 'Goods Received', value: 11, note: 'Pending Verify' },
  { number: 7, title: 'Department Mobilisation', value: 8, note: 'In Progress' },
  { number: 8, title: 'Bills to Accounts', value: 7, note: 'Forwarded' },
]

const statusStyles = {
  PENDING_REVIEW: 'border-amber-200 bg-amber-50 text-amber-700',
  PROCUREMENT_NEEDED: 'border-sky-200 bg-sky-50 text-sky-700',
  APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  URGENT: 'border-red-200 bg-red-50 text-red-700',
  NEXT_DAY: 'border-violet-200 bg-violet-50 text-violet-700',
  NORMAL: 'border-slate-200 bg-slate-50 text-slate-600',
  RECEIVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PARTIAL: 'border-sky-200 bg-sky-50 text-sky-700',
  BILL_PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  BILL_RECEIVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  UNDER_VERIFICATION: 'border-sky-200 bg-sky-50 text-sky-700',
  VERIFIED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CRITICAL: 'border-red-200 bg-red-50 text-red-700',
  LOW: 'border-amber-200 bg-amber-50 text-amber-700',
}

const formatStatus = (status = '') =>
  status
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'NPR',
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace('NPR', 'NPR ')

const StorePurchaseDashboard = () => {
  const [requests, setRequests] = useState(departmentRequests)
  const [searchTerm, setSearchTerm] = useState('')
  const [requestTypeFilter, setRequestTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedRequest, setSelectedRequest] = useState(departmentRequests[0])
  const [activeView, setActiveView] = useState('dashboard')
  const [showNewRequestModal, setShowNewRequestModal] = useState(false)
  const [showReceivingModal, setShowReceivingModal] = useState(false)

  const [newRequest, setNewRequest] = useState({
    department: 'F&B / Kitchen / Bar',
    item: '',
    quantity: 1,
    requestType: 'NORMAL',
    requiredDate: '2026-07-11',
    remarks: '',
  })

  const summary = useMemo(
    () => ({
      totalRequests: 28,
      urgentRequests: requests.filter(
        (request) => request.requestType === 'URGENT',
      ).length,
      nextDayRequests: requests.filter(
        (request) => request.requestType === 'NEXT_DAY',
      ).length,
      lowStockAlerts: lowStockItems.length,
      pendingDirectorApproval: requests.filter(
        (request) => request.approvalStatus === 'PENDING',
      ).length,
      goodsReceivingPending: 11,
      billsToAccounts: billsForwarded.length,
      cashPurchasesToday: 24560,
    }),
    [requests],
  )

  const filteredRequests = useMemo(() => {
    const search = searchTerm.toLowerCase().trim()

    return requests.filter((request) => {
      const matchesSearch =
        !search ||
        request.id.toLowerCase().includes(search) ||
        request.department.toLowerCase().includes(search) ||
        request.item.toLowerCase().includes(search) ||
        request.requestedBy.toLowerCase().includes(search)

      const matchesType =
        requestTypeFilter === 'ALL' ||
        request.requestType === requestTypeFilter

      const matchesStatus =
        statusFilter === 'ALL' || request.storeStatus === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })
  }, [requests, searchTerm, requestTypeFilter, statusFilter])

  const createRequest = (event) => {
    event.preventDefault()

    if (!newRequest.item.trim()) {
      window.alert('Item or service name is required.')
      return
    }

    const created = {
      id: `REQ-2026-07-10-${String(requests.length + 29).padStart(3, '0')}`,
      department: newRequest.department,
      item: newRequest.item.trim(),
      quantity: Number(newRequest.quantity),
      requestedBy: 'Current Department User',
      storeStatus: 'PENDING_REVIEW',
      approvalStatus:
        newRequest.requestType === 'NEXT_DAY' ? 'PENDING' : 'PENDING',
      requestType: newRequest.requestType,
    }

    setRequests((current) => [created, ...current])
    setSelectedRequest(created)
    setShowNewRequestModal(false)

    setNewRequest({
      department: 'F&B / Kitchen / Bar',
      item: '',
      quantity: 1,
      requestType: 'NORMAL',
      requiredDate: '2026-07-11',
      remarks: '',
    })
  }

  const updateRequest = (id, updates) => {
    setRequests((current) =>
      current.map((request) =>
        request.id === id ? { ...request, ...updates } : request,
      ),
    )

    setSelectedRequest((current) =>
      current?.id === id ? { ...current, ...updates } : current,
    )
  }

  const exportRequests = () => {
    const headers = [
      'Request ID',
      'Department',
      'Item',
      'Quantity',
      'Requested By',
      'Store Status',
      'Approval Status',
      'Request Type',
    ]

    const rows = filteredRequests.map((request) => [
      request.id,
      request.department,
      request.item,
      request.quantity,
      request.requestedBy,
      request.storeStatus,
      request.approvalStatus,
      request.requestType,
    ])

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(','),
      )
      .join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'store-purchase-requests.csv'
    link.click()

    URL.revokeObjectURL(url)
  }

  const StatusBadge = ({ value }) => (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
        statusStyles[value] || statusStyles.NORMAL
      }`}
    >
      {formatStatus(value)}
    </span>
  )

  const SummaryCard = ({ title, value, note, icon, tone = 'slate' }) => {
    const styles = {
      slate: 'border-slate-200',
      blue: 'border-sky-200',
      red: 'border-red-200',
      violet: 'border-violet-200',
      amber: 'border-amber-200',
      emerald: 'border-emerald-200',
    }

    return (
      <button
        type="button"
        className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
          styles[tone] || styles.slate
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
              {title}
            </p>

            <p className="mt-3 font-serif text-2xl font-bold text-slate-950">
              {value}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">{note}</p>
          </div>

          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-lg">
            {icon}
          </span>
        </div>
      </button>
    )
  }

  const SectionHeader = ({ title, actionLabel, onAction }) => (
    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
      <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-700">
        {title}
      </h2>

      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="text-xs font-extrabold text-amber-700 hover:text-amber-600"
        >
          {actionLabel} →
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-6 text-slate-900">
      <div className="mx-auto max-w-[1750px]">
        <header className="border-b border-slate-200 pb-5">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-600">
                Back Office
              </p>

              <h1 className="mt-1 font-serif text-3xl font-bold text-slate-950">
                Store / Purchase Dashboard
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Department requests, procurement workflow, receiving, stock
                alerts, bills and operational records.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowNewRequestModal(true)}
                className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-extrabold text-slate-950 shadow-sm hover:bg-amber-300"
              >
                + New Department Request
              </button>

              <button
                type="button"
                onClick={() => setActiveView('requests')}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Review Requests
              </button>

              <button
                type="button"
                onClick={() => setShowReceivingModal(true)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Goods Receiving
              </button>

              <button
                type="button"
                onClick={exportRequests}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Export
              </button>
            </div>
          </div>
        </header>

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            ['dashboard', 'Dashboard'],
            ['requests', 'Department Requests'],
            ['procurement', 'Procurement'],
            ['receiving', 'Goods Receiving'],
            ['bills', 'Bills & Accounts'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveView(value)}
              className={`rounded-xl px-4 py-2 text-sm font-extrabold ${
                activeView === value
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <SummaryCard
            title="Total Requests Today"
            value={summary.totalRequests}
            note="View all"
            icon="📋"
            tone="blue"
          />

          <SummaryCard
            title="Urgent Requests"
            value={summary.urgentRequests}
            note="Needs attention"
            icon="⚠"
            tone="red"
          />

          <SummaryCard
            title="Next-Day Requests"
            value={summary.nextDayRequests}
            note="Director approval"
            icon="◷"
            tone="violet"
          />

          <SummaryCard
            title="Low Stock Alerts"
            value={summary.lowStockAlerts}
            note="Reorder required"
            icon="📦"
            tone="amber"
          />

          <SummaryCard
            title="Pending Director Approval"
            value={summary.pendingDirectorApproval}
            note="Awaiting decision"
            icon="👤"
            tone="amber"
          />

          <SummaryCard
            title="Goods Receiving Pending"
            value={summary.goodsReceivingPending}
            note="Pending verification"
            icon="🚚"
            tone="blue"
          />

          <SummaryCard
            title="Bills to Accounts"
            value={summary.billsToAccounts}
            note="Forwarded"
            icon="🧾"
            tone="emerald"
          />

          <SummaryCard
            title="Cash Purchases Today"
            value={formatCurrency(summary.cashPurchasesToday)}
            note="Small cash purchases"
            icon="₨"
            tone="amber"
          />
        </section>

        {activeView === 'dashboard' && (
          <>
            <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(420px,0.8fr)]">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <SectionHeader
                  title="Department Requests Queue"
                  actionLabel="View all requests"
                  onAction={() => setActiveView('requests')}
                />

                <div className="overflow-x-auto">
                  <table className="min-w-[1050px] w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        {[
                          'Request ID',
                          'Department',
                          'Request Item',
                          'Qty',
                          'Requested By',
                          'Store Status',
                          'Approval',
                          'Type',
                          'Action',
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {requests.map((request) => (
                        <tr
                          key={request.id}
                          onClick={() => setSelectedRequest(request)}
                          className="cursor-pointer border-t border-slate-100 hover:bg-amber-50/40"
                        >
                          <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">
                            {request.id}
                          </td>

                          <td className="px-4 py-3 text-xs font-bold text-slate-700">
                            {request.department}
                          </td>

                          <td className="px-4 py-3 text-xs text-slate-600">
                            {request.item}
                          </td>

                          <td className="px-4 py-3 text-xs font-bold text-slate-700">
                            {request.quantity}
                          </td>

                          <td className="px-4 py-3 text-xs text-slate-600">
                            {request.requestedBy}
                          </td>

                          <td className="px-4 py-3">
                            <StatusBadge value={request.storeStatus} />
                          </td>

                          <td className="px-4 py-3">
                            <StatusBadge value={request.approvalStatus} />
                          </td>

                          <td className="px-4 py-3">
                            <StatusBadge value={request.requestType} />
                          </td>

                          <td className="px-4 py-3">
                            <button
                              type="button"
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <SectionHeader title="Procurement Workflow Snapshot" />

                  <div className="grid gap-3 p-4 sm:grid-cols-2">
                    {workflowSteps.map((step) => (
                      <div
                        key={step.number}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-slate-950">
                            {step.number}
                          </span>

                          <div>
                            <p className="text-xs font-extrabold text-slate-800">
                              {step.title}
                            </p>

                            <p className="mt-1 font-serif text-xl font-bold text-slate-950">
                              {step.value}
                            </p>

                            <p className="text-[11px] text-slate-500">
                              {step.note}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <SectionHeader
                    title="Low Stock & Reorder Alerts"
                    actionLabel="View all alerts"
                  />

                  <div className="divide-y divide-slate-100">
                    {lowStockItems.map((item) => (
                      <div
                        key={item.item}
                        className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3"
                      >
                        <div>
                          <p className="text-xs font-extrabold text-slate-800">
                            {item.item}
                          </p>

                          <p className="mt-1 text-[11px] text-slate-500">
                            {item.department}
                          </p>

                          <p className="mt-1 text-[11px] font-semibold text-slate-600">
                            Stock: {item.currentStock} · Reorder:{' '}
                            {item.reorderLevel}
                          </p>
                        </div>

                        <StatusBadge value={item.status} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <SectionHeader title="Vehicle / Fuel / Maintenance" />

                  <div className="grid gap-3 p-4 sm:grid-cols-2">
                    {[
                      ['Fuel Issued Today', 'NPR 12,450', '3 vehicles', '⛽'],
                      ['Vehicles in Service', '12', 'of 18 vehicles', '🚗'],
                      ['Maintenance Pending', '4', 'Next 7 days', '🔧'],
                      ['Oil Expenses MTD', 'NPR 18,750', 'This month', '🛢'],
                    ].map(([title, value, note, icon]) => (
                      <div
                        key={title}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{icon}</span>

                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                              {title}
                            </p>

                            <p className="mt-1 font-serif text-lg font-bold text-slate-950">
                              {value}
                            </p>

                            <p className="text-[11px] text-slate-500">{note}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-5 grid gap-5 xl:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <SectionHeader
                  title="Recent Goods Receiving"
                  actionLabel="View all GRNs"
                  onAction={() => setActiveView('receiving')}
                />

                <div className="overflow-x-auto">
                  <table className="min-w-[800px] w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        {[
                          'GRN No',
                          'Vendor',
                          'Department',
                          'Delivery',
                          'Verified By',
                          'Bill Status',
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {goodsReceiving.map((record) => (
                        <tr
                          key={record.grn}
                          className="border-t border-slate-100"
                        >
                          <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">
                            {record.grn}
                          </td>

                          <td className="px-4 py-3 text-xs text-slate-700">
                            {record.vendor}
                          </td>

                          <td className="px-4 py-3 text-xs text-slate-600">
                            {record.department}
                          </td>

                          <td className="px-4 py-3">
                            <StatusBadge value={record.deliveryStatus} />
                          </td>

                          <td className="px-4 py-3 text-xs text-slate-600">
                            {record.verifiedBy}
                          </td>

                          <td className="px-4 py-3">
                            <StatusBadge value={record.billStatus} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <SectionHeader
                  title="Bills Forwarded to Accounts"
                  actionLabel="View all bills"
                  onAction={() => setActiveView('bills')}
                />

                <div className="overflow-x-auto">
                  <table className="min-w-[820px] w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        {[
                          'Bill No',
                          'Vendor',
                          'Amount',
                          'Forwarded',
                          'Accounts Status',
                          'Payment',
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {billsForwarded.map((bill) => (
                        <tr
                          key={bill.bill}
                          className="border-t border-slate-100"
                        >
                          <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">
                            {bill.bill}
                          </td>

                          <td className="px-4 py-3 text-xs text-slate-700">
                            {bill.vendor}
                          </td>

                          <td className="px-4 py-3 text-xs font-extrabold text-slate-800">
                            {formatCurrency(bill.amount)}
                          </td>

                          <td className="px-4 py-3 text-xs text-slate-600">
                            {bill.forwardedDate}
                          </td>

                          <td className="px-4 py-3">
                            <StatusBadge value={bill.accountsStatus} />
                          </td>

                          <td className="px-4 py-3 text-xs text-slate-600">
                            {bill.paymentMethod}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}

        {activeView === 'requests' && (
          <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-[1fr_220px_240px]">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search request, department, item or requester..."
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:bg-white"
                />

                <select
                  value={requestTypeFilter}
                  onChange={(event) =>
                    setRequestTypeFilter(event.target.value)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-amber-400"
                >
                  <option value="ALL">All Request Types</option>
                  <option value="NORMAL">Normal</option>
                  <option value="URGENT">Urgent</option>
                  <option value="NEXT_DAY">Next-Day</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-amber-400"
                >
                  <option value="ALL">All Store Statuses</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="PROCUREMENT_NEEDED">
                    Procurement Needed
                  </option>
                  <option value="APPROVED">Approved</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[1050px] w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      {[
                        'Request ID',
                        'Department',
                        'Item',
                        'Qty',
                        'Requester',
                        'Store Status',
                        'Approval',
                        'Type',
                        'Action',
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRequests.map((request) => (
                      <tr
                        key={request.id}
                        onClick={() => setSelectedRequest(request)}
                        className={`cursor-pointer border-t border-slate-100 ${
                          selectedRequest?.id === request.id
                            ? 'bg-amber-50'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-4 py-4 font-mono text-xs font-bold text-slate-700">
                          {request.id}
                        </td>

                        <td className="px-4 py-4 text-xs font-bold text-slate-700">
                          {request.department}
                        </td>

                        <td className="px-4 py-4 text-xs text-slate-600">
                          {request.item}
                        </td>

                        <td className="px-4 py-4 text-xs font-bold text-slate-700">
                          {request.quantity}
                        </td>

                        <td className="px-4 py-4 text-xs text-slate-600">
                          {request.requestedBy}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge value={request.storeStatus} />
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge value={request.approvalStatus} />
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge value={request.requestType} />
                        </td>

                        <td className="px-4 py-4">
                          <button
                            type="button"
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-white"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-5">
              {selectedRequest && (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                        Selected Request
                      </p>

                      <h2 className="mt-2 text-lg font-extrabold text-slate-950">
                        {selectedRequest.item}
                      </h2>

                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {selectedRequest.id}
                      </p>
                    </div>

                    <StatusBadge value={selectedRequest.requestType} />
                  </div>

                  <div className="mt-5 space-y-3 border-y border-slate-200 py-4">
                    {[
                      ['Department', selectedRequest.department],
                      ['Quantity', selectedRequest.quantity],
                      ['Requested By', selectedRequest.requestedBy],
                      [
                        'Store Status',
                        formatStatus(selectedRequest.storeStatus),
                      ],
                      [
                        'Approval',
                        formatStatus(selectedRequest.approvalStatus),
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-start justify-between gap-4"
                      >
                        <span className="text-xs font-semibold text-slate-500">
                          {label}
                        </span>

                        <span className="text-right text-sm font-extrabold text-slate-800">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 space-y-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateRequest(selectedRequest.id, {
                          storeStatus: 'APPROVED',
                        })
                      }
                      className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-emerald-500"
                    >
                      Issue from Store / Approve
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateRequest(selectedRequest.id, {
                          storeStatus: 'PROCUREMENT_NEEDED',
                        })
                      }
                      className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-sky-500"
                    >
                      Send to Procurement
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateRequest(selectedRequest.id, {
                          approvalStatus: 'APPROVED',
                        })
                      }
                      className="w-full rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-extrabold text-amber-800 hover:bg-amber-100"
                    >
                      Director Approve
                    </button>
                  </div>
                </>
              )}
            </aside>
          </section>
        )}

        {activeView === 'procurement' && (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-serif text-2xl font-bold text-slate-950">
              Procurement Workflow
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Requests requiring vendor quotations, purchase orders and director
              approval.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {workflowSteps.map((step) => (
                <div
                  key={step.number}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-sm font-black">
                    {step.number}
                  </span>

                  <p className="mt-4 text-sm font-extrabold text-slate-800">
                    {step.title}
                  </p>

                  <p className="mt-2 font-serif text-3xl font-bold text-slate-950">
                    {step.value}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">{step.note}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeView === 'receiving' && (
          <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              title="Goods Receiving Register"
              actionLabel="New Goods Receipt"
              onAction={() => setShowReceivingModal(true)}
            />

            <div className="overflow-x-auto">
              <table className="min-w-[1000px] w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      'GRN No',
                      'Vendor',
                      'Department',
                      'Delivery Status',
                      'Verified By',
                      'Bill Status',
                      'Action',
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {goodsReceiving.map((record) => (
                    <tr
                      key={record.grn}
                      className="border-t border-slate-100"
                    >
                      <td className="px-4 py-4 font-mono text-xs font-bold text-slate-700">
                        {record.grn}
                      </td>

                      <td className="px-4 py-4 text-sm font-bold text-slate-700">
                        {record.vendor}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {record.department}
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge value={record.deliveryStatus} />
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {record.verifiedBy}
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge value={record.billStatus} />
                      </td>

                      <td className="px-4 py-4">
                        <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold">
                          View GRN
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeView === 'bills' && (
          <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader title="Bills Forwarded to Accounts" />

            <div className="overflow-x-auto">
              <table className="min-w-[1000px] w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      'Bill No',
                      'Vendor',
                      'Amount',
                      'Forwarded Date',
                      'Accounts Status',
                      'Payment Method',
                      'Action',
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {billsForwarded.map((bill) => (
                    <tr key={bill.bill} className="border-t border-slate-100">
                      <td className="px-4 py-4 font-mono text-xs font-bold text-slate-700">
                        {bill.bill}
                      </td>

                      <td className="px-4 py-4 text-sm font-bold text-slate-700">
                        {bill.vendor}
                      </td>

                      <td className="px-4 py-4 text-sm font-extrabold text-slate-800">
                        {formatCurrency(bill.amount)}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {bill.forwardedDate}
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge value={bill.accountsStatus} />
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {bill.paymentMethod}
                      </td>

                      <td className="px-4 py-4">
                        <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold">
                          View Bill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {showNewRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={createRequest}
            className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="font-serif text-2xl font-bold text-slate-950">
                  New Department Request
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Record a normal, urgent or next-day requirement.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowNewRequestModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-500"
              >
                ×
              </button>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              <label>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Department
                </span>

                <select
                  value={newRequest.department}
                  onChange={(event) =>
                    setNewRequest((current) => ({
                      ...current,
                      department: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400"
                >
                  <option>F&B / Kitchen / Bar</option>
                  <option>Gaming Floor / Pit</option>
                  <option>Reception / Gate</option>
                  <option>CRM / GRE / Marketing</option>
                  <option>Housekeeping</option>
                  <option>Security</option>
                  <option>Maintenance</option>
                  <option>IT Department</option>
                </select>
              </label>

              <label>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Request Type
                </span>

                <select
                  value={newRequest.requestType}
                  onChange={(event) =>
                    setNewRequest((current) => ({
                      ...current,
                      requestType: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="URGENT">Urgent</option>
                  <option value="NEXT_DAY">Next-Day</option>
                </select>
              </label>

              <label className="md:col-span-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Item / Requirement *
                </span>

                <input
                  value={newRequest.item}
                  onChange={(event) =>
                    setNewRequest((current) => ({
                      ...current,
                      item: event.target.value,
                    }))
                  }
                  placeholder="Enter required item or service"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-400"
                />
              </label>

              <label>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Quantity
                </span>

                <input
                  type="number"
                  min="1"
                  value={newRequest.quantity}
                  onChange={(event) =>
                    setNewRequest((current) => ({
                      ...current,
                      quantity: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-400"
                />
              </label>

              <label>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Required Date
                </span>

                <input
                  type="date"
                  value={newRequest.requiredDate}
                  onChange={(event) =>
                    setNewRequest((current) => ({
                      ...current,
                      requiredDate: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-400"
                />
              </label>

              <label className="md:col-span-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Remarks
                </span>

                <textarea
                  rows="4"
                  value={newRequest.remarks}
                  onChange={(event) =>
                    setNewRequest((current) => ({
                      ...current,
                      remarks: event.target.value,
                    }))
                  }
                  placeholder="Add reason, urgency details or specifications"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-400"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() => setShowNewRequestModal(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-extrabold text-slate-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-xl bg-amber-400 px-6 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-amber-300"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}

      {showReceivingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="font-serif text-2xl font-bold text-slate-950">
                  Record Goods Receiving
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Support complete and partial deliveries with bill verification.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowReceivingModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-500"
              >
                ×
              </button>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              {[
                ['Purchase Order / Request ID', 'PO-2026-XXXX'],
                ['Vendor', 'Select vendor'],
                ['Invoice / Bill Number', 'Enter invoice number'],
                ['Delivery Date', '10 July 2026'],
                ['Received Quantity', 'Enter quantity'],
                ['Verified By', 'Current Store User'],
              ].map(([label, placeholder]) => (
                <label key={label}>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    {label}
                  </span>

                  <input
                    placeholder={placeholder}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-400"
                  />
                </label>
              ))}

              <label>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Delivery Status
                </span>

                <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400">
                  <option>Full Delivery</option>
                  <option>Partial Delivery</option>
                </select>
              </label>

              <label>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Bill Status
                </span>

                <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400">
                  <option>Bill Received</option>
                  <option>Bill Pending</option>
                </select>
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() => setShowReceivingModal(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-extrabold text-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowReceivingModal(false)
                  setActiveView('receiving')
                }}
                className="rounded-xl bg-amber-400 px-6 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-amber-300"
              >
                Save Goods Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StorePurchaseDashboard