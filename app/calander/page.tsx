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
  XCircle,
  Target,
  Activity,
  Edit,
  Trash2
} from 'lucide-react';
import { startGoogleCalendarAuth, getGoogleCalendarStatus, disconnectGoogleCalendar } from '../utils/googleCalendarClient';
import { createEvent } from '../utils/googleCalendarApi';
import { useAuth } from '../hooks/useAuth';
import { apiService, Sprint, Project, Team, User } from '../services/api';
import { CreateButton, UpdateButton, DeleteButton, ReadOnlyBadge, usePermissions } from '../components/RoleBasedUI';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  meetLink?: string;
}

interface TaskData {
  id: string;
  title: string;
  description?: string;
  project?: string;
  assignee?: string;
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  priority?: string;
  status?: string;
}

interface CalendarTaskData extends TaskData {
  calendarId?: string;
  eventId?: string;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    return weekStart;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [draggedSprint, setDraggedSprint] = useState<Sprint | null>(null);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [draggedItem, setDraggedItem] = useState<{type: 'sprint' | 'task' | 'project', id: string, edge: 'start' | 'end'} | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState({
    showSprints: true,
    showEvents: true,
    showTasks: true,
    showProjects: true,
    showMeetings: true,
    showCompleted: true,
    priorityHigh: true,
    priorityMedium: true,
    priorityLow: true
  });
  
  // Checklist state
  const [checklist, setChecklist] = useState([
    { id: '1', text: 'Review sprint planning', completed: false },
    { id: '2', text: 'Update project timeline', completed: false },
    { id: '3', text: 'Team standup meeting', completed: true }
  ]);
  
  // Event form position
  const [eventFormPosition, setEventFormPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [eventLocation, setEventLocation] = useState('');
  
  // Sprint form state
  const [sprintFormData, setSprintFormData] = useState({
    name: '',
    goal: '',
    start_date: new Date().toISOString().split('T')[0],
    duration_weeks: 2,
    status: 'planned' as 'planned' | 'active' | 'completed',
    project_id: '',
    team_id: '',
    velocity: 0,
    retrospective_notes: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

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

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-collapse sidebar on mobile
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sprintsRes, projectsRes, teamsRes, usersRes, tasksRes] = await Promise.all([
        apiService.getSprints(),
        apiService.getProjects(),
        apiService.getTeams(),
        apiService.getUsers(),
        apiService.getTasks()
      ]);

      if (sprintsRes.success) {
        setSprints(sprintsRes.data || []);
        console.log('📅 Loaded sprints:', sprintsRes.data?.length || 0);
      }
      if (projectsRes.success) {
        setProjects(projectsRes.data || []);
        console.log('📁 Loaded projects:', projectsRes.data?.length || 0, projectsRes.data);
      }
      if (teamsRes.success) {
        setTeams(teamsRes.data || []);
        console.log('👥 Loaded teams:', teamsRes.data?.length || 0);
      }
      if (usersRes.success) {
        setUsers(usersRes.data || []);
        console.log('👤 Loaded users:', usersRes.data?.length || 0);
      }
      if (tasksRes.success) {
        setTasks(tasksRes.data || []);
        console.log('✅ Loaded tasks:', tasksRes.data?.length || 0, tasksRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

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
    const dateEvents = events.filter(event => 
      event.start.toDateString() === date.toDateString()
    );
    
    if (!filters.showEvents) return [];
    return dateEvents;
  };

  const getSprintsForDate = (date: Date): Sprint[] => {
    if (!filters.showSprints) return [];
    const filteredSprints = sprints.filter(sprint => {
      const startDate = new Date(sprint.start_date);
      const endDate = new Date(sprint.end_date);
      const isInRange = date >= startDate && date <= endDate;
      
      if (!filters.showCompleted && sprint.status === 'completed') return false;
      return isInRange;
    });
    return filteredSprints;
  };

  const getSprintsSpanningDate = (date: Date): Sprint[] => {
    if (!filters.showSprints) return [];
    return sprints.filter(sprint => {
      const startDate = new Date(sprint.start_date);
      const endDate = new Date(sprint.end_date);
      const isInRange = date >= startDate && date <= endDate;
      
      if (!filters.showCompleted && sprint.status === 'completed') return false;
      return isInRange;
    });
  };

  const getTasksForDate = (date: Date): any[] => {
    if (!filters.showTasks) {
      console.log('🔍 Tasks filter disabled');
      return [];
    }
    
    const filtered = tasks.filter(task => {
      // Check both due_date and dueDate fields
      const dueDate = task.due_date || task.dueDate;
      if (!dueDate) return false;
      
      const taskDate = new Date(dueDate);
      const isMatch = taskDate.toDateString() === date.toDateString();
      
      if (!filters.showCompleted && task.status === 'completed') return false;
      
      // Priority filter - check both field name variations
      const priority = (task.priority || '').toLowerCase();
      if (priority === 'high' && !filters.priorityHigh) return false;
      if (priority === 'medium' && !filters.priorityMedium) return false;
      if (priority === 'low' && !filters.priorityLow) return false;
      
      return isMatch;
    });
    
    if (filtered.length > 0) {
      console.log(`📋 Found ${filtered.length} tasks for ${date.toDateString()}`);
    }
    
    return filtered;
  };

  const getProjectsForDate = (date: Date): Project[] => {
    if (!filters.showProjects) {
      console.log('🔍 Projects filter disabled');
      return [];
    }
    
    const filtered = projects.filter(project => {
      // Check both field name variations
      const startDate = project.startDate || (project as any).start_date;
      if (!startDate) return false;
      
      const projStartDate = new Date(startDate);
      const endDate = project.endDate || (project as any).end_date;
      const projEndDate = endDate ? new Date(endDate) : null;
      
      if (projEndDate) {
        return date >= projStartDate && date <= projEndDate;
      } else {
        return date.toDateString() === projStartDate.toDateString();
      }
    });
    
    if (filtered.length > 0) {
      console.log(`📁 Found ${filtered.length} projects for ${date.toDateString()}`);
    }
    
    return filtered;
  };

  const getSprintStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'planned': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getTaskPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getProjectColor = (projectId: string) => {
    const colors = [
      'bg-purple-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
      'bg-cyan-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-rose-500'
    ];
    const hash = projectId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  // Generate unique colors for each sprint
  const getSprintColor = (sprintId: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-indigo-500', 'bg-red-500', 'bg-orange-500', 'bg-teal-500',
      'bg-cyan-500', 'bg-lime-500', 'bg-amber-500', 'bg-emerald-500'
    ];
    const hash = sprintId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const getSprintLightColor = (sprintId: string) => {
    const colors = [
      'bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-pink-100', 
      'bg-indigo-100', 'bg-red-100', 'bg-orange-100', 'bg-teal-100',
      'bg-cyan-100', 'bg-lime-100', 'bg-amber-100', 'bg-emerald-100'
    ];
    const hash = sprintId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || projectId;
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.name || teamId;
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Week view helpers
  const getWeekDays = (weekStart: Date) => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const handlePrevWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  };

  const handleNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
  };

  const handleTodayWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    setCurrentWeekStart(weekStart);
  };

  const timeSlots = Array.from({ length: 23 }, (_, i) => i + 1); // 1 AM to 11 PM

  const getEventsForDateAndHour = (date: Date, hour: number): CalendarEvent[] => {
    return events.filter(event => {
      const eventDate = event.start.toDateString() === date.toDateString();
      const eventHour = event.start.getHours();
      return eventDate && eventHour === hour;
    });
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const addChecklistItem = (text: string) => {
    setChecklist([...checklist, { 
      id: Date.now().toString(), 
      text, 
      completed: false 
    }]);
  };

  // Sprint operations
  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Calculate end_date from start_date and duration_weeks
      const startDate = new Date(sprintFormData.start_date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + (sprintFormData.duration_weeks * 7));
      
      const sprintData = {
        ...sprintFormData,
        end_date: endDate.toISOString().split('T')[0]
      };
      
      const result = await apiService.createSprint(sprintData);
      if (result.success) {
        setSprints([...sprints, result.data!]);
        resetSprintForm();
        setShowSprintForm(false);
      }
    } catch (error) {
      console.error('Error creating sprint:', error);
    }
  };

  const handleUpdateSprint = async (sprintId: string, updates: Partial<Sprint>) => {
    try {
      const result = await apiService.updateSprint(sprintId, updates);
      if (result.success) {
        setSprints(sprints.map(s => s.id === sprintId ? result.data! : s));
      }
    } catch (error) {
      console.error('Error updating sprint:', error);
    }
  };

  const resetSprintForm = () => {
    setSprintFormData({
      name: '',
      goal: '',
      start_date: new Date().toISOString().split('T')[0],
      duration_weeks: 2,
      status: 'planned',
      project_id: '',
      team_id: '',
      velocity: 0,
      retrospective_notes: ''
    });
  };

  // Drag and drop handlers for sprint resizing
  const [dragType, setDragType] = useState<'move' | 'start' | 'end' | null>(null);

  const handleSprintDragStart = (sprint: Sprint, date: Date, type: 'move' | 'start' | 'end' = 'move') => {
    setDraggedSprint(sprint);
    setDragStartDate(date);
    setDragType(type);
  };

  const handleSprintDragEnd = async (sprint: Sprint, newDate: Date) => {
    if (!draggedSprint || !dragStartDate || !dragType) return;

    const daysDiff = Math.floor((newDate.getTime() - dragStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff !== 0) {
      if (dragType === 'move') {
        // Move entire sprint
        const newStartDate = new Date(sprint.start_date);
        newStartDate.setDate(newStartDate.getDate() + daysDiff);
        
        const newEndDate = new Date(sprint.end_date);
        newEndDate.setDate(newEndDate.getDate() + daysDiff);

        await handleUpdateSprint(sprint.id, {
          start_date: newStartDate.toISOString().split('T')[0],
          end_date: newEndDate.toISOString().split('T')[0]
        });
      } else if (dragType === 'start') {
        // Resize start date
        const newStartDate = new Date(sprint.start_date);
        newStartDate.setDate(newStartDate.getDate() + daysDiff);
        
        // Ensure start date doesn't go beyond end date
        const endDate = new Date(sprint.end_date);
        if (newStartDate < endDate) {
          await handleUpdateSprint(sprint.id, {
            start_date: newStartDate.toISOString().split('T')[0]
          });
        }
      } else if (dragType === 'end') {
        // Resize end date
        const newEndDate = new Date(sprint.end_date);
        newEndDate.setDate(newEndDate.getDate() + daysDiff);
        
        // Ensure end date doesn't go before start date
        const startDate = new Date(sprint.start_date);
        if (newEndDate > startDate) {
          await handleUpdateSprint(sprint.id, {
            end_date: newEndDate.toISOString().split('T')[0]
          });
        }
      }
    }

    setDraggedSprint(null);
    setDragStartDate(null);
    setDragType(null);
  };

  const handleSprintResize = async (sprint: Sprint, newEndDate: Date) => {
    await handleUpdateSprint(sprint.id, {
      end_date: newEndDate.toISOString().split('T')[0]
    });
  };

  // Task drag handlers
  const handleTaskDragStart = (task: any, edge: 'start' | 'end') => {
    setDraggedItem({ type: 'task', id: task.id, edge });
  };

  const handleTaskDrop = async (taskId: string, newDate: Date, edge: 'start' | 'end') => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const updates: any = {};
      if (edge === 'end') {
        // Use the field name that the API expects
        updates.dueDate = newDate.toISOString().split('T')[0];
      } else if (edge === 'start' && (task.start_date || task.startDate)) {
        updates.startDate = newDate.toISOString().split('T')[0];
      }

      const result = await apiService.updateTask(taskId, updates);
      if (result.success) {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t));
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Project drag handlers
  const handleProjectDragStart = (project: Project, edge: 'start' | 'end') => {
    setDraggedItem({ type: 'project', id: project.id, edge });
  };

  const handleProjectDrop = async (projectId: string, newDate: Date, edge: 'start' | 'end') => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    try {
      const updates: any = {};
      if (edge === 'end') {
        updates.endDate = newDate.toISOString().split('T')[0];
      } else if (edge === 'start') {
        updates.startDate = newDate.toISOString().split('T')[0];
      }

      const result = await apiService.updateProject(projectId, updates);
      if (result.success) {
        setProjects(projects.map(p => p.id === projectId ? { ...p, ...updates } : p));
      }
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleCalendarDrop = async (date: Date) => {
    if (!draggedItem) return;

    if (draggedItem.type === 'task') {
      await handleTaskDrop(draggedItem.id, date, draggedItem.edge);
    } else if (draggedItem.type === 'project') {
      await handleProjectDrop(draggedItem.id, date, draggedItem.edge);
    } else if (draggedItem.type === 'sprint' && draggedSprint) {
      await handleSprintDragEnd(draggedSprint, date);
    }

    setDraggedItem(null);
  };

  const days = getDaysInMonth(currentDate);
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = getWeekDays(currentWeekStart);
  const weekRange = `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <AppLayout>
      <div className="w-full h-full flex bg-gray-50 relative">
        {/* Mobile Sidebar Overlay */}
        {isMobile && isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-[9999]"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div 
          className={`bg-white border-r border-gray-200 flex flex-col overflow-y-auto transition-all duration-300 ${
            isMobile 
              ? `fixed inset-0 w-full transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} z-[10000]`
              : isSidebarCollapsed ? 'w-0' : 'w-80'
          }`}
          style={{ minWidth: isMobile ? '100%' : (isSidebarCollapsed ? '0' : '320px') }}
        >
          {((isMobile && isMobileSidebarOpen) || (!isMobile && !isSidebarCollapsed)) && (
            <>
              {/* Sidebar Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Calendar</h2>
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <div title="Google Connected">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
              ) : (
                      <Button variant="outline" size="sm" onClick={handleConnectGoogle}>
                        <LinkIcon className="w-4 h-4" />
                      </Button>
                    )}
                    {/* Mobile Close Button */}
                    {isMobile && (
                      <button
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <XCircle className="w-5 h-5 text-gray-700" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={(e) => {
                      // Close mobile sidebar first
                      if (isMobile) {
                        setIsMobileSidebarOpen(false);
                      }
                      
                      // Center the form on viewport
                      const viewportWidth = window.innerWidth;
                      const viewportHeight = window.innerHeight;
                      const formWidth = 400;
                      const formHeight = 600;
                      
                      const x = (viewportWidth - formWidth) / 2;
                      const y = Math.max(80, (viewportHeight - formHeight) / 2);
                      
                      setEventFormPosition({ x, y });
                      setShowEventForm(true);
                    }} 
                    className="flex-1"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Event
                  </Button>
                  <Button 
                    onClick={() => {
                      // Close mobile sidebar first
                      if (isMobile) {
                        setIsMobileSidebarOpen(false);
                      }
                      setShowSprintForm(true);
                    }} 
                    variant="outline" 
                    className="flex-1"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Sprint
                  </Button>
                </div>
              </div>

              {/* Mini Month Calendar */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">{monthYear}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Mini calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-xs font-medium text-gray-500 py-1">
                      {day}
                    </div>
                  ))}
                  
                  {days.map((date, index) => {
                    const isTodayDate = isToday(date);
                    const hasEvents = date && getEventsForDate(date).length > 0;
                    const hasSprints = date && getSprintsSpanningDate(date).length > 0;
                    const hasTasks = date && getTasksForDate(date).length > 0;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (date) {
                            setSelectedDate(date);
                            const dayOfWeek = date.getDay();
                            const weekStart = new Date(date);
                            weekStart.setDate(date.getDate() - dayOfWeek);
                            setCurrentWeekStart(weekStart);
                          }
                        }}
                        className={`aspect-square text-xs rounded flex items-center justify-center relative ${
                          date ? 'hover:bg-gray-100' : ''
                        } ${isTodayDate ? 'bg-blue-600 text-white font-bold hover:bg-blue-700' : 'text-gray-700'} ${
                          !date ? 'text-gray-300' : ''
                        }`}
                      >
                        {date && (
                          <>
                            {date.getDate()}
                            {(hasEvents || hasSprints || hasTasks) && !isTodayDate && (
                              <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filters */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Filters</h3>
                <div className="space-y-3">
                  {/* Type Filters */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase">Type</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.showSprints}
                        onChange={(e) => setFilters({ ...filters, showSprints: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Sprints</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.showEvents}
                        onChange={(e) => setFilters({ ...filters, showEvents: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Events</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.showTasks}
                        onChange={(e) => setFilters({ ...filters, showTasks: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Tasks</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.showProjects}
                        onChange={(e) => setFilters({ ...filters, showProjects: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Projects</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.showMeetings}
                        onChange={(e) => setFilters({ ...filters, showMeetings: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Meetings</span>
                    </label>
                  </div>

                  {/* Priority Filters */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase">Priority</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.priorityHigh}
                        onChange={(e) => setFilters({ ...filters, priorityHigh: e.target.checked })}
                        className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-700">High</span>
                      <div className="w-2 h-2 bg-red-500 rounded-full ml-auto"></div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.priorityMedium}
                        onChange={(e) => setFilters({ ...filters, priorityMedium: e.target.checked })}
                        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">Medium</span>
                      <div className="w-2 h-2 bg-orange-500 rounded-full ml-auto"></div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.priorityLow}
                        onChange={(e) => setFilters({ ...filters, priorityLow: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Low</span>
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto"></div>
                    </label>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.showCompleted}
                        onChange={(e) => setFilters({ ...filters, showCompleted: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Show Completed</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="p-4 flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Checklist</h3>
                <div className="space-y-2">
                  {checklist.map((item) => (
                    <label key={item.id} className="flex items-start gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleChecklistItem(item.id)}
                        className="w-4 h-4 mt-0.5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className={`text-sm flex-1 ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {item.text}
                      </span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const text = prompt('Enter new checklist item:');
                    if (text) addChecklistItem(text);
                  }}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Add item
                </button>
              </div>
            </>
          )}
        </div>
        
        {/* Sidebar Toggle Button */}
        {!isMobile && (
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute bg-white border border-gray-200 hover:bg-gray-100 z-30 shadow-md transition-all duration-300 flex items-center justify-center rounded-r-md"
            style={{ 
              left: isSidebarCollapsed ? '0px' : '320px',
              top: '70px',
              width: '28px',
              height: '28px',
              borderLeft: 'none',
              borderRadius: '0 6px 6px 0'
            }}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-700" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            )}
          </button>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-2 md:p-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between gap-2">
              {/* Left Section */}
              <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                {/* Mobile Menu Button */}
                {isMobile && (
                  <button
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <CalendarIcon className="w-5 h-5 text-gray-700" />
                  </button>
                )}
                
                <h1 className="text-sm md:text-2xl font-bold text-gray-900 truncate">
                  {isMobile ? weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : weekRange}
                </h1>
                
                {/* Navigation Buttons */}
                <div className="flex items-center gap-1 md:gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrevWeek} className="p-1 md:p-2">
                    <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleTodayWeek} className="hidden md:block">
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNextWeek} className="p-1 md:p-2">
                    <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Right Section - View Toggle */}
              <div className="flex items-center gap-1 md:gap-2">
                <Button
                  variant={viewMode === 'week' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                  className="text-xs md:text-sm px-2 md:px-3"
                >
                  {isMobile ? 'W' : 'Week'}
                </Button>
                <Button
                  variant={viewMode === 'month' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                  className="text-xs md:text-sm px-2 md:px-3"
                >
                  {isMobile ? 'M' : 'Month'}
              </Button>
            </div>
            </div>
          </div>

          {/* Week View */}
          {viewMode === 'week' && (
            <div className="flex-1 overflow-auto bg-white">
              <div className={isMobile ? 'min-w-full' : 'min-w-[800px]'}>
                {/* Week header with day names and dates */}
                <div className={`grid border-b border-gray-200 sticky top-0 bg-white z-10 ${
                  isMobile ? 'grid-cols-4' : 'grid-cols-8'
                }`}>
                  <div className={`${isMobile ? 'w-12' : 'w-20'} border-r border-gray-200`}></div>
                  {(isMobile ? weekDays.slice(0, 3) : weekDays).map((day, index) => {
                    const isTodayDate = isToday(day);
                    return (
                      <div
                        key={index}
                        className="flex-1 text-center py-2 md:py-3 border-r border-gray-200"
                      >
                        <div className={`text-xs font-medium ${isTodayDate ? 'text-blue-600' : 'text-gray-500'}`}>
                          {day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                        </div>
                        <div className={`text-lg md:text-2xl font-semibold mt-1 ${isTodayDate ? 'text-blue-600' : 'text-gray-900'}`}>
                          {day.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Time slots grid */}
                <div className="relative">
                  {timeSlots.map((hour) => (
                    <div key={hour} className={`grid border-b border-gray-200 ${
                      isMobile ? 'grid-cols-4' : 'grid-cols-8'
                    }`} style={{ minHeight: isMobile ? '50px' : '60px' }}>
                      {/* Time label */}
                      <div className={`${isMobile ? 'w-12' : 'w-20'} border-r border-gray-200 text-right pr-1 md:pr-2 text-xs text-gray-500 pt-1`}>
                        {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                      </div>

                      {/* Day columns */}
                      {(isMobile ? weekDays.slice(0, 3) : weekDays).map((day, dayIndex) => {
                        const dayEvents = filters.showEvents ? getEventsForDateAndHour(day, hour) : [];
                        const daySprints = filters.showSprints ? getSprintsForDate(day) : [];
                        const dayTasks = filters.showTasks ? getTasksForDate(day) : [];
                        const dayProjects = filters.showProjects ? getProjectsForDate(day) : [];
                        const isTodayDate = isToday(day);

                        return (
                          <div
                            key={dayIndex}
                            className={`flex-1 border-r border-gray-200 p-1 hover:bg-blue-50 cursor-pointer relative ${
                              isTodayDate ? 'bg-blue-50 bg-opacity-30' : ''
                            }`}
                            onClick={(e) => {
                              if (draggedItem) return; // Don't open form if dragging
                              const rect = e.currentTarget.getBoundingClientRect();
                              
                              // Calculate position to keep form visible
                              const formWidth = 400;
                              const formHeight = 600;
                              const viewportWidth = window.innerWidth;
                              const viewportHeight = window.innerHeight;
                              
                              // Center horizontally on the clicked cell, but keep within viewport
                              let x = rect.left + rect.width / 2 - formWidth / 2;
                              x = Math.max(20, Math.min(x, viewportWidth - formWidth - 20));
                              
                              // Position vertically to be visible, prefer above or below based on space
                              let y = rect.top;
                              if (rect.top + formHeight > viewportHeight) {
                                // Not enough space below, try to fit it in viewport
                                y = Math.max(80, viewportHeight - formHeight - 20);
                              }
                              
                              setEventFormPosition({ x, y });
                              setSelectedDate(day);
                              setEventDate(day.toISOString().split('T')[0]);
                              setEventStartTime(`${hour.toString().padStart(2, '0')}:00`);
                              setEventEndTime(`${(hour + 1).toString().padStart(2, '0')}:00`);
                              setShowEventForm(true);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              if (draggedItem || draggedSprint) {
                                e.currentTarget.classList.add('bg-green-100', 'border-green-300');
                              }
                            }}
                            onDragLeave={(e) => {
                              e.currentTarget.classList.remove('bg-green-100', 'border-green-300');
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.remove('bg-green-100', 'border-green-300');
                              handleCalendarDrop(day);
                            }}
                          >
                            {/* Events for this time slot */}
                            {dayEvents.map((event) => (
                              <div
                                key={event.id}
                                className={`text-xs p-1 mb-1 bg-blue-500 text-white rounded shadow cursor-pointer hover:bg-blue-600 ${
                                  isMobile ? 'text-[10px]' : 'text-xs'
                                }`}
                                title={`${event.title}\n${event.start.toLocaleTimeString()} - ${event.end.toLocaleTimeString()}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <div className="font-medium truncate">{event.title}</div>
                                {!isMobile && (
                                  <div className="text-xs opacity-90">
                                    {event.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                  </div>
                                )}
                              </div>
                            ))}

                            {/* Tasks for this day (only show at 9 AM) */}
                            {hour === 9 && dayTasks.length > 0 && (
                              <div className={`space-y-1 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                                {dayTasks.slice(0, isMobile ? 2 : 3).map((task) => (
                                  <div
                                    key={task.id}
                                    className={`${getTaskPriorityColor(task.priority)} text-white rounded px-1 py-0.5 truncate flex items-center gap-1 relative group cursor-pointer hover:opacity-90 ${
                                      isMobile ? 'text-[10px]' : 'text-xs'
                                    }`}
                                    title={`Task: ${task.title} - ${task.priority || 'no'} priority - Due: ${task.due_date || task.dueDate || 'N/A'}`}
                                    draggable={!isMobile}
                                    onDragStart={() => !isMobile && handleTaskDragStart(task, 'end')}
                                  >
                                    <CheckCircle className={isMobile ? 'w-2 h-2' : 'w-3 h-3'} />
                                    <span className="flex-1 truncate">{task.title}</span>
                                    {/* Drag handle */}
                                    {!isMobile && (
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-1 h-3 bg-white bg-opacity-70 rounded"></div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Sprints indicator (only show at first hour) */}
                            {hour === 1 && daySprints.length > 0 && (
                              <div className={`space-y-1 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                                {daySprints.slice(0, isMobile ? 1 : 2).map((sprint) => {
                                  const startDate = new Date(sprint.start_date);
                                  const endDate = new Date(sprint.end_date);
                                  const isStart = day.toDateString() === startDate.toDateString();
                                  const isEnd = day.toDateString() === endDate.toDateString();
                                  
                                  return (
                                    <div
                                      key={sprint.id}
                                      className={`${getSprintColor(sprint.id)} text-white rounded px-1 py-0.5 flex items-center gap-1 relative group cursor-pointer hover:opacity-90 ${
                                        isMobile ? 'text-[10px]' : 'text-xs'
                                      }`}
                                      title={`${sprint.name} - ${sprint.status}\nStart: ${sprint.start_date}\nEnd: ${sprint.end_date}`}
                                      draggable={!isMobile}
                                      onDragStart={() => {
                                        if (!isMobile) {
                                          handleSprintDragStart(sprint, day, 'move');
                                          setDraggedItem({ type: 'sprint', id: sprint.id, edge: 'end' });
                                        }
                                      }}
                                    >
                                      <Target className={isMobile ? 'w-2 h-2' : 'w-3 h-3'} />
                                      <span className="flex-1 truncate">{sprint.name}</span>
                                      {/* Drag indicators */}
                                      {!isMobile && isStart && (
                                        <div className="absolute -left-1 top-0 bottom-0 w-2 bg-white bg-opacity-50 rounded-l cursor-ew-resize opacity-0 group-hover:opacity-100"></div>
                                      )}
                                      {!isMobile && isEnd && (
                                        <div className="absolute -right-1 top-0 bottom-0 w-2 bg-white bg-opacity-50 rounded-r cursor-ew-resize opacity-0 group-hover:opacity-100"></div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Projects indicator (only show at 8 AM) */}
                            {hour === 8 && dayProjects.length > 0 && (
                              <div className={`space-y-1 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                                {dayProjects.slice(0, isMobile ? 1 : 2).map((project) => {
                                  const projData = project as any;
                                  const startDateStr = project.startDate || projData['start_date'];
                                  const endDateStr = project.endDate || projData['end_date'];
                                  const startDate = startDateStr ? new Date(startDateStr) : null;
                                  const endDate = endDateStr ? new Date(endDateStr) : null;
                                  const isStart = startDate && day.toDateString() === startDate.toDateString();
                                  const isEnd = endDate && day.toDateString() === endDate.toDateString();
                                  
                                  return (
                                    <div
                                      key={project.id}
                                      className={`${getProjectColor(project.id)} text-white rounded px-1 py-0.5 flex items-center gap-1 relative group cursor-pointer hover:opacity-90 ${
                                        isMobile ? 'text-[10px]' : 'text-xs'
                                      }`}
                                      title={`Project: ${project.name}\n${startDate ? `Start: ${startDate}` : ''}\n${endDate ? `End: ${endDate}` : ''}`}
                                      draggable={!isMobile}
                                      onDragStart={() => !isMobile && handleProjectDragStart(project, endDate ? 'end' : 'start')}
                                    >
                                      <Activity className={isMobile ? 'w-2 h-2' : 'w-3 h-3'} />
                                      <span className="flex-1 truncate">{project.name}</span>
                                      {/* Drag indicators */}
                                      {!isMobile && isStart && (
                                        <div className="absolute -left-1 top-0 bottom-0 w-2 bg-white bg-opacity-50 rounded-l cursor-ew-resize opacity-0 group-hover:opacity-100"></div>
                                      )}
                                      {!isMobile && isEnd && (
                                        <div className="absolute -right-1 top-0 bottom-0 w-2 bg-white bg-opacity-50 rounded-r cursor-ew-resize opacity-0 group-hover:opacity-100"></div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Month View (Original Calendar) */}
          {viewMode === 'month' && (
            <div className="flex-1 overflow-auto p-2 md:p-4">
              {sprints.length > 0 && (
                <Card className="mb-4">
                  <div className="p-2 md:p-4">
                    <h3 className="text-xs md:text-sm font-medium text-gray-700 mb-2 md:mb-3">Active Sprints</h3>
                    <div className="flex flex-wrap gap-1 md:gap-2">
                      {sprints.slice(0, isMobile ? 3 : 6).map(sprint => (
                        <div key={sprint.id} className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs">
                          <div className={`w-2 h-2 md:w-3 md:h-3 rounded ${getSprintColor(sprint.id)}`}></div>
                          <span className="text-gray-600 truncate max-w-[80px] md:max-w-none">{sprint.name}</span>
                          <span className={`px-1 py-0.5 rounded text-[10px] md:text-xs ${getSprintStatusColor(sprint.status)} text-white`}>
                            {sprint.status}
                          </span>
                        </div>
                      ))}
                      {sprints.length > (isMobile ? 3 : 6) && (
                        <div className="text-[10px] md:text-xs text-gray-500">
                          +{sprints.length - (isMobile ? 3 : 6)} more
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              <Card>
                <div className="p-2 md:p-4">
                  <div className="grid grid-cols-7 gap-1 md:gap-2">
                    {/* Day headers */}
                    {(isMobile ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map((day, i) => (
                      <div key={i} className="text-center text-xs md:text-sm font-semibold text-gray-600 py-1 md:py-2">
                        {day}
                      </div>
                    ))}
                    
                    {/* Calendar days */}
                    {days.map((date, index) => {
                      const dayEvents = date ? getEventsForDate(date) : [];
                      const daySprints = date ? getSprintsSpanningDate(date) : [];
                      const isTodayDate = isToday(date);
                      
                      return (
                        <div
                          key={index}
                          className={`min-h-16 md:min-h-24 p-1 md:p-2 border rounded-lg transition-all cursor-pointer relative ${
                            date ? 'hover:bg-blue-50 hover:border-blue-300' : 'bg-gray-50'
                          } ${isTodayDate ? 'bg-blue-100 border-blue-500' : 'border-gray-200'}`}
                          onClick={() => date && setSelectedDate(date)}
                        >
                          {date && (
                            <>
                              <div className={`text-xs md:text-sm font-medium ${isTodayDate ? 'text-blue-600' : 'text-gray-900'}`}>
                                {date.getDate()}
                              </div>
                              
                              {/* Sprint Timeline Bars */}
                              {daySprints.length > 0 && filters.showSprints && !isMobile && (
                                <div className="mt-1 space-y-1">
                                  {daySprints.slice(0, 2).map(sprint => (
                                    <div
                                      key={sprint.id}
                                      className={`${getSprintColor(sprint.id)} text-white rounded text-xs p-1 truncate`}
                                      title={`${sprint.name} - ${sprint.status}`}
                                    >
                                      {sprint.name}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Regular Events */}
                              {dayEvents.length > 0 && filters.showEvents && !isMobile && (
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
                                </div>
                              )}

                              {/* Mobile: Show indicators instead of full items */}
                              {isMobile && (daySprints.length > 0 || dayEvents.length > 0) && (
                                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                                  {daySprints.length > 0 && filters.showSprints && (
                                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                                  )}
                                  {dayEvents.length > 0 && filters.showEvents && (
                                    <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
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
            </div>
          )}
        </div>

        {/* Sprint Form Modal */}
        {showSprintForm && (
          <div 
            className="fixed inset-0 z-[99999] flex items-end lg:items-center justify-center bg-black/70 bg-opacity-50"
            style={{ backdropFilter: 'blur(2px)' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowSprintForm(false);
                resetSprintForm();
              }
            }}
          >
            <div 
              className="bg-white rounded-t-2xl lg:rounded-2xl w-full lg:w-auto lg:max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full max-h-[90vh]">
                {/* Header - Sticky */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 rounded-t-2xl lg:rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Create Sprint</h2>
                      <p className="text-sm text-gray-500 mt-1">Set up a new sprint for your team</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowSprintForm(false);
                        resetSprintForm();
                      }}
                      className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Form Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                  <form onSubmit={handleCreateSprint} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sprint Name *
                        </label>
                        <input
                          type="text"
                          value={sprintFormData.name}
                          onChange={(e) => setSprintFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter sprint name"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={sprintFormData.status}
                          onChange={(e) => setSprintFormData(prev => ({ ...prev, status: e.target.value as any }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="planned">Planned</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Goal
                      </label>
                      <textarea
                        value={sprintFormData.goal}
                        onChange={(e) => setSprintFormData(prev => ({ ...prev, goal: e.target.value }))}
                        placeholder="Enter sprint goal"
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          value={sprintFormData.start_date}
                          onChange={(e) => setSprintFormData(prev => ({ ...prev, start_date: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration (Weeks)
                        </label>
                        <select
                          value={sprintFormData.duration_weeks}
                          onChange={(e) => setSprintFormData(prev => ({ ...prev, duration_weeks: parseInt(e.target.value) }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={1}>1 Week</option>
                          <option value={2}>2 Weeks</option>
                          <option value={3}>3 Weeks</option>
                          <option value={4}>4 Weeks</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Project *
                        </label>
                        <select
                          value={sprintFormData.project_id}
                          onChange={(e) => setSprintFormData(prev => ({ ...prev, project_id: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select Project</option>
                          {projects.map((project, index) => (
                            <option key={project.id || `project-${index}`} value={project.id}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Team *
                        </label>
                        <select
                          value={sprintFormData.team_id}
                          onChange={(e) => setSprintFormData(prev => ({ ...prev, team_id: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select Team</option>
                          {teams.map((team, index) => (
                            <option key={team.id || `team-${index}`} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Velocity (Story Points)
                      </label>
                      <input
                        type="number"
                        value={sprintFormData.velocity}
                        onChange={(e) => setSprintFormData(prev => ({ ...prev, velocity: parseInt(e.target.value) || 0 }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Retrospective Notes
                      </label>
                      <textarea
                        value={sprintFormData.retrospective_notes}
                        onChange={(e) => setSprintFormData(prev => ({ ...prev, retrospective_notes: e.target.value }))}
                        placeholder="Enter retrospective notes"
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </form>
                </div>

                {/* Footer - Sticky */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4 rounded-b-2xl lg:rounded-b-2xl">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="submit"
                      onClick={handleCreateSprint}
                      disabled={loading}
                      className="flex-1 order-2 sm:order-1"
                    >
                      {loading ? 'Creating...' : 'Create Sprint'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowSprintForm(false);
                        resetSprintForm();
                      }}
                      className="flex-1 order-1 sm:order-2"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Event Form Modal */}
        {showEventForm && (
          <div 
            className="fixed inset-0 z-[99999] flex items-end lg:items-center justify-center bg-black/70 bg-opacity-50"
            style={{ backdropFilter: 'blur(2px)' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowEventForm(false);
              }
            }}
          >
            <div 
              className="bg-white rounded-t-2xl lg:rounded-2xl w-full lg:w-[480px] shadow-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full max-h-[90vh]">
                {/* Header - Sticky */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 rounded-t-2xl lg:rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Create Event</h3>
                      <p className="text-sm text-gray-500 mt-1">Schedule a new calendar event</p>
                    </div>
                    <button
                      onClick={() => setShowEventForm(false)}
                      className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Form Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        placeholder="Event title"
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
                        placeholder="Event description"
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start *
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
                          End *
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
                        placeholder="Location or online"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {isConnected && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800 flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          Will sync with Google Calendar
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer - Sticky */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4 rounded-b-2xl lg:rounded-b-2xl">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleCreateEvent}
                      disabled={loading}
                      className="flex-1 order-2 sm:order-1"
                    >
                      {loading ? 'Creating...' : 'Create'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowEventForm(false)}
                      className="flex-1 order-1 sm:order-2"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}


