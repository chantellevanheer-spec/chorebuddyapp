import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Plus, Loader2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths, getDay } from 'date-fns';

const colorOptions = {
  blue: { bg: 'bg-[#2B59C3]', text: 'text-white' },
  purple: { bg: 'bg-[#C3B1E1]', text: 'text-white' },
  pink: { bg: 'bg-[#F7A1C4]', text: 'text-pink-800' },
  orange: { bg: 'bg-[#FF6B35]', text: 'text-white' },
  green: { bg: 'bg-green-400', text: 'text-green-800' }
};

export default function FamilyCalendar() {
  const [events, setEvents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: format(new Date(), 'yyyy-MM-dd'),
    event_time: '',
    color: 'blue'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userData = await base44.auth.me();
      setCurrentUser(userData);

      const eventsData = userData.family_id
        ? await base44.entities.CalendarEvent.filter({ family_id: userData.family_id })
        : [];

      setEvents(eventsData);
    } catch (error) {
      toast.error('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    try {
      await base44.entities.CalendarEvent.create({
        ...formData,
        created_by_user_id: currentUser.id,
        created_by_name: currentUser.full_name,
        family_id: currentUser.family_id
      });

      await fetchData();
      setModalOpen(false);
      setFormData({
        title: '',
        description: '',
        event_date: format(new Date(), 'yyyy-MM-dd'),
        event_time: '',
        color: 'blue'
      });
      toast.success('Event added!');
    } catch (error) {
      toast.error('Failed to create event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await base44.entities.CalendarEvent.delete(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      toast.success('Event deleted');
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (day) => {
    return events.filter(event => isSameDay(parseISO(event.event_date), day));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-[#C3B1E1]" />
      </div>
    );
  }

  return (
    <div className="pb-32 lg:pb-8 space-y-6">
      {/* Header */}
      <div className="funky-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="funky-button w-16 h-16 md:w-20 md:h-20 bg-[#FF6B35] flex items-center justify-center">
              <CalendarIcon className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <div>
              <h1 className="header-font text-3xl md:text-4xl lg:text-5xl text-[#2B59C3]">Family Calendar</h1>
              <p className="body-font-light text-gray-600 mt-2">Track important family events</p>
            </div>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            className="funky-button bg-[#C3B1E1] text-white w-full md:w-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="funky-card p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => setCurrentDate(prev => subMonths(prev, 1))}
            className="funky-button"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="header-font text-3xl text-[#2B59C3]">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button
            variant="ghost"
            onClick={() => setCurrentDate(prev => addMonths(prev, 1))}
            className="funky-button"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center body-font text-sm text-gray-600 py-2">
              {day}
            </div>
          ))}

          {/* Empty cells for days before the first of the month */}
          {Array.from({ length: getDay(monthStart) }).map((_, idx) => (
            <div key={`empty-${idx}`} className="min-h-[80px]" />
          ))}

          {daysInMonth.map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={idx}
                className={`min-h-[80px] p-2 rounded-lg border-2 ${
                  isToday ? 'border-[#FF6B35] bg-orange-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className={`text-sm body-font mb-1 ${isToday ? 'text-[#FF6B35]' : 'text-gray-600'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayEvents.map(event => {
                    const color = colorOptions[event.color];
                    return (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded ${color.bg} ${color.text} truncate`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events List */}
      <div className="space-y-4">
        <h2 className="header-font text-2xl text-[#2B59C3] px-2">Upcoming Events</h2>
        
        {events.length === 0 ? (
          <div className="funky-card p-12 text-center border-4 border-dashed border-gray-300">
            <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="body-font text-gray-600">No events scheduled</p>
          </div>
        ) : (
          events
            .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
            .map(event => {
              const color = colorOptions[event.color];
              return (
                <div key={event.id} className="funky-card p-4 md:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full ${color.bg} ${color.text} text-sm body-font`}>
                          {format(parseISO(event.event_date), 'MMM d')}
                        </span>
                        {event.event_time && (
                          <span className="text-sm text-gray-600">{event.event_time}</span>
                        )}
                      </div>
                      <h3 className="header-font text-xl text-[#2B59C3] mb-1">{event.title}</h3>
                      {event.description && (
                        <p className="body-font-light text-gray-600">{event.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">Added by {event.created_by_name}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteEvent(event.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Add Event Modal */}
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="header-font text-2xl text-[#2B59C3]">Add Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <label className="body-font text-sm text-gray-600 mb-1 block">Title</label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Birthday party, dentist appointment..."
              />
            </div>
            
            <div>
              <label className="body-font text-sm text-gray-600 mb-1 block">Description (optional)</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="body-font text-sm text-gray-600 mb-1 block">Date</label>
                <Input
                  type="date"
                  required
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                />
              </div>
              
              <div>
                <label className="body-font text-sm text-gray-600 mb-1 block">Time (optional)</label>
                <Input
                  type="time"
                  value={formData.event_time}
                  onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <label className="body-font text-sm text-gray-600 mb-1 block">Color</label>
              <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(colorOptions).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${value.bg}`}></div>
                        <span className="capitalize">{key}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 funky-button bg-[#C3B1E1] text-white">
                Add Event
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}