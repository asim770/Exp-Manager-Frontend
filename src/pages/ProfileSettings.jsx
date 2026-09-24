import React, { useState, useEffect } from 'react';
import { 
  User, CheckCircle, ShieldCheck, Mail, LogOut, Check
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';

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

const ProfileSettings = () => {
  const { profile, currencySymbol, updateProfileSettings } = useFinance();
  const { user, logout } = useAuth();

  // Profile preferences state
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('$');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [alertPercent, setAlertPercent] = useState('');
  
  // Status feedback
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || user?.name || '');
      setCurrency(profile.currency || '$');
      setMonthlyBudget(profile.monthlyBudget !== undefined && profile.monthlyBudget !== null ? profile.monthlyBudget.toString() : '2000');
      setAlertPercent(profile.budgetAlertPercentage !== undefined && profile.budgetAlertPercentage !== null ? profile.budgetAlertPercentage.toString() : '80');
    }
  }, [profile, user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name || !monthlyBudget) return;

    try {
      await updateProfileSettings({
        name,
        currency,
        monthlyBudget: Number(monthlyBudget),
        budgetAlertPercentage: Number(alertPercent)
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save profile changes:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">Profile & Preferences</h1>
        <p className="text-xs text-slate-400 dark:text-dark-500 font-semibold">Manage your connected Google account and personalize system settings.</p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Connected Google Account Card */}
        <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/40 dark:border-dark-800/40">
            <div className="flex items-center gap-4">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-500/30 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                  {user?.name?.[0] || 'U'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">{user?.name || 'Google User'}</h3>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <Check className="w-3 h-3" /> Verified Account
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-dark-400 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user?.email || 'Authenticated via Google'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-semibold text-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
            <div className="p-3.5 rounded-2xl bg-slate-100/50 dark:bg-dark-900/40 border border-slate-200/40 dark:border-dark-800/40 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white dark:bg-dark-800 shadow-sm">
                <GoogleIcon />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-dark-500 font-bold block uppercase">Auth Provider</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">Google OAuth 2.0</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-100/50 dark:bg-dark-900/40 border border-slate-200/40 dark:border-dark-800/40 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-dark-500 font-bold block uppercase">Data Privacy</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">Private & Isolated</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-100/50 dark:bg-dark-900/40 border border-slate-200/40 dark:border-dark-800/40 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-dark-500 font-bold block uppercase">Cloud Sync</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">MongoDB Atlas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Settings Card */}
        <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-6 shadow-sm">
          <h3 className="font-extrabold text-base flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" />
            General Information Settings
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-dark-500 font-semibold mb-6">Setup display name, currency format, and monthly budgeting threshold.</p>

          <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div className="space-y-2">
                <label className="font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">Display Name</label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-dark-800 bg-transparent outline-none font-bold text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">Currency Format Symbol</label>
                <select 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-dark-800 bg-transparent outline-none font-bold text-slate-800 dark:text-white cursor-pointer"
                >
                  <option value="$">USD ($)</option>
                  <option value="€">EUR (€)</option>
                  <option value="₹">INR (₹)</option>
                  <option value="£">GBP (£)</option>
                  <option value="¥">JPY (¥)</option>
                  <option value="C$">CAD (C$)</option>
                  <option value="A$">AUD (A$)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">Monthly Budget limit ({currencySymbol})</label>
                <input 
                  type="number"
                  required
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-dark-800 bg-transparent outline-none font-bold text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">Budget Warning Percentage (%)</label>
                <input 
                  type="number"
                  required
                  max="100"
                  value={alertPercent}
                  onChange={(e) => setAlertPercent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-dark-800 bg-transparent outline-none font-bold text-slate-800 dark:text-white"
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 items-center pt-4 border-t border-slate-100 dark:border-dark-850">
              {saveSuccess && (
                <span className="text-xs text-emerald-500 font-bold animate-pulse flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Preferences updated!
                </span>
              )}
              <button 
                type="submit"
                className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-xl shadow-brand-500/20 cursor-pointer"
              >
                Save Preferences
              </button>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
};

export default ProfileSettings;
