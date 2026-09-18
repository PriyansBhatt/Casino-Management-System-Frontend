import axiosInstance from './axiosInstance'

export async function getManagementReport(view, businessDate, page=0) {
  if (!['daily','reconciliations'].includes(view)) throw new Error('Unsupported report.')
  const params = { ...(businessDate ? { businessDate } : {}), ...(view==='reconciliations' ? {page,size:50} : {}) }
  const response = await axiosInstance.get(view==='daily'?'/reports/daily-operations':'/reports/reconciliations',{params})
  if (response.data?.success !== true || !response.data.data || typeof response.data.data !== 'object' || Array.isArray(response.data.data)) throw new Error('Report unavailable: invalid response.')
  return response.data.data
}
export const getRunningFundsReport = date => getManagementReport('daily',date)
// Unmounted prototype components retain imports but cannot load prototype records.
const deferred = async () => { throw new Error('This legacy report is unavailable.') }
export const getDailyBusinessReport = deferred
export const getCustomerTransactionReport = deferred
export const getTransactionReport = deferred
export const getLosingReturnPreview = deferred
export const reportApi = {getManagementReport,getRunningFundsReport,getDailyBusinessReport,getCustomerTransactionReport,getTransactionReport,getLosingReturnPreview}
export default reportApi
