import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  const { user, token, isLoading, isAuthenticated, login, logout } = context

  const hasRole = (role) => {
    return user?.role === role
  }

  const hasAnyRole = (roles) => {
    return roles.includes(user?.role)
  }

  return {
    user,
    token,
    loading: isLoading,
    isAuthenticated,
    login,
    logout,
    hasRole,
    hasAnyRole,
  }
}

export default useAuth
