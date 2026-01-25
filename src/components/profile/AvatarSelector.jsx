import React from 'react';
import { User, Cat, Dog, Rabbit, Bird, Fish, Turtle, Star, Heart, Zap, Smile, Trophy } from 'lucide-react';

const avatarIcons = [
  { id: 'user', Icon: User, label: 'Default' },
  { id: 'cat', Icon: Cat, label: 'Cat' },
  { id: 'dog', Icon: Dog, label: 'Dog' },
  { id: 'rabbit', Icon: Rabbit, label: 'Rabbit' },
  { id: 'bird', Icon: Bird, label: 'Bird' },
  { id: 'fish', Icon: Fish, label: 'Fish' },
  { id: 'turtle', Icon: Turtle, label: 'Turtle' },
  { id: 'star', Icon: Star, label: 'Star' },
  { id: 'heart', Icon: Heart, label: 'Heart' },
  { id: 'zap', Icon: Zap, label: 'Bolt' },
  { id: 'smile', Icon: Smile, label: 'Smile' },
  { id: 'trophy', Icon: Trophy, label: 'Trophy' }
];

export default function AvatarSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
      {avatarIcons.map(({ id, Icon, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          className={`funky-button p-4 flex flex-col items-center gap-2 transition-all ${
            selected === id 
              ? 'bg-[#C3B1E1] text-white scale-105' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Icon className="w-8 h-8" />
          <span className="text-xs body-font">{label}</span>
        </button>
      ))}
    </div>
  );
}

export { avatarIcons };