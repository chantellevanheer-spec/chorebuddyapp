import React from 'react';
import { motion } from 'framer-motion';

export default function InteractiveCheckbox({ isCompleted, onToggle, color = 'bg-[#C3B1E1]', 'aria-label': ariaLabel, id, checked, onCheckedChange, disabled }) {
  // Support both old and new prop formats
  const handleClick = onToggle || (() => !disabled && onCheckedChange?.(!checked));
  const isChecked = isCompleted ?? checked;
  
  return (
    <div
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      role="checkbox"
      aria-checked={isChecked}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      id={id}
      className={`funky-button relative w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2B59C3] focus:ring-offset-2 ${
        isChecked
          ? `${color.replace('border-', 'bg-')} text-white`
          : 'bg-white border-3 border-[#5E3B85]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isChecked && (
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          initial="hidden"
          animate="visible"
        >
          <motion.path
            d="M20 6L9 17L4 12"
            fill="transparent"
            strokeWidth="2.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={{
              hidden: { pathLength: 0, opacity: 0 },
              visible: {
                pathLength: 1,
                opacity: 1,
                transition: {
                  pathLength: { type: "spring", duration: 0.4, bounce: 0 },
                  opacity: { duration: 0.01 }
                }
              }
            }}
          />
        </motion.svg>
      )}
    </div>
  );
}