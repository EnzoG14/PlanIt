import { createAvatarHandler } from './handler.ts'

// Supabase supplies these at runtime. Never copy them into VITE_* or Git.
const url = Deno.env.get('SUPABASE_URL')
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
if (!url || !anonKey || !serviceKey) throw new Error('avatar_runtime_unconfigured')
Deno.serve(createAvatarHandler({ url, anonKey, serviceKey }))
