import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, UserCheck } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function ReassignModal({ isOpen, onClose, onReassign, assignment, chore, currentPerson, people, isProcessing }) {
  const [newPersonId, setNewPersonId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newPersonId) return;

    onReassign(assignment.id, newPersonId);
    setNewPersonId('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="funky-card p-6 md:p-8 w-full max-w-md bg-white relative"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="funky-button w-12 h-12 bg-[#F7A1C4] flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="header-font text-2xl text-[#2B59C3]">Reassign Chore</h2>
                </div>
                <div className="body-font-light text-gray-600 space-y-1">
                  <p><strong>Chore:</strong> {chore?.title}</p>
                  <p><strong>Currently assigned to:</strong> {currentPerson?.name}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="new_person" className="body-font text-base text-[#5E3B85] mb-2 block">
                    Reassign to
                  </Label>
                  <Select value={newPersonId} onValueChange={setNewPersonId} required>
                    <SelectTrigger className="funky-button border-3 border-[#5E3B85] body-font bg-white">
                      <SelectValue placeholder="Select family member..." />
                    </SelectTrigger>
                    <SelectContent>
                      {people
                        .filter(p => p.id !== currentPerson?.id)
                        .map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
                  <p className="body-font-light text-xs text-yellow-800">
                    ⚠️ This will change who is responsible for this chore assignment.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={onClose}
                    disabled={isProcessing}
                    className="funky-button flex-1 bg-gray-200 hover:bg-gray-300 text-[#5E3B85] border-3 border-[#5E3B85] py-3 header-font"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isProcessing || !newPersonId}
                    className="funky-button flex-1 bg-[#F7A1C4] hover:bg-[#f590b8] text-pink-800 py-3 header-font"
                  >
                    {isProcessing ? 'Reassigning...' : 'Reassign'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}