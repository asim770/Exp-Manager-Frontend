import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Sparkles, AlertCircle, RefreshCw, User, HelpCircle, 
  ArrowLeft, Coins, TrendingUp, ShieldCheck, CheckCircle
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import axios from 'axios';

const SUGGESTED_PROMPTS = [
  "Analyze my expenses",
  "Can I buy a ₹2,500 headphone this month?",
  "How much can I safely spend today?",
  "How do I add a new transaction?",
  "How do Savings Goals work?",
  "How does Borrow & Lend tracking work?",
  "Where can I view monthly reports?",
  "Where am I overspending this month?"
];

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
      parts.push(
        <strong key={match.index} className="font-extrabold text-slate-900 dark:text-white">
          {token.substring(2, token.length - 2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-dark-950 text-brand-500 font-mono text-[11px] border border-slate-200/60 dark:border-dark-800">
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
          <div key={`table-${i}`} className="my-2 overflow-x-auto rounded-xl border border-slate-200/70 dark:border-dark-800">
            <table className="min-w-full divide-y divide-slate-200/60 dark:divide-dark-800 text-left text-[11px]">
              <thead className="bg-slate-50 dark:bg-dark-950/80">
                <tr>
                  {headerRow.map((h, cIdx) => (
                    <th key={cIdx} className="px-3 py-1.5 font-bold text-slate-800 dark:text-dark-100 uppercase tracking-wider">
                      {parseInlineMarkdown(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-850/60 bg-white/50 dark:bg-dark-900/30">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-dark-850/30 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-1.5 text-slate-650 dark:text-dark-300">
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
      elements.push(<hr key={`hr-${i}`} className="my-2.5 border-slate-200/70 dark:border-dark-800/80" />);
      i++;
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h3 key={`h3-${i}`} className="text-sm font-bold mt-2.5 mb-1 text-slate-900 dark:text-white">{parseInlineMarkdown(line.substring(4))}</h3>);
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={`h2-${i}`} className="text-base font-black tracking-tight mt-3 mb-1.5 text-slate-900 dark:text-white">{parseInlineMarkdown(line.substring(3))}</h2>);
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(<h1 key={`h1-${i}`} className="text-lg font-black tracking-tight mt-3 mb-2 text-slate-900 dark:text-white">{parseInlineMarkdown(line.substring(2))}</h1>);
      i++;
      continue;
    }

    // Numbered list: "1. "
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      elements.push(
        <div key={`num-${i}`} className="flex gap-2 ml-1 mt-1 text-slate-650 dark:text-dark-300 font-medium">
          <span className="font-extrabold text-brand-600 dark:text-brand-400 shrink-0">{numberedMatch[1]}.</span>
          <span className="leading-relaxed">{parseInlineMarkdown(numberedMatch[2])}</span>
        </div>
      );
      i++;
      continue;
    }

    // Bullet point: "- " or "* "
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={`bullet-${i}`} className="list-disc ml-5 mt-1 text-slate-650 dark:text-dark-300 font-medium leading-relaxed">
          {parseInlineMarkdown(line.substring(2))}
        </li>
      );
      i++;
      continue;
    }

    // Normal line or empty space
    if (line.length === 0) {
      elements.push(<div key={`sp-${i}`} className="h-1" />);
    } else {
      elements.push(
        <p key={`p-${i}`} className="mt-1 leading-relaxed text-slate-650 dark:text-dark-300 font-medium min-h-[16px]">
          {parseInlineMarkdown(line)}
        </p>
      );
    }
    i++;
  }

  return elements;
};

const AiAssistant = () => {
  const { apiUrl, currencySymbol } = useFinance();
  
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your personal **Antigravity Finance Coach**. I have secure access to your transactions, savings goals, and budgets. Ask me to analyze your cash flows, suggest spending limits, or predict if you'll remain in budget this month!",
      date: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const chatContainerRef = useRef(null);

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

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      sender: 'user',
      text: textToSend,
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
        message: textToSend,
        history: chatHistory
      });

      const aiReply = {
        sender: 'ai',
        text: res.data.response,
        date: new Date()
      };

      setMessages(prev => [...prev, aiReply]);
    } catch (err) {
      console.error('Error posting to AI helper:', err);
      setError(err.response?.data?.message || 'Failed to connect to AI Assistant. Check your backend port and API Key.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200/50 dark:border-dark-800/50 shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-500 animate-pulse" />
            AI Finance Coach
          </h1>
          <p className="text-xs text-slate-400 dark:text-dark-500 font-semibold">Your private financial intelligence advisor.</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500">
          <ShieldCheck className="w-3.5 h-3.5" /> Local Connection Secure
        </div>
      </div>

  
      <div className="flex-1 min-h-0 glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-4 md:p-6 flex flex-col justify-between overflow-hidden shadow-xl">
        
       
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto pr-1 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const isAi = msg.sender === 'ai';
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 max-w-[85%] ${isAi ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-left'}`}
                >
                  {/* Avatar */}
                  <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 shadow-sm border font-extrabold text-xs uppercase ${
                    isAi 
                      ? 'bg-brand-500/10 border-brand-200 dark:border-brand-900 text-brand-600 dark:text-brand-400' 
                      : 'bg-slate-100 border-slate-200 dark:bg-dark-900 dark:border-dark-800 text-slate-600 dark:text-dark-300'
                  }`}>
                    {isAi ? 'AI' : <User className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1">
                    <div className={`px-4.5 py-3 rounded-2xl text-xs border leading-relaxed shadow-sm ${
                      isAi
                        ? 'bg-white dark:bg-dark-900 border-slate-200/60 dark:border-dark-850/80 rounded-tl-sm text-slate-800 dark:text-dark-100'
                        : 'bg-brand-600 border-brand-700 text-white rounded-tr-sm'
                    }`}>
                      {isAi ? (
                        <div className="space-y-1.5">{renderMarkdown(msg.text)}</div>
                      ) : (
                        <p className="font-semibold">{msg.text}</p>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 font-semibold px-2 block">
                      {new Date(msg.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>


          {loading && (
            <div className="flex gap-3 max-w-[80%] mr-auto items-center">
              <div className="w-8.5 h-8.5 rounded-xl bg-brand-500/10 border border-brand-200 dark:border-brand-900 text-brand-600 dark:text-brand-400 flex items-center justify-center font-extrabold text-xs">
                AI
              </div>
              <div className="px-4.5 py-3 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/60 dark:border-dark-850/80 rounded-tl-sm flex gap-1 items-center shadow-sm">
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex gap-2.5 text-rose-500 max-w-md mx-auto items-center">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div className="flex-1 text-left">
                <h4 className="font-bold text-xs">API Connection Failed</h4>
                <p className="text-[10px] font-semibold mt-0.5 leading-relaxed">{error}</p>
              </div>
              <button 
                onClick={() => handleSendMessage(messages[messages.length - 1]?.sender === 'user' ? messages[messages.length - 1].text : "Reconnect")} 
                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-550 border border-rose-500/10 shrink-0"
              >
                <RefreshCw className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
        </div>

        {messages.length === 1 && !loading && (
          <div className="py-3 border-t border-slate-100 dark:border-dark-850/80 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider block mb-2">Suggested prompts:</span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-dark-800 bg-white/40 dark:bg-dark-900/40 text-[10px] font-bold text-slate-655 hover:bg-slate-100/80 dark:hover:bg-dark-950/60 dark:hover:border-dark-700 transition-all text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-slate-150 dark:border-dark-850 shrink-0">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your savings, monthly budget utilization, or borrow collection terms..."
            rows="1"
            className="w-full bg-slate-100/50 dark:bg-dark-950/50 border border-slate-200 dark:border-dark-850 rounded-2xl px-4 py-3 outline-none focus:border-brand-500 text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-dark-500 resize-none max-h-16"
          />
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || loading}
            className="p-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all shrink-0 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

      </div>

    </div>
  );
};

export default AiAssistant;
