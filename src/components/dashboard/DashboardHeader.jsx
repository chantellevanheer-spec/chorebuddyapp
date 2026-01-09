
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
          className="bg-[#C3B1E1] text-white px-4 py-3 md:px-6 md:py-4 text-base md:text-lg font-medium funky-button header-font inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 h-auto w-full"
        >
          <RotateCw className={`w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 ${isAssigning ? 'animate-spin' : ''}`} />
          {isAssigning ? 'Assigning with AI...' : 'Run ChoreAI Assignment'}
        </Button>
      </div>
    </div>
  );
}
