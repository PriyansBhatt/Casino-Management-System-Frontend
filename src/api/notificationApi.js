import axiosInstance from './axiosInstance'
import { ROLES } from '../constants/roles'
import {
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPES,
} from '../constants/notificationConstants'
import { generateNotificationReference } from '../utils/notificationUtils'

const notificationsStorageKey = 'casino_mock_notifications'
const isMockNotificationsEnabled = () => import.meta.env.VITE_USE_MOCK_NOTIFICATIONS === 'true'
const wait = () => new Promise((resolve) => setTimeout(resolve, 250))

const readStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return fallback
    const parsed = JSON.parse(saved)
    if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : fallback
    return parsed ?? fallback
  } catch (error) {
    console.error(`Failed to read ${key}:`, error)
    return fallback
  }
}

const saveStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Failed to save ${key}:`, error)
  }
}

const seedNotifications = () => [
  {
    id: '1',
    reference: 'NTF-00000001',
    title: 'Pending approvals require review',
    message: 'Director has pending approvals and high-value alerts for the active Business Date.',
    type: NOTIFICATION_TYPES.APPROVAL,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    status: NOTIFICATION_STATUSES.UNREAD,
    targetRoles: [ROLES.SUPER_ADMIN, ROLES.DIRECTOR, ROLES.ADMIN],
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    reference: 'NTF-00000002',
    title: 'System lock reminder',
    message: 'Cashier transaction actions will respect the settlement lock window.',
    type: NOTIFICATION_TYPES.SYSTEM_LOCK,
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    status: NOTIFICATION_STATUSES.UNREAD,
    targetRoles: [ROLES.CASHIER],
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    reference: 'NTF-00000003',
    title: 'Store request queue',
    message: 'Department requests and low stock notices will appear for store review.',
    type: NOTIFICATION_TYPES.STORE,
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    status: NOTIFICATION_STATUSES.UNREAD,
    targetRoles: [ROLES.STORE_KEEPER],
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    reference: 'NTF-00000004',
    title: 'Bills and payments',
    message: 'Accounts can review bills, payments, and vendor history by Business Date.',
    type: NOTIFICATION_TYPES.ACCOUNTS,
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    status: NOTIFICATION_STATUSES.UNREAD,
    targetRoles: [ROLES.ACCOUNTS],
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    reference: 'NTF-00000005',
    title: 'Audit trail ready',
    message: 'Auditors can review activity logs and security-sensitive actions.',
    type: NOTIFICATION_TYPES.AUDIT,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    status: NOTIFICATION_STATUSES.UNREAD,
    targetRoles: [ROLES.AUDITOR, ROLES.SUPER_ADMIN, ROLES.ADMIN],
    createdAt: new Date().toISOString(),
  },
]

let mockNotifications = readStorage(notificationsStorageKey, seedNotifications())
const saveNotifications = () => saveStorage(notificationsStorageKey, mockNotifications)
const nextId = () => String(Math.max(0, ...mockNotifications.map((item) => Number(item.id) || 0)) + 1)

const isVisibleForRole = (notification, role) => {
  if (!role) return false
  if (!notification.targetRoles || notification.targetRoles.length === 0) return true
  return notification.targetRoles.includes(role)
}

const filterNotifications = (filters = {}) => {
  return mockNotifications.filter((notification) => {
    const roleMatches = !filters.userRole || isVisibleForRole(notification, filters.userRole)
    const statusMatches = !filters.status || notification.status === filters.status
    const typeMatches = !filters.type || notification.type === filters.type
    const priorityMatches = !filters.priority || notification.priority === filters.priority
    const businessDateMatches =
      !filters.businessDate || notification.businessDate === filters.businessDate
    return roleMatches && statusMatches && typeMatches && priorityMatches && businessDateMatches
  })
}

export const notificationApi = {
  getNotifications: async (filters = {}) => {
    if (isMockNotificationsEnabled()) {
      await wait()
      return filterNotifications(filters).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    const response = await axiosInstance.get('/notifications', { params: filters })
    return response.data
  },

  getUnreadNotificationCount: async (userRole) => {
    if (isMockNotificationsEnabled()) {
      await wait()
      return filterNotifications({ userRole, status: NOTIFICATION_STATUSES.UNREAD }).length
    }

    const response = await axiosInstance.get('/notifications/unread-count', { params: { userRole } })
    return response.data
  },

  createNotification: async (payload) => {
    if (isMockNotificationsEnabled()) {
      await wait()
      const notification = {
        id: nextId(),
        reference: payload.reference || generateNotificationReference(),
        status: NOTIFICATION_STATUSES.UNREAD,
        createdAt: new Date().toISOString(),
        ...payload,
      }
      mockNotifications = [notification, ...mockNotifications]
      saveNotifications()
      return notification
    }

    const response = await axiosInstance.post('/notifications', payload)
    return response.data
  },

  markNotificationRead: async (id) => {
    if (isMockNotificationsEnabled()) {
      await wait()
      const updated = mockNotifications.find((item) => item.id === String(id))
      if (!updated) throw new Error('Notification not found')
      mockNotifications = mockNotifications.map((item) =>
        item.id === String(id)
          ? { ...item, status: NOTIFICATION_STATUSES.READ, readAt: new Date().toISOString() }
          : item
      )
      saveNotifications()
      return mockNotifications.find((item) => item.id === String(id))
    }

    const response = await axiosInstance.put(`/notifications/${id}/read`)
    return response.data
  },

  markAllNotificationsRead: async (filters = {}) => {
    if (isMockNotificationsEnabled()) {
      await wait()
      const visibleIds = new Set(filterNotifications(filters).map((item) => item.id))
      mockNotifications = mockNotifications.map((item) =>
        visibleIds.has(item.id)
          ? { ...item, status: NOTIFICATION_STATUSES.READ, readAt: new Date().toISOString() }
          : item
      )
      saveNotifications()
      return filterNotifications({ ...filters, status: NOTIFICATION_STATUSES.READ })
    }

    const response = await axiosInstance.put('/notifications/read-all', filters)
    return response.data
  },

  deleteNotification: async (id) => {
    if (isMockNotificationsEnabled()) {
      await wait()
      mockNotifications = mockNotifications.filter((item) => item.id !== String(id))
      saveNotifications()
      return { id }
    }

    const response = await axiosInstance.delete(`/notifications/${id}`)
    return response.data
  },
}

export const getNotifications = notificationApi.getNotifications
export const getUnreadNotificationCount = notificationApi.getUnreadNotificationCount
export const createNotification = notificationApi.createNotification
export const markNotificationRead = notificationApi.markNotificationRead
export const markAllNotificationsRead = notificationApi.markAllNotificationsRead
export const deleteNotification = notificationApi.deleteNotification

export default notificationApi
