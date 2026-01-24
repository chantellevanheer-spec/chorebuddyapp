import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, UserPlus } from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ManualAssignmentModal({ isOpen, onClose, onAssign, chore, people, isProcessing, familyId }) {
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [weekStart, setWeekStart] = useState(format(startOfWeek(new Date()), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 3), 'yyyy-MM-dd'));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPersonId) return;

    onAssign({
      person_id: selectedPersonId,
      chore_id: chore.id,
      week_start: weekStart,
      due_date: dueDate,
      completed: false,
      family_id: familyId
    });

    // Reset form
    setSelectedPersonId('');
    setWeekStart(format(startOfWeek(new Date()), 'yyyy-MM-dd'));
    setDueDate(format(addDays(new Date(), 3), 'yyyy-MM-dd'));
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
                  <div className="funky-button w-12 h-12 bg-[#FF6B35] flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="header-font text-2xl text-[#2B59C3]">Assign Chore</h2>
                </div>
                <p className="body-font-light text-gray-600">
                  Manually assign "{chore?.title}" to a family member
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="person" className="body-font text-base text-[#5E3B85] mb-2 block">
                    Assign to
                  </Label>
                  <Select value={selectedPersonId} onValueChange={setSelectedPersonId} required>
                    <SelectTrigger className="funky-button border-3 border-[#5E3B85] body-font bg-white">
                      <SelectValue placeholder="Select family member..." />
                    </SelectTrigger>
                    <SelectContent>
                      {people.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="week_start" className="body-font text-base text-[#5E3B85] mb-2 block">
                    Week Starting
                  </Label>
                  <Input
                    id="week_start"
                    type="date"
                    value={weekStart}
                    onChange={(e) => setWeekStart(e.target.value)}
                    className="funky-button border-3 border-[#5E3B85] body-font bg-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="due_date" className="body-font text-base text-[#5E3B85] mb-2 block">
                    Due Date
                  </Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="funky-button border-3 border-[#5E3B85] body-font bg-white"
                    required
                  />
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
                    disabled={isProcessing || !selectedPersonId}
                    className="funky-button flex-1 bg-[#FF6B35] hover:bg-[#fa5a1f] text-white py-3 header-font"
                  >
                    {isProcessing ? 'Assigning...' : 'Assign Chore'}
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