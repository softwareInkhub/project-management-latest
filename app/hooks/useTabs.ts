import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface TabItem {
  id: string;
  title: string;
  path: string;
  isClosable?: boolean;
}

const defaultTabs: TabItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/Dashboard',
    isClosable: false
  }
];

export const useTabs = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [tabs, setTabs] = useState<TabItem[]>(defaultTabs);
  const [activeTabId, setActiveTabId] = useState('dashboard');

  // Get page title from pathname
  const getPageTitle = (path: string): string => {
    const pathMap: Record<string, string> = {
      '/Dashboard': 'Dashboard',
      '/project': 'Projects',
      '/task': 'Tasks',
      '/team': 'Team'
    };
    return pathMap[path] || 'New Tab';
  };

  // Open a new tab
  const openTab = (path: string, title?: string) => {
    const tabTitle = title || getPageTitle(path);
    
    // Check if tab already exists
    const existingTab = tabs.find(tab => tab.path === path);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      router.push(path);
      return;
    }

    // Create new tab
    const newTab: TabItem = {
      id: `tab-${Date.now()}`,
      title: tabTitle,
      path,
      isClosable: true
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    router.push(path);
  };

  // Close a tab
  const closeTab = (tabId: string) => {
    const tabToClose = tabs.find(tab => tab.id === tabId);
    if (!tabToClose || !tabToClose.isClosable) return;

    const newTabs = tabs.filter(tab => tab.id !== tabId);
    
    if (newTabs.length === 0) {
      // If no tabs left, open dashboard
      setTabs(defaultTabs);
      setActiveTabId('dashboard');
      router.push('/Dashboard');
      return;
    }

    // If closing active tab, switch to another tab
    if (activeTabId === tabId) {
      const currentIndex = tabs.findIndex(tab => tab.id === tabId);
      const newActiveIndex = currentIndex > 0 ? currentIndex - 1 : 0;
      const newActiveTab = newTabs[newActiveIndex];
      
      setActiveTabId(newActiveTab.id);
      router.push(newActiveTab.path);
    }

    setTabs(newTabs);
  };

  // Switch to a tab
  const switchToTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setActiveTabId(tabId);
      router.push(tab.path);
    }
  };

  // Update active tab based on current pathname
  useEffect(() => {
    const currentTab = tabs.find(tab => tab.path === pathname);
    if (currentTab) {
      setActiveTabId(currentTab.id);
    } else if (pathname !== '/Dashboard') {
      // If current path doesn't match any tab, create a new one
      const tabTitle = getPageTitle(pathname);
      const newTab: TabItem = {
        id: `tab-${Date.now()}`,
        title: tabTitle,
        path: pathname,
        isClosable: true
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
    }
  }, [pathname, tabs]);

  // Load tabs from localStorage on mount
  useEffect(() => {
    const savedTabs = localStorage.getItem('project-management-tabs');
    if (savedTabs) {
      try {
        const parsedTabs = JSON.parse(savedTabs);
        if (parsedTabs.length > 0) {
          setTabs(parsedTabs);
          setActiveTabId(parsedTabs[0].id);
        }
      } catch (error) {
        console.error('Failed to load tabs from localStorage:', error);
      }
    }
  }, []);

  // Save tabs to localStorage whenever tabs change
  useEffect(() => {
    localStorage.setItem('project-management-tabs', JSON.stringify(tabs));
  }, [tabs]);

  return {
    tabs,
    activeTabId,
    openTab,
    closeTab,
    switchToTab
  };
};
