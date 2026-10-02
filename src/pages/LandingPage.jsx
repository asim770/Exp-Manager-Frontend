import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ShieldCheck, Lock, LogOut, LayoutDashboard, Mail
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import LiquidEther from '../components/LiquidEther';
import GradientText from '../components/GradientText';
import AnimatedContent from '../components/AnimatedContent';
import AuthModal from '../components/AuthModal';
import GoogleAuthButton from '../components/GoogleAuthButton';
import MobileLoginView from '../components/MobileLoginView';

const LandingPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Phone / Mobile detection
  const [isMobileScreen, setIsMobileScreen] = useState(() => {
    if (typeof window !== 'undefined') {
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      return isMobileUA || window.innerWidth < 768;
    }
    return false;
  });
  const [forceDesktopView, setForceDesktopView] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobileScreen(isMobileUA || window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // On mobile phone, if user is already authenticated, take them directly to the dashboard
  useEffect(() => {
    if (isAuthenticated && isMobileScreen) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isMobileScreen, navigate]);

  // When on phone/mobile and user is not forcing desktop view, render direct Google Login screen
  if (isMobileScreen && !forceDesktopView && !isAuthenticated) {
    return (
      <MobileLoginView
        onSwitchToLanding={() => setForceDesktopView(true)}
      />
    );
  }

  return (
    <div className="h-screen bg-slate-50 dark:bg-dark-950 text-slate-800 dark:text-dark-100 transition-colors duration-300 relative overflow-hidden flex flex-col justify-between">

      {/* Background ambient glows */}
      <div className="absolute top-[-20%] left-[-10%] ambient-glow bg-brand-500/25 dark:bg-brand-500/10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] ambient-glow bg-blue-500/20 dark:bg-blue-500/10"></div>

      {/* LiquidEther Background (only rendered on desktop for performance) */}
      <div className="absolute inset-0 w-full h-full z-0 opacity-60 dark:opacity-40">
        <LiquidEther
          colors={['#5227FF', '#FF9FFC', '#B497CF']}
          mouseForce={20}
          cursorSize={100}
          isViscous
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
      </div>

      {/* Glassmorphic Navbar */}
      <nav className="h-20 glass-nav z-50 px-6 lg:px-12 flex items-center justify-between shrink-0 relative">
        <div className="flex items-center gap-2.5">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600/90 to-indigo-500/90 border border-white/20 flex items-center justify-center text-white font-extrabold shadow-lg shadow-brand-500/20 backdrop-blur-md overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
            <span className="relative z-10">P</span>
          </div>
          <GradientText
            colors={["#5227FF", "#FF9FFC", "#B497CF"]}
            animationSpeed={8}
            showBorder={false}
            className="text-xl font-extrabold tracking-tight landing-glass-brand"
          >
            MyExpManager
          </GradientText>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.08] dark:bg-slate-900/50 border border-white/15 backdrop-blur-md text-xs text-slate-300">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">
                    {user?.name?.[0] || 'U'}
                  </div>
                )}
                <span className="font-medium truncate max-w-[120px]">{user?.name}</span>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="group relative inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500/25 hover:bg-brand-500/35 text-white border border-brand-400/40 font-semibold text-xs shadow-lg shadow-brand-500/20 backdrop-blur-md transition-all hover:-translate-y-0.5 overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </button>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/[0.08] transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAuthModal(true)}
                className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 text-white font-semibold text-xs border border-brand-400/35 hover:border-brand-400/60 backdrop-blur-xl shadow-[0_4px_16px_rgba(139,92,246,0.25),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />
                <Lock className="w-3.5 h-3.5 text-brand-300 group-hover:text-brand-200 transition-colors" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section Container */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 lg:px-12 max-w-7xl mx-auto relative z-10 w-full">
        <div className="flex flex-col items-center text-center max-w-4xl">
          {/* Badge */}
          <AnimatedContent
            distance={40}
            direction="vertical"
            delay={0.15}
            duration={0.7}
            ease="power3.out"
          >
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200/50 dark:border-brand-900/60 text-[11px] font-bold text-brand-600 dark:text-brand-400 mb-6 backdrop-blur-md shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Multi-User Finance Hub • Google Authentication
            </div>
          </AnimatedContent>

          {/* Heading with Glassmorphism Text Effect */}
          <AnimatedContent
            distance={60}
            direction="vertical"
            delay={0.3}
            duration={0.8}
            ease="power3.out"
          >
            <div className="relative">
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[5.5rem] font-normal tracking-[-0.02em] leading-[1.08] mb-6 glass-text-hero select-none">
                Take Control of Your <br className="hidden sm:inline" />
                Wealth, Securely.
              </h1>
            </div>
          </AnimatedContent>

          {/* Subheading with Glassmorphism Text Effect */}
          <AnimatedContent
            distance={50}
            direction="vertical"
            delay={0.45}
            duration={0.8}
            ease="power3.out"
          >
            <p className="glass-text-sub text-sm sm:text-base max-w-xl leading-relaxed mb-8 font-light">
              A modern, intelligent personal finance manager with individual Google accounts, bank-grade data isolation, interactive cash flow charts, budgeting, savings targets, and AI assistant.
            </p>
          </AnimatedContent>
          {/* Action Buttons */}
          <AnimatedContent
            distance={40}
            direction="vertical"
            delay={0.6}
            duration={0.7}
            ease="power3.out"
          >
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-sm shadow-2xl shadow-brand-500/25 hover:shadow-brand-500/35 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                Go to Dashboard <ArrowRight className="w-4.5 h-4.5" />
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-3.5">
                <GoogleAuthButton
                  variant="glass"
                  buttonText="Sign in with Google"
                  onSuccess={() => navigate('/dashboard')}
                />
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="group relative inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.16] text-slate-200 hover:text-white border border-white/1 hover:border-white/35 font-semibold text-sm transition-all duration-300 backdrop-blur-xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.35)] hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer overflow-hidden"
                >
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
                  <Mail className="w-4 h-4 text-indigo-300 group-hover:text-indigo-200 transition-colors" />
                  <span>Sign In with Email</span>
                </button>
              </div>
            )}
          </AnimatedContent>
        </div>
      </section>

      {/* Footer */}
      <footer className="h-14 border-t border-slate-200 dark:border-dark-900 bg-white/20 dark:bg-dark-950/40 relative z-10 px-6 lg:px-12 text-center text-[10px] text-slate-400 dark:text-dark-600 font-bold flex flex-col sm:flex-row justify-between items-center gap-2 shrink-0">
        <span>© {new Date().getFullYear()} MyExpManager. Powered by Google Authentication & Gemini AI.</span>
        <div className="flex items-center gap-4">
          <span className="text-emerald-500 font-medium">Google OAuth Protected</span>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default LandingPage;
