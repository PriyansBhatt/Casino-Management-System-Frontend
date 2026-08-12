import { useMemo, useState } from 'react'

const money = (value) => `NPR ${Number(value || 0).toLocaleString('en-IN')}`

const today = '2026-07-21'

const initialGuests = [
  {
    badge: '112',
    cid: 'CID-11245678',
    name: 'Daniel Smith',
    category: 'VVIP',
    location: 'Baccarat Table 1',
    playStatus: 'Playing',
    buyIn: 120000,
    exposure: 248600,
    lastService: '11:20 AM · Beverage',
    gre: 'Meera K.',
  },
  {
    badge: '087',
    cid: 'CID-000987',
    name: 'Raj Sharma',
    category: 'VIP',
    location: 'Roulette Table 2',
    playStatus: 'Playing',
    buyIn: 65000,
    exposure: 95500,
    lastService: '10:45 AM · Dinner Booking',
    gre: 'Arjun P.',
  },
  {
    badge: '051',
    cid: 'CID-000051',
    name: 'Priya Tamang',
    category: 'VIP',
    location: 'Slot Machine 7',
    playStatus: 'Break',
    buyIn: 25000,
    exposure: 42000,
    lastService: '09:30 AM · Airport Pickup',
    gre: 'Reshma T.',
  },
  {
    badge: '099',
    cid: 'CID-000099',
    name: 'Ahmed Khan',
    category: 'STANDARD',
    location: 'Lobby',
    playStatus: 'Waiting',
    buyIn: 10000,
    exposure: 18500,
    lastService: '—',
    gre: 'Ravi S.',
  },
  {
    badge: '286',
    cid: 'CID-000286',
    name: 'Sunil Verma',
    category: 'VIP',
    location: 'Pit Table 3',
    playStatus: 'Playing',
    buyIn: 50000,
    exposure: -5000,
    lastService: '09:15 AM · Checkout',
    gre: 'Meera K.',
  },
]

const initialBookings = [
  {
    id: 'HB-2026-0721-001',
    billNo: 'BILL-HB-2026-0721-001',
    badge: '087',
    cid: 'CID-000987',
    customer: 'Raj Sharma',
    category: 'VIP',
    hotel: 'Summit Grand Hotel',
    roomType: 'Deluxe King',
    rooms: 1,
    checkIn: '2026-07-21',
    checkOut: '2026-07-23',
    nights: 2,
    estimatedCost: 48000,
    receiptStatus: 'Receipt Returned',
    verificationStatus: 'Verified',
    accountsStatus: 'Ready for Accounts',
    remarks: 'VIP guest · 2 nights stay with breakfast.',
  },
  {
    id: 'HB-2026-0721-002',
    billNo: 'BILL-HB-2026-0721-002',
    badge: '112',
    cid: 'CID-11245678',
    customer: 'Daniel Smith',
    category: 'VVIP',
    hotel: 'Hotel Everest Crown',
    roomType: 'Executive Suite',
    rooms: 2,
    checkIn: '2026-07-22',
    checkOut: '2026-07-25',
    nights: 3,
    estimatedCost: 120000,
    receiptStatus: 'Pending Return',
    verificationStatus: 'Not Verified',
    accountsStatus: 'Not Ready',
    remarks: 'Airport pickup included.',
  },
]

const initialRequests = [
  {
    id: 'SRV-00048',
    serviceType: 'Vehicle Assignment',
    badge: '087',
    cid: 'CID-000987',
    customer: 'Raj Sharma',
    category: 'VIP',
    details: 'Airport Pickup · 22 Jul, 10:00 AM',
    estimatedCost: 12000,
    status: 'In Progress',
    approval: 'Approved',
    delivery: 'Scheduled',
    assignedGre: 'Karan Lama',
    location: 'Gaming Floor · Table 1',
    notes: 'Pickup: Tribhuvan Airport → Royal Summit Casino',
  },
  {
    id: 'SRV-00047',
    serviceType: 'Gift / Service',
    badge: '112',
    cid: 'CID-11245678',
    customer: 'Daniel Smith',
    category: 'VVIP',
    details: 'Welcome Gift Pack',
    estimatedCost: 8000,
    status: 'Completed',
    approval: 'Approved',
    delivery: 'Delivered',
    assignedGre: 'Meera K.',
    location: 'Baccarat Table 1',
    notes: 'Premium welcome gift.',
  },
  {
    id: 'SRV-00046',
    serviceType: 'Food (F&B)',
    badge: '051',
    cid: 'CID-000051',
    customer: 'Priya Tamang',
    category: 'VIP',
    details: 'Fruit Platter & Juice · Table 3',
    estimatedCost: 5500,
    status: 'Completed',
    approval: 'Not Required',
    delivery: 'Delivered',
    assignedGre: 'Reshma T.',
    location: 'Slot Machine 7',
    notes: 'Delivered to guest.',
  },
  {
    id: 'SRV-00045',
    serviceType: 'Vehicle Assignment',
    badge: '044',
    cid: 'CID-000044',
    customer: 'Amit Verma',
    category: 'VVIP',
    details: 'Airport Drop · 22 Jul, 08:00 PM',
    estimatedCost: 15000,
    status: 'Pending',
    approval: 'Pending',
    delivery: '—',
    assignedGre: 'Ravi S.',
    location: 'Lobby',
    notes: 'Awaiting vehicle confirmation.',
  },
  {
    id: 'SRV-00044',
    serviceType: 'Gift / Service',
    badge: '066',
    cid: 'CID-000066',
    customer: 'Pawan Gurung',
    category: 'VIP',
    details: 'Cash Coupon NPR 5,000',
    estimatedCost: 5000,
    status: 'Pending Approval',
    approval: 'Pending',
    delivery: '—',
    assignedGre: 'Arjun P.',
    location: 'Pit Table 2',
    notes: 'Director approval required.',
  },
  {
    id: 'SRV-00043',
    serviceType: 'Food (F&B)',
    badge: '073',
    cid: 'CID-000073',
    customer: 'Deepak Joshi',
    category: 'VIP',
    details: 'Chicken Sandwich + Cold Drink',
    estimatedCost: 3500,
    status: 'In Progress',
    approval: 'Approved',
    delivery: 'Preparing',
    assignedGre: 'Meera K.',
    location: 'Slot Machine 5',
    notes: 'Kitchen preparing order.',
  },
  {
    id: 'SRV-00042',
    serviceType: 'Ticket Booking',
    badge: '051',
    cid: 'CID-000051',
    customer: 'Priya Tamang',
    category: 'VIP',
    details: 'Kathmandu → Dubai',
    estimatedCost: 52000,
    status: 'Completed',
    approval: 'Approved',
    delivery: 'Ticket Issued',
    assignedGre: 'Reshma T.',
    location: 'CRM Desk',
    notes: 'E-ticket issued.',
  },
]

const emptyBooking = {
  cid: '',
  badge: '',
  customer: '',
  category: 'VIP',
  hotel: '',
  roomType: '',
  rooms: '1',
  checkIn: today,
  checkOut: '',
  estimatedCost: '',
  remarks: '',
}

const emptyService = {
  serviceType: 'Vehicle Assignment',
  cid: '',
  badge: '',
  customer: '',
  category: 'VIP',
  details: '',
  estimatedCost: '',
  assignedGre: '',
  approval: 'Pending',
  notes: '',
}

const CrmGreMarketing = () => {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [guests] = useState(initialGuests)
  const [bookings, setBookings] = useState(initialBookings)
  const [requests, setRequests] = useState(initialRequests)
  const [selectedGuest, setSelectedGuest] = useState(initialGuests[0])
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [selectedRequest, setSelectedRequest] = useState(initialRequests[0])

  const [guestSearch, setGuestSearch] = useState('')
  const [bookingSearch, setBookingSearch] = useState('')
  const [hotelFilter, setHotelFilter] = useState('All Hotels')
  const [bookingStatusFilter, setBookingStatusFilter] = useState('All Statuses')

  const [serviceSearch, setServiceSearch] = useState('')
  const [serviceTypeFilter, setServiceTypeFilter] = useState('All Service Types')
  const [serviceStatusFilter, setServiceStatusFilter] = useState('All Statuses')
  const [approvalFilter, setApprovalFilter] = useState('All Approval Statuses')

  const [modal, setModal] = useState(null)
  const [bookingForm, setBookingForm] = useState(emptyBooking)
  const [serviceForm, setServiceForm] = useState(emptyService)
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 3000)
  }

  const filteredGuests = useMemo(() => {
    const query = guestSearch.trim().toLowerCase()
    return guests.filter((guest) => {
      return (
        !query ||
        guest.name.toLowerCase().includes(query) ||
        guest.cid.toLowerCase().includes(query) ||
        guest.badge.includes(query) ||
        guest.location.toLowerCase().includes(query)
      )
    })
  }, [guestSearch, guests])

  const filteredBookings = useMemo(() => {
    const query = bookingSearch.trim().toLowerCase()
    return bookings.filter((booking) => {
      const searchMatch =
        !query ||
        booking.customer.toLowerCase().includes(query) ||
        booking.cid.toLowerCase().includes(query) ||
        booking.badge.includes(query) ||
        booking.id.toLowerCase().includes(query) ||
        booking.billNo.toLowerCase().includes(query)

      const hotelMatch =
        hotelFilter === 'All Hotels' || booking.hotel === hotelFilter

      const statusMatch =
        bookingStatusFilter === 'All Statuses' ||
        booking.verificationStatus === bookingStatusFilter ||
        booking.accountsStatus === bookingStatusFilter ||
        booking.receiptStatus === bookingStatusFilter

      return searchMatch && hotelMatch && statusMatch
    })
  }, [bookingSearch, bookingStatusFilter, bookings, hotelFilter])

  const filteredRequests = useMemo(() => {
    const query = serviceSearch.trim().toLowerCase()

    return requests.filter((request) => {
      const searchMatch =
        !query ||
        request.customer.toLowerCase().includes(query) ||
        request.cid.toLowerCase().includes(query) ||
        request.badge.includes(query) ||
        request.id.toLowerCase().includes(query) ||
        request.details.toLowerCase().includes(query)

      const typeMatch =
        serviceTypeFilter === 'All Service Types' ||
        request.serviceType === serviceTypeFilter

      const statusMatch =
        serviceStatusFilter === 'All Statuses' ||
        request.status === serviceStatusFilter

      const approvalMatch =
        approvalFilter === 'All Approval Statuses' ||
        request.approval === approvalFilter

      return searchMatch && typeMatch && statusMatch && approvalMatch
    })
  }, [
    approvalFilter,
    requests,
    serviceSearch,
    serviceStatusFilter,
    serviceTypeFilter,
  ])

  const dashboardStats = useMemo(() => {
    return {
      liveGuests: guests.length,
      vip: guests.filter((guest) => ['VIP', 'VVIP'].includes(guest.category))
        .length,
      pending: requests.filter((request) =>
        ['Pending', 'Pending Approval'].includes(request.status),
      ).length,
      hotelRooms: bookings.reduce(
        (total, booking) => total + Number(booking.rooms || 0),
        0,
      ),
      vehicleToday: requests.filter(
        (request) => request.serviceType === 'Vehicle Assignment',
      ).length,
      giftsToday: requests.filter(
        (request) => request.serviceType === 'Gift / Service',
      ).length,
      totalCost:
        bookings.reduce(
          (total, booking) => total + Number(booking.estimatedCost || 0),
          0,
        ) +
        requests.reduce(
          (total, request) => total + Number(request.estimatedCost || 0),
          0,
        ),
    }
  }, [bookings, guests, requests])

  const hotelStats = useMemo(() => {
    return {
      total: bookings.length,
      pendingReceipt: bookings.filter(
        (booking) => booking.receiptStatus === 'Pending Return',
      ).length,
      verified: bookings.filter(
        (booking) => booking.verificationStatus === 'Verified',
      ).length,
      accounts: bookings.filter(
        (booking) => booking.accountsStatus === 'Sent to Accounts',
      ).length,
      estimatedCost: bookings.reduce(
        (total, booking) => total + Number(booking.estimatedCost || 0),
        0,
      ),
    }
  }, [bookings])

  const serviceStats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((request) => request.approval === 'Pending')
        .length,
      inProgress: requests.filter(
        (request) => request.status === 'In Progress',
      ).length,
      completed: requests.filter(
        (request) => request.status === 'Completed',
      ).length,
    }
  }, [requests])

  const exportCsv = (filename, header, rows) => {
    const csv = [header, ...rows]
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
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
    showToast(`${filename} exported.`)
  }

  const exportGuests = () =>
    exportCsv(
      'crm-live-guests.csv',
      [
        'Badge',
        'CID',
        'Customer',
        'Category',
        'Location',
        'Play Status',
        'Buy-In',
        'Exposure',
        'Last Service',
        'Assigned GRE',
      ],
      filteredGuests.map((guest) => [
        guest.badge,
        guest.cid,
        guest.name,
        guest.category,
        guest.location,
        guest.playStatus,
        guest.buyIn,
        guest.exposure,
        guest.lastService,
        guest.gre,
      ]),
    )

  const exportBookings = () =>
    exportCsv(
      'crm-hotel-bookings.csv',
      [
        'Booking ID',
        'Bill No',
        'Badge',
        'CID',
        'Customer',
        'Category',
        'Hotel',
        'Room Type',
        'Rooms',
        'Check-In',
        'Check-Out',
        'Nights',
        'Estimated Cost',
        'Receipt Status',
        'Verification',
        'Accounts',
      ],
      filteredBookings.map((booking) => [
        booking.id,
        booking.billNo,
        booking.badge,
        booking.cid,
        booking.customer,
        booking.category,
        booking.hotel,
        booking.roomType,
        booking.rooms,
        booking.checkIn,
        booking.checkOut,
        booking.nights,
        booking.estimatedCost,
        booking.receiptStatus,
        booking.verificationStatus,
        booking.accountsStatus,
      ]),
    )

  const validateBooking = () => {
    const nextErrors = {}
    if (!bookingForm.customer.trim()) nextErrors.customer = 'Customer is required.'
    if (!bookingForm.cid.trim()) nextErrors.cid = 'CID is required.'
    if (!bookingForm.badge.trim()) nextErrors.badge = 'Badge is required.'
    if (!bookingForm.hotel) nextErrors.hotel = 'Hotel is required.'
    if (!bookingForm.roomType) nextErrors.roomType = 'Room type is required.'
    if (!bookingForm.checkIn) nextErrors.checkIn = 'Check-in date is required.'
    if (!bookingForm.checkOut) nextErrors.checkOut = 'Check-out date is required.'
    if (!bookingForm.estimatedCost || Number(bookingForm.estimatedCost) <= 0) {
      nextErrors.estimatedCost = 'Estimated cost must be greater than zero.'
    }

    if (
      bookingForm.checkIn &&
      bookingForm.checkOut &&
      bookingForm.checkOut <= bookingForm.checkIn
    ) {
      nextErrors.checkOut = 'Check-out must be after check-in.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const saveBooking = (mode) => {
    if (!validateBooking()) return

    const checkIn = new Date(bookingForm.checkIn)
    const checkOut = new Date(bookingForm.checkOut)
    const nights = Math.max(
      1,
      Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24)),
    )

    const nextNumber = bookings.length + 1
    const id = `HB-2026-0721-${String(nextNumber).padStart(3, '0')}`
    const billNo = `BILL-${id}`

    const record = {
      id,
      billNo,
      badge: bookingForm.badge.trim(),
      cid: bookingForm.cid.trim(),
      customer: bookingForm.customer.trim(),
      category: bookingForm.category,
      hotel: bookingForm.hotel,
      roomType: bookingForm.roomType,
      rooms: Number(bookingForm.rooms),
      checkIn: bookingForm.checkIn,
      checkOut: bookingForm.checkOut,
      nights,
      estimatedCost: Number(bookingForm.estimatedCost),
      receiptStatus: mode === 'receipt' ? 'Receipt Issued' : 'Pending Issue',
      verificationStatus: 'Not Verified',
      accountsStatus: 'Not Ready',
      remarks: bookingForm.remarks.trim(),
    }

    setBookings((current) => [record, ...current])
    setSelectedBooking(record)
    setBookingForm(emptyBooking)
    setErrors({})
    setModal(null)
    setActiveTab('Hotel Booking')
    showToast(
      mode === 'receipt'
        ? `Booking ${id} saved and receipt issued.`
        : `Booking ${id} saved successfully.`,
    )
  }

  const updateBookingStatus = (bookingId, changes, message) => {
    setBookings((current) =>
      current.map((booking) =>
        booking.id === bookingId ? { ...booking, ...changes } : booking,
      ),
    )

    setSelectedBooking((current) =>
      current?.id === bookingId ? { ...current, ...changes } : current,
    )

    showToast(message)
  }

  const validateService = () => {
    const nextErrors = {}
    if (!serviceForm.customer.trim()) nextErrors.customer = 'Customer is required.'
    if (!serviceForm.cid.trim()) nextErrors.cid = 'CID is required.'
    if (!serviceForm.badge.trim()) nextErrors.badge = 'Badge is required.'
    if (!serviceForm.details.trim()) nextErrors.details = 'Service details are required.'
    if (!serviceForm.assignedGre.trim()) nextErrors.assignedGre = 'Assigned GRE is required.'
    if (!serviceForm.estimatedCost || Number(serviceForm.estimatedCost) < 0) {
      nextErrors.estimatedCost = 'Enter a valid estimated cost.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const saveServiceRequest = () => {
    if (!validateService()) return

    const id = `SRV-${String(49 + requests.length).padStart(5, '0')}`
    const record = {
      id,
      serviceType: serviceForm.serviceType,
      badge: serviceForm.badge.trim(),
      cid: serviceForm.cid.trim(),
      customer: serviceForm.customer.trim(),
      category: serviceForm.category,
      details: serviceForm.details.trim(),
      estimatedCost: Number(serviceForm.estimatedCost),
      status: serviceForm.approval === 'Approved' ? 'In Progress' : 'Pending Approval',
      approval: serviceForm.approval,
      delivery: '—',
      assignedGre: serviceForm.assignedGre.trim(),
      location: 'CRM / GRE Desk',
      notes: serviceForm.notes.trim(),
    }

    setRequests((current) => [record, ...current])
    setSelectedRequest(record)
    setModal(null)
    setServiceForm(emptyService)
    setErrors({})
    setActiveTab(
      record.serviceType === 'Vehicle Assignment'
        ? 'Vehicle Assignment'
        : record.serviceType === 'Gift / Service'
          ? 'Gifts & Services'
          : record.serviceType === 'Food (F&B)'
            ? 'Food (F&B) Requests'
            : 'Ticket Booking',
    )
    showToast(`${record.id} created successfully.`)
  }

  const updateRequest = (requestId, changes, message) => {
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId ? { ...request, ...changes } : request,
      ),
    )

    setSelectedRequest((current) =>
      current?.id === requestId ? { ...current, ...changes } : current,
    )

    showToast(message)
  }

  const openBookingForGuest = (guest = selectedGuest) => {
    setBookingForm({
      ...emptyBooking,
      cid: guest?.cid || '',
      badge: guest?.badge || '',
      customer: guest?.name || '',
      category: guest?.category || 'VIP',
    })
    setErrors({})
    setModal('booking')
  }

  const openServiceForGuest = (serviceType, guest = selectedGuest) => {
    setServiceForm({
      ...emptyService,
      serviceType,
      cid: guest?.cid || '',
      badge: guest?.badge || '',
      customer: guest?.name || '',
      category: guest?.category || 'VIP',
      assignedGre: guest?.gre || '',
    })
    setErrors({})
    setModal('service')
  }

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
    <div className="space-y-5 text-slate-900">
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-black tracking-tight text-slate-950">
            <span className="mr-2 text-amber-400">◆</span>
            CRM / GRE / Marketing
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Guest services, hotel bookings, transport, gifts, tickets, food requests and service history.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ActionButton label="+ New Hotel Booking" onClick={() => openBookingForGuest()} primary />
          <ActionButton label="🚗 Assign Vehicle" onClick={() => openServiceForGuest('Vehicle Assignment')} />
          <ActionButton label="🎫 Book Ticket" onClick={() => openServiceForGuest('Ticket Booking')} />
          <ActionButton label="🎁 Issue Gift / Service" onClick={() => openServiceForGuest('Gift / Service')} />
        </div>
      </section>

      <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab}
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
          stats={dashboardStats}
          guests={filteredGuests}
          guestSearch={guestSearch}
          setGuestSearch={setGuestSearch}
          selectedGuest={selectedGuest}
          setSelectedGuest={setSelectedGuest}
          exportGuests={exportGuests}
          openBookingForGuest={openBookingForGuest}
          openServiceForGuest={openServiceForGuest}
          requests={requests}
          setSelectedRequest={setSelectedRequest}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'Hotel Booking' && (
        <HotelBookingView
          stats={hotelStats}
          bookings={filteredBookings}
          search={bookingSearch}
          setSearch={setBookingSearch}
          hotelFilter={hotelFilter}
          setHotelFilter={setHotelFilter}
          statusFilter={bookingStatusFilter}
          setStatusFilter={setBookingStatusFilter}
          openBooking={() => openBookingForGuest()}
          exportBookings={exportBookings}
          selectedBooking={selectedBooking}
          setSelectedBooking={setSelectedBooking}
          updateBookingStatus={updateBookingStatus}
        />
      )}

      {[
        'Vehicle Assignment',
        'Gifts & Services',
        'Food (F&B) Requests',
        'Ticket Booking',
        'Service Records',
      ].includes(activeTab) && (
        <ServiceRequestsView
          activeTab={activeTab}
          stats={serviceStats}
          requests={filteredRequests}
          search={serviceSearch}
          setSearch={setServiceSearch}
          typeFilter={serviceTypeFilter}
          setTypeFilter={setServiceTypeFilter}
          statusFilter={serviceStatusFilter}
          setStatusFilter={setServiceStatusFilter}
          approvalFilter={approvalFilter}
          setApprovalFilter={setApprovalFilter}
          selectedRequest={selectedRequest}
          setSelectedRequest={setSelectedRequest}
          openRequest={() =>
            openServiceForGuest(
              activeTab === 'Gifts & Services'
                ? 'Gift / Service'
                : activeTab === 'Food (F&B) Requests'
                  ? 'Food (F&B)'
                  : activeTab === 'Ticket Booking'
                    ? 'Ticket Booking'
                    : 'Vehicle Assignment',
            )
          }
          updateRequest={updateRequest}
        />
      )}

      {modal === 'booking' && (
        <ModalOverlay onClose={() => setModal(null)}>
          <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title="New Hotel Booking"
              description="Create a hotel booking, issue the guest receipt and track hotel bill verification."
              onClose={() => setModal(null)}
            />

            <div className="max-h-[76vh] overflow-y-auto p-5">
              <div className="grid gap-5 lg:grid-cols-[1fr_1fr_320px]">
                <FormSection title="1. Customer & Booking">
                  <InputField label="CID" value={bookingForm.cid} error={errors.cid} onChange={(value) => setBookingForm((current) => ({ ...current, cid: value }))} />
                  <InputField label="Badge" value={bookingForm.badge} error={errors.badge} onChange={(value) => setBookingForm((current) => ({ ...current, badge: value }))} />
                  <InputField label="Customer Name" value={bookingForm.customer} error={errors.customer} onChange={(value) => setBookingForm((current) => ({ ...current, customer: value }))} />
                  <SelectField label="Category" value={bookingForm.category} options={['VIP', 'VVIP', 'STANDARD']} onChange={(value) => setBookingForm((current) => ({ ...current, category: value }))} />
                  <SelectField label="Hotel" value={bookingForm.hotel} error={errors.hotel} options={['Summit Grand Hotel', 'Hotel Everest Crown', 'Hyatt Kathmandu', 'Soaltee Hotel']} onChange={(value) => setBookingForm((current) => ({ ...current, hotel: value }))} />
                  <SelectField label="Room Type" value={bookingForm.roomType} error={errors.roomType} options={['Deluxe King', 'Executive Suite', 'Twin Room', 'Presidential Suite']} onChange={(value) => setBookingForm((current) => ({ ...current, roomType: value }))} />
                </FormSection>

                <FormSection title="2. Stay & Cost">
                  <SelectField label="Room Quantity" value={bookingForm.rooms} options={['1', '2', '3', '4']} onChange={(value) => setBookingForm((current) => ({ ...current, rooms: value }))} />
                  <InputField label="Check-In Date" type="date" value={bookingForm.checkIn} error={errors.checkIn} onChange={(value) => setBookingForm((current) => ({ ...current, checkIn: value }))} />
                  <InputField label="Check-Out Date" type="date" value={bookingForm.checkOut} error={errors.checkOut} onChange={(value) => setBookingForm((current) => ({ ...current, checkOut: value }))} />
                  <InputField label="Estimated Cost" type="number" value={bookingForm.estimatedCost} error={errors.estimatedCost} onChange={(value) => setBookingForm((current) => ({ ...current, estimatedCost: value }))} />
                  <TextAreaField label="Remarks" value={bookingForm.remarks} onChange={(value) => setBookingForm((current) => ({ ...current, remarks: value }))} />
                </FormSection>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Booking Summary</h3>
                    <div className="mt-4 space-y-3">
                      <DetailLine label="Customer" value={bookingForm.customer || '—'} />
                      <DetailLine label="Category" value={bookingForm.category} />
                      <DetailLine label="Hotel" value={bookingForm.hotel || '—'} />
                      <DetailLine label="Room Type" value={bookingForm.roomType || '—'} />
                      <DetailLine label="Rooms" value={bookingForm.rooms} />
                      <DetailLine label="Estimated Cost" value={money(bookingForm.estimatedCost)} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                    <p className="font-black">Operational workflow</p>
                    <p className="mt-2 leading-6">
                      Issue receipt → guest submits it to hotel → hotel returns bill and original receipt → GRE verifies → verified bill is sent to Accounts.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4">
              <ActionButton label="Cancel" onClick={() => setModal(null)} />
              <ActionButton label="Save Booking" onClick={() => saveBooking('save')} />
              <ActionButton label="Save & Issue Receipt" onClick={() => saveBooking('receipt')} primary />
            </div>
          </div>
        </ModalOverlay>
      )}

      {modal === 'service' && (
        <ModalOverlay onClose={() => setModal(null)}>
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title="New Service Request"
              description="Create a vehicle, gift, food or ticket request for the selected guest."
              onClose={() => setModal(null)}
            />

            <div className="max-h-[76vh] overflow-y-auto p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Service Type"
                  value={serviceForm.serviceType}
                  options={['Vehicle Assignment', 'Gift / Service', 'Food (F&B)', 'Ticket Booking']}
                  onChange={(value) => setServiceForm((current) => ({ ...current, serviceType: value }))}
                />
                <SelectField
                  label="Category"
                  value={serviceForm.category}
                  options={['VIP', 'VVIP', 'STANDARD']}
                  onChange={(value) => setServiceForm((current) => ({ ...current, category: value }))}
                />
                <InputField label="CID" value={serviceForm.cid} error={errors.cid} onChange={(value) => setServiceForm((current) => ({ ...current, cid: value }))} />
                <InputField label="Badge" value={serviceForm.badge} error={errors.badge} onChange={(value) => setServiceForm((current) => ({ ...current, badge: value }))} />
                <InputField label="Customer Name" value={serviceForm.customer} error={errors.customer} onChange={(value) => setServiceForm((current) => ({ ...current, customer: value }))} />
                <InputField label="Assigned GRE" value={serviceForm.assignedGre} error={errors.assignedGre} onChange={(value) => setServiceForm((current) => ({ ...current, assignedGre: value }))} />
                <div className="sm:col-span-2">
                  <TextAreaField label="Service Details" value={serviceForm.details} error={errors.details} onChange={(value) => setServiceForm((current) => ({ ...current, details: value }))} />
                </div>
                <InputField label="Estimated Cost" type="number" value={serviceForm.estimatedCost} error={errors.estimatedCost} onChange={(value) => setServiceForm((current) => ({ ...current, estimatedCost: value }))} />
                <SelectField label="Approval" value={serviceForm.approval} options={['Pending', 'Approved', 'Not Required']} onChange={(value) => setServiceForm((current) => ({ ...current, approval: value }))} />
                <div className="sm:col-span-2">
                  <TextAreaField label="Notes" value={serviceForm.notes} onChange={(value) => setServiceForm((current) => ({ ...current, notes: value }))} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4">
              <ActionButton label="Cancel" onClick={() => setModal(null)} />
              <ActionButton label="Create Request" onClick={saveServiceRequest} primary />
            </div>
          </div>
        </ModalOverlay>
      )}

      {toast && (
        <div className={`fixed bottom-5 right-5 z-[200] max-w-sm rounded-xl border px-4 py-3 text-sm font-bold shadow-xl ${
          toast.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

const DashboardView = ({
  stats,
  guests,
  guestSearch,
  setGuestSearch,
  selectedGuest,
  setSelectedGuest,
  exportGuests,
  openBookingForGuest,
  openServiceForGuest,
  requests,
  setSelectedRequest,
  setActiveTab,
}) => (
  <>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
      <SummaryCard label="Live Guests" value={stats.liveGuests} icon="👥" />
      <SummaryCard label="VIP / VVIP Active" value={stats.vip} icon="👑" />
      <SummaryCard label="Pending Requests" value={stats.pending} icon="📋" />
      <SummaryCard label="Hotel Rooms Allocated" value={stats.hotelRooms} icon="🏨" />
      <SummaryCard label="Vehicle Requests" value={stats.vehicleToday} icon="🚗" />
      <SummaryCard label="Gifts / Services" value={stats.giftsToday} icon="🎁" />
      <SummaryCard label="Total Service Cost" value={money(stats.totalCost)} icon="💰" />
    </section>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_380px]">
      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Live Guests / Active Customers</h2>
            </div>
            <input className={inputClass} value={guestSearch} onChange={(event) => setGuestSearch(event.target.value)} placeholder="Search guest, CID, badge or location..." />
            <ActionButton label="Export CSV" onClick={exportGuests} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  {['Badge', 'Customer', 'Category', 'Current Location', 'Play Status', 'Today Buy-In', 'Wallet / Exposure', 'Last Service', 'GRE', 'Action'].map((heading) => (
                    <th key={heading} className="px-4 py-3">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {guests.map((guest) => (
                  <tr key={guest.badge} className={selectedGuest?.badge === guest.badge ? 'bg-amber-50/60' : 'hover:bg-slate-50'}>
                    <td className="px-4 py-4"><BadgeNumber value={guest.badge} /></td>
                    <td className="px-4 py-4"><p className="font-black text-slate-950">{guest.name}</p><p className="text-xs text-slate-500">{guest.cid}</p></td>
                    <td className="px-4 py-4"><StatusPill value={guest.category} /></td>
                    <td className="px-4 py-4">{guest.location}</td>
                    <td className="px-4 py-4"><StatusPill value={guest.playStatus} /></td>
                    <td className="px-4 py-4 font-bold">{money(guest.buyIn)}</td>
                    <td className={`px-4 py-4 font-black ${guest.exposure < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{money(guest.exposure)}</td>
                    <td className="px-4 py-4">{guest.lastService}</td>
                    <td className="px-4 py-4 font-semibold">{guest.gre}</td>
                    <td className="px-4 py-4"><ActionButton label="View" onClick={() => setSelectedGuest(guest)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Pending Service Requests</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {requests.slice(0, 5).map((request) => (
              <button
                type="button"
                key={request.id}
                onClick={() => {
                  setSelectedRequest(request)
                  setActiveTab('Service Records')
                }}
                className="grid w-full grid-cols-[120px_1fr_130px_130px] gap-3 px-5 py-4 text-left text-sm hover:bg-slate-50"
              >
                <span className="font-mono font-black text-sky-700">{request.id}</span>
                <span><strong>{request.customer}</strong><br /><span className="text-xs text-slate-500">{request.serviceType} · {request.details}</span></span>
                <span className="font-bold">{money(request.estimatedCost)}</span>
                <StatusPill value={request.status} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <aside className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Selected Customer Service Profile</h2>
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <h3 className="font-serif text-2xl font-black">{selectedGuest.name}</h3>
            <p className="mt-1 text-sm text-slate-500">Badge {selectedGuest.badge} · {selectedGuest.category}</p>
          </div>
          <div className="mt-4 space-y-3">
            <DetailLine label="CID" value={selectedGuest.cid} />
            <DetailLine label="Current Location" value={selectedGuest.location} />
            <DetailLine label="Play Status" value={selectedGuest.playStatus} />
            <DetailLine label="Today Buy-In" value={money(selectedGuest.buyIn)} />
            <DetailLine label="Wallet / Exposure" value={money(selectedGuest.exposure)} />
            <DetailLine label="Assigned GRE" value={selectedGuest.gre} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <ActionButton label="Book Hotel" onClick={() => openBookingForGuest(selectedGuest)} />
            <ActionButton label="Arrange Travel" onClick={() => openServiceForGuest('Vehicle Assignment', selectedGuest)} />
            <ActionButton label="Book Ticket" onClick={() => openServiceForGuest('Ticket Booking', selectedGuest)} />
            <ActionButton label="Issue Gift" onClick={() => openServiceForGuest('Gift / Service', selectedGuest)} />
            <div className="col-span-2"><ActionButton label="Request F&B" onClick={() => openServiceForGuest('Food (F&B)', selectedGuest)} full /></div>
          </div>
        </div>
      </aside>
    </section>
  </>
)

const HotelBookingView = ({
  stats,
  bookings,
  search,
  setSearch,
  hotelFilter,
  setHotelFilter,
  statusFilter,
  setStatusFilter,
  openBooking,
  exportBookings,
  selectedBooking,
  setSelectedBooking,
  updateBookingStatus,
}) => (
  <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_330px]">
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-black">Hotel Booking Records</h2>
          <p className="mt-1 text-sm text-slate-500">Issue receipts, verify returned hotel documents and forward verified bills to Accounts.</p>
        </div>
        <ActionButton label="+ New Booking" onClick={openBooking} primary />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard label="Total Bookings" value={stats.total} icon="🏨" />
        <SummaryCard label="Pending Receipt Return" value={stats.pendingReceipt} icon="📄" />
        <SummaryCard label="Verified" value={stats.verified} icon="✅" />
        <SummaryCard label="Sent to Accounts" value={stats.accounts} icon="💰" />
        <SummaryCard label="Estimated Cost" value={money(stats.estimatedCost)} icon="🌕" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-4">
          <input className={inputClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search booking, bill, customer, CID or badge..." />
          <select className={inputClass} value={hotelFilter} onChange={(event) => setHotelFilter(event.target.value)}>
            <option>All Hotels</option>
            <option>Summit Grand Hotel</option>
            <option>Hotel Everest Crown</option>
            <option>Hyatt Kathmandu</option>
            <option>Soaltee Hotel</option>
          </select>
          <select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>All Statuses</option>
            <option>Receipt Returned</option>
            <option>Pending Return</option>
            <option>Verified</option>
            <option>Not Verified</option>
            <option>Ready for Accounts</option>
            <option>Sent to Accounts</option>
          </select>
          <ActionButton label="Export CSV" onClick={exportBookings} full />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1350px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-[0.14em] text-slate-500">
              <tr>
                {['Booking ID', 'Bill No', 'Badge', 'CID', 'Customer', 'Category', 'Hotel', 'Room Type', 'Rooms', 'Check-In', 'Check-Out', 'Nights', 'Estimated Cost', 'Receipt', 'Verification', 'Accounts', 'Action'].map((heading) => (
                  <th key={heading} className="px-3 py-3">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((booking) => (
                <tr key={booking.id} className={selectedBooking?.id === booking.id ? 'bg-amber-50/60' : 'hover:bg-slate-50'}>
                  <td className="px-3 py-4 font-mono font-black text-sky-700">{booking.id}</td>
                  <td className="px-3 py-4 font-mono text-xs">{booking.billNo}</td>
                  <td className="px-3 py-4"><BadgeNumber value={booking.badge} /></td>
                  <td className="px-3 py-4">{booking.cid}</td>
                  <td className="px-3 py-4 font-black">{booking.customer}</td>
                  <td className="px-3 py-4"><StatusPill value={booking.category} /></td>
                  <td className="px-3 py-4">{booking.hotel}</td>
                  <td className="px-3 py-4">{booking.roomType}</td>
                  <td className="px-3 py-4">{booking.rooms}</td>
                  <td className="px-3 py-4">{booking.checkIn}</td>
                  <td className="px-3 py-4">{booking.checkOut}</td>
                  <td className="px-3 py-4">{booking.nights}</td>
                  <td className="px-3 py-4 font-black">{money(booking.estimatedCost)}</td>
                  <td className="px-3 py-4"><StatusPill value={booking.receiptStatus} /></td>
                  <td className="px-3 py-4"><StatusPill value={booking.verificationStatus} /></td>
                  <td className="px-3 py-4"><StatusPill value={booking.accountsStatus} /></td>
                  <td className="px-3 py-4"><ActionButton label="View" onClick={() => setSelectedBooking(booking)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <aside className="space-y-4">
      {selectedBooking ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Selected Booking</h3>
          <p className="mt-4 font-mono text-lg font-black text-sky-700">{selectedBooking.id}</p>
          <p className="mt-1 text-xl font-black">{selectedBooking.customer}</p>
          <div className="mt-4 space-y-3">
            <DetailLine label="Hotel" value={selectedBooking.hotel} />
            <DetailLine label="Stay" value={`${selectedBooking.checkIn} → ${selectedBooking.checkOut}`} />
            <DetailLine label="Estimated Cost" value={money(selectedBooking.estimatedCost)} />
            <DetailLine label="Receipt" value={selectedBooking.receiptStatus} />
            <DetailLine label="Verification" value={selectedBooking.verificationStatus} />
            <DetailLine label="Accounts" value={selectedBooking.accountsStatus} />
          </div>
          <div className="mt-5 space-y-2">
            {selectedBooking.receiptStatus !== 'Receipt Returned' && (
              <ActionButton full label="Mark Receipt Returned" onClick={() => updateBookingStatus(selectedBooking.id, { receiptStatus: 'Receipt Returned' }, 'Receipt marked as returned.')} />
            )}
            {selectedBooking.verificationStatus !== 'Verified' && (
              <ActionButton full label="Verify Returned Documents" onClick={() => updateBookingStatus(selectedBooking.id, { receiptStatus: 'Receipt Returned', verificationStatus: 'Verified', accountsStatus: 'Ready for Accounts' }, 'Hotel bill and receipt verified.')} primary />
            )}
            {selectedBooking.verificationStatus === 'Verified' && selectedBooking.accountsStatus !== 'Sent to Accounts' && (
              <ActionButton full label="Forward to Accounts" onClick={() => updateBookingStatus(selectedBooking.id, { accountsStatus: 'Sent to Accounts' }, 'Verified hotel bill forwarded to Accounts.')} primary />
            )}
          </div>
        </div>
      ) : (
        <EmptyPanel text="Select a hotel booking to review receipt, verification and Accounts status." />
      )}
    </aside>
  </section>
)

const ServiceRequestsView = ({
  activeTab,
  stats,
  requests,
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  approvalFilter,
  setApprovalFilter,
  selectedRequest,
  setSelectedRequest,
  openRequest,
  updateRequest,
}) => {
  const tabType =
    activeTab === 'Vehicle Assignment'
      ? 'Vehicle Assignment'
      : activeTab === 'Gifts & Services'
        ? 'Gift / Service'
        : activeTab === 'Food (F&B) Requests'
          ? 'Food (F&B)'
          : activeTab === 'Ticket Booking'
            ? 'Ticket Booking'
            : null

  const visibleRequests = tabType
    ? requests.filter((request) => request.serviceType === tabType)
    : requests

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_340px]">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-black">{activeTab}</h2>
            <p className="mt-1 text-sm text-slate-500">Create, approve, deliver and complete guest service requests.</p>
          </div>
          <ActionButton label="+ New Service Request" onClick={openRequest} primary />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Total Requests" value={stats.total} icon="📋" />
          <SummaryCard label="Pending Approval" value={stats.pending} icon="🎁" />
          <SummaryCard label="In Progress" value={stats.inProgress} icon="🔔" />
          <SummaryCard label="Completed" value={stats.completed} icon="✅" />
        </div>

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
          <input className={inputClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search request, CID, badge, customer..." />
          <select className={inputClass} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option>All Service Types</option>
            <option>Vehicle Assignment</option>
            <option>Gift / Service</option>
            <option>Food (F&B)</option>
            <option>Ticket Booking</option>
          </select>
          <select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>All Statuses</option>
            <option>Pending</option>
            <option>Pending Approval</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>
          <select className={inputClass} value={approvalFilter} onChange={(event) => setApprovalFilter(event.target.value)}>
            <option>All Approval Statuses</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Not Required</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Service Request Records</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  {['Request ID', 'Service Type', 'Customer', 'CID / Badge', 'Details', 'Est. Cost', 'Status', 'Approval', 'Delivery', 'Assigned GRE', 'Action'].map((heading) => (
                    <th key={heading} className="px-4 py-3">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRequests.map((request) => (
                  <tr key={request.id} className={selectedRequest?.id === request.id ? 'bg-amber-50/60' : 'hover:bg-slate-50'}>
                    <td className="px-4 py-4 font-mono font-black text-sky-700">{request.id}</td>
                    <td className="px-4 py-4 font-black">{request.serviceType}</td>
                    <td className="px-4 py-4"><p className="font-black">{request.customer}</p><StatusPill value={request.category} /></td>
                    <td className="px-4 py-4">{request.cid}<br />Badge {request.badge}</td>
                    <td className="px-4 py-4">{request.details}</td>
                    <td className="px-4 py-4 font-black">{money(request.estimatedCost)}</td>
                    <td className="px-4 py-4"><StatusPill value={request.status} /></td>
                    <td className="px-4 py-4"><StatusPill value={request.approval} /></td>
                    <td className="px-4 py-4"><StatusPill value={request.delivery} /></td>
                    <td className="px-4 py-4 font-semibold">{request.assignedGre}</td>
                    <td className="px-4 py-4"><ActionButton label="View" onClick={() => setSelectedRequest(request)} /></td>
                  </tr>
                ))}
                {visibleRequests.length === 0 && (
                  <tr><td colSpan={11} className="px-5 py-16 text-center text-slate-500">No service requests match the selected filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        {selectedRequest ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Selected Request Details</h3>
            <p className="mt-4 font-mono text-xl font-black">{selectedRequest.id}</p>
            <div className="mt-2"><StatusPill value={selectedRequest.status} /></div>
            <p className="mt-4 text-lg font-black text-amber-700">{selectedRequest.serviceType}</p>
            <p className="mt-1 text-sm text-slate-500">{selectedRequest.details}</p>

            <div className="mt-5 space-y-3 border-t border-slate-200 pt-5">
              <DetailLine label="Customer" value={selectedRequest.customer} />
              <DetailLine label="CID / Badge" value={`${selectedRequest.cid} / ${selectedRequest.badge}`} />
              <DetailLine label="Category" value={selectedRequest.category} />
              <DetailLine label="Current Location" value={selectedRequest.location} />
              <DetailLine label="Assigned GRE" value={selectedRequest.assignedGre} />
              <DetailLine label="Estimated Cost" value={money(selectedRequest.estimatedCost)} />
              <DetailLine label="Approval" value={selectedRequest.approval} />
              <DetailLine label="Delivery" value={selectedRequest.delivery} />
            </div>

            <div className="mt-5 space-y-2">
              {selectedRequest.approval === 'Pending' && (
                <ActionButton full label="Approve Request" primary onClick={() => updateRequest(selectedRequest.id, { approval: 'Approved', status: 'In Progress' }, 'Service request approved.')} />
              )}
              {selectedRequest.status !== 'Completed' && selectedRequest.approval !== 'Pending' && (
                <ActionButton full label="Mark Completed / Delivered" primary onClick={() => updateRequest(selectedRequest.id, { status: 'Completed', delivery: selectedRequest.serviceType === 'Ticket Booking' ? 'Ticket Issued' : 'Delivered' }, 'Service request completed.')} />
              )}
              <ActionButton full label="Print Service Slip" onClick={() => window.print()} />
            </div>
          </div>
        ) : (
          <EmptyPanel text="Select a service request to review and update it." />
        )}
      </aside>
    </section>
  )
}

const SummaryCard = ({ label, value, icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-xl">{icon}</span>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <p className="mt-2 font-serif text-2xl font-black text-slate-950">{value}</p>
      </div>
    </div>
  </div>
)

const ActionButton = ({ label, onClick, primary, full }) => (
  <button
    type="button"
    onClick={onClick}
    className={`${full ? 'w-full' : ''} rounded-lg border px-4 py-2.5 text-sm font-black transition ${
      primary
        ? 'border-amber-400 bg-amber-400 text-slate-950 hover:bg-amber-300'
        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
    }`}
  >
    {label}
  </button>
)

const BadgeNumber = ({ value }) => (
  <span className="inline-flex rounded-md border border-amber-300 bg-amber-50 px-3 py-1 font-mono font-black text-amber-700">{value}</span>
)

const StatusPill = ({ value }) => {
  const text = String(value || '—')
  const normalized = text.toLowerCase()
  const success = ['approved', 'completed', 'delivered', 'verified', 'playing', 'receipt returned', 'ready for accounts', 'sent to accounts', 'ticket issued'].some((item) => normalized.includes(item))
  const warning = ['pending', 'waiting', 'not verified', 'not ready', 'preparing', 'scheduled', 'receipt issued'].some((item) => normalized.includes(item))
  const info = ['in progress', 'break', 'vip', 'vvip'].some((item) => normalized.includes(item))

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
      success
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : warning
          ? 'border-amber-200 bg-amber-50 text-amber-700'
          : info
            ? 'border-sky-200 bg-sky-50 text-sky-700'
            : 'border-slate-200 bg-slate-50 text-slate-600'
    }`}>
      {text}
    </span>
  )
}

const DetailLine = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="text-right font-black text-slate-900">{value}</span>
  </div>
)

const EmptyPanel = ({ text }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">{text}</div>
)

const ModalOverlay = ({ children, onClose }) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}
  >
    {children}
  </div>
)

const ModalHeader = ({ title, description, onClose }) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
    <div>
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 rotate-45 bg-amber-400" />
        <h2 className="font-serif text-2xl font-black text-slate-950">{title}</h2>
      </div>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
    <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-500 hover:bg-slate-100">×</button>
  </div>
)

const FormSection = ({ title, children }) => (
  <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
    <h3 className="font-serif text-xl font-black text-slate-950">{title}</h3>
    {children}
  </div>
)

const InputField = ({ label, value, onChange, error, type = 'text' }) => (
  <label className="block">
    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
    <input
      type={type}
      min={type === 'number' ? 0 : undefined}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`${inputClass} ${error ? 'border-red-300' : ''}`}
    />
    {error && <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>}
  </label>
)

const SelectField = ({ label, value, onChange, options, error }) => (
  <label className="block">
    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClass} ${error ? 'border-red-300' : ''}`}>
      <option value="">Select</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
    {error && <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>}
  </label>
)

const TextAreaField = ({ label, value, onChange, error }) => (
  <label className="block">
    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
    <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className={`w-full resize-none rounded-lg border bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 ${error ? 'border-red-300' : 'border-slate-200'}`} />
    {error && <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>}
  </label>
)

const inputClass =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'

export default CrmGreMarketing
