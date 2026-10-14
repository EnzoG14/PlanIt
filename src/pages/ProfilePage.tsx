import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../features/auth/useAuth'
import { supabase } from '../lib/supabase'
import './profile.css'

type OwnProfile = { display_name: string; username: string; bio: string | null; avatar_file_id: string | null }
type ProfileResult = { profile: OwnProfile; avatarUrl: string | null } | { error: true }

export function ProfilePage() {
  const { session } = useAuth()
  // A new identity/token gets fresh state, including signed URLs and pending requests.
  return session ? <OwnProfileView key={`${session.user.id}:${session.access_token}`} userId={session.user.id} email={session.user.email} /> : null
}

function OwnProfileView({ userId, email }: { userId: string; email?: string }) {
  const location = useLocation()
  const interestsLink = useRef<HTMLAnchorElement>(null)
  useEffect(() => {
    if (!location.state?.focusInterests) return
    // Restore the trigger after AppLayout applies its route-level main focus.
    const frame = window.requestAnimationFrame(() => interestsLink.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [location.key, location.state])
  const [result, setResult] = useState<ProfileResult | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const refresh = () => { setResult(null); setAvatarFailed(false); setAttempt(value => value + 1) }
  useEffect(() => { document.title = 'Mi perfil · PlanIt' }, [])
  useEffect(() => {
    let active = true
    let revision = 0
    const client = supabase
    async function load() {
      const request = ++revision
      setResult(null)
      setAvatarFailed(false)
      try {
        if (!client) throw new Error('Session unavailable')
        const { data, error } = await client.from('profiles')
          .select('display_name, username, bio, avatar_file_id').eq('id', userId).single()
        if (error || !data || typeof data.display_name !== 'string' || typeof data.username !== 'string'
          || (data.bio !== null && typeof data.bio !== 'string')
          || (data.avatar_file_id !== null && typeof data.avatar_file_id !== 'string')) throw new Error('Profile unavailable')
        if (!active || request !== revision) return
        let avatarUrl: string | null = null
        if (data.avatar_file_id) {
          // Optional media failures never hide the basic profile. RLS authorizes both reads.
          try {
            const { data: file, error: fileError } = await client.from('files')
              .select('bucket_name, storage_path, uploaded_by, mime_type')
              .eq('id', data.avatar_file_id).eq('uploaded_by', userId).single()
            if (!active || request !== revision) return
            if (!fileError && file?.uploaded_by === userId && file.bucket_name === 'event_media'
              && typeof file.storage_path === 'string' && file.storage_path.startsWith(`${userId}/`)
              && ['image/jpeg', 'image/png', 'image/webp'].includes(file.mime_type)) {
              const { data: signed, error: signError } = await client.storage.from(file.bucket_name).createSignedUrl(file.storage_path, 300)
              if (!signError && signed?.signedUrl) avatarUrl = signed.signedUrl
            }
          } catch { /* Use the placeholder for inaccessible media. */ }
        }
        if (active && request === revision) setResult({ profile: data, avatarUrl })
      } catch {
        if (active && request === revision) setResult({ error: true })
      }
    }
    const onVisible = () => { if (document.visibilityState === 'visible') void load() }
    void load()
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId, attempt])
  return <div className="profile-page">
    <header className="profile-heading"><h1>Mi perfil</h1><button className="text-button" type="button" onClick={refresh} disabled={!result}>Actualizar perfil</button></header>
    {!result ? <div role="status"><StatusMessage title="Cargando perfil">Consultando los datos de tu cuenta…</StatusMessage></div>
      : 'error' in result ? <><StatusMessage title="No se pudo consultar el perfil" tone="error">No pudimos recuperar tus datos. Revisá la conexión y volvé a intentar.</StatusMessage><button className="gradient-link gradient-button" type="button" onClick={refresh}>Reintentar</button></>
      : <>
        <section className="profile-identity" aria-label="Datos de tu perfil">
          <div className="profile-avatar">{result.avatarUrl && !avatarFailed
            ? <img src={result.avatarUrl} alt="Tu avatar" width="98" height="98" onError={() => setAvatarFailed(true)} />
            : <span role="img" aria-label="Sin avatar disponible"><Icon name="user" /></span>}</div>
          <h2>{result.profile.display_name}</h2>
          <p className="profile-username">@{result.profile.username}</p>
          <p className={result.profile.bio?.trim() ? 'profile-bio' : 'profile-bio profile-missing'}>{result.profile.bio?.trim() || 'Todavía no agregaste una biografía.'}</p>
        </section>
        <dl className="profile-email"><dt><Icon name="email" />Correo de tu cuenta</dt><dd>{email || 'Correo no disponible'}</dd></dl>
      </>}
    <nav className="profile-account" aria-label="Información de tu cuenta">
      <Link ref={interestsLink} to="/me/interests"><Icon name="category" /><span>Mis intereses</span><span aria-hidden="true">›</span></Link>
      <Link to="/my-events"><Icon name="calendar" /><span>Mis eventos</span><span aria-hidden="true">›</span></Link>
      <Link to="/notifications"><Icon name="bell" /><span>Notificaciones</span><span aria-hidden="true">›</span></Link>
    </nav>
  </div>
}
