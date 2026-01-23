import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Star } from "lucide-react";
import { toast } from "sonner";

export default function PointsEarnedNotification({ points, reason, isVisible, onClose }) {
  useEffect(() => {
    if (isVisible && points > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, points, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="funky-card bg-gradient-to-br from-yellow-400 to-orange-400 p-6 text-center min-w-[280px]">
            <motion.div
              animate={{
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.1, 1, 1.1, 1]
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-white" />
            </motion.div>
            <h3 className="header-font text-3xl text-white mb-2">+{points} Points!</h3>
            <p className="body-font text-white text-sm">{reason}</p>
            
            {/* Floating stars animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ 
                    y: -100, 
                    opacity: [0, 1, 0],
                    x: Math.random() * 100 - 50
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                  className="absolute"
                  style={{ 
                    left: `${Math.random() * 100}%`,
                    top: '50%'
                  }}
                >
                  <Star className="w-4 h-4 text-yellow-200 fill-yellow-200" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}