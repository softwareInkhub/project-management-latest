'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Tag,
  Paperclip,
  Trash2,
  Download,
  X,
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Eye,
  Edit3,
  MoreVertical,
  FileText,
  Clock,
  User,
  CheckSquare,
  Upload,
  File,
  ChevronDown,
  Filter,
  Calendar,
  FolderOpen,
  Heading,
  Quote,
  Table,
  Strikethrough,
  Code2,
  Minus,
  Square
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { AppLayout } from '../components/AppLayout';
import { SearchFilterSection } from '../components/ui/SearchFilterSection';
import { ViewToggle } from '../components/ui/ViewToggle';
import { useAuth } from '../hooks/useAuth';
import { apiService, Note, NoteAttachment, Task } from '../services/api';
import { driveService } from '../services/drive';
import { TaskForm } from '../components/ui/TaskForm';
import { CreateButton, UpdateButton, DeleteButton, usePermissions } from '../components/RoleBasedUI';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Markdown rendering component with full support
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
          <a href={href} className="text-purple-600 dark:text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer">
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

// Helper function to convert note attachments to task format
const getAttachmentFileIds = (attachments?: NoteAttachment[]): string => {
  if (!attachments || !Array.isArray(attachments)) return '[]';
  const fileIds = attachments.map(att => att.fileId);
  return JSON.stringify(fileIds);
};

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Main Notes Page Component
const NotesPage: React.FC = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreview, setIsPreview] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string | string[]>('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [conversionStatusFilter, setConversionStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string | { from: string; to: string }>('all');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [visibleFilterColumns, setVisibleFilterColumns] = useState<string[]>(['tags', 'project', 'conversionStatus', 'dateRange']);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [allProjectsList, setAllProjectsList] = useState<any[]>([]); // All projects from API
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; fileName: string; fileType: string } | null>(null);
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  const headingDropdownRef = useRef<HTMLDivElement>(null);

  // Form state for new/editing note
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    projectId: '',
    attachments: [] as NoteAttachment[]
  });

  // Pending files (not yet uploaded)
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Load notes, users, teams, and projects on mount
  useEffect(() => {
    loadNotes();
    fetchUsers();
    fetchTeams();
    fetchAllProjects();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openDropdown && !target.closest('[data-dropdown-menu]') && !target.closest('button')) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

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

  const loadNotes = async () => {
    setLoading(true);
    try {
      const response = await apiService.getNotes();
      if (response.success && response.data) {
        setNotes(response.data);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users for task conversion
  const fetchUsers = async () => {
    try {
      console.log('👥 Fetching users for task assignment...');
      const res = await apiService.getUsers();
      if (res.success && res.data) {
        console.log('✅ Users fetched:', res.data.length);
        setAllUsers(res.data);
      } else {
        console.error('❌ Failed to fetch users:', res.error);
        setAllUsers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      setAllUsers([]);
    }
  };

  // Fetch teams for task conversion
  const fetchTeams = async () => {
    try {
      console.log('👥 Fetching teams for task assignment...');
      const res = await apiService.getTeams();
      if (res.success && res.data) {
        console.log('✅ Teams fetched:', res.data.length);
        setAllTeams(res.data);
      } else {
        console.error('❌ Failed to fetch teams:', res.error);
        setAllTeams([]);
      }
    } catch (error) {
      console.error('❌ Error fetching teams:', error);
      setAllTeams([]);
    }
  };

  // Fetch all projects for task conversion
  const fetchAllProjects = async () => {
    try {
      console.log('📁 Fetching ALL projects from API...');
      const res = await apiService.getProjects();
      if (res.success && res.data) {
        // Store full project objects instead of just names
        console.log('✅ All projects fetched:', res.data.length, res.data);
        setAllProjectsList(res.data);
      } else {
        console.error('❌ Failed to fetch projects:', res.error);
        setAllProjectsList([]);
      }
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
      setAllProjectsList([]);
    }
  };

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    console.log('🔍 Filtering notes with:', {
      searchQuery,
      tagFilter,
      projectFilter,
      conversionStatusFilter,
      dateRangeFilter,
      totalNotes: notes.length
    });
    
    let filtered = [...notes];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Tag filter (supports multi-select)
    if (tagFilter !== 'all' && !(Array.isArray(tagFilter) && tagFilter.length === 0)) {
      filtered = filtered.filter(note => {
        const tags = note.tags || [];
        if (Array.isArray(tagFilter)) {
          // Multi-select: note must have at least one of the selected tags
          return tagFilter.some(selectedTag => tags.includes(selectedTag));
        } else {
          // Single select
          return tags.includes(tagFilter);
        }
      });
    }

    // Project filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter(note => note.projectId === projectFilter);
    }

    // Conversion status filter
    if (conversionStatusFilter !== 'all') {
      if (conversionStatusFilter === 'converted') {
        filtered = filtered.filter(note => note.isConvertedToTask === true);
      } else if (conversionStatusFilter === 'active') {
        filtered = filtered.filter(note => note.isConvertedToTask === false);
      }
    }

    // Date range filter
    if (dateRangeFilter && dateRangeFilter !== 'all') {
      if (typeof dateRangeFilter === 'object' && 'from' in dateRangeFilter && 'to' in dateRangeFilter) {
        // Custom date range
        const fromDate = new Date(dateRangeFilter.from).getTime();
        const toDate = new Date(dateRangeFilter.to).getTime();
        filtered = filtered.filter(note => {
          const noteDate = new Date(note.updatedAt).getTime();
          return noteDate >= fromDate && noteDate <= toDate;
        });
      } else if (typeof dateRangeFilter === 'string') {
        // Preset date ranges
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (dateRangeFilter) {
          case 'today':
            filtered = filtered.filter(note => {
              const noteDate = new Date(note.updatedAt);
              return noteDate >= today;
            });
            break;
          case 'thisWeek':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            filtered = filtered.filter(note => new Date(note.updatedAt) >= weekStart);
            break;
          case 'thisMonth':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            filtered = filtered.filter(note => new Date(note.updatedAt) >= monthStart);
            break;
          case 'next7Days':
            const next7Days = new Date(today);
            next7Days.setDate(today.getDate() + 7);
            filtered = filtered.filter(note => {
              const noteDate = new Date(note.updatedAt);
              return noteDate >= today && noteDate <= next7Days;
            });
            break;
        }
      }
    }

    // Sort by most recent
    filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    console.log('✅ Filtered notes result:', filtered.length, 'notes');
    return filtered;
  }, [notes, searchQuery, tagFilter, projectFilter, conversionStatusFilter, dateRangeFilter]);

  // Get all unique tags with counts
  const allTagsWithCounts = useMemo(() => {
    const tagCounts = new Map<string, number>();
    notes.forEach(note => {
      const tags = note.tags || [];
      tags.forEach((tag: string) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagCounts.entries()).map(([tag, count]) => ({
      value: tag,
      label: tag,
      count
    }));
  }, [notes]);

  const allTags = useMemo(() => allTagsWithCounts.map(t => t.value), [allTagsWithCounts]);

  // Get all unique projects with counts
  const allProjectsWithCounts = useMemo(() => {
    const projectCounts = new Map<string, number>();
    notes.forEach(note => {
      if (note.projectId) {
        projectCounts.set(note.projectId, (projectCounts.get(note.projectId) || 0) + 1);
      }
    });
    return Array.from(projectCounts.entries()).map(([project, count]) => ({
      value: project,
      label: project,
      count
    }));
  }, [notes]);

  const allProjects = useMemo(() => allProjectsWithCounts.map(p => p.value), [allProjectsWithCounts]);

  const handleCreateNote = async () => {
    if (!formData.title.trim()) return;

    try {
      setUploadingFiles(true);
      
      // Step 1: Create note first to get the note ID
      const noteData = {
        title: formData.title || 'Untitled Note',
        content: formData.content || '',
        projectId: formData.projectId || undefined,
        authorId: user?.email || user?.username || 'unknown',
        tags: formData.tags,
        attachments: formData.attachments, // Existing attachments (if any)
        isConvertedToTask: false
      };

      const response = await apiService.createNote(noteData);
      if (response.success && response.data) {
        const createdNote = response.data;
        console.log('✅ Note created:', createdNote);
        
        // Step 2: Upload pending files with the actual note ID
        if (pendingFiles.length > 0) {
          console.log(`📤 Uploading ${pendingFiles.length} file(s) for note: ${createdNote.id}`);
          try {
            const uploadedAttachments = await uploadPendingFiles(createdNote.id);
            
            // Step 3: Update the note with uploaded attachments
            const allAttachments = [...(createdNote.attachments || []), ...uploadedAttachments];
            await apiService.updateNote(createdNote.id, { attachments: allAttachments });
            console.log('✅ Files uploaded and note updated');
          } catch (uploadError) {
            console.error('⚠️ Note created but file upload failed:', uploadError);
            alert('Note created, but file upload failed. You can add files later by editing the note.');
          }
        }
        
        // Close modal and reset
        setShowNewNoteModal(false);
        setPendingFiles([]);
        resetForm();
        
        // Reload notes list to get fresh data from server
        await loadNotes();
        
        console.log('✅ Note creation complete');
      }
    } catch (error) {
      console.error('❌ Error creating note:', error);
      alert('Failed to create note. Please try again.');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;

    try {
      setUploadingFiles(true);
      
      // Upload pending files first (if any)
      let uploadedAttachments: NoteAttachment[] = [];
      if (pendingFiles.length > 0) {
        console.log(`📤 Uploading ${pendingFiles.length} file(s) for note: ${selectedNote.id}`);
        uploadedAttachments = await uploadPendingFiles(selectedNote.id);
      }

      const allAttachments = [...formData.attachments, ...uploadedAttachments];
      
      const noteData = {
        title: formData.title || 'Untitled Note',
        content: formData.content || '',
        projectId: formData.projectId || undefined,
        tags: formData.tags,
        attachments: allAttachments
      };

      const response = await apiService.updateNote(selectedNote.id, noteData);
      if (response.success && response.data) {
        setPendingFiles([]); // Clear pending files
        setIsEditing(false);
        setIsPreview(true);
        
        // Reload notes list to get fresh data from server
        await loadNotes();
        
        // Update selected note with fresh data
        setSelectedNote(response.data);
        
        console.log('✅ Note updated successfully:', selectedNote.id);
      }
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Failed to update note. Please try again.');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await apiService.deleteNote(noteId);
      if (response.success) {
        setNotes(notes.filter(n => n.id !== noteId));
        if (selectedNote?.id === noteId) {
          handleCloseNoteModal();
          setSelectedNote(null);
        }
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const openNoteModal = (note: Note, editMode: boolean = false) => {
    setPendingFiles([]); // Clear any pending files when opening a note
    setSelectedNote(note);
    
    // Handle backward compatibility for tags and attachments
    const parseTagsField = (field: any): string[] => {
      if (Array.isArray(field)) return field;
      if (typeof field === 'string') {
        try {
          const parsed = JSON.parse(field);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    };
    
    const parseAttachmentsField = (field: any): NoteAttachment[] => {
      if (Array.isArray(field)) {
        if (field.length > 0 && typeof field[0] === 'object' && field[0].fileId) {
          return field as NoteAttachment[];
        }
        return field.map((fileName: string) => ({
          fileId: fileName,
          fileName: fileName,
          fileSize: 0,
          uploadedAt: new Date().toISOString()
        }));
      }
      if (typeof field === 'string') {
        try {
          const parsed = JSON.parse(field);
          if (Array.isArray(parsed)) {
            return parsed.map((item: any) => {
              if (typeof item === 'object' && item.fileId) {
                return item as NoteAttachment;
              }
              return {
                fileId: item,
                fileName: item,
                fileSize: 0,
                uploadedAt: new Date().toISOString()
              };
            });
          }
        } catch {
          return [];
        }
      }
      return [];
    };
    
    setFormData({
      title: note.title,
      content: note.content,
      tags: parseTagsField(note.tags),
      projectId: note.projectId || '',
      attachments: parseAttachmentsField(note.attachments)
    });
    setIsEditing(editMode);
    setIsPreview(!editMode);
    setIsNoteModalOpen(true);
  };

  const handleNewNote = () => {
    setShowNewNoteModal(true);
    setSelectedNote(null);
    resetForm();
    setIsEditing(true);
    setIsPreview(false);
  };

  const handleCloseNewNoteModal = () => {
    setPendingFiles([]); // Clear pending files on cancel
    setShowNewNoteModal(false);
    resetForm();
  };

  const handleCloseNoteModal = () => {
    setPendingFiles([]); // Clear pending files on close
    setIsNoteModalOpen(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      tags: [],
      projectId: '',
      attachments: [] as NoteAttachment[]
    });
    setPendingFiles([]);
    setNewTagInput('');
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFiles(files);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await handleFiles(files);
  };

  const handleFiles = async (files: FileList) => {
    // Store files locally, don't upload yet
    const newFiles = Array.from(files);
    setPendingFiles([...pendingFiles, ...newFiles]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload pending files to Drive and return attachments
  const uploadPendingFiles = async (noteId: string): Promise<NoteAttachment[]> => {
    if (pendingFiles.length === 0) return [];
    
    setUploadingFiles(true);
    const uploadedAttachments: NoteAttachment[] = [];

    try {
      for (const file of pendingFiles) {
        console.log(`📤 Uploading file: ${file.name}`);
        
        const uploadResponse = await driveService.uploadFile({
          userId: user?.email || user?.username || 'unknown',
          file: file,
          parentId: 'ROOT',
          tags: `note,${noteId}`
        });

        if (!uploadResponse.fileId) {
          throw new Error('Upload succeeded but no fileId returned');
        }

        const attachment: NoteAttachment = {
          fileId: uploadResponse.fileId,
          fileName: uploadResponse.name || file.name,
          fileSize: uploadResponse.size || file.size,
          uploadedAt: uploadResponse.createdAt || new Date().toISOString()
        };

        uploadedAttachments.push(attachment);
        console.log(`✅ File uploaded successfully: ${file.name}`);
      }
      
      return uploadedAttachments;
    } catch (error) {
      console.error('❌ Error uploading files:', error);
      throw error;
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleRemoveAttachment = async (index: number) => {
    const attachment = formData.attachments[index];
    
    try {
      if (attachment && attachment.fileId) {
        await driveService.deleteFile(
          attachment.fileId,
          user?.email || user?.username || 'unknown'
        );
      }
    } catch (error) {
      console.warn('⚠️ Could not delete file from Drive:', error);
    }
    
    const currentAttachments = Array.isArray(formData.attachments) ? formData.attachments : [];
    setFormData({ ...formData, attachments: currentAttachments.filter((_, i) => i !== index) });
  };

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles(pendingFiles.filter((_, i) => i !== index));
  };

  const handlePreviewAttachment = async (attachment: NoteAttachment) => {
    try {
      const downloadResponse = await driveService.downloadFile(
        attachment.fileId,
        user?.email || user?.username || 'unknown'
      );
      
      const extension = attachment.fileName.split('.').pop()?.toLowerCase() || '';
      const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
      
      if (imageTypes.includes(extension)) {
        setPreviewFile({
          url: downloadResponse.downloadUrl,
          fileName: attachment.fileName,
          fileType: 'image'
        });
      } else {
        window.open(downloadResponse.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('❌ Error previewing file:', error);
      alert(`Failed to preview file. File might not exist in Drive.`);
    }
  };

  const handleDownloadAttachment = async (attachment: NoteAttachment) => {
    try {
      const downloadResponse = await driveService.downloadFile(
        attachment.fileId,
        user?.email || user?.username || 'unknown'
      );
      
      const link = document.createElement('a');
      link.href = downloadResponse.downloadUrl;
      link.download = attachment.fileName;
      link.click();
    } catch (error) {
      console.error('❌ Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const insertMarkdown = (prefix: string, suffix: string = '', placeholder: string = 'text') => {
    const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    const textToInsert = selectedText || placeholder;
    const newText = formData.content.substring(0, start) + prefix + textToInsert + suffix + formData.content.substring(end);
    
    setFormData({ ...formData, content: newText });
    
    setTimeout(() => {
      textarea.focus();
      if (!selectedText) {
        // Select the placeholder text for easy overwriting
        textarea.selectionStart = start + prefix.length;
        textarea.selectionEnd = start + prefix.length + placeholder.length;
      } else {
        textarea.selectionStart = start + prefix.length;
        textarea.selectionEnd = end + prefix.length;
      }
    }, 0);
  };

  const insertHeading = (level: number) => {
    const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = formData.content.lastIndexOf('\n', start - 1) + 1;
    const prefix = '#'.repeat(level) + ' ';
    
    const beforeLine = formData.content.substring(0, lineStart);
    const afterLine = formData.content.substring(lineStart);
    const newText = beforeLine + prefix + afterLine;
    
    setFormData({ ...formData, content: newText });
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = lineStart + prefix.length;
    }, 0);
  };

  const insertTable = () => {
    const tableTemplate = '\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n';
    const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = formData.content.substring(0, start) + tableTemplate + formData.content.substring(start);
    
    setFormData({ ...formData, content: newText });
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + tableTemplate.length;
    }, 0);
  };

  const insertCodeBlock = () => {
    const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    const codeBlock = '\n```javascript\n' + (selectedText || 'your code here') + '\n```\n';
    const newText = formData.content.substring(0, start) + codeBlock + formData.content.substring(end);
    
    setFormData({ ...formData, content: newText });
    
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
    const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = formData.content.lastIndexOf('\n', start - 1) + 1;
    
    const beforeLine = formData.content.substring(0, lineStart);
    const afterLine = formData.content.substring(lineStart);
    const newText = beforeLine + '> ' + afterLine;
    
    setFormData({ ...formData, content: newText });
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = lineStart + 2;
    }, 0);
  };

  const insertHorizontalRule = () => {
    const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const hrText = '\n---\n';
    const newText = formData.content.substring(0, start) + hrText + formData.content.substring(start);
    
    setFormData({ ...formData, content: newText });
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + hrText.length;
    }, 0);
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    
    const currentTags = formData.tags || [];
    if (!currentTags.includes(newTagInput.trim())) {
      setFormData({ ...formData, tags: [...currentTags, newTagInput.trim()] });
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = (formData.tags || []).filter(t => t !== tagToRemove);
    setFormData({ ...formData, tags: updatedTags });
  };

  const handleConvertToTask = async (taskData: Partial<Task>) => {
    if (!selectedNote) return;

    try {
      console.log('📝 Converting note to task:', taskData);
      
      const response = await apiService.createTask(taskData);
      if (response.success && response.data) {
        console.log('✅ Task created:', response.data.id);
        
        // Update the note to mark it as converted
        const updateResponse = await apiService.updateNote(selectedNote.id, {
          isConvertedToTask: true,
          relatedTaskId: response.data.id
        });
        
        if (updateResponse.success && updateResponse.data) {
          console.log('✅ Note marked as converted');
        }
        
        // Close modals and reload notes
        setShowConvertModal(false);
        setIsNoteModalOpen(false);
        
        // Reload notes to show updated status
        await loadNotes();
        
        alert(`✅ Note successfully converted to task!\n\nTask ID: ${response.data.id}\nYou can find it in the Tasks section.`);
      }
    } catch (error) {
      console.error('❌ Error converting note to task:', error);
      alert('Failed to convert note to task. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'No date';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const currentTags = useMemo(() => {
    return formData.tags || [];
  }, [formData.tags]);

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
        .hide-on-mobile {
          display: none !important;
        }
        @media (min-width: 1024px) {
          .hide-on-mobile {
            display: inline-flex !important;
          }
        }
      `}</style>
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <div className="w-full h-full px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-4 overflow-x-hidden">
          
          {/* Search and Filters - Using SearchFilterSection */}
          <SearchFilterSection
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search notes..."
            variant="modern"
            showActiveFilters={false}
            hideFilterIcon={true}
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
            actionButton={{
              label: 'New Note',
              onClick: handleNewNote
            }}
            quickFilters={[
              {
                key: 'tags',
                label: 'Tags',
                icon: <Tag className="w-4 h-4" />,
                options: allTagsWithCounts,
                type: 'default',
                multiple: true,
                showCount: true
              },
              {
                key: 'project',
                label: 'Project',
                icon: <FolderOpen className="w-4 h-4" />,
                options: allProjectsWithCounts,
                type: 'default',
                multiple: false,
                showCount: true
              },
              {
                key: 'conversionStatus',
                label: 'Status',
                icon: <CheckSquare className="w-4 h-4" />,
                options: [
                  { value: 'all', label: 'All Notes', count: notes.length },
                  { value: 'active', label: 'Active', count: notes.filter(n => !n.isConvertedToTask).length },
                  { value: 'converted', label: 'Converted to Task', count: notes.filter(n => n.isConvertedToTask).length }
                ],
                type: 'default',
                multiple: false,
                showCount: true
              },
              {
                key: 'dateRange',
                label: 'Date Range',
                icon: <Calendar className="w-4 h-4" />,
                options: [
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'thisWeek', label: 'This Week' },
                  { value: 'thisMonth', label: 'This Month' },
                  { value: 'next7Days', label: 'Next 7 Days' }
                ],
                type: 'date',
                multiple: false,
                showCount: false
              }
            ]}
            quickFilterValues={{
              tags: tagFilter,
              project: projectFilter,
              conversionStatus: conversionStatusFilter,
              dateRange: dateRangeFilter
            }}
            onQuickFilterChange={(key: string, value: string | string[] | { from: string; to: string }) => {
              console.log('🔄 Quick filter change:', key, value);
              if (key === 'tags') {
                setTagFilter(value as string | string[]);
              } else if (key === 'project') {
                setProjectFilter(value as string);
              } else if (key === 'conversionStatus') {
                setConversionStatusFilter(value as string);
              } else if (key === 'dateRange') {
                setDateRangeFilter(value as string | { from: string; to: string });
              }
            }}
            availableFilterColumns={[
              { key: 'tags', label: 'Tags', icon: <Tag className="w-4 h-4" /> },
              { key: 'project', label: 'Project', icon: <FolderOpen className="w-4 h-4" /> },
              { key: 'conversionStatus', label: 'Status', icon: <CheckSquare className="w-4 h-4" /> },
              { key: 'dateRange', label: 'Date Range', icon: <Calendar className="w-4 h-4" /> }
            ]}
            visibleFilterColumns={visibleFilterColumns}
            onFilterColumnsChange={setVisibleFilterColumns}
            filters={[]}
          />

        {/* Main Content - Card/List View */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-4 pt-2">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileText className="w-20 h-20 text-gray-300 dark:text-gray-600 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No notes found</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchQuery || tagFilter !== 'all' || projectFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Create your first note to get started'}
              </p>
              <CreateButton resource="notes">
                <Button
                  onClick={handleNewNote}
                  className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Your First Note</span>
                </Button>
              </CreateButton>
            </div>
          ) : viewMode === 'card' ? (
            /* Card View */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 pb-4">
              {filteredNotes.map(note => {
                const noteTags = note.tags || [];
                const noteAttachments = (() => {
                  const att = note.attachments;
                  if (Array.isArray(att)) return att as NoteAttachment[];
                  return [];
                })();

                return (
                  <div
                    key={note.id}
                    className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg w-full max-w-full overflow-hidden"
                    style={{
                      minHeight: '140px',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                    }}
                    onClick={() => openNoteModal(note)}
                  >
                    <div className="p-3 sm:p-4 space-y-1.5 sm:space-y-2 w-full">
                      {/* Header: Avatar + Title + Menu */}
                      <div className="flex items-start justify-between gap-2 w-full">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <div 
                              className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                            >
                              {(note.title || 'N').charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <h4 
                            className="font-medium text-gray-900 text-sm leading-tight truncate flex-1"
                            title={`Note Title: ${note.title || 'Untitled Note'}`}
                          >
                            {note.title || 'Untitled Note'}
                          </h4>
                        </div>
                        <div className="relative flex-shrink-0">
                          <button 
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            title="More options"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setOpenDropdown(openDropdown === note.id ? null : note.id); 
                            }}
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                          {openDropdown === note.id && (
                            <div 
                              data-dropdown-menu
                              className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-30" 
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button 
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 rounded-t-lg flex items-center gap-2 text-sm font-normal text-gray-800" 
                                onClick={(e) => {e.stopPropagation(); openNoteModal(note); setOpenDropdown(null);}}
                              >
                                <Eye className="w-4 h-4" />
                                <span>View</span>
                              </button>
                              <UpdateButton
                                resource="notes"
                                onClick={(e) => {e?.stopPropagation(); openNoteModal(note, true); setOpenDropdown(null);}}
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2 text-sm font-normal text-gray-800"
                              >
                                <Edit3 className="w-4 h-4" />
                                <span>Edit</span>
                              </UpdateButton>
                              <DeleteButton
                                resource="notes"
                                onClick={(e) => {e?.stopPropagation(); handleDeleteNote(note.id); setOpenDropdown(null);}}
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 rounded-b-lg flex items-center gap-2 text-sm font-normal text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </DeleteButton>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tags or Content Preview */}
                      {noteTags.length > 0 ? (
                        <div className="flex items-center flex-wrap gap-1.5">
                          {/* Mobile: Show only 1 tag */}
                          <div className="sm:hidden flex items-center gap-1.5">
                            <div className="tooltip-wrapper">
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium inline-block max-w-[55px] truncate">
                                {noteTags[0].trim()}
                              </span>
                              <div className="tooltip-content">Tag: {noteTags[0].trim()}</div>
                            </div>
                            {noteTags.length > 1 && (
                              <div className="tooltip-wrapper">
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                                  +{noteTags.length - 1}
                                </span>
                                <div className="tooltip-content">
                                  {noteTags.length - 1} more tags: {noteTags.slice(1).map(t => t.trim()).join(', ')}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Desktop: Show 2 tags */}
                          <div className="hidden sm:flex items-center gap-1.5">
                            {noteTags.slice(0, 2).map((tag, i) => (
                              <div key={i} className="tooltip-wrapper">
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                                  {tag.trim()}
                                </span>
                                <div className="tooltip-content">Tag: {tag.trim()}</div>
                              </div>
                            ))}
                            {noteTags.length > 2 && (
                              <div className="tooltip-wrapper">
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                                  +{noteTags.length - 2}
                                </span>
                                <div className="tooltip-content">
                                  {noteTags.length - 2} more tags: {noteTags.slice(2).map(t => t.trim()).join(', ')}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {note.content ? note.content.replace(/[#*`\[\]]/g, '').substring(0, 60) : 'No content'}
                          </p>
                        </div>
                      )}

                      {/* Status and Date - Two Lines */}
                      <div className="space-y-1.5 text-xs">
                        {/* Line 1: Status Only */}
                        <div className="flex items-center">
                          <div className="tooltip-wrapper">
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-800 font-semibold">Status:</span>
                              {note.isConvertedToTask ? (
                                <Badge variant="success" size="sm" className="text-xs">
                                  Task Created
                                </Badge>
                              ) : (
                                <Badge variant="default" size="sm" className="text-xs">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <div className="tooltip-content">
                              Current Status: {note.isConvertedToTask ? 'Task Created' : 'Active'}
                            </div>
                          </div>
                        </div>

                        {/* Line 2: Project, Attachments, Date - All on same line */}
                        <div className="flex items-center gap-2 sm:gap-3">
                          {/* Project with Label */}
                          {note.projectId && (
                            <div className="tooltip-wrapper flex-shrink-0">
                              <div className="flex items-center gap-1">
                                {/* <span className="text-gray-600 font-medium">Project:</span> */}
                                <div className="px-1.5 py-0.5 sm:px-2 bg-gray-100 text-gray-700 rounded-md font-medium text-xs truncate max-w-[80px] sm:max-w-none">
                                  {note.projectId}
                                </div>
                              </div>
                              <div className="tooltip-content">Project: {note.projectId}</div>
                            </div>
                          )}
                          
                          {/* Attachments - Desktop only (hidden on mobile) */}
                          {noteAttachments.length > 0 && (
                            <div className="tooltip-wrapper hide-on-mobile flex-shrink-0">
                              <div className="flex items-center gap-1 text-gray-600">
                                <Paperclip className="w-3.5 h-3.5" />
                                <span>{noteAttachments.length}</span>
                              </div>
                              <div className="tooltip-content">Attachments: {noteAttachments.length} file{noteAttachments.length > 1 ? 's' : ''}</div>
                            </div>
                          )}

                          {/* Updated Date */}
                          <div className="tooltip-wrapper flex-shrink-0 ml-auto">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              <span className="text-xs whitespace-nowrap">
                                {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <div className="tooltip-content">
                              Updated: {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View - Card Style like Tasks/Projects */
            <div className="space-y-3">
              {filteredNotes.map(note => {
                const noteTags = note.tags || [];
                const noteAttachments = (() => {
                  const att = note.attachments;
                  if (Array.isArray(att)) return att as NoteAttachment[];
                  return [];
                })();

                return (
                  <div
                    key={note.id}
                    onClick={() => openNoteModal(note)}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div 
                          className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        >
                          {(note.title || 'N').charAt(0).toUpperCase()}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Desktop: Title and Metadata on same line */}
                        <div className="hidden lg:flex items-center gap-3 mb-2 flex-wrap">
                          {/* Title */}
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            {note.title || 'Untitled Note'}
                          </h3>

                          {/* Metadata Items - on same line as title */}
                          {/* Project */}
                          {note.projectId && (
                            <div className="tooltip-wrapper">
                              <div className="flex items-center gap-1.5">
                                <span className="text-gray-800 dark:text-gray-300 font-semibold text-sm">Project:</span>
                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md font-medium text-xs">
                                  {note.projectId}
                                </span>
                              </div>
                              <div className="tooltip-content">Project: {note.projectId}</div>
                            </div>
                          )}

                          {/* Conversion Status */}
                          <div className="tooltip-wrapper">
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-800 dark:text-gray-300 font-semibold text-sm">Status:</span>
                              <Badge 
                                variant={note.isConvertedToTask ? "success" : "default"} 
                                size="sm"
                                className="text-xs"
                              >
                                {note.isConvertedToTask ? 'Converted' : 'Active'}
                              </Badge>
                            </div>
                            <div className="tooltip-content">
                              Current Status: {note.isConvertedToTask ? 'Converted to Task' : 'Active'}
                            </div>
                          </div>

                          {/* Attachments */}
                          {noteAttachments.length > 0 && (
                            <div className="tooltip-wrapper">
                              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-sm">
                                <Paperclip className="w-4 h-4" />
                                <span>{noteAttachments.length}</span>
                              </div>
                              <div className="tooltip-content">Attachments: {noteAttachments.length} file{noteAttachments.length > 1 ? 's' : ''}</div>
                            </div>
                          )}

                          {/* Tags */}
                          {noteTags.length > 0 && (
                            <div className="tooltip-wrapper">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-gray-800 dark:text-gray-300 font-semibold text-sm">Tags:</span>
                                {noteTags.slice(0, 2).map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-md text-xs font-medium"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {noteTags.length > 2 && (
                                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md text-xs">
                                    +{noteTags.length - 2}
                                  </span>
                                )}
                              </div>
                              <div className="tooltip-content">
                                Tags: {noteTags.map(t => t.trim()).join(', ')}
                              </div>
                            </div>
                          )}

                          {/* Author */}
                          {note.authorId && (
                            <div className="tooltip-wrapper">
                              <div className="flex items-center gap-1.5">
                                <span className="text-gray-800 dark:text-gray-300 font-semibold text-sm">Author:</span>
                                <span className="text-gray-600 dark:text-gray-400 text-sm">{note.authorId}</span>
                              </div>
                              <div className="tooltip-content">Note Author: {note.authorId}</div>
                            </div>
                          )}

                          {/* Date */}
                          <div className="tooltip-wrapper">
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-sm">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(note.updatedAt)}</span>
                            </div>
                            <div className="tooltip-content">
                              Updated: {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        </div>

                        {/* Mobile: Vertical stacked layout */}
                        <div className="lg:hidden space-y-1.5">
                          {/* Line 1: Title */}
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            {note.title || 'Untitled Note'}
                          </h3>

                          {/* Line 2: Description (truncated to 1 line) */}
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {note.content ? note.content.replace(/[#*`\[\]]/g, '').substring(0, 80) : 'No content'}
                          </p>

                          {/* Line 3: Status, Tags, Attachments, Date */}
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            {/* Status */}
                            <div className="tooltip-wrapper">
                              <Badge 
                                variant={note.isConvertedToTask ? "success" : "default"} 
                                size="sm"
                                className="text-xs"
                              >
                                {note.isConvertedToTask ? 'Converted' : 'Active'}
                              </Badge>
                              <div className="tooltip-content">
                                Current Status: {note.isConvertedToTask ? 'Converted to Task' : 'Active'}
                              </div>
                            </div>

                            {/* Tags */}
                            {noteTags.length > 0 && (
                              <>
                                {noteTags.slice(0, 1).map((tag, idx) => (
                                  <div key={idx} className="tooltip-wrapper">
                                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-md text-xs font-medium">
                                      {tag}
                                    </span>
                                    <div className="tooltip-content">Tag: {tag}</div>
                                  </div>
                                ))}
                                {noteTags.length > 1 && (
                                  <div className="tooltip-wrapper">
                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md text-xs">
                                      +{noteTags.length - 1}
                                    </span>
                                    <div className="tooltip-content">
                                      {noteTags.length - 1} more tags: {noteTags.slice(1).map(t => t.trim()).join(', ')}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Attachments */}
                            {noteAttachments.length > 0 && (
                              <div className="tooltip-wrapper">
                                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                  <Paperclip className="w-3 h-3" />
                                  <span>{noteAttachments.length}</span>
                                </div>
                                <div className="tooltip-content">Attachments: {noteAttachments.length} file{noteAttachments.length > 1 ? 's' : ''}</div>
                              </div>
                            )}

                            {/* Date */}
                            <div className="tooltip-wrapper">
                              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(note.updatedAt)}</span>
                              </div>
                              <div className="tooltip-content">
                                Last Updated: {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                              </div>
                            </div>
                          </div>

                          {/* Line 4: Author */}
                          {note.authorId && (
                            <div className="tooltip-wrapper">
                              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                <span className="font-semibold">Author:</span>
                                <span>{note.authorId}</span>
                              </div>
                              <div className="tooltip-content">Note Author: {note.authorId}</div>
                            </div>
                          )}
                        </div>

                        {/* Desktop Description - Below title and metadata */}
                        <p className="hidden lg:block text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {note.content ? note.content.replace(/[#*`\[\]]/g, '').substring(0, 100) : 'No content'}
                        </p>
                      </div>

                      {/* Three-dot menu */}
                      <div className="flex-shrink-0 relative">
                        <button 
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="More options"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setOpenDropdown(openDropdown === note.id ? null : note.id); 
                          }}
                        >
                          <MoreVertical className="w-5 h-5 text-gray-500" />
                        </button>
                        {openDropdown === note.id && (
                          <div 
                            data-dropdown-menu
                            className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30" 
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button 
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg flex items-center gap-2 text-sm font-normal text-gray-800 dark:text-gray-300" 
                              onClick={(e) => {e.stopPropagation(); openNoteModal(note); setOpenDropdown(null);}}
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </button>
                            <UpdateButton
                              resource="notes"
                              onClick={(e) => {e?.stopPropagation(); openNoteModal(note, true); setOpenDropdown(null);}}
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm font-normal text-gray-800 dark:text-gray-300"
                            >
                              <Edit3 className="w-4 h-4" />
                              <span>Edit</span>
                            </UpdateButton>
                            <DeleteButton
                              resource="notes"
                              onClick={(e) => {e?.stopPropagation(); handleDeleteNote(note.id); setOpenDropdown(null);}}
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-b-lg flex items-center gap-2 text-sm font-normal text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </DeleteButton>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>

        {/* Floating Action Button - Mobile Only (Hidden when modals are open) */}
        {!showNewNoteModal && !isNoteModalOpen && !showConvertModal && (
          <CreateButton resource="notes">
            <button
              onClick={handleNewNote}
              className="lg:hidden fixed bottom-20 right-6 z-50 w-14 h-14 bg-purple-600 hover:bg-purple-700 rounded-full shadow-lg flex items-center justify-center text-white transition-all hover:scale-110"
              aria-label="Create new note"
            >
              <Plus className="w-6 h-6" />
            </button>
          </CreateButton>
        )}
      </div>

      {/* Note View/Edit Modal */}
      {isNoteModalOpen && selectedNote && (
        <div 
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/70 bg-opacity-50"
          style={{ backdropFilter: 'blur(2px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseNoteModal();
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl lg:rounded-2xl w-full lg:max-w-3xl max-h-[90vh] lg:max-h-[80vh] lg:mx-4 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between gap-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="text-base sm:text-2xl font-bold border-none focus:outline-none focus:ring-0 dark:bg-gray-800 dark:text-white placeholder-gray-400 flex-1 min-w-0 pr-2"
                    placeholder="Note title..."
                  />
                ) : (
                  <h2 className="text-base sm:text-2xl font-bold text-gray-900 dark:text-white truncate flex-1 min-w-0">{formData.title}</h2>
                )}
                
                <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                  {!isEditing ? (
                    <>
                      {!selectedNote.isConvertedToTask && (
                        <UpdateButton
                          resource="notes"
                          onClick={() => {
                            console.log('🔄 Opening Convert to Task modal');
                            console.log('📝 Note data:', {
                              title: selectedNote.title,
                              tags: selectedNote.tags,
                              attachments: selectedNote.attachments,
                              projectId: selectedNote.projectId
                            });
                            console.log('👥 Available users:', allUsers.length);
                            console.log('👥 Available teams:', allTeams.length);
                            console.log('📁 Available projects:', allProjectsList.length);
                            // Close view notes modal before opening convert modal
                            setIsNoteModalOpen(false);
                            setShowConvertModal(true);
                          }}
                          className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg whitespace-nowrap"
                        >
                          <span className="hidden sm:inline">→ </span>
                          <span className="sm:hidden">→</span>
                          <span>Convert</span>
                        </UpdateButton>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={handleSaveNote}
                      className="px-2 sm:px-4 py-1.5 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs sm:text-base flex-shrink-0 whitespace-nowrap"
                    >
                      Save
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 sm:pb-6 scrollbar-hide">
              {isEditing ? (
                <div className="space-y-4">
                  {/* Enhanced Professional Markdown Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-gray-200 dark:border-gray-700">
                    {/* Left side - Formatting buttons */}
                    <div className="flex items-center space-x-1 flex-wrap">
                      {/* Text Formatting */}
                      <button onClick={() => insertMarkdown('**', '**', 'bold text')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Bold (Ctrl+B)">
                        <Bold className="w-4 h-4" />
                      </button>
                      <button onClick={() => insertMarkdown('*', '*', 'italic text')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Italic (Ctrl+I)">
                        <Italic className="w-4 h-4" />
                      </button>
                      <button onClick={() => insertMarkdown('~~', '~~', 'strikethrough')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Strikethrough">
                        <Strikethrough className="w-4 h-4" />
                      </button>
                      
                      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                      
                      {/* Heading Dropdown */}
                      <div className="relative" ref={headingDropdownRef}>
                        <button 
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
                                onClick={() => { insertHeading(level); setShowHeadingDropdown(false); }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                              >
                                <span className={`font-bold`} style={{ fontSize: `${20 - level}px` }}>H{level}</span> Heading {level}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <button onClick={insertBlockquote} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Blockquote">
                        <Quote className="w-4 h-4" />
                      </button>
                      
                      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                      
                      {/* Code */}
                      <button onClick={() => insertMarkdown('`', '`', 'code')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Inline Code">
                        <Code className="w-4 h-4" />
                      </button>
                      <button onClick={insertCodeBlock} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Code Block">
                        <Code2 className="w-4 h-4" />
                      </button>
                      
                      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                      
                      {/* Lists */}
                      <button onClick={() => insertMarkdown('- ', '', 'list item')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Unordered List">
                        <List className="w-4 h-4" />
                      </button>
                      <button onClick={() => insertMarkdown('1. ', '', 'list item')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Ordered List">
                        <ListOrdered className="w-4 h-4" />
                      </button>
                      <button onClick={insertTaskList} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Task List">
                        <CheckSquare className="w-4 h-4" />
                      </button>
                      
                      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                      
                      {/* Insert Elements */}
                      <button onClick={() => insertMarkdown('[', '](url)', 'link text')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Link">
                        <LinkIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => insertMarkdown('![', '](image-url)', 'alt text')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Image">
                        <ImageIcon className="w-4 h-4" />
                      </button>
                      <button onClick={insertTable} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Table">
                        <Table className="w-4 h-4" />
                      </button>
                      <button onClick={insertHorizontalRule} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Horizontal Rule">
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Right side - Edit/Preview toggle */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => setIsPreview(false)}
                        className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                          !isPreview 
                            ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-medium' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span className="text-sm">Edit</span>
                      </button>
                      <button
                        onClick={() => setIsPreview(true)}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                          isPreview 
                            ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">Preview</span>
                      </button>
                    </div>
                  </div>

                  {/* Content Editor / Preview */}
                  {!isPreview ? (
                    <textarea
                      id="markdown-editor"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full min-h-[300px] border border-gray-300 dark:border-gray-600 rounded-lg p-4 focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white resize-none"
                      placeholder="Start typing your note... (Markdown supported)"
                    />
                  ) : (
                    <div className="w-full min-h-[300px] max-h-[400px] overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                      <MarkdownRenderer content={formData.content} />
                    </div>
                  )}

                  {/* Tags and Project ID - Same Line */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tags Section */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tags</label>
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          placeholder="Add tag..."
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddTag();
                            }
                          }}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          onClick={handleAddTag}
                          className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {currentTags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          >
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-2 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Project ID */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Project ID</label>
                      <input
                        type="text"
                        value={formData.projectId}
                        onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Link to project..."
                      />
                    </div>
                  </div>

                  {/* Attachments */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Attachments</label>
                    
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center ${
                        dragActive 
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Drag and drop files here, or
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
                        disabled={uploadingFiles}
                      >
                        {uploadingFiles ? 'Uploading...' : 'Browse Files'}
                      </button>
                    </div>

                    {/* Show uploaded attachments and pending files */}
                    {(Array.isArray(formData.attachments) && formData.attachments.length > 0) || pendingFiles.length > 0 ? (
                      <div className="mt-2 sm:mt-3 space-y-2">
                        {/* Uploaded attachments */}
                        {formData.attachments.map((attachment, idx) => (
                          <div
                            key={`uploaded-${idx}`}
                            className="flex items-center justify-between px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <File className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <div className="min-w-0">
                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate block">
                                  {attachment.fileName}
                                </span>
                                <span className="text-xs text-green-600">
                                  {attachment.fileSize > 0 ? formatFileSize(attachment.fileSize) + ' • ' : ''}Uploaded
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePreviewAttachment(attachment);
                                }}
                                className="p-1 text-gray-400 hover:text-purple-600"
                                title="Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveAttachment(idx);
                                }}
                                className="p-1 text-gray-400 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        {/* Pending files (not yet uploaded) */}
                        {pendingFiles.map((file, idx) => (
                          <div
                            key={`pending-${idx}`}
                            className="flex items-center justify-between px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <File className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                              <div className="min-w-0">
                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate block">
                                  {file.name}
                                </span>
                                <span className="text-xs text-yellow-600">
                                  {formatFileSize(file.size)} • Will upload on save
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePendingFile(idx);
                              }}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Remove"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div>
                  {/* Preview Content */}
                  <div className="mb-6">
                    <MarkdownRenderer 
                      content={formData.content || selectedNote?.content || ''} 
                      className="text-base"
                    />
                  </div>

                  {/* Tags Display */}
                  {currentTags.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentTags.map((tag, idx) => (
                          <Badge key={idx} className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Attachments Display */}
                  {((Array.isArray(formData.attachments) && formData.attachments.length > 0) || pendingFiles.length > 0) && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Attachments</h4>
                      <div className="space-y-2">
                        {/* Uploaded attachments */}
                        {formData.attachments.map((attachment, idx) => (
                          <div
                            key={`uploaded-${idx}`}
                            className="flex items-center justify-between px-2 sm:px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                          >
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                              <File className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate">{attachment.fileName}</p>
                                <p className="text-xs text-green-600">
                                  {attachment.fileSize > 0 ? formatFileSize(attachment.fileSize) + ' • ' : ''}Uploaded
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <button
                                onClick={() => handlePreviewAttachment(attachment)}
                                className="p-1.5 sm:p-2 text-gray-400 hover:text-purple-600"
                                title="Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadAttachment(attachment)}
                                className="p-1.5 sm:p-2 text-gray-400 hover:text-green-600"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        {/* Pending files */}
                        {pendingFiles.map((file, idx) => (
                          <div
                            key={`pending-${idx}`}
                            className="flex items-center justify-between px-2 sm:px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                          >
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                              <File className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</p>
                                <p className="text-xs text-yellow-600">{formatFileSize(file.size)} • Will upload on save</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemovePendingFile(idx)}
                              className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 flex-shrink-0"
                              title="Remove"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Note Metadata */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                    <p>Created by {selectedNote.authorId} • {formatDate(selectedNote.createdAt)}</p>
                    <p>Last modified {formatDate(selectedNote.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* New Note Modal */}
      {showNewNoteModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/70 bg-opacity-50"
          style={{ backdropFilter: 'blur(2px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseNewNoteModal();
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl lg:rounded-2xl w-full lg:max-w-3xl max-h-[90vh] lg:max-h-[80vh] lg:mx-4 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Note</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Note title..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Content</label>
                {/* Enhanced Professional Markdown Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-gray-200 dark:border-gray-700 mb-3">
                  {/* Left side - Formatting buttons */}
                  <div className="flex items-center space-x-1 flex-wrap">
                    {/* Text Formatting */}
                    <button onClick={() => insertMarkdown('**', '**', 'bold text')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Bold (Ctrl+B)">
                      <Bold className="w-4 h-4" />
                    </button>
                    <button onClick={() => insertMarkdown('*', '*', 'italic text')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Italic (Ctrl+I)">
                      <Italic className="w-4 h-4" />
                    </button>
                    <button onClick={() => insertMarkdown('~~', '~~', 'strikethrough')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Strikethrough">
                      <Strikethrough className="w-4 h-4" />
                    </button>
                    
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                    
                    {/* Heading Dropdown */}
                    <div className="relative" ref={headingDropdownRef}>
                      <button 
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
                              onClick={() => { insertHeading(level); setShowHeadingDropdown(false); }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                            >
                              <span className={`font-bold`} style={{ fontSize: `${20 - level}px` }}>H{level}</span> Heading {level}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <button onClick={insertBlockquote} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Blockquote">
                      <Quote className="w-4 h-4" />
                    </button>
                    
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                    
                    {/* Code */}
                    <button onClick={() => insertMarkdown('`', '`', 'code')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Inline Code">
                      <Code className="w-4 h-4" />
                    </button>
                    <button onClick={insertCodeBlock} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Code Block">
                      <Code2 className="w-4 h-4" />
                    </button>
                    
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                    
                    {/* Lists */}
                    <button onClick={() => insertMarkdown('- ', '', 'list item')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Unordered List">
                      <List className="w-4 h-4" />
                    </button>
                    <button onClick={() => insertMarkdown('1. ', '', 'list item')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Ordered List">
                      <ListOrdered className="w-4 h-4" />
                    </button>
                    <button onClick={insertTaskList} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Task List">
                      <CheckSquare className="w-4 h-4" />
                    </button>
                    
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                    
                    {/* Insert Elements */}
                    <button onClick={() => insertMarkdown('[', '](url)', 'link text')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Link">
                      <LinkIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => insertMarkdown('![', '](image-url)', 'alt text')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Image">
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button onClick={insertTable} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Table">
                      <Table className="w-4 h-4" />
                    </button>
                    <button onClick={insertHorizontalRule} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Horizontal Rule">
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Right side - Edit/Preview toggle */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => setIsPreview(false)}
                      className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                        !isPreview 
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-medium' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-sm">Edit</span>
                    </button>
                    <button
                      onClick={() => setIsPreview(true)}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                        isPreview 
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-medium' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">Preview</span>
                    </button>
                  </div>
                </div>

                {/* Content Editor / Preview */}
                {!isPreview ? (
                  <textarea
                    id="markdown-editor"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full min-h-[300px] border border-gray-300 dark:border-gray-600 rounded-lg p-4 focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="Start typing... (Markdown supported)"
                  />
                ) : (
                  <div className="w-full min-h-[300px] max-h-[400px] overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                    <MarkdownRenderer content={formData.content} />
                  </div>
                )}
              </div>

              {/* Tags and Project ID - Same Line */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tags</label>
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      placeholder="Add tag..."
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button onClick={handleAddTag} className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentTags.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="ml-2 hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Project ID */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Project ID</label>
                  <input
                    type="text"
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Link to project..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Attachments</label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center ${
                    dragActive ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Drag files or</p>
                  <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg"
                    disabled={uploadingFiles}
                  >
                    {uploadingFiles ? 'Uploading...' : 'Browse Files'}
                  </button>
                </div>

                {/* Show uploaded attachments and pending files */}
                {((Array.isArray(formData.attachments) && formData.attachments.length > 0) || pendingFiles.length > 0) && (
                  <div className="mt-3 space-y-2">
                    {/* Uploaded attachments */}
                    {formData.attachments.map((attachment, idx) => (
                      <div 
                        key={`uploaded-${idx}`} 
                        className="flex items-center justify-between px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <File className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate block">{attachment.fileName}</span>
                            <span className="text-xs text-green-600">
                              {attachment.fileSize > 0 ? formatFileSize(attachment.fileSize) + ' • ' : ''}Uploaded
                            </span>
                          </div>
                        </div>
                        <button onClick={() => handleRemoveAttachment(idx)} className="p-1 text-gray-400 hover:text-red-600 flex-shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Pending files (not yet uploaded) */}
                    {pendingFiles.map((file, idx) => (
                      <div 
                        key={`pending-${idx}`} 
                        className="flex items-center justify-between px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <File className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate block">{file.name}</span>
                            <span className="text-xs text-yellow-600">{formatFileSize(file.size)} • Will upload on save</span>
                          </div>
                        </div>
                        <button onClick={() => handleRemovePendingFile(idx)} className="p-1 text-gray-400 hover:text-red-600 flex-shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Footer with Action Buttons */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 px-4 sm:px-6 py-4 sm:py-4 border-t border-gray-200 dark:border-gray-700 z-10 pb-24 sm:pb-6">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseNewNoteModal}
                  className="flex-1 sm:flex-none px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNote}
                  className="flex-1 sm:flex-none px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                >
                  Create Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Task Modal */}
      {showConvertModal && selectedNote && (() => {
        const taskData = {
          title: selectedNote.title,
          description: selectedNote.content,
          project: selectedNote.projectId || '',
          priority: 'Medium',
          status: 'To Do',
          tags: Array.isArray(selectedNote.tags) ? selectedNote.tags.join(', ') : '',
          attachments: getAttachmentFileIds(selectedNote.attachments),
          assignee: user?.email || user?.username || '',
          dueDate: '',
          startDate: new Date().toISOString().split('T')[0],
          estimatedHours: 0,
          subtasks: '[]',
          comments: '0',
          progress: 0,
          timeSpent: '0',
          parentId: null,
          assignedTeams: [],
          assignedUsers: [user?.email || user?.username || ''],
          id: '',
          createdAt: '',
          updatedAt: ''
        } as Task;
        
        console.log('🎯 TaskForm Data:', taskData);
        console.log('📋 Passing to TaskForm:', {
          projects: allProjectsList,
          users: allUsers,
          teams: allTeams
        });
        
        return (
          <div 
            className="fixed inset-0 bg-black/70 bg-opacity-50 z-40 flex items-end lg:items-center justify-center"
            style={{ backdropFilter: 'blur(2px)' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                console.log('🚪 Closing Convert to Task modal (clicked outside)');
                setShowConvertModal(false);
              }
            }}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-t-2xl lg:rounded-2xl shadow-2xl w-full lg:max-w-4xl lg:w-auto overflow-hidden"
              style={{ 
                width: '100%',
                height: '80vh',
                maxHeight: '90vh',
                boxShadow: '0 -10px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <TaskForm
                task={taskData}
              onSubmit={handleConvertToTask}
              onCancel={() => setShowConvertModal(false)}
              isEditing={false}
              projects={allProjectsList}
              teams={allTeams}
              users={allUsers}
              stories={[]}
              sprints={[]}
              currentUser={{
                userId: user?.email || user?.username || '',
                email: user?.email || '',
                name: user?.name || user?.username || '',
                username: user?.username || ''
              }}
            />
          </div>
        </div>
        );
      })()}

      {/* File Preview Modal */}
      {previewFile && (
        <div 
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/70 bg-opacity-50"
          style={{ backdropFilter: 'blur(2px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPreviewFile(null);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl lg:rounded-2xl p-6 w-full lg:max-w-4xl lg:mx-4 shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                  <Paperclip className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{previewFile.fileName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(() => {
                      const att = formData.attachments.find(a => a.fileName === previewFile.fileName);
                      if (att && att.fileSize > 0) {
                        return `${formatFileSize(att.fileSize)} • ${new Date(att.uploadedAt).toLocaleDateString()}`;
                      }
                      return 'File Preview';
                    })()}
                  </p>
                </div>
              </div>
              <button onClick={() => setPreviewFile(null)} className="p-2 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 max-h-[60vh] overflow-auto">
              {previewFile.fileType === 'image' ? (
                <div className="flex justify-center">
                  <img
                    src={previewFile.url}
                    alt={previewFile.fileName}
                    className="max-w-full max-h-[50vh] object-contain rounded-lg border border-gray-200 dark:border-gray-600"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-24 h-24 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-100 mb-4">
                    <Paperclip className="w-12 h-12 text-gray-400" />
                  </div>
                  <p className="text-gray-500">This file type cannot be previewed</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button onClick={() => setPreviewFile(null)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                Close
              </button>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = previewFile.url;
                  link.download = previewFile.fileName;
                  link.click();
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default NotesPage;
