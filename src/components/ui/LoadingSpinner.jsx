import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 'default', message = 'Loading...', color = 'text-[#C3B1E1]' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Loader2 className={`${sizeClasses[size]} animate-spin ${color} mb-4`} />
      <p className="body-font-light text-gray-600">{message}</p>
    </div>
  );
}