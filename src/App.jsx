import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { FinanceProvider } from './context/FinanceContext';
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

function App() {
  return (
    <ThemeProvider>
      <FinanceProvider>
        <Router>
          <Routes>
            {/* Landing page (No layout) */}
            <Route path="/" element={<LandingPage />} />

            {/* App routes (With premium layout wrapping) */}
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/transactions" element={<Layout><Transactions /></Layout>} />
            <Route path="/borrow-lend" element={<Layout><BorrowLend /></Layout>} />
            <Route path="/budgets-savings" element={<Layout><BudgetsSavings /></Layout>} />
            <Route path="/reports" element={<Layout><Reports /></Layout>} />
            <Route path="/calendar" element={<Layout><CalendarView /></Layout>} />
            <Route path="/profile" element={<Layout><ProfileSettings /></Layout>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </FinanceProvider>
    </ThemeProvider>
  );
}

export default App;
