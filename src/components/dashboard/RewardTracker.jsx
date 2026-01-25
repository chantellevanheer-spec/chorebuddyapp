import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Gift, TrendingUp, Star, Award } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from 'date-fns';

const COLORS = ['#2B59C3', '#FF6B35', '#C3B1E1', '#F7A1C4', '#4ADE80', '#FBBF24'];

export default function RewardTracker() {
  const { people, rewards, items } = useData();
  const [selectedPerson, setSelectedPerson] = useState('all');

  const filteredRewards = useMemo(() => {
    return rewards.filter(r => selectedPerson === 'all' || r.person_id === selectedPerson);
  }, [rewards, selectedPerson]);

  const rewardStats = useMemo(() => {
    const totalEarned = filteredRewards
      .filter(r => r.points > 0)
      .reduce((sum, r) => sum + r.points, 0);
    
    const totalSpent = Math.abs(
      filteredRewards
        .filter(r => r.points < 0)
        .reduce((sum, r) => sum + r.points, 0)
    );

    const currentBalance = totalEarned - totalSpent;

    return { totalEarned, totalSpent, currentBalance };
  }, [filteredRewards]);

  const redemptionHistory = useMemo(() => {
    return filteredRewards
      .filter(r => r.reward_type === 'redemption' && r.redeemable_item_id)
      .map(r => {
        const item = items.find(i => i.id === r.redeemable_item_id);
        const person = people.find(p => p.id === r.person_id);
        return {
          ...r,
          itemName: item?.name || 'Unknown Item',
          personName: person?.name || 'Unknown',
          date: r.created_date ? format(parseISO(r.created_date), 'MMM d, yyyy') : 'Unknown date'
        };
      })
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 10);
  }, [filteredRewards, items, people]);

  const popularRewards = useMemo(() => {
    const redemptions = filteredRewards.filter(r => r.reward_type === 'redemption' && r.redeemable_item_id);
    const itemCounts = {};

    redemptions.forEach(r => {
      const itemId = r.redeemable_item_id;
      itemCounts[itemId] = (itemCounts[itemId] || 0) + 1;
    });

    return Object.entries(itemCounts)
      .map(([itemId, count]) => {
        const item = items.find(i => i.id === itemId);
        return {
          name: item?.name || 'Unknown',
          count,
          cost: item?.cost || 0
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredRewards, items]);

  const pointsBreakdown = useMemo(() => {
    if (selectedPerson === 'all') {
      return people.map(person => {
        const personRewards = rewards.filter(r => r.person_id === person.id);
        const earned = personRewards.filter(r => r.points > 0).reduce((sum, r) => sum + r.points, 0);
        const spent = Math.abs(personRewards.filter(r => r.points < 0).reduce((sum, r) => sum + r.points, 0));
        return {
          name: person.name,
          earned,
          spent,
          balance: earned - spent
        };
      });
    }
    return [];
  }, [people, rewards, selectedPerson]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="funky-card p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h2 className="header-font text-3xl text-[#2B59C3] mb-2 flex items-center gap-3">
              <Gift className="w-8 h-8 text-[#FF6B35]" />
              Reward Tracker
            </h2>
            <p className="body-font-light text-gray-600">Monitor points and redemptions</p>
          </div>
          <Select value={selectedPerson} onValueChange={setSelectedPerson}>
            <SelectTrigger className="funky-button bg-white w-full md:w-[200px]">
              <SelectValue placeholder="Select person" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Family Members</SelectItem>
              {people.map(person => (
                <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Points Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="funky-card p-6 bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="body-font-light text-sm text-gray-600">Total Earned</p>
              <p className="header-font text-3xl text-green-700">{rewardStats.totalEarned}</p>
            </div>
          </div>
        </div>

        <div className="funky-card p-6 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-[#FF6B35] flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="body-font-light text-sm text-gray-600">Total Spent</p>
              <p className="header-font text-3xl text-[#FF6B35]">{rewardStats.totalSpent}</p>
            </div>
          </div>
        </div>

        <div className="funky-card p-6 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-[#2B59C3] flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="body-font-light text-sm text-gray-600">Current Balance</p>
              <p className="header-font text-3xl text-[#2B59C3]">{rewardStats.currentBalance}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {selectedPerson === 'all' && pointsBreakdown.length > 0 && (
        <div className="funky-card p-6">
          <h3 className="header-font text-2xl text-[#2B59C3] mb-4">Points by Family Member</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pointsBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#C3B1E1" />
              <XAxis dataKey="name" className="body-font text-xs" />
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
              <Bar dataKey="earned" fill="#4ADE80" name="Earned" />
              <Bar dataKey="spent" fill="#FF6B35" name="Spent" />
              <Bar dataKey="balance" fill="#2B59C3" name="Balance" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Popular Rewards */}
      {popularRewards.length > 0 && (
        <div className="funky-card p-6">
          <h3 className="header-font text-2xl text-[#2B59C3] mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-[#FBBF24]" />
            Most Popular Rewards
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularRewards.map((reward, idx) => (
              <div key={idx} className="funky-card p-4 bg-gradient-to-br from-yellow-50 to-yellow-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="body-font text-lg text-gray-800">{reward.name}</span>
                  <span className="header-font text-2xl text-[#FBBF24]">{reward.count}x</span>
                </div>
                <p className="body-font-light text-sm text-gray-600">{reward.cost} points each</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Redemptions */}
      {redemptionHistory.length > 0 && (
        <div className="funky-card p-6">
          <h3 className="header-font text-2xl text-[#2B59C3] mb-4">Recent Redemptions</h3>
          <div className="space-y-3">
            {redemptionHistory.map((redemption, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 funky-card bg-white/50 border-2 border-dashed">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F7A1C4] flex items-center justify-center">
                    <Gift className="w-5 h-5 text-pink-800" />
                  </div>
                  <div>
                    <p className="body-font text-gray-800">{redemption.itemName}</p>
                    <p className="body-font-light text-sm text-gray-600">
                      {redemption.personName} • {redemption.date}
                    </p>
                  </div>
                </div>
                <span className="header-font text-xl text-[#FF6B35]">{Math.abs(redemption.points)} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {redemptionHistory.length === 0 && (
        <div className="funky-card p-12 text-center">
          <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="body-font text-xl text-gray-500">No redemptions yet</p>
          <p className="body-font-light text-gray-400 mt-2">Rewards will appear here once redeemed</p>
        </div>
      )}
    </div>
  );
}