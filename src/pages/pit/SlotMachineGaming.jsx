import { useMemo, useState } from 'react'

const initialMachines = [
  {
    id: 'SLOT-01',
    name: 'Slot Machine 1',
    type: 'Slot',
    player: 'Raj Sharma',
    badge: '087',
    walletLoad: 0,
    win: 0,
    loss: 0,
    recorder: 'Milan Thapa',
    status: 'Active',
    openedAt: '18:42',
  },
  {
    id: 'SLOT-02',
    name: 'Slot Machine 2',
    type: 'Slot',
    player: '',
    badge: '',
    walletLoad: 0,
    win: 2200,
    loss: 3100,
    recorder: '',
    status: 'Idle',
    openedAt: '',
  },
  {
    id: 'SLOT-03',
    name: 'Slot Machine 3',
    type: 'Slot',
    player: 'Amit Verma',
    badge: '044',
    walletLoad: 0,
    win: 4400,
    loss: 6200,
    recorder: 'Raju KC',
    status: 'Active',
    openedAt: '19:25',
  },
  {
    id: 'SLOT-04',
    name: 'Slot Machine 4',
    type: 'Slot',
    player: '',
    badge: '',
    walletLoad: 0,
    win: 6600,
    loss: 9300,
    recorder: '',
    status: 'Idle',
    openedAt: '',
  },
  {
    id: 'SLOT-05',
    name: 'Slot Machine 5',
    type: 'Slot',
    player: 'Suresh Adhikari',
    badge: '091',
    walletLoad: 11000,
    win: 8800,
    loss: 12400,
    recorder: 'Nabin Rai',
    status: 'Active',
    openedAt: '18:58',
  },
  {
    id: 'SLOT-06',
    name: 'Slot Machine 6',
    type: 'Slot',
    player: '',
    badge: '',
    walletLoad: 0,
    win: 11000,
    loss: 15500,
    recorder: '',
    status: 'Idle',
    openedAt: '',
  },
  {
    id: 'SLOT-07',
    name: 'Slot Machine 7',
    type: 'Slot',
    player: 'Deepak Joshi',
    badge: '073',
    walletLoad: 14000,
    win: 13200,
    loss: 18600,
    recorder: 'Milan Thapa',
    status: 'Active',
    openedAt: '19:10',
  },
  {
    id: 'SLOT-08',
    name: 'Slot Machine 8',
    type: 'Slot',
    player: '',
    badge: '',
    walletLoad: 0,
    win: 15400,
    loss: 21700,
    recorder: '',
    status: 'Idle',
    openedAt: '',
  },
  {
    id: 'SLOT-09',
    name: 'Slot Machine 9',
    type: 'Slot',
    player: 'Pawan Gurung',
    badge: '066',
    walletLoad: 17000,
    win: 17600,
    loss: 24800,
    recorder: 'Raju KC',
    status: 'Active',
    openedAt: '19:18',
  },
  {
    id: 'SLOT-10',
    name: 'Slot Machine 10',
    type: 'Slot',
    player: '',
    badge: '',
    walletLoad: 0,
    win: 19800,
    loss: 27900,
    recorder: '',
    status: 'Idle',
    openedAt: '',
  },
  {
    id: 'AR-01',
    name: 'Automatic Roulette 1',
    type: 'Auto Roulette',
    player: 'Daniel Smith',
    badge: '112',
    walletLoad: 0,
    win: 12000,
    loss: 8000,
    recorder: 'Sita Gurung',
    status: 'Active',
    openedAt: '19:03',
  },
  {
    id: 'AR-02',
    name: 'Automatic Roulette 2',
    type: 'Auto Roulette',
    player: 'Priya Tamang',
    badge: '051',
    walletLoad: 0,
    win: 3500,
    loss: 7200,
    recorder: 'Karan Lama',
    status: 'Active',
    openedAt: '19:14',
  },
  {
    id: 'AR-03',
    name: 'Automatic Roulette 3',
    type: 'Auto Roulette',
    player: '',
    badge: '',
    walletLoad: 0,
    win: 0,
    loss: 0,
    recorder: '',
    status: 'Idle',
    openedAt: '',
  },
]

const initialPendingLoads = [
  {
    id: 'LOAD-001',
    time: '18:42',
    badge: '087',
    customer: 'Raj Sharma',
    amount: 5000,
    type: 'Slot',
  },
  {
    id: 'LOAD-002',
    time: '19:03',
    badge: '112',
    customer: 'Daniel Smith',
    amount: 20000,
    type: 'Auto Roulette',
  },
  {
    id: 'LOAD-003',
    time: '19:14',
    badge: '051',
    customer: 'Priya Tamang',
    amount: 10000,
    type: 'Auto Roulette',
  },
  {
    id: 'LOAD-004',
    time: '19:25',
    badge: '044',
    customer: 'Amit Verma',
    amount: 8000,
    type: 'Slot',
  },
]

const emptySessionForm = {
  machineId: '',
  badge: '',
  customer: '',
  recorder: '',
  walletLoad: '',
}

const inputClass =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'

const money = (value) =>
  `NPR ${Number(value || 0).toLocaleString('en-IN')}`

const nowTime = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

const SlotMachineGaming = () => {
  const [machines, setMachines] = useState(initialMachines)
  const [pendingLoads, setPendingLoads] = useState(initialPendingLoads)
  const [selectedMachineId, setSelectedMachineId] = useState('AR-01')
  const [search, setSearch] = useState('')
  const [machineType, setMachineType] = useState('All Types')
  const [machineStatus, setMachineStatus] = useState('All Status')
  const [activeModal, setActiveModal] = useState(null)
  const [sessionForm, setSessionForm] = useState(emptySessionForm)
  const [sessionErrors, setSessionErrors] = useState({})
  const [endingMachine, setEndingMachine] = useState(null)
  const [finalWin, setFinalWin] = useState('')
  const [finalLoss, setFinalLoss] = useState('')
  const [toast, setToast] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(nowTime())
  const [logs, setLogs] = useState([
    {
      id: 'LOG-001',
      time: '19:28',
      action: 'Session opened',
      machine: 'AR-02',
      detail: 'Priya Tamang · Badge 051',
    },
    {
      id: 'LOG-002',
      time: '19:25',
      action: 'Wallet load redeemed',
      machine: 'SLOT-03',
      detail: 'NPR 8,000',
    },
    {
      id: 'LOG-003',
      time: '19:14',
      action: 'Session opened',
      machine: 'AR-01',
      detail: 'Daniel Smith · Badge 112',
    },
  ])

  const selectedMachine =
    machines.find((machine) => machine.id === selectedMachineId) || machines[0]

  const summary = useMemo(() => {
    const activeMachines = machines.filter(
      (machine) => machine.status === 'Active',
    )
    const walletLoads = machines.reduce(
      (total, machine) => total + Number(machine.walletLoad || 0),
      0,
    )
    const totalWin = machines.reduce(
      (total, machine) => total + Number(machine.win || 0),
      0,
    )
    const totalLoss = machines.reduce(
      (total, machine) => total + Number(machine.loss || 0),
      0,
    )

    return {
      activeMachines: activeMachines.length,
      activePlayers: activeMachines.filter((machine) => machine.player).length,
      pendingLoads: pendingLoads.length,
      walletLoads,
      casinoWin: Math.max(totalLoss - totalWin, 0),
    }
  }, [machines, pendingLoads])

  const filteredMachines = useMemo(() => {
    const query = search.trim().toLowerCase()

    return machines.filter((machine) => {
      const matchesSearch =
        !query ||
        machine.id.toLowerCase().includes(query) ||
        machine.name.toLowerCase().includes(query) ||
        machine.player.toLowerCase().includes(query) ||
        machine.badge.toLowerCase().includes(query)

      const matchesType =
        machineType === 'All Types' || machine.type === machineType

      const matchesStatus =
        machineStatus === 'All Status' || machine.status === machineStatus

      return matchesSearch && matchesType && matchesStatus
    })
  }, [machines, search, machineStatus, machineType])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })

    window.setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  const appendLog = (action, machine, detail) => {
    setLogs((currentLogs) => [
      {
        id: `LOG-${Date.now()}`,
        time: nowTime(),
        action,
        machine,
        detail,
      },
      ...currentLogs,
    ])
  }

  const refreshPage = () => {
    const time = nowTime()
    setLastUpdated(time)
    showToast(`Machine data refreshed at ${time}.`)
  }

  const exportMachines = () => {
    const header = [
      'Machine ID',
      'Machine',
      'Type',
      'Player',
      'Badge',
      'Wallet Load',
      'Win',
      'Loss',
      'Recorder',
      'Status',
      'Opened At',
    ]

    const rows = filteredMachines.map((machine) => [
      machine.id,
      machine.name,
      machine.type,
      machine.player || '',
      machine.badge || '',
      machine.walletLoad,
      machine.win,
      machine.loss,
      machine.recorder || '',
      machine.status,
      machine.openedAt || '',
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
    anchor.download = 'slot-machine-status.csv'
    anchor.click()

    URL.revokeObjectURL(url)
    showToast('Machine status exported to CSV.')
  }

  const openSessionModal = (machineId = '') => {
    setSessionErrors({})
    setSessionForm({
      ...emptySessionForm,
      machineId,
    })
    setActiveModal('openSession')
  }

  const validateSession = () => {
    const errors = {}

    if (!sessionForm.machineId) {
      errors.machineId = 'Select an idle machine.'
    }

    if (!sessionForm.badge.trim()) {
      errors.badge = 'Badge number is required.'
    }

    if (!sessionForm.customer.trim()) {
      errors.customer = 'Customer name is required.'
    }

    if (!sessionForm.recorder.trim()) {
      errors.recorder = 'Recorder name is required.'
    }

    if (!sessionForm.walletLoad || Number(sessionForm.walletLoad) <= 0) {
      errors.walletLoad = 'Wallet load must be greater than zero.'
    }

    const selected = machines.find(
      (machine) => machine.id === sessionForm.machineId,
    )

    if (selected && selected.status !== 'Idle') {
      errors.machineId = 'This machine already has an active session.'
    }

    const badgeInUse = machines.some(
      (machine) =>
        machine.status === 'Active' &&
        machine.badge === sessionForm.badge.trim(),
    )

    if (badgeInUse) {
      errors.badge = 'This badge already has an active machine session.'
    }

    setSessionErrors(errors)
    return Object.keys(errors).length === 0
  }

  const createSession = () => {
    if (!validateSession()) {
      return
    }

    setMachines((currentMachines) =>
      currentMachines.map((machine) =>
        machine.id === sessionForm.machineId
          ? {
              ...machine,
              player: sessionForm.customer.trim(),
              badge: sessionForm.badge.trim(),
              walletLoad: Number(sessionForm.walletLoad),
              recorder: sessionForm.recorder.trim(),
              win: 0,
              loss: 0,
              status: 'Active',
              openedAt: nowTime(),
            }
          : machine,
      ),
    )

    setSelectedMachineId(sessionForm.machineId)
    appendLog(
      'Session opened',
      sessionForm.machineId,
      `${sessionForm.customer.trim()} · Badge ${sessionForm.badge.trim()}`,
    )

    setActiveModal(null)
    setSessionForm(emptySessionForm)
    showToast(`Machine session opened on ${sessionForm.machineId}.`)
  }

  const openEndSession = (machine) => {
    setEndingMachine(machine)
    setFinalWin(String(machine.win || 0))
    setFinalLoss(String(machine.loss || 0))
    setActiveModal('endSession')
  }

  const confirmEndSession = () => {
    if (!endingMachine) {
      return
    }

    if (Number(finalWin) < 0 || Number(finalLoss) < 0) {
      showToast('Win and loss values cannot be negative.', 'error')
      return
    }

    const detail = `${endingMachine.player} · Win ${money(
      finalWin,
    )} · Loss ${money(finalLoss)}`

    setMachines((currentMachines) =>
      currentMachines.map((machine) =>
        machine.id === endingMachine.id
          ? {
              ...machine,
              player: '',
              badge: '',
              walletLoad: 0,
              recorder: '',
              win: Number(finalWin),
              loss: Number(finalLoss),
              status: 'Idle',
              openedAt: '',
            }
          : machine,
      ),
    )

    appendLog('Session ended', endingMachine.id, detail)
    setSelectedMachineId(endingMachine.id)
    setEndingMachine(null)
    setActiveModal(null)
    setFinalWin('')
    setFinalLoss('')
    showToast(`Session ended for ${endingMachine.id}.`)
  }

  const redeemLoad = (load) => {
    const machine = machines.find(
      (item) =>
        item.status === 'Active' &&
        item.badge === load.badge &&
        item.type === load.type,
    )

    if (!machine) {
      showToast(
        'No matching active machine session was found for this load.',
        'error',
      )
      return
    }

    setMachines((currentMachines) =>
      currentMachines.map((item) =>
        item.id === machine.id
          ? {
              ...item,
              walletLoad: Number(item.walletLoad || 0) + load.amount,
            }
          : item,
      ),
    )

    setPendingLoads((currentLoads) =>
      currentLoads.filter((item) => item.id !== load.id),
    )

    setSelectedMachineId(machine.id)
    appendLog(
      'Wallet load redeemed',
      machine.id,
      `${load.customer} · ${money(load.amount)}`,
    )
    showToast(`${money(load.amount)} redeemed to ${machine.id}.`)
  }

  const openMachineDetails = (machine) => {
    setSelectedMachineId(machine.id)
    setActiveModal('details')
  }

  const netPosition = (machine) =>
    Number(machine.loss || 0) - Number(machine.win || 0)

  const summaryCards = [
    {
      label: 'Active Machines',
      value: summary.activeMachines,
      sub: 'Running now',
      icon: '🎮',
      border: 'border-yellow-300',
    },
    {
      label: 'Active Players',
      value: summary.activePlayers,
      sub: 'Current machine players',
      icon: '👤',
      border: 'border-purple-200',
    },
    {
      label: 'Pending Cashier Loads',
      value: summary.pendingLoads,
      sub: 'Awaiting redemption',
      icon: '⬇',
      border: 'border-sky-200',
    },
    {
      label: 'Wallet Loads Today',
      value: money(summary.walletLoads),
      sub: 'Loaded for machine play',
      icon: '💳',
      border: 'border-emerald-200',
    },
    {
      label: 'Casino Win Today',
      value: money(summary.casinoWin),
      sub: 'Net machine win',
      icon: '📈',
      border: 'border-emerald-200',
    },
  ]

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-950">
            <span className="mr-2 text-yellow-500">◆</span>
            Slot & Machine Gaming
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage active machine sessions, redeem cashier wallet loads and
            record final machine results.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={refreshPage}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('machineLog')}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Machine Log
          </button>

          <button
            type="button"
            onClick={() => openSessionModal()}
            className="rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-extrabold text-slate-950 shadow-sm hover:bg-yellow-300"
          >
            + Open Machine Session
          </button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
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
                <p className="mt-2 font-serif text-2xl font-bold text-slate-950">
                  {card.value}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {card.sub}
                </p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_390px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 xl:flex-row">
            <input
              className={inputClass}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search machine ID, machine name, customer or badge..."
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
            </select>

            <button
              type="button"
              onClick={exportMachines}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Export CSV
            </button>
          </div>

          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">
                Machine Sessions
              </h2>

              <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-600">
                <span className="text-emerald-600">● Active</span>
                <span className="text-yellow-600">● Idle</span>
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
                    className={`transition hover:bg-slate-50 ${
                      selectedMachine?.id === machine.id
                        ? 'bg-yellow-50/50'
                        : ''
                    }`}
                  >
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedMachineId(machine.id)}
                        className={`rounded-md border px-3 py-1.5 font-mono text-sm font-bold ${
                          machine.type === 'Auto Roulette'
                            ? 'border-purple-300 bg-purple-50 text-purple-700'
                            : 'border-yellow-300 bg-yellow-50 text-yellow-700'
                        }`}
                      >
                        {machine.id}
                      </button>
                    </td>

                    <td className="px-4 py-4 font-bold text-slate-950">
                      {machine.name}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {machine.type}
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-800">
                      {machine.player || '—'}
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-slate-700">
                      {machine.badge || '—'}
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-800">
                      {money(machine.walletLoad)}
                    </td>
                    <td className="px-4 py-4 font-bold text-emerald-600">
                      {money(machine.win)}
                    </td>
                    <td className="px-4 py-4 font-bold text-red-600">
                      {money(machine.loss)}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {machine.recorder || '—'}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={machine.status} />
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {machine.status === 'Idle' ? (
                          <button
                            type="button"
                            onClick={() => openSessionModal(machine.id)}
                            className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs font-bold text-yellow-700 hover:bg-yellow-100"
                          >
                            Open Session
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openMachineDetails(machine)}
                            className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100"
                          >
                            View Details
                          </button>
                        )}

                        {machine.status === 'Active' && (
                          <button
                            type="button"
                            onClick={() => openEndSession(machine)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                          >
                            End Session
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredMachines.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-5 py-16 text-center text-sm text-slate-500"
                    >
                      No machines match your search or filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500">
            <span>
              Showing {filteredMachines.length} of {machines.length} machines
            </span>
            <span>Last updated: {lastUpdated}</span>
            <button
              type="button"
              onClick={refreshPage}
              className="text-sm font-bold text-yellow-700"
            >
              Refresh
            </button>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-yellow-700">
                Pending Wallet Loads
              </h2>

              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
                {pendingLoads.length}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {pendingLoads.map((load) => (
                <div key={load.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        {load.customer}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Badge {load.badge} · {load.type} · {load.time}
                      </p>
                    </div>

                    <p className="text-sm font-black text-slate-950">
                      {money(load.amount)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => redeemLoad(load)}
                    className="w-full rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs font-black text-yellow-700 hover:bg-yellow-100"
                  >
                    Redeem to Active Machine
                  </button>
                </div>
              ))}

              {pendingLoads.length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-slate-500">
                  No pending cashier loads.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">
                Selected Machine
              </h2>

              <StatusBadge status={selectedMachine?.status || 'Idle'} />
            </div>

            <div className="mt-5 flex gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-yellow-300 bg-yellow-50 text-4xl">
                {selectedMachine?.type === 'Auto Roulette' ? '🎡' : '🎰'}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-2xl font-bold text-slate-950">
                  {selectedMachine?.id}
                </h3>

                <p className="text-sm font-semibold text-slate-500">
                  {selectedMachine?.name}
                </p>

                <div className="mt-4 space-y-2 text-sm">
                  <PreviewLine
                    label="Current Player"
                    value={selectedMachine?.player || 'No active player'}
                  />
                  <PreviewLine
                    label="Badge"
                    value={selectedMachine?.badge || '—'}
                  />
                  <PreviewLine
                    label="Wallet Load"
                    value={money(selectedMachine?.walletLoad)}
                  />
                  <PreviewLine
                    label="Casino Net"
                    value={money(netPosition(selectedMachine))}
                    color={netPosition(selectedMachine) >= 0 ? 'green' : 'red'}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={() => openMachineDetails(selectedMachine)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
              >
                View Details
              </button>

              {selectedMachine?.status === 'Idle' ? (
                <button
                  type="button"
                  onClick={() => openSessionModal(selectedMachine.id)}
                  className="rounded-lg bg-yellow-400 px-4 py-3 text-sm font-extrabold text-slate-950 hover:bg-yellow-300"
                >
                  Open Session
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openEndSession(selectedMachine)}
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-extrabold text-red-700 hover:bg-red-100"
                >
                  End Session
                </button>
              )}
            </div>
          </div>
        </aside>
      </section>

      {activeModal === 'openSession' && (
        <ModalOverlay onClose={() => setActiveModal(null)}>
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title="Open Machine Session"
              description="Assign an idle machine to one active customer and load the opening wallet amount."
              onClose={() => setActiveModal(null)}
            />

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <SelectField
                label="Machine"
                value={sessionForm.machineId}
                error={sessionErrors.machineId}
                options={machines
                  .filter((machine) => machine.status === 'Idle')
                  .map((machine) => ({
                    value: machine.id,
                    label: `${machine.id} · ${machine.name}`,
                  }))}
                onChange={(value) =>
                  setSessionForm((current) => ({
                    ...current,
                    machineId: value,
                  }))
                }
              />

              <InputField
                label="Badge Number"
                value={sessionForm.badge}
                error={sessionErrors.badge}
                placeholder="Example: 087"
                onChange={(value) =>
                  setSessionForm((current) => ({
                    ...current,
                    badge: value,
                  }))
                }
              />

              <InputField
                label="Customer Name"
                value={sessionForm.customer}
                error={sessionErrors.customer}
                placeholder="Enter customer name"
                onChange={(value) =>
                  setSessionForm((current) => ({
                    ...current,
                    customer: value,
                  }))
                }
              />

              <InputField
                label="Recorder"
                value={sessionForm.recorder}
                error={sessionErrors.recorder}
                placeholder="Enter recorder name"
                onChange={(value) =>
                  setSessionForm((current) => ({
                    ...current,
                    recorder: value,
                  }))
                }
              />

              <div className="sm:col-span-2">
                <InputField
                  label="Opening Wallet Load"
                  value={sessionForm.walletLoad}
                  error={sessionErrors.walletLoad}
                  placeholder="Enter NPR amount"
                  type="number"
                  onChange={(value) =>
                    setSessionForm((current) => ({
                      ...current,
                      walletLoad: value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={createSession}
                className="rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-yellow-300"
              >
                Open Session
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {activeModal === 'endSession' && endingMachine && (
        <ModalOverlay onClose={() => setActiveModal(null)}>
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title={`End Session · ${endingMachine.id}`}
              description="Record the final machine result before releasing the machine."
              onClose={() => setActiveModal(null)}
            />

            <div className="space-y-4 p-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-950">
                  {endingMachine.player}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Badge {endingMachine.badge} · Wallet{' '}
                  {money(endingMachine.walletLoad)}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Final Customer Win"
                  value={finalWin}
                  placeholder="0"
                  type="number"
                  onChange={setFinalWin}
                />

                <InputField
                  label="Final Customer Loss"
                  value={finalLoss}
                  placeholder="0"
                  type="number"
                  onChange={setFinalLoss}
                />
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <PreviewLine
                  label="Casino Net Position"
                  value={money(Number(finalLoss || 0) - Number(finalWin || 0))}
                  color={
                    Number(finalLoss || 0) - Number(finalWin || 0) >= 0
                      ? 'green'
                      : 'red'
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmEndSession}
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800"
              >
                Confirm End Session
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {activeModal === 'details' && selectedMachine && (
        <ModalOverlay onClose={() => setActiveModal(null)}>
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title={`${selectedMachine.id} · ${selectedMachine.name}`}
              description="Current machine status and active session details."
              onClose={() => setActiveModal(null)}
            />

            <div className="space-y-5 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailCard label="Machine Type" value={selectedMachine.type} />
                <DetailCard
                  label="Status"
                  value={selectedMachine.status}
                />
                <DetailCard
                  label="Current Player"
                  value={selectedMachine.player || 'No active player'}
                />
                <DetailCard
                  label="Badge"
                  value={selectedMachine.badge || '—'}
                />
                <DetailCard
                  label="Recorder"
                  value={selectedMachine.recorder || '—'}
                />
                <DetailCard
                  label="Opened At"
                  value={selectedMachine.openedAt || '—'}
                />
                <DetailCard
                  label="Wallet Load"
                  value={money(selectedMachine.walletLoad)}
                />
                <DetailCard
                  label="Casino Net Position"
                  value={money(netPosition(selectedMachine))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>

              {selectedMachine.status === 'Active' && (
                <button
                  type="button"
                  onClick={() => openEndSession(selectedMachine)}
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-black text-red-700 hover:bg-red-100"
                >
                  End Session
                </button>
              )}
            </div>
          </div>
        </ModalOverlay>
      )}

      {activeModal === 'machineLog' && (
        <ModalOverlay onClose={() => setActiveModal(null)}>
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title="Machine Activity Log"
              description="Recent machine session and wallet load activity."
              onClose={() => setActiveModal(null)}
            />

            <div className="max-h-[65vh] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Time</th>
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Machine</th>
                    <th className="px-5 py-3">Details</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-5 py-4 text-slate-600">{log.time}</td>
                      <td className="px-5 py-4 font-black text-slate-900">
                        {log.action}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-yellow-700">
                        {log.machine}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {log.detail}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end border-t border-slate-200 bg-slate-50 p-4">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800"
              >
                Close Log
              </button>
            </div>
          </div>
        </ModalOverlay>
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

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex rounded-lg border px-3 py-1 text-xs font-bold uppercase ${
      status === 'Active'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-yellow-300 bg-yellow-50 text-yellow-700'
    }`}
  >
    {status}
  </span>
)

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

const ModalOverlay = ({ children, onClose }) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        onClose()
      }
    }}
  >
    {children}
  </div>
)

const ModalHeader = ({ title, description, onClose }) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
    <div>
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 rotate-45 bg-yellow-400" />
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

const InputField = ({
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
    </span>

    <input
      type={type}
      value={value}
      min={type === 'number' ? 0 : undefined}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={`h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none transition ${
        error
          ? 'border-red-300 focus:border-red-500'
          : 'border-slate-200 focus:border-yellow-400'
      }`}
    />

    {error && (
      <span className="mt-1 block text-xs font-semibold text-red-600">
        {error}
      </span>
    )}
  </label>
)

const SelectField = ({ label, value, onChange, options, error }) => (
  <label className="block">
    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
      {label}
    </span>

    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none transition ${
        error
          ? 'border-red-300 focus:border-red-500'
          : 'border-slate-200 focus:border-yellow-400'
      }`}
    >
      <option value="">Select machine</option>

      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>

    {error && (
      <span className="mt-1 block text-xs font-semibold text-red-600">
        {error}
      </span>
    )}
  </label>
)

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

export default SlotMachineGaming
