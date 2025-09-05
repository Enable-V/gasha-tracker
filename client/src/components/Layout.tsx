import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()

  const navigation = [
    { name: 'Главная', href: '/', icon: '🏠' },
    { name: 'Панель управления', href: '/dashboard', icon: '📊' },
    { name: 'Загрузка данных', href: '/upload', icon: '⬆️' },
    { name: 'Статистика', href: '/statistics', icon: '⭐' },
    { name: 'Тест', href: '/test', icon: '🧪' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gradient-to-br from-hsr-dark to-hsr-darker">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link to="/" className="flex items-center space-x-2">
                  <span className="text-2xl">⭐</span>
                  <span className="text-xl font-bold text-white">HSR Gacha Tracker</span>
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        isActive(item.href)
                          ? 'bg-hsr-gold/20 text-hsr-gold'
                          : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      } px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-all duration-200`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-md border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400 text-sm">
            <p>© 2025 HSR Gacha Tracker. Создано для трекинга круток Honkai Star Rail.</p>
            <p className="mt-1">Данные предоставляются через официальное API игры.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
