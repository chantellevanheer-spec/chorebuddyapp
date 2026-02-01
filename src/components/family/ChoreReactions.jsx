import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const REACTIONS = ['⭐', '🎉', '💪', '🔥', '👏', '❤️'];

export default function ChoreReactions({ completionId, existingReactions = [], onReact }) {
  const [showPicker, setShowPicker] = useState(false);
  const [animatingReaction, setAnimatingReaction] = useState(null);

  const handleReact = (emoji) => {
    setAnimatingReaction(emoji);
    onReact(completionId, emoji);
    setShowPicker(false);
    
    // Clear animation after it completes
    setTimeout(() => setAnimatingReaction(null), 1000);
  };

  const reactionCounts = existingReactions.reduce((acc, r) => {
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="relative">
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(reactionCounts).map(([emoji, count]) => (
          <motion.button
            key={emoji}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="funky-button px-2 py-1 bg-white border-2 border-[#C3B1E1] flex items-center gap-1"
          >
            <span className="text-lg">{emoji}</span>
            <span className="body-font text-xs text-[#5E3B85]">{count}</span>
          </motion.button>
        ))}
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowPicker(!showPicker)}
          className="funky-button w-8 h-8 bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl"
        >
          +
        </motion.button>
      </div>

      {/* Reaction Picker */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-10 left-0 z-10 funky-card bg-white p-2 flex gap-2"
          >
            {REACTIONS.map((emoji) => (
              <motion.button
                key={emoji}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleReact(emoji)}
                className="text-2xl hover:bg-gray-100 w-10 h-10 rounded-lg flex items-center justify-center"
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Animation */}
      <AnimatePresence>
        {animatingReaction && (
          <motion.div
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -50, scale: 1.5 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 text-4xl pointer-events-none"
          >
            {animatingReaction}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}