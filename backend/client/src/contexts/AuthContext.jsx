import React, { createContext, useContext, useState, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('hapvida_user')
      return u ? JSON.parse(u) : null
    } catch {
      return null
    }
  })

  const persistSession = useCallback((token, userData) => {
    localStorage.setItem('hapvida_token', token)
    localStorage.setItem('hapvida_user', JSON.stringify(userData))
    setUser(userData)
  }, [])

  const login = useCallback(async (email, password) => {
    const { token, user: userData } = await api.login(email, password)
    persistSession(token, userData)
    return userData
  }, [persistSession])

  const register = useCallback(async (name, email, password) => {
    const { token, user: userData } = await api.register(name, email, password)
    persistSession(token, userData)
    return userData
  }, [persistSession])

  const logout = useCallback(() => {
    localStorage.removeItem('hapvida_token')
    localStorage.removeItem('hapvida_user')
    setUser(null)
  }, [])

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    await api.changePassword(currentPassword, newPassword)
    setUser(prev => {
      const updated = { ...prev, mustChangePassword: false }
      localStorage.setItem('hapvida_user', JSON.stringify(updated))
      return updated
    })
  }, [])

  const updateProfile = useCallback(async (name) => {
    const { token, user: userData } = await api.updateProfile(name)
    persistSession(token, userData)
    return userData
  }, [persistSession])

  return (
    <AuthContext.Provider value={{ user, login, register, logout, changePassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
