import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  Mail,
  User as UserIcon,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, login, signup, forgotPassword, resetPassword } = useAuth();
  const { success, error: toastError } = useToast();

  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');


  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    resetToken: '',
    newPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      const redirect = searchParams.get('redirect');
      navigate(redirect ? `/${redirect}` : '/dashboard', { replace: true });
    }
  }, [user, navigate, searchParams]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'signup') {
      setMode('signup');
    }
  }, [searchParams]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (mode === 'signup' && !formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (mode !== 'reset') {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (mode === 'login' || mode === 'signup') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }

    if (mode === 'reset') {
      if (!formData.resetToken.trim()) {
        newErrors.resetToken = 'Reset token is required';
      }
      if (!formData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrorMessage('');

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
        success('Welcome back to TravelMate AI!', 'Logged In');
        const redirect = searchParams.get('redirect');
        navigate(redirect ? `/${redirect}` : '/dashboard');
      } else if (mode === 'signup') {
        await signup(formData.name, formData.email, formData.password);
        success('Your account has been created successfully!', 'Account Created');
        navigate('/dashboard');
      } else if (mode === 'forgot') {
        const res = await forgotPassword(formData.email);
        if (res.reset_token) {
          setFormData((prev) => ({ ...prev, resetToken: res.reset_token || '' }));
          success('Password reset token generated! You can now set your new password.', 'Token Ready');
          setMode('reset');
        } else {

          success('If the email is registered, instructions have been sent.', 'Request Submitted');
        }
      } else if (mode === 'reset') {
        const msg = await resetPassword(formData.resetToken, formData.newPassword);
        success(msg, 'Password Reset');
        setMode('login');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const errorText = Array.isArray(detail)
        ? detail.map((d: any) => d.msg).join(', ')
        : detail || 'Authentication failed. Please check your credentials and try again.';
      setErrorMessage(errorText);
      toastError(errorText, 'Authentication Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 p-4 sm:p-6 relative overflow-hidden">
      
      {/* Decorative background glow & globe rings */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      
      {/* Floating Travel Vectors */}
      <div className="absolute top-12 left-12 text-sky-500/10 pointer-events-none hidden md:block">
        <Compass className="w-32 h-32 animate-spin-slow" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-[440px] bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl shadow-slate-950/40 p-6 sm:p-8 z-10 my-6"
      >
        
        {/* Back Link to Landing */}
        <Link
          to="/"
          className="inline-flex items-center space-x-1 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 via-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/25 mb-3">
            T
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Create Your Account'}
            {mode === 'forgot' && 'Reset Your Password'}
            {mode === 'reset' && 'Set New Password'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium max-w-xs">
            {mode === 'login' && 'Sign in to access your saved itineraries and AI travel tools.'}
            {mode === 'signup' && 'Join TravelMate AI for personalized trip plans and live advice.'}
            {mode === 'forgot' && 'Enter your email to receive a password reset token.'}
            {mode === 'reset' && 'Enter your reset token and your desired new password.'}
          </p>
        </div>

        {/* Dynamic Mode Switcher */}
        {(mode === 'login' || mode === 'signup') && (
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 relative">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(''); setErrors({}); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all relative z-10 cursor-pointer ${
                mode === 'login' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMessage(''); setErrors({}); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all relative z-10 cursor-pointer ${
                mode === 'signup' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign Up
            </button>
            <motion.div
              className="absolute top-1 bottom-1 bg-white rounded-lg shadow-xs"
              animate={{
                left: mode === 'login' ? '4px' : '50%',
                right: mode === 'login' ? '50%' : '4px',
              }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <AnimatePresence mode="popLayout">
            {mode === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1"
              >
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Full Name</label>
                <div className="relative flex items-center">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl outline-none text-sm transition-all focus:bg-white focus:border-blue-500 ${
                      errors.name ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                    }`}
                  />
                </div>
                {errors.name && <p className="text-[11px] text-red-500 font-semibold">{errors.name}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          {mode !== 'reset' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="traveler@example.com"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl outline-none text-sm transition-all focus:bg-white focus:border-blue-500 ${
                    errors.email ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                  }`}
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-500 font-semibold">{errors.email}</p>}
            </div>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setErrorMessage(''); }}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-3 bg-slate-50 border rounded-xl outline-none text-sm transition-all focus:bg-white focus:border-blue-500 ${
                    errors.password ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-red-500 font-semibold">{errors.password}</p>}
            </div>
          )}

          {mode === 'reset' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Reset Token</label>
                <div className="relative flex items-center">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    name="resetToken"
                    value={formData.resetToken}
                    onChange={handleChange}
                    placeholder="Enter reset token"
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl outline-none text-sm transition-all focus:bg-white focus:border-blue-500 ${
                      errors.resetToken ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                    }`}
                  />
                </div>
                {errors.resetToken && <p className="text-[11px] text-red-500 font-semibold">{errors.resetToken}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">New Password</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="At least 6 characters"
                    className={`w-full pl-10 pr-10 py-3 bg-slate-50 border rounded-xl outline-none text-sm transition-all focus:bg-white focus:border-blue-500 ${
                      errors.newPassword ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-[11px] text-red-500 font-semibold">{errors.newPassword}</p>}
              </div>
            </>
          )}

          {errorMessage && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center space-x-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:from-sky-500 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-98"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>
                {mode === 'login' && 'Log In to TravelMate'}
                {mode === 'signup' && 'Create Free Account'}
                {mode === 'forgot' && 'Send Reset Token'}
                {mode === 'reset' && 'Update Password'}
              </span>
            )}
          </button>
        </form>

        {mode === 'forgot' && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(''); }}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Remember your password? Log in
            </button>
          </div>
        )}

        {mode === 'reset' && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(''); }}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel and back to login
            </button>
          </div>
        )}

      </motion.div>
    </div>
  );
}
