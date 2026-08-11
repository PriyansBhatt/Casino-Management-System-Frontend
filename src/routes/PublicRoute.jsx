import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { getDefaultRouteForRole } from '../utils/accessControl'

const PublicRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return null
  }

  if (isAuthenticated) {
    return <Navigate to={getDefaultRouteForRole(user?.role)} replace />
  }

  return children
}

export default PublicRoute
