import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import ChoreCompletionModal from "./ChoreCompletionModal";
import { AVATAR_COLORS } from '../lib/constants';

export default function SimpleChoreCard({ assignment, chore, person, onComplete, user }) {
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  
  if (!chore || !person) return null;

  const handleCompleteWithDetails = async (assignmentId, notes, photoUrl, difficultyRating) => {
    await onComplete(assignmentId, chore.id, notes, photoUrl, difficultyRating);
    setShowCompletionModal(false);
  };

  const difficultyEmojis = {
    easy: "😊",
    medium: "💪",
    hard: "🏆"
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => !assignment.completed && setShowCompletionModal(true)}
        disabled={assignment.completed}
        className={`
          funky-card w-full p-6 text-left transition-all duration-200
          ${assignment.completed 
            ? 'opacity-60 bg-green-100 border-4 border-green-400' 
            : 'bg-white border-4 border-[#FF6B35] hover:border-[#2B59C3]'
          }
        `}
      >
        <div className="flex items-center gap-4">
          {/* Large Checkbox/Check Icon */}
          <div className="flex-shrink-0">
            {assignment.completed ? (
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={3} />
              </div>
            ) : (
              <div className="w-20 h-20 border-8 border-[#FF6B35] rounded-full bg-white" />
            )}
          </div>

          {/* Chore Info */}
          <div className="flex-1">
            <h3 className={`header-font text-3xl text-[#2B59C3] mb-2 ${assignment.completed ? 'line-through' : ''}`}>
              {chore.title}
            </h3>
            
            <div className="flex items-center gap-3">
              {/* Difficulty Emoji */}
              <span className="text-4xl">{difficultyEmojis[chore.difficulty] || "💪"}</span>
              
              {/* Time Badge */}
              {chore.estimated_time && (
                <div className="funky-button bg-[#C3B1E1] text-white px-4 py-2">
                  <span className="body-font text-xl">⏱️ {chore.estimated_time} min</span>
                </div>
              )}
            </div>
          </div>

          {/* Person Avatar - Large */}
          <div className="flex-shrink-0 text-center">
            <div className={`funky-button w-20 h-20 rounded-full border-4 flex items-center justify-center ${AVATAR_COLORS[person.avatar_color] || 'bg-gray-200'}`}>
              <span className="header-font text-4xl text-white">
                {person.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </motion.button>

      {showCompletionModal && (
        <ChoreCompletionModal
          isOpen={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          onComplete={handleCompleteWithDetails}
          assignment={assignment}
          chore={chore}
          isPremium={user?.subscription_tier !== 'free'}
          requiresPhoto={chore?.photo_required}
        />
      )}
    </>
  );
}