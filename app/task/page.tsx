'use client';
import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  MoreVertical, 
  Calendar, 
  User, 
  Users,
  Clock,
  CheckCircle,
  CheckSquare,
  Circle,
  AlertCircle,
  AlertTriangle,
  Flag,
  MessageSquare,
  Paperclip,
  Eye,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  X,
  Search,
  Link,
  Upload
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
import { useAuth } from '../hooks/useAuth';
import { apiService, Task } from '../services/api';
import { driveService, FileItem } from '../services/drive';

// Mock data for tasks (fallback when API fails)
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Design new landing page',
    description: 'Create a modern, responsive landing page design for the new product launch',
    project: 'Website Redesign',
    assignee: 'Sarah Johnson',
    assignedTeams: ['design-team'],
    assignedUsers: ['user-1'],
    status: 'In Progress',
    priority: 'High',
    dueDate: new Date().toISOString().split('T')[0], // Today
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days ago
    estimatedHours: 8,
    tags: 'design,frontend,ui',
    subtasks: '["1.1", "1.2"]',
    comments: '3',
    parentId: null,
    progress: 45,
    timeSpent: '3.5',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-12T14:30:00Z'
  },
  {
    id: '2',
    title: 'Implement user authentication',
    description: 'Set up secure user authentication system with JWT tokens',
    project: 'Mobile App Development',
    assignee: 'Mike Chen',
    assignedTeams: ['backend-team'],
    assignedUsers: ['user-2'],
    status: 'To Do',
    priority: 'High',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
    startDate: new Date().toISOString().split('T')[0], // Today
    estimatedHours: 12,
    tags: 'backend,security,api',
    subtasks: '[]',
    comments: '1',
    parentId: null,
    progress: 0,
    timeSpent: '0',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '3',
    title: 'Write API documentation',
    description: 'Create comprehensive documentation for all REST API endpoints',
    project: 'API Integration',
    assignee: 'Alex Rodriguez',
    assignedTeams: ['backend-team'],
    assignedUsers: ['user-3'],
    status: 'In Progress',
    priority: 'Medium',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // This week
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
    estimatedHours: 6,
    tags: 'documentation,api',
    subtasks: '[]',
    comments: '5',
    parentId: null,
    progress: 60,
    timeSpent: '3.5',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-17T16:00:00Z'
  },
  {
    id: '4',
    title: 'Conduct user interviews',
    description: 'Interview 10 users to gather feedback on the current product',
    project: 'User Research Study',
    assignee: 'Emily Davis',
    assignedTeams: ['research-team'],
    assignedUsers: ['user-4'],
    status: 'Completed',
    priority: 'Medium',
    dueDate: '2024-02-28',
    startDate: '2024-02-01',
    estimatedHours: 10,
    tags: 'research,user-feedback',
    subtasks: '[]',
    comments: '8',
    parentId: null,
    progress: 100,
    timeSpent: '10',
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-28T17:00:00Z'
  },
  {
    id: '5',
    title: 'Setup CI/CD pipeline',
    description: 'Configure automated testing and deployment pipeline',
    project: 'Database Migration',
    assignee: 'David Kim',
    assignedTeams: ['devops-team'],
    assignedUsers: ['user-5'],
    status: 'To Do',
    priority: 'Low',
    dueDate: '2024-04-10',
    startDate: '2024-03-01',
    estimatedHours: 16,
    tags: 'devops,automation',
    subtasks: '[]',
    comments: '0',
    parentId: null,
    progress: 0,
    timeSpent: '0',
    createdAt: '2024-02-25T10:00:00Z',
    updatedAt: '2024-02-25T10:00:00Z'
  },
  {
    id: '6',
    title: 'Create marketing materials',
    description: 'Design banners, social media posts, and email templates for Q2 campaign',
    project: 'Marketing Campaign',
    assignee: 'Lisa Wang',
    assignedTeams: ['marketing-team'],
    assignedUsers: ['user-6'],
    status: 'In Progress',
    priority: 'High',
    dueDate: '2024-03-10',
    startDate: '2024-02-22',
    estimatedHours: 14,
    tags: 'marketing,design',
    subtasks: '[]',
    comments: '2',
    parentId: null,
    progress: 30,
    timeSpent: '4.5',
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

// Helper function to get status config with fallback
const getStatusConfig = (status: string) => {
  return statusConfig[status as keyof typeof statusConfig] || {
    label: status || 'Unknown',
    color: 'default',
    icon: Circle
  };
};

const priorityConfig = {
  'Low': { label: 'Low', color: 'default', icon: ArrowDown },
  'Medium': { label: 'Medium', color: 'warning', icon: Flag },
  'High': { label: 'High', color: 'danger', icon: ArrowUp }
};

// Helper function to get priority config with fallback
const getPriorityConfig = (priority: string) => {
  return priorityConfig[priority as keyof typeof priorityConfig] || {
    label: priority || 'Unknown',
    color: 'default',
    icon: Flag
  };
};

const TasksPage = () => {
  const { user } = useAuth();
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskPreviewOpen, setIsTaskPreviewOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  
  // Subtask management
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskSearch, setSubtaskSearch] = useState('');
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false);
  const [parentTaskForSubtask, setParentTaskForSubtask] = useState<Task | null>(null);
  const [isPreviewAnimating, setIsPreviewAnimating] = useState(false);
  
  // Comment management
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  // File attachment management
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [filePreviews, setFilePreviews] = useState<{[key: string]: string}>({});
  const [loadingPreviews, setLoadingPreviews] = useState<Set<string>>(new Set());
  
  // File preview modal state
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<FileItem | null>(null);

  // Resizable columns state
  const [columnWidths, setColumnWidths] = useState<{[key: string]: number}>({
    project: 140,
    taskName: 180,
    taskDescription: 220,
    status: 100,
    priority: 100,
    time: 80,
    comments: 130,
    subtasks: 130,
    tags: 140,
    dueDate: 110,
    actions: 100
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragColumn, setDragColumn] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Dropdown menu
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // User and team selection in preview
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [pendingUsers, setPendingUsers] = useState<string[]>([]);
  const [pendingTeams, setPendingTeams] = useState<string[]>([]);
  const [pendingSubtasks, setPendingSubtasks] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Confirmation dialogs
  const [showRemoveUserConfirm, setShowRemoveUserConfirm] = useState(false);
  const [showRemoveSubtaskConfirm, setShowRemoveSubtaskConfirm] = useState(false);
  const [userToRemove, setUserToRemove] = useState<string | null>(null);
  const [subtaskToRemove, setSubtaskToRemove] = useState<string | null>(null);
  
  // Refs for confirmation modals
  const removeUserConfirmRef = useRef<HTMLDivElement>(null);
  const removeSubtaskConfirmRef = useRef<HTMLDivElement>(null);

  // Debug: Log state changes
  useEffect(() => {
    console.log('🔍 TaskForm state changed:', {
      isTaskFormOpen,
      isCreatingSubtask,
      isAddingSubtask,
      hasSelectedTask: !!selectedTask,
      hasParentTaskForSubtask: !!parentTaskForSubtask,
      selectedTaskTitle: selectedTask?.title,
      parentTaskTitle: parentTaskForSubtask?.title
    });
  }, [isTaskFormOpen, isCreatingSubtask, isAddingSubtask, selectedTask, parentTaskForSubtask]);

  // Debug: Log delete modal state changes
  useEffect(() => {
    console.log('🗑️ Delete modal state changed:', {
      showDeleteConfirm,
      taskToDelete: taskToDelete?.title,
      deleteConfirmText
    });
  }, [showDeleteConfirm, taskToDelete, deleteConfirmText]);



  // Simple back navigation (one step back)
  const handleBack = () => {
    closeTaskPreview();
  };

  // Delete task functions
  const handleDeleteTask = (task: Task) => {
    console.log('🗑️ handleDeleteTask called with task:', task);
    console.log('🗑️ Setting taskToDelete:', task);
    console.log('🗑️ Setting showDeleteConfirm to true');
    setTaskToDelete(task);
    setShowDeleteConfirm(true);
    setDeleteConfirmText('');
    console.log('🗑️ Delete task state updated');
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete || deleteConfirmText !== 'DELETE') {
      console.log('❌ Delete validation failed:', { taskToDelete, deleteConfirmText });
      return;
    }

    try {
      console.log('🗑️ Starting task deletion:', taskToDelete.id, taskToDelete.title);
      const result = await deleteTask(taskToDelete.id);
      console.log('🗑️ Delete result:', result);
      
      if (result.success) {
        console.log('✅ Task deleted successfully');
        // Refresh tasks list
        await fetchTasks();
        // Close any open preview if it was the deleted task
        if (selectedTask && selectedTask.id === taskToDelete.id) {
          closeTaskPreview();
        }
        // Show success message (you can add a toast notification here)
        alert('Task deleted successfully!');
      } else {
        console.error('❌ Failed to delete task:', result.error);
        alert(`Failed to delete task: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error deleting task:', error);
      alert('An unexpected error occurred while deleting the task');
    } finally {
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
      setDeleteConfirmText('');
    }
  };

  const cancelDeleteTask = () => {
    setShowDeleteConfirm(false);
    setTaskToDelete(null);
    setDeleteConfirmText('');
  };
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const taskFormRef = useRef<HTMLDivElement>(null);
  const taskPreviewRef = useRef<HTMLDivElement>(null);
  const { openTab } = useTabs();
  const { isCollapsed } = useSidebar();

  // API Functions
  const fetchTasks = async () => {
    try {
      console.log('🔄 Starting to fetch tasks...');
      setIsLoading(true);
      setError(null);
      
      console.log('📡 Calling apiService.getTasks()...');
      const response = await apiService.getTasks();
      console.log('📡 API response received:', response);
      
      if (response.success && response.data) {
        console.log('✅ Tasks fetched successfully, count:', response.data.length);
        setTasks(response.data);
      } else {
        console.log('❌ API returned error:', response.error);
        setError(response.error || 'Failed to fetch tasks');
        // Fallback to mock data if API fails
        console.log('🔄 Falling back to mock data...');
        setTasks(mockTasks);
      }
    } catch (error) {
      console.error('❌ Error fetching tasks:', error);
      setError('An unexpected error occurred');
      // Fallback to mock data if API fails
      console.log('🔄 Falling back to mock data due to error...');
      setTasks(mockTasks);
    } finally {
      setIsLoading(false);
      console.log('🏁 fetchTasks completed');
    }
  };

  const createTask = async (taskData: Partial<Task>) => {
    try {
      const response = await apiService.createTask(taskData);
      
      if (response.success && response.data) {
        setTasks(prev => [...prev, response.data!]);
        
        // Send WhatsApp notification
        try {
          await apiService.sendWhatsAppNotification(response.data);
          console.log('✅ WhatsApp notification sent successfully');
        } catch (error) {
          console.error('❌ Error sending notification:', error);
        }
        
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error || 'Failed to create task' };
      }
    } catch (error) {
      console.error('Error creating task:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await apiService.updateTask(taskId, updates);
      
      if (response.success && response.data) {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? response.data! : task
        ));
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error || 'Failed to update task' };
      }
    } catch (error) {
      console.error('Error updating task:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      console.log('🗑️ Calling apiService.deleteTask with ID:', taskId);
      const response = await apiService.deleteTask(taskId);
      console.log('🗑️ API response:', response);
      
      if (response.success) {
        console.log('✅ API deletion successful, updating local state');
        setTasks(prev => prev.filter(task => task.id !== taskId));
        return { success: true };
      } else {
        console.error('❌ API deletion failed:', response.error);
        return { success: false, error: response.error || 'Failed to delete task' };
      }
    } catch (error) {
      console.error('❌ Error in deleteTask function:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  // Subtask Functions
  const createSubtask = async (parentTaskId: string, subtaskData: Partial<Task>) => {
    try {
      // Create the subtask with parentId
      const subtaskWithParent = {
        ...subtaskData,
        parentId: parentTaskId,
        subtasks: '[]',
        comments: '0',
        progress: 0,
        timeSpent: '0'
      };

      const response = await apiService.createTask(subtaskWithParent);
      
      if (response.success && response.data) {
        // Add subtask to tasks list
        setTasks(prev => [...prev, response.data!]);
        
        // Update parent task's subtasks array
        const parentTask = tasks.find(t => t.id === parentTaskId);
        if (parentTask) {
          try {
            const subtasksArray = JSON.parse(parentTask.subtasks || '[]');
            subtasksArray.push(response.data.id);
            
            await apiService.updateTask(parentTaskId, {
              subtasks: JSON.stringify(subtasksArray)
            });
            
            // Update local state
            setTasks(prev => prev.map(task => 
              task.id === parentTaskId 
                ? { ...task, subtasks: JSON.stringify(subtasksArray) }
                : task
            ));
          } catch (error) {
            console.error('Error updating parent task subtasks:', error);
          }
        }
        
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error || 'Failed to create subtask' };
      }
    } catch (error) {
      console.error('Error creating subtask:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const getSubtasks = (parentTaskId: string): Task[] => {
    return tasks.filter(task => task.parentId === parentTaskId);
  };

  const getSubtaskCount = (task: Task): number => {
    try {
      // Method 1: Count by parentId
      const byParent = tasks.filter(t => t.parentId === task.id).length;
      
      // Method 2: Count by subtasks array
      let byArray = 0;
      try {
        if (typeof task.subtasks === 'string' && task.subtasks.trim()) {
          const subtasksArray = JSON.parse(task.subtasks);
          if (Array.isArray(subtasksArray)) {
            byArray = tasks.filter(t => subtasksArray.includes(t.id)).length;
          }
        }
      } catch {}
      
      // Return the maximum of both methods
      return Math.max(byParent, byArray);
    } catch (error) {
      return 0;
    }
  };

  // Load tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  // Fetch users for task assignment
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      console.log('👥 Fetching users for task assignment...');
      const res = await apiService.getUsers();
      console.log('🔍 Users API response:', res);
      if (res.success && res.data) {
        console.log('✅ Users fetched:', res.data.length, res.data);
        setAllUsers(res.data);
      } else {
        console.error('❌ Failed to fetch users:', res.error);
        setAllUsers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      setAllUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch teams for task assignment
  const fetchTeams = async () => {
    setIsLoadingTeams(true);
    try {
      console.log('👥 Fetching teams for task assignment...');
      const res = await apiService.getTeams();
      console.log('🔍 Teams API response:', res);
      if (res.success && res.data) {
        console.log('✅ Teams fetched:', res.data.length, res.data);
        setAllTeams(res.data);
      } else {
        console.error('❌ Failed to fetch teams:', res.error);
        setAllTeams([]);
      }
    } catch (error) {
      console.error('❌ Error fetching teams:', error);
      setAllTeams([]);
    } finally {
      setIsLoadingTeams(false);
    }
  };

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
    const config = getStatusConfig(status);
    const Icon = config.icon;
    return <Icon className="w-4 h-4" />;
  };

  const getPriorityIcon = (priority: string) => {
    const config = getPriorityConfig(priority);
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
    
    // Fetch users and teams when opening form
    fetchUsers();
    fetchTeams();
    
    // Trigger slide-up animation after a brief delay
    setTimeout(() => {
      setIsFormAnimating(false); // Animate to visible (translate-y-0)
    }, 10);
  };

  const handleCreateSubtask = () => {
    console.log('🔄 handleCreateSubtask: Closing preview and opening form');
    
    // Store the parent task before clearing selectedTask
    const parentTask = selectedTask;
    
    // Close the preview modal first
    setIsTaskPreviewOpen(false);
    setIsPreviewAnimating(true);
    
    // Wait for preview to close, then open form
    setTimeout(() => {
      console.log('🔄 Opening subtask form for new task (parent:', parentTask?.title, ')');
      
      // Store the parent task for later use
      setParentTaskForSubtask(parentTask);
      
      // IMPORTANT: Clear selectedTask so form shows as "create new" not "edit"
      setSelectedTask(null);
      
      setFormHeight(80); // Reset to default height
      setIsTaskFormOpen(true);
      setIsCreatingSubtask(true);
      setIsFormAnimating(true); // Start with form off-screen (translate-y-full)
      
      // Fetch users and teams when opening form
      fetchUsers();
      fetchTeams();
      
      // Trigger slide-up animation after a brief delay
      setTimeout(() => {
        console.log('✅ Subtask form should be visible now');
        setIsFormAnimating(false); // Animate to visible (translate-y-0)
      }, 10);
    }, 300); // Wait for preview close animation
  };

  const handleTaskFormSubmit = async (taskData: Partial<Task>) => {
    try {
      let result;
      
      if (selectedTask) {
        // Update existing task
        console.log('🔄 Updating task:', selectedTask.id, taskData);
        result = await updateTask(selectedTask.id, taskData);
        
        if (result.success) {
          console.log('✅ Task updated successfully:', result.data);
          closeForm();
          setSelectedTask(null);
          // Show success message (you can add a toast notification here)
        } else {
          console.error('❌ Failed to update task:', result.error);
          alert(`Failed to update task: ${result.error}`);
        }
      } else {
        // Create new task
        if (taskData.parentId) {
          result = await createSubtask(taskData.parentId, taskData);
        } else {
          result = await createTask(taskData);
        }
        
        if (result.success) {
          console.log('✅ Task created successfully:', result.data);
          
          // If we're creating a subtask, automatically add it as a subtask
          if (isCreatingSubtask && parentTaskForSubtask && result.data) {
            try {
              console.log('🔄 Adding new task as subtask to parent:', parentTaskForSubtask.title);
              
              // Add the new task as a subtask to the parent
              const parentId = parentTaskForSubtask.id;
              let currentSubtasks: string[] = [];
              
              if (typeof parentTaskForSubtask.subtasks === 'string') {
                try {
                  currentSubtasks = JSON.parse(parentTaskForSubtask.subtasks);
                } catch {
                  currentSubtasks = [];
                }
              } else if (Array.isArray(parentTaskForSubtask.subtasks)) {
                currentSubtasks = parentTaskForSubtask.subtasks;
              }
              
              // Add the new subtask ID
              currentSubtasks.push(result.data.id);
              
              // Update the parent task with the new subtask
              await updateTask(parentId, {
                subtasks: JSON.stringify(currentSubtasks)
              });
              
              // Update the new task with the parent ID
              await updateTask(result.data.id, {
                parentId: JSON.stringify([parentId])
              });
              
              console.log('✅ Task automatically added as subtask');
              
              // Refresh tasks to get the updated data
              await fetchTasks();
              
              // Close the form and reopen the task preview
              setIsTaskFormOpen(false);
              setIsCreatingSubtask(false);
              
              // Wait a bit for the tasks to be updated, then find the updated parent task
              setTimeout(async () => {
                const updatedTasks = await apiService.getTasks();
                if (updatedTasks.success && updatedTasks.data) {
                  const updatedParentTask = updatedTasks.data.find(t => t.id === parentTaskForSubtask.id);
                  if (updatedParentTask) {
                    console.log('🔄 Updating selectedTask with latest parent data after subtask creation:', updatedParentTask);
                    setSelectedTask(updatedParentTask);
                  }
                }
              }, 500);
              
              // Clear the parent task reference
              setParentTaskForSubtask(null);
              
              // Reopen the task preview with the updated task
              setTimeout(() => {
                setIsTaskPreviewOpen(true);
                setIsPreviewAnimating(true);
                setTimeout(() => {
                  setIsPreviewAnimating(false);
                }, 10);
              }, 100);
              
              return; // Don't continue with normal form close
            } catch (error) {
              console.error('❌ Failed to add task as subtask:', error);
              setParentTaskForSubtask(null);
            }
          }
          
          closeForm();
          setIsCreatingSubtask(false);
          // Show success message (you can add a toast notification here)
        } else {
          console.error('❌ Failed to create task:', result.error);
          alert(`Failed to create task: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('❌ Error with task operation:', error);
      alert('An unexpected error occurred while processing the task');
    }
  };

  const handleTaskFormCancel = () => {
    closeForm();
    setIsCreatingSubtask(false);
    setParentTaskForSubtask(null); // Clear parent task reference
  };

  // Subtask management functions
  const handleAddSubtask = async (subtaskId: string) => {
    if (!selectedTask) return;
    
    try {
      // Parse existing subtasks
      let currentSubtasks: string[] = [];
      if (typeof selectedTask.subtasks === 'string') {
        try {
          currentSubtasks = JSON.parse(selectedTask.subtasks);
        } catch {
          currentSubtasks = [];
        }
      } else if (Array.isArray(selectedTask.subtasks)) {
        currentSubtasks = selectedTask.subtasks;
      }
      
      // Check if subtask is already added
      if (currentSubtasks.includes(subtaskId)) {
        alert('This task is already a subtask');
        return;
      }
      
      // Add new subtask
      const updatedSubtasks = [...currentSubtasks, subtaskId];
      
      // Update parent task
      const parentResult = await apiService.updateTask(selectedTask.id, {
        subtasks: JSON.stringify(updatedSubtasks)
      });
      
      if (!parentResult.success) {
        alert('Failed to add subtask to parent task');
        return;
      }
      
      // Get the subtask
      const subtask = tasks.find(t => t.id === subtaskId);
      if (!subtask) return;
      
      // Parse existing parent IDs in subtask
      let currentParentIds: string[] = [];
      if (typeof subtask.parentId === 'string' && subtask.parentId) {
        try {
          currentParentIds = JSON.parse(subtask.parentId);
        } catch {
          currentParentIds = subtask.parentId ? [subtask.parentId] : [];
        }
      } else if (Array.isArray(subtask.parentId)) {
        currentParentIds = subtask.parentId;
      }
      
      // Add parent ID if not already present
      if (!currentParentIds.includes(selectedTask.id)) {
        currentParentIds.push(selectedTask.id);
        
        // Update subtask with parent ID
        await apiService.updateTask(subtaskId, {
          parentId: JSON.stringify(currentParentIds)
        });
      }
      
      // Refresh tasks
      await fetchTasks();
      
      // Update selected task to reflect changes
      const updatedTask = tasks.find(t => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
      
      setIsAddingSubtask(false);
      setSubtaskSearch('');
      
    } catch (error) {
      console.error('Error adding subtask:', error);
      alert('Failed to add subtask');
    }
  };

  const handleRemoveSubtask = async (subtaskId: string) => {
    if (!selectedTask) return;
    
    try {
      // Parse existing subtasks
      let currentSubtasks: string[] = [];
      if (typeof selectedTask.subtasks === 'string') {
        try {
          currentSubtasks = JSON.parse(selectedTask.subtasks);
        } catch {
          currentSubtasks = [];
        }
      } else if (Array.isArray(selectedTask.subtasks)) {
        currentSubtasks = selectedTask.subtasks;
      }
      
      // Remove subtask
      const updatedSubtasks = currentSubtasks.filter(id => id !== subtaskId);
      
      // Update parent task
      const parentResult = await apiService.updateTask(selectedTask.id, {
        subtasks: JSON.stringify(updatedSubtasks)
      });
      
      if (!parentResult.success) {
        alert('Failed to remove subtask from parent task');
        return;
      }
      
      // Get the subtask
      const subtask = tasks.find(t => t.id === subtaskId);
      if (!subtask) return;
      
      // Parse existing parent IDs in subtask
      let currentParentIds: string[] = [];
      if (typeof subtask.parentId === 'string' && subtask.parentId) {
        try {
          currentParentIds = JSON.parse(subtask.parentId);
        } catch {
          currentParentIds = subtask.parentId ? [subtask.parentId] : [];
        }
      } else if (Array.isArray(subtask.parentId)) {
        currentParentIds = subtask.parentId;
      }
      
      // Remove parent ID
      const updatedParentIds = currentParentIds.filter(id => id !== selectedTask.id);
      
      // Update subtask
      await apiService.updateTask(subtaskId, {
        parentId: JSON.stringify(updatedParentIds)
      });
      
      // Refresh tasks
      await fetchTasks();
      
      // Wait a bit for the tasks to be updated, then find the updated task
      setTimeout(async () => {
        const updatedTasks = await apiService.getTasks();
        if (updatedTasks.success && updatedTasks.data) {
          const updatedTask = updatedTasks.data.find(t => t.id === selectedTask.id);
          if (updatedTask) {
            console.log('🔄 Updating selectedTask after subtask removal:', updatedTask);
            setSelectedTask(updatedTask);
          }
        }
      }, 500);
      
    } catch (error) {
      console.error('Error removing subtask:', error);
      alert('Failed to remove subtask');
    }
  };

  // Get available tasks that can be added as subtasks
  const getAvailableSubtasks = () => {
    if (!selectedTask) return [];
    
    // Parse current subtasks
    let currentSubtasks: string[] = [];
    if (typeof selectedTask.subtasks === 'string') {
      try {
        currentSubtasks = JSON.parse(selectedTask.subtasks);
      } catch {
        currentSubtasks = [];
      }
    } else if (Array.isArray(selectedTask.subtasks)) {
      currentSubtasks = selectedTask.subtasks;
    }
    
    // Filter tasks: exclude self, already added subtasks, and apply search
    return tasks.filter(task => {
      if (task.id === selectedTask.id) return false;
      if (currentSubtasks.includes(task.id)) return false;
      
      if (subtaskSearch.trim()) {
        const searchLower = subtaskSearch.toLowerCase();
        return (
          task.title.toLowerCase().includes(searchLower) ||
          task.description.toLowerCase().includes(searchLower) ||
          task.project.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  };

  // Get current subtasks with full task details
  const getCurrentSubtasks = () => {
    if (!selectedTask) return [];
    
    // Parse current subtasks
    let currentSubtasks: string[] = [];
    if (typeof selectedTask.subtasks === 'string') {
      try {
        currentSubtasks = JSON.parse(selectedTask.subtasks);
      } catch {
        currentSubtasks = [];
      }
    } else if (Array.isArray(selectedTask.subtasks)) {
      currentSubtasks = selectedTask.subtasks;
    }
    
    // Map to full task objects
    return currentSubtasks
      .map(id => tasks.find(t => t.id === id))
      .filter((task): task is Task => task !== undefined);
  };

  // Helper functions for user and team management
  const getAvailableUsers = () => {
    console.log('🔍 getAvailableUsers called - allUsers:', allUsers);
    console.log('🔍 getAvailableUsers called - selectedTask:', selectedTask);
    
    if (!selectedTask) {
      const validUsers = allUsers.filter((user: any) => user.name);
      console.log('🔍 Available users (no task selected):', validUsers);
      return validUsers;
    }
    
    const currentUsers = selectedTask.assignedUsers || [];
    console.log('🔍 Current assigned users:', currentUsers);
    const validUsers = allUsers.filter((user: any) => user.name && !currentUsers.includes(user.name));
    console.log('🔍 Available users (task selected):', validUsers);
    return validUsers;
  };

  const getAvailableTeams = () => {
    if (!selectedTask) {
      const validTeams = allTeams.filter((team: any) => team.name);
      console.log('🔍 Available teams (no task selected):', validTeams);
      return validTeams;
    }
    
    const currentTeams = selectedTask.assignedTeams || [];
    const validTeams = allTeams.filter((team: any) => team.name && !currentTeams.includes(team.name));
    console.log('🔍 Available teams (task selected):', validTeams);
    return validTeams;
  };

  const handleAddUser = async (userName: string) => {
    if (!selectedTask) return;
    
    try {
      const currentUsers = selectedTask.assignedUsers || [];
      const updatedUsers = [...currentUsers, userName];
      
      const result = await updateTask(selectedTask.id, {
        assignedUsers: updatedUsers
      });
      
      if (result.success) {
        console.log('✅ User added successfully');
        await fetchTasks();
        // Update selectedTask to reflect the change
        const updatedTask = tasks.find(t => t.id === selectedTask.id);
        if (updatedTask) {
          setSelectedTask(updatedTask);
        }
      } else {
        console.error('❌ Failed to add user:', result.error);
        alert(`Failed to add user: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error adding user:', error);
      alert('An unexpected error occurred while adding the user');
    }
  };

  const handleAddTeam = async (teamName: string) => {
    if (!selectedTask) return;
    
    try {
      const currentTeams = selectedTask.assignedTeams || [];
      const updatedTeams = [...currentTeams, teamName];
      
      const result = await updateTask(selectedTask.id, {
        assignedTeams: updatedTeams
      });
      
      if (result.success) {
        console.log('✅ Team added successfully');
        await fetchTasks();
        // Update selectedTask to reflect the change
        const updatedTask = tasks.find(t => t.id === selectedTask.id);
        if (updatedTask) {
          setSelectedTask(updatedTask);
        }
      } else {
        console.error('❌ Failed to add team:', result.error);
        alert(`Failed to add team: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error adding team:', error);
      alert('An unexpected error occurred while adding the team');
    }
  };

  const handleRemoveUser = async (userName: string) => {
    if (!selectedTask) return;
    
    try {
      const currentUsers = selectedTask.assignedUsers || [];
      const updatedUsers = currentUsers.filter(user => user !== userName);
      
      const result = await updateTask(selectedTask.id, {
        assignedUsers: updatedUsers
      });
      
      if (result.success) {
        console.log('✅ User removed successfully');
        await fetchTasks();
        
        // Wait a bit for the tasks to be updated, then find the updated task
        setTimeout(async () => {
          const updatedTasks = await apiService.getTasks();
          if (updatedTasks.success && updatedTasks.data) {
            const updatedTask = updatedTasks.data.find(t => t.id === selectedTask.id);
            if (updatedTask) {
              console.log('🔄 Updating selectedTask after user removal:', updatedTask);
              setSelectedTask(updatedTask);
            }
          }
        }, 500);
      } else {
        console.error('❌ Failed to remove user:', result.error);
        alert(`Failed to remove user: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error removing user:', error);
      alert('An unexpected error occurred while removing the user');
    }
  };

  const handleRemoveTeam = async (teamName: string) => {
    if (!selectedTask) return;
    
    try {
      const currentTeams = selectedTask.assignedTeams || [];
      const updatedTeams = currentTeams.filter(team => team !== teamName);
      
      const result = await updateTask(selectedTask.id, {
        assignedTeams: updatedTeams
      });
      
      if (result.success) {
        console.log('✅ Team removed successfully');
        await fetchTasks();
        
        // Wait a bit for the tasks to be updated, then find the updated task
        setTimeout(async () => {
          const updatedTasks = await apiService.getTasks();
          if (updatedTasks.success && updatedTasks.data) {
            const updatedTask = updatedTasks.data.find(t => t.id === selectedTask.id);
            if (updatedTask) {
              console.log('🔄 Updating selectedTask after team removal:', updatedTask);
              setSelectedTask(updatedTask);
            }
          }
        }, 500);
      } else {
        console.error('❌ Failed to remove team:', result.error);
        alert(`Failed to remove team: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error removing team:', error);
      alert('An unexpected error occurred while removing the team');
    }
  };

  // Handle adding users to pending list
  const handleAddUserToPending = (userName: string) => {
    if (!pendingUsers.includes(userName)) {
      setPendingUsers([...pendingUsers, userName]);
    }
  };

  // Handle removing users from pending list
  const handleRemoveUserFromPending = (userName: string) => {
    setPendingUsers(pendingUsers.filter(user => user !== userName));
  };

  // Handle adding teams to pending list
  const handleAddTeamToPending = (teamName: string) => {
    if (!pendingTeams.includes(teamName)) {
      setPendingTeams([...pendingTeams, teamName]);
    }
  };

  // Handle removing teams from pending list
  const handleRemoveTeamFromPending = (teamName: string) => {
    setPendingTeams(pendingTeams.filter(team => team !== teamName));
  };

  // Save all pending changes
  const handleSaveChanges = async () => {
    if (!selectedTask) return;
    
    setIsSaving(true);
    try {
      const currentUsers = selectedTask.assignedUsers || [];
      const currentTeams = selectedTask.assignedTeams || [];
      
      // Get current subtasks
      let currentSubtasks: string[] = [];
      if (typeof selectedTask.subtasks === 'string') {
        try {
          currentSubtasks = JSON.parse(selectedTask.subtasks);
        } catch {
          currentSubtasks = [];
        }
      } else if (Array.isArray(selectedTask.subtasks)) {
        currentSubtasks = selectedTask.subtasks;
      }
      
      // Combine current and pending users/teams/subtasks
      const updatedUsers = [...currentUsers, ...pendingUsers];
      const updatedTeams = [...currentTeams, ...pendingTeams];
      const updatedSubtasks = [...currentSubtasks, ...pendingSubtasks];
      
      const result = await updateTask(selectedTask.id, {
        assignedUsers: updatedUsers,
        assignedTeams: updatedTeams,
        subtasks: JSON.stringify(updatedSubtasks)
      });
      
      if (result.success) {
        console.log('✅ Changes saved successfully');
        await fetchTasks();
        
        // Wait a bit for the tasks to be updated, then find the updated task
        setTimeout(async () => {
          const updatedTasks = await apiService.getTasks();
          if (updatedTasks.success && updatedTasks.data) {
            const updatedTask = updatedTasks.data.find(t => t.id === selectedTask.id);
            if (updatedTask) {
              console.log('🔄 Updating selectedTask with latest data:', updatedTask);
              setSelectedTask(updatedTask);
            }
          }
        }, 500);
        
        // Clear pending changes
        setPendingUsers([]);
        setPendingTeams([]);
        setPendingSubtasks([]);
        setIsAddingUser(false);
        setIsAddingTeam(false);
        setIsAddingSubtask(false);
      } else {
        console.error('❌ Failed to save changes:', result.error);
        alert(`Failed to save changes: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error saving changes:', error);
      alert('An unexpected error occurred while saving changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel changes
  const handleCancelChanges = () => {
    setPendingUsers([]);
    setPendingTeams([]);
    setPendingSubtasks([]);
    setIsAddingUser(false);
    setIsAddingTeam(false);
    setIsAddingSubtask(false);
  };

  // Handle adding subtasks to pending list
  const handleAddSubtaskToPending = (subtaskId: string) => {
    if (!pendingSubtasks.includes(subtaskId)) {
      setPendingSubtasks([...pendingSubtasks, subtaskId]);
    }
  };

  // Handle removing subtasks from pending list
  const handleRemoveSubtaskFromPending = (subtaskId: string) => {
    setPendingSubtasks(pendingSubtasks.filter(id => id !== subtaskId));
  };

  // Handle user removal confirmation
  const handleRemoveUserClick = (userName: string) => {
    setUserToRemove(userName);
    setShowRemoveUserConfirm(true);
  };

  // Confirm user removal
  const confirmRemoveUser = async () => {
    if (!userToRemove || !selectedTask) return;
    
    try {
      const currentUsers = selectedTask.assignedUsers || [];
      const updatedUsers = currentUsers.filter(user => user !== userToRemove);
      
      const result = await updateTask(selectedTask.id, {
        assignedUsers: updatedUsers
      });
      
      if (result.success) {
        console.log('✅ User removed successfully');
        await fetchTasks();
        
        // Wait a bit for the tasks to be updated, then find the updated task
        setTimeout(async () => {
          const updatedTasks = await apiService.getTasks();
          if (updatedTasks.success && updatedTasks.data) {
            const updatedTask = updatedTasks.data.find(t => t.id === selectedTask.id);
            if (updatedTask) {
              console.log('🔄 Updating selectedTask after user removal:', updatedTask);
              setSelectedTask(updatedTask);
            }
          }
        }, 500);
        
        // Close modal only after successful removal
        setShowRemoveUserConfirm(false);
        setUserToRemove(null);
      } else {
        console.error('❌ Failed to remove user:', result.error);
        alert(`Failed to remove user: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error removing user:', error);
      alert('An unexpected error occurred while removing the user');
    }
  };

  // Cancel user removal
  const cancelRemoveUser = () => {
    setShowRemoveUserConfirm(false);
    setUserToRemove(null);
  };

  // Handle subtask removal confirmation
  const handleRemoveSubtaskClick = (subtaskId: string) => {
    setSubtaskToRemove(subtaskId);
    setShowRemoveSubtaskConfirm(true);
  };

  // Confirm subtask removal
  const confirmRemoveSubtask = async () => {
    if (!subtaskToRemove || !selectedTask) return;
    
    try {
      // Get current subtasks
      let currentSubtasks: string[] = [];
      if (typeof selectedTask.subtasks === 'string') {
        try {
          currentSubtasks = JSON.parse(selectedTask.subtasks);
        } catch {
          currentSubtasks = [];
        }
      } else if (Array.isArray(selectedTask.subtasks)) {
        currentSubtasks = selectedTask.subtasks;
      }
      
      // Remove the subtask
      const updatedSubtasks = currentSubtasks.filter(id => id !== subtaskToRemove);
      
      const result = await updateTask(selectedTask.id, {
        subtasks: JSON.stringify(updatedSubtasks)
      });
      
      if (result.success) {
        console.log('✅ Subtask removed successfully');
        await fetchTasks();
        
        // Wait a bit for the tasks to be updated, then find the updated task
        setTimeout(async () => {
          const updatedTasks = await apiService.getTasks();
          if (updatedTasks.success && updatedTasks.data) {
            const updatedTask = updatedTasks.data.find(t => t.id === selectedTask.id);
            if (updatedTask) {
              console.log('🔄 Updating selectedTask after subtask removal:', updatedTask);
              setSelectedTask(updatedTask);
            }
          }
        }, 500);
        
        // Close modal only after successful removal
        setShowRemoveSubtaskConfirm(false);
        setSubtaskToRemove(null);
      } else {
        console.error('❌ Failed to remove subtask:', result.error);
        alert(`Failed to remove subtask: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error removing subtask:', error);
      alert('An unexpected error occurred while removing the subtask');
    }
  };

  // Cancel subtask removal
  const cancelRemoveSubtask = () => {
    setShowRemoveSubtaskConfirm(false);
    setSubtaskToRemove(null);
  };

  const closeForm = () => {
    setIsFormAnimating(true); // Start slide-down animation (translate-y-full)
    
    // Wait for slide-down animation to complete before hiding
    setTimeout(() => {
      setIsTaskFormOpen(false);
      setIsFormAnimating(false);
      setSelectedTask(null); // Clear selected task when closing form
      setIsCreatingSubtask(false); // Reset subtask creation flag
      setParentTaskForSubtask(null); // Clear parent task reference
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
    
    // Fetch users and teams when opening task preview
    fetchUsers();
    fetchTeams();
    
    // Load task files
    if (task.attachments) {
      loadTaskFiles(task.id, task.attachments);
    } else {
      setAttachedFiles([]);
    }
    
    // Scroll to top when opening task preview
    setTimeout(() => {
      const modal = document.querySelector('[data-task-preview-content]');
      if (modal) {
        modal.scrollTop = 0;
      }
    }, 100);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskPreviewOpen(false);
    setIsTaskFormOpen(true);
    setIsFormAnimating(false);
    
    // Fetch users and teams when editing
    fetchUsers();
    fetchTeams();
  };

  // File management functions
  const loadTaskFiles = async (taskId: string, attachments: string) => {
    setIsLoadingFiles(true);
    try {
      const fileIds = JSON.parse(attachments || '[]');
      if (Array.isArray(fileIds) && fileIds.length > 0) {
        const fileDetails = await Promise.all(
          fileIds.map(async (fileId) => {
            try {
              return await driveService.getFileDetails(fileId);
            } catch (error) {
              console.error(`Failed to load file ${fileId}:`, error);
              return null;
            }
          })
        );
        const validFiles = fileDetails.filter(f => f !== null);
        setAttachedFiles(validFiles);
        
        // Create previews for image files
        validFiles.forEach((file: FileItem) => {
          if (file.mimeType?.startsWith('image/')) {
            // Download and create preview for existing files
            createPreviewForExistingFile(file);
          }
        });
      } else {
        setAttachedFiles([]);
      }
    } catch (error) {
      console.error('Failed to load task files:', error);
      setAttachedFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !selectedTask || files.length === 0) return;

    setIsUploadingFile(true);
    try {
      const uploadedFileIds: string[] = [];
      
      for (const file of Array.from(files)) {
        try {
          console.log('📤 Uploading file:', file.name);
          const result = await driveService.uploadFile({
            userId: '',
            file,
            parentId: 'ROOT',
            tags: `task-${selectedTask.id}`,
          });
          uploadedFileIds.push(result.fileId);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          alert(`Failed to upload ${file.name}. Please try again.`);
        }
      }

      if (uploadedFileIds.length > 0) {
        // Get current attachments
        const currentAttachments = JSON.parse(selectedTask.attachments || '[]');
        const newAttachments = [...currentAttachments, ...uploadedFileIds];

        // Update task with new attachments
        const result = await apiService.updateTask(selectedTask.id, {
          attachments: JSON.stringify(newAttachments),
        });

        if (result.success) {
          // Reload files
          await loadTaskFiles(selectedTask.id, JSON.stringify(newAttachments));
          
          // Update selected task
          const updatedTask = { ...selectedTask, attachments: JSON.stringify(newAttachments) };
          setSelectedTask(updatedTask);
          
          alert('Files uploaded successfully!');
        }
      }
    } catch (error) {
      console.error('Failed to upload files:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Create file preview for images
  const createFilePreview = (file: File, fileKey: string) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreviews(prev => ({
        ...prev,
        [fileKey]: e.target?.result as string
      }));
    };
    
    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    }
  };

  // Download and create preview for existing files
  const createPreviewForExistingFile = async (file: FileItem) => {
    if (!file.mimeType?.startsWith('image/')) return;

    const fileKey = `${file.name}-${file.size}`;
    setLoadingPreviews(prev => new Set(prev).add(fileKey));

    try {
      const result = await driveService.downloadFile(file.id);
      
      // Set the download URL directly as preview
      setFilePreviews(prev => ({
        ...prev,
        [fileKey]: result.downloadUrl
      }));
    } catch (error) {
      console.error(`Failed to create preview for ${file.name}:`, error);
      // Preview will not be available for this file
    } finally {
      setLoadingPreviews(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileKey);
        return newSet;
      });
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!selectedTask) return;

    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      // Delete file from drive
      await driveService.deleteFile(fileId);

      // Update task attachments
      const currentAttachments = JSON.parse(selectedTask.attachments || '[]');
      const newAttachments = currentAttachments.filter((id: string) => id !== fileId);

      const result = await apiService.updateTask(selectedTask.id, {
        attachments: JSON.stringify(newAttachments),
      });

      if (result.success) {
        // Reload files
        await loadTaskFiles(selectedTask.id, JSON.stringify(newAttachments));
        
        // Update selected task
        const updatedTask = { ...selectedTask, attachments: JSON.stringify(newAttachments) };
        setSelectedTask(updatedTask);
        
        alert('File deleted successfully!');
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file. Please try again.');
    }
  };

  const handleFileDownload = async (fileId: string, fileName: string) => {
    try {
      const result = await driveService.downloadFile(fileId);
      
      // Open download URL in new tab
      window.open(result.downloadUrl, '_blank');
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  // File preview modal functions
  const openFilePreview = (file: FileItem) => {
    setSelectedFileForPreview(file);
    setIsFilePreviewOpen(true);
  };

  const closeFilePreview = () => {
    setIsFilePreviewOpen(false);
    setSelectedFileForPreview(null);
  };

  const handleFilePreviewDownload = async () => {
    if (!selectedFileForPreview) return;
    await handleFileDownload(selectedFileForPreview.id, selectedFileForPreview.name);
  };

  const handleFilePreviewDelete = async () => {
    if (!selectedFileForPreview) return;
    await handleFileDelete(selectedFileForPreview.id);
    closeFilePreview();
  };

  // Column resize functions
  const handleColumnResizeStart = (e: React.MouseEvent, column: string) => {
    e.preventDefault();
    setIsDragging(true);
    setDragColumn(column);
    setStartX(e.clientX);
    setStartWidth(columnWidths[column]);
  };

  const handleColumnResizeMove = (e: MouseEvent) => {
    if (!isDragging || !dragColumn) return;
    
    const deltaX = e.clientX - startX;
    const minWidth = getMinWidth(dragColumn);
    const newWidth = Math.max(minWidth, startWidth + deltaX);
    
    setColumnWidths(prev => ({
      ...prev,
      [dragColumn]: newWidth
    }));
  };

  // Function to get minimum width for each column
  const getMinWidth = (columnName: string): number => {
    const minWidths: {[key: string]: number} = {
      project: 100,
      taskName: 120,
      taskDescription: 150,
      status: 80,
      priority: 80,
      time: 60,
      comments: 120,
      subtasks: 120,
      tags: 100,
      dueDate: 90,
      actions: 80
    };
    return minWidths[columnName] || 80;
  };

  const handleColumnResizeEnd = () => {
    setIsDragging(false);
    setDragColumn(null);
  };

  // Add event listeners for mouse move and up
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleColumnResizeMove);
      document.addEventListener('mouseup', handleColumnResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleColumnResizeMove);
      document.removeEventListener('mouseup', handleColumnResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleColumnResizeMove);
      document.removeEventListener('mouseup', handleColumnResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragColumn, startX, startWidth]);

  // Comment management functions
  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask || isPostingComment) return;
    
    setIsPostingComment(true);
    try {
      // Get current comments array - ensure it's always an array
      let currentComments = [];
      try {
        const parsedComments = JSON.parse(selectedTask.comments || '[]');
        currentComments = Array.isArray(parsedComments) ? parsedComments : [];
      } catch (e) {
        console.log('Failed to parse comments, using empty array:', e);
        currentComments = [];
      }
      
      // Add new comment
      const newCommentObj = {
        id: `comment-${Date.now()}`,
        message: newComment.trim(),
        userName: user?.name || 'Current User',
        userEmail: user?.email || 'user@example.com',
        timestamp: new Date().toISOString(),
        userId: (user as any)?.id || 'current-user'
      };
      
      const updatedComments = [...currentComments, newCommentObj];
      
      // Update task with new comments
      const updatedTask = {
        ...selectedTask,
        comments: JSON.stringify(updatedComments)
      };
      
      // Update the task in the API
      const result = await apiService.updateTask(selectedTask.id, {
        comments: JSON.stringify(updatedComments)
      });
      
      if (result.success) {
        // Update local state
        setTasks(prev => prev.map(task => 
          task.id === selectedTask.id 
            ? { ...task, comments: JSON.stringify(updatedComments) }
            : task
        ));
        
        // Update selected task
        setSelectedTask(updatedTask);
        
        // Clear comment input
        setNewComment('');
        
        console.log('✅ Comment added successfully');
      } else {
        console.error('❌ Failed to add comment:', result.error);
        alert('Failed to add comment. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      alert('Error adding comment. Please try again.');
    } finally {
      setIsPostingComment(false);
    }
  };

  const closeTaskPreview = () => {
    setIsPreviewAnimating(true);
    setNewComment(''); // Clear comment input
    setTimeout(() => {
      setIsTaskPreviewOpen(false);
      setIsPreviewAnimating(false);
      setSelectedTask(null);
    }, 300);
  };

  // Close task form and preview when clicking outside and handle drag events
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is inside confirmation modals - if so, don't close task preview
      const isClickInsideUserConfirm = removeUserConfirmRef.current && removeUserConfirmRef.current.contains(target);
      const isClickInsideSubtaskConfirm = removeSubtaskConfirmRef.current && removeSubtaskConfirmRef.current.contains(target);
      
      if (isClickInsideUserConfirm || isClickInsideSubtaskConfirm) {
        return; // Don't close task preview if clicking inside confirmation modals
      }
      
      // Check if click is inside task form
      if (taskFormRef.current && !taskFormRef.current.contains(target)) {
        closeForm();
      }
      
      // Check if click is inside task preview
      if (taskPreviewRef.current && !taskPreviewRef.current.contains(target)) {
        closeTaskPreview();
      }
      
      // Close dropdown when clicking outside (but not inside the dropdown itself)
      const isClickInsideDropdown = (target as Element).closest('[data-dropdown-menu]');
      if (!isClickInsideDropdown) {
        setOpenDropdown(null);
      }
      
      // Close user and team selection dropdowns only if not clicking inside them
      const isClickInsideUserSelection = (target as Element).closest('[data-user-selection]');
      const isClickInsideTeamSelection = (target as Element).closest('[data-team-selection]');
      
      if (!isClickInsideUserSelection) {
        setIsAddingUser(false);
      }
      if (!isClickInsideTeamSelection) {
        setIsAddingTeam(false);
      }
    };

    // Always listen for clicks to close dropdown, but only listen for form/preview when they're open
      document.addEventListener('mousedown', handleClickOutside);

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

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Tasks */}
          <StatsCard
            title="Total Tasks"
            value={tasks.length}
            icon={CheckSquare}
            iconColor="blue"
            className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200"
          />
          
          {/* Completed Tasks */}
          <StatsCard
            title="Completed"
            value={tasks.filter(task => task.status === 'Completed').length}
            icon={CheckCircle}
            iconColor="green"
            className="bg-gradient-to-r from-green-50 to-green-100 border-green-200"
          />
          
          {/* In Progress Tasks */}
          <StatsCard
            title="In Progress"
            value={tasks.filter(task => task.status === 'In Progress').length}
            icon={Clock}
            iconColor="yellow"
            className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200"
          />
          
          {/* Overdue Tasks */}
          <StatsCard
            title="Overdue"
            value={tasks.filter(task => isOverdue(task.dueDate)).length}
            icon={AlertTriangle}
            iconColor="red"
            className="bg-gradient-to-r from-red-50 to-red-100 border-red-200"
          />
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

         {/* Loading State */}
         {isLoading && (
           <div className="flex items-center justify-center py-12">
             <div className="text-center">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
               <p className="text-gray-600">Loading tasks...</p>
             </div>
           </div>
         )}

         {/* Error State */}
         {error && !isLoading && (
           <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
             <div className="flex items-center">
               <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
               <div>
                 <h3 className="text-sm font-medium text-red-800">Error loading tasks</h3>
                 <p className="text-sm text-red-600 mt-1">{error}</p>
                 <button 
                   onClick={fetchTasks}
                   className="text-sm text-red-600 hover:text-red-800 underline mt-2"
                 >
                   Try again
                 </button>
               </div>
             </div>
           </div>
         )}

         {/* Tasks Table */}
         {!isLoading && !error && viewMode === 'list' ? (
           <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
             {/* Table Header */}
             <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-4 py-3">
               <div className="flex text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                 {/* Task Name */}
                 <div 
                   className="flex items-center border-r border-gray-50 pr-2"
                   style={{ width: `${columnWidths.taskName}px` }}
                 >
                   <span className="whitespace-nowrap">Task Name</span>
                   <div 
                     className="ml-auto w-1 h-4 bg-gray-400 hover:bg-gray-600 cursor-col-resize"
                     onMouseDown={(e) => handleColumnResizeStart(e, 'taskName')}
                   />
                 </div>
                 
                 {/* Project */}
                 <div 
                   className="flex items-center border-r border-gray-50 pr-2"
                   style={{ width: `${columnWidths.project}px` }}
                 >
                   <span className="whitespace-nowrap">Project</span>
                   <div 
                     className="ml-auto w-1 h-4 bg-gray-400 hover:bg-gray-600 cursor-col-resize"
                     onMouseDown={(e) => handleColumnResizeStart(e, 'project')}
                   />
                 </div>
                 
                 {/* Task Description */}
                 <div 
                   className="flex items-center border-r border-gray-50 pr-2"
                   style={{ width: `${columnWidths.taskDescription}px` }}
                 >
                   <span className="whitespace-nowrap">Task Description</span>
                   <div 
                     className="ml-auto w-1 h-4 bg-gray-400 hover:bg-gray-600 cursor-col-resize"
                     onMouseDown={(e) => handleColumnResizeStart(e, 'taskDescription')}
                   />
                   </div>
                   
                 {/* Status */}
                 <div 
                   className="flex items-center border-r border-gray-50 pr-2"
                   style={{ width: `${columnWidths.status}px` }}
                 >
                   <span className="whitespace-nowrap">Status</span>
                   <div 
                     className="ml-auto w-1 h-4 bg-gray-400 hover:bg-gray-600 cursor-col-resize"
                     onMouseDown={(e) => handleColumnResizeStart(e, 'status')}
                   />
                     </div>
                 
                 {/* Priority */}
                 <div 
                   className="flex items-center border-r border-gray-50 pr-2"
                   style={{ width: `${columnWidths.priority}px` }}
                 >
                   <span className="whitespace-nowrap">Priority</span>
                   <div 
                     className="ml-auto w-1 h-4 bg-gray-400 hover:bg-gray-600 cursor-col-resize"
                     onMouseDown={(e) => handleColumnResizeStart(e, 'priority')}
                   />
                     </div>
                 
                 {/* Time */}
                 <div 
                   className="flex items-center border-r border-gray-50 pr-2"
                   style={{ width: `${columnWidths.time}px` }}
                 >
                   <span className="whitespace-nowrap">Time</span>
                   <div 
                     className="ml-auto w-1 h-4 bg-gray-400 hover:bg-gray-600 cursor-col-resize"
                     onMouseDown={(e) => handleColumnResizeStart(e, 'time')}
                   />
                   </div>
                 
                 {/* Comments */}
                 <div 
                   className="flex items-center border-r border-gray-50 pr-3 min-w-0"
                   style={{ width: `${columnWidths.comments}px` }}
                 >
                   <span className="whitespace-nowrap">Comments</span>
                   <div 
                     className="ml-auto w-1 h-4 bg-gray-400 hover:bg-gray-600 cursor-col-resize"
                     onMouseDown={(e) => handleColumnResizeStart(e, 'comments')}
                   />
                 </div>

                 {/* Subtasks */}
                 <div 
                   className="flex items-center border-r border-gray-50 pr-3 min-w-0"
                   style={{ width: `${columnWidths.subtasks}px` }}
                 >
                   <span className="whitespace-nowrap">Subtasks</span>
                   <div 
                     className="ml-auto w-1 h-4 bg-gray-400 hover:bg-gray-600 cursor-col-resize"
                     onMouseDown={(e) => handleColumnResizeStart(e, 'subtasks')}
                   />
                     </div>
                     
                 {/* Tags */}
                 <div 
                   className="flex items-center border-r border-gray-50 pr-2 min-w-0"
                   style={{ width: `${columnWidths.tags}px` }}
                 >
                   <span className="whitespace-nowrap">Tags</span>
                   <div 
                     className="ml-auto w-1 h-4 bg-gray-400 hover:bg-gray-600 cursor-col-resize"
                     onMouseDown={(e) => handleColumnResizeStart(e, 'tags')}
                   />
                 </div>
                 
                 
                 {/* Due Date */}
                 <div 
                   className="flex items-center border-r border-gray-50 pr-2"
                   style={{ width: `${columnWidths.dueDate}px` }}
                 >
                   <span className="whitespace-nowrap">Due Date</span>
                   <div 
                     className="ml-auto w-1 h-4 bg-gray-400 hover:bg-gray-600 cursor-col-resize"
                     onMouseDown={(e) => handleColumnResizeStart(e, 'dueDate')}
                   />
                 </div>
                 
                 {/* Actions */}
                 <div 
                   className="flex items-center"
                   style={{ width: `${columnWidths.actions}px` }}
                 >
                   <span className="whitespace-nowrap">Actions</span>
                 </div>
               </div>
             </div>
             
             {/* Table Body */}
             <div className="divide-y divide-gray-50">
               {filteredTasks.map((task, index) => (
                 <div key={task.id} className={`flex px-4 py-3 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-sm ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`} onClick={() => handleTaskClick(task)}>
                   {/* Task Name */}
                   <div 
                     className="flex items-center border-r border-gray-50 pr-2 min-w-0"
                     style={{ width: `${columnWidths.taskName}px` }}
                   >
                     <h3 className={`text-sm font-semibold ${task.status === 'Completed' ? 'line-through text-gray-500' : 'text-gray-900'} truncate whitespace-nowrap`}>
                           {task.title}
                         </h3>
                   </div>
                   
                   {/* Project */}
                   <div 
                     className="flex items-center border-r border-gray-50 pr-2 min-w-0"
                     style={{ width: `${columnWidths.project}px` }}
                   >
                     <span className="text-sm text-gray-900 truncate whitespace-nowrap">
                       {task.project}
                     </span>
                   </div>
                   
                   {/* Task Description */}
                   <div 
                     className="flex items-center border-r border-gray-50 pr-2 min-w-0"
                     style={{ width: `${columnWidths.taskDescription}px` }}
                   >
                     <p className="text-sm text-gray-600 truncate whitespace-nowrap">
                           {task.description}
                         </p>
                       </div>
                       
                   {/* Status */}
                   <div 
                     className="flex items-center border-r border-gray-50 pr-2"
                     style={{ width: `${columnWidths.status}px` }}
                   >
                           <Badge variant={getStatusConfig(task.status).color as any} size="sm" className="whitespace-nowrap">
                       {getStatusConfig(task.status).label}
                           </Badge>
                         </div>
                   
                   {/* Priority */}
                   <div 
                     className="flex items-center border-r border-gray-50 pr-2"
                     style={{ width: `${columnWidths.priority}px` }}
                   >
                           <Badge variant={getPriorityConfig(task.priority).color as any} size="sm" className="whitespace-nowrap">
                       {getPriorityConfig(task.priority).label}
                           </Badge>
                         </div>
                   
                   {/* Time */}
                   <div 
                     className="flex items-center border-r border-gray-50 pr-2"
                     style={{ width: `${columnWidths.time}px` }}
                   >
                     <span className="text-sm text-gray-600 whitespace-nowrap">{task.estimatedHours}h</span>
                         </div>
                   
                   {/* Comments */}
                   <div 
                     className="flex items-center border-r border-gray-50 pr-3 min-w-0"
                     style={{ width: `${columnWidths.comments}px` }}
                   >
                     <span className="text-sm text-gray-600 whitespace-nowrap">
                        {(() => {
                          try {
                           const commentsArray = JSON.parse(task.comments);
                           return Array.isArray(commentsArray) ? commentsArray.length : parseInt(task.comments) || 0;
                         } catch (e) {
                           return parseInt(task.comments) || 0;
                         }
                       })()}
                     </span>
                   </div>
                   
                   {/* Subtasks */}
                   <div 
                     className="flex items-center border-r border-gray-50 pr-3 min-w-0"
                     style={{ width: `${columnWidths.subtasks}px` }}
                   >
                     <span className="text-sm text-gray-600 whitespace-nowrap">
                       {(() => {
                              try {
                                const subtasksArray = JSON.parse(task.subtasks);
                                return Array.isArray(subtasksArray) ? subtasksArray.length : 0;
                         } catch (e) {
                                return 0;
                              }
                       })()}
                       </span>
                 </div>

                   {/* Tags */}
                   <div 
                     className="flex items-center border-r border-gray-50 pr-2 min-w-0"
                     style={{ width: `${columnWidths.tags}px` }}
                   >
                     <div className="flex items-center gap-1 overflow-hidden">
                       {task.tags.split(',').slice(0, 1).map((tag, index) => (
                         <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full whitespace-nowrap">
                         {tag.trim()}
                       </span>
                     ))}
                       {task.tags.split(',').length > 1 && (
                         <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full whitespace-nowrap">
                           +{task.tags.split(',').length - 1}
                       </span>
                     )}
                     </div>
                   </div>
                   
                   
                   {/* Due Date */}
                   <div 
                     className="flex items-center border-r border-gray-50 pr-2"
                     style={{ width: `${columnWidths.dueDate}px` }}
                   >
                     <span className={`text-sm whitespace-nowrap ${isOverdue(task.dueDate) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                           {new Date(task.dueDate).toLocaleDateString()}
                         </span>
                       </div>
                   
                   {/* Actions */}
                   <div 
                     className="flex items-center justify-end space-x-2"
                     style={{ width: `${columnWidths.actions}px` }}
                   >
                     <Button 
                       variant="ghost" 
                       size="sm"
                       title="Edit Task"
                       className="p-2 h-9 w-9 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200 hover:shadow-sm"
                       onClick={(e) => {
                         e.stopPropagation();
                         handleEditTask(task);
                       }}
                     >
                       <Edit size={16} />
                     </Button>
                     <div className="relative">
                       <Button 
                         variant="ghost" 
                         size="sm"
                         title="More Options"
                         className="p-2 h-9 w-9 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:shadow-sm"
                         onClick={(e) => {
                           e.stopPropagation();
                           setOpenDropdown(openDropdown === task.id ? null : task.id);
                         }}
                       >
                         <MoreVertical size={16} />
                       </Button>
                       
                       {/* Dropdown Menu */}
                       {openDropdown === task.id && (
                         <div 
                           data-dropdown-menu
                           className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                           onClick={(e) => e.stopPropagation()}
                         >
                           <div className="py-1">
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleDeleteTask(task);
                                 setOpenDropdown(null);
                               }}
                               className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                             >
                               <Trash2 className="w-4 h-4" />
                               <span>Delete Task</span>
                             </button>
                     </div>
                         </div>
                       )}
                   </div>
                 </div>
               </div>
             ))}
             </div>
             </div>
           </div>
        ) : !isLoading && !error ? (
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
                        {/* Labeled basics */}
                        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                          <div className="truncate">
                            <span className="text-[10px] uppercase text-gray-500 font-medium mr-1">Project:</span>
                            <span className="text-gray-700 truncate inline-block align-middle">{task.project}</span>
                          </div>
                          <div className="truncate text-right sm:text-left">
                            <span className="text-[10px] uppercase text-gray-500 font-medium mr-1">Due:</span>
                            <span className={`inline-block align-middle ${isOverdue(task.dueDate) ? 'text-red-600 font-medium' : 'text-gray-700'}`}>{new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status and Priority Badges - with labels (Priority hidden on mobile) */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] uppercase text-gray-500 font-medium">Status:</span>
                        <Badge variant={getStatusConfig(task.status).color as any} size="sm" className="text-xs">
                          {getStatusIcon(task.status)}
                          <span className="ml-1 text-xs">{getStatusConfig(task.status).label}</span>
                        </Badge>
                      </div>
                      <div className="hidden sm:flex items-center gap-1">
                        <span className="text-[10px] uppercase text-gray-500 font-medium">Priority:</span>
                        <Badge variant={getPriorityConfig(task.priority).color as any} size="sm" className="text-xs">
                          {getPriorityIcon(task.priority)}
                        </Badge>
                      </div>
                    </div>
                      
                    {/* Meta Info - Minimal on mobile (with labels) */}
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] uppercase text-gray-500 font-medium">Time:</span>
                        <Clock size={8} className="sm:w-3 sm:h-3" />
                        <span className="text-xs">{task.estimatedHours}h</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] uppercase text-gray-500 font-medium">Comments:</span>
                          <MessageSquare size={8} className="sm:w-3 sm:h-3" />
                          <span className="text-xs">{(() => {
                            try {
                              const commentsArray = JSON.parse(task.comments);
                              return Array.isArray(commentsArray) ? commentsArray.length : parseInt(task.comments) || 0;
                            } catch (e) {
                              return parseInt(task.comments) || 0;
                            }
                          })()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] uppercase text-gray-500 font-medium">Subtasks:</span>
                          <CheckSquare size={8} className="sm:w-3 sm:h-3" />
                          <span className="text-xs">{(() => {
                            try {
                              const subtasksArray = JSON.parse(task.subtasks);
                              return Array.isArray(subtasksArray) ? subtasksArray.length : 0;
                            } catch (e) {
                              return 0;
                            }
                          })()}</span>
                        </div>
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
                        <Avatar name={task.assignee} size="sm" />
                        <span className="text-xs text-gray-500 hidden sm:inline">{task.assignee}</span>
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
        ) : null}

        {/* Empty State */}
        {!isLoading && !error && filteredTasks.length === 0 && (
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
        <div 
          className={`fixed inset-0 z-50 flex items-end transition-opacity duration-300 ${
            isFormAnimating ? ' bg-opacity-0' : 'bg-opacity-50'
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleTaskFormCancel();
            }
          }}
        >
          <div 
            ref={taskFormRef}
            className={`bg-white rounded-t-2xl shadow-2xl w-full transform transition-all duration-300 ease-out ${
              isFormAnimating ? 'translate-y-full' : 'translate-y-0'
            } ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}
              style={{ 
              width: `calc(100% - ${isCollapsed ? '4rem' : '16rem'})`,
                height: `${formHeight}vh`,
                boxShadow: '0 -10px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
                <TaskForm
                  task={selectedTask || undefined}
                  onSubmit={handleTaskFormSubmit}
                  onCancel={handleTaskFormCancel}
                  isEditing={!!selectedTask}
              isCreatingSubtask={isCreatingSubtask}
                  projects={Array.from(new Set(tasks.map(t => t.project)))}
              teams={allTeams.map(team => team.name)}
              users={allUsers}
              isLoadingUsers={isLoadingUsers}
              isLoadingTeams={isLoadingTeams}
              formHeight={formHeight}
              isDragging={isDragging}
              onMouseDown={handleMouseDown}
            />
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
            data-task-preview
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
              data-task-preview-content
              className="bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl overflow-y-auto"
              style={{ 
                height: `${formHeight}vh`,
                boxShadow: '0 -10px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              {/* Drag Handle - Sticky */}
              <div 
                className={`sticky top-0 z-20 w-full h-6 flex items-center justify-center cursor-row-resize hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isDragging ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                onMouseDown={handleMouseDown}
              >
                <div className="w-12 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
              </div>
              
              <div className="p-6">
                {/* Task Preview Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    {/* Back Button (always visible) */}
                    <button
                      onClick={handleBack}
                      className="w-10 h-10 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors group"
                      title="Go back"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-white" />
                    </button>
                    
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <CheckSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedTask.title}</h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Task Details
                      </p>
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
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Description</label>
                        <p className="text-gray-600 dark:text-gray-300">{selectedTask.description}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Project</label>
                        <p className="text-gray-600 dark:text-gray-300">{selectedTask.project}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status and Priority */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Status</label>
                        <Badge variant={getStatusConfig(selectedTask.status).color as any} size="md">
                          {getStatusIcon(selectedTask.status)}
                          <span className="ml-2">{getStatusConfig(selectedTask.status).label}</span>
                        </Badge>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Priority</label>
                        <Badge variant={getPriorityConfig(selectedTask.priority).color as any} size="md">
                          {getPriorityIcon(selectedTask.priority)}
                          <span className="ml-2">{getPriorityConfig(selectedTask.priority).label}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Dates and Time */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Start Date</label>
                        <p className="text-gray-600 dark:text-gray-300">{new Date(selectedTask.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Due Date</label>
                        <p className={`${isOverdue(selectedTask.dueDate) ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
                          {new Date(selectedTask.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Estimated Time</label>
                        <p className="text-gray-600 dark:text-gray-300">{selectedTask.estimatedHours} hours</p>
                      </div>
                    </div>
                  </div>

                  {/* Assignment */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Assigned Users */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                            Assigned Users ({(selectedTask.assignedUsers && selectedTask.assignedUsers.length > 0) ? selectedTask.assignedUsers.length : 0})
                            {pendingUsers.length > 0 && (
                              <span className="text-green-600 dark:text-green-400 ml-1">+{pendingUsers.length}</span>
                            )}
                          </label>
                          <div className="flex items-center space-x-2">
                            {(pendingUsers.length > 0 || pendingTeams.length > 0) && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCancelChanges}
                                  className="flex items-center space-x-1"
                                >
                                  <X className="w-4 h-4" />
                                  <span>Cancel</span>
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={handleSaveChanges}
                                  disabled={isSaving}
                                  className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                                >
                                  {isSaving ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      <span>Saving...</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4" />
                                      <span>Save</span>
                                    </>
                                  )}
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsAddingUser(!isAddingUser)}
                              className="flex items-center space-x-1"
                            >
                              {isAddingUser ? (
                                <>
                                  <X className="w-4 h-4" />
                                  <span>Close</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4" />
                                  <span>Add User</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {isAddingUser && (
                          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800" data-user-selection>
                            <div className="mb-3">
                              <input
                                type="text"
                                placeholder="Search users..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {isLoadingUsers ? (
                                <div className="flex items-center justify-center py-4">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading users...</span>
                                </div>
                              ) : (
                                <>
                                  {getAvailableUsers()
                                    .filter((user: any) => user.name && user.name.toLowerCase().includes(userSearch.toLowerCase()))
                                    .map((user: any) => (
                                      <div key={user.id} className="flex items-center justify-between px-3 py-2 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-lg transition-colors">
                                        <div className="flex items-center space-x-2 flex-1">
                                          <Avatar name={user.name} size="sm" />
                                          <span className="text-sm text-gray-700 dark:text-gray-300">{user.name}</span>
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddUserToPending(user.name);
                                          }}
                                          disabled={pendingUsers.includes(user.name)}
                                          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                                        >
                                          {pendingUsers.includes(user.name) ? 'Added' : 'Add'}
                                        </button>
                                      </div>
                                    ))}
                                  {getAvailableUsers().filter((user: any) => user.name && user.name.toLowerCase().includes(userSearch.toLowerCase())).length === 0 && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                                      {userSearch ? 'No users found' : 'No available users'}
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="space-y-3">
                          {/* Current Assigned Users */}
                          <div className="flex flex-wrap gap-2">
                            {(selectedTask.assignedUsers && selectedTask.assignedUsers.length > 0) ? (
                              selectedTask.assignedUsers.map((user, index) => (
                                <div key={`assigned-user-${index}`} className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-full text-sm">
                                  <Avatar name={user} size="sm" />
                                  <span>{user}</span>
                                  <button
                                    onClick={() => handleRemoveUserClick(user)}
                                    className="ml-1 p-0.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                    title="Remove user"
                                  >
                                    <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                          <Avatar name={selectedTask.assignee} size="md" />
                                <span className="text-gray-600 dark:text-gray-300">{selectedTask.assignee || 'Not assigned'}</span>
                        </div>
                            )}
                      </div>

                          {/* Pending Users */}
                          {pendingUsers.length > 0 && (
                      <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Pending additions:</p>
                              <div className="flex flex-wrap gap-2">
                                {pendingUsers.map((user, index) => (
                                  <div key={`pending-user-${index}`} className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full text-sm">
                                    <Avatar name={user} size="sm" />
                                    <span>{user}</span>
                                    <button
                                      onClick={() => handleRemoveUserFromPending(user)}
                                      className="ml-1 p-0.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                      title="Remove from pending"
                                    >
                                      <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                                    </button>
                      </div>
                                ))}
                              </div>
                            </div>
                          )}
                    </div>
                  </div>

                      {/* Assigned Teams */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                            Assigned Teams ({(selectedTask.assignedTeams && selectedTask.assignedTeams.length > 0) ? selectedTask.assignedTeams.length : 0})
                          </label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAddingTeam(!isAddingTeam)}
                            className="flex items-center space-x-1"
                          >
                            {isAddingTeam ? (
                              <>
                                <X className="w-4 h-4" />
                                <span>Cancel</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                <span>Add Team</span>
                              </>
                            )}
                          </Button>
                        </div>

                        {isAddingTeam && (
                          <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800" data-team-selection>
                            <div className="mb-3">
                              <input
                                type="text"
                                placeholder="Search teams..."
                                value={teamSearch}
                                onChange={(e) => setTeamSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {isLoadingTeams ? (
                                <div className="flex items-center justify-center py-4">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading teams...</span>
                                </div>
                              ) : (
                                <>
                                  {getAvailableTeams()
                                    .filter((team: any) => team.name && team.name.toLowerCase().includes(teamSearch.toLowerCase()))
                                    .map((team: any) => (
                                      <div key={team.id} className="flex items-center justify-between px-3 py-2 hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded-lg transition-colors">
                                        <div className="flex items-center space-x-2 flex-1">
                                          <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                          <span className="text-sm text-gray-700 dark:text-gray-300">{team.name}</span>
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddTeamToPending(team.name);
                                          }}
                                          disabled={pendingTeams.includes(team.name)}
                                          className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                                        >
                                          {pendingTeams.includes(team.name) ? 'Added' : 'Add'}
                                        </button>
                                      </div>
                                    ))}
                                  {getAvailableTeams().filter((team: any) => team.name && team.name.toLowerCase().includes(teamSearch.toLowerCase())).length === 0 && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                                      {teamSearch ? 'No teams found' : 'No available teams'}
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="space-y-3">
                          {/* Current Assigned Teams */}
                          <div className="flex flex-wrap gap-2">
                            {(selectedTask.assignedTeams && selectedTask.assignedTeams.length > 0) ? (
                              selectedTask.assignedTeams.map((team, index) => (
                                <div key={`assigned-team-${index}`} className="flex items-center space-x-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-full text-sm">
                                  <Users className="w-3 h-3" />
                                  <span>{team}</span>
                                  <button
                                    onClick={() => handleRemoveTeam(team)}
                                    className="ml-1 p-0.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                    title="Remove team"
                                  >
                                    <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">Not assigned</p>
                            )}
                          </div>

                          {/* Pending Teams */}
                          {pendingTeams.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Pending additions:</p>
                              <div className="flex flex-wrap gap-2">
                                {pendingTeams.map((team, index) => (
                                  <div key={`pending-team-${index}`} className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full text-sm">
                                    <Users className="w-3 h-3" />
                                    <span>{team}</span>
                                    <button
                                      onClick={() => handleRemoveTeamFromPending(team)}
                                      className="ml-1 p-0.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                      title="Remove from pending"
                                    >
                                      <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Tags</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedTask.tags.split(',').map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-full">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                  </div>

                  {/* Subtasks Management */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Subtasks ({getCurrentSubtasks().length})
                        {pendingSubtasks.length > 0 && (
                          <span className="text-green-600 dark:text-green-400 ml-1">+{pendingSubtasks.length}</span>
                        )}
                      </label>
                      <div className="flex items-center space-x-2">
                        {(pendingUsers.length > 0 || pendingTeams.length > 0 || pendingSubtasks.length > 0) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelChanges}
                              className="flex items-center space-x-1"
                            >
                              <X className="w-4 h-4" />
                              <span>Cancel</span>
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={handleSaveChanges}
                              disabled={isSaving}
                              className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                            >
                              {isSaving ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Save</span>
                                </>
                              )}
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddingSubtask(!isAddingSubtask)}
                          className="flex items-center space-x-1"
                        >
                          {isAddingSubtask ? (
                            <>
                              <X className="w-4 h-4" />
                              <span>Close</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>Add Subtask</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Add Subtask Section */}
                    {isAddingSubtask && (
                      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        {/* Create New Subtask Button */}
                        <div className="mb-4">
                          <Button
                            onClick={() => {
                              console.log('🔄 Creating new subtask - opening form');
                              setIsAddingSubtask(false);
                              handleCreateSubtask();
                              console.log('✅ Form should be open now');
                            }}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Subtask
                          </Button>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                            Create a new task that will automatically be added as a subtask
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 mb-3">
                          <Search className="w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={subtaskSearch}
                            onChange={(e) => setSubtaskSearch(e.target.value)}
                            placeholder="Search existing tasks to add as subtasks..."
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {getAvailableSubtasks().length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                              {subtaskSearch ? 'No tasks found' : 'No available tasks to add'}
                            </p>
                          ) : (
                            getAvailableSubtasks().slice(0, 10).map((task) => (
                              <div
                                key={task.id}
                                className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:shadow-md"
                              >
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {task.title}
                                  </h4>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge variant={getStatusConfig(task.status).color as any} size="sm">
                                      {task.status}
                                    </Badge>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{task.project}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddSubtaskToPending(task.id);
                                  }}
                                  disabled={pendingSubtasks.includes(task.id)}
                                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                                >
                                  {pendingSubtasks.includes(task.id) ? 'Added' : 'Add'}
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Current Subtasks */}
                    <div className="space-y-3">
                      {/* Current Subtasks */}
                      <div className="space-y-2">
                        {getCurrentSubtasks().length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                            No subtasks added yet
                          </p>
                        ) : (
                          getCurrentSubtasks().map((subtask) => (
                          <div
                            key={subtask.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer group"
                            onClick={() => handleTaskClick(subtask)}
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <Link className="w-4 h-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                                <Eye className="w-3 h-3 text-gray-300 group-hover:text-blue-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                  {subtask.title}
                                </h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant={getStatusConfig(subtask.status).color as any} size="sm">
                                    {subtask.status}
                                  </Badge>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{subtask.project}</span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {subtask.assignee}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveSubtaskClick(subtask.id);
                              }}
                              className="ml-2 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex-shrink-0"
                              title="Remove subtask"
                            >
                              <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        ))
                      )}
                      </div>

                      {/* Pending Subtasks */}
                      {pendingSubtasks.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Pending additions:</p>
                          <div className="space-y-2">
                            {pendingSubtasks.map((subtaskId) => {
                              const subtask = tasks.find(t => t.id === subtaskId);
                              if (!subtask) return null;
                              return (
                                <div key={`pending-subtask-${subtaskId}`} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <Link className="w-4 h-4 text-green-500" />
                                      <Eye className="w-3 h-3 text-green-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm font-medium text-green-700 dark:text-green-400 truncate">
                                        {subtask.title}
                                      </h4>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <Badge variant={getStatusConfig(subtask.status).color as any} size="sm">
                                          {subtask.status}
                                        </Badge>
                                        <span className="text-xs text-green-600 dark:text-green-500">{subtask.project}</span>
                                        <span className="text-xs text-green-500 dark:text-green-400">
                                          {subtask.assignee}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveSubtaskFromPending(subtaskId)}
                                    className="ml-2 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex-shrink-0"
                                    title="Remove from pending"
                                  >
                                    <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Comments ({(() => {
                          try {
                            const parsedComments = JSON.parse(selectedTask.comments || '[]');
                            return Array.isArray(parsedComments) ? parsedComments.length : 0;
                          } catch (e) {
                            return 0;
                          }
                        })()})
                      </label>
                    </div>

                    {/* Add Comment Input */}
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1 flex items-center space-x-2">
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddComment();
                              }
                            }}
                          />
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleAddComment}
                            disabled={!newComment.trim() || isPostingComment}
                            className="flex items-center space-x-1 px-3 py-2"
                          >
                            {isPostingComment ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span className="hidden sm:inline">Posting...</span>
                              </>
                            ) : (
                              <>
                                <MessageSquare className="w-4 h-4" />
                                <span className="hidden sm:inline">Post</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                     
                    </div>

                    <div className="space-y-4 max-h-64 overflow-y-auto">
                      {(() => {
                        try {
                          const parsedComments = JSON.parse(selectedTask.comments || '[]');
                          const commentsArray = Array.isArray(parsedComments) ? parsedComments : [];
                          if (commentsArray.length > 0) {
                            return commentsArray.map((comment: any, index: number) => (
                              <div key={index} className="flex space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                  {comment.userName ? comment.userName.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {comment.userName || 'Unknown User'}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {comment.timestamp ? new Date(comment.timestamp).toLocaleString() : 'Just now'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {comment.message || comment.text || comment.content || 'No message'}
                                  </p>
                                </div>
                              </div>
                            ));
                          } else {
                            return (
                              <div className="text-center py-8">
                                <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-500 dark:text-gray-400 text-sm">No comments yet</p>
                                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Be the first to add a comment</p>
                              </div>
                            );
                          }
                        } catch (e) {
                          console.log('Failed to parse comments, showing empty state:', e);
                          return (
                            <div className="text-center py-8">
                              <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                              <p className="text-gray-500 dark:text-gray-400 text-sm">No comments yet</p>
                              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Be the first to add a comment</p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>

                  {/* File Attachments Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        File Attachments ({attachedFiles.length})
                      </label>
                      <label className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span>{isUploadingFile ? 'Uploading...' : 'Add Files'}</span>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => handleFileUpload(e.target.files)}
                          disabled={isUploadingFile}
                        />
                      </label>
                    </div>

                    {/* Loading State */}
                    {isLoadingFiles && (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading files...</span>
                      </div>
                    )}

                    {/* Attached Files List */}
                    {!isLoadingFiles && attachedFiles.length > 0 && (
                      <div className="space-y-2">
                        {attachedFiles.map((file: FileItem) => {
                          const fileKey = `${file.name}-${file.size}`;
                          const preview = filePreviews[fileKey];
                          const isImage = file.mimeType?.startsWith('image/');
                          
                          return (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer"
                              onClick={() => openFilePreview(file)}
                            >
                              <div className="flex items-center space-x-3 flex-1">
                                {isImage && preview && preview !== 'placeholder' ? (
                                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 flex-shrink-0">
                                    <img 
                                      src={preview} 
                                      alt={file.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        console.warn(`Failed to load image preview for ${file.name}`);
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                ) : isImage && loadingPreviews.has(fileKey) ? (
                                  <div className="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center bg-gray-100 dark:bg-gray-600 flex-shrink-0">
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center bg-gray-100 dark:bg-gray-600 flex-shrink-0">
                                    <Paperclip className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFileDownload(file.id, file.name);
                                  }}
                                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                  title="Download file"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFileDelete(file.id);
                                  }}
                                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  title="Delete file"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Empty State */}
                    {!isLoadingFiles && attachedFiles.length === 0 && (
                      <div className="text-center py-8">
                        <Paperclip className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No files attached</p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Upload files to share with your team</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {isFilePreviewOpen && selectedFileForPreview && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeFilePreview();
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-4xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                  <Paperclip className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedFileForPreview.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(selectedFileForPreview.size / 1024 / 1024).toFixed(2)} MB • {new Date(selectedFileForPreview.createdAt).toLocaleDateString()}
                  </p>
                        </div>
                      </div>
              <button
                onClick={closeFilePreview}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
                    </div>

            {/* File Preview Content */}
            <div className="mb-6 max-h-[60vh] overflow-auto">
              {selectedFileForPreview.mimeType?.startsWith('image/') ? (
                <div className="flex justify-center">
                  <img 
                    src={filePreviews[`${selectedFileForPreview.name}-${selectedFileForPreview.size}`] || ''}
                    alt={selectedFileForPreview.name}
                    className="max-w-full max-h-[50vh] object-contain rounded-lg border border-gray-200 dark:border-gray-600"
                    onError={(e) => {
                      console.warn(`Failed to load image preview for ${selectedFileForPreview.name}`);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-24 h-24 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center bg-gray-100 dark:bg-gray-700 mb-4">
                    <Paperclip className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                </div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {selectedFileForPreview.name}
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    This file type cannot be previewed
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Click download to view the file
                  </p>
              </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={closeFilePreview}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleFilePreviewDownload}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download</span>
              </button>
              <button
                onClick={handleFilePreviewDelete}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && taskToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              cancelDeleteTask();
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Task</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
                        </div>
                      </div>
            
            <div className="mb-4">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Are you sure you want to delete <strong>"{taskToDelete.title}"</strong>?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Type <strong>DELETE</strong> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                autoFocus
              />
                    </div>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={cancelDeleteTask}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmDeleteTask}
                disabled={deleteConfirmText !== 'DELETE'}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Delete Task
              </Button>
                  </div>
                </div>
              </div>
      )}

      {/* Remove User Confirmation Modal */}
      {showRemoveUserConfirm && userToRemove && (
        <div 
          ref={removeUserConfirmRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              cancelRemoveUser();
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <X className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Remove User
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to remove this user from the task?
                </p>
              </div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700 dark:text-red-400">
                <strong>User:</strong> {userToRemove}
              </p>
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <Button
                variant="outline"
                onClick={cancelRemoveUser}
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmRemoveUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
              >
                Remove User
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Subtask Confirmation Modal */}
      {showRemoveSubtaskConfirm && subtaskToRemove && (
        <div 
          ref={removeSubtaskConfirmRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              cancelRemoveSubtask();
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <X className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Remove Subtask
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to remove this subtask from the task?
                </p>
              </div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700 dark:text-red-400">
                <strong>Subtask:</strong> {tasks.find(t => t.id === subtaskToRemove)?.title || 'Unknown Task'}
              </p>
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <Button
                variant="outline"
                onClick={cancelRemoveSubtask}
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmRemoveSubtask}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
              >
                Remove Subtask
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default TasksPage;