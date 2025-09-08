import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

type GameType = 'HSR' | 'GENSHIN'

const Upload = () => {
  const { user, isAuthenticated } = useAuth()
  const [selectedGame, setSelectedGame] = useState<GameType>('HSR')
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
      setError(`Пожалуйста, введите ${selectedGame === 'HSR' ? 'HSR' : 'Genshin Impact'} URL`)
      return
    }
    
    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      if (selectedMethod === 'url') {
        const endpoint = selectedGame === 'HSR' 
          ? `/api/upload/url/${uid}` 
          : `/api/genshin/import/${uid}`
        
        const payload = selectedGame === 'HSR' 
          ? { url } 
          : { gachaUrl: url }
        
        const response = await axios.post(endpoint, payload)
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
        <p className="text-gray-400">Импортируйте историю ваших круток из HSR или Genshin Impact для анализа</p>
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
            <h3 className="text-green-300 font-bold mb-2">
              ✅ Загрузка {selectedGame === 'HSR' ? 'HSR' : 'Genshin Impact'} данных завершена!
            </h3>
            <div className="text-gray-300 text-sm space-y-1">
              {result.stats ? (
                <>
                  <p>• Импортировано: <span className="text-green-400">{result.stats.totalImported || 0}</span> круток</p>
                  <p>• Пропущено: <span className="text-yellow-400">{result.stats.totalSkipped || 0}</span> (уже существуют)</p>
                  {result.stats.bannerStats && (
                    <div className="mt-2">
                      <p className="text-blue-300 font-medium">По баннерам:</p>
                      {Object.entries(result.stats.bannerStats).map(([banner, count]: [string, any]) => (
                        <p key={banner} className="ml-4 text-xs">• {banner}: <span className="text-blue-400">{count}</span></p>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p>• Импортировано: <span className="text-green-400">{result.imported || 0}</span> круток</p>
                  <p>• Пропущено: <span className="text-yellow-400">{result.skipped || 0}</span> (уже существуют)</p>
                  <p>• Всего записей: <span className="text-blue-400">{result.total || 0}</span></p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <div className="card">
          {/* Game Selection */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-3">Выберите игру:</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedGame('HSR')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedGame === 'HSR'
                    ? 'border-hsr-gold bg-hsr-gold/20 text-white'
                    : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/40'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">⭐</div>
                  <div className="font-semibold">Honkai Star Rail</div>
                  <div className="text-sm opacity-75 mt-1">HSR</div>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedGame('GENSHIN')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedGame === 'GENSHIN'
                    ? 'border-blue-500 bg-blue-500/20 text-white'
                    : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/40'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">🌟</div>
                  <div className="font-semibold">Genshin Impact</div>
                  <div className="text-sm opacity-75 mt-1">原神</div>
                </div>
              </button>
            </div>
          </div>

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
              <label className="block text-white font-semibold mb-2">
                URL истории круток ({selectedGame === 'HSR' ? 'Honkai Star Rail' : 'Genshin Impact'}):
              </label>
              <textarea
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={`Вставьте URL ${selectedGame === 'HSR' ? 'HSR' : 'Genshin Impact'}, полученный через PowerShell команду`}
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-hsr-gold resize-none"
              />
              <p className="text-gray-400 text-sm mt-2">
                Используйте PowerShell команду ниже для получения URL
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
          <h3 className="text-lg font-semibold text-white mb-4">
            Инструкция по получению ссылки ({selectedGame === 'HSR' ? 'Honkai Star Rail' : 'Genshin Impact'})
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-300 mb-6">
            <li>Откройте игру {selectedGame === 'HSR' ? 'Honkai Star Rail' : 'Genshin Impact'} и зайдите в историю круток</li>
            <li>Закройте игру полностью</li>
            <li>Откройте PowerShell от имени администратора</li>
            <li>Выполните команду ниже</li>
            <li>Скопируйте полученную ссылку в поле выше</li>
            <li>Нажмите "Загрузить данные" (UID определяется автоматически)</li>
          </ol>
          
          {/* PowerShell Command */}
          <div className="mb-4">
            <h4 className="text-md font-semibold text-white mb-2">PowerShell команда:</h4>
            <div className="bg-black/60 rounded-lg p-4 font-mono text-sm overflow-x-auto border border-hsr-gold/30">
              <code className="text-green-400">
                {selectedGame === 'HSR' 
                  ? `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex "&{$((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Enable-V/honkai/main/hsr_getlink.ps1'))}"` 
                  : `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex "&{$((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Enable-V/honkai/main/scripts/get-genshin-url.ps1'))}"`
                }
              </code>
            </div>
            <div className="flex items-center mt-2 space-x-2">
              <button
                onClick={() => {
                  const command = selectedGame === 'HSR' 
                    ? `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex "&{$((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Enable-V/honkai/main/hsr_getlink.ps1'))}"` 
                    : `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex "&{$((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Enable-V/honkai/main/scripts/get-genshin-url.ps1'))}"`;
                  navigator.clipboard.writeText(command);
                }}
                className="text-sm bg-hsr-gold/20 hover:bg-hsr-gold/30 text-hsr-gold px-3 py-1 rounded transition-colors"
              >
                📋 Копировать команду
              </button>
              <span className="text-gray-400 text-xs">Команда скопируется в буфер обмена</span>
            </div>
          </div>

          {/* Game-specific tips */}
          {selectedGame === 'GENSHIN' && (
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mt-4">
              <h4 className="text-blue-300 font-semibold mb-2">💡 Советы для Genshin Impact:</h4>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• Убедитесь, что вы открывали историю желаний в игре</li>
                <li>• Скрипт ищет кэш в папке webCaches</li>
                <li>• Если не работает, попробуйте запустить PowerShell от администратора</li>
                <li>• Для китайского клиента добавьте параметр: china</li>
              </ul>
            </div>
          )}

          {selectedGame === 'HSR' && (
            <div className="bg-hsr-gold/20 border border-hsr-gold/30 rounded-lg p-4 mt-4">
              <h4 className="text-hsr-gold font-semibold mb-2">💡 Советы для Honkai Star Rail:</h4>
              <ul className="text-yellow-200 text-sm space-y-1">
                <li>• Откройте историю варпов в игре перед выполнением скрипта</li>
                <li>• Убедитесь, что игра полностью закрыта</li>
                <li>• Скрипт автоматически определит последнюю ссылку</li>
                <li>• URL содержит ваши данные авторизации - не делитесь им</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Upload
