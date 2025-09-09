import { useState, useEffect } from 'react'
import axios from 'axios'

const TestPage = () => {
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState('')
  const [gachaData, setGachaData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Загрузка пользователей при загрузке страницы
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await axios.get('/api/users')
      setUsers(response.data)
      
      // Автоматически выбираем пользователя с данными
      const userWithData = response.data.find((user: any) => user._count?.gachaPulls > 0)
      if (userWithData) {
        setSelectedUser(userWithData.uid)
        loadGachaData(userWithData.uid)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadGachaData = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`/api/gacha/user`)
      setGachaData(response.data)
    } catch (error) {
      console.error('Error loading gacha data:', error)
      setGachaData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleUserChange = () => {
    loadGachaData()
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white">🎯 HSR Data Viewer</h1>
      
      {/* User Selection */}
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-4">👤 Select User</h2>
        <select 
          value={selectedUser} 
          onChange={() => handleUserChange()}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-hsr-gold"
        >
          <option value="">Select a user...</option>
          {users.map(user => (
            <option key={user.uid} value={user.uid} className="bg-gray-800">
              {user.username} (UID: {user.uid}) - {user._count?.gachaPulls || 0} pulls
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card">
          <div className="text-center text-white">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-2">Loading gacha data...</p>
          </div>
        </div>
      )}

      {/* Gacha Data */}
      {gachaData && !loading && (
        <>
          {/* Summary */}
          <div className="card">
            <h2 className="text-xl font-bold text-white mb-4">📊 Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-hsr-gold">{gachaData.pagination.total}</div>
                <div className="text-gray-400">Total Pulls</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-400">
                  {gachaData.pulls.filter((p: any) => p.rankType === 5).length}
                </div>
                <div className="text-gray-400">5⭐ Pulls</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-400">
                  {gachaData.pulls.filter((p: any) => p.rankType === 4).length}
                </div>
                <div className="text-gray-400">4⭐ Pulls</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">
                  {gachaData.pulls.filter((p: any) => p.rankType === 3).length}
                </div>
                <div className="text-gray-400">3⭐ Pulls</div>
              </div>
            </div>
          </div>

          {/* Recent Pulls */}
          <div className="card">
            <h2 className="text-xl font-bold text-white mb-4">🎁 Recent Pulls (Last 20)</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {gachaData.pulls.slice(0, 20).map((pull: any) => (
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
                    <div className="text-gray-300 text-sm">{pull.banner?.bannerName || 'Unknown Banner'}</div>
                    <div className="text-gray-400 text-xs">{new Date(pull.time).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* No Data */}
      {!gachaData && !loading && selectedUser && (
        <div className="card">
          <div className="text-center text-gray-400">
            <p>No gacha data found for this user.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestPage
