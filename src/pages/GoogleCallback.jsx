import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithDirectToken, loginWithGoogleCode } = useAuth();
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const handleAuth = async () => {
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');
      const code = searchParams.get('code');
      const error = searchParams.get('error') || searchParams.get('auth_error');

      if (error) {
        setErrorMsg(`Google sign-in error: ${error}`);
        return;
      }

      // Scenario 1: Backend directly provided token & user in URL params
      if (token) {
        try {
          const user = userParam ? JSON.parse(decodeURIComponent(userParam)) : { name: 'User' };
          loginWithDirectToken(token, user);
          navigate('/dashboard', { replace: true });
          return;
        } catch (err) {
          console.error('Failed to parse user from query:', err);
        }
      }

      // Scenario 2: Google redirected directly here with an authorization code
      if (code) {
        try {
          const redirectUri = window.location.origin + window.location.pathname;
          await loginWithGoogleCode(code, redirectUri);
          navigate('/dashboard', { replace: true });
        } catch (err) {
          setErrorMsg(err.message || 'Failed to complete Google authentication');
        }
        return;
      }

      setErrorMsg('No authentication token or authorization code detected.');
    };

    handleAuth();
  }, [searchParams, navigate, loginWithDirectToken, loginWithGoogleCode]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
      <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center">
        {errorMsg ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Authentication Failed</h2>
            <p className="text-sm text-slate-400 mb-6">{errorMsg}</p>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-500/25"
            >
              Back to Home
            </button>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-xl shadow-indigo-500/30">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h2 className="text-xl font-bold mb-2">Connecting Google Account</h2>
            <p className="text-sm text-slate-400">Verifying security token and preparing your financial dashboard...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;
