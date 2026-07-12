import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  ArrowUpRight, ArrowDownLeft, Info, HelpCircle, AlertCircle, X, Sparkles
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';

const CalendarView = () => {
  const { currencySymbol, apiUrl } = useFinance();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [lends, setLends] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Day detailed modal
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);

  const fetchMonthEvents = async () => {
    setLoading(true);
    try {
      // Calculate first and last day of the active month
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      const firstDay = new Date(year, month, 1).toISOString();
      const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();
      
      const [txsRes, borrowsRes, lendsRes] = await Promise.all([
        axios.get(`${apiUrl}/transactions?startDate=${firstDay}&endDate=${lastDay}`),
        axios.get(`${apiUrl}/borrow`), // Fetch all active and filter
        axios.get(`${apiUrl}/lend`)
      ]);

      setTransactions(txsRes.data);
      
      // Filter borrows/lends having due date in active month
      const activeBorrows = borrowsRes.data.filter(b => {
        const d = new Date(b.dueDate);
        return d.getFullYear() === year && d.getMonth() === month;
      });
      const activeLends = lendsRes.data.filter(l => {
        const d = new Date(l.dueDate);
        return d.getFullYear() === year && d.getMonth() === month;
      });

      setBorrows(activeBorrows);
      setLends(activeLends);
    } catch (err) {
      console.error('Error fetching calendar datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthEvents();
  }, [currentDate]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // weekday index of day 1

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Compile days in grid
  const calendarCells = [];
  
  // Empty spaces for previous month's trailing days
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push({ empty: true });
  }

  // Active month days
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(year, month, day);
    cellDate.setHours(0, 0, 0, 0);

    // Filter events for this specific day
    const dayTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      d.setHours(0,0,0,0);
      return d.getTime() === cellDate.getTime();
    });

    const dayBorrows = borrows.filter(b => {
      const d = new Date(b.dueDate);
      d.setHours(0,0,0,0);
      return d.getTime() === cellDate.getTime();
    });

    const dayLends = lends.filter(l => {
      const d = new Date(l.dueDate);
      d.setHours(0,0,0,0);
      return d.getTime() === cellDate.getTime();
    });

    calendarCells.push({
      empty: false,
      day,
      date: cellDate,
      transactions: dayTransactions,
      borrows: dayBorrows,
      lends: dayLends,
      hasEvents: dayTransactions.length > 0 || dayBorrows.length > 0 || dayLends.length > 0
    });
  }

  const handleCellClick = (cell) => {
    if (cell.empty || !cell.hasEvents) return;
    setSelectedDayEvents(cell);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Finance Calendar</h1>
          <p className="text-xs text-slate-400 dark:text-dark-500 font-semibold">Organize payments and trace cash actions in date grids.</p>
        </div>
        
        {/* Navigation toggles */}
        <div className="flex items-center gap-3 bg-white/40 dark:bg-dark-900/40 border border-slate-200 dark:border-dark-800 p-1.5 rounded-xl">
          <button 
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-slate-105 dark:hover:bg-dark-800 text-slate-655"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold px-4 tracking-wide text-slate-800 dark:text-white min-w-[120px] text-center">
            {monthNames[month]} {year}
          </span>
          <button 
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-slate-105 dark:hover:bg-dark-800 text-slate-655"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-5 shadow">
        
        {/* Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-4 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
            <span key={dayName} className="text-[10px] font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider py-2">
              {dayName}
            </span>
          ))}
        </div>

        {/* Date cells grid */}
        {loading ? (
          <div className="py-24 text-center flex flex-col items-center gap-3">
            <div className="spinner"></div>
            <p className="text-xs text-slate-400 font-semibold">Aligning calendar entries...</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell, idx) => {
              if (cell.empty) {
                return (
                  <div key={idx} className="aspect-square bg-slate-100/10 dark:bg-dark-950/20 rounded-2xl border border-transparent"></div>
                );
              }

              const hasInc = cell.transactions.some(t => t.type === 'income');
              const hasExp = cell.transactions.some(t => t.type === 'expense');
              const hasDebt = cell.borrows.length > 0;
              const hasCredit = cell.lends.length > 0;

              return (
                <div
                  key={idx}
                  onClick={() => handleCellClick(cell)}
                  className={`aspect-square p-2 border rounded-2xl flex flex-col justify-between transition-all select-none ${
                    cell.hasEvents 
                      ? 'cursor-pointer hover:scale-[1.03] bg-white dark:bg-dark-900 border-slate-200/60 dark:border-dark-800/80 shadow-sm' 
                      : 'bg-transparent border-slate-100 dark:border-dark-900/40 text-slate-400 dark:text-dark-600'
                  }`}
                >
                  <span className="text-xs font-bold">{cell.day}</span>
                  
                  {/* Indicators */}
                  <div className="flex flex-wrap gap-1 mt-1 justify-end">
                    {hasInc && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Income logged"></span>
                    )}
                    {hasExp && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Expense logged"></span>
                    )}
                    {hasDebt && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Debt payment due"></span>
                    )}
                    {hasCredit && (
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" title="Lent payment receivable"></span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Selected Date Events Drawer */}
      <AnimatePresence>
        {selectedDayEvents && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-xs" onClick={() => setSelectedDayEvents(null)}></div>
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 bottom-0 right-0 w-full max-w-md bg-white dark:bg-dark-900 border-l border-slate-200 dark:border-dark-850 z-50 p-6 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-850">
                <div>
                  <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-500" />
                    Ledger: {monthNames[month]} {selectedDayEvents.day}
                  </h2>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 block">Schedule of transactions on this day</span>
                </div>
                <button onClick={() => setSelectedDayEvents(null)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-dark-900 border border-slate-200/50 dark:border-dark-800 text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto mt-6 space-y-4 pr-1 text-xs">
                
                {/* 1. Transactions */}
                {selectedDayEvents.transactions.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-bold text-slate-400 uppercase tracking-wider block text-[9px]">Transactions</span>
                    {selectedDayEvents.transactions.map(t => (
                      <div key={t._id} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-dark-950/30 border border-slate-100 dark:border-dark-800">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-white">{t.category}</span>
                          {t.notes && <span className="text-[10px] text-slate-400 block mt-0.5">{t.notes}</span>}
                        </div>
                        <span className={`font-extrabold ${t.type === 'income' ? 'text-emerald-500' : 'text-slate-805 dark:text-white'}`}>
                          {t.type === 'income' ? '+' : '-'}{currencySymbol}{t.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Borrows Due */}
                {selectedDayEvents.borrows.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-bold text-amber-500 uppercase tracking-wider block text-[9px]">Debts Due (You owe)</span>
                    {selectedDayEvents.borrows.map(b => (
                      <div key={b._id} className="flex justify-between items-center p-3 rounded-2xl bg-amber-500/5 border border-amber-500/15">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-white">Pay: {b.personName}</span>
                          {b.notes && <span className="text-[10px] text-slate-400 block mt-0.5">{b.notes}</span>}
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-rose-500">{currencySymbol}{b.remainingAmount.toFixed(2)}</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">Total: {currencySymbol}{b.amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Lends Due */}
                {selectedDayEvents.lends.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-bold text-teal-500 uppercase tracking-wider block text-[9px]">Receivables Due (Collect)</span>
                    {selectedDayEvents.lends.map(l => (
                      <div key={l._id} className="flex justify-between items-center p-3 rounded-2xl bg-teal-500/5 border border-teal-500/15">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-white">Collect from: {l.personName}</span>
                          {l.notes && <span className="text-[10px] text-slate-400 block mt-0.5">{l.notes}</span>}
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-emerald-500">{currencySymbol}{l.remainingAmount.toFixed(2)}</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">Total: {currencySymbol}{l.amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              <button 
                onClick={() => setSelectedDayEvents(null)}
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs shadow-sm mt-6"
              >
                Close list panel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CalendarView;
