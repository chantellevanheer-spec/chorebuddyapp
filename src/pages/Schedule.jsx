import React, { useState, useMemo } from "react";
import { useData } from '../components/contexts/DataContext';
import { useChoreManagement } from '../components/hooks/useChoreManagement';
import { Calendar, CheckCircle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { format, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from 'framer-motion';
import ScheduleChoreItem from '../components/schedule/ScheduleChoreItem';
import Confetti from '../components/ui/Confetti';
import { AVATAR_COLORS } from '@/components/lib/constants';

export default function Schedule() {
  const { assignments, chores, people, loading } = useData();
  const { completeChore, completedChoreIdWithConfetti } = useChoreManagement();
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date()));

  const weekAssignments = useMemo(() => {
    const weekString = format(currentWeek, "yyyy-MM-dd");
    return assignments.filter((assignment) => assignment.week_start === weekString);
  }, [assignments, currentWeek]);

  const navigateWeek = (direction) => {
    setCurrentWeek(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 md:w-12 md:h-12 animate-spin text-[#C3B1E1]" />
      </div>
    );
  }

  const isCurrentWeek = format(currentWeek, "yyyy-MM-dd") === format(startOfWeek(new Date()), "yyyy-MM-dd");

  return (
    <div className="mx-4 md:mx-8 lg:mx-24 pb-32 space-y-6 md:space-y-8 lg:pb-8 relative">
      {completedChoreIdWithConfetti && <Confetti />}
      
      {/* Header & Week Navigation */}
      <div className="funky-card p-4 md:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 mb-4 md:mb-6">
          <div className="funky-button w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-[#C3B1E1] flex items-center justify-center">
            <Calendar className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" />
          </div>
          <div>
            <p className="body-font text-base md:text-lg lg:text-xl text-[#FF6B35]">Interactive</p>
            <h1 className="header-font text-3xl md:text-4xl lg:text-5xl text-[#2B59C3]">Chore Schedule</h1>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <h2 className="header-font text-lg md:text-xl lg:text-2xl text-[#2B59C3]">Week of {format(currentWeek, "MMM d, yyyy")}</h2>
            {isCurrentWeek && <div className="funky-button inline-block px-3 md:px-4 py-1 mt-2 bg-[#C3B1E1] text-white border-2 border-[#5E3B85]"><span className="body-font text-xs md:text-sm">Current Week</span></div>}
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigateWeek('prev')} className="funky-button flex-1 bg-white text-[#5E3B85] border-3 border-[#5E3B85] px-4 md:px-6 py-3 header-font text-sm md:text-base lg:text-lg"><ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />Previous</Button>
            <Button onClick={() => navigateWeek('next')} className="funky-button flex-1 bg-white text-[#5E3B85] border-3 border-[#5E3B85] px-4 md:px-6 py-3 header-font text-sm md:text-base lg:text-lg">Next<ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2" /></Button>
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      {weekAssignments.length > 0 ? (
        <div className="space-y-8">
          {people.map((person) => {
            const personAssignments = weekAssignments.filter((a) => a.person_id === person.id);
            if (personAssignments.length === 0) return null;
            const completedCount = personAssignments.filter((a) => a.completed).length;
            const totalCount = personAssignments.length;

            return (
              <div key={person.id} className={`funky-card p-8 border-4 ${AVATAR_COLORS[person.avatar_color]}`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="funky-button w-16 h-16 rounded-full bg-white border-3 border-[#5E3B85] flex items-center justify-center"><span className="header-font text-2xl text-[#5E3B85]">{person.name.charAt(0).toUpperCase()}</span></div>
                    <div><h3 className="header-font text-3xl text-[#2B59C3]">{person.name}</h3><p className="body-font text-lg text-gray-600">{completedCount} of {totalCount} completed</p></div>
                  </div>
                  {completedCount === totalCount && totalCount > 0 && <div className="funky-button bg-[#C3B1E1] text-white px-6 py-3"><div className="flex items-center gap-2"><CheckCircle className="w-6 h-6" /><span className="header-font text-lg">All Done!</span></div></div>}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {personAssignments.map((assignment) => {
                      const chore = chores.find((c) => c.id === assignment.chore_id);
                      return chore ? <ScheduleChoreItem key={assignment.id} assignment={assignment} chore={chore} onComplete={completeChore} /> : null;
                    })}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="funky-card p-12 text-center border-4 border-dashed border-[#C3B1E1]"><Calendar className="w-24 h-24 mx-auto mb-6 text-[#C3B1E1]" /><h3 className="header-font text-3xl text-[#2B59C3] mb-4">No assignments for this week</h3><p className="body-font-light text-gray-600 text-lg mb-8 max-w-md mx-auto">{isCurrentWeek ? "Go to the dashboard to create this week's chore assignments" : "No chores were assigned for this week"}</p></div>
      )}
    </div>
  );
}