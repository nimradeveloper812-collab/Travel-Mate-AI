import { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  MapPin,
  DollarSign,
  Compass,
  Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../lib/api';

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const { success, error: toastError } = useToast();

  const [name, setName] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [style, setStyle] = useState('Adventure');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [tripStats, setTripStats] = useState<{ total_trips: number; total_budget: number } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setHomeCity(user.home_city || '');
      setCurrency(user.preferred_currency || 'USD');
      setStyle(user.travel_style || 'Adventure');
      setBio(user.bio || '');
    }
  }, [user]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await api.get('/trips/stats');
        setTripStats(res.data);
      } catch (e) {
        console.error('Error fetching stats for profile', e);
      }
    };
    loadStats();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile({
        name,
        home_city: homeCity,
        preferred_currency: currency,
        travel_style: style,
        bio
      });
      success('Profile and travel preferences updated successfully!', 'Profile Saved');
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to update profile.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const displayName = name || user?.email?.split('@')[0] || 'Traveler';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center space-x-2.5">
          <UserIcon className="w-6 h-6 text-sky-500" />
          <span>My Profile & Travel Persona</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Customize your personal details, home airport, and preferred travel parameters.
        </p>
      </div>

      {/* Profile Card & Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Avatar Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col items-center text-center space-y-4">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-sky-400 via-blue-600 to-indigo-600 text-white font-black text-3xl flex items-center justify-center shadow-xl shadow-blue-500/20">
            {initial}
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-slate-800">{displayName}</h3>
            <p className="text-xs text-slate-400 font-medium">{user?.email}</p>
          </div>

          <div className="pt-2 w-full space-y-2 text-xs border-t border-slate-100">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-bold">Account Tier:</span>
              <span className="text-sky-600 font-bold bg-sky-50 px-2 py-0.5 rounded-md">Pro Explorer</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-bold">Total Trips:</span>
              <span className="font-bold text-slate-800">{tripStats?.total_trips || 0}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-bold">Budget Allocated:</span>
              <span className="font-bold text-emerald-600">${tripStats?.total_budget?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSave} className="space-y-5">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Full Name</label>
                <div className="relative flex items-center">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Email (Read Only)</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-400 font-semibold cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Home City / Airport</label>
                <div className="relative flex items-center">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={homeCity}
                    onChange={(e) => setHomeCity(e.target.value)}
                    placeholder="e.g. New York (JFK), London (LHR)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Preferred Currency</label>
                <div className="relative flex items-center">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-blue-500 focus:bg-white cursor-pointer"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Default Travel Style</label>
              <div className="relative flex items-center">
                <Compass className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-blue-500 focus:bg-white cursor-pointer"
                >
                  <option value="Adventure">Adventure & Hiking</option>
                  <option value="Luxury">Luxury & Comfort</option>
                  <option value="Budget">Budget / Backpacker</option>
                  <option value="Family">Family Friendly</option>
                  <option value="Relaxation">Relaxation & Spa</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Bio & Dream Travel Bucket List</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your travel philosophy or dream list (e.g. Scuba diving Great Barrier Reef, Trekking Patagonia)..."
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-medium focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:from-sky-500 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
}
