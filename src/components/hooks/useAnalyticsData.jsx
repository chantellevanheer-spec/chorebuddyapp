/**
 * Custom hook for analytics data processing
 * Extracts complex calculations from ParentAnalytics component
 */
import { useMemo } from 'react';
import { 
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
  startOfQuarter, endOfQuarter, startOfYear, endOfYear, 
  eachWeekOfInterval, eachMonthOfInterval, 
  format, parseISO, isWithinInterval 
} from 'date-fns';

export const useAnalyticsData = (people, assignments, selectedPerson, timePeriod) => {
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (timePeriod) {
      case 'week':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarter':
        return { start: startOfQuarter(now), end: endOfQuarter(now) };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [timePeriod]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      if (!a.created_date) return false;
      const date = parseISO(a.created_date);
      const inRange = isWithinInterval(date, dateRange);
      const matchesPerson = selectedPerson === 'all' || a.person_id === selectedPerson;
      return inRange && matchesPerson;
    });
  }, [assignments, dateRange, selectedPerson]);

  const completionStats = useMemo(() => {
    const total = filteredAssignments.length;
    const completed = filteredAssignments.filter(a => a.completed).length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, rate };
  }, [filteredAssignments]);

  const trendData = useMemo(() => {
    if (timePeriod === 'week' || timePeriod === 'month') {
      const weeks = eachWeekOfInterval(dateRange);
      return weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart);
        const weekAssignments = assignments.filter(a => {
          if (!a.created_date) return false;
          const date = parseISO(a.created_date);
          return isWithinInterval(date, { start: weekStart, end: weekEnd }) &&
            (selectedPerson === 'all' || a.person_id === selectedPerson);
        });
        const completed = weekAssignments.filter(a => a.completed).length;
        const total = weekAssignments.length;
        return {
          date: format(weekStart, 'MMM d'),
          completed,
          pending: total - completed,
          rate: total > 0 ? Math.round((completed / total) * 100) : 0
        };
      });
    } else {
      const months = eachMonthOfInterval(dateRange);
      return months.map(monthStart => {
        const monthEnd = endOfMonth(monthStart);
        const monthAssignments = assignments.filter(a => {
          if (!a.created_date) return false;
          const date = parseISO(a.created_date);
          return isWithinInterval(date, { start: monthStart, end: monthEnd }) &&
            (selectedPerson === 'all' || a.person_id === selectedPerson);
        });
        const completed = monthAssignments.filter(a => a.completed).length;
        const total = monthAssignments.length;
        return {
          date: format(monthStart, 'MMM'),
          completed,
          pending: total - completed,
          rate: total > 0 ? Math.round((completed / total) * 100) : 0
        };
      });
    }
  }, [assignments, dateRange, timePeriod, selectedPerson]);

  const choreBreakdown = useMemo(() => {
    const breakdown = {};
    filteredAssignments.forEach(assignment => {
      const chore = assignment.chore_id;
      if (!breakdown[chore]) {
        breakdown[chore] = { completed: 0, total: 0 };
      }
      breakdown[chore].total++;
      if (assignment.completed) {
        breakdown[chore].completed++;
      }
    });
    
    return Object.entries(breakdown).map(([chore, stats]) => ({
      name: chore.substring(0, 15) + '...',
      completed: stats.completed,
      pending: stats.total - stats.completed
    })).slice(0, 8);
  }, [filteredAssignments]);

  const streakData = useMemo(() => {
    if (selectedPerson === 'all') {
      return people.map(person => {
        const personAssignments = assignments
          .filter(a => a.person_id === person.id)
          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        
        let currentStreak = 0;
        for (const assignment of personAssignments) {
          if (assignment.completed) {
            currentStreak++;
          } else {
            break;
          }
        }

        return {
          name: person.name,
          streak: currentStreak
        };
      });
    } else {
      const person = people.find(p => p.id === selectedPerson);
      if (!person) return [];
      
      const personAssignments = assignments
        .filter(a => a.person_id === selectedPerson)
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      
      let currentStreak = 0;
      for (const assignment of personAssignments) {
        if (assignment.completed) {
          currentStreak++;
        } else {
          break;
        }
      }

      return [{ name: person.name, streak: currentStreak }];
    }
  }, [people, assignments, selectedPerson]);

  return {
    dateRange,
    filteredAssignments,
    completionStats,
    trendData,
    choreBreakdown,
    streakData
  };
};