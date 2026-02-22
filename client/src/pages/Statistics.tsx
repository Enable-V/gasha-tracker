import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import CharacterImage from '../components/CharacterImage'

type GameType = 'HSR' | 'GENSHIN'

// Интерфейс для маппинга названий предметов
interface ItemNameMapping {
  englishName: string
  russianName: string
  game: GameType
  itemType: string
}

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
    game: string
    count: number
  }>
}

interface BannerDetail {
  banner: {
    id: number
    name: string
    nameRu?: string
    type: string
    imagePath?: string
    game: string
  }
  stats: {
    totalPulls: number
    fiveStarCount: number
    fourStarCount: number
    lastFiveStar: string | null
    lastFourStar: string | null
    averagePity: string
    fiveStarItemList: Array<{
      name: string
      pity: number
      time: string
      isFeatured: boolean
    }>
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
  const [_selectedGame, _setSelectedGame] = useState<GameType>('HSR')
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [selectedBanner, setSelectedBanner] = useState<string | null>(null)
  const [bannerDetail, setBannerDetail] = useState<BannerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gameFilter, setGameFilter] = useState<string>('all')
  const [itemMappings, setItemMappings] = useState<{ [key: string]: string }>({})

  // Нормализация имени для поиска (совпадает с серверной normalizeItemName)
  const normalizeName = (name: string) => name.toLowerCase().replace(/[-_]+/g, ' ').replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()

  const translateItemName = (englishName: string, game: GameType): string => {
    const key = `${normalizeName(englishName)}_${game}`
    return itemMappings[key] || englishName
  }

  // Функция перевода типов предметов
  const translateItemType = (itemType: string, game: GameType): string => {
    const translations: { [key: string]: { [key: string]: string } } = {
      'Character': {
        'HSR': 'Персонаж',
        'GENSHIN': 'Персонаж'
      },
      'Light Cone': {
        'HSR': 'Световой конус',
        'GENSHIN': 'Световой конус'
      },
      'Weapon': {
        'HSR': 'Оружие',
        'GENSHIN': 'Оружие'
      }
    }
    
    return translations[itemType]?.[game] || itemType
  }

  // Загрузка переводов названий предметов
  const loadItemMappings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/items/mappings', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) {
        throw new Error('Failed to load item mappings')
      }
      
      const data = await response.json()
      
      // Создаем карту для быстрого поиска: "englishname_game" -> "russianName"
      const mappings: { [key: string]: string } = {}
      data.forEach((mapping: ItemNameMapping) => {
        const key = `${normalizeName(mapping.englishName)}_${mapping.game}`
        mappings[key] = mapping.russianName
      })
      
      setItemMappings(mappings)
    } catch (error) {
      console.error('Ошибка загрузки переводов предметов:', error)
    }
  }

  const fetchUserStats = async () => {
    if (!user?.uid) return

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/stats/`, {
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
    if (!user) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/stats/banner/${bannerId}`, {
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
      loadItemMappings()
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
        <div className="loading-spinner"></div>
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

  // Фильтрация баннеров по игре
  const filteredBannerStats = userStats.bannerStats.filter(banner => {
    if (gameFilter === 'all') return true
    return banner.game === gameFilter
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gradient-gold">Статистика</h1>
        <div className="rounded-lg px-4 py-2" style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)' }}>
          <span className="text-white font-bold">{userStats.user.username}</span>
        </div>
      </div>
      
      {/* Общая статистика — верхние карточки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="relative rounded-xl p-6 text-center hover:scale-[1.03] transition-all duration-300" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(34,211,238,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <div className="text-3xl font-bold text-accent-cyan mb-2">{userStats.stats.totalPulls}</div>
          <div className="text-gray-300">Всего круток</div>
          <div className="text-sm text-gray-500 mt-1">Все баннеры</div>
        </div>
        <div className="relative rounded-xl p-6 text-center hover:scale-[1.03] transition-all duration-300" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(251,191,36,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <div className="text-3xl font-bold text-yellow-400 mb-2">{userStats.stats.fiveStarPulls}</div>
          <div className="text-gray-300">5<span className="text-yellow-400">★</span> предметов</div>
          <div className="text-sm text-gray-500 mt-1">{userStats.stats.fiveStarRate}% шанс</div>
        </div>
        <div className="relative rounded-xl p-6 text-center hover:scale-[1.03] transition-all duration-300" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,85,247,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <div className="text-3xl font-bold text-star-purple-light mb-2">{userStats.stats.fourStarPulls}</div>
          <div className="text-gray-300">4<span className="text-star-purple-light">★</span> предметов</div>
          <div className="text-sm text-gray-500 mt-1">{userStats.stats.fourStarRate}% шанс</div>
        </div>
        <div className="relative rounded-xl p-6 text-center hover:scale-[1.03] transition-all duration-300" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <div className="text-3xl font-bold text-star-blue mb-2">{threeStarPulls}</div>
          <div className="text-gray-300">3<span className="text-star-blue">★</span> предметов</div>
          <div className="text-sm text-gray-500 mt-1">{threeStarRate}% шанс</div>
        </div>
      </div>

      {/* Распределение редкости */}
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-4">Распределение редкости</h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-400 rounded-full mr-3 flex-shrink-0"></div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">5★</span>
                <span className="text-yellow-400 font-semibold">{userStats.stats.fiveStarRate}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-yellow-400 h-2 rounded-full transition-all duration-500" style={{ width: `${userStats.stats.fiveStarRate}%` }}></div>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-star-purple-light rounded-full mr-3 flex-shrink-0"></div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">4★</span>
                <span className="text-star-purple-light font-semibold">{userStats.stats.fourStarRate}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-star-purple-light h-2 rounded-full transition-all duration-500" style={{ width: `${userStats.stats.fourStarRate}%` }}></div>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-star-blue rounded-full mr-3 flex-shrink-0"></div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">3★</span>
                <span className="text-star-blue font-semibold">{threeStarRate}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-star-blue h-2 rounded-full transition-all duration-500" style={{ width: `${threeStarRate}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Статистика по баннерам */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Статистика по баннерам</h2>
          
          {/* Фильтр по играм */}
          <div className="flex gap-2">
            <button
              onClick={() => setGameFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 border ${
                gameFilter === 'all'
                  ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setGameFilter('HSR')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 border ${
                gameFilter === 'HSR'
                  ? 'bg-star-purple/20 text-star-purple-light border-star-purple/30'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              HSR
            </button>
            <button
              onClick={() => setGameFilter('GENSHIN')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 border ${
                gameFilter === 'GENSHIN'
                  ? 'bg-star-blue/20 text-star-blue-light border-star-blue/30'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              Genshin
            </button>
          </div>
        </div>
        
        {filteredBannerStats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBannerStats.map((banner) => (
              <div 
                key={banner.bannerId}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 backdrop-blur-sm ${
                  selectedBanner === banner.bannerId 
                    ? 'border-accent-cyan/40 bg-accent-cyan/10 shadow-[0_4px_20px_rgba(34,211,238,0.1)]' 
                    : 'border-accent-cyan/10 hover:border-accent-cyan/20 bg-white/3 hover:bg-white/5 shadow-[0_4px_16px_rgba(0,0,0,0.15)]'
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
        <div className="card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/3 via-transparent to-star-purple/3 pointer-events-none" />
          <div className="relative z-10">
          <div className="flex items-center mb-6 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(34,211,238,0.1)' }}>
            {bannerDetail.banner.imagePath && (
              <img 
                src={`/api/images/banners/${bannerDetail.banner.imagePath}`}
                alt={bannerDetail.banner.name}
                className="w-16 h-16 rounded-lg mr-4 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div>
              <h2 className="text-xl font-bold text-gradient-gold">
                {bannerDetail.banner.nameRu || bannerDetail.banner.name}
              </h2>
              <div className="text-gray-400 text-sm">
                {bannerDetail.banner.type === 'character' && 'Баннер персонажа'}
                {bannerDetail.banner.type === 'weapon' && 'Баннер оружия'}
                {bannerDetail.banner.type === 'standard' && 'Стандартная молитва'}
                {bannerDetail.banner.type === 'chronicled' && 'Chronicled Wish'}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl p-4 text-center transition-all duration-300" style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.1)' }}>
              <div className="text-2xl font-bold text-accent-cyan mb-1">{bannerDetail.stats.totalPulls}</div>
              <div className="text-gray-400 text-sm">Всего круток</div>
            </div>
            <div className="rounded-xl p-4 text-center transition-all duration-300" style={{ background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.1)' }}>
              <div className="text-2xl font-bold text-yellow-400 mb-1">{bannerDetail.stats.fiveStarCount}</div>
              <div className="text-gray-400 text-sm">5★ предметов</div>
            </div>
            <div className="rounded-xl p-4 text-center transition-all duration-300" style={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.1)' }}>
              <div className="text-2xl font-bold text-star-purple-light mb-1">{bannerDetail.stats.fourStarCount}</div>
              <div className="text-gray-400 text-sm">4★ предметов</div>
            </div>
            <div className="rounded-xl p-4 text-center transition-all duration-300" style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
              <div className="text-2xl font-bold text-star-blue mb-1">{bannerDetail.stats.averagePity}</div>
              <div className="text-gray-400 text-sm">Средний pity</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl p-4 flex items-center justify-between transition-all duration-300" style={{ background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.1)' }}>
              <span className="text-gray-400">Последний 5★</span>
              <span className="text-yellow-400 font-medium text-sm">{formatDate(bannerDetail.stats.lastFiveStar)}</span>
            </div>
            <div className="rounded-xl p-4 flex items-center justify-between transition-all duration-300" style={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.1)' }}>
              <span className="text-gray-400">Последний 4★</span>
              <span className="text-star-purple-light font-medium text-sm">{formatDate(bannerDetail.stats.lastFourStar)}</span>
            </div>
          </div>

          {/* Список всех 5★ предметов */}
          {bannerDetail.stats.fiveStarItemList.length > 0 && (
            <div className="mb-6 group">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="text-yellow-400 mr-2 group-hover:text-yellow-300 transition-colors duration-300">★</span>
                Все 5★ предметы ({bannerDetail.stats.fiveStarItemList.length})
              </h3>
              <div 
                className="max-h-96 overflow-y-auto rounded-xl p-4 bg-accent-cyan/5 border border-accent-cyan/20 transition-all duration-300"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'transparent transparent' }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {bannerDetail.stats.fiveStarItemList.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 rounded-xl bg-accent-cyan/5 border border-accent-cyan/20 hover:border-accent-cyan/40 transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/20 flex items-center justify-center">
                          <CharacterImage
                            itemName={item.name}
                            itemType={bannerDetail.banner.type === 'character' ? 'Character' : 'Weapon'}
                            game={bannerDetail.banner.game === 'HSR' ? 'HSR' : 'Genshin'}
                            className="w-full h-full"
                          />
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">
                            {translateItemName(item.name, bannerDetail.banner.game === 'HSR' ? 'HSR' : 'GENSHIN')}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {new Date(item.time).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-accent-cyan font-bold text-lg">{item.pity}</div>
                        <div className="text-gray-400 text-xs">pity</div>
                        {item.isFeatured && (
                          <div className="text-accent-cyan text-xs font-semibold">★</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Последние круки */}
          {bannerDetail.recentPulls.length > 0 && (
            <div className="group">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <svg className="w-5 h-5 text-star-purple-light mr-2 group-hover:text-star-purple transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Последние 20 круток
              </h3>
              <div 
                className="max-h-96 overflow-y-auto rounded-xl p-4 backdrop-blur-sm transition-all duration-300"
                style={{ background: 'rgba(168,85,247,0.03)', border: '1px solid rgba(168,85,247,0.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', scrollbarWidth: 'thin', scrollbarColor: 'transparent transparent' }}
              >
                <div className="space-y-2">
                  {bannerDetail.recentPulls.map((pull) => (
                    <div 
                      key={pull.id}
                      className="flex items-center justify-between p-3 rounded-xl backdrop-blur-sm transition-all duration-300 transform hover:scale-[1.01]"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,85,247,0.08)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/20 flex items-center justify-center">
                          <CharacterImage
                            key={`stats-item-${_selectedGame}-${pull.id}-${pull.itemName}-${pull.itemType}`}
                            itemName={translateItemName(pull.itemName, bannerDetail.banner.game === 'HSR' ? 'HSR' : 'GENSHIN')}
                            itemType={pull.itemType}
                            game={bannerDetail.banner.game === 'HSR' ? 'HSR' : 'Genshin'}
                            className="w-full h-full"
                          />
                        </div>
                        <div 
                          className={`w-3 h-3 rounded-full ${
                            pull.rankType === 5 ? 'bg-yellow-400' :
                            pull.rankType === 4 ? 'bg-star-purple-light' : 'bg-star-blue'
                          }`}
                        ></div>
                        <div>
                          <div className="text-white font-medium">
                            {translateItemName(pull.itemName, bannerDetail.banner.game === 'HSR' ? 'HSR' : 'GENSHIN')}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {translateItemType(pull.itemType, bannerDetail.banner.game === 'HSR' ? 'HSR' : 'GENSHIN')}
                          </div>
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
        </div>
      )}
    </div>
  )
}

export default Statistics
