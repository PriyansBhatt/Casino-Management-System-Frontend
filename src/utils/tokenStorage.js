const TOKEN_KEY = 'auth_token'
const USER_KEY = 'user_data'

export const tokenStorage = {
  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch (error) {
      console.error('Error getting token:', error)
      return null
    }
  },

  setToken: (token) => {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token)
      }
    } catch (error) {
      console.error('Error setting token:', error)
    }
  },

  removeToken: () => {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch (error) {
      console.error('Error removing token:', error)
    }
  },

  getUser: () => {
    try {
      const user = localStorage.getItem(USER_KEY)
      return user ? JSON.parse(user) : null
    } catch (error) {
      console.error('Error getting user:', error)
      tokenStorage.clearAuthStorage()
      return null
    }
  },

  setUser: (user) => {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user))
      }
    } catch (error) {
      console.error('Error setting user:', error)
    }
  },

  removeUser: () => {
    try {
      localStorage.removeItem(USER_KEY)
    } catch (error) {
      console.error('Error removing user:', error)
    }
  },

  clearAuthStorage: () => {
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    } catch (error) {
      console.error('Error clearing auth storage:', error)
    }
  },
}

export default tokenStorage
