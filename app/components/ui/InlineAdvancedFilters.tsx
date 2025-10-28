import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  User, 
  Flag, 
  Clock, 
  Tag, 
  FolderOpen, 
  BarChart3, 
  Filter,
  X,
  CheckCircle,
  Circle,
  AlertTriangle,
  Users,
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

interface AdvancedFilters {
  taskScope: string[];
  status: string[];
  priority: string[];
  assignee: string[];
  project: string[];
  tags: string[];
  dueDateRange: DateRange;
  timeEstimateRange: NumberRange;
  additionalFilters: string[];
}

interface InlineAdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  onClearAll: () => void;
  tasks: any[];
  users: any[];
  teams: any[];
  projects: any[];
  visibleColumns?: string[];
  currentUser?: any;
}

const InlineAdvancedFilters: React.FC<InlineAdvancedFiltersProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onClearAll,
  tasks,
  users,
  teams,
  projects,
  visibleColumns = ['taskScope', 'status', 'priority', 'project', 'dueDateRange'],
  currentUser
}) => {
  const [localFilters, setLocalFilters] = useState<AdvancedFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilter = (key: keyof AdvancedFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const toggleArrayFilter = (key: keyof AdvancedFilters, value: string) => {
    const currentValues = localFilters[key] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    updateFilter(key, newValues);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    count += localFilters.taskScope.length;
    count += localFilters.status.length;
    count += localFilters.priority.length;
    count += localFilters.assignee.length;
    count += localFilters.project.length;
    count += localFilters.tags.length;
    count += localFilters.additionalFilters.length;
    
    if (localFilters.dueDateRange.from || localFilters.dueDateRange.to) count++;
    if (localFilters.timeEstimateRange.min > 0 || localFilters.timeEstimateRange.max < 1000) count++;
    
    return count;
  };

  const handleClearAll = () => {
    const clearedFilters: AdvancedFilters = {
      taskScope: [],
      status: [],
      priority: [],
      assignee: [],
      project: [],
      tags: [],
      dueDateRange: { from: '', to: '' },
      timeEstimateRange: { min: 0, max: 1000 },
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
    <div className="bg-white rounded-xl border border-gray-300 overflow-hidden h-64 flex flex-col">
      {/* Header */}
      <div className={`${color} px-4 py-3 border-b border-gray-200 flex-shrink-0`}>
        <div className="flex items-center space-x-2">
          <div className={`w-5 h-5 ${color.includes('blue') ? 'bg-blue-500' : color.includes('green') ? 'bg-green-500' : color.includes('purple') ? 'bg-purple-500' : color.includes('orange') ? 'bg-orange-500' : 'bg-gray-500'} rounded flex items-center justify-center`}>
            {icon}
          </div>
          <h4 className="font-medium text-gray-900">{title}</h4>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 flex-1 overflow-y-auto">
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
    <label className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-1">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onChange}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <span className="text-sm text-gray-700 flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
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
  }> = ({ label, value, onChange, min = 0, max = 1000, unit = '' }) => (
    <div className="space-y-1">
      <label className="text-xs text-gray-600">{label}</label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        min={min}
        max={max}
        className="text-sm"
        placeholder={`${min}-${max}${unit}`}
      />
    </div>
  );

  const DateInput: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
  }> = ({ label, value, onChange }) => (
    <div className="space-y-1">
      <label className="text-xs text-gray-600">{label}</label>
      <div className="relative">
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-sm pr-8"
        />
        <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
          <span className="text-sm text-gray-500">({getActiveFilterCount()} active)</span>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear all
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filter Cards Grid */}
      <div className="overflow-x-auto px-1 py-1">
        <div className="flex space-x-4 min-w-max">
          
          {/* Task Scope */}
          {visibleColumns.includes('taskScope') && (
            <div className="flex-shrink-0 w-64">
              <FilterCard
                title="Tasks"
                icon={<CheckCircle className="w-3 h-3 text-white" />}
                color="bg-blue-50"
              >
                <div className="space-y-1">
                  {[
                    { value: 'allTasks', label: 'All Tasks' },
                    { value: 'myTasks', label: 'My Tasks' }
                  ].map(({ value, label }) => (
                    <div key={value}>
                      <CheckboxOption
                        value={value}
                        label={label}
                        isChecked={localFilters.taskScope.includes(value)}
                        onChange={() => toggleArrayFilter('taskScope', value)}
                        count={value === 'allTasks' ? tasks.length : tasks.filter(t => {
                          // Check if task is assigned to current user
                          const currentUserId = currentUser?.userId || currentUser?.email;
                          return currentUserId && (
                            t.assignee === currentUserId || 
                            t.assignedUsers?.includes(currentUserId) ||
                            t.assignedTeams?.some((teamId: string) => 
                              teams.find(team => team.id === teamId)?.members?.includes(currentUserId)
                            )
                          );
                        }).length}
                      />
                    </div>
                  ))}
                </div>
              </FilterCard>
            </div>
          )}

          {/* Task Status */}
          {visibleColumns.includes('status') && (
            <div className="flex-shrink-0 w-64">
              <FilterCard
                title="Task Status"
                icon={<CheckCircle className="w-3 h-3 text-white" />}
                color="bg-blue-50"
              >
                <div className="space-y-1">
                  {[
                    { value: 'To Do', label: 'To Do', icon: Circle },
                    { value: 'In Progress', label: 'In Progress', icon: Clock },
                    { value: 'Completed', label: 'Completed', icon: CheckCircle },
                    { value: 'Overdue', label: 'Overdue', icon: AlertTriangle }
                  ].map(({ value, label }) => (
                    <div key={value}>
                      <CheckboxOption
                        value={value}
                        label={label}
                        isChecked={localFilters.status.includes(value)}
                        onChange={() => toggleArrayFilter('status', value)}
                        count={tasks.filter(t => t.status === value).length}
                      />
                    </div>
                  ))}
                </div>
              </FilterCard>
            </div>
          )}

          {/* Priority Level */}
          {visibleColumns.includes('priority') && (
            <div className="flex-shrink-0 w-64">
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
                        count={tasks.filter(t => t.priority === value).length}
                      />
                    </div>
                  ))}
                </div>
              </FilterCard>
            </div>
          )}

          {/* Assignee */}
          {visibleColumns.includes('assignee') && (
            <div className="flex-shrink-0 w-64">
              <FilterCard
                title="Assignee"
                icon={<User className="w-3 h-3 text-white" />}
                color="bg-purple-50"
              >
                <div className="space-y-1">
                  <CheckboxOption
                    value="unassigned"
                    label="Unassigned"
                    isChecked={localFilters.assignee.includes('unassigned')}
                    onChange={() => toggleArrayFilter('assignee', 'unassigned')}
                    count={tasks.filter(t => !t.assignee || t.assignee === '').length}
                  />
                  {users.map((user, index) => (
                    <div key={user.id || `user-${index}`}>
                      <CheckboxOption
                        value={user.id || `user-${index}`}
                        label={user.name || user.email || `User ${index + 1}`}
                        isChecked={localFilters.assignee.includes(user.id || `user-${index}`)}
                        onChange={() => toggleArrayFilter('assignee', user.id || `user-${index}`)}
                        count={tasks.filter(t => t.assignee === user.id).length}
                      />
                    </div>
                  ))}
                </div>
              </FilterCard>
            </div>
          )}

          {/* Project */}
          {visibleColumns.includes('project') && (
            <div className="flex-shrink-0 w-64">
              <FilterCard
                title="Project"
                icon={<FolderOpen className="w-3 h-3 text-white" />}
                color="bg-orange-50"
              >
                <div className="space-y-1">
                  {Array.from(new Set(tasks.map(t => t.project).filter(Boolean))).map((project, index) => (
                    <div key={project || `project-${index}`}>
                      <CheckboxOption
                        value={project || `project-${index}`}
                        label={project || `Project ${index + 1}`}
                        isChecked={localFilters.project.includes(project || `project-${index}`)}
                        onChange={() => toggleArrayFilter('project', project || `project-${index}`)}
                        count={tasks.filter(t => t.project === project).length}
                      />
                    </div>
                  ))}
                </div>
              </FilterCard>
            </div>
          )}

          {/* Date Range */}
          {visibleColumns.includes('dueDateRange') && (
            <div className="flex-shrink-0 w-64">
              <FilterCard
                title="Date Range"
                icon={<Calendar className="w-3 h-3 text-white" />}
                color="bg-blue-50"
              >
                <div className="space-y-3">
                  <DateInput
                    label="From"
                    value={localFilters.dueDateRange.from}
                    onChange={(value) => updateFilter('dueDateRange', { ...localFilters.dueDateRange, from: value })}
                  />
                  <DateInput
                    label="To"
                    value={localFilters.dueDateRange.to}
                    onChange={(value) => updateFilter('dueDateRange', { ...localFilters.dueDateRange, to: value })}
                  />
                </div>
              </FilterCard>
            </div>
          )}


          {/* Time Estimates */}
          {visibleColumns.includes('timeEstimateRange') && (
            <div className="flex-shrink-0 w-64">
              <FilterCard
                title="Time Estimates"
                icon={<Clock className="w-3 h-3 text-white" />}
                color="bg-purple-50"
              >
                <div className="space-y-3">
                  <RangeInput
                    label="Min Hours"
                    value={localFilters.timeEstimateRange.min}
                    onChange={(value) => updateFilter('timeEstimateRange', { ...localFilters.timeEstimateRange, min: value })}
                    min={tasks.length > 0 ? Math.min(...tasks.map(t => t.estimatedHours || 0)) : 0}
                    max={tasks.length > 0 ? Math.max(...tasks.map(t => t.estimatedHours || 0)) : 1000}
                    unit="h"
                  />
                  <RangeInput
                    label="Max Hours"
                    value={localFilters.timeEstimateRange.max}
                    onChange={(value) => updateFilter('timeEstimateRange', { ...localFilters.timeEstimateRange, max: value })}
                    min={tasks.length > 0 ? Math.min(...tasks.map(t => t.estimatedHours || 0)) : 0}
                    max={tasks.length > 0 ? Math.max(...tasks.map(t => t.estimatedHours || 0)) : 1000}
                    unit="h"
                  />
                </div>
              </FilterCard>
            </div>
          )}

          {/* Tags */}
          {visibleColumns.includes('tags') && (
            <div className="flex-shrink-0 w-64">
              <FilterCard
                title="Tags"
                icon={<Tag className="w-3 h-3 text-white" />}
                color="bg-orange-50"
              >
                <div className="space-y-1">
                  {Array.from(new Set(tasks.flatMap(t => 
                    t.tags ? t.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : []
                  ))).map((tag, index) => (
                    <div key={tag || `tag-${index}`}>
                      <CheckboxOption
                        value={tag || `tag-${index}`}
                        label={tag || `Tag ${index + 1}`}
                        isChecked={localFilters.tags.includes(tag || `tag-${index}`)}
                        onChange={() => toggleArrayFilter('tags', tag || `tag-${index}`)}
                        count={tasks.filter(t => t.tags && t.tags.includes(tag)).length}
                      />
                    </div>
                  ))}
                </div>
              </FilterCard>
            </div>
          )}


          {/* Additional Filters */}
          {visibleColumns.includes('additionalFilters') && (
            <div className="flex-shrink-0 w-64">
              <FilterCard
                title="Additional Filters"
                icon={<Filter className="w-3 h-3 text-white" />}
                color="bg-green-50"
              >
                <div className="space-y-1">
                  <CheckboxOption
                    value="hasAttachments"
                    label="Has Attachments"
                    isChecked={localFilters.additionalFilters.includes('hasAttachments')}
                    onChange={() => toggleArrayFilter('additionalFilters', 'hasAttachments')}
                    count={tasks.filter(t => t.attachments && t.attachments !== '[]').length}
                  />
                  <CheckboxOption
                    value="hasSubtasks"
                    label="Has Subtasks"
                    isChecked={localFilters.additionalFilters.includes('hasSubtasks')}
                    onChange={() => toggleArrayFilter('additionalFilters', 'hasSubtasks')}
                    count={tasks.filter(t => t.subtasks && t.subtasks !== '[]').length}
                  />
                  <CheckboxOption
                    value="hasComments"
                    label="Has Comments"
                    isChecked={localFilters.additionalFilters.includes('hasComments')}
                    onChange={() => toggleArrayFilter('additionalFilters', 'hasComments')}
                    count={tasks.filter(t => parseInt(t.comments) > 0).length}
                  />
                  <CheckboxOption
                    value="overdue"
                    label="Overdue Tasks"
                    isChecked={localFilters.additionalFilters.includes('overdue')}
                    onChange={() => toggleArrayFilter('additionalFilters', 'overdue')}
                    count={tasks.filter(t => {
                      const dueDate = new Date(t.dueDate);
                      const today = new Date();
                      return dueDate < today && t.status !== 'Completed';
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

export default InlineAdvancedFilters;
