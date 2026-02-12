import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, CheckSquare } from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function BulkAssignmentModal({ isOpen, onClose, onBulkAssign, chores, people, isProcessing }) {
  const [selectedChoreIds, setSelectedChoreIds] = useState([]);
  const [selectedPersonIds, setSelectedPersonIds] = useState([]);
  const [weekStart, setWeekStart] = useState(format(startOfWeek(new Date()), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 3), 'yyyy-MM-dd'));

  const handleChoreToggle = (choreId) => {
    setSelectedChoreIds(prev => 
      prev.includes(choreId) 
        ? prev.filter(id => id !== choreId)
        : [...prev, choreId]
    );
  };

  const handlePersonToggle = (personId) => {
    setSelectedPersonIds(prev => 
      prev.includes(personId) 
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedChoreIds.length === 0 || selectedPersonIds.length === 0) return;

    onBulkAssign({
      choreIds: selectedChoreIds,
      personIds: selectedPersonIds,
      week_start: weekStart,
      due_date: dueDate
    });

    // Reset form
    setSelectedChoreIds([]);
    setSelectedPersonIds([]);
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
              className="funky-card p-6 md:p-8 w-full max-w-2xl bg-white relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="funky-button w-12 h-12 bg-[#C3B1E1] flex items-center justify-center">
                    <CheckSquare className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="header-font text-2xl text-[#2B59C3]">Bulk Assignment</h2>
                </div>
                <p className="body-font-light text-gray-600">
                  Assign multiple chores to multiple family members at once
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Select Chores */}
                <div>
                  <Label className="body-font text-lg text-[#5E3B85] mb-3 block">
                    Select Chores ({selectedChoreIds.length} selected)
                  </Label>
                  <div className="funky-card p-4 max-h-48 overflow-y-auto space-y-2 bg-gray-50">
                    {chores.map((chore) => (
                      <div key={chore.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`chore-${chore.id}`}
                          checked={selectedChoreIds.includes(chore.id)}
                          onCheckedChange={() => handleChoreToggle(chore.id)}
                          className="border-2 border-[#5E3B85]"
                        />
                        <Label htmlFor={`chore-${chore.id}`} className="body-font text-sm cursor-pointer flex-1">
                          {chore.title}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Select People */}
                <div>
                  <Label className="body-font text-lg text-[#5E3B85] mb-3 block">
                    Assign To ({selectedPersonIds.length} selected)
                  </Label>
                  <div className="funky-card p-4 max-h-48 overflow-y-auto space-y-2 bg-gray-50">
                    {people.map((person) => (
                      <div key={person.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`person-${person.id}`}
                          checked={selectedPersonIds.includes(person.id)}
                          onCheckedChange={() => handlePersonToggle(person.id)}
                          className="border-2 border-[#5E3B85]"
                        />
                        <Label htmlFor={`person-${person.id}`} className="body-font text-sm cursor-pointer flex-1">
                          {person.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <p className="body-font-light text-sm text-blue-800">
                    💡 <strong>Tip:</strong> This will create {selectedChoreIds.length * selectedPersonIds.length} assignments 
                    (each selected person gets all selected chores).
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
                    disabled={isProcessing || selectedChoreIds.length === 0 || selectedPersonIds.length === 0}
                    className="funky-button flex-1 bg-[#C3B1E1] hover:bg-[#b19dcb] text-white py-3 header-font"
                  >
                    {isProcessing ? 'Assigning...' : `Assign ${selectedChoreIds.length * selectedPersonIds.length} Chores`}
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