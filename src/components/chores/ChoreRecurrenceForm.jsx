import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function ChoreRecurrenceForm({ formData, setFormData }) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-4 p-4 funky-card border-2 border-[#C3B1E1] bg-purple-50">
      <h3 className="header-font text-xl text-[#2B59C3]">⭐ Premium Features</h3>
      
      {/* Recurring Chore Settings */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_recurring"
          checked={formData.is_recurring}
          onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
          className="border-2 border-[#5E3B85]"
        />
        <Label htmlFor="is_recurring" className="body-font text-base text-[#5E3B85]">
          🔄 Make this a recurring chore
        </Label>
      </div>

      {formData.is_recurring && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
          <div>
            <label className="body-font text-sm text-[#5E3B85] mb-2 block">Recurrence Pattern</label>
            <Select 
              value={formData.recurrence_pattern} 
              onValueChange={(value) => setFormData({ ...formData, recurrence_pattern: value })}
            >
              <SelectTrigger className="funky-button border-2 border-[#5E3B85] body-font bg-white">
                <SelectValue placeholder="Select pattern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly_same_day">Weekly (same day)</SelectItem>
                <SelectItem value="every_2_weeks">Every 2 weeks</SelectItem>
                <SelectItem value="monthly_same_date">Monthly (same date)</SelectItem>
                <SelectItem value="custom">Custom days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(formData.recurrence_pattern === 'weekly_same_day' || formData.recurrence_pattern === 'every_2_weeks') && (
            <div>
              <label className="body-font text-sm text-[#5E3B85] mb-2 block">Day of Week</label>
              <Select 
                value={formData.recurrence_day?.toString()} 
                onValueChange={(value) => setFormData({ ...formData, recurrence_day: parseInt(value) })}
              >
                <SelectTrigger className="funky-button border-2 border-[#5E3B85] body-font bg-white">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {dayNames.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.recurrence_pattern === 'monthly_same_date' && (
            <div>
              <label className="body-font text-sm text-[#5E3B85] mb-2 block">Day of Month</label>
              <Input
                type="number"
                min="1"
                max="31"
                placeholder="e.g., 15"
                value={formData.recurrence_date || ''}
                onChange={(e) => setFormData({ ...formData, recurrence_date: parseInt(e.target.value) })}
                className="funky-button border-2 border-[#5E3B85] body-font bg-white"
              />
            </div>
          )}

          {formData.recurrence_pattern === 'custom' && (
            <div className="md:col-span-2">
              <label className="body-font text-sm text-[#5E3B85] mb-2 block">Select Days (Custom Pattern)</label>
              <div className="grid grid-cols-4 gap-2">
                {dayNames.map((day, index) => (
                  <label key={index} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={(formData.custom_recurrence_days || []).includes(index)}
                      onCheckedChange={(checked) => {
                        const days = formData.custom_recurrence_days || [];
                        if (checked) {
                          setFormData({ ...formData, custom_recurrence_days: [...days, index].sort() });
                        } else {
                          setFormData({ ...formData, custom_recurrence_days: days.filter(d => d !== index) });
                        }
                      }}
                      className="border-2 border-[#5E3B85]"
                    />
                    <span className="body-font text-xs">{day.slice(0, 3)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Priority Weight */}
      <div>
        <label className="body-font text-sm text-[#5E3B85] mb-2 block">
          Priority Weight (ChoreAI will prioritize higher values)
        </label>
        <Select 
          value={formData.priority_weight?.toString() || '5'} 
          onValueChange={(value) => setFormData({ ...formData, priority_weight: parseInt(value) })}
        >
          <SelectTrigger className="funky-button border-2 border-[#5E3B85] body-font bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 - Lowest Priority</SelectItem>
            <SelectItem value="2">2 - Low Priority</SelectItem>
            <SelectItem value="3">3 - Below Average</SelectItem>
            <SelectItem value="4">4 - Slightly Below Average</SelectItem>
            <SelectItem value="5">5 - Normal Priority (Default)</SelectItem>
            <SelectItem value="6">6 - Slightly Above Average</SelectItem>
            <SelectItem value="7">7 - Above Average</SelectItem>
            <SelectItem value="8">8 - High Priority</SelectItem>
            <SelectItem value="9">9 - Very High Priority</SelectItem>
            <SelectItem value="10">10 - Highest Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Early Completion Bonus */}
      <div>
        <label className="body-font text-sm text-[#5E3B85] mb-2 block">
          Early Completion Bonus Multiplier
        </label>
        <Select 
          value={formData.early_completion_bonus?.toString() || '1.5'} 
          onValueChange={(value) => setFormData({ ...formData, early_completion_bonus: parseFloat(value) })}
        >
          <SelectTrigger className="funky-button border-2 border-[#5E3B85] body-font bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1.0">1.0x - No Bonus</SelectItem>
            <SelectItem value="1.2">1.2x - 20% Bonus</SelectItem>
            <SelectItem value="1.5">1.5x - 50% Bonus (Default)</SelectItem>
            <SelectItem value="2.0">2.0x - Double Points</SelectItem>
            <SelectItem value="2.5">2.5x - 150% Bonus</SelectItem>
            <SelectItem value="3.0">3.0x - Triple Points</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}