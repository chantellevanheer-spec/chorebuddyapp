import { differenceInDays, parseISO } from 'date-fns';

/**
 * Calculate points for completing a chore with bonuses
 */
export function calculateChorePoints(chore, assignment) {
  // Base points by difficulty
  const basePoints = {
    easy: 10,
    medium: 20,
    hard: 30
  }[chore.difficulty] || 15;

  let points = basePoints;

  // Custom points override
  if (chore.custom_points && chore.custom_points > 0) {
    points = chore.custom_points;
  }

  // Priority bonus
  const priorityMultiplier = {
    low: 1,
    medium: 1.2,
    high: 1.5
  }[chore.priority] || 1;

  points = Math.round(points * priorityMultiplier);

  // Early completion bonus
  if (assignment.due_date && chore.early_completion_bonus) {
    const dueDate = parseISO(assignment.due_date);
    const now = new Date();
    const daysEarly = differenceInDays(dueDate, now);
    
    if (daysEarly > 0) {
      points = Math.round(points * chore.early_completion_bonus);
    }
  }

  return points;
}

/**
 * Calculate total points for a person from rewards
 */
export function calculateTotalPoints(rewards, personId) {
  return rewards
    .filter(r => r.person_id === personId)
    .reduce((sum, r) => sum + (r.points || 0), 0);
}

/**
 * Calculate achievements for a person
 */
export function calculateAchievements(assignments, rewards, personId) {
  const achievements = [];
  const completedAssignments = assignments.filter(
    a => a.person_id === personId && a.completed
  );
  const totalChores = completedAssignments.length;

  // First chore
  if (totalChores >= 1) {
    achievements.push({ type: 'first_chore', unlocked: true });
  }

  // Milestone achievements
  if (totalChores >= 10) achievements.push({ type: 'complete_10', unlocked: true });
  if (totalChores >= 50) achievements.push({ type: 'complete_50', unlocked: true });
  if (totalChores >= 100) achievements.push({ type: 'complete_100', unlocked: true });

  // Calculate streak
  const sortedAssignments = completedAssignments
    .sort((a, b) => new Date(b.completed_date) - new Date(a.completed_date));

  let currentStreak = 0;
  let lastDate = null;

  for (const assignment of sortedAssignments) {
    if (!assignment.completed_date) continue;
    
    const currentDate = parseISO(assignment.completed_date);
    
    if (!lastDate) {
      currentStreak = 1;
      lastDate = currentDate;
    } else {
      const daysDiff = differenceInDays(lastDate, currentDate);
      if (daysDiff <= 1) {
        currentStreak++;
        lastDate = currentDate;
      } else {
        break;
      }
    }
  }

  // Streak achievements
  if (currentStreak >= 3) achievements.push({ type: 'streak_3', unlocked: true });
  if (currentStreak >= 7) achievements.push({ type: 'streak_7', unlocked: true });
  if (currentStreak >= 30) achievements.push({ type: 'streak_30', unlocked: true });

  return { achievements, currentStreak };
}