import React from 'react'
import ImageWithFallback from './ImageWithFallback'

interface BannerImageProps {
  bannerName: string
  imagePath?: string | null
  className?: string
  aspectRatio?: 'wide' | 'square' | 'banner'
}

const BannerImage: React.FC<BannerImageProps> = ({
  bannerName,
  imagePath,
  className = '',
  aspectRatio = 'banner'
}) => {
  // Определяем классы для пропорций
  const aspectClasses = {
    wide: 'aspect-video', // 16:9
    square: 'aspect-square', // 1:1
    banner: 'aspect-[3/1]' // 3:1 для баннеров
  }

  // Формируем путь к изображению баннера
  const getImageSrc = (): string | null => {
    if (imagePath) {
      // Если путь начинается с /, то это уже полный путь
      if (imagePath.startsWith('/')) {
        return imagePath
      }
      // Иначе добавляем префикс для статических изображений
      return `/images/static/${imagePath}`
    }
    return null
  }

  const finalClassName = `${aspectClasses[aspectRatio]} w-full object-cover ${className}`

  return (
    <ImageWithFallback
      src={getImageSrc()}
      alt={bannerName}
      className={finalClassName}
      fallbackSrc="/images/placeholder.svg"
    />
  )
}

export default BannerImage
