import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Award, Target, Flame } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, eachWeekOfInterval, eachMonthOfInterval, format, parseISO, isWithinInterval } from 'date-fns';

const COLORS = ['#2B59C3', '#FF6B35', '#C3B1E1', '#F7A1C4', '#4ADE80', '#FBBF24'];

export default function ParentAnalytics() {
  const { people = [], assignments = [], rewards = [], completions = [] } = useData();
  const [selectedPerson, setSelectedPerson] = useState('all');
  const [timePeriod, setTimePeriod] = useState('month');

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

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="funky-card p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h2 className="header-font text-3xl text-[#2B59C3] mb-2">Family Analytics</h2>
            <p className="body-font-light text-gray-600">Track progress and celebrate achievements</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Select value={selectedPerson} onValueChange={setSelectedPerson}>
              <SelectTrigger className="funky-button bg-white w-full sm:w-[180px]">
                <SelectValue placeholder="Select person" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Family Members</SelectItem>
                {people.map(person => (
                  <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="funky-button bg-white w-full sm:w-[150px]">
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="funky-card p-6 bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="body-font-light text-sm text-gray-600">Completion Rate</p>
              <p className="header-font text-3xl text-green-700">{completionStats.rate}%</p>
            </div>
          </div>
        </div>

        <div className="funky-card p-6 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-[#2B59C3] flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="body-font-light text-sm text-gray-600">Total Chores</p>
              <p className="header-font text-3xl text-[#2B59C3]">{completionStats.total}</p>
            </div>
          </div>
        </div>

        <div className="funky-card p-6 bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-[#C3B1E1] flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="body-font-light text-sm text-gray-600">Completed</p>
              <p className="header-font text-3xl text-[#5E3B85]">{completionStats.completed}</p>
            </div>
          </div>
        </div>

        <div className="funky-card p-6 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-[#FF6B35] flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="body-font-light text-sm text-gray-600">Best Streak</p>
              <p className="header-font text-3xl text-[#FF6B35]">
                {Math.max(...streakData.map(s => s.streak), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Trend */}
        <div className="funky-card p-6">
          <h3 className="header-font text-2xl text-[#2B59C3] mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Completion Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#C3B1E1" />
              <XAxis dataKey="date" className="body-font text-xs" />
              <YAxis className="body-font text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '3px solid #5E3B85',
                  borderRadius: '12px',
                  boxShadow: '4px 4px 0px #5E3B85'
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line type="monotone" dataKey="completed" stroke="#4ADE80" strokeWidth={3} name="Completed" />
              <Line type="monotone" dataKey="pending" stroke="#FF6B35" strokeWidth={3} name="Pending" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chore Breakdown */}
        <div className="funky-card p-6">
          <h3 className="header-font text-2xl text-[#2B59C3] mb-4">Chore Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={choreBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#C3B1E1" />
              <XAxis dataKey="name" className="body-font text-xs" angle={-45} textAnchor="end" height={80} />
              <YAxis className="body-font text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '3px solid #5E3B85',
                  borderRadius: '12px',
                  boxShadow: '4px 4px 0px #5E3B85'
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="completed" fill="#4ADE80" name="Completed" />
              <Bar dataKey="pending" fill="#FBBF24" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Streak Tracker */}
      <div className="funky-card p-6">
        <h3 className="header-font text-2xl text-[#2B59C3] mb-4 flex items-center gap-2">
          <Flame className="w-6 h-6 text-[#FF6B35]" />
          Current Streaks
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {streakData.map((person, idx) => (
            <div key={idx} className="funky-card p-4 bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center justify-between">
                <span className="body-font text-lg text-gray-800">{person.name}</span>
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#FF6B35]" />
                  <span className="header-font text-2xl text-[#FF6B35]">{person.streak}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}