import { createContext, useState, useEffect } from 'react'
import authApi from '../api/authApi'
import tokenStorage from '../utils/tokenStorage'
import { safeLogAuditEvent } from '../services/auditService'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../constants/auditConstants'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const savedToken = tokenStorage.getToken()
        const savedUser = tokenStorage.getUser()

        if (savedToken && savedUser) {
          setToken(savedToken)
          setUser(savedUser)
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (credentials) => {
    setIsLoading(true)
    try {
      const response = await authApi.loginUser(credentials)

      const { token: newToken, user: userData } = response

      // Save to localStorage
      tokenStorage.setToken(newToken)
      tokenStorage.setUser(userData)

      // Update state
      setToken(newToken)
      setUser(userData)
      setIsAuthenticated(true)

      safeLogAuditEvent({
        module: AUDIT_MODULES.AUTH,
        action: AUDIT_ACTIONS.LOGIN,
        severity: AUDIT_SEVERITY.LOW,
        description: `${userData.fullName || userData.username} logged in.`,
        performedBy: userData.fullName || userData.username,
        performedByRole: userData.role,
        entityType: 'USER_SESSION',
        entityId: userData.id || userData.username,
        newValue: { username: userData.username, role: userData.role },
      })

      return { success: true, user: userData }
    } catch (error) {
      console.error('Login error:', error)
      setIsAuthenticated(false)
      setUser(null)
      setToken(null)
      return {
        success: false,
        error: error.message || 'Login failed',
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    const logoutUser = user
    try {
      // Try to call logout API
      await authApi.logoutUser()
    } catch (error) {
      console.error('Logout API error:', error)
      // Continue with local logout
    } finally {
      // Clear local state
      tokenStorage.clearAuthStorage()
      setToken(null)
      setUser(null)
      setIsAuthenticated(false)
      setIsLoading(false)
      if (logoutUser) {
        safeLogAuditEvent({
          module: AUDIT_MODULES.AUTH,
          action: AUDIT_ACTIONS.LOGOUT,
          severity: AUDIT_SEVERITY.LOW,
          description: `${logoutUser.fullName || logoutUser.username} logged out.`,
          performedBy: logoutUser.fullName || logoutUser.username,
          performedByRole: logoutUser.role,
          entityType: 'USER_SESSION',
          entityId: logoutUser.id || logoutUser.username,
          newValue: { username: logoutUser.username, role: logoutUser.role },
        })
      }
    }
  }

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
