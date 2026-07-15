import { useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '../components/layout/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import useAuth from '../hooks/useAuth'
import LockGuard from '../components/business/LockGuard'
import LockedActionNotice from '../components/business/LockedActionNotice'

const sensitiveRoutes = [
  '/cashier/buy-in',
  '/cashier/cash-out',
  '/cashier/wallet-transactions',
  '/cashier/daily-report',
  '/pit/open-sessions',
  '/pit/close-sessions',
  '/store/delivery-receive',
  '/accounts/cash-expenses',
  '/accounts/cheque-payments',
]

const titleFromPath = (pathname) => {
  return pathname
    .split('/')
    .filter(Boolean)
    .join(' ')
    .split('-')
    .join(' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const ComingSoon = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const title = titleFromPath(location.pathname)
  const isSensitiveRoute = sensitiveRoutes.includes(location.pathname)

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description="This module will be built in a later phase."
      />

      <Card className="max-w-2xl">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Coming Soon</h2>
            <p className="mt-2 text-gray-600">This module will be built in a later phase.</p>
          </div>
          <div className="rounded-md bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-500">Current Role</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{user?.role || 'No Role'}</p>
          </div>
          {isSensitiveRoute && (
            <LockGuard fallback={<LockedActionNotice />}>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900">
                <p className="text-sm font-semibold">System Lock Ready</p>
                <p className="mt-1 text-sm">
                  Future actions in this module will respect System Lock.
                </p>
              </div>
            </LockGuard>
          )}
          <Button onClick={() => navigate('/dashboard')} variant="secondary">
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default ComingSoon
