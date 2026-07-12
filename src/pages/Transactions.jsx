import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, Filter, ArrowUpDown, Trash2, Edit2, 
  X, Calendar as CalendarIcon, FileText, CheckCircle, 
  ChevronDown, Image, Sparkles, HelpCircle
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';

const EXPENSE_CATEGORIES = [
  'Food', 'Shopping', 'Rent', 'Bills', 'EMI', 'Travel', 
  'Fuel', 'Entertainment', 'Healthcare', 'Education', 
  'Investment', 'Miscellaneous'
];

const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Investment', 'Gifts', 'Other'
];

const Transactions = () => {
  const location = useLocation();
  const { currencySymbol, apiUrl, refreshAll } = useFinance();
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [dateRange, setDateRange] = useState('all'); // all, today, week, month, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Form Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  
  // Form Fields
  const [txType, setTxType] = useState('expense');
  const [txCategory, setTxCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().substring(0, 10));
  const [txNotes, setTxNotes] = useState('');
  const [txReceipt, setTxReceipt] = useState('');
  const [txRecurring, setTxRecurring] = useState(false);
  const [txInterval, setTxInterval] = useState('none');

  // Confirmation modal
  const [deletingTx, setDeletingTx] = useState(null);

  // Fetch transactions from DB
  const fetchTxList = async () => {
    setLoading(true);
    try {
      let url = `${apiUrl}/transactions?sortBy=${sortBy}`;
      if (filterType !== 'all') url += `&type=${filterType}`;
      if (filterCategory !== 'all') url += `&category=${filterCategory}`;
      if (search.trim()) url += `&search=${search}`;
      
      // Calculate date filters
      let start = '';
      let end = '';
      if (dateRange === 'today') {
        const d = new Date();
        d.setHours(0,0,0,0);
        start = d.toISOString();
      } else if (dateRange === 'week') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        start = d.toISOString();
      } else if (dateRange === 'month') {
        const d = new Date();
        d.setDate(1);
        d.setHours(0,0,0,0);
        start = d.toISOString();
      } else if (dateRange === 'custom') {
        if (customStartDate) start = new Date(customStartDate).toISOString();
        if (customEndDate) end = new Date(customEndDate).toISOString();
      }
      
      if (start) url += `&startDate=${start}`;
      if (end) url += `&endDate=${end}`;
      
      const res = await axios.get(url);
      setTransactions(res.data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTxList();
  }, [filterType, filterCategory, sortBy, dateRange, customStartDate, customEndDate]);

  // Debounced search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTxList();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Open drawer if navigated with state from dashboard or command palette
  useEffect(() => {
    if (location.state?.openAddDrawer) {
      resetForm();
      const type = location.state.defaultType || 'expense';
      setTxType(type);
      setTxCategory(type === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
      setIsDrawerOpen(true);
      
      // Clear location state so it does not open again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Sync category option when changing type
  useEffect(() => {
    if (!editingTx) {
      setTxCategory(txType === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
    }
  }, [txType, editingTx]);

  const resetForm = () => {
    setEditingTx(null);
    setTxType('expense');
    setTxCategory(EXPENSE_CATEGORIES[0]);
    setTxAmount('');
    setTxDate(new Date().toISOString().substring(0, 10));
    setTxNotes('');
    setTxReceipt('');
    setTxRecurring(false);
    setTxInterval('none');
  };

  const handleEdit = (tx) => {
    setEditingTx(tx);
    setTxType(tx.type);
    setTxCategory(tx.category);
    setTxAmount(tx.amount.toString());
    setTxDate(new Date(tx.date).toISOString().substring(0, 10));
    setTxNotes(tx.notes || '');
    setTxReceipt(tx.receiptUrl || '');
    setTxRecurring(tx.isRecurring || false);
    setTxInterval(tx.recurringInterval || 'none');
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!txAmount || Number(txAmount) <= 0) return;
    
    try {
      const payload = {
        type: txType,
        category: txCategory,
        amount: Number(txAmount),
        date: new Date(txDate),
        notes: txNotes,
        receiptUrl: txReceipt,
        isRecurring: txRecurring,
        recurringInterval: txRecurring ? txInterval : 'none',
      };
      
      if (editingTx) {
        await axios.put(`${apiUrl}/transactions/${editingTx._id}`, payload);
      } else {
        await axios.post(`${apiUrl}/transactions`, payload);
      }
      
      setIsDrawerOpen(false);
      resetForm();
      fetchTxList();
      refreshAll(); // update dashboard balances
    } catch (err) {
      console.error('Failed to submit transaction form:', err);
    }
  };

  const handleDelete = async () => {
    if (!deletingTx) return;
    try {
      await axios.delete(`${apiUrl}/transactions/${deletingTx._id}`);
      setDeletingTx(null);
      fetchTxList();
      refreshAll(); // update dashboard balances
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Financial Ledger</h1>
          <p className="text-xs text-slate-400 dark:text-dark-500 font-semibold">Track and manage every single item in your cash statement.</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setIsDrawerOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Transaction
        </button>
      </div>

      {/* Advanced Filters Toolbar */}
      <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-dark-800 bg-white/40 dark:bg-dark-900/40 text-xs">
            <Search className="w-4 h-4 text-slate-400 dark:text-dark-500" />
            <input 
              type="text" 
              placeholder="Search category, notes..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-0 outline-none w-full text-xs"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-dark-800 bg-white/40 dark:bg-dark-900/40 rounded-xl text-xs">
            <Filter className="w-4 h-4 text-slate-400 dark:text-dark-500" />
            <select 
              value={filterType} 
              onChange={(e) => {
                setFilterType(e.target.value);
                setFilterCategory('all'); // Reset category
              }}
              className="bg-transparent border-0 outline-none w-full text-xs font-semibold cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Incomes Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-dark-800 bg-white/40 dark:bg-dark-900/40 rounded-xl text-xs">
            <Filter className="w-4 h-4 text-slate-400 dark:text-dark-500" />
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent border-0 outline-none w-full text-xs font-semibold cursor-pointer"
            >
              <option value="all">All Categories</option>
              {filterType !== 'income' && EXPENSE_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
              {filterType !== 'expense' && INCOME_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Sorting Option */}
          <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-dark-800 bg-white/40 dark:bg-dark-900/40 rounded-xl text-xs">
            <ArrowUpDown className="w-4 h-4 text-slate-400 dark:text-dark-500" />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-0 outline-none w-full text-xs font-semibold cursor-pointer"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>

        </div>

        {/* Date Ranges Filter */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-dark-800/50">
          <span className="text-[10px] font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider mr-2">Timeline:</span>
          {['all', 'today', 'week', 'month', 'custom'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-all ${
                dateRange === range
                  ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-950 shadow-sm'
                  : 'bg-white/40 border-slate-200 hover:bg-slate-100 dark:bg-dark-900/40 dark:border-dark-800 hover:dark:bg-dark-900 text-slate-550 dark:text-dark-400'
              }`}
            >
              {range}
            </button>
          ))}

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 ml-4 animate-fadeIn">
              <input 
                type="date" 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-200 dark:border-dark-800 rounded bg-white/40 dark:bg-dark-900/40 outline-none"
              />
              <span className="text-xs text-slate-400">to</span>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-200 dark:border-dark-800 rounded bg-white/40 dark:bg-dark-900/40 outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <div className="spinner"></div>
            <p className="text-xs text-slate-400 font-semibold">Filtering transaction logs...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-20 text-center text-slate-400 dark:text-dark-500 font-semibold flex flex-col items-center gap-2">
            <Sparkles className="w-8 h-8 text-slate-300 dark:text-dark-750" />
            No transaction records found matching your filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-dark-850">
            {transactions.map((tx) => (
              <div 
                key={tx._id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-dark-900/20 transition-all gap-4"
              >
                {/* Category Info */}
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    tx.type === 'income' 
                      ? 'bg-emerald-500/10 text-emerald-500' 
                      : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    {tx.category.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold">{tx.category}</h3>
                      {tx.isRecurring && (
                        <span className="text-[9px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 border border-brand-200/30 px-1.5 py-0.5 rounded-full uppercase">
                          {tx.recurringInterval}
                        </span>
                      )}
                    </div>
                    {tx.notes && <p className="text-xs text-slate-400 dark:text-dark-550 leading-relaxed font-semibold mt-0.5">{tx.notes}</p>}
                    <p className="text-[10px] text-slate-450 dark:text-dark-600 font-bold mt-1.5 flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {new Date(tx.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Operations & Amount */}
                <div className="flex items-center justify-between sm:justify-end gap-6 sm:text-right">
                  <div className="sm:text-right">
                    <span className={`text-base font-extrabold ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-800 dark:text-white'}`}>
                      {tx.type === 'income' ? '+' : '-'}{currencySymbol}{tx.amount.toFixed(2)}
                    </span>
                    {tx.receiptUrl && (
                      <a 
                        href={tx.receiptUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-end gap-1 text-[10px] text-slate-400 dark:text-dark-500 hover:underline font-bold mt-1"
                      >
                        <Image className="w-3.5 h-3.5" /> Receipt Attached
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleEdit(tx)}
                      className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-900 border border-transparent hover:border-slate-200/50 dark:hover:border-dark-800 text-slate-500 dark:text-dark-400 transition-all"
                      title="Edit Entry"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeletingTx(tx)}
                      className="p-2 rounded-xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-rose-500 transition-all"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slide-out Drawer Panel (Add/Edit Transaction) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-xs"
            ></motion.div>

            {/* Form Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 bottom-0 right-0 w-full max-w-md bg-white dark:bg-dark-900 border-l border-slate-200 dark:border-dark-850 z-50 p-6 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-850">
                <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-500" />
                  {editingTx ? 'Modify Transaction' : 'Record Transaction'}
                </h2>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-dark-900 border border-slate-200/50 dark:border-dark-800 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto mt-6 space-y-5 pr-1 text-xs">
                
                {/* Type Switcher */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">Transaction Type</span>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-dark-950 rounded-2xl border border-slate-200/30 dark:border-dark-800">
                    <button
                      type="button"
                      onClick={() => setTxType('expense')}
                      className={`py-2.5 rounded-xl font-bold transition-all text-xs ${
                        txType === 'expense'
                          ? 'bg-white dark:bg-dark-900 shadow-sm text-rose-500'
                          : 'text-slate-500 dark:text-dark-400'
                      }`}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxType('income')}
                      className={`py-2.5 rounded-xl font-bold transition-all text-xs ${
                        txType === 'income'
                          ? 'bg-white dark:bg-dark-900 shadow-sm text-emerald-500'
                          : 'text-slate-500 dark:text-dark-400'
                      }`}
                    >
                      Income
                    </button>
                  </div>
                </div>

                {/* Amount input */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">Amount ({currencySymbol})</label>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-dark-800 bg-transparent outline-none focus:border-brand-500 font-extrabold text-lg text-slate-800 dark:text-white"
                  />
                </div>

                {/* Category Option */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">Category</label>
                  <select 
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-dark-800 bg-transparent outline-none focus:border-brand-500 font-bold text-xs cursor-pointer"
                  >
                    {txType === 'expense' ? (
                      EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                    ) : (
                      INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                    )}
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">Date</label>
                  <input 
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-dark-800 bg-transparent outline-none focus:border-brand-500 font-semibold text-xs text-slate-800 dark:text-white"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">Notes</label>
                  <textarea 
                    placeholder="Short description or note..."
                    value={txNotes}
                    rows="3"
                    onChange={(e) => setTxNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-dark-800 bg-transparent outline-none focus:border-brand-500 font-medium text-xs text-slate-800 dark:text-white resize-none"
                  />
                </div>

                {/* Receipt Upload Link */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">Receipt Image Link (URL)</label>
                  <input 
                    type="url"
                    placeholder="https://example.com/receipt.jpg"
                    value={txReceipt}
                    onChange={(e) => setTxReceipt(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-dark-800 bg-transparent outline-none focus:border-brand-500 font-medium text-xs text-slate-800 dark:text-white"
                  />
                </div>

                {/* Recurring Options */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-dark-850">
                  <div className="flex items-center justify-between">
                    <label htmlFor="recurring-check" className="font-bold text-slate-500 dark:text-dark-400 cursor-pointer">Mark Recurring Expense</label>
                    <input 
                      type="checkbox" 
                      id="recurring-check"
                      checked={txRecurring} 
                      onChange={(e) => setTxRecurring(e.target.checked)}
                      className="w-4.5 h-4.5 rounded border-slate-250 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                  </div>

                  {txRecurring && (
                    <div className="space-y-2 animate-slideDown">
                      <label className="font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">Recurrence Interval</label>
                      <select 
                        value={txInterval}
                        onChange={(e) => setTxInterval(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-dark-800 bg-transparent outline-none focus:border-brand-500 font-semibold text-xs cursor-pointer"
                      >
                        <option value="none">Choose interval...</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-xl shadow-brand-500/20 transition-all mt-6"
                >
                  {editingTx ? 'Update Entry' : 'Save Transaction'}
                </button>

              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deletingTx && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50" onClick={() => setDeletingTx(null)}></div>
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-[30%] left-[50%] -translate-x-[50%] w-full max-w-sm bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-850 p-6 z-[60] shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base mb-2">Delete Ledger Entry</h3>
              <p className="text-xs text-slate-550 dark:text-dark-400 leading-relaxed font-semibold mb-6">
                Are you absolutely sure you want to delete this {deletingTx.type} record from category <strong className="text-slate-800 dark:text-white">"{deletingTx.category}"</strong>? This action is permanent.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setDeletingTx(null)}
                  className="py-3 rounded-xl border border-slate-200 dark:border-dark-800 hover:bg-slate-100 dark:hover:bg-dark-900 text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-500/25"
                >
                  Delete record
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Transactions;
