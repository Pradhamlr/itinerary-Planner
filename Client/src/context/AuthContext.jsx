import { useMemo, useState } from 'react'
import { AuthContext } from './authContextObject'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  const login = (payload) => {
    const authToken = payload?.token
    const authUser = {
      userId: payload?.userId,
      name: payload?.name,
      email: payload?.email,
    }

    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(authUser))
    setToken(authToken)
    setUser(authUser)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
