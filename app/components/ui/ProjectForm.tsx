'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { Badge } from './Badge';
import { X, Calendar, User, Crown } from 'lucide-react';
import { useAuth } from '@/app/hooks/useAuth';

export interface Project {
  id: string;
  name: string;
  company: string;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  team: string | string[];
  assignee: string;
  
  // Optional fields
  description?: string;
  progress?: number;
  tasks?: string;
  tags?: string;
  notes?: string;
}

interface ProjectFormProps {
  project?: Project | null;
  onSubmit: (projectData: Partial<Project>) => void;
  onCancel: () => void;
  isOpen: boolean;
  isCollapsed?: boolean;
}

const statusOptions = [
  { value: 'Planning', label: 'Planning' },
  { value: 'Active', label: 'Active' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Review', label: 'Review' },
  { value: 'Testing', label: 'Testing' },
  { value: 'Completed', label: 'Completed' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Cancelled', label: 'Cancelled' }
];

const priorityOptions = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' }
];

// Removed dummy team members - will use real data from API

export default function ProjectForm({ project, onSubmit, onCancel, isOpen, isCollapsed = false }: ProjectFormProps) {
  const { user } = useAuth(); // Get current user
  
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    company: '',
    status: 'Planning',
    priority: 'Medium',
    startDate: '',
    endDate: '',
    team: [],
    assignee: '',
    description: '',
    progress: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  // Removed newTeamMember state - no longer needed
  const [formHeight, setFormHeight] = useState(80); // Default 80vh
  const [isDragging, setIsDragging] = useState(false);
  
  // Removed team member and team selection - no longer needed

  // Removed team member and team fetching - no longer needed

  useEffect(() => {
    if (project) {
      setFormData({
        ...project,
        team: [] // Removed team assignment
      });
    } else {
      setFormData({
        name: '',
        company: '',
        status: 'Planning',
        priority: 'Medium',
        startDate: '',
        endDate: '',
        team: [], // Removed team assignment
        assignee: '',
        description: '',
        progress: 0
      });
    }
    setErrors({});
    setFormHeight(80); // Reset form height when opening
  }, [project, isOpen]);

  // Drag handlers for resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const windowHeight = window.innerHeight;
    const newHeight = ((windowHeight - e.clientY) / windowHeight) * 100;
    const clampedHeight = Math.max(30, Math.min(90, newHeight));
    setFormHeight(clampedHeight);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!formData.company?.trim()) {
      newErrors.company = 'Company is required';
    }

    // Assignee validation removed - will be set automatically from logged-in user

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Automatically set assignee to current logged-in user
    const assignee = user?.userId || user?.email || user?.name || 'Unknown User';

    // Clean the form data to remove any React DOM elements or circular references
    const cleanFormData = {
      name: String(formData.name || '').trim(),
      company: String(formData.company || '').trim(),
      status: String(formData.status || 'Planning').trim(),
      priority: String(formData.priority || 'Medium').trim(),
      startDate: String(formData.startDate || ''),
      endDate: String(formData.endDate || ''),
      team: [], // Removed team assignment
      assignee: String(assignee).trim(), // Automatically set from logged-in user
      description: String(formData.description || '').trim(),
      progress: Number(formData.progress || 0)
    };

    console.log('🧹 Cleaned form data:', cleanFormData);
    console.log('👤 Auto-assigned to user:', assignee);
    onSubmit(cleanFormData);
  };

  const handleInputChange = (field: keyof Project, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Removed all team member functions - no longer needed

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div 
        className={`bg-white rounded-t-2xl w-full overflow-y-auto shadow-2xl ${
          isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
        style={{ 
          width: `calc(100% - ${isCollapsed ? '4rem' : '16rem'})`,
          height: `${formHeight}vh`,
          boxShadow: '0 -10px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Drag Handle - Sticky */}
        <div 
          className={`sticky top-0 z-20 w-full h-6 flex items-center justify-center cursor-row-resize hover:bg-gray-50 transition-colors ${isDragging ? 'bg-gray-100' : ''}`}
          onMouseDown={handleMouseDown}
        >
          <div className="w-12 h-1 bg-gray-400 rounded-full"></div>
        </div>

        <div className="flex flex-col h-full">
          <div className="p-6 flex-1 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {project ? 'Edit Project' : 'Create New Project'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {project ? 'Update project details' : 'Fill in the project information'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Project Name *
            </label>
            <Input
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter project name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Company *
            </label>
            <Input
              value={formData.company || ''}
              onChange={(e) => handleInputChange('company', e.target.value)}
              placeholder="Enter company name"
              className={errors.company ? 'border-red-500' : ''}
            />
            {errors.company && <p className="text-red-500 text-sm mt-1">{errors.company}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Project will be automatically assigned to: <span className="font-semibold">{user?.name || user?.email || 'Current User'}</span>
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter project description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date *
              </label>
              <Input
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={errors.startDate ? 'border-red-500' : ''}
              />
              {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                End Date *
              </label>
              <Input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className={errors.endDate ? 'border-red-500' : ''}
              />
              {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Status
              </label>
              <Select
                value={formData.status || 'Planning'}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('status', e.target.value)}
                options={statusOptions}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Priority
              </label>
              <Select
                value={formData.priority || 'Medium'}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('priority', e.target.value)}
                options={priorityOptions}
              />
            </div>
          </div>

          {/* Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Progress (%)
              </label>
              <Input
                value={formData.progress || 0}
                onChange={(e) => handleInputChange('progress', e.target.value)}
                placeholder="0"
                type="number"
                min="0"
                max="100"
              />
            </div>
            <div>
              {/* Empty div to maintain consistent layout */}
            </div>
          </div>

          {/* Team Members section completely removed */}

            </form>
          </div>

          {/* Sticky Form Actions */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(e as any);
                }}
              >
                {project ? 'Update Project' : 'Create Project'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
