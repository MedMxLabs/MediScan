import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess, loginFailure, loginStart } from '../store/slices/authSlice';
import { registerAccount, loginWithGoogle, profileFromAuthData } from '../auth';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import AuthPageShell from '../components/AuthPageShell';
import AuthFormLayout from '../components/auth/AuthFormLayout';
import AuthDivider from '../components/auth/AuthDivider';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';

const SignupPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { supabaseEnabled, supabaseLoading } = useSupabaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setFormError('');
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    dispatch(loginStart());
    setIsLoading(true);
    try {
      const data = await registerAccount(email.trim(), password);
      const profile = profileFromAuthData(data, email);
      dispatch(loginSuccess(profile));
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Could not create account';
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
        title="Create your account"
        footer={
          <p className="text-center text-xs sm:text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-teal hover:text-teal-dark transition-colors">
              Sign in
            </Link>
          </p>
        }
      >
        {!supabaseLoading && !supabaseEnabled && (
          <p className="text-xs text-red-700 bg-red-50/90 border border-red-200 rounded-lg px-3 py-2 mb-3">
            Configure Supabase in frontend/.env before signing up.
          </p>
        )}

        <GoogleSignInButton onClick={handleGoogle} disabled={busy || !supabaseEnabled} />

        <AuthDivider label="or email" />

        <form onSubmit={handleSignup} className="space-y-2">
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
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            disabled={!supabaseEnabled}
          />
          <Input
            compact
            lightSurface
            label="Confirm password"
            type="password"
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            disabled={!supabaseEnabled}
          />
          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="md"
            disabled={busy || !supabaseEnabled}
            className="rounded-xl shadow-brand !mt-2"
          >
            {busy ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      </AuthFormLayout>
    </AuthPageShell>
  );
};

export default SignupPage;
