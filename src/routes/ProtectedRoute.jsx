import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { canAccessRoute, getDefaultRouteForRole } from '../utils/accessControl'

const ProtectedRoute = ({ children }) => {
  const location = useLocation()
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!canAccessRoute(user, location.pathname)) {
    if (location.pathname === '/dashboard') {
      return <Navigate to={getDefaultRouteForRole(user?.role)} replace />
    }

    return <Navigate to="/unauthorized" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
