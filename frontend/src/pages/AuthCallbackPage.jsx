import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { loginSuccess, loginFailure } from '../store/slices/authSlice'
import { completeSupabaseOAuthCallback } from '../auth/supabaseAuth'
import { profileFromAuthData, persistAuthSession } from '../auth/session'
import AuthPageShell from '../components/AuthPageShell'
import Button from '../components/ui/Button'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [message, setMessage] = useState('Completing sign-in…')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        const data = await completeSupabaseOAuthCallback()
        if (!active) return

        const profile = profileFromAuthData(data)
        persistAuthSession(data, profile)
        window.history.replaceState({}, '', '/auth/callback')
        dispatch(loginSuccess(profile))
        setMessage('Success! Opening dashboard…')
        navigate('/dashboard', { replace: true })
      } catch (err) {
        if (!active) return
        const msg = err?.message || 'Sign-in failed'
        dispatch(loginFailure(msg))
        setFailed(true)
        setMessage(msg)
      }
    })()

    return () => {
      active = false
    }
  }, [dispatch, navigate])

  return (
    <AuthPageShell className="items-center justify-center">
      <div className="px-6 text-center max-w-md space-y-4">
        <p className={`font-medium ${failed ? 'text-red-600' : 'text-navy'}`}>{message}</p>
        {failed && (
          <div className="flex flex-col gap-2 items-center">
            <Button variant="primary" size="sm" onClick={() => navigate('/login', { replace: true })}>
              Back to login
            </Button>
            <Link to="/login" className="text-sm text-teal font-semibold hover:underline">
              Try again
            </Link>
          </div>
        )}
      </div>
    </AuthPageShell>
  )
}
