import React from 'react';
import { Check } from 'lucide-react';

export default function ThemePreview({ theme, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`funky-button p-4 text-left transition-all relative ${
        isSelected 
          ? 'scale-105 ring-4 ring-offset-2' 
          : 'hover:bg-gray-50'
      }`}
      style={isSelected ? { ringColor: theme.colors.primary } : {}}
    >
      {isSelected && (
        <div 
          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Check className="w-5 h-5 text-white" />
        </div>
      )}
      
      <div className="mb-3">
        <span className={`body-font text-lg ${isSelected ? 'font-bold' : ''}`} style={{ color: theme.colors.primary }}>
          {theme.name}
        </span>
      </div>
      
      {/* Color swatches */}
      <div className="flex gap-2">
        {Object.values(theme.colors).map((color, idx) => (
          <div
            key={idx}
            className="w-10 h-10 rounded-lg border-2 border-white shadow-sm"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      
      {/* Mini preview */}
      <div className="mt-3 p-2 rounded-lg border-2 border-gray-200 bg-gray-50">
        <div className="flex gap-1 mb-1">
          <div className="h-2 w-8 rounded" style={{ backgroundColor: theme.colors.primary }} />
          <div className="h-2 w-6 rounded" style={{ backgroundColor: theme.colors.secondary }} />
        </div>
        <div className="h-1.5 w-full rounded bg-gray-200" />
        <div className="h-1.5 w-3/4 rounded bg-gray-200 mt-1" />
      </div>
    </button>
  );
}