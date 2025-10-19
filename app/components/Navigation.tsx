'use client';
import React from 'react';
import { 
  Menu,
  Bell,
  Search
} from 'lucide-react';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { useAuth } from '../hooks/useAuth';

interface NavigationProps {
  onMobileMenuClick: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onMobileMenuClick }) => {
  const { user } = useAuth();

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 w-full sticky top-0 z-30">
      <div className="flex items-center justify-between w-full">
        {/* Mobile Menu Button */}
        <div className="flex items-center min-w-0">
          <button
            onClick={onMobileMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 flex-shrink-0">
          

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative p-2">
            <Bell size={16} className="sm:w-4 sm:h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></span>
          </Button>

          {/* User Avatar */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 min-w-0">
            <Avatar 
              name={user?.name || 'User'} 
              size="sm"
              className="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all flex-shrink-0 sm:w-8 sm:h-8"
            />
            <div className="hidden sm:block min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate hidden lg:block">{user?.role || 'Project Manager'}</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
