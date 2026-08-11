import axios from 'axios'
import tokenStorage from '../utils/tokenStorage'
import { normalizeApiError } from '../utils/errorUtils'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 10000,
})

// Request interceptor to attach token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to normalize API errors and handle auth redirects.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedError = normalizeApiError(error)
    const currentPath = window.location.pathname

    error.normalized = normalizedError
    error.message = normalizedError.message

    if (normalizedError.status === 401) {
      tokenStorage.clearAuthStorage()
      if (currentPath !== '/login') {
        window.location.assign('/login')
      }
    }

    if (
      normalizedError.status === 403 &&
      !error.config?.skipUnauthorizedRedirect &&
      currentPath !== '/unauthorized'
    ) {
      window.location.assign('/unauthorized')
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
