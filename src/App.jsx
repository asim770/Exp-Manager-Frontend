import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Public routes lazy-loaded
const LandingPage = lazy(() => import('./pages/LandingPage'));
const GoogleCallback = lazy(() => import('./pages/GoogleCallback'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

// Core authenticated pages imported statically for instant, flicker-free navigation
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import BorrowLend from './pages/BorrowLend';
import BudgetsSavings from './pages/BudgetsSavings';
import SplitGroups from './pages/SplitGroups';
import Reports from './pages/Reports';
import CalendarView from './pages/CalendarView';
import ProfileSettings from './pages/ProfileSettings';
import AiAssistant from './pages/AiAssistant';

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

                  {/* Protected Application Routes with Persistent Layout */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/borrow-lend" element={<BorrowLend />} />
                    <Route path="/split-groups" element={<SplitGroups />} />
                    <Route path="/split-groups/:groupId" element={<SplitGroups />} />
                    <Route path="/budgets-savings" element={<BudgetsSavings />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/calendar" element={<CalendarView />} />
                    <Route path="/profile" element={<ProfileSettings />} />
                    <Route path="/ai-assistant" element={<AiAssistant />} />
                  </Route>

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
