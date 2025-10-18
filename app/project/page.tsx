'use client';
import React, { useState, useRef, useEffect } from 'react';
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
  Filter
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

// Mock data for projects
const projects = [
  {
    id: 1,
    name: 'Website Redesign',
    description: 'Complete overhaul of the company website with modern design and improved UX',
    status: 'active',
    progress: 75,
    startDate: '2024-01-15',
    endDate: '2024-03-30',
    team: [
      { name: 'Sarah Johnson', role: 'Designer' },
      { name: 'Mike Chen', role: 'Developer' },
      { name: 'Emily Davis', role: 'PM' }
    ],
    tasks: { completed: 15, total: 20 },
    priority: 'high',
    color: 'blue'
  },
  {
    id: 2,
    name: 'Mobile App Development',
    description: 'Building a cross-platform mobile application for iOS and Android',
    status: 'active',
    progress: 45,
    startDate: '2024-02-01',
    endDate: '2024-05-15',
    team: [
      { name: 'Alex Rodriguez', role: 'Mobile Dev' },
      { name: 'Lisa Wang', role: 'UI/UX' },
      { name: 'David Kim', role: 'Backend' }
    ],
    tasks: { completed: 9, total: 20 },
    priority: 'high',
    color: 'green'
  },
  {
    id: 3,
    name: 'API Integration',
    description: 'Integrating third-party APIs and building internal API services',
    status: 'paused',
    progress: 30,
    startDate: '2024-01-20',
    endDate: '2024-04-10',
    team: [
      { name: 'Tom Wilson', role: 'Backend Dev' },
      { name: 'Anna Smith', role: 'DevOps' }
    ],
    tasks: { completed: 6, total: 20 },
    priority: 'medium',
    color: 'yellow'
  },
  {
    id: 4,
    name: 'User Research Study',
    description: 'Conducting comprehensive user research to improve product decisions',
    status: 'completed',
    progress: 100,
    startDate: '2024-01-01',
    endDate: '2024-02-15',
    team: [
      { name: 'Rachel Green', role: 'Researcher' },
      { name: 'John Doe', role: 'Analyst' }
    ],
    tasks: { completed: 12, total: 12 },
    priority: 'medium',
    color: 'purple'
  },
  {
    id: 5,
    name: 'Database Migration',
    description: 'Migrating legacy database to modern cloud infrastructure',
    status: 'planning',
    progress: 10,
    startDate: '2024-03-01',
    endDate: '2024-06-30',
    team: [
      { name: 'Maria Garcia', role: 'DBA' },
      { name: 'Kevin Lee', role: 'DevOps' }
    ],
    tasks: { completed: 2, total: 20 },
    priority: 'low',
    color: 'orange'
  },
  {
    id: 6,
    name: 'Marketing Campaign',
    description: 'Launching a comprehensive marketing campaign for Q2 product release',
    status: 'active',
    progress: 60,
    startDate: '2024-02-15',
    endDate: '2024-04-30',
    team: [
      { name: 'Jennifer Brown', role: 'Marketing' },
      { name: 'Chris Taylor', role: 'Content' }
    ],
    tasks: { completed: 12, total: 20 },
    priority: 'high',
    color: 'pink'
  }
];

const statusColors = {
  active: 'success',
  paused: 'warning',
  completed: 'info',
  planning: 'default'
};

const priorityColors = {
  high: 'danger',
  medium: 'warning',
  low: 'default'
};

const ProjectsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isProjectPreviewOpen, setIsProjectPreviewOpen] = useState(false);
  const [isPreviewAnimating, setIsPreviewAnimating] = useState(false);
  const [activePredefinedFilter, setActivePredefinedFilter] = useState('all');
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, string | string[]>>({});
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const projectPreviewRef = useRef<HTMLDivElement>(null);
  const advancedFilterRef = useRef<HTMLDivElement>(null);
  const { openTab } = useTabs();
  const { isCollapsed } = useSidebar();

  // Predefined filters
  const predefinedFilters = [
    { id: 'all', label: 'All Projects', count: projects.length },
    { id: 'active', label: 'Active', count: projects.filter(p => p.status === 'active').length },
    { id: 'completed', label: 'Completed', count: projects.filter(p => p.status === 'completed').length },
    { id: 'paused', label: 'Paused', count: projects.filter(p => p.status === 'paused').length },
    { id: 'planning', label: 'Planning', count: projects.filter(p => p.status === 'planning').length }
  ];

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
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
        if (key === 'department' && project.team.some((t: any) => t.department === value)) matchesAdvanced = false;
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
    setSelectedProject(project);
    setIsProjectPreviewOpen(false);
    // TODO: Open edit form
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
              <Button className="flex items-center justify-center space-x-2 w-full sm:w-auto">
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
                        <span className="ml-1 text-xs capitalize">{project.status}</span>
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
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users size={12} className="text-gray-500" />
                        <span className="text-xs text-gray-500">{project.team.length} members</span>
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
                        {project.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-xs sm:text-sm leading-tight line-clamp-2">{project.name}</h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-1 hidden sm:block">{project.description}</p>
                      </div>
                    </div>
                    
                    {/* Status and Priority Badges - Stacked on mobile */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <Badge variant={statusColors[project.status as keyof typeof statusColors] as any} size="sm" className="text-xs">
                        {getStatusIcon(project.status)}
                        <span className="ml-1 text-xs capitalize">{project.status}</span>
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
                        <span className="text-xs">{project.progress}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <Users size={8} className="sm:w-3 sm:h-3" />
                          <span className="text-xs">{project.team.length}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Team - Show only first member on mobile */}
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Avatar name={project.team[0]?.name || 'Unknown'} size="sm" />
                      <span className="text-xs text-gray-500 hidden sm:inline">{project.team[0]?.name || 'Unknown'}</span>
                    </div>
                    
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

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
            <Button>Create New Project</Button>
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
                      <h2 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h2>
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
                        <p className="text-gray-600">{selectedProject.description}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Status</label>
                        <Badge variant={statusColors[selectedProject.status as keyof typeof statusColors] as any} size="md">
                          {getStatusIcon(selectedProject.status)}
                          <span className="ml-2 capitalize">{selectedProject.status}</span>
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
                            <span>{selectedProject.tasks.completed} of {selectedProject.tasks.total} tasks</span>
                            <span>{selectedProject.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="h-3 bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${selectedProject.progress}%` }}
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

                  {/* Team */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Team Members ({selectedProject.team.length})</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {selectedProject.team.map((member: any, index: number) => (
                            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                              <Avatar name={member.name} size="md" />
                              <div>
                                <p className="font-medium text-gray-900">{member.name}</p>
                                <p className="text-sm text-gray-600">{member.role}</p>
                              </div>
                            </div>
                          ))}
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

export default ProjectsPage;
