import { useState } from 'react'

const Upload = () => {
  const [selectedMethod, setSelectedMethod] = useState<'url' | 'file'>('url')
  const [isLoading, setIsLoading] = useState(false)
  const [url, setUrl] = useState('')
  const [uid, setUid] = useState('')

  const handleUpload = async () => {
    if (!uid) {
      alert('Пожалуйста, введите UID игрока')
      return
    }
    
    setIsLoading(true)
    // Здесь будет логика загрузки
    setTimeout(() => {
      setIsLoading(false)
      alert('Данные загружены!')
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Загрузка данных круток</h1>
        <p className="text-gray-400">Импортируйте историю ваших круток для анализа</p>
      </div>

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

          {/* UID Input */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-2">UID игрока:</label>
            <input
              type="text"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="Введите ваш UID из игры"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-hsr-gold"
            />
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
            disabled={isLoading || (!url && selectedMethod === 'url') || !uid}
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
            <li>Введите ваш UID и нажмите "Загрузить данные"</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default Upload
