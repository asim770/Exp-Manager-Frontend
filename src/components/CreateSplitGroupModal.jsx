import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Sparkles, Plus, Trash2, Mail, User, AlertCircle, Check } from 'lucide-react';
import axios from 'axios';
import { useFinance } from '../context/FinanceContext';

const EMOJI_OPTIONS = ['🏝️', '🍕', '🏠', '✈️', '🚗', '☕', '💼', '🎮', '🛍️', '🎉', '🍿', '🍻'];

const CreateSplitGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const { apiUrl } = useFinance();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🏝️');
  const [members, setMembers] = useState([{ name: '', email: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddMember = () => {
    setMembers([...members, { name: '', email: '' }]);
  };

  const handleRemoveMember = (index) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index, field, value) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a group name');
      return;
    }

    // Filter valid members
    const validMembers = members
      .map(m => ({ name: m.name.trim(), email: m.email.trim() }))
      .filter(m => m.email.length > 0);

    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(`${apiUrl}/split-groups`, {
        name: name.trim(),
        description: description.trim(),
        emoji,
        members: validMembers,
      });

      // Reset form
      setName('');
      setDescription('');
      setEmoji('🏝️');
      setMembers([{ name: '', email: '' }]);

      if (onGroupCreated) {
        onGroupCreated(res.data);
      }
      onClose();
    } catch (err) {
      console.error('Failed to create split group:', err);
      setError(err.response?.data?.message || 'Failed to create group. Please check member emails and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 260 }}
          className="relative w-full max-w-lg glass-modal border border-slate-200/70 dark:border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl z-10 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  Create Split Group
                  <Sparkles className="w-4 h-4 text-brand-500" />
                </h3>
                <p className="text-xs text-slate-400 dark:text-dark-500 font-medium">
                  Track and split shared group expenses effortlessly
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl glass-pill border border-slate-200/50 dark:border-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pt-4 space-y-4 pr-1 text-xs">
            {error && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-rose-500 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Emoji Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">
                Group Icon
              </label>
              <div className="flex flex-wrap gap-2 p-2.5 rounded-2xl glass-pill border border-slate-200/50 dark:border-white/10">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                      emoji === e
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30 scale-110'
                        : 'hover:bg-white/50 dark:hover:bg-white/10'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Group Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">
                Group Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Goa Trip, College Friends, Flatmates"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200/70 dark:border-white/10 glass-input text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-dark-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">
                Description (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Vacation expenses, shared bills & food"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200/70 dark:border-white/10 glass-input text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-dark-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
              />
            </div>

            {/* Members to Invite */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block">
                    Invite Friends
                  </label>
                  <p className="text-[10px] text-slate-400 dark:text-dark-500">
                    Add member email addresses. They will receive an invitation to join.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg glass-pill border border-slate-200/50 dark:border-white/10 hover:border-brand-500/40 text-brand-600 dark:text-brand-400 text-[11px] font-bold transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Member
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {members.map((member, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-dark-600" />
                      <input
                        type="email"
                        placeholder="friend@example.com"
                        value={member.email}
                        onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
                        className="w-full pl-8.5 pr-3 py-2 rounded-xl border border-slate-200/70 dark:border-white/10 glass-input text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-dark-600 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                    <div className="w-1/3 relative hidden sm:block">
                      <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-dark-600" />
                      <input
                        type="text"
                        placeholder="Name"
                        value={member.name}
                        onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                        className="w-full pl-8.5 pr-3 py-2 rounded-xl border border-slate-200/70 dark:border-white/10 glass-input text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-dark-600 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                    {members.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(idx)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit / Cancel Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-dark-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-800 hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-600 dark:text-dark-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="spinner w-3.5 h-3.5 border-2"></div>
                    Creating Group...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Split Group
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default React.memo(CreateSplitGroupModal);
