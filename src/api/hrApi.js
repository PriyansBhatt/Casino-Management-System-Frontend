import axiosInstance from './axiosInstance'

const options = { skipUnauthorizedRedirect: true }
const unwrap = (response) => response.data?.data

export const hrApi = {
  getDepartments: async () => unwrap(await axiosInstance.get('/hr/departments', options)) || [],
  createDepartment: async (payload) => unwrap(await axiosInstance.post('/hr/departments', payload, options)),
  updateDepartment: async (id, payload) => unwrap(await axiosInstance.patch(`/hr/departments/${id}`, payload, options)),

  getJobTitles: async () => unwrap(await axiosInstance.get('/hr/job-titles', options)) || [],
  createJobTitle: async (payload) => unwrap(await axiosInstance.post('/hr/job-titles', payload, options)),
  updateJobTitle: async (id, payload) => unwrap(await axiosInstance.patch(`/hr/job-titles/${id}`, payload, options)),

  getStaff: async () => unwrap(await axiosInstance.get('/hr/staff', options)) || [],
  getStaffProfile: async (id) => unwrap(await axiosInstance.get(`/hr/staff/${id}`, options)),
  getMyStaffProfile: async () => unwrap(await axiosInstance.get('/hr/staff/me', options)),
  getStaffCandidates: async () => unwrap(await axiosInstance.get('/hr/staff/candidates', options)) || [],
  createStaffProfile: async (payload) => unwrap(await axiosInstance.post('/hr/staff', payload, options)),
  updateStaffProfile: async (id, payload) => unwrap(await axiosInstance.patch(`/hr/staff/${id}`, payload, options)),

  getShiftDefinitions: async () => unwrap(await axiosInstance.get('/hr/shifts', options)) || [],
  getShiftDefinition: async (id) => unwrap(await axiosInstance.get(`/hr/shifts/${id}`, options)),
  createShiftDefinition: async (payload) => unwrap(await axiosInstance.post('/hr/shifts', payload, options)),
  updateShiftDefinition: async (id, payload) => unwrap(await axiosInstance.patch(`/hr/shifts/${id}`, payload, options)),

  getRosterAssignments: async (filters = {}) => unwrap(await axiosInstance.get('/hr/roster', {
    ...options,
    params: Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value != null)),
  })) || [],
  getRosterAssignment: async (id) => unwrap(await axiosInstance.get(`/hr/roster/${id}`, options)),
  createRosterAssignment: async (payload) => unwrap(await axiosInstance.post('/hr/roster', payload, options)),
  updateRosterAssignment: async (id, payload) => unwrap(await axiosInstance.patch(`/hr/roster/${id}`, payload, options)),
  cancelRosterAssignment: async (id, payload) => unwrap(await axiosInstance.post(`/hr/roster/${id}/cancel`, payload, options)),
}

export default hrApi
