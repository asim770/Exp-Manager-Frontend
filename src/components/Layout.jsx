import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, ArrowDownUp, HandCoins, PiggyBank, 
  BarChart3, Calendar as CalendarIcon, User, Bell, Sun, 
  Moon, Search, Menu, X, Check, Trash2, Wallet, Sparkles, LogOut, Users
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import CommandPalette from './CommandPalette';
import FloatingChatButton from './FloatingChatButton';
import GradientText from './GradientText';
import Particles from './Particles';
import Ribbons from './Ribbons';

// Stable WebGL color references to prevent GPU context thrashing
const RIBBON_COLORS = ["#5227FF"];
const PARTICLE_COLORS_DARK = ["#ffffff"];
const PARTICLE_COLORS_LIGHT = ["#8b5cf6"];

const ContentFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
    <div className="spinner"></div>
    <p className="text-xs text-slate-400 dark:text-dark-500 font-semibold animate-pulse">Loading...</p>
  </div>
);

const Layout = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const { 
    profile, notifications, markNotificationRead, 
    markAllNotificationsRead, deleteNotificationRecord, 
    clearAllNotifications, currencySymbol 
  } = useFinance();
  const { user, logout } = useAuth();
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const notificationsRef = useRef(null);

  // Close notifications on outside click
  useEffect(() => {
    if (!isNotificationsOpen) return;
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationsOpen]);

  // Reset main container scroll when changing pages
  useEffect(() => {
    const container = document.getElementById('snap-main-container');
    if (container) {
      container.scrollTop = 0;
    }
  }, [location.pathname]);

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

  // Global mousemove tracking for .glass-panel border glow effects (throttled with rAF & cached rects)
  useEffect(() => {
    let rafId = null;
    let panelsCache = [];
    let lastCacheTime = 0;

    const updateCache = () => {
      const panels = document.querySelectorAll('.glass-panel');
      panelsCache = Array.from(panels)
        .filter(panel => !panel.classList.contains('card'))
        .map(panel => ({
          el: panel,
          rect: panel.getBoundingClientRect()
        }));
      lastCacheTime = performance.now();
    };

    const handleResize = () => updateCache();
    window.addEventListener('resize', handleResize, { passive: true });
    updateCache();

    const handleMouseMove = (e) => {
      if (rafId) return;
      const clientX = e.clientX;
      const clientY = e.clientY;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (performance.now() - lastCacheTime > 1500) {
          updateCache();
        }

        const pad = 150; // padding active range
        for (let i = 0; i < panelsCache.length; i++) {
          const { el: panel, rect } = panelsCache[i];
          if (
            clientX >= rect.left - pad &&
            clientX <= rect.right + pad &&
            clientY >= rect.top - pad &&
            clientY <= rect.bottom + pad
          ) {
            const x = ((clientX - rect.left) / rect.width) * 100;
            const y = ((clientY - rect.top) / rect.height) * 100;

            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distance = Math.hypot(clientX - centerX, clientY - centerY);
            const maxDim = Math.max(rect.width, rect.height);

            let intensity = 0;
            if (distance < maxDim) {
              intensity = 0.85;
            } else if (distance < maxDim + pad) {
              intensity = 0.85 * (1 - (distance - maxDim) / pad);
            }

            panel.style.setProperty('--glow-x', `${x}%`);
            panel.style.setProperty('--glow-y', `${y}%`);
            panel.style.setProperty('--glow-intensity', intensity.toString());
          } else if (panel.style.getPropertyValue('--glow-intensity') !== '0') {
            panel.style.setProperty('--glow-intensity', '0');
          }
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [location.pathname]);

  const navItems = React.useMemo(() => [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: ArrowDownUp },
    { name: 'Split Groups', path: '/split-groups', icon: Users },
    { name: 'Borrow & Lend', path: '/borrow-lend', icon: HandCoins },
    { name: 'Budgets & Savings', path: '/budgets-savings', icon: PiggyBank },
    { name: 'Analytics & Reports', path: '/reports', icon: BarChart3 },
    { name: 'Calendar', path: '/calendar', icon: CalendarIcon },
    { name: 'Profile & Settings', path: '/profile', icon: User },
    { name: 'AI Assistant', path: '/ai-assistant', icon: Sparkles },
  ], []);

  const unreadNotifications = notifications.filter(n => !n.read);

  const formatNotifyDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden relative flex bg-slate-100 dark:bg-[#07090e] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,70,255,0.14),rgba(7,9,14,0.98)),radial-gradient(ellipse_60%_60%_at_100%_100%,rgba(59,130,246,0.06),transparent),#07090e] text-slate-800 dark:text-dark-100">
      
      {/* Background ambient glows */}
      <div className="absolute top-[-5%] left-[-5%] w-[550px] h-[550px] rounded-full bg-brand-500/20 dark:bg-brand-500/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[550px] h-[550px] rounded-full bg-indigo-500/20 dark:bg-indigo-500/10 blur-[140px] pointer-events-none"></div>

      {/* Particles Background */}
      <div className="absolute inset-0 w-full h-full z-0 opacity-40 dark:opacity-30 pointer-events-none">
        <Particles
          particleColors={theme === 'dark' ? PARTICLE_COLORS_DARK : PARTICLE_COLORS_LIGHT}
          particleCount={150}
          particleSpread={12}
          speed={0.08}
          particleBaseSize={80}
          moveParticlesOnHover
          alphaParticles={false}
          disableRotation={false}
          pixelRatio={1}
        />
      </div>

      {/* Ribbons mouse cursor overlay for the entire project except landing page */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <Ribbons
          baseThickness={30}
          colors={RIBBON_COLORS}
          speedMultiplier={0.5}
          maxAge={500}
          enableFade={false}
          enableShaderEffect={false}
        />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 h-[calc(100vh-2rem)] glass-panel border border-slate-200/70 dark:border-white/10 m-4 mr-0 rounded-3xl z-30 relative overflow-hidden shrink-0 shadow-2xl">
        {/* Brand */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <GradientText
              colors={["#5227FF", "#FF9FFC", "#B497CF"]}
              animationSpeed={8}
              showBorder={false}
              className="text-xl font-extrabold tracking-tight"
            >
              MyExpManager
            </GradientText>
            <p className="text-xs text-slate-400 dark:text-dark-500 font-medium">Personal Finance Manager</p>
          </div>
        </div>

        {/* User Quick Info */}
        <div className="mx-4 mb-4 p-3.5 rounded-2xl glass-pill border border-slate-200/60 dark:border-white/10 flex items-center gap-3 shadow-sm">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-brand-500/30 shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-brand-500/20 text-brand-500 flex items-center justify-center font-bold uppercase shrink-0">
              {(user?.name || profile?.name)?.charAt(0) || 'U'}
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <h4 className="text-sm font-semibold truncate text-slate-900 dark:text-white">{user?.name || profile?.name || 'User'}</h4>
            <p className="text-[11px] text-slate-400 dark:text-dark-500 truncate">{user?.email || `Currency: ${currencySymbol}`}</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'glass-nav-active' 
                      : 'text-slate-500 dark:text-dark-400 hover:bg-white/50 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
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
        <div className="p-5 border-t border-slate-200/50 dark:border-white/10">
          <button 
            onClick={() => setIsCmdPaletteOpen(true)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl glass-pill border border-slate-200 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/[0.09] text-xs text-slate-400 dark:text-dark-400 transition-all shadow-sm"
          >
            <span className="flex items-center gap-2"><Search className="w-3.5 h-3.5" /> Command Menu</span>
            <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/10 text-[10px]">⌘K</kbd>
          </button>
          <button
            onClick={logout}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex-1 h-screen flex flex-col min-w-0 p-4 lg:p-6 overflow-hidden relative z-10">
        
        {/* Top Header */}
        <header className="w-full glass-header border border-slate-200/70 dark:border-white/10 h-20 rounded-3xl px-6 flex items-center justify-between mb-6 shrink-0 relative z-40 shadow-lg">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl glass-pill border border-slate-200/60 dark:border-white/10 lg:hidden text-slate-600 dark:text-dark-300"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-extrabold tracking-tight hidden md:block text-slate-900 dark:text-white">
              {navItems.find(item => item.path === location.pathname)?.name || 'Welcome'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick search button */}
            <button 
              onClick={() => setIsCmdPaletteOpen(true)}
              className="p-2.5 rounded-2xl glass-pill border border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-dark-300 hover:text-slate-800 dark:hover:text-white hover:scale-105 active:scale-95 transition-all shadow-sm"
              title="Command Palette (⌘K)"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-2xl glass-pill border border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-dark-300 hover:text-slate-800 dark:hover:text-white hover:scale-105 active:scale-95 transition-all shadow-sm"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2.5 rounded-2xl glass-pill border border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-dark-300 hover:text-slate-800 dark:hover:text-white hover:scale-105 active:scale-95 transition-all relative shadow-sm"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-md shadow-rose-500/30">
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
                      initial={{ opacity: 0, y: 15, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.96 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      className="absolute sm:right-0 -right-12 mt-3 w-[calc(100vw-2rem)] sm:w-96 max-w-[380px] glass-modal border border-slate-200/70 dark:border-white/15 rounded-3xl shadow-2xl p-4.5 z-50 overflow-hidden"
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
                              {n.type === 'group_invite' && (
                                <Link
                                  to="/split-groups"
                                  onClick={() => setIsNotificationsOpen(false)}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline mt-1"
                                >
                                  View Invitations &rarr;
                                </Link>
                              )}
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
            
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-2xl object-cover border border-brand-200/50 dark:border-brand-900/50 shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-brand-100 dark:bg-brand-950/50 border border-brand-200/50 dark:border-brand-900/50 flex items-center justify-center text-brand-600 dark:text-brand-400 font-extrabold uppercase shadow-sm">
                {(user?.name || profile?.name)?.substring(0, 2) || 'US'}
              </div>
            )}
          </div>
        </header>

        <main id="snap-main-container" className="flex-1 min-h-0 overflow-y-auto relative z-10 pr-1">
          <Suspense fallback={<ContentFallback />}>
            {children || <Outlet />}
          </Suspense>
        </main>
      </div>

  
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            
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
              className="fixed top-0 bottom-0 left-0 w-80 max-w-[85vw] glass-modal border-r border-slate-200/70 dark:border-white/10 z-50 lg:hidden p-6 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/25">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <GradientText
                    colors={["#5227FF", "#FF9FFC", "#B497CF"]}
                    animationSpeed={8}
                    showBorder={false}
                    className="text-lg font-extrabold tracking-tight"
                  >
                    MyExpManager
                  </GradientText>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg glass-pill border border-slate-200/50 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl glass-pill border border-slate-200/50 dark:border-white/10 flex items-center gap-3 mb-6">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-brand-500/30 shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-dark-700 flex items-center justify-center font-bold text-slate-600 dark:text-dark-200 uppercase shrink-0">
                    {(user?.name || profile?.name)?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="overflow-hidden flex-1">
                  <h4 className="text-sm font-semibold truncate text-slate-900 dark:text-white">{user?.name || profile?.name}</h4>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email || `Currency: ${currencySymbol}`}</p>
                </div>
              </div>

              <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)}>
                      <div className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                        isActive 
                          ? 'glass-nav-active' 
                          : 'text-slate-500 dark:text-dark-400 hover:bg-white/40 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
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
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl glass-pill border border-slate-200 dark:border-white/10 text-xs text-slate-400 dark:text-dark-400 transition-all mt-4"
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

      {/* Floating Action AI Coach Button */}
      <FloatingChatButton />
    </div>
  );
};

export default Layout;
