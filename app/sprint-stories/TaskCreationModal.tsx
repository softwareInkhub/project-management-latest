'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus,
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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (taskData: any) => Promise<void>;
  storyId: string;
  storyTitle: string;
  users: any[];
  storyData?: {
    sprint_id?: string;
    sprint_name?: string;
    project_id?: string;
    project_name?: string;
  };
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
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export const TaskCreationModal: React.FC<TaskCreationModalProps> = ({
  isOpen,
  onClose,
  onCreateTask,
  storyId,
  storyTitle,
  users,
  storyData
}) => {
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'to_do' as 'to_do' | 'in_progress' | 'completed' | 'overdue',
    assignee: '',
    dueDate: '',
    estimatedHours: 0,
    tags: ''
  });

  const [loading, setLoading] = useState(false);
  const [isDescriptionPreview, setIsDescriptionPreview] = useState(false);
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  const headingDropdownRef = useRef<HTMLDivElement>(null);

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
    const textarea = document.getElementById('task-modal-description-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = taskData.description.substring(start, end);
    const textToInsert = selectedText || placeholder;
    const newText = taskData.description.substring(0, start) + prefix + textToInsert + suffix + taskData.description.substring(end);
    
    setTaskData({ ...taskData, description: newText });
    
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
    const textarea = document.getElementById('task-modal-description-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = taskData.description.lastIndexOf('\n', start - 1) + 1;
    const prefix = '#'.repeat(level) + ' ';
    
    const beforeLine = taskData.description.substring(0, lineStart);
    const afterLine = taskData.description.substring(lineStart);
    const newText = beforeLine + prefix + afterLine;
    
    setTaskData({ ...taskData, description: newText });
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = lineStart + prefix.length;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreateTask({
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        status: taskData.status,
        assignee: taskData.assignee,
        due_date: taskData.dueDate,
        estimated_hours: taskData.estimatedHours,
        tags: taskData.tags || '', // Use tags from form or empty string
        story_id: storyId
      });
      // Reset form
      setTaskData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'to_do',
        assignee: '',
        dueDate: '',
        estimatedHours: 0,
        tags: ''
      });
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/70 bg-opacity-50"
      style={{ backdropFilter: 'blur(2px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-t-2xl lg:rounded-2xl shadow-2xl w-full lg:w-auto lg:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Task</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">For story: {storyTitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 pb-24 sm:pb-6 space-y-5">
          {/* Context Information - Story/Sprint/Project */}
          {storyData && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4 space-y-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Task Context</h4>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
                {storyData.project_name && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 block">Project:</span>
                    <p className="font-medium text-gray-900 dark:text-white mt-1 truncate" title={storyData.project_name}>{storyData.project_name}</p>
                  </div>
                )}
                {storyData.sprint_name && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 block">Sprint:</span>
                    <p className="font-medium text-gray-900 dark:text-white mt-1 truncate" title={storyData.sprint_name}>{storyData.sprint_name}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block">Story:</span>
                  <p className="font-medium text-gray-900 dark:text-white mt-1 truncate" title={storyTitle}>{storyTitle}</p>
                </div>
              </div>
            </div>
          )}

          {/* Task Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={taskData.title}
              onChange={(e) => setTaskData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter task title"
              required
            />
          </div>

          {/* Task Description with Markdown Support */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            
            {/* Markdown Toolbar - Full Version like Notes */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-gray-200 dark:border-gray-600 mb-3">
              {/* Left side - Formatting buttons */}
              <div className="flex items-center space-x-1 flex-wrap">
                {/* Text Formatting */}
                <button type="button" onClick={() => insertMarkdown('**', '**', 'bold text')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Bold">
                  <Bold className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => insertMarkdown('*', '*', 'italic text')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Italic">
                  <Italic className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => insertMarkdown('~~', '~~', 'strikethrough')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Strikethrough">
                  <Strikethrough className="w-4 h-4" />
                </button>
                
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                
                {/* Heading Dropdown */}
                <div className="relative" ref={headingDropdownRef}>
                  <button 
                    type="button"
                    onClick={() => setShowHeadingDropdown(!showHeadingDropdown)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex items-center space-x-1" 
                    title="Heading"
                  >
                    <Heading className="w-4 h-4" />
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showHeadingDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-[120px]">
                      {[1, 2, 3, 4, 5, 6].map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => { insertHeading(level); setShowHeadingDropdown(false); }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                        >
                          <span className={`font-bold`} style={{ fontSize: `${20 - level}px` }}>H{level}</span> Heading {level}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <button type="button" onClick={() => insertMarkdown('> ', '', 'quote')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Blockquote">
                  <Quote className="w-4 h-4" />
                </button>
                
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                
                {/* Code */}
                <button type="button" onClick={() => insertMarkdown('`', '`', 'code')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Inline Code">
                  <Code className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => insertMarkdown('\n```javascript\n', '\n```\n', 'code here')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Code Block">
                  <Code2 className="w-4 h-4" />
                </button>
                
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                
                {/* Lists */}
                <button type="button" onClick={() => insertMarkdown('- ', '', 'list item')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Unordered List">
                  <List className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => insertMarkdown('1. ', '', 'list item')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Ordered List">
                  <ListOrdered className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => insertMarkdown('- [ ] ', '', 'task item')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Task List">
                  <CheckSquare className="w-4 h-4" />
                </button>
                
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                
                {/* Insert Elements */}
                <button type="button" onClick={() => insertMarkdown('[', '](url)', 'link text')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Link">
                  <LinkIcon className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => insertMarkdown('![', '](image-url)', 'alt text')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Image">
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => insertMarkdown('\n| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n', '', '')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Table">
                  <Table className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => insertMarkdown('\n---\n', '', '')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Horizontal Rule">
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
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setIsDescriptionPreview(true)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap text-sm ${
                    isDescriptionPreview 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                id="task-modal-description-editor"
                value={taskData.description}
                onChange={(e) => setTaskData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none font-mono text-sm"
                rows={5}
                placeholder="Describe the task... (Markdown supported)"
              />
            ) : (
              <div className="w-full min-h-[125px] max-h-[200px] overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <MarkdownRenderer content={taskData.description || ''} />
              </div>
            )}
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={taskData.priority}
                onChange={(e) => setTaskData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={taskData.status}
                onChange={(e) => setTaskData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="to_do">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Assignee and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Assign To
              </label>
              <select
                value={taskData.assignee}
                onChange={(e) => setTaskData(prev => ({ ...prev, assignee: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Unassigned</option>
                {users.map((user, index) => (
                  <option key={user.id || `user-${index}`} value={user.id}>
                    {user.name || user.username || user.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={taskData.dueDate}
                onChange={(e) => setTaskData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Estimated Hours */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Estimated Hours
            </label>
            <input
              type="number"
              value={taskData.estimatedHours}
              onChange={(e) => setTaskData(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 0 }))}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              min="0"
              step="0.5"
              placeholder="0"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <input
              type="text"
              value={taskData.tags}
              onChange={(e) => setTaskData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter tags separated by commas (e.g., frontend, bug, urgent)"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Separate multiple tags with commas
            </p>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t rounded-b-2xl border-gray-300 dark:border-gray-700 p-1 sm:p-4 z-10 pb-1 sm:pb-4 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

