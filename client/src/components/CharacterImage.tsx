import React, { useEffect, useState, useMemo, useCallback } from 'react'
import ImageWithFallback from './ImageWithFallback'

interface CharacterImageProps {
  itemName: string
  game: 'HSR' | 'Genshin'
  itemType?: string
  className?: string
  alt?: string
  width?: number
  height?: number
  fallbackSrc?: string
}

interface ImageCacheEntry {
  imagePath: string
  englishName: string
  russianName: string
  itemType: string
  rarity: number
  lastAccessed: number
}

interface GameMappings {
  [itemName: string]: ImageCacheEntry
}

// ГЛОБАЛЬНЫЙ КЕШ МАППИНГОВ ДЛЯ МАКСИМАЛЬНОЙ ПРОИЗВОДИТЕЛЬНОСТИ
const globalMappingsCache = new Map<string, GameMappings>()
const cacheTTL = new Map<string, number>() // Время истечения кеша
const CACHE_DURATION = 2 * 60 * 60 * 1000 // 2 часа

// Кеш для блокировки ненужных запросов (предметы без изображений)
const noImageCache = new Set<string>()
const noImageTTL = new Map<string, number>() // Время жизни для noImageCache
const NO_IMAGE_CACHE_DURATION = 30 * 60 * 1000 // 30 минут

// Кеш для загружаемых изображений
const loadingCache = new Set<string>()

// Трекер попыток перезагрузки (чтобы не зациклиться)
const retryAttempts = new Map<string, number>()

// Debug функции для мониторинга
if (typeof window !== 'undefined') {
  (window as any).debugImageCache = {
    getMappingsCache: () => Object.fromEntries(globalMappingsCache),
    getNoImageCache: () => Array.from(noImageCache),
    getLoadingCache: () => Array.from(loadingCache),
    clearCache: () => {
      globalMappingsCache.clear()
      cacheTTL.clear()
      noImageCache.clear()
      noImageTTL.clear()
      loadingCache.clear()
      retryAttempts.clear()
      localStorage.removeItem('hsr_image_mappings')
      localStorage.removeItem('genshin_image_mappings')
    },
    stats: () => ({
      mappingsCacheSize: globalMappingsCache.size,
      noImageCacheSize: noImageCache.size,
      loadingCacheSize: loadingCache.size,
      cacheHits: localStorage.getItem('image_cache_hits') || '0',
      cacheMisses: localStorage.getItem('image_cache_misses') || '0'
    })
  }
}

// Функция принудительного сброса кеша маппингов для игры
const invalidateGameMappingsCache = (game: string) => {
  const cacheKey = game.toLowerCase()
  globalMappingsCache.delete(cacheKey)
  cacheTTL.delete(cacheKey)
  const localStorageKey = `${cacheKey}_image_mappings`
  const versionKey = `${cacheKey}_image_mappings_version`
  localStorage.removeItem(localStorageKey)
  localStorage.removeItem(versionKey)
}

// ФУНКЦИЯ ЗАГРУЗКИ ВСЕХ МАППИНГОВ ДЛЯ ИГРЫ (ОДИН ЗАПРОС)
const loadGameMappings = async (game: string, force: boolean = false): Promise<GameMappings> => {
  const cacheKey = game.toLowerCase()
  const now = Date.now()

  // При force — сбрасываем кеш
  if (force) {
    invalidateGameMappingsCache(game)
  }

  // Проверяем актуальность кеша
  const cacheExpiry = cacheTTL.get(cacheKey)
  if (!force && cacheExpiry && now < cacheExpiry && globalMappingsCache.has(cacheKey)) {
    const hits = parseInt(localStorage.getItem('image_cache_hits') || '0') + 1
    localStorage.setItem('image_cache_hits', hits.toString())
    return globalMappingsCache.get(cacheKey)!
  }

  // Пытаемся загрузить из localStorage если основной кеш устарел
  const localStorageKey = `${game.toLowerCase()}_image_mappings`
  const versionKey = `${game.toLowerCase()}_image_mappings_version`
  const stored = !force ? localStorage.getItem(localStorageKey) : null

  if (stored) {
    try {
      const { data, timestamp } = JSON.parse(stored)
      if (now - timestamp < CACHE_DURATION) {
        globalMappingsCache.set(cacheKey, data)
        cacheTTL.set(cacheKey, now + CACHE_DURATION)
        return data
      }
    } catch (error) {
      console.warn('Failed to parse localStorage cache:', error)
    }
  }

  const misses = parseInt(localStorage.getItem('image_cache_misses') || '0') + 1
  localStorage.setItem('image_cache_misses', misses.toString())

  try {
    const response = await fetch(`/api/items/mappings/${game}${force ? '?force=1' : ''}`)

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`)
    }

    const mappings = await response.json()

    // Проверяем серверную версию кеша
    const serverVersion = response.headers.get('X-Cache-Version')

    // Сохраняем в глобальный кеш
    globalMappingsCache.set(cacheKey, mappings)
    cacheTTL.set(cacheKey, now + CACHE_DURATION)

    // Сохраняем в localStorage вместе с версией
    localStorage.setItem(localStorageKey, JSON.stringify({
      data: mappings,
      timestamp: now,
      version: serverVersion
    }))
    if (serverVersion) {
      localStorage.setItem(versionKey, serverVersion)
    }

    return mappings

  } catch (error) {
    console.error(`Failed to load ${game} mappings:`, error)

    // В случае ошибки пытаемся использовать устаревший кеш
    if (stored) {
      try {
        const { data } = JSON.parse(stored)
        globalMappingsCache.set(cacheKey, data)
        return data
      } catch (parseError) {
        console.error('Failed to use stale cache:', parseError)
      }
    }

    return {}
  }
}

// 🚀 БЫСТРАЯ ПРОВЕРКА НАЛИЧИЯ ИЗОБРАЖЕНИЯ
const hasImagePath = (itemName: string, game: string): string | null => {
  const cacheKey = game.toLowerCase()
  const mappings = globalMappingsCache.get(cacheKey)

  if (!mappings) {
    return null // Кеш не загружен
  }

  // Проверяем блок-лист
  const blockKey = `${game}:${itemName}`
  const blockExpiry = noImageTTL.get(blockKey)
  if (noImageCache.has(blockKey) && blockExpiry && Date.now() < blockExpiry) {
    return null // Точно нет изображения
  }

  // Функция определения языка имени
  const isRussian = (name: string): boolean => {
    return /[а-яё]/i.test(name)
  }

  // Функция поиска маппинга с фаллбеком
  const findMapping = (name: string) => {
    // Сначала ищем по точному совпадению
    let mapping = mappings[name]
    if (mapping?.imagePath) {
      return mapping
    }

    // Если не найдено, пробуем поиск без учета регистра
    const lowerName = name.toLowerCase()
    for (const [key, value] of Object.entries(mappings)) {
      if (key.toLowerCase() === lowerName && value.imagePath) {
        return value
      }
    }

    // Если не найдено, пробуем альтернативный язык
    // Для HSR и Genshin часто есть английские и русские имена
    if (game === 'hsr' || game === 'genshin') {
      if (isRussian(name)) {
        // Если имя русское, ищем английский вариант (упрощённая логика)
        // В будущем можно добавить словарь соответствий
      } else {
        // Если имя английское, ищем русский вариант
        // Простой фаллбек: ищем все маппинги с похожими именами
        for (const [key, value] of Object.entries(mappings)) {
          if (isRussian(key) && value.imagePath) {
            // Для простоты, если есть русское имя с изображением, используем его
            // В будущем можно улучшить логику сопоставления
            return value
          }
        }
      }
    }

    return null
  }

  const mapping = findMapping(itemName)
  if (mapping?.imagePath) {
    // Добавляем префикс для статических изображений
    return mapping.imagePath.startsWith('/images/static/')
      ? mapping.imagePath
      : `/images/static/${mapping.imagePath}`
  }
  return null
}

// ГЛАВНЫЙ КОМПОНЕНТ С МАКСИМАЛЬНОЙ ОПТИМИЗАЦИЕЙ
const CharacterImage: React.FC<CharacterImageProps> = ({
  itemName,
  game,
  itemType,
  className = '',
  alt,
  width = 64,
  height = 64,
  fallbackSrc = '/images/placeholder.svg'
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Мемоизируем ключи для оптимизации
  const cacheKey = useMemo(() => `${game}:${itemName}`, [game, itemName])
  const loadingKey = useMemo(() => `${game}:${itemName}`, [game, itemName])

  // 🚀 ОПТИМИЗИРОВАННАЯ ЗАГРУЗКА ИЗОБРАЖЕНИЯ
  const loadImage = useCallback(async () => {
    if (!itemName) {
      setImageSrc(null)
      return
    }

    // ПЕРВЫЙ ЭТАП: Быстрая проверка кеша
    const cachedPath = hasImagePath(itemName, game)

    if (cachedPath) {
      // Есть изображение в кеше
      setImageSrc(cachedPath)
      setHasError(false)
      return
    }

    // Проверяем блок-лист
    const blockKey = `${game}:${itemName}`
    const blockExpiry = noImageTTL.get(blockKey)
    if (noImageCache.has(blockKey) && blockExpiry && Date.now() < blockExpiry) {
      // Точно нет изображения
      setImageSrc(null)
      setHasError(true)
      return
    }

    // Проверяем, не загружается ли уже это изображение
    if (loadingCache.has(loadingKey)) {
      return
    }

    // ВТОРОЙ ЭТАП: Загрузка маппингов если нужно
    setIsLoading(true)
    loadingCache.add(loadingKey)

    try {
      const mappings = await loadGameMappings(game)
      
      // Ищем маппинг: сначала точное совпадение, потом без учёта регистра
      let mapping = mappings[itemName]
      if (!mapping?.imagePath) {
        const lowerName = itemName.toLowerCase()
        for (const [key, value] of Object.entries(mappings)) {
          if (key.toLowerCase() === lowerName && value.imagePath) {
            mapping = value
            break
          }
        }
      }

      if (mapping?.imagePath) {
        // Добавляем префикс для статических изображений из client/public/images/static
        const fullImagePath = mapping.imagePath.startsWith('/images/static/')
          ? mapping.imagePath
          : `/images/static/${mapping.imagePath}`
        setImageSrc(fullImagePath)
        setHasError(false)
      } else {
        // Добавляем в блок-лист
        noImageCache.add(blockKey)
        noImageTTL.set(blockKey, Date.now() + NO_IMAGE_CACHE_DURATION)
        setImageSrc(null)
        setHasError(true)
      }
    } catch (error) {
      console.error(`Error loading image for ${itemName}:`, error)
      setHasError(true)
      setImageSrc(null)
    } finally {
      setIsLoading(false)
      loadingCache.delete(loadingKey)
    }
  }, [itemName, game, cacheKey, loadingKey])

  useEffect(() => {
    loadImage()
  }, [loadImage])

  // Обработчик ошибки загрузки изображения — пробуем перезагрузить маппинги
  const handleImageError = useCallback(async () => {
    const retryKey = `${game}:${itemName}`
    const attempts = retryAttempts.get(retryKey) || 0
    
    if (attempts < 1) {
      // Первая ошибка — возможно устаревший кеш, перезагрузим маппинги с сервера
      retryAttempts.set(retryKey, attempts + 1)
      console.log(`🔄 Image load failed for ${itemName}, refreshing mappings...`)
      
      // Сбрасываем локальный кеш и загружаем заново с force
      invalidateGameMappingsCache(game)
      // Удаляем из noImageCache чтобы дать шанс
      noImageCache.delete(cacheKey)
      noImageTTL.delete(cacheKey)
      
      try {
        const mappings = await loadGameMappings(game, true)
        
        // Ищем маппинг без учёта регистра
        let mapping = mappings[itemName]
        if (!mapping?.imagePath) {
          const lowerName = itemName.toLowerCase()
          for (const [key, value] of Object.entries(mappings)) {
            if (key.toLowerCase() === lowerName && value.imagePath) {
              mapping = value
              break
            }
          }
        }
        
        if (mapping?.imagePath) {
          const newPath = mapping.imagePath.startsWith('/images/static/')
            ? mapping.imagePath
            : `/images/static/${mapping.imagePath}`
          if (newPath !== imageSrc) {
            setImageSrc(newPath)
            setHasError(false)
            return
          }
        }
      } catch (e) {
        console.error('Failed to refresh mappings:', e)
      }
    }
    
    // Если повторная попытка тоже не помогла — показываем заглушку
    noImageCache.add(cacheKey)
    noImageTTL.set(cacheKey, Date.now() + NO_IMAGE_CACHE_DURATION)
    setHasError(true)
    setImageSrc(fallbackSrc)
  }, [itemName, game, cacheKey, fallbackSrc, imageSrc])

  // Обработчик успешной загрузки
  const handleImageLoad = useCallback(() => {
    setHasError(false)
  }, [itemName])

  // Рендеринг состояний
  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded animate-pulse ${className}`}
        style={{ width, height }}
        title={`Загрузка: ${itemName}`}
      >
        <div className="w-4 h-4 bg-gray-300 rounded"></div>
      </div>
    )
  }

  if (!imageSrc || hasError) {
    return (
      <img
        src={fallbackSrc}
        alt={alt || itemName}
        className={`object-cover rounded transition-opacity duration-200 ${className}`}
        width={width}
        height={height}
        title={`Изображение недоступно: ${itemName}`}
      />
    )
  }

  return (
    <img
      src={imageSrc}
      alt={alt || itemName}
      className={`object-cover rounded transition-opacity duration-200 ${className}`}
      width={width}
      height={height}
      onError={handleImageError}
      onLoad={handleImageLoad}
      loading="lazy"
      title={itemName}
      style={{ opacity: isLoading ? 0.5 : 1 }}
    />
  )
}

export default CharacterImage