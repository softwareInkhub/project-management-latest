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
  Building2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { StatsCard } from '../components/ui/StatsCard';
import { ViewToggle } from '../components/ui/ViewToggle';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { apiService, Department, Company } from '../services/api';

interface DepartmentWithCompany extends Department {
  companyName?: string;
}

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
  const [editingDepartment, setEditingDepartment] = useState<DepartmentWithCompany | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    companyId: '',
    tags: [] as string[],
    active: 'active'
  });
  const [tagInput, setTagInput] = useState('');

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

  // Filter departments
  const filteredDepartments = useMemo(() => {
    return departments.filter(dept => {
      const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           dept.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || dept.active === statusFilter;
      const matchesCompany = companyFilter === 'all' || dept.companyId === companyFilter;
      return matchesSearch && matchesStatus && matchesCompany;
    });
  }, [departments, searchTerm, statusFilter, companyFilter]);

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
      <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-7 h-7 text-white" />
                </div>
                Departments
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your company departments
              </p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Department
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total Departments"
            value={stats.total}
            icon={Briefcase}
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white"
          />
          <StatsCard
            title="Active"
            value={stats.active}
            icon={CheckCircle}
            className="bg-gradient-to-br from-green-500 to-green-600 text-white"
          />
          <StatsCard
            title="Inactive"
            value={stats.inactive}
            icon={XCircle}
            className="bg-gradient-to-br from-orange-500 to-orange-600 text-white"
          />
          <StatsCard
            title="Total Teams"
            value={stats.totalTeams}
            icon={Users}
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white"
          />
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search departments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Companies</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                <ViewToggle
                  currentView={viewMode}
                  views={[
                    {
                      value: 'list' as const,
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
                      value: 'card' as const,
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
                  ]}
                  onChange={(view) => setViewMode(view)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Departments List/Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No departments found</p>
            </CardContent>
          </Card>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDepartments.map((department) => (
              <Card key={department.id} className="group hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                          {department.name}
                        </h3>
                        <Badge variant={department.active === 'active' ? 'success' : 'default'}>
                          {department.active}
                        </Badge>
                      </div>
                    </div>
                    <div className="relative" ref={openMenuId === department.id ? menuRef : null}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === department.id ? null : department.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                      </button>
                      {openMenuId === department.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                          <button
                            onClick={() => handleEdit(department)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(department.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <Building2 className="w-4 h-4" />
                      <span>{department.companyName}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                      {department.description || 'No description'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{department.teams?.length || 0} teams</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(department.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {department.tags && department.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {department.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Teams
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredDepartments.map((department) => (
                      <tr key={department.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-lg flex items-center justify-center">
                              <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {department.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                {department.description || 'No description'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {department.companyName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={department.active === 'active' ? 'success' : 'default'}>
                            {department.active}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {department.teams?.length || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(department.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative inline-block" ref={openMenuId === department.id ? menuRef : null}>
                            <button
                              onClick={() => setOpenMenuId(openMenuId === department.id ? null : department.id)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-5 h-5 text-gray-500" />
                            </button>
                            {openMenuId === department.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                                <button
                                  onClick={() => handleEdit(department)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(department.id)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingDepartment ? 'Edit Department' : 'Add Department'}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter department name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company *
                  </label>
                  <select
                    required
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter department description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      placeholder="Add a tag"
                    />
                    <Button type="button" onClick={handleAddTag} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm flex items-center gap-2"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-purple-900 dark:hover:text-purple-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
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
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                  >
                    {editingDepartment ? 'Update Department' : 'Create Department'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default DepartmentsPage;

