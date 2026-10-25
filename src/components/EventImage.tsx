import { useState, type ReactNode } from 'react'
import './event-image.css'

type Props = {
  src: string | null | undefined
  alt: string
  loading?: 'eager' | 'lazy'
  fallback?: ReactNode
  onError?: () => void
}

/** Each source owns its load state, including renewed signed URLs and blob previews. */
export function EventImage(props: Props) {
  return <ImageSource key={props.src} {...props} />
}

function ImageSource({ src, alt, loading = 'lazy', fallback, onError }: Props) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  if (!src || status === 'error') return <>{fallback ?? <span className="event-image-unavailable" role="status">Foto no disponible.</span>}</>
  return <img className="event-image" src={src} alt={alt} loading={loading}
    data-image-state={status} onLoad={() => setStatus('loaded')}
    onError={() => { setStatus('error'); onError?.() }} />
}
