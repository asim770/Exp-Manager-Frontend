import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, Download, Calendar as CalendarIcon, FileSpreadsheet, 
  FileText, TrendingUp, TrendingDown, ArrowDownUp, AlertCircle,
  HelpCircle, ChevronDown, CheckCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#06b6d4', '#84cc16', '#64748b'];

const Reports = () => {
  const { currencySymbol, apiUrl, refreshAll } = useFinance();
  
  const [transactions, setTransactions] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [lends, setLends] = useState([]);
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Date filters
  const [timePeriod, setTimePeriod] = useState('6months'); // 1month, 3months, 6months, 1year, all

  const fetchData = async () => {
    setLoading(true);
    try {
      // Query everything so we can build holistic reports
      const [txRes, borrowRes, lendRes, savingsRes] = await Promise.all([
        axios.get(`${apiUrl}/transactions?sortBy=date_desc`),
        axios.get(`${apiUrl}/borrow`),
        axios.get(`${apiUrl}/lend`),
        axios.get(`${apiUrl}/savings`)
      ]);

      // Filter transactions according to timePeriod
      const now = new Date();
      let limitDate = new Date();
      
      if (timePeriod === '1month') limitDate.setMonth(now.getMonth() - 1);
      else if (timePeriod === '3months') limitDate.setMonth(now.getMonth() - 3);
      else if (timePeriod === '6months') limitDate.setMonth(now.getMonth() - 6);
      else if (timePeriod === '1year') limitDate.setFullYear(now.getFullYear() - 1);
      else limitDate = new Date(0); // All time

      const filteredTx = txRes.data.filter(t => new Date(t.date) >= limitDate);

      setTransactions(filteredTx);
      setBorrows(borrowRes.data);
      setLends(lendRes.data);
      setSavings(savingsRes.data);
    } catch (err) {
      console.error('Error fetching reporting datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timePeriod]);

  // Aggregate Category Expense Data
  const getCategoryData = () => {
    const categories = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });

    return Object.keys(categories)
      .map(cat => ({
        name: cat,
        value: categories[cat]
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Aggregate Monthly Income vs Expense Data
  const getMonthlyBarData = () => {
    const monthlyStats = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyStats[key]) {
        monthlyStats[key] = { name: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`, income: 0, expense: 0 };
      }

      if (t.type === 'income') {
        monthlyStats[key].income += t.amount;
      } else {
        monthlyStats[key].expense += t.amount;
      }
    });

    // Sort keys and return
    return Object.keys(monthlyStats)
      .sort()
      .map(key => monthlyStats[key]);
  };

  // Export CSV Helper
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Type,Category,Amount,Notes,Recurring\n";

    transactions.forEach(t => {
      const date = new Date(t.date).toLocaleDateString().replace(/,/g, '');
      const notes = (t.notes || '').replace(/,/g, ';').replace(/\n/g, ' ');
      csvContent += `${date},${t.type},${t.category},${t.amount},${notes},${t.isRecurring ? 'yes' : 'no'}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_report_${timePeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF Helper (using jsPDF & jspdf-autotable)
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header banner
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(139, 92, 246); // Brand Color
    doc.text("MyExpManager", 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Personal Ledger Statements & Transaction Audit", 14, 27);
    doc.text(`Time Period: ${timePeriod.toUpperCase()} | Generated: ${new Date().toLocaleDateString()}`, 14, 33);
    
    // Line separator
    doc.setDrawColor(220);
    doc.line(14, 38, 196, 38);

    // Summary calculations
    const inc = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const exp = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Income: ${currencySymbol}${inc.toFixed(2)}`, 14, 45);
    doc.text(`Total Expenses: ${currencySymbol}${exp.toFixed(2)}`, 74, 45);
    doc.text(`Net Balance: ${currencySymbol}${(inc - exp).toFixed(2)}`, 134, 45);
    
    // Tables
    doc.autoTable({
      startY: 52,
      head: [['Date', 'Type', 'Category', 'Amount', 'Notes', 'Recurring']],
      body: transactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.type.toUpperCase(),
        t.category,
        `${currencySymbol}${t.amount.toFixed(2)}`,
        t.notes || '',
        t.isRecurring ? 'YES' : 'NO'
      ]),
      headStyles: { fillColor: [124, 58, 237] }, // Purple matching brand
      alternateRowStyles: { fillColor: [248, 250, 252] },
      theme: 'striped',
    });

    // Save PDF
    doc.save(`financial_ledger_${timePeriod}.pdf`);
  };

  const categoryData = getCategoryData();
  const barChartData = getMonthlyBarData();

  // Aggregate totals
  const totalInc = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExp = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Reports & Analytics</h1>
          <p className="text-xs text-slate-400 dark:text-dark-500 font-semibold">Deep analytics covering your cash flow distributions.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Time range dropdown */}
          <select 
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="px-4.5 py-3 rounded-xl border border-slate-250 dark:border-dark-800 bg-white/40 dark:bg-dark-900/40 text-xs font-bold outline-none cursor-pointer"
          >
            <option value="1month">Past 30 Days</option>
            <option value="3months">Past 3 Months</option>
            <option value="6months">Past 6 Months</option>
            <option value="1year">Past 1 Year</option>
            <option value="all">All-Time Statement</option>
          </select>
          
          <button 
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-slate-200 dark:border-dark-800 bg-white/40 dark:bg-dark-900/40 text-xs font-bold hover:bg-slate-100"
            title="Download CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> <span className="hidden md:inline">CSV</span>
          </button>
          
          <button 
            onClick={handleExportPDF}
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-850 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-bold shadow-sm"
            title="Download PDF statement"
          >
            <Download className="w-4 h-4" /> <span className="hidden md:inline">Export PDF</span>
          </button>
        </div>
      </div>

      {/* Basic summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Period Income</span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-white">
              {currencySymbol}{totalInc.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Period Expenses</span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-white">
              {currencySymbol}{totalExp.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
            <ArrowDownUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Period Balance</span>
            <span className={`text-xl font-extrabold ${totalInc - totalExp >= 0 ? 'text-emerald-500' : 'text-rose-550'}`}>
              {totalInc - totalExp >= 0 ? '+' : ''}{currencySymbol}{(totalInc - totalExp).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

      </div>

      {/* Visual Analytics Charts */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-3">
          <div className="spinner"></div>
          <p className="text-xs text-slate-400 font-semibold">Compiling financial metrics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Monthly Comparison Bar Chart */}
          <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-6">
            <h3 className="font-extrabold text-base mb-1">Monthly Flow Statement</h3>
            <p className="text-[10px] text-slate-400 dark:text-dark-500 font-semibold mb-6">Income and Expense comparison over time</p>
            
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(15, 23, 42, 0.95)', 
                      border: '1px solid rgba(255, 255, 255, 0.1)', 
                      borderRadius: '16px',
                      color: '#fff',
                      fontSize: '11px'
                    }} 
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Category Breakdown Pie Chart */}
          <div className="glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-base mb-1">Expense Allocation</h3>
              <p className="text-[10px] text-slate-400 dark:text-dark-500 font-semibold mb-6">Percentage allocation by category</p>
              
              {categoryData.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-slate-400 font-semibold text-xs">
                  No expense records logged in this period.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  
                  <div className="h-48 sm:h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => `${currencySymbol}${value.toFixed(2)}`}
                          contentStyle={{ 
                            background: 'rgba(15, 23, 42, 0.95)', 
                            border: 'none', 
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '10px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend list */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {categoryData.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                          <span className="font-bold text-slate-650 dark:text-dark-300">{item.name}</span>
                        </div>
                        <span className="font-extrabold text-slate-450 dark:text-dark-400">
                          {((item.value / totalExp) * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>

                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default Reports;
