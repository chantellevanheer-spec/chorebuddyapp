import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Flame } from 'lucide-react';

const CHART_STYLE = {
  backgroundColor: 'white', 
  border: '3px solid #5E3B85',
  borderRadius: '12px',
  boxShadow: '4px 4px 0px #5E3B85'
};

export default function AnalyticsCharts({ trendData, choreBreakdown, streakData }) {
  return (
    <>
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
              <Tooltip contentStyle={CHART_STYLE} />
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
              <Tooltip contentStyle={CHART_STYLE} />
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
    </>
  );
}