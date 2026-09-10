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
}

export default hrApi
