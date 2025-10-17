import React from 'react';

interface ViewToggleProps<T extends string = string> {
  currentView: T;
  views: Array<{
    value: T;
    label: string;
    icon: React.ReactNode;
  }>;
  onChange: (view: T) => void;
  className?: string;
}

export const ViewToggle = <T extends string = string>({
  currentView,
  views,
  onChange,
  className = ''
}: ViewToggleProps<T>) => {
  return (
    <div className={`flex border border-gray-200 rounded-lg bg-gray-50 overflow-hidden ${className}`}>
      {views.map((view) => (
        <button
          key={view.value}
          onClick={() => onChange(view.value)}
          className={`px-3 py-2 text-sm font-medium transition-all duration-200 ${
            currentView === view.value
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center space-x-1">
            {view.icon}
            <span className="hidden sm:inline">{view.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
};
