import { useMemo, useState } from 'react'

const tabs = [
  'Dashboard',
  'New F&B Request',
  'Kitchen Live KOT',
  'Bar Live BOT',
  'KOT / BOT Manager',
  'Order History',
]

const orders = [
  {
    id: 'FB-2024-0157',
    kotId: 'KOT-201',
    botId: 'BOT-201',
    time: '19:42',
    timer: '05:12',
    badge: '087',
    cid: 'CID-100387',
    customer: 'Raj Sharma',
    category: 'VIP',
    location: 'Baccarat Table 1',
    type: 'Food',
    items: 'Chicken Biryani + Raita',
    qty: 2,
    requestedBy: 'GRE - Karan Lama',
    department: 'Kitchen',
    assignedStaff: 'Chef Arjun',
    priority: 'VIP',
    status: 'Preparing',
    cost: 'NPR 1,600',
    remarks: 'VIP quick service',
  },
  {
    id: 'FB-2024-0156',
    kotId: 'KOT-202',
    botId: 'BOT-1148',
    time: '19:35',
    timer: '07:28',
    badge: '112',
    cid: 'CID-100112',
    customer: 'Daniel Smith',
    category: 'VVIP',
    location: 'Bar',
    type: 'Beverage',
    items: 'Whisky Single + Dry Snacks',
    qty: 4,
    requestedBy: 'Bar - Milan Thapa',
    department: 'Bar',
    assignedStaff: 'Rohit D.',
    priority: 'VVIP',
    status: 'Ready',
    cost: 'NPR 2,000',
    remarks: 'Less spicy',
  },
  {
    id: 'FB-2024-0155',
    kotId: 'KOT-203',
    botId: 'BOT-203',
    time: '19:28',
    timer: '09:15',
    badge: '044',
    cid: 'CID-100044',
    customer: 'Amit Verma',
    category: 'VIP',
    location: 'Kitchen',
    type: 'Food',
    items: 'Grilled Fish + Mint Chutney',
    qty: 1,
    requestedBy: 'GRE - Sita Gurung',
    department: 'Kitchen',
    assignedStaff: 'Chef Neha',
    priority: 'Normal',
    status: 'Pending',
    cost: 'NPR 950',
    remarks: 'Well done',
  },
  {
    id: 'FB-2024-0154',
    kotId: 'KOT-204',
    botId: 'BOT-1147',
    time: '19:13',
    timer: '12:45',
    badge: '051',
    cid: 'CID-100051',
    customer: 'Priya Tamang',
    category: 'VIP',
    location: 'Gaming Floor',
    type: 'Beverage',
    items: 'Fresh Lime Soda',
    qty: 3,
    requestedBy: 'Gaming Floor - Nabin Rai',
    department: 'Bar',
    assignedStaff: 'Pooja S.',
    priority: 'High',
    status: 'Delivered',
    cost: 'NPR 450',
    remarks: 'No onion',
  },
  {
    id: 'FB-2024-0153',
    kotId: 'KOT-205',
    botId: 'BOT-205',
    time: '19:02',
    timer: '14:02',
    badge: '091',
    cid: 'CID-100091',
    customer: 'Suresh Adhikari',
    category: 'VVIP',
    location: 'Bar',
    type: 'Food',
    items: 'Veg Platter',
    qty: 2,
    requestedBy: 'GRE - Karan Lama',
    department: 'Kitchen',
    assignedStaff: 'Chef Ramesh',
    priority: 'High',
    status: 'Preparing',
    cost: 'NPR 1,200',
    remarks: 'Extra sauce',
  },
  {
    id: 'FB-2024-0152',
    kotId: 'KOT-206',
    botId: 'BOT-1146',
    time: '18:55',
    timer: '16:30',
    badge: '073',
    cid: 'CID-100073',
    customer: 'Deepak Joshi',
    category: 'VIP',
    location: 'Kitchen',
    type: 'Beverage',
    items: 'Beer Can',
    qty: 6,
    requestedBy: 'Bar - Milan Thapa',
    department: 'Bar',
    assignedStaff: 'Rohit D.',
    priority: 'Normal',
    status: 'Pending',
    cost: 'NPR 1,800',
    remarks: '—',
  },
  {
    id: 'FB-2024-0151',
    kotId: 'KOT-207',
    botId: 'BOT-207',
    time: '18:47',
    timer: '18:10',
    badge: '066',
    cid: 'CID-100066',
    customer: 'Pawan Gurung',
    category: 'VIP',
    location: 'Gaming Floor',
    type: 'Food',
    items: 'Pasta Alfredo',
    qty: 1,
    requestedBy: 'GRE - Sita Gurung',
    department: 'Kitchen',
    assignedStaff: 'Chef Arjun',
    priority: 'Normal',
    status: 'Ready',
    cost: 'NPR 950',
    remarks: 'Thank you',
  },
  {
    id: 'FB-2024-0150',
    kotId: 'KOT-208',
    botId: 'BOT-1145',
    time: '18:40',
    timer: '20:05',
    badge: '122',
    cid: 'CID-100122',
    customer: 'Arjun Khadka',
    category: 'Standard',
    location: 'Bar',
    type: 'Food',
    items: 'Chicken Wings',
    qty: 1,
    requestedBy: 'Gaming Floor - Nabin Rai',
    department: 'Kitchen',
    assignedStaff: 'Chef Neha',
    priority: 'Low',
    status: 'Cancelled',
    cost: 'NPR 750',
    remarks: 'Customer cancelled',
  },
]

const menuItems = [
  { name: 'Fried Rice', icon: '🍚', type: 'Food' },
  { name: 'Chicken Chilli', icon: '🍗', type: 'Food' },
  { name: 'Momo', icon: '🥟', type: 'Food' },
  { name: 'French Fries', icon: '🍟', type: 'Food' },
  { name: 'Club Sandwich', icon: '🥪', type: 'Food' },
  { name: 'Fresh Lime Soda', icon: '🥤', type: 'Beverage' },
  { name: 'Whisky Single', icon: '🥃', type: 'Beverage' },
  { name: 'Mocktail', icon: '🍹', type: 'Beverage' },
]

const inputClass =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'

const labelClass =
  'mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500'

const badgeClass = {
  Pending: 'border-yellow-300 bg-yellow-50 text-yellow-700',
  Requested: 'border-yellow-300 bg-yellow-50 text-yellow-700',
  Preparing: 'border-orange-200 bg-orange-50 text-orange-700',
  Ready: 'border-blue-200 bg-blue-50 text-blue-700',
  Delivered: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Served: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Cancelled: 'border-red-200 bg-red-50 text-red-700',
  Overdue: 'border-red-200 bg-red-50 text-red-700',
  Food: 'border-orange-200 bg-orange-50 text-orange-700',
  Beverage: 'border-purple-200 bg-purple-50 text-purple-700',
  Bar: 'border-purple-200 bg-purple-50 text-purple-700',
  Kitchen: 'border-sky-200 bg-sky-50 text-sky-700',
  VIP: 'border-yellow-300 bg-yellow-50 text-yellow-700',
  VVIP: 'border-purple-200 bg-purple-50 text-purple-700',
  Standard: 'border-slate-200 bg-slate-50 text-slate-700',
  Normal: 'border-yellow-300 bg-yellow-50 text-yellow-700',
  High: 'border-red-200 bg-red-50 text-red-700',
  Low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

const StatusBadge = ({ children }) => (
  <span
    className={`inline-flex rounded-lg border px-3 py-1 text-xs font-extrabold uppercase ${
      badgeClass[children] || 'border-slate-200 bg-slate-50 text-slate-700'
    }`}
  >
    {children}
  </span>
)

const FnbKitchenBar = () => {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [selectedOrder, setSelectedOrder] = useState(orders[0])
  const [requestType, setRequestType] = useState('Food')
  const [selectedItem, setSelectedItem] = useState(menuItems[0])
  const [quantity, setQuantity] = useState(1)

  const summary = useMemo(() => {
    const pendingFood = orders.filter((o) => o.type === 'Food' && o.status === 'Pending').length
    const pendingBar = orders.filter((o) => o.type === 'Beverage' && o.status === 'Pending').length
    const preparing = orders.filter((o) => o.status === 'Preparing').length
    const ready = orders.filter((o) => o.status === 'Ready').length
    const delivered = orders.filter((o) => ['Delivered', 'Served'].includes(o.status)).length
    const vip = orders.filter((o) => ['VIP', 'VVIP'].includes(o.category)).length

    return {
      pendingFood: pendingFood || 14,
      pendingBar: pendingBar || 8,
      preparing: preparing || 9,
      ready: ready || 6,
      delivered: delivered || 26,
      vip: vip || 7,
      totalCost: 'NPR 48,250',
    }
  }, [])

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-500">F&B / Kitchen / Bar</p>
          <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-slate-950">
            <span className="mr-2 text-yellow-500">◆</span>
            F&B / Kitchen / Bar Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage food and beverage requests from GRE, VIP guests, gaming floor and internal operations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('New F&B Request')}
          className="rounded-lg bg-yellow-400 px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-yellow-300"
        >
          + New Food / Beverage Request
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-extrabold ${
              activeTab === tab
                ? 'bg-yellow-400 text-slate-950'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Dashboard' && (
        <DashboardView
          summary={summary}
          selectedOrder={selectedOrder}
          setSelectedOrder={setSelectedOrder}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'New F&B Request' && (
        <NewRequestView
          requestType={requestType}
          setRequestType={setRequestType}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
          quantity={quantity}
          setQuantity={setQuantity}
        />
      )}

      {activeTab === 'Kitchen Live KOT' && (
        <KitchenKotDisplay summary={summary} />
      )}

      {activeTab === 'Bar Live BOT' && (
        <BarBotDisplay />
      )}

      {activeTab === 'KOT / BOT Manager' && (
        <KotBotManager
          selectedOrder={selectedOrder}
          setSelectedOrder={setSelectedOrder}
        />
      )}

      {activeTab === 'Order History' && (
        <OrderHistory />
      )}
    </div>
  )
}

const DashboardView = ({ summary, selectedOrder, setSelectedOrder, setActiveTab }) => {
  const cards = [
    { label: 'Pending Food Orders', value: summary.pendingFood, sub: 'View all', icon: '🍽️', border: 'border-yellow-300' },
    { label: 'Pending Bar Orders', value: summary.pendingBar, sub: 'View all', icon: '🍸', border: 'border-purple-200' },
    { label: 'In Preparation', value: summary.preparing, sub: 'View all', icon: '👨‍🍳', border: 'border-orange-200' },
    { label: 'Ready For Delivery', value: summary.ready, sub: 'View all', icon: '🛎️', border: 'border-blue-200' },
    { label: 'Delivered Today', value: summary.delivered, sub: 'View all', icon: '✅', border: 'border-emerald-200' },
    { label: 'VIP / VVIP Requests', value: summary.vip, sub: 'View all', icon: '💎', border: 'border-purple-200' },
    { label: 'Total F&B Cost Today', value: summary.totalCost, sub: 'View details', icon: '💵', border: 'border-emerald-200' },
  ]

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_330px]">
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
          {cards.map((card) => (
            <SummaryCard key={card.label} {...card} />
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-slate-200">
          {['All Orders', 'Kitchen Orders', 'Bar Orders', 'VIP / VVIP Requests', 'Delivered Records', 'Cancelled Orders'].map((tab, index) => (
            <button
              key={tab}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-extrabold ${
                index === 0 ? 'border-yellow-400 text-yellow-700' : 'border-transparent text-slate-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <FilterPanel />

        <Panel title="Order List">
          <OrdersTable
            orders={orders}
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
          />
        </Panel>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-24 self-start">
        <OrderStatusSummary />

        <Panel title="Recent VIP Requests">
          <div className="space-y-3 p-4">
            {orders.filter((o) => ['VIP', 'VVIP'].includes(o.category)).slice(0, 4).map((order) => (
              <div key={order.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-950">{order.customer} ({order.badge})</p>
                    <p className="text-sm text-slate-500">{order.items}</p>
                  </div>
                  <StatusBadge>{order.status}</StatusBadge>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="F&B Quick Actions">
          <div className="space-y-3 p-4">
            <ActionButton onClick={() => setActiveTab('New F&B Request')}>🍽️ New Food Request</ActionButton>
            <ActionButton onClick={() => setActiveTab('New F&B Request')}>🍸 New Beverage Request</ActionButton>
            <ActionButton onClick={() => setActiveTab('Order History')}>✅ View Today’s Deliveries</ActionButton>
            <ActionButton onClick={() => setActiveTab('Order History')}>📄 F&B Reports</ActionButton>
          </div>
        </Panel>
      </aside>
    </section>
  )
}

const NewRequestView = ({
  requestType,
  setRequestType,
  selectedItem,
  setSelectedItem,
  quantity,
  setQuantity,
}) => {
  const visibleMenu = menuItems.filter((item) => item.type === requestType)
  const total = quantity * (requestType === 'Food' ? 800 : 500)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-slate-500">F&B / Kitchen / Bar</p>
        <h2 className="mt-1 font-serif text-3xl font-bold text-slate-950">
          <span className="mr-2 text-yellow-500">◆</span>
          New F&B Request
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Simple waiter/GRE request form. Food routes to Kitchen KOT and beverage routes to Bar BOT.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-2">
          <Field label="Badge No">
            <input className={inputClass} placeholder="Enter badge number" defaultValue="087" />
          </Field>

          <Field label="CID">
            <input className={inputClass} placeholder="Enter customer ID" defaultValue="CID-100387" />
          </Field>
        </div>

        <div className="mt-5">
          <span className={labelClass}>Order Type</span>
          <div className="grid gap-3 sm:grid-cols-2">
            {['Food', 'Beverage'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setRequestType(type)
                  setSelectedItem(menuItems.find((item) => item.type === type))
                }}
                className={`rounded-xl border px-4 py-4 text-sm font-extrabold ${
                  requestType === type
                    ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {type === 'Food' ? '🍴' : '🍸'} {type}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <Field label="Select Item">
            <select
              className={inputClass}
              value={selectedItem?.name}
              onChange={(event) => {
                const next = menuItems.find((item) => item.name === event.target.value)
                setSelectedItem(next)
              }}
            >
              {visibleMenu.map((item) => (
                <option key={item.name}>{item.name}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {visibleMenu.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setSelectedItem(item)}
              className={`rounded-2xl border p-5 text-center transition ${
                selectedItem?.name === item.name
                  ? 'border-yellow-400 bg-yellow-50 shadow-sm'
                  : 'border-slate-200 bg-slate-50 hover:bg-white'
              }`}
            >
              <div className="text-5xl">{item.icon}</div>
              <p className="mt-3 font-bold text-slate-950">{item.name}</p>
            </button>
          ))}
        </div>

        <div className="mt-5">
          <span className={labelClass}>Quantity</span>
          <div className="grid grid-cols-[52px_1fr_52px] overflow-hidden rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="bg-slate-50 text-xl font-bold"
            >
              −
            </button>
            <div className="flex h-12 items-center justify-center font-extrabold">{quantity}</div>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="bg-slate-50 text-xl font-bold"
            >
              +
            </button>
          </div>
        </div>

        <div className="mt-5">
          <Field label="Remarks / Special Note">
            <textarea
              className="min-h-28 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
              placeholder="Add special instructions or notes..."
              defaultValue="Less spicy, extra raita"
            />
          </Field>
        </div>

        <div className="mt-5 rounded-2xl border border-yellow-300 bg-yellow-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-yellow-700">Auto Calculated Cost</p>
              <p className="mt-1 font-serif text-2xl font-bold text-slate-950">NPR {total.toLocaleString()}</p>
            </div>
            <button className="rounded-lg bg-yellow-400 px-8 py-3 text-sm font-extrabold text-slate-950 hover:bg-yellow-300">
              ✈ Submit Request
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const KitchenKotDisplay = ({ summary }) => {
  const kotOrders = orders.filter((order) => order.type === 'Food')

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="F&B / Kitchen / Bar"
        title="Kitchen Live KOT Display"
        desc="Live kitchen production board — touch friendly view."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Pending Orders" value={summary.pendingFood} icon="🍽️" border="border-yellow-300" />
        <SummaryCard label="Preparing" value={summary.preparing} icon="👨‍🍳" border="border-orange-200" />
        <SummaryCard label="Ready" value={summary.ready} icon="🛎️" border="border-blue-200" />
        <SummaryCard label="Served Today" value={summary.delivered} icon="✅" border="border-emerald-200" />
      </div>

      <Panel title="Kitchen Live KOT">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">KOT ID</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Timer</th>
                <th className="px-4 py-3">CID</th>
                <th className="px-4 py-3">Ordered By</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Remarks</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kotOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 font-mono text-lg font-extrabold text-slate-950">{order.kotId}</td>
                  <td className="px-4 py-4">{order.time}</td>
                  <td className="px-4 py-4 font-mono font-extrabold text-orange-600">⏱ {order.timer}</td>
                  <td className="px-4 py-4 font-mono">{order.cid}</td>
                  <td className="px-4 py-4">
                    <p className="font-bold">{order.customer}</p>
                    <p className="text-xs text-slate-500">{order.requestedBy}</p>
                  </td>
                  <td className="px-4 py-4">{order.location}</td>
                  <td className="px-4 py-4 font-bold">{order.qty} × {order.items}</td>
                  <td className="px-4 py-4">{order.remarks}</td>
                  <td className="px-4 py-4"><StatusBadge>{order.status}</StatusBadge></td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white">Preparing</button>
                      <button className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-bold text-white">Ready</button>
                      <button className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-white">Served</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <FooterSync />
      </Panel>
    </div>
  )
}

const BarBotDisplay = () => {
  const botOrders = orders.filter((order) => order.type === 'Beverage')

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="F&B / Kitchen / Bar"
        title="Bar Live BOT Display"
        desc="Live beverage and bar order board for bar staff."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Pending Bar Orders" value="8" icon="🍸" border="border-purple-200" />
        <SummaryCard label="Preparing Drinks" value="6" icon="🥤" border="border-orange-200" />
        <SummaryCard label="Ready Drinks" value="4" icon="🛎️" border="border-blue-200" />
        <SummaryCard label="Served Today" value="18" icon="✅" border="border-emerald-200" />
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {botOrders.map((order) => (
          <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-sm font-bold text-slate-500">{order.botId}</p>
                <h3 className="mt-2 font-serif text-xl font-bold text-slate-950">{order.customer}</h3>
                <p className="text-sm text-slate-500">{order.cid}</p>
              </div>
              <StatusBadge>{order.status}</StatusBadge>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-950">{order.items}</p>
              <p className="mt-1 text-xs text-slate-500">Qty: {order.qty} · {order.location}</p>
              <p className="mt-2 font-mono text-sm font-extrabold text-orange-600">⏱ {order.timer}</p>
            </div>

            <div className="mt-4 grid gap-2">
              <button className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white">Preparing</button>
              <button className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-bold text-white">Ready</button>
              <button className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-white">Served</button>
            </div>
          </div>
        ))}
      </div>

      <FooterSync />
    </div>
  )
}

const KotBotManager = ({ selectedOrder, setSelectedOrder }) => {
  const managerCards = [
    { label: 'Total Orders', value: '128', icon: '📋', border: 'border-yellow-300' },
    { label: 'Pending Orders', value: '22', icon: '🧾', border: 'border-yellow-300' },
    { label: 'Preparing', value: '48', icon: '👨‍🍳', border: 'border-orange-200' },
    { label: 'Ready', value: '28', icon: '🛎️', border: 'border-blue-200' },
    { label: 'Served Today', value: '302', icon: '✅', border: 'border-emerald-200' },
    { label: 'VIP / VVIP Orders', value: '15', icon: '💜', border: 'border-purple-200' },
    { label: 'Overdue Orders', value: '9', icon: '⏰', border: 'border-red-200' },
  ]

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_360px]">
      <div className="space-y-5">
        <PageTitle
          eyebrow="F&B / Kitchen / Bar"
          title="KOT / BOT Manager Panel"
          desc="Unified manager control panel for kitchen and bar orders."
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
          {managerCards.map((card) => (
            <SummaryCard key={card.label} {...card} />
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-slate-200">
          {['All Orders', 'Kitchen', 'Bar', 'VIP / VVIP', 'Overdue', 'Served'].map((tab, index) => (
            <button
              key={tab}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-extrabold ${
                index === 0 ? 'border-yellow-400 text-yellow-700' : 'border-transparent text-slate-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <Panel title="Unified KOT / BOT Orders">
          <OrdersTable
            orders={orders}
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
            manager
          />
        </Panel>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-24 self-start">
        <SelectedOrderPanel order={selectedOrder} />

        <Panel title="Manager Actions">
          <div className="grid grid-cols-2 gap-3 p-4">
            <button className="rounded-lg bg-yellow-500 px-3 py-3 text-xs font-bold text-white">Change Priority</button>
            <button className="rounded-lg bg-blue-500 px-3 py-3 text-xs font-bold text-white">Assign Staff</button>
            <button className="rounded-lg bg-slate-700 px-3 py-3 text-xs font-bold text-white">Notify Waiter / GRE</button>
            <button className="rounded-lg bg-purple-500 px-3 py-3 text-xs font-bold text-white">Mark Hold</button>
            <button className="rounded-lg bg-red-500 px-3 py-3 text-xs font-bold text-white">Cancel Order</button>
            <button className="rounded-lg bg-slate-500 px-3 py-3 text-xs font-bold text-white">Open History</button>
          </div>
        </Panel>

        <Panel title="Staff Workload">
          <div className="space-y-3 p-4 text-sm">
            {[
              ['Chef Arjun', 'Kitchen', '8'],
              ['Chef Neha', 'Kitchen', '7'],
              ['Chef Ramesh', 'Kitchen', '5'],
              ['Rohit D.', 'Bar', '6'],
              ['Pooja S.', 'Bar', '5'],
            ].map(([name, dept, count]) => (
              <div key={name} className="flex justify-between rounded-xl bg-slate-50 p-3">
                <span className="font-bold">{name}</span>
                <span className="text-slate-500">{dept}</span>
                <span className="font-extrabold text-yellow-700">{count}</span>
              </div>
            ))}
          </div>
        </Panel>
      </aside>
    </section>
  )
}

const OrderHistory = () => (
  <div className="space-y-6">
    <PageTitle
      eyebrow="F&B / Kitchen / Bar"
      title="F&B Order History / Records"
      desc="All food and beverage orders with search, filters, export and audit-ready records."
    />

    <Panel title="Search & Filter">
      <div className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-5">
        <Field label="Business Date"><input className={inputClass} defaultValue="01/06/2025 - 01/06/2025" /></Field>
        <Field label="Date Range"><input className={inputClass} defaultValue="01/06/2025 - 01/06/2025" /></Field>
        <Field label="CID / Badge No"><input className={inputClass} placeholder="Enter CID or Badge No" /></Field>
        <Field label="Customer / Ordered For"><select className={inputClass}><option>Select Customer</option></select></Field>
        <Field label="Order Type"><select className={inputClass}><option>All</option><option>Food</option><option>Beverage</option></select></Field>
        <Field label="Department"><select className={inputClass}><option>All</option><option>Kitchen</option><option>Bar</option></select></Field>
        <Field label="Status"><select className={inputClass}><option>All</option><option>Pending</option><option>Preparing</option><option>Ready</option><option>Served</option></select></Field>
        <Field label="Requested By"><select className={inputClass}><option>All</option></select></Field>
        <Field label="Served By"><select className={inputClass}><option>All</option></select></Field>
        <Field label="VIP Type"><select className={inputClass}><option>All</option><option>VIP</option><option>VVIP</option></select></Field>
      </div>
    </Panel>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
      <SummaryCard label="Total Orders" value="1,248" sub="All time" icon="📄" border="border-blue-200" />
      <SummaryCard label="Requested" value="86" sub="Pending" icon="🕘" border="border-yellow-300" />
      <SummaryCard label="Preparing" value="62" sub="In progress" icon="👨‍🍳" border="border-orange-200" />
      <SummaryCard label="Ready" value="34" sub="Ready to serve" icon="🛎️" border="border-blue-200" />
      <SummaryCard label="Served" value="1,012" sub="Completed" icon="✅" border="border-emerald-200" />
      <SummaryCard label="Cancelled" value="54" sub="Cancelled" icon="❌" border="border-red-200" />
      <SummaryCard label="VIP / VVIP" value="128" sub="Orders" icon="👑" border="border-purple-200" />
    </div>

    <Panel title="Order History Records">
      <OrdersTable orders={orders} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 text-sm text-slate-500">
        <span>Showing 1 to 20 of 1,248 records</span>
        <div className="flex gap-2">
          <button className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-1.5 font-bold text-yellow-700">1</button>
          <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold">2</button>
          <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold">3</button>
          <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold">63</button>
        </div>
      </div>
    </Panel>
  </div>
)

const OrdersTable = ({ orders: rows, selectedOrder, setSelectedOrder, manager = false }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[1200px] text-left text-sm">
      <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
        <tr>
          <th className="px-4 py-3">Order ID</th>
          <th className="px-4 py-3">Time</th>
          <th className="px-4 py-3">Badge / Session</th>
          <th className="px-4 py-3">CID</th>
          <th className="px-4 py-3">Customer</th>
          <th className="px-4 py-3">Type</th>
          <th className="px-4 py-3">Items</th>
          <th className="px-4 py-3">Qty</th>
          <th className="px-4 py-3">Requested By</th>
          <th className="px-4 py-3">Department</th>
          {manager && <th className="px-4 py-3">Assigned Staff</th>}
          {manager && <th className="px-4 py-3">Priority</th>}
          {manager && <th className="px-4 py-3">Timer</th>}
          <th className="px-4 py-3">Status</th>
          <th className="px-4 py-3">Cost</th>
          <th className="px-4 py-3">Action</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-100">
        {rows.map((order) => (
          <tr
            key={order.id}
            onClick={() => setSelectedOrder?.(order)}
            className={`cursor-pointer hover:bg-slate-50 ${
              selectedOrder?.id === order.id ? 'bg-yellow-50/60' : ''
            }`}
          >
            <td className="px-4 py-4 font-mono text-xs font-bold text-sky-700">{order.id}</td>
            <td className="px-4 py-4">{order.time}</td>
            <td className="px-4 py-4 font-mono font-bold">{order.badge}</td>
            <td className="px-4 py-4 font-mono">{order.cid}</td>
            <td className="px-4 py-4">
              <p className="font-bold text-slate-950">{order.customer}</p>
              <StatusBadge>{order.category}</StatusBadge>
            </td>
            <td className="px-4 py-4"><StatusBadge>{order.type}</StatusBadge></td>
            <td className="px-4 py-4">{order.items}</td>
            <td className="px-4 py-4 font-bold">{order.qty}</td>
            <td className="px-4 py-4 text-slate-700">{order.requestedBy}</td>
            <td className="px-4 py-4"><StatusBadge>{order.department}</StatusBadge></td>
            {manager && <td className="px-4 py-4">{order.assignedStaff}</td>}
            {manager && <td className="px-4 py-4"><StatusBadge>{order.priority}</StatusBadge></td>}
            {manager && <td className="px-4 py-4 font-mono font-extrabold text-orange-600">⏱ {order.timer}</td>}
            <td className="px-4 py-4"><StatusBadge>{order.status}</StatusBadge></td>
            <td className="px-4 py-4 font-bold">{order.cost}</td>
            <td className="px-4 py-4">
              <div className="flex gap-2">
                <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                  👁
                </button>
                <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                  ⋮
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const SelectedOrderPanel = ({ order }) => (
  <Panel title="Selected Order">
    <div className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-2xl font-extrabold text-yellow-700">{order.kotId}</p>
          <p className="text-sm text-slate-500">{order.id}</p>
        </div>
        <StatusBadge>{order.status}</StatusBadge>
      </div>

      <DetailRows
        rows={[
          ['Type', order.type],
          ['CID', order.cid],
          ['Badge', order.badge],
          ['Ordered For', order.customer],
          ['Category', order.category],
          ['Location', order.location],
          ['Items', order.items],
          ['Quantity', order.qty],
          ['Requested By', order.requestedBy],
          ['Department', order.department],
          ['Assigned Staff', order.assignedStaff],
          ['Priority', order.priority],
          ['Timer', order.timer],
          ['Cost', order.cost],
          ['Remarks', order.remarks],
        ]}
      />
    </div>
  </Panel>
)

const OrderStatusSummary = () => (
  <Panel title="Order Status Summary">
    <div className="p-5">
      <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border-[18px] border-yellow-300 bg-white text-center">
        <div>
          <p className="text-2xl font-extrabold text-slate-950">52</p>
          <p className="text-xs text-slate-500">Orders</p>
        </div>
      </div>

      <div className="mt-5 space-y-2 text-sm">
        <StatusLine color="bg-yellow-400" label="Pending" value="14" />
        <StatusLine color="bg-orange-400" label="Preparing" value="9" />
        <StatusLine color="bg-blue-400" label="Ready" value="6" />
        <StatusLine color="bg-emerald-400" label="Delivered" value="26" />
        <StatusLine color="bg-red-400" label="Cancelled" value="3" />
      </div>
    </div>
  </Panel>
)

const FilterPanel = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="grid gap-3 lg:grid-cols-[160px_1fr_1fr_1fr_1.4fr_auto]">
      <input className={inputClass} defaultValue="18/05/2024" />
      <select className={inputClass}><option>All Order Types</option><option>Food</option><option>Beverage</option></select>
      <select className={inputClass}><option>All Status</option><option>Pending</option><option>Preparing</option><option>Ready</option></select>
      <select className={inputClass}><option>All Departments</option><option>Kitchen</option><option>Bar</option></select>
      <input className={inputClass} placeholder="Search CID, name, badge, order ID..." />
      <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
        Filters
      </button>
    </div>
  </div>
)

const SummaryCard = ({ label, value, sub, icon, border }) => (
  <div className={`rounded-2xl border ${border || 'border-slate-200'} bg-white p-5 shadow-sm`}>
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-2xl">
        {icon}
      </div>
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <p className="mt-2 font-serif text-2xl font-bold text-slate-950">{value}</p>
        {sub && <p className="mt-1 text-xs font-semibold text-slate-500">{sub}</p>}
      </div>
    </div>
  </div>
)

const Panel = ({ title, children }) => (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 px-5 py-4">
      <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">{title}</h2>
    </div>
    {children}
  </div>
)

const PageTitle = ({ eyebrow, title, desc }) => (
  <div>
    <p className="text-sm font-bold text-slate-500">{eyebrow}</p>
    <h2 className="mt-1 font-serif text-3xl font-bold text-slate-950">
      <span className="mr-2 text-yellow-500">◆</span>
      {title}
    </h2>
    <p className="mt-2 text-sm text-slate-500">{desc}</p>
  </div>
)

const Field = ({ label, children }) => (
  <label className="block">
    <span className={labelClass}>{label}</span>
    {children}
  </label>
)

const DetailRows = ({ rows }) => (
  <div className="space-y-2">
    {rows.map(([label, value]) => (
      <div key={label} className="grid grid-cols-[120px_1fr] gap-3 border-b border-slate-100 pb-2 text-sm last:border-b-0">
        <span className="text-slate-500">{label}</span>
        <span className="font-bold text-slate-900">{value}</span>
      </div>
    ))}
  </div>
)

const StatusLine = ({ color, label, value }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span className="text-slate-600">{label}</span>
    </div>
    <span className="font-extrabold text-slate-950">{value}</span>
  </div>
)

const ActionButton = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-white"
  >
    {children}
  </button>
)

const FooterSync = () => (
  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 text-sm text-slate-500">
    <span className="font-bold text-emerald-600">● Live Sync Connected</span>
    <span>Last Updated: 19:47:23</span>
    <span>Auto refresh every 10 seconds</span>
  </div>
)

export default FnbKitchenBar