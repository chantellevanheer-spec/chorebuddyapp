import { useState, useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { calculateChorePoints } from '../lib/pointsCalculator';

export const useChoreManagement = () => {
  const { chores, assignments, updateAssignment, addReward, addCompletion } = useData();
  const [completedChoreId, setCompletedChoreId] = useState(null);
  const [pointsEarned, setPointsEarned] = useState({ visible: false, amount: 0, reason: '' });

  const completeChore = useCallback(async (assignmentId, choreId, notes = '', photoUrl = null, difficultyRating = null) => {
    // Get fresh data at the time of execution
    const assignment = assignments.find((a) => a.id === assignmentId);
    const chore = chores.find((c) => c.id === choreId);

    if (!assignment || !chore) return;

    // Calculate points with bonuses
    const points = calculateChorePoints(chore, assignment);

    // 1. Create ChoreCompletion record for difficulty learning
    await addCompletion({
      assignment_id: assignmentId,
      person_id: assignment.person_id,
      chore_id: choreId,
      completion_status: 'submitted',
      points_awarded: points,
      notes: notes || '',
      photo_url: photoUrl || '',
      difficulty_rating: difficultyRating || undefined
    });

    // 2. Mark assignment as complete
    await updateAssignment(assignmentId, {
      completed: true,
      completed_date: new Date().toISOString(),
      points_awarded: points,
      notes: notes || undefined,
      photo_url: photoUrl || undefined
    });

    // 3. Award points
    await addReward({
      person_id: assignment.person_id,
      chore_id: choreId,
      points: points,
      reward_type: "points",
      week_start: assignment.week_start,
      description: `Completed: ${chore.title}`
    });

    // 4. Show point notification
    setPointsEarned({
      visible: true,
      amount: points,
      reason: `${chore.title} completed!`
    });
    
    // 5. Trigger confetti
    setCompletedChoreId(choreId);
    setTimeout(() => {
      setCompletedChoreId(null);
      setPointsEarned({ visible: false, amount: 0, reason: '' });
    }, 4000);
  }, [assignments, chores, updateAssignment, addReward, addCompletion]);
  
  return { completeChore, completedChoreIdWithConfetti: completedChoreId, pointsEarned };
};