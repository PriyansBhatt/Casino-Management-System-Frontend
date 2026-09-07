import axiosInstance from './axiosInstance'

const options = { skipUnauthorizedRedirect: true }

export const hotelBookingApi = {
  getCurrent: async () => {
    const response = await axiosInstance.get('/hotel-bookings/current', options)
    return response.data?.data || []
  },

  create: async (payload) => {
    const response = await axiosInstance.post('/hotel-bookings', payload, options)
    return response.data?.data
  },

  approve: async (bookingId) => {
    const response = await axiosInstance.patch(`/hotel-bookings/${bookingId}/approve`, {}, options)
    return response.data?.data
  },

  reject: async (bookingId) => {
    const response = await axiosInstance.patch(`/hotel-bookings/${bookingId}/reject`, {}, options)
    return response.data?.data
  },

  updateStatus: async (bookingId, payload) => {
    const response = await axiosInstance.patch(`/hotel-bookings/${bookingId}/status`, payload, options)
    return response.data?.data
  },
}

export default hotelBookingApi
