import { createClient } from '@supabase/supabase-js'

// Get Supabase credentials from environment variables
// NEVER hardcode credentials in source code
// Supports both new publishable keys (sb_publishable_...) and legacy anon keys (eyJ...)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'placeholder-key'

// Validate Supabase configuration
const isValidUrl = supabaseUrl && 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co')

// Validate API key - supports both new publishable keys and legacy JWT-based anon keys
const isValidKey = supabaseAnonKey && 
  supabaseAnonKey !== 'placeholder-key' &&
  supabaseAnonKey.length > 20 &&
  (supabaseAnonKey.startsWith('sb_publishable_') || // New publishable key format
   supabaseAnonKey.startsWith('eyJ')) // Legacy JWT-based anon key format

const isSupabaseConfigured = isValidUrl && isValidKey
const logConfigError = (message: string) => {
  console.error(`[Supabase Config] ${message}`)
}

if (!isSupabaseConfigured) {
  if (!isValidUrl) {
    logConfigError(
      'Invalid Supabase URL. Set VITE_SUPABASE_URL to a valid project URL (https://xxxxx.supabase.co).'
    )
  }
  if (!isValidKey) {
    logConfigError(
      'Invalid Supabase API key. Set VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY to a valid key.'
    )
  }
  if (!import.meta.env.DEV) {
    // In production, fail fast to avoid running with placeholders
    throw new Error('Supabase is not configured. Check environment variables.')
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist sessions so admin auth survives route changes and refreshes.
    // We still keep detectSessionInUrl false to avoid hash parsing conflicts.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'aiimageprompts-web',
      // Note: Don't set 'apikey' header for JWT-based anon keys
      // The apikey header is only for publishable keys (sb_publishable_...)
      // JWT-based keys (eyJ...) are sent in Authorization header automatically
    },
  },
})

// Debug: Log Supabase configuration (only in development)
if (import.meta.env.DEV) {
  console.log('Supabase Client Configuration:', {
    url: supabaseUrl,
    keyType: supabaseAnonKey.startsWith('sb_publishable_') ? 'publishable' : supabaseAnonKey.startsWith('eyJ') ? 'anon (JWT)' : 'unknown',
    keyLength: supabaseAnonKey.length,
    isConfigured: isSupabaseConfigured,
  })
}

// Export helper to check if Supabase is configured
export const isSupabaseReady = () => isSupabaseConfigured

export type SupabaseClient = typeof supabase

