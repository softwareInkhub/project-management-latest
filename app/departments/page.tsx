'use client';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, 
  MoreVertical, 
  Briefcase, 
  Edit,
  Eye,
  Trash2,
  Search,
  Filter,
  Tag,
  X,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Building2,
  Settings,
  FileCode,
  Bold,
  Italic,
  Strikethrough,
  Heading,
  Quote,
  Code,
  Code2,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Table,
  Minus,
  ChevronDown,
  CheckSquare
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
import { Avatar } from '../components/ui/Avatar';
import { StatsCard } from '../components/ui/StatsCard';
import { SearchFilterSection } from '../components/ui/SearchFilterSection';
import { ViewToggle } from '../components/ui/ViewToggle';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { apiService, Department, Company } from '../services/api';
import { CreateButton, UpdateButton, DeleteButton, ReadOnlyBadge, usePermissions } from '../components/RoleBasedUI';

interface DepartmentWithCompany extends Department {
  companyName?: string;
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

const DepartmentsPage = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<DepartmentWithCompany[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentWithCompany | null>(null);
  const [viewingDepartment, setViewingDepartment] = useState<DepartmentWithCompany | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // JSON view toggle
  const [isJsonViewActive, setIsJsonViewActive] = useState(false);

  // Quick filter state
  const [quickFilterValues, setQuickFilterValues] = useState<Record<string, string | string[] | { from: string; to: string }>>({
    status: [],
    tags: [],
    dateRange: 'all'
  });
  const [visibleFilterColumns, setVisibleFilterColumns] = useState<string[]>(['status', 'tags', 'dateRange']);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    companyId: '',
    tags: [] as string[],
    active: 'active'
  });
  const [tagInput, setTagInput] = useState('');
  
  // Markdown editor state
  const [isDescriptionPreview, setIsDescriptionPreview] = useState(false);
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  const headingDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch departments and companies
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [deptResponse, compResponse] = await Promise.all([
        apiService.getDepartments(),
        apiService.getCompanies()
      ]);
      
      if (deptResponse.success && deptResponse.data) {
        // Enrich departments with company names
        const companiesMap = new Map(
          (compResponse.data || []).map((c: Company) => [c.id, c.name])
        );
        
        const enrichedDepartments = deptResponse.data.map((dept: Department) => ({
          ...dept,
          companyName: companiesMap.get(dept.companyId) || 'Unknown'
        }));
        
        setDepartments(enrichedDepartments);
      }
      
      if (compResponse.success && compResponse.data) {
        setCompanies(compResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
    const textarea = document.getElementById('department-description-editor') as HTMLTextAreaElement;
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
    const textarea = document.getElementById('department-description-editor') as HTMLTextAreaElement;
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
    const textarea = document.getElementById('department-description-editor') as HTMLTextAreaElement;
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
    const textarea = document.getElementById('department-description-editor') as HTMLTextAreaElement;
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
    const textarea = document.getElementById('department-description-editor') as HTMLTextAreaElement;
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
    const textarea = document.getElementById('department-description-editor') as HTMLTextAreaElement;
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if click is on a dropdown menu or its trigger button
      const isDropdownMenu = target.closest('[data-dropdown-menu]');
      const isMenuButton = target.closest('button[title="More options"]') || target.closest('button[title="More Options"]');
      
      // Close dropdown if clicking outside of both the menu and trigger button
      if (!isDropdownMenu && !isMenuButton) {
        setOpenMenuId(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get unique tags from all departments
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    departments.forEach(dept => {
      if (dept.tags && Array.isArray(dept.tags)) {
        dept.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [departments]);

  // Handler for quick filter changes
  const handleQuickFilterChange = (key: string, value: string | string[] | { from: string; to: string }) => {
    setQuickFilterValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Filter departments
  const filteredDepartments = useMemo(() => {
    return departments.filter(dept => {
      // Search filter
      const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           dept.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter (from dropdown)
      const matchesStatus = statusFilter === 'all' || dept.active === statusFilter;
      
      // Company filter
      const matchesCompany = companyFilter === 'all' || dept.companyId === companyFilter;
      
      // Quick filter: Status
      const statusQuickFilter = quickFilterValues.status as string[];
      const matchesStatusQuick = !statusQuickFilter || statusQuickFilter.length === 0 || 
                                  statusQuickFilter.includes(dept.active);
      
      // Quick filter: Tags
      const tagsQuickFilter = quickFilterValues.tags as string[];
      const matchesTags = !tagsQuickFilter || tagsQuickFilter.length === 0 ||
                         (dept.tags && dept.tags.some(tag => tagsQuickFilter.includes(tag)));
      
      // Quick filter: Date Range (same logic as Task section)
      const dateRangeValue = quickFilterValues.dateRange;
      let matchesDateRange = true;
      
      if (dateRangeValue && dateRangeValue !== 'all') {
        const deptDate = new Date(dept.createdAt);
        deptDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Handle custom date range object
        if (typeof dateRangeValue === 'object' && 'from' in dateRangeValue && 'to' in dateRangeValue) {
          const fromDate = new Date(dateRangeValue.from);
          fromDate.setHours(0, 0, 0, 0);
          const toDate = new Date(dateRangeValue.to);
          toDate.setHours(23, 59, 59, 999);
          matchesDateRange = deptDate >= fromDate && deptDate <= toDate;
        } else if (typeof dateRangeValue === 'string') {
          // Handle preset date ranges
          if (dateRangeValue === 'today') {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            matchesDateRange = deptDate >= today && deptDate < tomorrow;
          } else if (dateRangeValue === 'thisWeek') {
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() + 7);
            matchesDateRange = deptDate >= today && deptDate < weekEnd;
          } else if (dateRangeValue === 'thisMonth') {
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            matchesDateRange = deptDate >= today && deptDate <= monthEnd;
          } else if (dateRangeValue === 'week') {
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDateRange = deptDate >= weekAgo;
          } else if (dateRangeValue === 'month') {
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDateRange = deptDate >= monthAgo;
          }
        }
      }
      
      return matchesSearch && matchesStatus && matchesCompany && matchesStatusQuick && matchesTags && matchesDateRange;
    });
  }, [departments, searchTerm, statusFilter, companyFilter, quickFilterValues]);

  // Stats
  const stats = useMemo(() => {
    const total = departments.length;
    const active = departments.filter(d => d.active === 'active').length;
    const inactive = departments.filter(d => d.active === 'inactive').length;
    const totalTeams = departments.reduce((sum, d) => sum + (d.teams?.length || 0), 0);
    return { total, active, inactive, totalTeams };
  }, [departments]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let response;
      if (editingDepartment) {
        response = await apiService.updateDepartment(editingDepartment.id, formData);
      } else {
        response = await apiService.createDepartment(formData);
      }
      
      if (response.success) {
        await fetchData();
        setIsModalOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving department:', error);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    
    try {
      const response = await apiService.deleteDepartment(id);
      if (response.success) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error deleting department:', error);
    }
  };

  // Handle edit
  const handleEdit = (department: DepartmentWithCompany) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description,
      companyId: department.companyId,
      tags: department.tags || [],
      active: department.active
    });
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  // Handle view
  const handleView = (department: DepartmentWithCompany) => {
    setViewingDepartment(department);
    setIsViewModalOpen(true);
    setIsJsonViewActive(false); // Reset JSON view when opening modal
    setOpenMenuId(null);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      companyId: '',
      tags: [],
      active: 'active'
    });
    setTagInput('');
    setEditingDepartment(null);
  };

  // Add tag
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  return (
    <AppLayout>
      {/* Tooltip Styles */}
      <style jsx>{`
        .tooltip-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        .tooltip-wrapper .tooltip-content {
          visibility: hidden;
          opacity: 0;
          position: absolute;
          z-index: 9999;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(31, 41, 55, 0.95);
          color: white;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          white-space: nowrap;
          transition: opacity 0.2s ease, visibility 0.2s ease;
          pointer-events: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .tooltip-wrapper .tooltip-content::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: rgba(31, 41, 55, 0.95);
        }
        .tooltip-wrapper:hover .tooltip-content {
          visibility: visible;
          opacity: 1;
        }
        @media (max-width: 640px) {
          .tooltip-wrapper .tooltip-content {
            font-size: 11px;
            padding: 5px 10px;
          }
        }
      `}</style>
      <div className="w-full h-full px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-4 overflow-x-hidden">

        {/* Search and Filters */}
        <SearchFilterSection
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search departments..."
          variant="modern"
          showActiveFilters={true}
          hideFilterIcon={true}
          visibleFilterColumns={visibleFilterColumns}
          onFilterColumnsChange={setVisibleFilterColumns}
          quickFilters={[
            {
              key: 'status',
              label: 'Status',
              icon: <CheckCircle className="w-4 h-4 text-green-500" />,
              options: [
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ],
              type: 'default',
              multiple: true
            },
            {
              key: 'tags',
              label: 'Tags',
              icon: <Tag className="w-4 h-4 text-orange-500" />,
              options: [
                { value: 'all', label: 'All Tags' },
                ...allTags.map(tag => ({ value: tag, label: tag }))
              ],
              type: 'default',
              multiple: true
            },
            {
              key: 'dateRange',
              label: 'Created Date',
              icon: <Calendar className="w-4 h-4 text-blue-500" />,
              options: [
                { value: 'all', label: 'All Time' },
                { value: 'today', label: 'Today' },
                { value: 'thisWeek', label: 'This Week' },
                { value: 'thisMonth', label: 'This Month' },
                { value: 'next7Days', label: 'Next 7 Days' }
              ],
              type: 'date'
            }
          ]}
          quickFilterValues={quickFilterValues}
          onQuickFilterChange={handleQuickFilterChange}
          availableFilterColumns={[
            { key: 'status', label: 'Status', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
            { key: 'tags', label: 'Tags', icon: <Tag className="w-4 h-4 text-orange-500" /> },
            { key: 'dateRange', label: 'Created Date', icon: <Calendar className="w-4 h-4 text-blue-500" /> }
          ]}
          viewToggle={{
            currentView: viewMode,
            views: [
              {
                value: 'list',
                label: 'List',
                icon: (
                  <div className="w-3 h-3 flex flex-col space-y-0.5">
                    <div className="w-full h-0.5 rounded-sm bg-current"></div>
                    <div className="w-full h-0.5 rounded-sm bg-current"></div>
                    <div className="w-full h-0.5 rounded-sm bg-current"></div>
                  </div>
                )
              },
              {
                value: 'card',
                label: 'Card',
                icon: (
                  <div className="w-3 h-3 grid grid-cols-2 gap-0.5">
                    <div className="w-1 h-1 rounded-sm bg-current"></div>
                    <div className="w-1 h-1 rounded-sm bg-current"></div>
                    <div className="w-1 h-1 rounded-sm bg-current"></div>
                    <div className="w-1 h-1 rounded-sm bg-current"></div>
                  </div>
                )
              }
            ],
            onChange: (view: 'list' | 'card') => setViewMode(view)
          }}
          filters={[
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]
            }
          ]}
          actionButton={{
            label: 'New Department',
            onClick: () => {
              resetForm();
              setIsModalOpen(true);
            }
          }}
        />

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading departments...</p>
            </div>
          </div>
        )}

        {/* Card View */}
        {!isLoading && viewMode === 'card' && filteredDepartments.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-4">
            {filteredDepartments.map((department) => {
              const tagsArray = department.tags || [];
              
              return (
                <div
                  key={department.id}
                  className="relative bg-white rounded-xl sm:rounded-2xl border border-gray-200 hover:border-gray-300 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:z-50"
                  style={{
                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                  }}
                  onClick={() => handleView(department)}
                >
                  <div className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                    {/* Header: Icon + Title/Description + Menu */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div 
                          className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                          title={`Department: ${department.name || 'No Name'}`}
                        >
                          <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 
                            className="font-semibold text-gray-900 text-sm sm:text-base leading-tight truncate"
                            title={`Department: ${department.name || 'Untitled Department'}`}
                          >
                            {department.name || 'Untitled Department'}
                          </h4>
                          {department.description && (
                            <p 
                              className="text-xs text-gray-600 mt-0.5 truncate"
                              title={department.description}
                            >
                              {department.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="relative flex-shrink-0">
                        <button 
                          className="p-1 hover:bg-gray-100 rounded-xl transition-colors"
                          title="More Options"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setOpenMenuId(openMenuId === department.id ? null : department.id); 
                          }}
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        {openMenuId === department.id && (
                          <div 
                            data-dropdown-menu
                            className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-30" 
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button 
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 rounded-t-xl flex items-center gap-2 text-sm font-normal text-gray-800" 
                              onClick={(e) => {e.stopPropagation(); handleView(department); setOpenMenuId(null);}}
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </button>
                            <UpdateButton
                              resource="departments"
                              onClick={(e) => {e?.stopPropagation(); handleEdit(department); setOpenMenuId(null);}}
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2 text-sm font-normal text-gray-800"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Edit</span>
                            </UpdateButton>
                            <DeleteButton
                              resource="departments"
                              onClick={(e) => {e?.stopPropagation(); handleDelete(department.id); setOpenMenuId(null);}}
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 rounded-b-xl flex items-center gap-2 text-sm font-normal text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </DeleteButton>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Company Name */}
                    <div className="tooltip-wrapper">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-xs text-gray-600">Company:</span>
                        <span className="text-xs text-gray-700 font-medium truncate">
                          {department.companyName || 'No Company'}
                        </span>
                      </div>
                      <div className="tooltip-content">Company: {department.companyName || 'No Company'}</div>
                    </div>

                    {/* Tags (below divider) */}
                    {tagsArray.length > 0 && (
                      <div className="flex items-center flex-wrap gap-1.5">
                        {/* Mobile: Show only 1 tag */}
                        <div className="sm:hidden flex items-center gap-1.5">
                          <div className="tooltip-wrapper">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium inline-block max-w-[55px] truncate">
                              {tagsArray[0]}
                            </span>
                            <div className="tooltip-content">Tag: {tagsArray[0]}</div>
                          </div>
                          {tagsArray.length > 1 && (
                            <div className="tooltip-wrapper">
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                                +{tagsArray.length - 1}
                              </span>
                              <div className="tooltip-content">
                                {tagsArray.length - 1} more tag{tagsArray.length - 1 !== 1 ? 's' : ''}: {tagsArray.slice(1).join(', ')}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Desktop: Show 2 tags */}
                        <div className="hidden sm:flex items-center gap-1.5">
                          {tagsArray.slice(0, 2).map((tag, i) => (
                            <div key={i} className="tooltip-wrapper">
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                                {tag}
                              </span>
                              <div className="tooltip-content">Tag: {tag}</div>
                            </div>
                          ))}
                          {tagsArray.length > 2 && (
                            <div className="tooltip-wrapper">
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                                +{tagsArray.length - 2}
                              </span>
                              <div className="tooltip-content">
                                {tagsArray.length - 2} more tag{tagsArray.length - 2 !== 1 ? 's' : ''}: {tagsArray.slice(2).join(', ')}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Divider */}
                    <div className="border-t border-gray-100"></div>

                    {/* Status, Teams, and Date Row - All in one line */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="tooltip-wrapper">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-600">Status:</span>
                          <Badge variant={department.active === 'active' ? 'success' : 'default'} size="sm" className="text-xs">
                            {department.active}
                          </Badge>
                        </div>
                        <div className="tooltip-content">Current Status: {department.active}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Teams - Hidden on mobile */}
                        <div className="hidden sm:block">
                          <div className="tooltip-wrapper">
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-purple-500" />
                              <span className="text-gray-800 font-semibold">
                                {department.teams?.length || 0}
                              </span>
                            </div>
                            <div className="tooltip-content">Teams: {department.teams?.length || 0}</div>
                          </div>
                        </div>
                        {department.createdAt && (
                          <div className="tooltip-wrapper">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-gray-500" />
                              <span className="text-gray-700 font-medium">
                                {new Date(department.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <div className="tooltip-content">
                              Created: {new Date(department.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
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

        {/* List View */}
        {!isLoading && viewMode === 'list' && filteredDepartments.length > 0 && (
          <div className="pt-0 sm:pt-3 md:pt-0 space-y-3 pb-4">
            {filteredDepartments.map((department) => {
              const tagsArray = department.tags || [];
              
              return (
                <div
                  key={department.id}
                  className="relative bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 p-4 cursor-pointer hover:z-50"
                  style={{
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                  }}
                  onClick={() => handleView(department)}
                >
                  {/* Top Row - Icon, Title/Description, More Menu */}
                  <div className="flex items-start gap-3 mb-0">
                    {/* Department Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                        <Briefcase className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Department Title + Desktop Meta Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-9">
                        {/* Title - Mobile full width, Desktop shrinks */}
                        <div className="sm:flex-shrink-0">
                          <div className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                            {department.name || 'Untitled Department'}
                          </div>
                        </div>

                        {/* Desktop Meta Details - Right side of title */}
                        <div className="hidden sm:flex flex-wrap items-center gap-x-2 gap-y-1 text-xs flex-1">
                          {/* Status */}
                          <div className="tooltip-wrapper">
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-800 font-semibold">Status:</span>
                              <Badge 
                                variant={department.active === 'active' ? 'success' : 'default'} 
                                size="sm" 
                                className="px-2.5 py-1"
                              >
                                {department.active}
                              </Badge>
                            </div>
                            <div className="tooltip-content">Current Status: {department.active}</div>
                          </div>

                          {/* Company */}
                          <div className="tooltip-wrapper">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-800 font-semibold">Company:</span>
                              <Building2 className="w-3.5 h-3.5 text-blue-500" />
                              <span className="text-gray-700 font-medium truncate max-w-[100px]">
                                {department.companyName}
                              </span>
                            </div>
                            <div className="tooltip-content">Company: {department.companyName}</div>
                          </div>

                          {/* Teams */}
                          <div className="tooltip-wrapper">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-800 font-semibold">Teams:</span>
                              <Users className="w-3.5 h-3.5 text-purple-500" />
                              <span className="text-gray-700 font-medium">
                                {department.teams?.length || 0}
                              </span>
                            </div>
                            <div className="tooltip-content">Teams: {department.teams?.length || 0}</div>
                          </div>

                          {/* Tags */}
                          {tagsArray.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-800 font-semibold">Tags:</span>
                              <div className="flex items-center gap-1">
                                {tagsArray.slice(0, 2).map((tag, i) => (
                                  <div key={i} className="tooltip-wrapper">
                                    <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-md font-medium">
                                      {tag}
                                    </span>
                                    <div className="tooltip-content">Tag: {tag}</div>
                                  </div>
                                ))}
                                {tagsArray.length > 2 && (
                                  <div className="tooltip-wrapper">
                                    <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-md text-xs">
                                      +{tagsArray.length - 2}
                                    </span>
                                    <div className="tooltip-content">
                                      {tagsArray.length - 2} more tag{tagsArray.length - 2 !== 1 ? 's' : ''}: {tagsArray.slice(2).join(', ')}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Created Date */}
                          {department.createdAt && (
                            <div className="tooltip-wrapper">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                                <span className="text-gray-700 font-medium">
                                  {new Date(department.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <div className="tooltip-content">
                                Created: {new Date(department.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Mobile Description - Right below title */}
                      {department.description && (
                        <div className="sm:hidden mt-1">
                          <div className="text-xs text-gray-600 truncate">
                            {department.description.length > 30 ? department.description.substring(0, 30) + '..' : department.description}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* More Options Menu */}
                    <div 
                      className={`flex-shrink-0 relative ${openMenuId === department.id ? 'z-50' : 'z-20'}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="More Options"
                          className="p-2 h-10 w-10 text-gray-400 hover:text-gray-600"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setOpenMenuId(openMenuId === department.id ? null : department.id); 
                          }}
                        >
                          <MoreVertical size={24} />
                        </Button>
                        {openMenuId === department.id && (
                          <div 
                            data-dropdown-menu
                            className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-[100]" 
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button 
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 rounded-t-xl flex items-center gap-2 text-sm font-normal text-gray-800" 
                              onClick={(e) => {e.stopPropagation(); handleView(department); setOpenMenuId(null);}}
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </button>
                            <UpdateButton
                              resource="departments"
                              onClick={(e) => {e?.stopPropagation(); handleEdit(department); setOpenMenuId(null);}}
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2 text-sm font-normal text-gray-800"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Edit</span>
                            </UpdateButton>
                            <DeleteButton
                              resource="departments"
                              onClick={(e) => { e?.stopPropagation(); handleDelete(department.id); setOpenMenuId(null); }}
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 rounded-b-xl flex items-center gap-2 text-sm font-normal text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </DeleteButton>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Desktop Description - Right below title row */}
                  {department.description && (
                    <div className="hidden sm:block pl-[52px] -mt-2">
                      <div className="inline-block">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-800 font-semibold">Description:</span>
                          <span className="px-2.5 py-1 font-medium text-xs truncate max-w-2xl inline-block">
                            {department.description.length > 100 ? department.description.substring(0, 100) + '...' : department.description}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bottom Row - Mobile Meta Details */}
                  <div className="pl-[52px] mt-1 sm:hidden">
                    {/* Mobile: Single-row layout - All in one line (without company and teams) */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                      {/* Status */}
                      <div className="tooltip-wrapper">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-800 font-semibold">Status:</span>
                          <Badge 
                            variant={department.active === 'active' ? 'success' : 'default'} 
                            size="sm" 
                            className="px-2 py-0.5 text-xs"
                          >
                            {department.active}
                          </Badge>
                        </div>
                        <div className="tooltip-content">Current Status: {department.active}</div>
                      </div>

                      {/* Tags */}
                      {tagsArray.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-800 font-semibold">Tags:</span>
                          <div className="tooltip-wrapper">
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md font-medium">
                              {tagsArray[0]}
                            </span>
                            <div className="tooltip-content">Tag: {tagsArray[0]}</div>
                          </div>
                          {tagsArray.length > 1 && (
                            <div className="tooltip-wrapper">
                              <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded-md text-xs">
                                +{tagsArray.length - 1}
                              </span>
                              <div className="tooltip-content">
                                {tagsArray.length - 1} more tag{tagsArray.length - 1 !== 1 ? 's' : ''}: {tagsArray.slice(1).join(', ')}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Date */}
                      {department.createdAt && (
                        <div className="tooltip-wrapper">
                          <div className="flex items-center gap-0.5">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-700 font-medium">
                              {new Date(department.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="tooltip-content">
                            Created: {new Date(department.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredDepartments.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No departments found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
            <Button onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}>Create New Department</Button>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div 
            className="fixed inset-0 bg-black/70 flex items-end lg:items-center justify-center z-50 lg:p-4" 
            style={{ backdropFilter: 'blur(2px)' }}
            onClick={(e) => {
              // Close modal when clicking on backdrop
              if (e.target === e.currentTarget) {
                setIsModalOpen(false);
                resetForm();
              }
            }}
          >
            <div 
              className="bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl w-full lg:max-w-2xl h-[85vh] lg:h-auto lg:max-h-[95vh] flex flex-col"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 rounded-t-2xl z-10 flex-shrink-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {editingDepartment ? 'Edit Department' : 'Add Department'}
                </h2>
              </div>

              <div className="flex-1 lg:flex-none overflow-y-auto lg:overflow-visible">
                <div className="p-4 sm:p-6 pb-0 space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter department name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company *
                  </label>
                  <select
                    required
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select a company</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                            ? 'bg-purple-100 text-purple-700 font-medium' 
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
                            ? 'bg-purple-100 text-purple-700 font-medium' 
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
                      id="department-description-editor"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
                      placeholder="Enter department description (Markdown supported)"
                    />
                  ) : (
                    <div className="w-full min-h-[125px] max-h-[200px] overflow-y-auto border border-gray-300 rounded-lg p-4 bg-gray-50">
                      <MarkdownRenderer content={formData.description || ''} />
                    </div>
                  )}
                </div>

                {/* Status and Tags in the same row */}
                <div className="flex gap-2 sm:gap-4">
                  {/* Status */}
                  <div className="w-[35%] sm:w-1/2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.value })}
                      className="w-full px-2 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Tags */}
                  <div className="flex-1">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="flex gap-1 sm:gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        className="flex-1 px-2 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Add a tag"
                      />
                      <Button type="button" onClick={handleAddTag} variant="outline" className="px-2 sm:px-3 flex-shrink-0">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Display added tags */}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-2"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-purple-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                </div>
              </div>

              {/* Fixed Footer with Buttons */}
              <div className="sticky lg:static bottom-0 bg-white border-t border-gray-200 rounded-b-2xl px-4 sm:px-6 pt-4 pb-24 sm:pb-4 lg:pb-4 z-10 flex-shrink-0">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={(e) => {
                      handleSubmit(e as any);
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {editingDepartment ? 'Update Department' : 'Create Department'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {isViewModalOpen && viewingDepartment && (
          <div 
            className="fixed inset-0 bg-black/70 flex items-end lg:items-center justify-center z-50 lg:p-4" 
            style={{ backdropFilter: 'blur(2px)' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsViewModalOpen(false);
                setViewingDepartment(null);
                setIsJsonViewActive(false); // Reset JSON view when closing
              }
            }}
          >
            <div 
              className="bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl w-full lg:max-w-2xl max-h-[85vh] lg:h-auto lg:max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 rounded-t-2xl z-10 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                      <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{viewingDepartment.name}</h2>
                      <p className="text-gray-500 text-xs sm:text-sm">
                        Department Details
                      </p>
                    </div>
                  </div>
                  {/* JSON View Button */}
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

              <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="p-4 sm:p-6 pb-24 sm:pb-6 space-y-4 sm:space-y-6">
                {/* Conditional Rendering: Normal View or JSON View */}
                {!isJsonViewActive ? (
                  <>
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  {viewingDepartment.description ? (
                    <div className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                      <MarkdownRenderer content={viewingDepartment.description} />
                    </div>
                  ) : (
                    <p className="text-gray-400 italic px-4 py-3">No description provided</p>
                  )}
                </div>

                {/* Company and Status */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Company
                    </label>
                    <div className="flex items-center gap-2 bg-gray-50 px-2 sm:px-4 py-3 rounded-lg border border-gray-200 text-gray-900">
                      <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm truncate">{viewingDepartment.companyName}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="bg-gray-50 px-2 sm:px-4 py-2 rounded-lg border border-gray-200">
                      <Badge variant={viewingDepartment.active === 'active' ? 'success' : 'default'} size="sm">
                        {viewingDepartment.active}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Teams and Created Date */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Teams
                    </label>
                    <div className="flex items-center gap-2 bg-gray-50 px-2 sm:px-4 py-3 rounded-lg border border-gray-200 text-gray-900">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium">{viewingDepartment.teams?.length || 0}</span>
                      <span className="text-xs sm:text-sm text-gray-600">team{viewingDepartment.teams?.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Created Date
                    </label>
                    <div className="flex items-center gap-1 sm:gap-2 bg-gray-50 px-2 sm:px-4 py-3 rounded-lg border border-gray-200 text-gray-900">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm truncate">
                        {new Date(viewingDepartment.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {viewingDepartment.tags && viewingDepartment.tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                      {viewingDepartment.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                </>
                ) : (
                  /* JSON View */
                  <div className="bg-white rounded-2xl border border-gray-100 p-3 lg:p-4 shadow-sm">
                    <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-[70vh]">
                      <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words">
                        {JSON.stringify({
                          id: viewingDepartment.id,
                          name: viewingDepartment.name,
                          description: viewingDepartment.description,
                          companyId: viewingDepartment.companyId,
                          companyName: viewingDepartment.companyName,
                          active: viewingDepartment.active,
                          tags: viewingDepartment.tags || [],
                          teams: viewingDepartment.teams || [],
                          createdAt: viewingDepartment.createdAt || null,
                          updatedAt: (viewingDepartment as any).updatedAt || null
                        }, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Floating Action Button (Mobile only) */}
        <CreateButton
          resource="departments"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-all duration-200 hover:scale-110"
        >
          <Plus className="w-6 h-6" />
        </CreateButton>
      </div>
    </AppLayout>
  );
};

export default DepartmentsPage;
