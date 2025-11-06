import React, { useState, useRef, useEffect } from 'react';
import { Filter, Search, ChevronDown, Calendar, CheckCircle, Flag, FolderOpen, X } from 'lucide-react';
import { Input } from './Input';
import { Select } from './Select';
import { ViewToggle } from './ViewToggle';
import { FilterDropdown } from './FilterDropdown';
import { FilterChip } from './FilterChip';
import { QuickFilter } from './QuickFilter';
import InlineAdvancedFilters from './InlineAdvancedFilters';
import { CreateButton } from '../RoleBasedUI';

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

interface QuickFilterData {
  key: string;
  label: string;
  icon?: React.ReactNode;
  options: FilterOption[];
  type?: 'default' | 'date';
  multiple?: boolean;
  showCount?: boolean;
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
  // Quick filters props
  quickFilters?: QuickFilterData[];
  quickFilterValues?: Record<string, string | string[] | { from: string; to: string }>;
  onQuickFilterChange?: (key: string, value: string | string[] | { from: string; to: string }) => void;
  viewToggle?: {
    currentView: T;
    views: ViewOption<T>[];
    onChange: (view: T) => void;
  };
  actionButton?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'modern';
  showActiveFilters?: boolean;
  hideFilterIcon?: boolean;
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
  quickFilters = [],
  quickFilterValues = {},
  onQuickFilterChange,
  viewToggle,
  actionButton,
  variant = 'modern',
  showActiveFilters = true,
  hideFilterIcon = false,
  className = ''
}: SearchFilterSectionProps<T>) => {
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0, openUpward: false });
  const advancedFilterRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);
  const activeFilters = filters.filter(filter => filter.value !== 'all' && filter.value !== '');

  // Calculate dropdown position using fixed positioning
  useEffect(() => {
    if (isSettingsDropdownOpen && settingsButtonRef.current) {
      const buttonRect = settingsButtonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const estimatedDropdownHeight = 280; // Approximate height of dropdown with 7 items
      const dropdownWidth = 256; // 16rem = 256px
      
      const openUpward = spaceBelow < estimatedDropdownHeight && buttonRect.top > estimatedDropdownHeight;
      
      setDropdownPosition({
        top: openUpward ? buttonRect.top - estimatedDropdownHeight - 8 : buttonRect.bottom + 8,
        right: viewportWidth - buttonRect.right,
        openUpward
      });
    }
  }, [isSettingsDropdownOpen]);

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

  // Get visible quick filters based on visibleFilterColumns
  const visibleQuickFilters = quickFilters.filter(qf => 
    visibleFilterColumns.includes(qf.key)
  );

  // Get active quick filter tags
  const getActiveQuickFilterTags = () => {
    const tags: Array<{ key: string; value: string; label: string; filterLabel: string }> = [];
    
    visibleQuickFilters.forEach(filter => {
      const filterValue = quickFilterValues[filter.key];
      
      if (Array.isArray(filterValue) && filterValue.length > 0) {
        filterValue.forEach(val => {
          const option = filter.options.find(opt => opt.value === val);
          if (option) {
            tags.push({
              key: filter.key,
              value: val,
              label: option.label,
              filterLabel: filter.label
            });
          }
        });
      } else if (typeof filterValue === 'object' && filterValue !== null && 'from' in filterValue && 'to' in filterValue) {
        // Handle custom date range
        const from = new Date(filterValue.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const to = new Date(filterValue.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        tags.push({
          key: filter.key,
          value: 'custom',
          label: `${from} - ${to}`,
          filterLabel: filter.label
        });
      } else if (filterValue && filterValue !== 'all' && filterValue !== '') {
        const option = filter.options.find(opt => opt.value === filterValue);
        if (option) {
          tags.push({
            key: filter.key,
            value: filterValue as string,
            label: option.label,
            filterLabel: filter.label
          });
        }
      }
    });
    
    return tags;
  };

  const activeQuickFilterTags = getActiveQuickFilterTags();

  const handleRemoveQuickFilter = (key: string, value: string) => {
    if (!onQuickFilterChange) return;
    
    const currentValue = quickFilterValues[key];
    
    if (Array.isArray(currentValue)) {
      const newValues = currentValue.filter(v => v !== value);
      onQuickFilterChange(key, newValues);
    } else {
      onQuickFilterChange(key, 'all');
    }
  };

  const handleClearAllQuickFilters = () => {
    if (!onQuickFilterChange) return;
    
    visibleQuickFilters.forEach(filter => {
      onQuickFilterChange(filter.key, filter.multiple ? [] : 'all');
    });
  };

  return (
    <div className={`${className}`}>
      {/* Mobile-First Layout - Exact Match to Reference */}
      <div className="space-y-4 mb-6">
        {/* Row 1: Search Bar and Action Buttons - Always on same line */}
        <div className="flex items-center space-x-3">
          {/* Search Bar */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-48 sm:w-64 lg:w-80 pl-10 pr-4 py-3 bg-gray-100 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
          </div>
          
          {/* Spacer to push action buttons to the right */}
          <div className="flex-1"></div>
          
          {/* Action Buttons - Always stay on this line */}
          <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Action Button - Hidden on mobile */}
              {actionButton && (
                <CreateButton resource={searchPlaceholder.includes('task') ? 'tasks' : 'projects'}>
                  <button
                    onClick={actionButton.onClick}
                    className="hidden lg:flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>{actionButton.label}</span>
                  </button>
                </CreateButton>
              )}
              
              {/* Fallback: Old New Item Button - Hidden on mobile */}
              {!actionButton && viewToggle && (
                <CreateButton resource={searchPlaceholder.includes('task') ? 'tasks' : 'projects'}>
                  <button
                    onClick={() => {
                      // This will be handled by the parent component
                      const event = new CustomEvent(searchPlaceholder.includes('task') ? 'newTaskClick' : 'newProjectClick');
                      window.dispatchEvent(event);
                    }}
                    className="hidden lg:flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>{searchPlaceholder.includes('task') ? 'New Task' : 'New Project'}</span>
                  </button>
                </CreateButton>
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
              
              {/* Filter Settings Button */}
              <div className="relative">
                <button 
                  ref={settingsButtonRef}
                  onClick={() => setIsSettingsDropdownOpen(!isSettingsDropdownOpen)}
                  className={`p-2 rounded-lg transition-colors ${
                    isSettingsDropdownOpen ? 'text-blue-700 bg-blue-50' : 'text-gray-600 hover:text-blue-700 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="w-5 h-5" />
                </button>
                
                {/* Settings Dropdown */}
                {isSettingsDropdownOpen && (
                  <div 
                    ref={settingsDropdownRef} 
                    className="fixed w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999]"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      right: `${dropdownPosition.right}px`
                    }}
                  >
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Filter Columns</h3>
                      <div className="space-y-1.5">
                        {availableFilterColumns.map((column) => (
                          <label key={column.key} className="flex items-center space-x-2 cursor-pointer py-0.5">
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
              {!hideFilterIcon && (
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
              )}
          </div>
        </div>

        {/* Row 2: Quick Filters - Always below the search/action row */}
        {visibleQuickFilters.length > 0 && (
          <div className="flex items-center gap-3 overflow-x-auto lg:overflow-visible lg:flex-wrap scrollbar-hide pb-1">
            {visibleQuickFilters.map(filter => (
              <QuickFilter
                key={filter.key}
                label={filter.label}
                icon={filter.icon}
                options={filter.options}
                value={quickFilterValues[filter.key] || (filter.multiple ? [] : 'all')}
                onChange={(value) => onQuickFilterChange?.(filter.key, value)}
                multiple={filter.multiple}
                showCount={filter.showCount}
                type={filter.type}
                className="flex-shrink-0"
              />
            ))}
          </div>
        )}

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
              currentUser: currentUser,
              hideHeaderIcon: hideFilterIcon
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
              hideHeaderIcon={hideFilterIcon}
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

      {/* Active Quick Filter Tags */}
      {activeQuickFilterTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {activeQuickFilterTags.map((tag, index) => (
            <div
              key={`${tag.key}-${tag.value}-${index}`}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700"
            >
              <span className="font-medium">{tag.filterLabel}:</span>
              <span>{tag.label}</span>
              <button
                onClick={() => handleRemoveQuickFilter(tag.key, tag.value)}
                className="ml-1 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {activeQuickFilterTags.length > 0 && (
            <button
              onClick={handleClearAllQuickFilters}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}

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
