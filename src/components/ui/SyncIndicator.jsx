import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

export default function SyncIndicator({ show = false }) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed bottom-20 right-4 lg:bottom-4 funky-button px-3 py-2 bg-[#C3B1E1] border-[#5E3B85] flex items-center gap-2 z-40"
    >
      <RefreshCw className="w-4 h-4 text-white animate-spin" />
      <span className="body-font text-sm text-white">Syncing...</span>
    </motion.div>
  );
}