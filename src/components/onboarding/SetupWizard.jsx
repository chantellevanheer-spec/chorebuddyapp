import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, ClipboardList, Gift, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '../contexts/DataContext';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

const AVATAR_COLORS = ['lavender', 'mint', 'blue', 'peach', 'pink'];

export default function SetupWizard({ isOpen, onComplete }) {
  const { addPerson, addChore, addItem, isProcessing } = useData();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Family Members
  const [members, setMembers] = useState([
    { name: '', role: 'parent', avatar_color: AVATAR_COLORS[0] }
  ]);

  // Step 2: Chores
  const [chores, setChores] = useState([
    { title: '', category: 'kitchen', difficulty: 'medium' }
  ]);

  // Step 3: Rewards
  const [rewards, setRewards] = useState([
    { name: '', cost: 10, category: 'treats' }
  ]);

  const steps = [
    {
      title: 'Add Family Members',
      subtitle: 'Who lives in your household?',
      icon: Users,
      color: 'bg-[#F7A1C4]',
    },
    {
      title: 'Create First Chores',
      subtitle: 'What needs to get done?',
      icon: ClipboardList,
      color: 'bg-[#FF6B35]',
    },
    {
      title: 'Set Up Rewards',
      subtitle: 'What can they earn?',
      icon: Gift,
      color: 'bg-[#C3B1E1]',
    },
    {
      title: 'All Done!',
      subtitle: 'Your family is ready to go',
      icon: Sparkles,
      color: 'bg-green-400',
    }
  ];

  const addMember = () => {
    setMembers([...members, { name: '', role: 'child', avatar_color: AVATAR_COLORS[members.length % 5] }]);
  };

  const removeMember = (index) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index, field, value) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const addChoreItem = () => {
    setChores([...chores, { title: '', category: 'other', difficulty: 'medium' }]);
  };

  const removeChoreItem = (index) => {
    setChores(chores.filter((_, i) => i !== index));
  };

  const updateChore = (index, field, value) => {
    const updated = [...chores];
    updated[index][field] = value;
    setChores(updated);
  };

  const addRewardItem = () => {
    setRewards([...rewards, { name: '', cost: 10, category: 'treats' }]);
  };

  const removeRewardItem = (index) => {
    setRewards(rewards.filter((_, i) => i !== index));
  };

  const updateReward = (index, field, value) => {
    const updated = [...rewards];
    updated[index][field] = value;
    setRewards(updated);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return members.some(m => m.name.trim());
      case 1:
        return chores.some(c => c.title.trim());
      case 2:
        return rewards.some(r => r.name.trim());
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleFinish();
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // Save all data
      const validMembers = members.filter(m => m.name.trim());
      const validChores = chores.filter(c => c.title.trim());
      const validRewards = rewards.filter(r => r.name.trim());

      // Create members
      for (const member of validMembers) {
        await addPerson(member);
      }

      // Create chores
      for (const chore of validChores) {
        await addChore(chore);
      }

      // Create rewards
      for (const reward of validRewards) {
        await addItem(reward);
      }

      // Mark onboarding as complete
      await base44.auth.updateMe({ 
        onboarding_completed: true 
      });

      toast.success('🎉 Your family is all set up!');
      onComplete();
    } catch (error) {
      console.error('Setup error:', error);
      toast.error('Failed to complete setup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="funky-card bg-[#FDFBF5] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className={`${steps[currentStep].color} p-6 text-white`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {React.createElement(steps[currentStep].icon, { className: "w-8 h-8" })}
              <div>
                <h2 className="header-font text-2xl">{steps[currentStep].title}</h2>
                <p className="body-font-light text-sm opacity-90">{steps[currentStep].subtitle}</p>
              </div>
            </div>
            <span className="body-font text-sm">Step {currentStep + 1} of 4</span>
          </div>
          
          {/* Progress Bar */}
          <div className="h-2 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep + 1) / 4) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div
                key="members"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="body-font-light text-gray-600">Add everyone who will be doing chores (you can add more later)</p>
                {members.map((member, index) => (
                  <div key={index} className="funky-card p-4 bg-white space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-${member.avatar_color}-400`}>
                        {member.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <Input
                        placeholder="Name"
                        value={member.name}
                        onChange={(e) => updateMember(index, 'name', e.target.value)}
                        className="flex-1"
                      />
                      {members.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeMember(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Select value={member.role} onValueChange={(val) => updateMember(index, 'role', val)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parent">parent</SelectItem>
                          <SelectItem value="teen">Teen</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={member.avatar_color} onValueChange={(val) => updateMember(index, 'avatar_color', val)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Color" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVATAR_COLORS.map(color => (
                            <SelectItem key={color} value={color}>{color}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
                <Button onClick={addMember} variant="outline" className="w-full">
                  <Users className="w-4 h-4 mr-2" /> Add Another Member
                </Button>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key="chores"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="body-font-light text-gray-600">Start with your most important chores (you can add more later)</p>
                {chores.map((chore, index) => (
                  <div key={index} className="funky-card p-4 bg-white space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Chore name (e.g., Wash dishes)"
                        value={chore.title}
                        onChange={(e) => updateChore(index, 'title', e.target.value)}
                        className="flex-1"
                      />
                      {chores.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeChoreItem(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Select value={chore.category} onValueChange={(val) => updateChore(index, 'category', val)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kitchen">Kitchen</SelectItem>
                          <SelectItem value="bathroom">Bathroom</SelectItem>
                          <SelectItem value="living_room">Living Room</SelectItem>
                          <SelectItem value="bedroom">Bedroom</SelectItem>
                          <SelectItem value="outdoor">Outdoor</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={chore.difficulty} onValueChange={(val) => updateChore(index, 'difficulty', val)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
                <Button onClick={addChoreItem} variant="outline" className="w-full">
                  <ClipboardList className="w-4 h-4 mr-2" /> Add Another Chore
                </Button>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="rewards"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="body-font-light text-gray-600">Set up rewards your family can earn with points</p>
                {rewards.map((reward, index) => (
                  <div key={index} className="funky-card p-4 bg-white space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Reward name (e.g., Extra screen time)"
                        value={reward.name}
                        onChange={(e) => updateReward(index, 'name', e.target.value)}
                        className="flex-1"
                      />
                      {rewards.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeRewardItem(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs">Points</Label>
                        <Input
                          type="number"
                          value={reward.cost}
                          onChange={(e) => updateReward(index, 'cost', parseInt(e.target.value) || 0)}
                          min="1"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Category</Label>
                        <Select value={reward.category} onValueChange={(val) => updateReward(index, 'category', val)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="privileges">Privileges</SelectItem>
                            <SelectItem value="treats">Treats</SelectItem>
                            <SelectItem value="activities">Activities</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
                <Button onClick={addRewardItem} variant="outline" className="w-full">
                  <Gift className="w-4 h-4 mr-2" /> Add Another Reward
                </Button>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-8 space-y-6"
              >
                <div className="w-20 h-20 mx-auto funky-button bg-green-400 flex items-center justify-center">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="header-font text-2xl text-[#2B59C3] mb-2">You're All Set!</h3>
                  <p className="body-font-light text-gray-600">
                    {members.filter(m => m.name.trim()).length} members, {chores.filter(c => c.title.trim()).length} chores, and {rewards.filter(r => r.name.trim()).length} rewards ready to go
                  </p>
                </div>
                <div className="funky-card bg-blue-50 p-4 text-left space-y-2">
                  <p className="body-font text-sm text-[#5E3B85]">💡 <strong>Next steps:</strong></p>
                  <ul className="body-font-light text-sm text-gray-700 space-y-1 ml-4">
                    <li>• Use ChoreAI to automatically assign chores</li>
                    <li>• Track progress on your dashboard</li>
                    <li>• Let kids redeem rewards from the store</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-between">
          <Button
            onClick={handleBack}
            variant="outline"
            disabled={currentStep === 0 || isSubmitting}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className="funky-button bg-[#2B59C3] text-white"
          >
            {isSubmitting ? (
              'Setting up...'
            ) : currentStep === 3 ? (
              <>
                <Check className="w-4 h-4 mr-2" /> Finish Setup
              </>
            ) : (
              <>
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}