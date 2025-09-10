import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

type GameType = 'HSR' | 'GENSHIN'

// Интерфейс для маппинга названий предметов
interface ItemNameMapping {
  englishName: string
  russianName: string
  game: GameType
  itemType: string
}

// Функция перевода названий баннеров
const translateBannerName = (bannerName: string, game: GameType): string => {
  const translations: { [key: string]: { [key: string]: string } } = {
    HSR: {
      'Stellar Warp': 'Звездная деформация',
      'Light Cone Event Warp': 'Событийная деформация световых конусов', 
      'Departure Warp': 'Деформация отправления',
      'Character Event Warp': 'Событийная деформация персонажей'
    },
    GENSHIN: {
      'Wanderlust Invocation': 'Стандартная молитва',
      'Character Event Wish': 'Молитва события персонажа',
      'Weapon Event Wish': 'Молитва события оружия',
      'Novice Wishes': 'Молитва новичка',
      'Chronicled Wish': 'Хроникальная молитва'
    }
  }
  
  return translations[game]?.[bannerName] || bannerName
}

// Функция перевода типов предметов
const translateItemType = (itemType: string, game: GameType): string => {
  const translations: { [key: string]: { [key: string]: string } } = {
    'Character': {
      'HSR': 'Персонажи',
      'GENSHIN': 'Персонажи'
    },
    'Light Cone': {
      'HSR': 'Световые конусы',
      'GENSHIN': 'Световые конусы'
    },
    'Weapon': {
      'HSR': 'Оружие',
      'GENSHIN': 'Оружие'
    }
  }
  
  return translations[itemType]?.[game] || itemType
}

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedGame, setSelectedGame] = useState<GameType>('HSR')
  const [gachaData, setGachaData] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'characters' | 'equipment'>('overview')
  const [itemMappings, setItemMappings] = useState<{ [key: string]: string }>({})

  // Функция для получения русского названия предмета
  const translateItemName = (englishName: string, game: GameType): string => {
    const key = `${englishName.toLowerCase()}_${game}`
    return itemMappings[key] || englishName
  }

  // Загрузка переводов названий предметов
  const loadItemMappings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/items/mappings', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Создаем карту для быстрого поиска: "englishname_game" -> "russianName"
      const mappings: { [key: string]: string } = {}
      response.data.forEach((mapping: ItemNameMapping) => {
        const key = `${mapping.englishName.toLowerCase()}_${mapping.game}`
        mappings[key] = mapping.russianName
      })
      
      setItemMappings(mappings)
    } catch (error) {
      console.error('Ошибка загрузки переводов предметов:', error)
    }
  }

  useEffect(() => {
    if (user) {
      loadUserData()
      loadItemMappings()
    }
  }, [user, selectedGame])

  const loadUserData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      if (selectedGame === 'HSR') {
        const [gachaResponse, statsResponse] = await Promise.all([
          axios.get(`/api/gacha/user?limit=0`),
          axios.get(`/api/gacha/stats`)
        ])
        
        setGachaData(gachaResponse.data)
        setStats(statsResponse.data)
      } else {
        // Для Genshin Impact
        const statsResponse = await axios.get(`/api/genshin/stats`)
        setStats(statsResponse.data)
        
        // Преобразуем данные Genshin в формат, совместимый с Dashboard
        if (statsResponse.data?.banners) {
          const genshinPulls: any[] = []
          
          // Собираем все крутки из всех баннеров
          for (const banner of statsResponse.data.banners) {
            if (banner.gachaPulls) {
              genshinPulls.push(...banner.gachaPulls.map((pull: any) => ({
                ...pull,
                bannerName: banner.bannerName
              })))
            }
          }
          
          // Получаем все крутки пользователя для Genshin Impact
          try {
            const pullsResponse = await axios.get(`/api/gacha/user?limit=0&game=GENSHIN`)
            const allPulls = pullsResponse.data?.pulls || []
            
            setGachaData({
              pulls: allPulls,
              pagination: {
                total: allPulls.length,
                page: 1,
                limit: 0
              }
            })
          } catch (pullsError) {
            console.error('Error loading Genshin pulls:', pullsError)
            // Fallback: используем данные из stats
            setGachaData({
              pulls: genshinPulls.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()),
              pagination: {
                total: genshinPulls.length,
                page: 1,
                limit: 0
              }
            })
          }
        } else {
          setGachaData(null)
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      setGachaData(null)
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  const clearPulls = async () => {
    if (!user?.uid) return
    
    const gameName = selectedGame === 'HSR' ? 'Honkai Star Rail' : 'Genshin Impact'
    const confirmed = window.confirm(`Вы уверены, что хотите удалить все крутки для ${gameName}? Это действие нельзя отменить.`)
    
    if (!confirmed) return
    
    try {
      setLoading(true)
      
      if (selectedGame === 'HSR') {
        await axios.delete(`/api/gacha/clear-pulls`)
      } else {
        await axios.delete(`/api/genshin/clear-pulls`)
      }
      
      // Перезагружаем данные после очистки
      await loadUserData()
      
      alert(`Все крутки ${gameName} успешно удалены!`)
    } catch (error) {
      console.error('Error clearing pulls:', error)
      alert('Ошибка при удалении круток. Попробуйте еще раз.')
    } finally {
      setLoading(false)
    }
  }

  const getRarityStats = () => {
    if (!gachaData?.pulls) return { total: 0, fiveStar: 0, fourStar: 0, threeStar: 0 }
    
    const total = gachaData.pagination.total
    const pulls = gachaData.pulls
    const fiveStar = pulls.filter((p: any) => p.rankType === 5).length
    const fourStar = pulls.filter((p: any) => p.rankType === 4).length
    const threeStar = pulls.filter((p: any) => p.rankType === 3).length
    
    return { total, fiveStar, fourStar, threeStar }
  }

  const getCharacterStats = () => {
    if (!gachaData?.pulls) return { total: 0, fiveStar: [], fourStar: [], all: [] }
    
    // Для персонажей всегда используем английские названия типов
    const characterType = selectedGame === 'HSR' ? 'Character' : 'Character'
    const characters = gachaData.pulls.filter((p: any) => p.itemType === characterType)
    const fiveStar = characters.filter((p: any) => p.rankType === 5)
    const fourStar = characters.filter((p: any) => p.rankType === 4)
    
    const characterCounts: any = {}
    characters.forEach((char: any) => {
      const name = translateItemName(char.itemName, selectedGame)
      const originalName = char.itemName
      if (!characterCounts[originalName]) {
        characterCounts[originalName] = {
          name,
          originalName,
          count: 0,
          rankType: char.rankType,
          latestPull: char.time,
          itemType: char.itemType
        }
      }
      characterCounts[originalName].count++
      if (new Date(char.time) > new Date(characterCounts[originalName].latestPull)) {
        characterCounts[originalName].latestPull = char.time
      }
    })
    
    return {
      total: characters.length,
      fiveStar,
      fourStar,
      all: Object.values(characterCounts).sort((a: any, b: any) => b.rankType - a.rankType || b.count - a.count)
    }
  }

  const getEquipmentStats = () => {
    if (!gachaData?.pulls) return { total: 0, fiveStar: [], fourStar: [], all: [] }
    
    // Определяем тип снаряжения в зависимости от игры (всегда английские названия)
    const equipmentType = selectedGame === 'HSR' ? 'Light Cone' : 'Weapon'
    const equipment = gachaData.pulls.filter((p: any) => p.itemType === equipmentType)
    const fiveStar = equipment.filter((p: any) => p.rankType === 5)
    const fourStar = equipment.filter((p: any) => p.rankType === 4)
    
    const equipmentCounts: any = {}
    equipment.forEach((item: any) => {
      const name = translateItemName(item.itemName, selectedGame)
      const originalName = item.itemName
      if (!equipmentCounts[originalName]) {
        equipmentCounts[originalName] = {
          name,
          originalName,
          count: 0,
          rankType: item.rankType,
          latestPull: item.time,
          itemType: item.itemType
        }
      }
      equipmentCounts[originalName].count++
      if (new Date(item.time) > new Date(equipmentCounts[originalName].latestPull)) {
        equipmentCounts[originalName].latestPull = item.time
      }
    })
    
    return {
      total: equipment.length,
      fiveStar,
      fourStar,
      all: Object.values(equipmentCounts).sort((a: any, b: any) => b.rankType - a.rankType || b.count - a.count)
    }
  }

  const getBannerStats = () => {
    if (!gachaData?.pulls) return {}
    
    const bannerCounts: any = {}
    gachaData.pulls.forEach((pull: any) => {
      const bannerName = translateBannerName(pull.banner?.bannerName || 'Unknown', selectedGame)
      const bannerId = pull.bannerId || pull.banner?.bannerId || 'unknown'
      
      if (!bannerCounts[bannerName]) {
        bannerCounts[bannerName] = {
          count: 0,
          bannerId: bannerId
        }
      }
      bannerCounts[bannerName].count += 1
    })
    
    return bannerCounts
  }

  // Функция для получения изображения предмета (пока не используется)
  // const getItemImage = (itemName: string, itemType: string) => {
  //   const baseUrl = 'https://api.hakush.in/hsr/UI'
  //   
  //   if (itemType === 'Character') {
  //     const formattedName = itemName.replace(/\s+/g, '').toLowerCase()
  //     return `${baseUrl}/avatar/${formattedName}.webp`
  //   } else if (itemType === 'Light Cone') {
  //     const formattedName = itemName.replace(/\s+/g, '').toLowerCase()
  //     return `${baseUrl}/lightcone/${formattedName}.webp`
  //   }
  //   
  //   return '/placeholder-item.png'
  // }

  // Компонент для отображения баннера с изображением
  const BannerCard = ({ banner, count, percentage, bannerId }: { 
    banner: string, 
    count: number, 
    percentage: string, 
    bannerId: string 
  }) => {
    const [bannerImageUrl, setBannerImageUrl] = useState<string>('/images/placeholder-banner.png')

    const handleBannerClick = () => {
      navigate(`/banner/${selectedGame.toLowerCase()}/${bannerId}`)
    }

    useEffect(() => {
      const loadBannerImage = async () => {
        try {
          const response = await axios.get(`/api/banners/image/${encodeURIComponent(banner)}`)
          setBannerImageUrl(response.data.imageUrl)
        } catch (error) {
          console.error('Error loading banner image:', error)
        }
      }
      loadBannerImage()
    }, [banner])

    return (
      <div 
        className="bg-white/5 rounded-lg overflow-hidden hover:bg-white/10 transition-all hover:scale-105 cursor-pointer"
        onClick={handleBannerClick}
      >
        {/* Изображение баннера */}
        <div className="h-32 bg-gradient-to-r from-hsr-gold/20 to-purple-600/20 relative overflow-hidden">
          <img 
            src={bannerImageUrl}
            alt={banner}
            className="w-full h-full object-cover"
            onError={(e: any) => {
              e.target.src = '/images/placeholder-banner.png'
            }}
          />
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="absolute bottom-2 left-2 right-2">
            <div className="text-lg font-bold text-hsr-gold">{count}</div>
            <div className="text-gray-200 text-sm truncate">{banner}</div>
          </div>
          {/* Иконка для клика */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/50 rounded-full p-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Статистика */}
        <div className="p-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">Процент от общего</span>
            <span className="text-hsr-gold text-sm font-bold">{percentage}</span>
          </div>
          <div className="text-center mt-2">
            <span className="text-xs text-purple-300 hover:text-purple-100 transition-colors">
              Нажмите для просмотра →
            </span>
          </div>
        </div>
      </div>
    )
  }

  const rarityStats = getRarityStats()
  const characterStats = getCharacterStats()
  const equipmentStats = getEquipmentStats()
  const bannerStats = getBannerStats()

  const TabButton = ({ tab, label, icon }: { tab: string, label: string, icon: string }) => (
    <button
      onClick={() => setActiveTab(tab as any)}
      className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center space-x-2 ${
        activeTab === tab
          ? 'bg-hsr-gold text-black'
          : 'bg-white/10 text-white hover:bg-white/20'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">📊 Панель управления</h1>
        
        <div className="bg-hsr-gold/20 border border-hsr-gold/30 rounded-lg px-4 py-2">
          <p className="text-hsr-gold text-sm">
            👤 <span className="font-bold">{user?.username}</span> (UID: {user?.uid})
          </p>
        </div>
      </div>

      {/* Game Selector */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Выберите игру:</h3>
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

      {/* Clear Pulls Button */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">🗑️ Очистка данных</h3>
            <p className="text-gray-400 text-sm mt-1">
              Удалить все крутки для {selectedGame === 'HSR' ? 'Honkai Star Rail' : 'Genshin Impact'}
            </p>
          </div>
          <button
            onClick={clearPulls}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <span>🗑️</span>
            <span>Очистить</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="card text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full text-hsr-gold"></div>
          <p className="mt-2 text-white">Загрузка данных...</p>
        </div>
      )}

      {gachaData && !loading && (
        <>
          <div className="flex space-x-4 mb-6">
            <TabButton tab="overview" label="Обзор" icon="📊" />
            <TabButton tab="characters" label="Персонажи" icon="👥" />
            <TabButton 
              tab="equipment" 
              label={selectedGame === 'HSR' ? 'Световые конусы' : 'Оружие'} 
              icon={selectedGame === 'HSR' ? '⚡' : '⚔️'} 
            />
          </div>

          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card text-center hover:scale-105 transition-transform">
                  <div className="text-3xl font-bold text-hsr-gold mb-2">{rarityStats.total}</div>
                  <div className="text-gray-300">Всего круток</div>
                  <div className="text-sm text-gray-400 mt-1">Все баннеры</div>
                </div>
                
                <div className="card text-center hover:scale-105 transition-transform">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">{rarityStats.fiveStar}</div>
                  <div className="text-gray-300">5⭐ предметов</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {rarityStats.total > 0 ? `${((rarityStats.fiveStar / rarityStats.total) * 100).toFixed(1)}%` : '0%'} шанс
                  </div>
                </div>
                
                <div className="card text-center hover:scale-105 transition-transform">
                  <div className="text-3xl font-bold text-purple-400 mb-2">{rarityStats.fourStar}</div>
                  <div className="text-gray-300">4⭐ предметов</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {rarityStats.total > 0 ? `${((rarityStats.fourStar / rarityStats.total) * 100).toFixed(1)}%` : '0%'} шанс
                  </div>
                </div>
                
                <div className="card text-center hover:scale-105 transition-transform">
                  <div className="text-3xl font-bold text-blue-400 mb-2">{rarityStats.threeStar}</div>
                  <div className="text-gray-300">3⭐ предметов</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {rarityStats.total > 0 ? `${((rarityStats.threeStar / rarityStats.total) * 100).toFixed(1)}%` : '0%'} шанс
                  </div>
                </div>
              </div>

              
              <div className="card">
                <h2 className="text-xl font-bold text-white mb-4">🎯 Распределение по баннерам</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(bannerStats).map(([banner, data]: [string, any]) => (
                    <BannerCard 
                      key={banner}
                      banner={banner}
                      count={data.count}
                      percentage={rarityStats.total > 0 ? `${((data.count / rarityStats.total) * 100).toFixed(1)}%` : '0%'}
                      bannerId={data.bannerId}
                    />
                  ))}
                </div>
                {Object.keys(bannerStats).length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <div className="text-4xl mb-2">🎯</div>
                    <p>Нет данных о баннерах</p>
                  </div>
                )}
              </div>

              {stats?.recentFiveStars?.length > 0 && (
                <div className="card">
                  <h2 className="text-xl font-bold text-white mb-4">⭐ Последние 5-звездочные</h2>
                  <div className="space-y-3">
                    {stats.recentFiveStars.slice(0, 5).map((pull: any) => (
                      <div key={pull.id} className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/20 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="text-yellow-400 text-xl">⭐⭐⭐⭐⭐</div>
                          <div>
                            <div className="text-white font-medium">{translateItemName(pull.itemName, selectedGame)}</div>
                            <div className="text-gray-400 text-sm">{translateItemType(pull.itemType, selectedGame)}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-300 text-sm">{translateBannerName(pull.banner?.bannerName || 'Неизвестно', selectedGame)}</div>
                          <div className="text-gray-400 text-xs">{new Date(pull.time).toLocaleDateString('ru-RU')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'characters' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-bold text-white mb-4">👥 Коллекция персонажей</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {characterStats.all.map((char: any, index: number) => (
                    <div key={`${char.name}-${index}`} className={`relative rounded-lg p-4 hover:scale-105 transition-all ${
                      char.rankType === 5 ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30' : 
                      'bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/20 flex items-center justify-center">
                          <img 
                            // src={getItemImage(char.name, char.itemType)}
                            alt={char.name}
                            className="w-full h-full object-cover"
                            // onError={(e: any) => {
                            //   e.target.src = `https://via.placeholder.com/64x64/1a1a1a/ffffff?text=${char.name.charAt(0)}`
                            // }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className={`font-bold ${char.rankType === 5 ? 'text-yellow-400' : 'text-purple-400'}`}>
                            {char.name}
                          </div>
                          <div className="text-gray-300 text-sm">
                            {'⭐'.repeat(char.rankType)}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {char.count > 1 ? `${char.count} копий` : '1 копия'}
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2">
                        {char.count > 1 && (
                          <span className="bg-hsr-gold text-black text-xs px-2 py-1 rounded-full font-bold">
                            {char.count}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {characterStats.all.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <div className="text-4xl mb-2">👤</div>
                    <p>Персонажи не найдены</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'equipment' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-bold text-white mb-4">
                  {selectedGame === 'HSR' ? '⚡ Коллекция световых конусов' : '⚔️ Коллекция оружия'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {equipmentStats.all.map((item: any, index: number) => (
                    <div key={`${item.name}-${index}`} className={`relative rounded-lg p-4 hover:scale-105 transition-all ${
                      item.rankType === 5 ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30' : 
                      item.rankType === 4 ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30' :
                      'bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/20 flex items-center justify-center">
                          <img 
                            // src={getItemImage(item.name, item.itemType)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e: any) => {
                              e.target.src = `https://via.placeholder.com/64x64/1a1a1a/ffffff?text=${selectedGame === 'HSR' ? '⚡' : '⚔'}`
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className={`font-bold ${
                            item.rankType === 5 ? 'text-yellow-400' : 
                            item.rankType === 4 ? 'text-purple-400' : 'text-blue-400'
                          }`}>
                            {item.name}
                          </div>
                          <div className="text-gray-300 text-sm">
                            {'⭐'.repeat(item.rankType)}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {item.count > 1 ? `${item.count} копий` : '1 копия'}
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2">
                        {item.count > 1 && (
                          <span className="bg-hsr-gold text-black text-xs px-2 py-1 rounded-full font-bold">
                            {item.count}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {equipmentStats.all.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <div className="text-4xl mb-2">
                      {selectedGame === 'HSR' ? '⚡' : '⚔️'}
                    </div>
                    <p>
                      {selectedGame === 'HSR' ? 'Световые конусы не найдены' : 'Оружие не найдено'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {!gachaData && !loading && user && (
        <div className="card text-center">
          <div className="text-gray-400">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-lg">
              Нет данных {selectedGame === 'HSR' ? 'Honkai Star Rail' : 'Genshin Impact'} для вашего аккаунта
            </p>
            <p className="text-sm mt-2">
              Импортируйте историю круток через страницу "Загрузка данных" → {selectedGame === 'HSR' ? 'HSR' : 'Genshin Impact'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
