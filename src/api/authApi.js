import axiosInstance from './axiosInstance'
import { ROLES } from '../constants/roles'

const mockUsers = [
  {
    username: 'admin',
    password: 'admin123',
    fullName: 'Super Admin',
    role: ROLES.SUPER_ADMIN,
  },
  {
    username: 'director',
    password: 'director123',
    fullName: 'Director User',
    role: ROLES.DIRECTOR,
  },
  {
    username: 'cashier',
    password: 'cashier123',
    fullName: 'Cashier User',
    role: ROLES.CASHIER,
  },
  {
    username: 'reception',
    password: 'reception123',
    fullName: 'Reception User',
    role: ROLES.RECEPTIONIST,
  },
  {
    username: 'pitboss',
    password: 'pitboss123',
    fullName: 'Pit Boss User',
    role: ROLES.PIT_BOSS,
  },
  {
    username: 'store',
    password: 'store123',
    fullName: 'Store Keeper User',
    role: ROLES.STORE_KEEPER,
  },
  {
    username: 'procurement',
    password: 'procurement123',
    fullName: 'Procurement User',
    role: ROLES.PROCUREMENT,
  },
  {
    username: 'accounts',
    password: 'accounts123',
    fullName: 'Accounts User',
    role: ROLES.ACCOUNTS,
  },
  {
    username: 'department',
    password: 'department123',
    fullName: 'Department Head User',
    role: ROLES.DEPARTMENT_HEAD,
  },
  {
    username: 'auditor',
    password: 'auditor123',
    fullName: 'Auditor User',
    role: ROLES.AUDITOR,
  },
]

// Mock login function
const mockLogin = async (username, password) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const mockUser = mockUsers.find(
    (user) => user.username === username && user.password === password
  )

  if (mockUser) {
    return {
      token: `mock-jwt-token-${mockUser.username}-${Date.now()}`,
      user: {
        id: mockUsers.findIndex((user) => user.username === mockUser.username) + 1,
        fullName: mockUser.fullName,
        username: mockUser.username,
        role: mockUser.role,
      },
    }
  }

  throw new Error('Invalid username or password')
}

// Real login via API
const loginViaAPI = async (credentials) => {
  try {
    const response = await axiosInstance.post('/auth/login', credentials)
    const responseBody = response.data

    if (responseBody?.success !== true) {
      throw new Error(responseBody?.message || 'Login failed')
    }

    const backendData = responseBody.data

    return {
      token: backendData.token,
      user: {
        username: backendData.username,
        role: backendData.role,
        status: backendData.status,
      },
    }
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message)
    }
    throw new Error(error.message || 'Login failed')
  }
}

export const authApi = {
  loginUser: async (credentials) => {
    const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === 'true'

    if (useMockAuth) {
      return mockLogin(credentials.username, credentials.password)
    } else {
      return loginViaAPI(credentials)
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await axiosInstance.get('/auth/me')
      return response.data
    } catch (error) {
      console.error('Error fetching current user:', error)
      throw new Error('Failed to fetch user data')
    }
  },

  logoutUser: async () => {
    if (import.meta.env.VITE_USE_MOCK_AUTH === 'true') {
      return
    }

    try {
      await axiosInstance.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
      // Continue logout even if API call fails
    }
  },
}

export default authApi
