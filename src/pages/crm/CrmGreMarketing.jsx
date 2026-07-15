import { useState } from 'react'

const summaryCards = [
  { label: 'Live Guests in Casino', value: '38', sub: '↑ 6 vs yesterday', icon: '👥', border: 'border-emerald-200', color: 'text-emerald-600' },
  { label: 'VIP / VVIP Active', value: '12', sub: '↑ 2 vs yesterday', icon: '👑', border: 'border-purple-200', color: 'text-purple-600' },
  { label: 'Pending Service Requests', value: '14', sub: '↑ 3 vs yesterday', icon: '📋', border: 'border-amber-200', color: 'text-amber-600' },
  { label: 'Hotel Rooms Allocated', value: '26', sub: '↑ 4 vs yesterday', icon: '🏨', border: 'border-sky-200', color: 'text-sky-600' },
  { label: 'Travel / Pickup Today', value: '8', sub: '↑ 1 vs yesterday', icon: '🚗', border: 'border-emerald-200', color: 'text-emerald-600' },
  { label: 'Gifts Issued Today', value: '7', sub: '↓ 1 vs yesterday', icon: '🎁', border: 'border-pink-200', color: 'text-pink-600' },
  { label: 'Total Service Cost Today', value: 'NPR 312,450', sub: '↑ 18% vs yesterday', icon: '🪙', border: 'border-yellow-300', color: 'text-yellow-700' },
]

const liveGuests = [
  {
    badge: '112',
    customer: 'Daniel Smith',
    cid: 'CID11245678',
    category: 'VVIP',
    location: 'Baccarat Table 1',
    playStatus: 'Playing',
    buyIn: 'NPR 120,000',
    wallet: 'NPR 248,600',
    lastService: '11:20 AM Beverage',
    gre: 'Meera K.',
  },
  {
    badge: '087',
    customer: 'Raj Sharma',
    cid: 'CID-000987',
    category: 'VIP',
    location: 'Roulette Table 2',
    playStatus: 'Playing',
    buyIn: 'NPR 65,000',
    wallet: 'NPR 95,500',
    lastService: '10:45 AM Dinner Booking',
    gre: 'Arjun P.',
  },
  {
    badge: '051',
    customer: 'Priya Tamang',
    cid: 'CID-000051',
    category: 'VIP',
    location: 'Slot Machine 7',
    playStatus: 'Break',
    buyIn: 'NPR 25,000',
    wallet: 'NPR 42,000',
    lastService: '09:30 AM Airport Pickup',
    gre: 'Reshma T.',
  },
  {
    badge: '099',
    customer: 'Ahmed Khan',
    cid: 'CID-000099',
    category: 'Standard',
    location: 'Lobby',
    playStatus: 'Waiting',
    buyIn: 'NPR 10,000',
    wallet: 'NPR 18,500',
    lastService: '—',
    gre: 'Ravi S.',
  },
  {
    badge: '286',
    customer: 'Sunil Verma',
    cid: 'CID-000286',
    category: 'VIP',
    location: 'Pit Table 3',
    playStatus: 'Playing',
    buyIn: 'NPR 50,000',
    wallet: '-NPR 5,000',
    lastService: '09:15 AM Checkout',
    gre: 'Meera K.',
  },
]

const pendingRequests = [
  { id: 'SR-2026-0142', badge: '112', customer: 'Daniel Smith', type: 'Hotel Booking', cost: 'NPR 48,000', approval: 'Pending Approval', delivery: 'In Progress', gre: 'Meera K.' },
  { id: 'SR-2026-0141', badge: '087', customer: 'Raj Sharma', type: 'Travel / Pickup', cost: 'NPR 6,500', approval: 'Approved', delivery: 'Scheduled', gre: 'Arjun P.' },
  { id: 'SR-2026-0140', badge: '051', customer: 'Priya Tamang', type: 'Ticket Booking', cost: 'NPR 3,200', approval: 'Approved', delivery: 'Scheduled', gre: 'Reshma T.' },
  { id: 'SR-2026-0139', badge: '099', customer: 'Ahmed Khan', type: 'Gift / Service', cost: 'NPR 800', approval: 'Pending Approval', delivery: 'Pending', gre: 'Ravi S.' },
  { id: 'SR-2026-0138', badge: '286', customer: 'Sunil Verma', type: 'Travel / Drop', cost: 'NPR 4,100', approval: 'Approved', delivery: 'Completed', gre: 'Meera K.' },
]

const recentRecords = [
  { title: 'Hotel Booking', desc: 'Daniel Smith (112) · Hotel 2 nights · Suite', status: 'Confirmed', time: '10:30 AM', icon: '🏨' },
  { title: 'Vehicle Assignment', desc: 'Raj Sharma (087) · Airport Pickup', status: 'Scheduled', time: 'Yesterday', icon: '🚗' },
  { title: 'Ticket Booking', desc: 'Priya Tamang (051) · Kathmandu → Dubai', status: 'Ticket Issued', time: 'Yesterday', icon: '✈️' },
  { title: 'Gift / Service Issued', desc: 'Ahmed Khan (099) · Welcome Gift Package', status: 'Delivered', time: 'Yesterday', icon: '🎁' },
  { title: 'Travel / Drop', desc: 'Sunil Verma (286) · Hotel Drop', status: 'Completed', time: '2 days ago', icon: '🚕' },
]

const hotelCards = [
  { label: 'Total Bookings This Cycle', value: '128', sub: '↑ 18 vs last cycle', icon: '🏨', border: 'border-sky-200' },
  { label: 'Pending Hotel Receipt Return', value: '29', sub: '22.66% of total', icon: '📄', border: 'border-amber-200' },
  { label: 'Verified & Ready for Accounts', value: '52', sub: '40.63% of total', icon: '✅', border: 'border-emerald-200' },
  { label: 'Sent to Accounts', value: '34', sub: '26.56% of total', icon: '🏦', border: 'border-purple-200' },
  { label: 'Total Estimated Cost', value: 'NPR 5,248,000', sub: 'This cycle total', icon: '🪙', border: 'border-yellow-300' },
]

const hotelBookings = [
  {
    bookingId: 'HB-2026-0516-001',
    billNo: 'Bill HB-2026-0516-0987',
    badge: '087',
    cid: 'CID-000987',
    customer: 'Raj Sharma',
    category: 'VIP',
    hotel: 'Summit Grand Hotel',
    room: 'Deluxe King',
    rooms: '1',
    checkIn: '2026-05-16',
    checkOut: '2026-05-18',
    nights: '2',
    cost: 'NPR 48,000',
    issuedBy: 'Daniel Smith',
    approvedBy: 'Priya Tamang',
    receivedBy: 'Amit Gurung',
    receipt: 'Receipt Returned',
    verification: 'Verified',
    accounts: 'Ready for Accounts',
  },
  {
    bookingId: 'HB-2026-0516-002',
    billNo: 'Bill HB-2026-0516-9988',
    badge: '112',
    cid: 'CID-001112',
    customer: 'Daniel Smith',
    category: 'VVIP',
    hotel: 'Hotel Everest Crown',
    room: 'Executive Suite',
    rooms: '2',
    checkIn: '2026-05-16',
    checkOut: '2026-05-19',
    nights: '3',
    cost: 'NPR 120,000',
    issuedBy: 'Daniel Smith',
    approvedBy: 'Priya Tamang',
    receivedBy: 'Suresh Shrestha',
    receipt: 'Pending Return',
    verification: 'Pending Verification',
    accounts: 'Hold',
  },
  {
    bookingId: 'HB-2026-0515-003',
    billNo: 'Bill HB-2026-0515-9962',
    badge: '051',
    cid: 'CID-000051',
    customer: 'Priya Tamang',
    category: 'VIP',
    hotel: 'City Palace Hotel',
    room: 'Deluxe Twin',
    rooms: '1',
    checkIn: '2026-05-15',
    checkOut: '2026-05-17',
    nights: '2',
    cost: 'NPR 36,000',
    issuedBy: 'Daniel Smith',
    approvedBy: 'Priya Tamang',
    receivedBy: 'Deepak Rai',
    receipt: 'Compiling Bill',
    verification: 'Verified',
    accounts: 'Sent to Accounts',
  },
]

const serviceSummaryCards = [
  {
    label: 'Total Requests This Month',
    value: '48',
    sub: 'All services',
    icon: '🚗',
    border: 'border-yellow-300',
  },
  {
    label: 'Pending Approval',
    value: '7',
    sub: 'Awaiting approval',
    icon: '🎁',
    border: 'border-red-200',
  },
  {
    label: 'In Progress',
    value: '12',
    sub: 'Service in progress',
    icon: '🛎️',
    border: 'border-amber-200',
  },
  {
    label: 'Completed Today',
    value: '15',
    sub: 'Successfully completed',
    icon: '✅',
    border: 'border-emerald-200',
  },
]

const serviceRequests = [
  {
    id: 'SRV-00048',
    type: 'Vehicle Assignment',
    icon: '🚗',
    customer: 'Raj Sharma',
    cid: 'CID-100387',
    badge: '087',
    category: 'VIP',
    details: 'Airport Pickup · 19 May, 10:00 AM',
    cost: 'NPR 12,000',
    status: 'In Progress',
    approval: 'Approved',
    delivery: 'Scheduled',
    gre: 'Karan Lama',
    pickup: 'Tribhuvan Airport',
    drop: 'Royal Summit Casino',
    vehicle: 'B AB 1234',
    driver: 'Mahesh Thapa',
    contact: '9841234567',
    remarks: 'VIP Arrival · Flight AI 215',
  },
  {
    id: 'SRV-00047',
    type: 'Gift / Service',
    icon: '🎁',
    customer: 'Daniel Smith',
    cid: 'CID-100112',
    badge: '112',
    category: 'VVIP',
    details: 'Welcome Gift Pack',
    cost: 'NPR 8,000',
    status: 'Completed',
    approval: 'Approved',
    delivery: 'Delivered',
    gre: 'Meera K.',
    pickup: 'Inventory Store',
    drop: 'Customer Lounge',
    vehicle: '—',
    driver: 'GRE Team',
    contact: '—',
    remarks: 'Welcome gift package issued.',
  },
  {
    id: 'SRV-00046',
    type: 'Food (F&B)',
    icon: '🍽️',
    customer: 'Priya Tamang',
    cid: 'CID-100051',
    badge: '051',
    category: 'VIP',
    details: 'Fruit Platter & Juice · Table 3',
    cost: 'NPR 5,500',
    status: 'Completed',
    approval: 'Not Required',
    delivery: 'Delivered',
    gre: 'Reshma T.',
    pickup: 'Kitchen',
    drop: 'Baccarat Table 3',
    vehicle: '—',
    driver: 'F&B Staff',
    contact: '—',
    remarks: 'Delivered to gaming floor.',
  },
  {
    id: 'SRV-00045',
    type: 'Vehicle Assignment',
    icon: '🚗',
    customer: 'Amit Verma',
    cid: 'CID-100044',
    badge: '044',
    category: 'VVIP',
    details: 'Drop to Airport · 19 May, 08:00 PM',
    cost: 'NPR 15,000',
    status: 'Pending',
    approval: 'Pending',
    delivery: '—',
    gre: 'Arjun P.',
    pickup: 'Royal Summit Casino',
    drop: 'Tribhuvan Airport',
    vehicle: 'Pending',
    driver: 'Pending',
    contact: 'Pending',
    remarks: 'Awaiting director approval.',
  },
  {
    id: 'SRV-00044',
    type: 'Gift / Service',
    icon: '🎁',
    customer: 'Pawan Gurung',
    cid: 'CID-100066',
    badge: '066',
    category: 'VIP',
    details: 'Cash Coupon NPR 5,000',
    cost: 'NPR 5,000',
    status: 'Pending Approval',
    approval: 'Pending',
    delivery: '—',
    gre: 'Ravi S.',
    pickup: 'CRM Desk',
    drop: 'Customer',
    vehicle: '—',
    driver: 'GRE Team',
    contact: '—',
    remarks: 'Coupon approval required.',
  },
  {
    id: 'SRV-00043',
    type: 'Food (F&B)',
    icon: '🍽️',
    customer: 'Deepak Joshi',
    cid: 'CID-100073',
    badge: '073',
    category: 'VIP',
    details: 'Chicken Sandwich + Cold Drink',
    cost: 'NPR 3,500',
    status: 'In Progress',
    approval: 'Approved',
    delivery: 'Preparing',
    gre: 'Karan Lama',
    pickup: 'Kitchen',
    drop: 'Slot Machine 3',
    vehicle: '—',
    driver: 'F&B Staff',
    contact: '—',
    remarks: 'Send to machine area.',
  },
  {
    id: 'SRV-00042',
    type: 'Vehicle Assignment',
    icon: '🚗',
    customer: 'Suresh Adhikari',
    cid: 'CID-100091',
    badge: '091',
    category: 'VVIP',
    details: 'Local City Tour · 20 May, 02:00 PM',
    cost: 'NPR 18,000',
    status: 'Scheduled',
    approval: 'Approved',
    delivery: 'Scheduled',
    gre: 'Meera K.',
    pickup: 'Royal Summit Casino',
    drop: 'Local City Tour',
    vehicle: 'BA 22 PA 5544',
    driver: 'Nabin Rai',
    contact: '9800001111',
    remarks: 'Premium vehicle required.',
  },
]

const inputClass =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'

const labelClass =
  'mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500'

const badgeClass = {
  VIP: 'border-yellow-300 bg-yellow-50 text-yellow-700',
  VVIP: 'border-purple-200 bg-purple-50 text-purple-700',
  Standard: 'border-sky-200 bg-sky-50 text-sky-700',
  Playing: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Break: 'border-sky-200 bg-sky-50 text-sky-700',
  Waiting: 'border-yellow-300 bg-yellow-50 text-yellow-700',
  Approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Pending Approval': 'border-yellow-300 bg-yellow-50 text-yellow-700',
  Pending: 'border-yellow-300 bg-yellow-50 text-yellow-700',
  'In Progress': 'border-sky-200 bg-sky-50 text-sky-700',
  Scheduled: 'border-sky-200 bg-sky-50 text-sky-700',
  Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Delivered: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Preparing: 'border-amber-200 bg-amber-50 text-amber-700',
  'Not Required': 'border-slate-200 bg-slate-50 text-slate-700',
  'Ticket Issued': 'border-purple-200 bg-purple-50 text-purple-700',
  'Receipt Returned': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Verified: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Ready for Accounts': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Pending Return': 'border-yellow-300 bg-yellow-50 text-yellow-700',
  'Pending Verification': 'border-yellow-300 bg-yellow-50 text-yellow-700',
  Hold: 'border-red-200 bg-red-50 text-red-700',
  'Compiling Bill': 'border-sky-200 bg-sky-50 text-sky-700',
  'Sent to Accounts': 'border-purple-200 bg-purple-50 text-purple-700',
  '—': 'border-slate-200 bg-slate-50 text-slate-500',
}

const StatusBadge = ({ children }) => (
  <span className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase ${badgeClass[children] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
    {children}
  </span>
)

const CrmGreMarketing = () => {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [selectedGuest, setSelectedGuest] = useState(liveGuests[0])
  const [showBookingModal, setShowBookingModal] = useState(false)

  const tabs = [
    'Dashboard',
    'Hotel Booking',
    'Vehicle Assignment',
    'Gifts & Services',
    'Food (F&B) Requests',
    'Ticket Booking',
    'Service Records',
  ]

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-950">
            <span className="mr-2 text-yellow-500">◆</span>
            CRM / GRE / Marketing
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Live guest service, hotel, travel, gifts, tickets, food requests, and customer retention management.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowBookingModal(true)}
            className="rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-extrabold text-slate-950 shadow-sm hover:bg-yellow-300"
          >
            + New Hotel Booking
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('Vehicle Assignment')}
            className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-700 hover:bg-sky-100"
          >
            🚗 Assign Vehicle
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('Ticket Booking')}
            className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-bold text-purple-700 hover:bg-purple-100"
          >
            🎫 Book Ticket
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('Gifts & Services')}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
          >
            🎁 Issue Gift / Service
          </button>
        </div>
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
          selectedGuest={selectedGuest}
          setSelectedGuest={setSelectedGuest}
          setShowBookingModal={setShowBookingModal}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'Hotel Booking' && (
        <HotelBookingRecords setShowBookingModal={setShowBookingModal} />
      )}

      {['Vehicle Assignment', 'Gifts & Services', 'Food (F&B) Requests'].includes(activeTab) && (
        <ServiceRequestsView activeTab={activeTab} />
      )}

      {activeTab !== 'Dashboard' &&
        activeTab !== 'Hotel Booking' &&
        !['Vehicle Assignment', 'Gifts & Services', 'Food (F&B) Requests'].includes(activeTab) && (
          <ComingSoonPanel title={activeTab} />
        )}

      {showBookingModal && (
        <NewHotelBookingModal onClose={() => setShowBookingModal(false)} />
      )}
    </div>
  )
}

const DashboardView = ({ selectedGuest, setSelectedGuest, setShowBookingModal, setActiveTab }) => (
  <>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-7">
      {summaryCards.map((card) => (
        <div key={card.label} className={`rounded-2xl border ${card.border} bg-white p-5 shadow-sm`}>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-2xl">
              {card.icon}
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">{card.label}</p>
              <p className="mt-2 font-serif text-2xl font-bold text-slate-950">{card.value}</p>
              <p className={`mt-1 text-xs font-semibold ${card.color}`}>{card.sub}</p>
            </div>
          </div>
        </div>
      ))}
    </section>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_430px]">
      <div className="space-y-5">
        <Panel title="Live Guests / Active Customers">
          <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-[1fr_auto_auto]">
            <input className={inputClass} placeholder="Search guest..." />
            <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Filter
            </button>
            <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Export
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Badge</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Current Location</th>
                  <th className="px-4 py-3">Play Status</th>
                  <th className="px-4 py-3">Today Buy-In</th>
                  <th className="px-4 py-3">Wallet / Exposure</th>
                  <th className="px-4 py-3">Last Service</th>
                  <th className="px-4 py-3">GRE Assigned</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {liveGuests.map((guest) => (
                  <tr
                    key={guest.badge}
                    onClick={() => setSelectedGuest(guest)}
                    className={`cursor-pointer hover:bg-slate-50 ${selectedGuest.badge === guest.badge ? 'bg-yellow-50/60' : ''}`}
                  >
                    <td className="px-4 py-4">
                      <span className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-1 font-mono text-sm font-bold text-yellow-700">
                        {guest.badge}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-950">{guest.customer}</p>
                      <p className="text-xs text-slate-500">{guest.cid}</p>
                    </td>
                    <td className="px-4 py-4"><StatusBadge>{guest.category}</StatusBadge></td>
                    <td className="px-4 py-4 text-slate-700">{guest.location}</td>
                    <td className="px-4 py-4"><StatusBadge>{guest.playStatus}</StatusBadge></td>
                    <td className="px-4 py-4 font-bold text-slate-800">{guest.buyIn}</td>
                    <td className={`px-4 py-4 font-extrabold ${guest.wallet.startsWith('-') ? 'text-red-600' : 'text-emerald-600'}`}>{guest.wallet}</td>
                    <td className="px-4 py-4 text-slate-700">{guest.lastService}</td>
                    <td className="px-4 py-4 font-bold text-slate-700">{guest.gre}</td>
                    <td className="px-4 py-4">
                      <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Pending Service Requests / Service Queue">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Request ID</th>
                  <th className="px-4 py-3">Badge</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Service Type</th>
                  <th className="px-4 py-3">Est. Cost</th>
                  <th className="px-4 py-3">Approval</th>
                  <th className="px-4 py-3">Delivery</th>
                  <th className="px-4 py-3">Assigned GRE</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-mono text-xs">{request.id}</td>
                    <td className="px-4 py-4 font-mono font-bold">{request.badge}</td>
                    <td className="px-4 py-4 font-bold text-slate-950">{request.customer}</td>
                    <td className="px-4 py-4">{request.type}</td>
                    <td className="px-4 py-4 font-bold">{request.cost}</td>
                    <td className="px-4 py-4"><StatusBadge>{request.approval}</StatusBadge></td>
                    <td className="px-4 py-4"><StatusBadge>{request.delivery}</StatusBadge></td>
                    <td className="px-4 py-4">{request.gre}</td>
                    <td className="px-4 py-4">
                      <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-5">
          {recentRecords.map((record) => (
            <div key={record.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-2xl">{record.icon}</div>
              <p className="mt-3 font-bold text-slate-950">{record.title}</p>
              <p className="mt-1 text-sm text-slate-500">{record.desc}</p>
              <div className="mt-3 flex items-center justify-between">
                <StatusBadge>{record.status}</StatusBadge>
                <span className="text-xs text-slate-400">{record.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <SelectedGuestPanel
        guest={selectedGuest}
        setShowBookingModal={setShowBookingModal}
        setActiveTab={setActiveTab}
      />
    </section>
  </>
)

const SelectedGuestPanel = ({ guest, setShowBookingModal, setActiveTab }) => (
  <aside className="space-y-5 xl:sticky xl:top-24 self-start">
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">
        Selected Customer Service Profile
      </h2>

      <div className="mt-5 flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
          👤
        </div>
        <div>
          <p className="font-serif text-2xl font-bold text-slate-950">{guest.customer}</p>
          <p className="text-sm text-slate-500">Badge No. {guest.badge}</p>
        </div>
        <div className="ml-auto"><StatusBadge>{guest.category}</StatusBadge></div>
      </div>

      <div className="mt-5 space-y-2 text-sm">
        <ProfileLine label="CID" value={guest.cid} />
        <ProfileLine label="Current Location" value={guest.location} />
        <ProfileLine label="Play Status" value={guest.playStatus} />
        <ProfileLine label="Today Buy-In" value={guest.buyIn} />
        <ProfileLine label="Wallet / Exposure" value={guest.wallet} />
        <ProfileLine label="Last Service Given" value={guest.lastService} />
        <ProfileLine label="Assigned GRE" value={guest.gre} />
      </div>

      <div className="mt-5">
        <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
          Eligible Services
        </p>
        <div className="flex flex-wrap gap-2">
          {['Hotel', 'Travel', 'Tickets', 'Gift / Service', 'F&B'].map((service) => (
            <span key={service} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              ✓ {service}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setShowBookingModal(true)}
          className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm font-bold text-yellow-700 hover:bg-yellow-100"
        >
          Book Hotel
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Vehicle Assignment')}
          className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-700 hover:bg-sky-100"
        >
          Arrange Travel
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Ticket Booking')}
          className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-bold text-purple-700 hover:bg-purple-100"
        >
          Book Ticket
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Gifts & Services')}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
        >
          Issue Gift
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Food (F&B) Requests')}
          className="col-span-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700 hover:bg-orange-100"
        >
          Request F&B
        </button>
      </div>

      <button className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
        View Service History
      </button>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">
        Customer Summary This Month
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniSummary label="Buy-In" value="NPR 1,250,000" />
        <MiniSummary label="Win/Loss" value="NPR 320,000" color="green" />
        <MiniSummary label="Wallet / Exposure" value="NPR 248,600" color="green" />
        <MiniSummary label="Visits" value="8" />
      </div>
    </div>
  </aside>
)

const HotelBookingRecords = ({ setShowBookingModal }) => (
  <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_330px]">
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-950">Hotel Booking Records</h2>
          <p className="mt-1 text-sm text-slate-500">
            Issued booking receipts, hotel stay verification, and 15-day billing cycle tracking.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowBookingModal(true)}
          className="rounded-lg bg-yellow-400 px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-yellow-300"
        >
          + New Booking
        </button>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {hotelCards.map((card) => (
          <div key={card.label} className={`rounded-2xl border ${card.border} bg-white p-5 shadow-sm`}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-2xl">
                {card.icon}
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">{card.label}</p>
                <p className="mt-2 font-serif text-xl font-bold text-slate-950">{card.value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{card.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <Panel title="Hotel Booking Records Directory">
        <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-4">
          <input className={inputClass} placeholder="Search by CID, badge, bill no, customer, hotel..." />
          <select className={inputClass}><option>All Hotels</option></select>
          <select className={inputClass}><option>All Room Types</option></select>
          <select className={inputClass}><option>All Statuses</option></select>
        </div>

        <div className="flex flex-wrap gap-3 border-b border-slate-200 p-4">
          <button className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">Excel</button>
          <button className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700">PDF</button>
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">Print</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-3 py-3">Booking ID</th>
                <th className="px-3 py-3">Bill No</th>
                <th className="px-3 py-3">Badge</th>
                <th className="px-3 py-3">CID</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Hotel Name</th>
                <th className="px-3 py-3">Room Type</th>
                <th className="px-3 py-3">Rooms</th>
                <th className="px-3 py-3">Check-In</th>
                <th className="px-3 py-3">Check-Out</th>
                <th className="px-3 py-3">Nights</th>
                <th className="px-3 py-3">Estimated Cost</th>
                <th className="px-3 py-3">Receipt Return</th>
                <th className="px-3 py-3">Verification</th>
                <th className="px-3 py-3">Accounts</th>
                <th className="px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hotelBookings.map((booking) => (
                <tr key={booking.bookingId} className="hover:bg-slate-50">
                  <td className="px-3 py-4 font-mono">{booking.bookingId}</td>
                  <td className="px-3 py-4">{booking.billNo}</td>
                  <td className="px-3 py-4 font-mono font-bold">{booking.badge}</td>
                  <td className="px-3 py-4 font-mono">{booking.cid}</td>
                  <td className="px-3 py-4 font-bold text-slate-950">{booking.customer}</td>
                  <td className="px-3 py-4"><StatusBadge>{booking.category}</StatusBadge></td>
                  <td className="px-3 py-4">{booking.hotel}</td>
                  <td className="px-3 py-4">{booking.room}</td>
                  <td className="px-3 py-4">{booking.rooms}</td>
                  <td className="px-3 py-4">{booking.checkIn}</td>
                  <td className="px-3 py-4">{booking.checkOut}</td>
                  <td className="px-3 py-4">{booking.nights}</td>
                  <td className="px-3 py-4 font-bold">{booking.cost}</td>
                  <td className="px-3 py-4"><StatusBadge>{booking.receipt}</StatusBadge></td>
                  <td className="px-3 py-4"><StatusBadge>{booking.verification}</StatusBadge></td>
                  <td className="px-3 py-4"><StatusBadge>{booking.accounts}</StatusBadge></td>
                  <td className="px-3 py-4">
                    <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>

    <aside className="space-y-5 xl:sticky xl:top-24 self-start">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">
          15-Day Billing Cycle
        </h2>
        <div className="mt-4 space-y-3 text-sm">
          <ProfileLine label="Current Cycle" value="2026-05-01 → 2026-05-15" />
          <ProfileLine label="Cycle Status" value="Active" />
          <ProfileLine label="Total Bookings" value="128" />
          <ProfileLine label="Total Estimated Amount" value="NPR 5,248,000" />
          <ProfileLine label="Pending Verification" value="29" />
          <ProfileLine label="Cycle Ends" value="In 5 days" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">
          Receipt Verification Workflow
        </h2>
        <ol className="mt-4 space-y-3 text-sm text-slate-600">
          <li>1. Issued to customer by GRE.</li>
          <li>2. Customer submits at hotel.</li>
          <li>3. Hotel returns bill with original receipt.</li>
          <li>4. GRE verifies original issue.</li>
          <li>5. Forward to Accounts.</li>
        </ol>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">
          Quick Actions
        </h2>
        <div className="mt-4 space-y-3">
          <button className="w-full rounded-lg bg-yellow-400 px-4 py-3 text-sm font-extrabold text-slate-950 hover:bg-yellow-300">
            Verify Returned Receipt
          </button>
          <button className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
            Upload Hotel Bill
          </button>
          <button className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
            Forward to Accounts
          </button>
        </div>
      </div>
    </aside>
  </section>
)

const ServiceRequestsView = ({ activeTab }) => {
  const records = getFilteredServices(activeTab)
  const [selectedRequest, setSelectedRequest] = useState(records[0])
  const [showServiceModal, setShowServiceModal] = useState(false)

  const serviceTabs = ['Vehicle Assignment', 'Gifts & Services', 'Food (F&B) Requests']

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-500">CRM / GRE / Marketing</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-slate-950">
            <span className="mr-2 text-yellow-500">◆</span>
            Vehicle Assignment / Gifts & Services / Food Requests
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Create and manage guest services for VIP / VVIP customers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowServiceModal(true)}
          className="rounded-lg bg-yellow-400 px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-yellow-300"
        >
          + New Service Request
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-slate-200">
        {serviceTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`shrink-0 border-b-2 px-4 py-3 text-sm font-extrabold ${
              activeTab === tab
                ? 'border-yellow-400 text-yellow-700'
                : 'border-transparent text-slate-500'
            }`}
          >
            {tab === 'Vehicle Assignment' && '🚗 '}
            {tab === 'Gifts & Services' && '🎁 '}
            {tab === 'Food (F&B) Requests' && '🍽️ '}
            {tab}
          </button>
        ))}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {serviceSummaryCards.map((card) => (
          <div key={card.label} className={`rounded-2xl border ${card.border} bg-white p-5 shadow-sm`}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-2xl">
                {card.icon}
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
                  {card.label}
                </p>
                <p className="mt-2 font-serif text-2xl font-bold text-slate-950">
                  {card.value}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{card.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_390px]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-5">
              <input className={inputClass} defaultValue="18/05/2024 - 18/05/2024" />
              <select className={inputClass}>
                <option>All Service Types</option>
                <option>Vehicle Assignment</option>
                <option>Gift / Service</option>
                <option>Food (F&B)</option>
              </select>
              <select className={inputClass}>
                <option>All Status</option>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
              <select className={inputClass}>
                <option>All Approval Status</option>
                <option>Approved</option>
                <option>Pending</option>
                <option>Not Required</option>
              </select>
              <input className={inputClass} placeholder="Search CID, name, badge, bill no..." />
            </div>
          </div>

          <Panel title="Service Request Records">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Req. ID</th>
                    <th className="px-4 py-3">Service Type</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">CID / Badge</th>
                    <th className="px-4 py-3">Details</th>
                    <th className="px-4 py-3">Est. Cost</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Approval</th>
                    <th className="px-4 py-3">Delivery</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {records.map((request) => (
                    <tr
                      key={request.id}
                      onClick={() => setSelectedRequest(request)}
                      className={`cursor-pointer hover:bg-slate-50 ${
                        selectedRequest?.id === request.id ? 'bg-yellow-50/60' : ''
                      }`}
                    >
                      <td className="px-4 py-4 font-mono font-bold text-sky-700">{request.id}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{request.icon}</span>
                          <span className="font-bold text-slate-800">{request.type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-950">{request.customer}</p>
                        <StatusBadge>{request.category}</StatusBadge>
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        <p>{request.cid}</p>
                        <p>Badge {request.badge}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{request.details}</td>
                      <td className="px-4 py-4 font-bold text-slate-900">{request.cost}</td>
                      <td className="px-4 py-4"><StatusBadge>{request.status}</StatusBadge></td>
                      <td className="px-4 py-4"><StatusBadge>{request.approval}</StatusBadge></td>
                      <td className="px-4 py-4"><StatusBadge>{request.delivery}</StatusBadge></td>
                      <td className="px-4 py-4">
                        <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                          ⋮
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500">
              <span>Showing 1 to {records.length} of 48 records</span>
              <div className="flex gap-2">
                <button className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-1.5 text-sm font-bold text-yellow-700">1</button>
                <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold">2</button>
                <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold">3</button>
              </div>
            </div>
          </Panel>
        </div>

        <ServiceDetailPanel request={selectedRequest} />
      </section>

      {showServiceModal && (
        <NewServiceRequestModal
          activeTab={activeTab}
          onClose={() => setShowServiceModal(false)}
        />
      )}
    </div>
  )
}

const getFilteredServices = (activeTab) => {
  if (activeTab === 'Vehicle Assignment') {
    return serviceRequests.filter((item) => item.type === 'Vehicle Assignment')
  }

  if (activeTab === 'Gifts & Services') {
    return serviceRequests.filter((item) => item.type === 'Gift / Service')
  }

  if (activeTab === 'Food (F&B) Requests') {
    return serviceRequests.filter((item) => item.type === 'Food (F&B)')
  }

  return serviceRequests
}

const ServiceDetailPanel = ({ request }) => {
  if (!request) return null

  return (
    <aside className="space-y-5 xl:sticky xl:top-24 self-start">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">
            Selected Request Details
          </h2>
          <button className="text-slate-400">×</button>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-100 text-3xl">
            {request.icon}
          </div>
          <div>
            <p className="font-mono text-xl font-extrabold text-slate-950">{request.id}</p>
            <StatusBadge>{request.status}</StatusBadge>
          </div>
        </div>

        <div className="mt-5">
          <p className="font-bold text-yellow-700">{request.type}</p>
          <p className="text-sm text-slate-500">{request.details}</p>
        </div>

        <DetailSection
          title="Customer Information"
          rows={[
            ['Customer Name', request.customer],
            ['CID / Badge', `${request.cid} / ${request.badge}`],
            ['Category', request.category],
            ['Current Location', 'Gaming Floor · Table 1'],
            ['Assigned GRE', request.gre],
          ]}
        />

        <DetailSection
          title="Service Details"
          rows={[
            ['Pickup Location', request.pickup],
            ['Drop Location', request.drop],
            ['Date & Time', request.details],
            ['Vehicle No.', request.vehicle],
            ['Driver Name', request.driver],
            ['Driver Contact', request.contact],
            ['Estimated Cost', request.cost],
            ['Actual Cost', '—'],
            ['Remarks', request.remarks],
          ]}
        />

        <DetailSection
          title="Status & Approval"
          rows={[
            ['Status', request.status],
            ['Approval Status', request.approval],
            ['Approved By', 'Director Admin'],
            ['Approved On', '18 May 2024, 09:15 AM'],
            ['Delivery Status', request.delivery],
          ]}
        />

        <div className="mt-5 grid grid-cols-3 gap-3">
          <button className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50">
            View History
          </button>
          <button className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-3 text-xs font-bold text-yellow-700 hover:bg-yellow-100">
            Edit
          </button>
          <button className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-xs font-bold text-red-700 hover:bg-red-100">
            Cancel
          </button>
        </div>
      </div>
    </aside>
  )
}

const DetailSection = ({ title, rows }) => (
  <div className="mt-5 border-t border-slate-200 pt-4">
    <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
      {title}
    </h3>
    <div className="mt-3 space-y-2">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[130px_1fr] gap-3 text-sm">
          <span className="text-slate-500">{label}</span>
          <span className="font-bold text-slate-800">{value}</span>
        </div>
      ))}
    </div>
  </div>
)

const NewServiceRequestModal = ({ activeTab, onClose }) => {
  const isVehicle = activeTab === 'Vehicle Assignment'
  const isGift = activeTab === 'Gifts & Services'
  const isFood = activeTab === 'Food (F&B) Requests'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500">CRM / GRE / Marketing</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-slate-950">
              <span className="mr-2 text-yellow-500">◆</span>
              New {activeTab}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Create service request linked with CID, business date, badge/session, approval, delivery and cost tracking.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50"
          >
            ×
          </button>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <FormCard title="Customer & Session">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="CID *"><input className={inputClass} defaultValue="CID-100387" /></Field>
              <Field label="Customer Name *"><input className={inputClass} defaultValue="Raj Sharma" /></Field>
              <Field label="Badge / Session No."><input className={inputClass} defaultValue="087" /></Field>
              <Field label="Casino Date *"><input className={inputClass} defaultValue="2026-05-18" /></Field>
              <Field label="Customer Category"><select className={inputClass}><option>VIP</option><option>VVIP</option><option>Standard</option></select></Field>
              <Field label="Current Location"><input className={inputClass} defaultValue="Gaming Floor · Table 1" /></Field>
            </div>
          </FormCard>

          <FormCard title="Cost & Approval">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Estimated Cost *"><input className={inputClass} defaultValue="NPR 12,000" /></Field>
              <Field label="Actual Cost"><input className={inputClass} placeholder="Enter after completion" /></Field>
              <Field label="Issued By GRE"><input className={inputClass} defaultValue="Karan Lama" /></Field>
              <Field label="Approved By"><select className={inputClass}><option>Director Admin</option><option>GRE Manager</option></select></Field>
              <Field label="Approval Status"><select className={inputClass}><option>Pending Approval</option><option>Approved</option><option>Not Required</option></select></Field>
              <Field label="Delivery Status"><select className={inputClass}><option>Scheduled</option><option>In Progress</option><option>Delivered</option><option>Completed</option></select></Field>
            </div>
          </FormCard>
        </div>

        {isVehicle && (
          <FormCard title="Vehicle Assignment Details">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Travel Type *"><select className={inputClass}><option>Airport Pickup</option><option>Drop</option><option>Local</option><option>Other</option></select></Field>
              <Field label="Pickup Location *"><input className={inputClass} defaultValue="Tribhuvan Airport" /></Field>
              <Field label="Drop Location *"><input className={inputClass} defaultValue="Royal Summit Casino" /></Field>
              <Field label="Date & Time *"><input className={inputClass} defaultValue="19 May 2024, 10:00 AM" /></Field>
              <Field label="Vehicle Number"><input className={inputClass} defaultValue="B AB 1234" /></Field>
              <Field label="Driver Name"><input className={inputClass} defaultValue="Mahesh Thapa" /></Field>
              <Field label="Driver Contact"><input className={inputClass} defaultValue="9841234567" /></Field>
              <Field label="Confirmed By Customer"><select className={inputClass}><option>Pending</option><option>Confirmed</option></select></Field>
              <Field label="Status"><select className={inputClass}><option>Scheduled</option><option>In Progress</option><option>Completed</option></select></Field>
            </div>
          </FormCard>
        )}

        {isGift && (
          <FormCard title="Gift / Service Details">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Gift / Service Type *"><select className={inputClass}><option>Welcome Gift</option><option>Cash Coupon</option><option>Offer</option><option>Special Benefit</option></select></Field>
              <Field label="Item / Service Name *"><input className={inputClass} defaultValue="Welcome Gift Pack" /></Field>
              <Field label="Quantity *"><input className={inputClass} defaultValue="1" /></Field>
              <Field label="Inventory Linked"><select className={inputClass}><option>Yes</option><option>No</option></select></Field>
              <Field label="Received By Customer"><select className={inputClass}><option>Pending</option><option>Received</option></select></Field>
              <Field label="Delivery Status"><select className={inputClass}><option>Pending</option><option>Delivered</option></select></Field>
            </div>
          </FormCard>
        )}

        {isFood && (
          <FormCard title="Food / F&B Request Details">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Customer Location *"><input className={inputClass} defaultValue="Baccarat Table 3" /></Field>
              <Field label="Food / Drink Item *"><input className={inputClass} defaultValue="Fruit Platter & Juice" /></Field>
              <Field label="Quantity *"><input className={inputClass} defaultValue="1" /></Field>
              <Field label="Special Instruction"><input className={inputClass} placeholder="No ice, less spicy, etc." /></Field>
              <Field label="Sent To Kitchen / Bar"><select className={inputClass}><option>Kitchen</option><option>Bar</option></select></Field>
              <Field label="Prepared By"><input className={inputClass} placeholder="Kitchen staff name" /></Field>
              <Field label="Delivered By"><input className={inputClass} placeholder="Delivery staff name" /></Field>
              <Field label="Received / Confirmed By"><input className={inputClass} placeholder="Customer or GRE" /></Field>
              <Field label="Status"><select className={inputClass}><option>Sent to Department</option><option>Preparing</option><option>Delivered</option><option>Completed</option></select></Field>
            </div>
          </FormCard>
        )}

        <FormCard title="Remarks & Audit">
          <textarea
            className="min-h-28 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
            placeholder="Remarks, correction reason, special instruction, approval note..."
          />
        </FormCard>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
            Save Draft
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-yellow-400 px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-yellow-300"
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  )
}

const NewHotelBookingModal = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
    <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-500">CRM / GRE / Marketing &gt; New Hotel Booking</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-slate-950">
            <span className="mr-2 text-yellow-500">◆</span>
            New Hotel Booking
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Create and issue a hotel booking record and guest receipt for official CRM/GRE tracking.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Save Draft</button>
          <button className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2.5 text-sm font-bold text-yellow-700 hover:bg-yellow-100">Issue Receipt</button>
          <button className="rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-yellow-300">Submit Booking</button>
          <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50">×</button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,2fr)_330px]">
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <FormCard title="1 Booking Information">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="CID *"><input className={inputClass} defaultValue="CID-000987" /></Field>
                <Field label="Customer Name *"><input className={inputClass} defaultValue="Raj Sharma" /></Field>
                <Field label="Date Auto *"><input className={inputClass} defaultValue="2026-05-16 (Today)" /></Field>
                <Field label="Casino Date *"><input className={inputClass} defaultValue="2026-05-16" /></Field>
                <Field label="Room Quantity *"><select className={inputClass}><option>1 Room</option><option>2 Rooms</option></select></Field>
                <Field label="Hotel Name *"><select className={inputClass}><option>Summit Grand Hotel</option><option>Hotel Everest Crown</option></select></Field>
                <div className="md:col-span-2">
                  <Field label="Room Type *"><select className={inputClass}><option>Deluxe King Room</option><option>Executive Suite</option><option>Deluxe Twin</option></select></Field>
                </div>
              </div>
            </FormCard>

            <FormCard title="2 Issued Receipt / Stay Details">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Bill No *"><input className={inputClass} defaultValue="HB-2026-0516-00987" /></Field>
                <Field label="Check-In Date *"><input className={inputClass} defaultValue="2026-05-16" /></Field>
                <Field label="Check-Out Date *"><input className={inputClass} defaultValue="2026-05-18" /></Field>
                <Field label="Guest Name Auto *"><input className={inputClass} defaultValue="Raj Sharma" /></Field>
                <div className="md:col-span-2">
                  <Field label="Remarks"><input className={inputClass} defaultValue="VIP guest - 2 nights stay with breakfast." /></Field>
                </div>
                <Field label="Issued By *"><select className={inputClass}><option>Daniel Smith</option></select></Field>
                <Field label="Approved By *"><select className={inputClass}><option>Priya Tamang</option></select></Field>
                <Field label="Received By Hotel Staff *"><select className={inputClass}><option>Amit Gurung</option></select></Field>
              </div>
            </FormCard>
          </div>

          <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
            <p className="font-extrabold">This receipt is to be issued to the customer and submitted to the hotel.</p>
            <p className="mt-1">Hotel must return the original receipt along with the final bill for verification.</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <UploadBox title="Receipt Copy Upload" desc="PDF, JPG, PNG (Max 5MB)" />
            <UploadBox title="Hotel Bill Pending" desc="Upload when received from hotel" />
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">Verification Status</h3>
              <div className="mt-4"><StatusBadge>Not Verified</StatusBadge></div>
              <p className="mt-3 text-sm text-slate-500">
                Original receipt and bill must be verified before forwarding to Accounts.
              </p>
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">Booking Summary</h3>
            <div className="mt-4 space-y-3 text-sm">
              <ProfileLine label="Customer Category" value="VIP" />
              <ProfileLine label="Nights" value="2" />
              <ProfileLine label="Estimated Cost" value="NPR 48,000" />
              <ProfileLine label="Booking Status" value="Pending" />
              <ProfileLine label="Payment Cycle" value="15 Days" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">Booking Workflow</h3>
            <ol className="mt-4 space-y-3 text-sm text-slate-600">
              <li>1. Receipt issued to customer by GRE.</li>
              <li>2. Customer submits receipt to hotel.</li>
              <li>3. Hotel returns bill with original receipt.</li>
              <li>4. GRE verifies original issue.</li>
              <li>5. Forward to Accounts for 15-day payment cycle.</li>
            </ol>
          </div>
        </aside>
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

const FormCard = ({ title, children }) => (
  <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm first:mt-0">
    <h3 className="font-serif text-xl font-bold text-slate-950">{title}</h3>
    <div className="mt-5">{children}</div>
  </div>
)

const Field = ({ label, children }) => (
  <label className="block">
    <span className={labelClass}>{label}</span>
    {children}
  </label>
)

const UploadBox = ({ title, desc }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <h3 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">{title}</h3>
    <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <div className="text-3xl">☁️</div>
      <p className="mt-2 text-sm font-bold text-slate-700">Drag & drop file here or click to browse</p>
      <p className="mt-1 text-xs text-slate-500">{desc}</p>
    </div>
  </div>
)

const ProfileLine = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 text-sm last:border-b-0">
    <span className="text-slate-500">{label}</span>
    <span className="font-extrabold text-slate-950">{value}</span>
  </div>
)

const MiniSummary = ({ label, value, color }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
    <p className="text-xs font-bold text-slate-500">{label}</p>
    <p className={`mt-1 font-extrabold ${color === 'green' ? 'text-emerald-600' : 'text-slate-950'}`}>
      {value}
    </p>
  </div>
)

const ComingSoonPanel = ({ title }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
    <h2 className="font-serif text-2xl font-bold text-slate-950">{title}</h2>
    <p className="mt-2 text-sm text-slate-500">
      This CRM/GRE section will use the same service-request workflow pattern.
    </p>
  </div>
)

export default CrmGreMarketing