import React, { useState, useEffect, useRef } from 'react';
import {
  X, Lock, Sparkles, CheckCircle2,
  Mail, User, ArrowLeft, ArrowRight, Eye, EyeOff,
  KeyRound, Clock, AlertCircle, Loader2
} from 'lucide-react';
import GoogleAuthButton from './GoogleAuthButton';
import { useAuth } from '../context/AuthContext';

const AuthModal = ({ isOpen, onClose, initialMode = 'LOGIN' }) => {
  const { loginWithEmail, signupWithEmail, forgotPassword, verifyResetOtp, resetPassword } = useAuth();

  // Mode: 'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD' | 'OTP_VERIFY' | 'RESET_PASSWORD' | 'RESET_SUCCESS'
  const [mode, setMode] = useState(initialMode);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');

  // Password Visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // OTP Timers
  const [cooldown, setCooldown] = useState(0);
  const [otpExpiresIn, setOtpExpiresIn] = useState(600); // 10 minutes

  // Autofill prevention: prevent browsers from auto-prefilling on open
  const [isReadOnly, setIsReadOnly] = useState(true);

  // Refs for OTP input boxes
  const otpInputRefs = useRef([]);

  const enableInputs = () => {
    if (isReadOnly) setIsReadOnly(false);
  };

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccessMessage(null);
      setEmail('');
      setPassword('');
      setName('');
      setConfirmPassword('');
      setOtp(['', '', '', '', '', '']);
      setIsReadOnly(true);
    }
  }, [isOpen, initialMode]);

  // Handle Cooldown countdown
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle OTP Expiration countdown
  useEffect(() => {
    let expiryTimer;
    if (mode === 'OTP_VERIFY' && otpExpiresIn > 0) {
      expiryTimer = setInterval(() => {
        setOtpExpiresIn((prev) => {
          if (prev <= 1) {
            clearInterval(expiryTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(expiryTimer);
  }, [mode, otpExpiresIn]);

  // Auto-focus first OTP field
  useEffect(() => {
    if (mode === 'OTP_VERIFY') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [mode]);

  if (!isOpen) return null;

  const switchMode = (newMode) => {
    setError(null);
    setSuccessMessage(null);
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
    setIsReadOnly(true);
    setMode(newMode);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail(email, password);
      onClose();
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Sign Up
  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await signupWithEmail(name, email, password, confirmPassword);
      onClose();
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const data = await forgotPassword(email.trim());
      setSuccessMessage('Verification code sent! Please check your email.');
      setCooldown(data.cooldownSeconds || 60);
      setOtpExpiresIn(600);
      setOtp(['', '', '', '', '', '']);
      setMode('OTP_VERIFY');
    } catch (err) {
      setError(err.message || 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle OTP Resend
  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const data = await forgotPassword(email.trim());
      setSuccessMessage('A fresh verification code has been sent to your email.');
      setCooldown(data.cooldownSeconds || 60);
      setOtpExpiresIn(600);
      setOtp(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Input Changes
  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal && value !== '') return;

    const newOtp = [...otp];
    newOtp[index] = cleanVal.slice(-1);
    setOtp(newOtp);

    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');

    if (digits.length > 0) {
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (i < 6) newOtp[i] = digit;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(digits.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
    }
  };

  // 5. Handle Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    if (otpExpiresIn <= 0) {
      setError('This code has expired. Please request a new code.');
      return;
    }

    setLoading(true);
    try {
      const data = await verifyResetOtp(email.trim(), fullOtp);
      setResetToken(data.resetToken);
      setSuccessMessage('Code verified!');
      switchMode('RESET_PASSWORD');
    } catch (err) {
      setError(err.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Handle Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim(), resetToken, password, confirmPassword);
      setMode('RESET_SUCCESS');
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-md">
        {/* Luminous colorful orbs positioned right behind the glass modal */}
        <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-gradient-to-tr from-pink-500/40 to-purple-600/50 blur-[45px] pointer-events-none animate-pulse-slow" />
        <div
          className="absolute -bottom-12 -left-12 w-60 h-60 rounded-full bg-gradient-to-br from-indigo-500/40 to-cyan-400/40 blur-[45px] pointer-events-none animate-pulse-slow"
          style={{ animationDelay: '2s' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full bg-brand-500/25 blur-[35px] pointer-events-none" />

        {/* Frosted Glass Card Container */}
        <div
          className="relative w-full p-6 sm:p-7 rounded-3xl bg-slate-900/50 backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(0,0,0,0.4)] text-white overflow-hidden transition-all duration-300"
          style={{ colorScheme: 'dark' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top specular reflection / glare line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

          {/* Subtle internal glass sheens */}
          <div className="absolute -top-20 -right-20 w-44 h-44 bg-gradient-to-br from-white/[0.12] to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-gradient-to-tr from-brand-500/15 to-transparent rounded-full blur-xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition-colors z-20 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Feedback Alert Banners */}
          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2.5 backdrop-blur-md shadow-lg shadow-rose-950/30 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {successMessage && mode !== 'RESET_SUCCESS' && (
            <div className="p-3 mb-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2.5 backdrop-blur-md shadow-lg shadow-emerald-950/30 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="leading-snug">{successMessage}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 1: LOGIN                                                  */}
          {/* ============================================================== */}
          {mode === 'LOGIN' && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/30 border border-white/20">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">Welcome Back</h2>
                  <p className="text-xs text-slate-400">Sign in to your Expense Manager workspace</p>
                </div>
              </div>

              <form onSubmit={handleLogin} autoComplete="off" style={{ colorScheme: 'dark' }} className="space-y-3.5 mb-4">
                {/* Hidden decoy fields to absorb browser automatic prefill */}
                <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, overflow: 'hidden', zIndex: -1 }} aria-hidden="true">
                  <input type="text" name="em_fake_user" tabIndex={-1} autoComplete="username" />
                  <input type="password" name="em_fake_pass" tabIndex={-1} autoComplete="current-password" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      name="em_login_email"
                      autoComplete="off"
                      spellCheck="false"
                      readOnly={isReadOnly}
                      onFocus={enableInputs}
                      onMouseDown={enableInputs}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/15 hover:border-white/25 rounded-xl text-white placeholder-slate-400/60 focus:outline-none focus:bg-white/[0.09] focus:ring-4 focus:ring-brand-500/25 focus:border-brand-400/80 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={() => switchMode('FORGOT_PASSWORD')}
                      className="text-[11px] text-brand-300 hover:text-brand-200 transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="em_login_password"
                      autoComplete="new-password"
                      readOnly={isReadOnly}
                      onFocus={enableInputs}
                      onMouseDown={enableInputs}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/15 hover:border-white/25 rounded-xl text-white placeholder-slate-400/60 focus:outline-none focus:bg-white/[0.09] focus:ring-4 focus:ring-brand-500/25 focus:border-brand-400/80 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:via-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-[0_8px_25px_-5px_rgba(124,58,237,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)] border border-white/20 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In</span>}
                </button>
              </form>

              <div className="relative flex py-2 items-center mb-4">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-3 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-semibold text-slate-400 uppercase tracking-widest backdrop-blur-sm">
                  or
                </span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <div className="mb-4">
                <GoogleAuthButton
                  className="w-full py-2.5 text-sm bg-white/95 hover:bg-white text-slate-800 font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_22px_rgba(255,255,255,0.15)] border border-white/40 backdrop-blur-sm transition-all"
                  buttonText="Continue with Google"
                  onSuccess={() => { window.location.href = '/dashboard'; }}
                  onError={(msg) => setError(msg)}
                />
              </div>

              <div className="text-center text-xs text-slate-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('SIGNUP')}
                  className="text-brand-300 hover:text-brand-200 font-semibold transition-colors cursor-pointer"
                >
                  Create one
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 2: SIGN UP                                                */}
          {/* ============================================================== */}
          {mode === 'SIGNUP' && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25 border border-white/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">Create Account</h2>
                  <p className="text-xs text-slate-400">Get started with your free financial workspace</p>
                </div>
              </div>

              <form onSubmit={handleSignup} autoComplete="off" style={{ colorScheme: 'dark' }} className="space-y-3 mb-4">
                {/* Hidden decoy fields to absorb browser automatic prefill */}
                <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, overflow: 'hidden', zIndex: -1 }} aria-hidden="true">
                  <input type="text" name="em_fake_signup_user" tabIndex={-1} autoComplete="username" />
                  <input type="password" name="em_fake_signup_pass" tabIndex={-1} autoComplete="new-password" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      name="signup_fullname_field"
                      autoComplete="off"
                      readOnly={isReadOnly}
                      onFocus={enableInputs}
                      onMouseDown={enableInputs}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter Your Name"
                      required
                      className="w-full pl-10 pr-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/15 hover:border-white/25 rounded-xl text-white placeholder-slate-400/60 focus:outline-none focus:bg-white/[0.09] focus:ring-4 focus:ring-brand-500/25 focus:border-brand-400/80 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      name="signup_email_field"
                      autoComplete="off"
                      spellCheck="false"
                      readOnly={isReadOnly}
                      onFocus={enableInputs}
                      onMouseDown={enableInputs}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full pl-10 pr-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/15 hover:border-white/25 rounded-xl text-white placeholder-slate-400/60 focus:outline-none focus:bg-white/[0.09] focus:ring-4 focus:ring-brand-500/25 focus:border-brand-400/80 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Password (min 8 chars)</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="signup_password_field"
                      autoComplete="new-password"
                      readOnly={isReadOnly}
                      onFocus={enableInputs}
                      onMouseDown={enableInputs}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="w-full pl-10 pr-10 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/15 hover:border-white/25 rounded-xl text-white placeholder-slate-400/60 focus:outline-none focus:bg-white/[0.09] focus:ring-4 focus:ring-brand-500/25 focus:border-brand-400/80 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="signup_confirmpassword_field"
                      autoComplete="new-password"
                      readOnly={isReadOnly}
                      onFocus={enableInputs}
                      onMouseDown={enableInputs}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="w-full pl-10 pr-10 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/15 hover:border-white/25 rounded-xl text-white placeholder-slate-400/60 focus:outline-none focus:bg-white/[0.09] focus:ring-4 focus:ring-brand-500/25 focus:border-brand-400/80 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-brand-600 to-indigo-600 hover:from-purple-500 hover:via-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-[0_8px_25px_-5px_rgba(147,51,234,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)] border border-white/20 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create Account</span>}
                </button>
              </form>

              <div className="relative flex py-1.5 items-center mb-3">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-3 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-semibold text-slate-400 uppercase tracking-widest backdrop-blur-sm">
                  or
                </span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <div className="mb-4">
                <GoogleAuthButton
                  className="w-full py-2 text-sm bg-white/95 hover:bg-white text-slate-800 font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_22px_rgba(255,255,255,0.15)] border border-white/40 backdrop-blur-sm transition-all"
                  buttonText="Sign up with Google"
                  onSuccess={() => { window.location.href = '/dashboard'; }}
                  onError={(msg) => setError(msg)}
                />
              </div>

              <div className="text-center text-xs text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('LOGIN')}
                  className="text-brand-300 hover:text-brand-200 font-semibold transition-colors cursor-pointer"
                >
                  Log In
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 3: FORGOT PASSWORD                                        */}
          {/* ============================================================== */}
          {mode === 'FORGOT_PASSWORD' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shadow-lg shadow-amber-500/20 backdrop-blur-md">
                  <KeyRound className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">Reset Password</h2>
                  <p className="text-xs text-slate-400">Enter your email to receive a 6-digit OTP code</p>
                </div>
              </div>

              <form onSubmit={handleForgotPassword} autoComplete="off" style={{ colorScheme: 'dark' }} className="space-y-4 mb-5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Registered Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      name="reset_email_field"
                      autoComplete="off"
                      spellCheck="false"
                      readOnly={isReadOnly}
                      onFocus={enableInputs}
                      onMouseDown={enableInputs}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/15 hover:border-white/25 rounded-xl text-white placeholder-slate-400/60 focus:outline-none focus:bg-white/[0.09] focus:ring-4 focus:ring-amber-500/25 focus:border-amber-400/80 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold text-sm shadow-[0_8px_25px_-5px_rgba(245,158,11,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)] border border-white/20 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Verification Code</span>}
                </button>
              </form>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchMode('LOGIN')}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Login</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 4: OTP VERIFICATION                                       */}
          {/* ============================================================== */}
          {mode === 'OTP_VERIFY' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center shadow-lg shadow-brand-500/25 backdrop-blur-md">
                  <KeyRound className="w-5 h-5 text-brand-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">Enter 6-Digit Code</h2>
                  <p className="text-xs text-slate-400">
                    Sent to <span className="text-slate-200 font-medium">{email}</span>
                  </p>
                </div>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5 mb-5">
                <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl bg-white/[0.06] border border-white/20 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/30 text-white outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] backdrop-blur-md"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs px-1 text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Expires in <strong className={otpExpiresIn < 60 ? 'text-rose-400' : 'text-slate-200'}>{formatTime(otpExpiresIn)}</strong>
                    </span>
                  </div>

                  <div>
                    {cooldown > 0 ? (
                      <span className="text-slate-500 text-[11px]">Resend in {cooldown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="text-brand-300 hover:text-brand-200 font-medium transition-colors cursor-pointer"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.join('').length !== 6 || otpExpiresIn <= 0}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-[0_8px_25px_-5px_rgba(124,58,237,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)] border border-white/20 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify & Continue</span>}
                </button>
              </form>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => switchMode('FORGOT_PASSWORD')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Change Email
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('LOGIN')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 5: RESET PASSWORD                                         */}
          {/* ============================================================== */}
          {mode === 'RESET_PASSWORD' && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shadow-lg shadow-emerald-500/25 backdrop-blur-md">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">New Password</h2>
                  <p className="text-xs text-slate-400">Choose a secure password with at least 8 characters</p>
                </div>
              </div>

              <form onSubmit={handleResetPassword} autoComplete="off" style={{ colorScheme: 'dark' }} className="space-y-3.5 mb-5">
                {/* Hidden decoy fields to absorb browser automatic prefill */}
                <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, overflow: 'hidden', zIndex: -1 }} aria-hidden="true">
                  <input type="text" name="em_fake_reset_user" tabIndex={-1} autoComplete="username" />
                  <input type="password" name="em_fake_reset_pass" tabIndex={-1} autoComplete="new-password" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="em_reset_new_password"
                      autoComplete="new-password"
                      readOnly={isReadOnly}
                      onFocus={enableInputs}
                      onMouseDown={enableInputs}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="w-full pl-10 pr-10 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/15 hover:border-white/25 rounded-xl text-white placeholder-slate-400/60 focus:outline-none focus:bg-white/[0.09] focus:ring-4 focus:ring-emerald-500/25 focus:border-emerald-400/80 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="em_reset_confirm_password"
                      autoComplete="new-password"
                      readOnly={isReadOnly}
                      onFocus={enableInputs}
                      onMouseDown={enableInputs}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="w-full pl-10 pr-10 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/15 hover:border-white/25 rounded-xl text-white placeholder-slate-400/60 focus:outline-none focus:bg-white/[0.09] focus:ring-4 focus:ring-emerald-500/25 focus:border-emerald-400/80 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-sm shadow-[0_8px_25px_-5px_rgba(16,185,129,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)] border border-white/20 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Update Password</span>}
                </button>
              </form>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchMode('LOGIN')}
                  className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel and return to Login
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 6: RESET SUCCESS                                          */}
          {/* ============================================================== */}
          {mode === 'RESET_SUCCESS' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-4 text-emerald-300 shadow-xl shadow-emerald-500/20 backdrop-blur-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">Password Updated!</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mb-5 leading-relaxed">
                Your password has been reset successfully. You can now sign in with your new credentials.
              </p>

              <button
                type="button"
                onClick={() => {
                  setPassword('');
                  setConfirmPassword('');
                  switchMode('LOGIN');
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:via-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-[0_8px_25px_-5px_rgba(124,58,237,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)] border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Go to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
