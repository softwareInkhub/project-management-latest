'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  FileText, 
  Users, 
  UserCheck, 
  X, 
  Paperclip, 
  Upload, 
  Trash2,
  Bold,
  Italic,
  Strikethrough,
  Heading,
  Quote,
  Code,
  Code2,
  List,
  ListOrdered,
  CheckSquare,
  Link as LinkIcon,
  Image as ImageIcon,
  Table,
  Minus,
  ChevronDown,
  Eye
} from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { Task } from '../../services/api';
import { driveService, FileItem } from '../../services/drive';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface TaskFormProps {
  task?: Task; // For editing existing tasks
  onSubmit: (taskData: Partial<Task>) => void;
  onCancel: () => void;
  isEditing?: boolean;
  isCreatingSubtask?: boolean;
  projects?: any[]; // Changed from string[] to any[] to include full project objects
  teams?: any[];
  users?: any[];
  stories?: any[];
  sprints?: any[];
  isLoadingUsers?: boolean;
  isLoadingTeams?: boolean;
  formHeight?: number;
  isDragging?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  currentUser?: { userId: string; email: string; name?: string; username?: string };
}

// Markdown rendering component
const MarkdownRenderer: React.FC<{ content: string; className?: string }> = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                className="rounded-md my-4"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },
          h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-bold mt-4 mb-2">{children}</h3>,
          h4: ({ children }) => <h4 className="text-base font-bold mt-3 mb-2">{children}</h4>,
          h5: ({ children }) => <h5 className="text-sm font-bold mt-2 mb-1">{children}</h5>,
          h6: ({ children }) => <h6 className="text-xs font-bold mt-2 mb-1">{children}</h6>,
          a: ({ children, href }) => (
            <a href={href} className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="list-disc list-inside my-3 ml-4 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside my-3 ml-4 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="ml-2">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 my-4 italic bg-gray-50 dark:bg-gray-800/50">
              {children}
            </blockquote>
          ),
          p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 bg-gray-100 dark:bg-gray-800 font-semibold text-left">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">{children}</td>
          ),
          img: ({ src, alt }) => (
            <img src={src} alt={alt} className="max-w-full h-auto rounded-lg my-4" />
          ),
          hr: () => <hr className="my-6 border-gray-300 dark:border-gray-600" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export function TaskForm({ 
  task, 
  onSubmit, 
  onCancel, 
  isEditing = false,
  isCreatingSubtask = false,
  projects = [],
  teams = [],
  users = [],
  stories = [],
  sprints = [],
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
    story_id: task?.story_id || '',
    sprint_id: task?.sprint_id || '',
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

  // Update formData when task prop changes (e.g., when converting note to task)
  useEffect(() => {
    if (task) {
      console.log('🔄 TaskForm: Updating formData from task prop:', task);
      setFormData({
        title: task.title || '',
        description: task.description || '',
        project: task.project || '',
        story_id: task.story_id || '',
        sprint_id: task.sprint_id || '',
        assignee: task.assignee || currentUser?.userId || '',
        assignedTeams: task.assignedTeams || [],
        assignedUsers: task.assignedUsers || [],
        status: task.status || 'To Do',
        priority: task.priority || 'Medium',
        dueDate: task.dueDate || '',
        startDate: task.startDate || new Date().toISOString().split('T')[0],
        estimatedHours: task.estimatedHours || 0,
        tags: task.tags || '',
        subtasks: task.subtasks || '[]',
        comments: task.comments || '0',
        parentId: task.parentId || null,
        progress: task.progress || 0,
        timeSpent: task.timeSpent || '0',
      });
    }
  }, [task, currentUser]);

  // Clear sprint when project changes
  useEffect(() => {
    if (formData.project) {
      // Find the selected project object to get its ID
      const selectedProject = projects.find(p => p.name === formData.project || p.id === formData.project);
      const projectId = selectedProject?.id;
      
      // Check if current sprint belongs to new project
      const currentSprint = sprints.find(s => s.id === formData.sprint_id);
      if (currentSprint && projectId && currentSprint.project_id !== projectId) {
        console.log('🔄 Project changed, clearing sprint and story');
        setFormData(prev => ({ ...prev, sprint_id: '', story_id: '' }));
      }
    } else {
      // If no project selected, clear sprint and story
      if (formData.sprint_id || formData.story_id) {
        setFormData(prev => ({ ...prev, sprint_id: '', story_id: '' }));
      }
    }
  }, [formData.project, formData.sprint_id, formData.story_id, sprints, projects]);

  // Clear story when sprint changes
  useEffect(() => {
    if (formData.sprint_id) {
      // Check if current story belongs to new sprint
      const currentStory = stories.find(s => s.id === formData.story_id);
      if (currentStory && currentStory.sprint_id !== formData.sprint_id) {
        console.log('🔄 Sprint changed, clearing story');
        setFormData(prev => ({ ...prev, story_id: '' }));
      }
    } else {
      // If no sprint selected, clear story
      if (formData.story_id) {
        setFormData(prev => ({ ...prev, story_id: '' }));
      }
    }
  }, [formData.sprint_id, formData.story_id, stories]);

  // File attachment state
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  
  // Markdown editor state
  const [isDescriptionPreview, setIsDescriptionPreview] = useState(false);
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  const headingDropdownRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const [filePreviews, setFilePreviews] = useState<{[key: string]: string}>({});

  // State for existing files metadata
  const [existingFiles, setExistingFiles] = useState<Array<{fileId: string; fileName: string; fileSize?: number}>>([]);

  // Load existing attachments when editing
  useEffect(() => {
    if (task?.attachments) {
      try {
        const fileIds = JSON.parse(task.attachments);
        if (Array.isArray(fileIds) && fileIds.length > 0) {
          console.log('📎 TaskForm: Loading existing file IDs:', fileIds);
          setUploadedFileIds(fileIds);
          
          // Fetch file metadata for display
          fetchExistingFilesMetadata(fileIds);
        } else {
          // Clear existing files if no attachments
          setUploadedFileIds([]);
          setExistingFiles([]);
        }
      } catch (e) {
        console.error('Failed to parse attachments:', e);
        setUploadedFileIds([]);
        setExistingFiles([]);
      }
    } else {
      // Clear if no attachments
      setUploadedFileIds([]);
      setExistingFiles([]);
    }
  }, [task]);

  // Fetch metadata for existing files
  const fetchExistingFilesMetadata = async (fileIds: string[]) => {
    const filesMetadata: Array<{fileId: string; fileName: string; fileSize?: number}> = [];
    
    for (const fileId of fileIds) {
      try {
        // For now, just show fileId as filename
        // In production, you'd fetch from Drive API: const metadata = await driveService.getFileMetadata(fileId);
        filesMetadata.push({
          fileId,
          fileName: `File ${fileId.substring(0, 8)}...`, // Shortened fileId as placeholder
          fileSize: undefined
        });
      } catch (error) {
        console.error(`Failed to fetch metadata for file ${fileId}:`, error);
      }
    }
    
    console.log('✅ Existing files metadata:', filesMetadata);
    setExistingFiles(filesMetadata);
  };

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
  
  // Close heading dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headingDropdownRef.current && !headingDropdownRef.current.contains(event.target as Node)) {
        setShowHeadingDropdown(false);
      }
    };

    if (showHeadingDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHeadingDropdown]);

  // Markdown helper functions
  const insertMarkdown = (prefix: string, suffix: string = '', placeholder: string = 'text') => {
    const textarea = document.getElementById('task-description-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = (formData.description || '').substring(start, end);
    const textToInsert = selectedText || placeholder;
    const newText = (formData.description || '').substring(0, start) + prefix + textToInsert + suffix + (formData.description || '').substring(end);
    
    setFormData({ ...formData, description: newText });
    
    setTimeout(() => {
      textarea.focus();
      if (!selectedText) {
        textarea.selectionStart = start + prefix.length;
        textarea.selectionEnd = start + prefix.length + placeholder.length;
      } else {
        textarea.selectionStart = start + prefix.length;
        textarea.selectionEnd = end + prefix.length;
      }
    }, 0);
  };

  const insertHeading = (level: number) => {
    const textarea = document.getElementById('task-description-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = (formData.description || '').lastIndexOf('\n', start - 1) + 1;
    const prefix = '#'.repeat(level) + ' ';
    
    const beforeLine = (formData.description || '').substring(0, lineStart);
    const afterLine = (formData.description || '').substring(lineStart);
    const newText = beforeLine + prefix + afterLine;
    
    setFormData({ ...formData, description: newText });
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = lineStart + prefix.length;
    }, 0);
  };

  const insertTable = () => {
    const tableTemplate = '\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n';
    const textarea = document.getElementById('task-description-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = (formData.description || '').substring(0, start) + tableTemplate + (formData.description || '').substring(start);
    
    setFormData({ ...formData, description: newText });
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + tableTemplate.length;
    }, 0);
  };

  const insertCodeBlock = () => {
    const textarea = document.getElementById('task-description-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = (formData.description || '').substring(start, end);
    const codeBlock = '\n```javascript\n' + (selectedText || 'your code here') + '\n```\n';
    const newText = (formData.description || '').substring(0, start) + codeBlock + (formData.description || '').substring(end);
    
    setFormData({ ...formData, description: newText });
    
    setTimeout(() => {
      textarea.focus();
      const codeStart = start + '\n```javascript\n'.length;
      textarea.selectionStart = codeStart;
      textarea.selectionEnd = codeStart + (selectedText || 'your code here').length;
    }, 0);
  };

  const insertTaskList = () => {
    insertMarkdown('- [ ] ', '', 'task item');
  };

  const insertBlockquote = () => {
    const textarea = document.getElementById('task-description-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = (formData.description || '').lastIndexOf('\n', start - 1) + 1;
    
    const beforeLine = (formData.description || '').substring(0, lineStart);
    const afterLine = (formData.description || '').substring(lineStart);
    const newText = beforeLine + '> ' + afterLine;
    
    setFormData({ ...formData, description: newText });
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = lineStart + 2;
    }, 0);
  };

  const insertHorizontalRule = () => {
    const textarea = document.getElementById('task-description-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const hrText = '\n---\n';
    const newText = (formData.description || '').substring(0, start) + hrText + (formData.description || '').substring(start);
    
    setFormData({ ...formData, description: newText });
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + hrText.length;
    }, 0);
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
          className={`sticky top-0 z-20 w-full h-6 flex items-center justify-center cursor-row-resize hover:bg-gray-50 transition-colors sm:hidden ${isDragging ? 'bg-gray-100' : ''}`}
          onMouseDown={onMouseDown}
        >
          <div className="w-12 h-1 bg-gray-400 rounded-full"></div>
        </div>
      )}
      
      <div className="p-4 sm:p-6 flex-1 overflow-y-auto scrollbar-hide">
        {/* Modern Header */}
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              {isEditing ? 'Edit Task' : isCreatingSubtask ? 'Create New Subtask' : 'Create New Task'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
              {isEditing ? 'Update the task details below' : isCreatingSubtask ? 'This task will automatically be added as a subtask' : 'Fill in the details to create a new task'}
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* All Form Fields in Single Layout */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm space-y-6">
            {/* Row 1: Task Title, Project, Sprint, Story */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Task Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Task Title *
                </label>
                <Input
                  value={formData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter a clear, descriptive task title"
                  className={`h-10 text-base ${errors.title ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Project */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Project *
                </label>
                <Select
                  value={formData.project || ''}
                  onValueChange={(val) => handleInputChange('project', val)}
                  onChange={(e) => handleInputChange('project', (e.target as any).value)}
                  options={[
                    { value: '', label: 'Select Project' },
                    ...projects.map(project => ({ 
                      value: typeof project === 'string' ? project : project.name, 
                      label: typeof project === 'string' ? project : project.name 
                    }))
                  ]}
                  className={`w-full h-12 text-base ${errors.project ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                />
                {errors.project && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1 ">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.project}
                  </p>
                )}
              </div>

              {/* Sprint */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Sprint
                </label>
                <Select
                  value={formData.sprint_id || ''}
                  onValueChange={(val) => handleInputChange('sprint_id', val)}
                  onChange={(e) => handleInputChange('sprint_id', (e.target as any).value)}
                  options={(() => {
                    // Find the selected project object to get its ID
                    const selectedProject = projects.find(p => p.name === formData.project || p.id === formData.project);
                    const projectId = selectedProject?.id;
                    
                    // Filter sprints by project ID
                    const filteredSprints = projectId 
                      ? sprints.filter(sprint => sprint.project_id === projectId)
                      : [];
                    
                    console.log('🔍 Filtering sprints for project:', formData.project, 'projectId:', projectId, 'found:', filteredSprints.length);
                    
                    return [
                      { value: '', label: 'No Sprint' },
                      ...filteredSprints.map(sprint => ({ value: sprint.id, label: sprint.name }))
                    ];
                  })()}
                  disabled={!formData.project}
                  className="w-full h-12 text-base focus:ring-blue-500 focus:border-blue-500"
                />
                {/* {!formData.project && (
                  <p className="text-xs text-gray-500 mt-1">Please select a project first</p>
                )} */}
              </div>

              {/* Story */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Story
                </label>
                <Select
                  value={formData.story_id || ''}
                  onValueChange={(val) => handleInputChange('story_id', val)}
                  onChange={(e) => handleInputChange('story_id', (e.target as any).value)}
                  options={(() => {
                    // Filter stories by selected sprint
                    const filteredStories = formData.sprint_id 
                      ? stories.filter(story => story.sprint_id === formData.sprint_id)
                      : [];
                    
                    return [
                      { value: '', label: 'No Story' },
                      ...filteredStories.map(story => ({ value: story.id, label: story.title }))
                    ];
                  })()}
                  disabled={!formData.sprint_id}
                  className="w-full h-12 text-base focus:ring-blue-500 focus:border-blue-500"
                />
                {/* {!formData.sprint_id && (
                  <p className="text-xs text-gray-500 mt-1">Please select a sprint first</p>
                )} */}
              </div>
            </div>

            {/* Row 2: Status, Priority, Start Date, Due Date, Estimated Time */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Status
                </label>
                <Select
                  value={formData.status || 'To Do'}
                  onValueChange={(val) => handleInputChange('status', val)}
                  onChange={(e) => handleInputChange('status', (e.target as any).value)}
                  options={[
                    { value: 'To Do', label: 'To Do' },
                    { value: 'In Progress', label: 'In Progress' },
                    { value: 'Completed', label: 'Completed' },
                    { value: 'Overdue', label: 'Overdue' }
                  ]}
                  className="w-full h-12 text-base focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Priority
                </label>
                <Select
                  value={formData.priority || 'Medium'}
                  onValueChange={(val) => handleInputChange('priority', val)}
                  onChange={(e) => handleInputChange('priority', (e.target as any).value)}
                  options={[
                    { value: 'Low', label: 'Low' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'High', label: 'High' }
                  ]}
                  className="w-full h-12 text-base focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Start Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 hidden sm:block" />
                  <Input
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className={`h-10 w-full pl-4 pr-3 sm:pl-5 text-base ${errors.startDate ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                  />
                </div>
                {errors.startDate && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.startDate}
                  </p>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Due Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 hidden sm:block" />
                  <Input
                    type="date"
                    value={formData.dueDate || ''}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    className={`h-10 w-full pl-4 pr-3 sm:pl-5 text-base ${errors.dueDate ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                  />
                </div>
                {errors.dueDate && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.dueDate}
                  </p>
                )}
              </div>

              {/* Estimated Time */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Estimated Time
                </label>
                <Select
                  value={getHoursFromEstimatedHours(formData.estimatedHours || 0).toString()}
                  onValueChange={(val) => {
                    const hours = parseInt(val);
                    handleInputChange('estimatedHours', hours);
                  }}
                  onChange={(e) => {
                    const hours = parseInt((e.target as any).value);
                    handleInputChange('estimatedHours', hours);
                  }}
                  options={Array.from({ length: 25 }, (_, i) => ({
                    value: i.toString(),
                    label: `${i} ${i === 1 ? 'hour' : 'hours'}`
                  }))}
                  placeholder="Hours"
                  className={`w-full h-12 text-base ${errors.estimatedHours ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                />
                {errors.estimatedHours && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.estimatedHours}
                  </p>
                )}
              </div>
            </div>

            {/* Row 3: Assignment Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Assigned Users - Multi-select */}
              <div>
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
                  onFocus={(e) => {
                    // Limit height on desktop only
                    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                      e.currentTarget.style.maxHeight = '200px';
                      e.currentTarget.style.overflowY = 'auto';
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.maxHeight = 'none';
                    e.currentTarget.style.overflowY = 'auto';
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

            {/* Row 4: Tags */}
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

            {/* Row 5: Description with Markdown Support - Full Width */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Description *
              </label>
              
              {/* Markdown Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-gray-200 mb-3">
                {/* Left side - Formatting buttons */}
                <div className="flex items-center space-x-1 flex-wrap">
                  {/* Text Formatting */}
                  <button type="button" onClick={() => insertMarkdown('**', '**', 'bold text')} className="p-2 hover:bg-gray-100 rounded transition-colors" title="Bold">
                    <Bold className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => insertMarkdown('*', '*', 'italic text')} className="p-2 hover:bg-gray-100 rounded transition-colors" title="Italic">
                    <Italic className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => insertMarkdown('~~', '~~', 'strikethrough')} className="p-2 hover:bg-gray-100 rounded transition-colors" title="Strikethrough">
                    <Strikethrough className="w-4 h-4" />
                  </button>
                  
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  
                  {/* Heading Dropdown */}
                  <div className="relative" ref={headingDropdownRef}>
                    <button 
                      type="button"
                      onClick={() => setShowHeadingDropdown(!showHeadingDropdown)}
                      className="p-2 hover:bg-gray-100 rounded transition-colors flex items-center space-x-1" 
                      title="Heading"
                    >
                      <Heading className="w-4 h-4" />
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {showHeadingDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                        {[1, 2, 3, 4, 5, 6].map(level => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => { insertHeading(level); setShowHeadingDropdown(false); }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                          >
                            <span className={`font-bold`} style={{ fontSize: `${20 - level}px` }}>H{level}</span> Heading {level}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button type="button" onClick={insertBlockquote} className="p-2 hover:bg-gray-100 rounded transition-colors" title="Blockquote">
                    <Quote className="w-4 h-4" />
                  </button>
                  
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  
                  {/* Code */}
                  <button type="button" onClick={() => insertMarkdown('`', '`', 'code')} className="p-2 hover:bg-gray-100 rounded transition-colors" title="Inline Code">
                    <Code className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={insertCodeBlock} className="p-2 hover:bg-gray-100 rounded transition-colors" title="Code Block">
                    <Code2 className="w-4 h-4" />
                  </button>
                  
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  
                  {/* Lists */}
                  <button type="button" onClick={() => insertMarkdown('- ', '', 'list item')} className="p-2 hover:bg-gray-100 rounded transition-colors" title="Unordered List">
                    <List className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => insertMarkdown('1. ', '', 'list item')} className="p-2 hover:bg-gray-100 rounded transition-colors" title="Ordered List">
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={insertTaskList} className="p-2 hover:bg-gray-100 rounded transition-colors" title="Task List">
                    <CheckSquare className="w-4 h-4" />
                  </button>
                  
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  
                  {/* Insert Elements */}
                  <button type="button" onClick={() => insertMarkdown('[', '](url)', 'link text')} className="p-2 hover:bg-gray-100 rounded transition-colors" title="Link">
                    <LinkIcon className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => insertMarkdown('![', '](image-url)', 'alt text')} className="p-2 hover:bg-gray-100 rounded transition-colors" title="Image">
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={insertTable} className="p-2 hover:bg-gray-100 rounded transition-colors" title="Table">
                    <Table className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={insertHorizontalRule} className="p-2 hover:bg-gray-100 rounded transition-colors" title="Horizontal Rule">
                    <Minus className="w-4 h-4" />
                  </button>
                </div>

                {/* Right side - Edit/Preview toggle */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsDescriptionPreview(false)}
                    className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap text-sm ${
                      !isDescriptionPreview 
                        ? 'bg-blue-100 text-blue-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDescriptionPreview(true)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap text-sm ${
                      isDescriptionPreview 
                        ? 'bg-blue-100 text-blue-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </button>
                </div>
              </div>

              {/* Editor or Preview */}
              {!isDescriptionPreview ? (
                <textarea
                  id="task-description-editor"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Provide detailed information about the task... (Markdown supported)"
                  rows={6}
                  className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none font-mono text-sm ${errors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
              ) : (
                <div className="w-full min-h-[150px] max-h-[250px] overflow-y-auto border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <MarkdownRenderer content={formData.description || ''} />
                </div>
              )}
              
              {errors.description && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.description}
                </p>
              )}
            </div>

            {/* Row 6: File Attachments */}
            <div>
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

            {/* Existing Uploaded Files (from note) */}
            {existingFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Existing Attachments ({existingFiles.length})
                </h4>
                <div className="space-y-2">
                  {existingFiles.map((file, index) => (
                    <div
                      key={file.fileId}
                      className="flex items-center justify-between p-3 rounded-lg border bg-blue-50 border-blue-200 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-10 h-10 rounded-lg border border-blue-300 flex items-center justify-center bg-blue-100 flex-shrink-0">
                          <Paperclip className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.fileName}</p>
                          <p className="text-xs text-gray-500">
                            From note • File ID: {file.fileId.substring(0, 12)}...
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          // Remove from existing files
                          setExistingFiles(prev => prev.filter((_, i) => i !== index));
                          setUploadedFileIds(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  These files are already uploaded and attached to this note
                </div>
              </div>
            )}

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
          </div>

        </form>
      </div>

      {/* Sticky Form Actions */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 sm:p-6 z-10 pb-24 sm:pb-6">
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
            disabled={isUploadingAll}
            className="flex-1 sm:flex-none"
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
