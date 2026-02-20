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

    // Р’Р°Р»РёРґР°С†РёСЏ
    if (formData.password !== formData.confirmPassword) {
      setError('РџР°СЂРѕР»Рё РЅРµ СЃРѕРІРїР°РґР°СЋС‚')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('РџР°СЂРѕР»СЊ РґРѕР»Р¶РµРЅ СЃРѕРґРµСЂР¶Р°С‚СЊ РјРёРЅРёРјСѓРј 6 СЃРёРјРІРѕР»РѕРІ')
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
      
      // РЎРѕС…СЂР°РЅСЏРµРј С‚РѕРєРµРЅ РІ localStorage
      localStorage.setItem('authToken', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      // РЈСЃС‚Р°РЅР°РІР»РёРІР°РµРј С‚РѕРєРµРЅ РІ axios РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      onRegisterSuccess(user, token)
    } catch (error: any) {
      setError(error.response?.data?.message || 'РћС€РёР±РєР° СЂРµРіРёСЃС‚СЂР°С†РёРё')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">Р РµРіРёСЃС‚СЂР°С†РёСЏ</h2>
      
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
            className="input-glass"
            placeholder="Р’Р°С€ СѓРЅРёРєР°Р»СЊРЅС‹Р№ ID РІ РёРіСЂРµ"
          />
          <p className="text-gray-400 text-xs mt-1">
            РќР°Р№РґРёС‚Рµ РІР°С€ UID РІ РЅР°СЃС‚СЂРѕР№РєР°С… РёРіСЂС‹ HSR
          </p>
        </div>
        
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            РРјСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ *
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className="input-glass"
            placeholder="Р’РІРµРґРёС‚Рµ РёРјСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ"
          />
        </div>
        
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Email (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ)
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="input-glass"
            placeholder="your@email.com"
          />
        </div>
        
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            РџР°СЂРѕР»СЊ *
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="input-glass"
            placeholder="РњРёРЅРёРјСѓРј 6 СЃРёРјРІРѕР»РѕРІ"
          />
        </div>
        
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            РџРѕРґС‚РІРµСЂРґРёС‚Рµ РїР°СЂРѕР»СЊ *
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="input-glass"
            placeholder="РџРѕРІС‚РѕСЂРёС‚Рµ РїР°СЂРѕР»СЊ"
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
              Р РµРіРёСЃС‚СЂР°С†РёСЏ...
            </div>
          ) : (
            'Р—Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊСЃСЏ'
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-gray-400">
          РЈР¶Рµ РµСЃС‚СЊ Р°РєРєР°СѓРЅС‚?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-accent-cyan hover:text-cyan-300 transition-colors"
          >
            Р’РѕР№С‚Рё
          </button>
        </p>
      </div>
    </div>
  )
}

export default RegisterForm
