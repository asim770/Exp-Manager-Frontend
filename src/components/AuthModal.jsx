import React, { useState } from 'react';
import { X, ShieldCheck, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import GoogleAuthButton from './GoogleAuthButton';

const AuthModal = ({ isOpen, onClose }) => {
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Private & Secure</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">Sign In to Continue</h2>
          </div>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          Log in with your Google account to unlock your personalized financial workspace, transactions, debt tracking, and AI financial insights.
        </p>

        {/* Error message */}
        {error && (
          <div className="p-3 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* Google Authentication Button */}
        <div className="mb-6">
          <GoogleAuthButton
            className="w-full py-3.5 text-base"
            onSuccess={() => {
              window.location.href = '/dashboard';
            }}
            onError={(msg) => setError(msg)}
          />
        </div>

        {/* Features / Security guarantees */}
        <div className="pt-5 border-t border-slate-800/80 space-y-2.5">
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Strict multi-user data isolation per Google account</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>Encrypted tokens & secure Google OAuth 2.0</span>
          </div>
        </div>

        {/* Footnote */}
        <div className="mt-6 text-center text-[11px] text-slate-500">
          By continuing, you agree to our Terms of Service & Privacy Policy.
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
