import { useState, useEffect } from 'react'
import { resolveMediaUrl } from '../../lib/drive/mediaCache'

interface PhotoThumbnailProps {
  mediaId: string
  className?: string
  alt?: string
}

export function PhotoThumbnail({ mediaId, className, alt = '' }: PhotoThumbnailProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setUrl(null)
    setFailed(false)
    resolveMediaUrl(mediaId).then(u => {
      if (cancelled) return
      if (u) setUrl(u)
      else setFailed(true)
    })
    return () => { cancelled = true }
  }, [mediaId])

  if (failed) return null

  if (!url) {
    return <div className={`animate-pulse bg-elevated dark:bg-elevated-dark ${className ?? ''}`} />
  }

  return <img src={url} alt={alt} className={className} loading="lazy" />
}
