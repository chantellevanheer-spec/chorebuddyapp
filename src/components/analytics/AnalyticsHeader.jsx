import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AnalyticsHeader({ 
  selectedPerson, 
  onPersonChange, 
  timePeriod, 
  onPeriodChange, 
  people 
}) {
  return (
    <div className="funky-card p-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="header-font text-3xl text-[#2B59C3] mb-2">Family Analytics</h2>
          <p className="body-font-light text-gray-600">Track progress and celebrate achievements</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Select value={selectedPerson} onValueChange={onPersonChange}>
            <SelectTrigger className="funky-button bg-white w-full sm:w-[180px]">
              <SelectValue placeholder="Select person" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Family Members</SelectItem>
              {people.map(person => (
                <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timePeriod} onValueChange={onPeriodChange}>
            <SelectTrigger className="funky-button bg-white w-full sm:w-[150px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}