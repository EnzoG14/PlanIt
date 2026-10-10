import { useEffect, useState } from 'react'
import { ScreenHeader } from '../components/ScreenHeader'
import { StatusMessage } from '../components/StatusMessage'
import { GradientButton } from '../components/GradientButton'
import { useAuth } from '../features/auth/useAuth'
import { supabase } from '../lib/supabase'

type OwnProfile = { display_name: string; username: string }
export function ProfilePage() {
  const { session } = useAuth()
  const userId = session?.user.id
  const [result, setResult] = useState<{ userId: string; profile: OwnProfile | null } | null>(null)
  const loading = !result || result.userId !== userId
  const profile = !loading ? result.profile : null
  const error = !loading && !profile
  const [attempt, setAttempt] = useState(0)
  useEffect(() => { document.title = 'Mi perfil · PlanIt' }, [])
  useEffect(() => {
    let active = true
    async function load() {
      try {
        if (!supabase || !userId) throw new Error('Session unavailable')
        const { data, error: queryError } = await supabase.from('profiles').select('display_name, username').eq('id', userId).single()
        if (queryError || !data || typeof data.display_name !== 'string' || typeof data.username !== 'string') throw new Error('Profile unavailable')
        if (active) setResult({ userId, profile: { display_name: data.display_name, username: data.username } })
      } catch { if (active && userId) setResult({ userId, profile: null }) }
    }
    void load()
    return () => { active = false }
  }, [userId, attempt])
  return <div className="profile-page">
    <ScreenHeader title="Mi perfil" description="Los datos guardados en tu cuenta." icon="user" />
    {loading ? <StatusMessage title="Cargando perfil">Consultando los datos de tu cuenta…</StatusMessage> : error ? <><StatusMessage title="No se pudo consultar el perfil" tone="error">No pudimos recuperar tus datos. Revisá la conexión y volvé a intentar.</StatusMessage><GradientButton type="button" onClick={() => { setResult(null); setAttempt(value => value + 1) }}>Reintentar</GradientButton></> : profile && <dl className="profile-details"><dt>Nombre visible</dt><dd>{profile.display_name}</dd><dt>Username</dt><dd>@{profile.username}</dd><dt>Email</dt><dd>{session?.user.email}</dd></dl>}
  </div>
}
