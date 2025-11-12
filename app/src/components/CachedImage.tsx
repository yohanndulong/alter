import React, { useState, useEffect } from 'react'
import { imageCache } from '@/services/imagePreloader'

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  fallback?: React.ReactNode
  disableCache?: boolean // Pour les photos éphémères ("once")
}

/**
 * Composant Image avec cache automatique
 * Les images sont cachées par leur ID (sans les paramètres de signature)
 */
export const CachedImage: React.FC<CachedImageProps> = ({
  src,
  alt,
  fallback,
  disableCache = false,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!src) {
      setIsLoading(false)
      return
    }

    // Si cache désactivé (photos éphémères), charger directement sans cache
    if (disableCache) {
      setImageSrc(src)
      setIsLoading(false)
      setHasError(false)
      return
    }

    // Vérifier si l'image est en cache
    const cachedImage = imageCache.getFromCache(src)
    if (cachedImage) {
      setImageSrc(cachedImage)
      setIsLoading(false)
      setHasError(false)
      return
    }

    // Charger l'image
    setIsLoading(true)
    setHasError(false)

    imageCache.loadImage(src)
      .then(dataUrl => {
        setImageSrc(dataUrl)
        setIsLoading(false)
      })
      .catch(error => {
        console.error('Failed to load image:', error)
        setHasError(true)
        setIsLoading(false)
      })
  }, [src, disableCache])

  if (hasError && fallback) {
    return <>{fallback}</>
  }

  if (hasError) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f0f0f0',
          color: '#999',
          ...props.style
        }}
      >
        {alt || 'Image'}
      </div>
    )
  }

  return (
    <>
      {isLoading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f0f0f0',
            ...props.style
          }}
        >
          <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
        </div>
      )}
      {imageSrc && (
        <img
          {...props}
          src={imageSrc}
          alt={alt}
          style={{ display: isLoading ? 'none' : 'block', ...props.style }}
        />
      )}
    </>
  )
}
