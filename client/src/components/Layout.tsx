import { ReactNode, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface LayoutProps {
  children: ReactNode
}

/* ===== SVG Icons — thematic gacha-style ===== */
const Icons = {
  /* Компас / портал — главная */
  home: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88" fill="currentColor" opacity={0.25} stroke="none" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88" />
    </svg>
  ),
  /* Гача-кристалл — панель */
  dashboard: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity={0.15} stroke="none" />
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  /* Свиток импорта — загрузка */
  upload: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <polyline points="9 15 12 12 15 15" />
    </svg>
  ),
  /* Звёздная диаграмма — статистика */
  stats: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
      <circle cx="18" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="4" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="6" cy="14" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  /* Щит-корона — админ */
  admin: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  /* Ключ — вход */
  login: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  ),
  /* Дверь — выход */
  logout: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  /* Звезда + пользователь — регистрация */
  register: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  ),
  close: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  github: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  ),
}

/* ===== Ambient Dots — JS-driven smooth random motion via layered sine waves ===== */
const DOT_CONFIGS = [
  { x: 5, y: 8, size: 2 },   { x: 18, y: 22, size: 1.5 },
  { x: 35, y: 6, size: 2.5 }, { x: 52, y: 35, size: 1 },
  { x: 70, y: 12, size: 2 },  { x: 85, y: 28, size: 1.5 },
  { x: 95, y: 7, size: 2.5 }, { x: 10, y: 48, size: 1 },
  { x: 28, y: 55, size: 1.5 },{ x: 45, y: 62, size: 2 },
  { x: 65, y: 50, size: 2.5 },{ x: 80, y: 58, size: 1 },
  { x: 92, y: 45, size: 2 },  { x: 8, y: 75, size: 1.5 },
  { x: 22, y: 82, size: 2 },  { x: 42, y: 88, size: 2.5 },
  { x: 58, y: 78, size: 1 },  { x: 75, y: 85, size: 1.5 },
  { x: 90, y: 72, size: 2 },  { x: 3, y: 95, size: 1.5 },
] as const

// Generate unique sine-wave parameters per dot (deterministic from index)
function makeSineParams(index: number) {
  // Pseudo-random seed from index — gives unique but deterministic values
  const s = (n: number) => Math.sin(index * 127.1 + n * 311.7) * 0.5 + 0.5
  return {
    // 3 sine layers for X, each with unique freq/phase/amplitude
    xFreqs:  [0.13 + s(0) * 0.09, 0.07 + s(1) * 0.06, 0.03 + s(2) * 0.04],
    xPhases: [s(3) * Math.PI * 2, s(4) * Math.PI * 2, s(5) * Math.PI * 2],
    xAmps:   [25 + s(6) * 20, 14 + s(7) * 12, 8 + s(8) * 8],
    // 3 sine layers for Y
    yFreqs:  [0.11 + s(9) * 0.08, 0.06 + s(10) * 0.05, 0.025 + s(11) * 0.035],
    yPhases: [s(12) * Math.PI * 2, s(13) * Math.PI * 2, s(14) * Math.PI * 2],
    yAmps:   [22 + s(15) * 18, 12 + s(16) * 10, 7 + s(17) * 7],
    // opacity oscillation
    opFreq:  0.04 + s(18) * 0.06,
    opPhase: s(19) * Math.PI * 2,
    opBase:  0.65,
    opAmp:   0.25,
    // scale breathing
    scFreq:  0.05 + s(20) * 0.04,
    scPhase: s(21) * Math.PI * 2,
    scAmp:   0.12,
  }
}

const AmbientDots = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const dotRefs = useRef<(HTMLDivElement | null)[]>([])
  const rafRef = useRef<number>(0)

  // Pre-compute sine params for all dots (stable across renders)
  const allParams = useMemo(() => DOT_CONFIGS.map((_, i) => makeSineParams(i)), [])

  const animate = useCallback((time: number) => {
    const t = time * 0.001 // seconds
    for (let i = 0; i < DOT_CONFIGS.length; i++) {
      const el = dotRefs.current[i]
      if (!el) continue
      const p = allParams[i]
      // Sum 3 sine waves per axis → complex non-repeating path
      const dx = p.xAmps[0] * Math.sin(p.xFreqs[0] * t + p.xPhases[0])
               + p.xAmps[1] * Math.sin(p.xFreqs[1] * t + p.xPhases[1])
               + p.xAmps[2] * Math.sin(p.xFreqs[2] * t + p.xPhases[2])
      const dy = p.yAmps[0] * Math.sin(p.yFreqs[0] * t + p.yPhases[0])
               + p.yAmps[1] * Math.sin(p.yFreqs[1] * t + p.yPhases[1])
               + p.yAmps[2] * Math.sin(p.yFreqs[2] * t + p.yPhases[2])
      const sc = 1 + p.scAmp * Math.sin(p.scFreq * t + p.scPhase)
      const op = p.opBase + p.opAmp * Math.sin(p.opFreq * t + p.opPhase)
      el.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${sc.toFixed(3)})`
      el.style.opacity = op.toFixed(3)
    }
    rafRef.current = requestAnimationFrame(animate)
  }, [allParams])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [animate])

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {DOT_CONFIGS.map((dot, i) => {
        const glow = dot.size > 2 ? 0.7 : dot.size > 1.5 ? 0.55 : 0.4
        return (
          <div
            key={`dot-${i}`}
            ref={el => { dotRefs.current[i] = el }}
            className="absolute rounded-full will-change-transform"
            style={{
              width: `${dot.size * 4}px`,
              height: `${dot.size * 4}px`,
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              backgroundColor: `rgba(155, 31, 226, ${glow})`,
              boxShadow: `0 0 ${dot.size * 8}px ${dot.size * 3}px rgba(155, 31, 226, ${glow}), 0 0 ${dot.size * 16}px ${dot.size * 6}px rgba(155, 31, 226, ${glow * 0.5})`,
            }}
          />
        )
      })}
    </div>
  )
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()
  const { user, logout, isAuthenticated } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Блокировка скролла при открытом меню
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMobileMenuOpen])

  const navigation = [
    { name: 'Главная', href: '/', icon: Icons.home },
    { name: 'Панель', href: '/dashboard', icon: Icons.dashboard, protected: true },
    { name: 'Загрузка', href: '/upload', icon: Icons.upload, protected: true },
    { name: 'Статистика', href: '/statistics', icon: Icons.stats, protected: true },
  ]
  
  const adminNavigation = [
    { name: 'Админка', href: '/admin', icon: Icons.admin, admin: true }
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== GLOBAL AMBIENT DOTS — JS-animated smooth random motion ===== */}
      <AmbientDots />
      {/* ===== NAVBAR ===== */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled ? 'nav-glass shadow-lg shadow-black/20 border-white/[0.06]' : 'bg-transparent border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-animate-cosmic">
                  Gacha Tracker
                </span>
                <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-gray-500 group-hover:text-accent-cyan/60 transition-colors duration-300">
                  HSR • Genshin
                </span>
              </div>
            </Link>
            
            {/* Desktop nav */}
            <div className="hidden md:flex items-center space-x-1">
              {navigation
                .filter(item => !item.protected || isAuthenticated)
                .map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'text-accent-cyan bg-accent-cyan/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={isActive(item.href) ? 'text-accent-cyan' : ''}>{item.icon}</span>
                  <span>{item.name}</span>
                  {isActive(item.href) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-transparent via-accent-cyan to-transparent rounded-full" />
                  )}
                </Link>
              ))}
              
              {isAuthenticated && user?.role === 'ADMIN' && (
                adminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(item.href)
                        ? 'text-star-purple bg-star-purple/10'
                        : 'text-purple-400/70 hover:text-star-purple-light hover:bg-star-purple/5'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                    {isActive(item.href) && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-transparent via-star-purple to-transparent rounded-full" />
                    )}
                  </Link>
                ))
              )}
            </div>

            {/* Desktop auth */}
            <div className="hidden md:flex items-center space-x-3">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <Link to="/profile" className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/8 hover:border-accent-cyan/20 transition-all duration-200 cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-accent-cyan animate-glow-pulse" />
                    <span className="text-sm text-gray-400">
                      <span className="text-accent-cyan font-medium">{user?.username}</span>
                    </span>
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center space-x-1.5 text-gray-500 hover:text-red-400 px-3 py-2 rounded-lg text-sm transition-colors duration-200 hover:bg-red-500/5"
                  >
                    {Icons.logout}
                    <span>Выйти</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="flex items-center space-x-1.5 text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/5"
                  >
                    {Icons.login}
                    <span>Войти</span>
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-medium text-accent-cyan bg-accent-cyan/10 border border-accent-cyan/20 hover:bg-accent-cyan/15 hover:border-accent-cyan/30 transition-all duration-200"
                  >
                    {Icons.register}
                    <span>Регистрация</span>
                  </Link>
                </div>
              )}
            </div>
            
            {/* Mobile burger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-label="Открыть главное меню"
              className="md:hidden relative w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <div className="w-5 h-5 flex flex-col justify-center items-center">
                <span className={`block w-4 h-[1.5px] bg-current transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-[3px]' : '-translate-y-1'}`} />
                <span className={`block w-4 h-[1.5px] bg-current transition-all duration-200 ${isMobileMenuOpen ? 'opacity-0 scale-0' : 'opacity-100'}`} />
                <span className={`block w-4 h-[1.5px] bg-current transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-[3px]' : 'translate-y-1'}`} />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* ===== MOBILE MENU ===== */}
      {/* Overlay */}
      <div
        onClick={() => setIsMobileMenuOpen(false)}
        className={`md:hidden fixed inset-0 z-[998] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel */}
      <aside
        className={`md:hidden fixed top-0 right-0 h-full w-[300px] z-[999] transition-transform duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, rgba(10,10,26,0.98) 0%, rgba(5,5,16,0.99) 100%)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
        }}
        role="dialog"
        aria-modal="true"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-5 py-5 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div>
                  <div className="text-base font-extrabold tracking-tight text-animate-cosmic">Gacha Tracker</div>
                  <div className="text-[11px] text-gray-500 font-medium tracking-wide uppercase">Меню</div>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
                aria-label="Закрыть меню"
              >
                {Icons.close}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {navigation
                .filter(item => !item.protected || isAuthenticated)
                .map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'text-accent-cyan bg-accent-cyan/10 border border-accent-cyan/15'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className={isActive(item.href) ? 'text-accent-cyan' : 'text-gray-500'}>{item.icon}</span>
                  <span>{item.name}</span>
                  {isActive(item.href) && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-cyan" />
                  )}
                </Link>
              ))}

              {isAuthenticated && user?.role === 'ADMIN' && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider px-4 mb-2">
                    Администрирование
                  </div>
                  {adminNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all duration-200 ${
                        isActive(item.href)
                          ? 'text-star-purple bg-star-purple/10 border border-star-purple/15'
                          : 'text-purple-400/60 hover:text-star-purple-light hover:bg-star-purple/5 border border-transparent'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                      {isActive(item.href) && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-star-purple" />
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Footer */}
          <div className="mt-auto px-4 py-4 border-t border-white/5">
            {isAuthenticated ? (
              <div className="space-y-3">
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl bg-white/3 border border-white/5 hover:bg-white/8 hover:border-accent-cyan/20 transition-all duration-200">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan/20 to-star-purple/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-accent-cyan">{user?.username?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{user?.username}</div>
                    <div className="text-[11px] text-gray-500">ID: {user?.uid}</div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-accent-cyan" />
                </Link>
                <button
                  onClick={() => { logout(); setIsMobileMenuOpen(false) }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400/80 bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                >
                  {Icons.logout}
                  <span>Выйти из системы</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 bg-white/5 border border-white/8 hover:bg-white/8 transition-all duration-200"
                >
                  {Icons.login}
                  <span>Войти</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-void-900 bg-gradient-to-r from-accent-cyan to-cyan-500 shadow-glow-cyan/30 hover:shadow-glow-cyan transition-all duration-200"
                >
                  {Icons.register}
                  <span>Регистрация</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 pt-16">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="mt-auto border-t border-white/5">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-cyan to-star-purple-light">
                GT
              </span>
              <span className="text-sm text-gray-500">&copy; 2025–2026 Gacha Tracker</span>
            </div>
            <p className="text-xs text-gray-600 text-center">
              Данные предоставляются через официальное API игры
            </p>
            <a
              href="https://github.com/Enable-V/gasha-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 text-gray-500 hover:text-white transition-colors duration-200"
              aria-label="GitHub"
            >
              {Icons.github}
              <span className="text-sm">GitHub</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
