import axiosInstance from './axiosInstance'

export const receptionApi = {
  getCustomers: async (config = {}) => {
    const response = await axiosInstance.get('/customers', config)
    return response.data
  },

  searchCustomers: async (query) => {
    const response = await axiosInstance.get('/customers/search', {
      params: { query },
    })
    return response.data
  },

  getSessions: async (businessDate) => {
    const response = await axiosInstance.get('/sessions', {
      params: businessDate ? { businessDate } : {},
    })
    return response.data
  },

  getActiveSession: async (customerId, config = {}) => {
    try {
      const response = await axiosInstance.get(`/sessions/active/customer/${customerId}`, config)
      return response.data
    } catch (error) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  openSession: async (customerId) => {
    const response = await axiosInstance.post('/sessions', { customerId })
    return response.data
  },

  closeSession: async (sessionId) => {
    const response = await axiosInstance.post(`/sessions/${sessionId}/close`)
    return response.data
  },

  getCurrentOpenBusinessDate: async () => {
    const response = await axiosInstance.get('/business-date/current-open')
    if (response.data?.success !== true || !Object.hasOwn(response.data, 'data')) {
      throw new Error('Current OPEN Business Date is unavailable.')
    }
    return response.data.data
  },
}

export default receptionApi
