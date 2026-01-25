import React from "react";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";
import { format, startOfWeek } from "date-fns";

export default function DashboardHeader({ assignChoresForWeek, isAssigning }) {
  return (
    <div className="funky-card p-6 md:p-8 mb-6 md:mb-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
        <div className="flex-1">
          <p className="body-font text-base md:text-lg lg:text-xl text-[#FF6B35]">This Week's Chores</p>
          <h1 className="header-font text-3xl md:text-4xl lg:text-5xl text-[#2B59C3] mb-2">
            Week of {format(startOfWeek(new Date()), "MMM d")}
          </h1>
          <p className="body-font-light text-sm md:text-base text-gray-600">
            ChoreBuddy AI has optimized assignments based on preferences and skills
          </p>
        </div>
        <Button
          onClick={assignChoresForWeek}
          disabled={isAssigning}
          className="funky-button bg-[#C3B1E1] hover:bg-[#b19dcb] text-white w-full md:w-auto md:px-6 md:py-4 md:text-lg header-font whitespace-nowrap"
        >
          <RotateCw className={`w-5 h-5 mr-2 ${isAssigning ? 'animate-spin' : ''}`} />
          {isAssigning ? 'Assigning...' : 'Run ChoreAI'}
        </Button>
      </div>
    </div>
  );
}