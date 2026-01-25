import React from 'react';
import { avatarIcons } from './AvatarSelector';

export default function UserAvatar({ avatarId = 'user', size = 'md', className = '' }) {
  const avatar = avatarIcons.find(a => a.id === avatarId) || avatarIcons[0];
  const Icon = avatar.Icon;
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  };
  
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[#C3B1E1] to-[#F7A1C4] flex items-center justify-center border-3 border-white shadow-md ${className}`}>
      <Icon className={`${iconSizes[size]} text-white`} />
    </div>
  );
}