import React, { useState, useMemo } from "react";
import { useData } from '../components/contexts/DataContext';
import { Button } from "@/components/ui/button";
import { Plus, Users, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import PersonCard from "../components/people/PersonCard";
import PersonFormModal from "../components/people/PersonFormModal";
import FamilyInviteModal from "../components/people/FamilyInviteModal";
import LinkAccountModal from "../components/people/LinkAccountModal";
import { useSubscriptionAccess } from '../components/hooks/useSubscriptionAccess';
import LimitReachedModal from "../components/ui/LimitReachedModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { linkUserToPerson } from '@/functions/linkUserToPerson';

export default function People() {
  const { people, assignments, user, loading, isProcessing, addPerson, updatePerson, deletePerson } = useData();
  const { hasReachedLimit, getTierDisplayName, getRequiredTier, canAccess, features } = useSubscriptionAccess();
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState(null);
  const [personToDelete, setPersonToDelete] = useState(null);
  const [isLimitModalOpen, setLimitModalOpen] = useState(false);
  const [isLinkModalOpen, setLinkModalOpen] = useState(false);
  const [personToLink, setPersonToLink] = useState(null);
  const [isLinking, setIsLinking] = useState(false);

  const personStats = useMemo(() => {
    const stats = {};
    people.forEach((p) => {
      const personAssignments = assignments.filter((a) => a.person_id === p.id);
      stats[p.id] = {
        completed: personAssignments.filter((a) => a.completed).length,
        current: personAssignments.filter((a) => !a.completed).length
      };
    });
    return stats;
  }, [people, assignments]);

  const handleShowAddForm = () => {
    if (hasReachedLimit('max_family_members')) {
      setLimitModalOpen(true);
    } else {
      setPersonToEdit(null);
      setFormModalOpen(true);
    }
  };

  const handleShowEditForm = (person) => {
    setPersonToEdit(person);
    setFormModalOpen(true);
  };

  const handleCloseModal = () => {
    setFormModalOpen(false);
    setPersonToEdit(null);
  };

  const handleSubmit = async (personData) => {
    if (personToEdit) {
      await updatePerson(personToEdit.id, personData);
      toast.success("Family member updated!");
    } else {
      await addPerson(personData);
      toast.success("New family member added!");
    }
    handleCloseModal();
  };

  const handleDeleteConfirm = async () => {
    if (personToDelete) {
      await deletePerson(personToDelete.id);
      toast.success("Family member deleted.");
      setPersonToDelete(null);
    }
  };

  const handleShowInviteModal = () => {
    if (user?.family_role !== 'parent') {
      toast.error('Only parents/guardians can invite family members');
      return;
    }
    if (canAccess('family_invitations')) {
      setInviteModalOpen(true);
    }
  };

  const handleInviteSuccess = () => {
    // Refresh data after successful invitation
    // The actual person record will be created when they accept the invitation
    // For now, simply close the modal
    setInviteModalOpen(false);
  };

  const handleShowLinkModal = (person) => {
    if (user?.family_role !== 'parent') {
      toast.error('Only parents/guardians can link accounts');
      return;
    }
    setPersonToLink(person);
    setLinkModalOpen(true);
  };

  const handleLinkAccount = async (personId) => {
    setIsLinking(true);
    try {
      const { error } = await linkUserToPerson({ personId });
      if (error) {
        toast.error(error.message || 'Failed to link account');
      } else {
        toast.success('Account linked successfully!');
        setLinkModalOpen(false);
        setPersonToLink(null);
        // Refresh page to update UI
        window.location.reload();
      }
    } catch (error) {
      toast.error('Failed to link account');
    } finally {
      setIsLinking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="funky-card p-6 md:p-8 text-center"><Loader2 className="w-8 h-8 md:w-12 md:h-12 animate-spin text-[#C3B1E1] mx-auto mb-4" /><p className="body-font text-base md:text-lg text-gray-600">Loading family members...</p></div>
      </div>);

  }

  return (
    <div className="mx-1 my-1 pb-10 md:mx-8 lg:mx-20 space-y-6 md:space-y-8 lg:pb-8">
      <LimitReachedModal
        isOpen={isLimitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        limitType="max_family_members"
        currentCount={people.length}
        maxCount={features.max_family_members}
        requiredTier={getTierDisplayName(getRequiredTier('max_family_members'))} />

      <PersonFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        personToEdit={personToEdit}
        isProcessing={isProcessing}
        currentUser={user}
        peopleCount={people.length} />

      <FamilyInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onSuccess={handleInviteSuccess} />

      <LinkAccountModal
        isOpen={isLinkModalOpen}
        onClose={() => {
          setLinkModalOpen(false);
          setPersonToLink(null);
        }}
        people={personToLink ? [personToLink] : people}
        onLink={handleLinkAccount}
        isProcessing={isLinking} />

      <ConfirmDialog
        isOpen={!!personToDelete}
        onClose={() => setPersonToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Family Member"
        message={`Are you sure you want to delete ${personToDelete?.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel" />


      <div className="funky-card p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
            <div className="funky-button w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-[#F7A1C4] flex items-center justify-center"><Users className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" /></div>
            <div className="flex-1">
              <p className="body-font text-base md:text-lg lg:text-xl text-[#FF6B35]">Household</p>
              <h1 className="header-font text-3xl md:text-4xl lg:text-5xl text-[#2B59C3]">Family Members</h1>
              <p className="body-font-light text-sm md:text-base text-gray-600 mt-1 md:mt-2">{people.length} {people.length === 1 ? 'member' : 'members'} in your family</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 w-full">
            {user?.family_role === 'parent' && canAccess('family_invitations') &&
            <Button
              onClick={handleShowInviteModal}
              className="funky-button bg-[#C3B1E1] text-white px-4 md:px-6 py-3 md:py-4 text-base md:text-lg lg:text-xl header-font w-full">

                <Mail className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                Invite Member
              </Button>
            }
            <Button
              onClick={handleShowAddForm}
              className="funky-button bg-[#F7A1C4] text-pink-800 px-4 md:px-6 py-3 md:py-4 text-base md:text-lg lg:text-xl header-font w-full">

              <Plus className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
              Add Person
            </Button>
          </div>
        </div>
      </div>

      {people.length > 0 ?
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {people.map((person) =>
        <PersonCard
          key={person.id}
          person={person}
          completedChores={personStats[person.id]?.completed || 0}
          currentChores={personStats[person.id]?.current || 0}
          onEdit={handleShowEditForm}
          onDelete={() => setPersonToDelete(person)}
          onLinkAccount={handleShowLinkModal}
          canManageLinks={user?.family_role === 'parent'} />

        )}
        </div> :

      <div className="funky-card p-8 md:p-12 text-center border-4 border-dashed border-[#F7A1C4] bg-pink-50">
          <div className="mb-6 md:mb-8"><Users className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 text-[#F7A1C4]" /><h3 className="header-font text-2xl md:text-3xl text-[#2B59C3] mb-3 md:mb-4">No family members yet</h3><p className="body-font-light text-base md:text-lg mb-2 max-w-md mx-auto">Add people to your household to get started with chore assignments</p><p className="body-font text-sm text-[#5E3B85] mb-6 md:mb-8">💡 Tip: Start with adults, then add teens and children</p></div>
          <Button onClick={handleShowAddForm} className="funky-button bg-[#F7A1C4] text-white px-6 md:px-8 py-3 md:py-4 header-font text-lg md:text-xl"><Plus className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />Add Your First Person</Button>
        </div>
      }
    </div>);

}