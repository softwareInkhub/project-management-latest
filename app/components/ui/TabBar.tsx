import React from 'react';
import { Plus } from 'lucide-react';
import { Tab } from './Tab';
import { Button } from './Button';

interface TabItem {
  id: string;
  title: string;
  path: string;
  isClosable?: boolean;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: () => void;
  className?: string;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onNewTab,
  className = ''
}) => {
  return (
    <div className={`bg-gray-100 border-b border-gray-200 hidden lg:block ${className}`}>
      <div className="flex items-center">
        {/* Tabs */}
        <div className="flex items-center overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              id={tab.id}
              title={tab.title}
              isActive={activeTabId === tab.id}
              isClosable={tab.isClosable}
              onClick={() => onTabClick(tab.id)}
              onClose={() => onTabClose(tab.id)}
            />
          ))}
        </div>
        
        {/* New Tab Button */}
        <div className="px-2 py-2 border-l border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewTab}
            className="p-1"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
