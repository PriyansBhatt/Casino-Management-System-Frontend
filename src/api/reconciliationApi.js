import axiosInstance from './axiosInstance'
import chipCustodyApi from './chipCustodyApi'
const config = { skipUnauthorizedRedirect: true }
const data = (response) => {
  if (response.data?.success !== true || !Object.hasOwn(response.data, 'data')) throw new Error('Authoritative reconciliation response unavailable.')
  return response.data.data
}
// Mutations return optional details separately from transport confirmation.
export default {
  getCurrentOpenBusinessDate: chipCustodyApi.getCurrentOpenBusinessDate,
  getOperationalStatus: chipCustodyApi.getOperationalStatus,
  current: async () => data(await axiosInstance.get('/cashier-reconciliation/current', config)),
  opening: async () => data(await axiosInstance.get('/cashier-opening-balances/current', config)),
  management: async () => data(await axiosInstance.get('/cashier-reconciliation/current/submitted', config)),
  preview: async (payload) => data(await axiosInstance.post('/cashier-reconciliation/preview', payload, config)),
  submit: async (payload) => (await axiosInstance.post('/cashier-reconciliation/submit', payload, config)).data?.data,
  establish: async (payload) => (await axiosInstance.post('/cashier-opening-balances/current', payload, config)).data?.data,
  reopen: async (id, reason) => (await axiosInstance.post(`/cashier-reconciliation/${id}/reopen`, { reason }, config)).data?.data,
}
