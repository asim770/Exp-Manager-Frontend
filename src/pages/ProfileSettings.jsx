import React, { useState, useEffect } from 'react';
import { 
  User, CheckCircle
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useFinance } from '../context/FinanceContext';

const ProfileSettings = () => {
  const { profile, currencySymbol, updateProfileSettings } = useFinance();

  // Profile preferences state
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('$');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [alertPercent, setAlertPercent] = useState('');
  
  // Status feedback
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setCurrency(profile.currency || '$');
      setMonthlyBudget(profile.monthlyBudget !== undefined && profile.monthlyBudget !== null ? profile.monthlyBudget.toString() : '2000');
      setAlertPercent(profile.budgetAlertPercentage !== undefined && profile.budgetAlertPercentage !== null ? profile.budgetAlertPercentage.toString() : '80');
    }
  }, [profile]);

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
        <p className="text-xs text-slate-400 dark:text-dark-500 font-semibold">Customize local configurations and system utilities.</p>
      </div>

      <div className="max-w-4xl">
        {/* Profile Settings Card */}
        <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-6 shadow-sm">
          <h3 className="font-extrabold text-base flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" />
            General Information Settings
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-dark-500 font-semibold mb-6">Setup username and currency symbol preferences.</p>

          <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div className="space-y-2">
                <label className="font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">Profile Username</label>
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
                className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-xl shadow-brand-500/20"
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
