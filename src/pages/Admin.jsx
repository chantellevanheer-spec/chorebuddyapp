import React, { useState, useMemo } from "react";
import { useData } from '../components/contexts/DataContext';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, MessageSquare, Calendar, Star } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export default function Admin() {
  const { assignments, chores, people, user, loading, updateAssignment, addReward } = useData();
  const [selectedTab, setSelectedTab] = useState("pending");
  const [adminNotes, setAdminNotes] = useState({});

  // Filter assignments needing approval
  const pendingApprovals = useMemo(() => {
    return assignments.filter((assignment) => {
      const chore = chores.find((c) => c.id === assignment.chore_id);
      return assignment.completed &&
      chore?.requires_approval && (
      !assignment.approval_status || assignment.approval_status === 'pending');
    });
  }, [assignments, chores]);

  const approvedAssignments = useMemo(() => {
    return assignments.filter((assignment) => assignment.approval_status === 'approved');
  }, [assignments]);

  const rejectedAssignments = useMemo(() => {
    return assignments.filter((assignment) => assignment.approval_status === 'rejected');
  }, [assignments]);

  const handleApproval = async (assignmentId, status, choreId, personId) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    const chore = chores.find((c) => c.id === choreId);

    if (!assignment || !chore) return;

    const updateData = {
      approval_status: status,
      admin_notes: adminNotes[assignmentId] || undefined
    };

    // If approved, award points
    if (status === 'approved') {
      const pointMap = { easy: 10, medium: 20, hard: 30 };
      const basePoints = chore.custom_points || pointMap[chore.difficulty] || 15;
      const finalPoints = Math.round(basePoints * (assignment.bonus_multiplier || 1));

      updateData.points_awarded = finalPoints;

      // Add reward transaction
      await addReward({
        person_id: personId,
        chore_id: choreId,
        points: finalPoints,
        reward_type: "points",
        description: `Approved: ${chore.title}`,
        week_start: assignment.week_start
      });
    }

    await updateAssignment(assignmentId, updateData);

    toast.success(status === 'approved' ? 'Chore approved and points awarded!' : 'Chore completion rejected.');
    setAdminNotes({ ...adminNotes, [assignmentId]: '' });
  };

  const handleNotesChange = (assignmentId, notes) => {
    setAdminNotes({ ...adminNotes, [assignmentId]: notes });
  };

  if (loading) {
    return <LoadingSpinner size="large" message="Loading admin panel..." />;
  }

  if (user?.family_role !== 'parent') {
    return (
      <div className="mx-4 md:mx-8 lg:mx-24 pb-40 space-y-6 md:space-y-8 lg:pb-8">
        <div className="funky-card p-8 md:p-12 text-center border-4 border-red-400">
          <XCircle className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-6 text-red-400" />
          <h2 className="header-font text-2xl md:text-3xl text-[#2B59C3] mb-4">Access Denied</h2>
          <p className="body-font-light text-base md:text-lg text-gray-600">
            Only parents can access the admin panel.
          </p>
        </div>
      </div>);
  }

  const ApprovalCard = ({ assignment, chore, person, showHistory = false }) => (
    <div className="funky-card p-4 md:p-6 border-4 border-[#FF6B35] space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="funky-button w-10 h-10 rounded-full bg-white border-2 border-[#5E3B85] flex items-center justify-center flex-shrink-0">
              <span className="header-font text-sm text-[#5E3B85]">
                {person?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="header-font text-lg md:text-xl text-[#2B59C3]">{chore?.title}</h3>
              <p className="body-font text-sm text-gray-600">{person?.name}</p>
            </div>
          </div>
          
          {chore?.description &&
            <p className="body-font-light text-sm text-gray-600 mb-3">{chore.description}</p>
          }
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Completed: {format(new Date(assignment.completed_date), "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              <span>{chore?.custom_points || (chore?.difficulty === 'easy' ? 10 : chore?.difficulty === 'medium' ? 20 : 30)} pts</span>
            </div>
          </div>

          {assignment.notes &&
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 mb-3">
              <p className="body-font text-sm text-blue-800">
                <MessageSquare className="w-4 h-4 inline mr-1" />
                "{assignment.notes}"
              </p>
            </div>
          }

          {assignment.photo_url &&
            <div className="mb-3">
              <img
                src={assignment.photo_url}
                alt="Completion proof"
                className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200" 
              />
            </div>
          }
        </div>

        <div className="flex flex-col items-end gap-2 ml-2">
          <Badge className={`whitespace-nowrap ${
            assignment.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
            assignment.approval_status === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {assignment.approval_status === 'approved' ? 'Approved' :
             assignment.approval_status === 'rejected' ? 'Rejected' : 'Pending'}
          </Badge>
        </div>
      </div>

      {!showHistory && assignment.approval_status !== 'approved' && assignment.approval_status !== 'rejected' &&
        <div className="space-y-3 pt-4 border-t-2 border-dashed border-gray-300">
          <Textarea
            placeholder="Add admin notes (optional)..."
            value={adminNotes[assignment.id] || ''}
            onChange={(e) => handleNotesChange(assignment.id, e.target.value)}
            className="body-font text-sm"
            rows={2} />

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => handleApproval(assignment.id, 'rejected', chore?.id, person?.id)}
              className="funky-button flex-1 bg-red-500 hover:bg-red-600 text-white">
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => handleApproval(assignment.id, 'approved', chore?.id, person?.id)}
              className="funky-button flex-1 bg-green-500 hover:bg-green-600 text-white">
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </div>
        </div>
      }

      {assignment.admin_notes &&
        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3 mt-3">
          <p className="body-font text-sm text-purple-800">
            <strong>Admin Notes:</strong> {assignment.admin_notes}
          </p>
        </div>
      }
    </div>
  );

  return (
    <div className="mx-4 md:mx-8 lg:mx-12 pb-24 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="funky-card p-6 md:p-8">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="funky-button w-16 h-16 md:w-20 md:h-20 bg-[#5E3B85] flex items-center justify-center">
            <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <div>
            <h1 className="header-font text-3xl md:text-5xl text-[#2B59C3]">Admin Panel</h1>
            <p className="body-font-light text-gray-600 mt-2 text-sm md:text-base">Review and approve chore completions</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="funky-card p-6 border-4 border-yellow-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="body-font text-sm text-gray-600">Pending</p>
              <p className="header-font text-3xl text-[#2B59C3]">{pendingApprovals.length}</p>
            </div>
            <Clock className="w-10 h-10 md:w-12 md:h-12 text-yellow-500" />
          </div>
        </div>
        <div className="funky-card p-6 border-4 border-green-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="body-font text-sm text-gray-600">Approved</p>
              <p className="header-font text-3xl text-[#2B59C3]">{approvedAssignments.length}</p>
            </div>
            <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-green-500" />
          </div>
        </div>
        <div className="funky-card p-6 border-4 border-red-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="body-font text-sm text-gray-600">Rejected</p>
              <p className="header-font text-3xl text-[#2B59C3]">{rejectedAssignments.length}</p>
            </div>
            <XCircle className="w-10 h-10 md:w-12 md:h-12 text-red-500" />
          </div>
        </div>
      </div>

      {/* Approval Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="funky-card p-2 h-auto grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="funky-button text-xs sm:text-sm">
            Pending ({pendingApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="funky-button text-xs sm:text-sm">
            Approved ({approvedAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="funky-button text-xs sm:text-sm">
            Rejected ({rejectedAssignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingApprovals.length > 0 ? (
            <div className="space-y-6">
              {pendingApprovals.map((assignment) => {
                const chore = chores.find((c) => c.id === assignment.chore_id);
                const person = people.find((p) => p.id === assignment.person_id);
                return (
                  <ApprovalCard
                    key={assignment.id}
                    assignment={assignment}
                    chore={chore}
                    person={person}
                  />
                );
              })}
            </div>
          ) : (
            <div className="funky-card p-8 md:p-12 text-center border-4 border-dashed border-gray-400">
              <Clock className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-6 text-gray-400" />
              <h3 className="header-font text-2xl md:text-3xl text-[#2B59C3] mb-4">No pending approvals</h3>
              <p className="body-font-light text-gray-600 text-base md:text-lg">
                All chore completions have been reviewed.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <div className="space-y-6">
            {approvedAssignments.slice(0, 10).map((assignment) => {
              const chore = chores.find((c) => c.id === assignment.chore_id);
              const person = people.find((p) => p.id === assignment.person_id);
              return (
                <ApprovalCard
                  key={assignment.id}
                  assignment={assignment}
                  chore={chore}
                  person={person}
                  showHistory={true}
                />
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <div className="space-y-6">
            {rejectedAssignments.slice(0, 10).map((assignment) => {
              const chore = chores.find((c) => c.id === assignment.chore_id);
              const person = people.find((p) => p.id === assignment.person_id);
              return (
                <ApprovalCard
                  key={assignment.id}
                  assignment={assignment}
                  chore={chore}
                  person={person}
                  showHistory={true}
                />
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}