'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { BarChart3, ChevronLeft, ChevronRight, Search, Settings, User, Users2, ChevronDown, Filter, MoreVertical, Grid3X3, List, Calendar, Clock, Plus, X, Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, List as ListIcon, ListOrdered, IndentDecrease, IndentIncrease, Superscript, Subscript, Image, Link, Code, Type, Sun, Moon, Maximize2 } from 'lucide-react';
import { ProjectApiService, ProjectData } from '../utils/projectApi';
import { TaskApiService, TaskData } from '../utils/taskApi';
import { createEvent as createGoogleCalendarEvent } from '../utils/googleCalendarApi';
import { startGoogleCalendarAuth, getGoogleCalendarStatus, disconnectGoogleCalendar } from '../utils/googleCalendarClient';
import { useUser } from '../contexts/UserContext';

// Notification endpoint configuration
const NOTIFICATION_ENDPOINT = 'https://brmh.in/notify/6d436846-0f7f-4a3a-92ef-4867e33ae7da';

// Function to send meeting notification
const sendMeetingNotification = async (meetingData: {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  meetLink?: string;
  project?: string;
  owner?: string;
}) => {
  try {
    // Format the meeting time
    const startTime = meetingData.startDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const endTime = meetingData.endDate.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Calculate duration
    const durationMs = meetingData.endDate.getTime() - meetingData.startDate.getTime();
    const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10;
    const durationText = durationHours >= 1 ? `${durationHours} hours` : `${Math.round(durationMs / (1000 * 60))} minutes`;

    // Build the notification message
    let message = `📅 Meeting Scheduled!\n\n`;
    message += `**${meetingData.title}**\n`;
    message += `📅 Date & Time: ${startTime} - ${endTime}\n`;
    message += `⏱️ Duration: ${durationText}\n`;
    
    if (meetingData.project) {
      message += `📋 Project: ${meetingData.project}\n`;
    }
    
    if (meetingData.owner) {
      message += `👤 Organizer: ${meetingData.owner}\n`;
    }
    
    if (meetingData.description) {
      message += `📝 Description: ${meetingData.description}\n`;
    }
    
    if (meetingData.meetLink) {
      message += `🔗 Meeting Link: ${meetingData.meetLink}\n`;
      message += `\nClick the link above to join the meeting!`;
    } else {
      message += `\nMeeting details will be shared separately.`;
    }

    // Send the notification
    const response = await fetch(NOTIFICATION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message
      })
    });

    if (response.ok) {
      console.log('✅ Meeting notification sent successfully');
      return true;
    } else {
      console.error('❌ Failed to send meeting notification:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending meeting notification:', error);
    return false;
  }
};

// Extended TaskData interface for calendar display
interface CalendarTaskData extends TaskData {
  scheduledDate?: string;
  meetLink?: string | null;
  meetPhoneNumber?: string | null;
}

export default function CalendarPage() {
  const { currentUser } = useUser();
  const [dateRange, setDateRange] = useState({
    start: new Date(2025, 8, 1), // September 1, 2025
    end: new Date(2025, 8, 30)   // September 30, 2025
  });
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [hoveredButton, setHoveredButton] = useState<Date | null>(null);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'new' | 'existing'>('new');
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [tasks, setTasks] = useState<CalendarTaskData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isDayView, setIsDayView] = useState(true); // true = day view with time slots, false = month view
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [taskName, setTaskName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [taskList, setTaskList] = useState<string>('');
  const [associatedTeam, setAssociatedTeam] = useState<string>('');
  const [workHours, setWorkHours] = useState<string>('1');
  const [startDate, setStartDate] = useState<string>('09:00');
  const [dueDate, setDueDate] = useState<string>('09-05-2025');
  const [priority, setPriority] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [reminder, setReminder] = useState<string>('');
  const [recurrence, setRecurrence] = useState<string>('');
  const [billingType, setBillingType] = useState<string>('');
  const [isTaskInfoExpanded, setIsTaskInfoExpanded] = useState<boolean>(true);
  const [owner, setOwner] = useState<string>('Inkhub Tattoos');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState<boolean>(false);
  const [isWorkHoursDropdownOpen, setIsWorkHoursDropdownOpen] = useState<boolean>(false);
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState<boolean>(false);
  const [googleStatus, setGoogleStatus] = useState<{ connected: boolean } | null>(null);
  
  // Refs for dropdowns
  const ownerDropdownRef = useRef<HTMLDivElement>(null);
  const workHoursDropdownRef = useRef<HTMLDivElement>(null);
  const tagsDropdownRef = useRef<HTMLDivElement>(null);

  // Refs to synchronize scroll between header, grid and time column
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null); // days grid (horizontal + vertical)
  const timeScrollRef = useRef<HTMLDivElement>(null); // time column (vertical only)

  // Keep header and body horizontal scroll positions in sync
  useEffect(() => {
    const headerEl = headerScrollRef.current;
    const bodyEl = bodyScrollRef.current;
    if (!headerEl || !bodyEl) return;

    let isSyncingFromHeader = false;
    let isSyncingFromBody = false;

    const onHeaderScroll = () => {
      if (isSyncingFromBody) return;
      isSyncingFromHeader = true;
      bodyEl.scrollLeft = headerEl.scrollLeft;
      isSyncingFromHeader = false;
    };

    const onBodyScroll = () => {
      if (isSyncingFromHeader) return;
      isSyncingFromBody = true;
      headerEl.scrollLeft = bodyEl.scrollLeft;
      isSyncingFromBody = false;
    };

    headerEl.addEventListener('scroll', onHeaderScroll, { passive: true });
    bodyEl.addEventListener('scroll', onBodyScroll, { passive: true });
    return () => {
      headerEl.removeEventListener('scroll', onHeaderScroll as EventListener);
      bodyEl.removeEventListener('scroll', onBodyScroll as EventListener);
    };
  }, [isDayView]);

  // Keep vertical scroll positions in sync between time column and grid (Day View)
  useEffect(() => {
    if (!isDayView) return;
    const timeEl = timeScrollRef.current;
    const gridEl = bodyScrollRef.current;
    if (!timeEl || !gridEl) return;

    let syncingFromTime = false;
    let syncingFromGrid = false;

    const onTimeScroll = () => {
      if (syncingFromGrid) return;
      syncingFromTime = true;
      gridEl.scrollTop = timeEl.scrollTop;
      syncingFromTime = false;
    };
    const onGridScroll = () => {
      if (syncingFromTime) return;
      syncingFromGrid = true;
      timeEl.scrollTop = gridEl.scrollTop;
      syncingFromGrid = false;
    };

    timeEl.addEventListener('scroll', onTimeScroll, { passive: true });
    gridEl.addEventListener('scroll', onGridScroll, { passive: true });
    return () => {
      timeEl.removeEventListener('scroll', onTimeScroll as EventListener);
      gridEl.removeEventListener('scroll', onGridScroll as EventListener);
    };
  }, [isDayView]);

  // Auto-scroll Day View to the current date column
  useEffect(() => {
    if (!isDayView) return;
    const headerEl = headerScrollRef.current;
    const bodyEl = bodyScrollRef.current;
    if (!headerEl || !bodyEl) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateColumns = generateDateColumns();
    const index = dateColumns.findIndex((d) => d.toDateString() === today.toDateString());
    if (index < 0) return;

    // Measure a column width from the body grid if available; fallback to 96px (~w-24)
    const sampleCol = bodyEl.querySelector('[data-day-col]') as HTMLElement | null;
    const colWidth = sampleCol?.offsetWidth || 96;
    const target = Math.max(0, index * colWidth - (bodyEl.clientWidth / 2) + (colWidth / 2));

    bodyEl.scrollLeft = target;
    headerEl.scrollLeft = target;
  }, [isDayView, dateRange.start, dateRange.end]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ownerDropdownRef.current && !ownerDropdownRef.current.contains(event.target as Node)) {
        setIsOwnerDropdownOpen(false);
      }
      if (workHoursDropdownRef.current && !workHoursDropdownRef.current.contains(event.target as Node)) {
        setIsWorkHoursDropdownOpen(false);
      }
      if (tagsDropdownRef.current && !tagsDropdownRef.current.contains(event.target as Node)) {
        setIsTagsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load Google Calendar connect status
  useEffect(() => {
    let mounted = true;
    async function loadStatus() {
      if (!currentUser?.id) return;
      const s = await getGoogleCalendarStatus(currentUser.id);
      if (mounted) setGoogleStatus({ connected: !!s.connected });
    }
    void loadStatus();
    return () => { mounted = false; };
  }, [currentUser?.id]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [projRes, taskRes] = await Promise.all([
          ProjectApiService.getProjects(),
          TaskApiService.getTasks()
        ]);
        if (mounted) {
          setProjects(projRes.success ? (projRes.data || []) : []);
          setTasks(taskRes.success ? (taskRes.data || []) : []);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const projectIdToTasks = useMemo(() => {
    const map: Record<string, TaskData[]> = {};
    for (const t of tasks) {
      const key = t.project || 'unassigned';
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    return map;
  }, [tasks]);

  const navigateDateRange = (direction: 'prev' | 'next') => {
    const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    setDateRange(prev => ({
      start: new Date(prev.start.getTime() + (direction === 'prev' ? -days : days) * 24 * 60 * 60 * 1000),
      end: new Date(prev.end.getTime() + (direction === 'prev' ? -days : days) * 24 * 60 * 60 * 1000)
    }));
  };

  const generateDateColumns = () => {
    const columns = [];
    const currentDate = new Date(dateRange.start);
    
    while (currentDate <= dateRange.end) {
      columns.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return columns;
  };

  const handleDateHover = (date: Date, event: React.MouseEvent<HTMLDivElement>) => {
    setHoveredDate(date);
    const rect = (event.target as HTMLDivElement).getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleDateLeave = () => {
    setHoveredDate(null);
  };

  const handleButtonHover = (date: Date, event: React.MouseEvent<HTMLButtonElement>) => {
    setHoveredButton(date);
    const rect = (event.target as HTMLButtonElement).getBoundingClientRect();
    setButtonPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 5
    });
  };

  const handleButtonLeave = () => {
    setHoveredButton(null);
  };

  const handlePlusButtonClick = (date: Date) => {
    setSelectedDate(date);
    setShowTaskForm(true);
  };

  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
    setSelectedDate(null);
    // Reset form fields
    setSelectedProject('');
    setTaskName('');
    setDescription('');
    setTaskList('');
    setAssociatedTeam('');
    setWorkHours('1');
    setStartDate('09:00');
    setDueDate('09-05-2025');
    setPriority('');
    setTags('');
    setReminder('');
    setRecurrence('');
    setBillingType('');
    setOwner('Inkhub Tattoos');
    setAttachments([]);
    setIsOwnerDropdownOpen(false);
    setIsWorkHoursDropdownOpen(false);
    setIsTagsDropdownOpen(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files).slice(0, 10 - attachments.length);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeOwner = () => {
    setOwner('');
  };

  const handleSubmitTask = async () => {
    if (!taskName || !selectedProject || !selectedDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Create the meeting/event data
      const meetingData = {
        title: taskName,
        description: description,
        project: selectedProject,
        assignee: owner,
        status: 'pending',
        priority: priority || 'medium',
        dueDate: dueDate,
        startDate: startDate,
        estimatedHours: parseFloat(workHours) || 8,
        tags: tags || '',
        subtasks: '',
        comments: ''
      };

      // Create the meeting using the API
      const response = await TaskApiService.createTask(meetingData);
      
      console.log('API Response:', response); // Debug log
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create meeting');
      }
      
      // Handle different response structures
      let meetingInfo: any = null;
      
      // Check for the item property first (from createItem response)
      if ((response as any).item) {
        meetingInfo = (response as any).item;
      } else if (response.data) {
        // If response.data is an array, take the first item
        if (Array.isArray(response.data)) {
          meetingInfo = response.data[0];
        } else {
          meetingInfo = response.data;
        }
      } else if (response.items && Array.isArray(response.items)) {
        meetingInfo = response.items[0];
      }
      
      // If no meeting info from API, create a local meeting object
      if (!meetingInfo) {
        console.warn('No meeting data from API, creating local meeting object');
        meetingInfo = {
          id: `meeting-${Date.now()}`,
          title: taskName,
          description: description,
          project: selectedProject,
          assignee: owner,
          status: 'pending',
          priority: priority || 'medium',
          dueDate: dueDate,
          startDate: startDate,
          estimatedHours: parseFloat(workHours) || 1,
          tags: tags || '',
          subtasks: '',
          comments: '',
          progress: 0,
          timeSpent: '0h',
          parentId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      // Add the new meeting to the local state with scheduled date
      const newMeeting: CalendarTaskData = {
        id: meetingInfo.id || `meeting-${Date.now()}`,
        title: meetingInfo.title || taskName,
        description: meetingInfo.description || description,
        project: meetingInfo.project || selectedProject,
        assignee: meetingInfo.assignee || owner,
        status: meetingInfo.status || 'pending',
        priority: meetingInfo.priority || priority || 'medium',
        dueDate: meetingInfo.dueDate || dueDate,
        startDate: meetingInfo.startDate || startDate,
        estimatedHours: meetingInfo.estimatedHours || parseFloat(workHours) || 1,
        tags: meetingInfo.tags || tags || '',
        subtasks: meetingInfo.subtasks || '',
        comments: meetingInfo.comments || '',
        progress: meetingInfo.progress || 0,
        timeSpent: meetingInfo.timeSpent || '0h',
        parentId: meetingInfo.parentId || null,
        createdAt: meetingInfo.createdAt || new Date().toISOString(),
        updatedAt: meetingInfo.updatedAt || new Date().toISOString(),
        scheduledDate: selectedDate.toISOString().split('T')[0], // Add scheduled date for calendar display
        meetLink: null, // Will be updated after Google Calendar sync
        meetPhoneNumber: null // Will be updated after Google Calendar sync
      };
      
      // Add meeting to state first
      setTasks(prev => [...prev, newMeeting]);
      console.log('Meeting created successfully:', newMeeting);

      // Attempt to sync with Google Calendar (non-blocking)
      try {
        if (selectedDate) {
          // Build start and end RFC3339 strings with explicit timezone offset (prevents UTC shift)
          const fmtWithOffset = (d: Date) => {
            const pad = (n: number) => String(n).padStart(2, '0');
            const yyyy = d.getFullYear();
            const mm = pad(d.getMonth() + 1);
            const dd = pad(d.getDate());
            const hh = pad(d.getHours());
            const mi = pad(d.getMinutes());
            const ss = pad(d.getSeconds());
            const tz = -d.getTimezoneOffset(); // minutes east of UTC
            const sign = tz >= 0 ? '+' : '-';
            const tzh = pad(Math.floor(Math.abs(tz) / 60));
            const tzm = pad(Math.abs(tz) % 60);
            return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}${sign}${tzh}:${tzm}`;
          };

          const [startHourStr, startMinuteStr] = (startDate || '09:00').split(':');
          const start = new Date(selectedDate);
          start.setHours(parseInt(startHourStr || '9', 10), parseInt(startMinuteStr || '0', 10), 0, 0);

          const durationHours = Math.max(parseFloat(String(workHours)) || 1, 0.5);
          const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

          // Get user's timezone
          const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

          const googleEvent = await createGoogleCalendarEvent({
            title: newMeeting.title,
            description: `${newMeeting.description || ''}\nProject: ${newMeeting.project || ''}`.trim(),
            start: { 
              dateTime: fmtWithOffset(start), 
              timeZone: userTimezone 
            },
            end: { 
              dateTime: fmtWithOffset(end), 
              timeZone: userTimezone 
            },
            externalId: newMeeting.id,
            location: owner ? `Owner: ${owner}` : undefined,
            userId: currentUser?.id,
          });

          // Show Google Meet link if available and update the meeting in state
          if (googleEvent?.meetLink) {
            console.log('Google Meet link created:', googleEvent.meetLink);
            
            // Update the meeting in state with the Meet link
            setTasks(prev => prev.map(task => 
              task.id === newMeeting.id 
                ? { ...task, meetLink: googleEvent.meetLink, meetPhoneNumber: googleEvent.meetPhoneNumber }
                : task
            ));
            
            // Send notification with Google Meet link
            await sendMeetingNotification({
              title: newMeeting.title,
              description: newMeeting.description,
              startDate: start,
              endDate: end,
              meetLink: googleEvent.meetLink,
              project: newMeeting.project,
              owner: newMeeting.assignee
            });
            
            // Show notification
            alert(`Meeting scheduled with Google Meet!\nJoin link: ${googleEvent.meetLink}`);
          } else {
            // Send notification without Google Meet link
            await sendMeetingNotification({
              title: newMeeting.title,
              description: newMeeting.description,
              startDate: start,
              endDate: end,
              project: newMeeting.project,
              owner: newMeeting.assignee
            });
          }
        }
      } catch (e) {
        console.warn('Google Calendar sync failed (non-blocking):', e);
      }
      handleCloseTaskForm();
    } catch (error) {
      console.error('Error creating meeting:', error);
      
      // Even if API fails, create a local meeting for immediate UI feedback
      const localMeeting: CalendarTaskData = {
        id: `meeting-${Date.now()}`,
        title: taskName,
        description: description,
        project: selectedProject,
        assignee: owner,
        status: 'pending',
        priority: priority || 'medium',
        dueDate: dueDate,
        startDate: startDate,
        estimatedHours: parseFloat(workHours) || 1,
        tags: tags || '',
        subtasks: '',
        comments: '',
        progress: 0,
        timeSpent: '0h',
        parentId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        scheduledDate: selectedDate.toISOString().split('T')[0],
        meetLink: null, // No Meet link for fallback meetings
        meetPhoneNumber: null
      };
      
      setTasks(prev => [...prev, localMeeting]);
      console.log('Created local meeting as fallback:', localMeeting);
      
      // Send notification for fallback meeting (without Google Meet link)
      if (selectedDate) {
        const [startHourStr, startMinuteStr] = (startDate || '09:00').split(':');
        const start = new Date(selectedDate);
        start.setHours(parseInt(startHourStr || '9', 10), parseInt(startMinuteStr || '0', 10), 0, 0);
        
        const durationHours = Math.max(parseFloat(String(workHours)) || 1, 0.5);
        const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
        
        await sendMeetingNotification({
          title: localMeeting.title,
          description: localMeeting.description,
          startDate: start,
          endDate: end,
          project: localMeeting.project,
          owner: localMeeting.assignee
        });
      }
      
      handleCloseTaskForm();
      
      // Show a warning instead of error
      alert('Meeting created locally. Please check your connection and try again if needed.');
    } finally {
      setLoading(false);
    }
  };

  // Function to get tasks for a specific date
  const getTasksForDate = (date: Date): CalendarTaskData[] => {
    const dateString = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      // Check if task has a scheduled date or if it falls within the date range
      if (task.scheduledDate) {
        return task.scheduledDate === dateString;
      }
      // Fallback to due date if no scheduled date
      if (task.dueDate) {
        return task.dueDate === dateString;
      }
      return false;
    });
  };

  const dateColumns = generateDateColumns();

  // Month grid helpers
  const monthGridDays = useMemo(() => {
    const firstOfMonth = new Date(dateRange.start.getFullYear(), dateRange.start.getMonth(), 1);
    const lastOfMonth = new Date(dateRange.start.getFullYear(), dateRange.start.getMonth() + 1, 0);
    const startOfGrid = new Date(firstOfMonth);
    startOfGrid.setDate(firstOfMonth.getDate() - firstOfMonth.getDay()); // back to Sunday
    const endOfGrid = new Date(lastOfMonth);
    endOfGrid.setDate(lastOfMonth.getDate() + (6 - lastOfMonth.getDay())); // forward to Saturday

    const days: Date[] = [];
    const d = new Date(startOfGrid);
    while (d <= endOfGrid) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return { days, firstOfMonth, lastOfMonth };
  }, [dateRange.start]);

  return (
    <div className="h-screen w-full bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold text-blue-600">Workload Report</span>
            <span className="text-gray-400">&gt;</span>
            <span className="text-lg font-semibold text-gray-600">Task Owner</span>
              </div>
            </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
                <button 
              onClick={() => navigateDateRange('prev')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
                </button>
            <span className="text-sm font-medium text-gray-900 min-w-[200px] text-center">
              {dateRange.start.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} to {dateRange.end.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
                <button 
              onClick={() => navigateDateRange('next')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
                </button>
              </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-blue-600">Heatmap</span>
            <Filter className="h-4 w-4 text-gray-600" />
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsDayView(true)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                isDayView 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Day View
            </button>
            <button
              onClick={() => setIsDayView(false)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                !isDayView 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Month View
            </button>
          </div>

          {/* Quick Schedule Actions */}
          <div className="hidden md:flex items-center space-x-2 ml-2">
            <button
              onClick={() => { setSelectedDate(new Date()); setShowTaskForm(true); }}
              className="px-3 py-1 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-100"
              title="Schedule a meeting"
            >
              Schedule
            </button>
            {googleStatus?.connected ? (
              <button
                onClick={async () => { if (currentUser?.id) { await disconnectGoogleCalendar(currentUser.id); setGoogleStatus({ connected: false }); } }}
                className="px-3 py-1 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-100"
                title="Disconnect Google Calendar"
              >
                Disconnect Google
              </button>
            ) : (
              <button
                onClick={() => startGoogleCalendarAuth('/browser-callback')}
                className="px-3 py-1 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-100"
                title="Connect Google Calendar"
              >
                Connect Google
              </button>
            )}
            <a
              href={(process.env.NEXT_PUBLIC_CAL_LINK || 'https://cal.com/')}
              target="_blank"
              rel="noopener"
              className="px-3 py-1 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-100"
              title="Open Cal.com"
            >
              Cal.com
            </a>
          </div>
        </div>
              </div>
              
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">

          {/* Main Calendar Grid */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {isDayView ? (
              // Day View - Google Calendar Style with Time Slots
              <>
                {/* Calendar Header */}
                <div className="border-b border-gray-200 bg-white">
                  <div className="flex">
                    <div className="w-16 p-3 border-r border-gray-200 bg-gray-50">
                      <div className="text-sm font-medium text-gray-500 text-center">Time</div>
                    </div>
                    <div className="flex-1 overflow-x-auto" ref={headerScrollRef}>
                      <div className="flex min-w-max">
                        {dateColumns.map((date, index) => {
                          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                          const isToday = date.toDateString() === new Date().toDateString();
                          
                          return (
                            <div
                              key={`header-${index}`}
                              data-day-col="true"
                              className={`w-24 p-2 text-center border-r border-gray-200 ${
                                isWeekend ? 'bg-blue-50' : 'bg-white'
                              } ${isToday ? 'bg-blue-100' : ''}`}
                            >
                              <div className={`text-sm font-medium ${
                                isWeekend ? 'text-red-600' : isToday ? 'text-blue-600' : 'text-gray-600'
                              }`}>
                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                              </div>
                              <div className={`text-lg font-bold ${
                                isToday ? 'text-blue-600' : 'text-gray-900'
                              }`}>
                                {date.getDate()}
                              </div>
                              <div className="text-sm text-gray-500">
                                {date.toLocaleDateString('en-US', { month: 'short' })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calendar Body - Google Calendar Style with Synchronized Scrolling */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex">
                    {/* Time Column - Fixed horizontally, synced vertical scroll */}
                    <div className="w-16 border-r border-gray-200 bg-gray-50 flex-shrink-0 overflow-y-auto" ref={timeScrollRef}>
                      <div>
                        {Array.from({ length: 24 }, (_, hour) => (
                          <div key={hour} className="h-12 border-b border-gray-100 flex items-center justify-center">
                            <span className="text-sm text-gray-500">
                              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Days Grid - Horizontal + vertical scroll */}
                    <div className="flex-1 overflow-auto" ref={bodyScrollRef}>
                      <div className="flex min-w-max">
                        {dateColumns.map((date, index) => {
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      const isToday = date.toDateString() === new Date().toDateString();
                      const dayMeetings = getTasksForDate(date);
                      
                      return (
                        <div 
                          key={`column-${index}`} 
                          data-day-col="true"
                          className={`w-24 border-r border-gray-200 relative ${
                            isWeekend ? 'bg-blue-50' : 'bg-white'
                          } ${isToday ? 'bg-blue-50' : ''}`}
                          onMouseEnter={(e) => handleDateHover(date, e)}
                          onMouseLeave={handleDateLeave}
                        >
                          {/* Add Meeting Button */}
                          <div className="absolute top-2 right-2 z-10">
                            <button
                              className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs hover:bg-blue-700 transition-colors shadow-sm"
                              onMouseEnter={(e) => handleButtonHover(date, e)}
                              onMouseLeave={handleButtonLeave}
                              onClick={() => handlePlusButtonClick(date)}
                              title="Schedule Meeting"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Hour Rows - Each row is 48px (h-12) to match time column */}
                          {Array.from({ length: 24 }, (_, hour) => (
                            <div 
                              key={hour} 
                              className="h-12 border-b border-gray-100 relative hover:bg-gray-50 transition-colors"
                            >
                              {/* Meeting Blocks */}
                              {dayMeetings.map((meeting, meetingIndex) => {
                                // Parse meeting time - handle different date formats
                                let meetingHour = 9; // Default to 9 AM
                                let meetingDuration = 1; // Default to 1 hour
                                
                                // Try to parse startDate for time
                                if (meeting.startDate) {
                                  // Handle formats like "09-05-2025" or "2025-09-05" or "09:00"
                                  if (meeting.startDate.includes(':')) {
                                    meetingHour = parseInt(meeting.startDate.split(':')[0]);
                                  } else if (meeting.startDate.includes('-')) {
                                    // For date formats, use a default time or parse if time is included
                                    meetingHour = 9; // Default morning time
                                  }
                                }
                                
                                // Parse duration
                                if (meeting.estimatedHours) {
                                  meetingDuration = Math.max(parseInt(meeting.estimatedHours.toString()) || 1, 1);
                                }
                                
                                // Only show meeting if it starts at this hour
                                if (meetingHour === hour) {
                                  return (
                                    <div
                                      key={`meeting-${meeting.id}-${meetingIndex}`}
                                      className={`absolute left-1 right-1 top-0 rounded-md p-2 cursor-pointer transition-all hover:shadow-md ${
                                        meeting.priority === 'high' ? 'bg-red-100 border-l-4 border-red-500' :
                                        meeting.priority === 'medium' ? 'bg-yellow-100 border-l-4 border-yellow-500' :
                                        meeting.priority === 'low' ? 'bg-green-100 border-l-4 border-green-500' :
                                        'bg-blue-100 border-l-4 border-blue-500'
                                      }`}
                                      style={{ 
                                        height: `${Math.max(meetingDuration * 48, 48)}px`,
                                        zIndex: 10
                                      }}
                                      title={`${meeting.title} - ${meeting.project} - ${meetingHour}:00 - ${meetingDuration}h`}
                                    >
                                      <div className="text-sm font-semibold text-gray-900 truncate leading-tight">
                                        {meeting.title}
                                      </div>
                                      <div className="text-sm text-gray-600 truncate mt-1 leading-tight">
                                        {meeting.project}
                                      </div>
                                      {meeting.assignee && (
                                        <div className="text-sm text-gray-500 truncate mt-1 leading-tight">
                                          {meeting.assignee.split(' ')[0]}
                                        </div>
                                      )}
                                      <div className="text-sm text-gray-500 mt-1 leading-tight">
                                        {meetingHour}:00 - {meetingDuration}h
                                      </div>
                                      {meeting.meetLink && (
                                        <div className="mt-1">
                                          <a 
                                            href={meeting.meetLink} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 underline"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                            </svg>
                                            Join Meet
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          ))}
                          
                          {/* Empty State */}
                          {dayMeetings.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="text-center text-gray-400">
                                <Calendar className="h-6 w-6 mx-auto mb-1 opacity-50" />
                                <p className="text-xs">No meetings</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Month View - 7-column grid like the screenshot
              <>
                {/* Month Header */}
                <div className="border-b border-gray-200 bg-white px-4 py-2">
                  <div className="grid grid-cols-7 gap-2 text-sm md:text-base text-gray-600">
                    {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d) => (
                      <div key={d} className="text-center">{d}</div>
                    ))}
                  </div>
                </div>

                {/* Month Grid */}
                <div className="flex-1 overflow-auto px-4 py-3">
                  <div className="grid grid-cols-7 gap-2 auto-rows-[minmax(64px,1fr)]">
                    {monthGridDays.days.map((date) => {
                      const isCurrentMonth = date.getMonth() === dateRange.start.getMonth();
                      const isToday = date.toDateString() === new Date().toDateString();
                      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                      const dayMeetings = getTasksForDate(date);

                      return (
                        <button
                          key={date.toISOString()}
                          onClick={() => { setSelectedDate(date); setShowTaskForm(true); }}
                          className={`relative w-full h-full rounded-lg border text-left p-3 transition-colors
                            ${isSelected ? 'bg-blue-600 text-white border-blue-600' : ''}
                            ${!isSelected && isToday ? 'bg-blue-50 border-blue-200' : ''}
                            ${!isSelected && !isToday ? 'bg-gray-50 border-gray-200' : ''}
                            ${!isCurrentMonth ? 'opacity-60' : ''}
                          `}
                        >
                          <div className="text-xl font-extrabold">{date.getDate()}</div>
                          {isToday && !isSelected && (
                            <div className="absolute top-1/2 left-2 -mt-1 w-1 h-1 bg-gray-800 rounded-full"></div>
                          )}
                          {dayMeetings.length > 0 && (
                            <div className={`mt-2 text-sm ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                              {Math.min(dayMeetings.length, 2)} meeting{dayMeetings.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Sidebar with toolbar icons */}
          <div className="w-16 border-l border-gray-200 bg-white flex flex-col items-center py-4 space-y-4">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                  </div>
              <span className="text-xs text-gray-600">Heatmap</span>
              <ChevronDown className="h-3 w-3 text-gray-400" />
                </div>

            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
              <Filter className="h-4 w-4 text-gray-600" />
                      </div>

            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
              <MoreVertical className="h-4 w-4 text-gray-600" />
                    </div>
                
            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
              <Grid3X3 className="h-4 w-4 text-gray-600" />
                  </div>

            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
              <List className="h-4 w-4 text-gray-600" />
          </div>
                      </div>
                    </div>
                  </div>

      {/* Hover Tooltip */}
      {hoveredDate && (
        <div 
          className="fixed z-50 bg-black text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none"
          style={{
            left: tooltipPosition.x - 30,
            top: tooltipPosition.y - 30,
            transform: 'translateX(-50%)'
          }}
        >
           Schedule Meeting
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black"></div>
                      </div>
      )}

      {/* Button Hover Dropdown */}
      {hoveredButton && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 pointer-events-none"
          style={{
            left: buttonPosition.x - 120,
            top: buttonPosition.y,
            transform: 'translateX(-50%)',
            minWidth: '240px'
          }}
        >
          <div className="flex items-center space-x-2 mb-3">
            <User className="h-5 w-5 text-gray-600" />
            <span className="font-semibold text-gray-900">Unassigned User</span>
                    </div>
          
          <div className="space-y-2 mb-3">
             <div className="text-sm text-gray-600 mb-2">Select a project to schedule meeting:</div>
            {projects.slice(0, 3).map((project) => (
              <div key={project.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-900">{project.name}</span>
                  </div>
            ))}
            {projects.length > 3 && (
              <div className="text-xs text-gray-500">
                +{projects.length - 3} more projects
                </div>
            )}
              </div>

          <div className="border-t border-gray-100 pt-2 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Projects:</span>
              <span className="text-sm font-medium text-gray-900">{projects.length}</span>
                  </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Time Period:</span>
              <span className="text-sm font-medium text-gray-900">01 Sep 2025 - 30 Sep 2025</span>
            </div>
                </div>

          <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-gray-100">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
             <span className="text-sm text-gray-600">Click to schedule meeting</span>
                          </div>
                        </div>
      )}


      {/* Task Form Slide-in Panel */}
      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop with Blur (no dark overlay) */}
          <div 
            className="absolute inset-0 backdrop-blur-[2px] bg-transparent"
            onClick={handleCloseTaskForm}
          ></div>
          
          {/* Form Panel */}
          <div className="relative bg-white w-[720px] h-full shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                 <div className="flex items-center justify-between mb-4">
                   <h2 className="text-xl font-semibold text-gray-900">Schedule Meeting</h2>
              <button
                    onClick={handleCloseTaskForm}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                       </div>

                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                 <button
                     onClick={() => setActiveTab('new')}
                     className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                       activeTab === 'new'
                         ? 'bg-blue-600 text-white'
                         : 'text-gray-600 hover:text-gray-900'
                     }`}
                   >
                     New Meeting
               </button>
                   <button
                     onClick={() => setActiveTab('existing')}
                     className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                       activeTab === 'existing'
                         ? 'bg-blue-600 text-white'
                         : 'text-gray-600 hover:text-gray-900'
                     }`}
                   >
                     Existing Meeting
                 </button>
                    </div>
                  </div>

              {/* Form Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* Project Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project <span className="text-red-500">*</span>
                    </label>
                      <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                    >
                      <option value="">Select Project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                      </select>
                </div>

                   {/* Meeting Name */}
                 <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Meeting Name <span className="text-red-500">*</span>
                   </label>
                     <select
                       value={taskName}
                       onChange={(e) => setTaskName(e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     >
                       <option value="">Select Existing Meeting</option>
                       {tasks.map((task) => (
                         <option key={task.id} value={task.title}>
                           {task.title}
                         </option>
                       ))}
                     </select>
               </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Description
                    </label>
                    
                    {/* Rich Text Editor Toolbar */}
                    <div className="border border-gray-300 rounded-t-lg bg-gray-50 p-2">
                            <div className="flex flex-wrap gap-1">
                        {/* Text Formatting */}
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Bold className="h-4 w-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Italic className="h-4 w-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Underline className="h-4 w-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Strikethrough className="h-4 w-4" />
                </button>

                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                        
                        {/* Font & Size */}
                        <select className="text-xs px-2 py-1 border border-gray-300 rounded">
                          <option>Puvi</option>
                        </select>
                        <select className="text-xs px-2 py-1 border border-gray-300 rounded">
                          <option>13</option>
                        </select>
                        
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                        
                        {/* Colors */}
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Type className="h-4 w-4" />
                  </button>
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Type className="h-4 w-4" />
                        </button>
                        
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                        
                        {/* Alignment */}
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <AlignLeft className="h-4 w-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <AlignCenter className="h-4 w-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <AlignRight className="h-4 w-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <AlignJustify className="h-4 w-4" />
                        </button>
                        
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                        
                        {/* Lists */}
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <ListIcon className="h-4 w-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <ListOrdered className="h-4 w-4" />
                        </button>
                        
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                        
                        {/* Indentation */}
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <IndentDecrease className="h-4 w-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <IndentIncrease className="h-4 w-4" />
                        </button>
                        
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                        
                        {/* Special Formatting */}
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Superscript className="h-4 w-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Subscript className="h-4 w-4" />
                        </button>
                        
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                        
                        {/* Media & Links */}
                        <button className="p-1 hover:bg-gray-200 rounded" title="Insert image">
                          {/* eslint-disable-next-line jsx-a11y/alt-text */}
                          <Image className="h-4 w-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Link className="h-4 w-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Code className="h-4 w-4" />
                        </button>
                        
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                        
                        {/* Other Tools */}
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Type className="h-4 w-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Maximize2 className="h-4 w-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Sun className="h-4 w-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <span className="text-xs font-bold">Za</span>
                  </button>
                </div>
              </div>
                    
                    {/* Text Area */}
                    <textarea
                      placeholder="Add description..."
                      rows={8}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 border-t-0 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
          </div>

                  {/* Additional fields when project is selected */}
                  {selectedProject && (
                    <>
                       {/* Meeting List */}
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           Meeting List
                         </label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={taskList}
                          onChange={(e) => setTaskList(e.target.value)}
                        >
                           <option value="">General (General)</option>
                           <option value="list1">Development Meetings</option>
                           <option value="list2">Design Meetings</option>
                           <option value="list3">Team Meetings</option>
                        </select>
        </div>

                      {/* Attachments */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Attachments
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                          <input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                          />
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <div className="text-gray-500">
                              <p className="text-sm">Drop files or add attachments here...</p>
                              <p className="text-xs text-gray-400 mt-1">Maximum 10 files</p>
                            </div>
                          </label>
                        </div>
                        {attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {attachments.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-700">{file.name}</span>
              <button
                                  onClick={() => removeAttachment(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
              </button>
                              </div>
            ))}
          </div>
                        )}
        </div>

                       {/* Meeting Information Section */}
               <div>
                         <div 
                           className="flex items-center space-x-2 mb-3 cursor-pointer"
                           onClick={() => setIsTaskInfoExpanded(!isTaskInfoExpanded)}
                         >
                           <ChevronDown 
                             className={`h-4 w-4 text-gray-500 transition-transform ${
                               isTaskInfoExpanded ? 'rotate-0' : '-rotate-90'
                             }`} 
                           />
                           <label className="text-sm font-medium text-gray-700">
                             Meeting Information
                           </label>
                         </div>
                        
                        {isTaskInfoExpanded && (
                          <div className="space-y-4 pl-6">
                          {/* Associated Team */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Associated Team
                            </label>
                            <select 
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={associatedTeam}
                              onChange={(e) => setAssociatedTeam(e.target.value)}
                            >
                              <option value="">Select</option>
                              <option value="team1">Development Team</option>
                              <option value="team2">Design Team</option>
                              <option value="team3">QA Team</option>
                            </select>
                        </div>

                          {/* Owner */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Owner
                            </label>
                            <div className="relative" ref={ownerDropdownRef}>
                              {owner ? (
                                <div className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm w-fit">
                                  <span>{owner}</span>
                                  <button 
                                    onClick={removeOwner}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                            </div>
                              ) : (
                                <div className="relative">
                                  <input
                                    type="text"
                                    placeholder="Select owner"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    onFocus={() => setIsOwnerDropdownOpen(true)}
                                  />
                                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            </div>
                          )}
                              {isOwnerDropdownOpen && !owner && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                                  <div className="p-2">
                                    <div 
                                      className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                                      onClick={() => {
                                        setOwner('Inkhub Tattoos');
                                        setIsOwnerDropdownOpen(false);
                                      }}
                                    >
                                      Inkhub Tattoos
                        </div>
                                    <div 
                                      className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                                      onClick={() => {
                                        setOwner('Development Team');
                                        setIsOwnerDropdownOpen(false);
                                      }}
                                    >
                                      Development Team
                      </div>
                                    <div 
                                      className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                                      onClick={() => {
                                        setOwner('Design Team');
                                        setIsOwnerDropdownOpen(false);
                                      }}
                                    >
                                      Design Team
                </div>
              </div>
            </div>
          )}
                            </div>
                          </div>

                          {/* Work Hours */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Work Hours
                            </label>
                            <div className="relative" ref={workHoursDropdownRef}>
                              <input
                                type="text"
                                value={workHours}
                                onChange={(e) => setWorkHours(e.target.value)}
                                onFocus={() => setIsWorkHoursDropdownOpen(true)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              {isWorkHoursDropdownOpen && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                                  <div className="p-2">
                                    {['1:00', '2:00', '4:00', '6:00', '8:00', '10:00', '12:00'].map((hour) => (
                                      <div 
                                        key={hour}
                                        className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                                        onClick={() => {
                                          setWorkHours(hour);
                                          setIsWorkHoursDropdownOpen(false);
                                        }}
                                      >
                                        {hour}
                                      </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                           {/* Start Time and Duration in same row */}
                           <div className="grid grid-cols-2 gap-4">
                             <div>
                               <label className="block text-sm font-medium text-gray-700 mb-2">
                                 Start Time
                               </label>
                               <select
                                 value={startDate}
                                 onChange={(e) => setStartDate(e.target.value)}
                                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               >
                                 <option value="08:00">8:00 AM</option>
                                 <option value="09:00">9:00 AM</option>
                                 <option value="10:00">10:00 AM</option>
                                 <option value="11:00">11:00 AM</option>
                                 <option value="12:00">12:00 PM</option>
                                 <option value="13:00">1:00 PM</option>
                                 <option value="14:00">2:00 PM</option>
                                 <option value="15:00">3:00 PM</option>
                                 <option value="16:00">4:00 PM</option>
                                 <option value="17:00">5:00 PM</option>
                                 <option value="18:00">6:00 PM</option>
                               </select>
                             </div>

                             <div>
                               <label className="block text-sm font-medium text-gray-700 mb-2">
                                 Duration
                               </label>
                               <select
                                 value={workHours}
                                 onChange={(e) => setWorkHours(e.target.value)}
                                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               >
                                 <option value="0.5">30 minutes</option>
                                 <option value="1">1 hour</option>
                                 <option value="1.5">1.5 hours</option>
                                 <option value="2">2 hours</option>
                                 <option value="3">3 hours</option>
                                 <option value="4">4 hours</option>
                                 <option value="8">8 hours (Full day)</option>
                               </select>
                             </div>
                           </div>
                
                          {/* Priority */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Priority
                            </label>
                            <select 
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={priority}
                              onChange={(e) => setPriority(e.target.value)}
                            >
                              <option value="">None</option>
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="urgent">Urgent</option>
                            </select>
                    </div>
                
                          {/* Tags */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Tags
                            </label>
                            <div className="relative" ref={tagsDropdownRef}>
                              <input
                                type="text"
                                placeholder="Enter a tag name"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                onFocus={() => setIsTagsDropdownOpen(true)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              {isTagsDropdownOpen && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                                  <div className="p-2">
                                    {['Frontend', 'Backend', 'Design', 'Testing', 'Documentation', 'Bug Fix', 'Feature'].map((tag) => (
                                      <div 
                                        key={tag}
                                        className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                                        onClick={() => {
                                          setTags(tag);
                                          setIsTagsDropdownOpen(false);
                                        }}
                                      >
                                        {tag}
                  </div>
                                    ))}
                  </div>
                </div>
                              )}
                    </div>
                  </div>

                          {/* Reminder and Recurrence in same row */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reminder
                              </label>
                              <select 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={reminder}
                                onChange={(e) => setReminder(e.target.value)}
                              >
                                <option value="">Select reminder</option>
                                <option value="15min">15 minutes before</option>
                                <option value="1hour">1 hour before</option>
                                <option value="1day">1 day before</option>
                              </select>
                </div>
                
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Recurrence
                              </label>
                              <select 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={recurrence}
                                onChange={(e) => setRecurrence(e.target.value)}
                              >
                                <option value="">Select recurrence</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                              </select>
                    </div>
                  </div>
                
                          {/* Billing Type */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Billing Type
                            </label>
                            <select 
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={billingType}
                              onChange={(e) => setBillingType(e.target.value)}
                            >
                              <option value="">None</option>
                              <option value="hourly">Hourly</option>
                              <option value="fixed">Fixed Price</option>
                              <option value="milestone">Milestone</option>
                            </select>
                  </div>
                </div>
                        )}
              </div>
                    </>
          )}
        </div>
      </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex space-x-3">
                 <button
                     onClick={handleSubmitTask}
                     disabled={loading}
                     className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {loading ? 'Scheduling...' : 'Schedule'}
                   </button>
                   <button 
                     onClick={() => {
                       handleSubmitTask();
                       // Keep form open for adding more meetings
                       setShowTaskForm(true);
                     }}
                     disabled={loading}
                     className="flex-1 border border-blue-600 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {loading ? 'Scheduling...' : 'Schedule More'}
                   </button>
                  <button 
                    onClick={handleCloseTaskForm}
                    className="flex-1 border border-blue-600 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                  >
                    Cancel
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 



