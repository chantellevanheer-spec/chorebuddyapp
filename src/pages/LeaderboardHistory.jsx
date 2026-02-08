import React, { useState, useMemo } from 'react';
import { useData } from '../components/contexts/DataContext';
import { Trophy, Calendar, TrendingUp, Loader2, Medal, Crown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { AVATAR_COLORS } from '../components/lib/constants';

export default function LeaderboardHistory() {
  const { people, rewards, user, loading: dataLoading } = useData();
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [viewType, setViewType] = useState('monthly'); // 'monthly' or 'yearly'

  const { data: archives = [], isLoading: archivesLoading } = useQuery({
    queryKey: ['leaderboard_archives', user?.family_id],
    queryFn: async () => {
      if (!user?.family_id) return [];
      const all = await base44.entities.LeaderboardArchive.list('-period_start');
      return all.filter(item => item.family_id === user.family_id);
    },
    enabled: !!user?.family_id,
    initialData: []
  });

  const loading = dataLoading || archivesLoading;

  // Calculate current period rankings (memoized)
  const currentRankings = useMemo(() => {
    const now = new Date();
    let startDate, endDate;

    if (selectedPeriod === 'current_month') {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    } else {
      startDate = startOfYear(now);
      endDate = endOfYear(now);
    }

    const periodRewards = rewards.filter(r => {
      const rewardDate = new Date(r.created_date);
      return rewardDate >= startDate && rewardDate <= endDate;
    });

    const rankings = people.map(person => {
      const personRewards = periodRewards.filter(r => r.person_id === person.id);
      const totalPoints = personRewards.reduce((sum, r) => sum + (r.points || 0), 0);
      const choresCount = personRewards.filter(r => r.chore_id).length;

      return {
        person_id: person.id,
        person_name: person.name,
        avatar_color: person.avatar_color,
        total_points: totalPoints,
        chores_completed: choresCount
      };
    });

    rankings.sort((a, b) => b.total_points - a.total_points);
    rankings.forEach((r, index) => r.rank = index + 1);

    return rankings;
  }, [selectedPeriod, rewards, people]);

  // Get historical archives
  const monthlyArchives = archives.filter(a => a.period_type === 'monthly');
  const yearlyArchives = archives.filter(a => a.period_type === 'yearly');

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-400" />;
    return <span className="body-font text-xl text-gray-600">#{rank}</span>;
  };

  const RankingCard = ({ ranking, index, isArchive = false }) => {
    const person = people.find(p => p.id === ranking.person_id);
    const avatarColor = isArchive 
      ? AVATAR_COLORS[ranking.avatar_color] || 'bg-gray-200'
      : AVATAR_COLORS[person?.avatar_color] || 'bg-gray-200';

    return (
      <div className={`funky-card p-4 ${ranking.rank <= 3 ? 'bg-gradient-to-br from-yellow-50 to-orange-50' : 'bg-white'}`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12">
            {getRankIcon(ranking.rank)}
          </div>
          
          <div className={`funky-button w-12 h-12 rounded-full flex items-center justify-center ${avatarColor}`}>
            <span className="header-font text-xl text-white">
              {ranking.person_name.charAt(0).toUpperCase()}
            </span>
          </div>
          
          <div className="flex-1">
            <p className="body-font text-lg text-gray-800">{ranking.person_name}</p>
            <p className="body-font-light text-sm text-gray-600">
              {ranking.chores_completed} chores completed
            </p>
          </div>
          
          <div className="text-right">
            <p className="header-font text-2xl text-[#FF6B35]">{ranking.total_points}</p>
            <p className="body-font-light text-xs text-gray-500">points</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-[#C3B1E1]" />
      </div>
    );
  }

  return (
    <div className="mx-4 md:mx-8 lg:mx-24 pb-32 space-y-6 lg:pb-8">
      {/* Header */}
      <div className="funky-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="funky-button w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <Trophy className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <div>
              <h1 className="header-font text-4xl md:text-5xl text-[#2B59C3]">Leaderboard History</h1>
              <p className="body-font-light text-gray-600 mt-2">
                View past performance and achievements
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* View Type Toggle */}
      <div className="flex gap-4">
        <Select value={viewType} onValueChange={setViewType}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly View</SelectItem>
            <SelectItem value="yearly">Yearly View</SelectItem>
          </SelectContent>
        </Select>

        {viewType === 'monthly' && (
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Current Month</SelectItem>
              <SelectItem value="current_year">Current Year</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Current Period */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-[#FF6B35]" />
          <h2 className="header-font text-2xl text-[#2B59C3]">
            {selectedPeriod === 'current_month' ? 'This Month' : 'This Year'}
          </h2>
        </div>
        
        {currentRankings.length > 0 ? (
          <div className="space-y-3">
            {currentRankings.map((ranking, index) => (
              <RankingCard key={ranking.person_id} ranking={ranking} index={index} />
            ))}
          </div>
        ) : (
          <div className="funky-card p-8 text-center border-4 border-dashed border-gray-300">
            <p className="body-font-light text-gray-600">No data for this period yet</p>
          </div>
        )}
      </div>

      {/* Historical Archives */}
      {viewType === 'monthly' && monthlyArchives.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-[#C3B1E1]" />
            <h2 className="header-font text-2xl text-[#2B59C3]">Past Months</h2>
          </div>

          {monthlyArchives.map(archive => (
            <div key={archive.id} className="funky-card p-6 bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="header-font text-xl text-[#2B59C3]">
                  {format(new Date(archive.period_start), 'MMMM yyyy')}
                </h3>
                <div className="body-font text-sm text-gray-600">
                  Total: {archive.total_family_points} points
                </div>
              </div>
              
              <div className="space-y-3">
                {archive.rankings.map((ranking, index) => (
                  <RankingCard key={ranking.person_id} ranking={ranking} index={index} isArchive={true} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewType === 'yearly' && yearlyArchives.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-[#C3B1E1]" />
            <h2 className="header-font text-2xl text-[#2B59C3]">Past Years</h2>
          </div>

          {yearlyArchives.map(archive => (
            <div key={archive.id} className="funky-card p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="header-font text-xl text-[#2B59C3]">
                  {format(new Date(archive.period_start), 'yyyy')}
                </h3>
                <div className="body-font text-sm text-gray-600">
                  Total: {archive.total_family_points} points
                </div>
              </div>
              
              <div className="space-y-3">
                {archive.rankings.map((ranking, index) => (
                  <RankingCard key={ranking.person_id} ranking={ranking} index={index} isArchive={true} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {((viewType === 'monthly' && monthlyArchives.length === 0) || 
        (viewType === 'yearly' && yearlyArchives.length === 0)) && (
        <div className="funky-card p-12 text-center border-4 border-dashed border-gray-300">
          <Trophy className="w-20 h-20 mx-auto mb-6 text-gray-300" />
          <h3 className="header-font text-2xl text-gray-500 mb-4">No Historical Data</h3>
          <p className="body-font-light text-gray-400">
            Archives will appear here at the end of each {viewType === 'monthly' ? 'month' : 'year'}
          </p>
        </div>
      )}
    </div>
  );
}