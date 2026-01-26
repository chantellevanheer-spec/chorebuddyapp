import React from 'react';
import { Calendar, Target, Award, Flame } from 'lucide-react';

export default function AnalyticsStats({ stats, bestStreak }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="funky-card p-6 bg-gradient-to-br from-green-50 to-green-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="body-font-light text-sm text-gray-600">Completion Rate</p>
            <p className="header-font text-3xl text-green-700">{stats.rate}%</p>
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
            <p className="header-font text-3xl text-[#2B59C3]">{stats.total}</p>
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
            <p className="header-font text-3xl text-[#5E3B85]">{stats.completed}</p>
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
            <p className="header-font text-3xl text-[#FF6B35]">{bestStreak}</p>
          </div>
        </div>
      </div>
    </div>
  );
}