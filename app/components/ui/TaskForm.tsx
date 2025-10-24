'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Tag, FileText, Users, UserCheck, X, Paperclip, Upload, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { Task } from '../../services/api';
import { driveService, FileItem } from '../../services/drive';

interface TaskFormProps {
  task?: Task; // For editing existing tasks
  onSubmit: (taskData: Partial<Task>) => void;
  onCancel: () => void;
  isEditing?: boolean;
  isCreatingSubtask?: boolean;
  projects?: string[];
  teams?: any[];
  users?: any[];
  isLoadingUsers?: boolean;
  isLoadingTeams?: boolean;
  formHeight?: number;
  isDragging?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  currentUser?: { userId: string; email: string; name?: string; username?: string };
}

export function TaskForm({ 
  task, 
  onSubmit, 
  onCancel, 
  isEditing = false,
  isCreatingSubtask = false,
  projects = [],
  teams = [],
  users = [],
  isLoadingUsers = false,
  isLoadingTeams = false,
  formHeight = 80,
  isDragging = false,
  onMouseDown,
  currentUser
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
    assignee: task?.assignee || currentUser?.userId || '',
    assignedTeams: task?.assignedTeams || [],
    assignedUsers: task?.assignedUsers || [],
    status: task?.status || 'To Do',
    priority: task?.priority || 'Medium',
    dueDate: task?.dueDate || '',
    startDate: task?.startDate || new Date().toISOString().split('T')[0],
    estimatedHours: task?.estimatedHours || 0,
    tags: task?.tags || '',
    subtasks: task?.subtasks || '[]',
    comments: task?.comments || '0',
    parentId: task?.parentId || null,
    progress: task?.progress || 0,
    timeSpent: task?.timeSpent || '0',
  });

  // File attachment state
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const [filePreviews, setFilePreviews] = useState<{[key: string]: string}>({});

  // Load existing attachments when editing
  useEffect(() => {
    if (task?.attachments) {
      try {
        const fileIds = JSON.parse(task.attachments);
        if (Array.isArray(fileIds)) {
          setUploadedFileIds(fileIds);
        }
      } catch (e) {
        console.error('Failed to parse attachments:', e);
      }
    }
  }, [task]);

  // File handling functions
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setAttachedFiles(prev => [...prev, ...newFiles]);
    
    // Create previews for the new files
    newFiles.forEach(file => {
      const fileKey = `${file.name}-${file.size}`;
      createFilePreview(file, fileKey);
    });
  };

  const createFilePreview = (file: File, fileKey: string) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreviews(prev => ({
        ...prev,
        [fileKey]: e.target?.result as string
      }));
    };
    
    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      // For non-image files, we'll just show the file icon
      setFilePreviews(prev => ({
        ...prev,
        [fileKey]: 'file'
      }));
    }
  };

  const uploadFile = async (file: File) => {
    const fileKey = `${file.name}-${file.size}`;
    
    // Mark as uploading
    setUploadingFiles(prev => new Set(prev).add(fileKey));

    try {
      console.log('📤 Uploading file:', file.name);
      const result = await driveService.uploadFile({
        userId: formData.assignee || currentUser?.userId || '', // Use assignee's userId or current user's userId
        file,
        parentId: 'ROOT',
        tags: 'task-attachment',
      });

      // Add file ID to uploaded files
      setUploadedFileIds(prev => [...prev, result.fileId]);
      
      console.log('✅ File uploaded successfully:', result.fileId);
    } catch (error) {
      console.error('❌ Failed to upload file:', error);
      alert(`Failed to upload ${file.name}. Please try again.`);
      
      // Remove file from attached files on error
      setAttachedFiles(prev => prev.filter(f => f.name !== file.name || f.size !== file.size));
    } finally {
      // Remove from uploading set
      setUploadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileKey);
        return newSet;
      });
    }
  };

  const handleFileRemove = async (index: number, fileId?: string) => {
    if (fileId) {
      try {
        await driveService.deleteFile(fileId, formData.assignee || currentUser?.userId);
        setUploadedFileIds(prev => prev.filter(id => id !== fileId));
      } catch (error) {
        console.error('❌ Failed to delete file:', error);
        alert('Failed to delete file. Please try again.');
        return;
      }
    }
    
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Upload all attached files when task is created
  const uploadAllFiles = async (): Promise<string[]> => {
    if (attachedFiles.length === 0) return [];

    setIsUploadingAll(true);
    const uploadedIds: string[] = [];

    try {
      for (const file of attachedFiles) {
        try {
          console.log('📤 Uploading file:', file.name);
          const result = await driveService.uploadFile({
            userId: formData.assignee || currentUser?.userId || '', // Use assignee's userId or current user's userId
            file,
            parentId: 'ROOT',
            tags: 'task-attachment',
          });
          uploadedIds.push(result.fileId);
          console.log('✅ File uploaded successfully:', result.fileId);
        } catch (error) {
          console.error(`❌ Failed to upload ${file.name}:`, error);
          throw new Error(`Failed to upload ${file.name}. Please try again.`);
        }
      }
    } finally {
      setIsUploadingAll(false);
    }

    return uploadedIds;
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        // Upload files first if there are any
        let fileIds = uploadedFileIds;
        if (attachedFiles.length > 0) {
          console.log('📤 Uploading files before creating task...');
          fileIds = await uploadAllFiles();
          console.log('✅ All files uploaded successfully:', fileIds);
        }

        const taskData: Partial<Task> = {
          ...formData,
          subtasks: formData.subtasks || '[]',
          comments: formData.comments || '0',
          attachments: JSON.stringify(fileIds),
          updatedAt: new Date().toISOString(),
        };

        // Only include id and createdAt for new tasks, not for updates
        if (!isEditing) {
          taskData.id = crypto.randomUUID();
          taskData.createdAt = new Date().toISOString();
        }
        
        onSubmit(taskData);
      } catch (error) {
        console.error('❌ Failed to upload files:', error);
        alert('Failed to upload files. Please try again.');
      }
    }
  };

  const handleInputChange = (field: keyof Task, value: any) => {
    console.log(`🔄 TaskForm: ${field} changed to:`, value);
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
                {isEditing ? 'Edit Task' : isCreatingSubtask ? 'Create New Subtask' : 'Create New Task'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {isEditing ? 'Update the task details below' : isCreatingSubtask ? 'This task will automatically be added as a subtask' : 'Fill in the details to create a new task'}
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

          {/* File Attachments */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-4">
              File Attachments
            </label>
            
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                isDragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-2">
                Drag and drop files here, or{' '}
                <label className="text-blue-600 cursor-pointer hover:text-blue-700">
                  browse to upload
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </label>
              </p>
              <p className="text-sm text-gray-500">
                Supports all file types
              </p>
            </div>

            {/* Attached Files List */}
            {attachedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Attached Files ({attachedFiles.length})
                </h4>
                <div className="space-y-2">
                  {attachedFiles.map((file, index) => {
                    const fileKey = `${file.name}-${file.size}`;
                    const isUploading = uploadingFiles.has(fileKey);
                    const uploadedFileId = uploadedFileIds[index];
                    const preview = filePreviews[fileKey];
                    const isImage = file.type.startsWith('image/');
                    
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          {isImage && preview && preview !== 'file' ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                              <img 
                                src={preview} 
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-100 flex-shrink-0">
                              <Paperclip className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                              {uploadedFileId && ' • Ready to upload'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleFileRemove(index, uploadedFileId)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Files will be uploaded when the task is created
                </div>
              </div>
            )}
          </div>

          {/* Project, Status and Priority */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Project *
                </label>
                <Select
                  value={formData.project || ''}
                  onChange={(e) => handleInputChange('project', e.target.value)}
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

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Status
                </label>
                <Select
                  value={formData.status || 'To Do'}
                  onChange={(e) => handleInputChange('status', e.target.value)}
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
                  onChange={(e) => handleInputChange('priority', e.target.value)}
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

          {/* Assignment Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            {/* Assigned Users - Multi-select */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2 text-blue-600" />
                Assigned Users
              </label>
              <div className="relative">
                <select
                  className="w-full px-4 py-3 h-12 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  onChange={(e) => {
                    const selectedUser = e.target.value;
                    if (selectedUser && !(formData.assignedUsers || []).includes(selectedUser)) {
                      handleInputChange('assignedUsers', [...(formData.assignedUsers || []), selectedUser]);
                    }
                    e.target.value = ''; // Reset dropdown
                  }}
                  disabled={isLoadingUsers}
                >
                  <option value="">{isLoadingUsers ? 'Loading users...' : 'Select users to assign...'}</option>
                  {users
                    .filter(user => !(formData.assignedUsers || []).includes(user.id || user.userId))
                    .map((user, index) => (
                      <option key={user.id || user.userId || `user-${index}`} value={user.id || user.userId}>
                        {user.name || user.username || user.email}
                      </option>
                    ))
                  }
                </select>
              </div>
              
              {/* Selected Users Display */}
              {(formData.assignedUsers || []).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(formData.assignedUsers || []).map((userId, index) => {
                    const user = users.find(u => (u.id || u.userId) === userId);
                    return (
                      <div
                        key={`selected-user-${index}`}
                        className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium"
                      >
                        <User className="w-3 h-3" />
                        <span>{user?.name || user?.username || user?.email || userId}</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange('assignedUsers', (formData.assignedUsers || []).filter(u => u !== userId));
                          }}
                          className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Assigned Teams - Multi-select */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                <Users className="w-4 h-4 mr-2 text-purple-600" />
                Assigned Teams
              </label>
              <div className="relative">
                <select
                  className="w-full px-4 py-3 h-12 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  onChange={(e) => {
                    const selectedTeam = e.target.value;
                    if (selectedTeam && !(formData.assignedTeams || []).includes(selectedTeam)) {
                      handleInputChange('assignedTeams', [...(formData.assignedTeams || []), selectedTeam]);
                    }
                    e.target.value = ''; // Reset dropdown
                  }}
                  disabled={isLoadingTeams}
                >
                  <option value="">{isLoadingTeams ? 'Loading teams...' : 'Select teams to assign...'}</option>
                  {teams
                    .filter(team => !(formData.assignedTeams || []).includes(team.id))
                    .map((team, index) => (
                      <option key={team.id || `team-${index}`} value={team.id}>
                        {team.name}
                      </option>
                    ))
                  }
                </select>
              </div>
              
              {/* Selected Teams Display */}
              {(formData.assignedTeams || []).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(formData.assignedTeams || []).map((teamId, index) => {
                    const team = teams.find(t => t.id === teamId);
                    return (
                      <div
                        key={`selected-team-${index}`}
                        className="flex items-center space-x-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium"
                      >
                        <Users className="w-3 h-3" />
                        <span>{team?.name || teamId}</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange('assignedTeams', (formData.assignedTeams || []).filter(t => t !== teamId));
                          }}
                          className="hover:bg-purple-100 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
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
            disabled={isUploadingAll}
          >
            {isUploadingAll ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Uploading Files...
              </>
            ) : (
              isEditing ? 'Update Task' : isCreatingSubtask ? 'Create Subtask' : 'Create Task'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
