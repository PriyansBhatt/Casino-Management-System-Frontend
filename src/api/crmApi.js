import axios from './axiosInstance'
import { parseCrmResponse } from '../utils/crm'
const options = { skipUnauthorizedRedirect: true, transformResponse: [parseCrmResponse] }
const data = (response) => {
 if (!response.data?.success || response.data.data == null) throw new Error('Invalid CRM response')
 return response.data.data
}
export default {
 records: async (params) => { const result = data(await axios.get('/crm/records', { ...options, params })); if (!Array.isArray(result.records)) throw new Error('Invalid CRM history'); return result },
 customers: async (q) => { const result = data(await axios.get('/crm/customers', { ...options, params: { q } })); if (!Array.isArray(result)) throw new Error('Invalid customer results'); return result },
 create: async (kind, payload) => data(await axios.post(`/crm/${kind}`, payload, options)),
 status: async (kind, id, payload) => data(await axios.patch(`/crm/${kind}/${id}/status`, payload, options)),
 hotel: async (id) => data(await axios.get(`/hotel-bookings/${id}`, options)),
 createHotel: async (payload) => data(await axios.post('/hotel-bookings', payload, options)),
 hotelAction: async (id, action, payload = {}) => data(await axios.patch(`/hotel-bookings/${id}/${action}`, payload, options)),
}
