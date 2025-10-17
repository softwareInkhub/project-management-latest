'use client';
import React, { useState } from 'react';
import { 
  Plus, 
  MoreVertical, 
  Calendar, 
  User, 
  Clock,
  CheckCircle,
  CheckSquare,
  Circle,
  AlertCircle,
  Flag,
  MessageSquare,
  Paperclip,
  Eye,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown
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

// Mock data for tasks
const tasks = [
  {
    id: 1,
    title: 'Design new landing page',
    description: 'Create a modern, responsive landing page design for the new product launch',
    status: 'in_progress',
    priority: 'high',
    assignee: { name: 'Sarah Johnson', avatar: null },
    project: 'Website Redesign',
    dueDate: '2024-03-15',
    createdAt: '2024-02-20',
    tags: ['design', 'frontend'],
    comments: 3,
    attachments: 2,
    estimatedHours: 8,
    actualHours: 5
  },
  {
    id: 2,
    title: 'Implement user authentication',
    description: 'Set up secure user authentication system with JWT tokens',
    status: 'todo',
    priority: 'high',
    assignee: { name: 'Mike Chen', avatar: null },
    project: 'Mobile App Development',
    dueDate: '2024-03-20',
    createdAt: '2024-02-18',
    tags: ['backend', 'security'],
    comments: 1,
    attachments: 0,
    estimatedHours: 12,
    actualHours: 0
  },
  {
    id: 3,
    title: 'Write API documentation',
    description: 'Create comprehensive documentation for all REST API endpoints',
    status: 'in_progress',
    priority: 'medium',
    assignee: { name: 'Alex Rodriguez', avatar: null },
    project: 'API Integration',
    dueDate: '2024-03-25',
    createdAt: '2024-02-15',
    tags: ['documentation', 'api'],
    comments: 5,
    attachments: 1,
    estimatedHours: 6,
    actualHours: 3
  },
  {
    id: 4,
    title: 'Conduct user interviews',
    description: 'Interview 10 users to gather feedback on the current product',
    status: 'completed',
    priority: 'medium',
    assignee: { name: 'Emily Davis', avatar: null },
    project: 'User Research Study',
    dueDate: '2024-02-28',
    createdAt: '2024-02-01',
    tags: ['research', 'user-feedback'],
    comments: 8,
    attachments: 4,
    estimatedHours: 10,
    actualHours: 12
  },
  {
    id: 5,
    title: 'Setup CI/CD pipeline',
    description: 'Configure automated testing and deployment pipeline',
    status: 'todo',
    priority: 'low',
    assignee: { name: 'David Kim', avatar: null },
    project: 'Database Migration',
    dueDate: '2024-04-10',
    createdAt: '2024-02-25',
    tags: ['devops', 'automation'],
    comments: 0,
    attachments: 0,
    estimatedHours: 16,
    actualHours: 0
  },
  {
    id: 6,
    title: 'Create marketing materials',
    description: 'Design banners, social media posts, and email templates for Q2 campaign',
    status: 'in_progress',
    priority: 'high',
    assignee: { name: 'Lisa Wang', avatar: null },
    project: 'Marketing Campaign',
    dueDate: '2024-03-10',
    createdAt: '2024-02-22',
    tags: ['marketing', 'design'],
    comments: 2,
    attachments: 3,
    estimatedHours: 14,
    actualHours: 8
  }
];

const statusConfig = {
  todo: { label: 'To Do', color: 'default', icon: Circle },
  in_progress: { label: 'In Progress', color: 'info', icon: Clock },
  completed: { label: 'Completed', color: 'success', icon: CheckCircle },
  blocked: { label: 'Blocked', color: 'danger', icon: AlertCircle }
};

const priorityConfig = {
  low: { label: 'Low', color: 'default', icon: ArrowDown },
  medium: { label: 'Medium', color: 'warning', icon: Flag },
  high: { label: 'High', color: 'danger', icon: ArrowUp }
};

const TasksPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const { openTab } = useTabs();

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesProject = projectFilter === 'all' || task.project === projectFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    return <Icon className="w-4 h-4" />;
  };

  const getPriorityIcon = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    const Icon = config.icon;
    return <Icon className="w-4 h-4" />;
  };

  const isOverdue = (dueDate: string) => {
    const task = tasks.find(t => t.dueDate === dueDate);
    return new Date(dueDate) < new Date() && task?.status !== 'completed';
  };

  return (
    <AppLayout>
      <div className="w-full px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tasks</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage and track all your tasks across projects</p>
          </div>
          <Button className="flex items-center justify-center space-x-2 w-full sm:w-auto">
            <Plus size={16} className="sm:w-4 sm:h-4" />
            <span className="text-sm sm:text-base">New Task</span>
          </Button>
        </div>

        {/* Task Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatsCard
            title="To Do"
            value={tasks.filter(t => t.status === 'todo').length}
            icon={Circle}
            iconColor="blue"
          />
          <StatsCard
            title="In Progress"
            value={tasks.filter(t => t.status === 'in_progress').length}
            icon={Clock}
            iconColor="yellow"
          />
          <StatsCard
            title="Completed"
            value={tasks.filter(t => t.status === 'completed').length}
            icon={CheckCircle}
            iconColor="green"
          />
          <StatsCard
            title="Overdue"
            value={tasks.filter(t => isOverdue(t.dueDate)).length}
            icon={AlertCircle}
            iconColor="red"
          />
        </div>

        {/* Filters and Search */}
        <SearchFilterSection
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search tasks..."
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
                { value: 'todo', label: 'To Do' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'blocked', label: 'Blocked' }
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
                value: 'kanban',
                label: 'Kanban',
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
            onChange: (view: 'list' | 'kanban') => setViewMode(view)
          }}
        />

        {/* Tasks List */}
        {viewMode === 'list' ? (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <Card key={task.id} hover>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Status Checkbox */}
                      <button className="mt-1">
                        {task.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                        )}
                      </button>

                      {/* Task Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className={`text-lg font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {task.title}
                          </h3>
                          <Badge variant={statusConfig[task.status as keyof typeof statusConfig].color as any} size="sm">
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(task.status)}
                              <span>{statusConfig[task.status as keyof typeof statusConfig].label}</span>
                            </div>
                          </Badge>
                          <Badge variant={priorityConfig[task.priority as keyof typeof priorityConfig].color as any} size="sm">
                            <div className="flex items-center space-x-1">
                              {getPriorityIcon(task.priority)}
                              <span>{priorityConfig[task.priority as keyof typeof priorityConfig].label}</span>
                            </div>
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{task.description}</p>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {task.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Task Meta */}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <User size={14} />
                              <span>{task.assignee.name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar size={14} />
                              <span className={isOverdue(task.dueDate) ? 'text-red-600' : ''}>
                                Due {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock size={14} />
                              <span>{task.actualHours}/{task.estimatedHours}h</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            {task.comments > 0 && (
                              <div className="flex items-center space-x-1">
                                <MessageSquare size={14} />
                                <span>{task.comments}</span>
                              </div>
                            )}
                            {task.attachments > 0 && (
                              <div className="flex items-center space-x-1">
                                <Paperclip size={14} />
                                <span>{task.attachments}</span>
                              </div>
                            )}
                            <span className="text-blue-600 font-medium">{task.project}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 ml-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          // Open task details in a new tab
                          openTab(`/task/${task.id}`, `Task: ${task.title}`);
                        }}
                        title="View Task Details"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        title="Edit Task"
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
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Kanban View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {Object.entries(statusConfig).map(([status, config]) => {
              const statusTasks = filteredTasks.filter(task => task.status === status);
              const Icon = config.icon;
              
              return (
                <div key={status} className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Icon className="w-5 h-5" />
                    <h3 className="font-medium text-gray-900">{config.label}</h3>
                    <Badge variant="default" size="sm">{statusTasks.length}</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {statusTasks.map((task) => (
                      <Card key={task.id} hover className="cursor-pointer">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                              <Badge variant={priorityConfig[task.priority as keyof typeof priorityConfig].color as any} size="sm">
                                {getPriorityIcon(task.priority)}
                              </Badge>
                            </div>
                            
                            <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
                            
                            <div className="flex items-center justify-between">
                              <Avatar name={task.assignee.name} size="sm" />
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                {task.comments > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <MessageSquare size={12} />
                                    <span>{task.comments}</span>
                                  </div>
                                )}
                                {task.attachments > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <Paperclip size={12} />
                                    <span>{task.attachments}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-xs text-gray-500">
                              Due {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
            <Button>Create New Task</Button>
          </div>
        )}

      </div>
    </AppLayout>
  );
};

export default TasksPage;
