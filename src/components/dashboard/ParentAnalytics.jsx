import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import AnalyticsHeader from '../analytics/AnalyticsHeader';
import AnalyticsStats from '../analytics/AnalyticsStats';
import AnalyticsCharts from '../analytics/AnalyticsCharts';

export default function ParentAnalytics() {
  const { people = [], assignments = [] } = useData();
  const [selectedPerson, setSelectedPerson] = useState('all');
  const [timePeriod, setTimePeriod] = useState('month');

  const analyticsData = useAnalyticsData(people, assignments, selectedPerson, timePeriod);
  const bestStreak = Math.max(...analyticsData.streakData.map(s => s.streak), 0);

  return (
    <div className="space-y-6">
      <AnalyticsHeader 
        selectedPerson={selectedPerson}
        onPersonChange={setSelectedPerson}
        timePeriod={timePeriod}
        onPeriodChange={setTimePeriod}
        people={people}
      />
      
      <AnalyticsStats 
        stats={analyticsData.completionStats} 
        bestStreak={bestStreak}
      />
      
      <AnalyticsCharts 
        trendData={analyticsData.trendData}
        choreBreakdown={analyticsData.choreBreakdown}
        streakData={analyticsData.streakData}
      />
    </div>
  );
}