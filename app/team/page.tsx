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
import { AppLayout } from '../components/AppLayout';

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
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team</h1>
            <p className="text-gray-600 mt-1">Manage your team members and their roles</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" className="flex items-center space-x-2">
              <UserPlus size={18} />
              <span>Invite Member</span>
            </Button>
            <Button className="flex items-center space-x-2">
              <Plus size={18} />
              <span>Add Member</span>
            </Button>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-3xl font-bold text-gray-900">{teamMembers.length}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp size={14} className="mr-1" />
                  +2 this month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Members</p>
                <p className="text-3xl font-bold text-gray-900">
                  {teamMembers.filter(m => m.status === 'active').length}
                </p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <CheckCircle size={14} className="mr-1" />
                  {Math.round((teamMembers.filter(m => m.status === 'active').length / teamMembers.length) * 100)}% online
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Managers</p>
                <p className="text-3xl font-bold text-gray-900">
                  {teamMembers.filter(m => m.isManager).length}
                </p>
                <p className="text-sm text-purple-600 flex items-center mt-1">
                  <Crown size={14} className="mr-1" />
                  Leadership team
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Performance</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(teamMembers.reduce((acc, m) => acc + m.performance, 0) / teamMembers.length)}%
                </p>
                <p className="text-sm text-orange-600 flex items-center mt-1">
                  <Award size={14} className="mr-1" />
                  Team excellence
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              {Array.from(new Set(teamMembers.map(m => m.department))).map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="away">Away</option>
              <option value="offline">Offline</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="manager">Managers</option>
              <option value="admin">Admins</option>
              <option value="member">Members</option>
            </select>

            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-blue-50 text-blue-700' : 'text-gray-600'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-50 text-blue-700' : 'text-gray-600'}`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Team Members */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMembers.map((member) => (
              <Card key={member.id} hover className="relative">
                <CardContent className="p-6">
                  <div className="text-center">
                    {/* Avatar and Status */}
                    <div className="relative inline-block mb-4">
                      <Avatar name={member.name} size="xl" />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        member.status === 'active' ? 'bg-green-500' :
                        member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                    </div>

                    {/* Name and Role */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{member.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{member.role}</p>
                    <p className="text-xs text-gray-500 mb-3">{member.department}</p>

                    {/* Role Badge */}
                    {getRoleBadge(member) && (
                      <div className="mb-3">
                        {getRoleBadge(member)}
                      </div>
                    )}

                    {/* Status */}
                    <Badge variant={statusConfig[member.status as keyof typeof statusConfig].color as any} size="sm" className="mb-4">
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(member.status)}
                        <span>{statusConfig[member.status as keyof typeof statusConfig].label}</span>
                      </div>
                    </Badge>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{member.projects}</div>
                        <div className="text-xs text-gray-500">Projects</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{member.tasksCompleted}</div>
                        <div className="text-xs text-gray-500">Tasks</div>
                      </div>
                    </div>

                    {/* Performance */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Performance</span>
                        <span>{member.performance}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            member.performance >= 90 ? 'bg-green-500' :
                            member.performance >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${member.performance}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="mb-4">
                      <div className="text-xs text-gray-600 mb-2">Top Skills</div>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {member.skills.slice(0, 3).map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                        {member.skills.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            +{member.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-center space-x-2">
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
