import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HandCoins, Plus, Calendar as CalendarIcon, User, Phone, 
  ArrowUpRight, ArrowDownLeft, X, Sparkles, CheckCircle2, 
  Trash2, Search, Edit2, ClipboardCheck, Info, RefreshCw
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';

const BorrowLend = () => {
  const { currencySymbol, apiUrl, refreshAll } = useFinance();
  
  const [activeTab, setActiveTab] = useState('borrow'); // borrow or lend
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending'); // pending or all
  
  // Drawer & Modals state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // Record Form Fields
  const [personName, setPersonName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().substring(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [interest, setInterest] = useState('');
  const [notes, setNotes] = useState('');
  const [editingRecordId, setEditingRecordId] = useState(null);
  
  // Payment Modal Fields
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().substring(0, 10));

  // Detail Modal view
  const [detailRecord, setDetailRecord] = useState(null);

  // Fetch lists
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'borrow' ? 'borrow' : 'lend';
      let url = `${apiUrl}/${endpoint}?status=${filterStatus === 'pending' ? 'pending' : ''}`;
      if (search.trim()) url += `&search=${search}`;
      
      const res = await axios.get(url);
      setRecords(res.data);
    } catch (err) {
      console.error('Error fetching borrow/lend records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [activeTab, filterStatus]);

  // Debounced Search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchRecords();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const resetForm = () => {
    setPersonName('');
    setContactNumber('');
    setAmount('');
    setTransactionDate(new Date().toISOString().substring(0, 10));
    setDueDate('');
    setInterest('');
    setNotes('');
    setEditingRecordId(null);
  };

  const handleEdit = (record) => {
    setEditingRecordId(record._id);
    setPersonName(record.personName);
    setContactNumber(record.contactNumber || '');
    setAmount(record.amount.toString());
    setTransactionDate(new Date(record.borrowDate || record.lendingDate).toISOString().substring(0, 10));
    setDueDate(new Date(record.dueDate).toISOString().substring(0, 10));
    setInterest(record.interest?.toString() || '');
    setNotes(record.notes || '');
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!personName || !amount || !dueDate) return;

    try {
      const endpoint = activeTab === 'borrow' ? 'borrow' : 'lend';
      const payload = {
        personName,
        contactNumber,
        amount: Number(amount),
        remainingAmount: Number(amount),
        [activeTab === 'borrow' ? 'borrowDate' : 'lendingDate']: new Date(transactionDate),
        dueDate: new Date(dueDate),
        interest: interest ? Number(interest) : 0,
        notes,
      };

      if (editingRecordId) {
        // Remove remainingAmount from update payload unless amount changed
        delete payload.remainingAmount;
        await axios.put(`${apiUrl}/${endpoint}/${editingRecordId}`, payload);
      } else {
        await axios.post(`${apiUrl}/${endpoint}`, payload);
      }

      setIsDrawerOpen(false);
      resetForm();
      fetchRecords();
      refreshAll();
    } catch (err) {
      console.error('Failed to save borrow/lend record:', err);
    }
  };

  const handleOpenPaymentModal = (record) => {
    setSelectedRecord(record);
    setPaymentAmount(record.remainingAmount.toString());
    setPaymentNotes('');
    setPaymentDate(new Date().toISOString().substring(0, 10));
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0 || !selectedRecord) return;

    try {
      const endpoint = activeTab === 'borrow' ? 'borrow' : 'lend';
      await axios.post(`${apiUrl}/${endpoint}/${selectedRecord._id}/payment`, {
        amount: Number(paymentAmount),
        notes: paymentNotes,
        date: new Date(paymentDate),
      });

      setIsPaymentModalOpen(false);
      setSelectedRecord(null);
      fetchRecords();
      refreshAll();
    } catch (err) {
      console.error('Failed to log payment:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this record?')) return;
    try {
      const endpoint = activeTab === 'borrow' ? 'borrow' : 'lend';
      await axios.delete(`${apiUrl}/${endpoint}/${id}`);
      fetchRecords();
      refreshAll();
    } catch (err) {
      console.error('Failed to delete record:', err);
    }
  };

  // Outstanding total calculations
  const totalOutstanding = records
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.remainingAmount, 0);

  const getDaysLeft = (dueDateStr) => {
    const diff = new Date(dueDateStr) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return `Overdue by ${Math.abs(days)} days`;
    if (days === 0) return 'Due today';
    return `${days} days left`;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Debts & Receivables</h1>
          <p className="text-xs text-slate-400 dark:text-dark-500 font-semibold">Keep tabs on money borrowed from friends or lent out.</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setIsDrawerOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-500/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>

      {/* Tabs Selector & Total Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Navigation Tabs */}
        <div className="lg:col-span-2 p-1.5 bg-slate-100 dark:bg-dark-900 border border-slate-200/50 dark:border-dark-800 rounded-3xl flex gap-2 h-16 items-center">
          <button
            onClick={() => {
              setActiveTab('borrow');
              setSearch('');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'borrow'
                ? 'bg-white dark:bg-dark-950 shadow text-rose-500'
                : 'text-slate-500 hover:text-slate-800 dark:text-dark-400 dark:hover:text-dark-200'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" /> Borrowed Money
          </button>
          <button
            onClick={() => {
              setActiveTab('lend');
              setSearch('');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'lend'
                ? 'bg-white dark:bg-dark-950 shadow text-emerald-500'
                : 'text-slate-500 hover:text-slate-800 dark:text-dark-400 dark:hover:text-dark-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" /> Lent Money
          </button>
        </div>

        {/* Dynamic Outstanding Summary Card */}
        <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-4.5 flex items-center justify-between shadow">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider">
              {activeTab === 'borrow' ? 'Total Outstanding Debt' : 'Total Receivables'}
            </span>
            <h2 className={`text-2xl font-extrabold tracking-tight mt-1 ${activeTab === 'borrow' ? 'text-rose-500' : 'text-emerald-500'}`}>
              {currencySymbol}{totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${activeTab === 'borrow' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
            <HandCoins className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-dark-800 bg-white/40 dark:bg-dark-900/40 text-xs w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 dark:text-dark-500" />
          <input 
            type="text" 
            placeholder="Search by name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-0 outline-none w-full text-xs font-semibold"
          />
        </div>

        {/* Status toggles */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider mr-2">Status:</span>
          {['pending', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-all ${
                filterStatus === status
                  ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-950 shadow-sm'
                  : 'bg-white/40 border-slate-200 hover:bg-slate-100 dark:bg-dark-900/40 dark:border-dark-800 text-slate-500 dark:text-dark-400'
              }`}
            >
              {status === 'pending' ? 'Outstanding' : 'All Records'}
            </button>
          ))}
        </div>

      </div>

      {/* Records Listings */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-3">
          <div className="spinner"></div>
          <p className="text-xs text-slate-400 font-semibold">Updating ledger sheets...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl py-20 text-center text-slate-400 dark:text-dark-500 font-semibold flex flex-col items-center gap-2">
          <HandCoins className="w-8 h-8 text-slate-350 dark:text-dark-750" />
          No debt records found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((record) => {
            const isPending = record.status === 'pending';
            const progress = ((record.amount - record.remainingAmount) / record.amount) * 100;
            const daysLeftStr = getDaysLeft(record.dueDate);
            const isOverdue = daysLeftStr.includes('Overdue');

            return (
              <motion.div
                key={record._id}
                whileHover={{ y: -3 }}
                className={`glass-panel border rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between shadow ${
                  isOverdue && isPending
                    ? 'border-rose-500/30 bg-rose-500/[0.01]' 
                    : 'border-slate-200/60 dark:border-dark-800/40'
                }`}
              >
                
                {/* Upper info */}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                        <User className="w-4 h-4 text-slate-400" />
                        {record.personName}
                      </h3>
                      {record.contactNumber && (
                        <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {record.contactNumber}
                        </p>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                      record.status === 'paid' || record.status === 'repaid'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                        : isOverdue 
                          ? 'bg-rose-500/10 border-rose-500/25 text-rose-500'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                    }`}>
                      {record.status}
                    </span>
                  </div>

                  {record.notes && (
                    <p className="text-[11px] text-slate-450 dark:text-dark-500 leading-relaxed font-semibold italic mt-2.5 mb-4 line-clamp-2">
                      "{record.notes}"
                    </p>
                  )}

                  {/* Amounts */}
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-dark-850 pt-4 mb-4 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Principal</span>
                      <span className="font-extrabold text-slate-500">{currencySymbol}{record.amount.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remaining</span>
                      <span className={`font-extrabold ${isPending ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                        {currencySymbol}{record.remainingAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Repayment Progress bar */}
                  {isPending && record.remainingAmount < record.amount && (
                    <div className="space-y-1 mb-4">
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-dark-900 overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${progress}%` }}></div>
                      </div>
                      <span className="text-[9px] text-slate-450 font-bold block text-right">{progress.toFixed(0)}% Repaid</span>
                    </div>
                  )}
                </div>

                {/* Lower info & Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-850 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Due Date</span>
                    <span className={`font-bold flex items-center gap-1 mt-0.5 ${
                      isPending && isOverdue ? 'text-rose-500' : 'text-slate-500'
                    }`}>
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {new Date(record.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {isPending && (
                      <span className={`text-[9px] font-bold mt-0.5 block ${isOverdue ? 'text-rose-550' : 'text-slate-400'}`}>
                        {daysLeftStr}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-1.5">
                    {/* View Details */}
                    <button 
                      onClick={() => setDetailRecord(record)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-dark-900 border border-slate-200/50 dark:border-dark-800 text-slate-500 hover:text-slate-700"
                      title="Repayments Ledger"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    {isPending && (
                      <button 
                        onClick={() => handleOpenPaymentModal(record)}
                        className="px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm uppercase tracking-wider"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" /> Log Pay
                      </button>
                    )}
                    <div className="flex gap-0.5 items-center">
                      <button 
                        onClick={() => handleEdit(record)}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-900 text-slate-400 hover:text-slate-600"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(record._id)}
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

      {/* Slide-out Drawer Panel (Add/Edit Record) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-xs" onClick={() => setIsDrawerOpen(false)}></div>

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
                  {editingRecordId ? 'Modify Record' : `New ${activeTab === 'borrow' ? 'Debt' : 'Lending'} Obligation`}
                </h2>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-dark-900 border border-slate-200/50 dark:border-dark-800 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto mt-6 space-y-5 pr-1 text-xs">
                
                {/* Person name */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">Person Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="Friend, bank or organization"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-dark-800 bg-transparent outline-none focus:border-brand-500 font-semibold text-xs text-slate-800 dark:text-white"
                  />
                </div>

                {/* Contact phone */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">Contact Number (Optional)</label>
                  <input 
                    type="text"
                    placeholder="Phone number"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-dark-800 bg-transparent outline-none focus:border-brand-500 font-medium text-xs text-slate-800 dark:text-white"
                  />
                </div>

                {/* Principal amount */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">Principal Amount ({currencySymbol})</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-dark-800 bg-transparent outline-none focus:border-brand-500 font-extrabold text-lg text-slate-800 dark:text-white"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">Start Date</label>
                    <input 
                      type="date"
                      required
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl border border-slate-250 dark:border-dark-800 bg-transparent outline-none focus:border-brand-500 font-semibold text-xs text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">Due Date</label>
                    <input 
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl border border-slate-250 dark:border-dark-800 bg-transparent outline-none focus:border-brand-500 font-semibold text-xs text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Interest % */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">Interest Rate (% Flat or Annual - optional)</label>
                  <input 
                    type="number"
                    placeholder="e.g. 5"
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-dark-800 bg-transparent outline-none focus:border-brand-500 font-medium text-xs text-slate-800 dark:text-white"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">Notes</label>
                  <textarea 
                    placeholder="Context or terms of payment..."
                    value={notes}
                    rows="3"
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-dark-800 bg-transparent outline-none focus:border-brand-500 font-medium text-xs text-slate-800 dark:text-white resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-xl shadow-brand-500/20 transition-all mt-6"
                >
                  {editingRecordId ? 'Update Record' : 'Create Record'}
                </button>

              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Record Payment Dialog */}
      <AnimatePresence>
        {isPaymentModalOpen && selectedRecord && (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50" onClick={() => setIsPaymentModalOpen(false)}></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-[20%] left-[50%] -translate-x-[50%] w-full max-w-sm bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-850 p-6 z-[60] shadow-2xl"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-dark-850 mb-4">
                <h3 className="font-extrabold text-base">Submit Repayment Log</h3>
                <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Amount ({currencySymbol})</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    max={selectedRecord.remainingAmount}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-dark-800 bg-transparent outline-none font-bold text-sm text-slate-800 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Max payable: {currencySymbol}{selectedRecord.remainingAmount.toFixed(2)}</span>
                </div>

                <div>
                  <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Payment Date</label>
                  <input 
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-dark-800 bg-transparent outline-none text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Comment / Note</label>
                  <input 
                    type="text"
                    placeholder="e.g. Paid cash, GPay, check number"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-dark-800 bg-transparent outline-none text-slate-850 dark:text-white font-medium"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25"
                >
                  Save Log Entry
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Detail & Payment History Modal */}
      <AnimatePresence>
        {detailRecord && (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50" onClick={() => setDetailRecord(null)}></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-[15%] left-[50%] -translate-x-[50%] w-full max-w-lg bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-850 p-6 z-[60] shadow-2xl"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-dark-850 mb-4">
                <h3 className="font-extrabold text-base flex items-center gap-1.5">
                  <ClipboardCheck className="w-5 h-5 text-brand-500" />
                  Repayments Ledger: {detailRecord.personName}
                </h3>
                <button onClick={() => setDetailRecord(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 text-xs">
                {/* Key metadata */}
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-dark-955 rounded-2xl border border-slate-100 dark:border-dark-800 text-[11px] font-semibold">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Principal Amount</span>
                    <span className="font-bold text-slate-600 dark:text-dark-300">{currencySymbol}{detailRecord.amount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Remaining Bal</span>
                    <span className="font-bold text-slate-800 dark:text-white">{currencySymbol}{detailRecord.remainingAmount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Interest Charge</span>
                    <span className="font-bold text-slate-600 dark:text-dark-300">{detailRecord.interest || 0}%</span>
                  </div>
                </div>

                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mt-4 mb-2">Transaction Logs</h4>
                
                {detailRecord.paymentHistory?.length === 0 ? (
                  <div className="py-8 text-center text-slate-450 dark:text-dark-500 font-semibold bg-slate-50/50 dark:bg-dark-950/20 rounded-2xl">
                    No partial payments logged yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detailRecord.paymentHistory.map((history, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-2xl bg-white border border-slate-150 dark:bg-dark-900 dark:border-dark-800/80">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-white">{history.notes || 'Repayment'}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {new Date(history.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <span className="font-extrabold text-emerald-500">
                          +{currencySymbol}{history.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={() => setDetailRecord(null)}
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

export default BorrowLend;
