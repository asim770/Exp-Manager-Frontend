import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, PiggyBank, HandCoins, ArrowDownUp,
  Calendar as CalendarIcon, ArrowUpRight, Plus, AlertCircle,
  Wallet, ChevronRight, Award, Sparkles, Brain, ShieldAlert,
  Users, Clock
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';
import MagicBento from '../components/MagicBento';
import CreateSplitGroupModal from '../components/CreateSplitGroupModal';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#64748b'];

// In-session memory cache to prevent UI flickering on tab switches
let cachedAiInsights = null;
let cachedSplitSummary = null;

const Dashboard = () => {
  const navigate = useNavigate();
  const { dashboardData, loading, error, currencySymbol, refreshAll, apiUrl } = useFinance();

  const [aiInsights, setAiInsights] = useState(() => cachedAiInsights);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const [splitSummary, setSplitSummary] = useState(() => cachedSplitSummary);
  const [loadingSplitSummary, setLoadingSplitSummary] = useState(() => !cachedSplitSummary);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const hasFetchedSplitSummary = useRef(false);

  useEffect(() => {
    // Only fetch ledger data if not already present
    if (!dashboardData) {
      refreshAll();
    }
  }, [dashboardData, refreshAll]);

  // Fetch AI insights once on mount if not already cached
  useEffect(() => {
    if (cachedAiInsights && !aiInsights) {
      setAiInsights(cachedAiInsights);
    }
    if (aiInsights || cachedAiInsights) return;
    let isMounted = true;
    setLoadingInsights(true);
    axios.get(`${apiUrl}/ai/insights`)
      .then(res => {
        cachedAiInsights = res.data;
        if (isMounted) setAiInsights(res.data);
      })
      .catch(err => { if (isMounted) console.error('Failed to load AI Insights:', err); })
      .finally(() => { if (isMounted) setLoadingInsights(false); });

    return () => { isMounted = false; };
  }, [apiUrl, aiInsights]);

  // Fetch Split Groups summary once on mount (isolated from ledger data updates)
  useEffect(() => {
    if (hasFetchedSplitSummary.current) return;
    hasFetchedSplitSummary.current = true;
    let isMounted = true;
    if (!cachedSplitSummary) {
      setLoadingSplitSummary(true);
    }
    axios.get(`${apiUrl}/split-groups/summary`)
      .then(res => {
        cachedSplitSummary = res.data;
        if (isMounted) setSplitSummary(res.data);
      })
      .catch(err => { if (isMounted) console.error('Failed to load split groups summary:', err); })
      .finally(() => { if (isMounted) setLoadingSplitSummary(false); });

    return () => { isMounted = false; };
  }, [apiUrl]);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateGroupModalOpen(false);
  }, []);

  const handleGroupCreated = useCallback(() => {
    axios.get(`${apiUrl}/split-groups/summary`)
      .then(res => {
        cachedSplitSummary = res.data;
        setSplitSummary(res.data);
      })
      .catch(err => console.error(err));
  }, [apiUrl]);

  const {
    currentBalance,
    totalIncome,
    totalExpense,
    monthlyIncome,
    monthlyExpense,
    totalSavings,
    totalBorrowed,
    totalLent,
    moneyToPay,
    moneyToReceive,
    budgetProgress,
    recentTransactions,
    upcomingPayments,
    cashFlowData,
    categoryBreakdown
  } = dashboardData || {};

  const stats = React.useMemo(() => [
    {
      label: 'Net Balance',
      value: currentBalance ?? 0,
      desc: 'All-time Income minus Expenses',
      icon: Wallet,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10'
    },
    {
      label: "Month's Income",
      value: monthlyIncome ?? 0,
      desc: 'Total earned this calendar month',
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      label: "Month's Expenses",
      value: monthlyExpense ?? 0,
      desc: `Budget: ${currencySymbol}${budgetProgress?.budget ?? 2000}`,
      icon: TrendingDown,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10'
    },
    {
      label: 'Total Savings',
      value: totalSavings ?? 0,
      desc: 'Current goals allocations',
      icon: PiggyBank,
      color: 'text-pink-500',
      bg: 'bg-pink-500/10'
    },
    {
      label: 'Money to Pay',
      value: moneyToPay ?? 0,
      desc: 'Outstanding borrow list',
      icon: HandCoins,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    {
      label: 'Money to Receive',
      value: moneyToReceive ?? 0,
      desc: 'Outstanding lend list',
      icon: HandCoins,
      color: 'text-teal-500',
      bg: 'bg-teal-500/10'
    },
  ], [
    currentBalance,
    monthlyIncome,
    monthlyExpense,
    totalSavings,
    moneyToPay,
    moneyToReceive,
    currencySymbol,
    budgetProgress?.budget
  ]);

  const bentoCardData = useMemo(() => stats.map(stat => ({
    label: stat.label,
    title: `${currencySymbol}${(stat.value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    description: stat.desc,
    icon: stat.icon,
    iconColor: stat.color,
    iconBg: stat.bg
  })), [stats, currencySymbol]);

  if (loading && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="spinner"></div>
        <p className="text-sm text-slate-400 dark:text-dark-500 font-semibold">Gathering your financial ledger...</p>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold mb-2">Failed to load financial records</h3>
        <p className="text-sm text-slate-500 max-w-sm mb-6 font-medium">{error}</p>
        <button
          onClick={refreshAll}
          className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-lg text-sm"
        >
          Try Reconnecting
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Top Banner Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Overview</h1>
          <p className="text-xs text-slate-400 dark:text-dark-500 font-semibold">Your daily financial pulse at a glance.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/transactions', { state: { openAddDrawer: true, defaultType: 'expense' } })}
            className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-sm shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
          <button
            onClick={() => navigate('/transactions', { state: { openAddDrawer: true, defaultType: 'income' } })}
            className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-md shadow-brand-500/15 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Income
          </button>
        </div>
      </div>

      {/* AI Insights & Coaching Section */}
      <AnimatePresence>
        {(aiInsights || loadingInsights) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel border border-slate-200/60 dark:border-dark-800/40 rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br from-brand-500/5 to-indigo-500/5 dark:from-brand-500/10 dark:to-indigo-500/10 shadow-lg"
          >
            {/* Background ambient glow */}
            <div className="absolute top-[-30%] right-[-20%] w-72 h-72 rounded-full bg-brand-500/10 dark:bg-brand-500/15 filter blur-3xl pointer-events-none"></div>

            <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-dark-850/80 mb-5">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-brand-600 dark:text-brand-400 animate-pulse" />
                <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                  Gemini Financial Coach Insights
                  <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                </h3>
              </div>
              <button
                onClick={() => navigate('/ai-assistant')}
                className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline uppercase tracking-wider"
              >
                Ask Coach Details &rarr;
              </button>
            </div>

            {loadingInsights ? (
              <div className="py-6 flex items-center justify-center gap-2">
                <div className="spinner w-4 h-4 border-2"></div>
                <span className="text-[10px] text-slate-400 font-semibold">Consulting with AI Advisor...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

                {/* 1. Daily Safe Spend */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">Daily Spending Limit</span>
                  <p className="text-base font-black text-slate-800 dark:text-white">
                    {aiInsights?.dailyLimitAdvice || 'Calculating...'}
                  </p>
                  <span className="text-[9px] text-slate-400 font-semibold block leading-relaxed">Safety target to avoid overspending this month.</span>
                </div>

                {/* 2. End of Month Prediction */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">EOM Balance Forecast</span>
                  <p className="text-xs font-bold text-slate-700 dark:text-dark-200">
                    {aiInsights?.monthlyPrediction || 'No prediction available'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] text-slate-400 font-semibold">Cash Flow:</span>
                    <span className="text-[9px] font-bold text-emerald-500">{aiInsights?.cashFlowStatus || 'Positive'}</span>
                  </div>
                </div>

                {/* 3. Budget & Savings Score */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">Health Scores</span>
                  <div className="flex items-center gap-4 pt-0.5">
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400">{aiInsights?.budgetHealthScore || 100}%</span>
                      <span className="text-[9px] text-slate-450 dark:text-dark-500 font-bold uppercase tracking-wider">Budget Health</span>
                    </div>
                    <div className="flex flex-col border-l border-slate-200 dark:border-dark-800 pl-4">
                      <span className="text-xs font-extrabold text-pink-500">{aiInsights?.savingsScore || 50}%</span>
                      <span className="text-[9px] text-slate-450 dark:text-dark-500 font-bold uppercase tracking-wider">Savings Goal</span>
                    </div>
                  </div>
                </div>

                {/* 4. Risk Level & Overspending Alert */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">Account Risk Level</span>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${aiInsights?.riskLevel === 'High'
                        ? 'bg-rose-500/10 border-rose-500/25 text-rose-500'
                        : aiInsights?.riskLevel === 'Medium'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-555'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                      }`}>
                      {aiInsights?.riskLevel || 'Low'} Risk
                    </span>
                  </div>
                  {aiInsights?.overspendingCategory && aiInsights.overspendingCategory !== 'None' && (
                    <span className="text-[9px] text-rose-500 font-semibold block mt-1 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Alert: Overspending on {aiInsights.overspendingCategory}
                    </span>
                  )}
                </div>

              </div>
            )}

            {/* Tip Banner */}
            {aiInsights?.financialTip && (
              <div className="mt-4 p-3.5 rounded-2xl bg-white/40 dark:bg-dark-900/40 border border-slate-200/50 dark:border-dark-850/80 text-[10px] font-bold text-slate-655 dark:text-dark-300 leading-normal flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-brand-555 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block mb-0.5 text-[8.5px] font-bold">Today's AI Advisory Tip</span>
                  {aiInsights.financialTip}
                </div>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid of Core Stats Cards */}
      <MagicBento
        cardData={bentoCardData}
        textAutoHide={true}
        enableStars
        enableSpotlight
        enableBorderGlow={true}
        enableTilt={false}
        enableMagnetism={false}
        clickEffect
        spotlightRadius={400}
        particleCount={12}
        glowColor="132, 0, 255"
        disableAnimations={false}
      />

      {/* Cash Flow Chart & Category / Budget Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Cash Flow Line Chart Card */}
        <div className="lg:col-span-2 glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-extrabold text-base">Monthly Cash Flow</h3>
              <p className="text-[10px] text-slate-400 dark:text-dark-500 font-semibold">Income vs Expense analysis</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Income</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Expense</span>
            </div>
          </div>

          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Progress & Categories Panel */}
        <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-base mb-1">Monthly Budget Limit</h3>
            <p className="text-[10px] text-slate-400 dark:text-dark-500 font-semibold mb-6">Track spending ceiling limit</p>

            {/* Linear budget progress indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Monthly Budget</span>
                <span className={(budgetProgress?.percentage ?? 0) > 90 ? 'text-rose-500' : 'text-brand-500'}>
                  {budgetProgress?.percentage ?? 0}% Used
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-dark-900 overflow-hidden border border-slate-200/20 dark:border-dark-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${budgetProgress?.percentage ?? 0}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${(budgetProgress?.percentage ?? 0) >= 100
                      ? 'bg-rose-500 shadow-lg shadow-rose-500/20'
                      : (budgetProgress?.percentage ?? 0) >= 80
                        ? 'bg-amber-500 shadow-lg shadow-amber-500/20'
                        : 'bg-brand-600 shadow-lg shadow-brand-500/20'
                    }`}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-dark-500 font-bold">
                <span>Spent: {currencySymbol}${(budgetProgress?.spent ?? 0).toLocaleString()}</span>
                <span>Limit: {currencySymbol}${(budgetProgress?.budget ?? 2000).toLocaleString()}</span>
              </div>
            </div>

            {(budgetProgress?.spent ?? 0) > (budgetProgress?.budget ?? 2000) && (
              <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex gap-2 text-rose-500">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold leading-normal">
                  Alert: You have exceeded this month's budget ceiling by {currencySymbol}{((budgetProgress?.spent ?? 0) - (budgetProgress?.budget ?? 2000)).toFixed(2)}. Consider cutting non-essential spending.
                </span>
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-slate-200/50 dark:border-dark-800/50 pt-6">
            <h4 className="text-xs font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider mb-4">Expense Categories Breakdown</h4>
            {categoryBreakdown?.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs font-medium">
                No expense logged this month
              </div>
            ) : (
              <div className="space-y-3.5">
                {categoryBreakdown?.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5 text-xs font-bold">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span>{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-dark-400">
                      {currencySymbol}{item.value.toFixed(2)}
                    </span>
                  </div>
                ))}
                {categoryBreakdown?.length > 3 && (
                  <Link to="/reports" className="block text-center text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline mt-2">
                    View full analysis
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Split Groups Dashboard Section */}
      <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                Split Groups
              </h3>
              {splitSummary?.totalGroups > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                  {splitSummary.totalGroups} Active {splitSummary.totalGroups === 1 ? 'Group' : 'Groups'}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-dark-500 font-semibold mt-0.5">
              Manage shared expenses with friends and groups.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {splitSummary?.pendingInvitationsCount > 0 && (
              <Link
                to="/split-groups"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-500 hover:bg-amber-500/20 text-xs font-bold transition-all"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{splitSummary.pendingInvitationsCount} Pending {splitSummary.pendingInvitationsCount === 1 ? 'Invitation' : 'Invitations'}</span>
              </Link>
            )}
            <button
              onClick={() => setIsCreateGroupModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/15 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Create Split Group
            </button>
            <Link
              to="/split-groups"
              className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline ml-1"
            >
              View All Groups <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Content: Loading / Empty State / Group Cards */}
        {loadingSplitSummary && !splitSummary ? (
          <div className="py-10 flex flex-col items-center justify-center gap-2">
            <div className="spinner w-5 h-5 border-2"></div>
            <span className="text-[10px] text-slate-400 font-semibold">Loading split groups...</span>
          </div>
        ) : (!splitSummary?.groups || splitSummary.groups.length === 0) ? (
          /* Clean Empty State */
          <div className="py-10 px-4 text-center rounded-2xl bg-white/30 dark:bg-dark-900/20 border border-slate-200/30 dark:border-dark-850 flex flex-col items-center justify-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">No shared groups yet.</h4>
            <p className="text-xs text-slate-400 dark:text-dark-500 mb-5 max-w-xs font-medium leading-relaxed">
              Create a group with friends and easily track who owes whom.
            </p>
            <button
              onClick={() => setIsCreateGroupModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/15 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Create Split Group
            </button>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {splitSummary.groups.slice(0, 3).map((group) => {
              const isSettled = group.balanceStatus === 'settled';
              const isOwed = group.balanceStatus === 'owed';
              const isOwe = group.balanceStatus === 'owe';

              return (
                <div
                  key={group._id}
                  className="p-5 rounded-2xl bg-white/40 dark:bg-dark-900/35 border border-slate-200/30 dark:border-dark-850 hover:border-brand-500/30 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-1.5 rounded-xl bg-white/50 dark:bg-dark-900/60 border border-slate-200/40 dark:border-dark-800">
                          {group.emoji || '👥'}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">
                            {group.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 dark:text-dark-500 font-semibold flex items-center gap-1">
                            <Users className="w-3 h-3" /> {group.memberCount} {group.memberCount === 1 ? 'Member' : 'Members'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1 flex items-baseline justify-between text-xs">
                      <span className="text-slate-400 font-medium">Total:</span>
                      <span className="font-extrabold text-slate-800 dark:text-white">
                        {currencySymbol}{(group.totalExpenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="pt-1">
                      <div className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center justify-between ${isOwed
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                          : isOwe
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                            : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                        }`}>
                        <span>{isOwed ? 'You are owed' : isOwe ? 'You owe' : 'Settled up'}</span>
                        {!isSettled && (
                          <span className="font-black">
                            {currencySymbol}{group.absBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/30 dark:border-dark-850">
                    <button
                      onClick={() => navigate(`/split-groups/${group._id}`)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100/80 dark:bg-dark-900/80 hover:bg-brand-600 hover:text-white dark:hover:bg-brand-600 text-slate-700 dark:text-dark-200 text-xs font-bold transition-all"
                    >
                      View Group <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Ledger Transactions & Upcoming Due Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Transactions List Card */}
        <div className="lg:col-span-2 glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-extrabold text-base">Recent Activity</h3>
              <p className="text-[10px] text-slate-400 dark:text-dark-500 font-semibold">Latest updates on your balance sheet</p>
            </div>
            <Link to="/transactions" className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline">
              Full Ledger <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentTransactions?.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-dark-500 text-xs font-semibold flex flex-col items-center gap-2">
                <ArrowDownUp className="w-6 h-6 text-slate-300 dark:text-dark-700" />
                No transactions recorded yet.
              </div>
            ) : (
              recentTransactions?.map((t) => (
                <div key={t._id} className="flex justify-between items-center p-3 rounded-2xl bg-white/40 dark:bg-dark-900/35 border border-slate-200/30 dark:border-dark-850">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${t.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-rose-500/10 text-rose-500'
                      }`}>
                      {t.category.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold">{t.category}</h4>
                      {t.notes && <p className="text-[10px] text-slate-400 dark:text-dark-550 truncate max-w-[180px] sm:max-w-[280px] mt-0.5">{t.notes}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-extrabold ${t.type === 'income' ? 'text-emerald-500' : 'text-slate-800 dark:text-white'}`}>
                      {t.type === 'income' ? '+' : '-'}{currencySymbol}{t.amount.toFixed(2)}
                    </span>
                    <p className="text-[9px] text-slate-400 dark:text-dark-600 font-semibold mt-0.5">{new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Due Dates (Lending or Borrowing payments soon) */}
        <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-extrabold text-base">Payment Deadlines</h3>
              <p className="text-[10px] text-slate-400 dark:text-dark-500 font-semibold">Active obligations sorted by proximity</p>
            </div>
            <Link to="/borrow-lend" className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline">
              Records <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {upcomingPayments?.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-dark-500 text-xs font-semibold flex flex-col items-center gap-2">
                <CalendarIcon className="w-6 h-6 text-slate-300 dark:text-dark-700" />
                No outstanding due payments.
              </div>
            ) : (
              upcomingPayments?.map((payment, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-white/40 dark:bg-dark-900/35 border border-slate-200/30 dark:border-dark-850 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider">{payment.type}</span>
                    <span className="text-[10px] font-bold text-rose-500">
                      Due: {new Date(payment.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold">{payment.personName}</h4>
                      <p className="text-[10px] text-slate-400 dark:text-dark-500 mt-0.5">{payment.title}</p>
                    </div>
                    <span className="text-sm font-extrabold text-slate-800 dark:text-white">
                      {currencySymbol}{payment.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Create Split Group Modal */}
      <CreateSplitGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={handleCloseCreateModal}
        onGroupCreated={handleGroupCreated}
      />

    </div>
  );
};

export default Dashboard;
