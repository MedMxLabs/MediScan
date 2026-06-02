import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { isSupabaseRecoveryRedirect, updateSupabasePassword } from '../auth';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import AuthPageShell from '../components/AuthPageShell';
import Logo from '../components/Logo';
import AuthSidePanel from '../components/AuthSidePanel';
import BackedByMicrosoft from '../components/BackedByMicrosoft';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { supabaseEnabled, supabaseLoading } = useSupabaseAuth();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (supabaseLoading) return;
    if (!supabaseEnabled) {
      setError('Supabase Auth is not configured.');
      setReady(true);
      return;
    }
    if (!isSupabaseRecoveryRedirect()) {
      setError('Open the password reset link from your email.');
    }
    setReady(true);
  }, [supabaseEnabled, supabaseLoading]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await updateSupabasePassword(password);
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell>
      <AuthSidePanel />
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 bg-white/90 backdrop-blur-sm">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto">
          <Logo to="/" size="sm" theme="on-light" className="mb-8" />
          <h1 className="text-2xl font-extrabold text-navy">Choose a new password</h1>
          <p className="text-sm text-muted mt-2">Complete your Supabase password reset.</p>

          {!ready ? (
            <p className="text-sm text-muted mt-6">Loading…</p>
          ) : done ? (
            <p className="text-sm text-teal-dark mt-4">Password updated. Redirecting to login…</p>
          ) : (
            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <Input
                lightSurface
                type="password"
                label="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                disabled={!supabaseEnabled || Boolean(error && !isSupabaseRecoveryRedirect())}
              />
              <Input
                lightSurface
                type="password"
                label="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                disabled={!supabaseEnabled || Boolean(error && !isSupabaseRecoveryRedirect())}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loading || !supabaseEnabled || Boolean(error && !isSupabaseRecoveryRedirect())}
              >
                {loading ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          )}

          <p className="mt-6 text-sm text-muted">
            <Link to="/login" className="text-teal font-semibold hover:underline">
              ← Back to login
            </Link>
          </p>
          <div className="mt-8 flex justify-center lg:hidden">
            <BackedByMicrosoft />
          </div>
        </motion.div>
      </div>
    </AuthPageShell>
  );
}
