import { useMemo, useState } from 'react'

const money = (value) => `NPR ${Number(value || 0).toLocaleString('en-IN')}`

const foodItems = [
  { name: 'Fried Rice', price: 650, icon: '🍚', department: 'Kitchen' },
  { name: 'Chicken Chilli', price: 850, icon: '🍗', department: 'Kitchen' },
  { name: 'Momo', price: 450, icon: '🥟', department: 'Kitchen' },
  { name: 'French Fries', price: 350, icon: '🍟', department: 'Kitchen' },
  { name: 'Club Sandwich', price: 600, icon: '🥪', department: 'Kitchen' },
]

const beverageItems = [
  { name: 'Fresh Lime Soda', price: 250, icon: '🥤', department: 'Bar' },
  { name: 'Cold Drink', price: 180, icon: '🥫', department: 'Bar' },
  { name: 'Coffee', price: 220, icon: '☕', department: 'Bar' },
  { name: 'Tea', price: 150, icon: '🍵', department: 'Bar' },
  { name: 'Dry Snacks', price: 400, icon: '🥜', department: 'Bar' },
]

const initialOrders = [
  {
    id: 'FB-2026-0721-001',
    ticketId: 'KOT-201',
    time: '19:42',
    badge: '087',
    cid: 'CID-100387',
    customer: 'Raj Sharma',
    category: 'VIP',
    type: 'Food',
    items: 'Chicken Biryani + Raita',
    qty: 2,
    requestedBy: 'GRE - Karan Lama',
    location: 'Baccarat Table 1',
    department: 'Kitchen',
    assignedStaff: 'Chef Arjun',
    priority: 'VIP',
    status: 'Preparing',
    cost: 1600,
    remarks: 'Less spicy, extra raita',
    createdAt: '2026-07-21 19:42',
  },
  {
    id: 'FB-2026-0721-002',
    ticketId: 'BOT-1148',
    time: '19:35',
    badge: '112',
    cid: 'CID-100112',
    customer: 'Daniel Smith',
    category: 'VVIP',
    type: 'Beverage',
    items: 'Whisky Single + Dry Snacks',
    qty: 4,
    requestedBy: 'Bar - Milan Thapa',
    location: 'Bar Lounge',
    department: 'Bar',
    assignedStaff: 'Rohit D.',
    priority: 'VVIP',
    status: 'Ready',
    cost: 2000,
    remarks: '',
    createdAt: '2026-07-21 19:35',
  },
  {
    id: 'FB-2026-0721-003',
    ticketId: 'KOT-203',
    time: '19:28',
    badge: '044',
    cid: 'CID-100044',
    customer: 'Amit Verma',
    category: 'VIP',
    type: 'Food',
    items: 'Grilled Fish + Mint Chutney',
    qty: 1,
    requestedBy: 'GRE - Sita Gurung',
    location: 'Kitchen',
    department: 'Kitchen',
    assignedStaff: 'Chef Neha',
    priority: 'Normal',
    status: 'Pending',
    cost: 950,
    remarks: 'Well done',
    createdAt: '2026-07-21 19:28',
  },
  {
    id: 'FB-2026-0721-004',
    ticketId: 'BOT-1147',
    time: '19:13',
    badge: '051',
    cid: 'CID-100051',
    customer: 'Priya Tamang',
    category: 'VIP',
    type: 'Beverage',
    items: 'Fresh Lime Soda',
    qty: 3,
    requestedBy: 'Gaming Floor - Nabin Rai',
    location: 'Gaming Floor',
    department: 'Bar',
    assignedStaff: 'Pooja S.',
    priority: 'High',
    status: 'Delivered',
    cost: 450,
    remarks: '',
    createdAt: '2026-07-21 19:13',
  },
  {
    id: 'FB-2026-0721-005',
    ticketId: 'KOT-205',
    time: '19:02',
    badge: '091',
    cid: 'CID-100091',
    customer: 'Suresh Adhikari',
    category: 'VVIP',
    type: 'Food',
    items: 'Veg Platter',
    qty: 2,
    requestedBy: 'GRE - Karan Lama',
    location: 'Bar',
    department: 'Kitchen',
    assignedStaff: 'Chef Arjun',
    priority: 'VVIP',
    status: 'Preparing',
    cost: 1200,
    remarks: 'Extra sauce',
    createdAt: '2026-07-21 19:02',
  },
  {
    id: 'FB-2026-0721-006',
    ticketId: 'BOT-1146',
    time: '18:55',
    badge: '073',
    cid: 'CID-100073',
    customer: 'Deepak Joshi',
    category: 'VIP',
    type: 'Beverage',
    items: 'Beer Can',
    qty: 6,
    requestedBy: 'Bar - Milan Thapa',
    location: 'Kitchen',
    department: 'Bar',
    assignedStaff: 'Rohit D.',
    priority: 'Normal',
    status: 'Pending',
    cost: 1800,
    remarks: '',
    createdAt: '2026-07-21 18:55',
  },
  {
    id: 'FB-2026-0721-007',
    ticketId: 'KOT-207',
    time: '18:47',
    badge: '066',
    cid: 'CID-100066',
    customer: 'Pawan Gurung',
    category: 'VIP',
    type: 'Food',
    items: 'Pasta Alfredo',
    qty: 1,
    requestedBy: 'GRE - Sita Gurung',
    location: 'Gaming Floor',
    department: 'Kitchen',
    assignedStaff: 'Chef Neha',
    priority: 'VIP',
    status: 'Ready',
    cost: 950,
    remarks: 'Thank you',
    createdAt: '2026-07-21 18:47',
  },
  {
    id: 'FB-2026-0721-008',
    ticketId: 'KOT-208',
    time: '18:40',
    badge: '122',
    cid: 'CID-100122',
    customer: 'Arjun Khadka',
    category: 'STANDARD',
    type: 'Food',
    items: 'Chicken Wings',
    qty: 1,
    requestedBy: 'Gaming Floor - Nabin Rai',
    location: 'Bar',
    department: 'Kitchen',
    assignedStaff: '',
    priority: 'Normal',
    status: 'Cancelled',
    cost: 750,
    remarks: 'Customer cancelled',
    createdAt: '2026-07-21 18:40',
  },
]

const emptyForm = {
  badge: '',
  cid: '',
  customer: '',
  category: 'VIP',
  type: 'Food',
  item: 'Fried Rice',
  quantity: 1,
  requestedBy: 'GRE',
  requestedByName: '',
  location: '',
  priority: 'Normal',
  remarks: '',
}

const FnbKitchenBar = () => {
  const [orders, setOrders] = useState(initialOrders)
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [selectedOrder, setSelectedOrder] = useState(initialOrders[0])
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState(null)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [departmentFilter, setDepartmentFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')

  const tabs = [
    'Dashboard',
    'New F&B Request',
    'Kitchen Live KOT',
    'Bar Live BOT',
    'KOT / BOT Manager',
    'Order History',
  ]

  const currentItems = form.type === 'Food' ? foodItems : beverageItems
  const selectedMenuItem =
    currentItems.find((item) => item.name === form.item) || currentItems[0]

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase()

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.id.toLowerCase().includes(query) ||
        order.ticketId.toLowerCase().includes(query) ||
        order.customer.toLowerCase().includes(query) ||
        order.cid.toLowerCase().includes(query) ||
        order.badge.includes(query) ||
        order.items.toLowerCase().includes(query)

      const matchesType = typeFilter === 'All' || order.type === typeFilter
      const matchesStatus =
        statusFilter === 'All' || order.status === statusFilter
      const matchesDepartment =
        departmentFilter === 'All' || order.department === departmentFilter
      const matchesCategory =
        categoryFilter === 'All' || order.category === categoryFilter

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesDepartment &&
        matchesCategory
      )
    })
  }, [
    categoryFilter,
    departmentFilter,
    orders,
    search,
    statusFilter,
    typeFilter,
  ])

  const stats = useMemo(() => {
    const count = (status) =>
      orders.filter((order) => order.status === status).length

    return {
      total: orders.length,
      pending: count('Pending'),
      preparing: count('Preparing'),
      ready: count('Ready'),
      delivered: count('Delivered'),
      cancelled: count('Cancelled'),
      vip: orders.filter((order) =>
        ['VIP', 'VVIP'].includes(order.category),
      ).length,
      totalCost: orders.reduce((total, order) => total + order.cost, 0),
      foodPending: orders.filter(
        (order) => order.type === 'Food' && order.status === 'Pending',
      ).length,
      barPending: orders.filter(
        (order) => order.type === 'Beverage' && order.status === 'Pending',
      ).length,
    }
  }, [orders])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 3000)
  }

  const changeStatus = (orderId, status) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, status } : order,
      ),
    )

    setSelectedOrder((current) =>
      current?.id === orderId ? { ...current, status } : current,
    )

    showToast(`Order ${orderId} marked ${status}.`)
  }

  const assignStaff = (orderId, assignedStaff) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, assignedStaff } : order,
      ),
    )

    setSelectedOrder((current) =>
      current?.id === orderId ? { ...current, assignedStaff } : current,
    )

    showToast(`Staff assigned to ${orderId}.`)
  }

  const updatePriority = (orderId, priority) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, priority } : order,
      ),
    )

    setSelectedOrder((current) =>
      current?.id === orderId ? { ...current, priority } : current,
    )

    showToast(`Priority updated for ${orderId}.`)
  }

  const validateForm = () => {
    const nextErrors = {}

    if (!form.badge.trim()) nextErrors.badge = 'Badge number is required.'
    if (!form.cid.trim()) nextErrors.cid = 'CID is required.'
    if (!form.customer.trim()) nextErrors.customer = 'Customer name is required.'
    if (!form.location.trim()) nextErrors.location = 'Delivery location is required.'
    if (!form.requestedByName.trim()) {
      nextErrors.requestedByName = 'Requester name is required.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submitOrder = () => {
    if (!validateForm()) return

    const number = orders.length + 1
    const id = `FB-2026-0721-${String(number).padStart(3, '0')}`
    const department = selectedMenuItem.department
    const ticketId = `${department === 'Kitchen' ? 'KOT' : 'BOT'}-${210 + number}`
    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    const record = {
      id,
      ticketId,
      time,
      badge: form.badge.trim(),
      cid: form.cid.trim(),
      customer: form.customer.trim(),
      category: form.category,
      type: form.type,
      items: form.item,
      qty: Number(form.quantity),
      requestedBy: `${form.requestedBy} - ${form.requestedByName.trim()}`,
      location: form.location.trim(),
      department,
      assignedStaff: '',
      priority: form.priority,
      status: 'Pending',
      cost: selectedMenuItem.price * Number(form.quantity),
      remarks: form.remarks.trim(),
      createdAt: `2026-07-21 ${time}`,
    }

    setOrders((current) => [record, ...current])
    setSelectedOrder(record)
    setForm(emptyForm)
    setErrors({})
    setActiveTab(department === 'Kitchen' ? 'Kitchen Live KOT' : 'Bar Live BOT')
    showToast(`${ticketId} created successfully.`)
  }

  const exportCsv = () => {
    const headers = [
      'Order ID',
      'Ticket ID',
      'Time',
      'Badge',
      'CID',
      'Customer',
      'Category',
      'Type',
      'Items',
      'Quantity',
      'Requested By',
      'Location',
      'Department',
      'Assigned Staff',
      'Priority',
      'Status',
      'Cost',
      'Remarks',
    ]

    const rows = filteredOrders.map((order) => [
      order.id,
      order.ticketId,
      order.time,
      order.badge,
      order.cid,
      order.customer,
      order.category,
      order.type,
      order.items,
      order.qty,
      order.requestedBy,
      order.location,
      order.department,
      order.assignedStaff,
      order.priority,
      order.status,
      order.cost,
      order.remarks,
    ])

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`)
          .join(','),
      )
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = 'fnb-orders.csv'
    anchor.click()

    URL.revokeObjectURL(url)
    showToast('F&B orders exported.')
  }

  const openNewRequest = (type = 'Food') => {
    setForm({
      ...emptyForm,
      type,
      item: type === 'Food' ? foodItems[0].name : beverageItems[0].name,
    })
    setErrors({})
    setActiveTab('New F&B Request')
  }

  return (
    <div className="space-y-5 text-slate-900">
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-500">F&B / Kitchen / Bar</p>
          <h1 className="mt-1 font-serif text-3xl font-black tracking-tight text-slate-950">
            <span className="mr-2 text-amber-400">◆</span>
            F&B / Kitchen / Bar Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Create guest orders, route food to Kitchen, route beverages to Bar,
            and track delivery from one page.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openNewRequest('Food')}
          className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 shadow-sm hover:bg-amber-300"
        >
          + New Food / Beverage Request
        </button>
      </section>

      <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-black transition ${
              activeTab === tab
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === 'Dashboard' && (
        <DashboardView
          stats={stats}
          orders={filteredOrders}
          search={search}
          setSearch={setSearch}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          selectedOrder={selectedOrder}
          setSelectedOrder={setSelectedOrder}
          openNewRequest={openNewRequest}
          changeStatus={changeStatus}
          exportCsv={exportCsv}
        />
      )}

      {activeTab === 'New F&B Request' && (
        <NewRequestView
          form={form}
          setForm={setForm}
          errors={errors}
          items={currentItems}
          selectedMenuItem={selectedMenuItem}
          submitOrder={submitOrder}
        />
      )}

      {activeTab === 'Kitchen Live KOT' && (
        <LiveBoard
          title="Kitchen Live KOT Display"
          description="Touch-friendly kitchen production board."
          orders={orders.filter((order) => order.department === 'Kitchen')}
          changeStatus={changeStatus}
          department="Kitchen"
        />
      )}

      {activeTab === 'Bar Live BOT' && (
        <LiveBoard
          title="Bar Live BOT Display"
          description="Live beverage and bar order board."
          orders={orders.filter((order) => order.department === 'Bar')}
          changeStatus={changeStatus}
          department="Bar"
        />
      )}

      {activeTab === 'KOT / BOT Manager' && (
        <ManagerView
          orders={filteredOrders}
          selectedOrder={selectedOrder}
          setSelectedOrder={setSelectedOrder}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          changeStatus={changeStatus}
          assignStaff={assignStaff}
          updatePriority={updatePriority}
        />
      )}

      {activeTab === 'Order History' && (
        <HistoryView
          stats={stats}
          orders={filteredOrders}
          search={search}
          setSearch={setSearch}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          setSelectedOrder={setSelectedOrder}
          exportCsv={exportCsv}
        />
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

const DashboardView = ({
  stats,
  orders,
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  departmentFilter,
  setDepartmentFilter,
  selectedOrder,
  setSelectedOrder,
  openNewRequest,
  changeStatus,
  exportCsv,
}) => (
  <>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
      <SummaryCard label="Pending Food Orders" value={stats.foodPending} icon="🍽️" />
      <SummaryCard label="Pending Bar Orders" value={stats.barPending} icon="🍸" />
      <SummaryCard label="In Preparation" value={stats.preparing} icon="👨‍🍳" />
      <SummaryCard label="Ready for Delivery" value={stats.ready} icon="🔔" />
      <SummaryCard label="Delivered Today" value={stats.delivered} icon="✅" />
      <SummaryCard label="VIP / VVIP Requests" value={stats.vip} icon="💎" />
      <SummaryCard label="Total F&B Cost" value={money(stats.totalCost)} icon="💵" />
    </section>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_330px]">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-5">
          <input
            className={inputClass}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order, CID, badge or customer..."
          />
          <select className={inputClass} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option>All</option>
            <option>Food</option>
            <option>Beverage</option>
          </select>
          <select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>All</option>
            <option>Pending</option>
            <option>Preparing</option>
            <option>Ready</option>
            <option>Delivered</option>
            <option>Cancelled</option>
          </select>
          <select className={inputClass} value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
            <option>All</option>
            <option>Kitchen</option>
            <option>Bar</option>
          </select>
          <button type="button" onClick={exportCsv} className={secondaryButton}>
            Export CSV
          </button>
        </div>

        <OrderTable
          orders={orders}
          selectedOrder={selectedOrder}
          setSelectedOrder={setSelectedOrder}
          changeStatus={changeStatus}
        />
      </div>

      <aside className="space-y-4">
        <SelectedOrderCard order={selectedOrder} changeStatus={changeStatus} />

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">
            Quick Actions
          </h3>
          <div className="mt-4 space-y-2">
            <button type="button" onClick={() => openNewRequest('Food')} className={`${secondaryButton} w-full`}>
              🍽 New Food Request
            </button>
            <button type="button" onClick={() => openNewRequest('Beverage')} className={`${secondaryButton} w-full`}>
              🍸 New Beverage Request
            </button>
            <button type="button" onClick={() => window.print()} className={`${secondaryButton} w-full`}>
              Print Current View
            </button>
          </div>
        </div>
      </aside>
    </section>
  </>
)

const NewRequestView = ({
  form,
  setForm,
  errors,
  items,
  selectedMenuItem,
  submitOrder,
}) => (
  <section className="space-y-5">
    <div>
      <p className="text-sm font-bold text-slate-500">F&B / Kitchen / Bar</p>
      <h2 className="mt-1 font-serif text-3xl font-black">
        <span className="mr-2 text-amber-400">◆</span>
        New F&B Request
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Food automatically routes to Kitchen KOT. Beverages automatically route
        to Bar BOT.
      </p>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Badge Number"
          value={form.badge}
          error={errors.badge}
          onChange={(value) => setForm((current) => ({ ...current, badge: value }))}
        />
        <InputField
          label="CID"
          value={form.cid}
          error={errors.cid}
          onChange={(value) => setForm((current) => ({ ...current, cid: value }))}
        />
        <InputField
          label="Customer Name"
          value={form.customer}
          error={errors.customer}
          onChange={(value) => setForm((current) => ({ ...current, customer: value }))}
        />
        <SelectField
          label="Customer Category"
          value={form.category}
          options={['STANDARD', 'VIP', 'VVIP']}
          onChange={(value) => setForm((current) => ({ ...current, category: value }))}
        />
      </div>

      <div className="mt-5">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
          Order Type
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {['Food', 'Beverage'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  type,
                  item: type === 'Food' ? foodItems[0].name : beverageItems[0].name,
                }))
              }
              className={`h-12 rounded-xl border text-sm font-black ${
                form.type === type
                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              {type === 'Food' ? '🍽 Food' : '🍸 Beverage'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <SelectField
          label="Select Item"
          value={form.item}
          options={items.map((item) => item.name)}
          onChange={(value) => setForm((current) => ({ ...current, item: value }))}
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {items.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setForm((current) => ({ ...current, item: item.name }))}
              className={`rounded-2xl border p-5 text-center transition ${
                form.item === item.name
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-slate-200 bg-slate-50 hover:bg-white'
              }`}
            >
              <span className="text-4xl">{item.icon}</span>
              <p className="mt-3 font-black">{item.name}</p>
              <p className="mt-1 text-sm text-slate-500">{money(item.price)}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Quantity
          </p>
          <div className="flex h-12 items-center overflow-hidden rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  quantity: Math.max(1, Number(current.quantity) - 1),
                }))
              }
              className="h-full w-14 bg-slate-50 text-xl font-black"
            >
              −
            </button>
            <span className="flex-1 text-center text-lg font-black">{form.quantity}</span>
            <button
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  quantity: Number(current.quantity) + 1,
                }))
              }
              className="h-full w-14 bg-slate-50 text-xl font-black"
            >
              +
            </button>
          </div>
        </div>

        <SelectField
          label="Priority"
          value={form.priority}
          options={['Normal', 'High', 'VIP', 'VVIP']}
          onChange={(value) => setForm((current) => ({ ...current, priority: value }))}
        />

        <SelectField
          label="Requested By Department"
          value={form.requestedBy}
          options={['GRE', 'Gaming Floor', 'Bar', 'Kitchen', 'Reception']}
          onChange={(value) => setForm((current) => ({ ...current, requestedBy: value }))}
        />

        <InputField
          label="Requester Name"
          value={form.requestedByName}
          error={errors.requestedByName}
          onChange={(value) =>
            setForm((current) => ({ ...current, requestedByName: value }))
          }
        />

        <InputField
          label="Delivery Location"
          value={form.location}
          error={errors.location}
          onChange={(value) => setForm((current) => ({ ...current, location: value }))}
        />

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">
            Auto Calculated Cost
          </p>
          <p className="mt-2 font-serif text-2xl font-black">
            {money(selectedMenuItem.price * Number(form.quantity))}
          </p>
          <p className="mt-1 text-xs text-amber-700">
            {form.quantity} × {money(selectedMenuItem.price)}
          </p>
        </div>

        <div className="md:col-span-2">
          <TextAreaField
            label="Remarks / Special Note"
            value={form.remarks}
            onChange={(value) => setForm((current) => ({ ...current, remarks: value }))}
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button type="button" onClick={submitOrder} className={primaryButton}>
          Submit Request
        </button>
      </div>
    </div>
  </section>
)

const LiveBoard = ({ title, description, orders, changeStatus, department }) => {
  const activeOrders = orders.filter((order) => order.status !== 'Cancelled')
  const count = (status) =>
    activeOrders.filter((order) => order.status === status).length

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-bold text-slate-500">F&B / Kitchen / Bar</p>
        <h2 className="mt-1 font-serif text-3xl font-black">
          <span className="mr-2 text-amber-400">◆</span>
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <SummaryCard label="Pending Orders" value={count('Pending')} icon={department === 'Kitchen' ? '🍽️' : '🍸'} />
        <SummaryCard label="Preparing" value={count('Preparing')} icon="👨‍🍳" />
        <SummaryCard label="Ready" value={count('Ready')} icon="🔔" />
        <SummaryCard label="Delivered Today" value={count('Delivered')} icon="✅" />
      </div>

      {department === 'Kitchen' ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  {['KOT ID', 'Time', 'CID', 'Customer', 'Location', 'Items', 'Remarks', 'Status', 'Actions'].map((heading) => (
                    <th key={heading} className="px-4 py-3">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-mono text-lg font-black">{order.ticketId}</td>
                    <td className="px-4 py-4">{order.time}</td>
                    <td className="px-4 py-4 font-mono">{order.cid}</td>
                    <td className="px-4 py-4"><p className="font-black">{order.customer}</p><p className="text-xs text-slate-500">{order.requestedBy}</p></td>
                    <td className="px-4 py-4">{order.location}</td>
                    <td className="px-4 py-4 font-black">{order.qty} × {order.items}</td>
                    <td className="px-4 py-4">{order.remarks || '—'}</td>
                    <td className="px-4 py-4"><StatusPill value={order.status} /></td>
                    <td className="px-4 py-4"><StatusButtons order={order} changeStatus={changeStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-black text-slate-500">{order.ticketId}</p>
                  <h3 className="mt-2 font-serif text-2xl font-black">{order.customer}</h3>
                  <p className="text-sm text-slate-500">{order.cid}</p>
                </div>
                <StatusPill value={order.status} />
              </div>
              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="font-black">{order.items}</p>
                <p className="mt-1 text-sm text-slate-500">Qty: {order.qty} · {order.location}</p>
                <p className="mt-3 font-mono font-black text-orange-600">{order.time}</p>
              </div>
              <div className="mt-4">
                <StatusButtons order={order} changeStatus={changeStatus} stacked />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

const ManagerView = ({
  orders,
  selectedOrder,
  setSelectedOrder,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  departmentFilter,
  setDepartmentFilter,
  changeStatus,
  assignStaff,
  updatePriority,
}) => (
  <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_340px]">
    <div className="space-y-5">
      <div>
        <p className="text-sm font-bold text-slate-500">F&B / Kitchen / Bar</p>
        <h2 className="mt-1 font-serif text-3xl font-black">
          <span className="mr-2 text-amber-400">◆</span>
          KOT / BOT Manager Panel
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Unified manager control for Kitchen and Bar orders.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <input className={inputClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search orders..." />
        <select className={inputClass} value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
          <option>All</option>
          <option>Kitchen</option>
          <option>Bar</option>
        </select>
        <select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option>All</option>
          <option>Pending</option>
          <option>Preparing</option>
          <option>Ready</option>
          <option>Delivered</option>
          <option>Cancelled</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <OrderTable
          orders={orders}
          selectedOrder={selectedOrder}
          setSelectedOrder={setSelectedOrder}
          changeStatus={changeStatus}
        />
      </div>
    </div>

    <aside className="space-y-4">
      <SelectedOrderCard order={selectedOrder} changeStatus={changeStatus} />

      {selectedOrder && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">
            Manager Actions
          </h3>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className={labelClass}>Change Priority</span>
              <select
                className={inputClass}
                value={selectedOrder.priority}
                onChange={(event) =>
                  updatePriority(selectedOrder.id, event.target.value)
                }
              >
                <option>Normal</option>
                <option>High</option>
                <option>VIP</option>
                <option>VVIP</option>
              </select>
            </label>

            <label className="block">
              <span className={labelClass}>Assign Staff</span>
              <select
                className={inputClass}
                value={selectedOrder.assignedStaff}
                onChange={(event) =>
                  assignStaff(selectedOrder.id, event.target.value)
                }
              >
                <option value="">Select staff</option>
                {selectedOrder.department === 'Kitchen' ? (
                  <>
                    <option>Chef Arjun</option>
                    <option>Chef Neha</option>
                    <option>Chef Milan</option>
                  </>
                ) : (
                  <>
                    <option>Rohit D.</option>
                    <option>Pooja S.</option>
                    <option>Milan Thapa</option>
                  </>
                )}
              </select>
            </label>

            <button type="button" onClick={() => window.print()} className={`${secondaryButton} w-full`}>
              Print Order Slip
            </button>
          </div>
        </div>
      )}
    </aside>
  </section>
)

const HistoryView = ({
  stats,
  orders,
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  departmentFilter,
  setDepartmentFilter,
  categoryFilter,
  setCategoryFilter,
  setSelectedOrder,
  exportCsv,
}) => (
  <section className="space-y-5">
    <div>
      <p className="text-sm font-bold text-slate-500">F&B / Kitchen / Bar</p>
      <h2 className="mt-1 font-serif text-3xl font-black">
        <span className="mr-2 text-amber-400">◆</span>
        F&B Order History / Records
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Search, filter, export and review all food and beverage records.
      </p>
    </div>

    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5">
      <input className={inputClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, CID, badge..." />
      <select className={inputClass} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
        <option>All</option>
        <option>Food</option>
        <option>Beverage</option>
      </select>
      <select className={inputClass} value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
        <option>All</option>
        <option>Kitchen</option>
        <option>Bar</option>
      </select>
      <select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
        <option>All</option>
        <option>Pending</option>
        <option>Preparing</option>
        <option>Ready</option>
        <option>Delivered</option>
        <option>Cancelled</option>
      </select>
      <select className={inputClass} value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
        <option>All</option>
        <option>STANDARD</option>
        <option>VIP</option>
        <option>VVIP</option>
      </select>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
      <SummaryCard label="Total Orders" value={stats.total} icon="📄" />
      <SummaryCard label="Pending" value={stats.pending} icon="🕘" />
      <SummaryCard label="Preparing" value={stats.preparing} icon="👨‍🍳" />
      <SummaryCard label="Ready" value={stats.ready} icon="🔔" />
      <SummaryCard label="Delivered" value={stats.delivered} icon="✅" />
      <SummaryCard label="Cancelled" value={stats.cancelled} icon="❌" />
      <SummaryCard label="VIP / VVIP" value={stats.vip} icon="👑" />
    </div>

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">
          Order History Records
        </h3>
        <div className="flex gap-2">
          <button type="button" onClick={exportCsv} className={secondaryButton}>
            Export CSV
          </button>
          <button type="button" onClick={() => window.print()} className={secondaryButton}>
            Print
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-[0.14em] text-slate-500">
            <tr>
              {['Order ID', 'Ticket', 'Time', 'Badge', 'CID', 'Customer', 'Type', 'Items', 'Qty', 'Requested By', 'Department', 'Status', 'Cost', 'Action'].map((heading) => (
                <th key={heading} className="px-4 py-3">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-4 py-4 font-mono font-black text-sky-700">{order.id}</td>
                <td className="px-4 py-4 font-mono font-black">{order.ticketId}</td>
                <td className="px-4 py-4">{order.time}</td>
                <td className="px-4 py-4"><BadgeNumber value={order.badge} /></td>
                <td className="px-4 py-4 font-mono">{order.cid}</td>
                <td className="px-4 py-4"><p className="font-black">{order.customer}</p><StatusPill value={order.category} /></td>
                <td className="px-4 py-4"><StatusPill value={order.type} /></td>
                <td className="px-4 py-4">{order.items}</td>
                <td className="px-4 py-4 font-black">{order.qty}</td>
                <td className="px-4 py-4">{order.requestedBy}</td>
                <td className="px-4 py-4"><StatusPill value={order.department} /></td>
                <td className="px-4 py-4"><StatusPill value={order.status} /></td>
                <td className="px-4 py-4 font-black">{money(order.cost)}</td>
                <td className="px-4 py-4">
                  <button type="button" onClick={() => setSelectedOrder(order)} className={secondaryButton}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </section>
)

const OrderTable = ({
  orders,
  selectedOrder,
  setSelectedOrder,
  changeStatus,
}) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[1250px] text-left text-sm">
      <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-[0.14em] text-slate-500">
        <tr>
          {['Order ID', 'Time', 'Badge', 'CID', 'Customer', 'Type', 'Items', 'Qty', 'Requested By', 'Department', 'Status', 'Cost', 'Action'].map((heading) => (
            <th key={heading} className="px-4 py-3">{heading}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {orders.map((order) => (
          <tr
            key={order.id}
            className={
              selectedOrder?.id === order.id
                ? 'bg-amber-50/60'
                : 'hover:bg-slate-50'
            }
          >
            <td className="px-4 py-4 font-mono font-black text-sky-700">{order.id}</td>
            <td className="px-4 py-4">{order.time}</td>
            <td className="px-4 py-4"><BadgeNumber value={order.badge} /></td>
            <td className="px-4 py-4 font-mono">{order.cid}</td>
            <td className="px-4 py-4"><p className="font-black">{order.customer}</p><StatusPill value={order.category} /></td>
            <td className="px-4 py-4"><StatusPill value={order.type} /></td>
            <td className="px-4 py-4">{order.items}</td>
            <td className="px-4 py-4 font-black">{order.qty}</td>
            <td className="px-4 py-4">{order.requestedBy}</td>
            <td className="px-4 py-4"><StatusPill value={order.department} /></td>
            <td className="px-4 py-4"><StatusPill value={order.status} /></td>
            <td className="px-4 py-4 font-black">{money(order.cost)}</td>
            <td className="px-4 py-4">
              <div className="flex gap-2">
                <button type="button" onClick={() => setSelectedOrder(order)} className={secondaryButton}>
                  View
                </button>
                {order.status === 'Pending' && (
                  <button type="button" onClick={() => changeStatus(order.id, 'Preparing')} className={primarySmallButton}>
                    Start
                  </button>
                )}
                {order.status === 'Preparing' && (
                  <button type="button" onClick={() => changeStatus(order.id, 'Ready')} className={primarySmallButton}>
                    Ready
                  </button>
                )}
                {order.status === 'Ready' && (
                  <button type="button" onClick={() => changeStatus(order.id, 'Delivered')} className={primarySmallButton}>
                    Deliver
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
        {orders.length === 0 && (
          <tr>
            <td colSpan={13} className="px-5 py-16 text-center text-slate-500">
              No orders match the selected filters.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
)

const SelectedOrderCard = ({ order, changeStatus }) => {
  if (!order) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        Select an order to view details.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">
            Selected Order
          </h3>
          <p className="mt-4 font-mono text-xl font-black text-amber-700">{order.ticketId}</p>
          <p className="text-xs text-slate-500">{order.id}</p>
        </div>
        <StatusPill value={order.status} />
      </div>

      <div className="mt-5 space-y-3">
        <DetailLine label="Customer" value={order.customer} />
        <DetailLine label="CID / Badge" value={`${order.cid} / ${order.badge}`} />
        <DetailLine label="Type" value={order.type} />
        <DetailLine label="Items" value={`${order.qty} × ${order.items}`} />
        <DetailLine label="Location" value={order.location} />
        <DetailLine label="Requested By" value={order.requestedBy} />
        <DetailLine label="Department" value={order.department} />
        <DetailLine label="Assigned Staff" value={order.assignedStaff || 'Not assigned'} />
        <DetailLine label="Priority" value={order.priority} />
        <DetailLine label="Cost" value={money(order.cost)} />
        <DetailLine label="Remarks" value={order.remarks || '—'} />
      </div>

      <div className="mt-5">
        <StatusButtons order={order} changeStatus={changeStatus} stacked />
      </div>
    </div>
  )
}

const StatusButtons = ({ order, changeStatus, stacked }) => (
  <div className={stacked ? 'grid gap-2' : 'flex flex-wrap gap-2'}>
    {order.status !== 'Preparing' &&
      !['Delivered', 'Cancelled'].includes(order.status) && (
        <button
          type="button"
          onClick={() => changeStatus(order.id, 'Preparing')}
          className={orangeButton}
        >
          Preparing
        </button>
      )}

    {order.status !== 'Ready' &&
      !['Delivered', 'Cancelled'].includes(order.status) && (
        <button
          type="button"
          onClick={() => changeStatus(order.id, 'Ready')}
          className={blueButton}
        >
          Ready
        </button>
      )}

    {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
      <button
        type="button"
        onClick={() => changeStatus(order.id, 'Delivered')}
        className={greenButton}
      >
        Delivered
      </button>
    )}

    {!['Delivered', 'Cancelled'].includes(order.status) && (
      <button
        type="button"
        onClick={() => changeStatus(order.id, 'Cancelled')}
        className={redButton}
      >
        Cancel
      </button>
    )}
  </div>
)

const SummaryCard = ({ label, value, icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-xl">
        {icon}
      </span>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
          {label}
        </p>
        <p className="mt-2 font-serif text-2xl font-black text-slate-950">{value}</p>
      </div>
    </div>
  </div>
)

const BadgeNumber = ({ value }) => (
  <span className="inline-flex rounded-md border border-amber-300 bg-amber-50 px-3 py-1 font-mono font-black text-amber-700">
    {value}
  </span>
)

const StatusPill = ({ value }) => {
  const text = String(value || '—')
  const normalized = text.toLowerCase()

  const success = ['delivered', 'served', 'completed'].some((item) =>
    normalized.includes(item),
  )
  const warning = ['pending', 'vip', 'vvip', 'high'].some((item) =>
    normalized.includes(item),
  )
  const info = ['ready', 'food', 'kitchen'].some((item) =>
    normalized.includes(item),
  )
  const purple = ['beverage', 'bar'].some((item) =>
    normalized.includes(item),
  )
  const danger = normalized.includes('cancelled')

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
        danger
          ? 'border-red-200 bg-red-50 text-red-700'
          : success
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : info
              ? 'border-sky-200 bg-sky-50 text-sky-700'
              : purple
                ? 'border-purple-200 bg-purple-50 text-purple-700'
                : warning
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
      }`}
    >
      {text}
    </span>
  )
}

const InputField = ({ label, value, onChange, error }) => (
  <label className="block">
    <span className={labelClass}>{label}</span>
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`${inputClass} ${error ? 'border-red-300' : ''}`}
    />
    {error && <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>}
  </label>
)

const SelectField = ({ label, value, onChange, options }) => (
  <label className="block">
    <span className={labelClass}>{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
)

const TextAreaField = ({ label, value, onChange }) => (
  <label className="block">
    <span className={labelClass}>{label}</span>
    <textarea
      rows={4}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
    />
  </label>
)

const DetailLine = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="text-right font-black text-slate-900">{value}</span>
  </div>
)

const inputClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'

const labelClass =
  'mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500'

const primaryButton =
  'rounded-xl bg-amber-400 px-6 py-3 text-sm font-black text-slate-950 shadow-sm hover:bg-amber-300'

const secondaryButton =
  'rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50'

const primarySmallButton =
  'rounded-lg bg-amber-400 px-3 py-2 text-xs font-black text-slate-950 hover:bg-amber-300'

const orangeButton =
  'rounded-lg bg-orange-500 px-3 py-2 text-xs font-black text-white hover:bg-orange-400'

const blueButton =
  'rounded-lg bg-blue-500 px-3 py-2 text-xs font-black text-white hover:bg-blue-400'

const greenButton =
  'rounded-lg bg-emerald-500 px-3 py-2 text-xs font-black text-white hover:bg-emerald-400'

const redButton =
  'rounded-lg bg-red-500 px-3 py-2 text-xs font-black text-white hover:bg-red-400'

export default FnbKitchenBar
