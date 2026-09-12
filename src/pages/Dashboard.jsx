import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getManagementDashboard } from '../api/managementDashboardApi'
import useAuth from '../hooks/useAuth'
import { ROLES } from '../constants/roles'
import { canAccessRoute } from '../utils/accessControl'
import { formatDashboardMetric, formatDashboardTimestamp } from '../utils/managementDashboard'

// Presentation metadata only. Every operational value comes from the dashboard response.
const summaryCards = [
  { key: 'activeCustomers', label: 'Active Customers', icon: '👥', tone: 'blue', path: '/reception' },
  { key: 'buyInTotal', label: 'Buy-In Total', icon: '↘', tone: 'green', currency: true, path: '/cashier/buy-in' },
  { key: 'cashOutTotal', label: 'Cash-Out Total', icon: '↗', tone: 'blue', currency: true, path: '/cashier/cash-out' },
  { key: 'losingReturnPaidTotal', label: 'Losing Return Paid', icon: '↪', tone: 'amber', currency: true, path: '/reports/running-funds' },
  { key: 'activeTables', label: 'Active Tables', icon: '🎲', tone: 'purple', path: '/pit/tables' },
  { key: 'activeMachines', label: 'Active Machines', icon: '🎮', tone: 'purple' },
  { key: 'unresolvedChipValue', label: 'Unresolved Chips', icon: '🔗', tone: 'red', currency: true },
  { key: 'cashierVariance', label: 'Cashier Variance', icon: '⚖', tone: 'green', currency: true, path: '/cashier/reconciliation' },
  { key: 'cashIncome', label: 'Daily Cash Income', icon: '💵', tone: 'green', currency: true },
  { key: 'cashExpense', label: 'Daily Cash Expense', icon: '🧾', tone: 'red', currency: true },
  { key: 'purchaseApprovals', label: 'Purchase Approvals', icon: '📦', tone: 'amber' },
  { key: 'billsPending', label: 'Bills Pending', icon: '📄', tone: 'amber' },
]

const toneClasses = {
  blue: { card: 'border-sky-200 bg-gradient-to-br from-white to-sky-50', icon: 'bg-sky-100 text-sky-700' },
  green: { card: 'border-emerald-200 bg-gradient-to-br from-white to-emerald-50', icon: 'bg-emerald-100 text-emerald-700' },
  amber: { card: 'border-amber-200 bg-gradient-to-br from-white to-amber-50', icon: 'bg-amber-100 text-amber-700' },
  red: { card: 'border-red-200 bg-gradient-to-br from-white to-red-50', icon: 'bg-red-100 text-red-700' },
  purple: { card: 'border-purple-200 bg-gradient-to-br from-white to-purple-50', icon: 'bg-purple-100 text-purple-700' },
}

const quickActions = [
  { label: 'Cashier Reconciliation', icon: '🧾', path: '/cashier/reconciliation' },
  { label: 'Gaming Floor', icon: '🎲', path: '/pit/tables' },
  { label: 'Customer Wallets', icon: '🔗', path: '/chip-control' },
  { label: 'Reports', icon: '📊', path: '/reports/running-funds' },
]
const buttonClass = 'h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-amber-500'
const panelClass = 'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'
const headingClass = 'text-sm font-black uppercase tracking-[0.16em] text-slate-700'

const UnavailablePanel = ({ title, children }) => (
  <section className={panelClass}>
    <div className="border-b border-slate-200 px-5 py-4"><h2 className={headingClass}>{title}</h2></div>
    <div className="px-5 py-10 text-center">
      <p className="text-sm font-bold text-slate-600">Not available</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{children}</p>
    </div>
  </section>
)

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth()
  const canRead = user?.role === ROLES.DIRECTOR || user?.role === ROLES.SUPER_ADMIN
  const [requestedDate, setRequestedDate] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [view, setView] = useState({ status: 'loading', data: null, error: '' })

  const requestKey = JSON.stringify([requestedDate, refresh, user?.id, user?.username, user?.role])

  useEffect(() => {
    if (authLoading || !canRead) return
    const controller = new AbortController()
    let active = true
    setView({ status: 'loading', data: null, error: '' })
    getManagementDashboard(requestedDate, controller.signal)
      .then((data) => {
        if (!active) return
        setView({ status: 'success', data, error: '', requestKey })
        setDateInput(data.businessDate || '')
      })
      .catch((error) => {
        if (!active) return
        setView({ status: 'error', requestKey, data: null, error: error.response?.data?.message || error.message || 'Unable to load the dashboard.' })
      })
    return () => { active = false; controller.abort() }
  }, [requestedDate, requestKey, canRead, authLoading])

  const reload = (date = requestedDate) => {
    setView({ status: 'loading', data: null, error: '' })
    setRequestedDate(date)
    setRefresh((value) => value + 1)
  }

  const data = view.status === 'success' && view.requestKey === requestKey ? view.data : null
  const loading = view.status === 'loading' || view.requestKey !== requestKey
  const allowedActions = quickActions.filter((action) => canAccessRoute(user, action.path))

  if (authLoading) return <div role="status" className="p-6 text-slate-500">Loading dashboard…</div>
  if (!canRead) return (
    <div className="p-6">
      <section className={`${panelClass} p-6`}>
        <h1 className="text-2xl font-black text-slate-950">Management Dashboard</h1>
        <p className="mt-3 text-slate-600">Management dashboard access is restricted to Director and Super Admin accounts.</p>
      </section>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="space-y-5 p-4 sm:p-5 lg:p-6">
        <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="h-3 w-3 rotate-45 bg-amber-400" />
              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Management Dashboard</h1>
            </div>
            <p className="mt-2 text-sm text-slate-500">Director overview of casino operations for the selected Business Date.</p>
            {data && (
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                <p>Business Date: <strong>{data.businessDate || 'No open Business Date'}</strong> · {data.businessDateStatus} · {requestedDate ? 'Selected date' : 'Current OPEN date'}</p>
                {data.businessDate && <p>Operational window: {formatDashboardTimestamp(data.windowStart)} → {formatDashboardTimestamp(data.windowEndExclusive)} (exclusive) · {data.timeZone}</p>}
                <p>Last updated: {formatDashboardTimestamp(data.lastUpdated)} · {data.timeZone}</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form className="flex flex-wrap items-center gap-2" onSubmit={(event) => { event.preventDefault(); if (dateInput) reload(dateInput) }}>
              <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-sm">
                <span className="sr-only">Business Date</span>
                <span aria-hidden="true">📅</span>
                <input type="date" disabled={loading} value={dateInput} onChange={(event) => setDateInput(event.target.value)} required
                  className="min-w-0 bg-transparent text-sm font-semibold text-slate-700 outline-none" />
              </label>
              <button type="submit" className={buttonClass} disabled={loading || !dateInput}>Apply date</button>
            </form>
            <button type="button" className={buttonClass} disabled={loading} onClick={() => reload('')}>Current date</button>
            <button type="button" className={buttonClass} disabled={loading} onClick={() => reload()}>↻ Refresh</button>
          </div>
        </section>

        <section className={`${panelClass} p-4`}>
          <h2 className={headingClass}>Quick Actions</h2>
          <p className="mt-1 text-xs text-slate-500">Open available management and operational pages.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {allowedActions.map((action) => (
              <Link key={action.path} to={action.path} className="flex min-h-[64px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 hover:shadow-md">
                <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-lg shadow-sm">{action.icon}</span>
                <span className="text-sm font-bold leading-5 text-slate-800">{action.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {loading && <div role="status" className="rounded-xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-800">Loading dashboard…</div>}
        {!loading && view.status === 'error' && (
          <section role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5">
            <h2 className="font-bold text-red-800">Dashboard could not be loaded</h2>
            <p className="mt-2 text-sm text-red-700">{view.error}</p>
            <button type="button" className={`${buttonClass} mt-4`} onClick={() => reload()}>Retry</button>
          </section>
        )}
        {data?.businessDateStatus === 'NOT_OPEN' && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">No Business Date is open. Select an existing Business Date to view its dashboard.</p>}

        {(loading || data) && (
          <section aria-label="Operational summary" aria-busy={loading} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const metric = data?.summary[card.key]
              const tone = toneClasses[card.tone]
              const linked = !loading && metric?.available === true && card.path && canAccessRoute(user, card.path)
              const Tag = linked ? Link : 'article'
              return (
                <Tag key={card.key} {...(linked ? { to: card.path } : {})} className={`min-h-[145px] rounded-2xl border p-4 text-left shadow-sm ${tone.card} ${linked ? 'transition hover:-translate-y-0.5 hover:shadow-lg' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{card.label}</h2>
                      <p className="mt-4 break-words font-serif text-2xl font-black leading-tight text-slate-950">{loading ? 'Loading…' : formatDashboardMetric(metric, card.currency)}</p>
                    </div>
                    <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${tone.icon}`}>{card.icon}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs leading-5 text-slate-500">{loading ? 'Waiting for dashboard data.' : metric?.description || 'This metric is not provided by the dashboard.'}</p>
                    {linked && <span aria-hidden="true" className="text-sm font-black text-slate-500">→</span>}
                  </div>
                </Tag>
              )
            })}
          </section>
        )}

        {data && <>
          <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_410px]">
            <UnavailablePanel title="Active Customer Overview">
              {data.summary.activeCustomers.available && Number(data.summary.activeCustomers.value) === 0
                ? 'No active customers for this Business Date. Customer detail rows are not available in this dashboard.'
                : 'Customer detail rows are not available in this dashboard. Use Reception to review customer sessions.'}
            </UnavailablePanel>
            <UnavailablePanel title="Management Attention">No authoritative management alerts available.</UnavailablePanel>
          </div>

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
            <section className={`${panelClass} p-5`}>
              <div className="border-b border-slate-200 pb-4">
                <h2 className={headingClass}>Daily Financial Summary</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">Posted cashier amounts for this Business Date, across all payment modes. These are not accounting income, expenses, or profit.</p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {summaryCards.filter((card) => ['buyInTotal', 'cashOutTotal', 'losingReturnPaidTotal', 'cashierVariance', 'cashExpense'].includes(card.key)).map((card) => (
                  <div key={card.key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-xs font-bold text-slate-500">{card.key === 'cashExpense' ? 'Operating Expenses' : card.label}</h3>
                    <p className="mt-2 text-lg font-black text-slate-900">{formatDashboardMetric(data.summary[card.key], true)}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{data.summary[card.key]?.description || 'Not available.'}</p>
                  </div>
                ))}
              </div>
            </section>
            <UnavailablePanel title="Approval Queue">An authoritative approval queue is not available. Purchase and expense approvals are not provided.</UnavailablePanel>
          </div>
          <UnavailablePanel title="Cash Movement by Hour">Hourly cash movement is not available in this dashboard yet.</UnavailablePanel>
        </>}
      </main>
    </div>
  )
}

export default Dashboard
