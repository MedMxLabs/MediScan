import client, { setToken } from '../api/client'
import {
  getSupabaseClient,
  isSupabaseAuthAvailable,
  supabaseAuthEnabled,
} from '../lib/supabase'

export { supabaseAuthEnabled, isSupabaseAuthAvailable }

/** Single in-flight OAuth completion (React StrictMode runs effects twice). */
let _oauthCallbackPromise = null

/** Exchange Supabase session for MedScan API JWTs (POST /api/auth/supabase). */
export async function exchangeSupabaseSession(accessToken) {
  try {
    const res = await client.post(
      '/api/auth/supabase',
      { access_token: accessToken },
      { headers: { Authorization: undefined } },
    )
    const data = res.data
    if (data.access_token) setToken(data.access_token)
    if (data.refresh_token) localStorage.setItem('medscan_refresh', data.refresh_token)
    return data
  } catch (err) {
    if (err?.code === 'ERR_NETWORK' || !err?.response) {
      throw new Error(
        'Cannot reach the MedScan API. Start the backend (python run.py on port 5000) and try again.',
        { cause: err },
      )
    }
    const msg = err.response?.data?.error || err.response?.data?.message || err.message
    throw new Error(msg || 'MedScan token exchange failed', { cause: err })
  }
}

async function requireSupabase() {
  const sb = await getSupabaseClient()
  if (!sb) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_* to frontend/.env or SUPABASE_* to backend/.env',
    )
  }
  return sb
}

export async function signInWithSupabaseEmail(email, password) {
  const supabase = await requireSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })
  if (error) throw new Error(error.message)
  const token = data.session?.access_token
  if (!token) throw new Error('No session returned from Supabase')
  return exchangeSupabaseSession(token)
}

export async function signUpWithSupabaseEmail(email, password) {
  const supabase = await requireSupabase()
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  })
  if (error) throw new Error(error.message)
  const token = data.session?.access_token
  if (!token) {
    throw new Error('Check your email to confirm your account, then sign in.')
  }
  return exchangeSupabaseSession(token)
}

export async function signInWithSupabaseGoogle() {
  const supabase = await requireSupabase()
  const redirectTo = `${window.location.origin}/auth/callback`
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        redirect_to: redirectTo,
      },
    },
  })
  if (error) throw new Error(error.message)
}

export async function sendSupabasePasswordReset(email) {
  const supabase = await requireSupabase()
  const redirectTo = `${window.location.origin}/reset-password`
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo,
  })
  if (error) throw new Error(error.message)
}

export async function updateSupabasePassword(newPassword) {
  const supabase = await requireSupabase()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new Error(error.message)
}

export function isSupabaseRecoveryRedirect() {
  const hash = window.location.hash || ''
  const search = window.location.search || ''
  return hash.includes('type=recovery') || search.includes('type=recovery')
}

async function finishOAuthCallback() {
  const supabase = await requireSupabase()
  const params = new URLSearchParams(window.location.search)

  const oauthError = params.get('error_description') || params.get('error')
  if (oauthError) {
    throw new Error(decodeURIComponent(oauthError.replace(/\+/g, ' ')))
  }

  const code = params.get('code')
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) throw new Error(error.message)
    const token = data.session?.access_token
    if (!token) throw new Error('Supabase did not return a session. Try signing in again.')
    return exchangeSupabaseSession(token)
  }

  const { error: initError } = await supabase.auth.initialize()
  if (initError) throw new Error(initError.message)

  const { data, error } = await supabase.auth.getSession()
  if (error) throw new Error(error.message)
  const token = data.session?.access_token
  if (!token) {
    throw new Error('No sign-in session on this page. Go back to login and try Google again.')
  }
  return exchangeSupabaseSession(token)
}

/** After Google OAuth redirect → MedScan JWT. */
export async function completeSupabaseOAuthCallback() {
  if (_oauthCallbackPromise) return _oauthCallbackPromise

  _oauthCallbackPromise = finishOAuthCallback()

  try {
    return await _oauthCallbackPromise
  } catch (e) {
    _oauthCallbackPromise = null
    throw e
  }
}

export async function signOutSupabase() {
  const supabase = await getSupabaseClient()
  if (supabase) await supabase.auth.signOut()
  _oauthCallbackPromise = null
}
