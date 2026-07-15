import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import TableToolbar from '../../components/ui/TableToolbar'
import useAuth from '../../hooks/useAuth'
import useNotifications from '../../hooks/useNotifications'
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
} from '../../api/notificationApi'
import {
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPES,
} from '../../constants/notificationConstants'
import {
  formatNotificationType,
  getNotificationPriorityBadgeVariant,
  getNotificationTypeBadgeVariant,
} from '../../utils/notificationUtils'
import { formatDateTime } from '../../utils/customerUtils'

const statuses = Object.values(NOTIFICATION_STATUSES)
const types = Object.values(NOTIFICATION_TYPES)
const priorities = Object.values(NOTIFICATION_PRIORITIES)

const Notifications = () => {
  const { user } = useAuth()
  const { refreshNotifications, markAsRead } = useNotifications()
  const [notifications, setNotifications] = useState([])
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    priority: '',
    businessDate: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadNotifications = async () => {
    setIsLoading(true)
    setError('')
    try {
      setNotifications(await getNotifications({ ...filters, userRole: user?.role }))
    } catch (err) {
      setError(err.message || 'Failed to load notifications.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [filters, user?.role])

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({ status: '', type: '', priority: '', businessDate: '' })
  }

  const handleMarkRead = async (id) => {
    setIsSaving(true)
    setMessage('')
    setError('')
    try {
      await markAsRead(id)
      setMessage('Notification marked as read.')
      await loadNotifications()
    } catch (err) {
      setError(err.message || 'Failed to mark notification as read.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleMarkAllRead = async () => {
    setIsSaving(true)
      setMessage('')
      setError('')
      try {
      await markAllNotificationsRead({ ...filters, userRole: user?.role })
      await refreshNotifications()
      setMessage('All notifications marked as read.')
      await loadNotifications()
    } catch (err) {
      setError(err.message || 'Failed to mark notifications as read.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setIsSaving(true)
    setMessage('')
    setError('')
    try {
      await deleteNotification(id)
      await refreshNotifications()
      setMessage('Notification deleted.')
      await loadNotifications()
    } catch (err) {
      setError(err.message || 'Failed to delete notification.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Review role-based system messages and operational notices."
        actions={<Button onClick={handleMarkAllRead} disabled={isSaving}>Mark All as Read</Button>}
      />

      <TableToolbar
        title="Notification Filters"
        description="Filter role-based notices by status, type, priority, or Business Date."
        onReset={resetFilters}
      >
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label htmlFor="status" className="mb-2 block text-sm font-medium text-gray-700">Status</label>
            <select id="status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All</option>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="type" className="mb-2 block text-sm font-medium text-gray-700">Type</label>
            <select id="type" value={filters.type} onChange={(event) => updateFilter('type', event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All types</option>
              {types.map((type) => <option key={type} value={type}>{formatNotificationType(type)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="priority" className="mb-2 block text-sm font-medium text-gray-700">Priority</label>
            <select id="priority" value={filters.priority} onChange={(event) => updateFilter('priority', event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All priorities</option>
              {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
          </div>
          <Input label="Business Date" value={filters.businessDate} onChange={(event) => updateFilter('businessDate', event.target.value)} placeholder="Optional" />
        </div>
      </TableToolbar>

      {message && <Card className="border-green-200 bg-green-50"><p className="text-sm text-green-700">{message}</p></Card>}
      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      <Card className="overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-gray-600">Loading notifications...</p>}
        {!isLoading && !error && notifications.length === 0 && (
          <div className="p-6">
            <EmptyState
              title="No notifications found"
              description="No role-based messages match the current filters."
              action={<Button variant="secondary" onClick={resetFilters}>Reset Filters</Button>}
            />
          </div>
        )}
        {notifications.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Reference', 'Title', 'Message', 'Type', 'Priority', 'Status', 'Business Date', 'Created At', 'Actions'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {notifications.map((notification) => (
                  <tr key={notification.id} className={notification.status === NOTIFICATION_STATUSES.UNREAD ? 'bg-blue-50/40' : 'hover:bg-gray-50'}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{notification.reference}</td>
                    <td className="min-w-48 px-4 py-3 text-sm font-semibold text-gray-900">{notification.title}</td>
                    <td className="min-w-72 px-4 py-3 text-sm text-gray-700">{notification.message}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={getNotificationTypeBadgeVariant(notification.type)}>{formatNotificationType(notification.type)}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={getNotificationPriorityBadgeVariant(notification.priority)}>{notification.priority}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={notification.status === NOTIFICATION_STATUSES.UNREAD ? 'warning' : 'default'}>{notification.status}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{notification.businessDate || 'Not available'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatDateTime(notification.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => handleMarkRead(notification.id)} disabled={isSaving || notification.status === NOTIFICATION_STATUSES.READ}>Mark as Read</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(notification.id)} disabled={isSaving}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default Notifications
