import { useMemo, useState } from 'react'

const initialSessions = [
  {
    id: 1,
    badge: '087',
    cid: 'CID-1001',
    customer: 'Raj Sharma',
    initials: 'RS',
    nationality: 'Nepali',
    category: 'VIP',
    purpose: 'Gaming',
    entryTime: '14:05',
    exitTime: '',
    currentLocation: 'Baccarat Table 2',
    sessionStatus: 'ACTIVE',
    badgeStatus: 'ACTIVE',
    clearanceStatus: 'NOT_REQUESTED',
    recordedBy: 'Rina Reception',
  },
  {
    id: 2,
    badge: '044',
    cid: 'CID-1002',
    customer: 'Amit Verma',
    initials: 'AV',
    nationality: 'Indian',
    category: 'NORMAL',
    purpose: 'Gaming',
    entryTime: '14:22',
    exitTime: '',
    currentLocation: 'Slot Machine 7',
    sessionStatus: 'PLAYING',
    badgeStatus: 'ACTIVE',
    clearanceStatus: 'NOT_REQUESTED',
    recordedBy: 'Rina Reception',
  },
  {
    id: 3,
    badge: '112',
    cid: 'CID-1003',
    customer: 'Daniel Smith',
    initials: 'DS',
    nationality: 'British',
    category: 'VVIP',
    purpose: 'Gaming',
    entryTime: '15:10',
    exitTime: '',
    currentLocation: 'Roulette Table 1',
    sessionStatus: 'PLAYING',
    badgeStatus: 'ACTIVE',
    clearanceStatus: 'NOT_REQUESTED',
    recordedBy: 'Rina Reception',
  },
  {
    id: 4,
    badge: '026',
    cid: 'CID-1004',
    customer: 'Suresh Rai',
    initials: 'SR',
    nationality: 'Nepali',
    category: 'STANDARD',
    purpose: 'Food / Beverage',
    entryTime: '13:12',
    exitTime: '15:48',
    currentLocation: 'Exited',
    sessionStatus: 'CLOSED',
    badgeStatus: 'RETURNED',
    clearanceStatus: 'CLEARED',
    recordedBy: 'Rina Reception',
  },
  {
    id: 5,
    badge: '051',
    cid: 'CID-1005',
    customer: 'Priya Tamang',
    initials: 'PT',
    nationality: 'Nepali',
    category: 'VIP',
    purpose: 'Gaming',
    entryTime: '15:31',
    exitTime: '',
    currentLocation: 'Cashier',
    sessionStatus: 'EXIT_PENDING',
    badgeStatus: 'ACTIVE',
    clearanceStatus: 'PENDING',
    recordedBy: 'Rina Reception',
  },
  {
    id: 6,
    badge: '099',
    cid: 'CID-1006',
    customer: 'Ahmed Khan',
    initials: 'AK',
    nationality: 'UAE',
    category: 'STANDARD',
    purpose: 'Hotel / CRM Service',
    entryTime: '13:42',
    exitTime: '',
    currentLocation: 'Bar Lounge',
    sessionStatus: 'ACTIVE',
    badgeStatus: 'ACTIVE',
    clearanceStatus: 'NOT_REQUESTED',
    recordedBy: 'Rina Reception',
  },
]

const availableBadges = [
  '001',
  '002',
  '007',
  '018',
  '033',
  '053',
  '063',
  '078',
  '121',
  '133',
  '144',
  '150',
  '168',
]

const statusStyles = {
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PLAYING: 'border-sky-200 bg-sky-50 text-sky-700',
  CLOSED: 'border-slate-200 bg-slate-100 text-slate-600',
  EXIT_PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  RETURNED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  LOST: 'border-red-200 bg-red-50 text-red-700',
  DAMAGED: 'border-orange-200 bg-orange-50 text-orange-700',
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  CLEARED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  NOT_REQUESTED: 'border-slate-200 bg-slate-50 text-slate-500',
}

const formatStatus = (value = '') =>
  value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const getCurrentTime = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

const DailyBadgeSessions = () => {
  const [sessions, setSessions] = useState(initialSessions)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [badgeFilter, setBadgeFilter] = useState('ALL')
  const [selectedSession, setSelectedSession] = useState(initialSessions[0])
  const [showNewSessionModal, setShowNewSessionModal] = useState(false)
  const [showBadgeBoard, setShowBadgeBoard] = useState(false)

  const [newSession, setNewSession] = useState({
    cid: '',
    customer: '',
    nationality: 'Nepali',
    category: 'NORMAL',
    purpose: 'Gaming',
    badge: availableBadges[0],
  })

  const summary = useMemo(() => {
    return {
      total: sessions.length,
      active: sessions.filter((item) =>
        ['ACTIVE', 'PLAYING'].includes(item.sessionStatus),
      ).length,
      exitPending: sessions.filter(
        (item) => item.sessionStatus === 'EXIT_PENDING',
      ).length,
      closed: sessions.filter((item) => item.sessionStatus === 'CLOSED').length,
      badgesActive: sessions.filter((item) => item.badgeStatus === 'ACTIVE')
        .length,
      badgesReturned: sessions.filter(
        (item) => item.badgeStatus === 'RETURNED',
      ).length,
      clearancePending: sessions.filter(
        (item) => item.clearanceStatus === 'PENDING',
      ).length,
      lostOrDamaged: sessions.filter((item) =>
        ['LOST', 'DAMAGED'].includes(item.badgeStatus),
      ).length,
    }
  }, [sessions])

  const filteredSessions = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return sessions.filter((session) => {
      const matchesSearch =
        !search ||
        session.badge.toLowerCase().includes(search) ||
        session.cid.toLowerCase().includes(search) ||
        session.customer.toLowerCase().includes(search) ||
        session.currentLocation.toLowerCase().includes(search)

      const matchesStatus =
        statusFilter === 'ALL' || session.sessionStatus === statusFilter

      const matchesBadge =
        badgeFilter === 'ALL' || session.badgeStatus === badgeFilter

      return matchesSearch && matchesStatus && matchesBadge
    })
  }, [sessions, searchTerm, statusFilter, badgeFilter])

  const updateSession = (id, updates) => {
    setSessions((current) =>
      current.map((session) =>
        session.id === id ? { ...session, ...updates } : session,
      ),
    )

    setSelectedSession((current) =>
      current?.id === id ? { ...current, ...updates } : current,
    )
  }

  const requestExit = (session) => {
    updateSession(session.id, {
      sessionStatus: 'EXIT_PENDING',
      clearanceStatus: 'PENDING',
      currentLocation: 'Exit Gate',
    })
  }

  const approveClearance = (session) => {
    updateSession(session.id, {
      clearanceStatus: 'CLEARED',
    })
  }

  const completeExit = (session) => {
    if (session.clearanceStatus !== 'CLEARED') {
      window.alert('Exit clearance must be completed first.')
      return
    }

    updateSession(session.id, {
      sessionStatus: 'CLOSED',
      badgeStatus: 'RETURNED',
      exitTime: getCurrentTime(),
      currentLocation: 'Exited',
    })
  }

  const markBadgeLost = (session) => {
    updateSession(session.id, {
      badgeStatus: 'LOST',
    })
  }

  const markBadgeDamaged = (session) => {
    updateSession(session.id, {
      badgeStatus: 'DAMAGED',
    })
  }

  const createSession = (event) => {
    event.preventDefault()

    if (!newSession.cid.trim() || !newSession.customer.trim()) {
      window.alert('CID and customer name are required.')
      return
    }

    const initials = newSession.customer
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

    const createdSession = {
      id: Date.now(),
      badge: newSession.badge,
      cid: newSession.cid.trim().toUpperCase(),
      customer: newSession.customer.trim(),
      initials,
      nationality: newSession.nationality,
      category: newSession.category,
      purpose: newSession.purpose,
      entryTime: getCurrentTime(),
      exitTime: '',
      currentLocation: 'Reception / Gate',
      sessionStatus: 'ACTIVE',
      badgeStatus: 'ACTIVE',
      clearanceStatus: 'NOT_REQUESTED',
      recordedBy: 'Current Reception User',
    }

    setSessions((current) => [createdSession, ...current])
    setSelectedSession(createdSession)
    setShowNewSessionModal(false)

    setNewSession({
      cid: '',
      customer: '',
      nationality: 'Nepali',
      category: 'NORMAL',
      purpose: 'Gaming',
      badge: availableBadges[0],
    })
  }

  const exportCsv = () => {
    const headers = [
      'Badge',
      'CID',
      'Customer',
      'Nationality',
      'Category',
      'Purpose',
      'Entry Time',
      'Exit Time',
      'Current Location',
      'Session Status',
      'Badge Status',
      'Clearance Status',
      'Recorded By',
    ]

    const rows = filteredSessions.map((session) => [
      session.badge,
      session.cid,
      session.customer,
      session.nationality,
      session.category,
      session.purpose,
      session.entryTime,
      session.exitTime || '',
      session.currentLocation,
      session.sessionStatus,
      session.badgeStatus,
      session.clearanceStatus,
      session.recordedBy,
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
    link.download = 'daily-badge-sessions.csv'
    link.click()

    URL.revokeObjectURL(url)
  }

  const StatusBadge = ({ value }) => (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
        statusStyles[value] || statusStyles.NOT_REQUESTED
      }`}
    >
      {formatStatus(value)}
    </span>
  )

  const SummaryCard = ({ title, value, note, tone = 'slate', icon }) => {
    const tones = {
      slate: 'border-slate-200',
      blue: 'border-blue-200',
      green: 'border-emerald-200',
      amber: 'border-amber-200',
      red: 'border-red-200',
      purple: 'border-purple-200',
    }

    return (
      <div
        className={`rounded-2xl border bg-white p-4 shadow-sm ${
          tones[tone] || tones.slate
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
              {title}
            </p>

            <p className="mt-3 font-serif text-3xl font-bold text-slate-950">
              {value}
            </p>

            {note && (
              <p className="mt-1 text-xs font-medium text-slate-500">{note}</p>
            )}
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-lg">
            {icon}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-6 text-slate-900">
      <div className="mx-auto max-w-[1700px]">
        {/* Page Header */}
        <section className="border-b border-slate-200 pb-5">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-600">
                Operations
              </p>

              <h1 className="mt-1 font-serif text-3xl font-bold text-slate-950">
                Daily Badge & Sessions
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Daily customer sessions, reusable badge tracking, exit clearance
                and badge return control.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowBadgeBoard(true)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Badge Allocation Board
              </button>

              <button
                type="button"
                onClick={exportCsv}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Export CSV
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Print
              </button>

              <button
                type="button"
                onClick={() => setShowNewSessionModal(true)}
                className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-extrabold text-slate-950 shadow-sm hover:bg-amber-300"
              >
                + Open New Session
              </button>
            </div>
          </div>
        </section>

        {/* Rule Banner */}
        <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-extrabold">Daily-session rule:</span> Every
          session must link to a permanent CID, business date and reusable badge.
          Sensitive customer financial details are not displayed on this page.
        </section>

        {/* Summary Cards */}
        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <SummaryCard
            title="Sessions Today"
            value={summary.total}
            note="All daily records"
            tone="blue"
            icon="📋"
          />

          <SummaryCard
            title="Active Inside"
            value={summary.active}
            note="Active or playing"
            tone="green"
            icon="👥"
          />

          <SummaryCard
            title="Exit Pending"
            value={summary.exitPending}
            note="Needs clearance"
            tone="amber"
            icon="↪"
          />

          <SummaryCard
            title="Closed Sessions"
            value={summary.closed}
            note="Exited today"
            tone="slate"
            icon="✓"
          />

          <SummaryCard
            title="Active Badges"
            value={summary.badgesActive}
            note="Currently issued"
            tone="purple"
            icon="🎫"
          />

          <SummaryCard
            title="Returned Badges"
            value={summary.badgesReturned}
            note="Returned at exit"
            tone="green"
            icon="↩"
          />

          <SummaryCard
            title="Clearance Pending"
            value={summary.clearancePending}
            note="Awaiting approval"
            tone="amber"
            icon="!"
          />

          <SummaryCard
            title="Lost / Damaged"
            value={summary.lostOrDamaged}
            note="Requires action"
            tone="red"
            icon="⚠"
          />
        </section>

        {/* Workflow */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-700">
            Daily Session Workflow
          </h2>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {[
              '1. Search permanent CID',
              '2. Confirm customer identity',
              '3. Assign reusable badge',
              '4. Open daily session',
              '5. Track current location',
              '6. Request exit clearance',
              '7. Record exit time',
              '8. Mark badge returned',
            ].map((step, index) => (
              <div key={step} className="flex shrink-0 items-center gap-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-700">
                  {step}
                </div>

                {index < 7 && (
                  <span className="font-black text-amber-500">→</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Main Content */}
        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <div className="flex flex-col gap-3 lg:flex-row">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search badge, CID, customer or location..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                />

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-amber-400"
                >
                  <option value="ALL">All Session Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PLAYING">Playing</option>
                  <option value="EXIT_PENDING">Exit Pending</option>
                  <option value="CLOSED">Closed</option>
                </select>

                <select
                  value={badgeFilter}
                  onChange={(event) => setBadgeFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-amber-400"
                >
                  <option value="ALL">All Badge Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="RETURNED">Returned</option>
                  <option value="LOST">Lost</option>
                  <option value="DAMAGED">Damaged</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1250px] w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    {[
                      'Badge',
                      'Customer',
                      'Nationality',
                      'Purpose',
                      'Entry',
                      'Exit',
                      'Current Location',
                      'Session',
                      'Badge Status',
                      'Clearance',
                      'Action',
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredSessions.map((session) => (
                    <tr
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className={`cursor-pointer border-b border-slate-100 transition hover:bg-amber-50/40 ${
                        selectedSession?.id === session.id
                          ? 'bg-amber-50/60'
                          : 'bg-white'
                      }`}
                    >
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 font-mono text-sm font-black text-amber-700">
                          {session.badge}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-xs font-black text-amber-700">
                            {session.initials}
                          </div>

                          <div>
                            <p className="text-sm font-extrabold text-slate-900">
                              {session.customer}
                            </p>

                            <p className="text-xs text-slate-500">
                              {session.cid} · {session.category}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm font-medium text-slate-700">
                        {session.nationality}
                      </td>

                      <td className="px-4 py-4 text-sm font-medium text-slate-700">
                        {session.purpose}
                      </td>

                      <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                        {session.entryTime}
                      </td>

                      <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                        {session.exitTime || '—'}
                      </td>

                      <td className="px-4 py-4 text-sm font-medium text-slate-700">
                        {session.currentLocation}
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge value={session.sessionStatus} />
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge value={session.badgeStatus} />
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge value={session.clearanceStatus} />
                      </td>

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            setSelectedSession(session)
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredSessions.length === 0 && (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-6 py-16 text-center text-sm font-semibold text-slate-500"
                      >
                        No sessions match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs font-semibold text-slate-500">
              <span>
                Showing {filteredSessions.length} of {sessions.length} sessions
              </span>

              <span>Business Date: 15 July 2026</span>
            </div>
          </div>

          {/* Selected Session Detail */}
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-5">
            {selectedSession ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                      Selected Daily Session
                    </p>

                    <h2 className="mt-2 font-serif text-2xl font-bold text-slate-950">
                      {selectedSession.customer}
                    </h2>

                    <p className="text-sm text-slate-500">
                      {selectedSession.cid} · Badge {selectedSession.badge}
                    </p>
                  </div>

                  <StatusBadge value={selectedSession.sessionStatus} />
                </div>

                <div className="mt-5 space-y-3 border-y border-slate-200 py-4">
                  {[
                    ['Category', selectedSession.category],
                    ['Nationality', selectedSession.nationality],
                    ['Purpose', selectedSession.purpose],
                    ['Entry Time', selectedSession.entryTime],
                    ['Exit Time', selectedSession.exitTime || 'Not recorded'],
                    ['Current Location', selectedSession.currentLocation],
                    ['Recorded By', selectedSession.recordedBy],
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

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Badge
                    </p>

                    <div className="mt-2">
                      <StatusBadge value={selectedSession.badgeStatus} />
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Clearance
                    </p>

                    <div className="mt-2">
                      <StatusBadge value={selectedSession.clearanceStatus} />
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  {!['CLOSED', 'EXIT_PENDING'].includes(
                    selectedSession.sessionStatus,
                  ) && (
                    <button
                      type="button"
                      onClick={() => requestExit(selectedSession)}
                      className="w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-extrabold text-slate-950 hover:bg-amber-300"
                    >
                      Request Exit Clearance
                    </button>
                  )}

                  {selectedSession.sessionStatus === 'EXIT_PENDING' &&
                    selectedSession.clearanceStatus !== 'CLEARED' && (
                      <button
                        type="button"
                        onClick={() => approveClearance(selectedSession)}
                        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-emerald-500"
                      >
                        Approve Exit Clearance
                      </button>
                    )}

                  {selectedSession.sessionStatus === 'EXIT_PENDING' && (
                    <button
                      type="button"
                      onClick={() => completeExit(selectedSession)}
                      className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-sky-500"
                    >
                      Record Exit & Return Badge
                    </button>
                  )}

                  {selectedSession.sessionStatus !== 'CLOSED' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => markBadgeLost(selectedSession)}
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-extrabold text-red-700 hover:bg-red-100"
                      >
                        Mark Badge Lost
                      </button>

                      <button
                        type="button"
                        onClick={() => markBadgeDamaged(selectedSession)}
                        className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-xs font-extrabold text-orange-700 hover:bg-orange-100"
                      >
                        Mark Damaged
                      </button>
                    </div>
                  )}
                </div>

                {selectedSession.sessionStatus === 'CLOSED' && (
                  <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                    Session closed and badge return recorded.
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center text-sm font-semibold text-slate-500">
                Select a daily session to view its details.
              </div>
            )}
          </aside>
        </section>
      </div>

      {/* New Session Modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={createSession}
            className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="font-serif text-2xl font-bold text-slate-950">
                  Open Daily Customer Session
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Link the permanent customer CID with today&apos;s reusable
                  badge.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowNewSessionModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-500 hover:bg-slate-50"
              >
                ×
              </button>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  CID *
                </span>

                <input
                  value={newSession.cid}
                  onChange={(event) =>
                    setNewSession((current) => ({
                      ...current,
                      cid: event.target.value,
                    }))
                  }
                  placeholder="CID-XXXX"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-400"
                />
              </label>

              <label className="block">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Customer Name *
                </span>

                <input
                  value={newSession.customer}
                  onChange={(event) =>
                    setNewSession((current) => ({
                      ...current,
                      customer: event.target.value,
                    }))
                  }
                  placeholder="Customer full name"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-400"
                />
              </label>

              <label className="block">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Reusable Badge
                </span>

                <select
                  value={newSession.badge}
                  onChange={(event) =>
                    setNewSession((current) => ({
                      ...current,
                      badge: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400"
                >
                  {availableBadges.map((badge) => (
                    <option key={badge} value={badge}>
                      Badge {badge}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Nationality
                </span>

                <input
                  value={newSession.nationality}
                  onChange={(event) =>
                    setNewSession((current) => ({
                      ...current,
                      nationality: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-400"
                />
              </label>

              <label className="block">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Customer Category
                </span>

                <select
                  value={newSession.category}
                  onChange={(event) =>
                    setNewSession((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="STANDARD">Standard</option>
                  <option value="VIP">VIP</option>
                  <option value="VVIP">VVIP</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Purpose of Visit
                </span>

                <select
                  value={newSession.purpose}
                  onChange={(event) =>
                    setNewSession((current) => ({
                      ...current,
                      purpose: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400"
                >
                  <option value="Gaming">Gaming</option>
                  <option value="Food / Beverage">Food / Beverage</option>
                  <option value="Hotel / CRM Service">
                    Hotel / CRM Service
                  </option>
                  <option value="Meeting">Meeting</option>
                  <option value="Other">Other</option>
                </select>
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() => setShowNewSessionModal(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-xl bg-amber-400 px-6 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-amber-300"
              >
                Open Daily Session
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Badge Board Modal */}
      {showBadgeBoard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="font-serif text-2xl font-bold text-slate-950">
                  Reusable Badge Allocation Board
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current badge availability and assignment status.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowBadgeBoard(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-500 hover:bg-slate-50"
              >
                ×
              </button>
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {[
                ...availableBadges.map((badge) => ({
                  badge,
                  status: 'AVAILABLE',
                  customer: '',
                })),
                ...sessions.map((session) => ({
                  badge: session.badge,
                  status: session.badgeStatus,
                  customer: session.customer,
                })),
              ].map((item, index) => (
                <div
                  key={`${item.badge}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-lg font-black text-amber-700">
                      {item.badge}
                    </span>

                    <StatusBadge
                      value={
                        item.status === 'AVAILABLE'
                          ? 'NOT_REQUESTED'
                          : item.status
                      }
                    />
                  </div>

                  <p className="mt-3 min-h-8 text-xs font-semibold text-slate-600">
                    {item.customer || 'No active assignment'}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() => setShowBadgeBoard(false)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-slate-800"
              >
                Close Board
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DailyBadgeSessions