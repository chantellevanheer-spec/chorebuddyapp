import React from 'react';
import InteractiveCheckbox from "@/components/ui/InteractiveCheckbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CATEGORIES = [
  { value: 'kitchen', label: '🍽️ Kitchen', color: 'text-orange-600' },
  { value: 'bathroom', label: '🚿 Bathroom', color: 'text-blue-600' },
  { value: 'living_room', label: '🛋️ Living Room', color: 'text-purple-600' },
  { value: 'bedroom', label: '🛏️ Bedroom', color: 'text-pink-600' },
  { value: 'outdoor', label: '🌳 Outdoor', color: 'text-green-600' },
  { value: 'other', label: '📋 Other', color: 'text-gray-600' }
];

export default function PersonPreferencesForm({ formData, setFormData }) {
  const togglePreference = (category, type) => {
    const currentList = formData[type] || [];
    const newList = currentList.includes(category)
      ? currentList.filter(c => c !== category)
      : [...currentList, category];
    
    setFormData({ ...formData, [type]: newList });
  };

  return (
    <div className="space-y-6 p-4 funky-card border-2 border-[#C3B1E1] bg-purple-50">
      <div className="text-center">
        <h3 className="header-font text-xl text-[#2B59C3] mb-2">🧠 ChoreAI Preferences</h3>
        <p className="body-font-light text-gray-600 text-sm">
          Help ChoreAI make smarter assignments based on preferences and skills
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skill Level */}
        <div>
          <label className="body-font text-base text-[#5E3B85] mb-2 block">Skill Level</label>
          <Select 
            value={formData.skill_level || 'intermediate'} 
            onValueChange={(value) => setFormData({ ...formData, skill_level: value })}
          >
            <SelectTrigger className="funky-button border-2 border-[#5E3B85] body-font bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">🌱 Beginner</SelectItem>
              <SelectItem value="intermediate">⚡ Intermediate</SelectItem>
              <SelectItem value="expert">🏆 Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Max Weekly Chores */}
        <div>
          <label className="body-font text-base text-[#5E3B85] mb-2 block">Max Chores Per Week</label>
          <Input
            type="number"
            min="1"
            max="20"
            value={formData.max_weekly_chores || 5}
            onChange={(e) => setFormData({ ...formData, max_weekly_chores: parseInt(e.target.value) || 5 })}
            className="funky-button border-2 border-[#5E3B85] body-font bg-white"
          />
        </div>
      </div>

      {/* Preferred Categories */}
      <div>
        <label className="body-font text-base text-[#5E3B85] mb-3 block">✅ Preferred Chore Categories</label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map(category => (
            <div key={category.value} className="flex items-center space-x-2">
              <InteractiveCheckbox
                id={`prefer-${category.value}`}
                checked={(formData.preferred_categories || []).includes(category.value)}
                onChange={() => togglePreference(category.value, 'preferred_categories')}
                className="border-2 border-green-500"
              />
              <Label 
                htmlFor={`prefer-${category.value}`} 
                className={`body-font text-sm ${category.color}`}
              >
                {category.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Avoided Categories */}
      <div>
        <label className="body-font text-base text-[#5E3B85] mb-3 block">❌ Categories to Avoid</label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map(category => (
            <div key={category.value} className="flex items-center space-x-2">
              <InteractiveCheckbox
                id={`avoid-${category.value}`}
                checked={(formData.avoided_categories || []).includes(category.value)}
                onChange={() => togglePreference(category.value, 'avoided_categories')}
                className="border-2 border-red-500"
              />
              <Label 
                htmlFor={`avoid-${category.value}`} 
                className={`body-font text-sm ${category.color}`}
              >
                {category.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="body-font-light text-blue-800 text-xs">
          💡 These preferences help ChoreAI Pro make better assignments while keeping things fair for everyone
        </p>
      </div>
    </div>
  );
}