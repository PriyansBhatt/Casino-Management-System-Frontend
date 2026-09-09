import axiosInstance from './axiosInstance'

const unwrap = (response) => response.data?.data ?? response.data

export const businessDateApi = {
  getStatus: async () => unwrap(await axiosInstance.get('/business-status/current')),
  getAll: async () => unwrap(await axiosInstance.get('/business-date/all')),
  getCurrentOpen: async () => unwrap(await axiosInstance.get('/business-date/current-open')),
  open: async (businessDate, remarks) => unwrap(await axiosInstance.post(`/business-date/open/${businessDate}`, null, { params: remarks ? { remarks } : undefined })),
  close: async (businessDate) => unwrap(await axiosInstance.post(`/business-date/close/${businessDate}`)),
  reopen: async (businessDate, remarks) => unwrap(await axiosInstance.post(`/business-date/reopen/${businessDate}`, null, { params: remarks ? { remarks } : undefined })),
  getContinuationOverride: async () => unwrap(await axiosInstance.get('/business-date/continuation-override')),
  createContinuationOverride: async (payload) => unwrap(await axiosInstance.post('/business-date/continuation-override', payload)),
  revokeContinuationOverride: async (payload) => unwrap(await axiosInstance.delete('/business-date/continuation-override', { data: payload })),
}

export default businessDateApi
