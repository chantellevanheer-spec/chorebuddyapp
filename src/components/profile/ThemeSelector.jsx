import React from 'react';
import { Palette } from 'lucide-react';

const themeOptions = [
  {
    id: 'default',
    name: 'ChoreBuddy Classic',
    colors: {
      primary: '#2B59C3',
      secondary: '#C3B1E1',
      accent: '#FF6B35',
      highlight: '#F7A1C4'
    }
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    colors: {
      primary: '#0077B6',
      secondary: '#00B4D8',
      accent: '#90E0EF',
      highlight: '#CAF0F8'
    }
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    colors: {
      primary: '#D62828',
      secondary: '#F77F00',
      accent: '#FCBF49',
      highlight: '#EAE2B7'
    }
  },
  {
    id: 'forest',
    name: 'Forest Green',
    colors: {
      primary: '#2D6A4F',
      secondary: '#52B788',
      accent: '#95D5B2',
      highlight: '#D8F3DC'
    }
  },
  {
    id: 'lavender',
    name: 'Lavender Dream',
    colors: {
      primary: '#7209B7',
      secondary: '#B185DB',
      accent: '#F72585',
      highlight: '#FFB3D9'
    }
  },
  {
    id: 'warm',
    name: 'Warm Autumn',
    colors: {
      primary: '#A44A3F',
      secondary: '#D4A373',
      accent: '#E8B4B8',
      highlight: '#FFDAB9'
    }
  }
];

export default function ThemeSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {themeOptions.map((theme) => (
        <button
          key={theme.id}
          type="button"
          onClick={() => onSelect(theme.id)}
          className={`funky-button p-4 text-left transition-all ${
            selected === theme.id 
              ? 'bg-[#C3B1E1] scale-105' 
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <Palette className={`w-5 h-5 ${selected === theme.id ? 'text-white' : 'text-gray-600'}`} />
            <span className={`body-font text-lg ${selected === theme.id ? 'text-white' : 'text-[#5E3B85]'}`}>
              {theme.name}
            </span>
          </div>
          <div className="flex gap-2">
            {Object.values(theme.colors).map((color, idx) => (
              <div
                key={idx}
                className="w-8 h-8 rounded-lg border-2 border-white shadow-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}

export { themeOptions };