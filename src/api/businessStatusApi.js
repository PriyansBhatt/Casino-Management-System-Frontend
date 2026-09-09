import axiosInstance from './axiosInstance'

const getMockBusinessStatus = () => ({
  businessDate: '2083-03-04',
  expectedBusinessDate: '2083-03-04',
  businessDateOpen: true,
  businessDateHealth: 'HEALTHY',
  businessDateStale: false,
  staleByDays: 0,
  lifecycleWarning: null,
  calendarDate: new Date().toISOString().split('T')[0],
  systemStatus: 'OPEN',
  isLocked: false,
  systemLocked: false,
  lockReason: null,
  continuationOverrideActive: false,
  continuationOverrideExpiresAt: null,
  continuationOverrideReason: null,
  continuationOverrideAuthorizedBy: null,
  operationWindow: '12:30 PM - 6:00 AM',
  settlementGraceUntil: '6:30 AM',
  lockWindow: '6:30 AM - 12:30 PM',
  lastUpdatedAt: new Date().toISOString(),
  serverTimestamp: new Date().toISOString(),
})

export const businessStatusApi = {
  getBusinessStatus: async () => {
    const useMockBusinessStatus = import.meta.env.VITE_USE_MOCK_BUSINESS_STATUS === 'true'

    if (useMockBusinessStatus) {
      return getMockBusinessStatus()
    }

    const response = await axiosInstance.get('/business-status/current')
    const status = response.data?.data || response.data
    return {
      ...status,
      isLocked: Boolean(status?.systemLocked),
      systemStatus: status?.systemLocked ? 'LOCKED' : 'OPEN',
      lastUpdatedAt: status?.serverTimestamp,
    }
  },

  requestSystemUnlock: async (payload) => {
    const useMockBusinessStatus = import.meta.env.VITE_USE_MOCK_BUSINESS_STATUS === 'true'

    if (useMockBusinessStatus) {
      return {
        success: true,
        requestedAt: new Date().toISOString(),
        payload,
      }
    }

    const response = await axiosInstance.post('/business-status/unlock-request', payload)
    return response.data
  },
}

export const getBusinessStatus = businessStatusApi.getBusinessStatus
export const requestSystemUnlock = businessStatusApi.requestSystemUnlock

export default businessStatusApi
