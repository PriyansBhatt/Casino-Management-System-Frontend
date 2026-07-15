import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const summaryCards = [
  {
    label: 'Active Machines',
    value: '7',
    sub: 'Running now',
    icon: '🎮',
    border: 'border-yellow-300',
  },
  {
    label: 'Active Players',
    value: '6',
    sub: 'Current machine players',
    icon: '👤',
    border: 'border-purple-200',
  },
  {
    label: 'Pending Cashier Loads',
    value: '4',
    sub: 'Awaiting redeem',
    icon: '⬇',
    border: 'border-sky-200',
  },
  {
    label: 'Wallet Loads Today',
    value: 'NPR 93,000',
    sub: 'Cashier-loaded play',
    icon: '💳',
    border: 'border-emerald-200',
  },
  {
    label: 'Casino Win Today',
    value: 'NPR 1,60,000',
    sub: 'Net machine win',
    icon: '📈',
    border: 'border-emerald-200',
  },
  {
    label: 'Maintenance',
    value: '2',
    sub: 'Need attention',
    icon: '🔧',
    border: 'border-red-200',
  },
]

const machines = [
  {
    id: 'SLOT-01',
    name: 'Slot Machine 1',
    type: 'Slot',
    player: 'Raj Sharma',
    badge: '087',
    walletLoad: 'NPR 5,000',
    win: 'NPR 0',
    loss: 'NPR 0',
    recorder: 'Milan Thapa',
    status: 'Active',
  },
  {
    id: 'SLOT-02',
    name: 'Slot Machine 2',
    type: 'Slot',
    player: '—',
    badge: '—',
    walletLoad: 'NPR 0',
    win: 'NPR 2,200',
    loss: 'NPR 3,100',
    recorder: '—',
    status: 'Idle',
  },
  {
    id: 'SLOT-03',
    name: 'Slot Machine 3',
    type: 'Slot',
    player: 'Amit Verma',
    badge: '044',
    walletLoad: 'NPR 8,000',
    win: 'NPR 4,400',
    loss: 'NPR 6,200',
    recorder: 'Raju KC',
    status: 'Active',
  },
  {
    id: 'SLOT-04',
    name: 'Slot Machine 4',
    type: 'Slot',
    player: '—',
    badge: '—',
    walletLoad: 'NPR 0',
    win: 'NPR 6,600',
    loss: 'NPR 9,300',
    recorder: '—',
    status: 'Maintenance',
  },
  {
    id: 'SLOT-05',
    name: 'Slot Machine 5',
    type: 'Slot',
    player: 'Suresh Adhikari',
    badge: '091',
    walletLoad: 'NPR 11,000',
    win: 'NPR 8,800',
    loss: 'NPR 12,400',
    recorder: 'Nabin Rai',
    status: 'Active',
  },
  {
    id: 'SLOT-06',
    name: 'Slot Machine 6',
    type: 'Slot',
    player: '—',
    badge: '—',
    walletLoad: 'NPR 0',
    win: 'NPR 11,000',
    loss: 'NPR 15,500',
    recorder: '—',
    status: 'Idle',
  },
  {
    id: 'SLOT-07',
    name: 'Slot Machine 7',
    type: 'Slot',
    player: 'Deepak Joshi',
    badge: '073',
    walletLoad: 'NPR 14,000',
    win: 'NPR 13,200',
    loss: 'NPR 18,600',
    recorder: 'Milan Thapa',
    status: 'Active',
  },
  {
    id: 'SLOT-08',
    name: 'Slot Machine 8',
    type: 'Slot',
    player: '—',
    badge: '—',
    walletLoad: 'NPR 0',
    win: 'NPR 15,400',
    loss: 'NPR 21,700',
    recorder: '—',
    status: 'Maintenance',
  },
  {
    id: 'SLOT-09',
    name: 'Slot Machine 9',
    type: 'Slot',
    player: 'Pawan Gurung',
    badge: '066',
    walletLoad: 'NPR 17,000',
    win: 'NPR 17,600',
    loss: 'NPR 24,800',
    recorder: 'Raju KC',
    status: 'Active',
  },
  {
    id: 'SLOT-10',
    name: 'Slot Machine 10',
    type: 'Slot',
    player: '—',
    badge: '—',
    walletLoad: 'NPR 0',
    win: 'NPR 19,800',
    loss: 'NPR 27,900',
    recorder: '—',
    status: 'Idle',
  },
  {
    id: 'AR-01',
    name: 'Automatic Roulette 1',
    type: 'Auto Roulette',
    player: 'Daniel Smith',
    badge: '112',
    walletLoad: 'NPR 20,000',
    win: 'NPR 12,000',
    loss: 'NPR 8,000',
    recorder: 'Sita Gurung',
    status: 'Active',
  },
  {
    id: 'AR-02',
    name: 'Automatic Roulette 2',
    type: 'Auto Roulette',
    player: 'Priya Tamang',
    badge: '051',
    walletLoad: 'NPR 10,000',
    win: 'NPR 3,500',
    loss: 'NPR 7,200',
    recorder: 'Karan Lama',
    status: 'Active',
  },
  {
    id: 'AR-03',
    name: 'Automatic Roulette 3',
    type: 'Auto Roulette',
    player: '—',
    badge: '—',
    walletLoad: 'NPR 0',
    win: 'NPR 0',
    loss: 'NPR 0',
    recorder: '—',
    status: 'Idle',
  },
]

const pendingLoads = [
  {
    time: '18:42',
    badge: '087',
    customer: 'Raj Sharma',
    amount: 'NPR 5,000',
    type: 'Slot',
  },
  {
    time: '19:03',
    badge: '112',
    customer: 'Daniel Smith',
    amount: 'NPR 20,000',
    type: 'Auto Roulette',
  },
  {
    time: '19:14',
    badge: '051',
    customer: 'Priya Tamang',
    amount: 'NPR 10,000',
    type: 'Auto Roulette',
  },
  {
    time: '19:25',
    badge: '044',
    customer: 'Amit Verma',
    amount: 'NPR 8,000',
    type: 'Slot',
  },
]

const inputClass =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'

const statusClass = {
  Active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Idle: 'border-yellow-300 bg-yellow-50 text-yellow-700',
  Maintenance: 'border-red-200 bg-red-50 text-red-700',
  'Out of Service': 'border-red-200 bg-red-50 text-red-700',
  Closed: 'border-slate-200 bg-slate-50 text-slate-600',
}

const SlotMachineGaming = () => {
  const navigate = useNavigate()
  const [selectedMachine, setSelectedMachine] = useState(machines.find((item) => item.id === 'AR-01'))
  const [machineType, setMachineType] = useState('All Types')
  const [machineStatus, setMachineStatus] = useState('All Status')

  const filteredMachines = machines.filter((machine) => {
    const typeMatch = machineType === 'All Types' || machine.type === machineType
    const statusMatch = machineStatus === 'All Status' || machine.status === machineStatus
    return typeMatch && statusMatch
  })

  const openLiveMachine = (machineId) => {
    navigate(`/machines/${machineId}`)
  }

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-950">
            <span className="mr-2 text-yellow-500">◆</span>
            Slot & Machine Gaming
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            11 Slot Machines · 3 Automatic Roulette · cashier-loaded play · machine-recorder operated.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
            Refresh
          </button>

          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
            Machine Log
          </button>

          <button className="rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-extrabold text-slate-950 shadow-sm hover:bg-yellow-300">
            + Open Machine Session
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

      <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_430px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row">
            <input
              className={inputClass}
              placeholder="Search machine ID, machine name, customer, badge..."
            />

            <select
              className={inputClass}
              value={machineType}
              onChange={(event) => setMachineType(event.target.value)}
            >
              <option>All Types</option>
              <option>Slot</option>
              <option>Auto Roulette</option>
            </select>

            <select
              className={inputClass}
              value={machineStatus}
              onChange={(event) => setMachineStatus(event.target.value)}
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Idle</option>
              <option>Maintenance</option>
              <option>Out of Service</option>
              <option>Closed</option>
            </select>

            <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Export
            </button>
          </div>

          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">
                Machine Status
              </h2>

              <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-600">
                <span className="text-emerald-600">● Active</span>
                <span className="text-yellow-600">● Idle</span>
                <span className="text-red-600">● Maintenance</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Machine ID</th>
                  <th className="px-4 py-3">Machine</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Current Player</th>
                  <th className="px-4 py-3">Badge</th>
                  <th className="px-4 py-3">Wallet Load</th>
                  <th className="px-4 py-3">Win</th>
                  <th className="px-4 py-3">Loss</th>
                  <th className="px-4 py-3">Recorder</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredMachines.map((machine) => (
                  <tr
                    key={machine.id}
                    className={`cursor-pointer hover:bg-slate-50 ${
                      selectedMachine?.id === machine.id ? 'bg-yellow-50/50' : ''
                    }`}
                    onClick={() => setSelectedMachine(machine)}
                  >
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-md border px-3 py-1.5 font-mono text-sm font-bold ${
                          machine.type === 'Auto Roulette'
                            ? 'border-purple-300 bg-purple-50 text-purple-700'
                            : 'border-yellow-300 bg-yellow-50 text-yellow-700'
                        }`}
                      >
                        {machine.id}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-bold text-slate-950">{machine.name}</td>
                    <td className="px-4 py-4 text-slate-700">{machine.type}</td>
                    <td className="px-4 py-4 font-medium text-slate-800">{machine.player}</td>
                    <td className="px-4 py-4 font-mono font-bold text-slate-700">{machine.badge}</td>
                    <td className="px-4 py-4 font-bold text-slate-800">{machine.walletLoad}</td>
                    <td className="px-4 py-4 font-bold text-emerald-600">{machine.win}</td>
                    <td className="px-4 py-4 font-bold text-red-600">{machine.loss}</td>
                    <td className="px-4 py-4 text-slate-700">{machine.recorder}</td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase ${statusClass[machine.status]}`}
                      >
                        {machine.status}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {machine.status === 'Idle' ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              openLiveMachine(machine.id)
                            }}
                            className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs font-bold text-yellow-700 hover:bg-yellow-100"
                          >
                            Open Session
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              openLiveMachine(machine.id)
                            }}
                            className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100"
                          >
                            View Live
                          </button>
                        )}

                        <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                          Log
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500">
            <span>Showing {filteredMachines.length} of {machines.length} machines</span>
            <span>Last updated: 19:28:45</span>
            <button className="text-sm font-bold text-yellow-700">Refresh</button>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-yellow-700">
                Pending Wallet Loads from Cashier
              </h2>
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
                {pendingLoads.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Time</th>
                    <th className="px-3 py-3">Badge</th>
                    <th className="px-3 py-3">Customer</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {pendingLoads.map((load) => (
                    <tr key={`${load.time}-${load.badge}`}>
                      <td className="px-3 py-3 text-slate-600">{load.time}</td>
                      <td className="px-3 py-3 font-mono font-bold text-slate-700">{load.badge}</td>
                      <td className="px-3 py-3 font-bold text-slate-900">{load.customer}</td>
                      <td className="px-3 py-3 font-bold text-slate-900">{load.amount}</td>
                      <td className="px-3 py-3 text-slate-600">{load.type}</td>
                      <td className="px-3 py-3">
                        <button className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-1.5 text-xs font-bold text-yellow-700 hover:bg-yellow-100">
                          Redeem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button className="w-full border-t border-slate-200 px-5 py-3 text-left text-sm font-bold text-yellow-700 hover:bg-yellow-50">
              View all pending loads →
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">
                Selected Machine Preview
              </h2>

              <span
                className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase ${
                  statusClass[selectedMachine?.status || 'Idle']
                }`}
              >
                {selectedMachine?.status}
              </span>
            </div>

            <div className="mt-5 flex gap-4">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border border-yellow-300 bg-yellow-50 text-5xl">
                {selectedMachine?.type === 'Auto Roulette' ? '🎡' : '🎰'}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-2xl font-bold text-slate-950">
                  {selectedMachine?.id}
                </h3>
                <p className="text-sm font-semibold text-slate-500">{selectedMachine?.name}</p>

                <div className="mt-4 space-y-2 text-sm">
                  <PreviewLine label="Current Player" value={selectedMachine?.player} />
                  <PreviewLine label="Badge" value={selectedMachine?.badge} />
                  <PreviewLine label="Loaded Wallet" value={selectedMachine?.walletLoad} />
                  <PreviewLine label="Current Win" value={selectedMachine?.win} color="green" />
                  <PreviewLine label="Current Loss" value={selectedMachine?.loss} color="red" />
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <PreviewLine label="Net Position" value="NPR 4,000" color="green" />
              <PreviewLine label="Session Status" value={selectedMachine?.status} color="green" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => openLiveMachine(selectedMachine?.id)}
                className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm font-extrabold text-yellow-700 hover:bg-yellow-100"
              >
                View Live Machine
              </button>

              <button className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-extrabold text-red-700 hover:bg-red-100">
                End Session
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-yellow-700">
              Recorder Notes
            </h2>

            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>• Cashier loads appear here for machine redemption.</li>
              <li>• Machine recorder posts final win/loss after play.</li>
              <li>• All wallet loads sync to customer history and reports.</li>
              <li>• Maintenance machines should not allow new sessions.</li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  )
}

const PreviewLine = ({ label, value, color }) => {
  const colorClass =
    color === 'green'
      ? 'text-emerald-600'
      : color === 'red'
        ? 'text-red-600'
        : 'text-slate-900'

  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`font-extrabold ${colorClass}`}>{value}</span>
    </div>
  )
}

export default SlotMachineGaming