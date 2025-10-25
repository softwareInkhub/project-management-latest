'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  Settings,
  Bell,
  Search,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  HelpCircle,
  Calendar,
  BookOpen
} from 'lucide-react';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useSidebar } from './AppLayout';
import { useTabs } from '../hooks/useTabs';

const navigation = [
  { name: 'Dashboard', href: '/Dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/project', icon: FolderKanban },
  { name: 'Tasks', href: '/task', icon: CheckSquare },
  { name: 'Sprint & Stories', href: '/sprint-stories', icon: BookOpen },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Calendar', href: '/calander', icon: Calendar },
  { name: 'Notifications', href: '/notifications', icon: Bell },
];

const secondaryNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings }
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onMobileClose }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { openTab } = useTabs();

  const toggleMobileSidebar = () => {
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center justify-between border-b border-gray-200 dark:border-gray-700 transition-all duration-300 h-17 ${
        isCollapsed ? 'p-4' : 'p-6'
      }`}>
        {!isCollapsed && (
          <div className="flex items-center space-x-2 ">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PM</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">ProjectFlow</span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">PM</span>
          </div>
        )}
        
        {/* Desktop Toggle Button */}
        {!isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="hidden lg:block p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        )}
        {isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="hidden lg:block p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mx-auto"
          >
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        )}
      </div>

     
      

      {/* Main Navigation */}
      <nav className={`flex-1 space-y-2 transition-all duration-300 ${
        isCollapsed ? 'p-2' : 'p-4'
      }`}>
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <button
              key={item.name}
              onClick={() => {
                openTab(item.href, item.name);
                toggleMobileSidebar();
              }}
              className={`flex items-center rounded-lg text-sm font-medium transition-colors group w-full ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 '
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              } ${
                isCollapsed 
                  ? 'justify-center px-2 py-3' 
                  : 'space-x-3 px-3 py-2.5'
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon
                size={20}
                className={`flex-shrink-0 ${
                  isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                }`}
              />
              {!isCollapsed && <span>{item.name}</span>}
            </button>
          );
        })}
      </nav>

      {/* Secondary Navigation */}
      <div className={`border-t border-gray-200 dark:border-gray-700 space-y-2 transition-all duration-300 ${
        isCollapsed ? 'p-2' : 'p-4'
      }`}>
        {secondaryNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <button
              key={item.name}
              onClick={() => {
                openTab(item.href, item.name);
                toggleMobileSidebar();
              }}
              className={`flex items-center rounded-lg text-sm font-medium transition-colors group w-full ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              } ${
                isCollapsed 
                  ? 'justify-center px-2 py-3' 
                  : 'space-x-3 px-3 py-2.5'
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon
                size={20}
                className={`flex-shrink-0 ${
                  isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                }`}
              />
              {!isCollapsed && <span>{item.name}</span>}
            </button>
          );
        })}
      </div>

      {/* User Profile */}
      <div className={`border-t border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        isCollapsed ? 'p-2' : 'p-4'
      }`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <Avatar 
            name={user?.name || user?.username || user?.email || 'User'} 
            size="md" 
          />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name || user?.username || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email || user?.role || 'Member'}
              </p>
            </div>
          )}
        </div>
        
        {!isCollapsed && (
          <div className="mt-3 flex space-x-2 border-t border-gray-200 dark:border-gray-700 pt-3">
            <Button
              size="sm"
              onClick={logout}
              className="flex-1 flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </Button>
          </div>
        )}
        
        {isCollapsed && (
          <div className="mt-2 flex justify-center">
            <Button
              size="sm"
              onClick={logout}
              className="p-2 bg-gray-600 hover:bg-gray-700 text-white"
              title="Logout"
            >
              <LogOut size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 bg-opacity-50 z-[55] lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-[60] w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
     
        <div className="h-full overflow-y-auto overflow-x-hidden">
          <SidebarContent />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-40 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        isCollapsed ? 'lg:w-16' : 'lg:w-64'
      }`}>
        <div className="h-full overflow-y-auto overflow-x-hidden">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};
