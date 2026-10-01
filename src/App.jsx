import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Lazy-loaded pages for optimal bundle splitting
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const BorrowLend = lazy(() => import('./pages/BorrowLend'));
const BudgetsSavings = lazy(() => import('./pages/BudgetsSavings'));
const SplitGroups = lazy(() => import('./pages/SplitGroups'));
const Reports = lazy(() => import('./pages/Reports'));
const CalendarView = lazy(() => import('./pages/CalendarView'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));
const AiAssistant = lazy(() => import('./pages/AiAssistant'));
const GoogleCallback = lazy(() => import('./pages/GoogleCallback'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '666611753013-8dauik9chnkasm4268tml3ecc05mg0ns.apps.googleusercontent.com';

const RouteFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
    <div className="spinner"></div>
    <p className="text-xs text-slate-400 dark:text-dark-500 font-semibold animate-pulse">Loading...</p>
  </div>
);

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <ThemeProvider>
          <FinanceProvider>
            <Router>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
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
                  path="/split-groups"
                  element={
                    <ProtectedRoute>
                      <Layout><SplitGroups /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/split-groups/:groupId"
                  element={
                    <ProtectedRoute>
                      <Layout><SplitGroups /></Layout>
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
            </Suspense>
          </Router>
          </FinanceProvider>
        </ThemeProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
