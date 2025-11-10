'use client';
import React from 'react';
import { 
  Menu,
  Bell,
  Search,
  TrendingUp,
  Building2,
  Briefcase,
  Users,
  Calendar as CalendarIcon,
  CheckSquare,
  BookOpen,
  FolderOpen,
  Settings as SettingsIcon
} from 'lucide-react';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { useAuth } from '../hooks/useAuth';
import { usePathname } from 'next/navigation';
import { formatEmailForDisplay, formatUserDisplayName } from '../utils/emailUtils';

interface NavigationProps {
  onMobileMenuClick: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onMobileMenuClick }) => {
  const { user } = useAuth();
  const pathname = usePathname();
  const isDashboard = pathname === '/Dashboard' || pathname === '/';
  const isProjects = pathname === '/project';
  
  // Fixed navbar height to match sidebar border alignment - 80px (h-20)
  const navPaddingClass = 'px-3 sm:px-4 lg:px-6 h-20 pt-4';
  
  // Get page title based on current route
  const getPageTitle = () => {
    if (isDashboard) return 'Dashboard';
    if (isProjects) return 'Projects';
    if (pathname === '/task') return 'Tasks';
    if (pathname === '/sprint-stories') return 'Sprint & Stories';
    if (pathname === '/companies') return 'Companies';
    if (pathname === '/departments') return 'Departments';
    if (pathname === '/team') return 'Team';
    if (pathname === '/calander') return 'Calendar';
    if (pathname === '/notifications') return 'Notifications';
    if (pathname === '/settings') return 'Settings';
    return 'ProjectFlow';
  };

  // Get page icon based on current route
  const getPageIcon = () => {
    if (isDashboard) return TrendingUp;
    if (isProjects) return FolderOpen;
    if (pathname === '/task') return CheckSquare;
    if (pathname === '/sprint-stories') return BookOpen;
    if (pathname === '/companies') return Building2;
    if (pathname === '/departments') return Briefcase;
    if (pathname === '/team') return Users;
    if (pathname === '/calander') return CalendarIcon;
    if (pathname === '/notifications') return Bell;
    if (pathname === '/settings') return SettingsIcon;
    return TrendingUp;
  };

  const PageIcon = getPageIcon();

  return (
    <nav className={`bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 ${navPaddingClass} w-full sticky top-0 z-30`}>
      <div className="flex items-center justify-between w-full">
        {/* Left Side - Mobile Menu + Page Title */}
        <div className="flex items-center min-w-0 flex-1">
          <button
            onClick={onMobileMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0 mr-2"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          
          {/* Page Title */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <PageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {getPageTitle()}
              </h1>
              {isDashboard && (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                  Welcome back, <span className="font-semibold text-blue-600 dark:text-blue-400">{formatUserDisplayName(user?.name, user?.username, user?.email)}</span>!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 flex-shrink-0">
          

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative p-2"
            onClick={() => window.location.href = '/notifications'}
          >
            <Bell size={16} className="sm:w-4 sm:h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></span>
          </Button>

          {/* User Avatar */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 min-w-0">
            <button
              type="button"
              className="rounded-full focus:outline-none"
              onClick={() => {
                // Navigate to settings when tapped on mobile view only
                if (typeof window !== 'undefined' && window.innerWidth < 640) {
                  window.location.href = '/settings';
                }
              }}
            >
              <Avatar 
                name={user?.name || user?.username || user?.email || 'User'} 
                size="sm"
                className="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all flex-shrink-0 sm:w-8 sm:h-8"
              />
            </button>
            <div className="hidden sm:block min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                {formatUserDisplayName(user?.name, user?.username, user?.email)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate hidden lg:block">
                {formatEmailForDisplay(user?.email) || user?.role || 'Project Manager'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
