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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  // Новые состояния для прогресса
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [progressStats, setProgressStats] = useState({
    imported: 0,
    skipped: 0,
    errors: 0,
    total: 0,
    currentItem: ''
  })

  // Автоматически используем UID аутентифицированного пользователя
  const uid = user?.uid || ''

  const handleUpload = async () => {
    if (!isAuthenticated) {
      setError('Пожалуйста, войдите в систему для загрузки данных')
      return
    }

    if (selectedMethod === 'url' && !url) {
      setError(`Пожалуйста, введите ${selectedGame === 'HSR' ? 'HSR' : 'Genshin Impact'} URL`)
      return
    }

    if (selectedMethod === 'file' && !selectedFile) {
      setError('Пожалуйста, выберите JSON файл')
      return
    }

    setIsLoading(true)
    setIsUploading(true)
    setError('')
    setResult(null)
    setProgress(0)
    setCurrentStep('Отправка файла на сервер...')

    try {
      if (selectedMethod === 'url') {
        const endpoint = selectedGame === 'HSR'
          ? `/api/upload/url`
          : `/api/genshin/import`

        const payload = selectedGame === 'HSR'
          ? { url }
          : { gachaUrl: url }

        const response = await axios.post(endpoint, payload)

        const uploadId = response.data.uploadId;

        if (uploadId) {
          // Начинаем отслеживать прогресс
          const progressInterval = setInterval(async () => {
            try {
              const progressEndpoint = selectedGame === 'HSR'
                ? `/api/upload/progress/${uploadId}`
                : `/api/genshin/progress/${uploadId}`

              const progressResponse = await axios.get(progressEndpoint)
              const progressData = progressResponse.data

              setProgress(progressData.progress)
              setCurrentStep(progressData.message)
              setProgressStats({
                imported: progressData.imported || 0,
                skipped: progressData.skipped || 0,
                errors: progressData.errors || 0,
                total: progressData.total || 0,
                currentItem: progressData.currentItem || ''
              })

              if (progressData.completed) {
                clearInterval(progressInterval)
                
                // Устанавливаем результат импорта для URL метода
                setResult({
                  message: `${selectedGame} импорт завершен`,
                  imported: progressData.imported || 0,
                  skipped: progressData.skipped || 0,
                  errors: progressData.errors || 0,
                  total: progressData.total || 0
                })
                
                setTimeout(() => {
                  setIsUploading(false)
                  setProgress(0)
                  setCurrentStep('')
                  setProgressStats({
                    imported: 0,
                    skipped: 0,
                    errors: 0,
                    total: 0,
                    currentItem: ''
                  })
                }, 2000)
              }
            } catch (error) {
              console.error('Error getting progress:', error)
            }
          }, 200) // Уменьшаем интервал до 200мс для более плавного обновления

          // Останавливаем отслеживание через 5 минут
          setTimeout(() => {
            clearInterval(progressInterval)
          }, 300000)
        } else {
          setProgress(100)
          setCurrentStep('Загрузка завершена!')
        }

        // Убираем немедленную установку результата для асинхронных операций
        // setResult(response.data)
        setUrl('') // Очищаем URL после успешной загрузки
      } else if (selectedMethod === 'file') {
        const formData = new FormData()
        formData.append('gachaFile', selectedFile!)

        const endpoint = selectedGame === 'HSR'
          ? `/api/upload/json`
          : `/api/genshin/import/json`

        const response = await axios.post(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        const uploadId = response.data.uploadId;

        if (uploadId) {
          // Начинаем отслеживать прогресс
          const progressInterval = setInterval(async () => {
            try {
              const progressEndpoint = selectedGame === 'HSR'
                ? `/api/upload/progress/${uploadId}`
                : `/api/genshin/progress/${uploadId}`

              const progressResponse = await axios.get(progressEndpoint)
              const progressData = progressResponse.data

              setProgress(progressData.progress)
              setCurrentStep(progressData.message)
              setProgressStats({
                imported: progressData.imported || 0,
                skipped: progressData.skipped || 0,
                errors: progressData.errors || 0,
                total: progressData.total || 0,
                currentItem: progressData.currentItem || ''
              })

              if (progressData.completed) {
                clearInterval(progressInterval)
                
                // Устанавливаем результат импорта для файлового метода
                setResult({
                  message: `${selectedGame} импорт завершен`,
                  imported: progressData.imported || 0,
                  skipped: progressData.skipped || 0,
                  errors: progressData.errors || 0,
                  total: progressData.total || 0
                })
                
                setTimeout(() => {
                  setIsUploading(false)
                  setProgress(0)
                  setCurrentStep('')
                  setProgressStats({
                    imported: 0,
                    skipped: 0,
                    errors: 0,
                    total: 0,
                    currentItem: ''
                  })
                }, 2000)
              }
            } catch (error) {
              console.error('Error getting progress:', error)
            }
          }, 200) // Уменьшаем интервал до 200мс для более плавного обновления

          // Останавливаем отслеживание через 5 минут
          setTimeout(() => {
            clearInterval(progressInterval)
          }, 300000)
        } else {
          setProgress(100)
          setCurrentStep('Файл успешно обработан!')
        }

        // Убираем немедленную установку результата для асинхронных операций
        // setResult(response.data)
        setSelectedFile(null) // Очищаем файл после успешной загрузки
      }

    } catch (error: any) {
      console.error('Upload error:', error)
      setError(error.response?.data?.message || error.response?.data?.error || 'Ошибка загрузки данных')
      setIsUploading(false)
      setProgress(0)
      setCurrentStep('')
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
              <label className="block text-white font-semibold mb-2">
                JSON файл ({selectedGame === 'HSR' ? 'pom-moe' : 'paimon-moe'} формат):
              </label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-hsr-gold/50 transition-colors">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-4xl mb-4">📁</div>
                  <p className="text-white mb-2">
                    {selectedFile ? `Выбран файл: ${selectedFile.name}` : 'Перетащите JSON файл сюда или нажмите для выбора'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {selectedFile ? `Размер: ${(selectedFile.size / 1024).toFixed(1)} KB` : `Поддерживаются JSON файлы из ${selectedGame === 'HSR' ? 'pom-moe' : 'paimon-moe'}`}
                  </p>
                </label>
              </div>
              
              {/* Instructions for JSON files */}
              <div className={`mt-4 p-4 rounded-lg border ${
                selectedGame === 'HSR' 
                  ? 'bg-hsr-gold/20 border-hsr-gold/30' 
                  : 'bg-blue-500/20 border-blue-500/30'
              }`}>
                <h4 className={`text-lg font-semibold mb-2 ${
                  selectedGame === 'HSR' ? 'text-hsr-gold' : 'text-blue-300'
                }`}>
                  📋 Как получить JSON файл для {selectedGame === 'HSR' ? 'Honkai Star Rail' : 'Genshin Impact'}:
                </h4>
                <ol className={`text-sm space-y-1 ${
                  selectedGame === 'HSR' ? 'text-yellow-200' : 'text-blue-200'
                }`}>
                  <li>1. Установите расширение {selectedGame === 'HSR' ? 'pom-moe' : 'paimon-moe'} для браузера</li>
                  <li>2. Откройте игру и зайдите в историю круток</li>
                  <li>3. Используйте расширение для экспорта данных в JSON</li>
                  <li>4. Сохраните файл и загрузите его здесь</li>
                  <li>5. Нажмите "Загрузить данные"</li>
                </ol>
                <p className={`text-xs mt-2 ${
                  selectedGame === 'HSR' ? 'text-yellow-300' : 'text-blue-300'
                }`}>
                  💡 UID определяется автоматически из вашей учетной записи
                </p>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={isLoading || (selectedMethod === 'url' && !url) || (selectedMethod === 'file' && !selectedFile)}
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

          {/* Progress Component */}
          {isUploading && (
            <div className="mt-6 p-6 bg-gradient-to-r from-hsr-gold/10 to-blue-500/10 border border-hsr-gold/20 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`text-3xl ${selectedGame === 'HSR' ? 'animate-pulse text-hsr-gold' : 'animate-pulse text-blue-400'}`}>
                    {selectedGame === 'HSR' ? '⭐' : '🌟'}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      {selectedGame === 'HSR' ? 'Honkai Star Rail' : 'Genshin Impact'}
                    </h3>
                    <p className="text-gray-300 text-sm">{currentStep}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${selectedGame === 'HSR' ? 'text-hsr-gold' : 'text-blue-400'}`}>
                    {progress}%
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative mb-4">
                <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ease-out ${
                      selectedGame === 'HSR'
                        ? 'bg-gradient-to-r from-hsr-gold to-yellow-400'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Detailed Progress Stats */}
              {progressStats.total > 0 && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className={`text-lg font-bold ${selectedGame === 'HSR' ? 'text-green-400' : 'text-green-300'}`}>
                      {progressStats.imported}
                    </div>
                    <div className="text-gray-400 text-xs">Импортировано</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${selectedGame === 'HSR' ? 'text-yellow-400' : 'text-yellow-300'}`}>
                      {progressStats.skipped}
                    </div>
                    <div className="text-gray-400 text-xs">Пропущено</div>
                  </div>
                  {progressStats.errors > 0 && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-400">
                        {progressStats.errors}
                      </div>
                      <div className="text-gray-400 text-xs">Ошибок</div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className={`text-lg font-bold ${selectedGame === 'HSR' ? 'text-hsr-gold' : 'text-blue-400'}`}>
                      {progressStats.total}
                    </div>
                    <div className="text-gray-400 text-xs">Всего</div>
                  </div>
                </div>
              )}

              {/* Current Item */}
              {progressStats.currentItem && (
                <div className="mb-4 p-3 bg-white/5 rounded-lg">
                  <div className="text-gray-300 text-sm">
                    <span className="font-medium">Текущий элемент:</span> {progressStats.currentItem}
                  </div>
                </div>
              )}

              {/* Status Message */}
              <div className="text-center">
                <p className={`text-sm ${selectedGame === 'HSR' ? 'text-hsr-gold' : 'text-blue-300'}`}>
                  {progress === 100 ? '✅ Загрузка завершена!' : '⏳ Обработка данных...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="card mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Инструкция по загрузке данных ({selectedGame === 'HSR' ? 'Honkai Star Rail' : 'Genshin Impact'})
          </h3>
          
          {/* URL Method Instructions */}
          {selectedMethod === 'url' && (
            <div className="mb-6">
              <h4 className="text-md font-semibold text-white mb-2">Через URL (рекомендуется):</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-300 mb-4">
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
                      ? `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex "&{$((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Enable-V/gasha-tracker/main/scripts/hsr_getlink.ps1'))}"` 
                      : `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex "&{$((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Enable-V/gasha-tracker/main/scripts/get-genshin-url.ps1'))}"`
                    }
                  </code>
                </div>
                <div className="flex items-center mt-2 space-x-2">
                  <button
                    onClick={() => {
                      const command = selectedGame === 'HSR' 
                        ? `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex "&{$((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Enable-V/gasha-tracker/main/scripts/hsr_getlink.ps1'))}"` 
                        : `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex "&{$((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Enable-V/gasha-tracker/main/scripts/get-genshin-url.ps1'))}"`;
                      navigator.clipboard.writeText(command);
                    }}
                    className="text-sm bg-hsr-gold/20 hover:bg-hsr-gold/30 text-hsr-gold px-3 py-1 rounded transition-colors"
                  >
                    📋 Копировать команду
                  </button>
                  <span className="text-gray-400 text-xs">Команда скопируется в буфер обмена</span>
                </div>
              </div>
            </div>
          )}

          {/* JSON Method Instructions */}
          {selectedMethod === 'file' && (
            <div className="mb-6">
              <h4 className="text-md font-semibold text-white mb-2">Через JSON файл (альтернативный способ):</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-300 mb-4">
                <li>Установите расширение {selectedGame === 'HSR' ? 'pom-moe' : 'paimon-moe'} для браузера</li>
                <li>Откройте игру и зайдите в историю круток</li>
                <li>Используйте расширение для экспорта данных в JSON формат</li>
                <li>Сохраните JSON файл на вашем устройстве</li>
                <li>Выберите файл выше и нажмите "Загрузить данные"</li>
              </ol>
              
              <div className={`p-4 rounded-lg border ${
                selectedGame === 'HSR' 
                  ? 'bg-hsr-gold/20 border-hsr-gold/30' 
                  : 'bg-blue-500/20 border-blue-500/30'
              }`}>
                <h4 className={`font-semibold mb-2 ${
                  selectedGame === 'HSR' ? 'text-hsr-gold' : 'text-blue-300'
                }`}>
                  🔗 Ссылки на расширения:
                </h4>
                <div className="space-y-1 text-sm">
                  {selectedGame === 'HSR' ? (
                    <a 
                      href="https://chromewebstore.google.com/detail/pom-moe-honkai-star-rail-w/cgdkodmlhlpenicfgkmpgkegljpnkgdo" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-yellow-300 hover:text-yellow-200 underline"
                    >
                      pom-moe для Honkai Star Rail (Chrome Web Store)
                    </a>
                  ) : (
                    <a 
                      href="https://chromewebstore.google.com/detail/paimon-moe-genshin-impact/fgmekcjiknkhpkhhljonlbmnpkdgjpkd" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-300 hover:text-blue-200 underline"
                    >
                      paimon-moe для Genshin Impact (Chrome Web Store)
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

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
