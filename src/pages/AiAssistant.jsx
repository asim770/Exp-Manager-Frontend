import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Sparkles, AlertCircle, RefreshCw, User, HelpCircle, 
  Wallet, ShieldCheck, Check, Copy, Trash2, Calendar, 
  Compass, ArrowRight, Zap, TrendingUp, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';

const PROMPT_CATEGORIES = [
  {
    title: "Expense Audits",
    icon: TrendingUp,
    prompts: [
      "Analyze my expenses",
      "Where am I overspending this month?",
      "Summarize this month's cash flow"
    ]
  },
  {
    title: "Purchase Checks",
    icon: Zap,
    prompts: [
      "Can I buy a ₹1,500 gadget this month?",
      "How much can I safely spend today?",
      "Predict my end-of-month balance"
    ]
  },
  {
    title: "App Guidance",
    icon: Compass,
    prompts: [
      "How do I add a new transaction?",
      "How do Savings Goals work?",
      "How does Borrow & Lend tracking work?"
    ]
  }
];

const COMPACT_PROMPTS = [
  "Analyze my expenses",
  "How much can I safely spend today?",
  "Can I buy a ₹1,500 gadget?",
  "How do Savings Goals work?",
  "Where am I overspending?"
];

// Helper to parse inline markdown tags (**bold**, `code`, *italic*)
const parseInlineMarkdown = (text) => {
  if (!text) return text;
  const parts = [];
  const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
  let match;
  let lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      const content = token.substring(2, token.length - 2);
      
      // Special badge styling for verdicts
      if (content.includes('[SAFE]') || content.includes('SAFE')) {
        parts.push(
          <span key={match.index} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black text-[11px] shadow-sm">
            <CheckCircle2 className="w-3 h-3" /> {content.replace(/[[\]]/g, '')}
          </span>
        );
      } else if (content.includes('[CAUTION]') || content.includes('CAUTION') || content.includes('Caution')) {
        parts.push(
          <span key={match.index} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-black text-[11px] shadow-sm">
            <AlertTriangle className="w-3 h-3" /> {content.replace(/[[\]]/g, '')}
          </span>
        );
      } else if (content.includes('[NOT RECOMMENDED]') || content.includes('NOT RECOMMENDED')) {
        parts.push(
          <span key={match.index} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-black text-[11px] shadow-sm">
            <AlertCircle className="w-3 h-3" /> {content.replace(/[[\]]/g, '')}
          </span>
        );
      } else {
        parts.push(
          <strong key={match.index} className="font-extrabold text-slate-900 dark:text-white">
            {content}
          </strong>
        );
      }
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-dark-950 text-brand-600 dark:text-brand-400 font-mono text-[11px] border border-slate-200/70 dark:border-dark-800 shadow-2xs">
          {token.substring(1, token.length - 1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-slate-700 dark:text-dark-200">
          {token.substring(1, token.length - 1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts.length > 0 ? parts : text;
};

// Rich Markdown renderer supporting tables, headers, lists, and dividers
const renderMarkdown = (text) => {
  if (!text) return null;

  const rawLines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i].trim();

    // Check if line is a table row (starts with |)
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableRows = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
        const rawRow = rawLines[i].trim();
        // Skip separator row |:---|:---|
        if (!rawRow.replace(/[|:\-\s]/g, '').length) {
          i++;
          continue;
        }
        const cells = rawRow.slice(1, -1).split('|').map(c => c.trim());
        tableRows.push(cells);
        i++;
      }

      if (tableRows.length > 0) {
        const headerRow = tableRows[0];
        const bodyRows = tableRows.slice(1);
        elements.push(
          <div key={`table-${i}`} className="my-3 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-dark-800/80 shadow-sm bg-white/40 dark:bg-dark-950/40 backdrop-blur-md">
            <table className="min-w-full divide-y divide-slate-200/70 dark:divide-dark-800/70 text-left text-[11px]">
              <thead className="bg-slate-100/70 dark:bg-dark-900/80">
                <tr>
                  {headerRow.map((h, cIdx) => (
                    <th key={cIdx} className="px-3.5 py-2.5 font-bold text-slate-800 dark:text-dark-100 uppercase tracking-wider">
                      {parseInlineMarkdown(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 dark:divide-dark-850/60">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-brand-500/5 dark:hover:bg-brand-500/5 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2.5 text-slate-650 dark:text-dark-300 font-medium">
                        {parseInlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Horizontal Rule
    if (line === '---' || line === '***' || line === '___') {
      elements.push(<hr key={`hr-${i}`} className="my-3 border-slate-200/70 dark:border-dark-800/80" />);
      i++;
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-sm font-black tracking-tight mt-3 mb-1.5 text-slate-900 dark:text-white flex items-center gap-1.5">
          {parseInlineMarkdown(line.substring(4))}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-base font-black tracking-tight mt-3.5 mb-2 text-slate-900 dark:text-white">
          {parseInlineMarkdown(line.substring(3))}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-lg font-black tracking-tight mt-4 mb-2.5 text-slate-900 dark:text-white">
          {parseInlineMarkdown(line.substring(2))}
        </h1>
      );
      i++;
      continue;
    }

    // Numbered list: "1. "
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      elements.push(
        <div key={`num-${i}`} className="flex gap-2.5 ml-1 mt-1.5 text-slate-700 dark:text-dark-300 font-medium">
          <span className="w-4.5 h-4.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
            {numberedMatch[1]}
          </span>
          <span className="leading-relaxed flex-1">{parseInlineMarkdown(numberedMatch[2])}</span>
        </div>
      );
      i++;
      continue;
    }

    // Bullet point: "- " or "* "
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={`bullet-${i}`} className="list-disc ml-5 mt-1 text-slate-700 dark:text-dark-300 font-medium leading-relaxed marker:text-brand-500">
          {parseInlineMarkdown(line.substring(2))}
        </li>
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <div key={`quote-${i}`} className="my-2 pl-3 py-1 border-l-2 border-brand-500 bg-brand-500/5 dark:bg-brand-500/10 rounded-r-xl text-[11px] text-slate-600 dark:text-dark-300 italic">
          {parseInlineMarkdown(line.substring(2))}
        </div>
      );
      i++;
      continue;
    }

    // Normal line or empty space
    if (line.length === 0) {
      elements.push(<div key={`sp-${i}`} className="h-1.5" />);
    } else {
      elements.push(
        <p key={`p-${i}`} className="mt-1 leading-relaxed text-slate-700 dark:text-dark-300 font-medium min-h-[16px]">
          {parseInlineMarkdown(line)}
        </p>
      );
    }
    i++;
  }

  return elements;
};

const AiAssistant = () => {
  const { apiUrl, currencySymbol, dashboardData, profile } = useFinance();
  
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I am your personal **Antigravity Finance Coach** powered by Gemini. I have secure, real-time access to your transactions, savings targets, and budget limits.\n\nAsk me to **audit your spending**, check if a **purchase is affordable**, calculate your **safe daily allowance**, or **guide you through any app feature**!",
      date: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  
  const chatContainerRef = useRef(null);

  // Smooth container-only scrolling to bottom
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Copy AI response to clipboard
  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Reset conversation to fresh state
  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: "New session started! How can I help you with your expenses or financial goals today?",
        date: new Date()
      }
    ]);
    setError(null);
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend?.trim() || inputValue.trim();
    if (!text || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      date: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);
    setError(null);

    try {
      const chatHistory = messages.map(msg => ({
        sender: msg.sender,
        text: msg.text
      }));

      const res = await axios.post(`${apiUrl}/ai/chat`, {
        message: text,
        history: chatHistory
      });

      const aiReply = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.data.response,
        date: new Date()
      };

      setMessages(prev => [...prev, aiReply]);
    } catch (err) {
      console.error('Error posting to AI helper:', err);
      setError(err.response?.data?.message || 'Failed to connect to AI Assistant. Check your backend server and Gemini API Key.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Financial quick metrics for top strip
  const monthlyBudget = profile?.monthlyBudget || 4000;
  const currentExpense = dashboardData?.monthlyExpense || 0;
  const remainingBudget = Math.max(0, monthlyBudget - currentExpense);
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, lastDay - now.getDate() + 1);
  const dailyLimit = (remainingBudget / daysLeft).toFixed(0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3.5 border-b border-slate-200/60 dark:border-dark-800/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                AI Finance Coach
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-[10px] font-bold text-brand-600 dark:text-brand-400">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-dark-400 font-medium">
              Private financial intelligence & live database advisor.
            </p>
          </div>
        </div>

        {/* Live Metrics & Actions */}
        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
          {/* Remaining Budget Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/70 dark:bg-dark-900/60 border border-slate-200/60 dark:border-dark-800 text-[11px] font-bold text-slate-700 dark:text-dark-200">
            <Wallet className="w-3.5 h-3.5 text-brand-500" />
            <span>Budget: {currencySymbol}{remainingBudget} left</span>
          </div>

          {/* Daily Limit Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/70 dark:bg-dark-900/60 border border-slate-200/60 dark:border-dark-800 text-[11px] font-bold text-slate-700 dark:text-dark-200">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>Pace: {currencySymbol}{dailyLimit}/day</span>
          </div>

          {/* Connection Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live</span>
          </div>

          {/* Clear Session Button */}
          {messages.length > 1 && (
            <button
              onClick={handleClearChat}
              title="Reset conversation"
              className="p-1.5 rounded-xl bg-slate-100/70 dark:bg-dark-900/60 border border-slate-200/60 dark:border-dark-800 text-slate-500 hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all text-xs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Glassmorphic Chat Panel */}
      <div className="flex-1 min-h-0 glass-panel border border-slate-200/70 dark:border-dark-800/60 rounded-3xl p-4 md:p-5 flex flex-col justify-between overflow-hidden shadow-2xl backdrop-blur-xl relative">
        
        {/* Messages Stream */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto pr-1.5 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={`flex gap-3 max-w-[90%] md:max-w-[82%] ${isAi ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-left'}`}
                >
                  {/* Avatar */}
                  <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 shadow-sm border font-extrabold text-xs uppercase ${
                    isAi 
                      ? 'bg-gradient-to-tr from-brand-600 to-indigo-600 border-brand-400/20 text-white shadow-brand-500/20' 
                      : 'bg-slate-200 dark:bg-dark-800 border-slate-300 dark:border-dark-700 text-slate-700 dark:text-dark-200'
                  }`}>
                    {isAi ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble Container */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className={`relative group px-5 py-3.5 rounded-2xl text-xs leading-relaxed shadow-sm transition-all ${
                      isAi
                        ? 'bg-white/90 dark:bg-dark-900/90 backdrop-blur-md border border-slate-200/80 dark:border-dark-800/80 rounded-tl-sm text-slate-800 dark:text-dark-100'
                        : 'bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 border border-brand-500/30 text-white rounded-tr-sm shadow-md shadow-brand-500/20 font-medium'
                    }`}>
                      
                      {/* AI Bubble Header & Copy Button */}
                      {isAi && (
                        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 dark:border-dark-850/60 text-[10px] text-slate-400 dark:text-dark-400 font-semibold">
                          <span className="flex items-center gap-1 text-brand-600 dark:text-brand-400 font-bold">
                            <Sparkles className="w-3 h-3" /> Finance Coach
                          </span>
                          <button
                            onClick={() => handleCopy(msg.id, msg.text)}
                            className="opacity-60 group-hover:opacity-100 hover:opacity-100 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-400 hover:text-slate-700 dark:hover:text-dark-200 transition-all flex items-center gap-1 text-[10px]"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-500 font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Content */}
                      {isAi ? (
                        <div className="space-y-1.5 leading-relaxed">
                          {renderMarkdown(msg.text)}
                        </div>
                      ) : (
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className={`flex items-center gap-1 text-[9px] text-slate-400 dark:text-dark-500 px-2 font-medium ${isAi ? 'justify-start' : 'justify-end'}`}>
                      <span>{new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Thinking / Loading Shimmer Animation */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 max-w-[80%] mr-auto items-center"
            >
              <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xs shadow-md shadow-brand-500/20 shrink-0">
                <Sparkles className="w-4 h-4 animate-spin text-white" style={{ animationDuration: '3s' }} />
              </div>
              <div className="px-5 py-3.5 rounded-2xl bg-white/90 dark:bg-dark-900/90 border border-slate-200/80 dark:border-dark-800/80 rounded-tl-sm flex items-center gap-2.5 shadow-sm">
                <span className="w-2 h-2 bg-brand-500 rounded-full animate-ping"></span>
                <span className="text-xs font-semibold text-slate-600 dark:text-dark-300">
                  Analyzing financial records with Gemini...
                </span>
              </div>
            </motion.div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex gap-3 text-rose-600 dark:text-rose-400 max-w-lg mx-auto items-center shadow-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div className="flex-1 text-left">
                <h4 className="font-bold text-xs">Communication Notice</h4>
                <p className="text-[11px] font-medium mt-0.5 leading-relaxed">{error}</p>
              </div>
              <button 
                onClick={() => handleSendMessage(messages[messages.length - 1]?.sender === 'user' ? messages[messages.length - 1].text : "Analyze my budget")} 
                className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0 transition-all"
                title="Retry"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Welcome Screen Categorized Prompts (Visible when chat is starting) */}
          {messages.length === 1 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-6 pt-4 border-t border-slate-100 dark:border-dark-850/70"
            >
              <div className="flex items-center gap-2 mb-3.5">
                <Compass className="w-4 h-4 text-brand-500" />
                <span className="text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">
                  Suggested Action Prompts:
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PROMPT_CATEGORIES.map((cat, idx) => {
                  const Icon = cat.icon;
                  return (
                    <div 
                      key={idx} 
                      className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-dark-800/70 bg-white/50 dark:bg-dark-900/40 backdrop-blur-md space-y-2 hover:border-brand-500/40 transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white pb-1.5 border-b border-slate-100 dark:border-dark-850">
                        <Icon className="w-3.5 h-3.5 text-brand-500" />
                        <span>{cat.title}</span>
                      </div>
                      <div className="space-y-1.5">
                        {cat.prompts.map((p, pIdx) => (
                          <button
                            key={pIdx}
                            onClick={() => handleSendMessage(p)}
                            className="w-full text-left p-2 rounded-xl border border-slate-200/50 dark:border-dark-800/50 bg-white/70 dark:bg-dark-950/50 hover:bg-brand-500/10 hover:border-brand-500/30 text-[11px] font-medium text-slate-700 dark:text-dark-200 transition-all flex items-center justify-between group"
                          >
                            <span className="line-clamp-1">{p}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Compact Quick Chips (Visible during active conversation) */}
        {messages.length > 1 && !loading && (
          <div className="py-2.5 border-t border-slate-100 dark:border-dark-850/80 shrink-0 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
            <span className="text-[10px] font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-brand-500" /> Quick:
            </span>
            {COMPACT_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 rounded-lg border border-slate-200/70 dark:border-dark-800 bg-white/50 dark:bg-dark-900/50 hover:bg-brand-500/10 hover:border-brand-500/30 text-[10px] font-semibold text-slate-650 dark:text-dark-300 hover:text-brand-600 dark:hover:text-brand-400 transition-all shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Modern Ergonomic Input Capsule */}
        <div className="pt-3 border-t border-slate-150 dark:border-dark-850 shrink-0">
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/80 dark:bg-dark-950/70 border border-slate-200/80 dark:border-dark-800 shadow-lg focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:border-brand-500 transition-all backdrop-blur-xl">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your expenses, purchase affordability, daily budget, or app features..."
              rows="1"
              className="flex-1 bg-transparent border-0 outline-none px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-dark-500 resize-none max-h-20 leading-relaxed"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || loading}
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-md shadow-brand-500/25 transition-all shrink-0 disabled:opacity-40 disabled:pointer-events-none"
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
          <div className="flex items-center justify-between px-2 pt-1.5 text-[9px] text-slate-400 dark:text-dark-500 font-medium">
            <span>Press <kbd className="px-1 py-0.2 rounded bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-800 font-sans">Enter ↵</kbd> to send • <kbd className="px-1 py-0.2 rounded bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-800 font-sans">Shift+Enter</kbd> for new line</span>
            <span>Personal Data Stays On Localhost</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AiAssistant;
