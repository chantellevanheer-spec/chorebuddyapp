import { useState } from 'react';
import { useData } from '../contexts/DataContext';

export const useChoreManagement = () => {
  const { chores, assignments, updateAssignment, addReward } = useData();
  const [completedChoreId, setCompletedChoreId] = useState(null);

  const completeChore = async (assignmentId, choreId) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    const chore = chores.find((c) => c.id === choreId);

    if (!assignment || !chore) return;

    // 1. Mark assignment as complete
    await updateAssignment(assignmentId, {
      completed: true,
      completed_date: new Date().toISOString()
    });

    // 2. Award points
    const pointMap = { easy: 10, medium: 20, hard: 30 };
    const points = chore.custom_points || pointMap[chore.difficulty] || 15;

    await addReward({
      person_id: assignment.person_id,
      chore_id: choreId,
      points: points,
      reward_type: "points",
      week_start: assignment.week_start
    });
    
    // 3. Trigger confetti
    setCompletedChoreId(choreId);
    setTimeout(() => setCompletedChoreId(null), 4000); // Confetti lasts for 4 seconds
  };
  
  return { completeChore, completedChoreIdWithConfetti: completedChoreId };
};