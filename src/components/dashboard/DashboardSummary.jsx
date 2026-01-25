import React from "react";
import WeeklyProgress from "./WeeklyProgress";
import ChoreAI from "../ai/ChoreAI";

export default function DashboardSummary({ currentWeekAssignments = [], assignments = [], people = [], chores = [] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
      <WeeklyProgress assignments={currentWeekAssignments} />
      <ChoreAI assignments={assignments} people={people} chores={chores} />
    </div>
  );
}