import axiosInstance from './axiosInstance'

const requestConfig = { skipUnauthorizedRedirect: true }

const data = (response) => {
  if (response.data?.success !== true || !Object.hasOwn(response.data, 'data')) {
    throw new Error('Authoritative custody response is unavailable.')
  }
  return response.data.data
}

// A successful HTTP mutation remains confirmed even when optional response details are missing.
const posted = (response) => response.data?.data

export const chipCustodyApi = {
  getOperationalStatus: async () => data(await axiosInstance.get('/business-status/current', requestConfig)),
  getCurrentOpenBusinessDate: async () => data(await axiosInstance.get(
    '/business-date/current-open', requestConfig,
  )),

  getCageInventory: async () => data(await axiosInstance.get('/chip-custody/cage', requestConfig)),

  initializeCage: async (payload) => posted(await axiosInstance.post(
    '/chip-custody/cage/opening', payload, requestConfig,
  )),

  getCustomerSessionInventory: async (sessionId) => data(await axiosInstance.get(
    `/chip-custody/customer-sessions/${sessionId}`, requestConfig,
  )),

  getTableInventory: async (tableId) => data(await axiosInstance.get(
    `/chip-custody/tables/${tableId}`, requestConfig,
  )),

  issueTableFloat: async (tableId, payload) => posted(await axiosInstance.post(
    `/chip-custody/tables/${tableId}/float-issue`, payload, requestConfig,
  )),

  returnTableFloat: async (tableId, payload) => posted(await axiosInstance.post(
    `/chip-custody/tables/${tableId}/float-return`, payload, requestConfig,
  )),

  moveCustomerChipsToTable: async (tableId, sessionId, payload) => posted(
    await axiosInstance.post(
      `/chip-custody/tables/${tableId}/customer-sessions/${sessionId}/issue`,
      payload, requestConfig,
    ),
  ),

  returnTableChipsToCustomer: async (tableId, sessionId, payload) => posted(
    await axiosInstance.post(
      `/chip-custody/tables/${tableId}/customer-sessions/${sessionId}/return`,
      payload, requestConfig,
    ),
  ),

  getCurrentMovements: async () => data(await axiosInstance.get(
    '/chip-custody/movements/current', requestConfig,
  )),
}

export default chipCustodyApi
