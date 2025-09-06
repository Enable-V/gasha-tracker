import { useState } from 'react'
import axios from 'axios'

interface RegisterFormProps {
  onRegisterSuccess: (user: any, token: string) => void
  onSwitchToLogin: () => void
}

const RegisterForm = ({ onRegisterSuccess, onSwitchToLogin }: RegisterFormProps) => {
  const [formData, setFormData] = useState({
    uid: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
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

    // Валидация
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов')
      setLoading(false)
      return
    }

    try {
      const response = await axios.post('/api/auth/register', {
        uid: formData.uid,
        username: formData.username,
        email: formData.email || undefined,
        password: formData.password
      })
      
      const { user, token } = response.data
      
      // Сохраняем токен в localStorage
      localStorage.setItem('authToken', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      // Устанавливаем токен в axios по умолчанию
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      onRegisterSuccess(user, token)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">📝 Регистрация</h2>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            UID (HSR Player ID) *
          </label>
          <input
            type="text"
            name="uid"
            value={formData.uid}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-hsr-gold"
            placeholder="Ваш уникальный ID в игре"
          />
          <p className="text-gray-400 text-xs mt-1">
            Найдите ваш UID в настройках игры HSR
          </p>
        </div>
        
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Имя пользователя *
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-hsr-gold"
            placeholder="Введите имя пользователя"
          />
        </div>
        
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Email (опционально)
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-hsr-gold"
            placeholder="your@email.com"
          />
        </div>
        
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Пароль *
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-hsr-gold"
            placeholder="Минимум 6 символов"
          />
        </div>
        
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Подтвердите пароль *
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-hsr-gold"
            placeholder="Повторите пароль"
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
              Регистрация...
            </div>
          ) : (
            'Зарегистрироваться'
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-gray-400">
          Уже есть аккаунт?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-hsr-gold hover:underline"
          >
            Войти
          </button>
        </p>
      </div>
    </div>
  )
}

export default RegisterForm
