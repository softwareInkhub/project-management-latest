'use client';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  MoreVertical, 
  Calendar, 
  Users,
  Clock,
  CheckCircle,
  Circle,
  AlertCircle,
  Flag,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  FolderOpen,
  BarChart3,
  Tag,
  ChevronDown,
  Target,
  TrendingUp,
  Activity,
  Play,
  Pause,
  FileText,
  Grid3x3,
  List,
  CheckSquare,
  FileCode,
  Zap,
  Bold,
  Italic,
  Strikethrough,
  Heading,
  Quote,
  Code,
  Code2,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Table,
  Minus
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatsCard } from '../components/ui/StatsCard';
import { SearchFilterSection } from '../components/ui/SearchFilterSection';
import { ViewToggle } from '../components/ui/ViewToggle';
import { AppLayout } from '../components/AppLayout';
import { AdvancedFilterModal } from '../components/ui/AdvancedFilterModal';
import { useTabs } from '../hooks/useTabs';
import { useAuth } from '../hooks/useAuth';
import { apiService, Story, Project, Sprint, Task } from '../services/api';
import { CreateButton, UpdateButton, DeleteButton, ReadOnlyBadge, usePermissions } from '../components/RoleBasedUI';
import { Avatar } from '../components/ui/Avatar';
import { TaskCreationModal } from '../sprint-stories/TaskCreationModal';

// Advanced Filter Interfaces
interface DateRange {
  from: string;
  to: string;
}

interface AdvancedFilters {
  status: string[];
  project: string[];
  sprint: string[];
  priority: string[];
  storyPointsRange: { min: number; max: number };
  additionalFilters: string[];
}

// Helper functions
const statusConfig = {
  'backlog': { label: 'Backlog', color: 'default', icon: Circle },
  'in_progress': { label: 'In Progress', color: 'info', icon: Play },
  'review': { label: 'Review', color: 'warning', icon: Eye },
  'done': { label: 'Done', color: 'success', icon: CheckCircle }
};

const priorityConfig = {
  'low': { label: 'Low', color: 'default', icon: Flag },
  'medium': { label: 'Medium', color: 'warning', icon: Flag },
  'high': { label: 'High', color: 'error', icon: Flag }
};

const getStatusConfig = (status: string) => {
  return statusConfig[status as keyof typeof statusConfig] || {
    label: status || 'Unknown',
    color: 'default',
    icon: Circle
  };
};

const getPriorityConfig = (priority: string) => {
  return priorityConfig[priority as keyof typeof priorityConfig] || {
    label: priority || 'Unknown',
    color: 'default',
    icon: Flag
  };
};

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

const StoryPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [sprintFilter, setSprintFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [activePredefinedFilter, setActivePredefinedFilter] = useState('all');
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, string | string[]>>({});
  
  // Advanced Filter State
  const [advancedFilterState, setAdvancedFilterState] = useState<AdvancedFilters>({
    status: [],
    project: [],
    sprint: [],
    priority: [],
    storyPointsRange: { min: 0, max: 100 },
    additionalFilters: []
  });
  const [isAdvancedFilterModalOpen, setIsAdvancedFilterModalOpen] = useState(false);
  const [visibleFilterColumns, setVisibleFilterColumns] = useState<string[]>([
    'status', 'project', 'sprint'
  ]);

  // Quick Filter State
  const [quickFilterValues, setQuickFilterValues] = useState<Record<string, string | string[] | { from: string; to: string }>>({
    status: [],
    project: [],
    sprint: [],
    priority: [],
    additionalFilters: []
  });

  // Available filter columns
  const availableFilterColumns = [
    { key: 'status', label: 'Story Status', icon: <CheckCircle className="w-4 h-4 text-blue-500" /> },
    { key: 'project', label: 'Project', icon: <FolderOpen className="w-4 h-4 text-orange-500" /> },
    { key: 'sprint', label: 'Sprint', icon: <Activity className="w-4 h-4 text-purple-500" /> },
    { key: 'priority', label: 'Priority', icon: <Flag className="w-4 h-4 text-red-500" /> },
    { key: 'additionalFilters', label: 'Additional Filters', icon: <Filter className="w-4 h-4 text-green-500" /> }
  ];

  // Handler for quick filter changes
  const handleQuickFilterChange = (key: string, value: string | string[] | { from: string; to: string }) => {
    setQuickFilterValues(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const [isStoryFormOpen, setIsStoryFormOpen] = useState(false);
  const [isFormAnimating, setIsFormAnimating] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isStoryPreviewOpen, setIsStoryPreviewOpen] = useState(false);
  const [isPreviewAnimating, setIsPreviewAnimating] = useState(false);
  const [isJsonViewActive, setIsJsonViewActive] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openMenuStoryId, setOpenMenuStoryId] = useState<string | null>(null);
  const storyPreviewRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Task management state
  const [existingTasks, setExistingTasks] = useState<any[]>([]);
  const [selectedExistingTask, setSelectedExistingTask] = useState('');
  const [showTaskCreationModal, setShowTaskCreationModal] = useState(false);
  const [selectedStoryForTask, setSelectedStoryForTask] = useState<{ id: string; title: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    acceptance_criteria: [''],
    story_points: 0,
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'backlog' as 'backlog' | 'in_progress' | 'review' | 'done',
    sprint_id: '',
    project_id: '',
    assigned_to: '',
    tags: [] as string[],
    tasks: [] as Array<{
      task_id: string;
      title: string;
      status: string;
      assigned_to?: string;
    }>,
    created_by: user?.email || user?.username || 'unknown'
  });

  // Markdown editor state
  const [isDescriptionPreview, setIsDescriptionPreview] = useState(false);
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  const headingDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchStories();
    fetchProjects();
    fetchSprints();
    fetchTasks();
    fetchUsers();
  }, []);

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
    const textarea = document.getElementById('story-description-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.description.substring(start, end);
    const textToInsert = selectedText || placeholder;
    const newText = formData.description.substring(0, start) + prefix + textToInsert + suffix + formData.description.substring(end);
    
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
    const textarea = document.getElementById('story-description-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = formData.description.lastIndexOf('\n', start - 1) + 1;
    const prefix = '#'.repeat(level) + ' ';
    
    const beforeLine = formData.description.substring(0, lineStart);
    const afterLine = formData.description.substring(lineStart);
    const newText = beforeLine + prefix + afterLine;
    
    setFormData({ ...formData, description: newText });
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = lineStart + prefix.length;
    }, 0);
  };

  const insertTable = () => {
    const tableTemplate = '\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n';
    const textarea = document.getElementById('story-description-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = formData.description.substring(0, start) + tableTemplate + formData.description.substring(start);
    
    setFormData({ ...formData, description: newText });
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + tableTemplate.length;
    }, 0);
  };

  const insertCodeBlock = () => {
    const textarea = document.getElementById('story-description-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.description.substring(start, end);
    const codeBlock = '\n```javascript\n' + (selectedText || 'your code here') + '\n```\n';
    const newText = formData.description.substring(0, start) + codeBlock + formData.description.substring(end);
    
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
    const textarea = document.getElementById('story-description-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = formData.description.lastIndexOf('\n', start - 1) + 1;
    
    const beforeLine = formData.description.substring(0, lineStart);
    const afterLine = formData.description.substring(lineStart);
    const newText = beforeLine + '> ' + afterLine;
    
    setFormData({ ...formData, description: newText });
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = lineStart + 2;
    }, 0);
  };

  const insertHorizontalRule = () => {
    const textarea = document.getElementById('story-description-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const hrText = '\n---\n';
    const newText = formData.description.substring(0, start) + hrText + formData.description.substring(start);
    
    setFormData({ ...formData, description: newText });
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + hrText.length;
    }, 0);
  };

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await apiService.getStories();
      if (response.success && response.data) {
        setStories(response.data);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await apiService.getProjects();
      if (response.success && response.data) {
        setProjects(response.data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchSprints = async () => {
    try {
      const response = await apiService.getSprints();
      if (response.success && response.data) {
        setSprints(response.data);
      }
    } catch (error) {
      console.error('Error fetching sprints:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await apiService.getTasks();
      if (response.success && response.data) {
        setExistingTasks(response.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiService.getUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenMenuStoryId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered stories
  const filteredStories = useMemo(() => {
    let filtered = [...stories];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(story =>
        story.title?.toLowerCase().includes(searchLower) ||
        story.description?.toLowerCase().includes(searchLower) ||
        story.story_id?.toLowerCase().includes(searchLower)
      );
    }

    // Quick filters
    const statusFilter = Array.isArray(quickFilterValues.status) ? quickFilterValues.status : [];
    const projectFilter = Array.isArray(quickFilterValues.project) ? quickFilterValues.project : [];
    const sprintFilter = Array.isArray(quickFilterValues.sprint) ? quickFilterValues.sprint : [];
    const priorityFilter = Array.isArray(quickFilterValues.priority) ? quickFilterValues.priority : [];
    const additionalFiltersArray = Array.isArray(quickFilterValues.additionalFilters) ? quickFilterValues.additionalFilters : [];

    // Status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(story => statusFilter.includes(story.status));
    }

    // Project filter
    if (projectFilter.length > 0) {
      filtered = filtered.filter(story => projectFilter.includes(story.project_id));
    }

    // Sprint filter
    if (sprintFilter.length > 0) {
      filtered = filtered.filter(story => sprintFilter.includes(story.sprint_id));
    }

    // Priority filter
    if (priorityFilter.length > 0) {
      filtered = filtered.filter(story => priorityFilter.includes(story.priority));
    }

    // Additional filters
    if (additionalFiltersArray.includes('high_points')) {
      filtered = filtered.filter(story => story.story_points >= 8);
    }
    if (additionalFiltersArray.includes('low_points')) {
      filtered = filtered.filter(story => story.story_points <= 3);
    }
    if (additionalFiltersArray.includes('has_acceptance_criteria')) {
      filtered = filtered.filter(story => story.acceptance_criteria && story.acceptance_criteria.length > 0);
    }
    if (additionalFiltersArray.includes('no_acceptance_criteria')) {
      filtered = filtered.filter(story => !story.acceptance_criteria || story.acceptance_criteria.length === 0);
    }

    return filtered;
  }, [stories, searchTerm, quickFilterValues]);

  // Quick filters configuration
  const quickFilters = [
    {
      key: 'status',
      label: 'Status',
      icon: <CheckCircle className="w-4 h-4" />,
      options: [
        { value: 'all', label: 'All Stories', count: stories.length },
        { value: 'backlog', label: 'Backlog', count: stories.filter(s => s.status === 'backlog').length },
        { value: 'in_progress', label: 'In Progress', count: stories.filter(s => s.status === 'in_progress').length },
        { value: 'review', label: 'Review', count: stories.filter(s => s.status === 'review').length },
        { value: 'done', label: 'Done', count: stories.filter(s => s.status === 'done').length }
      ],
      type: 'default' as const,
      multiple: true
    },
    {
      key: 'project',
      label: 'Project',
      icon: <FolderOpen className="w-4 h-4" />,
      options: [
        { value: 'all', label: 'All Projects', count: stories.length },
        ...projects.map(project => ({
          value: project.id,
          label: project.name,
          count: stories.filter(s => s.project_id === project.id).length
        }))
      ],
      type: 'default' as const,
      multiple: true
    },
    {
      key: 'sprint',
      label: 'Sprint',
      icon: <Activity className="w-4 h-4" />,
      options: [
        { value: 'all', label: 'All Sprints', count: stories.length },
        ...sprints.map(sprint => ({
          value: sprint.id,
          label: sprint.name,
          count: stories.filter(s => s.sprint_id === sprint.id).length
        }))
      ],
      type: 'default' as const,
      multiple: true
    },
    {
      key: 'priority',
      label: 'Priority',
      icon: <Flag className="w-4 h-4" />,
      options: [
        { value: 'all', label: 'All Priorities', count: stories.length },
        { value: 'low', label: 'Low', count: stories.filter(s => s.priority === 'low').length },
        { value: 'medium', label: 'Medium', count: stories.filter(s => s.priority === 'medium').length },
        { value: 'high', label: 'High', count: stories.filter(s => s.priority === 'high').length }
      ],
      type: 'default' as const,
      multiple: true
    },
    {
      key: 'additionalFilters',
      label: 'Additional Filters',
      icon: <Filter className="w-4 h-4" />,
      options: [
        { value: 'high_points', label: 'High Story Points (≥8)', count: stories.filter(s => s.story_points >= 8).length },
        { value: 'low_points', label: 'Low Story Points (≤3)', count: stories.filter(s => s.story_points <= 3).length },
        { value: 'has_acceptance_criteria', label: 'Has Acceptance Criteria', count: stories.filter(s => s.acceptance_criteria && s.acceptance_criteria.length > 0).length },
        { value: 'no_acceptance_criteria', label: 'No Acceptance Criteria', count: stories.filter(s => !s.acceptance_criteria || s.acceptance_criteria.length === 0).length }
      ],
      type: 'default' as const,
      multiple: true
    }
  ];

  // Story form handlers
  const openStoryForm = (story?: Story) => {
    if (story) {
      setSelectedStory(story);
      setFormData({
        title: story.title || '',
        description: story.description || '',
        acceptance_criteria: story.acceptance_criteria || [''],
        story_points: story.story_points || 0,
        priority: story.priority || 'medium',
        status: story.status || 'backlog',
        sprint_id: story.sprint_id || '',
        project_id: story.project_id || '',
        assigned_to: story.assigned_to || '',
        tags: story.tags || [],
        tasks: story.tasks || [],
        created_by: story.created_by || user?.email || user?.username || 'unknown'
      });
    } else {
      setSelectedStory(null);
      setFormData({
        title: '',
        description: '',
        acceptance_criteria: [''],
        story_points: 0,
        priority: 'medium',
        status: 'backlog',
        sprint_id: '',
        project_id: '',
        assigned_to: '',
        tags: [],
        tasks: [],
        created_by: user?.email || user?.username || 'unknown'
      });
    }
    setIsStoryFormOpen(true);
    setIsFormAnimating(false);
    setSelectedExistingTask('');
  };

  const closeStoryForm = () => {
    setIsFormAnimating(true);
    setTimeout(() => {
      setIsStoryFormOpen(false);
      setIsFormAnimating(false);
      setSelectedStory(null);
    }, 300);
  };

  const handleStorySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Filter out empty acceptance criteria
    const cleanedAcceptanceCriteria = formData.acceptance_criteria.filter(ac => ac.trim() !== '');
    
    try {
      setLoading(true);
      
      const storyData = {
        ...formData,
        acceptance_criteria: cleanedAcceptanceCriteria,
        tasks: formData.tasks
      };

      if (selectedStory) {
        // Update story
        const response = await apiService.updateStory(selectedStory.id, storyData);
        if (response.success) {
          await fetchStories();
          closeStoryForm();
        }
      } else {
        // Create story
        const response = await apiService.createStory(storyData);
        if (response.success) {
          await fetchStories();
          closeStoryForm();
        }
      }
    } catch (error) {
      console.error('Error saving story:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return;
    
    try {
      setLoading(true);
      const response = await apiService.deleteStory(storyId);
      if (response.success) {
        await fetchStories();
        setOpenMenuStoryId(null);
      }
    } catch (error) {
      console.error('Error deleting story:', error);
    } finally {
      setLoading(false);
    }
  };

  // Story preview handlers
  const openStoryPreview = (story: Story) => {
    setSelectedStory(story);
    setIsStoryPreviewOpen(true);
    setIsPreviewAnimating(false);
    setIsJsonViewActive(false);
  };

  const closeStoryPreview = () => {
    setIsPreviewAnimating(true);
    setTimeout(() => {
      setIsStoryPreviewOpen(false);
      setIsPreviewAnimating(false);
      setSelectedStory(null);
      setIsJsonViewActive(false);
    }, 300);
  };

  // Add acceptance criteria
  const addAcceptanceCriteria = () => {
    setFormData(prev => ({
      ...prev,
      acceptance_criteria: [...prev.acceptance_criteria, '']
    }));
  };

  // Remove acceptance criteria
  const removeAcceptanceCriteria = (index: number) => {
    setFormData(prev => ({
      ...prev,
      acceptance_criteria: prev.acceptance_criteria.filter((_, i) => i !== index)
    }));
  };

  // Update acceptance criteria
  const updateAcceptanceCriteria = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      acceptance_criteria: prev.acceptance_criteria.map((ac, i) => i === index ? value : ac)
    }));
  };

  // Task management functions
  const addExistingTaskToStory = () => {
    if (!selectedExistingTask) return;
    
    const existingTask = existingTasks.find(task => task.id === selectedExistingTask);
    if (!existingTask) return;
    
    // Check if task is already added to avoid duplicates
    const isAlreadyAdded = formData.tasks.some(task => task.task_id === existingTask.id);
    if (isAlreadyAdded) {
      alert('This task is already added to the story');
      return;
    }
    
    const newTask = {
      task_id: existingTask.id,
      title: existingTask.title,
      status: existingTask.status.toLowerCase().replace(' ', '_'),
      assigned_to: existingTask.assignee || user?.email || user?.username || ''
    };
    
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
    
    // Reset selection
    setSelectedExistingTask('');
  };

  const removeTaskFromStory = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.task_id !== taskId)
    }));
  };

  // Task creation for story
  const openTaskCreationModal = (storyId: string, storyTitle: string) => {
    // Find the story to get complete context
    const story = stories.find(s => s.id === storyId);
    if (story) {
      setSelectedStoryForTask({ 
        id: storyId, 
        title: storyTitle,
        sprint_id: story.sprint_id,
        sprint_name: getSprintName(story.sprint_id),
        project_id: story.project_id,
        project_name: getProjectName(story.project_id)
      } as any);
    } else {
      setSelectedStoryForTask({ id: storyId, title: storyTitle });
    }
    setShowTaskCreationModal(true);
  };

  const handleCreateTaskForStory = async (taskData: any) => {
    try {
      // Get the story to extract sprint_id and project_id
      const story = stories.find(s => s.id === taskData.story_id);
      if (!story) {
        alert('Story not found');
        return;
      }

      // Create the task with full relationship data
      const result = await apiService.createTask({
        ...taskData,
        project: story.project_id,    // From story
        sprint_id: story.sprint_id,   // From story
        story_id: story.id            // The story itself
      });
      
      if (result.success && result.data) {
        const newTask = result.data;
        
        // Update the story's tasks array
        const updatedTasks = [
          ...(story.tasks || []),
          {
            task_id: newTask.id,
            title: newTask.title,
            status: newTask.status,
            assigned_to: newTask.assignee
          }
        ];
        
        // Update the story (only update tasks field)
        const updateResult = await apiService.updateStory(story.id, {
          tasks: updatedTasks
        });
        
        if (updateResult.success) {
          // Reload tasks
          await fetchTasks();
          // Reload stories to get updated task associations
          await fetchStories();
          setShowTaskCreationModal(false);
          setSelectedStoryForTask(null);
        }
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const getSprintName = (sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    return sprint?.name || 'No Sprint';
  };

  return (
    <AppLayout>
      <style jsx global>{`
        .tooltip-wrapper {
          position: relative;
          display: inline-flex;
        }
        .tooltip-content {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 4px;
          padding: 4px 8px;
          background-color: #1f2937;
          color: white;
          font-size: 11px;
          border-radius: 4px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.1s ease-in-out;
          z-index: 9999;
        }
        .tooltip-wrapper:hover .tooltip-content {
          opacity: 1;
        }
        .tooltip-content::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 4px solid transparent;
          border-top-color: #1f2937;
        }
      `}</style>
      <div className="w-full h-full px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-4 overflow-x-hidden">
        
        {/* Search & Filter Section */}
        <SearchFilterSection
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search stories..."
          filters={[]}
          variant="modern"
          showActiveFilters={true}
          hideFilterIcon={true}
          availableFilterColumns={availableFilterColumns}
          visibleFilterColumns={visibleFilterColumns}
          onFilterColumnsChange={setVisibleFilterColumns}
          quickFilters={quickFilters}
          quickFilterValues={quickFilterValues}
          onQuickFilterChange={handleQuickFilterChange}
          viewToggle={{
            currentView: viewMode,
            views: [
              { value: 'card', label: 'Card', icon: <Grid3x3 className="w-4 h-4" /> },
              { value: 'list', label: 'List', icon: <List className="w-4 h-4" /> }
            ],
            onChange: (view: string) => setViewMode(view as 'list' | 'card')
          }}
          actionButton={{
            label: 'New Story',
            onClick: () => openStoryForm()
          }}
        />

        {/* Stories Content */}
        <div className="min-h-[400px]">
          {loading && stories.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No stories found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm ? 'Try adjusting your search or filters' : 'Get started by creating your first story'}
              </p>
              <CreateButton resource="projects">
                <Button onClick={() => openStoryForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Story
                </Button>
              </CreateButton>
            </div>
          ) : viewMode === 'list' ? (
            /* List View - Sprint Style */
            <div className="pt-0 sm:pt-3 md:pt-0 space-y-3 pb-4">
              {filteredStories.map(story => {
                const statusCfg = getStatusConfig(story.status);
                const StatusIcon = statusCfg.icon;
                const priorityCfg = getPriorityConfig(story.priority);
                const tasksCount = story.tasks ? story.tasks.length : 0;

                return (
                  <div 
                    key={story.id} 
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                    onClick={() => openStoryPreview(story)}
                  >
                    <div className="p-3 sm:p-4">
                      {/* Top Row - Avatar, Title, Actions */}
                      <div className="flex items-start justify-between gap-3 mb-0">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0 shadow-md">
                            {story.title?.charAt(0).toUpperCase() || 'S'}
                          </div>
                          
                          {/* Story Title + Desktop Meta Details */}
                          <div className="flex-1 min-w-0 pt-1">
                            <div className="flex items-center gap-9">
                              {/* Title - Mobile full width, Desktop shrinks */}
                              <div className="tooltip-wrapper sm:flex-shrink-0">
                                <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                                  {story.title || 'Untitled Story'}
                                </div>
                                <div className="tooltip-content">Story: {story.title || 'Untitled Story'}</div>
                              </div>

                              {/* Desktop Meta Details - Right side of title */}
                              <div className="hidden sm:flex flex-wrap items-center gap-x-2 gap-y-1 text-xs flex-1">
                                {/* Status */}
                                <div className="tooltip-wrapper">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-800 dark:text-gray-200 font-semibold">Status:</span>
                                    <Badge 
                                      variant={statusCfg.color as any} 
                                      size="sm" 
                                      className="px-2.5 py-1"
                                    >
                                      {statusCfg.label}
                                    </Badge>
                                  </div>
                                  <div className="tooltip-content">Current Status: {statusCfg.label}</div>
                                </div>

                                {/* Project */}
                                <div className="tooltip-wrapper">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-800 dark:text-gray-200 font-semibold">Project:</span>
                                    <span className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">
                                      {getProjectName(story.project_id)}
                                    </span>
                                  </div>
                                  <div className="tooltip-content">Project: {getProjectName(story.project_id)}</div>
                                </div>

                                {/* Priority */}
                                <div className="tooltip-wrapper">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-800 dark:text-gray-200 font-semibold">Priority:</span>
                                    <Badge variant={priorityCfg.color as any} size="sm" className="px-2.5 py-1">
                                      {priorityCfg.label}
                                    </Badge>
                                  </div>
                                  <div className="tooltip-content">Priority: {priorityCfg.label}</div>
                                </div>

                                {/* Tasks Count */}
                                {tasksCount > 0 && (
                                  <div className="tooltip-wrapper">
                                    <div className="flex items-center gap-1">
                                      <CheckSquare className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                      <span className="text-gray-700 dark:text-gray-300 font-medium">{tasksCount}</span>
                                    </div>
                                    <div className="tooltip-content">Tasks: {tasksCount}</div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Description - Mobile Only */}
                            <div className="sm:hidden mt-1 text-xs text-gray-600 dark:text-gray-400">
                              {story.description || 'No description'}
                            </div>
                          </div>
                        </div>

                        {/* Actions Menu Button */}
                        <div className="relative flex-shrink-0" ref={openMenuStoryId === story.id ? dropdownRef : null}>
                          <button 
                            className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="More options"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setOpenMenuStoryId(openMenuStoryId === story.id ? null : story.id); 
                            }}
                          >
                            <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
                          </button>
                          {openMenuStoryId === story.id && (
                            <div 
                              className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button 
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg flex items-center gap-2 text-sm font-normal text-gray-800 dark:text-gray-200" 
                                onClick={(e) => {e.stopPropagation(); openStoryPreview(story); setOpenMenuStoryId(null);}}
                              >
                                <Eye className="w-4 h-4" />
                                <span>View</span>
                              </button>
                              <UpdateButton
                                resource="projects"
                                onClick={(e) => {e?.stopPropagation(); openStoryForm(story); setOpenMenuStoryId(null);}}
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm font-normal text-gray-800 dark:text-gray-200"
                              >
                                <Edit className="w-4 h-4" />
                                <span>Edit</span>
                              </UpdateButton>
                              <CreateButton resource="tasks">
                                <button
                                  onClick={(e) => {e.stopPropagation(); openTaskCreationModal(story.id, story.title); setOpenMenuStoryId(null);}}
                                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm font-normal text-green-600 dark:text-green-400"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>Add Task</span>
                                </button>
                              </CreateButton>
                              <DeleteButton
                                resource="projects"
                                onClick={(e) => {e?.stopPropagation(); handleDeleteStory(story.id); setOpenMenuStoryId(null);}}
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-b-lg flex items-center gap-2 text-sm font-normal text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </DeleteButton>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* All Meta Details - Mobile Only */}
                      <div className="sm:hidden mt-2 space-y-1 text-xs ml-[52px]">
                        {/* Line 1: Project, Status */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Project */}
                          <div className="flex items-center gap-1">
                            <span className="text-gray-800 dark:text-gray-200 font-semibold">Project:</span>
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md">
                              {getProjectName(story.project_id)}
                            </span>
                          </div>
                          
                          {/* Status */}
                          <div className="flex items-center gap-1">
                            <span className="text-gray-800 dark:text-gray-200 font-semibold">Status:</span>
                            <Badge variant={statusCfg.color as any} size="sm">
                              {statusCfg.label}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Line 2: Priority, Tasks, Story Points */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Priority */}
                          <div className="flex items-center gap-1">
                            <span className="text-gray-800 dark:text-gray-200 font-semibold">Priority:</span>
                            <Badge variant={priorityCfg.color as any} size="sm">
                              {priorityCfg.label}
                            </Badge>
                          </div>
                          
                          {/* Tasks Count */}
                          {tasksCount > 0 && (
                            <div className="flex items-center gap-1">
                              <CheckSquare className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                              <span className="text-gray-700 dark:text-gray-300">{tasksCount}</span>
                            </div>
                          )}
                          
                          {/* Story Points */}
                          <div className="flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-yellow-500" />
                            <span className="text-gray-700 dark:text-gray-300">{story.story_points} pts</span>
                          </div>
                        </div>
                      </div>

                      {/* Sprint and Story Points Row - Desktop - Combined in single line */}
                      <div className="hidden sm:flex items-center gap-3 ml-[60px] text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5" />
                          <span>{getSprintName(story.sprint_id)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-yellow-500" />
                          <span>{story.story_points} pts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Card View - Sprint Style */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-4">
              {filteredStories.map(story => {
                const statusCfg = getStatusConfig(story.status);
                const StatusIcon = statusCfg.icon;
                const priorityCfg = getPriorityConfig(story.priority);
                const tasksCount = story.tasks ? story.tasks.length : 0;

                return (
                  <div
                    key={story.id}
                    className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg w-full"
                    style={{
                      minHeight: '140px',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                    }}
                    onClick={() => openStoryPreview(story)}
                  >
                    <div className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                      {/* Header: Avatar + Title + Menu */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div 
                            className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                            title={`Story: ${story.title || 'No Name'}`}
                          >
                            {(story.title || 'S').charAt(0).toUpperCase()}
                          </div>
                          <h4 
                            className="font-medium text-gray-900 dark:text-white text-sm leading-tight truncate flex-1"
                            title={`Story: ${story.title || 'Untitled Story'}`}
                          >
                            {story.title || 'Untitled Story'}
                          </h4>
                        </div>
                        <div className="relative flex-shrink-0" ref={openMenuStoryId === story.id ? dropdownRef : null}>
                          <button 
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="More options"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setOpenMenuStoryId(openMenuStoryId === story.id ? null : story.id); 
                            }}
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </button>
                          {openMenuStoryId === story.id && (
                            <div 
                              className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button 
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg flex items-center gap-2 text-sm font-normal text-gray-800 dark:text-gray-200" 
                                onClick={(e) => {e.stopPropagation(); openStoryPreview(story); setOpenMenuStoryId(null);}}
                              >
                                <Eye className="w-4 h-4" />
                                <span>View</span>
                              </button>
                              <UpdateButton
                                resource="projects"
                                onClick={(e) => {e?.stopPropagation(); openStoryForm(story); setOpenMenuStoryId(null);}}
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm font-normal text-gray-800 dark:text-gray-200"
                              >
                                <Edit className="w-4 h-4" />
                                <span>Edit</span>
                              </UpdateButton>
                              <CreateButton resource="tasks">
                                <button
                                  onClick={(e) => {e.stopPropagation(); openTaskCreationModal(story.id, story.title); setOpenMenuStoryId(null);}}
                                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm font-normal text-green-600 dark:text-green-400"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>Add Task</span>
                                </button>
                              </CreateButton>
                              <DeleteButton
                                resource="projects"
                                onClick={(e) => {e?.stopPropagation(); handleDeleteStory(story.id); setOpenMenuStoryId(null);}}
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-b-lg flex items-center gap-2 text-sm font-normal text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </DeleteButton>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Project */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-800 dark:text-gray-200 font-semibold sm:hidden">Project:</span>
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-xs truncate">
                          {getProjectName(story.project_id)}
                        </span>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-100 dark:border-gray-700"></div>

                      {/* Status and Priority Row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="tooltip-wrapper">
                          <div className="flex items-center gap-1.5">
                            <span className="hidden sm:inline text-xs text-gray-800 dark:text-gray-200 font-semibold">Status:</span>
                            <Badge variant={statusCfg.color as any} size="sm" className="text-xs">
                              {statusCfg.label}
                            </Badge>
                          </div>
                          <div className="tooltip-content">Current Status: {statusCfg.label}</div>
                        </div>
                        <div className="tooltip-wrapper">
                          <div className="flex items-center gap-1.5">
                            <span className="hidden sm:inline text-xs text-gray-800 dark:text-gray-200 font-semibold">Priority:</span>
                            <Badge variant={priorityCfg.color as any} size="sm" className="text-xs">
                              {priorityCfg.label}
                            </Badge>
                          </div>
                          <div className="tooltip-content">Priority: {priorityCfg.label}</div>
                        </div>
                      </div>

                      {/* Bottom Meta Info */}
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          {/* Story Points */}
                          <div className="tooltip-wrapper">
                            <div className="flex items-center gap-1">
                              <Zap className="w-3.5 h-3.5 text-yellow-500" />
                              <span>{story.story_points || 0}</span>
                            </div>
                            <div className="tooltip-content">Story Points: {story.story_points || 0}</div>
                          </div>
                          
                          {/* Tasks - Desktop only */}
                          {tasksCount > 0 && (
                            <div className="tooltip-wrapper !hidden sm:!inline-flex">
                              <div className="flex items-center gap-1">
                                <CheckSquare className="w-3.5 h-3.5" />
                                <span>{tasksCount}</span>
                              </div>
                              <div className="tooltip-content">Tasks: {tasksCount}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Action Button - Mobile Only */}
        <CreateButton resource="projects">
          <button
            onClick={() => openStoryForm()}
            className="lg:hidden fixed bottom-20 right-6 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg flex items-center justify-center text-white transition-all hover:scale-110"
            aria-label="Create new story"
          >
            <Plus className="w-6 h-6" />
          </button>
        </CreateButton>
      </div>

      {/* Story Preview Modal */}
      {isStoryPreviewOpen && selectedStory && (
        <div 
          className={`fixed inset-0 z-50 flex items-end lg:items-center justify-center transition-opacity duration-300 ${
            isPreviewAnimating ? 'bg-opacity-0' : 'bg-black/70 bg-opacity-50'
          }`} 
          style={{ backdropFilter: 'blur(2px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeStoryPreview();
            }
          }}
        >
          <div 
            ref={storyPreviewRef}
            className={`transform transition-all duration-300 ease-out w-full lg:w-auto lg:max-w-2xl ${
              isPreviewAnimating ? 'translate-y-full lg:translate-y-0 lg:scale-95' : 'translate-y-0 lg:scale-100'
            }`}
            style={{ 
              width: '100%',
              maxHeight: '85vh',
              boxShadow: '0 -10px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-t-2xl lg:rounded-2xl shadow-2xl overflow-y-auto scrollbar-hide"
              style={{ maxHeight: '85vh' }}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                      {selectedStory.title}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Story Details</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant={isJsonViewActive ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setIsJsonViewActive(!isJsonViewActive)}
                    className="flex items-center space-x-2 text-xs sm:text-sm px-3 py-2"
                    title="Toggle JSON View"
                  >
                    <FileCode className="w-4 h-4" />
                    <span>JSON View</span>
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 pb-24 lg:pb-6 space-y-6">
                {isJsonViewActive ? (
                  <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-[60vh] scrollbar-hide text-xs">
                    {JSON.stringify(selectedStory, null, 2)}
                  </pre>
                ) : (
                  <>
                    {/* Description */}
                    {selectedStory.description && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Description
                        </label>
                        <div className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <MarkdownRenderer content={selectedStory.description} />
                        </div>
                      </div>
                    )}

                    {/* Project, Status, Priority */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Project
                        </label>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white truncate">
                            {getProjectName(selectedStory.project_id)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Status
                        </label>
                        <Badge variant={getStatusConfig(selectedStory.status).color as any} size="sm">
                          {getStatusConfig(selectedStory.status).label}
                        </Badge>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Priority
                        </label>
                        <Badge variant={getPriorityConfig(selectedStory.priority).color as any} size="sm">
                          {getPriorityConfig(selectedStory.priority).label}
                        </Badge>
                      </div>
                    </div>

                    {/* Sprint & Story Points */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Sprint
                        </label>
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {getSprintName(selectedStory.sprint_id)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Story Points
                        </label>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {selectedStory.story_points}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Acceptance Criteria */}
                    {selectedStory.acceptance_criteria && selectedStory.acceptance_criteria.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Acceptance Criteria
                        </label>
                        <ul className="space-y-2">
                          {selectedStory.acceptance_criteria.map((criteria, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">{criteria}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Tags */}
                    {selectedStory.tags && selectedStory.tags.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {selectedStory.tags.map((tag, index) => (
                            <Badge key={index} variant="default" size="sm">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tasks */}
                    {selectedStory.tasks && selectedStory.tasks.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tasks ({selectedStory.tasks.length})
                        </label>
                        <div className="space-y-2">
                          {selectedStory.tasks.map((task, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <CheckSquare className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900 dark:text-white">{task.title}</span>
                              <Badge variant="default" size="sm" className="ml-auto">
                                {task.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Story Form Modal */}
      {isStoryFormOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/70 bg-opacity-50"
          style={{ backdropFilter: 'blur(2px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeStoryForm();
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl lg:rounded-2xl w-full lg:max-w-3xl max-h-[90vh] lg:max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedStory ? 'Edit Story' : 'Create Story'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedStory ? 'Update story details' : 'Add a new user story'}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-hide">
              <form onSubmit={handleStorySubmit} className="space-y-4">
                {/* Row 1: Title, Status, Priority */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Story Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="backlog">Backlog</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Project, Sprint, Story Points */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project *
                    </label>
                    <select
                      value={formData.project_id}
                      onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Select Project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sprint
                    </label>
                    <select
                      value={formData.sprint_id}
                      onChange={(e) => setFormData({ ...formData, sprint_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">No Sprint</option>
                      {sprints.map(sprint => (
                        <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Story Points
                    </label>
                    <input
                      type="number"
                      value={formData.story_points}
                      onChange={(e) => setFormData({ ...formData, story_points: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      min="0"
                    />
                  </div>
                </div>

                {/* Row 3: Description with Markdown Support */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  
                  {/* Markdown Toolbar */}
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
                      
                      <button type="button" onClick={insertBlockquote} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Blockquote">
                        <Quote className="w-4 h-4" />
                      </button>
                      
                      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                      
                      {/* Code */}
                      <button type="button" onClick={() => insertMarkdown('`', '`', 'code')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Inline Code">
                        <Code className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={insertCodeBlock} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Code Block">
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
                      <button type="button" onClick={insertTaskList} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Task List">
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
                      <button type="button" onClick={insertTable} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Table">
                        <Table className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={insertHorizontalRule} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Horizontal Rule">
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
                      id="story-description-editor"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                      rows={5}
                      placeholder="Describe the user story... (Markdown supported)"
                    />
                  ) : (
                    <div className="w-full min-h-[120px] max-h-[200px] overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                      <MarkdownRenderer content={formData.description || ''} />
                    </div>
                  )}
                </div>

                {/* Row 4: Acceptance Criteria */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Acceptance Criteria
                    </label>
                    <button
                      type="button"
                      onClick={addAcceptanceCriteria}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Criteria
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.acceptance_criteria.map((criteria, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={criteria}
                          onChange={(e) => updateAcceptanceCriteria(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                          placeholder={`Acceptance criteria ${index + 1}`}
                        />
                        {formData.acceptance_criteria.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAcceptanceCriteria(index)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Row 5: Tasks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Tasks
                  </label>
                  
                  {/* Add Existing Task */}
                  <div className="mb-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg w-full">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Add Existing Task</h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select
                        value={selectedExistingTask}
                        onChange={(e) => setSelectedExistingTask(e.target.value)}
                        className="flex-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white text-sm overflow-hidden"
                      >
                        <option value="">Select an existing task</option>
                        {existingTasks
                          .filter(task => !formData.tasks.some(st => st.task_id === task.id))
                          .map((task, index) => {
                            // Truncate title if too long for mobile
                            const displayTitle = task.title.length > 30 ? task.title.substring(0, 30) + '...' : task.title;
                            return (
                              <option key={task.id || `existing-task-${index}`} value={task.id}>
                                {displayTitle} - {task.status}
                              </option>
                            );
                          })}
                      </select>
                      <button
                        type="button"
                        onClick={addExistingTaskToStory}
                        disabled={!selectedExistingTask}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors text-sm flex-shrink-0"
                      >
                        Add Task
                      </button>
                    </div>
                  </div>
                  
                  {/* Current Tasks */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Current Tasks ({formData.tasks.length})</h4>
                    {formData.tasks.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No tasks added yet</p>
                    ) : (
                      formData.tasks.map((task) => (
                        <div key={task.task_id} className="p-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-gray-900 dark:text-white text-sm flex-1">{task.title}</h5>
                            <button
                              type="button"
                              onClick={() => removeTaskFromStory(task.task_id)}
                              className="text-red-500 hover:text-red-700 p-1 ml-2"
                              title="Remove Task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="mt-2">
                            <Badge variant="default" size="sm">
                              {task.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 pt-4 pb-24 sm:pb-6 rounded-b-2xl lg:rounded-b-2xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  onClick={handleStorySubmit}
                  disabled={loading}
                  className="flex-1 sm:flex-none order-2 sm:order-1"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {selectedStory ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    selectedStory ? 'Update Story' : 'Create Story'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeStoryForm}
                  className="flex-1 sm:flex-none order-1 sm:order-2"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      {showTaskCreationModal && selectedStoryForTask && (
        <TaskCreationModal
          isOpen={showTaskCreationModal}
          onClose={() => {
            setShowTaskCreationModal(false);
            setSelectedStoryForTask(null);
          }}
          onCreateTask={handleCreateTaskForStory}
          storyId={selectedStoryForTask.id}
          storyTitle={selectedStoryForTask.title}
          users={users}
          storyData={{
            sprint_id: (selectedStoryForTask as any).sprint_id,
            sprint_name: (selectedStoryForTask as any).sprint_name,
            project_id: (selectedStoryForTask as any).project_id,
            project_name: (selectedStoryForTask as any).project_name
          }}
        />
      )}
    </AppLayout>
  );
};

export default StoryPage;
