'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { Badge } from './Badge';
import { 
  X, 
  Calendar, 
  User, 
  Crown,
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
import { useAuth } from '@/app/hooks/useAuth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export interface Project {
  id: string;
  name: string;
  company: string;
  department?: string;
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

interface DepartmentData {
  id: string;
  name: string;
  companyId: string;
}

interface CompanyData {
  id: string;
  name: string;
}

interface ProjectFormProps {
  project?: Project | null;
  onSubmit: (projectData: Partial<Project>) => void;
  onCancel: () => void;
  isOpen: boolean;
  isCollapsed?: boolean;
  companies?: CompanyData[];
  departments?: DepartmentData[];
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

// Removed dummy team members - will use real data from API

export default function ProjectForm({ project, onSubmit, onCancel, isOpen, isCollapsed = false, companies = [], departments = [] }: ProjectFormProps) {
  const { user } = useAuth(); // Get current user
  
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    company: '',
    department: '',
    status: 'Planning',
    priority: 'Medium',
    startDate: '',
    endDate: '',
    team: [],
    assignee: '',
    description: ''
  });

  // Clear department when company changes
  useEffect(() => {
    if (formData.company) {
      // Check if current department belongs to new company
      const currentDept = departments.find(d => d.name === formData.department);
      if (currentDept && currentDept.companyId !== formData.company) {
        console.log('🔄 Company changed, clearing department');
        setFormData(prev => ({ ...prev, department: '' }));
      }
    }
  }, [formData.company, formData.department, departments]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  // Removed newTeamMember state - no longer needed
  const [formHeight, setFormHeight] = useState<number>(75); // Mobile slide-up height in vh
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  
  // Markdown editor state
  const [isDescriptionPreview, setIsDescriptionPreview] = useState(false);
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  const headingDropdownRef = useRef<HTMLDivElement>(null);
  
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
    const textarea = document.getElementById('project-description-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = (formData.description || '').substring(start, end);
    const textToInsert = selectedText || placeholder;
    const newText = (formData.description || '').substring(0, start) + prefix + textToInsert + suffix + (formData.description || '').substring(end);
    
    handleInputChange('description', newText);
    
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
    const textarea = document.getElementById('project-description-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = (formData.description || '').lastIndexOf('\n', start - 1) + 1;
    const prefix = '#'.repeat(level) + ' ';
    
    const beforeLine = (formData.description || '').substring(0, lineStart);
    const afterLine = (formData.description || '').substring(lineStart);
    const newText = beforeLine + prefix + afterLine;
    
    handleInputChange('description', newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = lineStart + prefix.length;
    }, 0);
  };

  const insertTable = () => {
    const tableTemplate = '\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n';
    const textarea = document.getElementById('project-description-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = (formData.description || '').substring(0, start) + tableTemplate + (formData.description || '').substring(start);
    
    handleInputChange('description', newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + tableTemplate.length;
    }, 0);
  };

  const insertCodeBlock = () => {
    const textarea = document.getElementById('project-description-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = (formData.description || '').substring(start, end);
    const codeBlock = '\n```javascript\n' + (selectedText || 'your code here') + '\n```\n';
    const newText = (formData.description || '').substring(0, start) + codeBlock + (formData.description || '').substring(end);
    
    handleInputChange('description', newText);
    
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
    const textarea = document.getElementById('project-description-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = (formData.description || '').lastIndexOf('\n', start - 1) + 1;
    
    const beforeLine = (formData.description || '').substring(0, lineStart);
    const afterLine = (formData.description || '').substring(lineStart);
    const newText = beforeLine + '> ' + afterLine;
    
    handleInputChange('description', newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = lineStart + 2;
    }, 0);
  };

  const insertHorizontalRule = () => {
    const textarea = document.getElementById('project-description-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const hrText = '\n---\n';
    const newText = (formData.description || '').substring(0, start) + hrText + (formData.description || '').substring(start);
    
    handleInputChange('description', newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + hrText.length;
    }, 0);
  };

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
        className="bg-white rounded-t-2xl lg:rounded-2xl w-screen lg:w-auto max-w-none lg:max-w-3xl shadow-2xl overflow-hidden"
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
              <Select
                value={formData.company || ''}
                onValueChange={(val) => handleInputChange('company', val)}
                onChange={(e) => handleInputChange('company', (e.target as any).value)}
                options={[
                  { value: '', label: 'Select Company' },
                  ...companies.map(company => ({ value: company.name, label: company.name }))
                ]}
                className={errors.company ? 'border-red-500' : ''}
              />
              {errors.company && <p className="text-red-500 text-sm mt-1">{errors.company}</p>}
            </div>
          </div>

          {/* Department (filtered by selected company) */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Department
            </label>
            <Select
              value={formData.department || ''}
              onValueChange={(val) => handleInputChange('department', val)}
              onChange={(e) => handleInputChange('department', (e.target as any).value)}
              options={(() => {
                // Get selected company ID
                const selectedCompany = companies.find(c => c.name === formData.company);
                const companyId = selectedCompany?.id;
                
                // Filter departments by company ID
                const filteredDepts = companyId 
                  ? departments.filter(dept => dept.companyId === companyId)
                  : [];
                
                console.log('🏢 Filtered departments for', formData.company, ':', filteredDepts.length);
                
                return [
                  { value: '', label: 'Select Department' },
                  ...filteredDepts.map(dept => ({ value: dept.name, label: dept.name }))
                ];
              })()}
              disabled={!formData.company}
            />
            {!formData.company && (
              <p className="text-xs text-gray-500 mt-1">Please select a company first</p>
            )}
          </div>

          {/* Auto-assignment info */}
          {/* <div>
            <p className="text-xs text-gray-500">
              Project will be automatically assigned to: <span className="font-semibold">{user?.name || user?.email || 'Current User'}</span>
            </p>
          </div> */}

          {/* Description with Markdown Support */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Description
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
                id="project-description-editor"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter project description (Markdown supported)"
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              />
            ) : (
              <div className="w-full min-h-[150px] max-h-[250px] overflow-y-auto border border-gray-300 rounded-lg p-4 bg-gray-50">
                <MarkdownRenderer content={formData.description || ''} />
              </div>
            )}
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
