import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess, loginFailure, loginStart } from '../store/slices/authSlice';
import { loginWithPassword, loginWithGoogle, profileFromAuthData } from '../auth';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import AuthPageShell from '../components/AuthPageShell';
import AuthFormLayout from '../components/auth/AuthFormLayout';
import AuthDivider from '../components/auth/AuthDivider';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { supabaseEnabled, supabaseLoading } = useSupabaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const finishLogin = (data, fallbackEmail) => {
    const profile = profileFromAuthData(data, fallbackEmail);
    dispatch(loginSuccess(profile));
    navigate('/dashboard');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setFormError('');
    dispatch(loginStart());
    setIsLoading(true);
    try {
      const data = await loginWithPassword(email.trim(), password);
      finishLogin(data, email);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Login failed';
      dispatch(loginFailure(msg));
      setFormError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setFormError('');
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setFormError(err?.message || 'Google sign-in failed');
      setIsLoading(false);
    }
  };

  const busy = isLoading || supabaseLoading;

  return (
    <AuthPageShell>
      <AuthFormLayout
        title="Sign in to MedMx"
        footer={
          <p className="text-center text-xs sm:text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-bold text-teal hover:text-teal-dark transition-colors">
              Create one
            </Link>
          </p>
        }
      >
        {!supabaseLoading && !supabaseEnabled && (
          <p className="text-xs text-red-700 bg-red-50/90 border border-red-200 rounded-lg px-3 py-2 mb-3">
            Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env.
          </p>
        )}

        <GoogleSignInButton onClick={handleGoogle} disabled={busy || !supabaseEnabled} />

        <AuthDivider label="or email" />

        <form onSubmit={handleLogin} className="space-y-2.5">
          {formError && (
            <p
              className="text-xs text-red-700 bg-red-50/90 border border-red-200 rounded-lg px-3 py-2"
              role="alert"
            >
              {formError}
            </p>
          )}
          <Input
            compact
            lightSurface
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={!supabaseEnabled}
          />
          <Input
            compact
            lightSurface
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="current-password"
            disabled={!supabaseEnabled}
          />
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-teal hover:text-teal-dark transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="md"
            disabled={busy || !supabaseEnabled}
            className="rounded-xl shadow-brand"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </AuthFormLayout>
    </AuthPageShell>
  );
};

export default LoginPage;
