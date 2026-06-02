import { createClient } from '@supabase/supabase-js'

const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const envAnon = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

let _client = null
let _configChecked = false
let _enabledFromApi = false
let _resolvedUrl = ''
let _resolvedAnon = ''

/** True when Vite env has both values (sync check for UI). */
export const supabaseAuthEnabled = Boolean(envUrl && envAnon)

function apiBase() {
  const raw = import.meta.env.VITE_API_URL || ''
  return typeof raw === 'string' ? raw.replace(/\/+$/, '') : ''
}

function storageKeyFor(url) {
  try {
    const host = new URL(url).hostname.split('.')[0] || 'medscan'
    return `medscan-${host}`
  } catch {
    return 'medscan-supabase-auth'
  }
}

function buildClient(url, anonKey) {
  return createClient(url, anonKey, {
    auth: {
      detectSessionInUrl: false,
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      storageKey: storageKeyFor(url),
    },
  })
}

async function fetchBackendConfig() {
  const base = apiBase()
  const url = `${base}/api/auth/supabase/config`
  const res = await fetch(url)
  if (!res.ok) return { enabled: false }
  return res.json()
}

/**
 * Single Supabase client for the whole app (required for PKCE OAuth).
 * Uses VITE_* env first; otherwise loads URL + anon key from GET /api/auth/supabase/config.
 */
export async function getSupabaseClient() {
  if (_client) return _client

  if (envUrl && envAnon) {
    _resolvedUrl = envUrl
    _resolvedAnon = envAnon
    _client = buildClient(envUrl, envAnon)
    return _client
  }

  if (!_configChecked) {
    _configChecked = true
    try {
      const cfg = await fetchBackendConfig()
      if (cfg?.enabled && cfg.url && cfg.anon_key) {
        _enabledFromApi = true
        _resolvedUrl = cfg.url
        _resolvedAnon = cfg.anon_key
        _client = buildClient(cfg.url, cfg.anon_key)
      }
    } catch {
      /* backend offline or Supabase not configured */
    }
  }

  return _client
}

/** Whether Supabase auth is available (env or backend config). */
export async function isSupabaseAuthAvailable() {
  if (supabaseAuthEnabled) return true
  if (_enabledFromApi && _client) return true
  const c = await getSupabaseClient()
  return Boolean(c)
}

/** OAuth / magic-link return URL — skip session restore so PKCE verifier is not consumed twice. */
export function isSupabaseAuthCallbackRoute() {
  if (typeof window === 'undefined') return false
  const path = window.location.pathname || ''
  if (path === '/auth/callback' || path === '/reset-password') return true
  const q = window.location.search || ''
  const h = window.location.hash || ''
  return q.includes('code=') || h.includes('access_token=') || h.includes('type=recovery')
}
