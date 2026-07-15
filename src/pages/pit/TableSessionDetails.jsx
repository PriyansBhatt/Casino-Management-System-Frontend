import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const players = [
  {
    badge: '087',
    name: 'Raj Sharma',
    cid: 'CID-00087',
    tier: 'VIP',
    wallet: '1,00,000',
    held: '50,000',
    wins: '20,000',
    losses: '40,000',
    balance: '30,000',
    lastAction: 'Loss NPR 5,000',
    time: '13:45',
    status: 'Playing',
  },
  {
    badge: '112',
    name: 'Daniel Smith',
    cid: 'CID-00112',
    tier: 'High',
    wallet: '15,00,000',
    held: '3,00,000',
    wins: '80,000',
    losses: '1,00,000',
    balance: '2,80,000',
    lastAction: 'Win NPR 25,000',
    time: '13:44',
    status: 'High Value',
  },
  {
    badge: '044',
    name: 'Amit Verma',
    cid: 'CID-00044',
    tier: 'Normal',
    wallet: '30,000',
    held: '30,000',
    wins: '0',
    losses: '20,000',
    balance: '10,000',
    lastAction: 'Loss NPR 10,000',
    time: '13:43',
    status: 'Playing',
  },
  {
    badge: '155',
    name: 'Suraj Tamang',
    cid: 'CID-00155',
    tier: 'Normal',
    wallet: '80,000',
    held: '80,000',
    wins: '10,000',
    losses: '20,000',
    balance: '60,000',
    lastAction: 'Win NPR 15,000',
    time: '13:42',
    status: 'Playing',
  },
]

const movements = [
  {
    time: '15:45:12',
    badge: '112',
    customer: 'Daniel Smith',
    type: 'Loss',
    denomination: '25K × 2',
    total: '50,000',
    recordedBy: 'Raju Recorder',
  },
  {
    time: '15:40:33',
    badge: '087',
    customer: 'Raj Sharma',
    type: 'Chip-In',
    denomination: '10K × 2, 5K × 2',
    total: '30,000',
    recordedBy: 'Raju Recorder',
  },
  {
    time: '15:35:21',
    badge: '044',
    customer: 'Amit Verma',
    type: 'Loss',
    denomination: '5K × 2',
    total: '10,000',
    recordedBy: 'Munna Recorder',
  },
  {
    time: '15:30:10',
    badge: '155',
    customer: 'Suraj Tamang',
    type: 'Win',
    denomination: '5K × 2',
    total: '10,000',
    recordedBy: 'Munna Recorder',
  },
  {
    time: '15:25:05',
    badge: '112',
    customer: 'Daniel Smith',
    type: 'Chip-In',
    denomination: '25K × 4',
    total: '1,00,000',
    recordedBy: 'Raju Recorder',
  },
]

const denominations = [
  { label: 'NPR 500', value: 0 },
  { label: 'NPR 1,000', value: 0 },
  { label: 'NPR 5,000', value: 1 },
  { label: 'NPR 10,000', value: 1 },
  { label: 'NPR 25,000', value: 0 },
]

const summaryCards = [
  {
    label: 'Active Players',
    value: '4',
    sub: 'Live at table',
    icon: '👥',
    border: 'border-sky-200',
  },
  {
    label: 'Opening Float',
    value: 'NPR 20,00,000',
    sub: 'Table float',
    icon: '🪙',
    border: 'border-emerald-200',
  },
  {
    label: 'Total Chip-In',
    value: 'NPR 8,20,000',
    sub: 'Customer chips in',
    icon: '↪',
    border: 'border-sky-200',
  },
  {
    label: 'Wins Paid',
    value: 'NPR 2,10,000',
    sub: 'Total wins paid',
    icon: '📈',
    border: 'border-emerald-200',
  },
  {
    label: 'Losses Collected',
    value: 'NPR 3,40,000',
    sub: 'Total losses collected',
    icon: '📉',
    border: 'border-red-200',
  },
  {
    label: 'Held At Table',
    value: 'NPR 5,10,000',
    sub: 'Current held chips',
    icon: '💿',
    border: 'border-purple-200',
  },
  {
    label: 'High-Value Alerts',
    value: '1',
    sub: 'Requires attention',
    icon: '⚠',
    border: 'border-yellow-300',
  },
]

const inputClass =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'

const statusClass = {
  Playing: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'High Value': 'border-yellow-300 bg-yellow-50 text-yellow-700',
  Monitor: 'border-amber-200 bg-amber-50 text-amber-700',
}

const movementClass = {
  'Chip-In': 'border-sky-200 bg-sky-50 text-sky-700',
  Win: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Loss: 'border-red-200 bg-red-50 text-red-700',
  Return: 'border-yellow-300 bg-yellow-50 text-yellow-700',
}

const actionClass = {
  'Chip-In': 'bg-sky-500 hover:bg-sky-400 text-white',
  Win: 'bg-emerald-500 hover:bg-emerald-400 text-white',
  Loss: 'bg-red-500 hover:bg-red-400 text-white',
  Return: 'bg-yellow-400 hover:bg-yellow-300 text-slate-950',
}

const LiveTableOperation = () => {
  const navigate = useNavigate()
  const { tableId } = useParams()

  const [selectedCustomer, setSelectedCustomer] = useState(players[0])
  const [actionPanel, setActionPanel] = useState('Loss')
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [showRightPanel, setShowRightPanel] = useState(true)

  const pageTitle = useMemo(() => {
    if (!tableId) return 'Baccarat Table 1'

    return tableId
      .replace('T-BAC-1', 'Baccarat Table 1')
      .replace('T-BAC-2', 'Baccarat Table 2')
      .replace('T-BAC-3', 'Baccarat Table 3')
      .replace('T-ROU-1', 'Roulette Table 1')
      .replace('T-ROU-2', 'Roulette Table 2')
      .replace('T-FLU-1', 'Mini Flush 1')
      .replace('T-FLU-2', 'Mini Flush 2')
      .replace('R-FLU-1', 'Rented Flush 1')
      .replace('R-FLU-2', 'Rented Flush 2')
  }, [tableId])

  const selectAction = (player, action) => {
    setSelectedCustomer(player)
    setActionPanel(action)
    setShowRightPanel(true)
  }

  return (
    <div className="pb-24 text-slate-900">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/pit/tables')}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50"
              >
                ←
              </button>

              <div>
                <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-950">
                  <span className="mr-2 text-emerald-500">●</span>
                  {pageTitle} - Live Table Operation
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Table mode · denomination-based chip movement only · real-time wallet updates.
                </p>
              </div>

              <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold uppercase text-emerald-700">
                Live
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
              <span>
                <b>Since:</b> 13:15
              </span>
              <span>
                <b>Game Type:</b> Baccarat
              </span>
              <span>
                <b>Dealer:</b> Manoj Dealer
              </span>
              <span>
                <b>Recorder:</b> Raju Recorder
              </span>
              <span>
                <b>Supervisor:</b> Pit Boss Suresh
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <input type="date" defaultValue="2026-07-15" className={inputClass} />

            <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
              Table Mode
            </button>

            <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
              Table Reconciliation
            </button>

            <button className="rounded-lg bg-red-500 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-red-400">
              Close Table Session
            </button>
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-7">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-2xl border ${card.border} bg-white p-5 shadow-sm`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-2xl">
                  {card.icon}
                </div>

                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-2 font-serif text-xl font-bold text-slate-950">
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{card.sub}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section
          className={`grid gap-5 ${
            showRightPanel ? 'xl:grid-cols-[minmax(0,2fr)_390px]' : 'xl:grid-cols-1'
          }`}
        >
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto]">
                <input
                  className={inputClass}
                  placeholder="Search by badge #, customer name or CID..."
                />

                <button
                  type="button"
                  onClick={() => setShowAddCustomer(true)}
                  className="rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-yellow-300"
                >
                  + Add Customer to Table
                </button>

                <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  Customer List View
                </button>

                <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  Filters
                </button>

                <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  Refresh
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              {players.map((player) => (
                <div
                  key={player.badge}
                  className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
                    selectedCustomer.badge === player.badge
                      ? 'border-sky-300 ring-2 ring-sky-100'
                      : 'border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(player)
                      setShowRightPanel(true)
                    }}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="rounded-lg bg-sky-100 px-3 py-2 font-mono text-lg font-bold text-sky-700">
                          {player.badge}
                        </span>

                        <div>
                          <p className="font-bold text-slate-950">{player.name}</p>
                          <p className="text-xs text-slate-500">{player.cid}</p>
                        </div>
                      </div>

                      <span
                        className={`rounded-lg border px-2 py-1 text-[10px] font-extrabold uppercase ${
                          player.status === 'High Value'
                            ? statusClass['High Value']
                            : statusClass.Playing
                        }`}
                      >
                        {player.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <InfoLine label="Held at Table" value={`NPR ${player.held}`} />
                      <InfoLine label="Wins" value={`NPR ${player.wins}`} color="green" />
                      <InfoLine label="Losses" value={`NPR ${player.losses}`} color="red" />
                      <InfoLine label="Balance" value={`NPR ${player.balance}`} color="blue" />
                    </div>
                  </button>

                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {['Chip-In', 'Win', 'Loss', 'Return'].map((action) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => selectAction(player, action)}
                        className={`rounded-lg px-2 py-2 text-center text-xs font-bold ${actionClass[action]}`}
                      >
                        {action}
                      </button>
                    ))}
                  </div>

                  <button className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-center text-xs font-bold text-slate-600 hover:bg-slate-100">
                    View Wallet
                  </button>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">
                  Recent Table Movements
                </h2>
                <button className="text-sm font-bold text-sky-600">View All History →</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Badge</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Denomination Summary</th>
                      <th className="px-4 py-3">Total Value</th>
                      <th className="px-4 py-3">Recorded By</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {movements.map((move) => (
                      <tr key={`${move.time}-${move.badge}`} className="hover:bg-slate-50">
                        <td className="px-4 py-4 text-slate-700">{move.time}</td>
                        <td className="px-4 py-4">
                          <span className="rounded-md border border-sky-200 bg-sky-50 px-3 py-1 font-mono text-sm font-bold text-sky-700">
                            {move.badge}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-bold text-slate-950">{move.customer}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase ${movementClass[move.type]}`}
                          >
                            {move.type}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-700">{move.denomination}</td>
                        <td
                          className={`px-4 py-4 font-extrabold ${
                            move.type === 'Loss'
                              ? 'text-red-600'
                              : move.type === 'Win'
                                ? 'text-emerald-600'
                                : 'text-sky-600'
                          }`}
                        >
                          NPR {move.total}
                        </td>
                        <td className="px-4 py-4 text-slate-700">{move.recordedBy}</td>
                        <td className="px-4 py-4">
                          <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase text-emerald-700">
                            Posted
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-3">
              <StaffInfo title="Table Staff" rows={['Dealer: Manoj Dealer', 'Recorder: Raju Recorder', 'Supervisor: Pit Boss Suresh']} />
              <StaffInfo title="Table Session" rows={['Session ID: TS-TBAC-1-150726', 'Opened At: 15 Jul 2026 13:05', 'Open Duration: 02h 40m']} />
              <StaffInfo title="Camera Link" rows={['Camera 1: Online', 'Camera 2: Online', 'Surveillance: Connected']} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-emerald-700">
                🟢 Live Sync: Connected
                <span className="ml-3 text-slate-500">Last Sync: 19:12:16</span>
              </div>

              <div className="flex flex-wrap gap-3">
                <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  Request Correction
                </button>
                <button className="rounded-lg bg-red-500 px-4 py-2 text-sm font-extrabold text-white hover:bg-red-400">
                  Emergency Alert
                </button>
              </div>
            </div>
          </div>

          {showRightPanel && (
            <aside className="xl:sticky xl:top-24 space-y-5 self-start">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">
                    Selected Customer
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowRightPanel(false)}
                    className="text-slate-400"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <span className="rounded-lg bg-sky-100 px-3 py-2 font-mono text-xl font-bold text-sky-700">
                    {selectedCustomer.badge}
                  </span>

                  <div>
                    <p className="font-serif text-xl font-bold text-slate-950">
                      {selectedCustomer.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {selectedCustomer.cid} · {selectedCustomer.tier}
                    </p>
                  </div>

                  <span className="ml-auto text-sm font-bold text-emerald-600">● Live</span>
                </div>

                <div className="mt-5 space-y-3">
                  <SideInfo label="Total Wallet" value={`NPR ${selectedCustomer.wallet}`} />
                  <SideInfo label="Held At This Table" value={`NPR ${selectedCustomer.held}`} />
                  <SideInfo label="Table Wins" value={`NPR ${selectedCustomer.wins}`} color="green" />
                  <SideInfo label="Table Losses" value={`NPR ${selectedCustomer.losses}`} color="red" />

                  <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">
                      Current Table Balance
                    </p>
                    <p className="mt-2 font-serif text-2xl font-bold text-sky-700">
                      NPR {selectedCustomer.balance}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-4 gap-2">
                  {['Chip-In', 'Win', 'Loss', 'Return'].map((action) => (
                    <button
                      key={action}
                      onClick={() => setActionPanel(action)}
                      className={`rounded-lg px-2 py-2 text-xs font-bold ${actionClass[action]}`}
                    >
                      {action}
                    </button>
                  ))}
                </div>

                <button className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  Open Full Wallet
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2
                    className={`text-sm font-extrabold uppercase tracking-[0.16em] ${
                      actionPanel === 'Loss'
                        ? 'text-red-700'
                        : actionPanel === 'Win'
                          ? 'text-emerald-700'
                          : actionPanel === 'Chip-In'
                            ? 'text-sky-700'
                            : 'text-yellow-700'
                    }`}
                  >
                    Record {actionPanel}
                  </h2>

                  <button
                    type="button"
                    onClick={() => setShowRightPanel(false)}
                    className="text-slate-400"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-950">{selectedCustomer.name}</p>
                  <p className="text-sm text-slate-500">
                    Badge {selectedCustomer.badge} · {selectedCustomer.cid}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Table: <b>{pageTitle}</b>
                  </p>
                  <p className="text-sm text-slate-600">
                    Recorded by: <b>Ganesh Recorder</b>
                  </p>
                </div>

                <div className="mt-5 space-y-3">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
                    Denomination Quantity
                  </p>

                  {denominations.map((denom) => (
                    <div
                      key={denom.label}
                      className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                    >
                      <span className="text-sm font-bold text-slate-700">{denom.label}</span>
                      <button className="h-8 w-8 rounded-md border border-slate-200 bg-slate-50 font-bold text-slate-600">
                        -
                      </button>
                      <span className="w-8 text-center font-bold text-slate-900">
                        {denom.value}
                      </span>
                      <button className="h-8 w-8 rounded-md border border-slate-200 bg-slate-50 font-bold text-slate-600">
                        +
                      </button>
                    </div>
                  ))}
                </div>

                <div
                  className={`mt-5 rounded-xl border p-4 ${
                    actionPanel === 'Loss'
                      ? 'border-red-200 bg-red-50'
                      : actionPanel === 'Win'
                        ? 'border-emerald-200 bg-emerald-50'
                        : actionPanel === 'Chip-In'
                          ? 'border-sky-200 bg-sky-50'
                          : 'border-yellow-300 bg-yellow-50'
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Total Chip Value Auto Calculated
                  </p>
                  <p
                    className={`mt-2 font-serif text-3xl font-bold ${
                      actionPanel === 'Loss'
                        ? 'text-red-700'
                        : actionPanel === 'Win'
                          ? 'text-emerald-700'
                          : actionPanel === 'Chip-In'
                            ? 'text-sky-700'
                            : 'text-yellow-700'
                    }`}
                  >
                    NPR 20,000
                  </p>
                </div>

                <div className="mt-4 rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
                  Manual total value typing is disabled. Total is calculated from chip denominations.
                </div>

                <button className={`mt-5 w-full rounded-lg px-5 py-3 text-sm font-extrabold ${actionClass[actionPanel]}`}>
                  Post {actionPanel}
                </button>

                <button className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  Reset
                </button>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                <p className="font-extrabold">No unresolved chips for this customer.</p>
                <p className="mt-1">All movements are synced with Chip Control.</p>
              </div>
            </aside>
          )}
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur lg:left-72">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAddCustomer(true)}
            className="rounded-lg bg-yellow-400 px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-yellow-300"
          >
            + Add Customer
          </button>

          {['Chip-In', 'Win', 'Loss', 'Return'].map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => {
                setActionPanel(action)
                setShowRightPanel(true)
              }}
              className={`rounded-lg px-5 py-3 text-sm font-extrabold ${actionClass[action]}`}
            >
              {action === 'Return' ? 'Return From Table' : action}
            </button>
          ))}

          <button className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
            Open Wallet
          </button>

          <button className="rounded-lg border border-purple-200 bg-purple-50 px-5 py-3 text-sm font-bold text-purple-700 hover:bg-purple-100">
            Table Reconciliation
          </button>

          <button className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
            More
          </button>

          <span className="ml-auto hidden text-xs font-bold text-slate-500 xl:block">
            All entries are denomination based · Audit log enabled
          </span>
        </div>
      </div>

      {showAddCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl font-bold text-slate-950">
                  <span className="mr-2 text-yellow-500">◆</span>
                  Add Customer to Table
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Search by badge or CID and add customer to the current table session.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCustomer(false)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-500 hover:bg-slate-50"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
              <input className={inputClass} placeholder="Enter badge number or CID..." />
              <button className="rounded-lg bg-yellow-400 px-5 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-yellow-300">
                Fetch Customer
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-sky-100 px-3 py-2 font-mono text-lg font-bold text-sky-700">
                  199
                </span>

                <div>
                  <p className="font-bold text-slate-950">Kiran Lama</p>
                  <p className="text-sm text-slate-500">CID-00199 · Wallet NPR 2,50,000</p>
                </div>

                <span className="ml-auto rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase text-emerald-700">
                  Eligible
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
                  Initial Held At Table
                </span>
                <input className={inputClass} defaultValue="NPR 50,000" />
              </label>

              <label>
                <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
                  Added By
                </span>
                <input className={inputClass} value="Raju Recorder" readOnly />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddCustomer(false)}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => setShowAddCustomer(false)}
                className="rounded-lg bg-yellow-400 px-5 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-yellow-300"
              >
                Add to Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const InfoLine = ({ label, value, color }) => {
  const colorClass =
    color === 'green'
      ? 'text-emerald-600'
      : color === 'red'
        ? 'text-red-600'
        : color === 'blue'
          ? 'text-sky-600'
          : 'text-slate-900'

  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-extrabold ${colorClass}`}>{value}</p>
    </div>
  )
}

const SideInfo = ({ label, value, color }) => {
  const colorClass =
    color === 'green'
      ? 'text-emerald-600'
      : color === 'red'
        ? 'text-red-600'
        : 'text-slate-950'

  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 text-sm last:border-b-0">
      <span className="text-slate-500">{label}</span>
      <span className={`font-extrabold ${colorClass}`}>{value}</span>
    </div>
  )
}

const StaffInfo = ({ title, rows }) => (
  <div>
    <h3 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">
      {title}
    </h3>
    <div className="mt-3 space-y-2">
      {rows.map((row) => (
        <p key={row} className="text-sm font-medium text-slate-600">
          {row}
        </p>
      ))}
    </div>
  </div>
)

export default LiveTableOperation