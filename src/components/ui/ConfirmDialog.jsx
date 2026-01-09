import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive" 
}) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="funky-card max-w-md border-4 border-red-500">
        <DialogHeader>
          <DialogTitle className="header-font text-2xl text-red-600 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="body-font-light text-gray-600 text-lg leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={onClose}
            className="funky-button flex-1 bg-gray-200 hover:bg-gray-300 text-[#5E3B85] border-3 border-[#5E3B85] py-3 header-font"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            className={`funky-button flex-1 py-3 header-font ${
              variant === 'destructive' 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-[#FF6B35] hover:bg-[#fa5a1f] text-white'
            }`}
          >
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}