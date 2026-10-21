import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { User } from '../types'
import { usersApi } from '../api/endpoints'

interface UserContextValue {
  currentUser: User | null
  currentUserId: number | null
  isFarmer: boolean
  isBuyer: boolean
  loading: boolean
  login: (id: number) => Promise<User | null>
  logout: () => void
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

const STORAGE_KEY = 'currentUserId'

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUserId, setCurrentUserId] = useState<number | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = parseInt(saved, 10)
      return isNaN(parsed) ? null : parsed
    }
    return null
  })

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const loadUser = useCallback(async (id: number) => {
    setLoading(true)
    try {
      const user = await usersApi.get(id)
      setCurrentUser(user)
      return user
    } catch (err) {
      console.warn(`User ${id} not found on backend. Clearing invalid session.`, err)
      localStorage.removeItem(STORAGE_KEY)
      setCurrentUserId(null)
      setCurrentUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (currentUserId) {
      loadUser(currentUserId)
    } else {
      setCurrentUser(null)
      setLoading(false)
    }
  }, [currentUserId, loadUser])

  const login = useCallback(
    async (id: number) => {
      localStorage.setItem(STORAGE_KEY, String(id))
      setCurrentUserId(id)
      return await loadUser(id)
    },
    [loadUser],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setCurrentUserId(null)
    setCurrentUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    if (currentUserId) {
      await loadUser(currentUserId)
    }
  }, [currentUserId, loadUser])

  const isFarmer = currentUser?.role === 'Farmer'
  const isBuyer = currentUser?.role === 'Buyer'

  return (
    <UserContext.Provider
      value={{
        currentUser,
        currentUserId,
        isFarmer,
        isBuyer,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useCurrentUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useCurrentUser must be used within a UserProvider')
  }
  return context
}

export const useUser = useCurrentUser

