import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export interface User {
  id: number;
  name: string;
  email: string;
  home_city?: string;
  preferred_currency?: string;
  travel_style?: string;
  bio?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User> & { current_password?: string; new_password?: string }) => Promise<User>;
  forgotPassword: (email: string) => Promise<{ message: string; reset_token?: string }>;
  resetPassword: (token: string, new_password: string) => Promise<string>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (err) {
      console.error('Failed to fetch user profile, clearing session', err);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const accessToken = response.data.access_token;
    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    await fetchProfile();
  };

  const signup = async (name: string, email: string, password: string) => {
    await api.post('/auth/signup', { name, email, password });
    // Auto login
    const loginRes = await api.post('/auth/login', { email, password });
    const accessToken = loginRes.data.access_token;
    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    await fetchProfile();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data: Partial<User> & { current_password?: string; new_password?: string }) => {
    const response = await api.put('/auth/profile', data);
    setUser(response.data);
    return response.data;
  };

  const forgotPassword = async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  };

  const resetPassword = async (resetToken: string, new_password: string) => {
    const response = await api.post('/auth/reset-password', { token: resetToken, new_password });
    return response.data.message;
  };

  const refreshUser = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        updateProfile,
        forgotPassword,
        resetPassword,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
