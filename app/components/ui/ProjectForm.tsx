'use client';

import { useState, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { Badge } from './Badge';
import { X, Plus, Calendar, Users, User, Crown } from 'lucide-react';

export interface Project {
  id: string;
  name: string;
  company: string;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  budget: string;
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

const teamMembers = [
  'John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 
  'David Brown', 'Lisa Davis', 'Tom Anderson', 'Emma Taylor'
];

export default function ProjectForm({ project, onSubmit, onCancel, isOpen, isCollapsed = false }: ProjectFormProps) {
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    company: '',
    status: 'Planning',
    priority: 'Medium',
    startDate: '',
    endDate: '',
    budget: '',
    team: [],
    assignee: '',
    description: '',
    progress: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTeamMember, setNewTeamMember] = useState('');

  useEffect(() => {
    if (project) {
      setFormData({
        ...project,
        team: Array.isArray(project.team) ? project.team : (typeof project.team === 'string' ? [project.team] : [])
      });
    } else {
      setFormData({
        name: '',
        company: '',
        status: 'Planning',
        priority: 'Medium',
        startDate: '',
        endDate: '',
        budget: '',
        team: [],
        assignee: '',
        description: '',
        progress: 0
      });
    }
    setErrors({});
  }, [project, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!formData.company?.trim()) {
      newErrors.company = 'Company is required';
    }

    if (!formData.assignee?.trim()) {
      newErrors.assignee = 'Assignee is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (formData.budget && isNaN(Number(formData.budget))) {
      newErrors.budget = 'Budget must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Clean the form data to remove any React DOM elements or circular references
    const cleanFormData = {
      name: String(formData.name || '').trim(),
      company: String(formData.company || '').trim(),
      status: String(formData.status || 'Planning').trim(),
      priority: String(formData.priority || 'Medium').trim(),
      startDate: String(formData.startDate || ''),
      endDate: String(formData.endDate || ''),
      budget: String(formData.budget || '').trim(),
      team: Array.isArray(formData.team) ? formData.team.map(String) : [],
      assignee: String(formData.assignee || '').trim(),
      description: String(formData.description || '').trim(),
      progress: Number(formData.progress || 0)
    };

    console.log('🧹 Cleaned form data:', cleanFormData);
    onSubmit(cleanFormData);
  };

  const handleInputChange = (field: keyof Project, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addTeamMember = () => {
    if (newTeamMember.trim() && !(Array.isArray(formData.team) ? formData.team : []).includes(newTeamMember.trim())) {
      setFormData(prev => ({
        ...prev,
        team: [...(Array.isArray(prev.team) ? prev.team : []), newTeamMember.trim()]
      }));
      setNewTeamMember('');
    }
  };

  const removeTeamMember = (member: string) => {
    setFormData(prev => ({
      ...prev,
      team: (Array.isArray(prev.team) ? prev.team : []).filter(m => m !== member)
    }));
  };

  const addPresetTeamMember = (member: string) => {
    if (!(Array.isArray(formData.team) ? formData.team : []).includes(member)) {
      setFormData(prev => ({
        ...prev,
        team: [...(Array.isArray(prev.team) ? prev.team : []), member]
      }));
    }
  };

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
        className={`bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl ${
          isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
        style={{ 
          width: `calc(100% - ${isCollapsed ? '4rem' : '16rem'})`,
          boxShadow: '0 -10px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
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
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

          {/* Company & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Assignee *
              </label>
              <Input
                value={formData.assignee || ''}
                onChange={(e) => handleInputChange('assignee', e.target.value)}
                placeholder="Enter assignee name"
                className={errors.assignee ? 'border-red-500' : ''}
              />
              {errors.assignee && <p className="text-red-500 text-sm mt-1">{errors.assignee}</p>}
            </div>
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
                onChange={(value) => handleInputChange('status', value)}
                options={statusOptions}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Priority
              </label>
              <Select
                value={formData.priority || 'Medium'}
                onChange={(value) => handleInputChange('priority', value)}
                options={priorityOptions}
              />
            </div>
          </div>

          {/* Budget & Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Budget
              </label>
              <Input
                value={formData.budget || ''}
                onChange={(e) => handleInputChange('budget', e.target.value)}
                placeholder="Enter budget amount"
                type="number"
                className={errors.budget ? 'border-red-500' : ''}
              />
              {errors.budget && <p className="text-red-500 text-sm mt-1">{errors.budget}</p>}
            </div>

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
          </div>

          {/* Team Members */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Team Members
            </label>
            
            {/* Add Team Member */}
            <div className="flex gap-2 mb-3">
              <Input
                value={newTeamMember}
                onChange={(e) => setNewTeamMember(e.target.value)}
                placeholder="Enter team member name"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={addTeamMember}
                variant="outline"
                size="sm"
                className="px-3"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Preset Team Members */}
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-2">Quick add:</p>
              <div className="flex flex-wrap gap-2">
                {teamMembers.map((member) => (
                  <Button
                    key={member}
                    type="button"
                    onClick={() => addPresetTeamMember(member)}
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    disabled={(Array.isArray(formData.team) ? formData.team : []).includes(member)}
                  >
                    {member}
                  </Button>
                ))}
              </div>
            </div>

            {/* Selected Team Members */}
            <div className="space-y-2">
              {(Array.isArray(formData.team) ? formData.team : []).map((member) => (
                <div key={member} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-800">{member}</span>
                  <Button
                    type="button"
                    onClick={() => removeTeamMember(member)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {(!Array.isArray(formData.team) || formData.team.length === 0) && (
                <p className="text-sm text-gray-500 italic">No team members added yet</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-6"
            >
              {project ? 'Update Project' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
