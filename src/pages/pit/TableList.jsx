import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const summaryCards = [
  {
    label: 'Active Tables',
    value: '5',
    sub: 'of 9 tables',
    note: '55.6%',
    icon: '🎲',
    border: 'border-sky-200',
  },
  {
    label: 'Players on Floor',
    value: '20',
    sub: 'Live players',
    note: 'View all',
    icon: '👥',
    border: 'border-emerald-200',
  },
  {
    label: 'Total Chip-In Today',
    value: 'NPR 42,80,000',
    sub: 'From tables',
    note: '↑ 12.4%',
    icon: '🪙',
    border: 'border-purple-200',
  },
  {
    label: 'Floor Win / Net Today',
    value: 'NPR 10,85,000',
    sub: 'Net of win/loss',
    note: '↑ 15.6%',
    icon: '📈',
    border: 'border-emerald-200',
  },
  {
    label: 'High-Value Alerts',
    value: '3',
    sub: 'Requires attention',
    note: 'View all',
    icon: '⚠',
    border: 'border-red-200',
  },
  {
    label: 'Table Mismatch',
    value: '1',
    sub: 'Needs reconciliation',
    note: 'View all',
    icon: '🔁',
    border: 'border-amber-200',
  },
]

const tables = [
  {
    id: 'T-BAC-1',
    name: 'Baccarat Table 1',
    gameType: 'Baccarat',
    dealer: 'Manoj Dealer',
    recorder: 'Raju Recorder',
    supervisor: 'Pit Boss Suresh',
    players: 3,
    openingFloat: 'NPR 20,00,000',
    chipIn: 'NPR 18,50,000',
    winsPaid: 'NPR 9,75,000',
    lossesCollected: 'NPR 11,20,000',
    net: 'NPR 1,45,000',
    status: 'Active',
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
    openingFloat: 'NPR 20,00,000',
    chipIn: 'NPR 22,00,000',
    winsPaid: 'NPR 12,80,000',
    lossesCollected: 'NPR 16,00,000',
    net: 'NPR 3,20,000',
    status: 'Active',
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
    openingFloat: 'NPR 15,00,000',
    chipIn: 'NPR 0',
    winsPaid: 'NPR 0',
    lossesCollected: 'NPR 0',
    net: 'NPR 0',
    status: 'Idle',
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
    openingFloat: 'NPR 25,00,000',
    chipIn: 'NPR 25,50,000',
    winsPaid: 'NPR 13,20,000',
    lossesCollected: 'NPR 18,30,000',
    net: 'NPR 5,10,000',
    status: 'Active',
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
    openingFloat: 'NPR 15,00,000',
    chipIn: 'NPR 0',
    winsPaid: 'NPR 0',
    lossesCollected: 'NPR 0',
    net: 'NPR 0',
    status: 'Idle',
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
    openingFloat: 'NPR 8,00,000',
    chipIn: 'NPR 8,40,000',
    winsPaid: 'NPR 4,50,000',
    lossesCollected: 'NPR 6,10,000',
    net: 'NPR 1,60,000',
    status: 'Active',
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
    openingFloat: 'NPR 8,00,000',
    chipIn: 'NPR 0',
    winsPaid: 'NPR 0',
    lossesCollected: 'NPR 0',
    net: 'NPR 0',
    status: 'Idle',
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
    openingFloat: 'NPR 0',
    chipIn: 'NPR 12,00,000',
    winsPaid: 'NPR 6,20,000',
    lossesCollected: 'NPR 5,80,000',
    net: 'NPR 40,000',
    status: 'Rented Flush',
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
    openingFloat: 'NPR 0',
    chipIn: 'NPR 0',
    winsPaid: 'NPR 0',
    lossesCollected: 'NPR 0',
    net: 'NPR 0',
    status: 'Idle',
    since: '18:30',
  },
]

const inputClass =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'

const statusClass = {
  Active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Idle: 'border-yellow-300 bg-yellow-50 text-yellow-700',
  Closed: 'border-red-200 bg-red-50 text-red-700',
  'Rented Flush': 'border-purple-200 bg-purple-50 text-purple-700',
  Mismatch: 'border-red-200 bg-red-50 text-red-700',
}

const GamingFloorPitOverview = () => {
  const navigate = useNavigate()
  const [selectedGame, setSelectedGame] = useState('All Game Types')
  const [selectedStatus, setSelectedStatus] = useState('All Status')

  const filteredTables = tables.filter((table) => {
    const gameMatch = selectedGame === 'All Game Types' || table.gameType === selectedGame
    const statusMatch = selectedStatus === 'All Status' || table.status === selectedStatus
    return gameMatch && statusMatch
  })

  const openTable = (tableId) => {
    navigate(`/pit/tables/${tableId}`)
  }

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-950">
            <span className="mr-2 text-yellow-500">◆</span>
            Gaming Floor / Pit Overview
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Real-time overview of all gaming tables and floor activity.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <input type="date" defaultValue="2026-07-15" className={inputClass} />
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
            🗺 Floor Map
          </button>
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
            ⟳ Refresh
          </button>
          <button className="rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-extrabold text-slate-950 shadow-sm hover:bg-yellow-300">
            + Start New Table Session
          </button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {summaryCards.map((card) => (
          <div key={card.label} className={`rounded-2xl border ${card.border} bg-white p-5 shadow-sm`}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-2xl">
                {card.icon}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
                  {card.label}
                </p>
                <p className="mt-2 font-serif text-2xl font-bold text-slate-950">
                  {card.value}
                </p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-slate-500">{card.sub}</p>
                  <p
                    className={`text-xs font-extrabold ${
                      card.note.includes('↑')
                        ? 'text-emerald-600'
                        : card.note.includes('View')
                          ? 'text-sky-600'
                          : 'text-slate-500'
                    }`}
                  >
                    {card.note}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-[1fr_180px_180px_180px_auto]">
          <input
            className={inputClass}
            placeholder="Search table name, game type, dealer, recorder..."
          />

          <select
            className={inputClass}
            value={selectedGame}
            onChange={(event) => setSelectedGame(event.target.value)}
          >
            <option>All Game Types</option>
            <option>Baccarat</option>
            <option>Roulette</option>
            <option>Mini Flush</option>
            <option>Rented Flush</option>
          </select>

          <select
            className={inputClass}
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Idle</option>
            <option>Closed</option>
            <option>Rented Flush</option>
            <option>Mismatch</option>
          </select>

          <select className={inputClass}>
            <option>All Dealers</option>
            <option>Manoj Dealer</option>
            <option>Karan Lama</option>
            <option>Hari Magar</option>
            <option>Vendor Dealer</option>
          </select>

          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
            More Filters
          </button>
        </div>

        {/* Fixed: Floor totals moved above the table so they are visible immediately */}
        <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <FooterTotal label="Active Tables" value="5" />
          <FooterTotal label="Players on Floor" value="20" />
          <FooterTotal label="Total Chip-In" value="NPR 1,13,00,000" />
          <FooterTotal label="Wins Paid" value="NPR 46,45,000" color="green" />
          <FooterTotal label="Losses Collected" value="NPR 57,40,000" color="red" />
          <FooterTotal label="Floor Net Position" value="NPR 10,85,000" color="green" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1300px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Table ID</th>
                <th className="px-4 py-3">Table Name / Game Type</th>
                <th className="px-4 py-3">Dealer / Recorder</th>
                <th className="px-4 py-3">Supervisor</th>
                <th className="px-4 py-3">Players</th>
                <th className="px-4 py-3">Opening Float</th>
                <th className="px-4 py-3">Chip-In Today</th>
                <th className="px-4 py-3">Wins Paid</th>
                <th className="px-4 py-3">Losses Collected</th>
                <th className="px-4 py-3">Table Net Position</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredTables.map((table) => (
                <tr key={table.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-md border px-3 py-1.5 font-mono text-sm font-bold ${
                        table.gameType === 'Rented Flush'
                          ? 'border-purple-300 bg-purple-50 text-purple-700'
                          : 'border-yellow-300 bg-yellow-50 text-yellow-700'
                      }`}
                    >
                      {table.id}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-bold text-slate-950">{table.name}</p>
                    <p className="text-xs text-slate-500">{table.gameType}</p>
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-medium text-slate-700">{table.dealer}</p>
                    <p className="text-xs text-slate-500">{table.recorder}</p>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        table.gameType === 'Rented Flush'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {table.gameType === 'Rented Flush' ? 'VS' : 'PS'}
                    </span>
                    <span className="ml-2 font-medium text-slate-700">{table.supervisor}</span>
                  </td>

                  <td className="px-4 py-4">
                    <span className="font-bold text-slate-900">👥 {table.players}</span>
                  </td>

                  <td className="px-4 py-4 font-bold text-slate-700">{table.openingFloat}</td>
                  <td className="px-4 py-4 font-bold text-slate-700">{table.chipIn}</td>
                  <td className="px-4 py-4 font-bold text-emerald-600">{table.winsPaid}</td>
                  <td className="px-4 py-4 font-bold text-red-600">{table.lossesCollected}</td>

                  <td
                    className={`px-4 py-4 font-extrabold ${
                      table.net === 'NPR 0' ? 'text-slate-500' : 'text-emerald-600'
                    }`}
                  >
                    {table.net}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase ${statusClass[table.status]}`}
                    >
                      {table.status}
                    </span>
                    <p className="mt-1 text-xs text-slate-400">Since {table.since}</p>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openTable(table.id)}
                        className={`rounded-lg px-3 py-2 text-xs font-bold text-white ${
                          table.gameType === 'Rented Flush'
                            ? 'bg-purple-500 hover:bg-purple-400'
                            : 'bg-sky-500 hover:bg-sky-400'
                        }`}
                      >
                        Open Table
                      </button>
                      <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                        👁
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs font-bold text-slate-600 shadow-sm">
        <span className="text-emerald-600">● Active</span>
        <span className="text-yellow-600">● Idle</span>
        <span className="text-red-600">● Closed / Mismatch</span>
        <span className="text-purple-600">● Rented Flush</span>
      </div>
    </div>
  )
}

const FooterTotal = ({ label, value, color }) => {
  const colorClass =
    color === 'green'
      ? 'text-emerald-600'
      : color === 'red'
        ? 'text-red-600'
        : 'text-slate-950'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className={`mt-2 font-serif text-xl font-bold ${colorClass}`}>{value}</p>
    </div>
  )
}

export default GamingFloorPitOverview