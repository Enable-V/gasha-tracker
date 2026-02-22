import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import CharacterImage from '../components/CharacterImage'

type GameType = 'HSR' | 'GENSHIN'

// Интерфейс для баннера с информацией о гаранте
interface BannerWithGuarantee {
  bannerId: string
  bannerName: string
  bannerNameRu?: string
  bannerType?: string
  game: GameType
  currentPity: number
  pullsToGuarantee: number
  pityLimit: number
}

// Интерфейс для статистики гарантий
interface GuaranteeStats {
  hsr: {
    totalBanners: number
    guaranteeReached: number
    closestToGuarantee: number
    averagePity: number
  }
  genshin: {
    totalBanners: number
    guaranteeReached: number
    closestToGuarantee: number
    averagePity: number
  }
  overall: {
    totalBanners: number
    guaranteeReached: number
    closestToGuarantee: number
    averagePity: number
  }
}

// Интерфейс для статистики по баннерам
interface BannerStats {
  bannerId: string
  bannerName: string
  bannerType?: string
  game: GameType
  count: number
  fiveStarCount?: number
  fourStarCount?: number
  threeStarCount?: number
  currentPity: number
  pullsToGuarantee: number
  pityLimit: number
  isGuaranteeReached: boolean
}

// Интерфейс для маппинга названий предметов
interface ItemNameMapping {
  englishName: string
  russianName: string
  game: GameType
  itemType: string
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
  const [guaranteeStats, setGuaranteeStats] = useState<GuaranteeStats | null>(null)
  const [bannerStatsData, setBannerStatsData] = useState<BannerStats[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'characters' | 'equipment'>('overview')
  const [itemMappings, setItemMappings] = useState<{ [key: string]: string }>({})
  const [banners, setBanners] = useState<any[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true })
    setTimeout(() => setToast(prev => prev ? { ...prev, visible: false } : null), 3000)
    setTimeout(() => setToast(null), 3500)
  }

  // Нормализация имени для поиска (совпадает с серверной normalizeItemName)
  const normalizeName = (name: string) => name.toLowerCase().replace(/[-_]+/g, ' ').replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()

  const translateItemName = (englishName: string, game: GameType): string => {
    const key = `${normalizeName(englishName)}_${game}`
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
        const key = `${normalizeName(mapping.englishName)}_${mapping.game}`
        mappings[key] = mapping.russianName
      })
      
      setItemMappings(mappings)
    } catch (error) {
      console.error('Ошибка загрузки переводов предметов:', error)
    }
  }

  // Загрузка данных баннеров из базы данных
  const loadBanners = async () => {
    try {
      const response = await axios.get(`/api/banners/game/${selectedGame}`)
      setBanners(response.data)
    } catch (error) {
      console.error('Ошибка загрузки баннеров:', error)
      setBanners([])
    }
  }

  useEffect(() => {
    if (user) {
      loadUserData()
      loadItemMappings()
      loadBanners()
    }
  }, [user, selectedGame])

  const loadUserData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      if (selectedGame === 'HSR') {
        const [gachaResponse, statsResponse, userStatsResponse] = await Promise.all([
          axios.get(`/api/gacha/user?limit=0&game=HSR`),
          axios.get(`/api/gacha/stats?game=HSR`),
          axios.get(`/api/stats/`)
        ])
        
        setGachaData(gachaResponse.data)
        setStats(statsResponse.data)
        setGuaranteeStats(userStatsResponse.data.guaranteeStats)
        setBannerStatsData(userStatsResponse.data.bannerStats || [])
      } else {
        // Для Genshin Impact - используем новую структуру API
        const [statsResponse, pullsResponse, userStatsResponse] = await Promise.all([
          axios.get(`/api/genshin/stats`),
          axios.get(`/api/gacha/user?limit=0&game=GENSHIN`),
          axios.get(`/api/stats/`)
        ])
        
        setStats(statsResponse.data)
        setGuaranteeStats(userStatsResponse.data.guaranteeStats)
        setBannerStatsData(userStatsResponse.data.bannerStats || [])
        
        // Устанавливаем данные круток из gacha API
        const allPulls = pullsResponse.data?.pulls || []
        setGachaData({
          pulls: allPulls,
          pagination: {
            total: allPulls.length,
            page: 1,
            limit: 0
          }
        })
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

  const recalculatePity = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post('/api/stats/recalculate-pity', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('Pity recalculated:', response.data)
      
      // Перезагружаем данные после пересчета
      await loadUserData()
      
      showToast(`Pity пересчитан! Баннеров: ${response.data.bannersUpdated}, круток обновлено: ${response.data.pullsUpdated}`, 'success')
    } catch (error) {
      console.error('Error recalculating pity:', error)
      showToast('Ошибка при пересчете статистики pity. Попробуйте ещё раз.', 'error')
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
      const groupKey = normalizeName(originalName)
      if (!characterCounts[groupKey]) {
        characterCounts[groupKey] = {
          name, // Переведенное имя для отображения
          originalName, // Оригинальное английское имя для поиска изображений
          count: 0,
          rankType: char.rankType,
          latestPull: char.time,
          itemType: char.itemType
        }
      }
      characterCounts[groupKey].count++
      if (new Date(char.time) > new Date(characterCounts[groupKey].latestPull)) {
        characterCounts[groupKey].latestPull = char.time
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
      const groupKey = normalizeName(originalName)
      if (!equipmentCounts[groupKey]) {
        equipmentCounts[groupKey] = {
          name, // Переведенное имя для отображения
          originalName, // Оригинальное английское имя для поиска изображений
          count: 0,
          rankType: item.rankType,
          latestPull: item.time,
          itemType: item.itemType
        }
      }
      equipmentCounts[groupKey].count++
      if (new Date(item.time) > new Date(equipmentCounts[groupKey].latestPull)) {
        equipmentCounts[groupKey].latestPull = item.time
      }
    })
    
    return {
      total: equipment.length,
      fiveStar,
      fourStar,
      all: Object.values(equipmentCounts).sort((a: any, b: any) => b.rankType - a.rankType || b.count - a.count)
    }
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
  //   return '/images/placeholder.svg'
  // }



  const rarityStats = getRarityStats()
  const characterStats = getCharacterStats()
  const equipmentStats = getEquipmentStats()
  const TabButton = ({ tab, label, icon }: { tab: string, label: string, icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(tab as any)}
      className={`flex-1 min-w-0 sm:flex-none sm:w-auto px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base border ${
        activeTab === tab
          ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30'
          : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/8 hover:text-white'
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Панель управления</h1>
        
        <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2">
          <p className="text-gray-400 text-sm">
            <span className="text-white font-bold">{user?.username}</span> <span className="text-gray-500">UID: {user?.uid}</span>
          </p>
        </div>
      </div>

      {/* Game Selector */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Выберите игру:</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setSelectedGame('HSR')}
            className={`p-5 rounded-xl border transition-all duration-300 group ${
              selectedGame === 'HSR'
                ? 'border-accent-cyan/40 bg-accent-cyan/10 shadow-glow-cyan/10'
                : 'border-white/10 bg-white/3 text-gray-300 hover:border-white/20 hover:bg-white/5'
            }`}
          >
            <div className="text-center">
              <img src="/images/static/games/hsr_icon.svg" alt="HSR" className="w-10 h-10 mx-auto mb-2 group-hover:scale-110 transition-transform duration-300" />
              <div className="font-semibold text-white">Honkai Star Rail</div>
              <div className="text-xs text-gray-500 mt-1">HSR</div>
            </div>
          </button>
          
          <button
            onClick={() => setSelectedGame('GENSHIN')}
            className={`p-5 rounded-xl border transition-all duration-300 group ${
              selectedGame === 'GENSHIN'
                ? 'border-star-purple/40 bg-star-purple/10 shadow-glow-purple/10'
                : 'border-white/10 bg-white/3 text-gray-300 hover:border-white/20 hover:bg-white/5'
            }`}
          >
            <div className="text-center">
              <img src="/images/static/games/genshin_icon.svg" alt="Genshin" className="w-10 h-10 mx-auto mb-2 group-hover:scale-110 transition-transform duration-300" />
              <div className="font-semibold text-white">Genshin Impact</div>
              <div className="text-xs text-gray-500 mt-1">原神</div>
            </div>
          </button>
        </div>
      </div>

      {/* Clear Pulls Button */}
      {/* <div className="card">
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
      </div> */}

      {/* Recalculate Pity Button */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Пересчет статистики pity</h3>
            <p className="text-gray-400 text-sm mt-1">
              Пересчитать статистику круток до гаранта для всех баннеров
            </p>
          </div>
          <button
            onClick={recalculatePity}
            disabled={loading}
            className="px-4 py-2 bg-star-purple/20 border border-star-purple/30 hover:bg-star-purple/30 disabled:opacity-40 disabled:cursor-not-allowed text-star-purple-light rounded-lg transition-all flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            <span>Пересчитать</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="card text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full text-accent-cyan"></div>
          <p className="mt-2 text-white">Загрузка данных...</p>
        </div>
      )}

      {gachaData && !loading && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-6 px-4 sm:px-0">
            <TabButton tab="overview" label="Обзор" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>} />
            <TabButton tab="characters" label="Персонажи" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>} />
            <TabButton 
              tab="equipment" 
              label={selectedGame === 'HSR' ? 'Световые конусы' : 'Оружие'} 
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>} 
            />
          </div>

          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card text-center hover:scale-105 transition-transform">
                  <div className="text-3xl font-bold text-blue-400 mb-2">{rarityStats.total}</div>
                  <div className="text-gray-300">Всего круток</div>
                  <div className="text-sm text-gray-400 mt-1">Все баннеры</div>
                </div>
                
                <div className="card text-center hover:scale-105 transition-transform">
                  <div className="text-3xl font-bold text-blue-400 mb-2">{rarityStats.fiveStar}</div>
                  <div className="text-gray-300">5<span className="text-yellow-400">★</span> предметов</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {rarityStats.total > 0 ? `${((rarityStats.fiveStar / rarityStats.total) * 100).toFixed(1)}%` : '0%'} шанс
                  </div>
                </div>
                
                <div className="card text-center hover:scale-105 transition-transform">
                  <div className="text-3xl font-bold text-blue-400 mb-2">{rarityStats.fourStar}</div>
                  <div className="text-gray-300">4<span className="text-purple-400">★</span> предметов</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {rarityStats.total > 0 ? `${((rarityStats.fourStar / rarityStats.total) * 100).toFixed(1)}%` : '0%'} шанс
                  </div>
                </div>
                
                <div className="card text-center hover:scale-105 transition-transform">
                  <div className="text-3xl font-bold text-blue-400 mb-2">{rarityStats.threeStar}</div>
                  <div className="text-gray-300">3<span className="text-blue-400">★</span> предметов</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {rarityStats.total > 0 ? `${((rarityStats.threeStar / rarityStats.total) * 100).toFixed(1)}%` : '0%'} шанс
                  </div>
                </div>
              </div>

              {/* Объединённый блок: баннеры с круткам и pity */}
              {(() => {
                const filteredBanners = bannerStatsData.filter(banner => banner.game === selectedGame)
                return filteredBanners && filteredBanners.length > 0
              })() && (
                <div className="card">
                  <h2 className="text-xl font-bold text-white mb-4">
                    Баннеры — {selectedGame === 'HSR' ? 'Honkai Star Rail' : 'Genshin Impact'}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bannerStatsData
                      .filter(banner => banner.game === selectedGame)
                      .map((banner) => (
                      <div 
                        key={banner.bannerId} 
                        className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-accent-cyan/30 transition-all duration-300 cursor-pointer group"
                        onClick={() => navigate(`/banner/${selectedGame.toLowerCase()}/${banner.bannerId}`)}
                      >
                        {/* Заголовок */}
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-white font-semibold text-sm truncate pr-2">
                            {banner.bannerName}
                          </h4>
                          <svg className="w-4 h-4 text-gray-500 group-hover:text-accent-cyan transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        
                        {/* Статистика круток */}
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-2xl font-bold text-accent-cyan">{banner.count}</span>
                          <span className="text-gray-400 text-sm">круток</span>
                          {rarityStats.total > 0 && (
                            <span className="text-gray-500 text-sm ml-auto">
                              {((banner.count / rarityStats.total) * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>

                        {/* Pity прогресс */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400">Pity: <span className="text-white font-medium">{banner.currentPity}</span></span>
                            <span className={`font-medium ${
                              banner.pullsToGuarantee <= 10 ? 'text-red-400' : 
                              banner.pullsToGuarantee <= 30 ? 'text-amber-400' : 'text-gray-400'
                            }`}>
                              до гаранта: {banner.pullsToGuarantee}
                            </span>
                          </div>
                          
                          <div className="w-full bg-white/10 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all ${
                                banner.pullsToGuarantee <= 10 ? 'bg-red-500' : 
                                banner.pullsToGuarantee <= 30 ? 'bg-amber-500' : 'bg-cyan-500'
                              }`}
                              style={{ width: `${Math.min((banner.currentPity / (banner.pityLimit || 90)) * 100, 100)}%` }}
                            ></div>
                          </div>
                          
                          <div className="text-[11px] text-gray-500 text-center">
                            {banner.currentPity}/{banner.pityLimit || 90}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bannerStatsData.filter(b => b.game === selectedGame).length === 0 && (
                <div className="card">
                  <h2 className="text-xl font-bold text-white mb-4">Баннеры</h2>
                  <div className="text-center text-gray-400 py-8">
                    <svg className="w-10 h-10 mx-auto mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    <p>Нет данных о баннерах</p>
                  </div>
                </div>
              )}

              {stats?.recentFiveStars?.length > 0 && (
                <div className="card">
                  <h2 className="text-xl font-bold text-white mb-4">Последние 5-звездочные</h2>
                  <div className="space-y-4">
                    {stats.recentFiveStars.slice(0, 5).map((pull: any) => (
                      <div key={`recent-${selectedGame}-${pull.id}`} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 hover:border-accent-cyan/20 transition-all duration-300">
                        {/* Мобильная версия */}
                        <div className="block md:hidden">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-black/20 flex items-center justify-center flex-shrink-0">
                              <CharacterImage
                                key={`recent-mobile-img-${selectedGame}-${pull.id}-${pull.itemName}-${pull.itemType}`}
                                itemName={pull.itemName}
                                itemType={pull.itemType}
                                game={selectedGame === 'GENSHIN' ? 'Genshin' : selectedGame}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-semibold text-sm leading-tight break-words">{translateItemName(pull.itemName, selectedGame)}</div>
                              <div className="text-gray-400 text-xs">{translateItemType(pull.itemType, selectedGame)}</div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-accent-cyan text-sm font-semibold">Pity: {pull.pityCount}</div>
                            <div className="text-gray-300 text-sm break-words">{pull.banner?.bannerNameRu || pull.banner?.bannerName || 'Неизвестно'}</div>
                            <div className="text-gray-400 text-xs">{new Date(pull.time).toLocaleDateString('ru-RU')}</div>
                          </div>
                        </div>

                        {/* Десктопная версия */}
                        <div className="hidden md:flex items-center justify-between">
                          <div className="flex items-center space-x-4 min-w-0 flex-1">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/20 flex items-center justify-center flex-shrink-0">
                              <CharacterImage
                                key={`recent-desktop-img-${selectedGame}-${pull.id}-${pull.itemName}-${pull.itemType}`}
                                itemName={pull.itemName}
                                itemType={pull.itemType}
                                game={selectedGame === 'GENSHIN' ? 'Genshin' : selectedGame}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-white font-semibold text-lg leading-tight break-words">{translateItemName(pull.itemName, selectedGame)}</div>
                              <div className="text-gray-400 text-sm">{translateItemType(pull.itemType, selectedGame)}</div>
                              <div className="text-accent-cyan text-sm font-semibold">Pity: {pull.pityCount}</div>
                            </div>
                          </div>
                          <div className="text-right ml-4 min-w-0 flex-shrink-0 max-w-xs">
                            <div className="text-gray-300 text-sm font-medium leading-tight break-words">{pull.banner?.bannerNameRu || pull.banner?.bannerName || 'Неизвестно'}</div>
                            <div className="text-gray-400 text-xs mt-1">{new Date(pull.time).toLocaleDateString('ru-RU')}</div>
                          </div>
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
                <h2 className="text-xl font-bold text-white mb-4">Коллекция персонажей</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {characterStats.all.map((char: any, index: number) => (
                    <div className={`relative rounded-xl p-4 hover:scale-105 transition-all duration-300 ${
                      char.rankType === 5 ? 'bg-accent-cyan/5 border border-accent-cyan/20 hover:border-accent-cyan/40' : 
                      'bg-star-purple/5 border border-star-purple/20 hover:border-star-purple/40'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/20 flex items-center justify-center">
                          <CharacterImage
                            key={`char-img-${selectedGame}-${char.originalName}-${char.itemType}`}
                            itemName={char.originalName}
                            itemType={char.itemType}
                            game={selectedGame === 'GENSHIN' ? 'Genshin' : selectedGame}
                            className="w-full h-full"
                          />
                        </div>
                        <div className="flex-1">
                          <div className={`font-bold ${char.rankType === 5 ? 'text-accent-cyan' : 'text-star-purple-light'}`}>
                            {char.name}
                          </div>
                          <div className="text-gray-300 text-sm flex items-center space-x-0.5">
                            {[...Array(char.rankType)].map((_: unknown, i: number) => (
                              <svg key={i} className={`w-3 h-3 ${char.rankType === 5 ? 'text-yellow-400' : 'text-star-purple-light'}`} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z"/></svg>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2">
                        {char.count > 1 && (
                          <span className="bg-accent-cyan/20 text-accent-cyan text-xs px-2 py-1 rounded-full font-bold">
                            {char.count}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {characterStats.all.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <svg className="w-10 h-10 mx-auto mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
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
                  Коллекция {selectedGame === 'HSR' ? 'световых конусов' : 'оружия'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {equipmentStats.all.map((item: any, index: number) => (
                    <div className={`relative rounded-xl p-4 hover:scale-105 transition-all duration-300 ${
                      item.rankType === 5 ? 'bg-accent-cyan/5 border border-accent-cyan/20 hover:border-accent-cyan/40' : 
                      item.rankType === 4 ? 'bg-star-purple/5 border border-star-purple/20 hover:border-star-purple/40' :
                      'bg-star-blue/5 border border-star-blue/20 hover:border-star-blue/40'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/20 flex items-center justify-center">
                          <CharacterImage
                            key={`equip-img-${selectedGame}-${item.originalName}-${item.itemType}`}
                            itemName={item.originalName}
                            itemType={item.itemType}
                            game={selectedGame === 'GENSHIN' ? 'Genshin' : selectedGame}
                            className="w-full h-full"
                          />
                        </div>
                        <div className="flex-1">
                          <div className={`font-bold ${
                            item.rankType === 5 ? 'text-accent-cyan' : 
                            item.rankType === 4 ? 'text-star-purple-light' : 'text-star-blue-light'
                          }`}>
                            {item.name}
                          </div>
                          <div className="text-gray-300 text-sm flex items-center space-x-0.5">
                            {[...Array(item.rankType)].map((_: unknown, i: number) => (
                              <svg key={i} className={`w-3 h-3 ${item.rankType === 5 ? 'text-yellow-400' : item.rankType === 4 ? 'text-star-purple-light' : 'text-star-blue-light'}`} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z"/></svg>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2">
                        {item.count > 1 && (
                          <span className="bg-accent-cyan/20 text-accent-cyan text-xs px-2 py-1 rounded-full font-bold">
                            {item.count}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {equipmentStats.all.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <svg className="w-10 h-10 mx-auto mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
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
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 0l.107-.058a2.25 2.25 0 001.183-1.98V9M2.25 9l.107-.058A2.25 2.25 0 003.54 7.012L9.017 3.77a2.25 2.25 0 012.966 0l5.478 3.243a2.25 2.25 0 001.183 1.948L21.75 9M2.25 9l9.75 5.25L21.75 9" /></svg>
            <p className="text-lg">
              Нет данных {selectedGame === 'HSR' ? 'Honkai Star Rail' : 'Genshin Impact'} для вашего аккаунта
            </p>
            <p className="text-sm mt-2">
              Импортируйте историю круток через страницу "Загрузка данных" → {selectedGame === 'HSR' ? 'HSR' : 'Genshin Impact'}
            </p>
          </div>
        </div>
      )}
      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-out ${
          toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-xl ${
            toast.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/15 border-red-500/30 text-red-300'
          }`}>
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(prev => prev ? { ...prev, visible: false } : null)}
              className="ml-2 p-0.5 rounded-md hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
