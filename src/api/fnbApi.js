import axios from './axiosInstance'
const options = { skipUnauthorizedRedirect: true }
const data = response => {
 if (!response.data?.success || response.data.data == null) throw new Error('Invalid F&B response')
 return response.data.data
}
export default {
 overview: async () => data(await axios.get('/fnb/overview', options)),
 records: async params => { const result = data(await axios.get('/fnb/requests', { ...options, params })); if (!Array.isArray(result.records)) throw new Error('Invalid F&B records'); return result },
 customers: async q => { const result = data(await axios.get('/fnb/customers', { ...options, params: { q } })); if (!Array.isArray(result)) throw new Error('Invalid customer results'); return result },
 create: async payload => data(await axios.post('/fnb/requests', payload, options)),
 change: async (id, payload) => data(await axios.patch(`/fnb/requests/${id}/status`, payload, options)),
}
