import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { loginSuccess, loginFailure, loginStart } from '../store/slices/authSlice';
import { registerAccount, loginWithPassword } from '../services/api';
import Logo from '../components/Logo';
import AuthSidePanel from '../components/AuthSidePanel';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const SignupPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
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
      await registerAccount(email.trim(), password);
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
        'Could not create account';
      dispatch(loginFailure(msg));
      setFormError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      <div className="w-full lg:w-[52%] flex flex-col justify-center px-6 sm:px-12 py-12">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="w-full max-w-md mx-auto">
          <Logo size="lg" className="mb-10" />

          <h1 className="text-2xl font-extrabold text-navy">Create your account</h1>
          <p className="text-muted mt-1 mb-8">Start comparing medicine prices for free</p>

          <form onSubmit={handleSignup} className="space-y-4">
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
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <Button type="submit" variant="primary" fullWidth size="lg" disabled={isLoading}>
              {isLoading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-teal hover:text-teal-dark">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
      <AuthSidePanel />
    </div>
  );
};

export default SignupPage;
