import { useState } from 'react'

const customers = [
  {
    initials: 'RS',
    name: 'Raj Sharma',
    cid: 'CID-1001',
    nationality: 'Nepali',
    contact: '+977-9841-220011',
    idType: 'Passport',
    idNumber: 'PA1238765',
    visits: 42,
    lifetimeBuyIn: 'NPR 84,50,000',
    lifetimeCashOut: 'NPR 71,20,000',
    netWL: 'NPR -13,30,000',
    category: 'VIP',
    risk: 'Cleared',
    kyc: 'Verified',
    status: 'Active',
    lastVisit: '2026-06-10',
  },
  {
    initials: 'AV',
    name: 'Amit Verma',
    cid: 'CID-1002',
    nationality: 'Indian',
    contact: '+91-98201-44551',
    idType: 'Aadhaar',
    idNumber: '5612-7733-9921',
    visits: 7,
    lifetimeBuyIn: 'NPR 2,80,000',
    lifetimeCashOut: 'NPR 1,95,000',
    netWL: 'NPR -85,000',
    category: 'Normal',
    risk: 'Cleared',
    kyc: 'Pending',
    status: 'Active',
    lastVisit: '2026-06-12',
  },
  {
    initials: 'DS',
    name: 'Daniel Smith',
    cid: 'CID-1003',
    nationality: 'British',
    contact: '+44-7700-900221',
    idType: 'Passport',
    idNumber: 'GB7762291',
    visits: 91,
    lifetimeBuyIn: 'NPR 3,29,00,000',
    lifetimeCashOut: 'NPR 3,04,40,000',
    netWL: 'NPR -24,60,000',
    category: 'VVIP',
    risk: 'Cleared',
    kyc: 'Verified',
    status: 'Active',
    lastVisit: '2026-06-11',
  },
  {
    initials: 'SR',
    name: 'Suresh Rai',
    cid: 'CID-1004',
    nationality: 'Nepali',
    contact: '+977-9802-117743',
    idType: 'Citizenship',
    idNumber: 'VC-44-2218-99',
    visits: 19,
    lifetimeBuyIn: 'NPR 11,20,000',
    lifetimeCashOut: 'NPR 9,40,000',
    netWL: 'NPR -1,80,000',
    category: 'Standard',
    risk: 'Cleared',
    kyc: 'Verified',
    status: 'Active',
    lastVisit: '2026-06-09',
  },
  {
    initials: 'PT',
    name: 'Priya Tamang',
    cid: 'CID-1005',
    nationality: 'Nepali',
    contact: '+977-9851-664422',
    idType: 'Licence',
    idNumber: 'DL-09-887412',
    visits: 28,
    lifetimeBuyIn: 'NPR 32,20,000',
    lifetimeCashOut: 'NPR 35,40,000',
    netWL: 'NPR 3,20,000',
    category: 'VIP',
    risk: 'Watchlist',
    kyc: 'Verified',
    status: 'Blocked',
    lastVisit: '2026-06-13',
  },
  {
    initials: 'AK',
    name: 'Ahmed Khan',
    cid: 'CID-1006',
    nationality: 'UAE',
    contact: '+971-50-441-2255',
    idType: 'Passport',
    idNumber: 'AE9921045',
    visits: 14,
    lifetimeBuyIn: 'NPR 18,70,000',
    lifetimeCashOut: 'NPR 15,10,000',
    netWL: 'NPR -3,60,000',
    category: 'Normal',
    risk: 'KYC Review',
    kyc: 'Pending',
    status: 'Active',
    lastVisit: '2026-06-13',
  },
]

const directorStats = [
  { label: 'Total Customers', value: '3,418', border: 'border-slate-200', icon: '👥' },
  { label: 'Total Visits', value: '14,902', border: 'border-slate-200', icon: '↺' },
  { label: 'VIP / VVIP', value: '142', border: 'border-yellow-300', icon: '♛' },
  { label: 'On Watchlist', value: '7', border: 'border-red-300', icon: '🛡' },
  { label: 'KYC Pending Review', value: '12', border: 'border-amber-300', icon: '▣' },
  { label: 'Lifetime Buy-In', value: 'NPR 24.6 Cr', border: 'border-yellow-300', icon: '↓' },
  { label: 'Lifetime Cash-Out', value: 'NPR 21.1 Cr', border: 'border-slate-200', icon: '↑' },
  { label: 'Total Net Win/Loss', value: 'NPR -3.5 Cr', border: 'border-red-300', icon: '💰' },
]

const receptionStats = [
  { label: 'Total Customers', value: '3,418', border: 'border-slate-200', icon: '👥' },
  { label: 'KYC Pending Review', value: '12', border: 'border-amber-300', icon: '▣' },
  { label: 'Active Customers', value: '3,389', border: 'border-emerald-300', icon: '🛡' },
  { label: 'Blocked Customers', value: '5', border: 'border-red-300', icon: '⚠' },
]

const statusClass = {
  Active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Blocked: 'border-red-200 bg-red-50 text-red-700',
  Verified: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Pending: 'border-amber-200 bg-amber-50 text-amber-700',
  VIP: 'border-yellow-300 bg-yellow-50 text-yellow-700',
  VVIP: 'border-yellow-300 bg-yellow-100 text-yellow-800',
  Normal: 'border-sky-200 bg-sky-50 text-sky-700',
  Standard: 'border-slate-200 bg-slate-50 text-slate-700',
  Cleared: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Watchlist: 'border-red-200 bg-red-50 text-red-700',
  'KYC Review': 'border-amber-200 bg-amber-50 text-amber-700',
}

const inputClass =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
      {label}
    </span>
    {children}
  </label>
)

const ModalShell = ({ title, subtitle, children, onClose, size = 'max-w-3xl' }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
    <div
      className={`max-h-[92vh] w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl ${size}`}
    >
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

const CustomersKycPage = () => {
  const [view, setView] = useState('director')
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const isDirector = view === 'director'
  const stats = isDirector ? directorStats : receptionStats

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-950">
            <span className="mr-2 text-yellow-500">◆</span>
            Customers & KYC
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Permanent customer master directory, KYC records, customer history, lifetime activity,
            and management-only customer insights.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setView('reception')}
              className={`rounded-md px-4 py-2 text-sm font-bold ${
                view === 'reception'
                  ? 'bg-yellow-400 text-slate-950'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Reception User
            </button>
            <button
              type="button"
              onClick={() => setView('director')}
              className={`rounded-md px-4 py-2 text-sm font-bold ${
                view === 'director'
                  ? 'bg-yellow-400 text-slate-950'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Director / Admin
            </button>
          </div>

          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
            View KYC Pending
          </button>
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
            Excel
          </button>
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
            PDF
          </button>
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
            Print
          </button>
          <button
            type="button"
            onClick={() => setShowNewCustomer(true)}
            className="rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-extrabold text-slate-950 shadow-sm hover:bg-yellow-300"
          >
            👤 New Customer
          </button>
        </div>
      </div>

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-slate-700">
          <span className="font-bold text-yellow-700">
            {isDirector ? 'Authorized Full Customer View' : 'Limited KYC View'}
          </span>{' '}
          —{' '}
          {isDirector
            ? 'financial history, category, watchlist and AML notes are visible.'
            : 'financial history, customer category, watchlist and risk details are hidden in this role.'}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
          Daily entries, badge issue and exits are operated in{' '}
          <span className="font-bold text-yellow-700">Reception / Gate →</span>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className={`rounded-2xl border ${item.border} bg-white p-5 shadow-sm`}>
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

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">
            Customer Master Directory
          </h2>
        </div>

        <div className="border-b border-slate-200 p-4">
          <div
            className={`grid gap-3 ${
              isDirector
                ? 'lg:grid-cols-[1fr_170px_170px_170px_170px_170px]'
                : 'lg:grid-cols-[1fr_170px_170px_170px_170px]'
            }`}
          >
            <input
              className={inputClass}
              placeholder={
                isDirector
                  ? 'Search customer name / CID / phone / passport / ID number...'
                  : 'Search customer name / CID / phone / passport / ID number...'
              }
            />
            <select className={inputClass}>
              <option>Nationality</option>
              <option>Nepali</option>
              <option>Indian</option>
              <option>British</option>
              <option>UAE</option>
            </select>
            <select className={inputClass}>
              <option>ID Type</option>
              <option>Passport</option>
              <option>Citizenship</option>
              <option>Aadhaar</option>
              <option>Licence</option>
            </select>
            <select className={inputClass}>
              <option>KYC</option>
              <option>Verified</option>
              <option>Pending</option>
            </select>
            <select className={inputClass}>
              <option>Status</option>
              <option>Active</option>
              <option>Blocked</option>
            </select>
            {isDirector && (
              <select className={inputClass}>
                <option>Category</option>
                <option>VVIP</option>
                <option>VIP</option>
                <option>Normal</option>
                <option>Standard</option>
              </select>
            )}
          </div>

          {isDirector && (
            <div className="mt-3 max-w-[180px]">
              <select className={inputClass}>
                <option>Watchlist</option>
                <option>Cleared</option>
                <option>Watchlist</option>
                <option>KYC Review</option>
              </select>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">CID</th>
                <th className="px-4 py-3">Nationality</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">ID Type</th>
                <th className="px-4 py-3">ID Number</th>
                {isDirector && <th className="px-4 py-3">Visits</th>}
                {isDirector && <th className="px-4 py-3">Lifetime Buy-In</th>}
                {isDirector && <th className="px-4 py-3">Lifetime Cash-Out</th>}
                {isDirector && <th className="px-4 py-3">Net W/L</th>}
                {isDirector && <th className="px-4 py-3">Category</th>}
                {isDirector && <th className="px-4 py-3">Risk</th>}
                <th className="px-4 py-3">KYC</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Visit</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {customers.map((customer) => (
                <tr key={customer.cid} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-100 text-xs font-bold text-yellow-700">
                        {customer.initials}
                      </span>
                      <div>
                        <p className="font-bold text-slate-950">{customer.name}</p>
                        <p className="text-xs text-slate-500">
                          {customer.cid}
                          {isDirector ? ` · ${customer.category}` : ''}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 font-mono text-slate-700">{customer.cid}</td>
                  <td className="px-4 py-4 text-slate-700">{customer.nationality}</td>
                  <td className="px-4 py-4 text-slate-700">{customer.contact}</td>
                  <td className="px-4 py-4 text-slate-700">{customer.idType}</td>
                  <td className="px-4 py-4 text-slate-700">{customer.idNumber}</td>

                  {isDirector && <td className="px-4 py-4 text-slate-700">{customer.visits}</td>}
                  {isDirector && (
                    <td className="px-4 py-4 font-medium text-slate-700">{customer.lifetimeBuyIn}</td>
                  )}
                  {isDirector && (
                    <td className="px-4 py-4 font-medium text-slate-700">{customer.lifetimeCashOut}</td>
                  )}
                  {isDirector && (
                    <td
                      className={`px-4 py-4 font-bold ${
                        customer.netWL.includes('-') ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {customer.netWL}
                    </td>
                  )}
                  {isDirector && (
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase ${statusClass[customer.category]}`}
                      >
                        {customer.category}
                      </span>
                    </td>
                  )}
                  {isDirector && (
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase ${statusClass[customer.risk]}`}
                      >
                        {customer.risk}
                      </span>
                    </td>
                  )}

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase ${statusClass[customer.kyc]}`}
                    >
                      {customer.kyc}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase ${statusClass[customer.status]}`}
                    >
                      {customer.status}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-slate-700">{customer.lastVisit}</td>

                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(customer)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      👁 {isDirector ? 'Profile' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showNewCustomer && (
        <ModalShell
          title="New Customer Registration"
          subtitle="Master KYC record. CID is auto-generated and permanent. Daily entries use this record from Reception / Gate."
          onClose={() => setShowNewCustomer(false)}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="CID Auto">
              <input className={inputClass} defaultValue="CID-6079" />
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
                <option>Aadhaar</option>
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

            {isDirector && (
              <Field label="Customer Category">
                <select className={inputClass}>
                  <option>Normal</option>
                  <option>Standard</option>
                  <option>VIP</option>
                  <option>VVIP</option>
                </select>
              </Field>
            )}

            <div className="md:col-span-2">
              <Field label="Remarks">
                <textarea
                  className="min-h-[80px] w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                  placeholder="Optional notes"
                />
              </Field>
            </div>

            <div className="md:col-span-2 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              <span>Created by Rina Reception</span>
              <span>2026-06-13 · 15:42</span>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowNewCustomer(false)}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button className="rounded-lg border border-yellow-400 bg-white px-5 py-2.5 text-sm font-bold text-yellow-700 hover:bg-yellow-50">
              Save Customer
            </button>

            <button className="rounded-lg bg-yellow-400 px-5 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-yellow-300">
              Save & Open Reception Entry
            </button>
          </div>
        </ModalShell>
      )}

      {selectedCustomer && (
        <ModalShell
          title={selectedCustomer.name}
          subtitle={
            isDirector
              ? 'Full customer profile visible for Director / Admin.'
              : 'Limited customer profile visible for Reception User.'
          }
          onClose={() => setSelectedCustomer(null)}
          size="max-w-4xl"
        >
          <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-yellow-300 bg-yellow-100 text-2xl font-bold text-yellow-700">
                {selectedCustomer.initials}
              </div>

              <h3 className="mt-4 font-serif text-2xl font-bold text-slate-950">
                {selectedCustomer.name}
              </h3>
              <p className="mt-1 font-mono text-sm text-slate-500">{selectedCustomer.cid}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase ${statusClass[selectedCustomer.kyc]}`}
                >
                  {selectedCustomer.kyc}
                </span>
                <span
                  className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase ${statusClass[selectedCustomer.status]}`}
                >
                  {selectedCustomer.status}
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Nationality
                </p>
                <p className="mt-2 font-bold text-slate-900">{selectedCustomer.nationality}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Contact
                </p>
                <p className="mt-2 font-bold text-slate-900">{selectedCustomer.contact}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  ID
                </p>
                <p className="mt-2 font-bold text-slate-900">
                  {selectedCustomer.idType} · {selectedCustomer.idNumber}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Last Visit
                </p>
                <p className="mt-2 font-bold text-slate-900">{selectedCustomer.lastVisit}</p>
              </div>

              {isDirector && (
                <>
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-yellow-700">
                      Category
                    </p>
                    <p className="mt-2 font-bold text-slate-900">{selectedCustomer.category}</p>
                  </div>

                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">
                      Risk / AML
                    </p>
                    <p className="mt-2 font-bold text-slate-900">{selectedCustomer.risk}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Lifetime Buy-In
                    </p>
                    <p className="mt-2 font-bold text-slate-900">
                      {selectedCustomer.lifetimeBuyIn}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Lifetime Cash-Out
                    </p>
                    <p className="mt-2 font-bold text-slate-900">
                      {selectedCustomer.lifetimeCashOut}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Net Win / Loss
                    </p>
                    <p
                      className={`mt-2 font-bold ${
                        selectedCustomer.netWL.includes('-') ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {selectedCustomer.netWL}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  )
}

export default CustomersKycPage