'use client';
import React, { useState, createContext, useContext, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Navigation } from './Navigation';
import { TabBar } from './ui/TabBar';
import { useTabs } from '../hooks/useTabs';

interface AppLayoutProps {
  children: React.ReactNode;
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

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
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

  const { tabs, activeTabId, openTab, closeTab, switchToTab } = useTabs();

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

  const handleNewTab = () => {
    // Open a new tab with a default page or let user choose
    openTab('/project', 'New Project');
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
        {/* Sidebar */}
        <Sidebar isMobileOpen={isMobileMenuOpen} onMobileClose={closeMobileMenu} />
        
        {/* Main Content */}
        <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'} min-h-screen`}>
          {/* Top Navigation */}
          <Navigation onMobileMenuClick={toggleMobileMenu} />
          
          {/* Tab Bar */}
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onTabClick={switchToTab}
            onTabClose={closeTab}
            onNewTab={handleNewTab}
          />
          
          {/* Page Content */}
          <main className="flex-1 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
};
