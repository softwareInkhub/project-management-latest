import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Flag, 
  Clock, 
  FolderOpen, 
  Filter,
  X,
  CheckCircle,
  Circle,
  AlertTriangle,
  Building2,
  FileText,
  MessageSquare,
  Paperclip
} from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface DateRange {
  from: string;
  to: string;
}

interface NumberRange {
  min: number;
  max: number;
}

interface ProjectAdvancedFilters {
  projectScope: string[];
  status: string[];
  priority: string[];
  assignee: string[];
  company: string[];
  tags: string[];
  startDateRange: DateRange;
  endDateRange: DateRange;
  progressRange: NumberRange;
  teamSizeRange: NumberRange;
  additionalFilters: string[];
}

interface ProjectInlineAdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ProjectAdvancedFilters;
  onFiltersChange: (filters: ProjectAdvancedFilters) => void;
  onClearAll: () => void;
  projects: any[];
  users: any[];
  teams: any[];
  visibleColumns?: string[];
  currentUser?: any;
}

const ProjectInlineAdvancedFilters: React.FC<ProjectInlineAdvancedFiltersProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onClearAll,
  projects,
  users,
  teams,
  visibleColumns = ['projectScope', 'status', 'priority', 'dateRange'],
  currentUser
}) => {
  const [localFilters, setLocalFilters] = useState<ProjectAdvancedFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilter = (key: keyof ProjectAdvancedFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const toggleArrayFilter = (key: keyof ProjectAdvancedFilters, value: string) => {
    const currentValues = localFilters[key] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    updateFilter(key, newValues);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    count += localFilters.projectScope.length;
    count += localFilters.status.length;
    count += localFilters.priority.length;
    count += localFilters.company.length;
    count += localFilters.additionalFilters.length;
    
    if (localFilters.startDateRange.from || localFilters.startDateRange.to) count++;
    
    return count;
  };

  const handleClearAll = () => {
    const clearedFilters: ProjectAdvancedFilters = {
      projectScope: [],
      status: [],
      priority: [],
      assignee: [],
      company: [],
      tags: [],
      startDateRange: { from: '', to: '' },
      endDateRange: { from: '', to: '' },
      progressRange: { min: 0, max: 100 },
      teamSizeRange: { min: 0, max: 50 },
      additionalFilters: []
    };
    setLocalFilters(clearedFilters);
    onClearAll();
  };

  const FilterCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    color: string;
    children: React.ReactNode;
  }> = ({ title, icon, color, children }) => (
    <div className="bg-white rounded-lg border border-gray-300 overflow-hidden h-auto min-h-[200px] max-h-[240px] flex flex-col">
      {/* Header */}
      <div className={`${color} px-3 py-2 border-b border-gray-200 flex-shrink-0`}>
        <div className="flex items-center space-x-1.5">
          <div className={`w-4 h-4 ${color.includes('blue') ? 'bg-blue-500' : color.includes('green') ? 'bg-green-500' : color.includes('purple') ? 'bg-purple-500' : color.includes('orange') ? 'bg-orange-500' : 'bg-gray-500'} rounded flex items-center justify-center`}>
            <div className="scale-75">{icon}</div>
          </div>
          <h4 className="font-medium text-sm text-gray-900">{title}</h4>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-2.5 flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );

  const CheckboxOption: React.FC<{
    value: string;
    label: string;
    isChecked: boolean;
    onChange: () => void;
    count?: number;
  }> = ({ value, label, isChecked, onChange, count }) => (
    <label className="flex items-center space-x-1.5 py-0.5 cursor-pointer hover:bg-gray-50 rounded px-1">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onChange}
        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <span className="text-xs text-gray-700 flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </label>
  );

  const RangeInput: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    unit?: string;
  }> = ({ label, value, onChange, min = 0, max = 100, unit = '' }) => (
    <div className="space-y-0.5">
      <label className="text-xs text-gray-600">{label}</label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        min={min}
        max={max}
        className="text-xs py-1.5"
        placeholder={`${min}-${max}${unit}`}
      />
    </div>
  );

  const DateInput: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
  }> = ({ label, value, onChange }) => (
    <div className="space-y-0.5">
      <label className="text-xs text-gray-600">{label}</label>
      <div className="relative">
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs pr-7 py-1.5"
        />
        <Calendar className="absolute right-1.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
      </div>
    </div>
  );

  // Helper function to get team count
  const getTeamCount = (team: string | string[] | undefined): number => {
    if (!team) return 0;
    if (Array.isArray(team)) return team.length;
    return 1;
  };

  // Helper function to parse tags array
  const getTagsArray = (tags: string | string[] | undefined): string[] => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    try {
      return JSON.parse(tags);
    } catch (error) {
      console.warn('Failed to parse tags JSON:', tags, error);
      return [];
    }
  };

  if (!isOpen) return null;

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
          <h3 className="text-base font-semibold text-gray-900">Advanced Filters</h3>
          <span className="text-xs text-gray-500">({getActiveFilterCount()} active)</span>
        </div>
        <div className="flex space-x-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear all
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Filter Cards Grid */}
      <div className="overflow-x-auto px-0.5 py-0.5">
        <div className="flex space-x-2.5 min-w-max">
          
          {/* Project Scope */}
          {visibleColumns.includes('projectScope') && (
            <div className="flex-shrink-0 w-48">
              <FilterCard
                title="Projects"
                icon={<CheckCircle className="w-3 h-3 text-white" />}
                color="bg-blue-50"
              >
                <div className="space-y-1">
                  {[
                    { value: 'all-projects', label: 'All Projects' },
                    { value: 'my-projects', label: 'My Projects' }
                  ].map(({ value, label }) => (
                    <div key={value}>
                      <CheckboxOption
                        value={value}
                        label={label}
                        isChecked={localFilters.projectScope.includes(value)}
                        onChange={() => toggleArrayFilter('projectScope', value)}
                        count={value === 'all-projects' ? projects.length : projects.filter(p => {
                          // Check if project is assigned to current user
                          const currentUserId = currentUser?.userId || currentUser?.email;
                          return currentUserId && (
                            p.assignee === currentUserId || 
                            p.assignee?.includes(currentUserId)
                          );
                        }).length}
                      />
                    </div>
                  ))}
                </div>
              </FilterCard>
            </div>
          )}

          {/* Project Status */}
          {visibleColumns.includes('status') && (
            <div className="flex-shrink-0 w-48">
              <FilterCard
                title="Project Status"
                icon={<CheckCircle className="w-3 h-3 text-white" />}
                color="bg-blue-50"
              >
                <div className="space-y-1">
                  {[
                    { value: 'Planning', label: 'Planning', icon: Circle },
                    { value: 'Active', label: 'Active', icon: CheckCircle },
                    { value: 'Completed', label: 'Completed', icon: CheckCircle },
                    { value: 'On Hold', label: 'On Hold', icon: AlertTriangle }
                  ].map(({ value, label }) => (
                    <div key={value}>
                      <CheckboxOption
                        value={value}
                        label={label}
                        isChecked={localFilters.status.includes(value)}
                        onChange={() => toggleArrayFilter('status', value)}
                        count={projects.filter(p => p.status === value).length}
                      />
                    </div>
                  ))}
                </div>
              </FilterCard>
            </div>
          )}

          {/* Priority Level */}
          {visibleColumns.includes('priority') && (
            <div className="flex-shrink-0 w-48">
              <FilterCard
                title="Priority Level"
                icon={<Flag className="w-3 h-3 text-white" />}
                color="bg-green-50"
              >
                <div className="space-y-1">
                  {[
                    { value: 'High', label: 'High Priority' },
                    { value: 'Medium', label: 'Medium Priority' },
                    { value: 'Low', label: 'Low Priority' }
                  ].map(({ value, label }) => (
                    <div key={value}>
                      <CheckboxOption
                        value={value}
                        label={label}
                        isChecked={localFilters.priority.includes(value)}
                        onChange={() => toggleArrayFilter('priority', value)}
                        count={projects.filter(p => p.priority === value).length}
                      />
                    </div>
                  ))}
                </div>
              </FilterCard>
            </div>
          )}


          {/* Company */}
          {visibleColumns.includes('company') && (
            <div className="flex-shrink-0 w-48">
              <FilterCard
                title="Company"
                icon={<Building2 className="w-3 h-3 text-white" />}
                color="bg-orange-50"
              >
                <div className="space-y-1">
                  {Array.from(new Set(projects.map(p => p.company).filter(Boolean))).map((company, index) => (
                    <div key={company || `company-${index}`}>
                      <CheckboxOption
                        value={company || `company-${index}`}
                        label={company || `Company ${index + 1}`}
                        isChecked={localFilters.company.includes(company || `company-${index}`)}
                        onChange={() => toggleArrayFilter('company', company || `company-${index}`)}
                        count={projects.filter(p => p.company === company).length}
                      />
                    </div>
                  ))}
                </div>
              </FilterCard>
            </div>
          )}

          {/* Date Range */}
          {visibleColumns.includes('dateRange') && (
            <div className="flex-shrink-0 w-48">
              <FilterCard
                title="Date Range"
                icon={<Calendar className="w-3 h-3 text-white" />}
                color="bg-blue-50"
              >
                <div className="space-y-3">
                  <DateInput
                    label="From"
                    value={localFilters.startDateRange.from}
                    onChange={(value) => updateFilter('startDateRange', { ...localFilters.startDateRange, from: value })}
                  />
                  <DateInput
                    label="To"
                    value={localFilters.startDateRange.to}
                    onChange={(value) => updateFilter('startDateRange', { ...localFilters.startDateRange, to: value })}
                  />
                </div>
              </FilterCard>
            </div>
          )}



          {/* Additional Filters */}
          {visibleColumns.includes('additionalFilters') && (
            <div className="flex-shrink-0 w-48">
              <FilterCard
                title="Additional Filters"
                icon={<Filter className="w-3 h-3 text-white" />}
                color="bg-green-50"
              >
                <div className="space-y-1">
                  <CheckboxOption
                    value="hasTasks"
                    label="Has Tasks"
                    isChecked={localFilters.additionalFilters.includes('hasTasks')}
                    onChange={() => toggleArrayFilter('additionalFilters', 'hasTasks')}
                    count={projects.filter(p => p.tasks && p.tasks !== '[]').length}
                  />
                  <CheckboxOption
                    value="overdue"
                    label="Overdue Projects"
                    isChecked={localFilters.additionalFilters.includes('overdue')}
                    onChange={() => toggleArrayFilter('additionalFilters', 'overdue')}
                    count={projects.filter(p => {
                      const endDate = new Date(p.endDate);
                      const today = new Date();
                      return endDate < today && p.status !== 'Completed';
                    }).length}
                  />
                </div>
              </FilterCard>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProjectInlineAdvancedFilters;
