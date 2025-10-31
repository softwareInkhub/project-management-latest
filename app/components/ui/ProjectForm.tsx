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
    description: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  // Removed newTeamMember state - no longer needed
  const [formHeight, setFormHeight] = useState<number>(75); // Mobile slide-up height in vh
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  
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
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        team: [], // Removed team assignment
        assignee: user?.userId || '',
        description: ''
      });
    }
    setErrors({});
    setFormHeight(75); // Reset height when opening on mobile
  }, [project, isOpen]);

  // Track desktop breakpoint to change modal sizing/behavior
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

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
      description: String(formData.description || '').trim()
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
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/70 bg-opacity-50"
      style={{ backdropFilter: 'blur(2px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div 
        className="bg-white rounded-t-2xl lg:rounded-2xl w-screen lg:w-auto max-w-none lg:max-w-2xl shadow-2xl overflow-hidden"
        style={{ 
          width: '100vw',
          height: isDesktop ? 'auto' : `${formHeight}vh`,
          maxHeight: '90vh',
          boxShadow: '0 -10px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >

         <div className="flex flex-col h-full">
          {/* Drag handle for mobile to resize like Task form */}
          <div className="lg:hidden flex items-center justify-center pt-2">
            <div className="h-1.5 w-12 rounded-full bg-gray-300" onMouseDown={handleMouseDown} />
          </div>

          <div className="p-4 lg:p-6 flex-1 lg:flex-none overflow-y-auto lg:overflow-visible">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 lg:mb-6">
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
             <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4">
          {/* Project Name & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
          </div>

          {/* Auto-assignment info */}
          <div>
            <p className="text-xs text-gray-500">
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

           {/* Date Fields - Mobile: 2 columns, Desktop: 4 columns */}
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
               {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
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
               {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
             </div>

             <div className="hidden sm:block">
               <label className="block text-sm font-semibold text-gray-800 mb-2">
                 Status
               </label>
               <Select
                 value={formData.status || 'Planning'}
                 onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('status', e.target.value)}
                 options={statusOptions}
               />
             </div>

             <div className="hidden sm:block">
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

           {/* Status, Priority - Mobile only row */}
           <div className="grid grid-cols-2 gap-3 sm:hidden">
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

          {/* Team Members section completely removed */}

            </form>
          </div>

           {/* Form Actions */}
          <div className="sticky lg:static bottom-0 bg-white border-t rounded-b-2xl border-gray-300 p-1 sm:p-4 z-10 pb-24 sm:pb-4 lg:pb-5">
             <div className="flex justify-end space-x-3">
               <Button
                 type="button"
                 variant="outline"
                 onClick={onCancel}
                 className="flex-1 sm:flex-none"
               >
                 Cancel
               </Button>
               <Button
                 type="submit"
                 onClick={(e) => {
                   e.preventDefault();
                   handleSubmit(e as any);
                 }}
                 className="flex-1 sm:flex-none"
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
