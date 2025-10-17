'use client';
import React, { useState } from 'react';
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
  TrendingUp
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Avatar } from '../components/ui/Avatar';
import { StatsCard } from '../components/ui/StatsCard';
import { SearchFilterSection } from '../components/ui/SearchFilterSection';
import { AppLayout } from '../components/AppLayout';
import { useTabs } from '../hooks/useTabs';

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
  const { openTab } = useTabs();

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
      <div className="w-full px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage and track all your projects in one place</p>
          </div>
          <Button className="flex items-center justify-center space-x-2 w-full sm:w-auto">
            <Plus size={16} className="sm:w-4 sm:h-4" />
            <span className="text-sm sm:text-base">New Project</span>
          </Button>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatsCard
            title="Active Projects"
            value={projects.filter(p => p.status === 'active').length}
            icon={Play}
            iconColor="blue"
          />
          <StatsCard
            title="Completed"
            value={projects.filter(p => p.status === 'completed').length}
            icon={CheckCircle}
            iconColor="green"
          />
          <StatsCard
            title="On Hold"
            value={projects.filter(p => p.status === 'paused').length}
            icon={Pause}
            iconColor="yellow"
          />
          <StatsCard
            title="Avg. Progress"
            value={`${Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length)}%`}
            icon={TrendingUp}
            iconColor="purple"
          />
        </div>

        {/* Filters and Search */}
        <SearchFilterSection
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search projects..."
          variant="modern"
          showActiveFilters={true}
          filters={[
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'paused', label: 'Paused' },
                { value: 'completed', label: 'Completed' },
                { value: 'planning', label: 'Planning' }
              ]
            },
            {
              key: 'priority',
              label: 'Priority',
              value: priorityFilter,
              onChange: setPriorityFilter,
              options: [
                { value: 'all', label: 'All Priority' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' }
              ]
            }
          ]}
        />

        {/* Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        // Open project details in a new tab
                        openTab(`/project/${project.id}`, `Project: ${project.name}`);
                      }}
                      title="View Project Details"
                    >
                      <Eye size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      title="Edit Project"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      title="More Options"
                    >
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

      </div>
    </AppLayout>
  );
};

export default ProjectsPage;
