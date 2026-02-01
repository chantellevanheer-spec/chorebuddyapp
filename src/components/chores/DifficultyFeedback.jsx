import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DifficultyFeedback({ onSubmit }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (rating) => {
    setSelected(rating);
    onSubmit(rating);
  };

  return (
    <div className="space-y-3">
      <p className="body-font text-sm text-gray-600 text-center">
        How was the difficulty?
      </p>
      <div className="flex gap-2 justify-center">
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => handleSelect('too_easy')}
            variant="outline"
            className={`funky-button flex-col gap-1 h-auto py-3 ${selected === 'too_easy' ? 'bg-green-100 border-green-400' : ''}`}
          >
            <ThumbsDown className="w-5 h-5 text-green-600" />
            <span className="text-xs">Too Easy</span>
          </Button>
        </motion.div>
        
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => handleSelect('just_right')}
            variant="outline"
            className={`funky-button flex-col gap-1 h-auto py-3 ${selected === 'just_right' ? 'bg-blue-100 border-blue-400' : ''}`}
          >
            <Minus className="w-5 h-5 text-blue-600" />
            <span className="text-xs">Just Right</span>
          </Button>
        </motion.div>
        
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => handleSelect('too_hard')}
            variant="outline"
            className={`funky-button flex-col gap-1 h-auto py-3 ${selected === 'too_hard' ? 'bg-red-100 border-red-400' : ''}`}
          >
            <ThumbsUp className="w-5 h-5 text-red-600" />
            <span className="text-xs">Too Hard</span>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}