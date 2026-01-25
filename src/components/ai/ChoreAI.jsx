import React from "react";
import { Sparkles, Brain, TrendingUp, Clock } from "lucide-react";

export default function ChoreAI({ assignments = [], people = [], chores = [] }) {
  const calculateTimeSaved = () => {
    const completedAssignments = assignments.filter((a) => a.completed);
    const totalMinutes = completedAssignments.reduce((acc, assignment) => {
      const chore = chores.find((c) => c.id === assignment.chore_id);
      return acc + (chore?.estimated_time || 15);
    }, 0);

    const hours = Math.round(totalMinutes / 60 * 10) / 10;
    return hours;
  };

  const getAIInsights = () => {
    const insights = [];

    if (people.length > 0 && chores.length > 0) {
      const choreLoad = Math.round(chores.length / people.length);
      if (choreLoad > 3) {
        insights.push({
          type: "optimization",
          message: `ChoreAI suggests adding ${choreLoad - 3} more family members to balance workload`,
          icon: TrendingUp,
          color: "text-blue-600"
        });
      }
    }

    const hardChores = chores.filter((c) => c.difficulty === 'hard').length;
    if (hardChores > 0) {
      insights.push({
        type: "balance",
        message: `ChoreAI is distributing ${hardChores} difficult chores evenly across family`,
        icon: Brain,
        color: "text-purple-600"
      });
    }

    insights.push({
      type: "efficiency",
      message: "ChoreAI optimized assignments based on past completion patterns",
      icon: Sparkles,
      color: "text-green-600"
    });

    return insights;
  };

  const timeSaved = calculateTimeSaved();
  const insights = getAIInsights();

  return (
    <div className="bg-gradient-to-br px-6 py-3 funky-card from-purple-50 to-blue-50 border-4 border-[#C3B1E1]">
      <div className="flex items-center gap-3 mb-6">
        <div className="funky-button w-12 h-12 bg-[#C3B1E1] flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="header-font text-2xl text-[#2B59C3]">ChoreAI Insights</h3>
          <p className="body-font-light text-gray-600">Smart chore management</p>
        </div>
      </div>

      <div className="funky-card p-4 bg-white border-3 border-[#5E3B85] mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-[#FF6B35]" />
            <div>
              <div className="header-font text-3xl text-[#FF6B35]">{timeSaved}h</div>
              <div className="body-font text-sm text-gray-600">Time Saved This Week</div>
            </div>
          </div>
          <div className="text-right">
            <div className="body-font text-lg text-[#2B59C3]">Parent Time</div>
            <div className="body-font-light text-sm text-gray-600">Freed Up!</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((insight, index) =>
        <div key={index} className="flex items-start gap-3 p-3 rounded-2xl bg-white/50">
            <insight.icon className={`w-5 h-5 mt-0.5 ${insight.color}`} />
            <p className="body-font-light text-sm text-gray-700">{insight.message}</p>
          </div>
        )}
      </div>
    </div>);

}