import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { loadSocialCounts, type SocialCounts as Counts } from '../features/social/follows'
import { useSocialRead } from '../features/social/useSocialRead'
import '../pages/social-follows.css'

export function SocialCountsLinks({ userId, counts, origin }: { userId: string; counts: Counts; origin?: unknown }) {
  return <nav className="social-follow-counts" aria-label="Seguimientos">
    <Link to={`/users/${userId}/followers`} state={{ profileOrigin: origin }}>{counts.followers} seguidores</Link>
    <Link to={`/users/${userId}/following`} state={{ profileOrigin: origin }}>{counts.following} siguiendo</Link>
  </nav>
}
export function OwnSocialCounts({ userId }: { userId: string }) {
  const load = useCallback((signal: AbortSignal) => loadSocialCounts(userId, signal), [userId])
  const { data, loading, error, refresh } = useSocialRead(load)
  return <div aria-busy={loading}>{loading ? <p role="status">Consultando seguimientos…</p> : error ? <><p role="alert">{error}</p><button className="text-button" onClick={() => void refresh()}>Reintentar seguimientos</button></> : data && <SocialCountsLinks userId={userId} counts={data} />}</div>
}
