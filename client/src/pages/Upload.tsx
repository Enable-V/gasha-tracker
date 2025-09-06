import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const Upload = () => {
  const { user, isAuthenticated } = useAuth()
  const [selectedMethod, setSelectedMethod] = useState<'url' | 'file'>('url')
  const [isLoading, setIsLoading] = useState(false)
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  // Автоматически используем UID аутентифицированного пользователя
  const uid = user?.uid || ''

  const handleUpload = async () => {
    if (!isAuthenticated) {
      setError('Пожалуйста, войдите в систему для загрузки данных')
      return
    }

    if (!url && selectedMethod === 'url') {
      setError('Пожалуйста, введите HSR URL')
      return
    }
    
    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      if (selectedMethod === 'url') {
        const response = await axios.post(`/api/upload/url/${uid}`, { url })
        setResult(response.data)
        setUrl('') // Очищаем URL после успешной загрузки
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      setError(error.response?.data?.message || error.response?.data?.error || 'Ошибка загрузки данных')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">🔐 Требуется авторизация</h1>
          <p className="text-gray-400 mb-6">Для загрузки данных круток необходимо войти в систему</p>
          <div className="text-6xl mb-4">🚪</div>
          <p className="text-lg text-gray-300">Нажмите кнопку "Войти" в правом верхнем углу</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">📤 Загрузка данных круток</h1>
        <p className="text-gray-400">Импортируйте историю ваших круток для анализа</p>
        <div className="mt-4 p-3 bg-hsr-gold/20 border border-hsr-gold/30 rounded-lg inline-block">
          <p className="text-hsr-gold text-sm">
            👤 Загружаем данные для пользователя: <span className="font-bold">{user?.username}</span> (UID: {uid})
          </p>
        </div>
      </div>

      {error && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
            <h3 className="text-green-300 font-bold mb-2">✅ Загрузка завершена!</h3>
            <div className="text-gray-300 text-sm space-y-1">
              <p>• Импортировано: <span className="text-green-400">{result.imported}</span> круток</p>
              <p>• Пропущено: <span className="text-yellow-400">{result.skipped}</span> (уже существуют)</p>
              <p>• Всего записей: <span className="text-blue-400">{result.total}</span></p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <div className="card">
          {/* Method Selection */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-3">Метод загрузки:</label>
            <div className="flex space-x-4">
              <button
                onClick={() => setSelectedMethod('url')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedMethod === 'url'
                    ? 'bg-hsr-gold text-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Через URL
              </button>
              <button
                onClick={() => setSelectedMethod('file')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedMethod === 'file'
                    ? 'bg-hsr-gold text-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Файл JSON
              </button>
            </div>
          </div>

          {/* URL Method */}
          {selectedMethod === 'url' && (
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">URL истории круток:</label>
              <textarea
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Вставьте URL, полученный через PowerShell команду"
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-hsr-gold resize-none"
              />
              <p className="text-gray-400 text-sm mt-2">
                Используйте PowerShell команду с главной страницы для получения URL
              </p>
            </div>
          )}

          {/* File Method */}
          {selectedMethod === 'file' && (
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">JSON файл:</label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-hsr-gold/50 transition-colors">
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-4xl mb-4">📁</div>
                  <p className="text-white mb-2">Перетащите JSON файл сюда или нажмите для выбора</p>
                  <p className="text-gray-400 text-sm">Поддерживаются файлы .json</p>
                </label>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={isLoading || (!url && selectedMethod === 'url')}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="loading-spinner mr-2"></div>
                Загрузка...
              </>
            ) : (
              'Загрузить данные'
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="card mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Инструкция по получению ссылки</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Закройте игру Honkai Star Rail</li>
            <li>Откройте PowerShell от имени администратора</li>
            <li>Выполните команду с главной страницы</li>
            <li>Скопируйте полученную ссылку в поле выше</li>
            <li>Нажмите "Загрузить данные" (UID определяется автоматически)</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default Upload
