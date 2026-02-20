import { useState } from 'react'
import axios from 'axios'

interface LoginFormProps {
  onLoginSuccess: (user: any, token: string) => void
  onSwitchToRegister: () => void
}

const LoginForm = ({ onLoginSuccess, onSwitchToRegister }: LoginFormProps) => {
  const [formData, setFormData] = useState({
    uid: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post('/api/auth/login', formData)
      const { user, token } = response.data
      
      // Сохраняем токен в localStorage
      localStorage.setItem('authToken', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      // Устанавливаем токен в axios по умолчанию
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      onLoginSuccess(user, token)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Ошибка входа в систему')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">Вход в систему</h2>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            UID (HSR Player ID)
          </label>
          <input
            type="text"
            name="uid"
            value={formData.uid}
            onChange={handleChange}
            required
            className="input-glass"
            placeholder="Введите ваш UID"
          />
        </div>
        
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Пароль
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="input-glass"
            placeholder="Введите пароль"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
              Вход...
            </div>
          ) : (
            'Войти'
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-gray-400">
          Нет аккаунта?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-accent-cyan hover:text-cyan-300 transition-colors"
          >
            Зарегистрироваться
          </button>
        </p>
      </div>
    </div>
  )
}

export default LoginForm
