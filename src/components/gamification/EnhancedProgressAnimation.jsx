import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, Zap, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function EnhancedProgressAnimation({ 
  isVisible, 
  onComplete, 
  points, 
  animationType = 'default', // 'default', 'streak', 'levelup', 'bonus'
  message 
}) {
  useEffect(() => {
    if (isVisible) {
      if (animationType === 'streak') {
        fireStreakConfetti();
      } else if (animationType === 'levelup') {
        fireLevelUpConfetti();
      } else if (animationType === 'bonus') {
        fireBonusConfetti();
      } else {
        fireDefaultConfetti();
      }

      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, animationType, onComplete]);

  const fireDefaultConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF6B35', '#C3B1E1', '#F7A1C4', '#FFD700']
    });
  };

  const fireStreakConfetti = () => {
    const duration = 2000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#FF6B35', '#FFA500', '#FF4500']
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#FF6B35', '#FFA500', '#FF4500']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const fireLevelUpConfetti = () => {
    const scalar = 3;
    const shapes = ['star'];
    
    confetti({
      particleCount: 150,
      spread: 120,
      origin: { y: 0.5 },
      scalar: scalar,
      shapes: shapes,
      colors: ['#FFD700', '#FFA500', '#FF6B35']
    });
  };

  const fireBonusConfetti = () => {
    confetti({
      particleCount: 50,
      angle: 90,
      spread: 360,
      origin: { y: 0.6 },
      colors: ['#C3B1E1', '#F7A1C4', '#FFD700'],
      gravity: 1.5,
      ticks: 200
    });
  };

  const getIcon = () => {
    switch (animationType) {
      case 'streak':
        return Zap;
      case 'levelup':
        return Trophy;
      case 'bonus':
        return Star;
      default:
        return Sparkles;
    }
  };

  const getColor = () => {
    switch (animationType) {
      case 'streak':
        return 'from-orange-400 to-red-500';
      case 'levelup':
        return 'from-yellow-300 to-amber-500';
      case 'bonus':
        return 'from-purple-400 to-pink-500';
      default:
        return 'from-blue-400 to-indigo-500';
    }
  };

  const Icon = getIcon();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -100 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <div className="funky-card p-8 bg-white shadow-2xl pointer-events-auto">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 1.5,
                ease: "easeInOut"
              }}
              className={`w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br ${getColor()} flex items-center justify-center`}
            >
              <Icon className="w-12 h-12 text-white" />
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              {points !== undefined && (
                <p className="header-font text-6xl text-[#FF6B35] mb-2">
                  +{points}
                </p>
              )}
              {message && (
                <p className="body-font text-xl text-gray-700">
                  {message}
                </p>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}