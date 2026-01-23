import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { calculateChorePoints } from '../lib/pointsCalculator';

export const useChoreManagement = () => {
  const { chores, assignments, updateAssignment, addReward } = useData();
  const [completedChoreId, setCompletedChoreId] = useState(null);
  const [pointsEarned, setPointsEarned] = useState({ visible: false, amount: 0, reason: '' });

  const completeChore = async (assignmentId, choreId) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    const chore = chores.find((c) => c.id === choreId);

    if (!assignment || !chore) return;

    // Calculate points with bonuses
    const points = calculateChorePoints(chore, assignment);

    // 1. Mark assignment as complete
    await updateAssignment(assignmentId, {
      completed: true,
      completed_date: new Date().toISOString(),
      points_awarded: points
    });

    // 2. Award points
    await addReward({
      person_id: assignment.person_id,
      chore_id: choreId,
      points: points,
      reward_type: "points",
      week_start: assignment.week_start,
      description: `Completed: ${chore.title}`
    });

    // 3. Show point notification
    setPointsEarned({
      visible: true,
      amount: points,
      reason: `${chore.title} completed!`
    });
    
    // 4. Trigger confetti
    setCompletedChoreId(choreId);
    setTimeout(() => {
      setCompletedChoreId(null);
      setPointsEarned({ visible: false, amount: 0, reason: '' });
    }, 4000);
  };
  
  return { completeChore, completedChoreIdWithConfetti: completedChoreId, pointsEarned };
};