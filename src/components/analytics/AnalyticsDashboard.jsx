import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Clock, AlertCircle, Award } from 'lucide-react';

const COLORS = ['#2B59C3', '#FF6B35', '#C3B1E1', '#F7A1C4', '#5E3B85'];

export default function AnalyticsDashboard() {
  const { assignments, chores, people } = useData();

  // Peak completion times analysis
  const completionTimeData = useMemo(() => {
    const hourCounts = Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 }));
    
    assignments
      .filter(a => a.completed && a.completed_date)
      .forEach(a => {
        const hour = new Date(a.completed_date).getHours();
        hourCounts[hour].count++;
      });

    return hourCounts
      .filter(h => h.count > 0)
      .map(h => ({
        time: `${h.hour}:00`,
        completions: h.count
      }));
  }, [assignments]);

  // Bottleneck chores (low completion rate)
  const bottleneckChores = useMemo(() => {
    const choreStats = chores.map(chore => {
      const choreAssignments = assignments.filter(a => a.chore_id === chore.id);
      const completed = choreAssignments.filter(a => a.completed).length;
      const total = choreAssignments.length;
      const completionRate = total > 0 ? (completed / total) * 100 : 100;

      return {
        title: chore.title,
        completionRate: Math.round(completionRate),
        total,
        difficulty: chore.difficulty
      };
    });

    return choreStats
      .filter(c => c.total >= 3 && c.completionRate < 60)
      .sort((a, b) => a.completionRate - b.completionRate)
      .slice(0, 5);
  }, [chores, assignments]);

  // Chore distribution by category
  const categoryData = useMemo(() => {
    const categoryCounts = {};
    
    chores.forEach(chore => {
      categoryCounts[chore.category] = (categoryCounts[chore.category] || 0) + 1;
    });

    return Object.entries(categoryCounts).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value
    }));
  }, [chores]);

  // Average completion time by difficulty
  const difficultyTimeData = useMemo(() => {
    const stats = { easy: [], medium: [], hard: [] };
    
    assignments
      .filter(a => a.completed && a.completed_date && a.created_date)
      .forEach(a => {
        const chore = chores.find(c => c.id === a.chore_id);
        if (chore?.difficulty) {
          const timeToComplete = (new Date(a.completed_date) - new Date(a.created_date)) / (1000 * 60 * 60); // hours
          stats[chore.difficulty].push(timeToComplete);
        }
      });

    return ['easy', 'medium', 'hard'].map(diff => ({
      difficulty: diff,
      avgHours: stats[diff].length > 0 
        ? (stats[diff].reduce((a, b) => a + b, 0) / stats[diff].length).toFixed(1)
        : 0
    }));
  }, [assignments, chores]);

  return (
    <div className="space-y-8">
      {/* Peak Completion Times */}
      <div className="funky-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-6 h-6 text-[#2B59C3]" />
          <h3 className="header-font text-2xl text-[#2B59C3]">Peak Completion Times</h3>
        </div>
        {completionTimeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={completionTimeData}>
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completions" fill="#2B59C3" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="body-font-light text-gray-500 text-center py-8">
            Complete more chores to see peak times
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bottleneck Chores */}
        <div className="funky-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h3 className="header-font text-2xl text-[#2B59C3]">Challenging Chores</h3>
          </div>
          {bottleneckChores.length > 0 ? (
            <div className="space-y-3">
              {bottleneckChores.map((chore, idx) => (
                <div key={idx} className="funky-card p-4 bg-red-50 border-2 border-red-200">
                  <div className="flex justify-between items-start mb-2">
                    <p className="body-font text-sm">{chore.title}</p>
                    <span className="funky-button px-2 py-1 bg-red-200 text-red-800 text-xs">
                      {chore.completionRate}%
                    </span>
                  </div>
                  <div className="w-full bg-red-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all"
                      style={{ width: `${chore.completionRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="body-font-light text-gray-500 text-center py-8">
              All chores are being completed well! 🎉
            </p>
          )}
        </div>

        {/* Category Distribution */}
        <div className="funky-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-6 h-6 text-[#FF6B35]" />
            <h3 className="header-font text-2xl text-[#2B59C3]">Chore Categories</h3>
          </div>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={(entry) => entry.name}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {categoryData.map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="body-font-light text-xs capitalize">{cat.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="body-font-light text-gray-500 text-center py-8">
              Add chores to see distribution
            </p>
          )}
        </div>
      </div>

      {/* Time Analysis */}
      <div className="funky-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-green-500" />
          <h3 className="header-font text-2xl text-[#2B59C3]">Average Time to Complete</h3>
        </div>
        {difficultyTimeData.some(d => d.avgHours > 0) ? (
          <div className="grid grid-cols-3 gap-4">
            {difficultyTimeData.map((data) => (
              <div key={data.difficulty} className="text-center">
                <div className="funky-button h-24 bg-gradient-to-b from-[#C3B1E1] to-[#F7A1C4] flex items-center justify-center mb-2">
                  <span className="header-font text-3xl text-white">
                    {data.avgHours}h
                  </span>
                </div>
                <p className="body-font text-sm capitalize">{data.difficulty}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="body-font-light text-gray-500 text-center py-8">
            Complete more chores to see timing patterns
          </p>
        )}
      </div>
    </div>
  );
}