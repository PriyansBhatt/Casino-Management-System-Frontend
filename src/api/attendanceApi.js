import { hrResponse } from '../utils/hrResponses'
import axiosInstance from './axiosInstance'

const options = { skipUnauthorizedRedirect: true }

export const attendanceApi = {
  checkIn: async () => hrResponse(await axiosInstance.post('/attendance/check-in', undefined, options), 'attendance'),

  checkOut: async () => hrResponse(await axiosInstance.post('/attendance/check-out', undefined, options), 'attendance'),

  getCurrent: async () => hrResponse(await axiosInstance.get('/attendance/current', options), 'attendance', { nullable: true }),

  getMyHistory: async (businessDate) => hrResponse(await axiosInstance.get('/attendance/me', {
    ...options,
    params: businessDate ? { businessDate } : undefined,
  }), 'attendance', { list: true, date: businessDate }),

  getReport: async (businessDate) => hrResponse(await axiosInstance.get('/attendance', {
    ...options,
    params: { businessDate },
  }), 'attendance', { list: true, date: businessDate }),

  createAttendanceCorrection: async (attendanceId, payload) => hrResponse(
    await axiosInstance.post(`/attendance/${attendanceId}/corrections`, payload, options)
  , 'correction', { target: attendanceId }),

  getAttendanceCorrections: async (attendanceId) => hrResponse(
    await axiosInstance.get(`/attendance/${attendanceId}/corrections`, options)
  , 'correction', { list: true, target: attendanceId }),
}

export default attendanceApi
