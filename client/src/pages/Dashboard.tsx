import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const Dashboard = () => {
  const { user } = useAuth()
  const [gachaData, setGachaData] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'characters' | 'lightCones'>('overview')

  useEffect(() => {
    if (user?.uid) {
      loadUserData(user.uid)
    }
  }, [user])

  const loadUserData = async (uid: string) => {
    if (!uid) return
    
    setLoading(true)
    try {
      const [gachaResponse, statsResponse] = await Promise.all([
        axios.get(`/api/gacha/user/${uid}?limit=1000`),
        axios.get(`/api/gacha/stats/${uid}`)
      ])
      
      setGachaData(gachaResponse.data)
      setStats(statsResponse.data)
    } catch (error) {
      console.error('Error loading user data:', error)
      setGachaData(null)
      setStats(null)
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
    
    const characters = gachaData.pulls.filter((p: any) => p.itemType === 'Character')
    const fiveStar = characters.filter((p: any) => p.rankType === 5)
    const fourStar = characters.filter((p: any) => p.rankType === 4)
    
    const characterCounts: any = {}
    characters.forEach((char: any) => {
      const name = char.itemName
      if (!characterCounts[name]) {
        characterCounts[name] = {
          name,
          count: 0,
          rankType: char.rankType,
          latestPull: char.time,
          itemType: char.itemType
        }
      }
      characterCounts[name].count++
      if (new Date(char.time) > new Date(characterCounts[name].latestPull)) {
        characterCounts[name].latestPull = char.time
      }
    })
    
    return {
      total: characters.length,
      fiveStar,
      fourStar,
      all: Object.values(characterCounts).sort((a: any, b: any) => b.rankType - a.rankType || b.count - a.count)
    }
  }

  const getLightConeStats = () => {
    if (!gachaData?.pulls) return { total: 0, fiveStar: [], fourStar: [], all: [] }
    
    const lightCones = gachaData.pulls.filter((p: any) => p.itemType === 'Light Cone')
    const fiveStar = lightCones.filter((p: any) => p.rankType === 5)
    const fourStar = lightCones.filter((p: any) => p.rankType === 4)
    
    const lightConeCounts: any = {}
    lightCones.forEach((lc: any) => {
      const name = lc.itemName
      if (!lightConeCounts[name]) {
        lightConeCounts[name] = {
          name,
          count: 0,
          rankType: lc.rankType,
          latestPull: lc.time,
          itemType: lc.itemType
        }
      }
      lightConeCounts[name].count++
      if (new Date(lc.time) > new Date(lightConeCounts[name].latestPull)) {
        lightConeCounts[name].latestPull = lc.time
      }
    })
    
    return {
      total: lightCones.length,
      fiveStar,
      fourStar,
      all: Object.values(lightConeCounts).sort((a: any, b: any) => b.rankType - a.rankType || b.count - a.count)
    }
  }

  const getBannerStats = () => {
    if (!gachaData?.pulls) return {}
    
    const bannerCounts: any = {}
    gachaData.pulls.forEach((pull: any) => {
      const bannerName = pull.banner?.bannerName || 'Unknown'
      bannerCounts[bannerName] = (bannerCounts[bannerName] || 0) + 1
    })
    
    return bannerCounts
  }

  const getItemImage = (itemName: string, itemType: string) => {
    const baseUrl = 'https://api.hakush.in/hsr/UI'
    
    if (itemType === 'Character') {
      const formattedName = itemName.replace(/\s+/g, '').toLowerCase()
      return `${baseUrl}/avatar/${formattedName}.webp`
    } else if (itemType === 'Light Cone') {
      const formattedName = itemName.replace(/\s+/g, '').toLowerCase()
      return `${baseUrl}/lightcone/${formattedName}.webp`
    }
    
    return '/placeholder-item.png'
  }

  // Компонент для отображения баннера с изображением
  const BannerCard = ({ banner, count, percentage }: { banner: string, count: number, percentage: string }) => {
    const [bannerImageUrl, setBannerImageUrl] = useState<string>('/images/placeholder-banner.png')

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
      <div className="bg-white/5 rounded-lg overflow-hidden hover:bg-white/10 transition-all hover:scale-105">
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
        </div>
        
        {/* Статистика */}
        <div className="p-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">Процент от общего</span>
            <span className="text-hsr-gold text-sm font-bold">{percentage}</span>
          </div>
        </div>
      </div>
    )
  }

  const rarityStats = getRarityStats()
  const characterStats = getCharacterStats()
  const lightConeStats = getLightConeStats()
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
            <TabButton tab="lightCones" label="Световые конусы" icon="⚡" />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-bold text-white mb-4">👥 Персонажи</h3>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-400 mb-2">{characterStats.total}</div>
                    <div className="text-gray-300">Всего получено</div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-yellow-500/20 rounded-lg p-3">
                        <div className="text-yellow-400 font-bold">{characterStats.fiveStar.length}</div>
                        <div className="text-gray-300 text-sm">5⭐ персонажей</div>
                      </div>
                      <div className="bg-purple-500/20 rounded-lg p-3">
                        <div className="text-purple-400 font-bold">{characterStats.fourStar.length}</div>
                        <div className="text-gray-300 text-sm">4⭐ персонажей</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-bold text-white mb-4">⚡ Световые конусы</h3>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-400 mb-2">{lightConeStats.total}</div>
                    <div className="text-gray-300">Всего получено</div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-yellow-500/20 rounded-lg p-3">
                        <div className="text-yellow-400 font-bold">{lightConeStats.fiveStar.length}</div>
                        <div className="text-gray-300 text-sm">5⭐ конусов</div>
                      </div>
                      <div className="bg-purple-500/20 rounded-lg p-3">
                        <div className="text-purple-400 font-bold">{lightConeStats.fourStar.length}</div>
                        <div className="text-gray-300 text-sm">4⭐ конусов</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-xl font-bold text-white mb-4">🎯 Распределение по баннерам</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(bannerStats).map(([banner, count]: [string, any]) => (
                    <BannerCard 
                      key={banner}
                      banner={banner}
                      count={count}
                      percentage={rarityStats.total > 0 ? `${((count / rarityStats.total) * 100).toFixed(1)}%` : '0%'}
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
                            <div className="text-white font-medium">{pull.itemName}</div>
                            <div className="text-gray-400 text-sm">{pull.itemType}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-300 text-sm">{pull.banner?.bannerName || 'Неизвестно'}</div>
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
                            src={getItemImage(char.name, char.itemType)}
                            alt={char.name}
                            className="w-full h-full object-cover"
                            onError={(e: any) => {
                              e.target.src = `https://via.placeholder.com/64x64/1a1a1a/ffffff?text=${char.name.charAt(0)}`
                            }}
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

          {activeTab === 'lightCones' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-bold text-white mb-4">⚡ Коллекция световых конусов</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {lightConeStats.all.map((lc: any, index: number) => (
                    <div key={`${lc.name}-${index}`} className={`relative rounded-lg p-4 hover:scale-105 transition-all ${
                      lc.rankType === 5 ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30' : 
                      lc.rankType === 4 ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30' :
                      'bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/20 flex items-center justify-center">
                          <img 
                            src={getItemImage(lc.name, lc.itemType)}
                            alt={lc.name}
                            className="w-full h-full object-cover"
                            onError={(e: any) => {
                              e.target.src = `https://via.placeholder.com/64x64/1a1a1a/ffffff?text=⚡`
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className={`font-bold ${
                            lc.rankType === 5 ? 'text-yellow-400' : 
                            lc.rankType === 4 ? 'text-purple-400' : 'text-blue-400'
                          }`}>
                            {lc.name}
                          </div>
                          <div className="text-gray-300 text-sm">
                            {'⭐'.repeat(lc.rankType)}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {lc.count > 1 ? `${lc.count} копий` : '1 копия'}
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2">
                        {lc.count > 1 && (
                          <span className="bg-hsr-gold text-black text-xs px-2 py-1 rounded-full font-bold">
                            {lc.count}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {lightConeStats.all.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <div className="text-4xl mb-2">⚡</div>
                    <p>Световые конусы не найдены</p>
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
            <p className="text-lg">Нет данных gacha для вашего аккаунта</p>
            <p className="text-sm mt-2">Импортируйте историю круток через страницу "Загрузка данных"</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
