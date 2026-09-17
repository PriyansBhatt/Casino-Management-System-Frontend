import axiosInstance from './axiosInstance'
import ADMIN_MOCK_DATA from '../constants/adminMockData'
import { ROLES } from '../constants/roles'
import ROUTE_PERMISSIONS from '../constants/routePermissions'
import { generateDepartmentReference } from '../utils/adminUtils'

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

let mockDepartments = readStorage(departmentsStorageKey, ADMIN_MOCK_DATA.departments)
let mockSettings = readStorage(settingsStorageKey, ADMIN_MOCK_DATA.settings)

const saveDepartments = () => saveStorage(departmentsStorageKey, mockDepartments)
const saveSettings = () => saveStorage(settingsStorageKey, mockSettings)
const nextId = (items) => String(Math.max(0, ...items.map((item) => Number(item.id) || 0)) + 1)

const filterText = (values, search) => {
  const normalized = search?.toLowerCase()
  return !normalized || values.some((value) => value?.toLowerCase().includes(normalized))
}

const userResult = response => {
  if (response.data?.success !== true || !response.data.data?.id) throw new Error(response.data?.message || 'Account response unavailable; refresh before retrying.')
  return response.data.data
}

export const adminApi = {
  // User Management always uses the authoritative backend, including outside T0.
  getUsers: async () => {
    const response = await axiosInstance.get('/users')
    if (!Array.isArray(response.data)) throw new Error('Authoritative user directory unavailable.')
    return response.data
  },
  createUser: async payload => userResult(await axiosInstance.post('/users', payload)),
  changeUserRole: async (id, payload) => userResult(await axiosInstance.patch(`/users/${id}/role`, payload)),
  toggleUserStatus: async (id, payload) => userResult(await axiosInstance.patch(`/users/${id}/status`, payload)),
  resetUserPassword: async (id, payload) => userResult(await axiosInstance.post(`/users/${id}/password`, payload)),

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
export const createUser = adminApi.createUser
export const changeUserRole = adminApi.changeUserRole
export const resetUserPassword = adminApi.resetUserPassword
export const toggleUserStatus = adminApi.toggleUserStatus
export const getRoles = adminApi.getRoles
export const getDepartments = adminApi.getDepartments
export const createDepartment = adminApi.createDepartment
export const updateDepartment = adminApi.updateDepartment
export const getSystemSettings = adminApi.getSystemSettings
export const updateSystemSettings = adminApi.updateSystemSettings
export const getPermissionOverview = adminApi.getPermissionOverview

export default adminApi
