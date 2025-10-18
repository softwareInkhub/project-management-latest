'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  ChevronUp
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Avatar } from '../components/ui/Avatar';
import { SearchFilterSection } from '../components/ui/SearchFilterSection';
import { ViewToggle } from '../components/ui/ViewToggle';
import { AppLayout } from '../components/AppLayout';
import { useTabs } from '../hooks/useTabs';
import { useSidebar } from '../components/AppLayout';
import { useAuth } from '../hooks/useAuth';

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
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isTeamDetailsOpen, setIsTeamDetailsOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [usersSearch, setUsersSearch] = useState('');
  const [showUsersDropdown, setShowUsersDropdown] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [formHeight, setFormHeight] = useState(80); // Default 80vh
  const [isDragging, setIsDragging] = useState(false);
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
    project: '',
    budget: '',
    startDate: new Date().toISOString().slice(0, 10),
    tags: [] as string[],
    members: [] as TeamMember[]
  });
  
  const { hasPermission } = useAuth();
  const { isCollapsed } = useSidebar();
  const userSearchRef = useRef<HTMLInputElement>(null);

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
        alert(`Failed to fetch teams: ${res.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error fetching teams:', error);
      alert('An unexpected error occurred while fetching teams');
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

  // Filter teams
  const filteredTeams = teams.filter(team => {
    const matchesSearch = !searchTerm.trim() || 
      (team.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || 
      (team.archived ? 'Archived' : 'Active') === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Status counts
  const statusCounts = {
    All: teams.length,
    Active: teams.filter(t => !t.archived).length,
    Archived: teams.filter(t => t.archived).length
  };

  // Handle opening create team modal
  const handleOpenCreateTeam = () => {
    setFormHeight(80); // Reset to default height
    setIsCreateTeamOpen(true);
  };

  // Handle team creation
  const handleCreateTeam = async () => {
    if (!teamForm.name.trim()) {
      alert('Please enter team name');
      return;
    }

    try {
      const payload = {
        name: teamForm.name.trim(),
        description: teamForm.description.trim(),
        members: teamForm.members,
        project: teamForm.project.trim(),
        budget: teamForm.budget.trim(),
        startDate: teamForm.startDate,
        tags: teamForm.tags
      };

      console.log('🆕 Creating team:', payload);
      const res = await apiService.createTeam(payload);
      
      if (res.success) {
        console.log('✅ Team created successfully:', res.data);
        setIsCreateTeamOpen(false);
        resetForm();
        fetchTeams(); // Refresh teams list
        alert('Team created successfully');
      } else {
        console.error('❌ Failed to create team:', res.error);
        alert(`Failed to create team: ${res.error}`);
      }
    } catch (error) {
      console.error('❌ Error creating team:', error);
      alert('An unexpected error occurred while creating team');
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
        alert('Team deleted successfully');
      } else {
        alert(`Failed to delete team: ${res.error}`);
      }
    } catch (error) {
      console.error('❌ Error deleting team:', error);
      alert('An unexpected error occurred while deleting team');
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
      project: '',
      budget: '',
      startDate: new Date().toISOString().slice(0, 10),
      tags: [],
      members: []
    });
    setTagInput('');
    setUsersSearch('');
    setShowUsersDropdown(false);
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
    const alreadyAdded = teamForm.members.some(m => m.id === user.id);
    if (alreadyAdded) return;

    const member: TeamMember = {
      id: user.id,
      name: user.name || user.username || user.email,
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
    const query = usersSearch.trim().toLowerCase();
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

  return (
    <AppLayout>
      <div className="w-full px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Teams</h1>
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
                value: 'grid',
                label: 'Grid',
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
              onChange={(view: 'list' | 'grid') => setViewMode(view)}
            />
            <Button 
              className="flex items-center justify-center space-x-2 w-full sm:w-auto"
              onClick={handleOpenCreateTeam}
            >
              <Plus size={16} className="sm:w-4 sm:h-4" />
              <span className="text-sm sm:text-base">New Team</span>
            </Button>
                      </div>
                    </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                      </div>
                      </div>
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'All', label: 'All Teams' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Archived', label: 'Archived' }
                ]}
                className="min-w-[120px]"
              />
                      </div>
                    </div>

          {/* Status Pills */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status} ({count})
              </button>
            ))}
                      </div>
                    </div>

        {/* Teams Grid/List */}
        {viewMode === 'list' ? (
          <div className="space-y-3">
            {filteredTeams.map((team, index) => (
              <Card key={team.id || `team-${index}`} hover className="cursor-pointer" onClick={() => handleTeamMenu(team)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{team.name}</h3>
                        <p className="text-sm text-gray-600">{team.memberCount} members</p>
                        {team.description && (
                          <p className="text-sm text-gray-500 mt-1">{team.description}</p>
                        )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {/* Member Avatars - Right Side */}
                        {team.members && Array.isArray(team.members) && team.members.length > 0 && (
                          <MemberAvatars members={team.members} maxVisible={2} />
                        )}
                        <Badge variant={getStatusColor(team.archived || false)} size="sm">
                          {team.archived ? 'Archived' : 'Active'}
                        </Badge>
                          <Button 
                          variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                            handleTeamMenu(team);
                            }}
                          >
                          <MoreVertical className="w-4 h-4" />
                          </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.map((team, index) => (
              <Card key={team.id || `team-${index}`} hover className="cursor-pointer" onClick={() => handleTeamMenu(team)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Member Avatars - Right Side */}
                      {team.members && Array.isArray(team.members) && team.members.length > 0 && (
                        <MemberAvatars members={team.members} maxVisible={2} />
                      )}
                          <Button 
                        variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                          handleTeamMenu(team);
                        }}
                      >
                        <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{team.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{team.memberCount} members</p>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant={getStatusColor(team.archived || false)} size="sm">
                      {team.archived ? 'Archived' : 'Active'}
                    </Badge>
                    {team.budget && (
                      <span className="text-xs text-gray-500">{team.budget}</span>
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
            <Button onClick={handleOpenCreateTeam}>Create New Team</Button>
          </div>
        )}
      </div>

      {/* Team Details Modal */}
      {isTeamDetailsOpen && selectedTeam && (
        <div 
          className="fixed inset-0 z-50 flex items-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsTeamDetailsOpen(false);
              setSelectedTeam(null);
            }
            }}
          >
            <div 
            className={`bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl ${
              isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
            }`}
              style={{ 
              width: `calc(100% - ${isCollapsed ? '4rem' : '16rem'})`,
              boxShadow: '0 -10px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
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

                <div className="space-y-6">
                  {/* Basic Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Team Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <p className="text-gray-600">{selectedTeam.description || 'No description'}</p>
                      </div>
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
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                      <p className="text-gray-600">{selectedTeam.budget || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                {/* Team Members */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Team Members</h3>
                  <div className="space-y-3">
                    {parseMembers(selectedTeam.members).map((member, index) => (
                      <div key={member.id || member.name || `member-${index}`} className="flex items-center space-x-3">
                        <Avatar name={member.name} size="sm" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{member.name}</p>
                          {member.email && (
                            <p className="text-sm text-gray-600">{member.email}</p>
                          )}
                      </div>
                        <Badge variant={getRoleColor(member.role)} size="sm">
                          {member.role}
                          </Badge>
                      </div>
                    ))}
                    </div>
                  </div>

                {/* Tags */}
                {(() => {
                  const tags = parseTags(selectedTeam.tags);
                  return tags.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      </div>
                  );
                })()}
                      </div>
                    </div>
                  </div>
                    </div>
      )}

      {/* Floating Action Button for Mobile */}
      <button
        onClick={handleOpenCreateTeam}
        className="lg:hidden fixed bottom-20 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-40"
        aria-label="Create Team"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Create Team Modal */}
      {isCreateTeamOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsCreateTeamOpen(false);
              resetForm();
            }
          }}
        >
          <div 
            className={`bg-white rounded-t-2xl w-full overflow-y-auto shadow-2xl ${
              isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
            }`}
            style={{ 
              width: `calc(100% - ${isCollapsed ? '4rem' : '16rem'})`,
              height: `${formHeight}vh`,
              boxShadow: '0 -10px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            {/* Drag Handle - Sticky */}
            <div 
              className={`sticky top-0 z-20 w-full h-6 flex items-center justify-center cursor-row-resize hover:bg-gray-50 transition-colors ${isDragging ? 'bg-gray-100' : ''}`}
              onMouseDown={handleMouseDown}
            >
              <div className="w-12 h-1 bg-gray-400 rounded-full"></div>
                      </div>
            <div className="flex flex-col h-full">
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                      <div>
                    <h2 className="text-xl font-bold text-gray-900">Create New Team</h2>
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

                <form onSubmit={(e) => { e.preventDefault(); handleCreateTeam(); }} className="space-y-6">
                {/* Team Name */}
                <div>
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

                {/* Project, Budget & Start Date */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Project
                    </label>
                    <Input
                      value={teamForm.project}
                      onChange={(e) => setTeamForm(prev => ({ ...prev, project: e.target.value }))}
                      placeholder="Enter project name"
                    />
                      </div>
                      <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Budget
                    </label>
                    <Input
                      value={teamForm.budget}
                      onChange={(e) => setTeamForm(prev => ({ ...prev, budget: e.target.value }))}
                      placeholder="Enter budget"
                    />
                      </div>
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
                  </div>

                {/* Team Members */}
                      <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Team Members
                  </label>
                  <div className="relative">
                    <input
                      ref={userSearchRef}
                      value={usersSearch}
                      onChange={(e) => setUsersSearch(e.target.value)}
                      onFocus={() => setShowUsersDropdown(true)}
                      onBlur={() => setTimeout(() => setShowUsersDropdown(false), 200)}
                      placeholder="Search users by name or email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {showUsersDropdown && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {isLoadingUsers ? (
                          <div className="px-3 py-2 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            Loading users...
                </div>
                        ) : filteredUsers.length === 0 ? (
                          <div className="px-3 py-2 text-center text-gray-500">
                            {usersSearch.trim() ? 'No users found' : 'No users available'}
              </div>
                        ) : (
                          filteredUsers.map((user, index) => (
                            <button
                              key={user.id || user.email || user.username || `user-${index}`}
                              type="button"
                              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                              onClick={() => addMember(user)}
                            >
                      <div>
                                <p className="font-medium">{user.name || user.username || user.email}</p>
                                {user.email && user.name && <p className="text-sm text-gray-600">{user.email}</p>}
            </div>
                              {teamForm.members.some(m => m.id === user.id) && (
                                <Check className="w-4 h-4 text-green-500" />
                              )}
                            </button>
                          ))
                        )}
                    </div>
                    )}
                  </div>

                  {/* Selected Members */}
                  <div className="mt-3 space-y-2">
                    {teamForm.members.map((member, index) => (
                      <div key={member.id || member.name || `selected-member-${index}`} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center space-x-2">
                          <Avatar name={member.name} size="sm" />
                          <span className="text-sm text-gray-800">{member.name}</span>
                </div>
                        <button
                          type="button"
                          onClick={() => removeMember(member.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
              </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                      <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
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
                        <div className="flex flex-wrap gap-2">
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

                </form>
              </div>

              {/* Sticky Form Actions */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateTeamOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" onClick={(e) => { e.preventDefault(); handleCreateTeam(); }}>
                    Create Team
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

export default TeamsPage;