import React from "react";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";
import { format, startOfWeek } from "date-fns";

export default function DashboardHeader({ assignChoresForWeek, isAssigning }) {
  return (
    <div className="funky-card p-4 md:p-6 lg:p-8 mb-6 md:mb-8">
      <div className="flex flex-col gap-4 md:gap-6">
        <div>
          <p className="body-font text-base md:text-lg lg:text-xl text-[#FF6B35]">This Week's Chores</p>
          <h1 className="header-font text-3xl md:text-4xl lg:text-5xl text-[#2B59C3]">
            Week of {format(startOfWeek(new Date()), "MMM d")}
          </h1>
          <p className="body-font-light text-sm md:text-base text-gray-600 mt-1 md:mt-2">
            ChoreBuddy AI has optimized assignments based on preferences and skills
          </p>
        </div>
        <Button
          onClick={assignChoresForWeek}
          disabled={isAssigning}
          className="funky-button bg-[#C3B1E1] hover:bg-[#b19dcb] text-white w-full md:w-auto"
        >
          <RotateCw className={`w-5 h-5 ${isAssigning ? 'animate-spin' : ''}`} />
          {isAssigning ? 'Assigning with AI...' : 'Run ChoreAI Assignment'}
        </Button>
      </div>
    </div>
  );
}