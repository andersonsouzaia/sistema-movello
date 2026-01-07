import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  placeholder?: string
  className?: string
}

export function LazyImage({
  src,
  alt,
  placeholder,
  className,
  ...props
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(placeholder || '')
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px',
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (isInView && src) {
      const img = new Image()
      img.src = src
      img.onload = () => {
        setImageSrc(src)
        setIsLoaded(true)
      }
      img.onerror = () => {
        // Manter placeholder em caso de erro
        setIsLoaded(true)
      }
    }
  }, [isInView, src])

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={cn(
        "transition-opacity duration-300",
        isLoaded ? "opacity-100" : "opacity-50",
        className
      )}
      {...props}
    />
  )
}


