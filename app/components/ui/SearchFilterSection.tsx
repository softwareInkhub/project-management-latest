import React, { useState, useRef, useEffect } from 'react';
import { Filter, Search } from 'lucide-react';
import { Input } from './Input';
import { Select } from './Select';
import { ViewToggle } from './ViewToggle';
import { FilterDropdown } from './FilterDropdown';
import { FilterChip } from './FilterChip';

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
  viewToggle,
  variant = 'modern',
  showActiveFilters = true,
  className = ''
}: SearchFilterSectionProps<T>) => {
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const advancedFilterRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const activeFilters = filters.filter(filter => filter.value !== 'all' && filter.value !== '');

  // Close advanced filters when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Don't close if clicking on the filter button or inside the advanced filter area
      if (advancedFilterRef.current && 
          !advancedFilterRef.current.contains(target) && 
          filterButtonRef.current && 
          !filterButtonRef.current.contains(target)) {
        setIsAdvancedFilterOpen(false);
      }
    };

    if (isAdvancedFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAdvancedFilterOpen]);

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
      <div className="space-y-4 mb-1">
        {/* Search Bar with Filter Icon - Full Width */}
        <div className="relative w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-12 py-3 bg-gray-100 border-0 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
            <button 
              ref={filterButtonRef}
              onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                isAdvancedFilterOpen ? 'text-blue-700' : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Advanced Filters - Inline */}
        {isAdvancedFilterOpen && (
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
                          key={option.value}
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

        {/* Predefined Filter Pills */}
        {predefinedFilters.length > 0 && (
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {predefinedFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={filter.onClick}
                className={`flex-shrink-0 px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center space-x-1 ${
                  filter.isActive
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.count !== undefined && (
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                    filter.isActive
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {filter.count}
                  </span>
                )}
                <span>{filter.label}</span>
              </button>
            ))}
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
