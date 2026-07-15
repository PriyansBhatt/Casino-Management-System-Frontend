import axiosInstance from './axiosInstance'
import ADMIN_MOCK_DATA from '../constants/adminMockData'
import { ROLES } from '../constants/roles'
import ROUTE_PERMISSIONS from '../constants/routePermissions'
import { USER_STATUSES } from '../constants/adminConstants'
import { generateDepartmentReference } from '../utils/adminUtils'

const usersStorageKey = 'casino_mock_admin_users'
const departmentsStorageKey = 'casino_mock_admin_departments'
const settingsStorageKey = 'casino_mock_admin_settings'
const isMockAdminEnabled = () => import.meta.env.VITE_USE_MOCK_ADMIN === 'true'
const wait = () => new Promise((resolve) => setTimeout(resolve, 250))

const readStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return fallback
    const parsed = JSON.parse(saved)
    if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : fallback
    if (fallback && typeof fallback === 'object') {
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback
    }
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

let mockUsers = readStorage(usersStorageKey, ADMIN_MOCK_DATA.users)
let mockDepartments = readStorage(departmentsStorageKey, ADMIN_MOCK_DATA.departments)
let mockSettings = readStorage(settingsStorageKey, ADMIN_MOCK_DATA.settings)

const saveUsers = () => saveStorage(usersStorageKey, mockUsers)
const saveDepartments = () => saveStorage(departmentsStorageKey, mockDepartments)
const saveSettings = () => saveStorage(settingsStorageKey, mockSettings)
const nextId = (items) => String(Math.max(0, ...items.map((item) => Number(item.id) || 0)) + 1)

const filterText = (values, search) => {
  const normalized = search?.toLowerCase()
  return !normalized || values.some((value) => value?.toLowerCase().includes(normalized))
}

export const adminApi = {
  getUsers: async (filters = {}) => {
    if (isMockAdminEnabled()) {
      await wait()
      return mockUsers.filter((user) => {
        const roleMatches = !filters.role || user.role === filters.role
        const statusMatches = !filters.status || user.status === filters.status
        const departmentMatches = !filters.department || user.department === filters.department
        const searchMatches = filterText(
          [user.fullName, user.username, user.email, user.phone],
          filters.search
        )
        return roleMatches && statusMatches && departmentMatches && searchMatches
      })
    }

    const response = await axiosInstance.get('/admin/users', { params: filters })
    return response.data
  },

  getUserById: async (id) => {
    if (isMockAdminEnabled()) {
      await wait()
      const user = mockUsers.find((item) => item.id === String(id))
      if (!user) throw new Error('User not found')
      return user
    }

    const response = await axiosInstance.get(`/admin/users/${id}`)
    return response.data
  },

  createUser: async (payload) => {
    if (isMockAdminEnabled()) {
      await wait()
      const now = new Date().toISOString()
      const user = {
        id: nextId(mockUsers),
        status: USER_STATUSES.ACTIVE,
        createdAt: now,
        updatedAt: now,
        ...payload,
      }
      mockUsers = [user, ...mockUsers]
      saveUsers()
      return user
    }

    const response = await axiosInstance.post('/admin/users', payload)
    return response.data
  },

  updateUser: async (id, payload) => {
    if (isMockAdminEnabled()) {
      await wait()
      const user = mockUsers.find((item) => item.id === String(id))
      if (!user) throw new Error('User not found')
      const updated = { ...user, ...payload, updatedAt: new Date().toISOString() }
      mockUsers = mockUsers.map((item) => (item.id === String(id) ? updated : item))
      saveUsers()
      return updated
    }

    const response = await axiosInstance.put(`/admin/users/${id}`, payload)
    return response.data
  },

  toggleUserStatus: async (id, payload) => {
    if (isMockAdminEnabled()) {
      await wait()
      const user = mockUsers.find((item) => item.id === String(id))
      if (!user) throw new Error('User not found')
      const updated = {
        ...user,
        status: payload.status || (user.status === USER_STATUSES.ACTIVE ? USER_STATUSES.INACTIVE : USER_STATUSES.ACTIVE),
        updatedAt: new Date().toISOString(),
      }
      mockUsers = mockUsers.map((item) => (item.id === String(id) ? updated : item))
      saveUsers()
      return updated
    }

    const response = await axiosInstance.put(`/admin/users/${id}/status`, payload)
    return response.data
  },

  getRoles: async () => {
    if (isMockAdminEnabled()) {
      await wait()
      return Object.values(ROLES).map((role) => ({
        id: role,
        role,
        description: `${role.split('_').join(' ')} system role`,
      }))
    }

    const response = await axiosInstance.get('/admin/roles')
    return response.data
  },

  getDepartments: async () => {
    if (isMockAdminEnabled()) {
      await wait()
      return mockDepartments
    }

    const response = await axiosInstance.get('/admin/departments')
    return response.data
  },

  createDepartment: async (payload) => {
    if (isMockAdminEnabled()) {
      await wait()
      const now = new Date().toISOString()
      const department = {
        id: nextId(mockDepartments),
        reference: payload.reference || generateDepartmentReference(),
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
        ...payload,
      }
      mockDepartments = [department, ...mockDepartments]
      saveDepartments()
      return department
    }

    const response = await axiosInstance.post('/admin/departments', payload)
    return response.data
  },

  updateDepartment: async (id, payload) => {
    if (isMockAdminEnabled()) {
      await wait()
      const department = mockDepartments.find((item) => item.id === String(id))
      if (!department) throw new Error('Department not found')
      const updated = { ...department, ...payload, updatedAt: new Date().toISOString() }
      mockDepartments = mockDepartments.map((item) => (item.id === String(id) ? updated : item))
      saveDepartments()
      return updated
    }

    const response = await axiosInstance.put(`/admin/departments/${id}`, payload)
    return response.data
  },

  getSystemSettings: async () => {
    if (isMockAdminEnabled()) {
      await wait()
      return mockSettings
    }

    const response = await axiosInstance.get('/admin/settings')
    return response.data
  },

  updateSystemSettings: async (payload) => {
    if (isMockAdminEnabled()) {
      await wait()
      mockSettings = { ...mockSettings, ...payload, updatedAt: new Date().toISOString() }
      saveSettings()
      return mockSettings
    }

    const response = await axiosInstance.put('/admin/settings', payload)
    return response.data
  },

  getPermissionOverview: async () => {
    if (isMockAdminEnabled()) {
      await wait()
      return Object.entries(ROUTE_PERMISSIONS).map(([path, allowedRoles]) => ({
        path,
        allowedRoles,
      }))
    }

    const response = await axiosInstance.get('/admin/permissions')
    return response.data
  },
}

export const getUsers = adminApi.getUsers
export const getUserById = adminApi.getUserById
export const createUser = adminApi.createUser
export const updateUser = adminApi.updateUser
export const toggleUserStatus = adminApi.toggleUserStatus
export const getRoles = adminApi.getRoles
export const getDepartments = adminApi.getDepartments
export const createDepartment = adminApi.createDepartment
export const updateDepartment = adminApi.updateDepartment
export const getSystemSettings = adminApi.getSystemSettings
export const updateSystemSettings = adminApi.updateSystemSettings
export const getPermissionOverview = adminApi.getPermissionOverview

export default adminApi
