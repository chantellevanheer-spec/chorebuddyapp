import React, { useState, useMemo, useCallback } from "react";
import { smartAssignChores } from "@/functions/smartAssignChores";
import { format, startOfWeek } from "date-fns";
import { useData } from '../components/contexts/DataContext';
import { toast } from "sonner";
import { User } from '@/entities/User';

import { useSubscriptionAccess } from '../components/hooks/useSubscriptionAccess';
import { useChoreManagement } from '../components/hooks/useChoreManagement';
import UpgradeModal from "../components/ui/UpgradeModal";

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
      const result = await smartAssignChores();
      
      if (result.status && result.status >= 400) {
        toast.error(result?.data?.error || "Failed to assign chores.");
      } else {
        await fetchData(); // Refresh data after successful assignment
        toast.success(`ChoreAI successfully created ${result?.data?.created || 0} new assignments!`);
      }
    } catch (error) {
      console.error("Error assigning chores:", error);
      toast.error("An unexpected error occurred while assigning chores.");
    } finally {
        setIsAssigning(false);
    }
  }, [canAccess, fetchData]);

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