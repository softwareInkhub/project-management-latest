'use client';
import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Clock,
  Award,
  TrendingUp,
  Users,
  UserPlus,
  Settings,
  MessageSquare,
  Star,
  CheckCircle,
  AlertCircle,
  Crown,
  Shield,
  Zap
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { StatsCard } from '../components/ui/StatsCard';
import { SearchFilterSection } from '../components/ui/SearchFilterSection';
import { ViewToggle } from '../components/ui/ViewToggle';
import { AppLayout } from '../components/AppLayout';
import { useTabs } from '../hooks/useTabs';
import { useSidebar } from '../components/AppLayout';

// Mock data for team members
const teamMembers = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    role: 'Senior Designer',
    department: 'Design',
    status: 'active',
    avatar: null,
    joinDate: '2022-03-15',
    lastActive: '2 hours ago',
    projects: 8,
    tasksCompleted: 156,
    performance: 95,
    skills: ['UI/UX Design', 'Figma', 'Prototyping', 'User Research'],
    location: 'San Francisco, CA',
    phone: '+1 (555) 123-4567',
    bio: 'Passionate designer with 5+ years of experience creating beautiful and functional user interfaces.',
    achievements: ['Employee of the Month', 'Design Excellence Award'],
    isManager: false,
    isAdmin: false
  },
  {
    id: 2,
    name: 'Mike Chen',
    email: 'mike.chen@company.com',
    role: 'Lead Developer',
    department: 'Engineering',
    status: 'active',
    avatar: null,
    joinDate: '2021-08-20',
    lastActive: '30 minutes ago',
    projects: 12,
    tasksCompleted: 234,
    performance: 98,
    skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker'],
    location: 'Seattle, WA',
    phone: '+1 (555) 234-5678',
    bio: 'Full-stack developer with expertise in modern web technologies and cloud architecture.',
    achievements: ['Technical Excellence Award', 'Innovation Award'],
    isManager: true,
    isAdmin: false
  },
  {
    id: 3,
    name: 'Emily Davis',
    email: 'emily.davis@company.com',
    role: 'Product Manager',
    department: 'Product',
    status: 'active',
    avatar: null,
    joinDate: '2022-01-10',
    lastActive: '1 hour ago',
    projects: 6,
    tasksCompleted: 89,
    performance: 92,
    skills: ['Product Strategy', 'Agile', 'User Research', 'Analytics'],
    location: 'New York, NY',
    phone: '+1 (555) 345-6789',
    bio: 'Strategic product manager focused on delivering user-centered solutions.',
    achievements: ['Product Excellence Award'],
    isManager: true,
    isAdmin: false
  },
  {
    id: 4,
    name: 'Alex Rodriguez',
    email: 'alex.rodriguez@company.com',
    role: 'Mobile Developer',
    department: 'Engineering',
    status: 'active',
    avatar: null,
    joinDate: '2023-02-14',
    lastActive: '3 hours ago',
    projects: 4,
    tasksCompleted: 67,
    performance: 88,
    skills: ['React Native', 'iOS', 'Android', 'Swift', 'Kotlin'],
    location: 'Austin, TX',
    phone: '+1 (555) 456-7890',
    bio: 'Mobile development specialist with experience in cross-platform solutions.',
    achievements: ['Rising Star Award'],
    isManager: false,
    isAdmin: false
  },
  {
    id: 5,
    name: 'Lisa Wang',
    email: 'lisa.wang@company.com',
    role: 'UX Researcher',
    department: 'Design',
    status: 'active',
    avatar: null,
    joinDate: '2022-09-05',
    lastActive: '4 hours ago',
    projects: 7,
    tasksCompleted: 123,
    performance: 90,
    skills: ['User Research', 'Usability Testing', 'Data Analysis', 'Figma'],
    location: 'Los Angeles, CA',
    phone: '+1 (555) 567-8901',
    bio: 'User experience researcher passionate about understanding user needs and behaviors.',
    achievements: ['Research Excellence Award'],
    isManager: false,
    isAdmin: false
  },
  {
    id: 6,
    name: 'David Kim',
    email: 'david.kim@company.com',
    role: 'DevOps Engineer',
    department: 'Engineering',
    status: 'away',
    avatar: null,
    joinDate: '2021-11-30',
    lastActive: '1 day ago',
    projects: 10,
    tasksCompleted: 178,
    performance: 94,
    skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Monitoring'],
    location: 'Denver, CO',
    phone: '+1 (555) 678-9012',
    bio: 'DevOps engineer focused on building scalable and reliable infrastructure.',
    achievements: ['Infrastructure Excellence Award'],
    isManager: false,
    isAdmin: true
  },
  {
    id: 7,
    name: 'Rachel Green',
    email: 'rachel.green@company.com',
    role: 'Marketing Manager',
    department: 'Marketing',
    status: 'active',
    avatar: null,
    joinDate: '2022-06-18',
    lastActive: '2 hours ago',
    projects: 5,
    tasksCompleted: 98,
    performance: 87,
    skills: ['Digital Marketing', 'Content Strategy', 'Analytics', 'Social Media'],
    location: 'Chicago, IL',
    phone: '+1 (555) 789-0123',
    bio: 'Marketing professional with expertise in digital campaigns and brand strategy.',
    achievements: ['Marketing Excellence Award'],
    isManager: true,
    isAdmin: false
  },
  {
    id: 8,
    name: 'Tom Wilson',
    email: 'tom.wilson@company.com',
    role: 'Backend Developer',
    department: 'Engineering',
    status: 'offline',
    avatar: null,
    joinDate: '2023-04-12',
    lastActive: '2 days ago',
    projects: 3,
    tasksCompleted: 45,
    performance: 85,
    skills: ['Python', 'Django', 'PostgreSQL', 'Redis', 'API Design'],
    location: 'Portland, OR',
    phone: '+1 (555) 890-1234',
    bio: 'Backend developer specializing in scalable API development and database design.',
    achievements: [],
    isManager: false,
    isAdmin: false
  }
];

const statusConfig = {
  active: { label: 'Active', color: 'success', icon: CheckCircle },
  away: { label: 'Away', color: 'warning', icon: Clock },
  offline: { label: 'Offline', color: 'default', icon: AlertCircle }
};

const roleConfig = {
  manager: { label: 'Manager', color: 'info', icon: Crown },
  admin: { label: 'Admin', color: 'danger', icon: Shield },
  member: { label: 'Member', color: 'default', icon: Users }
};

const TeamPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isMemberPreviewOpen, setIsMemberPreviewOpen] = useState(false);
  const [isPreviewAnimating, setIsPreviewAnimating] = useState(false);
  const memberPreviewRef = useRef<HTMLDivElement>(null);
  const { openTab } = useTabs();
  const { isCollapsed } = useSidebar();

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || member.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    const matchesRole = roleFilter === 'all' || 
                       (roleFilter === 'manager' && member.isManager) ||
                       (roleFilter === 'admin' && member.isAdmin) ||
                       (roleFilter === 'member' && !member.isManager && !member.isAdmin);
    
    return matchesSearch && matchesDepartment && matchesStatus && matchesRole;
  });

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    return <Icon className="w-4 h-4" />;
  };

  const getRoleBadge = (member: any) => {
    if (member.isAdmin) {
      return (
        <Badge variant="danger" size="sm">
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      );
    } else if (member.isManager) {
      return (
        <Badge variant="info" size="sm">
          <Crown className="w-3 h-3 mr-1" />
          Manager
        </Badge>
      );
    }
    return null;
  };

  // Member preview and edit handlers
  const handleMemberClick = (member: any) => {
    setSelectedMember(member);
    setIsMemberPreviewOpen(true);
    setIsPreviewAnimating(false);
  };

  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    setIsMemberPreviewOpen(false);
    // TODO: Open edit form
  };

  const closeMemberPreview = () => {
    setIsPreviewAnimating(true);
    setTimeout(() => {
      setIsMemberPreviewOpen(false);
      setIsPreviewAnimating(false);
      setSelectedMember(null);
    }, 300);
  };

  // Close member preview when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (memberPreviewRef.current && !memberPreviewRef.current.contains(event.target as Node)) {
        closeMemberPreview();
      }
    };

    if (isMemberPreviewOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMemberPreviewOpen]);

  return (
    <AppLayout>
      <div className="w-full px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Team</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your team members and their roles</p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button variant="outline" className="flex items-center justify-center space-x-2 w-full sm:w-auto">
              <UserPlus size={16} className="sm:w-4 sm:h-4" />
              <span className="text-sm sm:text-base">Invite Member</span>
            </Button>
            <Button className="flex items-center justify-center space-x-2 w-full sm:w-auto">
              <Plus size={16} className="sm:w-4 sm:h-4" />
              <span className="text-sm sm:text-base">Add Member</span>
            </Button>
          </div>
        </div>


        {/* Filters and Search */}
        <SearchFilterSection
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search team members by name, role, or department..."
          variant="modern"
          showActiveFilters={true}
          filters={[
            {
              key: 'department',
              label: 'Department',
              value: departmentFilter,
              onChange: setDepartmentFilter,
              options: [
                { value: 'all', label: 'All Departments' },
                ...Array.from(new Set(teamMembers.map(m => m.department))).map(dept => ({
                  value: dept,
                  label: dept
                }))
              ]
            },
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'away', label: 'Away' },
                { value: 'offline', label: 'Offline' }
              ]
            },
            {
              key: 'role',
              label: 'Role',
              value: roleFilter,
              onChange: setRoleFilter,
              options: [
                { value: 'all', label: 'All Roles' },
                { value: 'manager', label: 'Managers' },
                { value: 'admin', label: 'Admins' },
                { value: 'member', label: 'Members' }
              ]
            }
          ]}
          viewToggle={{
            currentView: viewMode,
            views: [
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
              },
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
              }
            ],
            onChange: (view: 'grid' | 'list') => setViewMode(view)
          }}
        />

        {/* Team Members */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredMembers.map((member) => (
              <Card key={member.id} hover className="relative cursor-pointer" onClick={() => handleMemberClick(member)}>
                <CardContent className="p-2 sm:p-4">
                  <div className="text-center">
                    {/* Avatar and Status */}
                    <div className="relative inline-block mb-2 sm:mb-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12">
                        <Avatar name={member.name} size="md" />
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-white ${
                        member.status === 'active' ? 'bg-green-500' :
                        member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                    </div>

                    {/* Name and Role */}
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-0.5 sm:mb-1 truncate">{member.name}</h3>
                    <p className="text-xs text-gray-600 mb-0.5 sm:mb-1 truncate">{member.role}</p>
                    <p className="text-xs text-gray-500 mb-1 sm:mb-2 truncate hidden sm:block">{member.department}</p>

                    {/* Role Badge - Hidden on mobile */}
                    {getRoleBadge(member) && (
                      <div className="mb-1 sm:mb-2 hidden sm:block">
                        {getRoleBadge(member)}
                      </div>
                    )}

                    {/* Status - Smaller on mobile */}
                    <Badge variant={statusConfig[member.status as keyof typeof statusConfig].color as any} size="sm" className="mb-2 sm:mb-3 text-xs">
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(member.status)}
                        <span className="hidden sm:inline">{statusConfig[member.status as keyof typeof statusConfig].label}</span>
                      </div>
                    </Badge>

                    {/* Stats - Compact on mobile */}
                    <div className="grid grid-cols-2 gap-1 sm:gap-2 mb-2 sm:mb-3 text-center">
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-gray-900">{member.projects}</div>
                        <div className="text-xs text-gray-500">Proj.</div>
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-gray-900">{member.tasksCompleted}</div>
                        <div className="text-xs text-gray-500">Tasks</div>
                      </div>
                    </div>

                    {/* Performance - Hidden on mobile */}
                    <div className="mb-2 sm:mb-3 hidden sm:block">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Perf.</span>
                        <span>{member.performance}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            member.performance >= 90 ? 'bg-green-500' :
                            member.performance >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${member.performance}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Skills - Hidden on mobile */}
                    <div className="mb-2 sm:mb-3 hidden sm:block">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {member.skills.slice(0, 2).map((skill, index) => (
                          <span key={index} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full truncate max-w-[60px]">
                            {skill}
                          </span>
                        ))}
                        {member.skills.length > 2 && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                            +{member.skills.length - 2}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions - Smaller on mobile */}
                    <div className="flex justify-center space-x-1">
                      <Button variant="outline" size="sm" className="p-1 sm:p-1.5">
                        <MessageSquare size={10} className="sm:w-3 sm:h-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="p-1 sm:p-1.5">
                        <Mail size={10} className="sm:w-3 sm:h-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="p-1 sm:p-1.5">
                        <MoreVertical size={10} className="sm:w-3 sm:h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <Card key={member.id} hover className="cursor-pointer" onClick={() => handleMemberClick(member)}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Avatar name={member.name} size="lg" />
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          member.status === 'active' ? 'bg-green-500' :
                          member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}></div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                          {getRoleBadge(member)}
                        </div>
                        <p className="text-sm text-gray-600">{member.role} • {member.department}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{member.projects}</div>
                        <div className="text-xs text-gray-500">Projects</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{member.tasksCompleted}</div>
                        <div className="text-xs text-gray-500">Tasks</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{member.performance}%</div>
                        <div className="text-xs text-gray-500">Performance</div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge variant={statusConfig[member.status as keyof typeof statusConfig].color as any} size="sm">
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(member.status)}
                            <span>{statusConfig[member.status as keyof typeof statusConfig].label}</span>
                          </div>
                        </Badge>
                        
                        <div className="flex items-center space-x-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Open message
                            }}
                          >
                            <MessageSquare size={14} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Open email
                            }}
                          >
                            <Mail size={14} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditMember(member);
                            }}
                          >
                            <MoreVertical size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
            <Button>Add Team Member</Button>
          </div>
        )}
      </div>

      {/* Member Preview - Slides up from bottom */}
      {isMemberPreviewOpen && selectedMember && (
        <div className={`fixed inset-0 z-50 flex items-end transition-opacity duration-300 ${
          isPreviewAnimating ? 'bg-opacity-0' : 'bg-opacity-30'
        }`}>
          <div 
            ref={memberPreviewRef}
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
                {/* Member Preview Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedMember.name}</h2>
                      <p className="text-gray-500 text-sm">Team Member Details</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={closeMemberPreview}
                      className="px-4 py-2"
                    >
                      Close
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleEditMember(selectedMember)}
                      className="px-4 py-2"
                    >
                      Edit Member
                    </Button>
                  </div>
                </div>

                {/* Member Details */}
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center space-x-6 mb-6">
                      <div className="relative">
                        <Avatar name={selectedMember.name} size="lg" />
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          selectedMember.status === 'active' ? 'bg-green-500' :
                          selectedMember.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}></div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{selectedMember.name}</h3>
                        <p className="text-gray-600">{selectedMember.role} • {selectedMember.department}</p>
                        <p className="text-sm text-gray-500">{selectedMember.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Bio</label>
                        <p className="text-gray-600">{selectedMember.bio}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Location</label>
                        <p className="text-gray-600">{selectedMember.location}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status and Role */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Status</label>
                        <Badge variant={statusConfig[selectedMember.status as keyof typeof statusConfig].color as any} size="md">
                          {getStatusIcon(selectedMember.status)}
                          <span className="ml-2">{statusConfig[selectedMember.status as keyof typeof statusConfig].label}</span>
                        </Badge>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Role</label>
                        {getRoleBadge(selectedMember) || (
                          <Badge variant="default" size="md">
                            <Users className="w-4 h-4 mr-2" />
                            Member
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Performance Stats */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{selectedMember.projects}</div>
                        <div className="text-sm text-gray-600">Projects</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{selectedMember.tasksCompleted}</div>
                        <div className="text-sm text-gray-600">Tasks Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{selectedMember.performance}%</div>
                        <div className="text-sm text-gray-600">Performance</div>
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Skills</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedMember.skills.map((skill: string, index: number) => (
                            <span key={index} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Phone</label>
                        <p className="text-gray-600">{selectedMember.phone}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Join Date</label>
                        <p className="text-gray-600">{new Date(selectedMember.joinDate).toLocaleDateString()}</p>
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

export default TeamPage;
