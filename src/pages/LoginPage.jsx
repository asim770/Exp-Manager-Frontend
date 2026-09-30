import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lock, Sparkles, CheckCircle2,
  Mail, User, ArrowLeft, ArrowRight, Eye, EyeOff,
  KeyRound, Clock, AlertCircle, Loader2, ShieldCheck
} from 'lucide-react';
import GradientText from '../components/GradientText';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    loginWithEmail,
    signupWithEmail,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
  } = useAuth();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // View state: 'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD' | 'OTP_VERIFY' | 'RESET_PASSWORD' | 'RESET_SUCCESS'
  const [mode, setMode] = useState('LOGIN');

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

  // Refs for OTP input tiles
  const otpInputRefs = useRef([]);

  // Autofill prevention: prevent browsers from auto-prefilling on open
  const [isReadOnly, setIsReadOnly] = useState(true);

  // Clear inputs on mount
  useEffect(() => {
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
    setIsReadOnly(true);
  }, []);

  const enableInputs = () => {
    if (isReadOnly) setIsReadOnly(false);
  };

  // Cooldown countdown
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Expiration countdown
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

  // Auto-focus first OTP input
  useEffect(() => {
    if (mode === 'OTP_VERIFY') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [mode]);

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

  // 1. Login
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
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Sign Up
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
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Forgot Password
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
      setSuccessMessage('Verification code sent to your email.');
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

  // 4. Resend OTP
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

  // OTP inputs
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

  // 5. Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of the code.');
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
      setSuccessMessage('Code verified successfully!');
      switchMode('RESET_PASSWORD');
    } catch (err) {
      setError(err.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Reset Password
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden select-none px-4 py-6 sm:py-8">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-extrabold shadow-lg shadow-brand-500/25 text-sm group-hover:scale-105 transition-transform">
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
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-medium transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Centered Auth Card */}
      <main className="flex-1 flex items-center justify-center py-8 z-10">
        <div
          className="w-full max-w-[420px] p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-2xl backdrop-blur-2xl"
          style={{ colorScheme: 'dark' }}
        >

          {/* Mode Selector Tabs (only on LOGIN and SIGNUP) */}
          {(mode === 'LOGIN' || mode === 'SIGNUP') && (
            <div className="flex p-1 mb-6 rounded-2xl bg-slate-850/80 border border-slate-800">
              <button
                type="button"
                onClick={() => switchMode('LOGIN')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'LOGIN'
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('SIGNUP')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'SIGNUP'
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Feedback messages */}
          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {successMessage && mode !== 'RESET_SUCCESS' && (
            <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="leading-snug">{successMessage}</span>
            </div>
          )}

          {/* VIEW: LOGIN */}
          {mode === 'LOGIN' && (
            <div>
              <div className="mb-5">
                <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Welcome Back</h1>
                <p className="text-xs text-slate-400">Enter your credentials to access your account</p>
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
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
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
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={() => switchMode('FORGOT_PASSWORD')}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
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
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-sm transition-all"
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
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In</span>}
                </button>
              </form>

              <div className="relative flex py-2 items-center mb-4">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  or
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <div>
                <GoogleAuthButton
                  className="w-full py-3 text-sm"
                  buttonText="Continue with Google"
                  onSuccess={() => navigate('/dashboard')}
                  onError={(msg) => setError(msg)}
                />
              </div>
            </div>
          )}

          {/* VIEW: SIGN UP */}
          {mode === 'SIGNUP' && (
            <div>
              <div className="mb-4">
                <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Create Account</h1>
                <p className="text-xs text-slate-400">Join MyExpManager to start organizing your wealth</p>
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
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type="text"
                      name="signup_fullname"
                      autoComplete="off"
                      readOnly={isReadOnly}
                      onFocus={enableInputs}
                      onMouseDown={enableInputs}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter Your Name"
                      required
                      className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type="email"
                      name="signup_email"
                      autoComplete="off"
                      spellCheck="false"
                      readOnly={isReadOnly}
                      onFocus={enableInputs}
                      onMouseDown={enableInputs}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Password (min 8 chars)</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="signup_password"
                      autoComplete="new-password"
                      readOnly={isReadOnly}
                      onFocus={enableInputs}
                      onMouseDown={enableInputs}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="w-full pl-10 pr-10 py-2 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-sm transition-all"
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
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="signup_confirm_password"
                      autoComplete="new-password"
                      readOnly={isReadOnly}
                      onFocus={enableInputs}
                      onMouseDown={enableInputs}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="w-full pl-10 pr-10 py-2 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-sm transition-all"
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
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create Account</span>}
                </button>
              </form>

              <div className="relative flex py-1.5 items-center mb-3">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  or
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <div>
                <GoogleAuthButton
                  className="w-full py-2.5 text-sm"
                  buttonText="Sign up with Google"
                  onSuccess={() => navigate('/dashboard')}
                  onError={(msg) => setError(msg)}
                />
              </div>
            </div>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {mode === 'FORGOT_PASSWORD' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <KeyRound className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">Reset Password</h2>
                  <p className="text-xs text-slate-400">We will email you a 6-digit code</p>
                </div>
              </div>

              <form onSubmit={handleForgotPassword} autoComplete="off" style={{ colorScheme: 'dark' }} className="space-y-4 mb-5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Registered Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type="email"
                      name="forgot_email"
                      autoComplete="off"
                      spellCheck="false"
                      readOnly={isReadOnly}
                      onFocus={enableInputs}
                      onMouseDown={enableInputs}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 text-sm transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Code</span>}
                </button>
              </form>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchMode('LOGIN')}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW: OTP VERIFY */}
          {mode === 'OTP_VERIFY' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <KeyRound className="w-5 h-5 text-white" />
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
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl bg-slate-800/80 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 text-white outline-none transition-all shadow-inner"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs px-1 text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      Expires in <strong className={otpExpiresIn < 60 ? 'text-rose-400' : 'text-slate-300'}>{formatTime(otpExpiresIn)}</strong>
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
                        className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.join('').length !== 6 || otpExpiresIn <= 0}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify & Continue</span>}
                </button>
              </form>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
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
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* VIEW: RESET PASSWORD */}
          {mode === 'RESET_PASSWORD' && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">New Password</h2>
                  <p className="text-xs text-slate-400">Choose a secure password of at least 8 characters</p>
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
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
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
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm transition-all"
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
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
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
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm transition-all"
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
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-1"
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
                  Cancel and return to Sign In
                </button>
              </div>
            </div>
          )}

          {/* VIEW: RESET SUCCESS */}
          {mode === 'RESET_SUCCESS' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-xl shadow-emerald-500/10">
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
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Go to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto text-center py-2 text-[11px] text-slate-500 z-10 flex items-center justify-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Bank-grade encryption • Protected by OAuth 2.0 & JWT Security</span>
      </footer>
    </div>
  );
};

export default LoginPage;
