import { setToken } from '../api/client'
import { exchangeSupabaseSession, signOutSupabase } from './supabaseAuth'
import { getSupabaseClient, isSupabaseAuthAvailable } from '../lib/supabase'

export function profileFromAuthData(data, fallbackEmail = '') {
  return {
    id: String(data.user?.id ?? ''),
    email: data.user?.email ?? fallbackEmail,
    name: data.user?.name || data.user?.email?.split('@')[0] || 'User',
  }
}

/** Persist MedScan API JWT + profile after Supabase exchange. */
export function persistAuthSession(data, profile) {
  if (data.access_token) setToken(data.access_token)
  if (data.refresh_token) localStorage.setItem('medscan_refresh', data.refresh_token)
  localStorage.setItem('medscan_user', JSON.stringify(profile))
}

export function clearAuthStorage() {
  localStorage.removeItem('medscan_token')
  localStorage.removeItem('medscan_refresh')
  localStorage.removeItem('medscan_user')
}

/**
 * On app load: refresh MedScan JWT from Supabase session, or restore stored JWT if still present.
 */
export async function restoreAuthSession() {
  const token = localStorage.getItem('medscan_token')
  const rawUser = localStorage.getItem('medscan_user')
  if (token && rawUser) {
    try {
      setToken(token)
      return { profile: JSON.parse(rawUser) }
    } catch {
      clearAuthStorage()
    }
  }

  if (!(await isSupabaseAuthAvailable())) return null

  const supabase = await getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session?.access_token) return null

  try {
    const exchanged = await exchangeSupabaseSession(data.session.access_token)
    const profile = profileFromAuthData(exchanged)
    persistAuthSession(exchanged, profile)
    return { profile }
  } catch {
    return null
  }
}

export async function clearAllAuthSessions() {
  await signOutSupabase()
  clearAuthStorage()
}
