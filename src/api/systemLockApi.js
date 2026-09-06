import axiosInstance from './axiosInstance'

const config = { skipUnauthorizedRedirect: true }
const unwrap = (response) => response.data?.data

export const systemLockApi = {
  getStatus: async () => unwrap(await axiosInstance.get('/system-lock', config)),
  emergencyUnlock: async (reason) => unwrap(await axiosInstance.put(
    '/system-lock/unlock', { reason }, config,
  )),
  lock: async () => unwrap(await axiosInstance.put('/system-lock/lock', null, config)),
}

export default systemLockApi
