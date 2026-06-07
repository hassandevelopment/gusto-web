import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url) throw new Error('Missing VITE_SUPABASE_URL — see .env.example')
if (!key) throw new Error('Missing VITE_SUPABASE_ANON_KEY — see .env.example')

// Import this only from /kitchen route files — supabase-js adds ~73KB gzipped
// and must never land in the customer menu bundle.
export const supabase = createClient(url, key)
