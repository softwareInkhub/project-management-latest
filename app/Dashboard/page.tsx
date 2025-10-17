'use client';
import React from 'react';
import { 
  TrendingUp, 
  Users, 
  FolderKanban, 
  CheckSquare, 
  Clock,
  AlertCircle,
  Plus,
  Calendar,
  Target,
  Activity
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Avatar } from '../components/ui/Avatar';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../hooks/useAuth';

// Mock data for charts and activities
const projectStats = [
  { name: 'Jan', completed: 12, inProgress: 8, pending: 5 },
  { name: 'Feb', completed: 18, inProgress: 12, pending: 7 },
  { name: 'Mar', completed: 25, inProgress: 15, pending: 10 },
  { name: 'Apr', completed: 30, inProgress: 18, pending: 12 },
  { name: 'May', completed: 35, inProgress: 20, pending: 15 },
  { name: 'Jun', completed: 42, inProgress: 25, pending: 18 },
];

const recentActivities = [
  {
    id: 1,
    type: 'task_completed',
    user: 'Sarah Johnson',
    action: 'completed task',
    target: 'Design System Update',
    time: '2 minutes ago',
    avatar: null
  },
  {
    id: 2,
    type: 'project_created',
    user: 'Mike Chen',
    action: 'created project',
    target: 'Mobile App Redesign',
    time: '15 minutes ago',
    avatar: null
  },
  {
    id: 3,
    type: 'comment_added',
    user: 'Emily Davis',
    action: 'commented on',
    target: 'User Research Report',
    time: '1 hour ago',
    avatar: null
  },
  {
    id: 4,
    type: 'task_assigned',
    user: 'Alex Rodriguez',
    action: 'assigned task',
    target: 'API Documentation',
    time: '2 hours ago',
    avatar: null
  },
  {
    id: 5,
    type: 'milestone_reached',
    user: 'Team',
    action: 'reached milestone',
    target: 'Q2 Sprint Goals',
    time: '3 hours ago',
    avatar: null
  }
];

const upcomingTasks = [
  {
    id: 1,
    title: 'Review Design Mockups',
    project: 'Website Redesign',
    dueDate: 'Today',
    priority: 'high',
    assignee: 'Sarah Johnson'
  },
  {
    id: 2,
    title: 'Update User Documentation',
    project: 'API Integration',
    dueDate: 'Tomorrow',
    priority: 'medium',
    assignee: 'Mike Chen'
  },
  {
    id: 3,
    title: 'Conduct User Interviews',
    project: 'Mobile App',
    dueDate: 'This Week',
    priority: 'high',
    assignee: 'Emily Davis'
  }
];

const Dashboard = () => {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'User'}! Here's what's happening.</p>
          </div>
          <Button className="flex items-center space-x-2">
            <Plus size={18} />
            <span>New Project</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-3xl font-bold text-gray-900">24</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp size={14} className="mr-1" />
                  +12% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                <p className="text-3xl font-bold text-gray-900">156</p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <Activity size={14} className="mr-1" />
                  8 completed today
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Team Members</p>
                <p className="text-3xl font-bold text-gray-900">12</p>
                <p className="text-sm text-purple-600 flex items-center mt-1">
                  <Users size={14} className="mr-1" />
                  2 new this week
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900">87%</p>
                <p className="text-sm text-orange-600 flex items-center mt-1">
                  <Target size={14} className="mr-1" />
                  +5% this month
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Project Progress Chart */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span>Project Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {projectStats.slice(-3).map((stat, index) => (
                    <div key={stat.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">{stat.name}</span>
                        <span className="text-sm text-gray-500">{stat.completed} completed</span>
                      </div>
                      <ProgressBar 
                        value={stat.completed} 
                        max={stat.completed + stat.inProgress + stat.pending}
                        color="blue"
                        size="md"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{stat.inProgress} in progress</span>
                        <span>{stat.pending} pending</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <Avatar name={activity.user} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{activity.user}</span> {activity.action}{' '}
                          <span className="font-medium text-blue-600">{activity.target}</span>
                        </p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span>Upcoming Tasks</span>
                </CardTitle>
                <Button variant="outline" size="sm">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <p className="text-sm text-gray-600">{task.project}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge 
                        variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'default'}
                        size="sm"
                      >
                        {task.priority}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{task.assignee}</p>
                        <p className="text-xs text-gray-500">{task.dueDate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <FolderKanban className="w-6 h-6" />
                  <span>Create Project</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <CheckSquare className="w-6 h-6" />
                  <span>Add Task</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Users className="w-6 h-6" />
                  <span>Invite Team</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;