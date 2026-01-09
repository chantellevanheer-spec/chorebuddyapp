
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from "sonner";
import { inviteFamilyMember } from '@/functions/inviteFamilyMember';

export default function FamilyInviteModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'child'
  });
  const [isInviting, setIsInviting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.name.trim()) return;

    setIsInviting(true);
    try {
      const { data, error } = await inviteFamilyMember({ payload: formData });
      
      if (error) {
        toast.error(error);
      } else {
        toast.success('Family invitation sent successfully!');
        setFormData({ email: '', name: '', role: 'child' });
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      toast.error('Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleClose = () => {
    if (!isInviting) {
      setFormData({ email: '', name: '', role: 'child' });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="funky-card max-w-md w-full p-8 border-4 border-[#C3B1E1] bg-purple-50"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="funky-button w-12 h-12 bg-[#C3B1E1] flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="header-font text-2xl text-[#2B59C3]">Invite Family Member</h2>
                <p className="body-font-light text-sm text-gray-600">Premium Feature</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="body-font text-base text-[#5E3B85] mb-2 block">Email Address *</label>
                <Input
                  type="email"
                  placeholder="family.member@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="funky-button border-3 border-[#5E3B85] text-base p-3 body-font bg-white"
                  required
                />
              </div>

              <div>
                <label className="body-font text-base text-[#5E3B85] mb-2 block">Name *</label>
                <Input
                  placeholder="Their name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="funky-button border-3 border-[#5E3B85] text-base p-3 body-font bg-white"
                  required
                />
              </div>

              <div>
                <label className="body-font text-base text-[#5E3B85] mb-2 block">Role</label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="funky-button border-3 border-[#5E3B85] body-font bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="child">🧒 Child</SelectItem>
                    <SelectItem value="parent">👨‍👩‍ Parent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 mt-4">
                <p className="body-font-light text-xs text-blue-800">
                  💡 They'll receive an email invitation with instructions to join your family and access their chores on their own device.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={handleClose}
                  disabled={isInviting}
                  className="funky-button flex-1 bg-gray-200 hover:bg-gray-300 text-[#5E3B85] border-3 border-[#5E3B85] py-3 header-font text-base"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isInviting || !formData.email.trim() || !formData.name.trim()}
                  className="funky-button flex-1 bg-[#FF6B35] hover:bg-[#fa5a1f] text-white py-3 header-font text-base"
                >
                  {isInviting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invite
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
