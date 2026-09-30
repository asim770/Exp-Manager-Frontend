import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Sparkles, TrendingUp, 
  ArrowUpRight, ArrowDownLeft, Sun, Moon, CheckCircle2, Mail 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import GradientText from './GradientText';
import GoogleAuthButton from './GoogleAuthButton';
import AuthModal from './AuthModal';

const MobileLoginView = ({ onSwitchToLanding }) => {
  const { theme, toggleTheme } = useTheme();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-5 relative overflow-hidden select-none">
      
      {/* Background ambient lighting */}
      <div className="absolute top-[-15%] left-[-15%] w-72 h-72 rounded-full bg-brand-600/25 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-15%] w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <div className="flex items-center justify-between z-10 pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-extrabold shadow-lg shadow-brand-500/30 text-sm">
            P
          </div>
          <GradientText
            colors={["#5227FF", "#FF9FFC", "#B497CF"]}
            animationSpeed={8}
            showBorder={false}
            className="text-lg font-black tracking-tight"
          >
            MyExpManager
          </GradientText>
        </div>

        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center py-6 z-10">
        
        {/* Floating Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-[11px] font-bold text-brand-400 w-fit mb-4 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Mobile Finance Hub</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-3">
          Take Control of Your{' '}
          <span className="bg-gradient-to-r from-brand-400 to-indigo-300 bg-clip-text text-transparent">
            Finances
          </span>
          , Anywhere.
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed mb-6 font-medium">
          Sign in with your Google account to access your private expenses, debt ledgers, savings goals, and AI financial advisor.
        </p>

        {/* Sleek Mini Showcase Card */}
        <div className="p-4 rounded-3xl bg-slate-900/85 border border-slate-800/80 shadow-2xl backdrop-blur-xl mb-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Live Demo Balance</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" /> +14.2%
            </span>
          </div>

          <div className="text-2xl font-black tracking-tight mb-4">$12,480.00</div>

          {/* Micro Stat Pills */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-2">
              <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                <ArrowDownLeft className="w-3.5 h-3.5" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[9px] text-slate-400 block font-medium">Income</span>
                <span className="text-xs font-bold truncate">$4,200.00</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-2">
              <div className="p-1 rounded-lg bg-rose-500/10 text-rose-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[9px] text-slate-400 block font-medium">Spent</span>
                <span className="text-xs font-bold truncate">$1,420.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security badges */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>Strict user account isolation via Google</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
            <span>Encrypted cloud storage on MongoDB Atlas</span>
          </div>
        </div>

        {/* Authentication Buttons */}
        <div className="space-y-3">
          <GoogleAuthButton
            className="w-full py-3.5 text-sm font-bold rounded-2xl shadow-xl shadow-brand-500/25"
            buttonText="Continue with Google"
            onSuccess={() => {
              window.location.href = '/dashboard';
            }}
          />

          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <Mail className="w-4 h-4 text-indigo-400" />
            <span>Sign In with Email & Password</span>
          </button>
        </div>
      </div>

      {/* Footer / Switch view */}
      <div className="pt-4 pb-2 border-t border-slate-900 flex flex-col items-center gap-2 z-10">
        {onSwitchToLanding && (
          <button
            onClick={onSwitchToLanding}
            className="text-xs text-slate-400 hover:text-white underline underline-offset-4 transition-colors"
          >
            View Full Website & Features
          </button>
        )}
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>OAuth 2.0 & Email Authentication • Bank-Grade Isolation</span>
        </div>
      </div>

      {/* Auth Modal for Email / Password / Forgot / OTP */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default MobileLoginView;
