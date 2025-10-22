'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/AppLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Link as LinkIcon,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { startGoogleCalendarAuth, getGoogleCalendarStatus, disconnectGoogleCalendar } from '../utils/googleCalendarClient';
import { createEvent } from '../utils/googleCalendarApi';
import { useAuth } from '../hooks/useAuth';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  meetLink?: string;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [eventLocation, setEventLocation] = useState('');

  // Check Google Calendar connection status
  useEffect(() => {
    const checkStatus = async () => {
      if (user?.userId) {
        const status = await getGoogleCalendarStatus(user.userId);
        setIsConnected(status.connected);
      }
    };
    checkStatus();
  }, [user]);

  // Generate calendar days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleConnectGoogle = () => {
    startGoogleCalendarAuth('/browser-callback');
  };

  const handleDisconnect = async () => {
    if (user?.userId) {
      await disconnectGoogleCalendar(user.userId);
      setIsConnected(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventTitle || !eventDate || !eventStartTime || !eventEndTime) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const startDateTime = new Date(`${eventDate}T${eventStartTime}`);
      const endDateTime = new Date(`${eventDate}T${eventEndTime}`);

      const newEvent: CalendarEvent = {
        id: `local-${Date.now()}`,
        title: eventTitle,
        description: eventDescription,
        start: startDateTime,
        end: endDateTime,
        location: eventLocation,
      };

      // Add to local state immediately
      setEvents([...events, newEvent]);

      // If connected to Google Calendar, create the event there too
      if (isConnected) {
        const result = await createEvent({
          title: eventTitle,
          description: eventDescription,
          location: eventLocation,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          userId: user?.userId,
        });

        if (result?.meetLink) {
          newEvent.meetLink = result.meetLink;
          alert(`Event created with Google Meet link: ${result.meetLink}`);
        }
      }

      // Reset form
      setEventTitle('');
      setEventDescription('');
      setEventDate('');
      setEventStartTime('09:00');
      setEventEndTime('10:00');
      setEventLocation('');
      setShowEventForm(false);
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter(event => 
      event.start.toDateString() === date.toDateString()
    );
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const days = getDaysInMonth(currentDate);
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <AppLayout>
      <div className="w-full h-full px-4 sm:px-6 lg:px-8 py-6 bg-gray-50">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
              <p className="text-gray-600 mt-1">Manage your events and meetings</p>
            </div>
            
            <div className="flex items-center gap-3">
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">Google Connected</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleDisconnect}>
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={handleConnectGoogle}>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Connect Google Calendar
                </Button>
              )}
              
              <Button onClick={() => setShowEventForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Event
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Navigation */}
        <Card className="mb-6">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{monthYear}</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {days.map((date, index) => {
                const dayEvents = date ? getEventsForDate(date) : [];
                const isTodayDate = isToday(date);
                
                return (
                  <div
                    key={index}
                    className={`min-h-24 p-2 border rounded-lg transition-all cursor-pointer ${
                      date ? 'hover:bg-blue-50 hover:border-blue-300' : 'bg-gray-50'
                    } ${isTodayDate ? 'bg-blue-100 border-blue-500' : 'border-gray-200'}`}
                    onClick={() => date && setSelectedDate(date)}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-medium ${isTodayDate ? 'text-blue-600' : 'text-gray-900'}`}>
                          {date.getDate()}
                        </div>
                        {dayEvents.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {dayEvents.slice(0, 2).map(event => (
                              <div
                                key={event.id}
                                className="text-xs p-1 bg-blue-500 text-white rounded truncate"
                                title={event.title}
                              >
                                {event.title}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{dayEvents.length - 2} more
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Event Form Modal */}
        {showEventForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Create Event</h2>
                  <button
                    onClick={() => setShowEventForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="Enter event title"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      placeholder="Enter event description"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        value={eventStartTime}
                        onChange={(e) => setEventStartTime(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time *
                      </label>
                      <input
                        type="time"
                        value={eventEndTime}
                        onChange={(e) => setEventEndTime(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="Enter location or leave blank for online"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {isConnected && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <CalendarIcon className="w-4 h-4 inline mr-2" />
                        This event will be synced with your Google Calendar and a Google Meet link will be created automatically.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleCreateEvent}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? 'Creating...' : 'Create Event'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowEventForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

