import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RealTimeBadge() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBadge(true);
      setTimeout(() => setShowBadge(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBadge(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showBadge && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-4 right-4 z-50 funky-button px-4 py-2 flex items-center gap-2 ${
            isOnline ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="body-font text-sm text-green-700">Real-time sync active</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-600" />
              <span className="body-font text-sm text-red-700">Offline - updates paused</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}