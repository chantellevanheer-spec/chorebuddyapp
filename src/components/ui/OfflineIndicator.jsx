import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflineIndicator({ isOnline, isSyncing, pendingOperations, onSync }) {
  if (isOnline && !isSyncing && pendingOperations === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 right-4 z-50"
      >
        {!isOnline && (
          <div className="funky-card bg-orange-50 border-orange-200 p-4 flex items-center gap-3">
            <CloudOff className="w-5 h-5 text-orange-600" />
            <div>
              <p className="body-font text-sm text-orange-800">You're offline</p>
              <p className="body-font-light text-xs text-orange-600">
                Changes will sync when back online
              </p>
            </div>
          </div>
        )}

        {isOnline && isSyncing && (
          <div className="funky-card bg-blue-50 border-blue-200 p-4 flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <div>
              <p className="body-font text-sm text-blue-800">Syncing...</p>
              <p className="body-font-light text-xs text-blue-600">
                {pendingOperations} operation{pendingOperations !== 1 ? 's' : ''} pending
              </p>
            </div>
          </div>
        )}

        {isOnline && !isSyncing && pendingOperations > 0 && (
          <div className="funky-card bg-yellow-50 border-yellow-200 p-4 flex items-center gap-3">
            <Cloud className="w-5 h-5 text-yellow-600" />
            <div className="flex-1">
              <p className="body-font text-sm text-yellow-800">
                {pendingOperations} unsaved change{pendingOperations !== 1 ? 's' : ''}
              </p>
            </div>
            <Button
              size="sm"
              onClick={onSync}
              className="funky-button bg-yellow-600 text-white text-xs"
            >
              Sync Now
            </Button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}