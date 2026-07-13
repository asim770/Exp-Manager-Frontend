import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Coins, ShieldAlert, Sparkles, Trash2, Database, 
  Download, Upload, CheckCircle, AlertTriangle, RefreshCw
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';

const ProfileSettings = () => {
  const { profile, currencySymbol, updateProfileSettings, refreshAll, apiUrl } = useFinance();

  // Profile preferences state
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('$');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [alertPercent, setAlertPercent] = useState('');
  
  // Status feedback
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

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

  // Seeder: Posts realistic financial logs
  const handleSeedDatabase = async () => {
    if (isSeeding) return;
    setIsSeeding(true);
    try {
      const sampleTransactions = [
        { type: 'income', category: 'Salary', amount: 3500, notes: 'Monthly payroll deposit', date: new Date().toISOString() },
        { type: 'income', category: 'Freelance', amount: 850, notes: 'Logo design project client contract', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
        { type: 'expense', category: 'Rent', amount: 950, notes: 'Apartment rent billing statement', date: new Date().toISOString() },
        { type: 'expense', category: 'Food', amount: 75.50, notes: 'Weekly grocery supplies checkout', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
        { type: 'expense', category: 'Bills', amount: 120, notes: 'Electricity & Gas bills billings', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { type: 'expense', category: 'Entertainment', amount: 45, notes: 'Movie ticket and snack counters', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        { type: 'expense', category: 'Fuel', amount: 60, notes: 'Car gasoline tank refuel', date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
        { type: 'expense', category: 'Shopping', amount: 150, notes: 'Sneakers and fashion clothing outlet', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      const sampleBorrows = [
        { personName: 'John Doe', contactNumber: '+1 555-0199', amount: 500, borrowDate: new Date().toISOString(), dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), notes: 'Emergency auto repairs credit request' }
      ];

      const sampleLends = [
        { personName: 'Alice Smith', contactNumber: '+1 555-0144', amount: 300, lendingDate: new Date().toISOString(), dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), notes: 'Shared vacation housing split balance' }
      ];

      const sampleSavings = [
        { title: 'Emergency Fund Plan', targetAmount: 3000, currentAmount: 1500, dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), notes: '3-Months emergency liquidity reserve' },
        { title: 'New Work Laptop', targetAmount: 1500, currentAmount: 300, dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), notes: 'Developer machine MacBook workstation' }
      ];

      // POST to database endpoints
      await Promise.all([
        ...sampleTransactions.map(tx => axios.post(`${apiUrl}/transactions`, tx)),
        ...sampleBorrows.map(b => axios.post(`${apiUrl}/borrow`, b)),
        ...sampleLends.map(l => axios.post(`${apiUrl}/lend`, l)),
        ...sampleSavings.map(s => axios.post(`${apiUrl}/savings`, s))
      ]);

      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
      refreshAll();
    } catch (err) {
      console.error('Failed to seed datasets:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  // Purge: Clears all collections
  const handlePurgeDatabase = async () => {
    setIsPurging(true);
    try {
      // Fetch all to delete
      const [txRes, borrowRes, lendRes, savingsRes] = await Promise.all([
        axios.get(`${apiUrl}/transactions`),
        axios.get(`${apiUrl}/borrow`),
        axios.get(`${apiUrl}/lend`),
        axios.get(`${apiUrl}/savings`)
      ]);

      await Promise.all([
        ...txRes.data.map(t => axios.delete(`${apiUrl}/transactions/${t._id}`)),
        ...borrowRes.data.map(b => axios.delete(`${apiUrl}/borrow/${b._id}`)),
        ...lendRes.data.map(l => axios.delete(`${apiUrl}/lend/${l._id}`)),
        ...savingsRes.data.map(s => axios.delete(`${apiUrl}/savings/${s._id}`)),
        axios.delete(`${apiUrl}/notifications`) // Clear alerts as well
      ]);

      setShowPurgeConfirm(false);
      refreshAll();
    } catch (err) {
      console.error('Failed to purge database:', err);
    } finally {
      setIsPurging(false);
    }
  };

  // JSON Database backup
  const handleExportBackup = async () => {
    try {
      const [txRes, borrowRes, lendRes, savingsRes] = await Promise.all([
        axios.get(`${apiUrl}/transactions`),
        axios.get(`${apiUrl}/borrow`),
        axios.get(`${apiUrl}/lend`),
        axios.get(`${apiUrl}/savings`)
      ]);

      const backupObj = {
        exportedAt: new Date().toISOString(),
        transactions: txRes.data,
        borrows: borrowRes.data,
        lends: lendRes.data,
        savings: savingsRes.data
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
      const link = document.createElement("a");
      link.setAttribute("href", dataStr);
      link.setAttribute("download", `antigravity_finance_backup_${new Date().toISOString().substring(0,10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export system backup json:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">Profile & Preferences</h1>
        <p className="text-xs text-slate-400 dark:text-dark-500 font-semibold">Customize local configurations and system utilities.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Settings Card */}
        <div className="lg:col-span-2 glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-6">
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

        {/* Database Utilities Panel */}
        <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-6 flex flex-col justify-between shadow">
          <div>
            <h3 className="font-extrabold text-base flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-500" />
              Database Operations
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-dark-500 font-semibold mb-6">Manage localhost MongoDB connections & backups.</p>

            <div className="space-y-4">
              {/* Seeder utility */}
              <button
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 hover:bg-brand-50 dark:hover:bg-brand-950/30 border border-brand-200/30 text-xs font-bold text-brand-600 dark:text-brand-400 transition-all text-left"
              >
                <div className="flex flex-col">
                  <span>Seed Mock Statements</span>
                  <span className="text-[9px] text-slate-400 dark:text-dark-500 font-semibold mt-0.5">Fills calendar, charts, transactions.</span>
                </div>
                {isSeeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </button>

              {/* JSON Backup export */}
              <button
                onClick={handleExportBackup}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-emerald-250/20 text-xs font-bold text-emerald-600 dark:text-emerald-400 transition-all text-left"
              >
                <div className="flex flex-col">
                  <span>Export Database Backup</span>
                  <span className="text-[9px] text-slate-400 dark:text-dark-500 font-semibold mt-0.5">Saves a local JSON statements package.</span>
                </div>
                <Download className="w-4 h-4" />
              </button>

              {/* Purge database */}
              <button
                onClick={() => setShowPurgeConfirm(true)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-xs font-bold text-rose-500 transition-all text-left"
              >
                <div className="flex flex-col">
                  <span>Reset All Financial Data</span>
                  <span className="text-[9px] text-slate-400 dark:text-dark-500 font-semibold mt-0.5">Purges all transaction logs from DB.</span>
                </div>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-[9px] text-slate-400 dark:text-dark-500 font-bold border-t border-slate-100 dark:border-dark-850 pt-4 mt-6 leading-relaxed">
            Connection Node: {apiUrl}<br />
            Status: Locally Connected (Audited)
          </div>
        </div>

      </div>

      {/* Seeder Success Message */}
      <AnimatePresence>
        {seedSuccess && (
          <div className="fixed bottom-6 right-6 p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 z-50 animate-slideUp">
            <CheckCircle className="w-4 h-4" /> Realistic financial datasets seeded!
          </div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Overlay */}
      <AnimatePresence>
        {showPurgeConfirm && (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50" onClick={() => setShowPurgeConfirm(false)}></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-[30%] left-[50%] -translate-x-[50%] w-full max-w-sm bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-850 p-6 z-[60] shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="font-extrabold text-base mb-2 text-rose-500">Purge Local Database</h3>
              <p className="text-xs text-slate-550 dark:text-dark-400 leading-relaxed font-semibold mb-6">
                Warning: This will delete <strong className="text-rose-500">ALL transactions, borrowing, lending, and savings goals</strong>. This operation is permanent and cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowPurgeConfirm(false)}
                  className="py-3 rounded-xl border border-slate-200 dark:border-dark-800 hover:bg-slate-100 dark:hover:bg-dark-900 text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePurgeDatabase}
                  disabled={isPurging}
                  className="py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-500/25 flex justify-center items-center gap-1.5"
                >
                  {isPurging ? 'Resetting...' : 'Purge DB'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ProfileSettings;
