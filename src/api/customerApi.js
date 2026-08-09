import axiosInstance from './axiosInstance'
import CUSTOMER_MOCK_DATA from '../constants/customerMockData'
import { formatCustomerCode } from '../utils/customerUtils'

const isMockCustomersEnabled = () => import.meta.env.VITE_USE_MOCK_CUSTOMERS === 'true'
const storageKey = 'casino_mock_customers'

const readMockCustomers = () => {
  try {
    const savedCustomers = localStorage.getItem(storageKey)
    if (savedCustomers) {
      const parsedCustomers = JSON.parse(savedCustomers)
      return Array.isArray(parsedCustomers) ? parsedCustomers : [...CUSTOMER_MOCK_DATA]
    }
  } catch (error) {
    console.error('Failed to read mock customers:', error)
  }

  return [...CUSTOMER_MOCK_DATA]
}

const saveMockCustomers = (customers) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(customers))
  } catch (error) {
    console.error('Failed to save mock customers:', error)
  }
}

let mockCustomers = readMockCustomers()

const wait = () => new Promise((resolve) => setTimeout(resolve, 250))

const matchesQuery = (customer, query) => {
  if (!query) {
    return true
  }

  const normalizedQuery = query.toLowerCase()
  return [
    customer.customerCode,
    customer.fullName,
    customer.phone,
    customer.email,
    customer.documentNumber,
  ].some((value) => value?.toLowerCase().includes(normalizedQuery))
}

export const customerApi = {
  getCustomers: async (filters = {}) => {
    if (isMockCustomersEnabled()) {
      await wait()
      return mockCustomers.filter((customer) => {
        const statusMatches = !filters.status || customer.status === filters.status
        const riskMatches = !filters.riskLevel || customer.riskLevel === filters.riskLevel
        const queryMatches = matchesQuery(customer, filters.query)
        return statusMatches && riskMatches && queryMatches
      })
    }

    const response = await axiosInstance.get('/customers', { params: filters })
    return response.data
  },

  getCustomerById: async (id) => {
    if (isMockCustomersEnabled()) {
      await wait()
      const customer = mockCustomers.find((item) => item.id === String(id))
      if (!customer) {
        throw new Error('Customer not found')
      }
      return customer
    }

    const response = await axiosInstance.get(`/customers/${id}`)
    return response.data
  },

  createCustomer: async (payload) => {
    if (isMockCustomersEnabled()) {
      await wait()
      const now = new Date().toISOString()
      const nextId = Math.max(0, ...mockCustomers.map((customer) => Number(customer.id) || 0)) + 1
      const customer = {
        ...payload,
        id: String(nextId),
        customerCode: formatCustomerCode(nextId),
        createdAt: now,
        updatedAt: now,
      }
      mockCustomers = [customer, ...mockCustomers]
      saveMockCustomers(mockCustomers)
      return customer
    }

    const response = await axiosInstance.post('/customers', payload)
    return response.data
  },

  registerCustomer: async ({ fullName, phone, nationality }) => {
    const response = await axiosInstance.post('/customers', {
      fullName,
      phone,
      nationality,
    })
    return response.data
  },

  updateCustomer: async (id, payload) => {
    if (isMockCustomersEnabled()) {
      await wait()
      const index = mockCustomers.findIndex((customer) => customer.id === String(id))
      if (index === -1) {
        throw new Error('Customer not found')
      }
      const updatedCustomer = {
        ...mockCustomers[index],
        ...payload,
        updatedAt: new Date().toISOString(),
      }
      mockCustomers = mockCustomers.map((customer) =>
        customer.id === String(id) ? updatedCustomer : customer
      )
      saveMockCustomers(mockCustomers)
      return updatedCustomer
    }

    const response = await axiosInstance.put(`/customers/${id}`, payload)
    return response.data
  },

  searchCustomers: async (query) => {
    if (isMockCustomersEnabled()) {
      await wait()
      return mockCustomers.filter((customer) => matchesQuery(customer, query))
    }

    const response = await axiosInstance.get('/customers/search', {
      params: { q: query },
    })
    return response.data
  },
}

export const getCustomers = customerApi.getCustomers
export const getCustomerById = customerApi.getCustomerById
export const createCustomer = customerApi.createCustomer
export const registerCustomer = customerApi.registerCustomer
export const updateCustomer = customerApi.updateCustomer
export const searchCustomers = customerApi.searchCustomers

export default customerApi
