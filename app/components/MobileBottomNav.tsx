'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  Bell,
  Plus,
  Calendar
} from 'lucide-react';
import { useTabs } from '../hooks/useTabs';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  isCenter?: boolean;
}

interface MobileBottomNavProps {
  onCreateTask?: () => void;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/Dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/project', icon: FolderKanban },
  { name: 'Tasks', href: '/task', icon: CheckSquare, isCenter: true },
  { name: 'Calendar', href: '/calander', icon: Calendar },
  { name: 'Team', href: '/team', icon: Users },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onCreateTask }) => {
  const pathname = usePathname();
  const { openTab } = useTabs();

  const handleNavigation = (href: string, name: string) => {
    openTab(href, name);
  };

  const handleCreateTask = () => {
    if (onCreateTask) {
      onCreateTask();
    } else {
      console.log('Create new task');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Elevated central button */}
      <div className="absolute bottom-9 left-1/2 transform -translate-x-1/2 z-10">
        {pathname === '/task' ? (
          // Create Task button when on Tasks page
          <button
            onClick={handleCreateTask}
            className="w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 bg-blue-500 text-white shadow-blue-200 hover:shadow-xl hover:bg-blue-600"
          >
            <Plus size={28} />
          </button>
        ) : (
          // Navigate to Tasks button when on other pages
          <button
            onClick={() => handleNavigation('/task', 'Tasks')}
            className="w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 bg-white text-blue-500 shadow-gray-200 hover:shadow-xl"
          >
            <CheckSquare size={28} />
          </button>
        )}
      </div>
      
      {/* Main navigation bar */}
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl shadow-lg border-t border-gray-100 dark:border-gray-700 h-20 pt-2">
        <div className="grid grid-cols-5 h-16 px-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href, item.name)}
                className={`flex flex-col items-center justify-end space-y-1 transition-colors pb-2 ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon 
                  size={22} 
                  className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} 
                />
                <span className="text-xs font-medium truncate px-1">{item.name}</span>
              </button>
            );
          })}
        </div>
        
        {/* Home indicator */}
        <div className="flex justify-center pb-2">
          <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
