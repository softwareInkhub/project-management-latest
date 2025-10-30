'use client';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
  Upload,
  Filter,
  FolderOpen,
  BarChart3,
  Tag,
  Settings,
  ChevronDown,
  ChevronUp
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
import { AdvancedFilterModal } from '../components/ui/AdvancedFilterModal';
import { useTabs } from '../hooks/useTabs';
import { useSidebar } from '../components/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { apiService, Task } from '../services/api';
import { driveService, FileItem } from '../services/drive';

// Advanced Filter Interfaces
interface DateRange {
  from: string;
  to: string;
}

interface NumberRange {
  min: number;
  max: number;
}

interface AdvancedFilters {
  taskScope: string[];
  status: string[];
  priority: string[];
  assignee: string[];
  project: string[];
  tags: string[];
  dueDateRange: DateRange;
  timeEstimateRange: NumberRange;
  additionalFilters: string[];
}

interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

// SortableTableHeader Component
const SortableTableHeader = React.memo(({ 
  column, 
  label, 
  sortable = true, 
  filterable = true, 
  width,
  align = 'left',
  filterOptions,
  columnSorts,
  setColumnSorts,
  columnFilters,
  setColumnFilters,
  openFilterDropdown,
  setOpenFilterDropdown
}: {
  column: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  filterOptions?: Array<{ label: string; value: string }> | string[];
  columnSorts: {[key: string]: 'asc' | 'desc' | null};
  setColumnSorts: React.Dispatch<React.SetStateAction<{[key: string]: 'asc' | 'desc' | null}>>;
  columnFilters: {[key: string]: string};
  setColumnFilters: React.Dispatch<React.SetStateAction<{[key: string]: string}>>;
  openFilterDropdown: string | null;
  setOpenFilterDropdown: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  const currentSort = columnSorts[column];
  const currentFilter = columnFilters[column];
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [showSelectOptions, setShowSelectOptions] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const handleSort = useCallback(() => {
    if (!sortable) return;
    
    const newSort = currentSort === 'asc' ? 'desc' : 
                   currentSort === 'desc' ? null : 'asc';
    
    setColumnSorts(prev => ({
      ...prev,
      [column]: newSort
    }));
  }, [sortable, currentSort, column, setColumnSorts]);

  const handleFilterChange = useCallback((value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  }, [column, setColumnFilters, setOpenFilterDropdown]);

  const clearFilter = useCallback(() => {
    console.log('Clear filter clicked for column:', column, 'current value:', currentFilter);
    
    // Clear the filter value by setting it to empty string
    setColumnFilters(prev => ({
      ...prev,
      [column]: ''
    }));
    
    // Clear selected statuses
    setSelectedStatuses([]);
    
    // Force input to clear immediately
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
    
    // Close select options
    setShowSelectOptions(false);
  }, [column, setColumnFilters, currentFilter]);

  const handleStatusToggle = useCallback((value: string) => {
    setSelectedStatuses(prev => {
      const newSelection = prev.includes(value) 
        ? prev.filter(status => status !== value)
        : [...prev, value];
      
      // Update the filter with comma-separated values
      const filterValue = newSelection.length > 0 ? newSelection.join(',') : '';
      handleFilterChange(filterValue);
      
      return newSelection;
    });
  }, [handleFilterChange]);

  const getSelectedLabel = useCallback(() => {
    if (selectedStatuses.length === 0) return 'All Status';
    if (selectedStatuses.length === 1) return selectedStatuses[0];
    return `${selectedStatuses.length} selected`;
  }, [selectedStatuses]);

  const toggleFilterDropdown = useCallback(() => {
    if (!filterable) return;
    setOpenFilterDropdown(openFilterDropdown === column ? null : column);
  }, [filterable, openFilterDropdown, column, setOpenFilterDropdown]);

  // Close dropdown when clicking outside of it
  useEffect(() => {
    if (openFilterDropdown !== column) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Don't close if clicking on the clear button or its children
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setOpenFilterDropdown(null);
        setShowSelectOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openFilterDropdown, column, setOpenFilterDropdown]);

  return (
    <th 
      className={`px-4 py-3 text-${align} text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 relative group`}
      style={{ width }}
    >
      <div className="flex items-center justify-between">
        <div 
          className={`${sortable ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''} flex items-center space-x-1`}
          onClick={handleSort}
        >
          <span className={`${currentSort ? 'text-blue-600' : ''}`}>{label}</span>
          {sortable && currentSort && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {currentSort === 'asc' ? 'ASC' : 'DESC'}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {/* Filter Icon */}
          {filterable && (
            <div className="relative">
              <Filter 
                className={`w-3 h-3 cursor-pointer transition-colors ${
                  currentFilter ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                }`}
                onClick={toggleFilterDropdown}
              />
              
              {/* Filter Dropdown */}
              {openFilterDropdown === column && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                  onMouseDown={(e) => { e.stopPropagation(); }}
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  <div className="p-2">
                    {filterOptions ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <button
                            type="button"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowSelectOptions(!showSelectOptions);
                            }}
                            onMouseDown={(e) => { e.stopPropagation(); }}
                          >
                            <span>{getSelectedLabel()}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${showSelectOptions ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {showSelectOptions && (
                            <div 
                              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {(Array.isArray(filterOptions) ? filterOptions : []).map((opt: any, idx: number) => {
                                const option = typeof opt === 'string' ? { label: opt, value: opt === 'All Status' ? '' : opt } : opt;
                                if (option.value === '') return null; // Skip "All Status" option
                                const isSelected = selectedStatuses.includes(option.value);
                                return (
                                  <div
                                    key={`${column}-opt-${idx}`}
                                    className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg cursor-pointer"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleStatusToggle(option.value);
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {}} // Controlled by parent click
                                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="text-gray-700">{option.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="text-xs text-red-600 hover:text-red-800"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); clearFilter(); }}
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          ref={inputRef}
                          key={`${column}-${currentFilter || ''}`}
                          type="text"
                          placeholder={`Filter by ${label.toLowerCase()}...`}
                          value={currentFilter || ''}
                          onChange={(e) => handleFilterChange(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        {(currentFilter && currentFilter.length > 0) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              clearFilter();
                            }}
                            className="mt-2 text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 cursor-pointer"
                          >
                            Clear filter
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </th>
  );
});

// Mobile Filter Summary Component
const MobileFilterSummary = React.memo(({ 
  columnFilters, 
  onClearAllFilters 
}: { 
  columnFilters: {[key: string]: string};
  onClearAllFilters: () => void;
}) => {
  const activeFilters = useMemo(() => 
    Object.entries(columnFilters).filter(([_, value]) => value), 
    [columnFilters]
  );
  
  if (activeFilters.length === 0) return null;

  return (
    <div className="block sm:hidden mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Active Filters</span>
          <Badge variant="default" className="text-xs">
            {activeFilters.length}
          </Badge>
        </div>
        <button
          onClick={onClearAllFilters}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Clear All
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {activeFilters.map(([column, value]) => (
          <div key={column} className="flex items-center space-x-1 bg-white px-2 py-1 rounded border text-xs">
            <span className="font-medium text-gray-700">{column}:</span>
            <span className="text-gray-600">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

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
  'To Do': { label: 'To Do', color: 'to_do', icon: Circle },
  'to_do': { label: 'To Do', color: 'to_do', icon: Circle },
  'In Progress': { label: 'In Progress', color: 'in_progress', icon: Clock },
  'in_progress': { label: 'In Progress', color: 'in_progress', icon: Clock },
  'Completed': { label: 'Completed', color: 'done', icon: CheckCircle },
  'done': { label: 'Done', color: 'done', icon: CheckCircle },
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
  'Low': { label: 'Low', color: 'low', icon: ArrowDown },
  'low': { label: 'Low', color: 'low', icon: ArrowDown },
  'Medium': { label: 'Medium', color: 'medium', icon: Flag },
  'medium': { label: 'Medium', color: 'medium', icon: Flag },
  'High': { label: 'High', color: 'high', icon: ArrowUp },
  'high': { label: 'High', color: 'high', icon: ArrowUp }
};

// Helper function to get priority config with fallback
const getPriorityConfig = (priority: string) => {
  return priorityConfig[priority as keyof typeof priorityConfig] || {
    label: priority || 'Unknown',
    color: 'default',
    icon: Flag
  };
};

// Assignee avatar helpers (match team page style)
const assigneeAvatarColors = [
  'from-purple-500 to-purple-600',
  'from-blue-500 to-blue-600',
  'from-green-500 to-green-600',
  'from-pink-500 to-pink-600',
  'from-orange-500 to-orange-600',
  'from-indigo-500 to-indigo-600',
  'from-red-500 to-red-600'
];

const getAssigneeAvatarColor = (index: number) => {
  return assigneeAvatarColors[index % assigneeAvatarColors.length];
};

const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const AssigneeAvatars = ({ names, maxVisible = 2 }: { names: string[]; maxVisible?: number }) => {
  const visible = names.slice(0, maxVisible);
  const remaining = Math.max(0, names.length - maxVisible);
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {visible.map((name, index) => (
          <div
            key={`${name}-${index}`}
            className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAssigneeAvatarColor(index)} flex items-center justify-center text-white text-xs font-semibold border-2 border-white shadow-sm`}
            title={name}
          >
            {getInitials(name)}
          </div>
        ))}
        {remaining > 0 && (
          <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center text-gray-600 text-xs font-semibold">
            +{remaining}
          </div>
        )}
      </div>
    </div>
  );
};

const TasksPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'card'>(() => {
    // Set card view as default for mobile, list view for desktop
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640 ? 'card' : 'list';
    }
    return 'list'; // Default fallback
  });
  const [activePredefinedFilter, setActivePredefinedFilter] = useState('all');
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, string | string[]>>({});
  
  // Advanced Filter State
  const [advancedFilterState, setAdvancedFilterState] = useState<AdvancedFilters>({
    taskScope: [],
    status: [],
    priority: [],
    assignee: [],
    project: [],
    tags: [],
    dueDateRange: { from: '', to: '' },
    timeEstimateRange: { min: 0, max: 1000 },
    additionalFilters: []
  });
  const [isAdvancedFilterModalOpen, setIsAdvancedFilterModalOpen] = useState(false);
  const [visibleFilterColumns, setVisibleFilterColumns] = useState<string[]>([
    'taskScope', 'status', 'priority', 'project', 'dueDateRange'
  ]);

  // Available filter columns with icons
  const availableFilterColumns = [
    { key: 'taskScope', label: 'Tasks', icon: <CheckCircle className="w-4 h-4 text-blue-500" /> },
    { key: 'status', label: 'Task Status', icon: <CheckCircle className="w-4 h-4 text-blue-500" /> },
    { key: 'priority', label: 'Priority Level', icon: <Flag className="w-4 h-4 text-green-500" /> },
    { key: 'project', label: 'Project', icon: <FolderOpen className="w-4 h-4 text-orange-500" /> },
    { key: 'dueDateRange', label: 'Date Range', icon: <Calendar className="w-4 h-4 text-blue-500" /> },
    { key: 'timeEstimateRange', label: 'Time Estimates', icon: <Clock className="w-4 h-4 text-purple-500" /> },
    { key: 'tags', label: 'Tags', icon: <Tag className="w-4 h-4 text-orange-500" /> },
    { key: 'additionalFilters', label: 'Additional Filters', icon: <Filter className="w-4 h-4 text-green-500" /> }
  ];
  const [sortOption, setSortOption] = useState<SortOption>({ field: 'dueDate', direction: 'asc' });
  
  // Column sorting and filtering state
  const [columnSorts, setColumnSorts] = useState<{[key: string]: 'asc' | 'desc' | null}>({});
  const [columnFilters, setColumnFilters] = useState<{[key: string]: string}>({});
  const [openFilterDropdown, setOpenFilterDropdown] = useState<string | null>(null);
  
  // Note: click-outside is handled per-dropdown inside SortableTableHeader
  
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isFormAnimating, setIsFormAnimating] = useState(false);
  const [formHeight, setFormHeight] = useState(80); // Default 80vh
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskPreviewOpen, setIsTaskPreviewOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  
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
    fetchUsers(); // Also fetch users to populate assignee names
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

  // Helper function to get assignee name from ID
  const getAssigneeName = (assigneeId: string): string => {
    if (!assigneeId || !allUsers.length) return '';
    
    // Check if assigneeId is already a name (not an ID)
    const user = allUsers.find(u => u.id === assigneeId || u.userId === assigneeId);
    
    if (user) {
      return user.name || user.username || user.email || '';
    }
    
    // If no user found and assigneeId looks like a UUID, return empty string
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(assigneeId)) {
      return '';
    }
    
    // If it's not a UUID, return as is (might be a name already)
    return assigneeId;
  };

  // Helper function to get all assigned users from task
  const getAssignedUsers = (task: Task) => {
    if (!task.assignedUsers || !Array.isArray(task.assignedUsers) || !allUsers.length) {
      return [];
    }
    
    return task.assignedUsers
      .map(userId => {
        const user = allUsers.find(u => u.id === userId || u.userId === userId);
        return user ? (user.name || user.username || user.email || '') : null;
      })
      .filter((name): name is string => name !== null && name !== '');
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

  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    try {
      console.log('📁 Fetching projects for task assignment...');
      const res = await apiService.getProjects();
      console.log('🔍 Projects API response:', res);
      if (res.success && res.data) {
        console.log('✅ Projects fetched:', res.data.length, res.data);
        setAllProjects(res.data);
      } else {
        console.error('❌ Failed to fetch projects:', res.error);
        setAllProjects([]);
      }
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
      setAllProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const isOverdue = (dueDate: string) => {
    const task = tasks.find(t => t.dueDate === dueDate);
    return new Date(dueDate) < new Date() && task?.status !== 'Completed';
  };

  // Advanced filtering and sorting logic
  const applyAdvancedFilters = (task: Task): boolean => {
    const filters = advancedFilterState;
    
    // Task scope filter (My Tasks vs All Tasks)
    if (filters.taskScope.length > 0) {
      const currentUserId = user?.userId || user?.email;
      const isMyTask = filters.taskScope.includes('myTasks') && currentUserId && (
        task.assignee === currentUserId || 
        task.assignedUsers?.includes(currentUserId) ||
        task.assignedTeams?.some((teamId: string) => 
          allTeams.find(team => team.id === teamId)?.members?.includes(currentUserId)
        )
      );
      const isAllTasks = filters.taskScope.includes('allTasks');
      if (!isMyTask && !isAllTasks) {
        return false;
      }
    }
    
    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(task.status)) {
      return false;
    }
    
    // Priority filter
    if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
      return false;
    }
    
    // Assignee filter
    if (filters.assignee.length > 0) {
      const isUnassigned = filters.assignee.includes('unassigned') && (!task.assignee || task.assignee === '');
      const isAssignedToUser = filters.assignee.includes(task.assignee);
      if (!isUnassigned && !isAssignedToUser) {
        return false;
      }
    }
    
    // Project filter
    if (filters.project.length > 0 && !filters.project.includes(task.project)) {
      return false;
    }
    
    // Tags filter
    if (filters.tags.length > 0) {
      const taskTags = task.tags ? task.tags.split(',').map(tag => tag.trim()) : [];
      const hasMatchingTag = filters.tags.some(filterTag => 
        taskTags.some(taskTag => taskTag.toLowerCase().includes(filterTag.toLowerCase()))
      );
      if (!hasMatchingTag) {
        return false;
      }
    }
    
    // Due date range filter
    if (filters.dueDateRange.from || filters.dueDateRange.to) {
      const dueDate = new Date(task.dueDate);
      if (filters.dueDateRange.from) {
        const fromDate = new Date(filters.dueDateRange.from);
        if (dueDate < fromDate) return false;
      }
      if (filters.dueDateRange.to) {
        const toDate = new Date(filters.dueDateRange.to);
        if (dueDate > toDate) return false;
      }
    }
    
    // Time estimate range filter
    if (task.estimatedHours < filters.timeEstimateRange.min || task.estimatedHours > filters.timeEstimateRange.max) {
      return false;
    }
    
    // Additional filters
    for (const additionalFilter of filters.additionalFilters) {
      switch (additionalFilter) {
        case 'hasAttachments':
          if (!task.attachments || task.attachments === '[]') return false;
          break;
        case 'hasSubtasks':
          if (!task.subtasks || task.subtasks === '[]') return false;
          break;
        case 'hasComments':
          if (parseInt(task.comments) === 0) return false;
          break;
        case 'overdue':
          const dueDate = new Date(task.dueDate);
          const today = new Date();
          if (dueDate >= today || task.status === 'Completed') return false;
          break;
      }
    }
    
    return true;
  };

  const sortTasks = (tasks: Task[]): Task[] => {
    return [...tasks].sort((a, b) => {
      // Check for column-specific sorting first
      const activeColumnSort = Object.entries(columnSorts).find(([_, direction]) => direction !== null);
      if (activeColumnSort) {
        const [field, direction] = activeColumnSort;
        return sortByField(a, b, field, direction as 'asc' | 'desc');
      }
      
      // Fall back to global sort option
      return sortByField(a, b, sortOption.field, sortOption.direction);
    });
  };

  const sortByField = (a: Task, b: Task, field: string, direction: 'asc' | 'desc'): number => {
    let aValue: any, bValue: any;
    
    switch (field) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'description':
        aValue = a.description.toLowerCase();
        bValue = b.description.toLowerCase();
        break;
      case 'project':
        aValue = a.project?.toLowerCase() || '';
        bValue = b.project?.toLowerCase() || '';
        break;
      case 'status':
        const statusOrder = { 'To Do': 1, 'In Progress': 2, 'Completed': 3, 'Overdue': 4 };
        aValue = statusOrder[a.status as keyof typeof statusOrder] || 5;
        bValue = statusOrder[b.status as keyof typeof statusOrder] || 5;
        break;
      case 'priority':
        const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
        aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 4;
        bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 4;
        break;
      case 'dueDate':
        aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'updatedAt':
        aValue = new Date(a.updatedAt).getTime();
        bValue = new Date(b.updatedAt).getTime();
        break;
      case 'progress':
        aValue = a.progress || 0;
        bValue = b.progress || 0;
        break;
      case 'estimatedHours':
        aValue = a.estimatedHours || 0;
        bValue = b.estimatedHours || 0;
        break;
      case 'assignee':
        aValue = a.assignee?.toLowerCase() || '';
        bValue = b.assignee?.toLowerCase() || '';
        break;
      case 'tags':
        aValue = a.tags?.toLowerCase() || '';
        bValue = b.tags?.toLowerCase() || '';
        break;
      case 'comments':
        aValue = parseInt(a.comments) || 0;
        bValue = parseInt(b.comments) || 0;
        break;
      case 'subtasks':
        aValue = parseInt(a.subtasks) || 0;
        bValue = parseInt(b.subtasks) || 0;
        break;
      default:
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
    }
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  };

  // Memoized filtered and sorted tasks for performance
  const filteredTasks = useMemo(() => {
    return sortTasks(tasks.filter(task => {
      // Basic search filter
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.project.toLowerCase().includes(searchTerm.toLowerCase());
      
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
      } else if (activePredefinedFilter === 'my-tasks') {
        // Filter tasks assigned to the current user
        const currentUserId = user?.userId || user?.email;
        if (!currentUserId) {
          matchesPredefined = false;
        } else {
          matchesPredefined = (task.assignee === currentUserId) || 
                             (task.assignedUsers?.includes(currentUserId) || false) ||
                             (task.assignedTeams?.some((teamId: string) => 
                               allTeams.find(team => team.id === teamId)?.members?.includes(currentUserId)
                             ) || false);
        }
      }
      
      // Apply advanced filters
      const matchesAdvancedFilters = applyAdvancedFilters(task);
      
      // Apply column filters
      const matchesColumnFilters = Object.entries(columnFilters).every(([column, filterValue]) => {
        if (!filterValue) return true;
        
        switch (column) {
          case 'title':
            return task.title.toLowerCase().includes(filterValue.toLowerCase());
          case 'project':
            return task.project.toLowerCase().includes(filterValue.toLowerCase());
          case 'description':
            return task.description.toLowerCase().includes(filterValue.toLowerCase());
        case 'status':
          if (!filterValue) return true;
          const statusFilters = filterValue.split(',').map(s => s.trim());
          return statusFilters.includes(task.status);
          case 'priority':
            return task.priority.toLowerCase().includes(filterValue.toLowerCase());
          case 'assignee':
            return task.assignee.toLowerCase().includes(filterValue.toLowerCase());
          case 'tags':
            return task.tags?.toLowerCase().includes(filterValue.toLowerCase()) || false;
          case 'estimatedHours':
            return task.estimatedHours?.toString().includes(filterValue) || false;
          case 'comments':
            return task.comments?.includes(filterValue) || false;
          case 'subtasks':
            return task.subtasks?.includes(filterValue) || false;
          case 'dueDate':
            return task.dueDate?.includes(filterValue) || false;
          default:
            return true;
        }
      });
      
      return matchesSearch && matchesPredefined && matchesAdvancedFilters && matchesColumnFilters;
    }));
  }, [tasks, searchTerm, activePredefinedFilter, user, allTeams, advancedFilterState, columnFilters, columnSorts, sortOption]);

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
      if (filterKey === 'my-tasks') {
        // Count tasks assigned to the current user
        const currentUserId = user?.userId || user?.email;
        if (!currentUserId) {
          return false;
        }
        return task.assignee === currentUserId || 
               task.assignedUsers?.includes(currentUserId) ||
               task.assignedTeams?.some((teamId: string) => 
                 allTeams.find(team => team.id === teamId)?.members?.includes(currentUserId)
               );
      }
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
      key: 'my-tasks',
      label: 'My Tasks',
      count: getFilterCount('my-tasks'),
      isActive: activePredefinedFilter === 'my-tasks',
      onClick: () => setActivePredefinedFilter('my-tasks')
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

  // New advanced filter handlers
  const handleAdvancedFilterStateChange = (filters: AdvancedFilters) => {
    setAdvancedFilterState(filters);
  };

  const handleClearAdvancedFilterState = () => {
    setAdvancedFilterState({
      taskScope: [],
      status: [],
      priority: [],
      assignee: [],
      project: [],
      tags: [],
      dueDateRange: { from: '', to: '' },
      timeEstimateRange: { min: 0, max: 1000 },
      additionalFilters: []
    });
  };

  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setSortOption({ field, direction });
  };

  // Column sorting handlers
  const handleColumnSort = (column: string) => {
    const currentSort = columnSorts[column];
    let newSort: 'asc' | 'desc' | null = 'asc';
    
    if (currentSort === 'asc') {
      newSort = 'desc';
    } else if (currentSort === 'desc') {
      newSort = null;
    }
    
    setColumnSorts(prev => ({
      ...prev,
      [column]: newSort
    }));
    
    // Update main sort option
    if (newSort) {
      setSortOption({ field: column, direction: newSort });
    }
  };

  // Column filtering handlers
  const handleColumnFilter = (column: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
    setOpenFilterDropdown(null);
  };

  // Clear all column filters
  const handleClearAllColumnFilters = () => {
    setColumnFilters({});
  };

  const clearColumnFilter = (column: string) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
  };

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openFilterDropdown) {
        setOpenFilterDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openFilterDropdown]);

  // Column header component
  const ColumnHeader = ({ 
    column, 
    title, 
    width, 
    sortable = true, 
    filterable = true,
    filterOptions = []
  }: {
    column: string;
    title: string;
    width: number;
    sortable?: boolean;
    filterable?: boolean;
    filterOptions?: { value: string; label: string }[];
  }) => {
    const currentSort = columnSorts[column];
    const currentFilter = columnFilters[column];
    const isFilterOpen = openFilterDropdown === column;

    return (
      <div 
        className="flex items-center justify-between border-r border-gray-200 px-4 py-4"
        style={{ width: `${width}px` }}
      >
        <div className="flex items-center space-x-1">
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
            {title}
          </span>
          
          {/* Sort Icons */}
          {sortable && (
            <div className="flex flex-col">
              <button
                onClick={() => handleColumnSort(column)}
                className={`p-0.5 hover:bg-gray-200 rounded ${
                  currentSort === 'asc' ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleColumnSort(column)}
                className={`p-0.5 hover:bg-gray-200 rounded ${
                  currentSort === 'desc' ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Filter Icon */}
        {filterable && (
          <div className="relative">
            <button
              onClick={() => setOpenFilterDropdown(isFilterOpen ? null : column)}
              className={`p-1 hover:bg-gray-200 rounded ${
                currentFilter ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <Filter className="w-3 h-3" />
            </button>

            {/* Filter Dropdown */}
            {isFilterOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-3">
                  <div className="mb-2">
                    <input
                      type="text"
                      placeholder={`Filter ${title.toLowerCase()}...`}
                      value={currentFilter || ''}
                      onChange={(e) => handleColumnFilter(column, e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* Quick filter options */}
                  {filterOptions.length > 0 && (
                    <div className="space-y-1">
                      {filterOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleColumnFilter(column, option.value)}
                          className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Clear filter */}
                  {currentFilter && (
                    <button
                      onClick={() => clearColumnFilter(column)}
                      className="w-full text-left px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded mt-2"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Task form handlers
  const handleCreateTask = () => {
    setFormHeight(80); // Reset to default height
    setIsTaskFormOpen(true);
    setIsFormAnimating(true); // Start with form off-screen (translate-y-full)
    
    // Fetch users, teams, and projects when opening form
    fetchUsers();
    fetchTeams();
    fetchProjects();
    
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
      
      // Fetch users, teams, and projects when opening form
      fetchUsers();
      fetchTeams();
      fetchProjects();
      
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
      const validUsers = allUsers.filter((user: any) => user.name || user.username || user.email);
      console.log('🔍 Available users (no task selected):', validUsers);
      return validUsers;
    }
    
    const currentUsers = selectedTask.assignedUsers || [];
    console.log('🔍 Current assigned users (IDs):', currentUsers);
    const validUsers = allUsers.filter((user: any) => {
      const userId = user.id || user.userId;
      const hasName = user.name || user.username || user.email;
      const isNotAssigned = !currentUsers.includes(userId);
      console.log(`🔍 User ${user.name || user.username || user.email} (ID: ${userId}): hasName=${hasName}, isNotAssigned=${isNotAssigned}`);
      return hasName && isNotAssigned;
    });
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
    console.log('🔍 Current assigned teams (IDs):', currentTeams);
    const validTeams = allTeams.filter((team: any) => {
      const teamId = team.id;
      const hasName = team.name;
      const isNotAssigned = !currentTeams.includes(teamId);
      console.log(`🔍 Team ${team.name} (ID: ${teamId}): hasName=${hasName}, isNotAssigned=${isNotAssigned}`);
      return hasName && isNotAssigned;
    });
    console.log('🔍 Available teams (task selected):', validTeams);
    return validTeams;
  };

  const handleAddUser = async (userId: string) => {
    if (!selectedTask) return;
    
    try {
      const currentUsers = selectedTask.assignedUsers || [];
      const updatedUsers = [...currentUsers, userId];
      
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

  const handleAddTeam = async (teamId: string) => {
    if (!selectedTask) return;
    
    try {
      const currentTeams = selectedTask.assignedTeams || [];
      const updatedTeams = [...currentTeams, teamId];
      
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

  const handleRemoveTeam = async (teamId: string) => {
    if (!selectedTask) return;
    
    try {
      const currentTeams = selectedTask.assignedTeams || [];
      const updatedTeams = currentTeams.filter(team => team !== teamId);
      
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
  const handleAddUserToPending = (userId: string) => {
    if (!pendingUsers.includes(userId)) {
      setPendingUsers([...pendingUsers, userId]);
    }
  };

  // Handle removing users from pending list
  const handleRemoveUserFromPending = (userId: string) => {
    setPendingUsers(pendingUsers.filter(user => user !== userId));
  };

  // Handle adding teams to pending list
  const handleAddTeamToPending = (teamId: string) => {
    if (!pendingTeams.includes(teamId)) {
      setPendingTeams([...pendingTeams, teamId]);
    }
  };

  // Handle removing teams from pending list
  const handleRemoveTeamFromPending = (teamId: string) => {
    setPendingTeams(pendingTeams.filter(team => team !== teamId));
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
  const handleRemoveUserClick = (userId: string) => {
    setUserToRemove(userId);
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
    
    // Fetch users, teams, and projects when opening task preview
    fetchUsers();
    fetchTeams();
    fetchProjects();
    
    // Load task files
    if (task.attachments) {
      loadTaskFiles(task.id, task.attachments, task.assignee);
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
    
    // Fetch users, teams, and projects when editing
    fetchUsers();
    fetchTeams();
    fetchProjects();
  };

  // File management functions
  const loadTaskFiles = async (taskId: string, attachments: string, assignee?: string) => {
    setIsLoadingFiles(true);
    try {
      const fileIds = JSON.parse(attachments || '[]');
      if (Array.isArray(fileIds) && fileIds.length > 0) {
        const fileDetails = await Promise.all(
          fileIds.map(async (fileId) => {
            try {
              return await driveService.getFileDetails(fileId, assignee);
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
            createPreviewForExistingFile(file, assignee);
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
            userId: selectedTask?.assignee || '',
            file,
            parentId: 'ROOT',
            tags: `task-${selectedTask?.id}`,
          });
          uploadedFileIds.push(result.fileId);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          alert(`Failed to upload ${file.name}. Please try again.`);
        }
      }

      if (uploadedFileIds.length > 0) {
        // Get current attachments
        const currentAttachments = JSON.parse(selectedTask?.attachments || '[]');
        const newAttachments = [...currentAttachments, ...uploadedFileIds];

        // Update task with new attachments
        const result = await apiService.updateTask(selectedTask?.id, {
          attachments: JSON.stringify(newAttachments),
        });

        if (result.success) {
          // Reload files
          await loadTaskFiles(selectedTask?.id, JSON.stringify(newAttachments), selectedTask?.assignee);
          
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
  const createPreviewForExistingFile = async (file: FileItem, assignee?: string) => {
    if (!file.mimeType?.startsWith('image/')) return;

    const fileKey = `${file.name}-${file.size}`;
    setLoadingPreviews(prev => new Set(prev).add(fileKey));

    try {
      const result = await driveService.downloadFile(file.id, assignee);
      
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
      await driveService.deleteFile(fileId, selectedTask?.assignee);

      // Update task attachments
      const currentAttachments = JSON.parse(selectedTask?.attachments || '[]');
      const newAttachments = currentAttachments.filter((id: string) => id !== fileId);

      const result = await apiService.updateTask(selectedTask?.id, {
        attachments: JSON.stringify(newAttachments),
      });

      if (result.success) {
        // Reload files
        await loadTaskFiles(selectedTask?.id, JSON.stringify(newAttachments), selectedTask?.assignee);
        
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
      const result = await driveService.downloadFile(fileId, selectedTask?.assignee);
      
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
      
      // Ignore clicks that occur within custom Select dropdown portals or roots
      const isInSelect = (target as Element).closest('[data-select-portal]') || (target as Element).closest('[data-select-root]');
      if (isInSelect) {
        return;
      }

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

  // Handle window resize to update view mode based on screen size
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 640;
      const newViewMode = isMobile ? 'card' : 'list';
      setViewMode(newViewMode);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle New Task button click from SearchFilterSection
  useEffect(() => {
    const handleNewTaskClick = () => {
      handleCreateTask();
    };

    window.addEventListener('newTaskClick', handleNewTaskClick);
    
    return () => {
      window.removeEventListener('newTaskClick', handleNewTaskClick);
    };
  }, []);

  return (
    <AppLayout onCreateTask={handleCreateTask}>
      <div className="w-full px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 overflow-x-hidden">

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
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
          showInlineAdvancedFilters={true}
          onInlineAdvancedFiltersChange={handleAdvancedFilterStateChange}
          onClearInlineAdvancedFilters={handleClearAdvancedFilterState}
          inlineAdvancedFilters={advancedFilterState}
          tasks={tasks}
          users={allUsers}
          teams={allTeams}
          projects={allProjects}
          currentUser={user}
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

        {/* Mobile Filter Summary */}
        <MobileFilterSummary 
          columnFilters={columnFilters}
          onClearAllFilters={handleClearAllColumnFilters}
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
           <>
             {/* Mobile List View - Same as Desktop Table */}
             <div className="block sm:hidden bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full table-fixed border-collapse min-w-[1000px]">
                   {/* Mobile Table Header - Sticky */}
                   <thead className="sticky top-0 z-10 bg-gray-100 border-b-2 border-gray-300">
                     <tr>
                       {/* Task Name */}
                       <SortableTableHeader 
                         column="title" 
                         label="TASK NAME" 
                         width="160px" 
                         align="left"
                         columnSorts={columnSorts}
                         setColumnSorts={setColumnSorts}
                         columnFilters={columnFilters}
                         setColumnFilters={setColumnFilters}
                         openFilterDropdown={openFilterDropdown}
                         setOpenFilterDropdown={setOpenFilterDropdown}
                       />
                       
                       {/* Project */}
                       <SortableTableHeader 
                         column="project" 
                         label="PROJECT" 
                         width="110px" 
                         align="left"
                         columnSorts={columnSorts}
                         setColumnSorts={setColumnSorts}
                         columnFilters={columnFilters}
                         setColumnFilters={setColumnFilters}
                         openFilterDropdown={openFilterDropdown}
                         setOpenFilterDropdown={setOpenFilterDropdown}
                       />
                       
                       {/* Task Description */}
                       <SortableTableHeader 
                         column="description" 
                         label="TASK DESCRIPTION" 
                         width="140px" 
                         align="left"
                         columnSorts={columnSorts}
                         setColumnSorts={setColumnSorts}
                         columnFilters={columnFilters}
                         setColumnFilters={setColumnFilters}
                         openFilterDropdown={openFilterDropdown}
                         setOpenFilterDropdown={setOpenFilterDropdown}
                       />
                       
                       {/* Status */}
                      <SortableTableHeader 
                         column="status" 
                         label="STATUS" 
                        width="90px" 
                         align="center"
                        filterOptions={[
                          { label: 'All Status', value: '' },
                          { label: 'To Do', value: 'To Do' },
                          { label: 'In Progress', value: 'In Progress' },
                          { label: 'Completed', value: 'Completed' }
                        ]}
                         columnSorts={columnSorts}
                         setColumnSorts={setColumnSorts}
                         columnFilters={columnFilters}
                         setColumnFilters={setColumnFilters}
                         openFilterDropdown={openFilterDropdown}
                         setOpenFilterDropdown={setOpenFilterDropdown}
                       />
                       
                       {/* Priority */}
                       <SortableTableHeader 
                         column="priority" 
                         label="PRIORITY" 
                         width="90px" 
                         align="center"
                         columnSorts={columnSorts}
                         setColumnSorts={setColumnSorts}
                         columnFilters={columnFilters}
                         setColumnFilters={setColumnFilters}
                         openFilterDropdown={openFilterDropdown}
                         setOpenFilterDropdown={setOpenFilterDropdown}
                       />
                       
                       {/* Time */}
                       <SortableTableHeader 
                         column="estimatedHours" 
                         label="TIME" 
                         width="70px" 
                         align="center"
                         columnSorts={columnSorts}
                         setColumnSorts={setColumnSorts}
                         columnFilters={columnFilters}
                         setColumnFilters={setColumnFilters}
                         openFilterDropdown={openFilterDropdown}
                         setOpenFilterDropdown={setOpenFilterDropdown}
                       />
                       
                       {/* Comments */}
                       <SortableTableHeader 
                         column="comments" 
                         label="COMMENTS" 
                         width="90px" 
                         align="center"
                         columnSorts={columnSorts}
                         setColumnSorts={setColumnSorts}
                         columnFilters={columnFilters}
                         setColumnFilters={setColumnFilters}
                         openFilterDropdown={openFilterDropdown}
                         setOpenFilterDropdown={setOpenFilterDropdown}
                       />
                       
                       {/* Subtasks */}
                       <SortableTableHeader 
                         column="subtasks" 
                         label="SUBTASKS" 
                         width="90px" 
                         align="center"
                         columnSorts={columnSorts}
                         setColumnSorts={setColumnSorts}
                         columnFilters={columnFilters}
                         setColumnFilters={setColumnFilters}
                         openFilterDropdown={openFilterDropdown}
                         setOpenFilterDropdown={setOpenFilterDropdown}
                       />
                       
                       {/* Tags */}
                       <SortableTableHeader 
                         column="tags" 
                         label="TAGS" 
                         width="110px" 
                         align="center"
                         columnSorts={columnSorts}
                         setColumnSorts={setColumnSorts}
                         columnFilters={columnFilters}
                         setColumnFilters={setColumnFilters}
                         openFilterDropdown={openFilterDropdown}
                         setOpenFilterDropdown={setOpenFilterDropdown}
                       />
                       
                       {/* Due Date */}
                       <SortableTableHeader 
                         column="dueDate" 
                         label="DUE DATE" 
                         width="110px" 
                         align="center"
                         columnSorts={columnSorts}
                         setColumnSorts={setColumnSorts}
                         columnFilters={columnFilters}
                         setColumnFilters={setColumnFilters}
                         openFilterDropdown={openFilterDropdown}
                         setOpenFilterDropdown={setOpenFilterDropdown}
                       />
                       
                       {/* Actions - Not sortable/filterable */}
                       <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ width: '90px' }}>
                         ACTIONS
                       </th>
                     </tr>
                   </thead>
                 
                   {/* Mobile Table Body */}
                   <tbody>
                     {filteredTasks.map((task, index) => (
                       <tr 
                         key={task.id} 
                         className={`cursor-pointer transition-all duration-200 hover:bg-gray-50 group border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`} 
                         onClick={() => handleTaskClick(task)}
                       >
                         {/* Task Name */}
                         <td className="px-3 py-3 text-sm font-medium text-gray-900 border-r border-gray-200" style={{ width: '160px' }}>
                           <div className="truncate" title={task.title}>
                             <span className={task.status === 'Completed' ? 'line-through text-gray-500' : 'text-gray-900'}>
                               {task.title}
                             </span>
                           </div>
                         </td>
                         
                         {/* Project */}
                         <td className="px-3 py-3 text-sm text-gray-700 border-r border-gray-200" style={{ width: '110px' }}>
                           <div className="truncate" title={task.project}>
                             {task.project}
                           </div>
                         </td>
                         
                         {/* Task Description */}
                         <td className="px-3 py-3 text-sm text-gray-600 border-r border-gray-200" style={{ width: '140px' }}>
                           <div className="truncate" title={task.description}>
                             {task.description}
                           </div>
                         </td>
                         
                         {/* Status */}
                         <td className="px-3 py-3 text-center border-r border-gray-200" style={{ width: '90px' }}>
                           <Badge variant={getStatusConfig(task.status).color as any} size="sm" className="whitespace-nowrap">
                             {getStatusConfig(task.status).label}
                           </Badge>
                         </td>
                         
                         {/* Priority */}
                         <td className="px-3 py-3 text-center border-r border-gray-200" style={{ width: '90px' }}>
                           <Badge variant={getPriorityConfig(task.priority).color as any} size="sm" className="whitespace-nowrap">
                             {getPriorityConfig(task.priority).label}
                           </Badge>
                         </td>
                         
                         {/* Time */}
                         <td className="px-3 py-3 text-center text-sm text-gray-600 border-r border-gray-200" style={{ width: '70px' }}>
                           {task.estimatedHours}h
                         </td>
                         
                         {/* Comments */}
                         <td className="px-3 py-3 text-center text-sm text-gray-600 border-r border-gray-200" style={{ width: '90px' }}>
                           {(() => {
                             try {
                               const commentsArray = JSON.parse(task.comments);
                               return Array.isArray(commentsArray) ? commentsArray.length : parseInt(task.comments) || 0;
                             } catch (e) {
                               return parseInt(task.comments) || 0;
                             }
                           })()}
                         </td>
                         
                         {/* Subtasks */}
                         <td className="px-3 py-3 text-center text-sm text-gray-600 border-r border-gray-200" style={{ width: '90px' }}>
                           {(() => {
                             try {
                               const subtasksArray = JSON.parse(task.subtasks);
                               return Array.isArray(subtasksArray) ? subtasksArray.length : 0;
                             } catch (e) {
                               return 0;
                             }
                           })()}
                         </td>
                         
                         {/* Tags */}
                         <td className="px-3 py-3 text-center border-r border-gray-200" style={{ width: '110px' }}>
                           <div className="flex items-center justify-center gap-1 overflow-hidden">
                             {(task.tags || '').split(',').slice(0, 1).map((tag, index) => (
                               <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full whitespace-nowrap">
                                 {tag.trim()}
                               </span>
                             ))}
                             {(task.tags || '').split(',').length > 1 && (
                               <span className="px-2 py-1 bg-gray-200 text-gray-500 text-xs rounded-full">
                                 +{(task.tags || '').split(',').length - 1}
                               </span>
                             )}
                           </div>
                         </td>
                         
                         {/* Due Date */}
                         <td className="px-3 py-3 text-center text-sm border-r border-gray-200" style={{ width: '110px' }}>
                           <span className={isOverdue(task.dueDate) ? 'text-red-600 font-medium' : 'text-gray-600'}>
                             {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                           </span>
                         </td>
                         
                         {/* Actions */}
                         <td className="px-3 py-3 text-center" style={{ width: '90px' }}>
                           <div className="flex items-center justify-center">
                             <div className="relative">
                               <Button 
                                 variant="ghost" 
                                 size="sm"
                                 title="More Options"
                                 className="p-1 h-10 w-10 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:shadow-sm group-hover:opacity-100 opacity-100"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setOpenDropdown(openDropdown === task.id ? null : task.id);
                                 }}
                               >
                                 <MoreVertical size={20} className="text-gray-600" />
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
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>

             {/* Desktop Table View */}
             <div className="hidden sm:block bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full table-fixed border-collapse">
                   {/* Table Header - Sticky */}
                   <thead className="sticky top-0 z-10 bg-gray-100 border-b-2 border-gray-300">
                     <tr>
                       {/* Task Name */}
                       <SortableTableHeader 
                         column="title" 
                         label="TASK NAME" 
                         width="180px" 
                         align="left"
                         columnSorts={columnSorts}
                         setColumnSorts={setColumnSorts}
                         columnFilters={columnFilters}
                         setColumnFilters={setColumnFilters}
                         openFilterDropdown={openFilterDropdown}
                         setOpenFilterDropdown={setOpenFilterDropdown}
                       />
                       
                       {/* Project */}
                       <SortableTableHeader 
                         column="project" 
                         label="PROJECT" 
                         width="140px" 
                         align="left"
                         columnSorts={columnSorts}
                         setColumnSorts={setColumnSorts}
                         columnFilters={columnFilters}
                         setColumnFilters={setColumnFilters}
                         openFilterDropdown={openFilterDropdown}
                         setOpenFilterDropdown={setOpenFilterDropdown}
                       />
                       
                       {/* Task Description */}
                       <SortableTableHeader 
                         column="description" 
                         label="TASK DESCRIPTION" 
                         width="220px" 
                         align="left"
                         columnSorts={columnSorts}
                         setColumnSorts={setColumnSorts}
                         columnFilters={columnFilters}
                         setColumnFilters={setColumnFilters}
                         openFilterDropdown={openFilterDropdown}
                         setOpenFilterDropdown={setOpenFilterDropdown}
                       />
                       
                       {/* Status */}
                      <SortableTableHeader 
                         column="status" 
                         label="STATUS" 
                        width="100px" 
                         align="center"
                        filterOptions={[
                          { label: 'All Status', value: '' },
                          { label: 'To Do', value: 'To Do' },
                          { label: 'In Progress', value: 'In Progress' },
                          { label: 'Completed', value: 'Completed' }
                        ]}
                         columnSorts={columnSorts}
                         setColumnSorts={setColumnSorts}
                         columnFilters={columnFilters}
                         setColumnFilters={setColumnFilters}
                         openFilterDropdown={openFilterDropdown}
                         setOpenFilterDropdown={setOpenFilterDropdown}
                       />
                       
                       {/* Priority */}
                       <SortableTableHeader 
                         column="priority" 
                         label="PRIORITY" 
                         width="100px" 
                         align="center"
                         columnSorts={columnSorts}
                         setColumnSorts={setColumnSorts}
                         columnFilters={columnFilters}
                         setColumnFilters={setColumnFilters}
                         openFilterDropdown={openFilterDropdown}
                         setOpenFilterDropdown={setOpenFilterDropdown}
                       />
                       
                       {/* Time */}
                       <SortableTableHeader 
                         column="estimatedHours" 
                         label="TIME" 
                         width="80px" 
                         align="center"
                         columnSorts={columnSorts}
                         setColumnSorts={setColumnSorts}
                         columnFilters={columnFilters}
                         setColumnFilters={setColumnFilters}
                         openFilterDropdown={openFilterDropdown}
                         setOpenFilterDropdown={setOpenFilterDropdown}
                       />
                       
                       {/* Comments */}
                       <SortableTableHeader 
                         column="comments" 
                         label="COMMENTS" 
                         width="90px" 
                         align="center"
                         columnSorts={columnSorts}
                         setColumnSorts={setColumnSorts}
                         columnFilters={columnFilters}
                         setColumnFilters={setColumnFilters}
                         openFilterDropdown={openFilterDropdown}
                         setOpenFilterDropdown={setOpenFilterDropdown}
                       />
                       
                       {/* Subtasks */}
                       <SortableTableHeader 
                         column="subtasks" 
                         label="SUBTASKS" 
                         width="90px" 
                         align="center"
                         columnSorts={columnSorts}
                         setColumnSorts={setColumnSorts}
                         columnFilters={columnFilters}
                         setColumnFilters={setColumnFilters}
                         openFilterDropdown={openFilterDropdown}
                         setOpenFilterDropdown={setOpenFilterDropdown}
                       />
                       
                       {/* Tags */}
                       <SortableTableHeader 
                         column="tags" 
                         label="TAGS" 
                         width="120px" 
                         align="center"
                         columnSorts={columnSorts}
                         setColumnSorts={setColumnSorts}
                         columnFilters={columnFilters}
                         setColumnFilters={setColumnFilters}
                         openFilterDropdown={openFilterDropdown}
                         setOpenFilterDropdown={setOpenFilterDropdown}
                       />
                       
                       {/* Due Date */}
                       <SortableTableHeader 
                         column="dueDate" 
                         label="DUE DATE" 
                         width="120px" 
                         align="center"
                         columnSorts={columnSorts}
                         setColumnSorts={setColumnSorts}
                         columnFilters={columnFilters}
                         setColumnFilters={setColumnFilters}
                         openFilterDropdown={openFilterDropdown}
                         setOpenFilterDropdown={setOpenFilterDropdown}
                       />
                       
                       {/* Actions - Not sortable/filterable */}
                       <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ width: '100px' }}>
                         ACTIONS
                       </th>
                     </tr>
                   </thead>
                   
                   {/* Table Body */}
                   <tbody>
                     {filteredTasks.map((task, index) => (
                       <tr 
                         key={task.id} 
                         className={`cursor-pointer transition-all duration-200 hover:bg-gray-50 group border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`} 
                         onClick={() => handleTaskClick(task)}
                       >
                         {/* Task Name */}
                         <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200" style={{ width: '180px' }}>
                           <div className="truncate" title={task.title}>
                             <span className={task.status === 'Completed' ? 'line-through text-gray-500' : 'text-gray-900'}>
                               {task.title}
                             </span>
                           </div>
                         </td>
                         
                         {/* Project */}
                         <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200" style={{ width: '140px' }}>
                           <div className="truncate" title={task.project}>
                             {task.project}
                           </div>
                         </td>
                         
                         {/* Task Description */}
                         <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200" style={{ width: '220px' }}>
                           <div className="truncate" title={task.description}>
                             {task.description}
                           </div>
                         </td>
                         
                         {/* Status */}
                         <td className="px-4 py-3 text-center border-r border-gray-200" style={{ width: '100px' }}>
                           <Badge variant={getStatusConfig(task.status).color as any} size="sm" className="whitespace-nowrap">
                             {getStatusConfig(task.status).label}
                           </Badge>
                         </td>
                         
                         {/* Priority */}
                         <td className="px-4 py-3 text-center border-r border-gray-200" style={{ width: '100px' }}>
                           <Badge variant={getPriorityConfig(task.priority).color as any} size="sm" className="whitespace-nowrap">
                             {getPriorityConfig(task.priority).label}
                           </Badge>
                         </td>
                         
                         {/* Time */}
                         <td className="px-4 py-3 text-center text-sm text-gray-600 border-r border-gray-200" style={{ width: '80px' }}>
                           {task.estimatedHours}h
                         </td>
                         
                         {/* Comments */}
                         <td className="px-4 py-3 text-center text-sm text-gray-600 border-r border-gray-200" style={{ width: '90px' }}>
                           {(() => {
                             try {
                               const commentsArray = JSON.parse(task.comments);
                               return Array.isArray(commentsArray) ? commentsArray.length : parseInt(task.comments) || 0;
                             } catch (e) {
                               return parseInt(task.comments) || 0;
                             }
                           })()}
                         </td>
                         
                         {/* Subtasks */}
                         <td className="px-4 py-3 text-center text-sm text-gray-600 border-r border-gray-200" style={{ width: '90px' }}>
                           {(() => {
                             try {
                               const subtasksArray = JSON.parse(task.subtasks);
                               return Array.isArray(subtasksArray) ? subtasksArray.length : 0;
                             } catch (e) {
                               return 0;
                             }
                           })()}
                         </td>
                         
                         {/* Tags */}
                         <td className="px-4 py-3 text-center border-r border-gray-200" style={{ width: '120px' }}>
                           <div className="flex items-center justify-center gap-1 overflow-hidden">
                             {(task.tags || '').split(',').slice(0, 1).map((tag, index) => (
                               <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full whitespace-nowrap">
                                 {tag.trim()}
                               </span>
                             ))}
                             {(task.tags || '').split(',').length > 1 && (
                               <span className="px-2 py-1 bg-gray-200 text-gray-500 text-xs rounded-full">
                                 +{(task.tags || '').split(',').length - 1}
                               </span>
                             )}
                           </div>
                         </td>
                         
                         {/* Due Date */}
                         <td className="px-4 py-3 text-center text-sm border-r border-gray-200" style={{ width: '120px' }}>
                           <span className={isOverdue(task.dueDate) ? 'text-red-600 font-medium' : 'text-gray-600'}>
                             {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                           </span>
                         </td>
                         
                         {/* Actions */}
                         <td className="px-4 py-3 text-center" style={{ width: '100px' }}>
                           <div className="flex items-center justify-center">
                             <div className="relative">
                               <Button 
                                 variant="ghost" 
                                 size="sm"
                                 title="More Options"
                                 className="p-1 h-10 w-10 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:shadow-sm group-hover:opacity-100 opacity-100"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setOpenDropdown(openDropdown === task.id ? null : task.id);
                                 }}
                               >
                                 <MoreVertical size={20} className="text-gray-600" />
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
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
           </>
        ) : !isLoading && !error ? (
          /* Card View */
          <div className="w-full">
            {/* Mobile: Single Column with Simplified Cards */}
            <div className="block sm:hidden space-y-2">
              {filteredTasks.map((task) => (
                <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTaskClick(task)}>
                  <CardContent className="p-1 relative">
                    {/* Card actions - top right */}
                    <div className="absolute top-1 right-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        title="More Options"
                        className="p-1.5 h-10 w-10 hover:bg-gray-100 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === task.id ? null : task.id);
                        }}
                      >
                        <MoreVertical size={22} className="text-gray-600" />
                      </Button>
                      {openDropdown === task.id && (
                        <div 
                          data-dropdown-menu
                          className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(task);
                                setOpenDropdown(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete Task</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Mobile: Simplified Header */}
                    <div className="flex items-start space-x-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {(task.project || 'T').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1 pt-2 sm:pt-0">
                          {task.title}
                        </h4>
                        <p className="hidden">{task.project}</p>
                      </div>
                    </div>
                    
                    {/* Mobile: Key Info Only */}
                    <div className="space-y-1.5">
                      {/* Description - hidden on mobile card */}
                      <p className="hidden">{task.description}</p>

                      {/* Status, Project, Priority - Same line */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Status:</span>
                          <Badge variant={getStatusConfig(task.status).color as any} size="sm" className="text-xs">
                            {getStatusConfig(task.status).label}
                          </Badge>
                        </div>
                        <div className="text-gray-700 truncate mx-2 flex-1 text-center">
                          Project: {task.project}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Priority:</span>
                          <Badge variant={getPriorityConfig(task.priority).color as any} size="sm" className="text-xs">
                            {getPriorityConfig(task.priority).label}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Meta Row: Hours, Comments, Subtasks, Tags (single line) */}
                      <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded px-3 py-2">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{task.estimatedHours}h</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare size={12} />
                          <span>{(() => {
                            try {
                              const commentsArray = JSON.parse(task.comments);
                              return Array.isArray(commentsArray) ? commentsArray.length : parseInt(task.comments) || 0;
                            } catch (e) {
                              return parseInt(task.comments) || 0;
                            }
                          })()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckSquare size={12} />
                          <span>{(() => {
                            try {
                              const subtasksArray = JSON.parse(task.subtasks);
                              return Array.isArray(subtasksArray) ? subtasksArray.length : 0;
                            } catch (e) {
                              return 0;
                            }
                          })()}</span>
                        </div>
                        {task.tags && task.tags.trim() && (
                          <div className="flex items-center gap-1">
                            <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-[10px] rounded">
                              {(task.tags || '').split(',').slice(0, 1).map((tag) => tag.trim()).join('')}
                            </span>
                            {(task.tags || '').split(',').length > 1 && (
                              <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-[10px] rounded">
                                +{(task.tags || '').split(',').length - 1}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bottom: Assigned Users Avatars with Due on right */}
                      {(() => {
                        const assignedUsers = getAssignedUsers(task);
                        return assignedUsers.length > 0 ? (
                          <div className="flex items-center justify-between">
                            <AssigneeAvatars names={assignedUsers} maxVisible={2} />
                            <div className="flex items-center space-x-1 text-xs">
                              <Calendar size={12} />
                              <span className={`${isOverdue(task.dueDate) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop: Improved Multi-Column Grid */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
            {filteredTasks.map((task) => (
              <Card key={task.id} hover className="cursor-pointer h-fit" onClick={() => handleTaskClick(task)}>
                <CardContent className="p-1 relative">
                  {/* Card actions - top right */}
                  <div className="absolute top-0 right-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      title="More Options"
                      className="p-1.5 h-10 w-10 hover:bg-gray-100 rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdown(openDropdown === task.id ? null : task.id);
                      }}
                    >
                      <MoreVertical size={22} className="text-gray-600" />
                    </Button>
                    {openDropdown === task.id && (
                      <div 
                        data-dropdown-menu
                        className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task);
                              setOpenDropdown(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Task</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {/* Header with Project Icon and Title */}
                    <div className="flex items-start space-x-2">
                      <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {(task.project || 'T').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1">{task.title}</h4>
                        <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">{task.description}</p>
                      </div>
                    </div>
                    
                    {/* Status, Project, Priority - Same Line */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Status:</span>
                        <Badge variant={getStatusConfig(task.status).color as any} size="sm" className="text-xs">
                          {getStatusConfig(task.status).label}
                        </Badge>
                      </div>
                      <div className="text-gray-700 truncate mx-2 flex-1 text-center">
                        Project: {task.project}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Priority:</span>
                        <Badge variant={getPriorityConfig(task.priority).color as any} size="sm" className="text-xs">
                          {getPriorityConfig(task.priority).label}
                        </Badge>
                      </div>
                    </div>
                      
                    {/* Meta Info Row - Hour, Comment, Subtask, Tags */}
                    <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded px-3 py-2">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{task.estimatedHours}h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare size={12} />
                        <span>{(() => {
                          try {
                            const commentsArray = JSON.parse(task.comments);
                            return Array.isArray(commentsArray) ? commentsArray.length : parseInt(task.comments) || 0;
                          } catch (e) {
                            return parseInt(task.comments) || 0;
                          }
                        })()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckSquare size={12} />
                        <span>{(() => {
                          try {
                            const subtasksArray = JSON.parse(task.subtasks);
                            return Array.isArray(subtasksArray) ? subtasksArray.length : 0;
                          } catch (e) {
                            return 0;
                          }
                        })()}</span>
                      </div>
                      {/* Tags in the same row */}
                      {task.tags && task.tags.trim() && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span className="text-xs">
                            {(task.tags || '').split(',').slice(0, 1).map((tag, index) => (
                              <span key={index} className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                                {tag.trim()}
                              </span>
                            ))}
                            {(task.tags || '').split(',').length > 1 && (
                              <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-xs rounded ml-1">
                                +{(task.tags || '').split(',').length - 1}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                      
                    {/* Bottom Section - Assigned Users Avatars with Due on right */}
                    {(() => {
                      const assignedUsers = getAssignedUsers(task);
                      return assignedUsers.length > 0 ? (
                        <div className="flex items-center justify-between">
                          <AssigneeAvatars names={assignedUsers} maxVisible={3} />
                          <div className="flex items-center space-x-1 text-xs">
                            <Calendar size={12} />
                            <span className={`${isOverdue(task.dueDate) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
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

      {/* Task Form - Modal on desktop, slide-up on mobile */}
      {isTaskFormOpen && (
        <div 
          className={`fixed inset-0 z-50 flex items-end lg:items-center justify-center transition-opacity duration-300 ${
            isFormAnimating ? 'bg-opacity-0' : 'bg-black/70 bg-opacity-50'
          }`}
          style={{ backdropFilter: 'blur(2px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleTaskFormCancel();
            }
          }}
        >
          <div 
            ref={taskFormRef}
            className={`bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl w-full transform transition-all duration-300 ease-out ${
              isFormAnimating ? 'translate-y-full lg:translate-y-0 lg:scale-95' : 'translate-y-0 lg:scale-100'
            } lg:max-w-4xl lg:w-auto`}
            style={{ 
              width: '100%',
              height: `${formHeight}vh`,
              maxHeight: '90vh',
              boxShadow: '0 -10px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <TaskForm
              task={selectedTask || undefined}
              onSubmit={handleTaskFormSubmit}
              onCancel={handleTaskFormCancel}
              isEditing={!!selectedTask}
              isCreatingSubtask={isCreatingSubtask}
              projects={allProjects.map(project => project.name)}
              teams={allTeams}
              users={allUsers}
              isLoadingUsers={isLoadingUsers}
              isLoadingTeams={isLoadingTeams}
              formHeight={formHeight}
              isDragging={isDragging}
              onMouseDown={handleMouseDown}
              currentUser={user || undefined}
            />
          </div>
        </div>
      )}

      {/* Task Preview - Modal on desktop, slide-up on mobile */}
      {isTaskPreviewOpen && selectedTask && (
        <div className={`fixed inset-0 z-50 flex items-end lg:items-center justify-center transition-opacity duration-300 ${
          isPreviewAnimating ? 'bg-opacity-0' : 'bg-black/70 bg-opacity-50'
        }`}
        style={{ backdropFilter: 'blur(2px)' }}>
          <div 
            ref={taskPreviewRef}
            data-task-preview
            className={`transform transition-all duration-300 ease-out ${
              isPreviewAnimating ? 'translate-y-full lg:translate-y-0 lg:scale-95' : 'translate-y-0 lg:scale-100'
            } w-full lg:max-w-4xl lg:w-auto`}
            style={{ 
              width: '100%',
              height: `${formHeight}vh`,
              maxHeight: '90vh',
              boxShadow: '0 -10px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div 
              data-task-preview-content
              className="bg-white dark:bg-gray-800 rounded-t-2xl lg:rounded-2xl shadow-2xl overflow-y-auto scrollbar-hide w-full pb-20 sm:pb-6"
              style={{ 
                height: `${formHeight}vh`,
                boxShadow: '0 -10px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              {/* Drag Handle - Sticky */}
              <div 
                className={`sticky top-0 z-20 w-full h-6 flex items-center justify-center cursor-row-resize hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors sm:hidden ${isDragging ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                onMouseDown={handleMouseDown}
              >
                <div className="w-12 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
              </div>
              
              <div className="p-4 sm:p-6">
                {/* Task Preview Header */}
                <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {/* Back Button (always visible) */}
                    <button
                      onClick={handleBack}
                      className="w-10 h-10 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors group"
                      title="Go back"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-white" />
                    </button>
                    
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{selectedTask.title}</h2>
                      <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                        Task Details
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleEditTask(selectedTask)}
                      className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl flex items-center justify-center shadow-lg transition-all group"
                      title="Edit Task"
                    >
                      <Edit className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </button>
                  </div>
                </div>

                {/* Task Details */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Basic Info */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-6 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Description</label>
                        <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base break-words">{selectedTask.description}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Project</label>
                        <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">{selectedTask.project}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status and Priority */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-6 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Status</label>
                        <Badge variant={getStatusConfig(selectedTask.status).color as any} size="md" className="text-xs sm:text-sm">
                          {getStatusIcon(selectedTask.status)}
                          <span className="ml-2">{getStatusConfig(selectedTask.status).label}</span>
                        </Badge>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Priority</label>
                        <Badge variant={getPriorityConfig(selectedTask.priority).color as any} size="md" className="text-xs sm:text-sm">
                          {getPriorityIcon(selectedTask.priority)}
                          <span className="ml-2">{getPriorityConfig(selectedTask.priority).label}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Dates and Time */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-6 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Start Date</label>
                        <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">{new Date(selectedTask.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Due Date</label>
                        <p className={`text-sm sm:text-base ${isOverdue(selectedTask.dueDate) ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
                          {new Date(selectedTask.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="sm:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Estimated Time</label>
                        <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">{selectedTask.estimatedHours} hours</p>
                      </div>
                    </div>
                  </div>

                  {/* Assignment */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-6 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                                    .filter((user: any) => {
                                      const userName = user.name || user.username || user.email;
                                      return userName && userName.toLowerCase().includes(userSearch.toLowerCase());
                                    })
                                    .map((user: any) => {
                                      const userName = user.name || user.username || user.email;
                                      return (
                                        <div key={user.id || user.userId} className="flex items-center justify-between px-3 py-2 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-lg transition-colors">
                                          <div className="flex items-center space-x-2 flex-1">
                                            <Avatar name={userName} size="sm" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{userName}</span>
                                          </div>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleAddUserToPending(user.id || user.userId);
                                            }}
                                            disabled={pendingUsers.includes(user.id || user.userId)}
                                            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                                          >
                                            {pendingUsers.includes(user.id || user.userId) ? 'Added' : 'Add'}
                                          </button>
                                        </div>
                                      );
                                    })}
                                  {getAvailableUsers().filter((user: any) => {
                                    const userName = user.name || user.username || user.email;
                                    return userName && userName.toLowerCase().includes(userSearch.toLowerCase());
                                  }).length === 0 && (
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
                              selectedTask.assignedUsers.map((userId, index) => {
                                const user = allUsers.find(u => (u.id || u.userId) === userId);
                                return (
                                  <div key={`assigned-user-${index}`} className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-full text-sm">
                                    <Avatar name={user?.name || user?.username || user?.email || userId} size="sm" />
                                    <span>{user?.name || user?.username || user?.email || userId}</span>
                                    <button
                                      onClick={() => handleRemoveUserClick(userId)}
                                      className="ml-1 p-0.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                      title="Remove user"
                                    >
                                      <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                                    </button>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                                <span className="text-gray-600 dark:text-gray-300">No users assigned</span>
                              </div>
                            )}
                      </div>

                          {/* Pending Users */}
                          {pendingUsers.length > 0 && (
                      <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Pending additions:</p>
                              <div className="flex flex-wrap gap-2">
                                {pendingUsers.map((userId, index) => {
                                  const user = allUsers.find(u => (u.id || u.userId) === userId);
                                  const userName = user?.name || user?.username || user?.email || userId;
                                  return (
                                    <div key={`pending-user-${index}`} className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full text-sm">
                                      <Avatar name={userName} size="sm" />
                                      <span>{userName}</span>
                                      <button
                                        onClick={() => handleRemoveUserFromPending(userId)}
                                        className="ml-1 p-0.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                        title="Remove from pending"
                                      >
                                        <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                                      </button>
                                    </div>
                                  );
                                })}
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
                                            handleAddTeamToPending(team.id);
                                          }}
                                          disabled={pendingTeams.includes(team.id)}
                                          className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                                        >
                                          {pendingTeams.includes(team.id) ? 'Added' : 'Add'}
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
                              selectedTask.assignedTeams.map((teamId, index) => {
                                const team = allTeams.find(t => t.id === teamId);
                                return (
                                  <div key={`assigned-team-${index}`} className="flex items-center space-x-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-full text-sm">
                                    <Users className="w-3 h-3" />
                                    <span>{team?.name || teamId}</span>
                                    <button
                                      onClick={() => handleRemoveTeam(teamId)}
                                      className="ml-1 p-0.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                      title="Remove team"
                                    >
                                      <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                                    </button>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">Not assigned</p>
                            )}
                          </div>

                          {/* Pending Teams */}
                          {pendingTeams.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Pending additions:</p>
                              <div className="flex flex-wrap gap-2">
                                {pendingTeams.map((teamId, index) => {
                                  const team = allTeams.find(t => t.id === teamId);
                                  const teamName = team?.name || teamId;
                                  return (
                                    <div key={`pending-team-${index}`} className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full text-sm">
                                      <Users className="w-3 h-3" />
                                      <span>{teamName}</span>
                                      <button
                                        onClick={() => handleRemoveTeamFromPending(teamId)}
                                        className="ml-1 p-0.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                        title="Remove from pending"
                                      >
                                        <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                                      </button>
                                    </div>
                                  );
                                })}
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
                          {(selectedTask.tags || '').split(',').map((tag, index) => (
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
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            placeholder="Write a comment..."
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddComment();
                              }
                            }}
                          />
                            <button
                            onClick={handleAddComment}
                            disabled={!newComment.trim() || isPostingComment}
                              className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                              title="Post comment"
                          >
                            {isPostingComment ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <MessageSquare className="w-4 h-4 text-white" />
                            )}
                            </button>
                        </div>
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
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
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
                                <div className="flex-1 min-w-0 pr-2">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white break-words line-clamp-2">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 flex-shrink-0">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 bg-opacity-50"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 bg-opacity-50"
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