import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Must be at least 6 characters';
    }
    if (!isLogin && !formData.name) {
      newErrors.name = 'Name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
    setServerError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError('');

    const endpoint = isLogin ? '/auth/login' : '/auth/signup';
    const payload = isLogin 
      ? { email: formData.email, password: formData.password }
      : { name: formData.name, email: formData.email, password: formData.password };

    try {
      const response = await api.post(endpoint, payload);
      
      if (isLogin) {
        localStorage.setItem('token', response.data.access_token);
        navigate('/dashboard');
      } else {
        alert('Account created! Please sign in.');
        setIsLogin(true);
        setFormData({ name: '', email: '', password: '' });
      }
    } catch (err: any) {
      setServerError(
        err.response?.data?.detail || 'Authentication failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 via-blue-50 to-white p-6 relative">
      
      {/* Travel motifs */}
      <div className="absolute top-10 left-10 text-blue-200 pointer-events-none">
        <svg width="120" height="120" viewBox="0 0 100 100" fill="currentColor">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5 5" />
          <path d="M50 5 L55 35 L85 35 L60 55 L70 85 L50 65 L30 85 L40 55 L15 35 L45 35 Z" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] bg-white rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5 p-8 z-10"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-500/20 mb-3">
            T
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isLogin ? 'Access your automated travel assistant' : 'Get custom itineraries and forecast insights'}
          </p>
        </div>

        {/* Dynamic sliding auth tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 relative">
          <button 
            type="button"
            onClick={() => { setIsLogin(true); setErrors({}); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all relative z-10 interactive ${isLogin ? 'text-blue-600' : 'text-slate-500'}`}
          >
            Log In
          </button>
          <button 
            type="button"
            onClick={() => { setIsLogin(false); setErrors({}); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all relative z-10 interactive ${!isLogin ? 'text-blue-600' : 'text-slate-500'}`}
          >
            Sign Up
          </button>
          <motion.div 
            className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm"
            animate={{ 
              left: isLogin ? '4px' : '50%',
              right: isLogin ? '50%' : '4px'
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5"
              >
                <label className="text-xs font-semibold text-slate-500">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`w-full px-4 py-3 bg-slate-50/50 border rounded-xl outline-none text-sm transition-all focus:bg-white ${
                    errors.name ? 'border-red-400 focus:border-red-400 animate-shake' : 'border-slate-100 focus:border-blue-500'
                  }`}
                />
                {errors.name && <p className="text-[10px] text-red-500 font-semibold">{errors.name}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">Email Address</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@company.com"
              className={`w-full px-4 py-3 bg-slate-50/50 border rounded-xl outline-none text-sm transition-all focus:bg-white ${
                errors.email ? 'border-red-400 focus:border-red-400 animate-shake' : 'border-slate-100 focus:border-blue-500'
              }`}
            />
            {errors.email && <p className="text-[10px] text-red-500 font-semibold">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">Password</label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full px-4 py-3 bg-slate-50/50 border rounded-xl outline-none text-sm transition-all focus:bg-white ${
                errors.password ? 'border-red-400 focus:border-red-400 animate-shake' : 'border-slate-100 focus:border-blue-500'
              }`}
            />
            {errors.password && <p className="text-[10px] text-red-500 font-semibold">{errors.password}</p>}
          </div>

          {serverError && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-3 bg-red-50 rounded-xl text-xs text-red-600 font-semibold text-center border border-red-100"
            >
              {serverError}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-sky-400 to-blue-600 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/10 cursor-pointer hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 interactive"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>{isLogin ? 'Log In' : 'Sign Up'}</span>
            )}
          </motion.button>
        </form>

        <div className="relative my-6 flex items-center">
          <div className="flex-1 border-t border-slate-100" />
          <span className="text-[10px] font-semibold text-slate-400 px-3 uppercase tracking-wider">or continue with</span>
          <div className="flex-1 border-t border-slate-100" />
        </div>

        {/* Demo slots for future OAuth options */}
        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center space-x-2 py-2.5 border border-slate-100 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer interactive transition-colors">
            <span>Google</span>
          </button>
          <button className="flex items-center justify-center space-x-2 py-2.5 border border-slate-100 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer interactive transition-colors">
            <span>Apple</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
