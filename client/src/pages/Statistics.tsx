import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

type GameType = 'HSR' | 'GENSHIN'

interface UserStats {
  user: {
    uid: string
    username: string
  }
  stats: {
    totalPulls: number
    fiveStarPulls: number
    fourStarPulls: number
    fiveStarRate: string
    fourStarRate: string
  }
  bannerStats: Array<{
    bannerId: string
    bannerName: string
    count: number
  }>
}

interface BannerDetail {
  banner: {
    id: number
    name: string
    type: string
  }
  stats: {
    totalPulls: number
    fiveStarCount: number
    fourStarCount: number
    lastFiveStar: string | null
    lastFourStar: string | null
  }
  recentPulls: Array<{
    id: string
    itemName: string
    itemType: string
    rankType: number
    time: string
    pityCount: number
    isFeatured: boolean
  }>
}

const Statistics = () => {
  const { user } = useAuth()
  const [selectedGame, setSelectedGame] = useState<GameType>('HSR')
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [selectedBanner, setSelectedBanner] = useState<string | null>(null)
  const [bannerDetail, setBannerDetail] = useState<BannerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserStats = async () => {
    if (!user?.uid) return

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/stats/${user.uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Ошибка загрузки статистики')
      }

      const data = await response.json()
      setUserStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  const fetchBannerDetail = async (bannerId: string) => {
    if (!user?.uid) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/stats/${user.uid}/banner/${bannerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Ошибка загрузки детальной статистики')
      }

      const data = await response.json()
      setBannerDetail(data)
    } catch (err) {
      console.error('Ошибка загрузки детальной статистики:', err)
    }
  }

  useEffect(() => {
    if (user) {
      fetchUserStats()
    }
  }, [user])

  useEffect(() => {
    if (selectedBanner) {
      fetchBannerDetail(selectedBanner)
    } else {
      setBannerDetail(null)
    }
  }, [selectedBanner])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Никогда'
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Вход не выполнен</h2>
          <p className="text-gray-400">Войдите в систему, чтобы просматривать статистику</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Ошибка</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={fetchUserStats}
            className="btn btn-primary"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  if (!userStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Нет данных</h2>
          <p className="text-gray-400">Статистика пока недоступна</p>
        </div>
      </div>
    )
  }

  const threeStarPulls = userStats.stats.totalPulls - userStats.stats.fiveStarPulls - userStats.stats.fourStarPulls
  const threeStarRate = userStats.stats.totalPulls > 0 
    ? ((threeStarPulls / userStats.stats.totalPulls) * 100).toFixed(2)
    : '0.00'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Статистика</h1>
        <div className="text-gray-400">
          Пользователь: <span className="text-white font-semibold">{userStats.user.username}</span>
        </div>
      </div>
      
      {/* Общая статистика */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">Общая статистика</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Всего круток:</span>
              <span className="text-white font-semibold">{userStats.stats.totalPulls}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">5-звездочных:</span>
              <span className="text-yellow-400 font-semibold">{userStats.stats.fiveStarPulls}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">4-звездочных:</span>
              <span className="text-purple-400 font-semibold">{userStats.stats.fourStarPulls}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">3-звездочных:</span>
              <span className="text-blue-400 font-semibold">{threeStarPulls}</span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">Процент выпадения</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">5★ предметы:</span>
              <span className="text-yellow-400 font-semibold">{userStats.stats.fiveStarRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">4★ предметы:</span>
              <span className="text-purple-400 font-semibold">{userStats.stats.fourStarRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">3★ предметы:</span>
              <span className="text-blue-400 font-semibold">{threeStarRate}%</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">Распределение редкости</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-400 rounded-full mr-3"></div>
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">5★</span>
                  <span className="text-yellow-400">{userStats.stats.fiveStarRate}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full" 
                    style={{ width: `${userStats.stats.fiveStarRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-400 rounded-full mr-3"></div>
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">4★</span>
                  <span className="text-purple-400">{userStats.stats.fourStarRate}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                  <div 
                    className="bg-purple-400 h-2 rounded-full" 
                    style={{ width: `${userStats.stats.fourStarRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-400 rounded-full mr-3"></div>
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">3★</span>
                  <span className="text-blue-400">{threeStarRate}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-400 h-2 rounded-full" 
                    style={{ width: `${threeStarRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Статистика по баннерам */}
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-4">Статистика по баннерам</h2>
        {userStats.bannerStats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userStats.bannerStats.map((banner) => (
              <div 
                key={banner.bannerId}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedBanner === banner.bannerId 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onClick={() => setSelectedBanner(
                  selectedBanner === banner.bannerId ? null : banner.bannerId
                )}
              >
                <h3 className="font-semibold text-white mb-2">{banner.bannerName}</h3>
                <div className="text-gray-400 text-sm">
                  Круток: <span className="text-white font-semibold">{banner.count}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-center py-8">
            Нет данных по баннерам
          </div>
        )}
      </div>

      {/* Детальная статистика выбранного баннера */}
      {selectedBanner && bannerDetail && (
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">
            Детали баннера: {bannerDetail.banner.name}
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Статистика</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Всего круток:</span>
                  <span className="text-white font-semibold">{bannerDetail.stats.totalPulls}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">5★ предметов:</span>
                  <span className="text-yellow-400 font-semibold">{bannerDetail.stats.fiveStarCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">4★ предметов:</span>
                  <span className="text-purple-400 font-semibold">{bannerDetail.stats.fourStarCount}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Последние выпадения</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Последний 5★:</span>
                  <span className="text-yellow-400 text-sm">
                    {formatDate(bannerDetail.stats.lastFiveStar)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Последний 4★:</span>
                  <span className="text-purple-400 text-sm">
                    {formatDate(bannerDetail.stats.lastFourStar)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Последние круки */}
          {bannerDetail.recentPulls.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Последние 20 круток</h3>
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {bannerDetail.recentPulls.map((pull) => (
                    <div 
                      key={pull.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50"
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className={`w-3 h-3 rounded-full ${
                            pull.rankType === 5 ? 'bg-yellow-400' :
                            pull.rankType === 4 ? 'bg-purple-400' : 'bg-blue-400'
                          }`}
                        ></div>
                        <div>
                          <div className="text-white font-medium">{pull.itemName}</div>
                          <div className="text-gray-400 text-sm">{pull.itemType}</div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-gray-400 text-sm">
                          {formatDate(pull.time)}
                        </div>
                        <div className="text-gray-500 text-xs">
                          Pity: {pull.pityCount}
                          {pull.isFeatured && <span className="text-yellow-400 ml-1">★</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Statistics
