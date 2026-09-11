import axiosInstance from './axiosInstance'

const options = { skipUnauthorizedRedirect: true }
const unwrap = (response) => response.data?.data

export const attendanceApi = {
  checkIn: async () => unwrap(await axiosInstance.post('/attendance/check-in', undefined, options)),

  checkOut: async () => unwrap(await axiosInstance.post('/attendance/check-out', undefined, options)),

  getCurrent: async () => unwrap(await axiosInstance.get('/attendance/current', options)),

  getMyHistory: async (businessDate) => unwrap(await axiosInstance.get('/attendance/me', {
    ...options,
    params: businessDate ? { businessDate } : undefined,
  })) || [],

  getReport: async (businessDate) => unwrap(await axiosInstance.get('/attendance', {
    ...options,
    params: { businessDate },
  })) || [],

  createAttendanceCorrection: async (attendanceId, payload) => unwrap(
    await axiosInstance.post(`/attendance/${attendanceId}/corrections`, payload, options)
  ),

  getAttendanceCorrections: async (attendanceId) => unwrap(
    await axiosInstance.get(`/attendance/${attendanceId}/corrections`, options)
  ) || [],
}

export default attendanceApi
