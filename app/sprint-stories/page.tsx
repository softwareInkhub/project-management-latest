'use client';

import React, { useState, useEffect } from 'react';
import { apiService, Sprint, Story, Project, Team, User } from '../services/api';
import { AppLayout } from '../components/AppLayout';
import { SearchFilterSection } from '../components/ui/SearchFilterSection';
import { 
  Calendar, 
  Users, 
  Target, 
  Clock, 
  CheckCircle, 
  Circle, 
  Play, 
  Pause, 
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Filter,
  Search,
  BarChart3,
  TrendingUp,
  Activity,
  ListTodo,
  Menu,
  X,
  LayoutDashboard,
  FolderKanban
} from 'lucide-react';
import { TaskCreationModal } from './TaskCreationModal';
import { CreateButton, UpdateButton, DeleteButton, ReadOnlyBadge, usePermissions } from '../components/RoleBasedUI';

interface SprintFormData {
  name: string;
  goal: string;
  start_date: string;
  duration_weeks: number;
  status: 'planned' | 'active' | 'completed';
  project_id: string;
  team_id: string;
  velocity: number;
  retrospective_notes?: string;
}

interface StoryFormData {
  title: string;
  description: string;
  acceptance_criteria: string[];
  story_points: number;
  priority: 'low' | 'medium' | 'high';
  status: 'backlog' | 'in_progress' | 'review' | 'done';
  sprint_id: string;
  project_id: string;
  tags: string[];
  tasks: Array<{
    task_id: string;
    title: string;
    status: string;
    assigned_to?: string;
  }>;
}

export default function SprintStoriesPage() {
  // State management
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [showStoryForm, setShowStoryForm] = useState(false);
  // Mobile modal animations (match project modal feel)
  const [storyModalIn, setStoryModalIn] = useState(false);
  const [sprintModalIn, setSprintModalIn] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());
  const [showTaskCreationModal, setShowTaskCreationModal] = useState(false);
  const [selectedStoryForTask, setSelectedStoryForTask] = useState<{ id: string; title: string } | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Start collapsed on mobile
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [activePredefinedFilter, setActivePredefinedFilter] = useState<string>('all');
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, string | string[]>>({});
  
  // Task management state
  const [existingTasks, setExistingTasks] = useState<any[]>([]);
  const [selectedExistingTask, setSelectedExistingTask] = useState('');
  
  // Form data
  const [sprintFormData, setSprintFormData] = useState<SprintFormData>({
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
  
  const [storyFormData, setStoryFormData] = useState<StoryFormData>({
    title: '',
    description: '',
    acceptance_criteria: [''],
    story_points: 1,
    priority: 'medium',
    status: 'backlog',
    sprint_id: '',
    project_id: '',
    tags: [],
    tasks: []
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sprintsRes, storiesRes, projectsRes, teamsRes, usersRes, tasksRes] = await Promise.all([
        apiService.getSprints(),
        apiService.getStories(),
        apiService.getProjects(),
        apiService.getTeams(),
        apiService.getUsers(),
        apiService.getTasks()
      ]);

      if (sprintsRes.success) setSprints(sprintsRes.data || []);
      if (storiesRes.success) setStories(storiesRes.data || []);
      if (projectsRes.success) setProjects(projectsRes.data || []);
      if (teamsRes.success) setTeams(teamsRes.data || []);
      if (usersRes.success) setUsers(usersRes.data || []);
      if (tasksRes.success) setExistingTasks(tasksRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
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

  const handleUpdateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSprint) return;
    
    try {
      // Calculate end_date from start_date and duration_weeks
      const startDate = new Date(sprintFormData.start_date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + (sprintFormData.duration_weeks * 7));
      
      const sprintData = {
        ...sprintFormData,
        end_date: endDate.toISOString().split('T')[0]
      };
      
      const result = await apiService.updateSprint(editingSprint.id, sprintData);
      if (result.success) {
        setSprints(sprints.map(s => s.sprint_id === editingSprint.sprint_id ? result.data! : s));
        resetSprintForm();
        setEditingSprint(null);
        setShowSprintForm(false);
      }
    } catch (error) {
      console.error('Error updating sprint:', error);
    }
  };

  const handleDeleteSprint = async (sprintId: string) => {
    if (!confirm('Are you sure you want to delete this sprint?')) return;
    
    try {
      const result = await apiService.deleteSprint(sprintId);
      if (result.success) {
        setSprints(sprints.filter(s => s.id !== sprintId));
      }
    } catch (error) {
      console.error('Error deleting sprint:', error);
    }
  };

  // Story operations
  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await apiService.createStory(storyFormData);
      if (result.success) {
        setStories([...stories, result.data!]);
        resetStoryForm();
        setShowStoryForm(false);
      }
    } catch (error) {
      console.error('Error creating story:', error);
    }
  };

  const handleUpdateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStory) return;
    
    try {
      const result = await apiService.updateStory(editingStory.id, storyFormData);
      if (result.success) {
        setStories(stories.map(s => s.story_id === editingStory.story_id ? result.data! : s));
        resetStoryForm();
        setEditingStory(null);
        setShowStoryForm(false);
      }
    } catch (error) {
      console.error('Error updating story:', error);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return;
    
    try {
      const result = await apiService.deleteStory(storyId);
      if (result.success) {
        setStories(stories.filter(s => s.id !== storyId));
      }
    } catch (error) {
      console.error('Error deleting story:', error);
    }
  };

  // Form helpers
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

  const resetStoryForm = () => {
    setStoryFormData({
      title: '',
      description: '',
      acceptance_criteria: [''],
      story_points: 1,
      priority: 'medium',
      status: 'backlog',
      sprint_id: '',
      project_id: '',
      tags: [],
      tasks: []
    });
    // Reset task management state
    setSelectedExistingTask('');
  };

  const openEditSprint = (sprint: Sprint) => {
    setEditingSprint(sprint);
    // Calculate duration in weeks from start and end dates
    const startDate = new Date(sprint.start_date);
    const endDate = new Date(sprint.end_date);
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationWeeks = Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 7));
    
    setSprintFormData({
      name: sprint.name,
      goal: sprint.goal,
      start_date: sprint.start_date,
      duration_weeks: durationWeeks,
      status: sprint.status,
      project_id: sprint.project_id,
      team_id: sprint.team_id,
      velocity: sprint.velocity,
      retrospective_notes: sprint.retrospective_notes || ''
    });
    setShowSprintForm(true);
  };

  const openEditStory = (story: Story) => {
    setEditingStory(story);
    setStoryFormData({
      title: story.title,
      description: story.description,
      acceptance_criteria: story.acceptance_criteria,
      story_points: story.story_points,
      priority: story.priority,
      status: story.status,
      sprint_id: story.sprint_id,
      project_id: story.project_id,
      tags: story.tags,
      tasks: story.tasks
    });
    // Reset task management state
    setSelectedExistingTask('');
    setShowStoryForm(true);
  };

  const toggleStoryExpansion = (storyId: string) => {
    const newExpanded = new Set(expandedStories);
    if (newExpanded.has(storyId)) {
      newExpanded.delete(storyId);
    } else {
      newExpanded.add(storyId);
    }
    setExpandedStories(newExpanded);
  };

  const getStoriesForSprint = (sprintId: string) => {
    return stories.filter(story => story.sprint_id === sprintId);
  };

  const getTasksForStory = (story: Story) => {
    if (!story.tasks || story.tasks.length === 0) return [];
    return story.tasks.map(taskRef => {
      const task = existingTasks.find(t => t.id === taskRef.task_id);
      return task ? { ...task, task_status: taskRef.status } : null;
    }).filter(t => t !== null);
  };

  const getTasksByStatus = (story: Story) => {
    const tasks = getTasksForStory(story);
    return {
      todo: tasks.filter(t => t && (t.task_status === 'to_do' || t.task_status === 'backlog' || t.task_status?.toLowerCase().includes('to do'))),
      in_progress: tasks.filter(t => t && (t.task_status === 'in_progress' || t.task_status?.toLowerCase().includes('progress'))),
      completed: tasks.filter(t => t && (t.task_status === 'completed' || t.task_status === 'done' || t.task_status?.toLowerCase().includes('complet'))),
      overdue: tasks.filter(t => t && (t.task_status === 'overdue' || t.task_status?.toLowerCase().includes('overdue')))
    };
  };

  const selectedSprint = sprints.find(s => s.sprint_id === selectedSprintId) || null;
  // Animate modals in on open (mobile slide-up, desktop scale-in)
  useEffect(() => {
    if (showStoryForm) {
      requestAnimationFrame(() => setStoryModalIn(true));
    } else {
      setStoryModalIn(false);
    }
  }, [showStoryForm]);

  useEffect(() => {
    if (showSprintForm) {
      requestAnimationFrame(() => setSprintModalIn(true));
    } else {
      setSprintModalIn(false);
    }
  }, [showSprintForm]);

  // Task management functions

  const removeTaskFromStory = (taskId: string) => {
    setStoryFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.task_id !== taskId)
    }));
  };

  const updateTaskAssignee = (taskId: string, assignee: string) => {
    setStoryFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.task_id === taskId 
          ? { ...task, assigned_to: assignee }
          : task
      )
    }));
  };

  const updateTaskStatus = (taskId: string, status: string) => {
    setStoryFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.task_id === taskId 
          ? { ...task, status }
          : task
      )
    }));
  };

  const addExistingTaskToStory = () => {
    if (!selectedExistingTask) return;
    
    const existingTask = existingTasks.find(task => task.id === selectedExistingTask);
    if (!existingTask) return;
    
    // Check if task is already added to avoid duplicates
    const isAlreadyAdded = storyFormData.tasks.some(task => task.task_id === existingTask.id);
    if (isAlreadyAdded) {
      alert('This task is already added to the story');
      return;
    }
    
    // Get the current logged-in user ID from localStorage
    const currentUserId = localStorage.getItem('userId') || '';
    
    const newTask = {
      task_id: existingTask.id,
      title: existingTask.title,
      status: existingTask.status.toLowerCase().replace(' ', '_'),
      assigned_to: currentUserId // Automatically assign to logged-in user
    };
    
    setStoryFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
    
    // Reset selection
    setSelectedExistingTask('');
  };

  const handleCreateTaskForStory = async (taskData: any) => {
    try {
      // Create the task first
      const result = await apiService.createTask(taskData);
      if (result.success && result.data) {
        const newTask = result.data;
        
        // Now associate this task with the story
        const story = stories.find(s => s.id === taskData.story_id);
        if (story) {
          const updatedTasks = [
            ...(story.tasks || []),
            {
              task_id: newTask.id,
              title: newTask.title,
              status: newTask.status,
              assigned_to: newTask.assignee
            }
          ];
          
          // Update the story with the new task
          const updateResult = await apiService.updateStory(story.id, {
            ...story,
            tasks: updatedTasks
          });
          
          if (updateResult.success) {
            // Reload tasks
            const tasksRes = await apiService.getTasks();
            if (tasksRes.success) {
              setExistingTasks(tasksRes.data || []);
            }
            // Reload stories to get updated task associations
            const storiesRes = await apiService.getStories();
            if (storiesRes.success) {
              setStories(storiesRes.data || []);
            }
            alert('Task created and associated with story successfully!');
          }
        }
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  const openTaskCreationModal = (storyId: string, storyTitle: string) => {
    setSelectedStoryForTask({ id: storyId, title: storyTitle });
    setShowTaskCreationModal(true);
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || projectId;
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.name || teamId;
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || user?.username || user?.email || userId;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'planned': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'in_progress': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'review': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'done': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
        <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
          {/* Left Sidebar - Sprints List */}
          <div className={`${isSidebarCollapsed ? 'w-16' : 'w-72'} flex bg-white dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 flex-col transition-all duration-300`}>
          {/* Sidebar Header */}
          <div className={`${isSidebarCollapsed ? 'px-2 py-3' : 'px-5 py-3'} border-b border-gray-300 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750`}>
            <div className="flex items-center justify-between mb-1">
              {!isSidebarCollapsed ? (
                <>
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">Sprints</h2>
                  </div>
                  <div className="flex items-center space-x-1">
              <button
                      onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                      className="p-1.5 hover:bg-blue-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                      title="Collapse Sidebar"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="w-full p-1.5 hover:bg-blue-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  title="Expand Sidebar"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400 mx-auto" />
                </button>
              )}
            </div>
            {!isSidebarCollapsed && (
              <></>
            )}
            </div>

          {/* Sprints List */}
          <div className={`flex-1 overflow-y-auto ${isSidebarCollapsed ? 'p-2' : 'p-3'}`}>
            {sprints.length === 0 ? (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                {!isSidebarCollapsed ? (
                  <>
                    <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No sprints yet</p>
                  </>
                ) : (
                  <Activity className="w-6 h-6 mx-auto opacity-50" />
                )}
          </div>
            ) : (
              <div className={isSidebarCollapsed ? 'space-y-2' : 'space-y-2'}>
                {sprints.map((sprint, index) => (
                  isSidebarCollapsed ? (
                    // Collapsed view - just number badge
                    <div
                      key={sprint.id}
                      onClick={() => setSelectedSprintId(sprint.sprint_id)}
                      className={`w-10 h-10 mx-auto rounded-lg cursor-pointer transition-all flex items-center justify-center font-bold text-sm ${
                        selectedSprintId === sprint.sprint_id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-600'
                      }`}
                      title={sprint.name}
                    >
                      {index + 1}
                    </div>
                  ) : (
                    // Expanded view - full card
                    <div
                      key={sprint.id}
                      onClick={() => setSelectedSprintId(sprint.sprint_id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all border ${
                        selectedSprintId === sprint.sprint_id
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 shadow-sm'
                          : 'bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold ${
                            selectedSprintId === sprint.sprint_id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                          }`}>
                            {index + 1}
      </div>
                          <span className={`text-sm font-bold ${
                            selectedSprintId === sprint.sprint_id
                              ? 'text-blue-900 dark:text-blue-100'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {sprint.name}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-md font-semibold uppercase ${getStatusColor(sprint.status)}`}>
                          {sprint.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-2 ml-9">
                        {sprint.goal}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 ml-9 pt-2 border-t border-gray-300 dark:border-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(sprint.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 rounded">
                          <ListTodo className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span className="font-semibold text-blue-900 dark:text-blue-100">{getStoriesForSprint(sprint.sprint_id).length}</span>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
      </div>

        {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
          {!selectedSprintId ? (
             /* All Sprints View */
             <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-full">
               <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
                 <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                   <div className="min-w-0 flex-1">
                     <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">All Sprints</h1>
                     <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Manage and track your sprint progress
                    </p>
                   </div>
                 </div>
                 <CreateButton resource="projects">
                   <button
                     onClick={() => {
                       resetStoryForm();
                       setEditingStory(null);
                       setShowStoryForm(true);
                     }}
                     className="flex-shrink-0 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:px-5 sm:py-3 rounded-xl transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
                   >
                     <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                     <span className="font-semibold">Add Story</span>
                   </button>
                 </CreateButton>
               </div>

            <div className="grid gap-3 sm:gap-5 lg:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sprints.map((sprint, index) => {
                const sprintStories = getStoriesForSprint(sprint.sprint_id);
                
                return (
                    <div key={sprint.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-300 dark:border-gray-700 overflow-hidden">
                    {/* Sprint Header */}
                    <div className="p-2.5 sm:p-3 lg:p-2.5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-750">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-base sm:text-lg">{index + 1}</span>
                            </div>
                          <div className="flex-1 min-w-0">
                              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white break-words">
                              {sprint.name}
                              </h2>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {sprint.goal}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                            <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(sprint.status)}`}>
                            {sprint.status}
                          </span>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <UpdateButton
                            resource="projects"
                            onClick={() => openEditSprint(sprint)}
                                className="p-1.5 sm:p-2 hover:bg-white/50 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          >
                                <Edit className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                          </UpdateButton>
                          <DeleteButton
                            resource="projects"
                            onClick={() => handleDeleteSprint(sprint.id)}
                                className="p-1.5 sm:p-2 hover:bg-white/50 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </DeleteButton>
                        </div>
                      </div>
                    </div>

                        <div className="p-2.5 sm:p-3 lg:p-3">
                          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="break-words">{sprint.start_date} - {sprint.end_date}</span>
                            </div>
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span>{sprint.velocity} pts</span>
                            </div>
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="break-words">{getTeamName(sprint.team_id)}</span>
                            </div>
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span>{sprintStories.length} stories</span>
                            </div>
                          </div>
                        </div>
                        </div>
                        
                      {/* Sprint Stories Preview */}
                      <div className="p-2.5 sm:p-3 lg:p-3 pt-0">
                        {sprintStories.length === 0 ? (
                          <p className="text-center text-gray-500 dark:text-gray-400 py-6 sm:py-8 text-sm">
                            No stories in this sprint
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {sprintStories.slice(0, 4).map((story) => (
                              <div key={story.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 border-l-4 border-blue-500">
                                <h4 className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm mb-2 line-clamp-2">
                                        {story.title}
                                </h4>
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(story.status)}`}>
                                      {story.status}
                                    </span>
                                  <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(story.priority)}`}>
                                      {story.priority}
                                    </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {sprintStories.length > 4 && (
                          <button
                            onClick={() => setSelectedSprintId(sprint.sprint_id)}
                            className="w-full mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View all {sprintStories.length} stories →
                          </button>
                        )}
                      </div>
                  </div>
                );
                })}
            </div>
          </div>
          ) : (
            /* Selected Sprint View with Stories and Tasks */
            <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
              {/* Sprint Header */}
              <div className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750 border-b-2 border-blue-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-blue-600 rounded-xl shadow-md flex-shrink-0">
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words">
                        {selectedSprint?.name}
                      </h1>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-1.5 line-clamp-2">
                        {selectedSprint?.goal}
                      </p>
                    </div>
                  </div>
              <CreateButton resource="projects">
                <button
                  onClick={() => {
                    resetStoryForm();
                        setStoryFormData(prev => ({ ...prev, sprint_id: selectedSprint?.sprint_id || '' }));
                    setEditingStory(null);
                    setShowStoryForm(true);
                  }}
                      className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 sm:px-5 sm:py-3 rounded-xl transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="font-semibold">Add Story</span>
                </button>
              </CreateButton>
            </div>
                </div>

              {/* Stories with Tasks */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                {getStoriesForSprint(selectedSprintId).map((story) => {
                  const isExpanded = expandedStories.has(story.id);
                  const tasksByStatus = getTasksByStatus(story);
                  const totalTasks = (story.tasks || []).length;
                  
                return (
                    <div key={story.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-300 dark:border-gray-700">
                      {/* Story Header */}
                      <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                          <button
                            onClick={() => toggleStoryExpansion(story.id)}
                            className="flex items-center space-x-2 sm:space-x-3 flex-1 text-left group"
                          >
                            <div className="p-1 sm:p-1.5 rounded-lg bg-white dark:bg-gray-700 shadow-sm group-hover:shadow-md transition-shadow flex-shrink-0">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors break-words">
                            {story.title}
                          </h3>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 sm:line-clamp-1">
                            {story.description}
                          </p>
                          </div>
                          </button>
                          
                          <div className="flex items-center flex-wrap gap-2 sm:gap-3 sm:flex-nowrap">
                            <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide ${getStatusColor(story.status)}`}>
                              {story.status.replace('_', ' ')}
                        </span>
                            <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide ${getPriorityColor(story.priority)}`}>
                          {story.priority}
                        </span>
                            <div className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <ListTodo className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100">{totalTasks}</span>
                            </div>
                            <div className="hidden sm:block h-8 w-px bg-gray-300 dark:bg-gray-600"></div>
                            <CreateButton resource="tasks">
                              <button
                                onClick={() => openTaskCreationModal(story.id, story.title)}
                                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md text-xs sm:text-sm"
                                title="Create Task"
                              >
                                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="font-medium">Task</span>
                              </button>
                            </CreateButton>
                          <UpdateButton
                            resource="projects"
                            onClick={() => openEditStory(story)}
                              className="p-1.5 sm:p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                              <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </UpdateButton>
                          <DeleteButton
                            resource="projects"
                            onClick={() => handleDeleteStory(story.id)}
                              className="p-1.5 sm:p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </DeleteButton>
                        </div>
                      </div>
                    </div>

                      {/* Tasks organized by status */}
                      {isExpanded && (
                        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/50">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                            {/* To Do Column */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between pb-3 border-b-2 border-gray-300 dark:border-gray-600">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                  <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                                    To Do
                                  </h4>
                  </div>
                                <span className="text-xs px-2.5 py-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-full font-bold">
                                  {tasksByStatus.todo.length}
                                </span>
                              </div>
                              {tasksByStatus.todo.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                                  No tasks
                                </div>
                              ) : (
                                tasksByStatus.todo.map((task: any) => (
                                  <div key={task.id} className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-300 dark:border-gray-700 hover:shadow-md transition-shadow">
                                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                      {task.title}
                                    </h5>
                                    <div className="flex items-center justify-between mt-3">
                                      <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${task.priority ? getPriorityColor(task.priority) : 'bg-gray-200'}`}>
                                        {task.priority || 'medium'}
                                      </span>
                                      <Circle className="w-4 h-4 text-gray-400" />
                                    </div>
                                  </div>
                                ))
              )}
            </div>

                            {/* In Progress Column */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between pb-3 border-b-2 border-blue-500">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                  <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                                    In Progress
                                  </h4>
          </div>
                                <span className="text-xs px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 rounded-full font-bold">
                                  {tasksByStatus.in_progress.length}
                                </span>
                              </div>
                              {tasksByStatus.in_progress.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                                  No tasks
                                </div>
                              ) : (
                                tasksByStatus.in_progress.map((task: any) => (
                                  <div key={task.id} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
                                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                      {task.title}
                                    </h5>
                                    <div className="flex items-center justify-between mt-3">
                                      <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${task.priority ? getPriorityColor(task.priority) : 'bg-gray-200'}`}>
                                        {task.priority || 'medium'}
                                      </span>
                                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Completed Column */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between pb-3 border-b-2 border-green-500">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                                    Completed
                                  </h4>
                                </div>
                                <span className="text-xs px-2.5 py-1 bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-100 rounded-full font-bold">
                                  {tasksByStatus.completed.length}
                                </span>
                              </div>
                              {tasksByStatus.completed.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                                  No tasks
                                </div>
                              ) : (
                                tasksByStatus.completed.map((task: any) => (
                                  <div key={task.id} className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl shadow-sm border border-green-200 dark:border-green-800 hover:shadow-md transition-shadow">
                                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 line-through">
                                      {task.title}
                                    </h5>
                                    <div className="flex items-center justify-between mt-3">
                                      <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${task.priority ? getPriorityColor(task.priority) : 'bg-gray-200'}`}>
                                        {task.priority || 'medium'}
                                      </span>
                                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Overdue Column */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between pb-3 border-b-2 border-red-500">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                  <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                                    Overdue
                                  </h4>
                                </div>
                                <span className="text-xs px-2.5 py-1 bg-red-100 dark:bg-red-900/40 text-red-900 dark:text-red-100 rounded-full font-bold">
                                  {tasksByStatus.overdue.length}
                                </span>
                              </div>
                              {tasksByStatus.overdue.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                                  No tasks
                                </div>
                              ) : (
                                tasksByStatus.overdue.map((task: any) => (
                                  <div key={task.id} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl shadow-sm border border-red-200 dark:border-red-800 hover:shadow-md transition-shadow">
                                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                      {task.title}
                                    </h5>
                                    <div className="flex items-center justify-between mt-3">
                                      <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${task.priority ? getPriorityColor(task.priority) : 'bg-gray-200'}`}>
                                        {task.priority || 'medium'}
                                      </span>
                                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      {isMobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50" 
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Sprints</h3>
              </div>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {sprints.length === 0 ? (
                <div className="text-center py-6 text-gray-400">No sprints yet</div>
              ) : (
                <div className="space-y-2">
                  {sprints.map((sprint, index) => (
                    <div
                      key={sprint.id}
                      onClick={() => {
                        setSelectedSprintId(sprint.sprint_id);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`p-3 rounded-lg cursor-pointer transition-all border ${
                        selectedSprintId === sprint.sprint_id
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 shadow-sm'
                          : 'bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold ${
                            selectedSprintId === sprint.sprint_id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{sprint.name}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-md font-semibold uppercase ${getStatusColor(sprint.status)}`}>
                          {sprint.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 ml-9">{sprint.goal}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Navigation Links */}
            <div className="border-t border-gray-300 dark:border-gray-700 p-3 space-y-1">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">Navigation</p>
              <a
                href="/Dashboard"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-sm font-medium">Dashboard</span>
              </a>
              <a
                href="/project"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                <FolderKanban className="w-5 h-5" />
                <span className="text-sm font-medium">Projects</span>
              </a>
              <a
                href="/task"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                <ListTodo className="w-5 h-5" />
                <span className="text-sm font-medium">Tasks</span>
              </a>
              <a
                href="/calander"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                <Calendar className="w-5 h-5" />
                <span className="text-sm font-medium">Calendar</span>
              </a>
              <a
                href="/team"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">Team</span>
              </a>
            </div>
          </div>
        </>
      )}

      {/* Sprint Form Modal */}
      {showSprintForm && (
        <div
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/70 bg-opacity-50"
          style={{ backdropFilter: 'blur(2px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSprintForm(false);
              setEditingSprint(null);
              resetSprintForm();
            }
          }}
        >
          <div
            className={`bg-white dark:bg-gray-800 rounded-t-2xl lg:rounded-2xl shadow-2xl w-full lg:w-auto lg:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide transform transition-all duration-300 ease-out ${sprintModalIn ? 'translate-y-0 lg:scale-100' : 'translate-y-full lg:scale-95'} `}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6 pb-28 sm:pb-6">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingSprint ? 'Edit Sprint' : 'Create New Sprint'}
                </h3>
              </div>
              <form onSubmit={editingSprint ? handleUpdateSprint : handleCreateSprint} className="space-y-4 max-w-xl mx-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sprint Name
                    </label>
                    <input
                      type="text"
                      value={sprintFormData.name}
                      onChange={(e) => setSprintFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={sprintFormData.status}
                      onChange={(e) => setSprintFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="planned">Planned</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Goal
                  </label>
                  <textarea
                    value={sprintFormData.goal}
                    onChange={(e) => setSprintFormData(prev => ({ ...prev, goal: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    rows={3}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={sprintFormData.start_date}
                      onChange={(e) => setSprintFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duration (Weeks)
                    </label>
                    <select
                      value={sprintFormData.duration_weeks}
                      onChange={(e) => setSprintFormData(prev => ({ ...prev, duration_weeks: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value={1}>1 Week</option>
                      <option value={2}>2 Weeks</option>
                      <option value={3}>3 Weeks</option>
                      <option value={4}>4 Weeks</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project
                    </label>
                    <select
                      value={sprintFormData.project_id}
                      onChange={(e) => setSprintFormData(prev => ({ ...prev, project_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Team
                    </label>
                    <select
                      value={sprintFormData.team_id}
                      onChange={(e) => setSprintFormData(prev => ({ ...prev, team_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Velocity (Story Points)
                  </label>
                  <input
                    type="number"
                    value={sprintFormData.velocity}
                    onChange={(e) => setSprintFormData(prev => ({ ...prev, velocity: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Retrospective Notes
                  </label>
                  <textarea
                    value={sprintFormData.retrospective_notes}
                    onChange={(e) => setSprintFormData(prev => ({ ...prev, retrospective_notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    rows={3}
                  />
                </div>
                
                <div className="sticky  bg-white dark:bg-gray-800 border-t rounded-b-2xl border-gray-300 dark:border-gray-700 p-1 sm:p-5 z-10 pb-0 sm:pb-0 flex flex-row justify-end space-x-40">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSprintForm(false);
                      setEditingSprint(null);
                      resetSprintForm();
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingSprint ? 'Update Sprint' : 'Create Sprint'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Story Form Modal */}
      {showStoryForm && (
        <div
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/70 bg-opacity-50"
          style={{ backdropFilter: 'blur(2px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowStoryForm(false);
              setEditingStory(null);
              resetStoryForm();
            }
          }}
        >
          <div
            className={`bg-white dark:bg-gray-800 rounded-t-2xl lg:rounded-2xl shadow-2xl w-full lg:w-auto lg:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide transform transition-all duration-300 ease-out ${storyModalIn ? 'translate-y-0 lg:scale-100' : 'translate-y-full lg:scale-95'} `}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6 pb-28 sm:pb-6">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingStory ? 'Edit Story' : 'Create New Story'}
                </h3>
              </div>
              <form onSubmit={editingStory ? handleUpdateStory : handleCreateStory} className="space-y-4 max-w-xl mx-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Story Title
                  </label>
                  <input
                    type="text"
                    value={storyFormData.title}
                    onChange={(e) => setStoryFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter story title"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={storyFormData.description}
                    onChange={(e) => setStoryFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Briefly describe the story"
                    rows={3}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={storyFormData.status}
                      onChange={(e) => setStoryFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="backlog">Backlog</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={storyFormData.priority}
                      onChange={(e) => setStoryFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Story Points
                    </label>
                    <input
                      type="number"
                      value={storyFormData.story_points}
                      onChange={(e) => setStoryFormData(prev => ({ ...prev, story_points: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      min="1"
                      max="100"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sprint
                    </label>
                    <select
                      value={storyFormData.sprint_id}
                      onChange={(e) => setStoryFormData(prev => ({ ...prev, sprint_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Select Sprint</option>
                      {sprints.map((sprint, index) => (
                        <option key={sprint.id || `sprint-${index}`} value={sprint.sprint_id}>
                          {sprint.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project
                    </label>
                    <select
                      value={storyFormData.project_id}
                      onChange={(e) => setStoryFormData(prev => ({ ...prev, project_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                </div>
                

                {/* Tasks Management Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Tasks
                  </label>
                  
                  {/* Add Existing Task */}
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg max-w-xl mx-auto w-full">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Add Existing Task</h4>
                    <div className="flex gap-3">
                      <select
                        value={selectedExistingTask}
                        onChange={(e) => setSelectedExistingTask(e.target.value)}
                        className="w-72 sm:w-96 max-w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                      >
                        <option value="">Select an existing task</option>
                        {existingTasks
                          .filter(task => !storyFormData.tasks.some(st => st.task_id === task.id))
                          .map((task, index) => (
                            <option key={task.id || `existing-task-${index}`} value={task.id}>
                              {task.title} - {task.status} - {getUserName(task.assignee)}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={addExistingTaskToStory}
                        disabled={!selectedExistingTask}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors text-sm"
                      >
                        Add Task
                      </button>
                    </div>
                  </div>
                  

                  {/* Existing Tasks */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Current Tasks ({storyFormData.tasks.length})</h4>
                    {storyFormData.tasks.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No tasks added yet</p>
                    ) : (
                      storyFormData.tasks.map((task) => (
                        <div key={task.task_id} className="p-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900 dark:text-white text-sm">{task.title}</h5>
                            <button
                              type="button"
                              onClick={() => removeTaskFromStory(task.task_id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Remove Task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Status</label>
                              <select
                                value={task.status}
                                onChange={(e) => updateTaskStatus(task.task_id, e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-500 dark:text-white"
                              >
                                <option value="backlog">Backlog</option>
                                <option value="in_progress">In Progress</option>
                                <option value="review">Review</option>
                                <option value="done">Done</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Assignee</label>
                              <select
                                value={task.assigned_to || ''}
                                onChange={(e) => updateTaskAssignee(task.task_id, e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-500 dark:text-white"
                              >
                                <option value="">Unassigned</option>
                                {users.map((user, index) => (
                                  <option key={user.id || user.email || `user-${index}`} value={user.id}>
                                    {user.name || user.username || user.email}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t rounded-b-2xl border-gray-300 dark:border-gray-700 p-1 sm:p-4 z-10 pb-1 sm:pb-4 flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStoryForm(false);
                      setEditingStory(null);
                      resetStoryForm();
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingStory ? 'Update Story' : 'Create Story'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      {showTaskCreationModal && selectedStoryForTask && (
        <TaskCreationModal
          isOpen={showTaskCreationModal}
          onClose={() => {
            setShowTaskCreationModal(false);
            setSelectedStoryForTask(null);
          }}
          onCreateTask={handleCreateTaskForStory}
          storyId={selectedStoryForTask.id}
          storyTitle={selectedStoryForTask.title}
          users={users}
        />
      )}
    </AppLayout>
  );
}

