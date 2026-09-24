import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';

const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

const GoogleAuthButton = ({ onSuccess, onError, className = '', buttonText = 'Continue with Google' }) => {
  const { loginWithGoogleCredential, loginWithGoogleCode, apiUrl } = useAuth();
  const [loading, setLoading] = useState(false);

  // 1. Popup Google Login via @react-oauth/google
  let triggerPopupLogin = null;
  try {
    triggerPopupLogin = useGoogleLogin({
      onSuccess: async (tokenResponse) => {
        setLoading(true);
        try {
          if (tokenResponse.code) {
            // Flow with code
            await loginWithGoogleCode(tokenResponse.code, window.location.origin);
          } else if (tokenResponse.credential) {
            // Flow with credential ID token
            await loginWithGoogleCredential(tokenResponse.credential);
          } else if (tokenResponse.access_token) {
            // Flow with access token: exchange via backend
            const res = await axios.post(`${apiUrl}/auth/google`, {
              accessToken: tokenResponse.access_token
            });
            if (res.data?.token) {
              window.location.href = '/dashboard';
            }
          }
          if (onSuccess) onSuccess();
        } catch (err) {
          console.error('Login error:', err);
          if (onError) onError(err.message || 'Login failed');
        } finally {
          setLoading(false);
        }
      },
      onError: (err) => {
        console.warn('Google Popup Login Error or Cancelled:', err);
        setLoading(false);
        if (onError) onError('Google login was cancelled or failed to open.');
      },
      flow: 'auth-code',
    });
  } catch (e) {
    console.warn('useGoogleLogin not available in this context, fallback to OAuth URL redirect:', e);
  }

  // 2. Direct Redirect Fallback
  const handleDirectRedirect = async () => {
    setLoading(true);
    try {
      const redirectUri = `${window.location.origin}/api/auth/callback/google`;
      const res = await axios.get(`${apiUrl}/auth/google/url?redirectUri=${encodeURIComponent(redirectUri)}`);
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        throw new Error('Could not retrieve Google OAuth URL');
      }
    } catch (err) {
      console.error('Redirect OAuth error:', err);
      // Fallback directly to Google OAuth endpoint if backend is unreachable
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '666611753013-8dauik9chnkasm4268tml3ecc05mg0ns.apps.googleusercontent.com';
      const redirectUri = `${window.location.origin}/api/auth/callback/google`;
      const scope = encodeURIComponent('openid email profile');
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (triggerPopupLogin) {
      try {
        triggerPopupLogin();
      } catch (err) {
        console.warn('Popup login failed, triggering direct redirect:', err);
        handleDirectRedirect();
      }
    } else {
      handleDirectRedirect();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`group relative flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-white text-slate-800 font-semibold text-sm hover:bg-slate-50 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
      ) : (
        <GoogleIcon />
      )}
      <span>{loading ? 'Authenticating...' : buttonText}</span>
      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
};

export default GoogleAuthButton;
