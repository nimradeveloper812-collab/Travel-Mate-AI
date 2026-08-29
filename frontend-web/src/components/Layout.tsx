import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Compass,
  Sparkles,
  Plane,
  Hotel,
  CloudSun,
  BookmarkCheck,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  PlusCircle,
  ShieldCheck,
  MapPin
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface LayoutProps {
  children: React.ReactNode;
}

const mainNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/plan-trip', label: 'Plan Trip', icon: Compass, badge: 'AI' },
  { to: '/saved-trips', label: 'Saved Trips', icon: BookmarkCheck },
  { to: '/chat', label: 'AI Assistant', icon: Sparkles },
  { to: '/flights', label: 'Flights', icon: Plane },
  { to: '/hotels', label: 'Hotels', icon: Hotel },
  { to: '/weather', label: 'Weather', icon: CloudSun },
];

const secondaryNavItems = [
  { to: '/profile', label: 'My Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { success } = useToast();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Close drawer and dropdown on route changes
  useEffect(() => {
    setMobileDrawerOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    success('You have been logged out safely.', 'Signed Out');
    navigate('/login');
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'Traveler';
  const initial = displayName.charAt(0).toUpperCase();

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white/95 backdrop-blur-xl border-r border-slate-200/80">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-slate-100/80">
        <NavLink to="/dashboard" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <span className="text-white font-black text-xl tracking-wider">T</span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-lg text-slate-800 tracking-tight">TravelMate</span>
              <span className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Smart Journey Copilot</p>
          </div>
        </NavLink>
        <button
          className="lg:hidden p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Action */}
      <div className="px-4 pt-4 pb-2">
        <NavLink
          to="/plan-trip"
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-98"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New AI Itinerary</span>
        </NavLink>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 px-3 py-3 space-y-6 overflow-y-auto custom-scrollbar">
        <div>
          <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Explore & Plan
          </span>
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'text-blue-600 font-bold bg-sky-50/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Account & System
          </span>
          <nav className="space-y-1">
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`relative flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'text-blue-600 font-bold bg-sky-50/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Footer Profile Card */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60 m-2 rounded-2xl flex items-center justify-between">
        <NavLink to="/profile" className="flex items-center space-x-3 min-w-0 flex-1 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-sky-400 text-white font-bold flex items-center justify-center shadow-sm shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 truncate">{displayName}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email || 'Active'}</p>
          </div>
        </NavLink>
        <button
          onClick={handleLogout}
          title="Log Out"
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-sky-50/25 to-slate-100/60 overflow-hidden font-sans">
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col z-20 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="fixed top-0 bottom-0 left-0 w-72 z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/70 px-4 md:px-8 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Toggle mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-800 text-base md:text-lg">
                {mainNavItems.concat(secondaryNavItems).find((i) => i.to === location.pathname)?.label || 'TravelMate'}
              </span>
              {user?.home_city && (
                <span className="hidden sm:inline-flex items-center text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full space-x-1">
                  <MapPin className="w-3 h-3 text-sky-500" />
                  <span>{user.home_city}</span>
                </span>
              )}
            </div>
          </div>

          {/* Right Top Header Actions */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/60 rounded-full text-emerald-700 text-xs font-bold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>AI Trip Ready</span>
            </div>

            {/* Profile Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2.5 p-1.5 pl-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <span className="text-xs font-bold text-slate-700 max-w-[100px] truncate hidden sm:inline-block">
                  {displayName}
                </span>
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-400 to-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  {initial}
                </div>
              </button>

              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-200/90 shadow-xl py-2 z-50 text-xs"
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-800 truncate">{displayName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <NavLink
                      to="/profile"
                      className="flex items-center space-x-2.5 px-4 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors font-semibold"
                    >
                      <User className="w-4 h-4" />
                      <span>My Profile</span>
                    </NavLink>
                    <NavLink
                      to="/settings"
                      className="flex items-center space-x-2.5 px-4 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors font-semibold"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings & API</span>
                    </NavLink>
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors font-bold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Scrollable Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 lg:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
              className="max-w-7xl mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-3 flex items-center justify-around z-30 shadow-lg">
          {[
            { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
            { to: '/plan-trip', label: 'Plan', icon: Compass },
            { to: '/saved-trips', label: 'Trips', icon: BookmarkCheck },
            { to: '/chat', label: 'Chat', icon: Sparkles },
            { to: '/profile', label: 'Profile', icon: User },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                  isActive ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

      </div>
    </div>
  );
}
