import React, { useState } from 'react'

interface ImageWithFallbackProps {
  src?: string | null
  fallbackSrc?: string
  alt: string
  className?: string
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  fallbackSrc = '/images/placeholder.svg',
  alt,
  className = '',
  onError,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc)
  const [hasError, setHasError] = useState<boolean>(false)

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (!hasError && imgSrc !== fallbackSrc) {
      setHasError(true)
      setImgSrc(fallbackSrc)
    }
    
    if (onError) {
      onError(event)
    }
  }

  // Обновляем src при изменении пропса
  React.useEffect(() => {
    if (src && src !== imgSrc && !hasError) {
      setImgSrc(src)
      setHasError(false)
    }
  }, [src])

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  )
}

export default ImageWithFallback
