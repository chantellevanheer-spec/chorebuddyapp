import React from 'react';
import { Button } from '@/components/ui/button';
import { Star, Gift, Edit, Trash2 } from 'lucide-react';
import { REWARD_ICONS } from '@/components/lib/constants';

function RedeemableItemCard({ item, onRedeem, onEdit, onDelete, canAfford }) {
  const isDisabled = !canAfford;
  
  const IconComponent = REWARD_ICONS[item.icon] || Gift;

  return (
    <div className={`funky-card-hover funky-card p-6 border-4 relative group transition-all duration-300 ${isDisabled ? 'bg-gray-50 opacity-70' : 'bg-white'} border-yellow-400`}>
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="ghost" onClick={() => onEdit(item)} className="h-8 w-8 rounded-full hover:bg-black/10">
          <Edit className="w-4 h-4 text-[#5E3B85]" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onDelete(item)} className="h-8 w-8 rounded-full hover:bg-black/10">
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>

      <div className="flex flex-col h-full">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="funky-button w-16 h-16 bg-yellow-100 border-2 border-yellow-400 flex items-center justify-center">
              <IconComponent className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="funky-button px-4 py-2 bg-white border-2 border-yellow-400 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="header-font text-lg text-yellow-600">{item.cost}</span>
            </div>
          </div>
          <h3 className="header-font text-2xl text-[#2B59C3] min-h-[56px]">{item.name}</h3>
          <p className="body-font-light text-gray-600 text-sm mt-1 min-h-[40px]">{item.description}</p>
        </div>

        <div className="mt-6">
          {canAfford && (
            <div className="funky-button text-center mb-2 px-3 py-1 bg-green-100 border-2 border-green-400">
              <span className="body-font text-xs text-green-700">🎉 AFFORDABLE!</span>
            </div>
          )}
          <Button
            onClick={() => onRedeem(item)}
            disabled={isDisabled}
            className="funky-button w-full header-font text-lg py-3 bg-[#FF6B35] text-white"
          >
            <Gift className="w-5 h-5 mr-2" /> Redeem
          </Button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(RedeemableItemCard);