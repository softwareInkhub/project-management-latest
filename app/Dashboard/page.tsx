'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Activity,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Filter,
  X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Avatar } from '../components/ui/Avatar';
import { StatsCard } from '../components/ui/StatsCard';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

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
  const router = useRouter();
  
  // DEBUG: Log component mount and state changes
  useEffect(() => {
    console.log('[Dashboard] 🎯 Component mounted');
    console.log('[Dashboard] 👤 User:', user?.email);
    console.log('[Dashboard] 🔐 isAuthenticated:', isAuthenticated);
  }, []);
  
  useEffect(() => {
    console.log('[Dashboard] 🔄 State changed:', { user: user?.email, isAuthenticated });
  }, [user, isAuthenticated]);
  
  const [dashboardData, setDashboardData] = useState({
    projects: [] as any[],
    tasks: [] as any[],
    teams: [] as any[],
    users: [] as any[],
    stats: {
      totalProjects: 0,
      activeTasks: 0,
      teamMembers: 0,
      completionRate: 0,
      projectGrowth: 0,
      taskGrowth: 0,
      userGrowth: 0
    },
    loading: true,
    error: null as string | null
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [taskStatusData, setTaskStatusData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'week', 'month'
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    project: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [upcomingTasksFilter, setUpcomingTasksFilter] = useState('due'); // 'due' or 'starting'

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      console.log('🔄 Fetching dashboard data...');
      
      const [projectsRes, tasksRes, teamsRes, usersRes] = await Promise.all([
        apiService.getProjects(),
        apiService.getTasks(),
        apiService.getTeams(),
        apiService.getUsers()
      ]);

      console.log('📊 API Responses:', { projectsRes, tasksRes, teamsRes, usersRes });

      const projects = projectsRes.success ? projectsRes.data || [] : [];
      const tasks = tasksRes.success ? tasksRes.data || [] : [];
      const teams = teamsRes.success ? teamsRes.data || [] : [];
      const users = usersRes.success ? usersRes.data || [] : [];

      console.log('📈 Data counts:', { 
        projects: projects.length, 
        tasks: tasks.length, 
        teams: teams.length, 
        users: users.length 
      });

      // Calculate enhanced stats
      const completedTasks = tasks.filter(task => task.status === 'Completed').length;
      const inProgressTasks = tasks.filter(task => task.status === 'In Progress').length;
      const pendingTasks = tasks.filter(task => task.status === 'To Do').length;
      const totalTasks = tasks.length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      // Calculate growth percentages (mock for now, but could be real)
      const projectGrowth = projects.length > 0 ? Math.min(projects.length * 2, 25) : 12;
      const taskGrowth = tasks.length > 0 ? Math.min(tasks.length, 15) : 8;
      const userGrowth = users.length > 0 ? Math.min(users.length, 8) : 2;

      console.log('📊 Calculated stats:', {
        completedTasks,
        inProgressTasks,
        pendingTasks,
        totalTasks,
        completionRate,
        projectGrowth,
        taskGrowth,
        userGrowth
      });

      // Filter tasks based on time range and filters
      const filteredTasks = filterTasks(tasks, timeRange, filters);
      
      // Generate chart data from filtered tasks
      const monthlyData = generateMonthlyChartData(filteredTasks);
      const statusData = generateTaskStatusData(filteredTasks);
      const activities = generateRecentActivities(filteredTasks, projects);
      const upcoming = generateUpcomingTasks(filteredTasks);

      setDashboardData({
        projects,
        tasks,
        teams,
        users,
        stats: {
          totalProjects: projects.length,
          activeTasks: tasks.filter(task => task.status !== 'Completed').length,
          teamMembers: users.length,
          completionRate,
          projectGrowth,
          taskGrowth,
          userGrowth
        },
        loading: false,
        error: null
      });

      setChartData(monthlyData);
      setTaskStatusData(statusData);
      setRecentActivities(activities);
      setUpcomingTasks(upcoming);

      console.log('✅ Dashboard data loaded successfully');

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load dashboard data'
      }));
    } finally {
      setRefreshing(false);
    }
  };

  // Filter tasks by time range and other filters
  const filterTasks = (tasks: any[], timeRange: string, filters: any) => {
    let filteredTasks = [...tasks];

    // Time range filter
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (timeRange) {
      case 'week':
        filteredTasks = filteredTasks.filter(task => {
          const taskDate = new Date(task.createdAt || task.updatedAt);
          return taskDate >= oneWeekAgo;
        });
        break;
      case 'month':
        filteredTasks = filteredTasks.filter(task => {
          const taskDate = new Date(task.createdAt || task.updatedAt);
          return taskDate >= oneMonthAgo;
        });
        break;
    }

    // Status filter
    if (filters.status !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
    }

    // Assignee filter
    if (filters.assignee !== 'all') {
      filteredTasks = filteredTasks.filter(task => 
        task.assignee === filters.assignee || 
        (task.assignedUsers && task.assignedUsers.includes(filters.assignee)) ||
        (task.assignedTeams && task.assignedTeams.includes(filters.assignee))
      );
    }

    // Project filter
    if (filters.project !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.project === filters.project);
    }

    return filteredTasks;
  };

  // Generate monthly chart data
  const generateMonthlyChartData = (tasks: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    // If no tasks, generate sample data for demonstration
    if (tasks.length === 0) {
      return months.slice(Math.max(0, currentMonth - 5), currentMonth + 1).map((month, index) => ({
        name: month,
        completed: Math.floor(Math.random() * 20) + 10,
        inProgress: Math.floor(Math.random() * 15) + 5,
        pending: Math.floor(Math.random() * 10) + 3,
        total: Math.floor(Math.random() * 30) + 15
      }));
    }
    
    return months.slice(Math.max(0, currentMonth - 5), currentMonth + 1).map((month, index) => {
      const monthIndex = currentMonth - 5 + index;
      const monthTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate.getMonth() === monthIndex;
      });
      
      // If no tasks for this month, generate some sample data
      if (monthTasks.length === 0) {
        return {
          name: month,
          completed: Math.floor(Math.random() * 8) + 2,
          inProgress: Math.floor(Math.random() * 6) + 1,
          pending: Math.floor(Math.random() * 4) + 1,
          total: Math.floor(Math.random() * 12) + 3
        };
      }
      
      return {
        name: month,
        completed: monthTasks.filter(task => task.status === 'Completed').length,
        inProgress: monthTasks.filter(task => task.status === 'In Progress').length,
        pending: monthTasks.filter(task => task.status === 'To Do').length,
        total: monthTasks.length
      };
    });
  };

  // Generate task status data for pie chart
  const generateTaskStatusData = (tasks: any[]) => {
    const statusCounts = tasks.reduce((acc: any, task: any) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    // If no tasks, generate sample data
    if (Object.keys(statusCounts).length === 0) {
      return [
        { name: 'Completed', value: 15, color: '#10b981' },
        { name: 'In Progress', value: 8, color: '#3b82f6' },
        { name: 'To Do', value: 5, color: '#f59e0b' },
        { name: 'On Hold', value: 2, color: '#ef4444' }
      ];
    }

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      color: getStatusColor(status)
    }));
  };

  // Get color for status
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'Completed': '#10b981',
      'In Progress': '#3b82f6',
      'To Do': '#f59e0b',
      'On Hold': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  // Generate recent activities
  const generateRecentActivities = (tasks: any[], projects: any[]) => {
    const activities: any[] = [];
    
    // Add recent task completions
    const recentTasks = tasks
      .filter((task: any) => task.status === 'Completed')
      .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3);

    recentTasks.forEach((task: any) => {
      activities.push({
        id: `task-${task.id}`,
        type: 'task_completed',
        user: task.assignee,
        action: 'completed task',
        target: task.title,
        time: getTimeAgo(task.updatedAt),
        avatar: null
      });
    });

    // Add recent project activities
    const recentProjects = projects.slice(0, 2);
    recentProjects.forEach((project: any) => {
      activities.push({
        id: `project-${project.id}`,
        type: 'project_created',
        user: project.assignee || 'Team',
        action: 'created project',
        target: project.name,
        time: getTimeAgo(project.createdAt),
        avatar: null
      });
    });

    return activities.slice(0, 5);
  };

  // Generate upcoming tasks
  const generateUpcomingTasks = (tasks: any[]) => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Show tasks within next 7 days

    console.log('🔍 Debugging upcoming tasks:');
    console.log('Current time:', now.toISOString());
    console.log('Next week:', nextWeek.toISOString());
    console.log('Total tasks:', tasks.length);
    console.log('Filter type:', upcomingTasksFilter);

    const upcomingTasks = tasks
      .filter((task: any) => {
        const isNotCompleted = task.status !== 'Completed';
        
        if (upcomingTasksFilter === 'starting') {
          // Filter by start date
          if (!task.startDate) {
            console.log(`Task: ${task.title} - No start date, skipping`);
            return false;
          }

          const startDate = new Date(task.startDate);
          
          // Check if date is valid
          if (isNaN(startDate.getTime())) {
            console.log(`Task: ${task.title} - Invalid start date: ${task.startDate}, skipping`);
            return false;
          }

          const isStartingThisWeek = startDate >= now && startDate <= nextWeek;
          
          console.log(`Task: ${task.title}`);
          console.log(`  Start date: ${task.startDate} -> ${startDate.toISOString()}`);
          console.log(`  Status: ${task.status}`);
          console.log(`  Starting this week: ${isStartingThisWeek}`);
          console.log(`  Not completed: ${isNotCompleted}`);
          console.log(`  Will show: ${isStartingThisWeek && isNotCompleted}`);
          
          return isStartingThisWeek && isNotCompleted;
        } else {
          // Filter by due date (default)
          if (!task.dueDate) {
            console.log(`Task: ${task.title} - No due date, skipping`);
            return false;
          }

          const dueDate = new Date(task.dueDate);
          
          // Check if date is valid
          if (isNaN(dueDate.getTime())) {
            console.log(`Task: ${task.title} - Invalid due date: ${task.dueDate}, skipping`);
            return false;
          }

          const isWithinWeek = dueDate >= now && dueDate <= nextWeek;
          
          console.log(`Task: ${task.title}`);
          console.log(`  Due date: ${task.dueDate} -> ${dueDate.toISOString()}`);
          console.log(`  Status: ${task.status}`);
          console.log(`  Within week: ${isWithinWeek}`);
          console.log(`  Not completed: ${isNotCompleted}`);
          console.log(`  Will show: ${isWithinWeek && isNotCompleted}`);
          
          return isWithinWeek && isNotCompleted;
        }
      })
      .sort((a: any, b: any) => {
        const dateA = upcomingTasksFilter === 'starting' ? new Date(a.startDate) : new Date(a.dueDate);
        const dateB = upcomingTasksFilter === 'starting' ? new Date(b.startDate) : new Date(b.dueDate);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 5)
      .map((task: any) => ({
        id: task.id,
        title: task.title,
        project: task.project,
        dueDate: upcomingTasksFilter === 'starting' ? formatActualDate(task.startDate) : formatActualDate(task.dueDate),
        priority: task.priority ? task.priority.toLowerCase() : 'medium',
        assignee: task.assignee,
        startDate: task.startDate,
        isStarting: upcomingTasksFilter === 'starting'
      }));

    console.log('📅 Upcoming tasks found:', upcomingTasks.length);
    return upcomingTasks;
  };

  // Helper functions
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const getDueDateText = (dateString: string) => {
    if (!dateString) return 'No due date';
    
    const now = new Date();
    const dueDate = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(dueDate.getTime())) return 'Invalid date';
    
    const diffInDays = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 0) return 'Overdue';
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Tomorrow';
    if (diffInDays < 7) return 'This Week';
    return 'Next Week';
  };

  // Format date for display (e.g., "Jan 15, 2025")
  const formatActualDate = (dateString: string) => {
    if (!dateString) return 'No date';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    };
    
    return date.toLocaleDateString('en-US', options);
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    console.log('[Dashboard] useEffect triggered:', { isAuthenticated, user: user?.email });
    // Fetch data if we have user data (even if isAuthenticated flag is temporarily false)
    if (isAuthenticated || user) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user, timeRange, filters, upcomingTasksFilter]);

  // Show loading ONLY if we have no user data at all (before AuthGuard completes)
  // Since useAuth initializes from localStorage, user should be available immediately
  if (!user) {
    console.log('[Dashboard] No user data, showing loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (dashboardData.loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="w-full px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 overflow-x-hidden bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
        {/* Modern Header with Gradient */}
        <div className="relative mb-4 sm:mb-6 lg:mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl sm:rounded-3xl opacity-10"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/20 dark:border-gray-700 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center justify-between lg:justify-start">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      Dashboard
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 truncate">
                      Welcome back, <span className="font-semibold text-blue-600 dark:text-blue-400">{user?.name || 'User'}</span>!
                    </p>
                  </div>
                </div>
                
                {/* Filter and Refresh buttons positioned opposite to title */}
                <div className="flex items-center gap-2 lg:hidden">
                  <Button 
                    onClick={() => setShowFilters(!showFilters)}
                    variant="outline"
                    size="sm"
                    className="border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm p-2"
                  >
                    <Filter className="w-4 h-4" />
                  </Button>
                  
                  <Button 
                    onClick={fetchDashboardData}
                    disabled={refreshing}
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 p-2"
                  >
                    {refreshing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {/* Desktop Filter and Refresh buttons */}
                <div className="hidden lg:flex items-center gap-2">
                  <Button 
                    onClick={() => setShowFilters(!showFilters)}
                    variant="outline"
                    size="sm"
                    className="border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters {Object.values(filters).filter(f => f !== 'all').length > 0 && `(${Object.values(filters).filter(f => f !== 'all').length})`}
                  </Button>
                  
                  <Button 
                    onClick={fetchDashboardData}
                    disabled={refreshing}
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                  >
                    {refreshing ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                </div>
                
                <Button 
                  onClick={() => router.push('/project')}
                  size="sm"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                >
                  <Plus size={16} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline ml-2 text-sm">New Project</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-white/20 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Dashboard Filters</h2>
                </div>
                <Button 
                  onClick={() => setShowFilters(false)}
                  variant="outline"
                  size="sm"
                  className="border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Time Range Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Time Range
                  </label>
                  <select 
                    value={timeRange} 
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Time</option>
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select 
                    value={filters.status} 
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Statuses</option>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select 
                    value={filters.priority} 
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                {/* Project Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Project
                  </label>
                  <select 
                    value={filters.project} 
                    onChange={(e) => setFilters(prev => ({ ...prev, project: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Projects</option>
                    {dashboardData.projects.map((project: any) => (
                      <option key={project.id} value={project.name || project.title}>
                        {project.name || project.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {Object.values(filters).filter(f => f !== 'all').length > 0 && (
                    <span>
                      {Object.values(filters).filter(f => f !== 'all').length} filter(s) active
                    </span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => setFilters({ status: 'all', priority: 'all', assignee: 'all', project: 'all' })}
                    variant="outline"
                    size="sm"
                    className="border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Clear All
                  </Button>
                  <Button 
                    onClick={() => setShowFilters(false)}
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-0">
                  <FolderKanban className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {dashboardData.stats.totalProjects}
                  </div>
                  <div className="text-blue-100 text-xs sm:text-sm">
                    {dashboardData.stats.totalProjects > 0 ? (
                      <span className="flex items-center">
                        <ArrowUp className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                        <span className="text-xs">+{dashboardData.stats.projectGrowth || 0}%</span>
                      </span>
                    ) : (
                      <span className="text-xs">No projects</span>
                    )}
                  </div>
                </div>
              </div>
              <h3 className="text-white font-semibold text-sm sm:text-base mb-0.5 sm:mb-1">Total Projects</h3>
              <p className="text-blue-100 text-xs sm:text-sm">across all teams</p>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-0">
                  <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {dashboardData.stats.activeTasks}
                  </div>
                  <div className="text-emerald-100 text-xs sm:text-sm">
                    {dashboardData.stats.activeTasks > 0 ? (
                      <span className="flex items-center">
                        <ArrowUp className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                        <span className="text-xs">+{dashboardData.stats.taskGrowth || 0} today</span>
                      </span>
                    ) : (
                      <span className="text-xs">All done!</span>
                    )}
                  </div>
                </div>
              </div>
              <h3 className="text-white font-semibold text-sm sm:text-base mb-0.5 sm:mb-1">Active Tasks</h3>
              <p className="text-emerald-100 text-xs sm:text-sm">currently in progress</p>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {dashboardData.stats.teamMembers}
                  </div>
                  <div className="text-purple-100 text-xs sm:text-sm">
                    {dashboardData.stats.teamMembers > 0 ? (
                      <span className="flex items-center">
                        <ArrowUp className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                        <span className="text-xs">+{dashboardData.stats.userGrowth || 0} new</span>
                      </span>
                    ) : (
                      <span className="text-xs">No members</span>
                    )}
                  </div>
                </div>
              </div>
              <h3 className="text-white font-semibold text-sm sm:text-base mb-0.5 sm:mb-1">Team Members</h3>
              <p className="text-purple-100 text-xs sm:text-sm">across all teams</p>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-0">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {dashboardData.stats.completionRate}%
                  </div>
                  <div className="text-orange-100 text-xs sm:text-sm">
                    {dashboardData.stats.completionRate > 0 ? (
                      <span className="flex items-center">
                        {dashboardData.stats.completionRate >= 80 ? (
                          <ArrowUp className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                        ) : (
                          <ArrowDown className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                        )}
                        <span className="text-xs">{dashboardData.stats.completionRate >= 80 ? '+5%' : 'Needs work'}</span>
                      </span>
                    ) : (
                      <span className="text-xs">No tasks</span>
                    )}
                  </div>
                </div>
              </div>
              <h3 className="text-white font-semibold text-sm sm:text-base mb-0.5 sm:mb-1">Completion Rate</h3>
              <p className="text-orange-100 text-xs sm:text-sm">overall progress</p>
            </div>
          </div>
        </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6 lg:mb-8">
              {/* Project Progress Chart */}
              <div className="lg:col-span-2">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-white/20 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">Task Progress</h2>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full"></div>
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="h-64 sm:h-72 lg:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#f9fafb'
                          }}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="completed"
                          stackId="1"
                          stroke="#10b981"
                          fill="url(#colorCompleted)"
                          name="Completed"
                        />
                        <Area
                          type="monotone"
                          dataKey="inProgress"
                          stackId="1"
                          stroke="#3b82f6"
                          fill="url(#colorInProgress)"
                          name="In Progress"
                        />
                        <Area
                          type="monotone"
                          dataKey="pending"
                          stackId="1"
                          stroke="#f59e0b"
                          fill="url(#colorPending)"
                          name="Pending"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Task Status Pie Chart */}
              <div className="lg:col-span-1">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-white/20 dark:border-gray-700">
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                      <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">Task Status</h2>
                  </div>
                  <div className="h-64 sm:h-72 lg:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={taskStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) => {
                            const percentage = ((percent as number) * 100).toFixed(0);
                            return percentage !== '0' ? `${name} ${percentage}%` : '';
                          }}
                          outerRadius={100}
                          innerRadius={20}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {taskStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#f9fafb'
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          iconType="circle"
                          wrapperStyle={{
                            fontSize: '12px',
                            paddingTop: '10px'
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity and Upcoming Tasks Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6 lg:mb-8">
              {/* Recent Activity */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-white/20 dark:border-gray-700">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
                </div>
                <div className="space-y-3 sm:space-y-4 max-h-64 overflow-y-auto">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity, index) => (
                      <div key={activity.id} className="group flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="relative">
                          <Avatar name={activity.user} size="sm" />
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                            index === 0 ? 'bg-emerald-500' : 
                            index === 1 ? 'bg-blue-500' : 
                            index === 2 ? 'bg-purple-500' : 
                            index === 3 ? 'bg-orange-500' : 'bg-gray-400'
                          }`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{activity.user}</span> {activity.action}{' '}
                            <span className="font-semibold text-blue-600 dark:text-blue-400">{activity.target}</span>
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity</p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Complete some tasks to see activity here</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Tasks */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-white/20 dark:border-gray-700">
                <div className="flex flex-col space-y-3 mb-4 sm:mb-6">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">Upcoming Tasks</h2>
                  </div>
                  {/* Filter Toggle */}
                  <div className="flex items-center space-x-1 sm:space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-full sm:w-auto">
                    <button
                      onClick={() => setUpcomingTasksFilter('due')}
                      className={`flex-1 sm:flex-initial px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                        upcomingTasksFilter === 'due'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      Due Soon
                    </button>
                    <button
                      onClick={() => setUpcomingTasksFilter('starting')}
                      className={`flex-1 sm:flex-initial px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                        upcomingTasksFilter === 'starting'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      Starting Soon
                    </button>
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4 max-h-64 overflow-y-auto">
                  {upcomingTasks.length > 0 ? (
                    upcomingTasks.map((task, index) => (
                      <div key={task.id} className="group relative overflow-hidden bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-gray-100 dark:border-gray-600 hover:shadow-lg transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02]">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-1 min-w-0">
                            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${
                              task.priority === 'high' ? 'bg-red-500' : 
                              task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}></div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{task.title}</h4>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">{task.project}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3 lg:space-x-4">
                            <div className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                              task.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 
                              task.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 
                              'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            }`}>
                              {task.priority}
                            </div>
                            <div className="text-right">
                              <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">{task.assignee}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                {task.isStarting ? '🚀 ' : '📅 '}{task.dueDate}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {upcomingTasksFilter === 'starting' ? 'No tasks starting this week' : 'No upcoming tasks'}
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                        {upcomingTasksFilter === 'starting' 
                          ? 'No tasks are scheduled to start within the next 7 days.' 
                          : 'All caught up! Great job staying on top of your tasks.'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>


        
      </div>
    </AppLayout>
  );
};

export default Dashboard;