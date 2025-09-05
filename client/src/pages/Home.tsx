const Home = () => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-5xl font-bold text-white mb-4 animate-pulse">
          HSR Gacha Tracker
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Профессиональный трекер круток для Honkai Star Rail. 
          Отслеживайте свою статистику, анализируйте удачу и не пропускайте важные моменты!
        </p>
        <div className="flex justify-center space-x-4">
          <a href="/upload" className="btn-primary">
            Начать отслеживание
          </a>
          <a href="/dashboard" className="btn-secondary">
            Посмотреть дашборд
          </a>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-white mb-2">Детальная статистика</h3>
            <p className="text-gray-400">
              Полная статистика ваших круток с разбивкой по баннерам, редкости и времени
            </p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-white mb-2">Трекинг питы</h3>
            <p className="text-gray-400">
              Отслеживание счетчика гарантии для каждого типа банера
            </p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="text-center">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-lg font-semibold text-white mb-2">Анализ удачи</h3>
            <p className="text-gray-400">
              Графики и диаграммы для понимания ваших показателей удачи
            </p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="card">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Как это работает</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-hsr-gold/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-hsr-gold font-bold">1</span>
            </div>
            <h3 className="font-semibold text-white mb-2">Получите ссылку</h3>
            <p className="text-gray-400 text-sm">
              Используйте PowerShell скрипт для получения ссылки на историю круток
            </p>
          </div>
          <div className="text-center">
            <div className="bg-hsr-gold/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-hsr-gold font-bold">2</span>
            </div>
            <h3 className="font-semibold text-white mb-2">Загрузите данные</h3>
            <p className="text-gray-400 text-sm">
              Вставьте ссылку в форму загрузки для импорта истории круток
            </p>
          </div>
          <div className="text-center">
            <div className="bg-hsr-gold/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-hsr-gold font-bold">3</span>
            </div>
            <h3 className="font-semibold text-white mb-2">Анализируйте</h3>
            <p className="text-gray-400 text-sm">
              Изучайте статистику, планируйте крутки и отслеживайте прогресс
            </p>
          </div>
        </div>
      </div>

      {/* PowerShell command */}
      <div className="card">
        <h2 className="text-2xl font-bold text-white mb-4">Команда для получения ссылки</h2>
        <div className="bg-black/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <code className="text-green-400">
            {`Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex "&{$((New-Object System.Net.WebClient).DownloadString('https://gist.githubusercontent.com/MadeBaruna/e017637fbc6c72d47d72ba42dfb2477b/raw/hsr_getlink.ps1'))}"`}
          </code>
        </div>
        <p className="text-gray-400 text-sm mt-2">
          Запустите эту команду в PowerShell после закрытия игры для получения ссылки на историю круток
        </p>
      </div>
    </div>
  )
}

export default Home
