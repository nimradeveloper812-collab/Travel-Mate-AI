import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Map, 
  MessageSquareCode, 
  Plane, 
  Hotel, 
  CloudSun, 
  Bookmark, 
  LogOut, 
  User 
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        setUserEmail(payload.sub || 'Traveler');
      } catch (err) {
        setUserEmail('Traveler');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/plan-trip', label: 'Plan Trip (AI)', icon: Map },
    { to: '/chat', label: 'AI Chat', icon: MessageSquareCode },
    { to: '/flights', label: 'Flights', icon: Plane },
    { to: '/hotels', label: 'Hotels', icon: Hotel },
    { to: '/weather', label: 'Weather', icon: CloudSun },
    { to: '/saved-trips', label: 'Saved Trips', icon: Bookmark },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      
      {/* Decorative Cloud Background lines */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M-100,200 Q200,100 500,200 T1100,200" fill="none" stroke="#93c5fd" strokeWidth="2" />
          <path d="M100,400 Q400,300 800,450 T1500,300" fill="none" stroke="#93c5fd" strokeWidth="1" />
        </svg>
      </div>

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col z-10">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center shadow-md shadow-sky-200">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <span className="font-bold text-lg text-slate-800 tracking-tight">TravelMate AI</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `
                  relative flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 interactive
                  ${isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-blue-50/70 border border-blue-100/50 rounded-xl"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10"><Icon className="w-5 h-5" /></span>
                <span className="relative z-10">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-800 truncate">
                {userEmail.split('@')[0]}
              </span>
              <span className="text-[10px] text-slate-400 truncate">{userEmail}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 hover:text-red-500 text-slate-400 rounded-lg transition-colors duration-200 interactive"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Page Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 z-10">
        
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8">
          <h1 className="text-xl font-bold text-slate-800">
            {navItems.find(item => item.to === location.pathname)?.label || 'App'}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 text-xs font-semibold bg-sky-50 text-sky-600 border border-sky-100 rounded-full">
              Premium Account
            </span>
          </div>
        </header>

        {/* Content Pane Wrapper */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
