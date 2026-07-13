import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, ShieldCheck
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import LiquidEther from '../components/LiquidEther';
import GradientText from '../components/GradientText';

const LandingPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  };



  return (
    <div className="h-screen bg-slate-50 dark:bg-dark-950 text-slate-800 dark:text-dark-100 transition-colors duration-300 relative overflow-hidden flex flex-col justify-between">
      
      {/* Background ambient glows */}
      <div className="absolute top-[-20%] left-[-10%] ambient-glow bg-brand-500/25 dark:bg-brand-500/10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] ambient-glow bg-blue-500/20 dark:bg-blue-500/10"></div>

      {/* LiquidEther Background */}
      <div className="absolute inset-0 w-full h-full z-0 opacity-60 dark:opacity-40">
        <LiquidEther
          colors={[ '#5227FF', '#FF9FFC', '#B497CF' ]}
          mouseForce={20}
          cursorSize={100}
          isViscous
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
      </div>

      {/* Glassmorphic Navbar */}
      <nav className="h-20 glass-nav z-50 px-6 lg:px-12 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-extrabold shadow-lg shadow-brand-500/20">
            P
          </div>
          <GradientText
            colors={["#5227FF", "#FF9FFC", "#B497CF"]}
            animationSpeed={8}
            showBorder={false}
            className="text-xl font-extrabold tracking-tight"
          >
            MyExpManager
          </GradientText>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-xl shadow-brand-500/20 hover:shadow-brand-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            Enter Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero Section Container */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 lg:px-12 max-w-7xl mx-auto relative z-10 w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center max-w-4xl"
        >
          {/* Badge */}
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/40 border border-brand-200/50 dark:border-brand-900/50 text-[10px] font-bold text-brand-600 dark:text-brand-400 mb-6"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Single User Local Finance Hub
          </motion.div>

          {/* Heading */}
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6"
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
            className="text-slate-500 dark:text-dark-400 text-sm sm:text-base max-w-xl leading-relaxed mb-8 font-medium"
          >
            A premium personal dashboard with real-time stats, interactive cash flow charts, budgeting, savings targets, and debt ledgers. Safely stored on localhost.
          </motion.p>

          {/* Enter Button */}
          <motion.div variants={itemVariants} className="mb-12">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-sm shadow-2xl shadow-brand-500/25 hover:shadow-brand-500/35 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Open Your App <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </motion.div>


        </motion.div>
      </section>

      {/* Footer */}
      <footer className="h-14 border-t border-slate-200 dark:border-dark-900 bg-white/20 dark:bg-dark-950/40 relative z-10 px-6 lg:px-12 text-center text-[10px] text-slate-400 dark:text-dark-600 font-bold flex flex-col sm:flex-row justify-between items-center gap-2 shrink-0">
        <span>© {new Date().getFullYear()} MyExpManager. Running on local node server.</span>
        <div className="flex items-center gap-4">
          <span>Private Mode Enabled</span>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
