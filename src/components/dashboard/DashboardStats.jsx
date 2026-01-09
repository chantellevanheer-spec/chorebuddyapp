import React from "react";

export default function DashboardStats({ currentWeekAssignments, completedAssignments, pendingAssignments, people }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
      <div className="funky-card p-3 md:p-4 text-center border-3 border-[#2B59C3]">
        <div className="header-font text-2xl md:text-3xl text-[#2B59C3]">{currentWeekAssignments.length}</div>
        <div className="body-font-light text-xs md:text-sm text-gray-600">Total Chores</div>
      </div>
      <div className="funky-card p-3 md:p-4 text-center border-3 border-green-500">
        <div className="header-font text-2xl md:text-3xl text-green-600">{completedAssignments.length}</div>
        <div className="body-font-light text-xs md:text-sm text-gray-600">Completed</div>
      </div>
      <div className="funky-card p-3 md:p-4 text-center border-3 border-[#FF6B35]">
        <div className="header-font text-2xl md:text-3xl text-[#FF6B35]">{pendingAssignments.length}</div>
        <div className="body-font-light text-xs md:text-sm text-gray-600">Pending</div>
      </div>
      <div className="funky-card p-3 md:p-4 text-center border-3 border-[#C3B1E1]">
        <div className="header-font text-2xl md:text-3xl text-[#C3B1E1]">{people.length}</div>
        <div className="body-font-light text-xs md:text-sm text-gray-600">Family</div>
      </div>
    </div>
  );
}