import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

/**
 * Widget for collecting difficulty feedback after chore completion
 */
export default function DifficultyFeedbackWidget({ 
  completionId, 
  onFeedbackSubmitted,
  compact = false 
}) {
  const [selectedRating, setSelectedRating] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ratings = [
    { value: 'too_easy', label: 'Too Easy', icon: ThumbsDown, color: 'bg-blue-100 text-blue-600 hover:bg-blue-200' },
    { value: 'just_right', label: 'Just Right', icon: Check, color: 'bg-green-100 text-green-600 hover:bg-green-200' },
    { value: 'too_hard', label: 'Too Hard', icon: ThumbsUp, color: 'bg-orange-100 text-orange-600 hover:bg-orange-200' }
  ];

  const handleRatingSelect = async (rating) => {
    setSelectedRating(rating);
    setIsSubmitting(true);

    try {
      await base44.entities.ChoreCompletion.update(completionId, {
        difficulty_rating: rating
      });

      toast.success('Thanks for your feedback! This helps improve future suggestions.');
      
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(rating);
      }
    } catch (error) {
      console.error('Failed to submit difficulty feedback:', error);
      toast.error('Failed to save feedback. Please try again.');
      setSelectedRating(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (compact) {
    return (
      <div className="flex gap-2">
        {ratings.map(({ value, icon: Icon, color }) => (
          <Button
            key={value}
            variant="ghost"
            size="sm"
            onClick={() => handleRatingSelect(value)}
            disabled={isSubmitting || selectedRating !== null}
            className={`${color} ${selectedRating === value ? 'ring-2 ring-offset-2 ring-purple-500' : ''}`}
          >
            <Icon className="w-4 h-4" />
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="funky-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
        <p className="body-font text-sm text-gray-700">How was this chore's difficulty?</p>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {ratings.map(({ value, label, icon: Icon, color }) => (
          <Button
            key={value}
            variant="outline"
            onClick={() => handleRatingSelect(value)}
            disabled={isSubmitting || selectedRating !== null}
            className={`funky-button ${color} ${selectedRating === value ? 'ring-2 ring-offset-2 ring-purple-500' : ''}`}
          >
            <div className="flex flex-col items-center gap-1">
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </div>
          </Button>
        ))}
      </div>
      
      {selectedRating && (
        <p className="text-xs text-center text-gray-500 body-font-light">
          ✓ Feedback recorded
        </p>
      )}
    </div>
  );
}