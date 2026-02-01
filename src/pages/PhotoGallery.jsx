import React from 'react';
import { useData } from '../components/contexts/DataContext';
import { Camera, Loader2 } from 'lucide-react';
import PhotoGallery from '../components/chores/PhotoGallery';

export default function PhotoGalleryPage() {
  const { loading } = useData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-[#C3B1E1]" />
      </div>
    );
  }

  return (
    <div className="mx-4 md:mx-8 lg:mx-24 pb-32 space-y-8 lg:pb-8">
      {/* Header */}
      <div className="funky-card p-6 md:p-8">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="funky-button w-16 h-16 md:w-20 md:h-20 bg-[#F7A1C4] flex items-center justify-center">
            <Camera className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <div>
            <h1 className="header-font text-4xl md:text-5xl text-[#2B59C3]">Photo Gallery</h1>
            <p className="body-font-light text-gray-600 mt-2">
              Your family's completed chore showcase! 📸
            </p>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <PhotoGallery />
    </div>
  );
}