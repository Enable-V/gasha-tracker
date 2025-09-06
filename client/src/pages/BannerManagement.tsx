import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const BannerManagement = () => {
  const { user } = useAuth()
  const [banners, setBanners] = useState<any[]>([])
  const [status, setStatus] = useState<any>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadBannersData()
    loadStatus()
  }, [])

  const loadBannersData = async () => {
    try {
      const response = await axios.get('/api/banners/list')
      setBanners(response.data.banners || [])
    } catch (error) {
      console.error('Error loading banners:', error)
    }
  }

  const loadStatus = async () => {
    try {
      const response = await axios.get('/api/banners/status')
      setStatus(response.data)
    } catch (error) {
      console.error('Error loading status:', error)
    }
  }

  const handleUpdateImages = async () => {
    setUpdating(true)
    try {
      await axios.post('/api/banners/update')
      alert('Изображения баннеров успешно обновлены!')
      await loadBannersData()
      await loadStatus()
    } catch (error: any) {
      alert(`Ошибка обновления: ${error.response?.data?.error || error.message}`)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">🖼️ Управление изображениями баннеров</h1>
        
        <div className="bg-hsr-gold/20 border border-hsr-gold/30 rounded-lg px-4 py-2">
          <p className="text-hsr-gold text-sm">
            👤 <span className="font-bold">{user?.username}</span>
          </p>
        </div>
      </div>

      {/* Status Card */}
      {status && (
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">📊 Статус сервиса</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{status.status}</div>
              <div className="text-gray-300 text-sm">Статус</div>
            </div>
            <div className="bg-blue-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{status.imageCount}</div>
              <div className="text-gray-300 text-sm">Изображений</div>
            </div>
            <div className="bg-purple-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{status.totalSize}</div>
              <div className="text-gray-300 text-sm">Размер</div>
            </div>
            <div className="bg-orange-500/20 rounded-lg p-4 text-center">
              <button
                onClick={handleUpdateImages}
                disabled={updating}
                className="w-full btn-primary text-sm"
              >
                {updating ? 'Обновление...' : 'Обновить изображения'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Images Grid */}
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-4">🎯 Доступные изображения баннеров</h2>
        
        {banners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {banners.map((banner, index) => (
              <div key={index} className="bg-white/5 rounded-lg overflow-hidden hover:bg-white/10 transition-all">
                <div className="h-32 bg-gradient-to-r from-hsr-gold/20 to-purple-600/20 relative overflow-hidden">
                  <img 
                    src={banner.fullUrl}
                    alt={banner.bannerName}
                    className="w-full h-full object-cover"
                    onError={(e: any) => {
                      e.target.src = 'https://via.placeholder.com/300x150/1a1a1a/ffffff?text=Banner'
                    }}
                  />
                  <div className="absolute inset-0 bg-black/30"></div>
                </div>
                
                <div className="p-3">
                  <div className="text-white font-medium text-sm mb-1 truncate" title={banner.bannerName}>
                    {banner.bannerName}
                  </div>
                  <div className="text-gray-400 text-xs truncate" title={banner.filename}>
                    {banner.filename}
                  </div>
                  <div className="mt-2">
                    <a 
                      href={banner.fullUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-hsr-gold hover:text-yellow-300 text-xs"
                    >
                      Открыть в новой вкладке →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <div className="text-6xl mb-4">🖼️</div>
            <p className="text-lg">Изображения баннеров не найдены</p>
            <p className="text-sm mt-2">Нажмите "Обновить изображения" для загрузки</p>
            <button
              onClick={handleUpdateImages}
              disabled={updating}
              className="mt-4 btn-primary"
            >
              {updating ? 'Загрузка...' : 'Загрузить изображения'}
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-4">ℹ️ Информация</h2>
        <div className="space-y-3 text-gray-300">
          <p>
            <strong>Автоматическое обновление:</strong> Изображения баннеров обновляются автоматически каждый день в 3:00.
          </p>
          <p>
            <strong>Источники изображений:</strong> Система загружает изображения из официальных источников HSR.
          </p>
          <p>
            <strong>Очистка:</strong> Старые неиспользуемые изображения удаляются автоматически каждую неделю.
          </p>
          <p>
            <strong>Ручное обновление:</strong> Вы можете принудительно обновить изображения с помощью кнопки выше.
          </p>
        </div>
      </div>
    </div>
  )
}

export default BannerManagement
