import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Trophy, Calendar, Target } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function FamilyGoalCard({ 
  goal, 
  onEdit, 
  onDelete, 
  onClaim, 
  currentPoints, 
  isCompleted = false 
}) {
  const progressPercentage = Math.min((currentPoints / goal.target_points) * 100, 100);
  const isGoalReached = currentPoints >= goal.target_points;

  return (
    <div className={`funky-card p-6 border-4 relative group ${
      isCompleted 
        ? 'border-green-500 bg-green-50' 
        : isGoalReached 
          ? 'border-yellow-400 bg-yellow-50' 
          : 'border-[#C3B1E1] bg-purple-50'
    }`}>
      {/* Action Buttons */}
      {!isCompleted && (
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(goal)}
            className="h-8 w-8 rounded-full hover:bg-black/10"
          >
            <Edit className="w-4 h-4 text-[#5E3B85]" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(goal.id)}
            className="h-8 w-8 rounded-full hover:bg-black/10"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      )}

      {/* Goal Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`funky-button w-12 h-12 flex items-center justify-center ${
          isCompleted ? 'bg-green-500' : isGoalReached ? 'bg-yellow-400' : 'bg-[#C3B1E1]'
        }`}>
          {isCompleted || isGoalReached ? (
            <Trophy className="w-6 h-6 text-white" />
          ) : (
            <Target className="w-6 h-6 text-white" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="header-font text-xl text-[#2B59C3]">{goal.title}</h3>
          {goal.description && (
            <p className="body-font-light text-sm text-gray-600">{goal.description}</p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="body-font text-sm text-[#5E3B85]">Progress</span>
          <span className="body-font text-sm text-[#5E3B85]">
            {currentPoints} / {goal.target_points} points
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 border-2 border-[#5E3B85]">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              isCompleted ? 'bg-green-500' : isGoalReached ? 'bg-yellow-400' : 'bg-[#C3B1E1]'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Goal Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span className="body-font-light">
            {goal.end_date ? `Due ${format(parseISO(goal.end_date), 'MMM d, yyyy')}` : 'No deadline'}
          </span>
        </div>
        
        {goal.completed_date && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Trophy className="w-4 h-4" />
            <span className="body-font">
              Completed {format(parseISO(goal.completed_date), 'MMM d, yyyy')}
            </span>
          </div>
        )}
      </div>

      {/* Reward Description */}
      <div className="funky-card p-4 bg-white border-2 border-[#5E3B85] mb-4">
        <h4 className="body-font text-[#5E3B85] mb-2">🎁 Reward:</h4>
        <p className="body-font-light text-gray-700">{goal.reward_description}</p>
      </div>

      {/* Action Button */}
      {!isCompleted && isGoalReached && (
        <Button
          onClick={() => onClaim(goal.id)}
          className="funky-button w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-800 py-3 header-font text-lg"
        >
          <Trophy className="w-5 h-5 mr-2" />
          Claim Reward!
        </Button>
      )}

      {isCompleted && (
        <div className="funky-button w-full bg-green-500 text-white py-3 text-center">
          <span className="header-font text-lg">✅ Goal Completed!</span>
        </div>
      )}
    </div>
  );
}