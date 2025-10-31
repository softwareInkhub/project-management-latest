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
  ArrowUp,
  ArrowDown,
  Target,
  Search,
  Filter,
  Crown,
  User,
  X,
  Flag,
  Building2
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
import { useAuth } from '../hooks/useAuth';
import ProjectForm, { Project } from '../components/ui/ProjectForm';
import ProjectInlineAdvancedFilters from '../components/ui/ProjectInlineAdvancedFilters';

// Advanced Filter Interfaces
interface DateRange {
  from: string;
  to: string;
}

interface NumberRange {
  min: number;
  max: number;
}

interface ProjectAdvancedFilters {
  projectScope: string[];
  status: string[];
  priority: string[];
  assignee: string[];
  company: string[];
  tags: string[];
  startDateRange: DateRange;
  endDateRange: DateRange;
  progressRange: NumberRange;
  teamSizeRange: NumberRange;
  additionalFilters: string[];
}

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
  
  // Advanced Filter State
  const [projectAdvancedFilters, setProjectAdvancedFilters] = useState<ProjectAdvancedFilters>({
    projectScope: [],
    status: [],
    priority: [],
    assignee: [],
    company: [],
    tags: [],
    startDateRange: { from: '', to: '' },
    endDateRange: { from: '', to: '' },
    progressRange: { min: 0, max: 100 },
    teamSizeRange: { min: 0, max: 50 },
    additionalFilters: []
  });
  const [isAdvancedFilterModalOpen, setIsAdvancedFilterModalOpen] = useState(false);
  const [visibleFilterColumns, setVisibleFilterColumns] = useState<string[]>([
    'projectScope', 'status', 'priority', 'dateRange'
  ]);

  // Available filter columns with icons
  const availableFilterColumns = [
    { key: 'projectScope', label: 'Project Scope', icon: <FolderKanban className="w-4 h-4" /> },
    { key: 'status', label: 'Status', icon: <CheckCircle className="w-4 h-4" /> },
    { key: 'priority', label: 'Priority', icon: <Flag className="w-4 h-4" /> },
    { key: 'company', label: 'Company', icon: <Building2 className="w-4 h-4" /> },
    { key: 'dateRange', label: 'Date Range', icon: <Calendar className="w-4 h-4" /> },
    { key: 'additionalFilters', label: 'Additional', icon: <Filter className="w-4 h-4" /> }
  ];

  const projectPreviewRef = useRef<HTMLDivElement>(null);
  const advancedFilterRef = useRef<HTMLDivElement>(null);
  const { openTab } = useTabs();
  const { isCollapsed } = useSidebar();
  const { user } = useAuth();

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


  const filteredProjects = projects.filter(project => {
    const matchesSearch = (project.name || project.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
    
    // Apply predefined filters
    let matchesPredefined = true;
    if (activePredefinedFilter === 'my-projects') {
      // Check if current user is assigned to this project
      const currentUserEmail = user?.email;
      const currentUserName = user?.name;
      const currentUserId = user?.userId;
      
      matchesPredefined = project.assignee === currentUserEmail ||
                        project.assignee === currentUserName ||
                        project.assignee === currentUserId ||
                        project.assignee?.includes(currentUserEmail) ||
                        project.assignee?.includes(currentUserName) ||
                        project.assignee?.includes(currentUserId);
    } else if (activePredefinedFilter !== 'all') {
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

    // Apply project advanced filters
    let matchesProjectAdvanced = true;
    
    // Project scope filters
    if (projectAdvancedFilters.projectScope.length > 0) {
      const currentUserEmail = user?.email;
      const currentUserName = user?.name;
      const currentUserId = user?.userId;
      
      const isMyProject = project.assignee === currentUserEmail ||
                         project.assignee === currentUserName ||
                         project.assignee === currentUserId ||
                         project.assignee?.includes(currentUserEmail) ||
                         project.assignee?.includes(currentUserName) ||
                         project.assignee?.includes(currentUserId);
      
      if (projectAdvancedFilters.projectScope.includes('my-projects') && !isMyProject) {
        matchesProjectAdvanced = false;
      }
      if (projectAdvancedFilters.projectScope.includes('all-projects') && !projectAdvancedFilters.projectScope.includes('my-projects')) {
        // This is handled by the main filter logic
      }
    }
    
    // Status filters
    if (projectAdvancedFilters.status.length > 0 && !projectAdvancedFilters.status.includes(project.status)) {
      matchesProjectAdvanced = false;
    }
    
    // Priority filters
    if (projectAdvancedFilters.priority.length > 0 && !projectAdvancedFilters.priority.includes(project.priority)) {
      matchesProjectAdvanced = false;
    }
    
    
    // Company filters
    if (projectAdvancedFilters.company.length > 0 && !projectAdvancedFilters.company.includes(project.company)) {
      matchesProjectAdvanced = false;
    }
    
    
    // Date range filters - check if project dates fall within the specified range
    if (projectAdvancedFilters.startDateRange.from || projectAdvancedFilters.startDateRange.to) {
      const projectStartDate = new Date(project.startDate);
      const projectEndDate = new Date(project.endDate);
      const filterFromDate = projectAdvancedFilters.startDateRange.from ? new Date(projectAdvancedFilters.startDateRange.from) : null;
      const filterToDate = projectAdvancedFilters.startDateRange.to ? new Date(projectAdvancedFilters.startDateRange.to) : null;
      
      // Check if project overlaps with the date range
      if (filterFromDate && projectEndDate < filterFromDate) {
        matchesProjectAdvanced = false;
      }
      if (filterToDate && projectStartDate > filterToDate) {
        matchesProjectAdvanced = false;
      }
    }
    
    
    // Additional filters
    if (projectAdvancedFilters.additionalFilters.includes('hasTasks') && getTasksArray(project.tasks).length === 0) {
      matchesProjectAdvanced = false;
    }
    if (projectAdvancedFilters.additionalFilters.includes('overdue') && new Date(project.endDate) < new Date() && project.status !== 'Completed') {
      matchesProjectAdvanced = false;
    }
    
    return matchesSearch && matchesStatus && matchesPriority && matchesPredefined && matchesAdvanced && matchesProjectAdvanced;
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

  // Advanced filter handlers for project-specific filters
  const handleProjectAdvancedFilterChange = (key: string, value: string | string[]) => {
    setProjectAdvancedFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleInlineAdvancedFiltersChange = (filters: ProjectAdvancedFilters) => {
    setProjectAdvancedFilters(filters);
  };

  const handleClearInlineAdvancedFilters = () => {
    setProjectAdvancedFilters({
      projectScope: [],
      status: [],
      priority: [],
      assignee: [],
      company: [],
      tags: [],
      startDateRange: { from: '', to: '' },
      endDateRange: { from: '', to: '' },
      progressRange: { min: 0, max: 100 },
      teamSizeRange: { min: 0, max: 50 },
      additionalFilters: []
    });
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

  // Handle New Project button click from SearchFilterSection
  useEffect(() => {
    const handleNewProjectClick = () => {
      handleCreateProject();
    };

    window.addEventListener('newProjectClick', handleNewProjectClick);
    
    return () => {
      window.removeEventListener('newProjectClick', handleNewProjectClick);
    };
  }, []);

  return (
    <AppLayout>
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 overflow-x-hidden">


        {/* Filters and Search */}
        <SearchFilterSection
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search projects..."
          filters={[]}
          variant="modern"
          showActiveFilters={true}
          onAdvancedFilterChange={handleAdvancedFilterChange}
          onApplyAdvancedFilters={() => {}}
          onClearAdvancedFilters={clearAllAdvancedFilters}
          advancedFilters={advancedFilters}
          onOpenAdvancedFilterModal={() => setIsAdvancedFilterModalOpen(true)}
          showInlineAdvancedFilters={true}
          onInlineAdvancedFiltersChange={handleInlineAdvancedFiltersChange}
          onClearInlineAdvancedFilters={handleClearInlineAdvancedFilters}
          inlineAdvancedFilters={projectAdvancedFilters}
          projects={projects}
          users={[]}
          teams={[]}
          currentUser={user}
          customInlineFilterComponent={ProjectInlineAdvancedFilters}
          availableFilterColumns={availableFilterColumns}
          visibleFilterColumns={visibleFilterColumns}
          onFilterColumnsChange={setVisibleFilterColumns}
          viewToggle={{
            currentView: viewMode,
            views: [
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
            ],
            onChange: (view: 'list' | 'card') => setViewMode(view)
          }}
        />

        {/* Projects Grid */}
        {viewMode === 'list' ? (
          <div className="space-y-2">
            {filteredProjects.map((project) => (
              <div key={project.id} className="relative p-2 sm:p-3 bg-white rounded-3xl border border-gray-300 hover:border-gray-400 transition-colors min-h-[100px] sm:min-h-[120px] flex flex-col sm:flex-row sm:items-center cursor-pointer shadow-sm" onClick={() => handleProjectClick(project)}>
                {/* Action Buttons - Top Right Corner */}
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col items-end space-y-2 z-20">
                  <div className="flex items-center space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      title="Edit Project"
                      className="p-2 h-9 w-9 sm:p-2 sm:h-10 sm:w-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProject(project);
                      }}
                    >
                      <Edit size={18} className="sm:w-[20px] sm:h-[20px]" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      title="More Options"
                      className="p-2 h-9 w-9 sm:p-2 sm:h-10 sm:w-10"
                    >
                      <MoreVertical size={18} className="sm:w-[20px] sm:h-[20px]" />
                    </Button>
                  </div>
                </div>

                {/* Project Info */}
                <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0 pr-16 sm:pr-20">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                    {project.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base leading-tight line-clamp-1">{project.name}</h4>
                    <p className="text-xs sm:text-xs text-gray-600 mt-1 line-clamp-1 sm:line-clamp-2">{project.description}</p>
                    
                    {/* Mobile layout: two rows with ends aligned */}
                    <div className="flex flex-col lg:hidden gap-2 mt-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={statusColors[project.status as keyof typeof statusColors] as any} size="sm" className="text-xs">
                          {getStatusIcon(project.status)}
                          <span className="ml-1 text-xs capitalize">{project.status || 'Unknown'}</span>
                        </Badge>
                        <Badge variant={priorityColors[project.priority as keyof typeof priorityColors] as any} size="sm" className="text-xs">
                          {getPriorityIcon(project.priority)}
                          <span className="ml-1 text-xs">{project.priority} priority</span>
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-500">Progress: {project.progress}%</div>
                          <div className="w-20 bg-gray-200 rounded-full h-1.5">
                            <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${project.progress || 0}%` }}></div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User size={12} className="text-gray-500" />
                          <span className="text-xs text-gray-500">{getTeamCount(project.team)} team(s)</span>
                        </div>
                      </div>
                    </div>

                    {/* Desktop layout: single row */}
                    <div className="hidden lg:flex lg:flex-row lg:items-center gap-2 lg:gap-4 mt-2">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Badge variant={statusColors[project.status as keyof typeof statusColors] as any} size="sm" className="text-xs">
                          {getStatusIcon(project.status)}
                          <span className="ml-1 text-xs capitalize">{project.status || 'Unknown'}</span>
                        </Badge>
                        <Badge variant={priorityColors[project.priority as keyof typeof priorityColors] as any} size="sm" className="text-xs">
                          {getPriorityIcon(project.priority)}
                          <span className="ml-1 text-xs">{project.priority} priority</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 lg:ml-2">
                        <div className="text-xs text-gray-500">Progress: {project.progress}%</div>
                        <div className="w-14 sm:w-20 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="h-1.5 bg-blue-500 rounded-full"
                            style={{ width: `${project.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 lg:ml-2">
                        <User size={12} className="text-gray-500" />
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-3">
            {filteredProjects.map((project) => (
              <Card key={project.id} hover className="relative cursor-pointer rounded-3xl border border-gray-300 hover:border-gray-400" onClick={() => handleProjectClick(project)}>
                <CardContent className="px-1 py-1 sm:px-2 sm:py-1 lg:px-2 lg:py-0">
                  <div className="space-y-1 sm:space-y-2 lg:space-y-1.5">
                    {/* Header with Project Icon and Title and Assignee aligned */}
                    <div className="flex items-center justify-between px-1 sm:px-0">
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-1 min-w-0 mr-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {(project.name || project.title || 'P').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-xs sm:text-sm leading-tight truncate whitespace-nowrap">{project.name || project.title || 'Untitled Project'}</h4>
                          <p className="text-xs text-gray-600 mt-1 hidden sm:block truncate whitespace-nowrap overflow-hidden">{project.description || 'No description'}</p>
                        </div>
                      </div>
                      {project.assignee && (
                        <div className="ml-2 mr-1 flex-shrink-0 self-center">
                          <Avatar name={project.assignee} size="sm" />
                        </div>
                      )}
                    </div>

                    {/* Product Owner & Scrum Master */}
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 text-xs lg:text-[11px]">
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
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 lg:gap-1.5">
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
                    <div className="flex items-center justify-between text-xs lg:text-[11px] text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Target size={8} className="sm:w-3 sm:h-3" />
                        <span className="text-xs">{project.progress || 0}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <User size={8} className="sm:w-3 sm:h-3" />
                          <span className="text-xs">{getTeamCount(project.team)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Assignee */}
                    {/* Assignee avatar moved to top-right corner */}
                    
                    {/* Timeline - Minimal on mobile */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-xs lg:text-[11px]">
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

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-25 right-4 z-40 lg:hidden">
        <button
          onClick={handleCreateProject}
          className="w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus size={36} className="text-white" />
        </button>
      </div>

      {/* Project Preview - Mobile: slides up from bottom, Desktop: centered modal */}
      {isProjectPreviewOpen && selectedProject && (
        <div className={`fixed inset-0 z-50 flex items-end lg:items-center justify-center transition-opacity duration-300 ${
          isPreviewAnimating ? 'bg-opacity-0' : 'bg-black/70 bg-opacity-50'
        }`} style={{ backdropFilter: 'blur(2px)' }}>
          <div 
            ref={projectPreviewRef}
            className={`transform transition-all duration-300 ease-out w-full lg:w-auto lg:max-w-2xl ${
              isPreviewAnimating ? 'translate-y-full lg:translate-y-0 lg:scale-95' : 'translate-y-0 lg:scale-100'
            }`}
            style={{ 
              width: '100%',
              maxHeight: '85vh',
              boxShadow: '0 -10px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div 
              className="bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl overflow-y-auto"
              style={{ 
                maxHeight: '85vh',
                boxShadow: '0 -10px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                backgroundColor: 'white'
              }}
            >
              <div className="p-4 lg:p-6 pb-24 lg:pb-6">
                {/* Project Preview Header */}
                <div className="flex items-center justify-between mb-4 lg:mb-6">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={closeProjectPreview}
                      className="w-10 h-10 bg-gray-100 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                      <FolderKanban className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedProject.name || selectedProject.title || 'Untitled Project'}</h2>
                      <p className="text-gray-500 text-sm">Project Details</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEditProject(selectedProject)}
                    className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Edit className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Project Details - Single Card */}
                <div className="bg-white rounded-2xl border border-gray-300 p-4 lg:p-6 shadow-sm">
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Description</label>
                      <p className="text-gray-600">{selectedProject.description || 'No description available'}</p>
                    </div>

                    {/* Status, Priority, Progress */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Status</label>
                        <Badge variant={statusColors[selectedProject.status as keyof typeof statusColors] as any} size="md">
                          {getStatusIcon(selectedProject.status)}
                          <span className="ml-2 capitalize">{selectedProject.status || 'Unknown'}</span>
                        </Badge>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Priority</label>
                        <Badge variant={priorityColors[selectedProject.priority as keyof typeof priorityColors] as any} size="md">
                          {getPriorityIcon(selectedProject.priority)}
                          <span className="ml-2">{selectedProject.priority} priority</span>
                        </Badge>
                      </div>
                      <div className="col-span-2 sm:col-span-1 hidden sm:block">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Progress</label>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>{getTasksArray(selectedProject.tasks).length} task(s)</span>
                            <span>{selectedProject.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-300 rounded-full h-3">
                            <div 
                              className="h-3 bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${selectedProject.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Start Date & End Date */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Start Date</label>
                        <p className="text-gray-600">{new Date(selectedProject.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">End Date</label>
                        <p className="text-gray-600">{new Date(selectedProject.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Company + Progress on same line (mobile), Assignee below */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                      {/* Company */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Company</label>
                        <p className="text-gray-600">{selectedProject.company || 'N/A'}</p>
                      </div>
                      {/* Progress shown next to Company on mobile only */}
                      <div className="sm:hidden">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Progress</label>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>{getTasksArray(selectedProject.tasks).length} task(s)</span>
                            <span>{selectedProject.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-300 rounded-full h-3">
                            <div 
                              className="h-3 bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${selectedProject.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      {/* Assignee full width below on mobile */}
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Assignee</label>
                        <p className="text-gray-600">{selectedProject.assignee || 'Not assigned'}</p>
                      </div>
                    </div>

                    {/* Tasks and Tags */}
                    {(selectedProject.tasks || selectedProject.tags) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    )}

                    {/* Notes */}
                    {selectedProject.notes && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Notes</label>
                        <p className="text-gray-600 whitespace-pre-wrap">{selectedProject.notes}</p>
                      </div>
                    )}
                  </div>
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
