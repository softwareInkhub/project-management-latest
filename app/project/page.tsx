'use client';
import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar, 
  Users, 
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Archive,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Avatar } from '../components/ui/Avatar';
import { AppLayout } from '../components/AppLayout';

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

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
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

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">Manage and track all your projects in one place</p>
          </div>
          <Button className="flex items-center space-x-2">
            <Plus size={18} />
            <span>New Project</span>
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="planning">Planning</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} hover className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`w-3 h-3 rounded-full bg-${project.color}-500`}></div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm">
                      <Eye size={16} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Status and Priority */}
                <div className="flex items-center justify-between mb-4">
                  <Badge variant={statusColors[project.status as keyof typeof statusColors] as any} size="sm">
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(project.status)}
                      <span className="capitalize">{project.status}</span>
                    </div>
                  </Badge>
                  <Badge variant={priorityColors[project.priority as keyof typeof priorityColors] as any} size="sm">
                    {project.priority} priority
                  </Badge>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <ProgressBar value={project.progress} color="blue" size="sm" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{project.tasks.completed} of {project.tasks.total} tasks</span>
                  </div>
                </div>

                {/* Team */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Team</span>
                    <span className="text-xs text-gray-500">{project.team.length} members</span>
                  </div>
                  <div className="flex -space-x-2">
                    {project.team.slice(0, 3).map((member, index) => (
                      <Avatar key={index} name={member.name} size="sm" />
                    ))}
                    {project.team.length > 3 && (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-600">
                        +{project.team.length - 3}
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>{new Date(project.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>{new Date(project.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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

        {/* Project Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {projects.filter(p => p.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Active Projects</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {projects.filter(p => p.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {projects.filter(p => p.status === 'paused').length}
              </div>
              <div className="text-sm text-gray-600">On Hold</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length)}%
              </div>
              <div className="text-sm text-gray-600">Avg. Progress</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProjectsPage;
