import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('exp_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('exp_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up global axios request interceptor to attach Bearer token
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const storedToken = localStorage.getItem('exp_token');
        if (storedToken) {
          config.headers.Authorization = `Bearer ${storedToken}`;
        }
        return config;
      },
      (err) => Promise.reject(err)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response && err.response.status === 401) {
          // If unauthorized, clear auth and prompt re-login
          console.warn('Session expired or unauthorized (401). Clearing credentials.');
          localStorage.removeItem('exp_token');
          localStorage.removeItem('exp_user');
          setToken(null);
          setUser(null);
        }
        return Promise.reject(err);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Verify stored session on app boot
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('exp_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('exp_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.warn('Token validation failed:', err.message);
        localStorage.removeItem('exp_token');
        localStorage.removeItem('exp_user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  // Handle Google Login with ID Token (Credential) from GIS
  const loginWithGoogleCredential = async (credential) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/google`, { credential });
      const { token: newToken, user: newUser } = res.data;

      localStorage.setItem('exp_token', newToken);
      localStorage.setItem('exp_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Google authentication failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Login with Authorization Code
  const loginWithGoogleCode = async (code, redirectUri) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/google`, { code, redirectUri });
      const { token: newToken, user: newUser } = res.data;

      localStorage.setItem('exp_token', newToken);
      localStorage.setItem('exp_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to exchange authorization code';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Direct login when returned from callback redirect
  const loginWithDirectToken = (newToken, newUser) => {
    localStorage.setItem('exp_token', newToken);
    localStorage.setItem('exp_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setError(null);
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('exp_token');
    localStorage.removeItem('exp_user');
    setToken(null);
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        error,
        loginWithGoogleCredential,
        loginWithGoogleCode,
        loginWithDirectToken,
        logout,
        apiUrl: API_URL,
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
