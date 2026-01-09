import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, X, Star } from 'lucide-react';
import { AVATAR_COLORS } from '@/components/lib/constants';

export default function RedeemConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  item,
  people,
  personPoints,
  isProcessing
}) {
  if (!item) return null;

  const eligiblePeople = people.filter(p => (personPoints[p.id] || 0) >= item.cost);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="funky-card max-w-lg border-4 border-[#C3B1E1]">
        <DialogHeader>
          <DialogTitle className="header-font text-3xl text-[#2B59C3] flex items-center justify-between">
            Redeem "{item.name}"
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-6 h-6" />
            </Button>
          </DialogTitle>
          <DialogDescription className="body-font-light text-gray-600 text-lg pt-2">
            This reward costs <strong className="text-[#FF6B35]">{item.cost} points</strong>. Who is redeeming it?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 max-h-60 overflow-y-auto space-y-3">
          {eligiblePeople.length > 0 ? (
            eligiblePeople.map(person => (
              <button
                key={person.id}
                onClick={() => onConfirm(person.id)}
                disabled={isProcessing}
                className={`w-full text-left funky-button p-4 flex items-center justify-between border-3 transition-colors ${AVATAR_COLORS[person.avatar_color] || AVATAR_COLORS.lavender}`}
              >
                <div className="flex items-center gap-4">
                  <div className="funky-button w-10 h-10 rounded-full bg-white border-3 border-[#5E3B85] flex items-center justify-center">
                    <span className="header-font text-lg text-[#5E3B85]">{person.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="body-font text-lg text-[#5E3B85]">{person.name}</span>
                </div>
                <div className="flex items-center gap-2 text-yellow-600">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" />
                  <span className="header-font text-lg">{personPoints[person.id] || 0}</span>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center p-4">
              <p className="body-font text-gray-600">No one has enough points for this item yet.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="funky-button flex-1 bg-gray-200 hover:bg-gray-300 text-[#5E3B85] border-3 border-[#5E3B85] py-4 header-font text-lg"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}