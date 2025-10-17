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
  HelpCircle
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
  { name: 'Team', href: '/team', icon: Users },
];

const secondaryNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help & Support', href: '/help', icon: HelpCircle },
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
      <div className={`flex items-center justify-between border-b border-gray-200 transition-all duration-300 h-17 ${
        isCollapsed ? 'p-4' : 'p-6'
      }`}>
        {!isCollapsed && (
          <div className="flex items-center space-x-2 ">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PM</span>
            </div>
            <span className="text-xl font-bold text-gray-900">ProjectFlow</span>
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
            className="hidden lg:block p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
        )}
        {isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="hidden lg:block p-1.5 rounded-lg hover:bg-gray-100 transition-colors mx-auto"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
      )}

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
                  ? 'bg-blue-50 text-blue-700 '
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
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
                  isActive ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'
                }`}
              />
              {!isCollapsed && <span>{item.name}</span>}
            </button>
          );
        })}
      </nav>

      {/* Secondary Navigation */}
      <div className={`border-t border-gray-200 space-y-2 transition-all duration-300 ${
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
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
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
                  isActive ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'
                }`}
              />
              {!isCollapsed && <span>{item.name}</span>}
            </button>
          );
        })}
      </div>

      {/* User Profile */}
      <div className={`border-t border-gray-200 transition-all duration-300 ${
        isCollapsed ? 'p-2' : 'p-4'
      }`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <Avatar name={user?.name || 'User'} size="md" />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role || 'Project Manager'}
              </p>
            </div>
          )}
        </div>
        
        {!isCollapsed && (
          <div className="mt-3 flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </Button>
          </div>
        )}
        
        {isCollapsed && (
          <div className="mt-2 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="p-2"
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
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PM</span>
            </div>
            <span className="text-xl font-bold text-gray-900">ProjectFlow</span>
          </div>
          <button
            onClick={toggleMobileSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="h-full overflow-y-auto overflow-x-hidden">
          <SidebarContent />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-40 bg-white border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? 'lg:w-16' : 'lg:w-64'
      }`}>
        <div className="h-full overflow-y-auto overflow-x-hidden">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};
