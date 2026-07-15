import { useState } from 'react'

const stats = [
  { label: 'Customers Entered Today', value: '5', border: 'border-blue-200', icon: '↪' },
  { label: 'Currently Inside', value: '3', border: 'border-yellow-300', icon: '👥' },
  { label: 'Badges Issued Today', value: '5', border: 'border-slate-200', icon: '🎫' },
  { label: 'Badges Returned Today', value: '1', border: 'border-emerald-200', icon: '↩' },
  { label: 'Exit Pending', value: '1', border: 'border-amber-300', icon: '↪' },
  { label: 'Watchlist Alerts', value: '1', border: 'border-red-300', icon: '🛡' },
  { label: 'KYC Pending Entries', value: '1', border: 'border-amber-300', icon: '!' },
  { label: 'Lost / Damaged Badges', value: '2', border: 'border-red-300', icon: '⚠' },
]

const sessions = [
  {
    badge: '087',
    cid: 'CID-1001',
    initials: 'RS',
    customer: 'Raj Sharma',
    nationality: 'Nepali',
    purpose: 'Game',
    entry: '14:05',
    exit: '—',
    status: 'Inside Casino',
    badgeStatus: 'Active',
  },
  {
    badge: '044',
    cid: 'CID-1002',
    initials: 'AV',
    customer: 'Amit Verma',
    nationality: 'Indian',
    purpose: 'Game',
    entry: '14:22',
    exit: '—',
    status: 'Playing',
    badgeStatus: 'Active',
  },
  {
    badge: '112',
    cid: 'CID-1003',
    initials: 'DS',
    customer: 'Daniel Smith',
    nationality: 'British',
    purpose: 'Game',
    entry: '15:10',
    exit: '—',
    status: 'Inside Casino',
    badgeStatus: 'Active',
  },
  {
    badge: '026',
    cid: 'CID-1004',
    initials: 'SR',
    customer: 'Suresh Rai',
    nationality: 'Nepali',
    purpose: 'Food / Beverage',
    entry: '13:12',
    exit: '15:48',
    status: 'Session Closed',
    badgeStatus: 'Returned',
  },
  {
    badge: '150',
    cid: 'CID-1006',
    initials: 'AK',
    customer: 'Ahmed Khan',
    nationality: 'UAE',
    purpose: 'Hotel / CRM Service',
    entry: '12:40',
    exit: '—',
    status: 'Exit Pending',
    badgeStatus: 'Not Returned',
  },
]

const badgePreview = [
  { no: '001', type: 'available' },
  { no: '002', type: 'issued' },
  { no: '007', type: 'blocked' },
  { no: '026', type: 'returned' },
  { no: '044', type: 'active' },
  { no: '051', type: 'available' },
  { no: '063', type: 'lost' },
  { no: '087', type: 'active' },
  { no: '099', type: 'blocked' },
  { no: '112', type: 'active' },
  { no: '118', type: 'damaged' },
  { no: '121', type: 'blocked' },
  { no: '133', type: 'blocked' },
  { no: '144', type: 'available' },
  { no: '150', type: 'issued' },
  { no: '168', type: 'blocked' },
]

const fullBadges = [
  {
    no: '001',
    status: 'Available',
    statusColor: 'green',
    description: 'No active assignment',
  },
  {
    no: '002',
    status: 'Issued',
    statusColor: 'blue',
    description: 'Ahmed Khan · CID-1006 · Issued 12:40',
  },
  {
    no: '007',
    status: 'Blocked',
    statusColor: 'red',
    description: 'Withdrawn — damaged surface',
  },
  {
    no: '026',
    status: 'Returned',
    statusColor: 'blue',
    description: 'Suresh Rai · CID-1004 · Returned 15:48',
  },
  {
    no: '044',
    status: 'Active',
    statusColor: 'green',
    description: 'Amit Verma · CID-1002 · Issued 14:22',
  },
  {
    no: '051',
    status: 'Available',
    statusColor: 'green',
    description: 'No active assignment',
  },
  {
    no: '063',
    status: 'Lost',
    statusColor: 'red',
    description: 'Reported lost on 2026-06-11',
  },
  {
    no: '087',
    status: 'Active',
    statusColor: 'green',
    description: 'Raj Sharma · CID-1001 · Issued 14:05',
  },
]

const workflow = [
  'Gate / security check',
  'Search by CID',
  'Fetch identity OR create new KYC',
  "Open today's session",
  'Assign daily badge',
  'Exit clearance',
  'Badge returned',
]

const badgeColor = {
  available: 'bg-white border-slate-300 text-slate-700',
  issued: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  returned: 'bg-emerald-100 border-emerald-300 text-emerald-700',
  lost: 'bg-red-100 border-red-300 text-red-700',
  damaged: 'bg-orange-100 border-orange-300 text-orange-700',
  active: 'bg-yellow-300 border-yellow-400 text-slate-950',
  blocked: 'bg-slate-100 border-slate-300 text-slate-500',
}

const statusClass = {
  'Inside Casino': 'border-sky-200 bg-sky-50 text-sky-700',
  Playing: 'border-sky-200 bg-sky-50 text-sky-700',
  'Session Closed': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Exit Pending': 'border-amber-200 bg-amber-50 text-amber-700',
  Active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Returned: 'border-sky-200 bg-sky-50 text-sky-700',
  'Not Returned': 'border-red-200 bg-red-50 text-red-700',
}

const ModalShell = ({ title, subtitle, children, onClose, size = 'max-w-3xl' }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
    <div className={`max-h-[92vh] w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl ${size}`}>
      <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-950">
            <span className="mr-2 text-yellow-500">◆</span>
            {title}
          </h2>
          {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-500 hover:bg-slate-100"
        >
          ×
        </button>
      </div>

      <div className="p-6">{children}</div>
    </div>
  </div>
)

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
      {label}
    </span>
    {children}
  </label>
)

const inputClass =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'

const ReceptionGate = () => {
  const [showBadgeBoard, setShowBadgeBoard] = useState(false)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [showExistingEntry, setShowExistingEntry] = useState(false)
  const [cid, setCid] = useState('')
  const [fetchedCustomer, setFetchedCustomer] = useState(null)

  const fetchCustomer = () => {
    setFetchedCustomer({
      cid: cid || 'CID-1006',
      name: 'Ahmed Khan',
      initials: 'AK',
      nationality: 'UAE',
      contact: '+971-50-441-2255',
      id: 'Passport · AE9921045',
      address: 'Deira, Dubai, UAE',
      kyc: 'Pending',
      badge: '144',
    })
  }

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-950">
            <span className="mr-2 text-yellow-500">◆</span>
            Reception / Gate
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Daily customer entry, badge issue, visit session, exit time and exit clearance.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowBadgeBoard(true)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            🎫 Badge Allocation Board
          </button>
          <button
            type="button"
            onClick={() => setShowNewCustomer(true)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            👤 New Customer
          </button>
          <button
            type="button"
            onClick={() => setShowExistingEntry(true)}
            className="rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-extrabold text-slate-950 shadow-sm hover:bg-yellow-300"
          >
            ↪ Existing Customer Entry
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-slate-700">
        <span className="font-bold text-yellow-700">Reception rule:</span>{' '}
        Reception operates on the same customer master as{' '}
        <span className="font-bold text-yellow-700">Customers & KYC</span>. Customer identity is fetched
        by CID; sensitive financial history, win/loss, and risk details are not shown at the gate.
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className={`rounded-2xl border ${item.border} bg-white p-5 shadow-sm`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                {item.label}
              </p>
              <span className="text-lg text-yellow-600">{item.icon}</span>
            </div>
            <p className="mt-4 font-serif text-3xl font-bold text-slate-950">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">
                Daily Reception Workflow
              </h2>
            </div>

            <div className="flex gap-3 overflow-x-auto p-4">
              {workflow.map((step, index) => (
                <div key={step} className="flex shrink-0 items-center gap-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                    <span className="mr-2 text-yellow-600">{index + 1}.</span>
                    {step}
                  </div>
                  {index < workflow.length - 1 && (
                    <span className="font-bold text-yellow-600">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">
                Today's Customer Sessions
              </h2>
            </div>

            <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-[1fr_180px_180px_auto]">
              <input
                className={inputClass}
                placeholder="Search by badge S.N, CID or customer name..."
              />
              <select className={inputClass}>
                <option>Status</option>
                <option>Inside Casino</option>
                <option>Exit Pending</option>
                <option>Session Closed</option>
              </select>
              <select className={inputClass}>
                <option>Purpose</option>
                <option>Game</option>
                <option>Food / Beverage</option>
                <option>Hotel / CRM Service</option>
              </select>
              <div className="flex gap-2">
                <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  Excel
                </button>
                <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  PDF
                </button>
                <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  Print
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Badge S.N</th>
                    <th className="px-4 py-3">CID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Nationality</th>
                    <th className="px-4 py-3">Purpose</th>
                    <th className="px-4 py-3">Entry</th>
                    <th className="px-4 py-3">Exit</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map((row) => (
                    <tr key={row.badge} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <span className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-1.5 font-mono text-base font-bold text-yellow-700">
                          {row.badge}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-700">{row.cid}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-xs font-bold text-yellow-700">
                            {row.initials}
                          </span>
                          <div>
                            <p className="font-bold text-slate-950">{row.customer}</p>
                            <p className="text-xs text-slate-500">{row.cid}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{row.nationality}</td>
                      <td className="px-4 py-4 text-slate-700">{row.purpose}</td>
                      <td className="px-4 py-4 text-slate-700">{row.entry}</td>
                      <td className="px-4 py-4 text-slate-700">{row.exit}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase ${statusClass[row.status]}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase ${statusClass[row.badgeStatus]}`}>
                          {row.badgeStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">
                Badge Allocation Board Preview
              </h2>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-6 gap-2">
                {badgePreview.map((badge) => (
                  <div
                    key={badge.no}
                    className={`rounded-lg border py-2 text-center font-mono text-sm font-bold ${badgeColor[badge.type]}`}
                  >
                    {badge.no}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
                <span>🟡 Active</span>
                <span>🟤 Issued</span>
                <span>🟢 Returned</span>
                <span>🔴 Lost</span>
                <span>🟠 Damaged</span>
                <span>⚫ Blocked</span>
              </div>

              <button
                type="button"
                onClick={() => setShowBadgeBoard(true)}
                className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Open full badge board
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-red-700">
              Watchlist Customer Attempting Entry
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-red-700">
              <li>• CID-1005 · Priya Tamang — repeated losing-return claims</li>
              <li>• Supervisor / Director approval required before badge issue</li>
            </ul>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-amber-800">
              KYC Pending — Gate Check
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-amber-800">
              <li>• CID-1002 · Amit Verma — KYC review pending</li>
              <li>• Verify KYC before issuing badge if required by policy</li>
            </ul>
          </div>
        </aside>
      </section>

      {showNewCustomer && (
        <ModalShell
          title="New Customer Registration"
          subtitle="Creates the master KYC record used by Customers & KYC. Can immediately open today's visit."
          onClose={() => setShowNewCustomer(false)}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="CID Auto">
              <input className={inputClass} defaultValue="CID-8601" />
            </Field>
            <Field label="Full Name">
              <input className={inputClass} placeholder="e.g. Rajesh Sharma" />
            </Field>
            <Field label="Nationality">
              <select className={inputClass}>
                <option>Select</option>
                <option>Nepali</option>
                <option>Indian</option>
                <option>British</option>
                <option>UAE</option>
              </select>
            </Field>
            <Field label="Contact Number">
              <input className={inputClass} placeholder="+977-98XX-XXXXXX" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Address">
                <input className={inputClass} placeholder="Street, City, Country" />
              </Field>
            </div>
            <Field label="ID Type">
              <select className={inputClass}>
                <option>Select</option>
                <option>Citizenship</option>
                <option>Passport</option>
                <option>Driving Licence</option>
              </select>
            </Field>
            <Field label="ID Number">
              <input className={inputClass} placeholder="Document number" />
            </Field>
            <Field label="ID Attachment">
              <button className="h-11 w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-left text-sm font-bold text-slate-700 hover:bg-slate-100">
                ⬆ Upload ID scan
              </button>
            </Field>
            <Field label="Customer / ID Photo">
              <button className="h-11 w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-left text-sm font-bold text-slate-700 hover:bg-slate-100">
                📷 Capture / upload photo
              </button>
            </Field>
            <Field label="KYC Status">
              <select className={inputClass}>
                <option>Pending</option>
                <option>Verified</option>
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Remarks">
                <textarea
                  className="min-h-[80px] w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                  placeholder="Optional notes"
                />
              </Field>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setShowNewCustomer(false)}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button className="rounded-lg border border-yellow-400 bg-white px-5 py-2.5 text-sm font-bold text-yellow-700 hover:bg-yellow-50">
              Save Only
            </button>
            <button className="rounded-lg bg-yellow-400 px-5 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-yellow-300">
              Save & Open Today Visit
            </button>
          </div>
        </ModalShell>
      )}

      {showExistingEntry && (
        <ModalShell
          title="Existing Customer Entry"
          subtitle="Search by CID to auto-fetch identity from Customers & KYC. Today's badge S.N is auto-assigned from the available reusable pool."
          onClose={() => {
            setShowExistingEntry(false)
            setFetchedCustomer(null)
          }}
        >
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <Field label="Today's Badge S.N Auto">
              <div className="flex h-11 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3">
                <span className="rounded-md border border-yellow-300 bg-yellow-100 px-3 py-1 font-mono font-bold text-yellow-700">
                  {fetchedCustomer?.badge || '053'}
                </span>
                <span className="text-sm text-slate-500">reusable · returned at exit</span>
              </div>
            </Field>

            <Field label="CID">
              <input
                value={cid}
                onChange={(event) => setCid(event.target.value)}
                className={inputClass}
                placeholder="CID-XXXX"
              />
            </Field>

            <div className="flex items-end">
              <button
                type="button"
                onClick={fetchCustomer}
                className="h-11 rounded-lg border border-yellow-400 bg-yellow-50 px-5 text-sm font-extrabold text-yellow-700 hover:bg-yellow-100"
              >
                🔍 Fetch Customer
              </button>
            </div>
          </div>

          {!fetchedCustomer ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Enter a CID and press <span className="font-bold text-yellow-700">Fetch Customer</span> to load KYC.
              <br />
              Customer not registered?{' '}
              <button
                className="font-bold text-yellow-700 underline"
                onClick={() => {
                  setShowExistingEntry(false)
                  setShowNewCustomer(true)
                }}
              >
                Create new KYC →
              </button>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-yellow-300 bg-yellow-100 text-xl font-bold text-yellow-700">
                    {fetchedCustomer.initials}
                  </div>
                  <div>
                    <p className="font-serif text-xl font-bold text-slate-950">
                      {fetchedCustomer.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {fetchedCustomer.cid} · {fetchedCustomer.nationality}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                        KYC PENDING
                      </span>
                      <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Contact">
                  <input className={inputClass} value={fetchedCustomer.contact} readOnly />
                </Field>
                <Field label="ID">
                  <input className={inputClass} value={fetchedCustomer.id} readOnly />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Address">
                    <input className={inputClass} value={fetchedCustomer.address} readOnly />
                  </Field>
                </div>
                <Field label="Purpose Of Visit">
                  <select className={inputClass}>
                    <option>Select</option>
                    <option>Game</option>
                    <option>Food / Beverage</option>
                    <option>Hotel / CRM Service</option>
                  </select>
                </Field>
                <Field label="Date Of Visit">
                  <input className={inputClass} value="2026-06-13" readOnly />
                </Field>
                <Field label="Visit Time">
                  <input className={inputClass} value="15:42" readOnly />
                </Field>
                <Field label="Entry Recorded By">
                  <input className={inputClass} value="Rina Reception" readOnly />
                </Field>
                <Field label="Badge Status">
                  <input className={inputClass} value="Issued → Active" readOnly />
                </Field>
                <Field label="Session Status">
                  <input className={inputClass} value="Opened → Active" readOnly />
                </Field>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-extrabold uppercase tracking-[0.12em]">KYC Pending Review</p>
                <p className="mt-2">Complete or verify KYC before entry if required by policy.</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setShowExistingEntry(false)}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button className="rounded-lg bg-yellow-400 px-5 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-yellow-300">
              ↪ Open Visit Session
            </button>
          </div>
        </ModalShell>
      )}

      {showBadgeBoard && (
        <ModalShell
          title="Badge Allocation Board"
          subtitle="Reusable physical badges. Only the number is printed on the badge — no QR, no name, no category."
          onClose={() => setShowBadgeBoard(false)}
          size="max-w-5xl"
        >
          <div className="grid gap-4 md:grid-cols-2">
            {fullBadges.map((badge) => (
              <div key={badge.no} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-1 font-mono text-lg font-bold text-yellow-700">
                    {badge.no}
                  </span>
                  <span
                    className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase ${
                      badge.statusColor === 'green'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : badge.statusColor === 'blue'
                          ? 'border-sky-200 bg-sky-50 text-sky-700'
                          : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                  >
                    {badge.status}
                  </span>
                </div>
                <p className="mt-4 text-sm font-medium text-slate-600">{badge.description}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold">
                  <button className="text-yellow-700">Assign Badge</button>
                  <button className="text-slate-600">Mark Lost</button>
                  <button className="text-slate-600">Mark Damaged</button>
                  <button className="text-red-600">Block Badge</button>
                </div>
              </div>
            ))}
          </div>
        </ModalShell>
      )}
    </div>
  )
}

export default ReceptionGate