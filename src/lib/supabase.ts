import { createClient } from '@supabase/supabase-js'
import { validateSupabaseConfig } from './supabase-config'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const supabaseConfigError = validateSupabaseConfig(url, key)
export const supabase = supabaseConfigError ? null : createClient(url!, key!)
