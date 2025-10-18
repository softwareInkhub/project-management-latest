'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { 
  Plus, 
  MoreVertical, 
  Calendar, 
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Edit,
  Eye,
  FolderKanban,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Users,
  Target,
  Search,
  Filter,
  Crown,
  User
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Avatar } from '../components/ui/Avatar';
import { StatsCard } from '../components/ui/StatsCard';
import { SearchFilterSection } from '../components/ui/SearchFilterSection';
import { ViewToggle } from '../components/ui/ViewToggle';
import { AppLayout } from '../components/AppLayout';
import { useTabs } from '../hooks/useTabs';
import { useSidebar } from '../components/AppLayout';
import ProjectForm, { Project } from '../components/ui/ProjectForm';

// Status and priority mapping
const normalizeStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'Planning': 'planning',
    'Active': 'active',
    'Completed': 'completed',
    'On Hold': 'on-hold'
  };
  return statusMap[status] || status.toLowerCase();
};

// Helper function to get team count
const getTeamCount = (team: string | string[] | undefined): number => {
  if (!team) return 0;
  if (Array.isArray(team)) return team.length;
  return 1;
};

// Helper function to parse tasks array
const getTasksArray = (tasks: string | string[] | undefined): string[] => {
  if (!tasks) return [];
  if (Array.isArray(tasks)) return tasks;
  try {
    return JSON.parse(tasks);
  } catch {
    return [];
  }
};

// Helper function to parse tags array
const getTagsArray = (tags: string | string[] | undefined): string[] => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try {
    return JSON.parse(tags);
  } catch (error) {
    console.warn('Failed to parse tags JSON:', tags, error);
    return [];
  }
};

const statusColors: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  'Active': 'success',
  'On Hold': 'warning',
  'Completed': 'info',
  'Planning': 'default'
};

const priorityColors: Record<string, 'danger' | 'warning' | 'default'> = {
  'High': 'danger',
  'Medium': 'warning',
  'Low': 'default'
};

const ProjectsPage = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isProjectPreviewOpen, setIsProjectPreviewOpen] = useState(false);
  const [isPreviewAnimating, setIsPreviewAnimating] = useState(false);
  const [activePredefinedFilter, setActivePredefinedFilter] = useState('all');
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, string | string[]>>({});
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const projectPreviewRef = useRef<HTMLDivElement>(null);
  const advancedFilterRef = useRef<HTMLDivElement>(null);
  const { openTab } = useTabs();
  const { isCollapsed } = useSidebar();

  // Fetch projects from API
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('📋 Fetching projects...');
      const res = await apiService.getProjects();
      
      if (res.success && res.data) {
        console.log('✅ Projects fetched:', res.data.length);
        setProjects(res.data);
      } else {
        console.error('❌ Failed to fetch projects:', res.error);
        alert(`Failed to fetch projects: ${res.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
      alert('An unexpected error occurred while fetching projects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Predefined filters
  const predefinedFilters = [
    { id: 'all', label: 'All Projects', count: projects.length },
    { id: 'Active', label: 'Active', count: projects.filter(p => p.status === 'Active').length },
    { id: 'Completed', label: 'Completed', count: projects.filter(p => p.status === 'Completed').length },
    { id: 'On Hold', label: 'On Hold', count: projects.filter(p => p.status === 'On Hold').length },
    { id: 'Planning', label: 'Planning', count: projects.filter(p => p.status === 'Planning').length }
  ];

  const filteredProjects = projects.filter(project => {
    const matchesSearch = (project.name || project.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
    
    // Apply predefined filters
    let matchesPredefined = true;
    if (activePredefinedFilter !== 'all') {
      matchesPredefined = project.status === activePredefinedFilter;
    }
    
    // Apply advanced filters
    let matchesAdvanced = true;
    Object.entries(advancedFilters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        if (key === 'status' && project.status !== value) matchesAdvanced = false;
        if (key === 'priority' && project.priority !== value) matchesAdvanced = false;
        // Additional filters can be added here
      }
    });
    
    return matchesSearch && matchesStatus && matchesPriority && matchesPredefined && matchesAdvanced;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'planning': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <ArrowUp className="w-4 h-4" />;
      case 'medium': return <ArrowUp className="w-4 h-4" />;
      case 'low': return <ArrowDown className="w-4 h-4" />;
      default: return <ArrowUp className="w-4 h-4" />;
    }
  };

  // Project preview and edit handlers
  const handleProjectClick = (project: any) => {
    setSelectedProject(project);
    setIsProjectPreviewOpen(true);
    setIsPreviewAnimating(false);
  };

  const handleEditProject = (project: any) => {
    setEditingProject(project);
    setIsProjectFormOpen(true);
    setIsProjectPreviewOpen(false);
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setIsProjectFormOpen(true);
  };

  const handleProjectFormSubmit = async (projectData: any) => {
    try {
      if (editingProject) {
        // Update existing project
        console.log('🔄 Updating project:', editingProject.id, projectData);
        const result = await apiService.updateProject(editingProject.id, projectData);
        
        if (result.success) {
          console.log('✅ Project updated successfully:', result.data);
          setIsProjectFormOpen(false);
          setEditingProject(null);
          // Refresh projects list
          fetchProjects();
        } else {
          console.error('❌ Failed to update project:', result.error);
          alert(`Failed to update project: ${result.error}`);
        }
      } else {
        // Create new project
        console.log('🆕 Creating new project:', projectData);
        const result = await apiService.createProject(projectData);
        
        if (result.success) {
          console.log('✅ Project created successfully:', result.data);
          setIsProjectFormOpen(false);
          setEditingProject(null);
          // Refresh projects list
          fetchProjects();
        } else {
          console.error('❌ Failed to create project:', result.error);
          alert(`Failed to create project: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('❌ Error with project operation:', error);
      alert('An unexpected error occurred while processing the project');
    }
  };

  const handleProjectFormCancel = () => {
    setIsProjectFormOpen(false);
    setEditingProject(null);
  };

  const closeProjectPreview = () => {
    setIsPreviewAnimating(true);
    setTimeout(() => {
      setIsProjectPreviewOpen(false);
      setIsPreviewAnimating(false);
      setSelectedProject(null);
    }, 300);
  };

  // Advanced filter handlers
  const handleAdvancedFilterChange = (key: string, value: string | string[]) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const removeAdvancedFilter = (key: string) => {
    setAdvancedFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const clearAllAdvancedFilters = () => {
    setAdvancedFilters({});
  };

  // Close project preview and advanced filter when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectPreviewRef.current && !projectPreviewRef.current.contains(event.target as Node)) {
        closeProjectPreview();
      }
      if (advancedFilterRef.current && !advancedFilterRef.current.contains(event.target as Node)) {
        setIsAdvancedFilterOpen(false);
      }
    };

    if (isProjectPreviewOpen || isAdvancedFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProjectPreviewOpen, isAdvancedFilterOpen]);

  return (
    <AppLayout>
      <div className="w-full px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Projects</h1>
          <div className="flex items-center space-x-4">
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
                onClick={handleCreateProject}
              >
                <Plus size={16} className="sm:w-4 sm:h-4" />
                <span className="text-sm sm:text-base">New Project</span>
              </Button>
            </div>
          </div>
        </div>


        {/* Search and Filter Section */}
        <div className="mb-4 sm:mb-6">
          {/* Search Bar */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <Filter className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          {/* Advanced Filter Dropdown */}
          {isAdvancedFilterOpen && (
            <div ref={advancedFilterRef} className="mb-4 p-4 bg-white border border-gray-200 rounded-xl shadow-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="planning">Planning</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Applied Advanced Filters */}
          {Object.keys(advancedFilters).length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {Object.entries(advancedFilters).map(([key, value]) => (
                <div key={key} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  <span className="mr-2">{key}: {value}</span>
                  <button
                    onClick={() => removeAdvancedFilter(key)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={clearAllAdvancedFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {predefinedFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActivePredefinedFilter(filter.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activePredefinedFilter === filter.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.count} {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        {viewMode === 'list' ? (
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <div key={project.id} className="relative p-3 sm:p-4 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors min-h-[120px] sm:min-h-[140px] flex flex-col sm:flex-row sm:items-center cursor-pointer" onClick={() => handleProjectClick(project)}>
                {/* Action Buttons - Top Right Corner */}
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col items-end space-y-2 z-20">
                  <div className="flex items-center space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      title="Edit Project"
                      className="p-1.5 h-7 w-7 sm:p-2 sm:h-9 sm:w-9"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProject(project);
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
                </div>

                {/* Project Info */}
                <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0 pr-20 sm:pr-24">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                    {project.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base leading-tight line-clamp-1">{project.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-1 sm:line-clamp-2">{project.description}</p>
                    
                    {/* Status and Priority - Mobile: Stacked, Desktop: Side by side */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-2">
                      <Badge variant={statusColors[project.status as keyof typeof statusColors] as any} size="sm" className="text-xs">
                        {getStatusIcon(project.status)}
                        <span className="ml-1 text-xs capitalize">{project.status || 'Unknown'}</span>
                      </Badge>
                      <Badge variant={priorityColors[project.priority as keyof typeof priorityColors] as any} size="sm" className="text-xs">
                        {getPriorityIcon(project.priority)}
                        <span className="ml-1 text-xs">{project.priority} priority</span>
                      </Badge>
                    </div>
                    
                    {/* Progress and Team - Mobile: Stacked, Desktop: Side by side */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="text-xs text-gray-500">Progress: {project.progress}%</div>
                        <div className="w-16 sm:w-20 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="h-1.5 bg-blue-500 rounded-full"
                            style={{ width: `${project.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users size={12} className="text-gray-500" />
                        <span className="text-xs text-gray-500">
                          {getTeamCount(project.team)} team(s)
                          {Array.isArray(project.team) && project.team.length > 0 && (
                            <span className="ml-1">
                              ({project.team.slice(0, 2).join(', ')}{project.team.length > 2 ? '...' : ''})
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} hover className="relative cursor-pointer" onClick={() => handleProjectClick(project)}>
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-3">
                    {/* Header with Project Icon and Title */}
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                        {(project.name || project.title || 'P').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-xs sm:text-sm leading-tight line-clamp-2">{project.name || project.title || 'Untitled Project'}</h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-1 hidden sm:block">{project.description || 'No description'}</p>
                      </div>
                    </div>

                    {/* Product Owner & Scrum Master */}
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 text-xs">
                      {project.productOwner && (
                        <div className="flex items-center text-gray-600">
                          <Crown className="w-3 h-3 mr-1" />
                          <span className="truncate">PO: {project.productOwner}</span>
                        </div>
                      )}
                      {project.scrumMaster && (
                        <div className="flex items-center text-gray-600">
                          <User className="w-3 h-3 mr-1" />
                          <span className="truncate">SM: {project.scrumMaster}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Status and Priority Badges - Stacked on mobile */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <Badge variant={statusColors[project.status as keyof typeof statusColors] as any} size="sm" className="text-xs">
                        {getStatusIcon(project.status)}
                        <span className="ml-1 text-xs capitalize">{project.status || 'Unknown'}</span>
                      </Badge>
                      <div className="hidden sm:block">
                        <Badge variant={priorityColors[project.priority as keyof typeof priorityColors] as any} size="sm" className="text-xs">
                          {getPriorityIcon(project.priority)}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Progress - Minimal on mobile */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Target size={8} className="sm:w-3 sm:h-3" />
                        <span className="text-xs">{project.progress || 0}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <Users size={8} className="sm:w-3 sm:h-3" />
                          <span className="text-xs">{getTeamCount(project.team)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Assignee */}
                    {project.assignee && (
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <Avatar name={project.assignee} size="sm" />
                        <span className="text-xs text-gray-500 hidden sm:inline">{project.assignee}</span>
                      </div>
                    )}
                    
                    {/* Timeline - Minimal on mobile */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-xs">
                        <Calendar size={8} className="sm:w-3 sm:h-3" />
                        <span className="text-xs">{new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs">
                        <Clock size={8} className="sm:w-3 sm:h-3" />
                        <span className="text-xs">{new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading projects...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-6">
              {projects.length === 0 
                ? 'No projects available. Create your first project to get started.' 
                : 'Try adjusting your search or filter criteria'}
            </p>
            <Button onClick={handleCreateProject}>Create New Project</Button>
          </div>
        )}

      </div>

      {/* Project Preview - Slides up from bottom */}
      {isProjectPreviewOpen && selectedProject && (
        <div className={`fixed inset-0 z-50 flex items-end transition-opacity duration-300 ${
          isPreviewAnimating ? 'bg-opacity-0' : 'bg-opacity-30'
        }`}>
          <div 
            ref={projectPreviewRef}
            className={`transform transition-all duration-300 ease-out ${
              isPreviewAnimating ? 'translate-y-full' : 'translate-y-0'
            } ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}
            style={{ 
              width: `calc(100% - ${isCollapsed ? '4rem' : '16rem'})`,
              height: '80vh',
              boxShadow: '0 -10px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div 
              className="bg-white rounded-t-2xl shadow-2xl overflow-y-auto"
              style={{ 
                height: '80vh',
                boxShadow: '0 -10px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                backgroundColor: 'white'
              }}
            >
              <div className="p-6">
                {/* Project Preview Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FolderKanban className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedProject.name || selectedProject.title || 'Untitled Project'}</h2>
                      <p className="text-gray-500 text-sm">Project Details</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={closeProjectPreview}
                      className="px-4 py-2"
                    >
                      Close
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleEditProject(selectedProject)}
                      className="px-4 py-2"
                    >
                      Edit Project
                    </Button>
                  </div>
                </div>

                {/* Project Details */}
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Description</label>
                        <p className="text-gray-600">{selectedProject.description || 'No description available'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Status</label>
                        <Badge variant={statusColors[selectedProject.status as keyof typeof statusColors] as any} size="md">
                          {getStatusIcon(selectedProject.status)}
                          <span className="ml-2 capitalize">{selectedProject.status || 'Unknown'}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Progress and Priority */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Progress</label>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>{getTasksArray(selectedProject.tasks).length} task(s)</span>
                            <span>{selectedProject.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="h-3 bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${selectedProject.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Priority</label>
                        <Badge variant={priorityColors[selectedProject.priority as keyof typeof priorityColors] as any} size="md">
                          {getPriorityIcon(selectedProject.priority)}
                          <span className="ml-2">{selectedProject.priority} priority</span>
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Start Date</label>
                        <p className="text-gray-600">{new Date(selectedProject.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">End Date</label>
                        <p className="text-gray-600">{new Date(selectedProject.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Team and Assignment */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Team(s)</label>
                        <p className="text-gray-600">
                          {Array.isArray(selectedProject.team) 
                            ? selectedProject.team.join(', ') 
                            : selectedProject.team || 'No team assigned'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Assignee</label>
                        <p className="text-gray-600">{selectedProject.assignee || 'Not assigned'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Budget and Additional Info */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Budget</label>
                        <p className="text-gray-600">${selectedProject.budget || '0'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Company</label>
                        <p className="text-gray-600">{selectedProject.company || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tasks and Tags */}
                  {(selectedProject.tasks || selectedProject.tags) && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {selectedProject.tasks && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">Tasks</label>
                            <p className="text-gray-600">
                              {getTasksArray(selectedProject.tasks).length} task(s)
                            </p>
                          </div>
                        )}
                        {selectedProject.tags && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">Tags</label>
                            <div className="flex flex-wrap gap-2">
                              {getTagsArray(selectedProject.tags).map((tag: string, index: number) => (
                                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedProject.notes && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Notes</label>
                      <p className="text-gray-600 whitespace-pre-wrap">{selectedProject.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Form Modal */}
      <ProjectForm
        project={editingProject}
        onSubmit={handleProjectFormSubmit}
        onCancel={handleProjectFormCancel}
        isOpen={isProjectFormOpen}
        isCollapsed={isCollapsed}
      />
    </AppLayout>
  );
};

export default ProjectsPage;
