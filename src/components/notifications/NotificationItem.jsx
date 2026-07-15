import Badge from '../ui/Badge'
import { NOTIFICATION_STATUSES } from '../../constants/notificationConstants'
import {
  formatNotificationType,
  getNotificationPriorityBadgeVariant,
  getNotificationTypeBadgeVariant,
} from '../../utils/notificationUtils'
import { formatDateTime } from '../../utils/customerUtils'
import { cn } from '../../utils/cn'

const NotificationItem = ({ notification, compact = false, onClick }) => {
  const isUnread = notification.status === NOTIFICATION_STATUSES.UNREAD

  return (
    <button
      type="button"
      onClick={() => onClick?.(notification)}
      className={cn(
        'w-full rounded-lg border p-3 text-left transition hover:border-blue-300 hover:bg-blue-50',
        isUnread ? 'border-blue-200 bg-blue-50/60' : 'border-gray-200 bg-white'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn('truncate text-sm text-gray-900', isUnread ? 'font-bold' : 'font-semibold')}>
            {notification.title}
          </p>
          <p className={cn('mt-1 text-sm text-gray-600', compact ? 'line-clamp-2' : '')}>
            {notification.message}
          </p>
        </div>
        {isUnread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant={getNotificationTypeBadgeVariant(notification.type)}>
          {formatNotificationType(notification.type)}
        </Badge>
        <Badge variant={getNotificationPriorityBadgeVariant(notification.priority)}>
          {notification.priority}
        </Badge>
        <span className="text-xs text-gray-500">{formatDateTime(notification.createdAt)}</span>
      </div>
      {notification.businessDate && (
        <p className="mt-2 text-xs font-medium text-gray-500">Business Date: {notification.businessDate}</p>
      )}
    </button>
  )
}

export default NotificationItem
