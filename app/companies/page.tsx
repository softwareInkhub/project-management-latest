'use client';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, 
  MoreVertical, 
  Building2, 
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
  Briefcase,
  Settings
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { StatsCard } from '../components/ui/StatsCard';
import { SearchFilterSection } from '../components/ui/SearchFilterSection';
import { ViewToggle } from '../components/ui/ViewToggle';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { apiService, Company } from '../services/api';
import { CreateButton, UpdateButton, DeleteButton, ReadOnlyBadge, usePermissions } from '../components/RoleBasedUI';

const CompaniesPage = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
    tags: [] as string[],
    active: 'active'
  });
  const [tagInput, setTagInput] = useState('');

  // Fetch companies
  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getCompanies();
      if (response.success && response.data) {
        setCompanies(response.data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get unique tags from all companies
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    companies.forEach(company => {
      if (company.tags && Array.isArray(company.tags)) {
        company.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [companies]);

  // Handler for quick filter changes
  const handleQuickFilterChange = (key: string, value: string | string[] | { from: string; to: string }) => {
    setQuickFilterValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Filter companies
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      // Search filter
      const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           company.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter (from dropdown)
      const matchesStatus = statusFilter === 'all' || company.active === statusFilter;
      
      // Quick filter: Status
      const statusQuickFilter = quickFilterValues.status as string[];
      const matchesStatusQuick = !statusQuickFilter || statusQuickFilter.length === 0 || 
                                  statusQuickFilter.includes(company.active);
      
      // Quick filter: Tags
      const tagsQuickFilter = quickFilterValues.tags as string[];
      const matchesTags = !tagsQuickFilter || tagsQuickFilter.length === 0 ||
                         (company.tags && company.tags.some(tag => tagsQuickFilter.includes(tag)));
      
      // Quick filter: Date Range
      const dateRangeFilter = quickFilterValues.dateRange;
      let matchesDateRange = true;
      if (dateRangeFilter && dateRangeFilter !== 'all') {
        const companyDate = new Date(company.createdAt);
        const now = new Date();
        
        if (dateRangeFilter === 'today') {
          matchesDateRange = companyDate.toDateString() === now.toDateString();
        } else if (dateRangeFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDateRange = companyDate >= weekAgo;
        } else if (dateRangeFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDateRange = companyDate >= monthAgo;
        }
      }
      
      return matchesSearch && matchesStatus && matchesStatusQuick && matchesTags && matchesDateRange;
    });
  }, [companies, searchTerm, statusFilter, quickFilterValues]);

  // Stats
  const stats = useMemo(() => {
    const total = companies.length;
    const active = companies.filter(c => c.active === 'active').length;
    const inactive = companies.filter(c => c.active === 'inactive').length;
    const totalDepartments = companies.reduce((sum, c) => sum + (c.departments?.length || 0), 0);
    return { total, active, inactive, totalDepartments };
  }, [companies]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let response;
      if (editingCompany) {
        response = await apiService.updateCompany(editingCompany.id, formData);
      } else {
        response = await apiService.createCompany(formData);
      }
      
      if (response.success) {
        await fetchCompanies();
        setIsModalOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving company:', error);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company?')) return;
    
    try {
      const response = await apiService.deleteCompany(id);
      if (response.success) {
        await fetchCompanies();
      }
    } catch (error) {
      console.error('Error deleting company:', error);
    }
  };

  // Handle edit
  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      description: company.description,
      tags: company.tags || [],
      active: company.active
    });
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  // Handle view
  const handleView = (company: Company) => {
    setViewingCompany(company);
    setIsViewModalOpen(true);
    setOpenMenuId(null);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      tags: [],
      active: 'active'
    });
    setTagInput('');
    setEditingCompany(null);
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
      <div className="w-full h-full px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-4 overflow-x-hidden">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4">
          <StatsCard
            title="Total Companies"
            value={stats.total}
            icon={Building2}
            iconColor="blue"
            className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200"
          />
          <StatsCard
            title="Active"
            value={stats.active}
            icon={CheckCircle}
            iconColor="green"
            className="bg-gradient-to-r from-green-50 to-green-100 border-green-200"
          />
          <StatsCard
            title="Inactive"
            value={stats.inactive}
            icon={XCircle}
            iconColor="orange"
            className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200"
          />
          <StatsCard
            title="Total Departments"
            value={stats.totalDepartments}
            icon={Briefcase}
            iconColor="purple"
            className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200"
          />
        </div>

        {/* Search and Filters */}
        <SearchFilterSection
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search companies..."
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
                { value: 'week', label: 'Last 7 Days' },
                { value: 'month', label: 'Last 30 Days' }
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
            label: 'New Company',
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading companies...</p>
            </div>
          </div>
        )}

        {/* Card View */}
        {!isLoading && viewMode === 'card' && filteredCompanies.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-3 pb-4">
            {filteredCompanies.map((company) => (
              <Card key={company.id} hover className="relative cursor-pointer rounded-3xl border border-gray-300 hover:border-gray-400" onClick={() => handleView(company)}>
                <CardContent className="px-0 py-0 sm:px-2 sm:py-1 lg:px-2 lg:py-0">
                  <div className="space-y-1 sm:space-y-2 lg:space-y-1.5">
                    {/* Header with Company Icon and Name and Action Menu */}
                    <div className="flex items-center justify-between px-0 sm:px-0 -mt-0.5">
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-1 min-w-0 mr-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {(company.name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-xs sm:text-sm leading-tight truncate whitespace-nowrap">{company.name || 'Untitled Company'}</h4>
                          <p className="text-xs text-gray-600 mt-1 hidden sm:block truncate whitespace-nowrap overflow-hidden">{company.description || 'No description'}</p>
                        </div>
                      </div>
                      <div className="ml-2 -mr-1 flex-shrink-0 self-start relative" ref={openMenuId === company.id ? menuRef : null}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-0.5 h-10 w-10"
                          title="More options"
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === company.id ? null : company.id); }}
                        >
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                        {openMenuId === company.id && (
                          <div 
                            data-dropdown-menu
                            className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-30" 
                            onClick={(e)=>e.stopPropagation()}
                          >
                            <button className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-t-xl flex items-center gap-2 text-sm" onClick={(e)=>{e.stopPropagation(); handleView(company); setOpenMenuId(null);}}>
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </button>
                            <UpdateButton
                              resource="companies"
                              onClick={(e)=>{e.stopPropagation(); handleEdit(company); setOpenMenuId(null);}}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Edit</span>
                            </UpdateButton>
                            <DeleteButton
                              resource="companies"
                              onClick={(e)=>{e.stopPropagation(); handleDelete(company.id); setOpenMenuId(null);}}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-b-xl flex items-center gap-2 text-sm text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </DeleteButton>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="flex flex-row items-center justify-between gap-1 sm:gap-2 lg:gap-1.5">
                      <Badge variant={company.active === 'active' ? 'success' : 'default'} size="sm" className="text-[11px]">
                        {company.active}
                      </Badge>
                    </div>
                    
                    {/* Department Count */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs lg:text-[11px] text-gray-600">
                        <span>Departments</span>
                        <span className="font-medium">{company.departments?.length || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 bg-blue-500 rounded-full transition-all"
                          style={{ width: `${Math.min((company.departments?.length || 0) * 20, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Created Date */}
                    {company.createdAt && (
                      <div className="flex items-center space-x-2 text-xs lg:text-[11px] text-gray-600 min-w-0">
                        <Calendar size={8} className="sm:w-3 sm:h-3" />
                        <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                          {new Date(company.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    {/* Tags */}
                    {company.tags && company.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {company.tags.slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-[10px] rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                        {company.tags.length > 2 && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-[10px] rounded-full">
                            +{company.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* List View */}
        {!isLoading && viewMode === 'list' && filteredCompanies.length > 0 && (
          <div className="pt-0 sm:pt-3 md:pt-2 space-y-2 pb-4">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="relative px-3 py-3 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer shadow-sm"
                onClick={() => handleView(company)}
              >
                <div className="flex items-start gap-3">
                  {/* Company Icon/Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-base">
                      {(company.name || 'C').charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Company Details */}
                  <div className="flex-1 min-w-0 pr-8">
                    {/* Company Name */}
                    <h4 className="font-semibold text-gray-900 text-base truncate">
                      {company.name || 'Untitled Company'}
                    </h4>
                    
                    {/* Description */}
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {company.description || 'No description'}
                    </p>

                    {/* Badges and Meta Info */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant={company.active === 'active' ? 'success' : 'default'} size="sm">
                        {company.active}
                      </Badge>
                      <div className="flex items-center text-xs text-gray-500">
                        <Briefcase className="w-3 h-3 mr-1" />
                        {company.departments?.length || 0} departments
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(company.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Tags */}
                    {company.tags && company.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {company.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                   {/* Action Menu Button */}
                   <div className="absolute top-2 right-2 flex items-center z-20">
                     <div className="relative" ref={openMenuId === company.id ? menuRef : null}>
                       <Button
                         variant="ghost"
                         size="sm"
                         title="More Options"
                         className="p-2 h-8 w-10"
                         onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === company.id ? null : company.id); }}
                       >
                         <MoreVertical className="w-5 h-5" />
                      </Button>
                      {openMenuId === company.id && (
                        <div 
                          data-dropdown-menu
                          className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-30"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-t-xl flex items-center gap-2 text-sm" onClick={(e)=>{e.stopPropagation(); handleView(company); setOpenMenuId(null);}}>
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                          <UpdateButton
                            resource="companies"
                            onClick={(e)=>{e.stopPropagation(); handleEdit(company); setOpenMenuId(null);}}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </UpdateButton>
                          <DeleteButton
                            resource="companies"
                            onClick={(e)=>{e.stopPropagation(); handleDelete(company.id); setOpenMenuId(null);}}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-b-xl flex items-center gap-2 text-sm text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </DeleteButton>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredCompanies.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
            <Button onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}>Create New Company</Button>
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
                  {editingCompany ? 'Edit Company' : 'Add Company'}
                </h2>
              </div>

              <div className="flex-1 lg:flex-none overflow-y-auto lg:overflow-visible">
                <div className="p-4 sm:p-6 pb-0 space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter company description"
                  />
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
                      className="w-full px-2 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="flex-1 px-2 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-blue-900"
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
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {editingCompany ? 'Update Company' : 'Create Company'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {isViewModalOpen && viewingCompany && (
          <div 
            className="fixed inset-0 bg-black/70 flex items-end lg:items-center justify-center z-50 lg:p-4" 
            style={{ backdropFilter: 'blur(2px)' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsViewModalOpen(false);
                setViewingCompany(null);
              }
            }}
          >
            <div 
              className="bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl w-full lg:max-w-2xl h-[80vh] lg:h-auto lg:max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 rounded-t-2xl z-10 flex-shrink-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Company Details</h2>
              </div>

              <div className="flex-1 lg:flex-none overflow-y-auto lg:overflow-visible">
                <div className="p-4 sm:p-6 pb-0 space-y-4 sm:space-y-6">
                {/* Company Icon and Name */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl sm:text-2xl flex-shrink-0">
                    {(viewingCompany.name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-2xl font-bold text-gray-900">{viewingCompany.name}</h3>
                    <Badge variant={viewingCompany.active === 'active' ? 'success' : 'default'} size="sm" className="mt-1">
                      {viewingCompany.active}
                    </Badge>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                    {viewingCompany.description || 'No description provided'}
                  </p>
                </div>

                {/* Status and Created Date */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="bg-gray-50 px-2 sm:px-4 py-2 rounded-lg border border-gray-200">
                      <Badge variant={viewingCompany.active === 'active' ? 'success' : 'default'} size="sm">
                        {viewingCompany.active}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Created Date
                    </label>
                    <div className="flex items-center gap-1 sm:gap-2 bg-gray-50 px-2 sm:px-4 py-3 rounded-lg border border-gray-200 text-gray-900">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm truncate">
                        {new Date(viewingCompany.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Departments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departments
                  </label>
                  <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 text-gray-900">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{viewingCompany.departments?.length || 0}</span>
                    <span className="text-gray-600">department{viewingCompany.departments?.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Tags */}
                {viewingCompany.tags && viewingCompany.tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                      {viewingCompany.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
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
                      setIsViewModalOpen(false);
                      setViewingCompany(null);
                    }}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <UpdateButton
                    resource="companies"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleEdit(viewingCompany);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Company
                  </UpdateButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Button (Mobile only) */}
        <CreateButton
          resource="companies"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-all duration-200 hover:scale-110"
        >
          <Plus className="w-6 h-6" />
        </CreateButton>
      </div>
    </AppLayout>
  );
};

export default CompaniesPage;
