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
  "How can I save more money?",
  "Can I buy a ₹2,500 headphone this month?",
  "How much can I spend today?",
  "Summarize this month's finances",
  "Where am I overspending?",
  "Predict my end-of-month balance"
];

// Helper to parse basic markdown to styled React elements
const renderMarkdown = (text) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    let cleanLine = line;
    
    // Check if it's a bullet point
    const isBullet = cleanLine.startsWith('- ') || cleanLine.startsWith('* ');
    if (isBullet) {
      cleanLine = cleanLine.substring(2);
    }
    
    // Check if it's a header
    const isHeader = cleanLine.startsWith('### ') || cleanLine.startsWith('## ') || cleanLine.startsWith('# ');
    let headerLevel = 0;
    if (cleanLine.startsWith('### ')) {
      headerLevel = 3;
      cleanLine = cleanLine.substring(4);
    } else if (cleanLine.startsWith('## ')) {
      headerLevel = 2;
      cleanLine = cleanLine.substring(3);
    } else if (cleanLine.startsWith('# ')) {
      headerLevel = 1;
      cleanLine = cleanLine.substring(2);
    }

    // Process inline bold text (**text**) and code (`text`)
    const parts = [];
    let currentText = cleanLine;
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(currentText)) !== null) {
      const matchIndex = match.index;
      // Add text before match
      if (matchIndex > lastIndex) {
        parts.push(currentText.substring(lastIndex, matchIndex));
      }
      
      const matchedString = match[0];
      if (matchedString.startsWith('**') && matchedString.endsWith('**')) {
        // Bold
        parts.push(
          <strong key={matchIndex} className="font-extrabold text-slate-900 dark:text-white">
            {matchedString.substring(2, matchedString.length - 2)}
          </strong>
        );
      } else if (matchedString.startsWith('`') && matchedString.endsWith('`')) {
        // Inline code
        parts.push(
          <code key={matchIndex} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-dark-900 text-brand-500 font-mono text-[11px] border border-slate-200/50 dark:border-dark-800">
            {matchedString.substring(1, matchedString.length - 1)}
          </code>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < currentText.length) {
      parts.push(currentText.substring(lastIndex));
    }

    // Return element based on markdown type
    if (isHeader) {
      if (headerLevel === 1) return <h1 key={idx} className="text-lg font-black tracking-tight mt-3 mb-2">{parts}</h1>;
      if (headerLevel === 2) return <h2 key={idx} className="text-base font-black tracking-tight mt-3 mb-2">{parts}</h2>;
      return <h3 key={idx} className="text-sm font-bold mt-2.5 mb-1.5">{parts}</h3>;
    }

    if (isBullet) {
      return (
        <li key={idx} className="list-disc ml-5 mt-1 text-slate-650 dark:text-dark-300 font-medium">
          {parts}
        </li>
      );
    }

    return (
      <p key={idx} className="mt-1 leading-relaxed text-slate-650 dark:text-dark-300 font-medium min-h-[16px]">
        {parts}
      </p>
    );
  });
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
  
  const chatEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      // Build conversation history (exclude date/metadata to match API expectations)
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
    <div className="flex flex-col h-[calc(100vh-130px)] lg:h-[calc(100vh-160px)]">
      
      {/* Upper banner */}
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

      {/* Main Chat Area */}
      <div className="flex-1 min-h-0 glass-panel border border-slate-200/50 dark:border-dark-800/40 rounded-3xl p-4 md:p-6 flex flex-col justify-between overflow-hidden shadow-xl">
        
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
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

                  {/* Bubble wrapper */}
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

          {/* Typing Loading Indicator */}
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

          {/* Error Banner */}
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
          
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion prompt list */}
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

        {/* Input Bar */}
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
