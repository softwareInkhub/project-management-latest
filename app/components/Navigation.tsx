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
    <nav className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 lg:ml-64 sticky top-0 z-30">
      <div className="flex items-center justify-between max-w-full">
        {/* Mobile Menu Button */}
        <div className="flex items-center space-x-4 min-w-0">
          <button
            onClick={onMobileMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          
          {/* Page Title - will be set by individual pages */}
          <div className="hidden lg:block min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">Welcome back!</h1>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
          {/* Search */}
          <Button variant="ghost" size="sm" className="hidden md:flex">
            <Search size={18} />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </Button>

          {/* User Avatar */}
          <div className="flex items-center space-x-2 lg:space-x-3 min-w-0">
            <Avatar 
              name={user?.name || 'User'} 
              size="md"
              className="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all flex-shrink-0"
            />
            <div className="hidden md:block min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.role || 'Project Manager'}</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
