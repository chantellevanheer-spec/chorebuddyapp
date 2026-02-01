import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Type, ZoomIn } from 'lucide-react';

export default function AccessibilitySettings({ 
  simplifiedView, 
  onSimplifiedViewChange,
  highContrast,
  onHighContrastChange,
  textSize,
  onTextSizeChange
}) {
  return (
    <div className="space-y-6">
      {/* Simplified View */}
      <div className="flex items-center justify-between p-4 funky-card border-2 border-dashed bg-white/50">
        <label htmlFor="simplified-view" className="flex-1 cursor-pointer">
          <div className="flex items-center gap-2 mb-1">
            <ZoomIn className="w-5 h-5 text-[#2B59C3]" />
            <h3 className="body-font text-lg text-[#5E3B85]">Simplified View</h3>
          </div>
          <p className="body-font-light text-sm text-gray-600">
            Larger buttons, less text, and more icons for easier reading
          </p>
        </label>
        <Switch
          id="simplified-view"
          checked={simplifiedView}
          onCheckedChange={onSimplifiedViewChange}
        />
      </div>

      {/* High Contrast */}
      <div className="flex items-center justify-between p-4 funky-card border-2 border-dashed bg-white/50">
        <label htmlFor="high-contrast" className="flex-1 cursor-pointer">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-5 h-5 text-[#2B59C3]" />
            <h3 className="body-font text-lg text-[#5E3B85]">High Contrast Mode</h3>
          </div>
          <p className="body-font-light text-sm text-gray-600">
            Enhanced color contrast for better visibility
          </p>
        </label>
        <Switch
          id="high-contrast"
          checked={highContrast}
          onCheckedChange={onHighContrastChange}
        />
      </div>

      {/* Text Size */}
      <div className="p-4 funky-card border-2 border-dashed bg-white/50">
        <div className="flex items-center gap-2 mb-3">
          <Type className="w-5 h-5 text-[#2B59C3]" />
          <h3 className="body-font text-lg text-[#5E3B85]">Text Size</h3>
        </div>
        <Select value={textSize} onValueChange={onTextSizeChange}>
          <SelectTrigger className="funky-button border-3 border-[#5E3B85] body-font bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="large">Large</SelectItem>
            <SelectItem value="extra-large">Extra Large</SelectItem>
          </SelectContent>
        </Select>
        <p className="body-font-light text-sm text-gray-600 mt-2">
          Adjust the size of text throughout the app
        </p>
      </div>
    </div>
  );
}