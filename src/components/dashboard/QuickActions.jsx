import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function QuickActions() {
  return (
    <div className="funky-card p-4 md:p-6 mb-6 md:mb-8">
      <h3 className="header-font text-xl md:text-2xl text-[#2B59C3] mb-3 md:mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <Link to={createPageUrl("Schedule")}>
          <Button className="funky-button w-full bg-[#C3B1E1] text-white py-3 md:py-4 body-font text-sm md:text-base">
            <Calendar className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            View Schedule
          </Button>
        </Link>
        <Link to={createPageUrl("Store")}>
          <Button className="funky-button w-full bg-yellow-400 text-yellow-800 py-3 md:py-4 body-font text-sm md:text-base">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Rewards Store
          </Button>
        </Link>
      </div>
    </div>
  );
}