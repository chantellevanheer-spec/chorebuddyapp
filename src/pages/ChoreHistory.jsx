import React, { useState, useMemo } from "react";
import { useData } from '../components/contexts/DataContext';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { History, Filter, User, Calendar, Award, CheckCircle, Clock, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { AVATAR_COLORS, DIFFICULTY_STARS } from '@/components/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChoreHistory() {
  const { assignments, chores, people, user, loading } = useData();
  
  // Filters
  const [personFilter, setPersonFilter] = useState('all');
  const [choreFilter, setChoreFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Get completed assignments only
  const completedAssignments = useMemo(() => {
    return assignments
      .filter(a => a.completed)
      .sort((a, b) => {
        const dateA = a.completed_date ? new Date(a.completed_date) : new Date(a.updated_date);
        const dateB = b.completed_date ? new Date(b.completed_date) : new Date(b.updated_date);
        return dateB - dateA;
      });
  }, [assignments]);

  // Apply filters
  const filteredHistory = useMemo(() => {
    return completedAssignments.filter(assignment => {
      // Person filter
      if (personFilter !== 'all' && assignment.person_id !== personFilter) {
        return false;
      }

      // Chore filter
      if (choreFilter !== 'all' && assignment.chore_id !== choreFilter) {
        return false;
      }

      // Date range filter
      const completedDate = assignment.completed_date 
        ? new Date(assignment.completed_date) 
        : new Date(assignment.updated_date);

      if (dateFrom) {
        const fromDate = startOfDay(new Date(dateFrom));
        if (completedDate < fromDate) return false;
      }

      if (dateTo) {
        const toDate = endOfDay(new Date(dateTo));
        if (completedDate > toDate) return false;
      }

      return true;
    });
  }, [completedAssignments, personFilter, choreFilter, dateFrom, dateTo]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalPoints = filteredHistory.reduce((sum, a) => sum + (a.points_awarded || 0), 0);
    const uniquePeople = new Set(filteredHistory.map(a => a.person_id)).size;
    const uniqueChores = new Set(filteredHistory.map(a => a.chore_id)).size;
    
    return {
      totalCompleted: filteredHistory.length,
      totalPoints,
      uniquePeople,
      uniqueChores
    };
  }, [filteredHistory]);

  const clearFilters = () => {
    setPersonFilter('all');
    setChoreFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = personFilter !== 'all' || choreFilter !== 'all' || dateFrom || dateTo;

  if (loading) {
    return <LoadingSpinner size="large" message="Loading history..." />;
  }

  return (
    <div className="mx-4 md:mx-8 lg:mx-24 pb-32 space-y-6 md:space-y-8 lg:pb-8">
      {/* Header */}
      <div className="funky-card p-4 md:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="funky-button w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-[#5E3B85] flex items-center justify-center">
              <History className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" />
            </div>
            <div>
              <p className="body-font text-base md:text-lg lg:text-xl text-[#FF6B35]">Complete</p>
              <h1 className="header-font text-3xl md:text-4xl lg:text-5xl text-[#2B59C3]">Chore History</h1>
            </div>
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className={`funky-button px-4 py-2 ${
              showFilters || hasActiveFilters
                ? 'bg-[#FF6B35] text-white border-2 border-[#5E3B85]'
                : 'bg-white text-[#5E3B85] border-2 border-[#5E3B85]'
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 bg-white text-[#FF6B35] rounded-full w-5 h-5 flex items-center justify-center text-xs">
                !
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="funky-card p-6 border-4 border-[#C3B1E1]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="header-font text-xl text-[#2B59C3]">Filter History</h3>
                {hasActiveFilters && (
                  <Button
                    onClick={clearFilters}
                    variant="ghost"
                    className="text-sm text-gray-500 hover:text-red-500"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Person Filter */}
                <div>
                  <Label className="body-font text-sm text-[#5E3B85] mb-2 block">
                    <User className="w-4 h-4 inline mr-1" />
                    Person
                  </Label>
                  <Select value={personFilter} onValueChange={setPersonFilter}>
                    <SelectTrigger className="funky-button border-2 border-[#5E3B85] body-font bg-white">
                      <SelectValue placeholder="All People" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All People</SelectItem>
                      {people.map(person => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Chore Filter */}
                <div>
                  <Label className="body-font text-sm text-[#5E3B85] mb-2 block">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Chore
                  </Label>
                  <Select value={choreFilter} onValueChange={setChoreFilter}>
                    <SelectTrigger className="funky-button border-2 border-[#5E3B85] body-font bg-white">
                      <SelectValue placeholder="All Chores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Chores</SelectItem>
                      {chores.map(chore => (
                        <SelectItem key={chore.id} value={chore.id}>
                          {chore.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date From */}
                <div>
                  <Label className="body-font text-sm text-[#5E3B85] mb-2 block">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    From Date
                  </Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="funky-button border-2 border-[#5E3B85] body-font bg-white"
                  />
                </div>

                {/* Date To */}
                <div>
                  <Label className="body-font text-sm text-[#5E3B85] mb-2 block">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    To Date
                  </Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="funky-button border-2 border-[#5E3B85] body-font bg-white"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="funky-card p-4 text-center bg-green-50 border-2 border-green-300">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <p className="header-font text-2xl text-green-700">{stats.totalCompleted}</p>
          <p className="body-font-light text-sm text-green-600">Completed</p>
        </div>
        <div className="funky-card p-4 text-center bg-yellow-50 border-2 border-yellow-300">
          <Award className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
          <p className="header-font text-2xl text-yellow-700">{stats.totalPoints}</p>
          <p className="body-font-light text-sm text-yellow-600">Points Earned</p>
        </div>
        <div className="funky-card p-4 text-center bg-blue-50 border-2 border-blue-300">
          <User className="w-8 h-8 mx-auto mb-2 text-blue-600" />
          <p className="header-font text-2xl text-blue-700">{stats.uniquePeople}</p>
          <p className="body-font-light text-sm text-blue-600">Contributors</p>
        </div>
        <div className="funky-card p-4 text-center bg-purple-50 border-2 border-purple-300">
          <History className="w-8 h-8 mx-auto mb-2 text-purple-600" />
          <p className="header-font text-2xl text-purple-700">{stats.uniqueChores}</p>
          <p className="body-font-light text-sm text-purple-600">Different Chores</p>
        </div>
      </div>

      {/* History List */}
      {filteredHistory.length > 0 ? (
        <div className="space-y-4">
          {filteredHistory.map((assignment, index) => {
            const chore = chores.find(c => c.id === assignment.chore_id);
            const person = people.find(p => p.id === assignment.person_id);
            const completedDate = assignment.completed_date 
              ? new Date(assignment.completed_date) 
              : new Date(assignment.updated_date);

            if (!chore || !person) return null;

            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="funky-card p-4 md:p-6 border-2 border-green-200 bg-gradient-to-r from-green-50 to-white"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Chore Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`
                      funky-button w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
                      ${AVATAR_COLORS[person.avatar_color] || 'bg-gray-100'}
                    `}>
                      <span className="header-font text-lg text-[#5E3B85]">
                        {person.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="header-font text-lg md:text-xl text-[#2B59C3] truncate">
                        {chore.title}
                      </h3>
                      <p className="body-font text-sm text-gray-600">
                        Completed by <span className="font-semibold">{person.name}</span>
                      </p>
                      {chore.description && (
                        <p className="body-font-light text-sm text-gray-500 mt-1 line-clamp-1">
                          {chore.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Date & Points */}
                  <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
                    {/* Points Badge */}
                    {assignment.points_awarded > 0 && (
                      <div className="funky-button px-3 py-2 bg-yellow-100 border-2 border-yellow-400">
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4 text-yellow-600" />
                          <span className="header-font text-sm text-yellow-700">
                            +{assignment.points_awarded}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Bonus Indicator */}
                    {assignment.bonus_multiplier > 1 && (
                      <div className="funky-button px-2 py-1 bg-orange-100 border-2 border-orange-300">
                        <span className="body-font text-xs text-orange-700">
                          {assignment.bonus_multiplier}x Bonus
                        </span>
                      </div>
                    )}

                    {/* Completion Date */}
                    <div className="text-right">
                      <p className="body-font text-sm text-[#5E3B85]">
                        {format(completedDate, 'MMM d, yyyy')}
                      </p>
                      <p className="body-font-light text-xs text-gray-500">
                        {format(completedDate, 'h:mm a')}
                      </p>
                    </div>

                    {/* Checkmark */}
                    <div className="funky-button w-10 h-10 bg-green-500 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                {(assignment.notes || assignment.photo_url) && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    {assignment.notes && (
                      <p className="body-font-light text-sm text-gray-600 italic">
                        "{assignment.notes}"
                      </p>
                    )}
                    {assignment.photo_url && (
                      <a 
                        href={assignment.photo_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View photo proof →
                      </a>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="funky-card p-12 text-center border-4 border-dashed border-[#C3B1E1]">
          <History className="w-24 h-24 mx-auto mb-6 text-[#C3B1E1]" />
          <h3 className="header-font text-3xl text-[#2B59C3] mb-4">
            {hasActiveFilters ? 'No matching history' : 'No completed chores yet'}
          </h3>
          <p className="body-font-light text-gray-600 text-lg mb-6 max-w-md mx-auto">
            {hasActiveFilters 
              ? 'Try adjusting your filters to see more results'
              : 'Completed chores will appear here with all the details'
            }
          </p>
          {hasActiveFilters && (
            <Button
              onClick={clearFilters}
              className="funky-button bg-[#C3B1E1] text-white px-6 py-3"
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}