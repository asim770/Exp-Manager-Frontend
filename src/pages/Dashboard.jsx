import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, PiggyBank, HandCoins, ArrowDownUp, 
  Calendar as CalendarIcon, ArrowUpRight, Plus, AlertCircle, 
  Wallet, ChevronRight, Award
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell 
} from 'recharts';
import { useFinance } from '../context/FinanceContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { dashboardData, loading, error, currencySymbol, refreshAll } = useFinance();

  useEffect(() => {
    refreshAll();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="spinner"></div>
        <p className="text-sm text-slate-400 dark:text-dark-500 font-semibold">Gathering your financial ledger...</p>
      </div>
    );
  }

  if (error) {
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

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#64748b'];

  const stats = [
    { 
      label: 'Net Balance', 
      value: currentBalance, 
      desc: 'All-time Income minus Expenses', 
      icon: Wallet,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10'
    },
    { 
      label: "Month's Income", 
      value: monthlyIncome, 
      desc: 'Total earned this calendar month', 
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    { 
      label: "Month's Expenses", 
      value: monthlyExpense, 
      desc: `Budget: ${currencySymbol}${budgetProgress?.budget}`, 
      icon: TrendingDown,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10'
    },
    { 
      label: 'Total Savings', 
      value: totalSavings, 
      desc: 'Current goals allocations', 
      icon: PiggyBank,
      color: 'text-pink-500',
      bg: 'bg-pink-500/10'
    },
    { 
      label: 'Money to Pay', 
      value: moneyToPay, 
      desc: 'Outstanding borrow list', 
      icon: HandCoins,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    { 
      label: 'Money to Receive', 
      value: moneyToReceive, 
      desc: 'Outstanding lend list', 
      icon: HandCoins,
      color: 'text-teal-500',
      bg: 'bg-teal-500/10'
    },
  ];

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

      {/* Grid of Core Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-6 relative overflow-hidden"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider">{stat.label}</span>
                <div className={`w-9 h-9 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold tracking-tight">
                  {currencySymbol}{stat.value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-dark-500 font-semibold mt-1.5 leading-relaxed">{stat.desc}</p>
            </motion.div>
          );
        })}
      </div>

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
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
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
                <span className={budgetProgress?.percentage > 90 ? 'text-rose-500' : 'text-brand-500'}>
                  {budgetProgress?.percentage}% Used
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-dark-900 overflow-hidden border border-slate-200/20 dark:border-dark-800">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${budgetProgress?.percentage}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    budgetProgress?.percentage >= 100 
                      ? 'bg-rose-500 shadow-lg shadow-rose-500/20' 
                      : budgetProgress?.percentage >= 80
                        ? 'bg-amber-500 shadow-lg shadow-amber-500/20'
                        : 'bg-brand-600 shadow-lg shadow-brand-500/20'
                  }`}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-dark-500 font-bold">
                <span>Spent: {currencySymbol}{budgetProgress?.spent?.toLocaleString()}</span>
                <span>Limit: {currencySymbol}{budgetProgress?.budget?.toLocaleString()}</span>
              </div>
            </div>

            {budgetProgress?.spent > budgetProgress?.budget && (
              <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex gap-2 text-rose-500">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold leading-normal">
                  Alert: You have exceeded this month's budget ceiling by {currencySymbol}{(budgetProgress.spent - budgetProgress.budget).toFixed(2)}. Consider cutting non-essential spending.
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
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      t.type === 'income' 
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

    </div>
  );
};

export default Dashboard;
