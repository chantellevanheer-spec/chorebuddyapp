import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addDays } from 'date-fns';

const CHALLENGE_TYPES = [
  { value: 'total_chores', label: 'Total Chores', description: 'Complete X chores as a family' },
  { value: 'speed_challenge', label: 'Speed Challenge', description: 'Complete chores quickly' },
  { value: 'everyone_contributes', label: 'Everyone Contributes', description: 'Every member must participate' },
  { value: 'category_focus', label: 'Category Focus', description: 'Focus on specific room/category' },
  { value: 'weekend_blitz', label: 'Weekend Blitz', description: 'Complete chores on weekend' }
];

const DURATION_PRESETS = [
  { value: '1', label: '24 Hours', days: 1 },
  { value: '3', label: '3 Days', days: 3 },
  { value: '7', label: '1 Week', days: 7 },
  { value: '14', label: '2 Weeks', days: 14 }
];

export default function ChallengeFormModal({ isOpen, onClose, onSubmit, people = [] }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    challenge_type: 'total_chores',
    target_value: 20,
    bonus_points: 50,
    duration: '7',
    category_filter: '',
    participants: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const startDate = new Date();
    const endDate = addDays(startDate, parseInt(formData.duration));
    
    onSubmit({
      title: formData.title,
      description: formData.description,
      challenge_type: formData.challenge_type,
      target_value: parseInt(formData.target_value),
      bonus_points: parseInt(formData.bonus_points),
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      category_filter: formData.category_filter || null,
      participants: formData.participants.length > 0 ? formData.participants : people.map(p => p.id)
    });
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      challenge_type: 'total_chores',
      target_value: 20,
      bonus_points: 50,
      duration: '7',
      category_filter: '',
      participants: []
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="header-font text-3xl text-[#2B59C3]">
            Create Family Challenge
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <Label className="body-font">Challenge Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Kitchen Cleanup Marathon"
              required
              className="mt-2"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="body-font">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the challenge..."
              rows={3}
              className="mt-2"
            />
          </div>

          {/* Challenge Type */}
          <div>
            <Label className="body-font">Challenge Type</Label>
            <Select
              value={formData.challenge_type}
              onValueChange={(value) => setFormData({ ...formData, challenge_type: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHALLENGE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <p className="body-font">{type.label}</p>
                      <p className="body-font-light text-xs text-gray-500">{type.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Target Value */}
            <div>
              <Label className="body-font">Target Goal</Label>
              <Input
                type="number"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                min="1"
                required
                className="mt-2"
              />
            </div>

            {/* Bonus Points */}
            <div>
              <Label className="body-font">Bonus Points</Label>
              <Input
                type="number"
                value={formData.bonus_points}
                onChange={(e) => setFormData({ ...formData, bonus_points: e.target.value })}
                min="0"
                required
                className="mt-2"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <Label className="body-font">Duration</Label>
            <Select
              value={formData.duration}
              onValueChange={(value) => setFormData({ ...formData, duration: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_PRESETS.map(preset => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter (for category_focus type) */}
          {formData.challenge_type === 'category_focus' && (
            <div>
              <Label className="body-font">Category</Label>
              <Select
                value={formData.category_filter}
                onValueChange={(value) => setFormData({ ...formData, category_filter: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                  <SelectItem value="bathroom">Bathroom</SelectItem>
                  <SelectItem value="living_room">Living Room</SelectItem>
                  <SelectItem value="bedroom">Bedroom</SelectItem>
                  <SelectItem value="outdoor">Outdoor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 funky-button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 funky-button bg-[#FF6B35] text-white"
            >
              Create Challenge
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}