const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Панель управления</h1>
        <button className="btn-primary">
          Обновить данные
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="text-center">
            <div className="text-3xl font-bold text-hsr-gold mb-2">0</div>
            <div className="text-gray-400">Всего круток</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">0</div>
            <div className="text-gray-400">5-звездочные</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">0</div>
            <div className="text-gray-400">4-звездочные</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">0</div>
            <div className="text-gray-400">Текущая пита</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">История круток</h2>
          <div className="text-gray-400 text-center py-8">
            Загрузите данные для просмотра истории
          </div>
        </div>
        
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">Статистика по баннерам</h2>
          <div className="text-gray-400 text-center py-8">
            Данные будут доступны после загрузки
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
