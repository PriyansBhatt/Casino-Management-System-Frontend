import { hrResponse } from '../utils/hrResponses'
import axiosInstance from './axiosInstance'

const options = { skipUnauthorizedRedirect: true }

export const hrApi = {
  getDepartments: async () => hrResponse(await axiosInstance.get('/hr/departments', options), 'master', { list: true }),
  createDepartment: async (payload) => hrResponse(await axiosInstance.post('/hr/departments', payload, options), 'master'),
  updateDepartment: async (id, payload) => hrResponse(await axiosInstance.patch(`/hr/departments/${id}`, payload, options), 'master', { target: id }),

  getJobTitles: async () => hrResponse(await axiosInstance.get('/hr/job-titles', options), 'master', { list: true }),
  createJobTitle: async (payload) => hrResponse(await axiosInstance.post('/hr/job-titles', payload, options), 'master'),
  updateJobTitle: async (id, payload) => hrResponse(await axiosInstance.patch(`/hr/job-titles/${id}`, payload, options), 'master', { target: id }),

  getStaff: async () => hrResponse(await axiosInstance.get('/hr/staff', options), 'staff', { list: true }),
  getStaffProfile: async (id) => hrResponse(await axiosInstance.get(`/hr/staff/${id}`, options), 'staff', { target: id }),
  getMyStaffProfile: async () => hrResponse(await axiosInstance.get('/hr/staff/me', options), 'staff'),
  getStaffCandidates: async () => hrResponse(await axiosInstance.get('/hr/staff/candidates', options), 'candidate', { list: true }),
  createStaffProfile: async (payload) => hrResponse(await axiosInstance.post('/hr/staff', payload, options), 'staff'),
  updateStaffProfile: async (id, payload) => hrResponse(await axiosInstance.patch(`/hr/staff/${id}`, payload, options), 'staff', { target: id }),

  getShiftDefinitions: async () => hrResponse(await axiosInstance.get('/hr/shifts', options), 'shift', { list: true }),
  getShiftDefinition: async (id) => hrResponse(await axiosInstance.get(`/hr/shifts/${id}`, options), 'shift', { target: id }),
  createShiftDefinition: async (payload) => hrResponse(await axiosInstance.post('/hr/shifts', payload, options), 'shift'),
  updateShiftDefinition: async (id, payload) => hrResponse(await axiosInstance.patch(`/hr/shifts/${id}`, payload, options), 'shift', { target: id }),

  getRosterAssignments: async (filters = {}) => hrResponse(await axiosInstance.get('/hr/roster', {
    ...options,
    params: Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value != null)),
  }), 'roster', { list: true }),
  getRosterAssignment: async (id) => hrResponse(await axiosInstance.get(`/hr/roster/${id}`, options), 'roster', { target: id }),
  createRosterAssignment: async (payload) => hrResponse(await axiosInstance.post('/hr/roster', payload, options), 'roster'),
  updateRosterAssignment: async (id, payload) => hrResponse(await axiosInstance.patch(`/hr/roster/${id}`, payload, options), 'roster', { target: id }),
  cancelRosterAssignment: async (id, payload) => hrResponse(await axiosInstance.post(`/hr/roster/${id}/cancel`, payload, options), 'roster', { target: id }),

  getAvailableLeaveTypes: async () => hrResponse(await axiosInstance.get('/hr/leave-types/available', options), 'master', { list: true }),
  getLeaveTypes: async () => hrResponse(await axiosInstance.get('/hr/leave-types', options), 'master', { list: true }),
  createLeaveType: async (payload) => hrResponse(await axiosInstance.post('/hr/leave-types', payload, options), 'master'),
  updateLeaveType: async (id, payload) => hrResponse(await axiosInstance.patch(`/hr/leave-types/${id}`, payload, options), 'master', { target: id }),

  createLeaveRequest: async (payload) => hrResponse(await axiosInstance.post('/hr/leave', payload, options), 'leave'),
  getMyLeaveRequests: async (filters = {}) => hrResponse(await axiosInstance.get('/hr/leave/me', {
    ...options,
    params: Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value != null)),
  }), 'leave', { list: true }),
  getLeaveRequests: async (filters = {}) => hrResponse(await axiosInstance.get('/hr/leave', {
    ...options,
    params: Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value != null)),
  }), 'leave', { list: true }),
  getLeaveRequest: async (id) => hrResponse(await axiosInstance.get(`/hr/leave/${id}`, options), 'leave', { target: id }),
  approveLeaveRequest: async (id, payload) => hrResponse(await axiosInstance.post(`/hr/leave/${id}/approve`, payload, options), 'leave', { target: id }),
  rejectLeaveRequest: async (id, payload) => hrResponse(await axiosInstance.post(`/hr/leave/${id}/reject`, payload, options), 'leave', { target: id }),
  cancelLeaveRequest: async (id, payload) => hrResponse(await axiosInstance.post(`/hr/leave/${id}/cancel`, payload, options), 'leave', { target: id }),
  cancelMyLeaveRequest: async (id, payload) => hrResponse(await axiosInstance.post(`/hr/leave/me/${id}/cancel`, payload, options), 'leave', { target: id }),
}

export default hrApi
