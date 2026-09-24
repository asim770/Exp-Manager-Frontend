import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const FinanceContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const FinanceProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/profile`);
      setProfile(res.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/notifications`);
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/dashboard`);
      setDashboardData(res.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      await Promise.all([
        fetchProfile(),
        fetchNotifications(),
        fetchDashboardData()
      ]);
      setError(null);
    } catch (err) {
      setError('Failed to fetch financial data from server.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, fetchProfile, fetchNotifications, fetchDashboardData]);

  // Fetch data whenever user logs in or authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshAll();
    } else {
      setProfile(null);
      setNotifications([]);
      setDashboardData(null);
      setLoading(false);
    }
  }, [isAuthenticated, refreshAll]);

  // Helper methods
  const updateProfileSettings = async (settings) => {
    try {
      const res = await axios.put(`${API_URL}/profile`, settings);
      setProfile(res.data);
      await fetchDashboardData(); // budget/theme changes might affect stats
      return res.data;
    } catch (err) {
      console.error('Failed to update profile settings', err);
      throw err;
    }
  };

  const markNotificationRead = async (id) => {
    try {
      await axios.put(`${API_URL}/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  };

  const deleteNotificationRecord = async (id) => {
    try {
      await axios.delete(`${API_URL}/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await axios.delete(`${API_URL}/notifications`);
      setNotifications([]);
    } catch (err) {
      console.error('Failed to clear notifications', err);
    }
  };

  const currencySymbol = profile?.currency || '$';

  return (
    <FinanceContext.Provider
      value={{
        profile,
        notifications,
        dashboardData,
        loading,
        error,
        currencySymbol,
        refreshAll,
        updateProfileSettings,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotificationRecord,
        clearAllNotifications,
        apiUrl: API_URL
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
