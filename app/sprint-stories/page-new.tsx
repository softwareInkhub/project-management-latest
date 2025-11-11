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
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());
  
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
      todo: tasks.filter(t => t && (t.task_status === 'backlog' || t.task_status === 'to_do')),
      in_progress: tasks.filter(t => t && t.task_status === 'in_progress'),
      review: tasks.filter(t => t && t.task_status === 'review'),
      done: tasks.filter(t => t && t.task_status === 'done')
    };
  };

  const selectedSprint = sprints.find(s => s.sprint_id === selectedSprintId) || null;

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
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Sprints</h2>
            </div>
          </div>

          {/* Sprints List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {sprints.map((sprint, index) => (
              <div
                key={sprint.id}
                onClick={() => setSelectedSprintId(sprint.sprint_id)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedSprintId === sprint.sprint_id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 shadow-sm'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Sprint {index + 1}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(sprint.status)}`}>
                    {sprint.status}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1 text-sm">
                  {sprint.name}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                  {sprint.goal}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(sprint.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Activity className="w-3 h-3" />
                    <span>{getStoriesForSprint(sprint.sprint_id).length} stories</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {!selectedSprintId ? (
            /* All Sprints View */
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Sprints</h1>
                <button
                  onClick={() => {
                    resetStoryForm();
                    setEditingStory(null);
                    setShowStoryForm(true);
                  }}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Story</span>
                </button>
              </div>

              <div className="grid gap-6">
                {sprints.map((sprint, index) => {
                  const sprintStories = getStoriesForSprint(sprint.sprint_id);
                  
                  return (
                    <div key={sprint.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                      {/* Sprint Header */}
                      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-750">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-lg">{index + 1}</span>
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {sprint.name}
                              </h2>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {sprint.goal}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(sprint.status)}`}>
                              {sprint.status}
                            </span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => openEditSprint(sprint)}
                                className="p-2 hover:bg-white/50 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                title="Edit Sprint"
                              >
                                <Edit className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                              </button>
                              <button
                                onClick={() => handleDeleteSprint(sprint.id)}
                                className="p-2 hover:bg-white/50 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                title="Delete Sprint"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-6 mt-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{sprint.start_date} - {sprint.end_date}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4" />
                            <span>{sprint.velocity} pts</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>{getTeamName(sprint.team_id)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Activity className="w-4 h-4" />
                            <span>{sprintStories.length} stories</span>
                          </div>
                        </div>
                      </div>

                      {/* Sprint Stories Preview */}
                      <div className="p-6">
                        {sprintStories.length === 0 ? (
                          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                            No stories in this sprint
                          </p>
                        ) : (
                          <div className="grid grid-cols-4 gap-4">
                            {sprintStories.slice(0, 4).map((story) => (
                              <div key={story.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500">
                                <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">
                                  {story.title}
                                </h4>
                                <div className="flex items-center justify-between">
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
            <div className="h-full flex flex-col">
              {/* Sprint Header */}
              <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedSprint?.name}
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedSprint?.goal}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      resetStoryForm();
                      setStoryFormData(prev => ({ ...prev, sprint_id: selectedSprint?.sprint_id || '' }));
                      setEditingStory(null);
                      setShowStoryForm(true);
                    }}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Story</span>
                  </button>
                </div>
              </div>

              {/* Stories with Tasks */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {getStoriesForSprint(selectedSprintId).map((story) => {
                  const isExpanded = expandedStories.has(story.id);
                  const tasksByStatus = getTasksByStatus(story);
                  const totalTasks = (story.tasks || []).length;
                  
                  return (
                    <div key={story.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                      {/* Story Header */}
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => toggleStoryExpansion(story.id)}
                            className="flex items-center space-x-3 flex-1 text-left"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-500" />
                            )}
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {story.title}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {story.description}
                              </p>
                            </div>
                          </button>
                          
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(story.status)}`}>
                              {story.status}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(story.priority)}`}>
                              {story.priority}
                            </span>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <CheckCircle className="w-4 h-4" />
                              <span>{totalTasks} tasks</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => openEditStory(story)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Edit Story"
                              >
                                <Edit className="w-4 h-4 text-gray-500" />
                              </button>
                              <button
                                onClick={() => handleDeleteStory(story.id)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Delete Story"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tasks organized by status */}
                      {isExpanded && (
                        <div className="p-4">
                          <div className="grid grid-cols-4 gap-4">
                            {/* To Do Column */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase">
                                  To Do
                                </h4>
                                <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full">
                                  {tasksByStatus.todo.length}
                                </span>
                              </div>
                              {tasksByStatus.todo.map((task: any) => (
                                <div key={task.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-gray-400">
                                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                    {task.title}
                                  </h5>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className={`text-xs px-2 py-0.5 rounded ${task.priority ? getPriorityColor(task.priority) : 'bg-gray-200'}`}>
                                      {task.priority || 'medium'}
                                    </span>
                                    <Circle className="w-3 h-3 text-gray-400" />
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* In Progress Column */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase">
                                  In Progress
                                </h4>
                                <span className="text-xs px-2 py-1 bg-blue-200 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                                  {tasksByStatus.in_progress.length}
                                </span>
                              </div>
                              {tasksByStatus.in_progress.map((task: any) => (
                                <div key={task.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                    {task.title}
                                  </h5>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className={`text-xs px-2 py-0.5 rounded ${task.priority ? getPriorityColor(task.priority) : 'bg-gray-200'}`}>
                                      {task.priority || 'medium'}
                                    </span>
                                    <Clock className="w-3 h-3 text-blue-500" />
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Review Column */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase">
                                  Review
                                </h4>
                                <span className="text-xs px-2 py-1 bg-purple-200 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full">
                                  {tasksByStatus.review.length}
                                </span>
                              </div>
                              {tasksByStatus.review.map((task: any) => (
                                <div key={task.id} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                    {task.title}
                                  </h5>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className={`text-xs px-2 py-0.5 rounded ${task.priority ? getPriorityColor(task.priority) : 'bg-gray-200'}`}>
                                      {task.priority || 'medium'}
                                    </span>
                                    <Eye className="w-3 h-3 text-purple-500" />
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Done Column */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase">
                                  Done
                                </h4>
                                <span className="text-xs px-2 py-1 bg-green-200 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full">
                                  {tasksByStatus.done.length}
                                </span>
                              </div>
                              {tasksByStatus.done.map((task: any) => (
                                <div key={task.id} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500 opacity-75">
                                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1 line-through">
                                    {task.title}
                                  </h5>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className={`text-xs px-2 py-0.5 rounded ${task.priority ? getPriorityColor(task.priority) : 'bg-gray-200'}`}>
                                      {task.priority || 'medium'}
                                    </span>
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                  </div>
                                </div>
                              ))}
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

      {/* Sprint Form Modal */}
      {showSprintForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingSprint ? 'Edit Sprint' : 'Create New Sprint'}
              </h3>
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingStory ? 'Edit Story' : 'Create New Story'}
              </h3>
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
                  <div className="mb-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg max-w-2xl mx-auto w-full">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Add Existing Task</h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select
                        value={selectedExistingTask}
                        onChange={(e) => setSelectedExistingTask(e.target.value)}
                        className="flex-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white text-sm overflow-hidden"
                      >
                        <option value="">Select an existing task</option>
                        {existingTasks
                          .filter(task => !storyFormData.tasks.some(st => st.task_id === task.id))
                          .map((task, index) => {
                            // Truncate title if too long for mobile
                            const displayTitle = task.title.length > 30 ? task.title.substring(0, 30) + '...' : task.title;
                            return (
                              <option key={task.id || `existing-task-${index}`} value={task.id}>
                                {displayTitle} - {task.status}
                              </option>
                            );
                          })}
                      </select>
                      <button
                        type="button"
                        onClick={addExistingTaskToStory}
                        disabled={!selectedExistingTask}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors text-sm flex-shrink-0"
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
    </AppLayout>
  );
}

