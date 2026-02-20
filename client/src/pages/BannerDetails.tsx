import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { ArrowLeftIcon, ClockIcon, ChevronDownIcon, StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'
import CharacterImage from '../components/CharacterImage'

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
    bannerNameRu?: string
    bannerType: string
  }
}

interface ItemNameMapping {
  englishName: string
  russianName: string
  game: GameType
  itemType: string
}

// Функция получения цвета по редкости
const getRarityColor = (rarity: number): string => {
  switch (rarity) {
    case 5:
      return 'bg-accent-cyan/5 border-accent-cyan/20 hover:border-accent-cyan/40'
    case 4:
      return 'bg-star-purple/5 border-star-purple/20 hover:border-star-purple/40'
    case 3:
      return 'bg-star-blue/5 border-star-blue/20 hover:border-star-blue/40'
    default:
      return 'bg-white/5 border-white/10 hover:border-white/20'
  }
}

// Функция получения цвета текста названия по редкости
const getRarityTextColor = (rarity: number): string => {
  switch (rarity) {
    case 5: return 'text-accent-cyan'
    case 4: return 'text-star-purple-light'
    case 3: return 'text-star-blue-light'
    default: return 'text-gray-400'
  }
}

// Функция получения цвета звезды по редкости
const getStarColor = (rarity: number): string => {
  switch (rarity) {
    case 5: return 'text-yellow-400'
    case 4: return 'text-star-purple-light'
    case 3: return 'text-star-blue-light'
    default: return 'text-gray-400'
  }
}

const BannerDetails: React.FC = () => {
  const { bannerId, game } = useParams<{ bannerId: string; game: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [pulls, setPulls] = useState<GachaPull[]>([])
  const [allPulls, setAllPulls] = useState<GachaPull[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [itemMappings, setItemMappings] = useState<{ [key: string]: string }>({})
  const [bannerName, setBannerName] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalPulls, setTotalPulls] = useState(0)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedRarity, setSelectedRarity] = useState<number | null>(null)
  const [displayMode, setDisplayMode] = useState<'paginated' | 'loadMore'>('paginated')
  const [itemsPerPage, setItemsPerPage] = useState<number>(20)
  const [isItemsPerPageOpen, setIsItemsPerPageOpen] = useState(false)

  const gameType = game?.toUpperCase() as GameType

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

  // Загрузка ВСЕ данных круток при инициализации
  const loadAllPulls = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      let allLoadedPulls: GachaPull[] = []
      let page = 1
      let hasMore = true

      while (hasMore) {
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
          if (page === 1) {
            setBannerName(response.data.pulls[0].banner.bannerNameRu || response.data.pulls[0].banner.bannerName)
            setTotalPulls(response.data.pagination.total)
          }

          allLoadedPulls = [...allLoadedPulls, ...response.data.pulls]
          hasMore = response.data.pagination.hasMore
          page++
        } else {
          hasMore = false
        }
      }

      setPulls(allLoadedPulls)
      setAllPulls(allLoadedPulls)
      setHasMore(false)
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
      loadAllPulls()
    }
  }, [user, bannerId, gameType])

  // Закрытие кастомного dropdown при клике вне
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isItemsPerPageOpen) {
        const target = e.target as HTMLElement
        if (!target.closest('.items-per-page-dropdown')) {
          setIsItemsPerPageOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isItemsPerPageOpen])

  // Фильтрация круток по поиску и редкости
  const filteredPulls = allPulls.filter(pull => {
    const translatedName = translateItemName(pull.itemName)
    const matchesSearch = 
      translatedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pull.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pull.itemType.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRarity = selectedRarity === null || pull.rankType === selectedRarity
    
    return matchesSearch && matchesRarity
  })

  // Пагинация отфильтрованных результатов
  const displayedPulls = displayMode === 'paginated' 
    ? filteredPulls.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredPulls.slice(0, Math.min(allPulls.length, itemsPerPage * (currentPage)))

  const totalPages = Math.ceil(filteredPulls.length / itemsPerPage)

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-xl text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            Вернуться к дашборду
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Заголовок с кнопкой возврата */}
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-400 hover:text-accent-cyan transition-colors duration-300 mb-4 group"
          >
            <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span>Назад к дашборду</span>
          </button>
          
          <div className="card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan/5 via-transparent to-star-purple/5 pointer-events-none" />
            <h1 className="text-3xl font-bold text-gradient-gold mb-2 relative z-10">
              {bannerName || 'Загрузка...'}
            </h1>
            <div className="flex items-center space-x-4 text-gray-400 relative z-10">
              <span className="flex items-center space-x-1.5">
                <ClockIcon className="w-4 h-4 text-accent-cyan/70" />
                <span>Всего круток: <span className="text-white font-semibold">{totalPulls}</span></span>
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-star-purple/15 text-star-purple-light border border-star-purple/20">
                {gameType}
              </span>
            </div>
          </div>
        </div>

        {/* Поисковая панель */}
        <div className="card space-y-4">
          {/* Поле поиска */}
          <div>
            <label className="block text-sm text-gray-400 mb-2 flex items-center space-x-1.5">
              <svg className="w-4 h-4 text-accent-cyan/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <span>Поиск по названию</span>
            </label>
            <input
              type="text"
              placeholder="Введите название предмета..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="input-glass"
            />
          </div>

          {/* Фильтр по редкости */}
          <div>
            <label className="block text-sm text-gray-400 mb-2 flex items-center space-x-1.5">
              <svg className="w-4 h-4 text-accent-cyan" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span>Фильтр по редкости</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  setSelectedRarity(null)
                  setCurrentPage(1)
                }}
                className={`px-4 py-2 rounded-lg transition-all duration-200 border ${
                  selectedRarity === null 
                    ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30 shadow-glow-cyan/10' 
                    : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                Все
              </button>
              {[5, 4, 3].map(rarity => (
                <button
                  key={rarity}
                  onClick={() => {
                    setSelectedRarity(rarity)
                    setCurrentPage(1)
                  }}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-1 border ${
                    selectedRarity === rarity 
                      ? getRarityColor(rarity).split(' ')[0] + ' bg-opacity-80 border-current/30'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {[...Array(rarity)].map((_, i) => (
                    <StarIcon key={i} className="w-4 h-4" />
                  ))}
                </button>
              ))}
            </div>
          </div>

          {/* Режим отображения */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2 flex items-center space-x-1.5">
                <svg className="w-4 h-4 text-star-purple-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                <span>Режим отображения</span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setDisplayMode('paginated')
                    setCurrentPage(1)
                  }}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 border ${
                    displayMode === 'paginated' 
                      ? 'bg-star-purple/20 text-star-purple-light border-star-purple/30' 
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  По цифрам
                </button>
                <button
                  onClick={() => {
                    setDisplayMode('loadMore')
                    setCurrentPage(1)
                  }}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 border ${
                    displayMode === 'loadMore' 
                      ? 'bg-star-purple/20 text-star-purple-light border-star-purple/30' 
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  Загрузить еще
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2 flex items-center space-x-1.5">
                <svg className="w-4 h-4 text-star-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                <span>Элементов на странице</span>
              </label>
              <div className="relative items-per-page-dropdown" style={{ zIndex: 50 }}>
                <div
                  onClick={() => setIsItemsPerPageOpen(!isItemsPerPageOpen)}
                  className="w-full px-4 py-3 rounded-lg text-white cursor-pointer flex items-center justify-between hover:bg-white/8 transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <span>{itemsPerPage === 999999 ? 'Показать все' : itemsPerPage}</span>
                  <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isItemsPerPageOpen ? 'rotate-180' : ''}`} />
                </div>
                {isItemsPerPageOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-[60] rounded-lg overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                    style={{
                      background: 'rgba(15,15,30,0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {[
                      { value: 10, label: '10' },
                      { value: 20, label: '20' },
                      { value: 50, label: '50' },
                      { value: 100, label: '100' },
                      { value: 999999, label: 'Показать все' },
                    ].map((option) => (
                      <div
                        key={option.value}
                        onClick={() => {
                          setItemsPerPage(option.value)
                          setCurrentPage(1)
                          setIsItemsPerPageOpen(false)
                        }}
                        className={`px-4 py-2.5 cursor-pointer transition-colors duration-150 ${
                          itemsPerPage === option.value
                            ? 'bg-accent-cyan/15 text-accent-cyan'
                            : 'text-gray-300 hover:bg-white/8 hover:text-white'
                        }`}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Информация о результатах */}
          <div className="text-sm text-gray-400">
            Показано: {displayedPulls.length} из {filteredPulls.length} круток
            {filteredPulls.length < totalPulls && (
              <span className="ml-2 text-gray-500">
                (Всего в базе: {totalPulls})
              </span>
            )}
          </div>
        </div>

        {/* Пусто или список */}
        {filteredPulls.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <StarOutlineIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold mb-2">Нет результатов</h3>
            <p>{searchQuery || selectedRarity ? 'Нет круток, соответствующих вашим фильтрам' : 'В этом баннере пока нет круток'}</p>
          </div>
        ) : (
          <>
            {/* Список круток */}
            <div className="space-y-3">
              {displayedPulls.map((pull, index) => {
                const rarityColor = getRarityColor(pull.rankType)
                const translatedName = translateItemName(pull.itemName)
                
                return (
                  <div
                    key={`${pull.id}-${index}`}
                    className={`relative rounded-xl p-4 border backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] shadow-[0_4px_16px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)] ${rarityColor}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Изображение предмета */}
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-black/20 flex items-center justify-center flex-shrink-0">
                          <CharacterImage
                            key={`banner-item-${gameType}-${pull.id}-${pull.itemName}-${pull.itemType}`}
                            itemName={pull.itemName}
                            itemType={pull.itemType}
                            game={gameType === 'GENSHIN' ? 'Genshin' : gameType}
                            className="w-full h-full"
                          />
                        </div>
                        
                        {/* Информация о предмете */}
                        <div className="flex-1 min-w-0">
                          <div className={`font-bold text-base ${getRarityTextColor(pull.rankType)}`}>
                            {translatedName}
                            {pull.isFeatured && (
                              <span className="ml-2 px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                                Рейтап
                              </span>
                            )}
                          </div>
                          <div className="text-gray-400 text-sm flex items-center space-x-0.5">
                            {[...Array(pull.rankType)].map((_, i) => (
                              <svg key={i} className={`w-3.5 h-3.5 ${getStarColor(pull.rankType)}`} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z"/></svg>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Время и pity */}
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="text-sm text-gray-400 flex items-center justify-end space-x-1">
                          <ClockIcon className="w-3.5 h-3.5" />
                          <span>{formatDate(pull.time)}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {pull.itemType} • Pity: {pull.pityCount}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Пагинация по цифрам */}
            {displayMode === 'paginated' && totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200"
                >
                  ←
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    // Показываем текущую страницу, соседние, первую и последнюю
                    const isVisible =
                      page === currentPage ||
                      Math.abs(page - currentPage) <= 1 ||
                      page === 1 ||
                      page === totalPages
                    
                    if (!isVisible && page !== currentPage - 2 && page !== currentPage + 2) {
                      return null
                    }
                    
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span key={page} className="px-2 py-2 text-gray-500">
                          ...
                        </span>
                      )
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg transition-all duration-200 border ${
                          page === currentPage
                            ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200"
                >
                  →
                </button>
              </div>
            )}

            {/* Кнопка загрузить еще */}
            {displayMode === 'loadMore' && (
              <div className="text-center py-6">
                <button
                  onClick={() => {
                    // Увеличиваем currentPage для отображения следующей партии
                    setCurrentPage(currentPage + 1)
                  }}
                  disabled={loading || displayedPulls.length >= filteredPulls.length}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Загрузка...</span>
                    </>
                  ) : displayedPulls.length >= filteredPulls.length ? (
                    <span>Все круток загружены</span>
                  ) : (
                    <>
                      <span>Загрузить еще ({Math.min(displayedPulls.length + itemsPerPage, filteredPulls.length)}/{filteredPulls.length})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
    </div>
  )
}

export default BannerDetails
