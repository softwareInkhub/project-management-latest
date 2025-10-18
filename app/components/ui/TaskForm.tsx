'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Tag, FileText, Users, UserCheck, X } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { Task } from '../../services/api';

interface TaskFormProps {
  task?: Task; // For editing existing tasks
  onSubmit: (taskData: Partial<Task>) => void;
  onCancel: () => void;
  isEditing?: boolean;
  projects?: string[];
  teams?: string[];
  users?: any[];
  isLoadingUsers?: boolean;
  isLoadingTeams?: boolean;
  formHeight?: number;
  isDragging?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export function TaskForm({ 
  task, 
  onSubmit, 
  onCancel, 
  isEditing = false,
  projects = [],
  teams = [],
  users = [],
  isLoadingUsers = false,
  isLoadingTeams = false,
  formHeight = 80,
  isDragging = false,
  onMouseDown
}: TaskFormProps) {
  // Debug: Log users when they change
  React.useEffect(() => {
    if (users.length > 0) {
      console.log('👥 TaskForm received users:', users);
    }
  }, [users]);
  
  const [formData, setFormData] = useState<Partial<Task>>({
    title: task?.title || '',
    description: task?.description || '',
    project: task?.project || '',
    assignee: task?.assignee || '',
    assignedTeams: task?.assignedTeams || [],
    assignedUsers: task?.assignedUsers || [],
    status: task?.status || 'To Do',
    priority: task?.priority || 'Medium',
    dueDate: task?.dueDate || '',
    startDate: task?.startDate || '',
    estimatedHours: task?.estimatedHours || 0,
    tags: task?.tags || '',
    subtasks: task?.subtasks || '[]',
    comments: task?.comments || '0',
    parentId: task?.parentId || null,
    progress: task?.progress || 0,
    timeSpent: task?.timeSpent || '0',
  });

  // Helper functions for hours and minutes
  const getHoursFromEstimatedHours = (hours: number) => Math.floor(hours);
  const getMinutesFromEstimatedHours = (hours: number) => Math.round((hours % 1) * 60);
  const convertToEstimatedHours = (hours: number, minutes: number) => hours + (minutes / 60);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.project?.trim()) {
      newErrors.project = 'Project is required';
    }


    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (formData.estimatedHours && formData.estimatedHours <= 0) {
      newErrors.estimatedHours = 'Estimated hours must be greater than 0';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const taskData: Partial<Task> = {
        ...formData,
        subtasks: formData.subtasks || '[]',
        comments: formData.comments || '0',
        updatedAt: new Date().toISOString(),
      };

      // Only include id and createdAt for new tasks, not for updates
      if (!isEditing) {
        taskData.id = crypto.randomUUID();
        taskData.createdAt = new Date().toISOString();
      }
      
      onSubmit(taskData);
    }
  };

  const handleInputChange = (field: keyof Task, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => ({
        ...prev,
        [field as string]: ''
      }));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Drag Handle - Sticky */}
      {onMouseDown && (
        <div 
          className={`sticky top-0 z-20 w-full h-6 flex items-center justify-center cursor-row-resize hover:bg-gray-50 transition-colors ${isDragging ? 'bg-gray-100' : ''}`}
          onMouseDown={onMouseDown}
        >
          <div className="w-12 h-1 bg-gray-400 rounded-full"></div>
        </div>
      )}
      
      <div className="p-6 flex-1 overflow-y-auto">
        {/* Modern Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? 'Edit Task' : 'Create New Task'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {isEditing ? 'Update the task details below' : 'Fill in the details to create a new task'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Task Title *
                </label>
                <Input
                  value={formData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter a clear, descriptive task title"
                  className={`h-12 text-base ${errors.title ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Provide detailed information about the task..."
                  rows={4}
                  className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none text-base ${errors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Project and Assignment */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Project *
                </label>
                <Select
                  value={formData.project || ''}
                  onChange={(value) => handleInputChange('project', value)}
                  options={[
                    { value: '', label: 'Select Project' },
                    ...projects.map(project => ({ value: project, label: project }))
                  ]}
                  className={`h-12 text-base ${errors.project ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                />
                {errors.project && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.project}
                  </p>
                )}
              </div>


            </div>
          </div>

          {/* Assignment Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Assigned To User
                </label>
                <Select
                  value={formData.assignee || ''}
                  onChange={(value) => handleInputChange('assignee', value)}
                  options={[
                    { value: '', label: isLoadingUsers ? 'Loading users...' : 'Select User' },
                    ...users.map(user => ({ 
                      value: user.name || user.username || user.email, 
                      label: user.name || user.username || user.email 
                    }))
                  ]}
                  className="h-12 text-base focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoadingUsers}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Assigned To Team
                </label>
                <Select
                  value={formData.assignedTeams?.[0] || ''}
                  onChange={(value) => handleInputChange('assignedTeams', value ? [value] : [])}
                  options={[
                    { value: '', label: isLoadingTeams ? 'Loading teams...' : 'Select Team' },
                    ...teams.map(team => ({ value: team, label: team }))
                  ]}
                  className="h-12 text-base focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoadingTeams}
                />
              </div>
            </div>
          </div>

          {/* Status and Priority */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Status
                </label>
                <Select
                  value={formData.status || 'To Do'}
                  onChange={(value) => handleInputChange('status', value)}
                  options={[
                    { value: 'To Do', label: 'To Do' },
                    { value: 'In Progress', label: 'In Progress' },
                    { value: 'Completed', label: 'Completed' },
                    { value: 'Overdue', label: 'Overdue' }
                  ]}
                  className="h-12 text-base focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Priority
                </label>
                <Select
                  value={formData.priority || 'Medium'}
                  onChange={(value) => handleInputChange('priority', value)}
                  options={[
                    { value: 'Low', label: 'Low' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'High', label: 'High' }
                  ]}
                  className="h-12 text-base focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Dates and Time */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Start Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className={`h-12 pl-12 text-base ${errors.startDate ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                  />
                </div>
                {errors.startDate && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.startDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Due Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="date"
                    value={formData.dueDate || ''}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    className={`h-12 pl-12 text-base ${errors.dueDate ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                  />
                </div>
                {errors.dueDate && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.dueDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Estimated Time
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      value={getHoursFromEstimatedHours(formData.estimatedHours || 0).toString()}
                      onChange={(e) => {
                        const hours = parseInt(e.target.value);
                        const minutes = getMinutesFromEstimatedHours(formData.estimatedHours || 0);
                        handleInputChange('estimatedHours', convertToEstimatedHours(hours, minutes));
                      }}
                      options={Array.from({ length: 25 }, (_, i) => ({
                        value: i.toString(),
                        label: `${i} ${i === 1 ? 'hour' : 'hours'}`
                      }))}
                      placeholder="Hours"
                      className={`h-12 text-base ${errors.estimatedHours ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                    />
                  </div>
                  <div className="flex-1">
                    <Select
                      value={getMinutesFromEstimatedHours(formData.estimatedHours || 0).toString()}
                      onChange={(e) => {
                        const minutes = parseInt(e.target.value);
                        const hours = getHoursFromEstimatedHours(formData.estimatedHours || 0);
                        handleInputChange('estimatedHours', convertToEstimatedHours(hours, minutes));
                      }}
                      options={[0, 15, 30, 45].map((minutes) => ({
                        value: minutes.toString(),
                        label: `${minutes} min`
                      }))}
                      placeholder="Minutes"
                      className={`h-12 text-base ${errors.estimatedHours ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                    />
                  </div>
                </div>
                {errors.estimatedHours && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.estimatedHours}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Tags
              </label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  value={formData.tags || ''}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="Enter tags separated by commas"
                  className="h-12 pl-12 text-base focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Separate multiple tags with commas (e.g., design, frontend, ui)
              </p>
            </div>
          </div>

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
            {isEditing ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </div>
    </div>
  );
}
