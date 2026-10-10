const projectUrl = 'https://iepeqmvzjguwlhnecsdq.supabase.co'

export function validateSupabaseConfig(url?: string, key?: string): string | null {
  if (!url?.trim() || !key?.trim() || key === 'replace_with_project_publishable_key') {
    return 'Falta configurar la conexión. Completá VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en .env.local y reiniciá la aplicación.'
  }
  if (url !== projectUrl) {
    return 'La conexión debe apuntar al proyecto planit-v2. Revisá VITE_SUPABASE_URL y reiniciá la aplicación.'
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
    return 'Usá la clave publishable de planit-v2. No uses claves secretas ni service_role.'
  }
  return null
}
