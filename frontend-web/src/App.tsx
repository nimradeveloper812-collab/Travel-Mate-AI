import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Splash from './pages/Splash';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import PlanTrip from './pages/PlanTrip';
import Chat from './pages/Chat';
import Flights from './pages/Flights';
import Hotels from './pages/Hotels';
import Weather from './pages/Weather';
import SavedTrips from './pages/SavedTrips';
import Layout from './components/Layout';
import CustomCursor from './components/CustomCursor';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Custom Cursor Overlay */}
      <CustomCursor />
      
      <Routes>
        {/* Splash View */}
        <Route path="/" element={<Splash />} />
        
        {/* Login / Signup View */}
        <Route path="/login" element={<Auth />} />

        {/* Authenticated Application Views */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/plan-trip" element={
          <ProtectedRoute>
            <Layout>
              <PlanTrip />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/chat" element={
          <ProtectedRoute>
            <Layout>
              <Chat />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/flights" element={
          <ProtectedRoute>
            <Layout>
              <Flights />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/hotels" element={
          <ProtectedRoute>
            <Layout>
              <Hotels />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/weather" element={
          <ProtectedRoute>
            <Layout>
              <Weather />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/saved-trips" element={
          <ProtectedRoute>
            <Layout>
              <SavedTrips />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
