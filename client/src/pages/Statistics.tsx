const Statistics = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Статистика</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">Общая статистика</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Всего игроков:</span>
              <span className="text-white font-semibold">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Всего круток:</span>
              <span className="text-white font-semibold">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">5-звездочных предметов:</span>
              <span className="text-yellow-400 font-semibold">0</span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">Популярные персонажи</h2>
          <div className="text-gray-400 text-center py-8">
            Данные будут доступны после загрузки
          </div>
        </div>
      </div>
      
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-4">Распределение редкости</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="rarity-5 p-4 rounded-lg mb-2">
              <div className="text-2xl font-bold">0%</div>
            </div>
            <div className="text-gray-400">5-звездочные</div>
          </div>
          <div className="text-center">
            <div className="rarity-4 p-4 rounded-lg mb-2">
              <div className="text-2xl font-bold">0%</div>
            </div>
            <div className="text-gray-400">4-звездочные</div>
          </div>
          <div className="text-center">
            <div className="rarity-3 p-4 rounded-lg mb-2">
              <div className="text-2xl font-bold">0%</div>
            </div>
            <div className="text-gray-400">3-звездочные</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Statistics
