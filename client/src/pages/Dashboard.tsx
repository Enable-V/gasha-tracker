import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const Dashboard = () => {
  const { user } = useAuth()
  const [gachaData, setGachaData] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

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
        axios.get(`/api/gacha/user/${uid}?limit=100`),
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

  const getBannerStats = () => {
    if (!gachaData?.pulls) return {}
    
    const bannerCounts: any = {}
    gachaData.pulls.forEach((pull: any) => {
      const bannerName = pull.banner?.bannerName || 'Unknown'
      bannerCounts[bannerName] = (bannerCounts[bannerName] || 0) + 1
    })
    
    return bannerCounts
  }

  const rarityStats = getRarityStats()
  const bannerStats = getBannerStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">📊 Панель управления</h1>
        
        {/* User Info */}
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card text-center">
              <div className="text-3xl font-bold text-hsr-gold mb-2">{rarityStats.total}</div>
              <div className="text-gray-300">Всего круток</div>
              <div className="text-sm text-gray-400 mt-1">Все баннеры</div>
            </div>
            
            <div className="card text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{rarityStats.fiveStar}</div>
              <div className="text-gray-300">5⭐ предметов</div>
              <div className="text-sm text-gray-400 mt-1">
                {rarityStats.total > 0 ? `${((rarityStats.fiveStar / rarityStats.total) * 100).toFixed(1)}%` : '0%'} шанс
              </div>
            </div>
            
            <div className="card text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">{rarityStats.fourStar}</div>
              <div className="text-gray-300">4⭐ предметов</div>
              <div className="text-sm text-gray-400 mt-1">
                {rarityStats.total > 0 ? `${((rarityStats.fourStar / rarityStats.total) * 100).toFixed(1)}%` : '0%'} шанс
              </div>
            </div>
            
            <div className="card text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{rarityStats.threeStar}</div>
              <div className="text-gray-300">3⭐ предметов</div>
              <div className="text-sm text-gray-400 mt-1">
                {rarityStats.total > 0 ? `${((rarityStats.threeStar / rarityStats.total) * 100).toFixed(1)}%` : '0%'} шанс
              </div>
            </div>
          </div>

          {/* Banner Distribution */}
          <div className="card">
            <h2 className="text-xl font-bold text-white mb-4">🎯 Распределение по баннерам</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(bannerStats).map(([banner, count]: [string, any]) => (
                <div key={banner} className="bg-white/5 rounded-lg p-4">
                  <div className="text-lg font-bold text-hsr-gold">{count}</div>
                  <div className="text-gray-300 text-sm">{banner}</div>
                  <div className="text-gray-400 text-xs">
                    {rarityStats.total > 0 ? `${((count / rarityStats.total) * 100).toFixed(1)}%` : '0%'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent 5-Star Pulls */}
          {stats?.recentFiveStars?.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold text-white mb-4">⭐ Последние 5-звездочные</h2>
              <div className="space-y-3">
                {stats.recentFiveStars.slice(0, 5).map((pull: any) => (
                  <div key={pull.id} className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
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

          {/* Recent Pulls */}
          <div className="card">
            <h2 className="text-xl font-bold text-white mb-4">🎁 Последние крутки</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {gachaData.pulls.slice(0, 10).map((pull: any) => (
                <div key={pull.id} className={`flex items-center justify-between p-3 rounded-lg ${
                  pull.rankType === 5 ? 'bg-yellow-500/20' : 
                  pull.rankType === 4 ? 'bg-purple-500/20' : 'bg-blue-500/20'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`text-lg font-bold ${
                      pull.rankType === 5 ? 'text-yellow-400' : 
                      pull.rankType === 4 ? 'text-purple-400' : 'text-blue-400'
                    }`}>
                      {'⭐'.repeat(pull.rankType)}
                    </div>
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
