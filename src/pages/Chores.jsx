import React, { useState } from "react";
import { useData } from '../components/contexts/DataContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ClipboardList, Clock, Star, Edit, Trash2 } from "lucide-react";
import { CHORE_CATEGORY_COLORS, DIFFICULTY_STARS } from '@/components/lib/constants';
import { toast } from "sonner";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ChoreRecurrenceForm from "../components/chores/ChoreRecurrenceForm";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useSubscriptionAccess } from '../components/hooks/useSubscriptionAccess';
import LimitReachedModal from "../components/ui/LimitReachedModal";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Chores() {
  const { chores, loading, isProcessing, addChore, updateChore, deleteChore } = useData();
  const { hasReachedLimit, canAccess, getTierDisplayName, getRequiredTier, features } = useSubscriptionAccess();
  const [showForm, setShowForm] = useState(false);
  const [choreToEdit, setChoreToEdit] = useState(null);
  const [choreToDelete, setChoreToDelete] = useState(null);
  const [isLimitModalOpen, setLimitModalOpen] = useState(false);
  const getDefaultFormData = () => ({
    title: "",
    description: "",
    difficulty: "medium",
    frequency: "weekly",
    estimated_time: "",
    category: "other",
    is_recurring: false,
    recurrence_pattern: undefined,
    recurrence_day: undefined,
    recurrence_date: undefined,
    auto_assign: true,
    custom_points: "",
    requires_approval: false,
    photo_required: false
  });
  
  const [formData, setFormData] = useState(getDefaultFormData());

  const handleShowAddForm = () => {
    if (hasReachedLimit('max_chores')) {
      setLimitModalOpen(true);
    } else {
      setChoreToEdit(null);
      setFormData(getDefaultFormData());
      setShowForm(true);
    }
  };

  const handleShowEditForm = (chore) => {
    setChoreToEdit(chore);
    setFormData({
      ...chore,
      estimated_time: chore.estimated_time || "",
      is_recurring: chore.is_recurring || false,
      auto_assign: chore.auto_assign !== false, // Default to true if undefined/null
      recurrence_pattern: chore.recurrence_pattern || undefined,
      recurrence_day: chore.recurrence_day || undefined,
      recurrence_date: chore.recurrence_date || undefined,
      custom_points: chore.custom_points || "",
      requires_approval: chore.requires_approval || false,
      photo_required: chore.photo_required || false
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setChoreToEdit(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const choreData = {
      ...formData,
      estimated_time: formData.estimated_time ? parseInt(formData.estimated_time) : null,
      custom_points: formData.custom_points ? parseInt(formData.custom_points) : null
    };

    if (choreToEdit) {
      await updateChore(choreToEdit.id, choreData);
      toast.success("Chore updated!");
    } else {
      await addChore(choreData);
      toast.success("Chore added!");
    }
    handleCancel();
  };

  const handleDeleteConfirm = async () => {
    if (choreToDelete) {
      await deleteChore(choreToDelete.id);
      toast.success("Chore deleted.");
      setChoreToDelete(null);
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" message="Loading chores..." />;
  }

  return (
    <div className="mx-4 md:mx-8 lg:mx-24 pb-32 space-y-6 md:space-y-8 lg:pb-8">
      <ConfirmDialog
        isOpen={!!choreToDelete}
        onClose={() => setChoreToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Chore"
        message={`Are you sure you want to delete "${choreToDelete?.title}"? This will not affect past assignments.`}
        confirmText="Delete"
        cancelText="Keep"
      />

      <LimitReachedModal
        isOpen={isLimitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        limitType="max_chores"
        currentCount={chores.length}
        maxCount={features.max_chores}
        requiredTier={getTierDisplayName(getRequiredTier('max_chores'))}
      />

      {/* Header */}
      <div className="funky-card p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
            <div className="funky-button w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-[#FF6B35] flex items-center justify-center">
              <ClipboardList className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" />
            </div>
            <div className="flex-1">
              <p className="body-font text-base md:text-lg lg:text-xl text-[#F7A1C4]">Household</p>
              <h1 className="header-font text-3xl md:text-4xl lg:text-5xl text-[#2B59C3]">Chore Library</h1>
              <p className="body-font-light text-sm md:text-base text-gray-600 mt-1 md:mt-2">{chores.length} {chores.length === 1 ? 'chore' : 'chores'} in your library</p>
            </div>
          </div>
          <Button
            onClick={handleShowAddForm}
            className="funky-button bg-[#C3B1E1] text-white px-4 md:px-6 py-3 md:py-4 text-base md:text-lg lg:text-xl header-font w-full"
          >
            <Plus className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
            Add Chore
          </Button>
        </div>
      </div>

      {/* Add/Edit Chore Form */}
      {showForm && (
        <div className="funky-card p-6 md:p-8 border-4 border-[#FF6B35]">
          <h2 className="header-font text-2xl md:text-3xl text-[#2B59C3] mb-4 md:mb-6">
            {choreToEdit ? 'Edit Chore' : 'Add New Chore'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div>
              <label className="body-font text-base md:text-lg text-[#5E3B85] mb-2 block">Chore Title</label>
              <Input
                placeholder="e.g., 'Vacuum living room'"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="funky-button border-3 border-[#5E3B85] text-base md:text-lg p-3 md:p-4 body-font bg-white"
                required
              />
            </div>
            <div>
              <label className="body-font text-base md:text-lg text-[#5E3B85] mb-2 block">Description</label>
              <Textarea
                placeholder="Describe what needs to be done..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="funky-button border-3 border-[#5E3B85] p-3 md:p-4 h-20 md:h-24 body-font bg-white"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div>
                <label className="body-font text-base md:text-lg text-[#5E3B85] mb-2 block">Category</label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="funky-button border-3 border-[#5E3B85] body-font bg-white">
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
              </div>
              <div>
                <label className="body-font text-base md:text-lg text-[#5E3B85] mb-2 block">Difficulty</label>
                <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                  <SelectTrigger className="funky-button border-3 border-[#5E3B85] body-font bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="body-font text-base md:text-lg text-[#5E3B85] mb-2 block">Time (minutes)</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="30"
                  value={formData.estimated_time}
                  onChange={(e) => setFormData({ ...formData, estimated_time: e.target.value })}
                  className="funky-button border-3 border-[#5E3B85] body-font bg-white"
                />
              </div>
            </div>

            {/* Auto-assign toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto_assign"
                checked={formData.auto_assign}
                onCheckedChange={(checked) => setFormData({ ...formData, auto_assign: checked })}
                className="border-2 border-[#5E3B85]"
              />
              <Label htmlFor="auto_assign" className="body-font text-base text-[#5E3B85]">
                🤖 Let ChoreAI assign this chore automatically
              </Label>
            </div>

            {/* Premium Features */}
            {canAccess('advanced_chore_settings') ? (
              <div className="space-y-4 p-4 funky-card border-2 border-[#C3B1E1] bg-purple-50">
                <h3 className="header-font text-xl text-[#2B59C3]">⭐ Premium Features</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="body-font text-base text-[#5E3B85] mb-2 block">Custom Points</label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Leave empty for default points"
                      value={formData.custom_points}
                      onChange={(e) => setFormData({ ...formData, custom_points: e.target.value })}
                      className="funky-button border-2 border-[#5E3B85] body-font bg-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requires_approval"
                      checked={formData.requires_approval}
                      onCheckedChange={(checked) => setFormData({ ...formData, requires_approval: checked })}
                      className="border-2 border-[#5E3B85]"
                    />
                    <Label htmlFor="requires_approval" className="body-font text-base text-[#5E3B85]">
                      📋 Requires admin approval
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="photo_required"
                      checked={formData.photo_required}
                      onCheckedChange={(checked) => setFormData({ ...formData, photo_required: checked })}
                      className="border-2 border-[#5E3B85]"
                    />
                    <Label htmlFor="photo_required" className="body-font text-base text-[#5E3B85]">
                      📷 Requires photo proof
                    </Label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-4 funky-card border-2 border-gray-300 bg-gray-50">
                <h3 className="header-font text-xl text-gray-600">🔒 Premium Features</h3>
                <p className="body-font-light text-gray-500 text-sm">
                  Unlock custom points, approval workflows, and photo verification with a Premium subscription.
                </p>
                <Link to={createPageUrl('Pricing')}>
                  <Button className="funky-button bg-[#FF6B35] text-white px-4 py-2 text-sm header-font">
                    Upgrade to Premium
                  </Button>
                </Link>
              </div>
            )}

            {/* Recurrence Form - Only show for basic or higher */}
            {canAccess('recurring_chores') && (
              <ChoreRecurrenceForm formData={formData} setFormData={setFormData} />
            )}

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4">
              <Button
                type="button"
                onClick={handleCancel}
                disabled={isProcessing}
                className="funky-button flex-1 bg-gray-200 hover:bg-gray-300 text-[#5E3B85] border-3 border-[#5E3B85] py-3 md:py-4 header-font text-base md:text-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isProcessing || !formData.title.trim()}
                className="funky-button flex-1 bg-[#FF6B35] hover:bg-[#fa5a1f] text-white py-3 md:py-4 header-font text-base md:text-lg"
              >
                {isProcessing ? (
                  <>
                    <LoadingSpinner size="small" />
                    {choreToEdit ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  choreToEdit ? 'Save Changes' : 'Add Chore'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Chores Grid */}
      {chores.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {chores.map((chore) => (
            <div key={chore.id} className={`funky-card p-4 md:p-6 lg:p-8 border-4 relative group ${CHORE_CATEGORY_COLORS[chore.category] || CHORE_CATEGORY_COLORS.other}`}>
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleShowEditForm(chore)}
                  className="h-8 w-8 rounded-full hover:bg-black/10"
                >
                  <Edit className="w-4 h-4 text-[#5E3B85]" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setChoreToDelete(chore)}
                  className="h-8 w-8 rounded-full hover:bg-black/10"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>

              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 pr-16">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="header-font text-xl md:text-2xl text-[#2B59C3]">{chore.title}</h3>
                    {chore.is_recurring && (
                      <div className="funky-button px-3 py-1 bg-[#C3B1E1] border-2 border-[#5E3B85]">
                        <span className="body-font text-xs text-white">🔄 RECURRING</span>
                      </div>
                    )}
                    {!chore.auto_assign && (
                      <div className="funky-button px-3 py-1 bg-gray-200 border-2 border-gray-400">
                        <span className="body-font text-xs text-gray-600">MANUAL ONLY</span>
                      </div>
                    )}
                    {chore.requires_approval && (
                      <div className="funky-button px-3 py-1 bg-blue-100 border-2 border-blue-400">
                        <span className="body-font text-xs text-blue-700">📋 APPROVAL</span>
                      </div>
                    )}
                    {chore.photo_required && (
                      <div className="funky-button px-3 py-1 bg-green-100 border-2 border-green-400">
                        <span className="body-font text-xs text-green-700">📷 PHOTO</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mb-3 flex-wrap">
                    <div className="funky-button px-4 py-2 bg-white border-2 border-[#5E3B85]">
                      <span className="body-font text-sm text-[#5E3B85] capitalize">
                        {chore.category.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(DIFFICULTY_STARS[chore.difficulty])].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-500" />
                      ))}
                    </div>
                    {chore.custom_points && (
                      <div className="funky-button px-4 py-2 bg-white border-2 border-[#F7A1C4]">
                        <span className="body-font text-sm text-[#F7A1C4]">{chore.custom_points} pts</span>
                      </div>
                    )}
                  </div>
                </div>
                {chore.estimated_time && (
                  <div className="flex items-center gap-2 text-[#5E3B85] flex-shrink-0">
                    <Clock className="w-5 h-5" />
                    <span className="body-font text-lg">{chore.estimated_time} min</span>
                  </div>
                )}
              </div>
              {chore.description && (
                <p className="body-font-light text-base md:text-lg leading-relaxed">
                  {chore.description}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="funky-card p-6 md:p-12 text-center border-4 border-dashed border-[#FF6B35]">
          <ClipboardList className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-6 text-[#FF6B35]" />
          <h3 className="header-font text-2xl md:text-3xl text-[#2B59C3] mb-4">No chores created yet</h3>
          <p className="body-font-light text-gray-600 text-base md:text-lg mb-8 max-w-md mx-auto">
            Start by adding some chores that need to be done around the house
          </p>
          <Button
            onClick={handleShowAddForm}
            className="funky-button bg-[#FF6B35] text-white px-6 py-3 header-font text-lg md:text-xl"
          >
            <Plus className="w-5 h-5 md:w-6 md:h-6 mr-3" />
            Add Your First Chore
          </Button>
        </div>
      )}
    </div>
  );
}