import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Splash from './pages/Splash';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import PlanTrip from './pages/PlanTrip';
import Chat from './pages/Chat';
import Hotels from './pages/Hotels';

import Weather from './pages/Weather';
import SavedTrips from './pages/SavedTrips';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import CustomCursor from './components/CustomCursor';

// Protected Route wrapper with AuthContext check
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  const token = localStorage.getItem('token');


  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20 animate-pulse">
          T
        </div>
        <p className="text-xs font-bold text-slate-400">Loading your travel space...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          {/* Custom Cursor Overlay */}
          <CustomCursor />

          <Routes>
            {/* Landing View */}
            <Route path="/" element={<Splash />} />

            {/* Login / Signup / Forgot Password */}
            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />
            <Route path="/forgot-password" element={<Auth />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/plan-trip"
              element={
                <ProtectedRoute>
                  <PlanTrip />
                </ProtectedRoute>
              }
            />

            <Route
              path="/saved-trips"
              element={
                <ProtectedRoute>
                  <SavedTrips />
                </ProtectedRoute>
              }
            />

            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />

            <Route
              path="/hotels"
              element={
                <ProtectedRoute>
                  <Hotels />
                </ProtectedRoute>
              }
            />


            <Route
              path="/weather"
              element={
                <ProtectedRoute>
                  <Weather />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
