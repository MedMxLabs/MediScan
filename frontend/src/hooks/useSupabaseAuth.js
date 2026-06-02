import { useEffect, useState } from 'react'
import { isSupabaseAuthAvailable, supabaseAuthEnabled } from '../lib/supabase'

/**
 * Web: true when Supabase auth is configured (Vite env or backend /api/auth/supabase/config).
 */
export function useSupabaseAuth() {
  const [enabled, setEnabled] = useState(supabaseAuthEnabled)
  const [loading, setLoading] = useState(!supabaseAuthEnabled)

  useEffect(() => {
    if (supabaseAuthEnabled) {
      setEnabled(true)
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      const ok = await isSupabaseAuthAvailable()
      if (!cancelled) {
        setEnabled(ok)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { supabaseEnabled: enabled, supabaseLoading: loading }
}
