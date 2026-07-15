import { createContext, useCallback, useEffect, useState } from 'react'
import useAuth from '../hooks/useAuth'
import useBusinessStatus from '../hooks/useBusinessStatus'
import {
  createNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notificationApi'
import { generateSystemNotificationsForUser } from '../services/notificationService'

export const NotificationContext = createContext(null)

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const { businessStatus } = useBusinessStatus()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated || !user?.role) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await generateSystemNotificationsForUser(user, businessStatus)
      const [items, count] = await Promise.all([
        getNotifications({ userRole: user.role }),
        getUnreadNotificationCount(user.role),
      ])
      setNotifications(items)
      setUnreadCount(Number(count || 0))
    } catch (err) {
      setError(err.message || 'Failed to load notifications.')
    } finally {
      setIsLoading(false)
    }
  }, [businessStatus, isAuthenticated, user])

  useEffect(() => {
    refreshNotifications()
  }, [refreshNotifications])

  const markAsRead = async (id) => {
    await markNotificationRead(id)
    await refreshNotifications()
  }

  const markAllAsRead = async () => {
    await markAllNotificationsRead({ userRole: user?.role })
    await refreshNotifications()
  }

  const addNotification = async (payload) => {
    const notification = await createNotification(payload)
    await refreshNotifications()
    return notification
  }

  const value = {
    notifications,
    unreadCount,
    isLoading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export default NotificationContext
