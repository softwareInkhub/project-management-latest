'use client';
import React, { useState, createContext, useContext, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Navigation } from './Navigation';
import { MobileBottomNav } from './MobileBottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
  onCreateTask?: () => void;
}

// Create context for sidebar state
const SidebarContext = createContext<{
  isCollapsed: boolean;
  toggleSidebar: () => void;
}>({
  isCollapsed: false,
  toggleSidebar: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export const AppLayout: React.FC<AppLayoutProps> = ({ children, onCreateTask }) => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });


  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleSidebar = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsedState));
    }
  };


  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      <div className="h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden flex">
        {/* Sidebar */}
        <Sidebar isMobileOpen={isMobileMenuOpen} onMobileClose={closeMobileMenu} />
        
        {/* Main Content */}
        <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
          {/* Top Navigation */}
          <Navigation onMobileMenuClick={toggleMobileMenu} />
          
          {/* Page Content - Scrollable */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-0">
            {children}
          </main>
        </div>
        
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav onCreateTask={onCreateTask} />
      </div>
    </SidebarContext.Provider>
  );
};
