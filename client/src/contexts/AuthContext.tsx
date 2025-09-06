import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

interface User {
  id: number
  uid: string
  username: string
  email?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (user: User, token: string) => void
  logout: () => void
  isAuthenticated: boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Проверяем, есть ли сохраненный токен при загрузке приложения
    const savedToken = localStorage.getItem('authToken')
    const savedUser = localStorage.getItem('user')

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setUser(parsedUser)
        setToken(savedToken)
        
        // Устанавливаем токен в axios по умолчанию
        axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
        
        // Проверяем действительность токена
        validateToken(savedToken)
      } catch (error) {
        console.error('Error parsing saved user data:', error)
        logout()
      }
    }
    
    setLoading(false)
  }, [])

  const validateToken = async (authToken: string) => {
    try {
      await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      })
    } catch (error) {
      console.error('Token validation failed:', error)
      logout()
    }
  }

  const login = (userData: User, authToken: string) => {
    setUser(userData)
    setToken(authToken)
    
    // Сохраняем в localStorage
    localStorage.setItem('authToken', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
    
    // Устанавливаем токен в axios по умолчанию
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    
    // Удаляем из localStorage
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    
    // Удаляем токен из axios
    delete axios.defaults.headers.common['Authorization']
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user && !!token,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
