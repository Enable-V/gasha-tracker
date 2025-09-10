import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { ArrowLeftIcon, StarIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'

type GameType = 'HSR' | 'GENSHIN'

interface GachaPull {
  id: string
  itemName: string
  itemType: string
  rankType: number
  time: string
  pityCount: number
  isFeatured: boolean
  banner: {
    bannerName: string
    bannerType: string
  }
}

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

// Функция получения цвета по редкости
const getRarityColor = (rarity: number): string => {
  switch (rarity) {
    case 5:
      return 'text-yellow-400 bg-gradient-to-r from-yellow-400/10 to-orange-500/10 border-yellow-400/30'
    case 4:
      return 'text-purple-400 bg-gradient-to-r from-purple-400/10 to-purple-600/10 border-purple-400/30'
    case 3:
      return 'text-blue-400 bg-gradient-to-r from-blue-400/10 to-blue-600/10 border-blue-400/30'
    default:
      return 'text-gray-400 bg-gradient-to-r from-gray-400/10 to-gray-600/10 border-gray-400/30'
  }
}

// Функция получения фона для звезд
const getRarityBg = (rarity: number): string => {
  switch (rarity) {
    case 5:
      return 'bg-gradient-to-r from-yellow-400 to-orange-500'
    case 4:
      return 'bg-gradient-to-r from-purple-400 to-purple-600'
    case 3:
      return 'bg-gradient-to-r from-blue-400 to-blue-600'
    default:
      return 'bg-gradient-to-r from-gray-400 to-gray-600'
  }
}

// Функция получения иконки типа предмета
const getItemTypeIcon = (itemType: string, game: GameType) => {
  if ((game === 'HSR' && itemType === 'Light Cone') || (game === 'GENSHIN' && itemType === 'Weapon')) {
    return <SparklesIcon className="w-5 h-5" />
  }
  return <StarIcon className="w-5 h-5" />
}

const BannerDetails: React.FC = () => {
  const { bannerId, game } = useParams<{ bannerId: string; game: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [pulls, setPulls] = useState<GachaPull[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [itemMappings, setItemMappings] = useState<{ [key: string]: string }>({})
  const [bannerName, setBannerName] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalPulls, setTotalPulls] = useState(0)

  const gameType = game?.toUpperCase() as GameType
  const itemsPerPage = 50

  // Функция для получения русского названия предмета
  const translateItemName = (englishName: string): string => {
    const key = `${englishName.toLowerCase()}_${gameType}`
    return itemMappings[key] || englishName
  }

  // Загрузка переводов названий предметов
  const loadItemMappings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/items/mappings', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
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

  // Загрузка данных круток
  const loadPulls = async (page: number = 1) => {
    try {
      setLoading(page === 1)
      const token = localStorage.getItem('token')
      const offset = (page - 1) * itemsPerPage
      
      const response = await axios.get(`/api/gacha/user`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          banner: bannerId,
          game: gameType,
          limit: itemsPerPage,
          offset: offset
        }
      })

      if (response.data.pulls && response.data.pulls.length > 0) {
        setBannerName(translateBannerName(response.data.pulls[0].banner.bannerName, gameType))
        
        if (page === 1) {
          setPulls(response.data.pulls)
        } else {
          setPulls(prev => [...prev, ...response.data.pulls])
        }
        
        setTotalPulls(response.data.pagination.total)
        setHasMore(response.data.pagination.hasMore)
      } else if (page === 1) {
        setPulls([])
        setTotalPulls(0)
        setHasMore(false)
      }
    } catch (err: any) {
      console.error('Error loading pulls:', err)
      setError('Ошибка загрузки данных круток')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && bannerId && gameType) {
      loadItemMappings()
      loadPulls(1)
    }
  }, [user, bannerId, gameType])

  const loadMorePulls = () => {
    if (hasMore && !loading) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      loadPulls(nextPage)
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && pulls.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-400 min-h-[400px] flex items-center justify-center">
            <div>
              <p className="text-xl mb-4">{error}</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Вернуться к дашборду
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Заголовок с кнопкой возврата */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-purple-300 hover:text-purple-100 transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Назад к дашборду</span>
          </button>
          
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-6 border border-purple-500/20">
            <h1 className="text-3xl font-bold text-white mb-2">
              {bannerName || 'Загрузка...'}
            </h1>
            <div className="flex items-center space-x-4 text-purple-300">
              <span className="flex items-center space-x-1">
                <ClockIcon className="w-4 h-4" />
                <span>Всего круток: {totalPulls}</span>
              </span>
              <span className="px-3 py-1 bg-purple-600/30 rounded-full text-sm">
                {gameType}
              </span>
            </div>
          </div>
        </div>

        {/* Список круток */}
        {pulls.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <StarOutlineIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold mb-2">Нет данных</h3>
            <p>В этом баннере пока нет круток</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pulls.map((pull, index) => {
              const rarityColor = getRarityColor(pull.rankType)
              const rarityBg = getRarityBg(pull.rankType)
              const translatedName = translateItemName(pull.itemName)
              
              return (
                <div
                  key={`${pull.id}-${index}`}
                  className={`p-4 rounded-xl border backdrop-blur-sm transition-all hover:scale-[1.02] ${rarityColor}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Иконка типа предмета */}
                      <div className="flex-shrink-0">
                        <div className={`p-2 rounded-lg ${rarityBg}`}>
                          {getItemTypeIcon(pull.itemType, gameType)}
                        </div>
                      </div>
                      
                      {/* Информация о предмете */}
                      <div>
                        <h3 className="font-semibold text-lg">
                          {translatedName}
                          {pull.isFeatured && (
                            <span className="ml-2 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                              Рейтап
                            </span>
                          )}
                        </h3>
                        <p className="text-sm opacity-70">
                          {pull.itemType} • Pity: {pull.pityCount}
                        </p>
                      </div>
                    </div>
                    
                    {/* Редкость и время */}
                    <div className="flex items-center space-x-4 text-right">
                      {/* Звезды редкости */}
                      <div className="flex items-center space-x-1">
                        {[...Array(pull.rankType)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className="w-5 h-5 text-current"
                          />
                        ))}
                      </div>
                      
                      {/* Время */}
                      <div className="text-sm opacity-70">
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>{formatDate(pull.time)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {/* Кнопка загрузить еще */}
            {hasMore && (
              <div className="text-center py-6">
                <button
                  onClick={loadMorePulls}
                  disabled={loading}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2 mx-auto"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Загрузка...</span>
                    </>
                  ) : (
                    <span>Загрузить еще</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BannerDetails
