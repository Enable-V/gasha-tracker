import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

type GameType = 'HSR' | 'GENSHIN'

const Upload = () => {
  const { user, isAuthenticated } = useAuth()
  const [searchParams] = useSearchParams()
  const initialGame = searchParams.get('game')?.toUpperCase() === 'GENSHIN' ? 'GENSHIN' : 'HSR'
  const [selectedGame, setSelectedGame] = useState<GameType>(initialGame)
  const [selectedMethod, setSelectedMethod] = useState<'url' | 'file'>('url')
  const [isLoading, setIsLoading] = useState(false)
  const [url, setUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [copyToast, setCopyToast] = useState(false)

  const showCopyToast = () => {
    setCopyToast(true)
    setTimeout(() => setCopyToast(false), 2000)
  }

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
          <h1 className="text-3xl font-bold text-white mb-4">Требуется авторизация</h1>
          <p className="text-gray-400 mb-6">Для загрузки данных круток необходимо войти в систему</p>
          <div className="flex justify-center mb-4">
            <svg className="w-16 h-16 text-accent-cyan/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
          </div>
          <p className="text-lg text-gray-300">Нажмите кнопку «Войти» в правом верхнем углу</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gradient-gold mb-4">Загрузка данных круток</h1>
        <p className="text-gray-400">Импортируйте историю ваших круток из HSR или Genshin Impact для анализа</p>
        <div className="mt-4 p-3 bg-accent-cyan/10 border border-accent-cyan/20 rounded-lg inline-block">
          <p className="text-accent-cyan text-sm">
            Загружаем данные для: <span className="font-bold text-white">{user?.username}</span> <span className="text-gray-500">UID: {uid}</span>
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
          <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-lg p-4">
            <h3 className="text-cyan-300 font-bold mb-2">
              Загрузка {selectedGame === 'HSR' ? 'HSR' : 'Genshin Impact'} данных завершена!
            </h3>
            <div className="text-gray-300 text-sm space-y-1">
              {result.stats ? (
                <>
                  <p>• Импортировано: <span className="text-cyan-400">{result.stats.totalImported || 0}</span> круток</p>
                  <p>• Пропущено: <span className="text-cyan-400">{result.stats.totalSkipped || 0}</span> (уже существуют)</p>
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
                  <p>• Импортировано: <span className="text-cyan-400">{result.imported || 0}</span> круток</p>
                  <p>• Пропущено: <span className="text-cyan-400">{result.skipped || 0}</span> (уже существуют)</p>
                  <p>• Всего записей: <span className="text-blue-400">{result.total || 0}</span></p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 md:px-0">
        <div className="card">
          {/* Game Selection */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-3">Выберите игру:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedGame('HSR')}
                className={`p-4 rounded-xl border transition-all duration-200 group ${
                  selectedGame === 'HSR'
                    ? 'border-star-purple/40 bg-star-purple/10 text-white'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/8'
                }`}
              >
                <div className="text-center">
                  <img src="/images/static/games/hsr_icon.svg" alt="HSR" className="w-10 h-10 mx-auto mb-2 group-hover:scale-110 transition-transform duration-300" />
                  <div className="font-semibold">Honkai Star Rail</div>
                  <div className="text-xs text-gray-500 mt-1">HSR</div>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedGame('GENSHIN')}
                className={`p-4 rounded-xl border transition-all duration-200 group ${
                  selectedGame === 'GENSHIN'
                    ? 'border-star-blue/40 bg-star-blue/10 text-white'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/8'
                }`}
              >
                <div className="text-center">
                  <img src="/images/static/games/genshin_icon.svg" alt="Genshin" className="w-10 h-10 mx-auto mb-2 group-hover:scale-110 transition-transform duration-300" />
                  <div className="font-semibold">Genshin Impact</div>
                  <div className="text-xs text-gray-500 mt-1">原神</div>
                </div>
              </button>
            </div>
          </div>

          {/* Method Selection */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-3">Метод загрузки:</label>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => setSelectedMethod('url')}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 border ${
                  selectedMethod === 'url'
                    ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/8 hover:text-white'
                }`}
              >
                Через URL
              </button>
              <button
                onClick={() => setSelectedMethod('file')}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 border ${
                  selectedMethod === 'file'
                    ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/8 hover:text-white'
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
                className="input-glass resize-none"
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
              <div className="border-2 border-dashed border-white/10 rounded-xl p-4 md:p-8 text-center hover:border-accent-cyan/30 transition-all duration-300">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex justify-center mb-4">
                    <svg className="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                  </div>
                  <p className="text-white mb-2 text-sm md:text-base">
                    {selectedFile ? `Выбран файл: ${selectedFile.name}` : 'Перетащите JSON файл сюда или нажмите для выбора'}
                  </p>
                  <p className="text-gray-400 text-xs md:text-sm">
                    {selectedFile ? `Размер: ${(selectedFile.size / 1024).toFixed(1)} KB` : `Поддерживаются JSON файлы из ${selectedGame === 'HSR' ? 'pom-moe' : 'paimon-moe'}`}
                  </p>
                </label>
              </div>
              
              {/* Instructions for JSON files */}
              <div className="mt-4 p-4 rounded-xl" style={{
                background: selectedGame === 'HSR' ? 'rgba(168,85,247,0.06)' : 'rgba(34,211,238,0.06)',
                border: `1px solid ${selectedGame === 'HSR' ? 'rgba(168,85,247,0.12)' : 'rgba(34,211,238,0.12)'}`
              }}>
                <h4 className="text-lg font-semibold mb-3" style={{ color: selectedGame === 'HSR' ? '#c084fc' : '#67e8f9' }}>
                  Как получить JSON файл для {selectedGame === 'HSR' ? 'Honkai Star Rail' : 'Genshin Impact'}:
                </h4>
                {selectedGame === 'HSR' ? (
                  <ol className="text-sm space-y-1.5 text-gray-300">
                    <li>1. Перейдите на сайт <a href="https://pom.moe/" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-2" style={{ color: '#c084fc' }}>pom.moe</a></li>
                    <li>2. Войдите в свой аккаунт</li>
                    <li>3. Откройте <span className="text-white/80">Настройки аккаунта</span></li>
                    <li>4. Нажмите <span className="text-white/80">«Выгрузить данные»</span> и скачайте JSON-файл</li>
                    <li>5. Выберите скачанный файл выше и нажмите <span className="text-white/80">«Загрузить данные»</span></li>
                  </ol>
                ) : (
                  <ol className="text-sm space-y-1.5 text-gray-300">
                    <li>1. Перейдите на сайт <a href="https://paimon.moe/" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-2" style={{ color: '#67e8f9' }}>paimon.moe</a></li>
                    <li>2. Войдите в свой аккаунт</li>
                    <li>3. Откройте <span className="text-white/80">Настройки</span></li>
                    <li>4. Нажмите <span className="text-white/80">«Скачать данные»</span> и сохраните JSON-файл</li>
                    <li>5. Выберите скачанный файл выше и нажмите <span className="text-white/80">«Загрузить данные»</span></li>
                  </ol>
                )}
                <p className="text-xs mt-3 text-gray-500">
                  UID определяется автоматически из вашей учетной записи
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
            <div className="mt-6 p-6 card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent-cyan border-t-transparent"></div>
                  <div>
                    <h3 className="text-white font-semibold">
                      {selectedGame === 'HSR' ? 'Honkai Star Rail' : 'Genshin Impact'}
                    </h3>
                    <p className="text-gray-300 text-sm">{currentStep}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-accent-cyan">
                    {progress}%
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative mb-4">
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-accent-cyan to-star-purple"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Detailed Progress Stats */}
              {progressStats.total > 0 && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className={`text-lg font-bold ${selectedGame === 'HSR' ? 'text-cyan-400' : 'text-cyan-300'}`}>
                      {progressStats.imported}
                    </div>
                    <div className="text-gray-400 text-xs">Импортировано</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${selectedGame === 'HSR' ? 'text-cyan-400' : 'text-cyan-300'}`}>
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
                    <div className="text-lg font-bold text-blue-400">
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
                <p className="text-sm text-accent-cyan">
                  {progress === 100 ? 'Загрузка завершена!' : 'Обработка данных...'}
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
                {selectedGame === 'HSR' ? (
                  <>
                    <li>Откройте Honkai Star Rail и зайдите в <span className="text-white/80">историю варпов</span></li>
                    <li>Откройте PowerShell и выполните команду ниже</li>
                    <li>Скрипт найдёт ссылку в кэше игры и скопирует её</li>
                    <li>Вставьте полученную ссылку в поле выше</li>
                    <li>Нажмите <span className="text-white/80">«Загрузить данные»</span></li>
                  </>
                ) : (
                  <>
                    <li>Откройте Genshin Impact и зайдите в <span className="text-white/80">историю желаний</span></li>
                    <li>Откройте PowerShell и выполните команду ниже</li>
                    <li>Скрипт найдёт ссылку в кэше игры и скопирует её</li>
                    <li>Вставьте полученную ссылку в поле выше</li>
                    <li>Нажмите <span className="text-white/80">«Загрузить данные»</span></li>
                  </>
                )}
              </ol>
              
              {/* PowerShell Command */}
              <div className="mb-4">
                <h4 className="text-md font-semibold text-white mb-2">PowerShell команда:</h4>
                <div className="bg-black/60 rounded-xl p-4 font-mono text-sm overflow-x-auto border border-white/10">
                  <code className="text-cyan-400">
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
                      showCopyToast();
                    }}
                    className="text-sm bg-accent-cyan/10 hover:bg-accent-cyan/20 text-accent-cyan px-3 py-1.5 rounded-lg border border-accent-cyan/20 transition-all duration-200"
                  >
                    Копировать команду
                  </button>
                  <span className="text-gray-400 text-xs">{copyToast ? '' : 'Команда скопируется в буфер обмена'}</span>
                </div>
              </div>
            </div>
          )}

          {/* JSON Method Instructions */}
          {selectedMethod === 'file' && (
            <div className="mb-6">
              <h4 className="text-md font-semibold text-white mb-3">Через JSON файл (альтернативный способ):</h4>
              
              {selectedGame === 'HSR' ? (
                <div className="p-4 rounded-xl" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.12)' }}>
                  <h4 className="font-semibold mb-2" style={{ color: '#c084fc' }}>Экспорт из pom.moe:</h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-gray-300 text-sm">
                    <li>Перейдите на <a href="https://pom.moe/" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-2" style={{ color: '#c084fc' }}>pom.moe</a> и войдите в аккаунт</li>
                    <li>Откройте <span className="text-white/80">Настройки аккаунта</span></li>
                    <li>Нажмите <span className="text-white/80">«Выгрузить данные»</span></li>
                    <li>Сохраните JSON-файл на устройство</li>
                    <li>Выберите файл выше и нажмите <span className="text-white/80">«Загрузить данные»</span></li>
                  </ol>
                </div>
              ) : (
                <div className="p-4 rounded-xl" style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.12)' }}>
                  <h4 className="font-semibold mb-2" style={{ color: '#67e8f9' }}>Экспорт из paimon.moe:</h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-gray-300 text-sm">
                    <li>Перейдите на <a href="https://paimon.moe/" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-2" style={{ color: '#67e8f9' }}>paimon.moe</a> и войдите в аккаунт</li>
                    <li>Откройте <span className="text-white/80">Настройки</span></li>
                    <li>Нажмите <span className="text-white/80">«Скачать данные»</span></li>
                    <li>Сохраните JSON-файл на устройство</li>
                    <li>Выберите файл выше и нажмите <span className="text-white/80">«Загрузить данные»</span></li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Game-specific tips */}
          {selectedGame === 'GENSHIN' && (
            <div className="rounded-xl p-4 mt-4" style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.12)' }}>
              <h4 className="font-semibold mb-2" style={{ color: '#67e8f9' }}>Советы для Genshin Impact:</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Обязательно откройте историю желаний в игре перед запуском скрипта</li>
                <li>• Скрипт ищет ссылку в кэше — папке webCaches</li>
                <li>• Если ссылка не найдена — перезайдите в историю желаний и повторите</li>
                <li>• Ссылка содержит временный токен — не делитесь ей с другими</li>
              </ul>
            </div>
          )}

          {selectedGame === 'HSR' && (
            <div className="rounded-xl p-4 mt-4" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.12)' }}>
              <h4 className="font-semibold mb-2" style={{ color: '#c084fc' }}>Советы для Honkai Star Rail:</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Обязательно откройте историю варпов в игре перед запуском скрипта</li>
                <li>• Скрипт автоматически найдёт ссылку в кэше игры</li>
                <li>• Если ссылка не найдена — перезайдите в историю варпов и повторите</li>
                <li>• Ссылка содержит временный токен — не делитесь ей с другими</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Copy toast notification */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-xl bg-emerald-500/15 border-emerald-500/30 text-emerald-300">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Команда скопирована!</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default Upload
