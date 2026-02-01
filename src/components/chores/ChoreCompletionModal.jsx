import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Camera, Upload, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { sanitizeHTML } from '@/components/lib/sanitization';
import { VALIDATION } from '@/components/lib/appConstants';
import DifficultyRating from './DifficultyRating';

export default function ChoreCompletionModal({ 
  isOpen, 
  onClose, 
  onComplete, 
  assignment, 
  chore, 
  isPremium,
  requiresPhoto
}) {
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [difficultyRating, setDifficultyRating] = useState(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo must be less than 5MB');
        return;
      }
      
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (requiresPhoto && !photoFile) {
      toast.error('This chore requires a photo');
      return;
    }

    // Validate and sanitize notes
    if (notes.length > VALIDATION.MAX_NOTES_LENGTH) {
      toast.error(`Notes must be less than ${VALIDATION.MAX_NOTES_LENGTH} characters`);
      return;
    }

    setIsUploading(true);
    try {
      let photoUrl = null;
      
      if (photoFile && isPremium) {
        const uploadResult = await base44.integrations.Core.UploadFile({ file: photoFile });
        photoUrl = uploadResult.file_url;
      }

      // Sanitize notes before submission
      const sanitizedNotes = sanitizeHTML(notes);
      await onComplete(assignment.id, sanitizedNotes, photoUrl, difficultyRating);
      onClose();
    } catch (error) {
      console.error('Error completing chore:', error);
      toast.error(error?.message || 'Failed to complete chore. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="funky-card max-w-md w-full p-6 bg-white"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="header-font text-2xl text-[#2B59C3]">
                Complete Chore
              </h2>
              <p className="body-font text-lg text-gray-700 mt-1">{chore.title}</p>
            </div>
            <button
              onClick={onClose}
              className="funky-button w-10 h-10 bg-gray-200 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Difficulty Rating */}
          <div className="mb-6">
            <DifficultyRating 
              value={difficultyRating}
              onChange={setDifficultyRating}
              currentDifficulty={chore.difficulty}
            />
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className="body-font text-sm text-gray-700 mb-2 block">
              Add notes (optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it go? Any notes for your parent?"
              className="w-full"
              rows={3}
            />
          </div>

          {/* Photo Upload */}
          {isPremium && (
            <div className="mb-6">
              <label className="body-font text-sm text-gray-700 mb-2 block">
                {requiresPhoto ? 'Photo Required' : 'Add photo (optional)'}
                {requiresPhoto && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {photoPreview ? (
                <div className="relative">
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded-lg border-2 border-[#5E3B85]"
                  />
                  <button
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute top-2 right-2 funky-button w-8 h-8 bg-red-500 text-white flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="funky-card-hover funky-card border-2 border-dashed p-8 flex flex-col items-center justify-center cursor-pointer">
                  <Camera className="w-12 h-12 text-[#C3B1E1] mb-2" />
                  <span className="body-font text-sm text-gray-600">
                    Click to take/upload photo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          {!isPremium && requiresPhoto && (
            <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
              <p className="body-font-light text-sm text-yellow-800">
                This chore requires photo verification. Upgrade to Premium to unlock this feature!
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 funky-button bg-gray-200"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 funky-button bg-green-500 text-white"
              disabled={isUploading || (requiresPhoto && !photoFile && isPremium)}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Mark Complete'
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}