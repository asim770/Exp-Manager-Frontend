import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PiggyBank, Plus, Calendar as CalendarIcon, Edit2, Trash2, 
  X, Sparkles, Coins, DollarSign, Award, Info, AlertTriangle, 
  ArrowUpRight, HeartHandshake, Eye
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';

const BudgetsSavings = () => {
  const { 
    profile, currencySymbol, dashboardData, apiUrl, 
    updateProfileSettings, refreshAll 
  } = useFinance();
  
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile Edit fields (Monthly Budget)
  const [budgetVal, setBudgetVal] = useState('');
  const [alertPercentage, setAlertPercentage] = useState('');
  const [savingSettingsMsg, setSavingSettingsMsg] = useState(false);

  // Goal Form Drawer
  const [isGoalDrawerOpen, setIsGoalDrawerOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null);
  
  // Goal Form Fields
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalDueDate, setGoalDueDate] = useState('');
  const [goalNotes, setGoalNotes] = useState('');

  // Contribution Modal
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [contribGoal, setContribGoal] = useState(null);
  const [contribAmount, setContribAmount] = useState('');
  const [contribNotes, setContribNotes] = useState('');
  const [contribDate, setContribDate] = useState(new Date().toISOString().substring(0, 10));

  // Detail Modal view
  const [detailGoal, setDetailGoal] = useState(null);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/savings`);
      setGoals(res.data);
    } catch (err) {
      console.error('Error fetching savings goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
    if (profile) {
      setBudgetVal(profile.monthlyBudget.toString());
      setAlertPercentage(profile.budgetAlertPercentage.toString());
    }
  }, [profile]);

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    if (!budgetVal || Number(budgetVal) <= 0) return;
    
    try {
      await updateProfileSettings({
        monthlyBudget: Number(budgetVal),
        budgetAlertPercentage: Number(alertPercentage),
      });
      setSavingSettingsMsg(true);
      setTimeout(() => setSavingSettingsMsg(false), 3000);
      refreshAll();
    } catch (err) {
      console.error('Failed to update budget settings:', err);
    }
  };

  const resetGoalForm = () => {
    setGoalTitle('');
    setGoalTarget('');
    setGoalCurrent('');
    setGoalDueDate('');
    setGoalNotes('');
    setEditingGoalId(null);
  };

  const handleEditGoal = (goal) => {
    setEditingGoalId(goal._id);
    setGoalTitle(goal.title);
    setGoalTarget(goal.targetAmount.toString());
    setGoalCurrent(goal.currentAmount.toString());
    setGoalDueDate(new Date(goal.dueDate).toISOString().substring(0, 10));
    setGoalNotes(goal.notes || '');
    setIsGoalDrawerOpen(true);
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    if (!goalTitle || !goalTarget || !goalDueDate) return;

    try {
      const payload = {
        title: goalTitle,
        targetAmount: Number(goalTarget),
        currentAmount: goalCurrent ? Number(goalCurrent) : 0,
        dueDate: new Date(goalDueDate),
        notes: goalNotes,
      };

      if (editingGoalId) {
        await axios.put(`${apiUrl}/savings/${editingGoalId}`, payload);
      } else {
        await axios.post(`${apiUrl}/savings`, payload);
      }

      setIsGoalDrawerOpen(false);
      resetGoalForm();
      fetchGoals();
      refreshAll();
    } catch (err) {
      console.error('Failed to save savings goal:', err);
    }
  };

  const handleOpenContrib = (goal) => {
    setContribGoal(goal);
    setContribAmount('');
    setContribNotes('');
    setContribDate(new Date().toISOString().substring(0, 10));
    setIsContributionOpen(true);
  };

  const handleContribSubmit = async (e) => {
    e.preventDefault();
    if (!contribAmount || Number(contribAmount) <= 0 || !contribGoal) return;

    try {
      await axios.post(`${apiUrl}/savings/${contribGoal._id}/contribution`, {
        amount: Number(contribAmount),
        notes: contribNotes,
        date: new Date(contribDate),
      });

      setIsContributionOpen(false);
      setContribGoal(null);
      fetchGoals();
      refreshAll();
    } catch (err) {
      console.error('Failed to log contribution:', err);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Are you sure you want to remove this savings goal?')) return;
    try {
      await axios.delete(`${apiUrl}/savings/${id}`);
      fetchGoals();
      refreshAll();
    } catch (err) {
      console.error('Failed to delete savings goal:', err);
    }
  };

  const getDaysRemaining = (dueDateStr) => {
    const diff = new Date(dueDateStr) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days < 0 ? 'Closed / Ended' : `${days} days remaining`;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Budgets & Savings</h1>
          <p className="text-xs text-slate-400 dark:text-dark-500 font-semibold">Define savings objectives and adjust monthly spending thresholds.</p>
        </div>
        <button 
          onClick={() => {
            resetGoalForm();
            setIsGoalDrawerOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-500/20 transition-all"
        >
          <Plus className="w-4 h-4" /> New Savings Goal
        </button>
      </div>

      {/* Monthly Budget Settings Form & Stats Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Budget Form Card */}
        <div className="lg:col-span-2 glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-6">
          <h3 className="font-extrabold text-base flex items-center gap-2">
            <Coins className="w-5 h-5 text-brand-650 dark:text-brand-400" />
            Budget Threshold Configurator
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-dark-500 font-semibold mb-6">Modify your primary monthly spending limitations.</p>

          <form onSubmit={handleUpdateBudget} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-2">
                <label className="font-bold text-slate-450 dark:text-dark-400 uppercase tracking-wider block">Monthly Spending Limit ({currencySymbol})</label>
                <input 
                  type="number"
                  required
                  value={budgetVal}
                  onChange={(e) => setBudgetVal(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-dark-800 bg-transparent outline-none font-bold text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-450 dark:text-dark-400 uppercase tracking-wider block">Alert Warning Threshold (%)</label>
                <input 
                  type="number"
                  required
                  max="100"
                  value={alertPercentage}
                  onChange={(e) => setAlertPercentage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-dark-800 bg-transparent outline-none font-bold text-slate-800 dark:text-white"
                />
              </div>

            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] font-semibold text-slate-400">Updates will instantly affect dashboard indicators.</span>
              <div className="flex items-center gap-3">
                {savingSettingsMsg && (
                  <span className="text-xs text-emerald-500 font-semibold animate-pulse">Budget values saved successfully!</span>
                )}
                <button 
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-850 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold"
                >
                  Save settings
                </button>
              </div>
            </div>

          </form>
        </div>

        {/* Current Budget Usage Stats Card */}
        <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-6 flex flex-col justify-between shadow">
          {dashboardData && (
            <>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Month's Budget Remaining</span>
                <h2 className={`text-2xl font-black mt-1 ${
                  dashboardData.budgetProgress.spent > dashboardData.budgetProgress.budget 
                    ? 'text-rose-500' 
                    : 'text-emerald-500'
                }`}>
                  {currencySymbol}{(dashboardData.budgetProgress.budget - dashboardData.budgetProgress.spent).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h2>
                
                {/* Stats lines */}
                <div className="space-y-3.5 mt-6 text-xs font-semibold">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-450 dark:text-dark-500">Allocated Budget limit:</span>
                    <span className="font-bold">{currencySymbol}{dashboardData.budgetProgress.budget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-450 dark:text-dark-500">Sum of Month's Expenses:</span>
                    <span className="font-bold">{currencySymbol}{dashboardData.budgetProgress.spent.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {dashboardData.budgetProgress.spent >= dashboardData.budgetProgress.budget ? (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex gap-2 text-rose-500 text-[10px] font-semibold items-center">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Overspent warning limits. Adjust constraints.
                </div>
              ) : (
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex gap-2 text-emerald-500 text-[10px] font-semibold items-center">
                  <Award className="w-4 h-4 shrink-0" />
                  Budget limit checks passing. Good work!
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* Savings Goals Grid */}
      <h2 className="text-lg font-black tracking-tight pt-4">Current Savings Goals</h2>
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-3">
          <div className="spinner"></div>
          <p className="text-xs text-slate-400 font-semibold">Updating savings progress vaults...</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl py-20 text-center text-slate-400 dark:text-dark-500 font-semibold flex flex-col items-center gap-2">
          <PiggyBank className="w-8 h-8 text-slate-350 dark:text-dark-750" />
          No savings milestones established yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const isCompleted = goal.currentAmount >= goal.targetAmount;
            const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));

            return (
              <motion.div
                key={goal._id}
                whileHover={{ y: -3 }}
                className="glass-panel border border-slate-200/60 dark:border-dark-800/40 rounded-3xl p-5 flex flex-col justify-between shadow"
              >
                
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <PiggyBank className="w-4 h-4 text-pink-500" />
                        {goal.title}
                      </h3>
                      {goal.notes && (
                        <p className="text-[10px] text-slate-400 font-semibold mt-1 truncate max-w-[200px]">
                          {goal.notes}
                        </p>
                      )}
                    </div>
                    {isCompleted && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center gap-1">
                        <Award className="w-3 h-3" /> Met
                      </span>
                    )}
                  </div>

                  {/* Progress Indicator */}
                  <div className="space-y-1.5 mt-4 mb-5 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-450 dark:text-dark-500">Savings Target</span>
                      <span className="text-brand-500">{percentage}% Saved</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-dark-900 overflow-hidden border border-slate-200/20 dark:border-dark-800">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className="h-full bg-pink-500 rounded-full"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-450 dark:text-dark-500 font-bold pt-0.5">
                      <span>Saved: {currencySymbol}{goal.currentAmount.toLocaleString()}</span>
                      <span>Target: {currencySymbol}{goal.targetAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-850 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">End Date</span>
                    <span className="font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {new Date(goal.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                      {getDaysRemaining(goal.dueDate)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Contributions History logs */}
                    <button 
                      onClick={() => setDetailGoal(goal)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-dark-900 border border-slate-200/50 dark:border-dark-800 text-slate-500"
                      title="Contribution logs"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {!isCompleted && (
                      <button 
                        onClick={() => handleOpenContrib(goal)}
                        className="px-3 py-2 rounded-xl bg-pink-500 hover:bg-pink-400 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm uppercase tracking-wider"
                      >
                        <Coins className="w-3.5 h-3.5" /> Deposit
                      </button>
                    )}
                    <div className="flex gap-0.5 items-center">
                      <button 
                        onClick={() => handleEditGoal(goal)}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-900 text-slate-400"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteGoal(goal._id)}
                        className="p-2 rounded-xl hover:bg-rose-500/10 text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      )}

      {/* Goal Form Drawer (Slide Out from Right) */}
      <AnimatePresence>
        {isGoalDrawerOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-xs" onClick={() => setIsGoalDrawerOpen(false)}></div>
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 bottom-0 right-0 w-full max-w-md bg-white dark:bg-dark-900 border-l border-slate-200 dark:border-dark-850 z-50 p-6 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-850">
                <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  {editingGoalId ? 'Modify Goal settings' : 'Establish Savings Goal'}
                </h2>
                <button onClick={() => setIsGoalDrawerOpen(false)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-dark-900 border border-slate-200/50 dark:border-dark-800 text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleGoalSubmit} className="flex-1 overflow-y-auto mt-6 space-y-5 pr-1 text-xs">
                
                {/* Title */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Goal Title</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. New Macbook, Emergency Fund"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-dark-800 bg-transparent outline-none focus:border-brand-500 font-semibold text-xs text-slate-800 dark:text-white"
                  />
                </div>

                {/* Target */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Savings Target Amount ({currencySymbol})</label>
                  <input 
                    type="number"
                    required
                    placeholder="0.00"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-dark-800 bg-transparent outline-none focus:border-brand-500 font-extrabold text-lg text-slate-800 dark:text-white"
                  />
                </div>

                {/* Current */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Current Initial Reserves ({currencySymbol} - optional)</label>
                  <input 
                    type="number"
                    placeholder="0.00"
                    value={goalCurrent}
                    onChange={(e) => setGoalCurrent(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-dark-800 bg-transparent outline-none focus:border-brand-500 font-semibold text-xs text-slate-850 dark:text-white"
                  />
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Target Due Date</label>
                  <input 
                    type="date"
                    required
                    value={goalDueDate}
                    onChange={(e) => setGoalDueDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-dark-800 bg-transparent outline-none focus:border-brand-500 font-semibold text-xs text-slate-800 dark:text-white"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Notes</label>
                  <textarea 
                    placeholder="Context or specific parameters..."
                    value={goalNotes}
                    rows="3"
                    onChange={(e) => setGoalNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-dark-800 bg-transparent outline-none focus:border-brand-500 font-medium text-xs text-slate-800 dark:text-white resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-xl shadow-brand-500/20 transition-all mt-6"
                >
                  {editingGoalId ? 'Save Changes' : 'Establish Savings Goal'}
                </button>

              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Log Deposit Contribution Modal */}
      <AnimatePresence>
        {isContributionOpen && contribGoal && (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50" onClick={() => setIsContributionOpen(false)}></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-[20%] left-[50%] -translate-x-[50%] w-full max-w-sm bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-850 p-6 z-[60] shadow-2xl"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-dark-850 mb-4">
                <h3 className="font-extrabold text-base flex items-center gap-1.5 text-pink-500">
                  <Coins className="w-5 h-5" />
                  Deposit: {contribGoal.title}
                </h3>
                <button onClick={() => setIsContributionOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleContribSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">Deposit Amount ({currencySymbol})</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    max={contribGoal.targetAmount - contribGoal.currentAmount}
                    value={contribAmount}
                    onChange={(e) => setContribAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-205 dark:border-dark-800 bg-transparent outline-none font-bold text-sm text-slate-800 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Needed to complete: {currencySymbol}{(contribGoal.targetAmount - contribGoal.currentAmount).toFixed(2)}</span>
                </div>

                <div>
                  <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">Deposit Date</label>
                  <input 
                    type="date"
                    required
                    value={contribDate}
                    onChange={(e) => setContribDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-205 dark:border-dark-800 bg-transparent outline-none text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">Comment / Note</label>
                  <input 
                    type="text"
                    placeholder="e.g. Salary savings, cash, freelancer payout"
                    value={contribNotes}
                    onChange={(e) => setContribNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-205 dark:border-dark-800 bg-transparent outline-none text-slate-850 dark:text-white font-medium"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-white text-xs font-bold shadow-lg shadow-pink-500/25"
                >
                  Confirm Deposit
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Goal History & Contributions Ledger Modal */}
      <AnimatePresence>
        {detailGoal && (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50" onClick={() => setDetailGoal(null)}></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-[15%] left-[50%] -translate-x-[50%] w-full max-w-lg bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-850 p-6 z-[60] shadow-2xl"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-dark-850 mb-4">
                <h3 className="font-extrabold text-base flex items-center gap-1.5">
                  <Coins className="w-5 h-5 text-pink-500 animate-pulse" />
                  Deposit Ledger: {detailGoal.title}
                </h3>
                <button onClick={() => setDetailGoal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 text-xs">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-dark-955 rounded-2xl border border-slate-150 dark:border-dark-800 text-[11px] font-semibold">
                  <div>
                    <span className="text-slate-450 block mb-0.5">Target Amount</span>
                    <span className="font-bold text-slate-800 dark:text-white">{currencySymbol}{detailGoal.targetAmount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-450 block mb-0.5">Total Deposited</span>
                    <span className="font-bold text-emerald-500">{currencySymbol}{detailGoal.currentAmount.toFixed(2)}</span>
                  </div>
                </div>

                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mt-4 mb-2">Deposit Statements</h4>
                
                {detailGoal.contributions?.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 dark:text-dark-500 font-semibold bg-slate-50/50 dark:bg-dark-950/20 rounded-2xl">
                    No deposits recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detailGoal.contributions.map((contrib, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-2xl bg-white border border-slate-150 dark:bg-dark-905 dark:border-dark-800/80">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-white">{contrib.notes || 'Savings deposit'}</span>
                          <span className="text-[10px] text-slate-450 block mt-0.5">
                            {new Date(contrib.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <span className="font-extrabold text-emerald-500">
                          +{currencySymbol}{contrib.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={() => setDetailGoal(null)}
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs shadow-sm mt-6"
              >
                Close ledger panel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default BudgetsSavings;
