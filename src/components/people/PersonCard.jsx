import React from 'react';
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { AVATAR_COLORS } from '@/components/lib/constants';

function PersonCard({ person, completedChores, currentChores, onEdit, onDelete }) {
  return (
    <div className={`funky-card-hover funky-card p-6 border-4 relative group ${AVATAR_COLORS[person.avatar_color]}`}>
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="ghost" onClick={() => onEdit(person)} className="h-8 w-8 rounded-full hover:bg-black/10">
          <Edit className="w-4 h-4 text-[#5E3B85]" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onDelete(person)} className="h-8 w-8 rounded-full hover:bg-black/10">
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex-shrink-0">
          <div className={`funky-button w-24 h-24 rounded-full border-4 border-[#5E3B85] flex items-center justify-center text-white ${AVATAR_COLORS[person.avatar_color]}`}>
            <span className="text-4xl header-font">{person.name.charAt(0).toUpperCase()}</span>
          </div>
        </div>
        <div className="flex-1">
          <span className="funky-button text-xs px-3 py-1 bg-white border-2 border-[#5E3B85] body-font text-[#5E3B85] capitalize">{person.role}</span>
          <h3 className="header-font text-3xl text-[#2B59C3] mt-1">{person.name}</h3>
          <div className="flex items-center gap-6 mt-3">
            <div className="text-center">
              <p className="header-font text-2xl text-green-600">{completedChores}</p>
              <p className="body-font-light text-sm text-gray-600">Done</p>
            </div>
            <div className="text-center">
              <p className="header-font text-2xl text-[#FF6B35]">{currentChores}</p>
              <p className="body-font-light text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(PersonCard);