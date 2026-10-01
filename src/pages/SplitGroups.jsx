import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, ArrowLeft, ArrowUpRight, TrendingUp, TrendingDown,
  CheckCircle2, Clock, AlertCircle, Trash2, Check, X, Sparkles,
  Receipt, Wallet, Calendar as CalendarIcon, ChevronRight, Share2, HandCoins
} from 'lucide-react';
import axios from 'axios';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import CreateSplitGroupModal from '../components/CreateSplitGroupModal';

// In-session memory cache to prevent UI flickering on tab switches
let cachedSplitGroups = null;

const SplitGroups = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { apiUrl, currencySymbol } = useFinance();
  const { user } = useAuth();
  const userId = user?._id || user?.id;

  const [groups, setGroups] = useState(() => cachedSplitGroups || []);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(() => !cachedSplitGroups);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Expense modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food');
  const [expensePaidBy, setExpensePaidBy] = useState('');
  const [submittingExpense, setSubmittingExpense] = useState(false);

  // Settlement modal state
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleTo, setSettleTo] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [settleNotes, setSettleNotes] = useState('');
  const [submittingSettle, setSubmittingSettle] = useState(false);

  // Fetch all groups (only needed when viewing the list)
  const fetchGroups = useCallback(async () => {
    try {
      if (!cachedSplitGroups) setLoading(true);
      const res = await axios.get(`${apiUrl}/split-groups`);
      cachedSplitGroups = res.data;
      setGroups(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching split groups:', err);
      setError('Failed to load split groups');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // Fetch single group details if groupId is present
  const fetchGroupDetails = useCallback(async (id) => {
    try {
      setLoadingDetails(true);
      const res = await axios.get(`${apiUrl}/split-groups/${id}`);
      setSelectedGroup(res.data);
      if (res.data?.members?.length > 0 && userId) {
        setExpensePaidBy(userId);
      }
    } catch (err) {
      console.error('Error fetching group details:', err);
      setError('Failed to load group details');
    } finally {
      setLoadingDetails(false);
    }
  }, [apiUrl, userId]);

  // Only fetch groups list when not viewing a specific group
  useEffect(() => {
    if (!groupId) {
      fetchGroups();
    }
  }, [groupId, fetchGroups]);

  // Fetch group details when viewing a specific group
  useEffect(() => {
    if (groupId) {
      fetchGroupDetails(groupId);
    } else {
      setSelectedGroup(null);
    }
  }, [groupId, fetchGroupDetails]);

  // Handle invitation accept/decline
  const handleInvitationResponse = async (gId, action) => {
    try {
      await axios.post(`${apiUrl}/split-groups/${gId}/invitations/respond`, { action });
      await fetchGroups();
      if (groupId === gId) {
        await fetchGroupDetails(gId);
      }
    } catch (err) {
      console.error('Error responding to invitation:', err);
    }
  };

  // Handle Add Group Expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount || Number(expenseAmount) <= 0) return;

    setSubmittingExpense(true);
    try {
      await axios.post(`${apiUrl}/split-groups/${selectedGroup._id}/expenses`, {
        title: expenseTitle.trim(),
        amount: Number(expenseAmount),
        category: expenseCategory,
        paidBy: expensePaidBy || userId,
        splitType: 'equal',
      });

      setExpenseTitle('');
      setExpenseAmount('');
      setIsExpenseModalOpen(false);
      await fetchGroupDetails(selectedGroup._id);
    } catch (err) {
      console.error('Error adding expense:', err);
    } finally {
      setSubmittingExpense(false);
    }
  };

  // Handle Settle Payment
  const handleSettle = async (e) => {
    e.preventDefault();
    if (!settleTo || !settleAmount || Number(settleAmount) <= 0) return;

    const recipientMember = selectedGroup.members.find(m => m.user && m.user.toString() === settleTo);
    setSubmittingSettle(true);
    try {
      await axios.post(`${apiUrl}/split-groups/${selectedGroup._id}/settle`, {
        to: settleTo,
        toName: recipientMember ? recipientMember.name : 'Member',
        amount: Number(settleAmount),
        notes: settleNotes.trim(),
      });

      setSettleTo('');
      setSettleAmount('');
      setSettleNotes('');
      setIsSettleModalOpen(false);
      await fetchGroupDetails(selectedGroup._id);
    } catch (err) {
      console.error('Error recording settlement:', err);
    } finally {
      setSubmittingSettle(false);
    }
  };

  const pendingInvitations = useMemo(() => groups.filter(g => g.userStatus === 'pending'), [groups]);
  const activeGroups = useMemo(() => groups.filter(g => g.userStatus === 'accepted'), [groups]);

  // If in Group Detail View
  if (selectedGroup) {
    const isSettled = selectedGroup.userBalanceStatus === 'settled';
    const isOwed = selectedGroup.userBalanceStatus === 'owed';
    const isOwe = selectedGroup.userBalanceStatus === 'owe';

    return (
      <div className="space-y-6">
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/split-groups')}
              className="p-2 rounded-2xl bg-white/60 dark:bg-dark-900/60 border border-slate-200/50 dark:border-dark-800/60 hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-500 dark:text-dark-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedGroup.emoji}</span>
                <h1 className="text-2xl font-black tracking-tight">{selectedGroup.name}</h1>
              </div>
              <p className="text-xs text-slate-400 dark:text-dark-500 font-medium">
                {selectedGroup.description || 'Shared expense group'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsSettleModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-800 hover:bg-slate-100 dark:hover:bg-dark-850 text-slate-700 dark:text-dark-200 font-bold text-xs transition-all"
            >
              <HandCoins className="w-4 h-4 text-brand-500" /> Settle Up
            </button>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Expense
            </button>
          </div>
        </div>

        {/* Group Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Total Group Spending */}
          <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block mb-1">
              Total Group Spend
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {currencySymbol}{(selectedGroup.totalExpenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-dark-500 mt-1 font-medium">
              Across {(selectedGroup.expenses || []).length} recorded expenses
            </p>
          </div>

          {/* Card 2: Your Balance */}
          <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block mb-1">
              Your Group Balance
            </span>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-black ${
                isOwed ? 'text-emerald-500' : isOwe ? 'text-rose-500' : 'text-slate-400'
              }`}>
                {isSettled
                  ? 'Settled up'
                  : `${isOwed ? '+' : '-'}${currencySymbol}${selectedGroup.userAbsBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              </p>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-dark-500 mt-1 font-medium">
              {isOwed ? 'You are owed money by group members' : isOwe ? 'You owe money to group members' : 'All balances are currently even'}
            </p>
          </div>

          {/* Card 3: Members */}
          <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block mb-1">
              Members ({(selectedGroup.members || []).length})
            </span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedGroup.members?.map((m, idx) => (
                <span
                  key={idx}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    m.status === 'accepted'
                      ? 'bg-brand-500/10 border-brand-500/20 text-brand-600 dark:text-brand-400'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                  }`}
                >
                  {m.name} {m.status === 'pending' ? '(Invited)' : ''}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Expenses List & Settlement History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Expenses List */}
          <div className="lg:col-span-2 glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-extrabold text-base">Group Expenses</h3>
                <p className="text-[10px] text-slate-400 dark:text-dark-500 font-semibold">Shared bills & contributions</p>
              </div>
            </div>

            {(!selectedGroup.expenses || selectedGroup.expenses.length === 0) ? (
              <div className="py-12 text-center text-slate-400 dark:text-dark-500 text-xs font-semibold flex flex-col items-center gap-2">
                <Receipt className="w-8 h-8 text-slate-300 dark:text-dark-700" />
                No expenses logged in this group yet.
                <button
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="mt-2 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  + Add First Expense
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedGroup.expenses.slice().reverse().map((exp) => (
                  <div
                    key={exp._id}
                    className="p-3.5 rounded-2xl bg-white/40 dark:bg-dark-900/35 border border-slate-200/30 dark:border-dark-850 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-xs">
                        {exp.category?.substring(0, 2).toUpperCase() || 'EX'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{exp.title}</h4>
                        <p className="text-[10px] text-slate-400 dark:text-dark-500 mt-0.5">
                          Paid by <strong className="text-slate-600 dark:text-dark-300">{exp.paidByName}</strong> • {new Date(exp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {currencySymbol}{exp.amount.toFixed(2)}
                      </span>
                      <span className="block text-[9px] text-slate-400 dark:text-dark-550 font-medium">
                        Split equally
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settlements History */}
          <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-extrabold text-base">Settlements</h3>
                <p className="text-[10px] text-slate-400 dark:text-dark-500 font-semibold">Repayments & transfers</p>
              </div>
            </div>

            {(!selectedGroup.settlements || selectedGroup.settlements.length === 0) ? (
              <div className="py-12 text-center text-slate-400 dark:text-dark-500 text-xs font-semibold flex flex-col items-center gap-2">
                <HandCoins className="w-8 h-8 text-slate-300 dark:text-dark-700" />
                No settlements recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedGroup.settlements.slice().reverse().map((set) => (
                  <div
                    key={set._id}
                    className="p-3 rounded-2xl bg-white/40 dark:bg-dark-900/35 border border-slate-200/30 dark:border-dark-850 text-xs"
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Settle
                      </span>
                      <span className="text-slate-800 dark:text-white font-extrabold">
                        {currencySymbol}{set.amount.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-dark-400 mt-1">
                      <strong>{set.fromName}</strong> paid <strong>{set.toName}</strong>
                    </p>
                    {set.notes && (
                      <p className="text-[10px] text-slate-400 mt-0.5 italic">"{set.notes}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal: Add Expense */}
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsExpenseModalOpen(false)}></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-md glass-panel border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 rounded-3xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-800">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-brand-500" /> Add Group Expense
                </h3>
                <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-400 uppercase tracking-wider block text-[10px] mb-1">Expense Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Beach Shack Dinner, Villa Rent, Fuel"
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-800 bg-white/50 dark:bg-dark-950 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-400 uppercase tracking-wider block text-[10px] mb-1">Total Amount ({currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-800 bg-white/50 dark:bg-dark-950 text-slate-800 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-400 uppercase tracking-wider block text-[10px] mb-1">Paid By</label>
                  <select
                    value={expensePaidBy}
                    onChange={(e) => setExpensePaidBy(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-800 bg-white/50 dark:bg-dark-950 text-slate-800 dark:text-white"
                  >
                    {selectedGroup.members?.filter(m => m.user).map((m) => (
                      <option key={m.user} value={m.user}>
                        {m.name} {m.user === (user?._id || user?.id) ? '(You)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[11px] font-semibold">
                  Split equally among all {(selectedGroup.members || []).filter(m => m.status === 'accepted').length} accepted members.
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-dark-800 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingExpense}
                    className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold"
                  >
                    {submittingExpense ? 'Adding...' : 'Save Expense'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal: Settle Up */}
        {isSettleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSettleModalOpen(false)}></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-md glass-panel border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 rounded-3xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-800">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <HandCoins className="w-4 h-4 text-brand-500" /> Settle Debt
                </h3>
                <button onClick={() => setIsSettleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSettle} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-400 uppercase tracking-wider block text-[10px] mb-1">Pay To</label>
                  <select
                    required
                    value={settleTo}
                    onChange={(e) => setSettleTo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-800 bg-white/50 dark:bg-dark-950 text-slate-800 dark:text-white"
                  >
                    <option value="">Select recipient member</option>
                    {selectedGroup.members
                      ?.filter(m => m.user && m.user.toString() !== (user?._id || user?.id)?.toString())
                      .map((m) => (
                        <option key={m.user} value={m.user}>
                          {m.name} ({m.email})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-400 uppercase tracking-wider block text-[10px] mb-1">Amount ({currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-800 bg-white/50 dark:bg-dark-950 text-slate-800 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-400 uppercase tracking-wider block text-[10px] mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Paid via UPI / GPay"
                    value={settleNotes}
                    onChange={(e) => setSettleNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-800 bg-white/50 dark:bg-dark-950 text-slate-800 dark:text-white"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSettleModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-dark-800 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingSettle}
                    className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold"
                  >
                    {submittingSettle ? 'Recording...' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  // Split Groups Listing View
  return (
    <div className="space-y-6">
      {/* Top Banner Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            Split Groups
            <Sparkles className="w-5 h-5 text-brand-500" />
          </h1>
          <p className="text-xs text-slate-400 dark:text-dark-500 font-semibold">
            Manage shared expenses with friends, family, and roommates.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-md shadow-brand-500/15 transition-all"
        >
          <Plus className="w-4 h-4" /> Create Split Group
        </button>
      </div>

      {/* Pending Invitations Banner (if any) */}
      {pendingInvitations.length > 0 && (
        <div className="glass-panel border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 rounded-3xl p-5">
          <h3 className="font-extrabold text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" /> Pending Invitations ({pendingInvitations.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingInvitations.map((inv) => (
              <div
                key={inv._id}
                className="p-3.5 rounded-2xl bg-white/60 dark:bg-dark-900/60 border border-slate-200/50 dark:border-dark-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{inv.emoji}</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{inv.name}</h4>
                    <p className="text-[10px] text-slate-400">Invited to join</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleInvitationResponse(inv._id, 'accept')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> Accept
                  </button>
                  <button
                    onClick={() => handleInvitationResponse(inv._id, 'decline')}
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-dark-800 text-slate-500 hover:text-rose-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Groups List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="spinner"></div>
          <p className="text-xs text-slate-400 font-semibold">Loading your split groups...</p>
        </div>
      ) : activeGroups.length === 0 ? (
        <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">No shared groups yet</h3>
            <p className="text-xs text-slate-400 dark:text-dark-500 mt-1 font-medium leading-relaxed">
              Create a group with friends and easily track who owes whom for trips, dinners, and flat expenses.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/15 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Split Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeGroups.map((group) => {
            const isSettled = group.balanceStatus === 'settled';
            const isOwed = group.balanceStatus === 'owed';
            const isOwe = group.balanceStatus === 'owe';

            return (
              <div
                key={group._id}
                className="glass-panel border border-slate-200/50 dark:border-dark-800/40 hover:border-brand-500/40 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2 rounded-2xl bg-white/40 dark:bg-dark-900/50 border border-slate-200/30 dark:border-dark-800">
                        {group.emoji}
                      </span>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">
                          {group.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 dark:text-dark-500 font-medium flex items-center gap-1.5 mt-0.5">
                          <Users className="w-3.5 h-3.5" /> {group.memberCount} Members
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-dark-900/35 border border-slate-200/30 dark:border-dark-850 space-y-2 mb-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Total Spend</span>
                      <span className="font-extrabold text-slate-800 dark:text-white">
                        {currencySymbol}{(group.totalExpenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100 dark:border-dark-850">
                      <span className="text-slate-400 font-medium">Your Balance</span>
                      <span className={`font-extrabold ${
                        isOwed ? 'text-emerald-500' : isOwe ? 'text-rose-500' : 'text-slate-400'
                      }`}>
                        {isSettled
                          ? 'Settled up'
                          : isOwed
                            ? `You are owed ${currencySymbol}${group.absBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            : `You owe ${currencySymbol}${group.absBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/split-groups/${group._id}`)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 dark:bg-dark-900 hover:bg-brand-600 hover:text-white dark:hover:bg-brand-600 text-slate-700 dark:text-dark-200 text-xs font-bold transition-all"
                >
                  View Group <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <CreateSplitGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGroupCreated={() => {
          fetchGroups();
        }}
      />
    </div>
  );
};

export default SplitGroups;
