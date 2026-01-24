import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Star } from 'lucide-react';
import InteractiveCheckbox from '../ui/InteractiveCheckbox';
import { AVATAR_COLORS } from '../lib/constants';

const difficultyStars = {
  easy: 1,
  medium: 2,
  hard: 3
};

const categoryColors = {
  kitchen: "border-[#FF6B35]",
  bathroom: "border-[#2B59C3]",
  living_room: "border-[#C3B1E1]",
  bedroom: "border-[#F7A1C4]",
  outdoor: "border-green-400",
  other: "border-gray-400"
};

export default function ScheduleChoreItem({ assignment, chore, person, onComplete }) {
  if (!chore) return null;

  const isCompleted = assignment.completed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`funky-card p-6 transition-all duration-300 flex items-center gap-4 border-4 ${
        isCompleted ? 'bg-green-100/50 border-green-300' : categoryColors[chore.category] || categoryColors.other
      }`}
    >
      <InteractiveCheckbox
        isCompleted={isCompleted}
        onToggle={() => !isCompleted && onComplete(assignment.id, chore.id)}
        color={isCompleted ? 'bg-green-500' : categoryColors[chore.category]?.replace('border-', 'bg-') || 'bg-[#C3B1E1]'}
      />

      <div className="flex-1">
        <h4
          className={`header-font text-xl ${
            isCompleted ? 'line-through text-gray-500' : 'text-[#2B59C3]'
          }`}
        >
          {chore.title}
        </h4>
        <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
          <div className="flex items-center gap-1">
            {[...Array(difficultyStars[chore.difficulty])].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-500" />
            ))}
          </div>
          {chore.estimated_time && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className="body-font">{chore.estimated_time} min</span>
            </div>
          )}
          <span className="body-font capitalize">
            {chore.category.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Person Display */}
      {person && (
        <div className="flex-shrink-0 text-center">
          <div className={`funky-button w-14 h-14 rounded-full border-3 flex items-center justify-center ${AVATAR_COLORS[person.avatar_color] || 'bg-gray-200'}`}>
            <span className="header-font text-xl text-white">
              {person.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <p className="body-font text-sm mt-1.5 text-[#5E3B85] font-semibold">{person.name}</p>
        </div>
      )}
    </motion.div>
  );
}