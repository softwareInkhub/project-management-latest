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
import { StatsCard } from '../components/ui/StatsCard';
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
      <div className="w-full px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 overflow-x-hidden bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
        {/* Modern Header with Gradient */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl opacity-10"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/20 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Dashboard
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Welcome back, <span className="font-semibold text-blue-600">{user?.name || 'User'}</span>! 
                      <span className="block sm:inline sm:ml-1">Here's your project overview.</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <Plus size={18} className="mr-2" />
                  New Project
                </Button>
                <Button variant="outline" className="border-gray-200 hover:bg-gray-50 shadow-sm">
                  <Calendar size={18} className="mr-2" />
                  Schedule
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">24</div>
                  <div className="text-blue-100 text-sm">+12%</div>
                </div>
              </div>
              <h3 className="text-white font-semibold mb-1">Total Projects</h3>
              <p className="text-blue-100 text-sm">from last month</p>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <CheckSquare className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">156</div>
                  <div className="text-emerald-100 text-sm">8 today</div>
                </div>
              </div>
              <h3 className="text-white font-semibold mb-1">Active Tasks</h3>
              <p className="text-emerald-100 text-sm">completed today</p>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">12</div>
                  <div className="text-purple-100 text-sm">+2 new</div>
                </div>
              </div>
              <h3 className="text-white font-semibold mb-1">Team Members</h3>
              <p className="text-purple-100 text-sm">this week</p>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">87%</div>
                  <div className="text-orange-100 text-sm">+5%</div>
                </div>
              </div>
              <h3 className="text-white font-semibold mb-1">Completion Rate</h3>
              <p className="text-orange-100 text-sm">this month</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
          {/* Project Progress Chart */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Project Progress</h2>
                </div>
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                </div>
              </div>
              <div className="space-y-6">
                {projectStats.slice(-3).map((stat, index) => (
                  <div key={stat.name} className="group">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold text-gray-800">{stat.name}</span>
                      <span className="text-sm font-bold text-blue-600">{stat.completed} completed</span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${(stat.completed / (stat.completed + stat.inProgress + stat.pending)) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span className="flex items-center">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></div>
                          {stat.inProgress} in progress
                        </span>
                        <span className="flex items-center">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                          {stat.pending} pending
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20 h-full">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              </div>
              <div className="space-y-4">
                {recentActivities.slice(0, 5).map((activity, index) => (
                  <div key={activity.id} className="group flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="relative">
                      <Avatar name={activity.user} size="sm" />
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                        index === 0 ? 'bg-emerald-500' : 
                        index === 1 ? 'bg-blue-500' : 
                        index === 2 ? 'bg-purple-500' : 
                        index === 3 ? 'bg-orange-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 leading-relaxed">
                        <span className="font-semibold text-gray-800">{activity.user}</span> {activity.action}{' '}
                        <span className="font-semibold text-blue-600">{activity.target}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Upcoming Tasks</h2>
              </div>
              <Button variant="outline" className="border-gray-200 hover:bg-gray-50 shadow-sm">
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {upcomingTasks.map((task, index) => (
                <div key={task.id} className="group relative overflow-hidden bg-gradient-to-r from-gray-50 to-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        task.priority === 'high' ? 'bg-red-500' : 
                        task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{task.title}</h4>
                        <p className="text-sm text-gray-600">{task.project}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' : 
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {task.priority}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{task.assignee}</p>
                        <p className="text-xs text-gray-500">{task.dueDate}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-2xl p-6 border border-blue-200 hover:border-blue-300 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FolderKanban className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-semibold text-gray-800 group-hover:text-blue-700">Create Project</span>
                </div>
              </button>
              
              <button className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 rounded-2xl p-6 border border-emerald-200 hover:border-emerald-300 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckSquare className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-semibold text-gray-800 group-hover:text-emerald-700">Add Task</span>
                </div>
              </button>
              
              <button className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-2xl p-6 border border-purple-200 hover:border-purple-300 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-semibold text-gray-800 group-hover:text-purple-700">Invite Team</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;