import React, { useState, useMemo, useCallback } from "react";
import { smartAssignChores } from "@/functions/smartAssignChores";
import { format, startOfWeek, addDays } from "date-fns";
import { useData } from '../components/contexts/DataContext';
import { toast } from "sonner";
import { User } from '@/entities/User';
import { Assignment } from "@/entities/Assignment";
import { Chore } from "@/entities/Chore";

import { useSubscriptionAccess } from '../components/hooks/useSubscriptionAccess';
import { useChoreManagement } from '../components/hooks/useChoreManagement';
import UpgradeModal from "../components/ui/UpgradeModal";
import AssignmentPreview from "../components/admin/AssignmentPreview";
import ReassignModal from "../components/chores/ReassignModal";

import Confetti from "../components/ui/Confetti";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import QuickActions from "../components/dashboard/QuickActions";
import DashboardStats from "../components/dashboard/DashboardStats";
import ChoresSection from "../components/dashboard/ChoresSection";
import DashboardEmptyState from "../components/dashboard/DashboardEmptyState";
import DashboardSummary from "../components/dashboard/DashboardSummary";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { assignments, chores, people, user, loading, fetchData } = useData();
  const { canAccess, getRequiredTier, getTierDisplayName } = useSubscriptionAccess();
  const { completeChore, completedChoreIdWithConfetti } = useChoreManagement();
  
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewAssignments, setPreviewAssignments] = useState([]);
  const [isReassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignData, setReassignData] = useState(null);

  const currentWeekAssignments = useMemo(() => {
    const currentWeek = format(startOfWeek(new Date()), "yyyy-MM-dd");
    return assignments.filter((assignment) => assignment.week_start === currentWeek);
  }, [assignments]);

  const assignChoresForWeek = useCallback(async () => {
    if (!canAccess('choreai_smart_assignment')) {
      setUpgradeModalOpen(true);
      return;
    }
    setIsAssigning(true);
    try {
      const result = await smartAssignChores({ preview: true });
      
      if (result.status && result.status >= 400) {
        toast.error(result?.data?.error || "Failed to assign chores.");
        setIsAssigning(false);
      } else if (result.data.preview && result.data.assignments) {
        setPreviewAssignments(result.data.assignments);
        setShowPreview(true);
      } else {
        await fetchData();
        toast.success(`ChoreAI successfully created ${result?.data?.created || 0} new assignments!`);
        setIsAssigning(false);
      }
    } catch (error) {
      console.error("Error assigning chores:", error);
      toast.error("An unexpected error occurred while assigning chores.");
      setIsAssigning(false);
    }
  }, [canAccess, fetchData]);

  const handleConfirmAssignments = async (assignments) => {
    setIsAssigning(true);
    try {
      await Promise.all(
        assignments.map(a => Assignment.create(a))
      );

      const rotationUpdates = assignments
        .filter(a => a.rotation_update)
        .map(a => ({
          id: a.chore_id,
          rotation_current_index: a.rotation_update.newIndex,
          rotation_last_assigned_date: a.rotation_update.date
        }));

      if (rotationUpdates.length > 0) {
        await Promise.all(
          rotationUpdates.map(update => 
            Chore.update(update.id, {
              rotation_current_index: update.rotation_current_index,
              rotation_last_assigned_date: update.rotation_last_assigned_date
            })
          )
        );
      }

      toast.success(`Successfully assigned ${assignments.length} chores!`);
      setShowPreview(false);
      setPreviewAssignments([]);
      await fetchData();
    } catch (error) {
      console.error("Error confirming assignments:", error);
      toast.error("Failed to create assignments. Please try again.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleReassignFromPreview = (assignment, currentPerson) => {
    const chore = chores.find(c => c.id === assignment.chore_id);
    setReassignData({ assignment, chore, currentPerson });
    setReassignModalOpen(true);
  };

  const handleReassignConfirm = (assignmentId, newPersonId) => {
    setPreviewAssignments(prev =>
      prev.map(a =>
        a.chore_id === reassignData.assignment.chore_id
          ? { ...a, person_id: newPersonId }
          : a
      )
    );
    setReassignModalOpen(false);
    setReassignData(null);
    toast.success("Assignment updated!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 md:w-16 md:h-16 animate-spin text-[#C3B1E1]" />
      </div>
    );
  }

  const pendingAssignments = currentWeekAssignments.filter((a) => !a.completed);
  const completedAssignments = currentWeekAssignments.filter((a) => a.completed);

  return (
    <div className="min-h-screen relative">
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureName="ChoreAI Smart Assignment"
        requiredTier={getTierDisplayName(getRequiredTier('choreai_smart_assignment'))}
      />

      {showPreview && (
        <AssignmentPreview
          proposedAssignments={previewAssignments}
          onConfirm={handleConfirmAssignments}
          onCancel={() => {
            setShowPreview(false);
            setPreviewAssignments([]);
            setIsAssigning(false);
          }}
          onReassign={handleReassignFromPreview}
        />
      )}

      {isReassignModalOpen && reassignData && (
        <ReassignModal
          isOpen={isReassignModalOpen}
          onClose={() => {
            setReassignModalOpen(false);
            setReassignData(null);
          }}
          onReassign={handleReassignConfirm}
          assignment={reassignData.assignment}
          chore={reassignData.chore}
          currentPerson={reassignData.currentPerson}
          people={people}
          isProcessing={false}
        />
      )}

      {completedChoreIdWithConfetti && <Confetti />}
      
      <div className="mx-4 md:mx-8 lg:mx-20 pb-32 lg:pb-8">
        <DashboardHeader
          assignChoresForWeek={assignChoresForWeek}
          isAssigning={isAssigning} />

        <QuickActions />

        <DashboardStats
          currentWeekAssignments={currentWeekAssignments}
          completedAssignments={completedAssignments}
          pendingAssignments={pendingAssignments}
          people={people} />

        <ChoresSection
          pendingAssignments={pendingAssignments}
          completedAssignments={completedAssignments}
          chores={chores}
          people={people}
          completeChore={completeChore}
          user={user} />

        <DashboardEmptyState
          currentWeekAssignments={currentWeekAssignments}
          people={people}
          chores={chores}
          user={user} />

        <DashboardSummary
          currentWeekAssignments={currentWeekAssignments}
          assignments={assignments}
          people={people}
          chores={chores} />
      </div>
    </div>
  );
}