import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { getRunningFundsReport } from '../../api/reportApi'
import receptionApi from '../../api/receptionApi'
import { exportToCsv } from '../../utils/exportUtils'

const money = (value) => `NPR ${Number(value || 0).toLocaleString()}`
const valueOrUnavailable = (value) => value == null ? 'Unavailable' : money(value)
const isCanonicalIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '')

const SummaryCard = ({ title, value, note }) => (
  <Card>
    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
    <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    <p className="mt-1 text-xs text-slate-500">{note}</p>
  </Card>
)

const RunningFundsReport = () => {
  const [businessDate, setBusinessDate] = useState('')
  const [dateInitialized, setDateInitialized] = useState(false)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const requestSequence = useRef(0)

  useEffect(() => {
    let active = true

    const initializeBusinessDate = async () => {
      setLoading(true)
      setError('')
      setReport(null)
      try {
        const currentOpen = await receptionApi.getCurrentOpenBusinessDate()
        if (!active) return
        if (!isCanonicalIsoDate(currentOpen?.businessDate)) {
          throw new Error('Current business date is not opened.')
        }
        setBusinessDate(currentOpen.businessDate)
        setDateInitialized(true)
      } catch (loadError) {
        if (!active) return
        setDateInitialized(false)
        setError(loadError.response?.data?.message || loadError.message || 'Unable to load the current Business Date.')
        setLoading(false)
      }
    }

    initializeBusinessDate()
    return () => {
      active = false
    }
  }, [])

  const loadReport = useCallback(async () => {
    if (!dateInitialized || !businessDate) return
    const requestId = ++requestSequence.current
    setLoading(true)
    setError('')
    setReport(null)
    try {
      const loadedReport = await getRunningFundsReport(businessDate)
      if (requestId === requestSequence.current) {
        setReport(loadedReport)
      }
    } catch (loadError) {
      if (requestId === requestSequence.current) {
        setReport(null)
        setError(loadError.response?.data?.message || loadError.message || 'Unable to load the Running Funds Report.')
      }
    } finally {
      if (requestId === requestSequence.current) {
        setLoading(false)
      }
    }
  }, [businessDate, dateInitialized])

  useEffect(() => {
    if (dateInitialized && businessDate) {
      loadReport()
    }
  }, [businessDate, dateInitialized, loadReport])

  const exportRows = useMemo(() => report ? [
    {
      'Business Date': report.businessDate,
      'Business Date Status': report.businessDateStatus,
      'Buy-In Received': report.buyInReceived,
      'Cash-Out Paid': report.cashOutPaid,
      'Losing Return Paid': report.losingReturnPaid,
      'Net Customer Cash Movement': report.netCustomerCashMovement,
      'Verified Gaming Wins': report.verifiedGamingWins,
      'Verified Gaming Losses': report.verifiedGamingLosses,
      'Casino Gaming Net': report.casinoGamingNet,
      'Outstanding Customer Chip Position': report.outstandingCustomerChipPosition,
      'Submitted Cashiers': report.submittedCashiers,
      'Reopened Cashiers': report.reopenedCashiers,
      'Unresolved Cashiers': report.unresolvedCashiers,
      'Aggregate Submitted Variance': report.aggregateSubmittedVariance,
    },
  ] : [], [report])

  const handleExport = () => {
    exportToCsv(`running-funds-${report?.businessDate || businessDate || 'current'}.csv`, exportRows)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Running Funds Report"
        description="Authoritative customer cash movement, gaming result, chip position and cashier reconciliation by Business Date."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={!report}>Export CSV</Button>
            <Button onClick={loadReport} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
          </div>
        }
      />

      <Card>
        <div className="grid gap-4 md:grid-cols-[minmax(220px,320px)_1fr] md:items-end">
          <label className="text-sm font-semibold text-slate-700">
            Business Date
            <input
              type="date"
              value={businessDate}
              onChange={(event) => {
                setReport(null)
                setError('')
                setBusinessDate(event.target.value)
              }}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-amber-400"
            />
          </label>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <Badge variant={report?.businessDateStatus === 'OPEN' ? 'success' : 'default'}>
              {report?.businessDateStatus || 'Status unavailable'}
            </Badge>
            <span>Last refreshed: {report?.generatedAt ? new Date(report.generatedAt).toLocaleString() : 'Not loaded'}</span>
          </div>
        </div>
      </Card>

      {error && <Card className="border-red-200 bg-red-50 text-sm font-semibold text-red-700">{error}</Card>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Buy-In Received" value={valueOrUnavailable(report?.buyInReceived)} note="Customer cash flow" />
        <SummaryCard title="Cash-Out Paid" value={valueOrUnavailable(report?.cashOutPaid)} note="Customer cash flow" />
        <SummaryCard title="Losing Return Paid" value={valueOrUnavailable(report?.losingReturnPaid)} note="Customer cash flow" />
        <SummaryCard title="Net Customer Cash Movement" value={valueOrUnavailable(report?.netCustomerCashMovement)} note="Buy-In − Cash-Out − Losing Return" />
        <SummaryCard title="Verified Gaming Wins" value={valueOrUnavailable(report?.verifiedGamingWins)} note="Gaming result; not physical cash flow" />
        <SummaryCard title="Verified Gaming Losses" value={valueOrUnavailable(report?.verifiedGamingLosses)} note="Gaming result; not physical cash flow" />
        <SummaryCard title="Casino Gaming Net" value={valueOrUnavailable(report?.casinoGamingNet)} note="Verified Losses − Verified Wins" />
        <SummaryCard title="Outstanding Chip Position" value={valueOrUnavailable(report?.outstandingCustomerChipPosition)} note="Authoritative session financial position" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-black text-slate-900">Customer Cash Movement</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><span>Buy-In received</span><strong>{valueOrUnavailable(report?.buyInReceived)}</strong></div>
            <div className="flex justify-between"><span>Cash-Out paid</span><strong>{valueOrUnavailable(report?.cashOutPaid)}</strong></div>
            <div className="flex justify-between"><span>Losing Return paid</span><strong>{valueOrUnavailable(report?.losingReturnPaid)}</strong></div>
            <div className="flex justify-between border-t pt-3"><span>Net customer cash movement</span><strong>{valueOrUnavailable(report?.netCustomerCashMovement)}</strong></div>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-black text-slate-900">Gaming Position</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><span>Verified wins</span><strong>{valueOrUnavailable(report?.verifiedGamingWins)}</strong></div>
            <div className="flex justify-between"><span>Verified losses</span><strong>{valueOrUnavailable(report?.verifiedGamingLosses)}</strong></div>
            <div className="flex justify-between border-t pt-3"><span>Casino gaming net</span><strong>{valueOrUnavailable(report?.casinoGamingNet)}</strong></div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-black text-slate-900">Cashier Reconciliation</h2>
          <p className="mt-1 text-sm text-slate-500">
            Submitted {report?.submittedCashiers ?? '—'} · Reopened {report?.reopenedCashiers ?? '—'} · Unresolved {report?.unresolvedCashiers ?? '—'} · Submitted variance {valueOrUnavailable(report?.aggregateSubmittedVariance)}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>{['Cashier', 'Received', 'Paid', 'Expected', 'Actual', 'Variance', 'Status'].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(report?.reconciliations || []).map((row) => (
                <tr key={row.reconciliationId}>
                  <td className="px-4 py-3 font-semibold">{row.cashierName || row.cashierUsername || 'Unavailable'}</td>
                  <td className="px-4 py-3">{money(row.cashReceived)}</td>
                  <td className="px-4 py-3">{money(row.cashPaid)}</td>
                  <td className="px-4 py-3">{valueOrUnavailable(row.expectedClosingCash)}</td>
                  <td className="px-4 py-3">{valueOrUnavailable(row.actualClosingCash)}</td>
                  <td className="px-4 py-3">{valueOrUnavailable(row.variance)}</td>
                  <td className="px-4 py-3"><Badge>{row.lifecycleStatus || row.status}</Badge></td>
                </tr>
              ))}
              {!loading && (report?.reconciliations || []).length === 0 && (
                <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500">No cashier reconciliations exist for this Business Date.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-black text-slate-900">Operational Exceptions</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
          <p className="rounded-xl bg-slate-50 p-3">Outstanding chip position: <strong>{valueOrUnavailable(report?.outstandingCustomerChipPosition)}</strong></p>
          <p className="rounded-xl bg-slate-50 p-3">Unsubmitted/reopened cashiers: <strong>{report?.unresolvedCashiers ?? 'Unavailable'}</strong></p>
          <p className="rounded-xl bg-slate-50 p-3">Reopened reconciliations: <strong>{report?.reopenedCashiers ?? 'Unavailable'}</strong></p>
        </div>
      </Card>
    </div>
  )
}

export default RunningFundsReport
