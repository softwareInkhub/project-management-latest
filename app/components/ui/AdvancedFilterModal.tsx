'use client';

import { useState } from 'react';
import { X, Filter, Check } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
  type: 'single' | 'multiple';
}

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterGroup[];
  activeFilters: Record<string, string | string[]>;
  onFilterChange: (key: string, value: string | string[]) => void;
  onApplyFilters: () => void;
  onClearAll: () => void;
}

export function AdvancedFilterModal({
  isOpen,
  onClose,
  filters,
  activeFilters,
  onFilterChange,
  onApplyFilters,
  onClearAll
}: AdvancedFilterModalProps) {
  if (!isOpen) return null;

  const handleFilterToggle = (filterKey: string, optionValue: string, type: 'single' | 'multiple') => {
    if (type === 'single') {
      onFilterChange(filterKey, optionValue);
    } else {
      const currentValues = (activeFilters[filterKey] as string[]) || [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue];
      onFilterChange(filterKey, newValues);
    }
  };

  const getActiveCount = () => {
    return Object.values(activeFilters).reduce((count, value) => {
      if (Array.isArray(value)) {
        return count + value.length;
      }
      return count + (value && value !== 'all' ? 1 : 0);
    }, 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Filter className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Advanced Filters</h2>
              <p className="text-sm text-gray-500">Filter tasks by multiple attributes</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {filters.map((filter) => (
              <div key={filter.key}>
                <h3 className="text-sm font-medium text-gray-900 mb-3">{filter.label}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filter.options.map((option) => {
                    const isActive = filter.type === 'single' 
                      ? activeFilters[filter.key] === option.value
                      : (activeFilters[filter.key] as string[])?.includes(option.value);
                    
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleFilterToggle(filter.key, option.value, filter.type)}
                        className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                          isActive
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{option.label}</span>
                          {option.count !== undefined && (
                            <Badge variant="default" size="sm">
                              {option.count}
                            </Badge>
                          )}
                        </div>
                        {isActive && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-2">
            {getActiveCount() > 0 && (
              <Badge variant="default" size="sm">
                {getActiveCount()} filters active
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear All
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onApplyFilters();
                onClose();
              }}
              className="px-6"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
