import React from "react";
import { motion } from "framer-motion";
import { Trophy, Star, Zap, Target, Award, Crown } from "lucide-react";

const achievementTypes = {
  first_chore: { icon: Star, color: "from-blue-400 to-blue-600", label: "First Chore!" },
  streak_3: { icon: Zap, color: "from-orange-400 to-orange-600", label: "3 Day Streak!" },
  streak_7: { icon: Zap, color: "from-purple-400 to-purple-600", label: "Week Warrior!" },
  streak_30: { icon: Crown, color: "from-yellow-400 to-yellow-600", label: "Monthly Master!" },
  complete_10: { icon: Target, color: "from-green-400 to-green-600", label: "10 Chores Done!" },
  complete_50: { icon: Award, color: "from-pink-400 to-pink-600", label: "50 Chores Champion!" },
  complete_100: { icon: Trophy, color: "from-red-400 to-red-600", label: "Century Club!" },
  perfect_week: { icon: Star, color: "from-indigo-400 to-indigo-600", label: "Perfect Week!" }
};

export default function AchievementBadge({ type, size = "medium", unlocked = true }) {
  const achievement = achievementTypes[type] || achievementTypes.first_chore;
  const Icon = achievement.icon;

  const sizes = {
    small: "w-12 h-12",
    medium: "w-16 h-16",
    large: "w-24 h-24"
  };

  const iconSizes = {
    small: "w-6 h-6",
    medium: "w-8 h-8",
    large: "w-12 h-12"
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
      className="text-center"
    >
      <div
        className={`funky-card ${sizes[size]} bg-gradient-to-br ${achievement.color} flex items-center justify-center relative overflow-hidden ${
          unlocked ? '' : 'opacity-30 grayscale'
        }`}
      >
        {unlocked && (
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
            className="absolute inset-0 bg-white/20 rounded-full"
          />
        )}
        <Icon className={`${iconSizes[size]} text-white relative z-10`} />
        
        {unlocked && (
          <motion.div
            animate={{
              scale: [0, 1.5, 0],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
            className="absolute inset-0 bg-white rounded-full"
          />
        )}
      </div>
      <p className={`body-font text-xs mt-2 ${unlocked ? 'text-[#5E3B85]' : 'text-gray-400'}`}>
        {achievement.label}
      </p>
    </motion.div>
  );
}