import axiosInstance from './axiosInstance'

export const bonusApi = {
  getBonuses: async (businessDate) => {
    const response = await axiosInstance.get('/customer-bonuses', {
      params: businessDate ? { businessDate } : {},
      skipUnauthorizedRedirect: true,
    })
    return response.data?.data || []
  },

  createBonus: async (payload) => {
    const response = await axiosInstance.post('/customer-bonuses', payload, {
      skipUnauthorizedRedirect: true,
    })
    return response.data?.data
  },
}

export default bonusApi
