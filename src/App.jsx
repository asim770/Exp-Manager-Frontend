import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import BorrowLend from './pages/BorrowLend';
import BudgetsSavings from './pages/BudgetsSavings';
import Reports from './pages/Reports';
import CalendarView from './pages/CalendarView';
import ProfileSettings from './pages/ProfileSettings';
import AiAssistant from './pages/AiAssistant';
import GoogleCallback from './pages/GoogleCallback';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '666611753013-8dauik9chnkasm4268tml3ecc05mg0ns.apps.googleusercontent.com';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <ThemeProvider>
          <FinanceProvider>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth/callback" element={<GoogleCallback />} />
                <Route path="/api/auth/callback/google" element={<GoogleCallback />} />

                {/* Protected Application Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Layout><Dashboard /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/transactions"
                  element={
                    <ProtectedRoute>
                      <Layout><Transactions /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/borrow-lend"
                  element={
                    <ProtectedRoute>
                      <Layout><BorrowLend /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/budgets-savings"
                  element={
                    <ProtectedRoute>
                      <Layout><BudgetsSavings /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute>
                      <Layout><Reports /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <ProtectedRoute>
                      <Layout><CalendarView /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Layout><ProfileSettings /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai-assistant"
                  element={
                    <ProtectedRoute>
                      <Layout><AiAssistant /></Layout>
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </FinanceProvider>
        </ThemeProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
