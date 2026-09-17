import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import businessStatusApi from '../api/businessStatusApi'
import useAuth from '../hooks/useAuth'
import { useLocation } from 'react-router-dom'

export const BusinessStatusContext = createContext(null)

export const BusinessStatusProvider = ({ children }) => {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const [businessStatus, setBusinessStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const generation = useRef(0)

  const refreshBusinessStatus = useCallback(async () => {
    const request = ++generation.current
    if (!isAuthenticated) {
      setBusinessStatus(null)
      setError(null)
      setIsLoading(false)
      return null
    }
    setIsLoading(true)
    setBusinessStatus(null)
    setError(null)

    try {
      const status = await businessStatusApi.getBusinessStatus()
      if (request !== generation.current) return null
      setBusinessStatus(status)
      return status
    } catch (err) {
      if (request !== generation.current) return null
      const message = err.message || 'Failed to fetch business status'
      setBusinessStatus(null)
      setError(message)
      return null
    } finally {
      if (request === generation.current) setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (/^\/pit\/tables\/[^/]+\/mode$/.test(location.pathname)) {
      setIsLoading(false)
      return
    }
    refreshBusinessStatus()
    return () => { generation.current += 1 }
  }, [location.pathname, refreshBusinessStatus])

  const value = useMemo(
    () => ({
      businessStatus,
      isLoading,
      error,
      refreshBusinessStatus,
      isSystemLocked: businessStatus ? businessStatus.isLocked : null,
    }),
    [businessStatus, error, isLoading, refreshBusinessStatus]
  )

  return (
    <BusinessStatusContext.Provider value={value}>
      {children}
    </BusinessStatusContext.Provider>
  )
}

export default BusinessStatusContext
