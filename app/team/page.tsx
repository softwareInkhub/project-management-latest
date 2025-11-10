'use client';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../services/api';
import { 
  Plus, 
  MoreVertical, 
  Search, 
  Filter, 
  Users,
  User,
  Calendar,
  DollarSign,
  Tag,
  Edit,
  Trash2,
  Eye,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  FileCode
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Avatar } from '../components/ui/Avatar';
import { StatsCard } from '../components/ui/StatsCard';
import { SearchFilterSection } from '../components/ui/SearchFilterSection';
import { ViewToggle } from '../components/ui/ViewToggle';
import { AppLayout } from '../components/AppLayout';
import { useTabs } from '../hooks/useTabs';
import { useSidebar } from '../components/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { useToast, ToastContainer } from '../components/ui/Toast';
import { CreateButton, UpdateButton, DeleteButton, ReadOnlyBadge, usePermissions } from '../components/RoleBasedUI';
import { formatEmailForDisplay, formatUserDisplayName } from '../utils/emailUtils';

// Team interfaces
interface TeamMember {
  id: string;
  name: string;
  email?: string;
  role: 'admin' | 'member' | 'viewer';
}

interface Team {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[] | string;
  memberCount?: number;
  projects?: string[];
  budget?: string;
  startDate?: string;
  archived?: boolean;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Helper functions
const getTeamCount = (members: TeamMember[] | string | undefined): number => {
  if (!members) return 0;
  if (Array.isArray(members)) return members.length;
  if (typeof members === 'string' && members.trim()) {
    try {
      return JSON.parse(members).length;
    } catch {
      return 0;
    }
  }
  return 0;
};

const parseMembers = (members: TeamMember[] | string | undefined): TeamMember[] => {
  if (!members) return [];
  if (Array.isArray(members)) return members;
  if (typeof members === 'string' && members.trim()) {
    try {
      return JSON.parse(members);
    } catch {
      return [];
    }
  }
  return [];
};

// Return a stable unique identifier for a user coming from various backends
// Prefers canonical ids, falls back to unique contact fields
const getStableUserId = (user: any): string => {
  const id = user?.id || user?.userId || user?._id || user?.email || user?.username || user?.name;
  return String(id || '');
};

  const parseTags = (tags: string[] | string | undefined): string[] => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string' && tags.trim()) {
      try {
        return JSON.parse(tags);
      } catch {
        return [];
      }
    }
    return [];
  };

  // Helper function to generate avatar colors
  const getAvatarColor = (index: number) => {
    const colors = [
      'from-purple-500 to-purple-600',
      'from-blue-500 to-blue-600', 
      'from-green-500 to-green-600',
      'from-pink-500 to-pink-600',
      'from-orange-500 to-orange-600',
      'from-indigo-500 to-indigo-600',
      'from-teal-500 to-teal-600',
      'from-red-500 to-red-600'
    ];
    return colors[index % colors.length];
  };

  // Component for overlapping member avatars
  const MemberAvatars = ({ members, maxVisible = 2 }: { members: any[], maxVisible?: number }) => {
    const visibleMembers = members.slice(0, maxVisible);
    const remainingCount = Math.max(0, members.length - maxVisible);
    
    return (
      <div className="flex items-center">
        <div className="flex -space-x-2">
          {visibleMembers.map((member, index) => (
            <div
              key={member.id || member.name || index}
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(index)} flex items-center justify-center text-white text-xs font-semibold border-2 border-white shadow-sm`}
              title={member.name}
            >
              {member.name ? member.name.charAt(0).toUpperCase() : '?'}
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center text-gray-600 text-xs font-semibold">
              +{remainingCount}
            </div>
          )}
        </div>
      </div>
    );
  };

const getRoleColor = (role: string) => {
  switch (role) {
    case 'admin': return 'danger';
    case 'member': return 'info';
    case 'viewer': return 'default';
    default: return 'default';
  }
};

const getStatusColor = (archived: boolean) => {
  return archived ? 'default' : 'success';
};

const TeamsPage = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isTeamDetailsOpen, setIsTeamDetailsOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  
  // JSON view toggle
  const [isJsonViewActive, setIsJsonViewActive] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [usersSearch, setUsersSearch] = useState('');
  const [showUsersDropdown, setShowUsersDropdown] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [formHeight, setFormHeight] = useState(80); // Default 80vh
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [openMenuTeamId, setOpenMenuTeamId] = useState<string | null>(null);
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
    startDate: new Date().toISOString().slice(0, 10),
    tags: [] as string[],
    members: [] as TeamMember[]
  });
  
  // Quick filter state
  const [quickFilterValues, setQuickFilterValues] = useState<Record<string, string | string[] | { from: string; to: string }>>({
    status: [],
    tags: [],
    dateRange: 'all'
  });
  const [visibleFilterColumns, setVisibleFilterColumns] = useState<string[]>(['status', 'tags', 'dateRange']);
  
  const { hasPermission, user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { toasts, removeToast, success, error } = useToast();
  const userSearchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get unique tags from all teams
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    teams.forEach(team => {
      const teamTags = parseTags(team.tags);
      teamTags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [teams]);

  // Handler for quick filter changes
  const handleQuickFilterChange = (key: string, value: string | string[] | { from: string; to: string }) => {
    setQuickFilterValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Fetch teams from API
  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('📋 Fetching teams...');
      const res = await apiService.getTeams();
      
      if (res.success && res.data) {
        console.log('✅ Teams fetched:', res.data.length);
        // Normalize teams data
        const normalized = res.data.map((t: any) => {
          const members = parseMembers(t.members);
          return {
            ...t,
            members,
            memberCount: members.length
          };
        });
        setTeams(normalized);
      } else {
        console.error('❌ Failed to fetch teams:', res.error);
        error('Fetch Failed', `Failed to fetch teams: ${res.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('❌ Error fetching teams:', err);
      error('Unexpected Error', 'An unexpected error occurred while fetching teams');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load teams on mount
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Fetch users for team creation
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      console.log('👥 Fetching users...');
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
  }, []);

  // Load users when create modal opens
  useEffect(() => {
    if (isCreateTeamOpen) {
      fetchUsers();
    }
  }, [isCreateTeamOpen, fetchUsers]);

  // Track desktop breakpoint for modal sizing/behavior
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  // Filter teams with quick filters
  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      // Search filter
      const matchesSearch = !searchTerm.trim() || 
        (team.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (team.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter (from dropdown)
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && !team.archived) ||
        (statusFilter === 'archived' && team.archived);
      
      // Quick filter: Status
      const statusQuickFilter = quickFilterValues.status as string[];
      const matchesStatusQuick = !statusQuickFilter || statusQuickFilter.length === 0 || 
        (statusQuickFilter.includes('active') && !team.archived) ||
        (statusQuickFilter.includes('archived') && team.archived);
      
      // Quick filter: Tags
      const tagsQuickFilter = quickFilterValues.tags as string[];
      const teamTags = parseTags(team.tags);
      const matchesTags = !tagsQuickFilter || tagsQuickFilter.length === 0 ||
        teamTags.some(tag => tagsQuickFilter.includes(tag));
      
      // Quick filter: Date Range (same logic as Task section)
      const dateRangeValue = quickFilterValues.dateRange;
      let matchesDateRange = true;
      
      if (dateRangeValue && dateRangeValue !== 'all') {
        const teamDate = new Date(team.startDate || team.createdAt || '');
        teamDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Handle custom date range object
        if (typeof dateRangeValue === 'object' && 'from' in dateRangeValue && 'to' in dateRangeValue) {
          const fromDate = new Date(dateRangeValue.from);
          fromDate.setHours(0, 0, 0, 0);
          const toDate = new Date(dateRangeValue.to);
          toDate.setHours(23, 59, 59, 999);
          matchesDateRange = teamDate >= fromDate && teamDate <= toDate;
        } else if (typeof dateRangeValue === 'string') {
          // Handle preset date ranges
          if (dateRangeValue === 'today') {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            matchesDateRange = teamDate >= today && teamDate < tomorrow;
          } else if (dateRangeValue === 'thisWeek') {
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() + 7);
            matchesDateRange = teamDate >= today && teamDate < weekEnd;
          } else if (dateRangeValue === 'thisMonth') {
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            matchesDateRange = teamDate >= today && teamDate <= monthEnd;
          } else if (dateRangeValue === 'week') {
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDateRange = teamDate >= weekAgo;
          } else if (dateRangeValue === 'month') {
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDateRange = teamDate >= monthAgo;
          }
        }
      }
      
      return matchesSearch && matchesStatus && matchesStatusQuick && matchesTags && matchesDateRange;
    });
  }, [teams, searchTerm, statusFilter, quickFilterValues]);

  // Stats
  const stats = useMemo(() => {
    const total = teams.length;
    const active = teams.filter(t => !t.archived).length;
    const archived = teams.filter(t => t.archived).length;
    const totalMembers = teams.reduce((sum, t) => sum + (t.memberCount || 0), 0);
    return { total, active, archived, totalMembers };
  }, [teams]);

  // Handle opening create team modal
  const handleOpenCreateTeam = () => {
    setFormHeight(80); // Reset to default height
    setEditingTeam(null);
    resetForm();
    setIsCreateTeamOpen(true);
  };

  // Handle opening edit team modal
  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    const members = parseMembers(team.members);
    setTeamForm({
      name: team.name,
      description: team.description || '',
      startDate: team.startDate || new Date().toISOString().slice(0, 10),
      tags: parseTags(team.tags),
      members: members
    });
    setFormHeight(80);
    setIsCreateTeamOpen(true);
    setOpenMenuTeamId(null);
  };

  // Handle team creation/update
  const handleCreateTeam = async () => {
    if (!teamForm.name.trim()) {
      error('Validation Error', 'Please enter team name');
      return;
    }

    try {
      const payload = {
        name: teamForm.name.trim(),
        description: teamForm.description.trim(),
        members: teamForm.members,
        startDate: teamForm.startDate,
        tags: teamForm.tags
      };

      let res;
      if (editingTeam) {
        console.log('✏️ Updating team:', payload);
        res = await apiService.updateTeam(editingTeam.id, payload);
      } else {
        console.log('🆕 Creating team:', payload);
        res = await apiService.createTeam(payload);
      }
      
      if (res.success) {
        console.log('✅ Team saved successfully:', res.data);
        setIsCreateTeamOpen(false);
        resetForm();
        setEditingTeam(null);
        fetchTeams(); // Refresh teams list
        success(
          editingTeam ? 'Team Updated' : 'Team Created',
          `Team "${teamForm.name}" has been ${editingTeam ? 'updated' : 'created'} successfully!`
        );
      } else {
        console.error('❌ Failed to save team:', res.error);
        error('Save Failed', `Failed to ${editingTeam ? 'update' : 'create'} team: ${res.error}`);
      }
    } catch (err) {
      console.error('❌ Error saving team:', err);
      error('Unexpected Error', `An unexpected error occurred while ${editingTeam ? 'updating' : 'creating'} team`);
    }
  };

  // Handle team deletion
  const handleDeleteTeam = async (team: Team) => {
    if (!window.confirm(`Are you sure you want to delete "${team.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await apiService.deleteTeam(team.id);
      if (res.success) {
        setTeams(prev => prev.filter(t => t.id !== team.id));
        success('Team Deleted', `Team "${team.name}" has been deleted successfully`);
      } else {
        error('Deletion Failed', `Failed to delete team: ${res.error}`);
      }
    } catch (err) {
      console.error('❌ Error deleting team:', err);
      error('Unexpected Error', 'An unexpected error occurred while deleting team');
    }
  };

  // Handle team menu
  const handleTeamMenu = (team: Team) => {
    if (!hasPermission('crud:projectmanagement')) {
      setSelectedTeam(team);
      setIsTeamDetailsOpen(true);
      setIsJsonViewActive(false); // Reset JSON view when opening modal
      return;
    }

    const options = [
      { text: 'View Details', onPress: () => { setSelectedTeam(team); setIsTeamDetailsOpen(true); setIsJsonViewActive(false); } },
      { text: 'Edit', onPress: () => { /* TODO: Implement edit */ } },
      { text: 'Delete', style: 'destructive' as const, onPress: () => handleDeleteTeam(team) }
    ];

    // For now, just show details
    setSelectedTeam(team);
    setIsTeamDetailsOpen(true);
    setIsJsonViewActive(false); // Reset JSON view when opening modal
  };

  // Reset form
  const resetForm = () => {
    setTeamForm({
      name: '',
      description: '',
      startDate: new Date().toISOString().slice(0, 10),
      tags: [],
      members: []
    });
    setTagInput('');
    setUsersSearch('');
    setShowUsersDropdown(false);
    setEditingTeam(null);
  };

  // Add tag
  const addTag = () => {
    const value = tagInput.trim();
    if (!value) return;
    
    setTeamForm(prev => ({
      ...prev,
      tags: Array.from(new Set([...prev.tags, value]))
    }));
    setTagInput('');
  };

  // Remove tag
  const removeTag = (index: number) => {
    setTeamForm(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  // Add member
  const addMember = (user: any) => {
  const userName = formatUserDisplayName(user.name, user.username, user.email);
  const memberId = getStableUserId(user);
  if (!memberId) return; // cannot add without a stable id
  const alreadyAdded = teamForm.members.some(m => m.id === memberId);
    if (alreadyAdded) return;

    const member: TeamMember = {
    id: memberId,
      name: userName,
      email: user.email,
      role: 'member'
    };

    setTeamForm(prev => ({
      ...prev,
      members: [...prev.members, member]
    }));
    setShowUsersDropdown(false);
    setUsersSearch('');
  };

  // Remove member
  const removeMember = (memberId: string) => {
    setTeamForm(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== memberId)
    }));
  };

  // Filter users for dropdown
const filteredUsers = allUsers.filter(user => {
  const userName = formatUserDisplayName(user.name, user.username, user.email);
  const query = usersSearch.trim().toLowerCase();
  
  // Exclude already selected members by stable id
  const candidateId = getStableUserId(user);
  const isAlreadySelected = teamForm.members.some(m => m.id === candidateId);
  if (isAlreadySelected) return false;
  
  // Apply search filter
  if (!query) return true;
  const searchString = `${user.name || ''} ${user.username || ''} ${user.email || ''}`.toLowerCase();
  return searchString.includes(query);
});

  // Debug: Log users when they change
  useEffect(() => {
    if (allUsers.length > 0) {
      console.log('👥 Available users:', allUsers);
    }
  }, [allUsers]);

  // Drag handlers for form height
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const windowHeight = window.innerHeight;
    const newHeight = ((windowHeight - e.clientY) / windowHeight) * 100;
    const clampedHeight = Math.max(30, Math.min(90, newHeight));
    setFormHeight(clampedHeight);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close users dropdown if clicking outside
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          userSearchRef.current && !userSearchRef.current.contains(event.target as Node)) {
        setShowUsersDropdown(false);
      }
      
      // Close team menu dropdown if clicking outside
      const target = event.target as HTMLElement;
      const isClickInsideMenu = target.closest('[data-team-menu]') || target.closest('[data-team-menu-button]');
      if (!isClickInsideMenu && openMenuTeamId !== null) {
        setOpenMenuTeamId(null);
      }
    };

    if (showUsersDropdown || openMenuTeamId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUsersDropdown, openMenuTeamId]);

  // Close team menu on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenuTeamId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <AppLayout>
      {/* Tooltip Styles */}
      <style jsx>{`
        .tooltip-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        .tooltip-wrapper .tooltip-content {
          visibility: hidden;
          opacity: 0;
          position: absolute;
          z-index: 9999;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(31, 41, 55, 0.95);
          color: white;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          white-space: nowrap;
          transition: opacity 0.2s ease, visibility 0.2s ease;
          pointer-events: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .tooltip-wrapper .tooltip-content::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: rgba(31, 41, 55, 0.95);
        }
        .tooltip-wrapper:hover .tooltip-content {
          visibility: visible;
          opacity: 1;
        }
        @media (max-width: 640px) {
          .tooltip-wrapper .tooltip-content {
            font-size: 11px;
            padding: 5px 10px;
          }
        }
      `}</style>
      <div className="w-full h-full px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-4 overflow-x-hidden">

        {/* Search and Filters */}
        <SearchFilterSection
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search teams..."
          variant="modern"
          showActiveFilters={true}
          hideFilterIcon={true}
          visibleFilterColumns={visibleFilterColumns}
          onFilterColumnsChange={setVisibleFilterColumns}
          quickFilters={[
            {
              key: 'status',
              label: 'Status',
              icon: <CheckCircle className="w-4 h-4 text-green-500" />,
              options: [
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'archived', label: 'Archived' }
              ],
              type: 'default',
              multiple: true
            },
            {
              key: 'tags',
              label: 'Tags',
              icon: <Tag className="w-4 h-4 text-orange-500" />,
              options: [
                { value: 'all', label: 'All Tags' },
                ...allTags.map(tag => ({ value: tag, label: tag }))
              ],
              type: 'default',
              multiple: true
            },
            {
              key: 'dateRange',
              label: 'Start Date',
              icon: <Calendar className="w-4 h-4 text-blue-500" />,
              options: [
                { value: 'all', label: 'All Time' },
                { value: 'today', label: 'Today' },
                { value: 'thisWeek', label: 'This Week' },
                { value: 'thisMonth', label: 'This Month' },
                { value: 'next7Days', label: 'Next 7 Days' }
              ],
              type: 'date'
            }
          ]}
          quickFilterValues={quickFilterValues}
          onQuickFilterChange={handleQuickFilterChange}
          availableFilterColumns={[
            { key: 'status', label: 'Status', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
            { key: 'tags', label: 'Tags', icon: <Tag className="w-4 h-4 text-orange-500" /> },
            { key: 'dateRange', label: 'Start Date', icon: <Calendar className="w-4 h-4 text-blue-500" /> }
          ]}
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
                value: 'grid',
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
            onChange: (view: 'list' | 'grid') => setViewMode(view)
          }}
          filters={[
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'archived', label: 'Archived' }
              ]
            }
          ]}
          actionButton={{
            label: 'New Team',
            onClick: handleOpenCreateTeam
          }}
        />

        {/* Teams Grid/List */}
        {viewMode === 'list' ? (
          <div className="pt-0 sm:pt-3 md:pt-0 space-y-3 pb-4">
            {filteredTeams.map((team, index) => {
              const tagsArray = parseTags(team.tags);
              const teamMembers = parseMembers(team.members);
              
              return (
              <div key={team.id || `team-${index}`} className="relative bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 p-4 cursor-pointer hover:z-50" style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }} onClick={() => handleTeamMenu(team)}>
                {/* Top Row - Icon, Title/Description, More Menu */}
                <div className="flex items-start gap-3 mb-0">
                  {/* Team Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Team Title + Desktop Meta Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-9">
                      {/* Title */}
                      <div className="sm:flex-shrink-0">
                        <div className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                          {team.name || 'Untitled Team'}
                        </div>
                      </div>

                      {/* Desktop Meta Details */}
                      <div className="hidden sm:flex flex-wrap items-center gap-x-2 gap-y-1 text-xs flex-1">
                        {/* Status */}
                        <div className="tooltip-wrapper">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-800 font-semibold">Status:</span>
                            <Badge variant={getStatusColor(team.archived || false)} size="sm" className="px-2.5 py-1">
                              {team.archived ? 'Archived' : 'Active'}
                            </Badge>
                          </div>
                          <div className="tooltip-content">Current Status: {team.archived ? 'Archived' : 'Active'}</div>
                        </div>

                        {/* Members */}
                        <div className="tooltip-wrapper">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-800 font-semibold">Members:</span>
                            {teamMembers.length > 0 ? (
                              <div className="flex -space-x-2">
                                {teamMembers.slice(0, 3).map((member, idx) => (
                                  <div
                                    key={member.id || idx}
                                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(idx)} flex items-center justify-center text-white text-xs font-semibold border-2 border-white shadow-sm`}
                                    title={member.name}
                                  >
                                    {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                                  </div>
                                ))}
                                {teamMembers.length > 3 && (
                                  <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center text-gray-600 text-xs font-semibold">
                                    +{teamMembers.length - 3}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">None</span>
                            )}
                          </div>
                          <div className="tooltip-content">
                            Members: {teamMembers.length > 0 ? teamMembers.map(m => m.name).join(', ') : 'None'}
                          </div>
                        </div>

                        {/* Tags */}
                        {tagsArray.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-800 font-semibold">Tags:</span>
                            <div className="flex items-center gap-1">
                              {tagsArray.slice(0, 2).map((tag, i) => (
                                <div key={i} className="tooltip-wrapper">
                                  <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-md font-medium">
                                    {tag}
                                  </span>
                                  <div className="tooltip-content">Tag: {tag}</div>
                                </div>
                              ))}
                              {tagsArray.length > 2 && (
                                <div className="tooltip-wrapper">
                                  <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-md text-xs">
                                    +{tagsArray.length - 2}
                                  </span>
                                  <div className="tooltip-content">
                                    {tagsArray.length - 2} more tag{tagsArray.length - 2 !== 1 ? 's' : ''}: {tagsArray.slice(2).join(', ')}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Created Date */}
                        {team.createdAt && (
                          <div className="tooltip-wrapper">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-500" />
                              <span className="text-gray-700 font-medium">
                                {new Date(team.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <div className="tooltip-content">
                              Created: {new Date(team.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Mobile Description */}
                    {team.description && (
                      <div className="sm:hidden mt-1">
                        <div className="text-xs text-gray-600 truncate">
                          {team.description.length > 30 ? team.description.substring(0, 30) + '..' : team.description}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* More Options Menu */}
                  <div className={`flex-shrink-0 relative ${openMenuTeamId === team.id ? 'z-50' : 'z-20'}`} onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="More Options"
                        className="p-2 h-10 w-10 text-gray-400 hover:text-gray-600"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setOpenMenuTeamId(openMenuTeamId === team.id ? null : team.id); 
                        }}
                      >
                        <MoreVertical size={24} />
                      </Button>
                      {openMenuTeamId === team.id && (
                        <div 
                          data-team-menu
                          className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-[100]" 
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button 
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 rounded-t-xl flex items-center gap-2 text-sm font-normal text-gray-800" 
                            onClick={(e) => {e.stopPropagation(); handleTeamMenu(team); setOpenMenuTeamId(null);}}
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                          <UpdateButton
                            resource="teams"
                            onClick={(e) => {e?.stopPropagation(); handleEdit(team); setOpenMenuTeamId(null);}}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2 text-sm font-normal text-gray-800"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </UpdateButton>
                          <DeleteButton
                            resource="teams"
                            onClick={(e) => { e?.stopPropagation(); handleDeleteTeam(team); setOpenMenuTeamId(null); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 rounded-b-xl flex items-center gap-2 text-sm font-normal text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </DeleteButton>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop Description */}
                {team.description && (
                  <div className="hidden sm:block pl-[52px] -mt-2">
                    <div className="inline-block">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-800 font-semibold">Description:</span>
                        <span className="px-2.5 py-1 font-medium text-xs truncate max-w-2xl inline-block">
                          {team.description.length > 100 ? team.description.substring(0, 100) + '...' : team.description}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Row - Mobile Meta Details */}
                <div className="pl-[52px] mt-1 sm:hidden">
                  <div className="space-y-1.5">
                    {/* Row 1: Status, Tags, Date */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                      {/* Status */}
                      <div className="tooltip-wrapper">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-800 font-semibold">Status:</span>
                          <Badge variant={getStatusColor(team.archived || false)} size="sm" className="px-2 py-0.5 text-xs">
                            {team.archived ? 'Archived' : 'Active'}
                          </Badge>
                        </div>
                        <div className="tooltip-content">Current Status: {team.archived ? 'Archived' : 'Active'}</div>
                      </div>

                      {/* Tags */}
                      {tagsArray.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-800 font-semibold">Tags:</span>
                          <div className="tooltip-wrapper">
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md font-medium">
                              {tagsArray[0]}
                            </span>
                            <div className="tooltip-content">Tag: {tagsArray[0]}</div>
                          </div>
                          {tagsArray.length > 1 && (
                            <div className="tooltip-wrapper">
                              <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded-md text-xs">
                                +{tagsArray.length - 1}
                              </span>
                              <div className="tooltip-content">
                                {tagsArray.length - 1} more tag{tagsArray.length - 1 !== 1 ? 's' : ''}: {tagsArray.slice(1).join(', ')}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Date */}
                      {team.createdAt && (
                        <div className="tooltip-wrapper">
                          <div className="flex items-center gap-0.5">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-700 font-medium">
                              {new Date(team.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="tooltip-content">
                            Created: {new Date(team.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Row 2: Member Avatars */}
                    {teamMembers.length > 0 && (
                      <div className="tooltip-wrapper">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">Members:</span>
                          <div className="flex -space-x-2">
                            {teamMembers.slice(0, 3).map((member, idx) => (
                              <div
                                key={member.id || idx}
                                className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarColor(idx)} flex items-center justify-center text-white text-[11px] font-semibold border-2 border-white shadow-sm`}
                                title={member.name}
                              >
                                {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                              </div>
                            ))}
                            {teamMembers.length > 3 && (
                              <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center text-gray-600 text-[11px] font-semibold">
                                +{teamMembers.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="tooltip-content">
                          Members: {teamMembers.map(m => m.name).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
         ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-4">
            {filteredTeams.map((team, index) => {
              const tagsArray = parseTags(team.tags);
              const teamMembers = parseMembers(team.members);
              
              return (
                <div
                  key={team.id}
                  className="relative bg-white rounded-xl sm:rounded-2xl border border-gray-200 hover:border-gray-300 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:z-50"
                  style={{
                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                  }}
                  onClick={() => handleTeamMenu(team)}
                >
                  <div className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                    {/* Header: Icon + Title/Description + Menu */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight truncate" title={`Team: ${team.name || 'Untitled Team'}`}>
                            {team.name || 'Untitled Team'}
                          </h4>
                          {team.description && (
                            <p className="text-xs text-gray-600 mt-0.5 truncate" title={team.description}>
                              {team.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="relative flex-shrink-0">
                        <button 
                          className="p-1 hover:bg-gray-100 rounded-xl transition-colors"
                          title="More Options"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setOpenMenuTeamId(openMenuTeamId === team.id ? null : team.id); 
                          }}
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        {openMenuTeamId === team.id && (
                          <div 
                            data-team-menu
                            className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-30" 
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button 
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 rounded-t-xl flex items-center gap-2 text-sm font-normal text-gray-800" 
                              onClick={(e) => {e.stopPropagation(); handleTeamMenu(team); setOpenMenuTeamId(null);}}
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </button>
                            <UpdateButton
                              resource="teams"
                              onClick={(e) => {e?.stopPropagation(); handleEdit(team); setOpenMenuTeamId(null);}}
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2 text-sm font-normal text-gray-800"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Edit</span>
                            </UpdateButton>
                            <DeleteButton
                              resource="teams"
                              onClick={(e) => {e?.stopPropagation(); handleDeleteTeam(team); setOpenMenuTeamId(null);}}
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 rounded-b-xl flex items-center gap-2 text-sm font-normal text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </DeleteButton>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tags or Status */}
                    {tagsArray.length > 0 ? (
                      <div className="flex items-center flex-wrap gap-1.5">
                        {/* Mobile: Show only 1 tag */}
                        <div className="sm:hidden flex items-center gap-1.5">
                          <div className="tooltip-wrapper">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium inline-block max-w-[55px] truncate">
                              {tagsArray[0]}
                            </span>
                            <div className="tooltip-content">Tag: {tagsArray[0]}</div>
                          </div>
                          {tagsArray.length > 1 && (
                            <div className="tooltip-wrapper">
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                                +{tagsArray.length - 1}
                              </span>
                              <div className="tooltip-content">
                                {tagsArray.length - 1} more tag{tagsArray.length - 1 !== 1 ? 's' : ''}: {tagsArray.slice(1).join(', ')}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Desktop: Show 2 tags */}
                        <div className="hidden sm:flex items-center gap-1.5">
                          {tagsArray.slice(0, 2).map((tag, i) => (
                            <div key={i} className="tooltip-wrapper">
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                                {tag}
                              </span>
                              <div className="tooltip-content">Tag: {tag}</div>
                            </div>
                          ))}
                          {tagsArray.length > 2 && (
                            <div className="tooltip-wrapper">
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                                +{tagsArray.length - 2}
                              </span>
                              <div className="tooltip-content">
                                {tagsArray.length - 2} more tag{tagsArray.length - 2 !== 1 ? 's' : ''}: {tagsArray.slice(2).join(', ')}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Badge variant={getStatusColor(team.archived || false)} size="sm" className="text-xs">
                          {team.archived ? 'Archived' : 'Active'}
                        </Badge>
                      </div>
                    )}

                    {/* Divider */}
                    <div className="border-t border-gray-100"></div>

                    {/* Status, Members Count, and Date Row */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="tooltip-wrapper">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-600">Status:</span>
                          <Badge variant={getStatusColor(team.archived || false)} size="sm" className="text-xs">
                            {team.archived ? 'Archived' : 'Active'}
                          </Badge>
                        </div>
                        <div className="tooltip-content">Current Status: {team.archived ? 'Archived' : 'Active'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Members Count - Hidden on mobile */}
                        <div className="hidden sm:block">
                          <div className="tooltip-wrapper">
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-blue-500" />
                              <span className="text-gray-800 font-semibold">
                                {team.memberCount || 0}
                              </span>
                            </div>
                            <div className="tooltip-content">Members: {team.memberCount || 0}</div>
                          </div>
                        </div>
                        {team.createdAt && (
                          <div className="tooltip-wrapper">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-gray-500" />
                              <span className="text-gray-700 font-medium">
                                {new Date(team.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <div className="tooltip-content">
                              Created: {new Date(team.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading teams...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredTeams.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No teams found</h3>
            <p className="text-gray-600 mb-6">
              {teams.length === 0 
                ? 'No teams available. Create your first team to get started.' 
                : 'Try adjusting your search or filter criteria'}
            </p>
            <CreateButton resource="teams">
              <Button onClick={handleOpenCreateTeam}>Create New Team</Button>
            </CreateButton>
          </div>
        )}
      </div>

      {/* Team Details Modal */}
      {isTeamDetailsOpen && selectedTeam && (
        <div 
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/70"
          style={{ backdropFilter: 'blur(2px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsTeamDetailsOpen(false);
              setSelectedTeam(null);
              setIsJsonViewActive(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl w-full lg:max-w-3xl max-h-[85vh] lg:h-auto lg:max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 rounded-t-2xl z-10 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{selectedTeam.name}</h2>
                    <p className="text-gray-500 text-xs sm:text-sm">
                      Team Details
                    </p>
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
            </div>

            <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="p-4 sm:p-6 pb-24 sm:pb-6 space-y-4 sm:space-y-6">
                {/* Conditional Rendering: Normal View or JSON View */}
                {!isJsonViewActive ? (
                  <>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Basic Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Team Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <p className="text-gray-600">{selectedTeam.description || 'No description'}</p>
                    </div>
                    
                    {/* Mobile: Status and Member Count on same line */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-1 sm:gap-0 sm:space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <Badge variant={getStatusColor(selectedTeam.archived || false)} size="sm">
                          {selectedTeam.archived ? 'Archived' : 'Active'}
                        </Badge>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Member Count</label>
                        <p className="text-gray-600">{selectedTeam.memberCount} members</p>
                      </div>
                    </div>
                    
                    {/* Mobile: Budget and Tags on same line */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-1 sm:gap-0 sm:space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                        <p className="text-gray-600">{selectedTeam.budget || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                        <div className="flex flex-wrap gap-1">
                          {parseTags(selectedTeam.tags).length > 0 ? (
                            parseTags(selectedTeam.tags).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                #{tag}
                              </span>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm">No tags</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>

                {/* Team Members */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Team Members</h3>
                  <div className="sm:max-h-80 sm:overflow-y-auto scrollbar-hide space-y-2 pr-2 pb-2">
                    {parseMembers(selectedTeam.members).map((member, index) => (
                      <div key={member.id || member.name || `member-${index}`} className="flex items-center space-x-3 py-2">
                        <Avatar name={member.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{member.name}</p>
                          {member.email && (
                            <p className="text-sm text-gray-600 truncate">{formatEmailForDisplay(member.email)}</p>
                          )}
                        </div>
                        <Badge variant={getRoleColor(member.role)} size="sm" className="flex-shrink-0">
                          {member.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              </>
              ) : (
                /* JSON View */
                <div className="bg-white rounded-2xl border border-gray-100 p-3 lg:p-4 shadow-sm">
                  <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-[70vh]">
                    <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words">
                      {JSON.stringify({
                        id: selectedTeam.id,
                        name: selectedTeam.name,
                        description: selectedTeam.description,
                        archived: selectedTeam.archived || false,
                        tags: parseTags(selectedTeam.tags),
                        members: parseMembers(selectedTeam.members).map(m => ({
                          id: m.id,
                          name: m.name,
                          email: m.email,
                          role: m.role
                        })),
                        memberCount: selectedTeam.memberCount || 0,
                        budget: selectedTeam.budget,
                        startDate: selectedTeam.startDate,
                        projects: selectedTeam.projects || [],
                        createdAt: selectedTeam.createdAt || null,
                        updatedAt: selectedTeam.updatedAt || null
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

      {/* Floating Action Button for Mobile */}
      <CreateButton
        resource="teams"
        onClick={handleOpenCreateTeam}
        className="lg:hidden fixed bottom-20 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-40"
      >
        <Plus className="w-6 h-6" />
      </CreateButton>

      {/* Create Team Modal */}
      {isCreateTeamOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/70 bg-opacity-50"
          style={{ backdropFilter: 'blur(2px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsCreateTeamOpen(false);
              resetForm();
            }
          }}
        >
          <div 
            className="bg-white rounded-t-2xl lg:rounded-2xl w-screen max-w-none lg:w-auto lg:max-w-2xl shadow-2xl overflow-hidden"
            style={{ 
              width: '100vw',
              height: isDesktop ? 'auto' : `${formHeight}vh`,
              maxHeight: '90vh',
              boxShadow: '0 -10px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div className="flex flex-col h-full">
              {/* Drag handle for mobile to resize */}
              <div className="lg:hidden flex items-center justify-center pt-2">
                <div className="h-1.5 w-12 rounded-full bg-gray-300" onMouseDown={handleMouseDown} />
              </div>

              <div className="p-4 lg:p-6 flex-1 lg:flex-none overflow-y-auto lg:overflow-visible">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 lg:mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {editingTeam ? 'Edit Team' : 'Create New Team'}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">Fill in the team information</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsCreateTeamOpen(false);
                      resetForm();
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Form */}
                <form onSubmit={(e) => { e.preventDefault(); handleCreateTeam(); }} className="space-y-3 lg:space-y-4">
                {/* Team Name, Start Date, and Tags in same row */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Team Name */}
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Team Name *
                    </label>
                    <Input
                      value={teamForm.name}
                      onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter team name"
                      required
                    />
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={teamForm.startDate}
                      onChange={(e) => setTeamForm(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Tags
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add a tag"
                        className="flex-1"
                      />
                      <Button type="button" onClick={addTag} variant="outline">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {teamForm.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full flex items-center gap-2"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Description
                  </label>
                  <textarea
                    value={teamForm.description}
                    onChange={(e) => setTeamForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter team description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  </div>

                {/* Team Members - Searchable Multi-select */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                    <Users className="w-4 h-4 mr-2 text-blue-600" />
                    Team Members
                  </label>
                  
                  {/* Search Input + Upward Dropdown (mobile) */}
                  <div className="relative mb-3 lg:mb-0">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      ref={userSearchRef}
                      type="text"
                      placeholder="Search team members..."
                      value={usersSearch}
                      onChange={(e) => setUsersSearch(e.target.value)}
                      onFocus={() => setShowUsersDropdown(true)}
                      className="w-full px-4 py-3 pl-10 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                    {showUsersDropdown && (
                      <div
                        ref={dropdownRef}
                        className="absolute left-0 right-0 bottom-full mb-2 sm:static sm:mt-2 sm:mb-0 border border-gray-200 rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto z-50"
                      >
                        {isLoadingUsers ? (
                          <div className="p-4 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            Loading users...
                          </div>
                        ) : filteredUsers.length > 0 ? (
                          <div className="py-2">
                            {filteredUsers.map((user, index) => (
                              <button
                                key={getStableUserId(user) || user.email || `user-${index}`}
                                type="button"
                                onClick={() => addMember(user)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                              >
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                  {formatUserDisplayName(user.name, user.username, user.email).charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">
                                    {formatUserDisplayName(user.name, user.username, user.email)}
                                  </p>
                                  {user.email && user.name && (
                                    <p className="text-sm text-gray-500">{formatEmailForDisplay(user.email)}</p>
                                  )}
                                </div>
                                <div className="text-blue-600">
                                  <User className="w-4 h-4" />
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            {usersSearch.trim() ? 'No users found matching your search' : 'No users available'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Selected Members Display */}
                  {teamForm.members.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {teamForm.members.map((member, index) => (
                        <div
                          key={`selected-member-${index}`}
                          className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium"
                        >
                          <User className="w-3 h-3" />
                          <span>{member.name}</span>
                          <button
                            type="button"
                            onClick={() => removeMember(member.id)}
                            className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>


                </form>
              </div>

              {/* Form Actions */}
              <div className="sticky lg:static bottom-0 bg-white border-t rounded-b-2xl border-gray-300 p-1 sm:p-4 z-10 pb-24 sm:pb-5 lg:pb-2">
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateTeamOpen(false);
                      resetForm();
                    }}
                    className="flex-1 sm:flex-none"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" onClick={(e) => { e.preventDefault(); handleCreateTeam(); }} className="flex-1 sm:flex-none">
                    {editingTeam ? 'Update Team' : 'Create Team'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </AppLayout>
  );
};

export default TeamsPage;