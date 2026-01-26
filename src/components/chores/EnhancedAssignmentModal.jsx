import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, UserPlus, Users, RefreshCw, Repeat, Calendar } from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, addMonths } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { DISPLAY_LIMITS } from '@/components/lib/appConstants';

export default function EnhancedAssignmentModal({ 
  isOpen, 
  onClose, 
  onAssign, 
  chore, 
  people, 
  isProcessing, 
  familyId 
}) {
  // Assignment type: 'individual' | 'shared' | 'rotation'
  const [assignmentType, setAssignmentType] = useState('individual');
  
  // For individual assignment
  const [selectedPersonId, setSelectedPersonId] = useState('');
  
  // For shared/multiple assignment
  const [selectedPersonIds, setSelectedPersonIds] = useState([]);
  
  // For rotation
  const [rotationPersonOrder, setRotationPersonOrder] = useState([]);
  const [rotationFrequency, setRotationFrequency] = useState('weekly');
  
  // Common fields
  const [weekStart, setWeekStart] = useState(format(startOfWeek(new Date()), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 3), 'yyyy-MM-dd'));
  
  // Recurring settings
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState('weekly');
  const [recurrenceCount, setRecurrenceCount] = useState(4);

  const handlePersonToggle = (personId) => {
    setSelectedPersonIds(prev => 
      prev.includes(personId) 
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  const handleRotationOrderToggle = (personId) => {
    setRotationPersonOrder(prev => 
      prev.includes(personId) 
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  const movePersonInRotation = (personId, direction) => {
    const currentIndex = rotationPersonOrder.indexOf(personId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= rotationPersonOrder.length) return;
    
    const newOrder = [...rotationPersonOrder];
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
    setRotationPersonOrder(newOrder);
  };

  // Calculate assignments preview
  const assignmentsPreview = useMemo(() => {
    const assignments = [];
    const baseDate = new Date(weekStart);
    
    const generateDates = (count) => {
      const dates = [];
      for (let i = 0; i < count; i++) {
        let date;
        switch (recurrencePattern) {
          case 'daily':
            date = addDays(baseDate, i);
            break;
          case 'weekly':
            date = addWeeks(baseDate, i);
            break;
          case 'monthly':
            date = addMonths(baseDate, i);
            break;
          default:
            date = addWeeks(baseDate, i);
        }
        dates.push(format(startOfWeek(date), 'yyyy-MM-dd'));
      }
      return dates;
    };

    const iterations = isRecurring ? recurrenceCount : 1;
    const dates = generateDates(iterations);

    if (assignmentType === 'individual' && selectedPersonId) {
      dates.forEach(date => {
        assignments.push({
          person_id: selectedPersonId,
          personName: people.find(p => p.id === selectedPersonId)?.name,
          week_start: date
        });
      });
    } else if (assignmentType === 'shared' && selectedPersonIds.length > 0) {
      dates.forEach(date => {
        selectedPersonIds.forEach(personId => {
          assignments.push({
            person_id: personId,
            personName: people.find(p => p.id === personId)?.name,
            week_start: date,
            is_shared: true,
            shared_with: selectedPersonIds
          });
        });
      });
    } else if (assignmentType === 'rotation' && rotationPersonOrder.length > 0) {
      dates.forEach((date, index) => {
        const personIndex = index % rotationPersonOrder.length;
        const personId = rotationPersonOrder[personIndex];
        assignments.push({
          person_id: personId,
          personName: people.find(p => p.id === personId)?.name,
          week_start: date,
          is_rotation: true,
          rotation_index: personIndex
        });
      });
    }

    return assignments;
  }, [assignmentType, selectedPersonId, selectedPersonIds, rotationPersonOrder, weekStart, isRecurring, recurrencePattern, recurrenceCount, people]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required data
    if (!familyId) {
      toast.error("Family ID is missing. Please refresh the page.");
      return;
    }
    
    if (!chore?.id) {
      toast.error("Chore information is missing. Please try again.");
      return;
    }
    
    if (assignmentsPreview.length === 0) {
      toast.error("No assignments to create. Please select at least one person.");
      return;
    }
    
    console.log("[EnhancedAssignmentModal] handleSubmit called");
    console.log("[EnhancedAssignmentModal] chore:", chore);
    console.log("[EnhancedAssignmentModal] familyId prop:", familyId);
    console.log("[EnhancedAssignmentModal] assignmentsPreview:", assignmentsPreview);
    
    const assignments = assignmentsPreview.map(preview => {
      const assignment = {
        person_id: preview.person_id,
        chore_id: chore.id,
        week_start: preview.week_start,
        due_date: dueDate,
        completed: false,
        family_id: familyId,
        is_shared: preview.is_shared || false,
        shared_with: preview.shared_with || null,
        is_rotation: preview.is_rotation || false
      };
      console.log("[EnhancedAssignmentModal] Created assignment object:", assignment);
      return assignment;
    });

    console.log("[EnhancedAssignmentModal] Calling onAssign with:", assignments);
    onAssign(assignments);

    // Reset form
    resetForm();
  };

  const resetForm = () => {
    setAssignmentType('individual');
    setSelectedPersonId('');
    setSelectedPersonIds([]);
    setRotationPersonOrder([]);
    setRotationFrequency('weekly');
    setWeekStart(format(startOfWeek(new Date()), 'yyyy-MM-dd'));
    setDueDate(format(addDays(new Date(), 3), 'yyyy-MM-dd'));
    setIsRecurring(false);
    setRecurrencePattern('weekly');
    setRecurrenceCount(4);
  };

  // Cleanup form state when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const canSubmit = () => {
    if (assignmentType === 'individual') return !!selectedPersonId;
    if (assignmentType === 'shared') return selectedPersonIds.length > 0;
    if (assignmentType === 'rotation') return rotationPersonOrder.length >= 2;
    return false;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="funky-card p-6 md:p-8 w-full max-w-2xl bg-white relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="funky-button w-12 h-12 bg-[#FF6B35] flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <h2 className="header-font text-2xl text-[#2B59C3]">Assign Chore</h2>
              </div>
              <p className="body-font-light text-gray-600">
                Assign "{chore?.title}" with flexible options
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Assignment Type Tabs */}
              <Tabs value={assignmentType} onValueChange={setAssignmentType} className="w-full">
                <TabsList className="grid w-full grid-cols-3 funky-card p-1 h-auto">
                  <TabsTrigger value="individual" className="funky-button data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white py-2">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Individual
                  </TabsTrigger>
                  <TabsTrigger value="shared" className="funky-button data-[state=active]:bg-[#C3B1E1] data-[state=active]:text-white py-2">
                    <Users className="w-4 h-4 mr-2" />
                    Shared
                  </TabsTrigger>
                  <TabsTrigger value="rotation" className="funky-button data-[state=active]:bg-[#2B59C3] data-[state=active]:text-white py-2">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Rotation
                  </TabsTrigger>
                </TabsList>

                {/* Individual Assignment */}
                <TabsContent value="individual" className="mt-4">
                  <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                    <p className="body-font text-sm text-orange-800 mb-3">
                      🎯 <strong>Individual:</strong> Assign this chore to one person
                    </p>
                    <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
                      <SelectTrigger className="funky-button border-3 border-[#5E3B85] body-font bg-white">
                        <SelectValue placeholder="Select family member..." />
                      </SelectTrigger>
                      <SelectContent>
                        {people.map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                {/* Shared Assignment */}
                <TabsContent value="shared" className="mt-4">
                  <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <p className="body-font text-sm text-purple-800 mb-3">
                      👥 <strong>Shared:</strong> Each selected person gets their own task to complete independently
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {people.map((person) => (
                        <div key={person.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`shared-${person.id}`}
                            checked={selectedPersonIds.includes(person.id)}
                            onCheckedChange={() => handlePersonToggle(person.id)}
                            className="border-2 border-[#5E3B85]"
                          />
                          <Label htmlFor={`shared-${person.id}`} className="body-font text-sm cursor-pointer">
                            {person.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Rotation Assignment */}
                <TabsContent value="rotation" className="mt-4">
                  <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <p className="body-font text-sm text-blue-800 mb-3">
                      🔄 <strong>Rotation:</strong> People take turns doing this chore. Select at least 2 people and arrange the order.
                    </p>
                    <div className="space-y-2 mb-4">
                      {people.map((person) => (
                        <div key={person.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`rotation-${person.id}`}
                            checked={rotationPersonOrder.includes(person.id)}
                            onCheckedChange={() => handleRotationOrderToggle(person.id)}
                            className="border-2 border-[#5E3B85]"
                          />
                          <Label htmlFor={`rotation-${person.id}`} className="body-font text-sm cursor-pointer flex-1">
                            {person.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                    
                    {rotationPersonOrder.length >= 2 && (
                      <div className="mt-4 p-3 bg-white rounded-lg border-2 border-blue-300">
                        <p className="body-font text-xs text-blue-700 mb-2">Rotation Order (drag to reorder):</p>
                        <div className="space-y-2">
                          {rotationPersonOrder.map((personId, index) => {
                            const person = people.find(p => p.id === personId);
                            return (
                              <div key={personId} className="flex items-center gap-2 bg-blue-100 p-2 rounded">
                                <span className="header-font text-sm text-blue-800">{index + 1}.</span>
                                <span className="body-font text-sm flex-1">{person?.name}</span>
                                <div className="flex gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    disabled={index === 0}
                                    onClick={() => movePersonInRotation(personId, 'up')}
                                    className="h-6 w-6 p-0"
                                  >
                                    ↑
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    disabled={index === rotationPersonOrder.length - 1}
                                    onClick={() => movePersonInRotation(personId, 'down')}
                                    className="h-6 w-6 p-0"
                                  >
                                    ↓
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Date Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="week_start" className="body-font text-base text-[#5E3B85] mb-2 block">
                    Week Starting
                  </Label>
                  <Input
                    id="week_start"
                    type="date"
                    value={weekStart}
                    onChange={(e) => setWeekStart(e.target.value)}
                    className="funky-button border-3 border-[#5E3B85] body-font bg-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="due_date" className="body-font text-base text-[#5E3B85] mb-2 block">
                    Due Date
                  </Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="funky-button border-3 border-[#5E3B85] body-font bg-white"
                    required
                  />
                </div>
              </div>

              {/* Recurring Settings */}
              <div className="p-4 funky-card border-2 border-[#C3B1E1] bg-purple-50">
                <div className="flex items-center space-x-2 mb-3">
                  <Checkbox
                    id="is_recurring"
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                    className="border-2 border-[#5E3B85]"
                  />
                  <Label htmlFor="is_recurring" className="body-font text-base text-[#5E3B85] cursor-pointer">
                    <Repeat className="w-4 h-4 inline mr-2" />
                    Create recurring assignments
                  </Label>
                </div>

                {isRecurring && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label className="body-font text-sm text-[#5E3B85] mb-2 block">
                        Repeat Every
                      </Label>
                      <Select value={recurrencePattern} onValueChange={setRecurrencePattern}>
                        <SelectTrigger className="funky-button border-2 border-[#5E3B85] body-font bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Day</SelectItem>
                          <SelectItem value="weekly">Week</SelectItem>
                          <SelectItem value="monthly">Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="body-font text-sm text-[#5E3B85] mb-2 block">
                        Number of Times
                      </Label>
                      <Input
                        type="number"
                        min="2"
                        max="52"
                        value={recurrenceCount}
                        onChange={(e) => setRecurrenceCount(parseInt(e.target.value) || 2)}
                        className="funky-button border-2 border-[#5E3B85] body-font bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Preview */}
              {assignmentsPreview.length > 0 && (
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span className="body-font text-sm text-green-800">
                      Preview: {assignmentsPreview.length} assignment{assignmentsPreview.length > 1 ? 's' : ''} will be created
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                   {assignmentsPreview.slice(0, DISPLAY_LIMITS.RECENT_ITEMS).map((a, i) => (
                     <div key={i} className="body-font-light text-xs text-green-700 flex items-center gap-2">
                       <span className="w-20">{format(new Date(a.week_start), 'MMM d')}</span>
                       <span>→</span>
                       <span className="font-medium">{a.personName}</span>
                       {a.is_shared && <span className="text-purple-600">(shared)</span>}
                       {a.is_rotation && <span className="text-blue-600">(rotation #{a.rotation_index + 1})</span>}
                     </div>
                   ))}
                   {assignmentsPreview.length > DISPLAY_LIMITS.RECENT_ITEMS && (
                     <div className="body-font-light text-xs text-green-600 italic">
                       ...and {assignmentsPreview.length - DISPLAY_LIMITS.RECENT_ITEMS} more
                     </div>
                   )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="funky-button flex-1 bg-gray-200 hover:bg-gray-300 text-[#5E3B85] border-3 border-[#5E3B85] py-3 header-font"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessing || !canSubmit()}
                  className="funky-button flex-1 bg-[#FF6B35] hover:bg-[#fa5a1f] text-white py-3 header-font"
                >
                  {isProcessing ? 'Assigning...' : `Create ${assignmentsPreview.length} Assignment${assignmentsPreview.length > 1 ? 's' : ''}`}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}