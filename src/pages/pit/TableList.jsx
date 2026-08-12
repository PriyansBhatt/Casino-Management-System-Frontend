import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const money = (value) =>
  `NPR ${Number(value || 0).toLocaleString('en-IN')}`

const nowTime = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

const initialTables = [
  {
    id: 'T-BAC-1',
    name: 'Baccarat Table 1',
    gameType: 'Baccarat',
    dealer: 'Manoj Dealer',
    recorder: 'Raju Recorder',
    supervisor: 'Pit Boss Suresh',
    players: 3,
    openingFloat: 2000000,
    chipIn: 1850000,
    winsPaid: 975000,
    lossesCollected: 1120000,
    status: 'ACTIVE',
    since: '13:15',
  },
  {
    id: 'T-BAC-2',
    name: 'Baccarat Table 2',
    gameType: 'Baccarat',
    dealer: 'Karan Lama',
    recorder: 'Anil Recorder',
    supervisor: 'Pit Boss Suresh',
    players: 5,
    openingFloat: 2000000,
    chipIn: 2200000,
    winsPaid: 1280000,
    lossesCollected: 1600000,
    status: 'ACTIVE',
    since: '13:10',
  },
  {
    id: 'T-BAC-3',
    name: 'Baccarat Table 3',
    gameType: 'Baccarat',
    dealer: 'Nabin Dealer',
    recorder: 'Munna Recorder',
    supervisor: 'Pit Boss Suresh',
    players: 0,
    openingFloat: 1500000,
    chipIn: 0,
    winsPaid: 0,
    lossesCollected: 0,
    status: 'IDLE',
    since: '16:20',
  },
  {
    id: 'T-ROU-1',
    name: 'Roulette Table 1',
    gameType: 'Roulette',
    dealer: 'Hari Magar',
    recorder: 'Ganesh Recorder',
    supervisor: 'Pit Boss Suresh',
    players: 4,
    openingFloat: 2500000,
    chipIn: 2550000,
    winsPaid: 1320000,
    lossesCollected: 1830000,
    status: 'ACTIVE',
    since: '13:05',
  },
  {
    id: 'T-ROU-2',
    name: 'Roulette Table 2',
    gameType: 'Roulette',
    dealer: 'Bikram Dealer',
    recorder: 'Sita Recorder',
    supervisor: 'Pit Boss Suresh',
    players: 0,
    openingFloat: 1500000,
    chipIn: 0,
    winsPaid: 0,
    lossesCollected: 0,
    status: 'IDLE',
    since: '17:45',
  },
  {
    id: 'T-FLU-1',
    name: 'Mini Flush 1',
    gameType: 'Mini Flush',
    dealer: 'Sita Gurung',
    recorder: 'Pema Recorder',
    supervisor: 'Pit Boss Suresh',
    players: 2,
    openingFloat: 800000,
    chipIn: 840000,
    winsPaid: 450000,
    lossesCollected: 610000,
    status: 'ACTIVE',
    since: '13:30',
  },
  {
    id: 'T-FLU-2',
    name: 'Mini Flush 2',
    gameType: 'Mini Flush',
    dealer: 'Laxman Dealer',
    recorder: 'Ritu Recorder',
    supervisor: 'Pit Boss Suresh',
    players: 0,
    openingFloat: 800000,
    chipIn: 0,
    winsPaid: 0,
    lossesCollected: 0,
    status: 'IDLE',
    since: '18:10',
  },
  {
    id: 'R-FLU-1',
    name: 'Rented Flush 1',
    gameType: 'Rented Flush',
    dealer: 'Vendor Dealer',
    recorder: 'Vendor Recorder',
    supervisor: 'Vendor Supervisor',
    players: 1,
    openingFloat: 0,
    chipIn: 1200000,
    winsPaid: 620000,
    lossesCollected: 580000,
    status: 'RENTED',
    since: '14:00',
  },
  {
    id: 'R-FLU-2',
    name: 'Rented Flush 2',
    gameType: 'Rented Flush',
    dealer: 'Vendor Dealer',
    recorder: 'Vendor Recorder',
    supervisor: 'Vendor Supervisor',
    players: 0,
    openingFloat: 0,
    chipIn: 0,
    winsPaid: 0,
    lossesCollected: 0,
    status: 'IDLE',
    since: '18:30',
  },
]

const emptySessionForm = {
  tableId: '',
  name: '',
  gameType: 'Baccarat',
  dealer: '',
  recorder: '',
  supervisor: '',
  openingFloat: '',
}

const inputClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100'

const GamingFloorPitOverview = () => {
  const navigate = useNavigate()

  const [tables, setTables] = useState(initialTables)
  const [search, setSearch] = useState('')
  const [gameFilter, setGameFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dealerFilter, setDealerFilter] = useState('ALL')
  const [businessDate, setBusinessDate] = useState('2026-07-15')

  const [selectedTable, setSelectedTable] = useState(null)
  const [showFloorMap, setShowFloorMap] = useState(false)
  const [showNewSession, setShowNewSession] = useState(false)
  const [sessionForm, setSessionForm] = useState(emptySessionForm)
  const [formErrors, setFormErrors] = useState({})
  const [toast, setToast] = useState(null)

  const filteredTables = useMemo(() => {
    const query = search.trim().toLowerCase()

    return tables.filter((table) => {
      const searchMatch =
        !query ||
        table.id.toLowerCase().includes(query) ||
        table.name.toLowerCase().includes(query) ||
        table.gameType.toLowerCase().includes(query) ||
        table.dealer.toLowerCase().includes(query) ||
        table.recorder.toLowerCase().includes(query) ||
        table.supervisor.toLowerCase().includes(query)

      const gameMatch =
        gameFilter === 'ALL' || table.gameType === gameFilter
      const statusMatch =
        statusFilter === 'ALL' || table.status === statusFilter
      const dealerMatch =
        dealerFilter === 'ALL' || table.dealer === dealerFilter

      return searchMatch && gameMatch && statusMatch && dealerMatch
    })
  }, [tables, search, gameFilter, statusFilter, dealerFilter])

  const summary = useMemo(() => {
    const activeTables = tables.filter((table) =>
      ['ACTIVE', 'RENTED'].includes(table.status),
    ).length

    const players = tables.reduce((total, table) => total + table.players, 0)
    const chipIn = tables.reduce((total, table) => total + table.chipIn, 0)
    const winsPaid = tables.reduce(
      (total, table) => total + table.winsPaid,
      0,
    )
    const lossesCollected = tables.reduce(
      (total, table) => total + table.lossesCollected,
      0,
    )

    return {
      activeTables,
      totalTables: tables.length,
      players,
      chipIn,
      winsPaid,
      lossesCollected,
      net: lossesCollected - winsPaid,
    }
  }, [tables])

  const dealers = useMemo(
    () => [...new Set(tables.map((table) => table.dealer))],
    [tables],
  )

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 2800)
  }

  const refreshData = () => {
    setTables((current) => [...current])
    showToast(`Gaming floor refreshed at ${nowTime()}.`)
  }

  const resetFilters = () => {
    setSearch('')
    setGameFilter('ALL')
    setStatusFilter('ALL')
    setDealerFilter('ALL')
  }

  const exportCsv = () => {
    const header = [
      'Table ID',
      'Table Name',
      'Game Type',
      'Dealer',
      'Recorder',
      'Supervisor',
      'Players',
      'Opening Float',
      'Chip-In',
      'Wins Paid',
      'Losses Collected',
      'Net Position',
      'Status',
      'Since',
    ]

    const rows = filteredTables.map((table) => [
      table.id,
      table.name,
      table.gameType,
      table.dealer,
      table.recorder,
      table.supervisor,
      table.players,
      table.openingFloat,
      table.chipIn,
      table.winsPaid,
      table.lossesCollected,
      table.lossesCollected - table.winsPaid,
      table.status,
      table.since,
    ])

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(','),
      )
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `gaming-floor-${businessDate}.csv`
    anchor.click()
    URL.revokeObjectURL(url)

    showToast('Gaming-floor CSV exported.')
  }

  const openTablePage = (table) => {
    navigate(`/pit/tables/${table.id}`)
  }

  const updateTableStatus = (tableId, status) => {
    setTables((current) =>
      current.map((table) =>
        table.id === tableId
          ? {
              ...table,
              status,
              since: nowTime(),
              players: status === 'CLOSED' ? 0 : table.players,
            }
          : table,
      ),
    )

    setSelectedTable((current) =>
      current?.id === tableId
        ? {
            ...current,
            status,
            since: nowTime(),
            players: status === 'CLOSED' ? 0 : current.players,
          }
        : current,
    )

    showToast(`Table status changed to ${status}.`)
  }

  const changePlayerCount = (tableId, difference) => {
    setTables((current) =>
      current.map((table) =>
        table.id === tableId
          ? {
              ...table,
              players: Math.max(0, table.players + difference),
            }
          : table,
      ),
    )

    setSelectedTable((current) =>
      current?.id === tableId
        ? {
            ...current,
            players: Math.max(0, current.players + difference),
          }
        : current,
    )
  }

  const validateSession = () => {
    const errors = {}

    if (!sessionForm.tableId.trim()) errors.tableId = 'Table ID is required.'
    if (!sessionForm.name.trim()) errors.name = 'Table name is required.'
    if (!sessionForm.dealer.trim()) errors.dealer = 'Dealer is required.'
    if (!sessionForm.recorder.trim()) errors.recorder = 'Recorder is required.'
    if (!sessionForm.supervisor.trim()) {
      errors.supervisor = 'Supervisor is required.'
    }

    if (
      sessionForm.openingFloat === '' ||
      Number(sessionForm.openingFloat) < 0
    ) {
      errors.openingFloat = 'Enter a valid opening float.'
    }

    const duplicateId = tables.some(
      (table) =>
        table.id.toLowerCase() === sessionForm.tableId.trim().toLowerCase(),
    )

    if (duplicateId) errors.tableId = 'This table ID already exists.'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const createSession = () => {
    if (!validateSession()) return

    const newTable = {
      id: sessionForm.tableId.trim().toUpperCase(),
      name: sessionForm.name.trim(),
      gameType: sessionForm.gameType,
      dealer: sessionForm.dealer.trim(),
      recorder: sessionForm.recorder.trim(),
      supervisor: sessionForm.supervisor.trim(),
      players: 0,
      openingFloat: Number(sessionForm.openingFloat),
      chipIn: 0,
      winsPaid: 0,
      lossesCollected: 0,
      status: sessionForm.gameType === 'Rented Flush' ? 'RENTED' : 'ACTIVE',
      since: nowTime(),
    }

    setTables((current) => [newTable, ...current])
    setSessionForm(emptySessionForm)
    setFormErrors({})
    setShowNewSession(false)
    showToast(`${newTable.name} session started.`)
  }

  return (
    <div className="space-y-5 text-slate-900">
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rotate-45 bg-amber-400" />
            <h1 className="font-serif text-3xl font-black tracking-tight text-slate-950">
              Gaming Floor / Pit Overview
            </h1>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Monitor live tables, staff assignments, players and table results
            from one operational screen.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={businessDate}
            onChange={(event) => setBusinessDate(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-amber-400"
          />

          <button
            type="button"
            onClick={() => setShowFloorMap(true)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
          >
            🗺 Floor Map
          </button>

          <button
            type="button"
            onClick={refreshData}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-amber-300 hover:bg-amber-50"
          >
            ⟳ Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setSessionForm(emptySessionForm)
              setFormErrors({})
              setShowNewSession(true)
            }}
            className="h-11 rounded-xl bg-amber-400 px-5 text-sm font-black text-slate-950 transition hover:bg-amber-300"
          >
            + Start New Table Session
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Active Tables"
          value={`${summary.activeTables} / ${summary.totalTables}`}
          description="Tables currently operating"
          icon="🎲"
          tone="blue"
        />
        <SummaryCard
          label="Players on Floor"
          value={summary.players}
          description="Live players across all tables"
          icon="👥"
          tone="green"
        />
        <SummaryCard
          label="Total Chip-In Today"
          value={money(summary.chipIn)}
          description="Recorded across gaming tables"
          icon="🪙"
          tone="purple"
        />
        <SummaryCard
          label="Floor Net Today"
          value={money(summary.net)}
          description={`Collected ${money(summary.lossesCollected)} · Paid ${money(
            summary.winsPaid,
          )}`}
          icon="📈"
          tone={summary.net >= 0 ? 'green' : 'red'}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="grid gap-3 xl:grid-cols-[1fr_180px_180px_200px_auto_auto]">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search table, game, dealer, recorder or supervisor..."
              className={inputClass}
            />

            <select
              value={gameFilter}
              onChange={(event) => setGameFilter(event.target.value)}
              className={inputClass}
            >
              <option value="ALL">All Game Types</option>
              <option value="Baccarat">Baccarat</option>
              <option value="Roulette">Roulette</option>
              <option value="Mini Flush">Mini Flush</option>
              <option value="Rented Flush">Rented Flush</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={inputClass}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="IDLE">Idle</option>
              <option value="RENTED">Rented</option>
              <option value="CLOSED">Closed</option>
            </select>

            <select
              value={dealerFilter}
              onChange={(event) => setDealerFilter(event.target.value)}
              className={inputClass}
            >
              <option value="ALL">All Dealers</option>
              {dealers.map((dealer) => (
                <option key={dealer} value={dealer}>
                  {dealer}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={exportCsv}
              className="h-11 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-700 hover:bg-emerald-100"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-6">
          <CompactTotal label="Visible Tables" value={filteredTables.length} />
          <CompactTotal
            label="Active"
            value={filteredTables.filter((table) => table.status === 'ACTIVE').length}
          />
          <CompactTotal
            label="Players"
            value={filteredTables.reduce(
              (total, table) => total + table.players,
              0,
            )}
          />
          <CompactTotal
            label="Chip-In"
            value={money(
              filteredTables.reduce(
                (total, table) => total + table.chipIn,
                0,
              ),
            )}
          />
          <CompactTotal
            label="Wins Paid"
            value={money(
              filteredTables.reduce(
                (total, table) => total + table.winsPaid,
                0,
              ),
            )}
            tone="red"
          />
          <CompactTotal
            label="Net Position"
            value={money(
              filteredTables.reduce(
                (total, table) =>
                  total + table.lossesCollected - table.winsPaid,
                0,
              ),
            )}
            tone="green"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1420px] border-collapse text-left">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                {[
                  'Table',
                  'Game Type',
                  'Dealer / Recorder',
                  'Supervisor',
                  'Players',
                  'Opening Float',
                  'Chip-In',
                  'Wins Paid',
                  'Losses Collected',
                  'Net Position',
                  'Status',
                  'Actions',
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredTables.map((table) => {
                const net = table.lossesCollected - table.winsPaid

                return (
                  <tr
                    key={table.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedTable(table)}
                        className="text-left"
                      >
                        <span className="inline-flex rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 font-mono text-xs font-black text-amber-700">
                          {table.id}
                        </span>
                        <p className="mt-2 text-sm font-black text-slate-950">
                          {table.name}
                        </p>
                      </button>
                    </td>

                    <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                      {table.gameType}
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-slate-800">
                        {table.dealer}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {table.recorder}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-700">
                      {table.supervisor}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => changePlayerCount(table.id, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white font-black text-slate-600 hover:bg-slate-100"
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center text-sm font-black">
                          {table.players}
                        </span>
                        <button
                          type="button"
                          onClick={() => changePlayerCount(table.id, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white font-black text-slate-600 hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm font-bold text-slate-700">
                      {money(table.openingFloat)}
                    </td>
                    <td className="px-4 py-4 text-sm font-black text-slate-800">
                      {money(table.chipIn)}
                    </td>
                    <td className="px-4 py-4 text-sm font-black text-sky-700">
                      {money(table.winsPaid)}
                    </td>
                    <td className="px-4 py-4 text-sm font-black text-red-600">
                      {money(table.lossesCollected)}
                    </td>
                    <td
                      className={`px-4 py-4 text-sm font-black ${
                        net >= 0 ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {money(net)}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={table.status} />
                      <p className="mt-1 text-[11px] text-slate-400">
                        Since {table.since}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openTablePage(table)}
                          className="rounded-lg bg-sky-500 px-3 py-2 text-xs font-black text-white hover:bg-sky-600"
                        >
                          Open Table
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedTable(table)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-100"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredTables.length === 0 && (
                <tr>
                  <td
                    colSpan={12}
                    className="px-6 py-16 text-center text-sm text-slate-500"
                  >
                    No tables match the selected search and filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {filteredTables.length} of {tables.length} tables
          </span>
          <span>
            Business Date: <strong>{businessDate}</strong>
          </span>
        </div>
      </section>

      {selectedTable && (
        <ModalOverlay onClose={() => setSelectedTable(null)}>
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title={selectedTable.name}
              description={`${selectedTable.id} · ${selectedTable.gameType}`}
              onClose={() => setSelectedTable(null)}
            />

            <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                    Current Status
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={selectedTable.status} />
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">Players</p>
                  <p className="text-3xl font-black text-slate-950">
                    {selectedTable.players}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailCard label="Dealer" value={selectedTable.dealer} />
                <DetailCard label="Recorder" value={selectedTable.recorder} />
                <DetailCard
                  label="Supervisor"
                  value={selectedTable.supervisor}
                />
                <DetailCard
                  label="Opening Float"
                  value={money(selectedTable.openingFloat)}
                />
                <DetailCard
                  label="Chip-In Today"
                  value={money(selectedTable.chipIn)}
                />
                <DetailCard
                  label="Wins Paid"
                  value={money(selectedTable.winsPaid)}
                />
                <DetailCard
                  label="Losses Collected"
                  value={money(selectedTable.lossesCollected)}
                />
                <DetailCard
                  label="Net Position"
                  value={money(
                    selectedTable.lossesCollected - selectedTable.winsPaid,
                  )}
                />
              </div>

              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Update Table Status
                </p>

                <div className="grid gap-2 sm:grid-cols-4">
                  {['ACTIVE', 'IDLE', 'RENTED', 'CLOSED'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        updateTableStatus(selectedTable.id, status)
                      }
                      className={`rounded-lg border px-3 py-2.5 text-xs font-black transition ${
                        selectedTable.status === status
                          ? 'border-amber-400 bg-amber-100 text-amber-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSelectedTable(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => openTablePage(selectedTable)}
                className="rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-black text-white hover:bg-sky-600"
              >
                Open Full Table
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {showNewSession && (
        <ModalOverlay onClose={() => setShowNewSession(false)}>
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title="Start New Table Session"
              description="Create a new operational table session for the selected business date."
              onClose={() => setShowNewSession(false)}
            />

            <div className="max-h-[72vh] overflow-y-auto p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Table ID"
                  value={sessionForm.tableId}
                  placeholder="Example: T-BAC-4"
                  error={formErrors.tableId}
                  onChange={(value) =>
                    setSessionForm((current) => ({
                      ...current,
                      tableId: value,
                    }))
                  }
                />

                <FormField
                  label="Table Name"
                  value={sessionForm.name}
                  placeholder="Example: Baccarat Table 4"
                  error={formErrors.name}
                  onChange={(value) =>
                    setSessionForm((current) => ({
                      ...current,
                      name: value,
                    }))
                  }
                />

                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                    Game Type
                  </span>
                  <select
                    value={sessionForm.gameType}
                    onChange={(event) =>
                      setSessionForm((current) => ({
                        ...current,
                        gameType: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option>Baccarat</option>
                    <option>Roulette</option>
                    <option>Mini Flush</option>
                    <option>Rented Flush</option>
                  </select>
                </label>

                <FormField
                  label="Opening Float"
                  type="number"
                  value={sessionForm.openingFloat}
                  placeholder="Enter NPR amount"
                  error={formErrors.openingFloat}
                  onChange={(value) =>
                    setSessionForm((current) => ({
                      ...current,
                      openingFloat: value,
                    }))
                  }
                />

                <FormField
                  label="Dealer"
                  value={sessionForm.dealer}
                  placeholder="Dealer name"
                  error={formErrors.dealer}
                  onChange={(value) =>
                    setSessionForm((current) => ({
                      ...current,
                      dealer: value,
                    }))
                  }
                />

                <FormField
                  label="Recorder"
                  value={sessionForm.recorder}
                  placeholder="Recorder name"
                  error={formErrors.recorder}
                  onChange={(value) =>
                    setSessionForm((current) => ({
                      ...current,
                      recorder: value,
                    }))
                  }
                />

                <div className="sm:col-span-2">
                  <FormField
                    label="Supervisor"
                    value={sessionForm.supervisor}
                    placeholder="Supervisor or pit boss"
                    error={formErrors.supervisor}
                    onChange={(value) =>
                      setSessionForm((current) => ({
                        ...current,
                        supervisor: value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowNewSession(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={createSession}
                className="rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-black text-slate-950 hover:bg-amber-300"
              >
                Start Session
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {showFloorMap && (
        <ModalOverlay onClose={() => setShowFloorMap(false)}>
          <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title="Gaming Floor Map"
              description="Quick visual status of all configured gaming tables."
              onClose={() => setShowFloorMap(false)}
            />

            <div className="max-h-[72vh] overflow-y-auto p-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tables.map((table) => (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => {
                      setShowFloorMap(false)
                      setSelectedTable(table)
                    }}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-amber-300 hover:bg-amber-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-lg border border-amber-300 bg-white px-2 py-1 font-mono text-xs font-black text-amber-700">
                        {table.id}
                      </span>
                      <StatusBadge status={table.status} />
                    </div>

                    <p className="mt-4 text-base font-black text-slate-950">
                      {table.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {table.gameType} · {table.players} players
                    </p>

                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="text-slate-500">{table.dealer}</span>
                      <span className="font-black text-emerald-700">
                        {money(table.lossesCollected - table.winsPaid)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 bg-slate-50 p-4">
              <button
                type="button"
                onClick={() => setShowFloorMap(false)}
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800"
              >
                Close Map
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[200] max-w-sm rounded-xl border px-4 py-3 text-sm font-bold shadow-xl ${
            toast.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}

const SummaryCard = ({ label, value, description, icon, tone }) => {
  const tones = {
    blue: 'border-sky-200 from-white to-sky-50',
    green: 'border-emerald-200 from-white to-emerald-50',
    purple: 'border-purple-200 from-white to-purple-50',
    red: 'border-red-200 from-white to-red-50',
  }

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${
        tones[tone] || tones.blue
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.17em] text-slate-500">
            {label}
          </p>
          <p className="mt-4 font-serif text-2xl font-black text-slate-950">
            {value}
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  )
}

const CompactTotal = ({ label, value, tone }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3">
    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
      {label}
    </p>
    <p
      className={`mt-2 text-sm font-black ${
        tone === 'green'
          ? 'text-emerald-700'
          : tone === 'red'
            ? 'text-red-600'
            : 'text-slate-950'
      }`}
    >
      {value}
    </p>
  </div>
)

const StatusBadge = ({ status }) => {
  const styles = {
    ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    IDLE: 'border-amber-200 bg-amber-50 text-amber-700',
    RENTED: 'border-purple-200 bg-purple-50 text-purple-700',
    CLOSED: 'border-slate-300 bg-slate-100 text-slate-600',
  }

  const labels = {
    ACTIVE: 'ACTIVE',
    IDLE: 'IDLE',
    RENTED: 'RENTED FLUSH',
    CLOSED: 'CLOSED',
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black tracking-wide ${
        styles[status] || styles.IDLE
      }`}
    >
      {labels[status] || status}
    </span>
  )
}

const DetailCard = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
      {label}
    </p>
    <p className="mt-2 break-words text-sm font-black text-slate-900">
      {value}
    </p>
  </div>
)

const FormField = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  type = 'text',
}) => (
  <label className="block">
    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
      {label}
      <span className="ml-1 text-red-500">*</span>
    </span>

    <input
      type={type}
      value={value}
      min={type === 'number' ? 0 : undefined}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={`${inputClass} ${
        error ? 'border-red-300 focus:border-red-500' : ''
      }`}
    />

    {error && (
      <span className="mt-1 block text-xs font-semibold text-red-600">
        {error}
      </span>
    )}
  </label>
)

const ModalHeader = ({ title, description, onClose }) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
    <div>
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 rotate-45 bg-amber-400" />
        <h2 className="font-serif text-2xl font-black text-slate-950">
          {title}
        </h2>
      </div>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>

    <button
      type="button"
      onClick={onClose}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-500 transition hover:bg-slate-100"
    >
      ×
    </button>
  </div>
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

export default GamingFloorPitOverview
