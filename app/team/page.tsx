'use client';
import React, { useState } from 'react';
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
  const { openTab } = useTabs();

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

        {/* Team Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatsCard
            title="Total Members"
            value={teamMembers.length}
            subtitle="+2 this month"
            icon={Users}
            iconColor="blue"
          />
          <StatsCard
            title="Active Members"
            value={teamMembers.filter(m => m.status === 'active').length}
            subtitle={`${Math.round((teamMembers.filter(m => m.status === 'active').length / teamMembers.length) * 100)}% online`}
            icon={CheckCircle}
            iconColor="green"
          />
          <StatsCard
            title="Managers"
            value={teamMembers.filter(m => m.isManager).length}
            subtitle="Leadership team"
            icon={Crown}
            iconColor="purple"
          />
          <StatsCard
            title="Avg. Performance"
            value={`${Math.round(teamMembers.reduce((acc, m) => acc + m.performance, 0) / teamMembers.length)}%`}
            subtitle="Team excellence"
            icon={Award}
            iconColor="orange"
          />
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
              <Card key={member.id} hover className="relative">
                <CardContent className="p-4">
                  <div className="text-center">
                    {/* Avatar and Status */}
                    <div className="relative inline-block mb-3">
                      <Avatar name={member.name} size="lg" />
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        member.status === 'active' ? 'bg-green-500' :
                        member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                    </div>

                    {/* Name and Role */}
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">{member.name}</h3>
                    <p className="text-xs text-gray-600 mb-1 truncate">{member.role}</p>
                    <p className="text-xs text-gray-500 mb-2 truncate">{member.department}</p>

                    {/* Role Badge */}
                    {getRoleBadge(member) && (
                      <div className="mb-2">
                        {getRoleBadge(member)}
                      </div>
                    )}

                    {/* Status */}
                    <Badge variant={statusConfig[member.status as keyof typeof statusConfig].color as any} size="sm" className="mb-3 text-xs">
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(member.status)}
                        <span className="hidden sm:inline">{statusConfig[member.status as keyof typeof statusConfig].label}</span>
                      </div>
                    </Badge>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-3 text-center">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{member.projects}</div>
                        <div className="text-xs text-gray-500">Projects</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{member.tasksCompleted}</div>
                        <div className="text-xs text-gray-500">Tasks</div>
                      </div>
                    </div>

                    {/* Performance */}
                    <div className="mb-3">
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

                    {/* Skills - Simplified */}
                    <div className="mb-3">
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

                    {/* Actions - Simplified */}
                    <div className="flex justify-center space-x-1">
                      <Button variant="outline" size="sm" className="p-1.5">
                        <MessageSquare size={12} />
                      </Button>
                      <Button variant="outline" size="sm" className="p-1.5">
                        <Mail size={12} />
                      </Button>
                      <Button variant="outline" size="sm" className="p-1.5">
                        <MoreVertical size={12} />
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
              <Card key={member.id} hover>
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
                          <Button variant="outline" size="sm">
                            <MessageSquare size={14} />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Mail size={14} />
                          </Button>
                          <Button variant="outline" size="sm">
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
    </AppLayout>
  );
};

export default TeamPage;
