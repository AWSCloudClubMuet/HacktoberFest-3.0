import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getUsers } from './api/client'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getUsers()
      setUsers(data)

      // Retain active selection if valid, or default to the first user
      setCurrentUser((prev) => {
        if (prev) {
          const stillExists = data.find((u) => u.id === prev.id)
          if (stillExists) return stillExists
        }
        return data[0] || null
      })
    } catch (err) {
      console.error('Failed to load demo users:', err)
      setError(err.message || 'Failed to connect to mock API')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const switchUser = (userId) => {
    const numericId = Number(userId)
    const selected = users.find((u) => u.id === numericId)
    if (selected) {
      setCurrentUser(selected)
    }
  }

  return (
    <UserContext.Provider
      value={{
        users,
        currentUser,
        loading,
        error,
        switchUser,
        refreshUsers: loadUsers,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
