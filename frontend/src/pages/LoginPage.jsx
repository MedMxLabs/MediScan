import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { loginSuccess, loginFailure, loginStart } from '../store/slices/authSlice';
import { loginWithPassword, loginWithGoogleCredential } from '../services/api';
import Logo from '../components/Logo';
import AuthSidePanel from '../components/AuthSidePanel';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

function waitForGoogleIdentity(maxMs = 10_000) {
  if (typeof window === 'undefined') return Promise.reject(new Error('Client only'));
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const id = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(id);
        resolve();
        return;
      }
      if (Date.now() - t0 > maxMs) {
        clearInterval(id);
        reject(new Error('Google sign-in did not load. Check your network or ad blocker.'));
      }
    }, 50);
  });
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setFormError('');
    dispatch(loginStart());
    setIsLoading(true);
    try {
      const data = await loginWithPassword(email.trim(), password);
      const profile = {
        id: String(data.user?.id ?? ''),
        email: data.user?.email ?? email,
        name: data.user?.email?.split('@')[0] ?? 'User',
      };
      localStorage.setItem('medscan_user', JSON.stringify(profile));
      dispatch(loginSuccess(profile));
      navigate('/dashboard');
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
    const cid = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!cid) {
      setFormError('Google sign-in is not configured on this deployment.');
      return;
    }
    try {
      await waitForGoogleIdentity();
    } catch (e) {
      setFormError(e?.message || 'Could not load Google sign-in.');
      return;
    }
    window.google.accounts.id.initialize({
      client_id: cid,
      callback: async (resp) => {
        if (!resp.credential) return;
        dispatch(loginStart());
        setIsLoading(true);
        try {
          const data = await loginWithGoogleCredential(resp.credential);
          const profile = {
            id: String(data.user?.id ?? ''),
            email: data.user?.email ?? '',
            name: data.user?.email?.split('@')[0] ?? 'User',
          };
          localStorage.setItem('medscan_user', JSON.stringify(profile));
          dispatch(loginSuccess(profile));
          navigate('/dashboard');
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Google sign-in failed';
          dispatch(loginFailure(msg));
          setFormError(msg);
        } finally {
          setIsLoading(false);
        }
      },
    });
    window.google.accounts.id.prompt();
  };

  return (
    <div className="min-h-screen flex bg-white">
      <div className="w-full lg:w-[52%] flex flex-col justify-center px-6 sm:px-12 py-12">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="w-full max-w-md mx-auto">
          <Logo size="lg" className="mb-10" />

          <h1 className="text-2xl font-extrabold text-navy">Welcome back</h1>
          <p className="text-muted mt-1 mb-8">Sign in to your MedMx LABS account</p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm font-semibold text-navy hover:bg-slate-50 transition-all"
          >
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 border-t border-slate-200" />
            <span className="text-xs text-muted font-medium">or email</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {formError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {formError}
              </p>
            )}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="current-password"
            />
            <Button type="submit" variant="primary" fullWidth size="lg" disabled={isLoading}>
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-bold text-teal hover:text-teal-dark">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
      <AuthSidePanel />
    </div>
  );
};

export default LoginPage;
