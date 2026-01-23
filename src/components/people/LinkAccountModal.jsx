import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Link as LinkIcon, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LinkAccountModal({ isOpen, onClose, people, onLink, isProcessing }) {
  const [selectedPersonId, setSelectedPersonId] = useState("");

  // Filter to only show people without linked accounts
  const unlinkedPeople = people.filter(p => !p.linked_user_id);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedPersonId) {
      onLink(selectedPersonId);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="funky-card bg-white p-6 md:p-8 max-w-md w-full"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="funky-button w-12 h-12 bg-[#2B59C3] flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-white" />
              </div>
              <h2 className="header-font text-2xl text-[#2B59C3]">Link Your Account</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {unlinkedPeople.length === 0 ? (
            <div className="text-center py-6">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
              <p className="body-font text-gray-600 mb-4">
                All family members are already linked to accounts.
              </p>
              <Button
                onClick={onClose}
                className="funky-button bg-gray-200 text-[#5E3B85] border-2 border-[#5E3B85]"
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <p className="body-font-light text-sm text-blue-800">
                  💡 Link your account to a family member profile to see your chores and track your progress.
                </p>
              </div>

              <div>
                <label className="body-font text-lg text-[#5E3B85] mb-2 block">
                  Select Your Family Member Profile
                </label>
                <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
                  <SelectTrigger className="funky-button border-3 border-[#2B59C3] body-font bg-white">
                    <SelectValue placeholder="Choose who you are..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unlinkedPeople.map(person => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="funky-button flex-1 bg-gray-200 text-[#5E3B85] border-3 border-[#5E3B85]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedPersonId || isProcessing}
                  className="funky-button flex-1 bg-[#2B59C3] text-white border-3 border-[#5E3B85]"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Linking...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Link Account
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}