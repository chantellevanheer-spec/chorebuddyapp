import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, RefreshCw, AlertTriangle, Clock, Star, Lightbulb } from "lucide-react";
import { useData } from '../contexts/DataContext';
import { AVATAR_COLORS, DIFFICULTY_STARS } from '../lib/constants';

export default function AssignmentPreview({ proposedAssignments, onConfirm, onCancel, onReassign }) {
  const { people, chores } = useData();
  const [localAssignments, setLocalAssignments] = useState(proposedAssignments);

  const assignmentsByPerson = useMemo(() => {
    const grouped = {};
    people.forEach(p => {
      grouped[p.id] = {
        person: p,
        assignments: []
      };
    });
    
    localAssignments.forEach(assignment => {
      if (grouped[assignment.person_id]) {
        const chore = chores.find(c => c.id === assignment.chore_id);
        if (chore) {
          grouped[assignment.person_id].assignments.push({
            assignment,
            chore
          });
        }
      }
    });
    
    return Object.values(grouped).filter(g => g.assignments.length > 0);
  }, [localAssignments, people, chores]);

  const handleReassignChore = (assignment, newPersonId) => {
    setLocalAssignments(prev => 
      prev.map(a => 
        a.chore_id === assignment.chore_id 
          ? { ...a, person_id: newPersonId }
          : a
      )
    );
  };

  const workloadWarnings = useMemo(() => {
    const warnings = [];
    assignmentsByPerson.forEach(({ person, assignments }) => {
      const totalTime = assignments.reduce((sum, { chore }) => 
        sum + (chore.estimated_time || 0), 0
      );
      const maxChores = person.max_weekly_chores || 7;
      
      if (assignments.length > maxChores) {
        warnings.push({
          personId: person.id,
          message: `${person.name} has ${assignments.length} chores (limit: ${maxChores})`
        });
      } else if (totalTime > 180) {
        warnings.push({
          personId: person.id,
          message: `${person.name} has ${totalTime} minutes of chores (3+ hours)`
        });
      }
    });
    return warnings;
  }, [assignmentsByPerson]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="funky-card bg-white p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="funky-button w-16 h-16 bg-[#C3B1E1] flex items-center justify-center">
            <Lightbulb className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="header-font text-3xl text-[#2B59C3]">ChoreAI Preview</h2>
            <p className="body-font-light text-gray-600">Review and adjust assignments before confirming</p>
          </div>
        </div>

        {workloadWarnings.length > 0 && (
          <div className="funky-card bg-orange-50 border-2 border-orange-300 p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="body-font text-sm text-orange-800">⚠️ Workload Warnings:</p>
                {workloadWarnings.map((warning, idx) => (
                  <p key={idx} className="body-font-light text-sm text-orange-700">
                    • {warning.message}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6 mb-6">
          {assignmentsByPerson.map(({ person, assignments }) => {
            const totalTime = assignments.reduce((sum, { chore }) => 
              sum + (chore.estimated_time || 0), 0
            );
            const hasWarning = workloadWarnings.some(w => w.personId === person.id);
            
            return (
              <div 
                key={person.id} 
                className={`funky-card p-6 border-4 ${AVATAR_COLORS[person.avatar_color]} ${hasWarning ? 'border-orange-400' : ''}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="funky-button w-12 h-12 rounded-full bg-white border-3 border-[#5E3B85] flex items-center justify-center">
                      <span className="header-font text-xl text-[#5E3B85]">
                        {person.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="header-font text-xl text-[#2B59C3]">{person.name}</h3>
                      <p className="body-font-light text-sm text-gray-600">
                        {assignments.length} {assignments.length === 1 ? 'chore' : 'chores'}
                        {totalTime > 0 && ` • ${totalTime} min`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {assignments.map(({ assignment, chore }) => (
                    <div 
                      key={chore.id}
                      className="funky-button bg-white border-2 border-[#5E3B85] p-3 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="body-font text-[#5E3B85]">{chore.title}</span>
                          <div className="flex items-center gap-1">
                            {[...Array(DIFFICULTY_STARS[chore.difficulty])].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-500" />
                            ))}
                          </div>
                        </div>
                        {chore.estimated_time && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-3 h-3" />
                            <span className="body-font-light text-xs">{chore.estimated_time} min</span>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onReassign && onReassign(assignment, person)}
                        className="funky-button border-2 border-[#F7A1C4] text-pink-700 hover:bg-pink-50 text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Reassign
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onCancel}
            className="funky-button flex-1 bg-gray-200 text-[#5E3B85] border-3 border-[#5E3B85] py-4 header-font text-lg"
          >
            <X className="w-5 h-5 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(localAssignments)}
            className="funky-button flex-1 bg-[#C3B1E1] text-white border-3 border-[#5E3B85] py-4 header-font text-lg"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Confirm Assignments
          </Button>
        </div>
      </div>
    </div>
  );
}