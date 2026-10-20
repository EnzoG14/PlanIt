import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import { loadSocialAvatar } from '../features/social/api'
import './social-avatar.css'

export function SocialAvatar({ avatar }: { avatar: string | null }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!avatar) return
    const controller = new AbortController()
    // Drop bytes/URL before its fixed 60s signature expires; no cached renewal.
    const expiry = window.setTimeout(() => { controller.abort(); setUrl(null) }, 55000)
    const timeout = window.setTimeout(() => controller.abort(), 10000)
    void loadSocialAvatar(avatar, controller.signal).then(value => { if (!controller.signal.aborted) setUrl(value) }).catch(() => {}).finally(() => window.clearTimeout(timeout))
    return () => { controller.abort(); window.clearTimeout(expiry); window.clearTimeout(timeout) }
  }, [avatar])
  return <span className="attendee-avatar social-avatar" aria-hidden="true">{url ? <img src={url} alt="" referrerPolicy="no-referrer" onError={() => setUrl(null)} /> : <Icon name="user" />}</span>
}
