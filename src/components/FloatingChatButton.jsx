import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const FloatingChatButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide the button if the user is already on the AI Assistant page
  if (location.pathname === '/ai-assistant') {
    return null;
  }

  return (
    <motion.button
      onClick={() => navigate('/ai-assistant')}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 hover:from-brand-500 hover:to-indigo-400 text-white flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)] border border-brand-400/20 focus:outline-none"
      title="Ask AI Coach"
    >
      <Sparkles className="w-6 h-6 animate-pulse" />
      
      {/* Visual indicator ring */}
      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-dark-950"></span>
    </motion.button>
  );
};

export default FloatingChatButton;
