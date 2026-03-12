import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('access_token')
    const savedUser = localStorage.getItem('user_profile')
    if (token && savedUser) {
      api.setToken(token)
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('user_profile')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const result = await api.login({ email, password })
    api.setToken(result.access_token)
    setUser(result.user)
    localStorage.setItem('user_profile', JSON.stringify(result.user))
    return result
  }

  const register = async (email, password, username, displayName) => {
    await api.register({ email, password, username, display_name: displayName })
    // Auto-login after register
    return login(email, password)
  }

  const setRole = async (role) => {
    await api.setRole(role)
    const updatedUser = { ...user, role }
    setUser(updatedUser)
    localStorage.setItem('user_profile', JSON.stringify(updatedUser))
  }

  const refreshProfile = async () => {
    try {
      const profile = await api.getMe()
      setUser(profile)
      localStorage.setItem('user_profile', JSON.stringify(profile))
      return profile
    } catch {
      return user
    }
  }

  const logout = () => {
    api.setToken(null)
    setUser(null)
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_profile')
  }

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, setRole, refreshProfile, logout,
      isParent: user?.role === 'parent',
      isChild: user?.role === 'child',
      hasFamily: !!user?.family_id,
      hasRole: !!user?.role,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
