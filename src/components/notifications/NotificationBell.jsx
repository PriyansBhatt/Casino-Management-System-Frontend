import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button'
import IconButton from '../ui/IconButton'
import NotificationItem from './NotificationItem'
import useNotifications from '../../hooks/useNotifications'

const NotificationBell = () => {
  const navigate = useNavigate()
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const latestNotifications = notifications.slice(0, 5)

  const handleNotificationClick = async (notification) => {
    await markAsRead(notification.id)
  }

  const handleViewAll = () => {
    setIsOpen(false)
    navigate('/notifications')
  }

  return (
    <div ref={containerRef} className="relative">
      <IconButton label="Notifications" onClick={() => setIsOpen((value) => !value)}>
        <span className="relative inline-flex">
          <span>!</span>
          {unreadCount > 0 && (
            <span className="absolute -right-3 -top-3 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </span>
      </IconButton>

      {isOpen && (
        <div className="fixed left-4 right-4 top-20 z-50 rounded-lg border border-gray-200 bg-white p-3 shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-96">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Notifications</p>
              <p className="text-xs text-gray-500">{unreadCount} unread</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleViewAll}>View All</Button>
          </div>

          <div className="max-h-96 space-y-2 overflow-y-auto">
            {latestNotifications.length === 0 ? (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">No notifications found.</p>
            ) : (
              latestNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  compact
                  onClick={handleNotificationClick}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
