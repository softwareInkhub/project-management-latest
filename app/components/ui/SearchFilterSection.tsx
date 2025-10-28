import React, { useState, useRef, useEffect } from 'react';
import { Filter, Search, Settings, ChevronDown } from 'lucide-react';
import { Input } from './Input';
import { Select } from './Select';
import { ViewToggle } from './ViewToggle';
import { FilterDropdown } from './FilterDropdown';
import { FilterChip } from './FilterChip';
import InlineAdvancedFilters from './InlineAdvancedFilters';

interface FilterOption {
  value: string;
  label: string;
}

interface ViewOption<T extends string = string> {
  value: T;
  label: string;
  icon: React.ReactNode;
}

interface PredefinedFilter {
  key: string;
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
}

interface SearchFilterSectionProps<T extends string = string> {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters: Array<{
    key: string;
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    placeholder?: string;
    label?: string;
  }>;
  predefinedFilters?: PredefinedFilter[];
  onAdvancedFilterChange?: (key: string, value: string | string[]) => void;
  onApplyAdvancedFilters?: () => void;
  onClearAdvancedFilters?: () => void;
  advancedFilters?: Record<string, string | string[]>;
  onOpenAdvancedFilterModal?: () => void;
  // Inline advanced filter props
  showInlineAdvancedFilters?: boolean;
  onInlineAdvancedFiltersChange?: (filters: any) => void;
  onClearInlineAdvancedFilters?: () => void;
  inlineAdvancedFilters?: any;
  tasks?: any[];
  users?: any[];
  teams?: any[];
  projects?: any[];
  currentUser?: any;
  customInlineFilterComponent?: React.ComponentType<any>;
  // Column settings props
  availableFilterColumns?: Array<{key: string, label: string, icon: React.ReactNode}>;
  visibleFilterColumns?: string[];
  onFilterColumnsChange?: (columns: string[]) => void;
  viewToggle?: {
    currentView: T;
    views: ViewOption<T>[];
    onChange: (view: T) => void;
  };
  variant?: 'default' | 'modern';
  showActiveFilters?: boolean;
  className?: string;
}

export const SearchFilterSection = <T extends string = string>({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  predefinedFilters = [],
  onAdvancedFilterChange,
  onApplyAdvancedFilters,
  onClearAdvancedFilters,
  advancedFilters = {},
  onOpenAdvancedFilterModal,
  showInlineAdvancedFilters = false,
  onInlineAdvancedFiltersChange,
  onClearInlineAdvancedFilters,
  inlineAdvancedFilters,
  tasks = [],
  users = [],
  teams = [],
  projects = [],
  currentUser,
  customInlineFilterComponent,
  availableFilterColumns = [],
  visibleFilterColumns = [],
  onFilterColumnsChange,
  viewToggle,
  variant = 'modern',
  showActiveFilters = true,
  className = ''
}: SearchFilterSectionProps<T>) => {
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const advancedFilterRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);
  const activeFilters = filters.filter(filter => filter.value !== 'all' && filter.value !== '');

  // Close advanced filters and settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Close advanced filters
      if (advancedFilterRef.current && 
          !advancedFilterRef.current.contains(target) && 
          filterButtonRef.current && 
          !filterButtonRef.current.contains(target)) {
        setIsAdvancedFilterOpen(false);
      }
      
      // Close settings dropdown
      if (settingsDropdownRef.current && 
          !settingsDropdownRef.current.contains(target) && 
          settingsButtonRef.current && 
          !settingsButtonRef.current.contains(target)) {
        setIsSettingsDropdownOpen(false);
      }
    };

    if (isAdvancedFilterOpen || isSettingsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAdvancedFilterOpen, isSettingsDropdownOpen]);

  const getFilterLabel = (filter: any) => {
    const option = filter.options.find((opt: any) => opt.value === filter.value);
    return option ? option.label : filter.label || filter.key;
  };

  const handleAdvancedFilterChange = (key: string, value: string) => {
    if (onAdvancedFilterChange) {
      const currentValues = (advancedFilters[key] as string[]) || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      onAdvancedFilterChange(key, newValues);
    }
  };

  const handleClearAdvancedFilters = () => {
    if (onClearAdvancedFilters) {
      onClearAdvancedFilters();
    }
  };

  const handleColumnToggle = (columnKey: string) => {
    if (onFilterColumnsChange) {
      const currentColumns = visibleFilterColumns || [];
      const newColumns = currentColumns.includes(columnKey)
        ? currentColumns.filter(col => col !== columnKey)
        : [...currentColumns, columnKey];
      onFilterColumnsChange(newColumns);
    }
  };

  // Convert filters to advanced filter format
  const advancedFilterGroups = filters.map(filter => ({
    key: filter.key,
    label: filter.label || filter.key,
    options: filter.options,
    type: 'multiple' as const
  }));

  return (
    <div className={`${className}`}>
      {/* Mobile-First Layout - Exact Match to Reference */}
      <div className="space-y-4 mb-6">
        {/* Search Bar with Filter and Settings Icons - Responsive Width Search */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-48 sm:w-64 lg:w-80 pl-10 pr-4 py-3 bg-gray-100 border-0 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
          </div>
          
          {/* Spacer to push icons to the right */}
          <div className="flex-1"></div>
          
          {/* New Project Button, View Toggle, Settings, and Filter Buttons - Positioned at End */}
          <div className="flex items-center space-x-2">
              {/* New Project Button - Hidden on mobile */}
              {viewToggle && (
                <button
                  onClick={() => {
                    // This will be handled by the parent component
                    const event = new CustomEvent('newProjectClick');
                    window.dispatchEvent(event);
                  }}
                  className="hidden lg:flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Project</span>
                </button>
              )}
              
              {/* View Toggle */}
              {viewToggle && (
                <ViewToggle
                  currentView={viewToggle.currentView}
                  views={viewToggle.views}
                  onChange={viewToggle.onChange}
                  className="flex-shrink-0"
                />
              )}
              
              {/* Settings Button */}
              <div className="relative">
                <button 
                  ref={settingsButtonRef}
                  onClick={() => setIsSettingsDropdownOpen(!isSettingsDropdownOpen)}
                  className={`p-2 rounded-lg transition-colors ${
                    isSettingsDropdownOpen ? 'text-blue-700 bg-blue-50' : 'text-gray-600 hover:text-blue-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                </button>
                
                {/* Settings Dropdown */}
                {isSettingsDropdownOpen && (
                  <div ref={settingsDropdownRef} className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Filter Columns</h3>
                      <div className="space-y-2">
                        {availableFilterColumns.map((column) => (
                          <label key={column.key} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={visibleFilterColumns.includes(column.key)}
                              onChange={() => handleColumnToggle(column.key)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="flex items-center space-x-2">
                              {column.icon}
                              <span className="text-sm text-gray-700">{column.label}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Filter Button */}
              <button 
                ref={filterButtonRef}
                onClick={() => {
                  if (showInlineAdvancedFilters) {
                    setIsAdvancedFilterOpen(!isAdvancedFilterOpen);
                  } else if (onOpenAdvancedFilterModal) {
                    onOpenAdvancedFilterModal();
                  } else {
                    setIsAdvancedFilterOpen(!isAdvancedFilterOpen);
                  }
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isAdvancedFilterOpen ? 'text-blue-700 bg-blue-50' : 'text-blue-600 hover:text-blue-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
          </div>
        </div>


        {/* Advanced Filters - Inline */}
        {isAdvancedFilterOpen && showInlineAdvancedFilters && (
          customInlineFilterComponent ? (
            React.createElement(customInlineFilterComponent, {
              isOpen: isAdvancedFilterOpen,
              onClose: () => setIsAdvancedFilterOpen(false),
              filters: inlineAdvancedFilters,
              onFiltersChange: onInlineAdvancedFiltersChange || (() => {}),
              onClearAll: onClearInlineAdvancedFilters || (() => {}),
              tasks: tasks,
              users: users,
              teams: teams,
              projects: projects,
              visibleColumns: visibleFilterColumns,
              currentUser: currentUser
            })
          ) : (
            <InlineAdvancedFilters
              isOpen={isAdvancedFilterOpen}
              onClose={() => setIsAdvancedFilterOpen(false)}
              filters={inlineAdvancedFilters}
              onFiltersChange={onInlineAdvancedFiltersChange || (() => {})}
              onClearAll={onClearInlineAdvancedFilters || (() => {})}
              tasks={tasks}
              users={users}
              teams={teams}
              projects={projects}
              visibleColumns={visibleFilterColumns}
              currentUser={currentUser}
            />
          )
        )}

        {/* Legacy Advanced Filters - Inline */}
        {isAdvancedFilterOpen && !showInlineAdvancedFilters && !onOpenAdvancedFilterModal && (
          <div ref={advancedFilterRef} className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="space-y-4">
              {advancedFilterGroups.map((filterGroup) => (
                <div key={filterGroup.key}>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">{filterGroup.label}</h3>
                  <div className="flex flex-wrap gap-2">
                    {filterGroup.options.map((option) => {
                      const currentValues = (advancedFilters[filterGroup.key] as string[]) || [];
                      const isActive = currentValues.includes(option.value);
                      
                      return (
                        <button
                          key={`${filterGroup.key}-${option.value}`}
                          onClick={() => handleAdvancedFilterChange(filterGroup.key, option.value)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                            isActive
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {/* Clear All Button */}
              <div className="flex justify-end pt-2 border-t border-gray-200">
                <button
                  onClick={handleClearAdvancedFilters}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Applied Advanced Filters */}
      {Object.keys(advancedFilters).length > 0 && (
        <div className="mt-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {Object.entries(advancedFilters).map(([filterKey, values]) => {
              if (Array.isArray(values)) {
                return values.map((value) => {
                  const filterGroup = advancedFilterGroups.find(fg => fg.key === filterKey);
                  const option = filterGroup?.options.find(opt => opt.value === value);
                  const label = option?.label || value;
                  
                  return (
                    <FilterChip
                      key={`${filterKey}-${value}`}
                      label={`${filterGroup?.label}: ${label}`}
                      value={value}
                      onRemove={() => {
                        const currentValues = (advancedFilters[filterKey] as string[]) || [];
                        const newValues = currentValues.filter(v => v !== value);
                        if (onAdvancedFilterChange) {
                          onAdvancedFilterChange(filterKey, newValues);
                        }
                      }}
                      variant="active"
                      size="sm"
                    />
                  );
                });
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Active Filters */}
      {showActiveFilters && activeFilters.length > 0 && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <FilterChip
                key={filter.key}
                label={getFilterLabel(filter)}
                value={filter.value}
                onRemove={() => filter.onChange('all')}
                variant="active"
                size="sm"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
