import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Clock } from 'lucide-react';

export default function NotificationPreferences({ preferences, onChange }) {
  const defaultPrefs = {
    chore_reminders: true,
    achievement_alerts: true,
    weekly_reports: false,
    reminder_time: '09:00',
    reminder_day_before: true,
    ...preferences
  };

  const handleChange = (key, value) => {
    onChange({ ...defaultPrefs, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 funky-card border-2 border-dashed bg-white/50">
        <div className="flex-1">
          <h3 className="body-font text-lg text-[#5E3B85] flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Chore Reminders
          </h3>
          <p className="body-font-light text-sm text-gray-600">Get notified about upcoming chores</p>
        </div>
        <Switch
          checked={defaultPrefs.chore_reminders}
          onCheckedChange={(value) => handleChange('chore_reminders', value)}
        />
      </div>

      {defaultPrefs.chore_reminders && (
        <div className="ml-4 p-4 funky-card bg-gray-50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="body-font text-base text-[#5E3B85]">Remind me the day before</h4>
              <p className="body-font-light text-xs text-gray-500">Get a heads up before chores are due</p>
            </div>
            <Switch
              checked={defaultPrefs.reminder_day_before}
              onCheckedChange={(value) => handleChange('reminder_day_before', value)}
            />
          </div>

          <div>
            <label className="body-font text-sm text-[#5E3B85] flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" />
              Preferred reminder time
            </label>
            <Select
              value={defaultPrefs.reminder_time}
              onValueChange={(value) => handleChange('reminder_time', value)}
            >
              <SelectTrigger className="funky-button bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="07:00">7:00 AM</SelectItem>
                <SelectItem value="08:00">8:00 AM</SelectItem>
                <SelectItem value="09:00">9:00 AM</SelectItem>
                <SelectItem value="10:00">10:00 AM</SelectItem>
                <SelectItem value="17:00">5:00 PM</SelectItem>
                <SelectItem value="18:00">6:00 PM</SelectItem>
                <SelectItem value="19:00">7:00 PM</SelectItem>
                <SelectItem value="20:00">8:00 PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between p-4 funky-card border-2 border-dashed bg-white/50">
        <div>
          <h3 className="body-font text-lg text-[#5E3B85]">Achievement Alerts</h3>
          <p className="body-font-light text-sm text-gray-600">Celebrate completed tasks</p>
        </div>
        <Switch
          checked={defaultPrefs.achievement_alerts}
          onCheckedChange={(value) => handleChange('achievement_alerts', value)}
        />
      </div>

      <div className="flex items-center justify-between p-4 funky-card border-2 border-dashed bg-white/50">
        <div>
          <h3 className="body-font text-lg text-[#5E3B85]">Weekly Reports</h3>
          <p className="body-font-light text-sm text-gray-600">Receive family progress summaries</p>
        </div>
        <Switch
          checked={defaultPrefs.weekly_reports}
          onCheckedChange={(value) => handleChange('weekly_reports', value)}
        />
      </div>
    </div>
  );
}