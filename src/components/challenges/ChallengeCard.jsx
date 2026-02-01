import React from 'react';
import { Clock, Users, Target, Trophy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const CHALLENGE_ICONS = {
  total_chores: Target,
  speed_challenge: Zap,
  everyone_contributes: Users,
  category_focus: Trophy,
  weekend_blitz: Clock
};

const CHALLENGE_COLORS = {
  total_chores: 'from-blue-400 to-indigo-500',
  speed_challenge: 'from-cyan-400 to-blue-500',
  everyone_contributes: 'from-pink-400 to-rose-500',
  category_focus: 'from-purple-400 to-pink-500',
  weekend_blitz: 'from-green-400 to-teal-500'
};

export default function ChallengeCard({ challenge, people = [] }) {
  const Icon = CHALLENGE_ICONS[challenge.challenge_type] || Target;
  const colorClass = CHALLENGE_COLORS[challenge.challenge_type] || 'from-blue-400 to-indigo-500';
  
  const progress = challenge.target_value > 0 
    ? (challenge.current_value / challenge.target_value) * 100 
    : 0;
  
  const isExpired = new Date(challenge.end_date) < new Date();
  const isCompleted = challenge.status === 'completed';
  
  const timeRemaining = isExpired 
    ? 'Expired' 
    : `${formatDistanceToNow(new Date(challenge.end_date), { addSuffix: true })}`;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`funky-card p-6 ${isCompleted ? 'bg-green-50' : isExpired ? 'bg-gray-50' : 'bg-white'}`}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className={`funky-button w-16 h-16 bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="header-font text-2xl text-[#2B59C3]">
              {challenge.title}
            </h3>
            {challenge.bonus_points > 0 && (
              <div className="funky-button bg-yellow-400 text-yellow-800 px-3 py-1 text-sm body-font flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                +{challenge.bonus_points}
              </div>
            )}
          </div>
          
          <p className="body-font-light text-gray-600 mb-3">
            {challenge.description}
          </p>
          
          <div className="flex items-center gap-2 text-sm body-font">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className={isExpired ? 'text-red-600' : 'text-gray-700'}>
              {timeRemaining}
            </span>
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="body-font text-sm text-gray-700">Progress</span>
          <span className="body-font text-sm text-gray-700">
            {challenge.current_value} / {challenge.target_value}
          </span>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden border-2 border-[#5E3B85]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-full bg-gradient-to-r ${colorClass}`}
          />
        </div>
      </div>
      
      {/* Participants */}
      {challenge.participants && challenge.participants.length > 0 && (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="body-font-light text-sm text-gray-600">
            {challenge.participants.length} {challenge.participants.length === 1 ? 'participant' : 'participants'}
          </span>
        </div>
      )}
      
      {/* Status Badge */}
      {isCompleted && (
        <div className="mt-4 funky-button bg-green-500 text-white px-4 py-2 text-center body-font">
          ✓ Challenge Complete!
        </div>
      )}
    </motion.div>
  );
}