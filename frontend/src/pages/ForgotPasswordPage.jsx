import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { forgotPassword } from '../auth';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import AuthPageShell from '../components/AuthPageShell';
import Logo from '../components/Logo';
import AuthSidePanel from '../components/AuthSidePanel';
import BackedByMicrosoft from '../components/BackedByMicrosoft';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function ForgotPasswordPage() {
  const { supabaseEnabled, supabaseLoading } = useSupabaseAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await forgotPassword(email.trim());
      setMessage(data.message || 'If that email exists, a reset link was sent.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Request failed');
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
          <h1 className="text-2xl font-extrabold text-navy">Reset password</h1>
          <p className="text-sm text-muted mt-2">We will email you a secure Supabase reset link.</p>

          {!supabaseLoading && !supabaseEnabled && (
            <p className="text-sm text-red-600 mt-4">Supabase Auth is not configured on this app.</p>
          )}

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Input
              lightSurface
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={!supabaseEnabled}
            />
            {message && <p className="text-sm text-teal-dark">{message}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" variant="primary" className="w-full" disabled={loading || !supabaseEnabled}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>

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
