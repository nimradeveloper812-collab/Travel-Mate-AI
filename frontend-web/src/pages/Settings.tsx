import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Lock,
  Bell,
  Key,
  Eye,
  EyeOff,
  Sparkles,
  Database
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Settings() {
  const { updateProfile } = useAuth();
  const { success, error: toastError } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Notification states
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toastError('Please enter your current password.', 'Validation Error');
      return;
    }
    if (newPassword.length < 6) {
      toastError('New password must be at least 6 characters.', 'Validation Error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError('New passwords do not match.', 'Validation Error');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        current_password: currentPassword,
        new_password: newPassword
      });
      success('Password changed successfully!', 'Security Updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to update password.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center space-x-2.5">
          <SettingsIcon className="w-6 h-6 text-sky-500" />
          <span>App Settings & Security</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your login credentials, notifications, and AI API configurations.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Security & Password Change */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-blue-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Account Password</h3>
              <p className="text-xs text-slate-400">Update your password securely</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Current Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-blue-500 focus:bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Hide Passwords' : 'Show Passwords'}</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:from-sky-500 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Notification Alerts</h3>
              <p className="text-xs text-slate-400">Configure travel alerts and automatic updates</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition-colors cursor-pointer">
              <div>
                <p className="text-xs font-bold text-slate-800">Trip Weather & Packing Reminders</p>
                <p className="text-[11px] text-slate-500">Alerts when rain or temperature shifts are detected near your travel dates</p>
              </div>
              <input
                type="checkbox"
                checked={weatherAlerts}
                onChange={(e) => setWeatherAlerts(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition-colors cursor-pointer">
              <div>
                <p className="text-xs font-bold text-slate-800">Flight Price Drop Alerts</p>
                <p className="text-[11px] text-slate-500">Notify me when airfare drops for saved destination searches</p>
              </div>
              <input
                type="checkbox"
                checked={priceAlerts}
                onChange={(e) => setPriceAlerts(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition-colors cursor-pointer">
              <div>
                <p className="text-xs font-bold text-slate-800">Weekly AI Travel Inspiration Digest</p>
                <p className="text-[11px] text-slate-500">Receive curated seasonal destination tips once a week</p>
              </div>
              <input
                type="checkbox"
                checked={weeklyDigest}
                onChange={(e) => setWeeklyDigest(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* API Services Information */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">AI & Provider Integrations</h3>
              <p className="text-xs text-slate-400">Information about active services</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                <Sparkles className="w-4 h-4 text-sky-500" />
                <span>Gemini 1.5 / 2.0 AI</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Generates day-by-day itineraries and answers conversational queries. Includes offline fallback generator.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                <Key className="w-4 h-4 text-blue-500" />
                <span>Skyscanner RapidAPI</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Searches flight routes, airport sky IDs, and hotel destinations. Fallback simulation enabled.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                <Database className="w-4 h-4 text-amber-500" />
                <span>OpenWeatherMap</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Retrieves 5-day metric forecasts and automated packing recommendations.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
