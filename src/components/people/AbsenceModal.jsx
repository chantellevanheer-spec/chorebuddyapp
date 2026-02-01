import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function AbsenceModal({ isOpen, onClose, onSubmit, person }) {
  const [formData, setFormData] = useState({
    reason: 'vacation',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    redistribute_chores: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="funky-card max-w-md w-full p-6 bg-white"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="header-font text-2xl text-[#2B59C3]">Mark Absence</h2>
            <p className="body-font text-sm text-gray-600">{person?.name}</p>
          </div>
          <button onClick={onClose} className="funky-button w-10 h-10 bg-gray-200 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="body-font text-sm text-gray-700 mb-2 block">Reason</label>
            <Select value={formData.reason} onValueChange={(value) => setFormData({...formData, reason: value})}>
              <SelectTrigger className="funky-button">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sick">🤒 Sick</SelectItem>
                <SelectItem value="vacation">🏖️ Vacation</SelectItem>
                <SelectItem value="school_trip">🚌 School Trip</SelectItem>
                <SelectItem value="visiting_family">👨‍👩‍👧 Visiting Family</SelectItem>
                <SelectItem value="other">📝 Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="body-font text-sm text-gray-700 mb-2 block">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                className="funky-button w-full border-3 border-[#5E3B85] px-3 py-2 body-font"
                required
              />
            </div>
            <div>
              <label className="body-font text-sm text-gray-700 mb-2 block">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                min={formData.start_date}
                className="funky-button w-full border-3 border-[#5E3B85] px-3 py-2 body-font"
                required
              />
            </div>
          </div>

          <div>
            <label className="body-font text-sm text-gray-700 mb-2 block">Notes</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Any additional details..."
              rows={3}
            />
          </div>

          <div className="funky-card p-4 bg-blue-50 border-2 border-blue-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.redistribute_chores}
                onChange={(e) => setFormData({...formData, redistribute_chores: e.target.checked})}
                className="mt-1"
              />
              <div>
                <p className="body-font text-sm text-[#5E3B85]">
                  Automatically redistribute their chores
                </p>
                <p className="body-font-light text-xs text-gray-600">
                  ChoreAI will reassign their pending chores to other family members
                </p>
              </div>
            </label>
          </div>

          <div className="flex gap-3">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1 funky-button">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 funky-button bg-[#2B59C3] text-white">
              <Calendar className="w-4 h-4 mr-2" />
              Mark Absent
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}