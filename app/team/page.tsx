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
  XCircle
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
      
      // Quick filter: Date Range
      const dateRangeFilter = quickFilterValues.dateRange;
      let matchesDateRange = true;
      if (dateRangeFilter && dateRangeFilter !== 'all') {
        const teamDate = new Date(team.startDate || team.createdAt || '');
        const now = new Date();
        
        if (dateRangeFilter === 'today') {
          matchesDateRange = teamDate.toDateString() === now.toDateString();
        } else if (dateRangeFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDateRange = teamDate >= weekAgo;
        } else if (dateRangeFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDateRange = teamDate >= monthAgo;
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
      return;
    }

    const options = [
      { text: 'View Details', onPress: () => { setSelectedTeam(team); setIsTeamDetailsOpen(true); } },
      { text: 'Edit', onPress: () => { /* TODO: Implement edit */ } },
      { text: 'Delete', style: 'destructive' as const, onPress: () => handleDeleteTeam(team) }
    ];

    // For now, just show details
    setSelectedTeam(team);
    setIsTeamDetailsOpen(true);
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
  const userName = user.name || user.username || user.email;
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
  const userName = user.name || user.username || user.email;
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
      <div className="w-full h-full px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-4 overflow-x-hidden">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4">
          <StatsCard
            title="Total Teams"
            value={stats.total}
            icon={Users}
            iconColor="blue"
            className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200"
          />
          <StatsCard
            title="Active"
            value={stats.active}
            icon={CheckCircle}
            iconColor="green"
            className="bg-gradient-to-r from-green-50 to-green-100 border-green-200"
          />
          <StatsCard
            title="Archived"
            value={stats.archived}
            icon={XCircle}
            iconColor="orange"
            className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200"
          />
          <StatsCard
            title="Total Members"
            value={stats.totalMembers}
            icon={User}
            iconColor="purple"
            className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200"
          />
        </div>

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
                { value: 'week', label: 'Last 7 Days' },
                { value: 'month', label: 'Last 30 Days' }
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
          <div className="space-y-3">
            {filteredTeams.map((team, index) => (
              <div key={team.id || `team-${index}`} className="relative px-2 py-3 sm:p-5 bg-white rounded-lg border border-gray-300 hover:border-gray-400 transition-colors min-h-[96px] sm:min-h-[112px] flex flex-col sm:flex-row sm:items-center cursor-pointer shadow-sm" onClick={() => handleTeamMenu(team)}>
                {/* Action Buttons - Top Right Corner */}
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col items-end space-y-2 z-20">
                  <div className="flex items-center space-x-1 relative">
                    <Button 
                      variant="ghost"
                      size="sm"
                      title="More Options"
                      className="p-1.5 h-7 w-15 sm:p-2 sm:h-9 sm:w-9"
                      data-team-menu-button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuTeamId(prev => prev === team.id ? null : team.id);
                      }}
                    >
                      <MoreVertical size={14} className="sm:w-[18px] sm:h-[18px]" />
                    </Button>
                    {openMenuTeamId === team.id && (
                      <div data-team-menu className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-30" onClick={(e)=>e.stopPropagation()}>
                        <button 
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-t-xl flex items-center gap-2 text-sm" 
                          onClick={(e)=>{e.stopPropagation(); handleTeamMenu(team); setOpenMenuTeamId(null);}}
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                        <UpdateButton
                          resource="teams"
                          onClick={(e)=>{e?.stopPropagation(); handleEdit(team);}}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </UpdateButton>
                        <DeleteButton
                          resource="teams"
                          onClick={(e)=>{e?.stopPropagation(); handleDeleteTeam(team); setOpenMenuTeamId(null);}}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-b-xl flex items-center gap-2 text-sm text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </DeleteButton>
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Info */}
                <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0 pr-20 sm:pr-24">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base leading-tight line-clamp-1">{team.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-1 sm:line-clamp-2">{team.description || 'No description'}</p>
                    
                    {/* Member Count, Status, and Avatars inline on desktop */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                      <div className="flex items-center text-xs sm:text-sm text-gray-500">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span>{team.memberCount} members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(team.archived || false)} size="sm" className="text-xs">
                          {team.archived ? 'Archived' : 'Active'}
                        </Badge>
                        {team.members && Array.isArray(team.members) && team.members.length > 0 && (
                          <MemberAvatars members={team.members} maxVisible={3} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
         ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3 lg:gap-4">
            {filteredTeams.map((team, index) => (
              <Card key={team.id || `team-${index}`} hover className="cursor-pointer" onClick={() => handleTeamMenu(team)}>
                <CardContent className=" px-1 pb-1 sm:p-0">
                   <div className="space-y-0.5 sm:space-y-2">
                    {/* Header with Team Icon, Title, and Menu */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-xs sm:text-sm leading-tight line-clamp-2">{team.name}</h4>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-1 hidden sm:block">{team.description || 'No description'}</p>
                        </div>
                      </div>
                      <div className="ml-2 -mr-1 flex-shrink-0 self-start relative">
                        <Button 
                          variant="ghost"
                          size="sm"
                          data-team-menu-button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuTeamId(prev => prev === team.id ? null : team.id);
                          }}
                          className="p-0 h-8 w-8 sm:p-0.5 sm:h-10 sm:w-10"
                          title="More options"
                        >
                          <MoreVertical className="w-7 h-7 sm:w-5 sm:h-5" />
                        </Button>
                        {openMenuTeamId === team.id && (
                          <div data-team-menu className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-30" onClick={(e)=>e.stopPropagation()}>
                            <button 
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-t-xl flex items-center gap-2 text-sm" 
                              onClick={(e)=>{e.stopPropagation(); handleTeamMenu(team); setOpenMenuTeamId(null);}}
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </button>
                            <UpdateButton
                              resource="teams"
                              onClick={(e)=>{e?.stopPropagation(); handleEdit(team);}}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Edit</span>
                            </UpdateButton>
                            <DeleteButton
                              resource="teams"
                              onClick={(e)=>{e?.stopPropagation(); handleDeleteTeam(team); setOpenMenuTeamId(null);}}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-b-xl flex items-center gap-2 text-sm text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </DeleteButton>
                          </div>
                        )}
                      </div>
                    </div>

                     {/* Member Count and Status - Stacked on mobile */}
                     <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                       <div className="flex items-center text-xs text-gray-500">
                         <Users className="w-3 h-3 mr-1" />
                         <span>{team.memberCount} members</span>
                       </div>
                       <Badge variant={getStatusColor(team.archived || false)} size="sm" className="text-xs">
                         {team.archived ? 'Archived' : 'Active'}
                       </Badge>
                     </div>

                     {/* Member Avatars */}
                    {team.members && Array.isArray(team.members) && team.members.length > 0 && (
                      <div className="flex items-center justify-start">
                        <MemberAvatars members={team.members} maxVisible={2} />
                      </div>
                    )}
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
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/70 bg-opacity-50"
          style={{ backdropFilter: 'blur(2px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsTeamDetailsOpen(false);
              setSelectedTeam(null);
            }
            }}
          >
            <div 
            className="bg-white rounded-t-2xl lg:rounded-2xl w-full lg:w-auto lg:max-w-3xl shadow-2xl overflow-y-auto scrollbar-hide"
              style={{ 
              maxHeight: '85vh',
              boxShadow: '0 -10px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div className="p-4 lg:p-6 pb-24 lg:pb-6">
                <div className="flex items-center justify-between mb-4 lg:mb-6">
                  <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedTeam.name}</h2>
                    <p className="text-gray-500 text-sm">Team Details</p>
                    </div>
                  </div>
                    <Button
                      variant="outline"
                  onClick={() => {
                    setIsTeamDetailsOpen(false);
                    setSelectedTeam(null);
                  }}
                    >
                      Close
                    </Button>
                </div>

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
                            <p className="text-sm text-gray-600 truncate">{member.email}</p>
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
                                  {(user.name || user.username || user.email || '?').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">
                                    {user.name || user.username || user.email}
                                  </p>
                                  {user.email && user.name && (
                                    <p className="text-sm text-gray-500">{user.email}</p>
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