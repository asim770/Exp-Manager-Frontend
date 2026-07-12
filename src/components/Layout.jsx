import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, ArrowDownUp, HandCoins, PiggyBank, 
  BarChart3, Calendar as CalendarIcon, User, Bell, Sun, 
  Moon, Search, Menu, X, Check, Trash2, Wallet
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import CommandPalette from './CommandPalette';

const Layout = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const { 
    profile, notifications, markNotificationRead, 
    markAllNotificationsRead, deleteNotificationRecord, 
    clearAllNotifications, currencySymbol 
  } = useFinance();
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);

  // Keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: ArrowDownUp },
    { name: 'Borrow & Lend', path: '/borrow-lend', icon: HandCoins },
    { name: 'Budgets & Savings', path: '/budgets-savings', icon: PiggyBank },
    { name: 'Analytics & Reports', path: '/reports', icon: BarChart3 },
    { name: 'Calendar', path: '/calendar', icon: CalendarIcon },
    { name: 'Profile & Settings', path: '/profile', icon: User },
  ];

  const unreadNotifications = notifications.filter(n => !n.read);

  const formatNotifyDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen relative flex bg-slate-50 dark:bg-dark-950 text-slate-800 dark:text-dark-100 transition-colors duration-300">
      
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] ambient-glow bg-brand-500/20 dark:bg-brand-500/10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] ambient-glow bg-blue-500/20 dark:bg-blue-500/10"></div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 glass-panel border-r border-slate-200 dark:border-dark-800/50 m-4 mr-0 rounded-3xl z-30 relative overflow-hidden">
        {/* Brand */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-600 to-indigo-500 dark:from-brand-400 dark:to-indigo-300 bg-clip-text text-transparent">
              Antigravity Pay
            </h1>
            <p className="text-xs text-slate-400 dark:text-dark-500 font-medium">Personal Finance Manager</p>
          </div>
        </div>

        {/* User Quick Info */}
        <div className="mx-4 mb-4 p-4 rounded-2xl bg-slate-100/50 dark:bg-dark-900/40 border border-slate-200/40 dark:border-dark-800/40 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-dark-700 flex items-center justify-center font-bold text-slate-600 dark:text-dark-200 uppercase">
            {profile?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="text-sm font-semibold truncate">{profile?.name || 'Loading...'}</h4>
            <p className="text-xs text-slate-400 dark:text-dark-500 truncate">Currency: {currencySymbol}</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25' 
                      : 'text-slate-500 dark:text-dark-400 hover:bg-slate-100/70 dark:hover:bg-dark-900/60 hover:text-slate-800 dark:hover:text-dark-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-6 border-t border-slate-200/50 dark:border-dark-800/50">
          <button 
            onClick={() => setIsCmdPaletteOpen(true)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-800/80 bg-white/40 dark:bg-dark-900/40 hover:bg-slate-100 dark:hover:bg-dark-900 text-xs text-slate-400 dark:text-dark-500 transition-all"
          >
            <span className="flex items-center gap-2"><Search className="w-3.5 h-3.5" /> Command Menu</span>
            <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-dark-700 bg-slate-100 dark:bg-dark-800 text-[10px]">⌘K</kbd>
          </button>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 overflow-x-hidden relative z-10">
        
        {/* Top Header */}
        <header className="w-full glass-panel border border-slate-200 dark:border-dark-800/50 h-20 rounded-3xl px-6 flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-dark-900 border border-slate-200/50 dark:border-dark-800 lg:hidden text-slate-600 dark:text-dark-300"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold tracking-tight hidden md:block">
              {navItems.find(item => item.path === location.pathname)?.name || 'Welcome'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick search button */}
            <button 
              onClick={() => setIsCmdPaletteOpen(true)}
              className="p-2.5 rounded-2xl bg-white/80 dark:bg-dark-900/80 border border-slate-200/50 dark:border-dark-800/50 shadow-sm text-slate-500 dark:text-dark-400 hover:text-slate-800 dark:hover:text-dark-200 transition-all"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-2xl bg-white/80 dark:bg-dark-900/80 border border-slate-200/50 dark:border-dark-800/50 shadow-sm text-slate-500 dark:text-dark-400 hover:text-slate-800 dark:hover:text-dark-200 transition-all"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2.5 rounded-2xl bg-white/80 dark:bg-dark-900/80 border border-slate-200/50 dark:border-dark-800/50 shadow-sm text-slate-500 dark:text-dark-400 hover:text-slate-800 dark:hover:text-dark-200 transition-all relative"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    {/* Overlay to close */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="absolute right-0 mt-3 w-80 md:w-96 glass-panel border border-slate-200 dark:border-dark-800 rounded-2xl shadow-2xl p-4 z-50 overflow-hidden"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-900">
                        <h4 className="font-bold text-sm">Notifications</h4>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={markAllNotificationsRead}
                            className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline"
                          >
                            Mark all read
                          </button>
                          <button 
                            onClick={clearAllNotifications}
                            className="text-xs text-rose-500 font-semibold hover:underline flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Clear
                          </button>
                        </div>
                      </div>

                      <div className="max-h-72 overflow-y-auto mt-2 divide-y divide-slate-100 dark:divide-dark-900 pr-1">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 dark:text-dark-500 text-xs font-medium">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div 
                              key={n._id} 
                              className={`py-3 flex flex-col gap-1 transition-all ${
                                !n.read ? 'bg-brand-50/30 dark:bg-brand-950/15 -mx-4 px-4' : ''
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <h5 className={`text-xs font-bold ${!n.read ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-dark-400'}`}>
                                  {n.title}
                                </h5>
                                <div className="flex items-center gap-1.5">
                                  {!n.read && (
                                    <button 
                                      onClick={() => markNotificationRead(n._id)}
                                      className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-dark-800 text-brand-600"
                                      title="Mark read"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => deleteNotificationRecord(n._id)}
                                    className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-dark-800 text-rose-500"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-dark-400 leading-relaxed font-medium">
                                {n.message}
                              </p>
                              <span className="text-[9px] text-slate-400 dark:text-dark-600 font-medium">
                                {formatNotifyDate(n.date)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            
            <div className="w-10 h-10 rounded-2xl bg-brand-100 dark:bg-brand-950/50 border border-brand-200/50 dark:border-brand-900/50 flex items-center justify-center text-brand-600 dark:text-brand-400 font-extrabold uppercase shadow-sm">
              {profile?.name?.substring(0, 2) || 'AM'}
            </div>
          </div>
        </header>

        {/* Page Content with simple scale-up transition */}
        <main className="flex-1 min-h-0 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            ></motion.div>

            {/* Sidebar Drawer */}
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-80 max-w-[85vw] glass-panel border-r border-slate-200 dark:border-dark-800 z-50 lg:hidden p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/25">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-brand-600 to-indigo-500 dark:from-brand-400 dark:to-indigo-300 bg-clip-text text-transparent">
                    Antigravity Pay
                  </h1>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-dark-900 border border-slate-200/50 dark:border-dark-800 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-100/50 dark:bg-dark-900/40 border border-slate-200/40 dark:border-dark-800/40 flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-dark-700 flex items-center justify-center font-bold text-slate-600 dark:text-dark-200 uppercase">
                  {profile?.name?.charAt(0) || 'A'}
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-sm font-semibold truncate">{profile?.name}</h4>
                  <p className="text-xs text-slate-400 truncate">Currency: {currencySymbol}</p>
                </div>
              </div>

              <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)}>
                      <div className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium ${
                        isActive 
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20' 
                          : 'text-slate-500 dark:text-dark-400 hover:bg-slate-100/70 dark:hover:bg-dark-900/60'
                      }`}>
                        <Icon className="w-5 h-5" />
                        {item.name}
                      </div>
                    </Link>
                  );
                })}
              </nav>

              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsCmdPaletteOpen(true);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-800 bg-white/40 dark:bg-dark-900/40 text-xs text-slate-400 dark:text-dark-500 transition-all mt-4"
              >
                <span className="flex items-center gap-2"><Search className="w-3.5 h-3.5" /> Command Palette</span>
                <kbd className="px-1 py-0.5 rounded border border-slate-200 dark:border-dark-700 bg-slate-100 dark:bg-dark-800 text-[10px]">⌘K</kbd>
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Global Command Palette dialog */}
      <CommandPalette isOpen={isCmdPaletteOpen} setIsOpen={setIsCmdPaletteOpen} />
    </div>
  );
};

export default Layout;
