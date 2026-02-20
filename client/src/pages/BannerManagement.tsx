import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import BannerImage from '../components/BannerImage'

interface Banner {
  id: number
  bannerId: string
  bannerName: string
  bannerType: string
  game: string
  imagePath?: string
  startTime?: string
  endTime?: string
  createdAt: string
}

const BannerManagement = () => {
  const { user } = useAuth()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGame, setSelectedGame] = useState<'HSR' | 'GENSHIN'>('HSR')

  useEffect(() => {
    loadBanners()
  }, [selectedGame])

  const loadBanners = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/banners/game/${selectedGame}`)
      setBanners(response.data)
    } catch (error) {
      console.error('Error loading banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBannerTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      character: 'Персонаж',
      weapon: 'Оружие',
      standard: 'Стандартный',
      beginner: 'Новичок',
      chronicled: 'Хроникальный'
    }
    return types[type] || type
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Не указана'
    return new Date(dateString).toLocaleDateString('ru-RU')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">🎯 Управление баннерами</h1>

        <div className="bg-hsr-gold/20 border border-hsr-gold/30 rounded-lg px-4 py-2">
          <p className="text-hsr-gold text-sm">
            👤 <span className="font-bold">{user?.username}</span>
          </p>
        </div>
      </div>

      {/* Game Selector */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <label className="text-white font-medium">Игра:</label>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedGame('HSR')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedGame === 'HSR'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Honkai Star Rail
            </button>
            <button
              onClick={() => setSelectedGame('GENSHIN')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedGame === 'GENSHIN'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Genshin Impact
            </button>
          </div>
        </div>
      </div>

      {/* Banners Grid */}
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-4">
          🎯 Баннеры {selectedGame === 'HSR' ? 'Honkai Star Rail' : 'Genshin Impact'}
        </h2>

        {loading ? (
          <div className="text-center text-gray-400 py-8">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-lg">Загрузка баннеров...</p>
          </div>
        ) : banners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <div key={banner.id} className="bg-white/5 rounded-lg overflow-hidden hover:bg-white/10 transition-all">
                {/* Banner Image */}
                <div className="h-48 bg-gradient-to-r from-hsr-gold/20 to-purple-600/20 relative overflow-hidden">
                  {banner.imagePath ? (
                    <BannerImage
                      bannerName={banner.bannerName}
                      imagePath={banner.imagePath}
                      className="w-full h-full"
                      aspectRatio="wide"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <div className="text-4xl mb-2">🖼️</div>
                        <p className="text-sm">Изображение не задано</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20"></div>

                  {/* Banner Type Badge */}
                  <div className="absolute top-2 right-2">
                    <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {getBannerTypeLabel(banner.bannerType)}
                    </span>
                  </div>
                </div>

                {/* Banner Info */}
                <div className="p-4">
                  <h3 className="text-white font-bold text-lg mb-2" title={banner.bannerName}>
                    {banner.bannerName}
                  </h3>

                  <div className="space-y-1 text-sm text-gray-300">
                    <p><span className="text-purple-400">ID:</span> {banner.bannerId}</p>
                    <p><span className="text-purple-400">Тип:</span> {getBannerTypeLabel(banner.bannerType)}</p>
                    <p><span className="text-purple-400">Игра:</span> {banner.game}</p>
                    <p><span className="text-purple-400">Создан:</span> {formatDate(banner.createdAt)}</p>

                    {banner.startTime && (
                      <p><span className="text-cyan-400">Начало:</span> {formatDate(banner.startTime)}</p>
                    )}

                    {banner.endTime && (
                      <p><span className="text-red-400">Конец:</span> {formatDate(banner.endTime)}</p>
                    )}
                  </div>

                  {/* Image Path */}
                  {banner.imagePath && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-gray-400 truncate" title={banner.imagePath}>
                        📁 {banner.imagePath}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-lg">Баннеры не найдены</p>
            <p className="text-sm mt-2">
              Для игры {selectedGame === 'HSR' ? 'Honkai Star Rail' : 'Genshin Impact'} баннеры отсутствуют
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-4">ℹ️ Информация</h2>
        <div className="space-y-3 text-gray-300">
          <p>
            <strong>Управление баннерами:</strong> Здесь отображаются все баннеры из базы данных с их изображениями.
          </p>
          <p>
            <strong>Пути к изображениям:</strong> Изображения хранятся по путям, указанным в поле imagePath каждого баннера.
          </p>
          <p>
            <strong>Добавление изображений:</strong> Изображения можно добавить через админ-панель в разделе "Баннеры".
          </p>
          <p>
            <strong>Форматы изображений:</strong> Поддерживаются форматы JPG, PNG, WebP.
          </p>
        </div>
      </div>
    </div>
  )
}

export default BannerManagement
