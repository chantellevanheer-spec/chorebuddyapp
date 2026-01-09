
import React, { useState, useMemo } from "react";
import { useData } from '../components/contexts/DataContext';
import { useSubscriptionAccess } from '../components/hooks/useSubscriptionAccess';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Download, TrendingUp, Trophy, Calendar, Users } from "lucide-react";
import { format, subWeeks, startOfWeek, isWithinInterval, parseISO } from "date-fns";
import { toast } from "sonner";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import AnalyticsCard from "../components/analytics/AnalyticsCard";
import PerformanceChart from "../components/analytics/PerformanceChart";
import LeaderboardCard from "../components/analytics/LeaderboardCard";
import { generateReport } from "@/functions/generateReport";

export default function Analytics() {
  const { assignments, chores, people, rewards, user, loading } = useData();
  const { canAccess } = useSubscriptionAccess();
  const [timeRange, setTimeRange] = useState("4weeks");
  const [isExporting, setIsExporting] = useState(false);

  const analyticsData = useMemo(() => {
    if (!assignments.length || !people.length || !chores.length) return null;

    const now = new Date();
    let startDate;

    switch (timeRange) {
      case "1week":
        startDate = subWeeks(now, 1);
        break;
      case "4weeks":
        startDate = subWeeks(now, 4);
        break;
      case "12weeks":
        startDate = subWeeks(now, 12);
        break;
      default:
        startDate = subWeeks(now, 4);
    }

    // Filter assignments within time range
    const filteredAssignments = assignments.filter((assignment) => {
      const assignmentDate = parseISO(assignment.week_start);
      return isWithinInterval(assignmentDate, { start: startDate, end: now });
    });

    // Calculate completion rates
    const totalAssignments = filteredAssignments.length;
    const completedAssignments = filteredAssignments.filter((a) => a.completed).length;
    const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;

    // Person-specific analytics
    const personStats = people.map((person) => {
      const personAssignments = filteredAssignments.filter((a) => a.person_id === person.id);
      const personCompleted = personAssignments.filter((a) => a.completed).length;
      const personRewards = rewards.filter((r) => r.person_id === person.id);
      const totalPoints = personRewards.reduce((sum, r) => sum + r.points, 0);

      return {
        ...person,
        totalAssignments: personAssignments.length,
        completedAssignments: personCompleted,
        completionRate: personAssignments.length > 0 ? (personCompleted / personAssignments.length) * 100 : 0,
        totalPoints,
        avgPointsPerChore: personCompleted > 0 ? totalPoints / personCompleted : 0,
      };
    });

    // Weekly trend data
    const weeklyData = [];
    for (let i = 0; i < 12; i++) {
      const weekStart = startOfWeek(subWeeks(now, i));
      const weekStartStr = format(weekStart, "yyyy-MM-dd");

      const weekAssignments = assignments.filter((a) => a.week_start === weekStartStr);
      const weekCompleted = weekAssignments.filter((a) => a.completed).length;

      weeklyData.unshift({
        week: format(weekStart, "MMM d"),
        completed: weekCompleted,
        total: weekAssignments.length,
        rate: weekAssignments.length > 0 ? (weekCompleted / weekAssignments.length) * 100 : 0,
      });
    }

    // Category performance
    const categoryStats = {};
    chores.forEach((chore) => {
      const choreAssignments = filteredAssignments.filter((a) => a.chore_id === chore.id);
      const completed = choreAssignments.filter((a) => a.completed).length;

      if (!categoryStats[chore.category]) {
        categoryStats[chore.category] = { total: 0, completed: 0 };
      }
      categoryStats[chore.category].total += choreAssignments.length;
      categoryStats[chore.category].completed += completed;
    });

    return {
      overview: {
        totalAssignments,
        completedAssignments,
        completionRate,
        totalPoints: rewards.reduce((sum, r) => sum + (r.points > 0 ? r.points : 0), 0),
        activePeople: people.length,
      },
      personStats: personStats.sort((a, b) => b.totalPoints - a.totalPoints),
      weeklyData: weeklyData.slice(-8), // Last 8 weeks
      categoryStats,
    };
  }, [assignments, chores, people, rewards, timeRange]);

  const handleExportReport = async () => {
    if (!canAccess('analytics_export')) {
      toast.error("Report export is available on Basic and Premium plans");
      return;
    }

    setIsExporting(true);
    try {
      const { data, error } = await generateReport({
        payload: {
          timeRange,
          format: 'pdf',
          includeCharts: true,
        }
      });

      if (error) throw new Error(error);

      // Create download link
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chore-pals-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast.success("Report exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error(error.message || "Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" message="Loading analytics..." />;
  }

  if (!analyticsData) {
    return (
      <div className="mx-5 pb-5 space-y-8 lg:pb-8">
        <div className="text-center py-8 funky-card border-4 border-dashed border-[#C3B1E1]">
          <BarChart3 className="w-24 h-24 mx-auto mb-6 text-[#C3B1E1]" />
          <h3 className="header-font text-3xl text-[#2B59C3] mb-4">No Data Available</h3>
          <p className="body-font-light text-gray-600 text-lg">
            Complete some chores to see analytics and insights!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 md:mx-8 lg:mx-20 pb-32 space-y-8 lg:pb-8">
      {/* Header */}
      <div className="funky-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="funky-button w-16 h-16 md:w-20 md:h-20 bg-[#C3B1E1] flex items-center justify-center">
              <BarChart3 className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <div>
              <p className="body-font text-lg md:text-xl text-[#FF6B35]">Family</p>
              <h1 className="header-font text-4xl md:text-5xl text-[#2B59C3]">Performance Analytics</h1>
              <p className="body-font-light text-gray-600 mt-2">
                Insights into your family's chore performance
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="funky-button border-3 border-[#5E3B85] w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1week">Last Week</SelectItem>
                <SelectItem value="4weeks">Last 4 Weeks</SelectItem>
                <SelectItem value="12weeks">Last 12 Weeks</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleExportReport}
              disabled={isExporting || !canAccess('analytics_export')}
              className="funky-button bg-[#FF6B35] text-white px-6 py-3 header-font text-lg"
            >
              <Download className="w-5 h-5 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Report'}
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        <AnalyticsCard
          title="Total Chores"
          value={analyticsData.overview.totalAssignments}
          icon={Calendar}
          color="text-[#2B59C3]"
        />
        <AnalyticsCard
          title="Completed"
          value={analyticsData.overview.completedAssignments}
          icon={TrendingUp}
          color="text-green-600"
        />
        <AnalyticsCard
          title="Completion Rate"
          value={`${Math.round(analyticsData.overview.completionRate)}%`}
          icon={Trophy}
          color="text-[#FF6B35]"
        />
        <AnalyticsCard
          title="Total Points"
          value={analyticsData.overview.totalPoints}
          icon={Trophy}
          color="text-[#C3B1E1]"
        />
        <AnalyticsCard
          title="Active Members"
          value={analyticsData.overview.activePeople}
          icon={Users}
          color="text-[#F7A1C4]"
        />
      </div>

      {/* Performance Chart */}
      <div className="grid lg:grid-cols-2 gap-8">
        <PerformanceChart data={analyticsData.weeklyData} title="Weekly Completion Trends" />
        <LeaderboardCard personStats={analyticsData.personStats} title="Family Leaderboard" />
      </div>

      {/* Individual Performance Cards */}
      <div className="space-y-6">
        <h2 className="header-font text-3xl text-[#2B59C3]">Individual Performance</h2>
        <div className="grid lg:grid-cols-2 gap-6">
          {analyticsData.personStats.map((person) => (
            <div key={person.id} className="funky-card p-6 border-4 border-[#C3B1E1] bg-purple-50">
              <div className="flex items-center gap-4 mb-4">
                <div className="funky-button w-12 h-12 rounded-full bg-white border-3 border-[#5E3B85] flex items-center justify-center">
                  <span className="header-font text-lg text-[#5E3B85]">{person.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="header-font text-xl text-[#2B59C3]">{person.name}</h3>
                  <p className="body-font text-sm text-gray-600 capitalize">{person.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border-2 border-[#5E3B85]">
                  <div className="header-font text-2xl text-[#2B59C3]">{person.completedAssignments}</div>
                  <div className="body-font-light text-xs text-gray-600">Completed</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border-2 border-[#5E3B85]">
                  <div className="header-font text-2xl text-[#FF6B35]">{Math.round(person.completionRate)}%</div>
                  <div className="body-font-light text-xs text-gray-600">Success Rate</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border-2 border-[#5E3B85]">
                  <div className="header-font text-2xl text-green-600">{person.totalPoints}</div>
                  <div className="body-font-light text-xs text-gray-600">Total Points</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border-2 border-[#5E3B85]">
                  <div className="header-font text-2xl text-[#C3B1E1]">{Math.round(person.avgPointsPerChore)}</div>
                  <div className="body-font-light text-xs text-gray-600">Avg/Chore</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
