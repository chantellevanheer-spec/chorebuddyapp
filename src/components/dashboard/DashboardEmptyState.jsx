
import React from "react";
import { Button } from "@/components/ui/button";
import { Users, ClipboardList, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function DashboardEmptyState({ currentWeekAssignments, people, chores }) {
  // Empty State when no assignments exist
  if (currentWeekAssignments.length === 0 && (people.length > 0 || chores.length > 0)) {
    return (
      <div className="funky-card p-12 text-center mb-8">
        <h3 className="header-font text-3xl text-[#2B59C3] mb-4">
          {chores.length === 0 || people.length === 0 ? "First, set things up!" : "Ready to go?"}
        </h3>
        <p className="body-font-light text-gray-600 text-lg mb-8 max-w-md mx-auto">
          {chores.length === 0 ? "You need to add some chores before you can make assignments." :
          people.length === 0 ? "You need to add family members first." :
          "Click the 'Assign Chores' button to create this week's assignments!"}
        </p>
        {chores.length === 0 && (
          <Link to={createPageUrl("Chores")}>
            <Button className="funky-button bg-[#FF6B35] text-white px-8 py-4 header-font text-xl">
              Add Chores
            </Button>
          </Link>
        )}
        {people.length === 0 && (
          <Link to={createPageUrl("People")}>
            <Button className="funky-button bg-[#F7A1C4] text-pink-800 px-8 py-4 header-font text-xl">
              Add People
            </Button>
          </Link>
        )}
      </div>
    );
  }

  // Complete Empty State - No People or Chores
  if (people.length === 0 && chores.length === 0) {
    return (
      <div className="funky-card p-12 text-center mb-8">
        <div className="mb-8">
          <div className="funky-button w-24 h-24 bg-[#C3B1E1] flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h3 className="header-font text-4xl text-[#2B59C3] mb-4">Welcome to Chore Pals!</h3>
          <p className="body-font-light text-gray-600 text-lg mb-8 max-w-lg mx-auto">
            Get started by adding your family members and household chores. 
            ChoreAI will handle the rest!
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={createPageUrl("People")}>
            <Button className="funky-button bg-[#F7A1C4] text-pink-800 px-8 py-4 header-font text-xl">
              <Users className="w-6 h-6 mr-3" />
              Add Family
            </Button>
          </Link>
          <Link to={createPageUrl("Chores")}>
            <Button className="funky-button bg-[#FF6B35] text-white px-8 py-4 header-font text-xl">
              <ClipboardList className="w-6 h-6 mr-3" />
              Add Chores
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
