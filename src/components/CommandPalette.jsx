import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ArrowRight, CornerDownLeft, FileText, 
  HandCoins, PiggyBank, LayoutDashboard, ArrowDownUp, 
  User, Sun, Moon, Sparkles
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const CommandPalette = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const { currencySymbol, apiUrl } = useFinance();
  
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Reset palette when opening/closing
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setSearchResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Command Menu Actions (Static lists)
  const staticCommands = [
    { type: 'action', title: 'Add New Expense', action: 'add-expense', icon: ArrowDownUp, category: 'Transactions' },
    { type: 'action', title: 'Add New Income', action: 'add-income', icon: ArrowDownUp, category: 'Transactions' },
    { type: 'action', title: 'Toggle Light/Dark Theme', action: 'toggle-theme', icon: Sun, category: 'Preferences' },
    { type: 'nav', title: 'Go to Dashboard', path: '/dashboard', icon: LayoutDashboard, category: 'Navigation' },
    { type: 'nav', title: 'Go to Transactions List', path: '/transactions', icon: ArrowDownUp, category: 'Navigation' },
    { type: 'nav', title: 'Go to Borrow & Lend Module', path: '/borrow-lend', icon: HandCoins, category: 'Navigation' },
    { type: 'nav', title: 'Go to Budgets & Savings', path: '/budgets-savings', icon: PiggyBank, category: 'Navigation' },
    { type: 'nav', title: 'Go to Profile Settings', path: '/profile', icon: User, category: 'Navigation' },
  ];

  // Global Search across models via API
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults(staticCommands);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        // Query transactions, borrow, lend, and savings matching the search
        const [txsRes, borrowRes, lendRes, savingsRes] = await Promise.all([
          axios.get(`${apiUrl}/transactions?search=${search}`),
          axios.get(`${apiUrl}/borrow?search=${search}`),
          axios.get(`${apiUrl}/lend?search=${search}`),
          axios.get(`${apiUrl}/savings`) // Filter savings locally
        ]);

        const txs = txsRes.data.map(t => ({
          type: 'tx',
          title: `${t.type === 'income' ? 'Income' : 'Expense'}: ${t.category} ${t.notes ? `(${t.notes})` : ''}`,
          subtitle: `${t.type === 'income' ? '+' : '-'}${currencySymbol}${t.amount}`,
          data: t,
          icon: ArrowDownUp,
          category: 'Matching Transactions'
        }));

        const borrows = borrowRes.data.map(b => ({
          type: 'borrow',
          title: `Borrowed: ${b.personName} ${b.notes ? `(${b.notes})` : ''}`,
          subtitle: `Owe: ${currencySymbol}${b.remainingAmount} (Total: ${currencySymbol}${b.amount})`,
          data: b,
          icon: HandCoins,
          category: 'Matching Debts'
        }));

        const lends = lendRes.data.map(l => ({
          type: 'lend',
          title: `Lent: ${l.personName} ${l.notes ? `(${l.notes})` : ''}`,
          subtitle: `Receive: ${currencySymbol}${l.remainingAmount} (Total: ${currencySymbol}${l.amount})`,
          data: l,
          icon: HandCoins,
          category: 'Matching Receivables'
        }));

        const savings = savingsRes.data
          .filter(s => s.title.toLowerCase().includes(search.toLowerCase()))
          .map(s => ({
            type: 'savings',
            title: `Savings Goal: ${s.title}`,
            subtitle: `Saved: ${currencySymbol}${s.currentAmount} / ${currencySymbol}${s.targetAmount}`,
            data: s,
            icon: PiggyBank,
            category: 'Matching Goals'
          }));

        setSearchResults([...txs, ...borrows, ...lends, ...savings]);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Command palette search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Key Event Listeners
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        executeCommand(searchResults[selectedIndex]);
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const activeEl = resultsRef.current?.children[selectedIndex];
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const executeCommand = (cmd) => {
    setIsOpen(false);
    if (cmd.type === 'nav') {
      navigate(cmd.path);
    } else if (cmd.type === 'action') {
      if (cmd.action === 'toggle-theme') {
        toggleTheme();
      } else if (cmd.action === 'add-expense') {
        navigate('/transactions', { state: { openAddDrawer: true, defaultType: 'expense' } });
      } else if (cmd.action === 'add-income') {
        navigate('/transactions', { state: { openAddDrawer: true, defaultType: 'income' } });
      }
    } else if (cmd.type === 'tx') {
      navigate('/transactions');
    } else if (cmd.type === 'borrow' || cmd.type === 'lend') {
      navigate('/borrow-lend');
    } else if (cmd.type === 'savings') {
      navigate('/budgets-savings');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
          ></motion.div>

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-[15%] left-[50%] -translate-x-[50%] w-full max-w-2xl bg-white/80 dark:bg-dark-900/80 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-dark-850 shadow-2xl z-[60] overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200/50 dark:border-dark-800/80">
              <Search className="w-5 h-5 text-slate-400 dark:text-dark-500" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a command or search transactions, debts, savings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent border-0 outline-none text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-dark-500 text-sm py-1 font-medium"
              />
              {loading && <div className="spinner w-4 h-4 border-2"></div>}
              <span className="text-[10px] text-slate-400 dark:text-dark-600 font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-dark-800 border border-slate-200/50 dark:border-dark-700/60 uppercase">esc</span>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto p-3" ref={resultsRef}>
              {searchResults.length === 0 ? (
                <div className="py-8 text-center text-slate-400 dark:text-dark-500 flex flex-col items-center gap-2">
                  <Sparkles className="w-5 h-5 text-slate-350 dark:text-dark-600 animate-pulse" />
                  <p className="text-xs font-semibold">No results found matching "{search}"</p>
                  <p className="text-[10px]">Try typing "expense", "borrow", or "theme"</p>
                </div>
              ) : (
                searchResults.map((cmd, idx) => {
                  const isSelected = idx === selectedIndex;
                  const Icon = cmd.icon || FileText;
                  
                  // Render Category Header if first item or category changes
                  const showHeader = idx === 0 || searchResults[idx - 1].category !== cmd.category;

                  return (
                    <div key={idx}>
                      {showHeader && (
                        <div className="px-3 pt-3 pb-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-dark-500 uppercase">
                          {cmd.category}
                        </div>
                      )}
                      <div
                        onClick={() => executeCommand(cmd)}
                        className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer text-sm font-medium transition-all ${
                          isSelected 
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/15' 
                            : 'text-slate-600 dark:text-dark-300 hover:bg-slate-100/60 dark:hover:bg-dark-900/40'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400 dark:text-dark-500'}`} />
                          <div className="flex flex-col">
                            <span>{cmd.title}</span>
                            {cmd.subtitle && (
                              <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-400 dark:text-dark-500'}`}>
                                {cmd.subtitle}
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-1 text-[10px] text-white/80 font-bold px-1.5 py-0.5 rounded bg-white/20 border border-white/10 uppercase">
                            <CornerDownLeft className="w-2.5 h-2.5" /> enter
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
