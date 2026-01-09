import React from 'react';
import { Trophy, Crown, Medal, Award } from 'lucide-react';

const getRankIcon = (index) => {
  switch (index) {
    case 0: return <Crown className="w-5 h-5 text-yellow-500" />;
    case 1: return <Trophy className="w-5 h-5 text-gray-400" />;
    case 2: return <Medal className="w-5 h-5 text-amber-600" />;
    default: return <Award className="w-5 h-5 text-[#C3B1E1]" />;
  }
};

export default function LeaderboardCard({ personStats, title }) {
  return (
    <div className="funky-card p-6 border-4 border-[#FF6B35] bg-orange-50">
      <h3 className="header-font text-2xl text-[#2B59C3] mb-4">{title}</h3>
      <div className="space-y-3">
        {personStats.slice(0, 5).map((person, index) => (
          <div 
            key={person.id} 
            className={`flex items-center justify-between p-3 rounded-lg border-2 ${
              index === 0 ? 'bg-yellow-100 border-yellow-400' : 'bg-white border-[#5E3B85]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8">
                {getRankIcon(index)}
              </div>
              <div>
                <div className="body-font text-[#2B59C3]">{person.name}</div>
                <div className="body-font-light text-xs text-gray-600">
                  {person.completedAssignments} chores completed
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="header-font text-lg text-[#FF6B35]">{person.totalPoints}</div>
              <div className="body-font-light text-xs text-gray-600">points</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}