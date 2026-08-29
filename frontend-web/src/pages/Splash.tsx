import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Compass,
  Sparkles,
  Plane,
  CloudSun,
  ArrowRight,
  MapPin,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quickDest, setQuickDest] = useState('');
  const [quickStyle, setQuickStyle] = useState('Adventure');

  const handleQuickStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDest.trim()) return;
    if (user) {
      navigate(`/plan-trip?destination=${encodeURIComponent(quickDest)}&style=${encodeURIComponent(quickStyle)}`);
    } else {
      navigate(`/login?redirect=plan-trip&destination=${encodeURIComponent(quickDest)}`);
    }
  };

  const featuredDestinations = [
    { name: 'Kyoto, Japan', style: 'Culture & Zen', cost: '$1,800', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80', badge: 'Popular' },
    { name: 'Amalfi Coast, Italy', style: 'Coastal Luxury', cost: '$2,400', img: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop&q=80', badge: 'Trending' },
    { name: 'Swiss Alps, Switzerland', style: 'Mountain Adventure', cost: '$2,100', img: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&auto=format&fit=crop&q=80', badge: 'Scenic' },
    { name: 'Reykjavik, Iceland', style: 'Northern Lights', cost: '$1,950', img: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&auto=format&fit=crop&q=80', badge: 'Nature' }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-sky-500 selection:text-white overflow-x-hidden">
      
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 via-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-xl">T</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white">TravelMate</span>
              <span className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                AI
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <Link
                to="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center space-x-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-bold text-slate-300 hover:text-white px-3 py-2 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/login?tab=signup"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-blue-600 text-white font-bold text-sm shadow-md shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-500/30 hover:scale-102 active:scale-98 transition-all"
                >
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 md:pt-44 md:pb-28 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-sky-500/20 via-blue-600/15 to-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Travel Itinerary Engine with Gemini AI</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight"
            >
              Plan Your Dream Trip in <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-amber-300 bg-clip-text text-transparent">Seconds</span>, Not Days.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
            >
              Custom day-by-day itineraries, smart flight route tracking, hotel selections, and real-time weather forecasts powered by personalized AI.
            </motion.p>

            {/* Quick Trip Planner Bar */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onSubmit={handleQuickStart}
              className="p-2 sm:p-3 bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center gap-3 max-w-2xl mx-auto mt-8"
            >
              <div className="flex items-center space-x-3 px-3 py-2 w-full sm:flex-1">
                <MapPin className="w-5 h-5 text-sky-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Where do you want to travel? (e.g. Tokyo, Rome)"
                  value={quickDest}
                  onChange={(e) => setQuickDest(e.target.value)}
                  className="bg-transparent text-white placeholder-slate-500 text-sm outline-none w-full font-medium"
                  required
                />
              </div>

              <select
                value={quickStyle}
                onChange={(e) => setQuickStyle(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2.5 outline-none font-semibold w-full sm:w-auto cursor-pointer"
              >
                <option value="Adventure">Adventure</option>
                <option value="Luxury">Luxury</option>
                <option value="Budget">Budget</option>
                <option value="Family">Family</option>
                <option value="Relaxation">Relaxation</option>
              </select>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-500 hover:to-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-sky-500/20 hover:scale-102 active:scale-98 transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
              >
                <span>Generate Plan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.form>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-semibold text-slate-400">
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Booking Fees</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Real-Time Weather Sync</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Instant Offline Itineraries</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-20 bg-slate-950/80 border-t border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-sky-400 text-xs font-bold uppercase tracking-widest">Built for Modern Explorers</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Everything You Need for Seamless Journeys</h2>
            <p className="text-sm text-slate-400">Replace dozens of messy travel tabs with one integrated AI companion.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-1 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Smart Day-by-Day Plans</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Optimized itineraries designed by AI tailored to your dates, budget, and travel style with morning, afternoon, and evening activity breakdowns.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-1 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Plane className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Flight & Hotel Matching</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Search best routes, compare cabin fares and top-rated accommodations, and link them directly to your active trip with a single tap.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-1 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <CloudSun className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Weather & Packing Advisor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                5-day forecast previews with automated packing tips (rain warnings, temperature alerts, and wardrobe essentials) so you're never caught off guard.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-1 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">24/7 AI Travel Assistant</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chat with an AI companion that knows your trip details. Ask about local transit tips, hidden restaurant gems, tipping rules, and visa requirements.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-20 bg-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-sky-400 text-xs font-bold uppercase tracking-widest">Inspiration</span>
              <h2 className="text-3xl font-extrabold text-white mt-1">Trending Destinations This Season</h2>
            </div>
            <Link
              to="/plan-trip"
              className="text-sm font-bold text-sky-400 hover:text-sky-300 flex items-center space-x-1 mt-4 md:mt-0"
            >
              <span>Explore all destinations</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredDestinations.map((dest, i) => (
              <div
                key={i}
                onClick={() => {
                  if (user) {
                    navigate(`/plan-trip?destination=${encodeURIComponent(dest.name.split(',')[0])}`);
                  } else {
                    navigate(`/login?redirect=plan-trip&destination=${encodeURIComponent(dest.name.split(',')[0])}`);
                  }
                }}
                className="group relative rounded-3xl overflow-hidden bg-slate-800 border border-slate-700/60 cursor-pointer hover:shadow-2xl hover:shadow-sky-500/10 transition-all hover:-translate-y-1.5"
              >
                <div className="h-64 w-full relative overflow-hidden">
                  <img
                    src={dest.img}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <span className="absolute top-4 left-4 px-2.5 py-1 bg-sky-500/80 backdrop-blur-md text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">
                    {dest.badge}
                  </span>
                </div>
                <div className="p-5 relative -mt-16 z-10 space-y-1.5">
                  <h4 className="text-xl font-extrabold text-white">{dest.name}</h4>
                  <p className="text-xs text-sky-300 font-semibold">{dest.style}</p>
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Est. 5-Day Budget:</span>
                    <span className="font-extrabold text-emerald-400">{dest.cost}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Ready to Travel Smarter with AI?
          </h2>
          <p className="text-base text-slate-400 max-w-xl mx-auto">
            Join thousands of travelers crafting bespoke itineraries, locking in optimal flights, and exploring with confidence.
          </p>
          <div className="pt-2">
            <Link
              to={user ? '/dashboard' : '/login?tab=signup'}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 text-white rounded-2xl font-extrabold text-base shadow-xl shadow-sky-500/25 hover:scale-105 active:scale-95 transition-all"
            >
              <span>Get Started in 30 Seconds</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-800 text-center text-xs text-slate-500">
        <p>© 2026 TravelMate AI. Built for modern global travelers.</p>
      </footer>

    </div>
  );
}
