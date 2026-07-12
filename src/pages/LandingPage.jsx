import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, ShieldCheck, Zap, TrendingUp, HandCoins, 
  PiggyBank, ArrowDownUp, LineChart, Globe, HelpCircle 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Particles from '../components/Particles';

const LandingPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  };

  const stats = [
    { label: 'Current Net Worth', value: '$84,250.00', change: '+12.4% MoM', icon: TrendingUp },
    { label: 'Active Savings Goals', value: '$12,500.00', change: '82% Completed', icon: PiggyBank },
    { label: 'Pending Receivables', value: '$3,400.00', change: '4 borrowers', icon: HandCoins },
  ];

  const features = [
    {
      title: 'Unified Ledger',
      description: 'Record incomes, expenses, debts, and credits in a single, unified database table with powerful search.',
      icon: ArrowDownUp,
      color: 'from-purple-500 to-indigo-500',
    },
    {
      title: 'Smart Lending & Borrowing',
      description: 'Keep track of money lent or borrowed, register partial payments, and view automated reminders before due dates.',
      icon: HandCoins,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'Visual Budgets & Savings',
      description: 'Configure category limits and tracking goals. Automatic visual warnings flash when approaching budget ceilings.',
      icon: PiggyBank,
      color: 'from-pink-500 to-rose-500',
    },
    {
      title: 'Desktop-Quality Reports',
      description: 'Beautiful area, bar, and pie charts analyze cash flow, monthly categories, and savings growth.',
      icon: LineChart,
      color: 'from-blue-500 to-cyan-500',
    },
  ];

  const faqs = [
    {
      q: "Is my financial data shared with anyone?",
      a: "No. This application runs entirely on localhost and connects to your local MongoDB server. No analytical or financial data is transmitted to external cloud servers."
    },
    {
      q: "Can I manage multiple currencies?",
      a: "Yes. You can customize the primary currency symbol ($, €, ₹, £, etc.) directly in your profile settings. All dashboard cards and listings automatically inherit it."
    },
    {
      q: "How do partial repayments work in the Borrow/Lend modules?",
      a: "You can click on any active borrow or lend record to submit a payment. The system decrements the remaining amount, keeps a historical ledger of payments, and flips the status to Paid when it reaches zero."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 text-slate-800 dark:text-dark-100 transition-colors duration-300 relative overflow-hidden">
      
      {/* Background ambient glows */}
      <div className="absolute top-[-20%] left-[-10%] ambient-glow bg-brand-500/25 dark:bg-brand-500/10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] ambient-glow bg-blue-500/20 dark:bg-blue-500/10"></div>

      {/* Particles Background */}
      <div className="absolute inset-0 w-full h-full z-0 opacity-60 dark:opacity-40 pointer-events-none">
        <Particles
          particleColors={theme === 'dark' ? ["#ffffff"] : ["#8b5cf6"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover
          alphaParticles={false}
          disableRotation={false}
          pixelRatio={1}
        />
      </div>

      {/* Glassmorphic Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-20 glass-nav z-50 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-extrabold shadow-lg shadow-brand-500/20">
            P
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-600 to-indigo-500 dark:from-brand-400 dark:to-indigo-300 bg-clip-text text-transparent">
            Antigravity Pay
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-dark-300 hover:text-slate-900 dark:hover:text-white px-4 py-2"
          >
            Dashboard
          </button>
          
          <button 
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-5.5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-xl shadow-brand-500/20 hover:shadow-brand-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            Enter Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-36 pb-20 px-6 lg:px-12 max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          {/* Badge */}
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/40 border border-brand-200/50 dark:border-brand-900/50 text-xs font-semibold text-brand-600 dark:text-brand-400 mb-6"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Single User Local Finance Hub
          </motion.div>

          {/* Heading */}
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-6"
          >
            Take Control of Your{" "}
            <span className="bg-gradient-to-r from-brand-600 to-indigo-500 dark:from-brand-400 dark:to-indigo-300 bg-clip-text text-transparent">
              Wealth
            </span>
            , Offline.
          </motion.h1>

          {/* Subheading */}
          <motion.p 
            variants={itemVariants}
            className="text-slate-500 dark:text-dark-400 text-lg sm:text-xl max-w-2xl leading-relaxed mb-10 font-medium"
          >
            A premium personal dashboard with real-time stats, interactive cash flow charts, budgeting, savings targets, and debt ledgers. Safely stored on localhost.
          </motion.p>

          {/* Buttons */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 mb-16"
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-2xl shadow-brand-500/25 hover:shadow-brand-500/35 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Open Your App <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-slate-200 dark:border-dark-850 bg-white/40 dark:bg-dark-900/40 backdrop-blur hover:bg-slate-100 dark:hover:bg-dark-900 text-slate-600 dark:text-dark-350 font-bold transition-all"
            >
              Learn More
            </a>
          </motion.div>

          {/* Premium Widgets Showcase */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-4"
          >
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={idx} 
                  className="glass-panel border border-slate-200/60 dark:border-dark-800/40 rounded-3xl p-6 flex flex-col text-left shadow-lg transition-transform duration-300 hover:scale-[1.02]"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-slate-400 dark:text-dark-500 uppercase tracking-wider">{stat.label}</span>
                    <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">{stat.value}</span>
                  <span className="text-xs font-semibold text-emerald-500">{stat.change}</span>
                </div>
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Everything You Need, In One Place.
          </h2>
          <p className="text-slate-500 dark:text-dark-400 max-w-xl mx-auto font-medium">
            Designed exclusively for daily individual financial tracking. Simple, intuitive, and clean.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div 
                key={idx} 
                className="glass-panel border border-slate-200/60 dark:border-dark-800/40 rounded-3xl p-8 text-left flex gap-6 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${feat.color} text-white flex items-center justify-center shrink-0 shadow-md`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">{feat.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-dark-400 leading-relaxed font-medium">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ section */}
      <section className="py-24 px-6 lg:px-12 max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 mb-4">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, idx) => (
            <div key={idx} className="glass-panel border border-slate-200/65 dark:border-dark-850 rounded-3xl p-6 md:p-8 text-left">
              <h4 className="text-base font-bold mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                {faq.q}
              </h4>
              <p className="text-sm text-slate-500 dark:text-dark-400 leading-relaxed font-medium pl-6">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6 lg:px-12 text-center max-w-5xl mx-auto relative z-10 mb-16">
        <div className="glass-panel rounded-[2rem] p-10 md:p-16 border border-slate-200 dark:border-dark-800 relative overflow-hidden bg-gradient-to-tr from-brand-600/5 to-indigo-500/5">
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-6">Start Managing Smarter Today</h2>
          <p className="text-slate-500 dark:text-dark-400 text-base sm:text-lg max-w-xl mx-auto mb-8 font-medium">
            Deploy in minutes on your computer, seed your profile, and immediately visualize your net worth and cash flows.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-850 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold shadow-2xl transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            Launch Finance Manager <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-dark-900 bg-white/20 dark:bg-dark-950/40 relative z-10 px-6 text-center text-xs text-slate-400 dark:text-dark-600 font-semibold flex flex-col sm:flex-row justify-between items-center gap-4 max-w-7xl mx-auto">
        <span>© {new Date().getFullYear()} Antigravity Pay. Running on local node server.</span>
        <div className="flex items-center gap-6">
          <span>Private Mode Enabled</span>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
