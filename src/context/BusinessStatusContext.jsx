import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import businessStatusApi from '../api/businessStatusApi'

export const BusinessStatusContext = createContext(null)

export const BusinessStatusProvider = ({ children }) => {
  const [businessStatus, setBusinessStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const refreshBusinessStatus = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const status = await businessStatusApi.getBusinessStatus()
      setBusinessStatus(status)
      return status
    } catch (err) {
      const message = err.message || 'Failed to fetch business status'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshBusinessStatus()
  }, [refreshBusinessStatus])

  const value = useMemo(
    () => ({
      businessStatus,
      isLoading,
      error,
      refreshBusinessStatus,
      isSystemLocked: Boolean(businessStatus?.isLocked),
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
