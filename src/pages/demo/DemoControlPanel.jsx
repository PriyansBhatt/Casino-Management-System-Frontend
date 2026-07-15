import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import useToast from '../../hooks/useToast'
import {
  clearDemoData,
  getDemoDataSummary,
  resetAllDemoData,
  seedDemoData,
} from '../../utils/demoDataUtils'

const summaryLabels = [
  ['customers', 'Customers'],
  ['transactions', 'Transactions'],
  ['tableSessions', 'Table Sessions'],
  ['storeRequests', 'Store Requests'],
  ['procurementItems', 'Procurement Items'],
  ['bills', 'Bills'],
  ['payments', 'Payments'],
  ['auditLogs', 'Audit Logs'],
  ['notifications', 'Notifications'],
]

const demoFlow = [
  ['A. Login as admin', ['Show dashboard', 'Show Business Date/System Lock', 'Show Admin settings', 'Seed demo data']],
  ['B. Login as reception', ['Search customer', 'Register customer', 'Show high-risk/watchlist customer']],
  ['C. Login as cashier', ['Create buy-in', 'Create cash-out', 'Show wallet transactions', 'Show daily cashier summary']],
  ['D. Login as pitboss', ['View tables', 'Open table session', 'Close table session', 'Show table report']],
  ['E. Login as director', ['View approvals', 'View high-value alerts', 'View suspicious alerts', 'View analytics']],
  ['F. Login as store/procurement/department', ['Create department request', 'Review request', 'Add quotation', 'Receive delivery', 'Confirm received']],
  ['G. Login as accounts', ['Verify bill', 'Record payment', 'Show accounts report']],
  ['H. Login as auditor', ['Show audit logs', 'Show audit details']],
]

const DemoControlPanel = () => {
  const { showToast } = useToast()
  const [summary, setSummary] = useState(getDemoDataSummary())
  const [pendingAction, setPendingAction] = useState(null)

  const refreshSummary = () => setSummary(getDemoDataSummary())

  useEffect(() => {
    refreshSummary()
  }, [])

  const runAction = () => {
    try {
      if (pendingAction === 'seed') {
        seedDemoData()
        showToast({ type: 'success', title: 'Demo Data Seeded', message: 'Clean sample data is ready.' })
      }
      if (pendingAction === 'reset') {
        resetAllDemoData()
        showToast({ type: 'success', title: 'Demo Data Reset', message: 'Demo data was reset to the clean seed set.' })
      }
      if (pendingAction === 'clear') {
        clearDemoData()
        showToast({ type: 'warning', title: 'Demo Data Cleared', message: 'Mock demo data was removed from localStorage.' })
      }
      refreshSummary()
    } catch (error) {
      showToast({ type: 'error', title: 'Demo Data Action Failed', message: error.message || 'Unable to update demo data.' })
    } finally {
      setPendingAction(null)
    }
  }

  const actionLabels = {
    seed: 'Seed Demo Data',
    reset: 'Reset Demo Data',
    clear: 'Clear Demo Data',
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demo Control Panel"
        description="Prepare clean local mock data for casino client demos."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setPendingAction('seed')}>Seed Demo Data</Button>
            <Button variant="secondary" onClick={() => setPendingAction('reset')}>Reset Demo Data</Button>
            <Button variant="danger" onClick={() => setPendingAction('clear')}>Clear Demo Data</Button>
          </div>
        }
      />

      <Alert variant="warning" title="Frontend Demo Only">
        This page is for frontend demo/mock data only. Backend integration will enforce final
        security, validation, approvals, and database persistence.
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summaryLabels.map(([key, label]) => (
          <Card key={key}>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{summary[key]}</p>
          </Card>
        ))}
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <h2 className="text-lg font-semibold text-blue-950">Important Demo Notes</h2>
        <div className="mt-3 space-y-2 text-sm text-blue-900">
          <p>Business Date is separate from calendar date.</p>
          <p>System Lock protects the settlement period.</p>
          <p>Losing return preview uses net loss, not gross buy-in.</p>
          <p>Pit module tracks table-level totals, not every player.</p>
          <p>Backend integration will enforce final security and database persistence.</p>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900">Recommended Demo Script</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {demoFlow.map(([title, items]) => (
            <div key={title} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <ConfirmDialog
        isOpen={Boolean(pendingAction)}
        title={actionLabels[pendingAction] || 'Confirm Demo Data Action'}
        description={
          pendingAction === 'clear'
            ? 'This removes demo mock data from localStorage. Current auth session is not cleared.'
            : 'This replaces current mock demo data with a clean casino demo seed set.'
        }
        confirmLabel={actionLabels[pendingAction] || 'Confirm'}
        variant={pendingAction === 'clear' ? 'danger' : 'warning'}
        onConfirm={runAction}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  )
}

export default DemoControlPanel
