import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
const ProtectedRoute = ({ children }) => {
  const location = useLocation()
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

export default ProtectedRoute
