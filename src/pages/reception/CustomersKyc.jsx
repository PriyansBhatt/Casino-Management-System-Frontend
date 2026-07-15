import { useMemo, useState } from 'react'

const receptionCustomers = [
  {
    cid: 'CID-1001',
    name: 'Raj Sharma',
    initials: 'RS',
    nationality: 'Nepali',
    contact: '+977-9841-220011',
    idType: 'Passport',
    idNumber: 'PA1238765',
    visits: 42,
    buyIn: 'NPR 84,50,000',
    cashOut: 'NPR 71,20,000',
    net: 'NPR -13,30,000',
    category: 'VIP',
    risk: 'CLEARED',
    lastVisit: '2026-06-10',
    kyc: 'VERIFIED',
    status: 'ACTIVE',
  },
  {
    cid: 'CID-1002',
    name: 'Amit Verma',
    initials: 'AV',
    nationality: 'Indian',
    contact: '+91-98201-44551',
    idType: 'Aadhaar',
    idNumber: '5612-7733-9921',
    visits: 7,
    buyIn: 'NPR 2,80,000',
    cashOut: 'NPR 1,95,000',
    net: 'NPR -85,000',
    category: 'NORMAL',
    risk: 'CLEARED',
    lastVisit: '2026-06-12',
    kyc: 'PENDING',
    status: 'ACTIVE',
  },
  {
    cid: 'CID-1003',
    name: 'Daniel Smith',
    initials: 'DS',
    nationality: 'British',
    contact: '+44-7700-900221',
    idType: 'Passport',
    idNumber: 'GB7762291',
    visits: 91,
    buyIn: 'NPR 3,29,00,000',
    cashOut: 'NPR 3,04,40,000',
    net: 'NPR -24,60,000',
    category: 'VVIP',
    risk: 'CLEARED',
    lastVisit: '2026-06-11',
    kyc: 'VERIFIED',
    status: 'ACTIVE',
  },
  {
    cid: 'CID-1004',
    name: 'Suresh Rai',
    initials: 'SR',
    nationality: 'Nepali',
    contact: '+977-9802-117743',
    idType: 'Citizenship',
    idNumber: 'VC-44-2218-99',
    visits: 19,
    buyIn: 'NPR 11,20,000',
    cashOut: 'NPR 9,40,000',
    net: 'NPR -1,80,000',
    category: 'STANDARD',
    risk: 'CLEARED',
    lastVisit: '2026-06-09',
    kyc: 'VERIFIED',
    status: 'ACTIVE',
  },
  {
    cid: 'CID-1005',
    name: 'Priya Tamang',
    initials: 'PT',
    nationality: 'Nepali',
    contact: '+977-9851-664422',
    idType: 'Driving Licence',
    idNumber: 'DL-09-887412',
    visits: 28,
    buyIn: 'NPR 32,20,000',
    cashOut: 'NPR 35,40,000',
    net: 'NPR 3,20,000',
    category: 'VIP',
    risk: 'WATCHLIST',
    lastVisit: '2026-06-13',
    kyc: 'VERIFIED',
    status: 'ACTIVE',
  },
]

const cardStyle =
  'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'

const StatusBadge = ({ children, tone = 'green' }) => {
  const tones = {
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    yellow: 'border-amber-200 bg-amber-50 text-amber-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    blue: 'border-sky-200 bg-sky-50 text-sky-700',
    purple: 'border-violet-200 bg-violet-50 text-violet-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

const CustomersKyc = () => {
  const [viewMode, setViewMode] = useState('director')
  const [search, setSearch] = useState('')
  const [nationality, setNationality] = useState('')
  const [kyc, setKyc] = useState('')
  const [status, setStatus] = useState('')

  const directorView = viewMode === 'director'

  const filteredCustomers = useMemo(() => {
    return receptionCustomers.filter((customer) => {
      const text = search.trim().toLowerCase()

      const matchesSearch =
        !text ||
        customer.name.toLowerCase().includes(text) ||
        customer.cid.toLowerCase().includes(text) ||
        customer.contact.toLowerCase().includes(text) ||
        customer.idNumber.toLowerCase().includes(text)

      const matchesNationality =
        !nationality || customer.nationality === nationality

      const matchesKyc = !kyc || customer.kyc === kyc
      const matchesStatus = !status || customer.status === status

      return (
        matchesSearch &&
        matchesNationality &&
        matchesKyc &&
        matchesStatus
      )
    })
  }, [search, nationality, kyc, status])

  const goToRegistration = () => {
    window.location.href = '/customers/register'
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-[1800px] px-5 py-6">
        <div className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-950">
              <span className="mr-3 text-amber-500">◆</span>
              Customers &amp; KYC
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Permanent customer master directory, KYC records,
              customer history and role-based customer information.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setViewMode('reception')}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  !directorView
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                Reception User
              </button>

              <button
                type="button"
                onClick={() => setViewMode('director')}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  directorView
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                Director / Admin
              </button>
            </div>

            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm"
            >
              View KYC Pending
            </button>

            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm"
            >
              Excel
            </button>

            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm"
            >
              PDF
            </button>

            <button
              type="button"
              onClick={goToRegistration}
              className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-amber-300"
            >
              + New Customer
            </button>
          </div>
        </div>

        <div className="mb-5 grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-slate-700">
            <span className="font-bold text-amber-700">
              {directorView
                ? 'Authorized Full Customer View'
                : 'Limited KYC View'}
            </span>

            <span>
              {directorView
                ? ' — financial history, category, watchlist and management information are visible.'
                : ' — financial history, customer category and sensitive risk information are hidden.'}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            Daily customer entry, badge issue and exit operations are
            handled in{' '}
            <a
              href="/reception"
              className="font-bold text-amber-700 hover:underline"
            >
              Reception / Gate →
            </a>
          </div>
        </div>

        {directorView ? (
          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className={cardStyle}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Total Customers
              </p>
              <p className="mt-3 font-serif text-3xl font-bold">3,418</p>
            </div>

            <div className={cardStyle}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Total Visits
              </p>
              <p className="mt-3 font-serif text-3xl font-bold">14,902</p>
            </div>

            <div className={`${cardStyle} border-amber-200`}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                VIP / VVIP
              </p>
              <p className="mt-3 font-serif text-3xl font-bold">142</p>
            </div>

            <div className={`${cardStyle} border-red-200`}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                On Watchlist
              </p>
              <p className="mt-3 font-serif text-3xl font-bold">7</p>
            </div>

            <div className={`${cardStyle} border-amber-200`}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                KYC Pending Review
              </p>
              <p className="mt-3 font-serif text-3xl font-bold">12</p>
            </div>

            <div className={`${cardStyle} border-amber-200`}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Lifetime Buy-In
              </p>
              <p className="mt-3 font-serif text-2xl font-bold">
                NPR 24.6 Cr
              </p>
            </div>

            <div className={cardStyle}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Lifetime Cash-Out
              </p>
              <p className="mt-3 font-serif text-2xl font-bold">
                NPR 21.1 Cr
              </p>
            </div>

            <div className={`${cardStyle} border-red-200`}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Total Net Win/Loss
              </p>
              <p className="mt-3 font-serif text-2xl font-bold">
                NPR -3.5 Cr
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className={cardStyle}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Total Customers
              </p>
              <p className="mt-3 font-serif text-3xl font-bold">3,418</p>
            </div>

            <div className={`${cardStyle} border-amber-200`}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                KYC Pending Review
              </p>
              <p className="mt-3 font-serif text-3xl font-bold">12</p>
            </div>

            <div className={`${cardStyle} border-emerald-200`}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Active Customers
              </p>
              <p className="mt-3 font-serif text-3xl font-bold">3,389</p>
            </div>

            <div className={`${cardStyle} border-red-200`}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Blocked Customers
              </p>
              <p className="mt-3 font-serif text-3xl font-bold">5</p>
            </div>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">
              Customer Master Directory
            </h2>
          </div>

          <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-5">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer name / CID / phone / ID number..."
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 lg:col-span-2"
            />

            <select
              value={nationality}
              onChange={(event) => setNationality(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            >
              <option value="">All Nationalities</option>
              <option value="Nepali">Nepali</option>
              <option value="Indian">Indian</option>
              <option value="British">British</option>
            </select>

            <select
              value={kyc}
              onChange={(event) => setKyc(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            >
              <option value="">All KYC</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending</option>
            </select>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full border-collapse text-left">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    CID
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Nationality
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    ID
                  </th>

                  {directorView && (
                    <>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Visits
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Lifetime Buy-In
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Lifetime Cash-Out
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Net W/L
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Category
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Risk
                      </th>
                    </>
                  )}

                  {!directorView && (
                    <>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                        ID Number
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                        KYC
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                    </>
                  )}

                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Last Visit
                  </th>

                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.cid}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                          {customer.initials}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {customer.name}
                          </p>

                          {directorView && (
                            <p className="text-xs text-slate-500">
                              {customer.category}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 font-mono text-sm text-slate-700">
                      {customer.cid}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-700">
                      {customer.nationality}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-700">
                      {customer.contact}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-700">
                      {customer.idType}
                    </td>

                    {directorView && (
                      <>
                        <td className="px-4 py-4 text-sm">
                          {customer.visits}
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {customer.buyIn}
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {customer.cashOut}
                        </td>

                        <td
                          className={`px-4 py-4 text-sm font-semibold ${
                            customer.net.includes('-')
                              ? 'text-red-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {customer.net}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            tone={
                              customer.category === 'VVIP'
                                ? 'purple'
                                : customer.category === 'VIP'
                                  ? 'yellow'
                                  : 'blue'
                            }
                          >
                            {customer.category}
                          </StatusBadge>
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            tone={
                              customer.risk === 'WATCHLIST'
                                ? 'blue'
                                : 'green'
                            }
                          >
                            {customer.risk}
                          </StatusBadge>
                        </td>
                      </>
                    )}

                    {!directorView && (
                      <>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {customer.idNumber}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            tone={
                              customer.kyc === 'VERIFIED'
                                ? 'green'
                                : 'yellow'
                            }
                          >
                            {customer.kyc}
                          </StatusBadge>
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge tone="green">
                            {customer.status}
                          </StatusBadge>
                        </td>
                      </>
                    )}

                    <td className="px-4 py-4 text-sm text-slate-700">
                      {customer.lastVisit}
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => {
                          window.location.href = `/customers/${customer.cid}`
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No customer records match the selected filters.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default CustomersKyc