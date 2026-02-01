import React from 'react';
import { ThumbsDown, Minus, ThumbsUp } from 'lucide-react';
import { motion } from 'framer-motion';

const ratings = [
  { 
    value: 'too_easy', 
    label: 'Too Easy', 
    icon: ThumbsDown, 
    color: 'bg-blue-400',
    hoverColor: 'hover:bg-blue-500'
  },
  { 
    value: 'just_right', 
    label: 'Just Right', 
    icon: Minus, 
    color: 'bg-green-400',
    hoverColor: 'hover:bg-green-500'
  },
  { 
    value: 'too_hard', 
    label: 'Too Hard', 
    icon: ThumbsUp, 
    color: 'bg-orange-400',
    hoverColor: 'hover:bg-orange-500'
  }
];

export default function DifficultyRating({ value, onChange, currentDifficulty }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="body-font text-sm text-gray-700">
          How was the difficulty?
        </label>
        {currentDifficulty && (
          <span className="body-font-light text-xs text-gray-500 capitalize">
            Set as: {currentDifficulty}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {ratings.map((rating) => {
          const Icon = rating.icon;
          const isSelected = value === rating.value;
          
          return (
            <motion.button
              key={rating.value}
              type="button"
              onClick={() => onChange(rating.value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                funky-button p-4 flex flex-col items-center gap-2 transition-all
                ${isSelected 
                  ? `${rating.color} text-white ring-2 ring-[#5E3B85] ring-offset-2` 
                  : `bg-gray-100 text-gray-600 ${rating.hoverColor}`
                }
              `}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs body-font">{rating.label}</span>
            </motion.button>
          );
        })}
      </div>
      
      <p className="body-font-light text-xs text-gray-500 text-center">
        Your feedback helps adjust future assignments
      </p>
    </div>
  );
}