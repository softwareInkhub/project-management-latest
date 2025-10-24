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
  Filter,
  Search,
  BarChart3,
  TrendingUp,
  Activity
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'sprints' | 'stories'>('sprints');
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [expandedSprints, setExpandedSprints] = useState<Set<string>>(new Set());
  
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

  const toggleSprintExpansion = (sprintId: string) => {
    const newExpanded = new Set(expandedSprints);
    if (newExpanded.has(sprintId)) {
      newExpanded.delete(sprintId);
    } else {
      newExpanded.add(sprintId);
    }
    setExpandedSprints(newExpanded);
  };

  const getStoriesForSprint = (sprintId: string) => {
    return stories.filter(story => story.sprint_id === sprintId);
  };

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

  // Filtering logic for sprints
  const filteredSprints = sprints.filter(sprint => {
    const matchesSearch = sprint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sprint.goal.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sprint.status === statusFilter;
    const matchesProject = projectFilter === 'all' || sprint.project_id === projectFilter;
    const matchesTeam = teamFilter === 'all' || sprint.team_id === teamFilter;
    
    // Apply advanced filters if any
    const statusFilters = (advancedFilters.status as string[]) || [];
    const projectFilters = (advancedFilters.project as string[]) || [];
    const teamFilters = (advancedFilters.team as string[]) || [];
    
    const matchesAdvancedStatus = statusFilters.length === 0 || statusFilters.includes(sprint.status);
    const matchesAdvancedProject = projectFilters.length === 0 || projectFilters.includes(sprint.project_id);
    const matchesAdvancedTeam = teamFilters.length === 0 || teamFilters.includes(sprint.team_id);
    
    return matchesSearch && matchesStatus && matchesProject && matchesTeam && 
           matchesAdvancedStatus && matchesAdvancedProject && matchesAdvancedTeam;
  });

  // Filtering logic for stories
  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || story.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || story.priority === priorityFilter;
    const matchesProject = projectFilter === 'all' || story.project_id === projectFilter;
    
    // Apply advanced filters if any
    const statusFilters = (advancedFilters.status as string[]) || [];
    const priorityFilters = (advancedFilters.priority as string[]) || [];
    const projectFilters = (advancedFilters.project as string[]) || [];
    
    const matchesAdvancedStatus = statusFilters.length === 0 || statusFilters.includes(story.status);
    const matchesAdvancedPriority = priorityFilters.length === 0 || priorityFilters.includes(story.priority);
    const matchesAdvancedProject = projectFilters.length === 0 || projectFilters.includes(story.project_id);
    
    return matchesSearch && matchesStatus && matchesPriority && matchesProject &&
           matchesAdvancedStatus && matchesAdvancedPriority && matchesAdvancedProject;
  });

  // Predefined filters
  const predefinedFilters = [
    {
      key: 'all',
      label: 'All',
      count: sprints.length + stories.length,
      isActive: activePredefinedFilter === 'all',
      onClick: () => {
        setActivePredefinedFilter('all');
        setStatusFilter('all');
        setPriorityFilter('all');
      }
    },
    {
      key: 'active',
      label: 'Active',
      count: sprints.filter(s => s.status === 'active').length,
      isActive: activePredefinedFilter === 'active',
      onClick: () => {
        setActivePredefinedFilter('active');
        setStatusFilter('active');
      }
    },
    {
      key: 'planned',
      label: 'Planned',
      count: sprints.filter(s => s.status === 'planned').length,
      isActive: activePredefinedFilter === 'planned',
      onClick: () => {
        setActivePredefinedFilter('planned');
        setStatusFilter('planned');
      }
    },
    {
      key: 'completed',
      label: 'Completed',
      count: sprints.filter(s => s.status === 'completed').length + stories.filter(s => s.status === 'done').length,
      isActive: activePredefinedFilter === 'completed',
      onClick: () => {
        setActivePredefinedFilter('completed');
        setStatusFilter('completed');
      }
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
    // Filters are applied automatically
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters({});
    setStatusFilter('all');
    setPriorityFilter('all');
    setProjectFilter('all');
    setTeamFilter('all');
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
      <div className="w-full px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
      {/* Header */}
      <div className="">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            
            <div className="flex w-full space-x-3">
              <button
                onClick={() => setActiveTab('sprints')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'sprints'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Sprints
              </button>
              <button
                onClick={() => setActiveTab('stories')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'stories'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Stories
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SearchFilterSection
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={activeTab === 'sprints' ? "Search sprints..." : "Search stories..."}
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
              options: activeTab === 'sprints' 
                ? [
                    { value: 'all', label: 'All Status' },
                    { value: 'planned', label: 'Planned' },
                    { value: 'active', label: 'Active' },
                    { value: 'completed', label: 'Completed' }
                  ]
                : [
                    { value: 'all', label: 'All Status' },
                    { value: 'backlog', label: 'Backlog' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'review', label: 'Review' },
                    { value: 'done', label: 'Done' }
                  ]
            },
            ...(activeTab === 'stories' ? [{
              key: 'priority',
              label: 'Priority',
              value: priorityFilter,
              onChange: setPriorityFilter,
              options: [
                { value: 'all', label: 'All Priority' },
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' }
              ]
            }] : []),
            {
              key: 'project',
              label: 'Project',
              value: projectFilter,
              onChange: setProjectFilter,
              options: [
                { value: 'all', label: 'All Projects' },
                ...projects.map(p => ({ value: p.id, label: p.name }))
              ]
            },
            ...(activeTab === 'sprints' ? [{
              key: 'team',
              label: 'Team',
              value: teamFilter,
              onChange: setTeamFilter,
              options: [
                { value: 'all', label: 'All Teams' },
                ...teams.map(t => ({ value: t.id, label: t.name }))
              ]
            }] : [])
          ]}
        />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'sprints' && (
          <div className="space-y-6">
            {/* Sprints Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Sprints</h2>
              <button
                onClick={() => {
                  resetSprintForm();
                  setEditingSprint(null);
                  setShowSprintForm(true);
                }}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Sprint</span>
              </button>
            </div>

            {/* Sprints List */}
            <div className="grid gap-6">
              {filteredSprints.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400">No sprints found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Try adjusting your filters or create a new sprint</p>
                </div>
              ) : (
                filteredSprints.map((sprint) => {
                const sprintStories = getStoriesForSprint(sprint.sprint_id);
                const isExpanded = expandedSprints.has(sprint.id);
                
                return (
                  <div key={sprint.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    {/* Sprint Header */}
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => toggleSprintExpansion(sprint.id)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-500" />
                            )}
                          </button>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {sprint.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {sprint.goal}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(sprint.status)}`}>
                            {sprint.status}
                          </span>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>{sprint.start_date} - {sprint.end_date}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Target className="w-4 h-4" />
                            <span>{sprint.velocity} pts</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Users className="w-4 h-4" />
                            <span>{getTeamName(sprint.team_id)}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Activity className="w-4 h-4" />
                            <span>{sprintStories.length} stories</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditSprint(sprint)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            title="Edit Sprint"
                          >
                            <Edit className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDeleteSprint(sprint.id)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            title="Delete Sprint"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Sprint Stories */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-md font-medium text-gray-900 dark:text-white">
                            Stories ({sprintStories.length})
                          </h4>
                          <button
                            onClick={() => {
                              resetStoryForm();
                              setStoryFormData(prev => ({ ...prev, sprint_id: sprint.sprint_id }));
                              setEditingStory(null);
                              setShowStoryForm(true);
                            }}
                            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Story</span>
                          </button>
                        </div>
                        
                        {sprintStories.length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                            No stories in this sprint
                          </p>
                        ) : (
                          <div className="grid gap-4">
                            {sprintStories.map((story) => (
                              <div key={story.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div>
                                      <h5 className="font-medium text-gray-900 dark:text-white">
                                        {story.title}
                                      </h5>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {story.description}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(story.status)}`}>
                                      {story.status}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(story.priority)}`}>
                                      {story.priority}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      {story.story_points} pts
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => openEditStory(story)}
                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                        title="Edit Story"
                                      >
                                        <Edit className="w-4 h-4 text-gray-500" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteStory(story.id)}
                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                        title="Delete Story"
                                      >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
              )}
            </div>
          </div>
        )}

        {activeTab === 'stories' && (
          <div className="space-y-6">
            {/* Stories Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">All Stories</h2>
              <button
                onClick={() => {
                  resetStoryForm();
                  setEditingStory(null);
                  setShowStoryForm(true);
                }}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Story</span>
              </button>
            </div>

            {/* Stories List */}
            <div className="grid gap-4">
              {filteredStories.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400">No stories found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Try adjusting your filters or create a new story</p>
                </div>
              ) : (
                filteredStories.map((story) => {
                const sprint = sprints.find(s => s.sprint_id === story.sprint_id);
                return (
                  <div key={story.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {story.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {story.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>Sprint: {sprint?.name || 'No Sprint'}</span>
                            <span>Project: {getProjectName(story.project_id)}</span>
                            <span>Assigned: {getUserName(story.assigned_to)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(story.status)}`}>
                          {story.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(story.priority)}`}>
                          {story.priority}
                        </span>
                        <span className="text-sm text-gray-500">
                          {story.story_points} pts
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditStory(story)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            title="Edit Story"
                          >
                            <Edit className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDeleteStory(story.id)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            title="Delete Story"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sprint Form Modal */}
      {showSprintForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingSprint ? 'Edit Sprint' : 'Create New Sprint'}
              </h3>
              <form onSubmit={editingSprint ? handleUpdateSprint : handleCreateSprint} className="space-y-4">
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
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSprintForm(false);
                      setEditingSprint(null);
                      resetSprintForm();
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingStory ? 'Edit Story' : 'Create New Story'}
              </h3>
              <form onSubmit={editingStory ? handleUpdateStory : handleCreateStory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Story Title
                  </label>
                  <input
                    type="text"
                    value={storyFormData.title}
                    onChange={(e) => setStoryFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Add Existing Task</h4>
                    <div className="flex gap-3">
                      <select
                        value={selectedExistingTask}
                        onChange={(e) => setSelectedExistingTask(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
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
                        <div key={task.task_id} className="p-3 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg">
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
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStoryForm(false);
                      setEditingStory(null);
                      resetStoryForm();
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
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
      </div>
    </AppLayout>
  );
}
