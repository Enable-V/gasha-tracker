import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  const [scrollY, setScrollY] = useState(0)
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="relative space-y-20 py-4 overflow-hidden">
      {/* ===== HERO ===== */}
      <section ref={heroRef} className="relative text-center py-12 md:py-24 overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
        {/* Decorative orbs with parallax — different speeds create depth */}
        <div
          className="absolute top-10 left-[10%] w-80 h-80 rounded-full bg-accent-cyan/8 blur-[120px] pointer-events-none"
          style={{ transform: `translateY(${scrollY * -0.12}px)` }}
        />
        <div
          className="absolute bottom-5 right-[8%] w-96 h-96 rounded-full bg-star-purple/8 blur-[140px] pointer-events-none"
          style={{ transform: `translateY(${scrollY * -0.08}px)` }}
        />
        <div
          className="absolute top-1/3 right-[25%] w-60 h-60 rounded-full bg-accent-pink/5 blur-[100px] pointer-events-none"
          style={{ transform: `translateY(${scrollY * -0.18}px)` }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-4">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-accent-cyan animate-glow-pulse" />
            <span className="text-sm font-medium text-gray-400">Honkai Star Rail & Genshin Impact</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-8xl font-extrabold mb-6 leading-none tracking-tight animate-slide-up">
            <span className="text-animate-cosmic">Gacha Tracker</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Один аккаунт для Honkai Star Rail и&nbsp;Genshin Impact — статистика хранится навсегда и&nbsp;не&nbsp;сбрасывается через полгода
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Link to="/upload" className="btn-primary w-full sm:w-auto text-center flex items-center justify-center gap-2 px-8 py-3.5 text-base">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Начать отслеживание
            </Link>
            <Link to="/dashboard" className="btn-secondary w-full sm:w-auto text-center flex items-center justify-center gap-2 px-8 py-3.5 text-base">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Дашборд
            </Link>
          </div>
        </div>

      </section>

      {/* ===== GAME SHOWCASE — parallax cards ===== */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 md:px-0">
        {/* Honkai Star Rail */}
        <div className="group relative overflow-hidden rounded-2xl border border-accent-cyan/15 hover:border-accent-cyan/30 transition-all duration-500 hover:shadow-glow-cyan">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/5 via-transparent to-transparent" />
          {/* Parallax background */}
          <div
            className="absolute inset-0 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity duration-700"
            style={{ transform: `translateY(${Math.max(0, (scrollY - 200) * 0.08)}px)` }}
          >
            <img
              src="/images/static/home/march7th.jpg"
              alt=""
              className="w-full h-full object-cover scale-125"
              loading="lazy"
            />
          </div>
          <div className="relative p-8 md:p-10">
            <div className="flex items-center space-x-4 mb-6">
              <img src="/images/static/games/hsr_icon.svg" alt="Honkai Star Rail" className="w-14 h-14 rounded-xl shadow-glow-cyan group-hover:scale-110 transition-transform duration-300" />
              <div>
                <h3 className="text-xl font-bold text-white">Honkai Star Rail</h3>
                <p className="text-sm text-accent-cyan/60">Межгалактическое приключение</p>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-gray-400 mb-6">
              <li className="flex items-center space-x-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan/60" />
                <span>Статистика по баннерам Прыжка</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan/60" />
                <span>Трекинг световых конусов</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan/60" />
                <span>Анализ pity и гарантии</span>
              </li>
            </ul>
            <Link to="/upload?game=hsr" className="inline-flex items-center space-x-2 text-accent-cyan text-sm font-medium group-hover:translate-x-1 transition-transform duration-300">
              <span>Начать импорт</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
        </div>

        {/* Genshin Impact */}
        <div className="group relative overflow-hidden rounded-2xl border border-star-purple/15 hover:border-star-purple/30 transition-all duration-500 hover:shadow-glow-purple">
          <div className="absolute inset-0 bg-gradient-to-br from-star-purple/5 via-transparent to-transparent" />
          {/* Parallax background with actual game art */}
          <div
            className="absolute inset-0 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity duration-700"
            style={{ transform: `translateY(${Math.max(0, (scrollY - 200) * 0.1)}px)` }}
          >
            <img
              src="/images/static/home/nahida%20hutao.png"
              alt=""
              className="w-full h-full object-cover scale-125"
              loading="lazy"
            />
          </div>
          <div className="relative p-8 md:p-10">
            <div className="flex items-center space-x-4 mb-6">
              <img src="/images/static/games/genshin_icon.svg" alt="Genshin Impact" className="w-14 h-14 rounded-xl shadow-glow-purple group-hover:scale-110 transition-transform duration-300" />
              <div>
                <h3 className="text-xl font-bold text-white">Genshin Impact</h3>
                <p className="text-sm text-star-purple-light/60">Мир Тейвата ждёт</p>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-gray-400 mb-6">
              <li className="flex items-center space-x-3">
                <span className="w-1.5 h-1.5 rounded-full bg-star-purple-light/60" />
                <span>Статистика по баннерам Молитв</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="w-1.5 h-1.5 rounded-full bg-star-purple-light/60" />
                <span>Трекинг оружия и персонажей</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="w-1.5 h-1.5 rounded-full bg-star-purple-light/60" />
                <span>Анализ pity и гарантии</span>
              </li>
            </ul>
            <Link to="/upload?game=genshin" className="inline-flex items-center space-x-2 text-star-purple-light text-sm font-medium group-hover:translate-x-1 transition-transform duration-300">
              <span>Начать импорт</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-0">
        {[
          {
            icon: (
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
            title: 'Детальная статистика',
            desc: 'Полная аналитика круток с разбивкой по баннерам, редкости и периодам времени',
            color: 'accent-cyan',
            glow: 'group-hover:shadow-glow-cyan',
            borderRgba: 'rgba(34,211,238,0.15)',
            iconBg: 'rgba(34,211,238,0.1)',
            iconBorder: 'rgba(34,211,238,0.1)',
            iconColor: '#22d3ee',
          },
          {
            icon: (
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            ),
            title: 'Трекинг питы',
            desc: 'Отслеживание счётчика гарантии для каждого типа баннера в реальном времени',
            color: 'star-purple',
            glow: 'group-hover:shadow-glow-purple',
            borderRgba: 'rgba(168,85,247,0.15)',
            iconBg: 'rgba(168,85,247,0.1)',
            iconBorder: 'rgba(168,85,247,0.1)',
            iconColor: '#a855f7',
          },
          {
            icon: (
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            ),
            title: 'Анализ удачи',
            desc: 'Визуализация данных для понимания ваших показателей и планирования стратегии',
            color: 'star-blue',
            glow: 'group-hover:shadow-glow-blue',
            borderRgba: 'rgba(59,130,246,0.15)',
            iconBg: 'rgba(59,130,246,0.1)',
            iconBorder: 'rgba(59,130,246,0.1)',
            iconColor: '#3b82f6',
          },
        ].map((feature, i) => (
          <div
            key={i}
            className={`group text-center transition-all duration-400 ${feature.glow} relative rounded-xl p-6 backdrop-blur-[12px]`}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${feature.borderRgba}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-5 mx-auto transition-all duration-300"
              style={{
                background: feature.iconBg,
                color: feature.iconColor,
                border: `1px solid ${feature.iconBorder}`,
              }}
            >
              {feature.icon}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </section>

      {/* ===== KEY ADVANTAGE — SEO block ===== */}
      <section className="relative rounded-2xl overflow-hidden mx-4 md:mx-0">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/5 via-transparent to-star-purple/5" />
        <div className="relative p-8 md:p-12" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1rem' }}>
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 mb-6">
              <svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              <span className="text-sm font-medium text-accent-cyan">Главное преимущество</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Один аккаунт — две игры,<br className="hidden md:block" /> вечное хранение
            </h2>
            <p className="text-gray-400 leading-relaxed mb-8">
              Единый аккаунт для Honkai Star Rail и Genshin Impact — вся статистика круток в&nbsp;одном месте. В&nbsp;отличие от&nbsp;игровой истории, которая сбрасывается через 6&nbsp;месяцев, наш сервис <span className="text-white font-medium">хранит ваши данные навсегда</span>. Никаких потерь — вся история с&nbsp;первого дня доступна в&nbsp;любой момент.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(34,211,238,0.1)' }}>
                <div className="text-2xl font-bold text-accent-cyan mb-1">2 игры</div>
                <div className="text-gray-500 text-sm">Один аккаунт</div>
              </div>
              <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,85,247,0.1)' }}>
                <div className="text-2xl font-bold text-star-purple-light mb-1">∞</div>
                <div className="text-gray-500 text-sm">Срок хранения</div>
              </div>
              <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(34,211,238,0.1)' }}>
                <div className="text-2xl font-bold text-accent-cyan mb-1">100%</div>
                <div className="text-gray-500 text-sm">Полная история</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="mx-4 md:mx-0">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full mb-4" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)' }}>
            <svg className="w-4 h-4" style={{ color: '#a855f7' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <span className="text-sm font-medium" style={{ color: '#a855f7' }}>Быстрый старт</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Как это работает</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              num: '01',
              title: 'Получите ссылку',
              desc: 'Запустите PowerShell скрипт для получения ссылки на историю круток',
              iconColor: '#22d3ee',
              borderColor: 'rgba(34,211,238,0.12)',
              bgColor: 'rgba(34,211,238,0.06)',
              icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" /></svg>,
            },
            {
              num: '02',
              title: 'Загрузите данные',
              desc: 'Вставьте ссылку в форму загрузки для импорта всей истории',
              iconColor: '#a855f7',
              borderColor: 'rgba(168,85,247,0.12)',
              bgColor: 'rgba(168,85,247,0.06)',
              icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>,
            },
            {
              num: '03',
              title: 'Анализируйте',
              desc: 'Изучайте статистику, планируйте крутки и отслеживайте прогресс',
              iconColor: '#3b82f6',
              borderColor: 'rgba(59,130,246,0.12)',
              bgColor: 'rgba(59,130,246,0.06)',
              icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
            },
          ].map((step, i) => (
            <div
              key={i}
              className="relative rounded-xl p-6 transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${step.borderColor}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              }}
            >
              {/* Step number — top right */}
              <div className="absolute top-4 right-4 text-xs font-bold tracking-wider" style={{ color: step.iconColor, opacity: 0.3 }}>{step.num}</div>

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: step.bgColor, color: step.iconColor, border: `1px solid ${step.borderColor}` }}
              >
                {step.icon}
              </div>

              <h3 className="font-semibold text-white mb-2 text-base">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>

              {/* Arrow connector (desktop only, not on last) */}
              {i < 2 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ===== JSON IMPORT — SEO block ===== */}
      <section className="mx-4 md:mx-0">
        <div className="relative rounded-xl p-6 md:p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(251,191,36,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.12)', color: '#fbbf24' }}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Импорт через JSON</h2>
              <p className="text-gray-400 text-sm">Альтернативный способ загрузки круток без PowerShell скрипта</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* HSR — pom.moe */}
            <div className="rounded-xl p-5" style={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.1)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: '#a855f7' }} />
                <span className="text-sm font-semibold" style={{ color: '#a855f7' }}>Honkai Star Rail</span>
              </div>
              <ol className="space-y-2 text-sm text-gray-400">
                <li className="flex gap-2">
                  <span className="font-mono text-xs mt-0.5 shrink-0" style={{ color: '#a855f7', opacity: 0.6 }}>1.</span>
                  <span>Перейдите на <a href="https://pom.moe/" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-2 transition-colors" style={{ color: '#c084fc' }}>pom.moe</a></span>
                </li>
                <li className="flex gap-2">
                  <span className="font-mono text-xs mt-0.5 shrink-0" style={{ color: '#a855f7', opacity: 0.6 }}>2.</span>
                  <span>Откройте <span className="text-white/70">Настройки аккаунта</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="font-mono text-xs mt-0.5 shrink-0" style={{ color: '#a855f7', opacity: 0.6 }}>3.</span>
                  <span>Нажмите <span className="text-white/70">«Выгрузить данные»</span> и скачайте JSON-файл</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-mono text-xs mt-0.5 shrink-0" style={{ color: '#a855f7', opacity: 0.6 }}>4.</span>
                  <span>Загрузите файл на странице <span className="text-white/70">«Загрузка»</span></span>
                </li>
              </ol>
            </div>

            {/* Genshin — paimon.moe */}
            <div className="rounded-xl p-5" style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.1)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: '#22d3ee' }} />
                <span className="text-sm font-semibold" style={{ color: '#22d3ee' }}>Genshin Impact</span>
              </div>
              <ol className="space-y-2 text-sm text-gray-400">
                <li className="flex gap-2">
                  <span className="font-mono text-xs mt-0.5 shrink-0" style={{ color: '#22d3ee', opacity: 0.6 }}>1.</span>
                  <span>Перейдите на <a href="https://paimon.moe/" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-2 transition-colors" style={{ color: '#67e8f9' }}>paimon.moe</a></span>
                </li>
                <li className="flex gap-2">
                  <span className="font-mono text-xs mt-0.5 shrink-0" style={{ color: '#22d3ee', opacity: 0.6 }}>2.</span>
                  <span>Откройте <span className="text-white/70">Настройки</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="font-mono text-xs mt-0.5 shrink-0" style={{ color: '#22d3ee', opacity: 0.6 }}>3.</span>
                  <span>Нажмите <span className="text-white/70">«Скачать данные»</span> и сохраните JSON-файл</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-mono text-xs mt-0.5 shrink-0" style={{ color: '#22d3ee', opacity: 0.6 }}>4.</span>
                  <span>Загрузите файл на странице <span className="text-white/70">«Загрузка»</span></span>
                </li>
              </ol>
            </div>
          </div>

          <p className="text-gray-500 text-xs mt-5 flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            JSON-импорт удобен, если у&nbsp;вас уже есть сохранённые данные на&nbsp;сторонних трекерах. Поддерживается формат экспорта pom.moe и&nbsp;paimon.moe.
          </p>
        </div>
      </section>

      {/* ===== POWERSHELL ===== */}
      <section className="card mx-4 md:mx-0">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.12)', color: '#22d3ee' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Команды для получения ссылки</h2>
        </div>

        <div className="space-y-5">
          {[
            { game: 'Honkai Star Rail', color: 'star-purple', script: 'hsr_getlink.ps1' },
            { game: 'Genshin Impact', color: 'accent-cyan', script: 'get-genshin-url.ps1' },
          ].map((item) => (
            <div key={item.game}>
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-2 h-2 rounded-full bg-${item.color}`} />
                <h3 className={`text-sm font-semibold text-${item.color}`}>{item.game}</h3>
              </div>
              <div className="relative group rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-void-950 to-void-900 opacity-90" />
                <div className={`absolute inset-0 bg-${item.color}/3`} />
                <pre className="relative p-4 overflow-x-auto">
                  <code className="font-mono text-xs md:text-sm text-accent-cyan whitespace-pre-wrap break-all">
{`Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex "&{$((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Enable-V/gasha-tracker/main/scripts/${item.script}'))}"`}
                  </code>
                </pre>
              </div>
            </div>
          ))}
        </div>

        <p className="text-gray-500 text-sm mt-5 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Запустите команду в PowerShell после закрытия игры для получения ссылки на историю круток
        </p>
      </section>
    </div>
  )
}

export default Home
