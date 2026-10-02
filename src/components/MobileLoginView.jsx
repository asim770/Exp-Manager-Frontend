import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Sparkles, Sun, Moon, Mail 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import GradientText from './GradientText';
import GoogleAuthButton from './GoogleAuthButton';
import AuthModal from './AuthModal';

const MobileLoginView = ({ onSwitchToLanding }) => {
  const { theme, toggleTheme } = useTheme();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('LOGIN');

  const openAuth = (mode = 'LOGIN') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 relative overflow-hidden select-none">
      
      {/* Background ambient lighting */}
      <div className="absolute top-[-20%] left-[-20%] w-80 h-80 rounded-full bg-brand-600/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <div className="flex items-center justify-between z-10 pt-2">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-600/90 to-indigo-500/90 border border-white/20 flex items-center justify-center text-white font-extrabold shadow-lg shadow-brand-500/20 backdrop-blur-md overflow-hidden text-sm">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
            <span className="relative z-10">P</span>
          </div>
          <GradientText
            colors={["#5227FF", "#FF9FFC", "#B497CF"]}
            animationSpeed={8}
            showBorder={false}
            className="text-lg font-black tracking-tight landing-glass-brand"
          >
            MyExpManager
          </GradientText>
        </div>

        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-slate-300 hover:text-white backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] transition-colors cursor-pointer"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center py-8 z-10 max-w-sm mx-auto w-full">
        
        {/* Floating Tag */}
        <div className="relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.06] dark:bg-brand-950/40 border border-white/15 dark:border-brand-500/25 text-[11px] font-semibold w-fit mb-4 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.35)] overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span className="glass-text-badge">Smart Personal Finance</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl font-normal tracking-[-0.015em] leading-[1.12] mb-3 glass-text-hero select-none">
          Take Control of Your{' '}
          <span className="glass-text-accent">
            Finances
          </span>
          .
        </h1>
        <p className="glass-text-sub text-xs sm:text-sm max-w-sm leading-relaxed mb-8 font-light">
          Sign in to access your expenses, cash flow analytics, budget alerts, and AI financial advisor.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <GoogleAuthButton
            variant="glass"
            className="w-full py-3.5 text-sm font-bold rounded-2xl"
            buttonText="Continue with Google"
            onSuccess={() => {
              window.location.href = '/dashboard';
            }}
          />

          <button
            type="button"
            onClick={() => openAuth('LOGIN')}
            className="group relative w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.16] text-slate-200 hover:text-white border border-white/10 hover:border-white/35 font-semibold text-sm transition-all duration-300 backdrop-blur-xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.35)] hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
            <Mail className="w-4 h-4 text-indigo-300 group-hover:text-indigo-200 transition-colors" />
            <span>Sign In with Email</span>
          </button>
        </div>

        <div className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => openAuth('SIGNUP')}
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer"
          >
            Create one
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 pb-2 border-t border-slate-900 flex flex-col items-center gap-2 z-10">
        {onSwitchToLanding && (
          <button
            onClick={onSwitchToLanding}
            className="text-xs text-slate-400 hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
          >
            View Full Website & Features
          </button>
        )}
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>OAuth 2.0 & Encrypted Authentication</span>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        initialMode={authMode}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default MobileLoginView;
