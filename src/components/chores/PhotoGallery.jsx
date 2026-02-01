import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { X, Calendar, Award, User } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function PhotoGallery() {
  const { completions, chores, people } = useData();
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Get completions with photos
  const photoCompletions = useMemo(() => {
    return completions
      .filter(c => c.photo_url && c.completion_status === 'approved')
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [completions]);

  const getChoreTitle = (choreId) => {
    return chores.find(c => c.id === choreId)?.title || 'Unknown Chore';
  };

  const getPersonName = (personId) => {
    return people.find(p => p.id === personId)?.name || 'Unknown';
  };

  if (photoCompletions.length === 0) {
    return (
      <div className="funky-card p-8 text-center">
        <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="header-font text-2xl text-gray-400 mb-2">
          No Photos Yet
        </h3>
        <p className="body-font-light text-gray-500">
          Complete chores with photo proof to build your gallery!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photoCompletions.map((completion) => (
          <motion.div
            key={completion.id}
            whileHover={{ scale: 1.05 }}
            className="funky-card p-2 cursor-pointer"
            onClick={() => setSelectedPhoto(completion)}
          >
            <div className="aspect-square relative overflow-hidden rounded-lg mb-2">
              <img
                src={completion.photo_url}
                alt={getChoreTitle(completion.chore_id)}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="body-font text-xs text-white truncate">
                  {getChoreTitle(completion.chore_id)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <User className="w-3 h-3" />
              <span className="body-font-light truncate">{getPersonName(completion.person_id)}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Photo Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="funky-card bg-white max-w-2xl w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="header-font text-2xl text-[#2B59C3] mb-1">
                    {getChoreTitle(selectedPhoto.chore_id)}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span className="body-font">{getPersonName(selectedPhoto.person_id)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span className="body-font-light">
                        {format(new Date(selectedPhoto.created_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {selectedPhoto.points_awarded && (
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="body-font">{selectedPhoto.points_awarded} pts</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => setSelectedPhoto(null)}
                  variant="ghost"
                  size="icon"
                  className="funky-button"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <img
                src={selectedPhoto.photo_url}
                alt={getChoreTitle(selectedPhoto.chore_id)}
                className="w-full rounded-lg mb-4"
              />
              
              {selectedPhoto.notes && (
                <div className="funky-card p-4 bg-blue-50 border-2 border-blue-200">
                  <p className="body-font text-sm text-gray-700">{selectedPhoto.notes}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}