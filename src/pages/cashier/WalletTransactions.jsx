import { useState } from 'react'

const walletRows = [
  {
    badge: '087',
    initials: 'RS',
    customer: 'Raj Sharma',
    cid: 'CID-1001',
    tier: 'VIP',
    buyIn: '1,00,000',
    gamePlay: '1,80,000',
    win: '60,000',
    loss: '90,000',
    partial: '10,000',
    finalCashOut: '0',
    eligible: '9,000',
    nonEligible: '8,000',
    expected: '50,000',
    unresolved: '0',
    status: 'Active',
  },
  {
    badge: '044',
    initials: 'AV',
    customer: 'Amit Verma',
    cid: 'CID-1002',
    tier: 'Standard',
    buyIn: '30,000',
    gamePlay: '30,000',
    win: '0',
    loss: '30,000',
    partial: '10,000',
    finalCashOut: '0',
    eligible: '3,000',
    nonEligible: '0',
    expected: '0',
    unresolved: '0',
    status: 'Clean',
  },
  {
    badge: '112',
    initials: 'DS',
    customer: 'Daniel Smith',
    cid: 'CID-1003',
    tier: 'VVIP',
    buyIn: '15,00,000',
    gamePlay: '22,00,000',
    win: '5,10,000',
    loss: '2,20,000',
    partial: '3,00,000',
    finalCashOut: '8,00,000',
    eligible: '22,000',
    nonEligible: '20,000',
    expected: '4,10,000',
    unresolved: '40,000',
    status: 'High Exposure',
  },
  {
    badge: '026',
    initials: 'SR',
    customer: 'Suresh Rai',
    cid: 'CID-1004',
    tier: 'Standard',
    buyIn: '60,000',
    gamePlay: '82,000',
    win: '22,000',
    loss: '60,000',
    partial: '22,000',
    finalCashOut: '0',
    eligible: '6,000',
    nonEligible: '6,000',
    expected: '0',
    unresolved: '0',
    status: 'Clean',
  },
  {
    badge: '051',
    initials: 'PT',
    customer: 'Priya Tamang',
    cid: 'CID-1005',
    tier: 'VIP',
    buyIn: '4,00,000',
    gamePlay: '5,80,000',
    win: '1,00,000',
    loss: '3,50,000',
    partial: '50,000',
    finalCashOut: '0',
    eligible: '35,000',
    nonEligible: '30,000',
    expected: '45,000',
    unresolved: '15,000',
    status: 'Monitor',
  },
  {
    badge: '099',
    initials: 'CW',
    customer: 'Chen Wei',
    cid: 'CID-1007',
    tier: 'VIP',
    buyIn: '2,50,000',
    gamePlay: '1,20,000',
    win: '20,000',
    loss: '1,00,000',
    partial: '10,000',
    finalCashOut: '0',
    eligible: '10,000',
    nonEligible: '10,000',
    expected: '80,000',
    unresolved: '30,000',
    status: 'Suspicious',
  },
]

const historyRows = [
  { time: '17:20', type: 'Partial Cash-Out', source: 'Cashier', table: '-', amount: '-10,000', balance: '50,000' },
  { time: '16:45', type: 'Table Loss', source: 'Baccarat', table: 'T1', amount: '-40,000', balance: '60,000' },
  { time: '16:00', type: 'Table Win', source: 'Baccarat', table: 'T1', amount: '+20,000', balance: '1,00,000' },
  { time: '15:20', type: 'Table Loss', source: 'Roulette', table: 'T2', amount: '-50,000', balance: '80,000' },
  { time: '14:35', type: 'Table Win', source: 'Roulette', table: 'T2', amount: '+40,000', balance: '1,30,000' },
  { time: '14:10', type: 'Chip Buy-In', source: 'Cashier', table: '-', amount: '+1,00,000', balance: '1,00,000' },
]

const summaryCards = [
  { label: 'Active Wallets', value: '86', sub: 'Customers playing', border: 'border-sky-200', icon: '👥' },
  { label: 'Total Buy-In Chips', value: 'NPR 42,80,000', sub: 'Today’s chips issued', border: 'border-emerald-200', icon: '🪙' },
  { label: 'Total Game Play', value: 'NPR 68,40,000', sub: 'Table + machine', border: 'border-purple-200', icon: '📈' },
  { label: 'Total Cash-Out / Returns', value: 'NPR 28,65,000', sub: 'Partial + final', border: 'border-cyan-200', icon: '↪' },
  { label: 'Expected Holding', value: 'NPR 9,86,000', sub: 'Chips in wallets', border: 'border-yellow-300', icon: '💼' },
  { label: 'Unresolved Chips', value: 'NPR 1,25,000', sub: 'Require attention', border: 'border-red-300', icon: '⚠' },
  { label: 'High Exposure Wallets', value: '5', sub: 'Need monitoring', border: 'border-fuchsia-200', icon: '🎯' },
]

const statusClass = {
  Clean: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Active: 'border-sky-200 bg-sky-50 text-sky-700',
  Monitor: 'border-yellow-300 bg-yellow-50 text-yellow-700',
  'High Exposure': 'border-red-200 bg-red-50 text-red-700',
  Suspicious: 'border-purple-200 bg-purple-50 text-purple-700',
  Review: 'border-orange-200 bg-orange-50 text-orange-700',
}

const inputClass =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'

const tabs = [
  'Customer Wallets',
  'Wallet History',
  'Table-Wise Flow',
  'Partial Returns',
  'Unresolved Chips',
  'Suspicious Alerts',
  'Daily Reconciliation',
]

const ChipControl = () => {
  const [activeTab, setActiveTab] = useState('Customer Wallets')
  const [selectedWallet, setSelectedWallet] = useState(walletRows[0])
  const [drawerOpen, setDrawerOpen] = useState(true)

  const openWallet = (wallet) => {
    setSelectedWallet(wallet)
    setDrawerOpen(true)
  }

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-950">
            <span className="mr-2 text-yellow-500">◆</span>
            Chip Control
            <span className="ml-2 text-base text-emerald-600">●</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Customer chip wallet, chip flow tracking, partial returns, unresolved chips and risk monitoring.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <input type="date" className={inputClass} defaultValue="2026-07-15" />
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
            Filter
          </button>
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
            Export
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-4 py-3 text-sm font-extrabold ${
              activeTab === tab
                ? 'border-b-2 border-yellow-400 text-yellow-700'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-7">
        {summaryCards.map((card) => (
          <div key={card.label} className={`rounded-2xl border ${card.border} bg-white p-5 shadow-sm`}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
                {card.label}
              </p>
              <span className="text-lg">{card.icon}</span>
            </div>
            <p className="mt-4 font-serif text-2xl font-bold text-slate-950">{card.value}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{card.sub}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_420px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-[1fr_150px_150px_150px_180px_auto]">
            <input className={inputClass} placeholder="Search badge / name / CID..." />
            <select className={inputClass}>
              <option>All Status</option>
              <option>Clean</option>
              <option>Active</option>
              <option>Monitor</option>
              <option>Suspicious</option>
            </select>
            <select className={inputClass}>
              <option>All Tables</option>
              <option>Baccarat</option>
              <option>Roulette</option>
              <option>Mini Flush</option>
            </select>
            <select className={inputClass}>
              <option>All Tiers</option>
              <option>Standard</option>
              <option>VIP</option>
              <option>VVIP</option>
            </select>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-600">
              <input type="checkbox" />
              High Exposure Only
            </label>
            <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Export
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1320px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Badge</th>
                  <th className="px-4 py-3">Customer / CID / Tier</th>
                  <th className="px-4 py-3">Buy-In</th>
                  <th className="px-4 py-3">Game Play</th>
                  <th className="px-4 py-3">Win / Loss</th>
                  <th className="px-4 py-3">Returns</th>
                  <th className="px-4 py-3">Elig. Return</th>
                  <th className="px-4 py-3">Non-Elig. Return</th>
                  <th className="px-4 py-3">Expected Holding</th>
                  <th className="px-4 py-3">Unresolved</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {walletRows.map((row) => (
                  <tr key={row.badge} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <span className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-1.5 font-mono text-base font-bold text-yellow-700">
                        {row.badge}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-100 text-xs font-bold text-yellow-700">
                          {row.initials}
                        </span>
                        <div>
                          <p className="font-bold text-slate-950">{row.customer}</p>
                          <p className="text-xs text-slate-500">
                            {row.cid} · {row.tier}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 font-bold text-slate-700">{row.buyIn}</td>
                    <td className="px-4 py-4 font-bold text-slate-700">{row.gamePlay}</td>

                    <td className="px-4 py-4">
                      <p className="font-bold text-emerald-600">Win {row.win}</p>
                      <p className="font-bold text-red-600">Loss {row.loss}</p>
                    </td>

                    <td className="px-4 py-4 text-slate-700">
                      <p>{row.partial}</p>
                      <p className="text-xs text-slate-400">Final {row.finalCashOut}</p>
                    </td>

                    <td className="px-4 py-4 font-bold text-slate-700">{row.eligible}</td>
                    <td className="px-4 py-4 font-bold text-slate-700">{row.nonEligible}</td>

                    <td
                      className={`px-4 py-4 font-extrabold ${
                        row.expected === '0' ? 'text-slate-500' : 'text-orange-600'
                      }`}
                    >
                      {row.expected}
                    </td>

                    <td
                      className={`px-4 py-4 font-extrabold ${
                        row.unresolved === '0' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {row.unresolved}
                    </td>

                    <td className="px-4 py-4">
                      <span className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase ${statusClass[row.status]}`}>
                        {row.status}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => openWallet(row)}
                        className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100"
                      >
                        View Wallet
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-500">
            <span>Showing 1 to 6 of 86 customers</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  className={`rounded-lg px-3 py-1.5 font-bold ${
                    page === 1
                      ? 'bg-yellow-400 text-slate-950'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </div>

        {drawerOpen && selectedWallet && (
          <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950">Customer Chip Wallet</h2>
                <p className="mt-1 text-sm text-slate-500">Session · DAY-2026-07-15-{selectedWallet.badge}</p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm font-bold text-slate-500 hover:bg-slate-50"
              >
                ×
              </button>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100 text-lg font-bold text-yellow-700">
                {selectedWallet.initials}
              </div>
              <div>
                <p className="font-serif text-xl font-bold text-slate-950">{selectedWallet.customer}</p>
                <p className="text-sm text-slate-500">
                  {selectedWallet.cid} · Badge {selectedWallet.badge}
                </p>
                <span className="mt-2 inline-flex rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-700">
                  {selectedWallet.tier}
                </span>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto border-b border-slate-200">
              {['Wallet Summary', 'Table Breakdown', 'Wallet History', 'Alerts & Notes'].map((tab, index) => (
                <button
                  key={tab}
                  className={`shrink-0 px-3 py-2 text-xs font-extrabold ${
                    index === 0
                      ? 'border-b-2 border-yellow-400 text-yellow-700'
                      : 'text-slate-500'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <InfoCard label="Total Buy-In" value={selectedWallet.buyIn} />
                <InfoCard label="Eligible Losing Return" value={selectedWallet.eligible} accent="purple" />
                <InfoCard label="Total Game Play" value={selectedWallet.gamePlay} />
                <InfoCard label="Non-Eligible Return Chips" value={selectedWallet.nonEligible} accent="sky" />
                <InfoCard label="Table Wins" value={selectedWallet.win} accent="green" />
                <InfoCard label="Table Losses" value={selectedWallet.loss} accent="red" />
                <InfoCard label="Partial Returns" value={selectedWallet.partial} />
                <InfoCard label="Final Cash-Out" value={selectedWallet.finalCashOut} />
              </div>

              <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-yellow-700">
                  Expected Holding
                </p>
                <p className="mt-2 font-serif text-3xl font-bold text-slate-950">
                  {selectedWallet.expected}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                  Unresolved Chips
                </p>
                <p className="mt-2 font-serif text-2xl font-bold text-emerald-700">
                  {selectedWallet.unresolved}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-slate-700">
                Wallet Position
              </h3>
              <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-200">
                <div className="inline-block h-full w-[70%] bg-emerald-400" />
                <div className="inline-block h-full w-[15%] bg-sky-400" />
                <div className="inline-block h-full w-[15%] bg-red-400" />
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
                <span>🟢 Available {selectedWallet.expected}</span>
                <span>🔵 Non-Eligible {selectedWallet.nonEligible}</span>
                <span>🔴 Unresolved {selectedWallet.unresolved}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-slate-700">
                Quick Actions
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700">
                  Cash-Out / Return
                </button>
                <button className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700">
                  Losing Return
                </button>
                <button className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700">
                  Transport Claim
                </button>
                <button className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                  Add Note
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-slate-700">
                  Recent Transaction History
                </h3>
                <button className="text-xs font-bold text-yellow-700">View All</button>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyRows.map((row) => (
                    <tr key={`${row.time}-${row.type}`}>
                      <td className="px-3 py-2 text-slate-600">{row.time}</td>
                      <td
                        className={`px-3 py-2 font-bold ${
                          row.amount.startsWith('+') ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {row.type}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{row.source}</td>
                      <td
                        className={`px-3 py-2 font-bold ${
                          row.amount.startsWith('+') ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {row.amount}
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-700">{row.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
              Amounts shown in chip value NPR based on verified records.
            </div>
          </aside>
        )}
      </section>

      <div className="flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs font-bold text-slate-600 shadow-sm">
        <span className="text-emerald-600">● Clean — no issues</span>
        <span className="text-sky-600">● Active — currently playing</span>
        <span className="text-yellow-600">● Monitor — watch closely</span>
        <span className="text-red-600">● High Exposure — large holding</span>
        <span className="text-purple-600">● Suspicious — possible risk</span>
        <span className="text-orange-600">● Review — supervisor review</span>
      </div>
    </div>
  )
}

const InfoCard = ({ label, value, accent }) => {
  const color =
    accent === 'green'
      ? 'text-emerald-600'
      : accent === 'red'
        ? 'text-red-600'
        : accent === 'purple'
          ? 'text-purple-600'
          : accent === 'sky'
            ? 'text-sky-600'
            : 'text-slate-900'

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className={`mt-2 font-bold ${color}`}>{value}</p>
    </div>
  )
}

export default ChipControl