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
  ArrowDown,
  X,
  Search,
  Link
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
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskPreviewOpen, setIsTaskPreviewOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  
  // Subtask management
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskSearch, setSubtaskSearch] = useState('');
  const [isPreviewAnimating, setIsPreviewAnimating] = useState(false);
  
  // Comment management
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
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
      const response = await apiService.deleteTask(taskId);
      
      if (response.success) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to delete task' };
      }
    } catch (error) {
      console.error('Error deleting task:', error);
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
      if (res.success && res.data) {
        console.log('✅ Users fetched:', res.data.length);
        setAllUsers(res.data);
      } else {
        console.error('❌ Failed to fetch users:', res.error);
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
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
      if (res.success && res.data) {
        console.log('✅ Teams fetched:', res.data.length);
        setAllTeams(res.data);
      } else {
        console.error('❌ Failed to fetch teams:', res.error);
      }
    } catch (error) {
      console.error('❌ Error fetching teams:', error);
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
          closeForm();
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
      
      // Update selected task to reflect changes
      const updatedTask = tasks.find(t => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
      
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

  const closeForm = () => {
    setIsFormAnimating(true); // Start slide-down animation (translate-y-full)
    
    // Wait for slide-down animation to complete before hiding
    setTimeout(() => {
      setIsTaskFormOpen(false);
      setIsFormAnimating(false);
      setSelectedTask(null); // Clear selected task when closing form
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

         {/* Tasks List */}
         {!isLoading && !error && viewMode === 'list' ? (
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
                       <Avatar name={task.assignee} size="sm" />
                       <Avatar name="Team Member 2" size="sm" />
                       <Avatar name="Team Member 3" size="sm" />
                     </div>
                     <span className="text-xs text-gray-500">{task.assignee}</span>
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
                           <Badge variant={getStatusConfig(task.status).color as any} size="sm">
                             {getStatusIcon(task.status)}
                             <span className="ml-1 hidden sm:inline">{getStatusConfig(task.status).label}</span>
                           </Badge>
                         </div>
                         <div className="flex items-center space-x-1">
                           <Badge variant={getPriorityConfig(task.priority).color as any} size="sm">
                             {getPriorityIcon(task.priority)}
                             <span className="ml-1 hidden sm:inline">{getPriorityConfig(task.priority).label}</span>
                           </Badge>
                         </div>
                         <div className="flex items-center space-x-1">
                           <Clock size={10} className="sm:w-3 sm:h-3" />
                           <span className="text-xs">{task.estimatedHours}h</span>
                         </div>
                         <div className="flex items-center space-x-1">
                           <MessageSquare size={10} className="sm:w-3 sm:h-3" />
                           <span className="text-xs">{(() => {
                             try {
                               const commentsArray = JSON.parse(task.comments);
                               return Array.isArray(commentsArray) ? commentsArray.length : parseInt(task.comments) || 0;
                             } catch (e) {
                               return parseInt(task.comments) || 0;
                             }
                           })()}</span>
                         </div>
                       <div className="flex items-center space-x-1">
                         <CheckSquare size={10} className="sm:w-3 sm:h-3" />
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
                     <Avatar name={task.assignee} size="sm" />
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
                      </div>
                    </div>
                    
                    {/* Status and Priority Badges - Priority hidden on mobile */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <Badge variant={getStatusConfig(task.status).color as any} size="sm" className="text-xs">
                        {getStatusIcon(task.status)}
                        <span className="ml-1 text-xs">{getStatusConfig(task.status).label}</span>
                      </Badge>
                      <div className="hidden sm:block">
                        <Badge variant={getPriorityConfig(task.priority).color as any} size="sm" className="text-xs">
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
                        <div className="flex items-center space-x-1">
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
                        <div className="flex items-center space-x-1">
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
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <CheckSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedTask.title}</h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Task Details</p>
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
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Assigned To</label>
                        <div className="flex items-center space-x-3">
                          <Avatar name={selectedTask.assignee} size="md" />
                          <span className="text-gray-600 dark:text-gray-300">{selectedTask.assignee}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Team</label>
                        <p className="text-gray-600 dark:text-gray-300">{selectedTask.assignedTeams?.join(', ') || 'Not assigned'}</p>
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
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingSubtask(!isAddingSubtask)}
                        className="flex items-center space-x-1"
                      >
                        {isAddingSubtask ? (
                          <>
                            <X className="w-4 h-4" />
                            <span>Cancel</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Add Subtask</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Add Subtask Section */}
                    {isAddingSubtask && (
                      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center space-x-2 mb-3">
                          <Search className="w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={subtaskSearch}
                            onChange={(e) => setSubtaskSearch(e.target.value)}
                            placeholder="Search tasks to add as subtasks..."
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
                                onClick={() => handleAddSubtask(task.id)}
                                className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all hover:shadow-md"
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
                                <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2" />
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

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
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all cursor-pointer"
                            onClick={() => handleTaskClick(subtask)}
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <Link className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
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
                                handleRemoveSubtask(subtask.id);
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
