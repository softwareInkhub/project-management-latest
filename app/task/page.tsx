'use client';
import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  MoreVertical, 
  Calendar, 
  User, 
  Clock,
  CheckCircle,
  CheckSquare,
  Circle,
  AlertCircle,
  Flag,
  MessageSquare,
  Paperclip,
  Eye,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { StatsCard } from '../components/ui/StatsCard';
import { SearchFilterSection } from '../components/ui/SearchFilterSection';
import { ViewToggle } from '../components/ui/ViewToggle';
import { AppLayout } from '../components/AppLayout';
import { TaskForm } from '../components/ui/TaskForm';
import { useTabs } from '../hooks/useTabs';
import { useSidebar } from '../components/AppLayout';

// Task interface based on the provided schema
interface Task {
  id: string;                    // Unique identifier (UUID)
  title: string;                 // Task title
  description: string;           // Detailed task description
  project: string;               // Project name this task belongs to
  assignedToTeam?: string;       // Assigned to team
  assignedToUser?: string;       // Assigned to user
  status: 'To Do' | 'In Progress' | 'Completed' | 'Overdue';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;              // ISO 8601 date string (YYYY-MM-DD)
  startDate: string;            // ISO 8601 date string (YYYY-MM-DD)
  estimatedHours: number;       // Estimated time in hours (decimal)
  tags: string;                 // Comma-separated tags
  subtasks: string[];           // Array of subtask IDs
  comments: string[];           // Array of comments
  parentId: string | null;      // Parent task ID (for subtasks)
  createdAt: string;            // ISO 8601 timestamp
  updatedAt: string;            // ISO 8601 timestamp
}

// Mock data for tasks
const tasks: Task[] = [
  {
    id: '1',
    title: 'Design new landing page',
    description: 'Create a modern, responsive landing page design for the new product launch',
    project: 'Website Redesign',
    assignedToUser: 'Sarah Johnson',
    status: 'In Progress',
    priority: 'High',
    dueDate: new Date().toISOString().split('T')[0], // Today
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days ago
    estimatedHours: 8,
    tags: 'design,frontend,ui',
    subtasks: ['1.1', '1.2'],
    comments: ['Initial design review completed', 'Need to update color scheme', 'Client feedback received'],
    parentId: null,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-12T14:30:00Z'
  },
  {
    id: '2',
    title: 'Implement user authentication',
    description: 'Set up secure user authentication system with JWT tokens',
    project: 'Mobile App Development',
    assignedToUser: 'Mike Chen',
    status: 'To Do',
    priority: 'High',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
    startDate: new Date().toISOString().split('T')[0], // Today
    estimatedHours: 12,
    tags: 'backend,security,api',
    subtasks: [],
    comments: ['Requirements finalized'],
    parentId: null,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '3',
    title: 'Write API documentation',
    description: 'Create comprehensive documentation for all REST API endpoints',
    project: 'API Integration',
    assignedToUser: 'Alex Rodriguez',
    status: 'In Progress',
    priority: 'Medium',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // This week
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
    estimatedHours: 6,
    tags: 'documentation,api',
    subtasks: [],
    comments: ['Started with authentication endpoints', 'Need to document error responses', 'Review with team scheduled', 'Added examples', 'Ready for review'],
    parentId: null,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-17T16:00:00Z'
  },
  {
    id: '4',
    title: 'Conduct user interviews',
    description: 'Interview 10 users to gather feedback on the current product',
    project: 'User Research Study',
    assignedToUser: 'Emily Davis',
    status: 'Completed',
    priority: 'Medium',
    dueDate: '2024-02-28',
    startDate: '2024-02-01',
    estimatedHours: 10,
    tags: 'research,user-feedback',
    subtasks: [],
    comments: ['Interview schedule created', '5 interviews completed', 'Initial insights gathered', 'Need to analyze data', 'Report draft ready', 'Stakeholder review scheduled', 'Final report approved', 'Action items identified'],
    parentId: null,
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-28T17:00:00Z'
  },
  {
    id: '5',
    title: 'Setup CI/CD pipeline',
    description: 'Configure automated testing and deployment pipeline',
    project: 'Database Migration',
    assignedToUser: 'David Kim',
    status: 'To Do',
    priority: 'Low',
    dueDate: '2024-04-10',
    startDate: '2024-03-01',
    estimatedHours: 16,
    tags: 'devops,automation',
    subtasks: [],
    comments: [],
    parentId: null,
    createdAt: '2024-02-25T10:00:00Z',
    updatedAt: '2024-02-25T10:00:00Z'
  },
  {
    id: '6',
    title: 'Create marketing materials',
    description: 'Design banners, social media posts, and email templates for Q2 campaign',
    project: 'Marketing Campaign',
    assignedToUser: 'Lisa Wang',
    status: 'In Progress',
    priority: 'High',
    dueDate: '2024-03-10',
    startDate: '2024-02-22',
    estimatedHours: 14,
    tags: 'marketing,design',
    subtasks: [],
    comments: ['Brand guidelines reviewed', 'Initial designs created'],
    parentId: null,
    createdAt: '2024-02-22T11:00:00Z',
    updatedAt: '2024-02-25T14:30:00Z'
  }
];

const statusConfig = {
  'To Do': { label: 'To Do', color: 'default', icon: Circle },
  'In Progress': { label: 'In Progress', color: 'info', icon: Clock },
  'Completed': { label: 'Completed', color: 'success', icon: CheckCircle },
  'Overdue': { label: 'Overdue', color: 'danger', icon: AlertCircle }
};

const priorityConfig = {
  'Low': { label: 'Low', color: 'default', icon: ArrowDown },
  'Medium': { label: 'Medium', color: 'warning', icon: Flag },
  'High': { label: 'High', color: 'danger', icon: ArrowUp }
};

const TasksPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [activePredefinedFilter, setActivePredefinedFilter] = useState('all');
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, string | string[]>>({});
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isFormAnimating, setIsFormAnimating] = useState(false);
  const [formHeight, setFormHeight] = useState(80); // Default 80vh
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskPreviewOpen, setIsTaskPreviewOpen] = useState(false);
  const [isPreviewAnimating, setIsPreviewAnimating] = useState(false);
  const taskFormRef = useRef<HTMLDivElement>(null);
  const taskPreviewRef = useRef<HTMLDivElement>(null);
  const { openTab } = useTabs();
  const { isCollapsed } = useSidebar();

  const isOverdue = (dueDate: string) => {
    const task = tasks.find(t => t.dueDate === dueDate);
    return new Date(dueDate) < new Date() && task?.status !== 'Completed';
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesProject = projectFilter === 'all' || task.project === projectFilter;
    
    // Apply predefined filters
    let matchesPredefined = true;
    if (activePredefinedFilter === 'completed') {
      matchesPredefined = task.status === 'Completed';
    } else if (activePredefinedFilter === 'todo') {
      matchesPredefined = task.status === 'To Do';
    } else if (activePredefinedFilter === 'in-progress') {
      matchesPredefined = task.status === 'In Progress';
    } else if (activePredefinedFilter === 'overdue') {
      matchesPredefined = isOverdue(task.dueDate);
    } else if (activePredefinedFilter === 'high-priority') {
      matchesPredefined = task.priority === 'High';
    }
    
    // Apply advanced filters
    let matchesAdvanced = true;
    Object.entries(advancedFilters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          matchesAdvanced = matchesAdvanced && value.includes(task[key as keyof typeof task] as string);
        }
      } else if (value && value !== 'all') {
        matchesAdvanced = matchesAdvanced && task[key as keyof typeof task] === value;
      }
    });
    
    return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesPredefined && matchesAdvanced;
  });

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    return <Icon className="w-4 h-4" />;
  };

  const getPriorityIcon = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    const Icon = config.icon;
    return <Icon className="w-4 h-4" />;
  };

  // Calculate counts for each filter
  const getFilterCount = (filterKey: string) => {
    return tasks.filter(task => {
      if (filterKey === 'all') return true;
      if (filterKey === 'completed') return task.status === 'Completed';
      if (filterKey === 'todo') return task.status === 'To Do';
      if (filterKey === 'in-progress') return task.status === 'In Progress';
      if (filterKey === 'overdue') return isOverdue(task.dueDate);
      if (filterKey === 'high-priority') return task.priority === 'High';
      return false;
    }).length;
  };

  // Predefined filters
  const predefinedFilters = [
    {
      key: 'all',
      label: 'All Tasks',
      count: getFilterCount('all'),
      isActive: activePredefinedFilter === 'all',
      onClick: () => setActivePredefinedFilter('all')
    },
    {
      key: 'completed',
      label: 'Completed',
      count: getFilterCount('completed'),
      isActive: activePredefinedFilter === 'completed',
      onClick: () => setActivePredefinedFilter('completed')
    },
    {
      key: 'todo',
      label: 'Todo',
      count: getFilterCount('todo'),
      isActive: activePredefinedFilter === 'todo',
      onClick: () => setActivePredefinedFilter('todo')
    },
    {
      key: 'in-progress',
      label: 'In Progress',
      count: getFilterCount('in-progress'),
      isActive: activePredefinedFilter === 'in-progress',
      onClick: () => setActivePredefinedFilter('in-progress')
    },
    {
      key: 'overdue',
      label: 'Overdue',
      count: getFilterCount('overdue'),
      isActive: activePredefinedFilter === 'overdue',
      onClick: () => setActivePredefinedFilter('overdue')
    },
    {
      key: 'high-priority',
      label: 'High Priority',
      count: getFilterCount('high-priority'),
      isActive: activePredefinedFilter === 'high-priority',
      onClick: () => setActivePredefinedFilter('high-priority')
    }
  ];

  // Advanced filter handlers
  const handleAdvancedFilterChange = (key: string, value: string | string[]) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyAdvancedFilters = () => {
    // Filters are already applied in real-time
    console.log('Advanced filters applied:', advancedFilters);
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters({});
  };

  // Task form handlers
  const handleCreateTask = () => {
    setFormHeight(80); // Reset to default height
    setIsTaskFormOpen(true);
    setIsFormAnimating(true); // Start with form off-screen (translate-y-full)
    
    // Trigger slide-up animation after a brief delay
    setTimeout(() => {
      setIsFormAnimating(false); // Animate to visible (translate-y-0)
    }, 10);
  };

  const handleTaskFormSubmit = (taskData: Partial<Task>) => {
    // Here you would typically save the task to your backend
    console.log('New task created:', taskData);
    closeForm();
  };

  const handleTaskFormCancel = () => {
    closeForm();
  };

  const closeForm = () => {
    setIsFormAnimating(true); // Start slide-down animation (translate-y-full)
    
    // Wait for slide-down animation to complete before hiding
    setTimeout(() => {
      setIsTaskFormOpen(false);
      setIsFormAnimating(false);
    }, 300);
  };

  // Drag handlers for form height
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const windowHeight = window.innerHeight;
    const newHeight = ((windowHeight - e.clientY) / windowHeight) * 100;
    
    // Constrain height between 30% and 95% of viewport
    const constrainedHeight = Math.min(Math.max(newHeight, 30), 95);
    setFormHeight(constrainedHeight);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Task preview and edit handlers
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskPreviewOpen(true);
    setIsPreviewAnimating(false);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskPreviewOpen(false);
    setIsTaskFormOpen(true);
    setIsFormAnimating(false);
  };

  const closeTaskPreview = () => {
    setIsPreviewAnimating(true);
    setTimeout(() => {
      setIsTaskPreviewOpen(false);
      setIsPreviewAnimating(false);
      setSelectedTask(null);
    }, 300);
  };

  // Close task form and preview when clicking outside and handle drag events
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (taskFormRef.current && !taskFormRef.current.contains(event.target as Node)) {
        closeForm();
      }
      if (taskPreviewRef.current && !taskPreviewRef.current.contains(event.target as Node)) {
        closeTaskPreview();
      }
    };

    if (isTaskFormOpen || isTaskPreviewOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTaskFormOpen, isTaskPreviewOpen]);

  // Handle drag events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <AppLayout onCreateTask={handleCreateTask}>
      <div className="w-full px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Tasks</h1>
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <ViewToggle
              currentView={viewMode}
              views={[
                {
                  value: 'list',
                  label: 'List',
                  icon: (
                    <div className="w-3 h-3 flex flex-col space-y-0.5">
                      <div className="w-full h-0.5 rounded-sm bg-current"></div>
                      <div className="w-full h-0.5 rounded-sm bg-current"></div>
                      <div className="w-full h-0.5 rounded-sm bg-current"></div>
                    </div>
                  )
                },
                {
                  value: 'card',
                  label: 'Card',
                  icon: (
                    <div className="w-3 h-3 grid grid-cols-2 gap-0.5">
                      <div className="w-1 h-1 rounded-sm bg-current"></div>
                      <div className="w-1 h-1 rounded-sm bg-current"></div>
                      <div className="w-1 h-1 rounded-sm bg-current"></div>
                      <div className="w-1 h-1 rounded-sm bg-current"></div>
                    </div>
                  )
                }
              ]}
              onChange={(view: 'list' | 'card') => setViewMode(view)}
            />
            <div className="hidden lg:block">
              <Button 
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                onClick={handleCreateTask}
              >
                <Plus size={16} className="sm:w-4 sm:h-4" />
                <span className="text-sm sm:text-base">New Task</span>
              </Button>
            </div>
          </div>
        </div>


        {/* Filters and Search */}
        <SearchFilterSection
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search tasks..."
          variant="modern"
          showActiveFilters={true}
          predefinedFilters={predefinedFilters}
          onAdvancedFilterChange={handleAdvancedFilterChange}
          onApplyAdvancedFilters={handleApplyAdvancedFilters}
          onClearAdvancedFilters={handleClearAdvancedFilters}
          advancedFilters={advancedFilters}
          filters={[
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'all', label: 'All Status' },
                { value: 'To Do', label: 'To Do' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Overdue', label: 'Overdue' }
              ]
            },
            {
              key: 'priority',
              label: 'Priority',
              value: priorityFilter,
              onChange: setPriorityFilter,
              options: [
                { value: 'all', label: 'All Priority' },
                { value: 'High', label: 'High' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Low', label: 'Low' }
              ]
            },
            {
              key: 'project',
              label: 'Project',
              value: projectFilter,
              onChange: setProjectFilter,
              options: [
                { value: 'all', label: 'All Projects' },
                ...Array.from(new Set(tasks.map(t => t.project))).map(project => ({
                  value: project,
                  label: project
                }))
              ]
            }
          ]}
        />

         {/* Tasks List */}
         {viewMode === 'list' ? (
           <div className="space-y-3">
             {filteredTasks.map((task) => (
               <div key={task.id} className="relative p-3 sm:p-4 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors min-h-[120px] sm:min-h-[140px] flex flex-col sm:flex-row sm:items-center cursor-pointer" onClick={() => handleTaskClick(task)}>
                 {/* Action Buttons and Assignee Info - Top Right Corner (Desktop) */}
                 <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col items-end space-y-2 z-20">
                   {/* Action Buttons */}
                   <div className="flex items-center space-x-1">
                   
                     <Button 
                       variant="ghost" 
                       size="sm"
                       title="Edit Task"
                       className="p-1.5 h-7 w-7 sm:p-2 sm:h-9 sm:w-9"
                       onClick={(e) => {
                         e.stopPropagation();
                         handleEditTask(task);
                       }}
                     >
                       <Edit size={14} className="sm:w-[18px] sm:h-[18px]" />
                     </Button>
                     <Button 
                       variant="ghost" 
                       size="sm"
                       title="More Options"
                       className="p-1.5 h-7 w-7 sm:p-2 sm:h-9 sm:w-9"
                     >
                       <MoreVertical size={14} className="sm:w-[18px] sm:h-[18px]" />
                     </Button>
                   </div>
                   
                   {/* Assignee and Due Date (Desktop only) */}
                   <div className="hidden sm:flex items-center space-x-2">
                     <div className="flex -space-x-2">
                       <Avatar name={task.assignedToUser} size="sm" />
                       <Avatar name="Team Member 2" size="sm" />
                       <Avatar name="Team Member 3" size="sm" />
                     </div>
                     <span className="text-xs text-gray-500">{task.assignedToUser}</span>
                     <div className="flex items-center space-x-1 text-xs">
                       <Calendar size={12} />
                       <span className={isOverdue(task.dueDate) ? 'text-red-600 font-medium' : 'text-gray-500'}>
                         {new Date(task.dueDate).toLocaleDateString()}
                       </span>
                     </div>
                   </div>
                 </div>

                 {/* Main Content Area */}
                 <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pr-16 sm:pr-20 flex-1">
                   {/* Project Icon and Task Content in Same Row */}
                   <div className="flex items-start space-x-3 flex-1 min-w-0">
                     {/* Project Icon */}
                     <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                       {task.project.charAt(0)}
                     </div>
                     
                     {/* Task Content */}
                     <div className="flex-1 min-w-0">
                       <div>
                         <h3 className={`text-sm sm:text-base font-semibold ${task.status === 'Completed' ? 'line-through text-gray-500' : 'text-gray-900'} leading-tight line-clamp-1 sm:line-clamp-none`}>
                           {task.title}
                         </h3>
                         <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-1 sm:line-clamp-2 leading-relaxed">
                           {task.description}
                         </p>
                       </div>
                       
                       {/* Task Meta Info */}
                       <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-500 mt-3">
                         <div className="flex items-center space-x-1">
                           <Badge variant={statusConfig[task.status as keyof typeof statusConfig].color as any} size="sm">
                             {getStatusIcon(task.status)}
                             <span className="ml-1 hidden sm:inline">{statusConfig[task.status as keyof typeof statusConfig].label}</span>
                           </Badge>
                         </div>
                         <div className="flex items-center space-x-1">
                           <Badge variant={priorityConfig[task.priority as keyof typeof priorityConfig].color as any} size="sm">
                             {getPriorityIcon(task.priority)}
                             <span className="ml-1 hidden sm:inline">{priorityConfig[task.priority as keyof typeof priorityConfig].label}</span>
                           </Badge>
                         </div>
                         <div className="flex items-center space-x-1">
                           <Clock size={10} className="sm:w-3 sm:h-3" />
                           <span className="text-xs">{task.estimatedHours}h</span>
                         </div>
                         {task.comments.length > 0 && (
                           <div className="flex items-center space-x-1">
                             <MessageSquare size={10} className="sm:w-3 sm:h-3" />
                             <span className="text-xs">{task.comments.length}</span>
                           </div>
                         )}
                         {task.subtasks.length > 0 && (
                           <div className="flex items-center space-x-1">
                             <Paperclip size={10} className="sm:w-3 sm:h-3" />
                             <span className="text-xs">{task.subtasks.length}</span>
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 {/* Tags - Absolutely centered in the card (Desktop) */}
                 <div className="hidden sm:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
                   <div className="flex justify-center items-center gap-1">
                     {task.tags.split(',').slice(0, 3).map((tag, index) => (
                       <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                         {tag.trim()}
                       </span>
                     ))}
                     {task.tags.split(',').length > 3 && (
                       <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                         +{task.tags.split(',').length - 3}
                       </span>
                     )}
                   </div>
                 </div>

                 {/* Mobile: Assignee and Due Date - Bottom Row */}
                 <div className="sm:hidden flex items-center justify-between mt-3">
                   {/* Tags */}
                   <div className="flex flex-wrap gap-1">
                     {task.tags.split(',').slice(0, 2).map((tag, index) => (
                       <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                         {tag.trim()}
                       </span>
                     ))}
                     {task.tags.split(',').length > 2 && (
                       <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                         +{task.tags.split(',').length - 2}
                       </span>
                     )}
                   </div>
                   
                   {/* Assignee and Due Date */}
                   <div className="flex items-center space-x-2">
                     <Avatar name={task.assignedToUser} size="sm" />
                     <div className="flex flex-col items-end">
                       <div className="flex items-center space-x-1 text-xs">
                         <Calendar size={10} />
                         <span className={`text-xs ${isOverdue(task.dueDate) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                           {new Date(task.dueDate).toLocaleDateString()}
                         </span>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             ))}
           </div>
        ) : (
          /* Card View */
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {filteredTasks.map((task) => (
              <Card key={task.id} hover className="cursor-pointer" onClick={() => handleTaskClick(task)}>
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-3">
                    {/* Header with Project Icon and Title */}
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                        {task.project.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-xs sm:text-sm leading-tight line-clamp-2">{task.title}</h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-1 hidden sm:block">{task.description}</p>
                      </div>
                    </div>
                    
                    {/* Status and Priority Badges - Priority hidden on mobile */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <Badge variant={statusConfig[task.status as keyof typeof statusConfig].color as any} size="sm" className="text-xs">
                        {getStatusIcon(task.status)}
                        <span className="ml-1 text-xs">{statusConfig[task.status as keyof typeof statusConfig].label}</span>
                      </Badge>
                      <div className="hidden sm:block">
                        <Badge variant={priorityConfig[task.priority as keyof typeof priorityConfig].color as any} size="sm" className="text-xs">
                          {getPriorityIcon(task.priority)}
                        </Badge>
                      </div>
                    </div>
                      
                    {/* Meta Info - Minimal on mobile */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock size={8} className="sm:w-3 sm:h-3" />
                        <span className="text-xs">{task.estimatedHours}h</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {task.comments.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <MessageSquare size={8} className="sm:w-3 sm:h-3" />
                            <span className="text-xs">{task.comments.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                      
                    {/* Tags - Show only first tag on mobile */}
                    <div className="flex flex-wrap gap-1">
                      {task.tags.split(',').slice(0, 1).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {tag.trim()}
                        </span>
                      ))}
                      {task.tags.split(',').length > 1 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{task.tags.split(',').length - 1}
                        </span>
                      )}
                    </div>
                      
                    {/* Assignee and Due Date - Minimal on mobile */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <Avatar name={task.assignedToUser} size="sm" />
                        <span className="text-xs text-gray-500 hidden sm:inline">{task.assignedToUser}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs">
                        <Calendar size={8} className="sm:w-3 sm:h-3" />
                        <span className={`text-xs ${isOverdue(task.dueDate) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
            <Button onClick={handleCreateTask}>Create New Task</Button>
          </div>
        )}

      </div>

      {/* Task Form - Slides up from bottom */}
      {isTaskFormOpen && (
        <div className={`fixed inset-0  z-50 flex items-end transition-opacity duration-300 ${
          isFormAnimating ? 'bg-opacity-0' : 'bg-opacity-50'
        }`}>
          <div 
            ref={taskFormRef}
            className={`w-full transform transition-all duration-300 ease-out ${
              isFormAnimating ? 'translate-y-full' : 'translate-y-0'
            } ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}
          >
            <div 
              className="bg-white rounded-t-2xl shadow-2xl overflow-y-auto"
              style={{ 
                height: `${formHeight}vh`,
                boxShadow: '0 -10px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              {/* Drag Handle - Sticky */}
              <div 
                className={`sticky top-0 z-20 w-full h-6 flex items-center justify-center cursor-row-resize hover:bg-gray-50 transition-colors ${isDragging ? 'bg-gray-100' : ''}`}
                onMouseDown={handleMouseDown}
              >
                <div className="w-12 h-1 bg-gray-400 rounded-full"></div>
              </div>
              <div className="p-6">
                <TaskForm
                  task={selectedTask || undefined}
                  onSubmit={handleTaskFormSubmit}
                  onCancel={handleTaskFormCancel}
                  isEditing={!!selectedTask}
                  projects={Array.from(new Set(tasks.map(t => t.project)))}
                  teams={['Frontend Team', 'Backend Team', 'Design Team', 'QA Team']}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Preview - Slides up from bottom */}
      {isTaskPreviewOpen && selectedTask && (
        <div className={`fixed inset-0 z-50 flex items-end transition-opacity duration-300 ${
          isPreviewAnimating ? 'bg-opacity-0' : 'bg-opacity-30'
        }`}>
          <div 
            ref={taskPreviewRef}
            className={`transform transition-all duration-300 ease-out ${
              isPreviewAnimating ? 'translate-y-full' : 'translate-y-0'
            } ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}
            style={{ 
              width: `calc(100% - ${isCollapsed ? '4rem' : '16rem'})`,
              height: `${formHeight}vh`,
              boxShadow: '0 -10px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div 
              className="bg-white rounded-t-2xl shadow-2xl overflow-y-auto"
              style={{ 
                height: `${formHeight}vh`,
                boxShadow: '0 -10px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                backgroundColor: 'white'
              }}
            >
              {/* Drag Handle - Sticky */}
              <div 
                className={`sticky top-0 z-20 w-full h-6 flex items-center justify-center cursor-row-resize hover:bg-gray-50 transition-colors ${isDragging ? 'bg-gray-100' : ''}`}
                onMouseDown={handleMouseDown}
              >
                <div className="w-12 h-1 bg-gray-400 rounded-full"></div>
              </div>
              
              <div className="p-6">
                {/* Task Preview Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <CheckSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedTask.title}</h2>
                      <p className="text-gray-500 text-sm">Task Details</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={closeTaskPreview}
                      className="px-4 py-2"
                    >
                      Close
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleEditTask(selectedTask)}
                      className="px-4 py-2"
                    >
                      Edit Task
                    </Button>
                  </div>
                </div>

                {/* Task Details */}
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Description</label>
                        <p className="text-gray-600">{selectedTask.description}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Project</label>
                        <p className="text-gray-600">{selectedTask.project}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status and Priority */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Status</label>
                        <Badge variant={statusConfig[selectedTask.status as keyof typeof statusConfig].color as any} size="md">
                          {getStatusIcon(selectedTask.status)}
                          <span className="ml-2">{statusConfig[selectedTask.status as keyof typeof statusConfig].label}</span>
                        </Badge>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Priority</label>
                        <Badge variant={priorityConfig[selectedTask.priority as keyof typeof priorityConfig].color as any} size="md">
                          {getPriorityIcon(selectedTask.priority)}
                          <span className="ml-2">{selectedTask.priority}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Dates and Time */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Start Date</label>
                        <p className="text-gray-600">{new Date(selectedTask.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Due Date</label>
                        <p className={`${isOverdue(selectedTask.dueDate) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                          {new Date(selectedTask.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Estimated Time</label>
                        <p className="text-gray-600">{selectedTask.estimatedHours} hours</p>
                      </div>
                    </div>
                  </div>

                  {/* Assignment */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Assigned To</label>
                        <div className="flex items-center space-x-3">
                          <Avatar name={selectedTask.assignedToUser} size="md" />
                          <span className="text-gray-600">{selectedTask.assignedToUser}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Team</label>
                        <p className="text-gray-600">{selectedTask.assignedToTeam || 'Not assigned'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tags and Additional Info */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Tags</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedTask.tags.split(',').map((tag, index) => (
                            <span key={index} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">Comments</label>
                          <p className="text-gray-600">{selectedTask.comments.length} comments</p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">Subtasks</label>
                          <p className="text-gray-600">{selectedTask.subtasks.length} subtasks</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default TasksPage;
