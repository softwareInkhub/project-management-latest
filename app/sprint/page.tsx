'use client';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  MoreVertical, 
  Calendar, 
  Users,
  Clock,
  CheckCircle,
  Circle,
  AlertCircle,
  Flag,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  FolderOpen,
  BarChart3,
  Tag,
  ChevronDown,
  Target,
  TrendingUp,
  Activity,
  Play,
  Pause,
  RefreshCw,
  Grid3x3,
  List,
  CheckSquare,
  FileCode,
  Zap
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatsCard } from '../components/ui/StatsCard';
import { SearchFilterSection } from '../components/ui/SearchFilterSection';
import { ViewToggle } from '../components/ui/ViewToggle';
import { AppLayout } from '../components/AppLayout';
import { AdvancedFilterModal } from '../components/ui/AdvancedFilterModal';
import { useTabs } from '../hooks/useTabs';
import { useAuth } from '../hooks/useAuth';
import { apiService, Sprint, Project, Team, Story } from '../services/api';
import { CreateButton, UpdateButton, DeleteButton, ReadOnlyBadge, usePermissions } from '../components/RoleBasedUI';

// Advanced Filter Interfaces
interface DateRange {
  from: string;
  to: string;
}

interface AdvancedFilters {
  status: string[];
  project: string[];
  team: string[];
  dueDateRange: DateRange;
  velocityRange: { min: number; max: number };
  additionalFilters: string[];
}

// Helper functions
const formatShort = (dateString: string) => {
  if (!dateString) return 'No date';
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
};

const isOverdue = (dateString: string, status: string) => {
  if (!dateString || status === 'completed') return false;
  const date = new Date(dateString);
  return date < new Date() && date.toDateString() !== new Date().toDateString();
};

const statusConfig = {
  'planned': { label: 'Planned', color: 'default', icon: Clock },
  'Planned': { label: 'Planned', color: 'default', icon: Clock },
  'active': { label: 'Active', color: 'info', icon: Play },
  'Active': { label: 'Active', color: 'info', icon: Play },
  'completed': { label: 'Completed', color: 'success', icon: CheckCircle },
  'Completed': { label: 'Completed', color: 'success', icon: CheckCircle }
};

const getStatusConfig = (status: string) => {
  return statusConfig[status as keyof typeof statusConfig] || {
    label: status || 'Unknown',
    color: 'default',
    icon: Circle
  };
};

const SprintPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [activePredefinedFilter, setActivePredefinedFilter] = useState('all');
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, string | string[]>>({});
  
  // Advanced Filter State
  const [advancedFilterState, setAdvancedFilterState] = useState<AdvancedFilters>({
    status: [],
    project: [],
    team: [],
    dueDateRange: { from: '', to: '' },
    velocityRange: { min: 0, max: 1000 },
    additionalFilters: []
  });
  const [isAdvancedFilterModalOpen, setIsAdvancedFilterModalOpen] = useState(false);
  const [visibleFilterColumns, setVisibleFilterColumns] = useState<string[]>([
    'status', 'project', 'team'
  ]);

  // Quick Filter State
  const [quickFilterValues, setQuickFilterValues] = useState<Record<string, string | string[] | { from: string; to: string }>>({
    status: [],
    project: [],
    team: [],
    dueDateRange: 'all',
    additionalFilters: []
  });

  // Available filter columns
  const availableFilterColumns = [
    { key: 'status', label: 'Sprint Status', icon: <CheckCircle className="w-4 h-4 text-blue-500" /> },
    { key: 'project', label: 'Project', icon: <FolderOpen className="w-4 h-4 text-orange-500" /> },
    { key: 'team', label: 'Team', icon: <Users className="w-4 h-4 text-purple-500" /> },
    { key: 'dueDateRange', label: 'Date Range', icon: <Calendar className="w-4 h-4 text-blue-500" /> },
    { key: 'additionalFilters', label: 'Additional Filters', icon: <Filter className="w-4 h-4 text-green-500" /> }
  ];

  // Handler for quick filter changes
  const handleQuickFilterChange = (key: string, value: string | string[] | { from: string; to: string }) => {
    setQuickFilterValues(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const [isSprintFormOpen, setIsSprintFormOpen] = useState(false);
  const [isFormAnimating, setIsFormAnimating] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [isSprintPreviewOpen, setIsSprintPreviewOpen] = useState(false);
  const [isPreviewAnimating, setIsPreviewAnimating] = useState(false);
  const [isJsonViewActive, setIsJsonViewActive] = useState(false);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuSprintId, setOpenMenuSprintId] = useState<string | null>(null);
  const sprintPreviewRef = useRef<HTMLDivElement>(null);

  // RBAC permissions
  const { canCreate, canUpdate, canDelete } = usePermissions();

  // Sprint Form state
  const [sprintForm, setSprintForm] = useState({
    name: '',
    goal: '',
    start_date: new Date().toISOString().split('T')[0],
    duration_weeks: 2,
    status: 'planned' as 'planned' | 'active' | 'completed',
    project_id: '',
    team_id: '',
    velocity: 0,
    retrospective_notes: ''
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Close dropdown menu
      if (!target.closest('[data-dropdown-menu]') && !target.closest('button')) {
        setOpenMenuSprintId(null);
      }
      
      // Close sprint preview
      if (sprintPreviewRef.current && !sprintPreviewRef.current.contains(target) && isSprintPreviewOpen) {
        closeSprintPreview();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSprintPreviewOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sprintsRes, projectsRes, teamsRes, storiesRes] = await Promise.all([
        apiService.getSprints(),
        apiService.getProjects(),
        apiService.getTeams(),
        apiService.getStories()
      ]);
      
      setSprints(sprintsRes.data || []);
      setProjects(projectsRes.data || []);
      setTeams(teamsRes.data || []);
      setStories(storiesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate sprint metrics
  // Get real stories for a sprint
  const getSprintStories = (sprintId: string): Story[] => {
    return stories.filter(story => story.sprint_id === sprintId);
  };

  // Get stories count for a sprint
  const getSprintStoriesCount = (sprintId: string): number => {
    return stories.filter(story => story.sprint_id === sprintId).length;
  };

  const getSprintMetrics = (sprint: Sprint) => {
    const startDate = new Date(sprint.start_date);
    const endDate = new Date(sprint.end_date);
    const now = new Date();
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    
    const progress = sprint.status === 'completed' ? 100 : 
                    sprint.status === 'active' ? 
                      Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 0;

    const durationWeeks = Math.ceil(totalDuration / (1000 * 60 * 60 * 24 * 7));
    const durationDays = Math.ceil(totalDuration / (1000 * 60 * 60 * 24));

    return {
      endDate,
      progress: Math.round(progress),
      daysRemaining: sprint.status === 'active' ? 
        Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0,
      durationWeeks,
      durationDays
    };
  };

  // Handle sprint form submit
  const handleSprintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Calculate end_date from start_date and duration_weeks
      const startDate = new Date(sprintForm.start_date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + (sprintForm.duration_weeks * 7));
      
      const sprintData = {
        ...sprintForm,
        end_date: endDate.toISOString().split('T')[0],
        created_by: user?.email || user?.username || 'unknown',
        stories: []
      };

      if (selectedSprint) {
        await apiService.updateSprint(selectedSprint.id, sprintData);
      } else {
        await apiService.createSprint(sprintData);
      }
      
      await loadData();
      closeSprintForm();
    } catch (error) {
      console.error('Error saving sprint:', error);
      alert('Failed to save sprint');
    }
  };

  const handleSprintClick = (sprint: Sprint) => {
    setSelectedSprint(sprint);
    setIsSprintPreviewOpen(true);
    setIsPreviewAnimating(false);
    setIsJsonViewActive(false);
  };

  const closeSprintPreview = () => {
    setIsPreviewAnimating(true);
    setTimeout(() => {
      setIsSprintPreviewOpen(false);
      setIsPreviewAnimating(false);
      setSelectedSprint(null);
      setIsJsonViewActive(false);
    }, 300);
  };

  const handleEditSprint = (sprint: Sprint) => {
    setSelectedSprint(sprint);
    
    // Calculate duration_weeks from start and end dates
    const startDate = new Date(sprint.start_date);
    const endDate = new Date(sprint.end_date);
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const durationWeeks = Math.ceil(durationDays / 7);
    
    setSprintForm({
      name: sprint.name,
      goal: sprint.goal,
      start_date: sprint.start_date.split('T')[0],
      duration_weeks: durationWeeks || 2,
      status: sprint.status,
      project_id: sprint.project_id,
      team_id: sprint.team_id,
      velocity: sprint.velocity || 0,
      retrospective_notes: sprint.retrospective_notes || ''
    });
    setIsSprintPreviewOpen(false);
    openSprintForm();
  };

  const handleDeleteSprint = async (sprintId: string) => {
    if (!window.confirm('Are you sure you want to delete this sprint?')) return;
    
    try {
      await apiService.deleteSprint(sprintId);
      await loadData();
      setOpenMenuSprintId(null);
    } catch (error) {
      console.error('Error deleting sprint:', error);
      alert('Failed to delete sprint');
    }
  };

  const openSprintForm = () => {
    setIsSprintFormOpen(true);
    setTimeout(() => setIsFormAnimating(true), 10);
  };

  const closeSprintForm = () => {
    setIsFormAnimating(false);
    setTimeout(() => {
      setIsSprintFormOpen(false);
      setSelectedSprint(null);
      setSprintForm({
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
    }, 300);
  };

  const handleCreateSprint = () => {
    setSelectedSprint(null);
    setSprintForm({
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
    openSprintForm();
  };

  // Filter sprints
  const filteredSprints = useMemo(() => {
    return sprints.filter(sprint => {
      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!sprint.name.toLowerCase().includes(term) &&
            !sprint.goal.toLowerCase().includes(term)) {
          return false;
        }
      }

      // Quick filter values
      const statusFilterValues = quickFilterValues.status as string[];
      if (Array.isArray(statusFilterValues) && statusFilterValues.length > 0) {
        if (!statusFilterValues.includes(sprint.status)) return false;
      }

      const projectFilterValues = quickFilterValues.project as string[];
      if (Array.isArray(projectFilterValues) && projectFilterValues.length > 0) {
        if (!projectFilterValues.includes(sprint.project_id)) return false;
      }

      const teamFilterValues = quickFilterValues.team as string[];
      if (Array.isArray(teamFilterValues) && teamFilterValues.length > 0) {
        if (!teamFilterValues.includes(sprint.team_id)) return false;
      }

      // Date range filter
      const dueDateRangeFilter = quickFilterValues.dueDateRange;
      if (dueDateRangeFilter && dueDateRangeFilter !== 'all') {
        const sprintStartDate = new Date(sprint.start_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (typeof dueDateRangeFilter === 'string') {
          switch (dueDateRangeFilter) {
            case 'today':
              const todayEnd = new Date(today);
              todayEnd.setHours(23, 59, 59, 999);
              if (sprintStartDate < today || sprintStartDate > todayEnd) return false;
              break;
            case 'thisWeek':
              const weekStart = new Date(today);
              weekStart.setDate(today.getDate() - today.getDay());
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekStart.getDate() + 6);
              weekEnd.setHours(23, 59, 59, 999);
              if (sprintStartDate < weekStart || sprintStartDate > weekEnd) return false;
              break;
            case 'thisMonth':
              const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
              const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
              monthEnd.setHours(23, 59, 59, 999);
              if (sprintStartDate < monthStart || sprintStartDate > monthEnd) return false;
              break;
            case 'next7Days':
              const next7Days = new Date(today);
              next7Days.setDate(today.getDate() + 7);
              next7Days.setHours(23, 59, 59, 999);
              if (sprintStartDate < today || sprintStartDate > next7Days) return false;
              break;
          }
        } else if (typeof dueDateRangeFilter === 'object' && !Array.isArray(dueDateRangeFilter)) {
          const dateRange = dueDateRangeFilter as { from: string; to: string };
          if (dateRange.from && sprintStartDate < new Date(dateRange.from)) return false;
          if (dateRange.to && sprintStartDate > new Date(dateRange.to)) return false;
        }
      }

      // Additional filters
      const additionalFilterValues = quickFilterValues.additionalFilters as string[];
      if (Array.isArray(additionalFilterValues) && additionalFilterValues.length > 0) {
        for (const filter of additionalFilterValues) {
          if (filter === 'high_velocity' && (!sprint.velocity || sprint.velocity < 50)) return false;
          if (filter === 'low_velocity' && sprint.velocity >= 50) return false;
          if (filter === 'has_retrospective' && !sprint.retrospective_notes) return false;
          if (filter === 'no_retrospective' && sprint.retrospective_notes) return false;
        }
      }

      return true;
    });
  }, [sprints, searchTerm, quickFilterValues]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = sprints.length;
    const active = sprints.filter(s => s.status === 'active').length;
    const planned = sprints.filter(s => s.status === 'planned').length;
    const completed = sprints.filter(s => s.status === 'completed').length;

    return { total, active, planned, completed };
  }, [sprints]);

  // Handle predefined filters
  const handlePredefinedFilterChange = (filterId: string) => {
    setActivePredefinedFilter(filterId);
    
    // Update quick filter values
    switch (filterId) {
      case 'all':
        setQuickFilterValues(prev => ({ ...prev, status: [] }));
        break;
      case 'active':
        setQuickFilterValues(prev => ({ ...prev, status: ['active'] }));
        break;
      case 'planned':
        setQuickFilterValues(prev => ({ ...prev, status: ['planned'] }));
        break;
      case 'completed':
        setQuickFilterValues(prev => ({ ...prev, status: ['completed'] }));
        break;
    }
  };

  // Predefined filters
  const predefinedFilters = [
    { key: 'all', label: 'All Sprints', isActive: activePredefinedFilter === 'all', onClick: () => handlePredefinedFilterChange('all') },
    { key: 'active', label: 'Active', isActive: activePredefinedFilter === 'active', onClick: () => handlePredefinedFilterChange('active') },
    { key: 'planned', label: 'Planned', isActive: activePredefinedFilter === 'planned', onClick: () => handlePredefinedFilterChange('planned') },
    { key: 'completed', label: 'Completed', isActive: activePredefinedFilter === 'completed', onClick: () => handlePredefinedFilterChange('completed') }
  ];

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <style jsx global>{`
        .tooltip-wrapper {
          position: relative;
          display: inline-flex;
        }
        .tooltip-content {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 4px;
          padding: 4px 8px;
          background-color: #1f2937;
          color: white;
          font-size: 11px;
          border-radius: 4px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.1s ease-in-out;
          z-index: 9999;
        }
        .tooltip-wrapper:hover .tooltip-content {
          opacity: 1;
        }
        .tooltip-content::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 4px solid transparent;
          border-top-color: #1f2937;
        }
      `}</style>
      <div className="w-full h-full px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-4 overflow-x-hidden">
        {/* Search and Filter Section */}
        <SearchFilterSection
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search sprints..."
          variant="modern"
          showActiveFilters={true}
          hideFilterIcon={true}
          filters={[]}
          predefinedFilters={predefinedFilters}
          quickFilters={[
            {
              key: 'status',
              label: 'Status',
              icon: <CheckCircle className="w-4 h-4 text-blue-500" />,
              type: 'default',
              options: [
                { label: 'Planned', value: 'planned' },
                { label: 'Active', value: 'active' },
                { label: 'Completed', value: 'completed' }
              ]
            },
            {
              key: 'project',
              label: 'Project',
              icon: <FolderOpen className="w-4 h-4 text-orange-500" />,
              type: 'default',
              options: projects.map(p => ({ label: p.name, value: p.id }))
            },
            {
              key: 'team',
              label: 'Team',
              icon: <Users className="w-4 h-4 text-purple-500" />,
              type: 'default',
              options: teams.map(t => ({ label: t.name, value: t.id }))
            },
            {
              key: 'dueDateRange',
              label: 'Date Range',
              icon: <Calendar className="w-4 h-4 text-blue-500" />,
              type: 'date',
              options: [
                { value: 'all', label: 'All Time' },
                { value: 'today', label: 'Today' },
                { value: 'thisWeek', label: 'This Week' },
                { value: 'thisMonth', label: 'This Month' },
                { value: 'next7Days', label: 'Next 7 Days' }
              ]
            },
            {
              key: 'additionalFilters',
              label: 'Additional Filters',
              icon: <Filter className="w-4 h-4 text-green-500" />,
              type: 'default',
              options: [
                { label: 'High Velocity', value: 'high_velocity' },
                { label: 'Low Velocity', value: 'low_velocity' },
                { label: 'Has Retrospective', value: 'has_retrospective' },
                { label: 'No Retrospective', value: 'no_retrospective' }
              ]
            }
          ]}
          quickFilterValues={quickFilterValues}
          onQuickFilterChange={handleQuickFilterChange}
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
          actionButton={{
            label: 'New Sprint',
            onClick: handleCreateSprint
          }}
          onOpenAdvancedFilterModal={() => setIsAdvancedFilterModalOpen(true)}
        />

        {/* Read-Only Badge */}
        <div className="mb-4">
          <ReadOnlyBadge />
        </div>

        {/* Sprints Grid - Enhanced List and Card View */}
        {viewMode === 'list' ? (
          <div className="pt-0 sm:pt-3 md:pt-0 space-y-3 pb-4">
            {filteredSprints.map((sprint) => {
              const project = projects.find(p => p.id === sprint.project_id);
              const team = teams.find(t => t.id === sprint.team_id);
              const metrics = getSprintMetrics(sprint);
              const storiesCount = getSprintStoriesCount(sprint.id);
              
              return (
              <div 
                key={sprint.id} 
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={() => handleSprintClick(sprint)}
              >
                <div className="p-3 sm:p-4">
                  {/* Top Row - Avatar, Title, Actions */}
                  <div className="flex items-start justify-between gap-3 mb-0">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0 shadow-md">
                        {sprint.name?.charAt(0).toUpperCase() || 'S'}
                      </div>
                      
                      {/* Sprint Title + Desktop Meta Details */}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-9">
                          {/* Title - Mobile full width, Desktop shrinks */}
                          <div className="tooltip-wrapper sm:flex-shrink-0">
                            <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                              {sprint.name || 'Untitled Sprint'}
                            </div>
                            <div className="tooltip-content">Sprint: {sprint.name || 'Untitled Sprint'}</div>
                          </div>

                          {/* Desktop Meta Details - Right side of title */}
                          <div className="hidden sm:flex flex-wrap items-center gap-x-2 gap-y-1 text-xs flex-1">
                            {/* Status */}
                            <div className="tooltip-wrapper">
                              <div className="flex items-center gap-1.5">
                                <span className="text-gray-800 dark:text-gray-200 font-semibold">Status:</span>
                                <Badge 
                                  variant={getStatusConfig(sprint.status).color as any} 
                                  size="sm" 
                                  className="px-2.5 py-1"
                                >
                                  {getStatusConfig(sprint.status).label}
                                </Badge>
                              </div>
                              <div className="tooltip-content">Current Status: {getStatusConfig(sprint.status).label}</div>
                            </div>

                            {/* Project */}
                            {project && (
                              <div className="tooltip-wrapper">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-gray-800 dark:text-gray-200 font-semibold">Project:</span>
                                  <span className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">
                                    {project.name}
                                  </span>
                                </div>
                                <div className="tooltip-content">Project: {project.name}</div>
                              </div>
                            )}

                            {/* Progress */}
                            <div className="tooltip-wrapper">
                              <div className="flex items-center gap-1.5">
                                <span className="text-gray-800 dark:text-gray-200 font-semibold">Progress:</span>
                                <span className="px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400 font-medium">
                                  {metrics.progress}%
                                </span>
                              </div>
                              <div className="tooltip-content">Progress: {metrics.progress}%</div>
                            </div>

                            {/* Stories Count */}
                            <div className="tooltip-wrapper">
                              <div className="flex items-center gap-1">
                                <CheckSquare className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                <span className="text-gray-700 dark:text-gray-300 font-medium">{storiesCount}</span>
                              </div>
                              <div className="tooltip-content">Stories: {storiesCount}</div>
                            </div>

                            {/* Due Date - Desktop */}
                            {sprint.end_date && (
                              <div className="tooltip-wrapper">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                  <span className={`font-medium ${isOverdue(sprint.end_date, sprint.status) ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {formatShort(sprint.end_date)}
                                  </span>
                                </div>
                                <div className="tooltip-content">
                                  End Date: {new Date(sprint.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                  {isOverdue(sprint.end_date, sprint.status) ? ' (OVERDUE)' : ''}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Description - Mobile Only */}
                        <div className="sm:hidden mt-1 text-xs text-gray-600 dark:text-gray-400">
                          {sprint.goal || 'No description'}
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu Button */}
                    <div className="relative flex-shrink-0">
                      <button 
                        className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="More options"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setOpenMenuSprintId(openMenuSprintId === sprint.id ? null : sprint.id); 
                        }}
                      >
                        <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
                      </button>
                      {openMenuSprintId === sprint.id && (
                        <div 
                          data-dropdown-menu
                          className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button 
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg flex items-center gap-2 text-sm font-normal text-gray-800 dark:text-gray-200" 
                            onClick={(e) => {e.stopPropagation(); handleSprintClick(sprint); setOpenMenuSprintId(null);}}
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                          <UpdateButton
                            resource="tasks"
                            onClick={(e) => {e?.stopPropagation(); handleEditSprint(sprint); setOpenMenuSprintId(null);}}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm font-normal text-gray-800 dark:text-gray-200"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </UpdateButton>
                          <DeleteButton
                            resource="tasks"
                            onClick={(e) => {e?.stopPropagation(); handleDeleteSprint(sprint.id); setOpenMenuSprintId(null);}}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-b-lg flex items-center gap-2 text-sm font-normal text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </DeleteButton>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* All Meta Details - Mobile Only */}
                  <div className="sm:hidden mt-2 space-y-1 text-xs ml-[52px]">
                    {/* Line 1: Project, Status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Project */}
                      {project && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-800 dark:text-gray-200 font-semibold">Project:</span>
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md">
                            {project.name}
                          </span>
                        </div>
                      )}
                      
                      {/* Status */}
                      <div className="flex items-center gap-1">
                        <span className="text-gray-800 dark:text-gray-200 font-semibold">Status:</span>
                        <Badge variant={getStatusConfig(sprint.status).color as any} size="sm">
                          {getStatusConfig(sprint.status).label}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Line 2: Stories, Assignees, Date Range */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Stories Count */}
                      <div className="flex items-center gap-1">
                        <CheckSquare className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">{storiesCount}</span>
                      </div>
                      
                      {/* Team */}
                      {team && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-800 dark:text-gray-200 font-semibold">Assignees:</span>
                          <span className="text-gray-700 dark:text-gray-300">{team.name}</span>
                        </div>
                      )}
                      
                      {/* Date Range */}
                      {sprint.start_date && sprint.end_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                          <span className={isOverdue(sprint.end_date, sprint.status) ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}>
                            {formatShort(sprint.start_date)} - {formatShort(sprint.end_date)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Team, Velocity, Duration and Date Range Row - Desktop - Combined in single line */}
                  <div className="hidden sm:flex items-center gap-3 ml-[60px] text-xs text-gray-600 dark:text-gray-400">
                    {team && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{team.name}</span>
                      </div>
                    )}
                    {sprint.velocity > 0 && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{sprint.velocity} pts</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{metrics.durationWeeks} weeks ({metrics.durationDays} days)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatShort(sprint.start_date)} - {formatShort(sprint.end_date)}</span>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-4">
            {filteredSprints.map((sprint) => {
              const project = projects.find(p => p.id === sprint.project_id);
              const team = teams.find(t => t.id === sprint.team_id);
              const metrics = getSprintMetrics(sprint);
              const storiesCount = getSprintStoriesCount(sprint.id);
              
              return (
                <div
                  key={sprint.id}
                  className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg w-full"
                  style={{
                    minHeight: '140px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                  }}
                  onClick={() => handleSprintClick(sprint)}
                >
                  <div className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                    {/* Header: Avatar + Title + Menu */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div 
                          className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                          title={`Sprint: ${sprint.name || 'No Name'}`}
                        >
                          {(sprint.name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <h4 
                          className="font-medium text-gray-900 dark:text-white text-sm leading-tight truncate flex-1"
                          title={`Sprint: ${sprint.name || 'Untitled Sprint'}`}
                        >
                          {sprint.name || 'Untitled Sprint'}
                        </h4>
                      </div>
                      <div className="relative flex-shrink-0">
                        <button 
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="More options"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setOpenMenuSprintId(openMenuSprintId === sprint.id ? null : sprint.id); 
                          }}
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                        {openMenuSprintId === sprint.id && (
                          <div 
                            data-dropdown-menu
                            className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button 
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg flex items-center gap-2 text-sm font-normal text-gray-800 dark:text-gray-200" 
                              onClick={(e) => {e.stopPropagation(); handleSprintClick(sprint); setOpenMenuSprintId(null);}}
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </button>
                            <UpdateButton
                              resource="tasks"
                              onClick={(e) => {e?.stopPropagation(); handleEditSprint(sprint); setOpenMenuSprintId(null);}}
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm font-normal text-gray-800 dark:text-gray-200"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Edit</span>
                            </UpdateButton>
                            <DeleteButton
                              resource="tasks"
                              onClick={(e) => {e?.stopPropagation(); handleDeleteSprint(sprint.id); setOpenMenuSprintId(null);}}
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-b-lg flex items-center gap-2 text-sm font-normal text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </DeleteButton>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Project or Team */}
                    {project ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-800 dark:text-gray-200 font-semibold sm:hidden">Project:</span>
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-xs truncate">
                          {project.name}
                        </span>
                      </div>
                    ) : team ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-800 dark:text-gray-200 font-semibold sm:hidden">Team:</span>
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-xs truncate">
                          {team.name}
                        </span>
                      </div>
                    ) : null}

                    {/* Divider */}
                    <div className="border-t border-gray-100 dark:border-gray-700"></div>

                    {/* Status and Progress Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="tooltip-wrapper">
                        <div className="flex items-center gap-1.5">
                          <span className="hidden sm:inline text-xs text-gray-800 dark:text-gray-200 font-semibold">Status:</span>
                          <Badge variant={getStatusConfig(sprint.status).color as any} size="sm" className="text-xs">
                            {getStatusConfig(sprint.status).label}
                          </Badge>
                        </div>
                        <div className="tooltip-content">Current Status: {getStatusConfig(sprint.status).label}</div>
                      </div>
                      <div className="tooltip-wrapper">
                        <div className="flex items-center gap-1.5">
                          <span className="hidden sm:inline text-xs text-gray-800 dark:text-gray-200 font-semibold">Progress:</span>
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400 rounded-md text-xs font-medium">
                            {metrics.progress}%
                          </span>
                        </div>
                        <div className="tooltip-content">Progress: {metrics.progress}%</div>
                      </div>
                    </div>

                    {/* Bottom Meta Info */}
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        {/* Velocity */}
                        <div className="tooltip-wrapper">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>{sprint.velocity || 0}</span>
                          </div>
                          <div className="tooltip-content">Velocity: {sprint.velocity || 0} pts</div>
                        </div>
                        
                        {/* Stories - Desktop only */}
                        <div className="tooltip-wrapper !hidden sm:!inline-flex">
                          <div className="flex items-center gap-1">
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>{storiesCount}</span>
                          </div>
                          <div className="tooltip-content">Stories: {storiesCount}</div>
                        </div>
                      </div>
                      
                      {/* End Date - Always visible */}
                      {sprint.end_date && (
                        <div className="tooltip-wrapper flex-shrink-0">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className={isOverdue(sprint.end_date, sprint.status) ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                              {formatShort(sprint.end_date)}
                            </span>
                          </div>
                          <div className="tooltip-content">
                            End Date: {new Date(sprint.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            {isOverdue(sprint.end_date, sprint.status) ? ' (OVERDUE)' : ''}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredSprints.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-12 h-12 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No sprints found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Try adjusting your search or filter criteria</p>
            <CreateButton resource="tasks">
              <Button onClick={handleCreateSprint}>Create New Sprint</Button>
            </CreateButton>
          </div>
        )}
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-25 right-4 z-40 lg:hidden">
        <CreateButton resource="tasks">
          <button
            onClick={handleCreateSprint}
            className="w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus size={36} className="text-white" />
          </button>
        </CreateButton>
      </div>

      {/* Sprint Preview - Mobile: slides up from bottom, Desktop: centered modal */}
      {isSprintPreviewOpen && selectedSprint && (
        <div className={`fixed inset-0 z-50 flex items-end lg:items-center justify-center transition-opacity duration-300 ${
          isPreviewAnimating ? 'bg-opacity-0' : 'bg-black/70 bg-opacity-50'
        }`} style={{ backdropFilter: 'blur(2px)' }}>
          <div 
            ref={sprintPreviewRef}
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
              className="bg-white dark:bg-gray-800 rounded-t-2xl lg:rounded-2xl shadow-2xl overflow-y-auto"
              style={{ 
                maxHeight: '85vh',
                boxShadow: '0 -10px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                backgroundColor: 'white'
              }}
            >
              <div className="p-4 lg:p-6 pb-24 lg:pb-6">
                {/* Sprint Preview Header */}
                <div className="flex items-center justify-between mb-4 lg:mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                      <RefreshCw className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedSprint.name || 'Untitled Sprint'}</h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Sprint Details</p>
                    </div>
                  </div>
                  {/* JSON View Button */}
                  <Button
                    variant={isJsonViewActive ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setIsJsonViewActive(!isJsonViewActive)}
                    className="flex items-center space-x-2 text-xs sm:text-sm px-3 py-2"
                    title="Toggle JSON View"
                  >
                    <FileCode className="w-4 h-4" />
                    <span>JSON View</span>
                  </Button>
                </div>

                {/* Conditional Rendering: Normal View or JSON View */}
                {!isJsonViewActive ? (
                  <>
                {/* Sprint Details - Single Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-700 p-4 lg:p-6 shadow-sm">
                  <div className="space-y-6">
                    {/* Goal */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Goal</label>
                      <p className="text-gray-600 dark:text-gray-400">{selectedSprint.goal || 'No goal set'}</p>
                    </div>

                    {/* Project, Status, Velocity */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Project</label>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate" title={projects.find(p => p.id === selectedSprint.project_id)?.name || 'N/A'}>{projects.find(p => p.id === selectedSprint.project_id)?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Status</label>
                        <Badge variant={getStatusConfig(selectedSprint.status).color as any} size="sm" className="text-xs">
                          {React.createElement(getStatusConfig(selectedSprint.status).icon, { className: "w-3 h-3" })}
                          <span className="ml-1 capitalize">{getStatusConfig(selectedSprint.status).label}</span>
                        </Badge>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Velocity</label>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{selectedSprint.velocity || 0} pts</p>
                      </div>
                    </div>

                    {/* Start Date, End Date, Duration */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Start Date</label>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{new Date(selectedSprint.start_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">End Date</label>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{new Date(selectedSprint.end_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Duration</label>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{getSprintMetrics(selectedSprint).durationWeeks}w ({getSprintMetrics(selectedSprint).durationDays}d)</p>
                      </div>
                    </div>

                    {/* Team */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Team</label>
                      <p className="text-gray-600 dark:text-gray-400">{teams.find(t => t.id === selectedSprint.team_id)?.name || 'N/A'}</p>
                    </div>

                    {/* Stories List */}
                    {getSprintStories(selectedSprint.id).length > 0 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                          Stories ({getSprintStoriesCount(selectedSprint.id)})
                        </label>
                        <div className="space-y-2">
                          {getSprintStories(selectedSprint.id).map((story) => (
                            <div key={story.id} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <CheckSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-900 dark:text-white flex-1">{story.title}</span>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge variant={
                                  story.status === 'done' ? 'success' : 
                                  story.status === 'in_progress' ? 'info' : 
                                  story.status === 'review' ? 'warning' : 'default'
                                } size="sm">
                                  {story.status.replace('_', ' ')}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Zap className="w-3 h-3 text-yellow-500" />
                                  <span>{story.story_points}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Retrospective Notes */}
                    {selectedSprint.retrospective_notes && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Retrospective Notes</label>
                        <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{selectedSprint.retrospective_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                </>
                ) : (
                  /* JSON View */
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-700 p-4 lg:p-6 shadow-sm">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-auto max-h-[60vh] scrollbar-hide">
                      <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                        {JSON.stringify({
                          id: selectedSprint.id,
                          sprint_id: selectedSprint.sprint_id,
                          name: selectedSprint.name,
                          goal: selectedSprint.goal,
                          start_date: selectedSprint.start_date,
                          end_date: selectedSprint.end_date,
                          status: selectedSprint.status,
                          project_id: selectedSprint.project_id,
                          team_id: selectedSprint.team_id,
                          velocity: selectedSprint.velocity,
                          stories: getSprintStories(selectedSprint.id),
                          stories_count: getSprintStoriesCount(selectedSprint.id),
                          retrospective_notes: selectedSprint.retrospective_notes,
                          created_by: selectedSprint.created_by,
                          createdAt: selectedSprint.createdAt || null,
                          updatedAt: selectedSprint.updatedAt || null
                        }, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sprint Form Modal */}
      {isSprintFormOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/70 bg-opacity-50"
          style={{ backdropFilter: 'blur(2px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeSprintForm();
            }
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-t-2xl lg:rounded-2xl w-full lg:w-auto lg:max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full max-h-[90vh]">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 rounded-t-2xl lg:rounded-t-2xl">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedSprint && sprintForm.name ? 'Edit Sprint' : 'Create Sprint'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Set up a new sprint for your team</p>
              </div>
            </div>

            {/* Form Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
              <form onSubmit={handleSprintSubmit} className="space-y-4">
              {/* Row 1: Sprint Name, Status, Start Date, Duration */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sprint Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={sprintForm.name}
                    onChange={(e) => setSprintForm({ ...sprintForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter sprint name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={sprintForm.status}
                    onChange={(e) => setSprintForm({ ...sprintForm, status: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={sprintForm.start_date}
                    onChange={(e) => setSprintForm({ ...sprintForm, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (Weeks)
                  </label>
                  <select
                    value={sprintForm.duration_weeks}
                    onChange={(e) => setSprintForm({ ...sprintForm, duration_weeks: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>1 Week</option>
                    <option value={2}>2 Weeks</option>
                    <option value={3}>3 Weeks</option>
                    <option value={4}>4 Weeks</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Project, Team, Velocity, Goal */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project *
                  </label>
                  <select
                    required
                    value={sprintForm.project_id}
                    onChange={(e) => setSprintForm({ ...sprintForm, project_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Team *
                  </label>
                  <select
                    required
                    value={sprintForm.team_id}
                    onChange={(e) => setSprintForm({ ...sprintForm, team_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Team</option>
                    {teams.map((team, index) => (
                      <option key={team.id || `team-${index}`} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Velocity (Story Points)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sprintForm.velocity}
                    onChange={(e) => setSprintForm({ ...sprintForm, velocity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Row 3: Goal (full width) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Goal
                </label>
                <textarea
                  value={sprintForm.goal}
                  onChange={(e) => setSprintForm({ ...sprintForm, goal: e.target.value })}
                  placeholder="Enter sprint goal"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Row 4: Retrospective Notes (full width) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Retrospective Notes
                </label>
                <textarea
                  value={sprintForm.retrospective_notes}
                  onChange={(e) => setSprintForm({ ...sprintForm, retrospective_notes: e.target.value })}
                  placeholder="Enter retrospective notes"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              </form>
            </div>

            {/* Footer - Sticky */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 pt-4 pb-24 sm:pb-6 rounded-b-2xl lg:rounded-b-2xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  onClick={handleSprintSubmit}
                  disabled={loading}
                  className="flex-1 order-2 sm:order-1"
                >
                  {loading ? 'Saving...' : (selectedSprint && sprintForm.name ? 'Update Sprint' : 'Create Sprint')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeSprintForm}
                  className="flex-1 order-1 sm:order-2"
                >
                  Cancel
                </Button>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default SprintPage;
