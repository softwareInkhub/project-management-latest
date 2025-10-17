import React, { useState } from 'react';
import { Filter } from 'lucide-react';
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
  viewToggle,
  variant = 'modern',
  showActiveFilters = true,
  className = ''
}: SearchFilterSectionProps<T>) => {
  const activeFilters = filters.filter(filter => filter.value !== 'all' && filter.value !== '');

  const getFilterLabel = (filter: any) => {
    const option = filter.options.find((opt: any) => opt.value === filter.value);
    return option ? option.label : filter.label || filter.key;
  };

  return (
    <div className={`${className}`}>
      {/* Search Bar and Filters in Same Row */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center mb-6">
        {/* Modern Search Bar */}
        <div className="flex-1 w-full lg:w-auto">
          <Input
            variant="modern-search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            size="lg"
            showClearButton={true}
            onClear={() => onSearchChange('')}
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap gap-3">
          {filters.map((filter) => (
            <FilterDropdown
              key={filter.key}
              label={filter.label || filter.key}
              value={filter.value}
              options={filter.options}
              onChange={filter.onChange}
              variant="modern"
              size="md"
            />
          ))}
        </div>

        {/* View Toggle */}
        {viewToggle && (
          <ViewToggle
            currentView={viewToggle.currentView}
            views={viewToggle.views}
            onChange={viewToggle.onChange}
          />
        )}
      </div>

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
