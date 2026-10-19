/**
 * Web auth only: Supabase Auth → POST /api/auth/supabase → MedScan JWT for API calls.
 */
import client from '../api/client'
import {
  signInWithSupabaseEmail,
  signUpWithSupabaseEmail,
  signInWithSupabaseGoogle,
  sendSupabasePasswordReset,
  updateSupabasePassword,
  isSupabaseRecoveryRedirect,
  isSupabaseAuthAvailable,
  supabaseAuthEnabled,
} from './supabaseAuth'
import {
  profileFromAuthData,
  persistAuthSession,
  restoreAuthSession,
  clearAllAuthSessions,
} from './session'

export { useSupabaseAuth } from '../hooks/useSupabaseAuth'
export {
  profileFromAuthData,
  persistAuthSession,
  restoreAuthSession,
  clearAllAuthSessions,
  isSupabaseRecoveryRedirect,
  updateSupabasePassword,
  signInWithSupabaseGoogle,
  isSupabaseAuthAvailable,
  supabaseAuthEnabled,
}

async function requireSupabaseAuth() {
  if (!(await isSupabaseAuthAvailable())) {
    throw new Error(
      'Supabase Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env, or SUPABASE_* in backend/.env.',
    )
  }
}

export async function loginWithPassword(email, password) {
  await requireSupabaseAuth()
  const data = await signInWithSupabaseEmail(email, password)
  persistAuthSession(data, profileFromAuthData(data, email))
  return data
}

export async function registerAccount(email, password) {
  await requireSupabaseAuth()
  const data = await signUpWithSupabaseEmail(email, password)
  persistAuthSession(data, profileFromAuthData(data, email))
  return data
}

export async function forgotPassword(email) {
  await requireSupabaseAuth()
  await sendSupabasePasswordReset(email)
  return { ok: true, message: 'If that email exists, a reset link was sent.' }
}

export async function loginWithGoogle() {
  await requireSupabaseAuth()
  await signInWithSupabaseGoogle()
}

export async function logoutApi() {
  try {
    await client.post('/api/auth/logout')
  } catch {
    /* ignore — client clears JWT locally */
  }
  await clearAllAuthSessions()
}
