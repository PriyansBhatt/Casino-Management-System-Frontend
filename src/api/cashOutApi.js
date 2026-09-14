import axiosInstance from './axiosInstance'
import receptionApi from './receptionApi'
import chipCustodyApi from './chipCustodyApi'
const config = { skipUnauthorizedRedirect: true }
const data = (response) => {
  if (response.data?.success !== true || !Object.hasOwn(response.data, 'data')) throw new Error('Authoritative response unavailable.')
  return response.data.data
}
export default {
  getCurrentOpenBusinessDate: chipCustodyApi.getCurrentOpenBusinessDate,
  getOperationalStatus: chipCustodyApi.getOperationalStatus,
  getCustomerSessionInventory: chipCustodyApi.getCustomerSessionInventory,
  getCustomers: receptionApi.getCustomers,
  getActiveSession: receptionApi.getActiveSession,
  getCurrentCashierReconciliation: async () => data(await axiosInstance.get('/cashier-reconciliation/current', config)),
  getSessionFinancialPosition: async (id) => data(await axiosInstance.get(`/session-summary/${id}`, config)),
  getCashOutsBySession: async (id) => (await axiosInstance.get(`/cashouts/session/${id}`, config)).data,
  getLosingReturnEligibility: async (id) => data(await axiosInstance.get(`/losing-returns/eligibility/customer/${id}`, config)),
  getLosingReturnHistory: async (id, businessDate) => data(await axiosInstance.get(`/losing-returns/history/customer/${id}`, { ...config, params: { businessDate } })),
  createCashOut: async (payload) => (await axiosInstance.post('/cashouts', payload, config)).data?.data,
  createLosingReturn: async (payload) => (await axiosInstance.post('/losing-returns', payload, config)).data?.data,
}
