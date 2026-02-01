import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Displays learned difficulty information for a chore
 */
export default function LearnedDifficultyBadge({ chore, showDetails = false }) {
  const adjustedScore = chore.data?.adjusted_difficulty_score;
  const adjustedLabel = chore.data?.adjusted_difficulty_label;
  const feedbackCount = chore.data?.difficulty_feedback_count || 0;

  if (!adjustedScore || feedbackCount < 3) {
    // Need at least 3 feedback entries to show learned difficulty
    return null;
  }

  const getLabelInfo = () => {
    switch (adjustedLabel) {
      case 'easier_than_labeled':
        return {
          icon: TrendingDown,
          text: 'Easier than labeled',
          color: 'bg-blue-100 text-blue-700 border-blue-300'
        };
      case 'harder_than_labeled':
        return {
          icon: TrendingUp,
          text: 'Harder than labeled',
          color: 'bg-orange-100 text-orange-700 border-orange-300'
        };
      default:
        return {
          icon: Minus,
          text: 'Matches label',
          color: 'bg-green-100 text-green-700 border-green-300'
        };
    }
  };

  const { icon: Icon, text, color } = getLabelInfo();

  if (!showDetails) {
    return (
      <Badge variant="outline" className={`${color} text-xs`}>
        <Icon className="w-3 h-3 mr-1" />
        AI-learned
      </Badge>
    );
  }

  return (
    <div className={`${color} rounded-lg p-2 text-xs space-y-1`}>
      <div className="flex items-center gap-1 font-semibold">
        <Icon className="w-3 h-3" />
        <span>{text}</span>
      </div>
      <div className="text-xs opacity-75">
        Based on {feedbackCount} feedback{feedbackCount !== 1 ? 's' : ''}
      </div>
      <div className="text-xs opacity-75">
        Adjusted score: {adjustedScore.toFixed(1)}/3
      </div>
    </div>
  );
}