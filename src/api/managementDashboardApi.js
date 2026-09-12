import axiosInstance from './axiosInstance'
import { validateDashboard } from '../utils/managementDashboard'

export const getManagementDashboard = async (businessDate = '', signal) => {
  const response = await axiosInstance.get('/dashboard/management', {
    params: businessDate ? { businessDate } : undefined,
    signal,
    skipUnauthorizedRedirect: true,
  })
  return validateDashboard(response.data, businessDate)
}
