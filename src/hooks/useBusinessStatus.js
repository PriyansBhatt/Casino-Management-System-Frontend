import { useContext } from 'react'
import { BusinessStatusContext } from '../context/BusinessStatusContext'

export const useBusinessStatus = () => {
  const context = useContext(BusinessStatusContext)

  if (!context) {
    throw new Error('useBusinessStatus must be used within BusinessStatusProvider')
  }

  return context
}

export default useBusinessStatus
