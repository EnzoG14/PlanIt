import { createStoryImageHandler } from './handler.ts'
const url = Deno.env.get('SUPABASE_URL'), anonKey = Deno.env.get('SUPABASE_ANON_KEY'), serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
if (!url || !anonKey || !serviceKey) throw new Error('media_runtime_unconfigured')
Deno.serve(createStoryImageHandler({ url, anonKey, serviceKey }))
