import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, UserPlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BulkChoreActions({ 
  selectedChores, 
  onAssign, 
  onDelete, 
  onClearSelection 
}) {
  if (selectedChores.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40"
      >
        <div className="funky-card bg-white p-4 shadow-2xl flex items-center gap-4">
          <div className="body-font text-gray-700">
            {selectedChores.length} selected
          </div>
          
          <div className="h-8 w-px bg-gray-300" />
          
          <Button
            onClick={onAssign}
            className="funky-button bg-[#2B59C3] text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Bulk Assign
          </Button>
          
          <Button
            onClick={onDelete}
            variant="destructive"
            className="funky-button bg-red-500 text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          
          <Button
            onClick={onClearSelection}
            variant="outline"
            className="funky-button"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}