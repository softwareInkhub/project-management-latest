'use client';

import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Bell, Users, Building2, CheckSquare, Settings, Plus, Edit, Trash2, Smartphone, MessageSquare, Globe, Target, AlertCircle } from 'lucide-react';

interface NotificationConfig {
  id: string;
  name: string;
  eventType: 'task_created' | 'task_updated' | 'task_deleted' | 'project_created' | 'project_updated' | 'project_deleted' | 'team_created' | 'team_updated' | 'team_deleted';
  entityType: 'task' | 'project' | 'team';
  recipients: {
    type: 'user' | 'team' | 'project' | 'all';
    ids: string[];
  };
  messageTemplate: string;
  active: boolean;
  createdAt: string;
}

interface BRMHUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface BRMHTeam {
  id: string;
  name: string;
  members: BRMHUser[];
}

interface BRMHProject {
  id: string;
  name: string;
  team?: BRMHTeam;
}

const NotificationConfigPanel = () => {
  const [configs, setConfigs] = useState<NotificationConfig[]>([]);
  const [brmhUsers, setBrmhUsers] = useState<BRMHUser[]>([]);
  const [brmhTeams, setBrmhTeams] = useState<BRMHTeam[]>([]);
  const [brmhProjects, setBrmhProjects] = useState<BRMHProject[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingConfig, setEditingConfig] = useState<NotificationConfig | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    eventType: 'task_created' as NotificationConfig['eventType'],
    entityType: 'task' as NotificationConfig['entityType'],
    recipientType: 'user' as 'user' | 'team' | 'project' | 'all',
    recipientIds: [] as string[],
    messageTemplate: '',
    active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Allow parent to open the create modal via a window event
  useEffect(() => {
    const openHandler = () => setIsCreating(true);
    window.addEventListener('openNotificationConfigCreate', openHandler as any);
    return () => window.removeEventListener('openNotificationConfigCreate', openHandler as any);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch BRMH data via apiService using correct table names
      const [usersRes, teamsRes, projectsRes] = await Promise.all([
        apiService.getUsers(),
        apiService.getTeams(),
        apiService.getProjects()
      ]);

      if (usersRes.success && Array.isArray(usersRes.data)) setBrmhUsers(usersRes.data as any);
      if (teamsRes.success && Array.isArray(teamsRes.data)) setBrmhTeams(teamsRes.data as any);
      if (projectsRes.success && Array.isArray(projectsRes.data)) setBrmhProjects(projectsRes.data as any);

      // Mock existing configs for now
      const mockConfigs = [
        {
          id: '1',
          name: 'Task Assignment Notifications',
          eventType: 'task_created' as const,
          entityType: 'task' as const,
          recipients: { type: 'user' as const, ids: ['1', '2'] },
          messageTemplate: '🎯 New task assigned to you!\n\n📋 **{{task.title}}**\n👤 Project: {{project.name}}\n📅 Due: {{task.dueDate}}\n⭐ Priority: {{task.priority}}',
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Project Updates',
          eventType: 'project_updated' as const,
          entityType: 'project' as const,
          recipients: { type: 'team' as const, ids: ['1'] },
          messageTemplate: '📁 Project updated!\n\n**{{project.name}}**\n📝 {{project.description}}\n👥 Team: {{team.name}}',
          active: true,
          createdAt: new Date().toISOString()
        }
      ];

      setConfigs(mockConfigs);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const newConfig: NotificationConfig = {
        id: editingConfig?.id || Date.now().toString(),
        name: formData.name,
        eventType: formData.eventType,
        entityType: formData.entityType,
        recipients: {
          type: formData.recipientType,
          ids: formData.recipientIds
        },
        messageTemplate: formData.messageTemplate,
        active: formData.active,
        createdAt: editingConfig?.createdAt || new Date().toISOString()
      };

      if (editingConfig) {
        setConfigs(configs.map(c => c.id === editingConfig.id ? newConfig : c));
      } else {
        setConfigs([...configs, newConfig]);
      }

      // Reset form
      setFormData({
        name: '',
        eventType: 'task_created',
        entityType: 'task',
        recipientType: 'user',
        recipientIds: [],
        messageTemplate: '',
        active: true
      });
      setIsCreating(false);
      setEditingConfig(null);
    } catch (error) {
      console.error('Failed to save config:', error);
    }
    setLoading(false);
  };

  const handleEdit = (config: NotificationConfig) => {
    setFormData({
      name: config.name,
      eventType: config.eventType,
      entityType: config.entityType,
      recipientType: config.recipients.type,
      recipientIds: config.recipients.ids,
      messageTemplate: config.messageTemplate,
      active: config.active
    });
    setEditingConfig(config);
    setIsCreating(true);
  };

  const handleDelete = async (configId: string) => {
    if (confirm('Are you sure you want to delete this notification configuration?')) {
      setConfigs(configs.filter(c => c.id !== configId));
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'task_created':
      case 'task_updated':
      case 'task_deleted':
        return <CheckSquare size={16} className="text-green-600" />;
      case 'project_created':
      case 'project_updated':
      case 'project_deleted':
        return <Building2 size={16} className="text-blue-600" />;
      case 'team_created':
      case 'team_updated':
      case 'team_deleted':
        return <Users size={16} className="text-purple-600" />;
      default:
        return <Bell size={16} className="text-gray-600" />;
    }
  };

  const getRecipientIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users size={16} className="text-blue-600" />;
      case 'team':
        return <Users size={16} className="text-green-600" />;
      case 'project':
        return <Building2 size={16} className="text-purple-600" />;
      case 'all':
        return <MessageSquare size={16} className="text-orange-600" />;
      default:
        return <Bell size={16} className="text-gray-600" />;
    }
  };

  const getRecipientName = (type: string, ids: string[]) => {
    switch (type) {
      case 'user':
        return brmhUsers.filter(u => ids.includes(u.id)).map(u => u.name).join(', ');
      case 'team':
        return brmhTeams.filter(t => ids.includes(t.id)).map(t => t.name).join(', ');
      case 'project':
        return brmhProjects.filter(p => ids.includes(p.id)).map(p => p.name).join(', ');
      case 'all':
        return 'All Users';
      default:
        return 'Unknown';
    }
  };

  const getAvailableRecipients = () => {
    switch (formData.recipientType) {
      case 'user':
        return brmhUsers;
      case 'team':
        return brmhTeams;
      case 'project':
        return brmhProjects;
      default:
        return [];
    }
  };

  const getDefaultTemplate = () => {
    const templates = {
      task_created: '🎯 New task created!\n\n📋 **{{task.title}}**\n👤 Assigned to: {{task.assignee}}\n📅 Due: {{task.dueDate}}\n⭐ Priority: {{task.priority}}\n\nProject: {{project.name}}',
      task_updated: '📝 Task updated!\n\n📋 **{{task.title}}**\n🔄 Status: {{task.status}}\n👤 Assigned to: {{task.assignee}}\n📅 Due: {{task.dueDate}}',
      task_deleted: '🗑️ Task deleted!\n\n📋 **{{task.title}}**\n👤 Was assigned to: {{task.assignee}}\n📅 Due date was: {{task.dueDate}}',
      project_created: '🚀 New project launched!\n\n📁 **{{project.name}}**\n📝 Description: {{project.description}}\n👥 Team: {{team.name}}\n📅 Start: {{project.startDate}}',
      project_updated: '📁 Project updated!\n\n**{{project.name}}**\n📝 {{project.description}}\n👥 Team: {{team.name}}',
      project_deleted: '🗑️ Project deleted!\n\n📁 **{{project.name}}**\n📝 Description: {{project.description}}\n👥 Team: {{team.name}}',
      team_created: '👥 New team created!\n\n🏢 **{{team.name}}**\n📝 Description: {{team.description}}\n👤 Members: {{team.members}}',
      team_updated: '👥 Team updated!\n\n🏢 **{{team.name}}**\n📝 Description: {{team.description}}\n👤 Members: {{team.members}}',
      team_deleted: '🗑️ Team deleted!\n\n🏢 **{{team.name}}**\n📝 Description: {{team.description}}\n👤 Members: {{team.members}}',
    };
    return templates[formData.eventType] || '';
  };

  return (
    <div className="space-y-6">

      {/* Configuration List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {configs.map((config) => (
          <div key={config.id} className="bg-white border border-gray-300 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getEventIcon(config.eventType)}
                <h4 className="font-medium text-gray-900">{config.name}</h4>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(config)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(config.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">Event:</span>
                <span className="capitalize">{config.eventType.replace('_', ' ')}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {getRecipientIcon(config.recipients.type)}
                <span className="font-medium">Recipients:</span>
                <span className="truncate">{getRecipientName(config.recipients.type, config.recipients.ids)}</span>
              </div>
              
              <div className="text-sm text-gray-600">
                <span className="font-medium">Template:</span>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{config.messageTemplate}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-1 rounded-full ${
                config.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {config.active ? 'Active' : 'Inactive'}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(config.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Form Modal */}
      {isCreating && (
        <div
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4 bg-black/70 bg-opacity-50"
          style={{ backdropFilter: 'blur(2px)' }}
          onClick={() => {
            setIsCreating(false);
            setEditingConfig(null);
          }}
        >
          <div
            className="bg-white rounded-t-2xl lg:rounded-2xl w-full lg:w-auto max-w-2xl max-h-[90vh] overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingConfig ? 'Edit Configuration' : 'Create New Configuration'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Configuration Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                    placeholder="e.g., Task Assignment Notifications"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entity Type
                  </label>
                  <select
                    value={formData.entityType}
                    onChange={(e) => setFormData({ ...formData, entityType: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                  >
                    <option value="task">Task</option>
                    <option value="project">Project</option>
                    <option value="team">Team</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type
                </label>
                <select
                  value={formData.eventType}
                  onChange={(e) => {
                    const newEventType = e.target.value as any;
                    setFormData({ 
                      ...formData, 
                      eventType: newEventType,
                      messageTemplate: getDefaultTemplate()
                    });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                >
                  <option value={`${formData.entityType}_created`}>{formData.entityType} Created</option>
                  <option value={`${formData.entityType}_updated`}>{formData.entityType} Updated</option>
                  <option value={`${formData.entityType}_deleted`}>{formData.entityType} Deleted</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Type
                </label>
                <select
                  value={formData.recipientType}
                  onChange={(e) => setFormData({ ...formData, recipientType: e.target.value as any, recipientIds: [] })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                >
                  <option value="user">Specific Users</option>
                  <option value="team">Team Members</option>
                  <option value="project">Project Members</option>
                  <option value="all">All Users</option>
                </select>
              </div>

              {formData.recipientType !== 'all' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Recipients
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {getAvailableRecipients().map((item: any, index: number) => (
                      <label key={`${formData.recipientType}-${item?.id ?? index}`} className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          checked={formData.recipientIds.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, recipientIds: [...formData.recipientIds, item.id] });
                            } else {
                              setFormData({ ...formData, recipientIds: formData.recipientIds.filter(id => id !== item.id) });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{item.name}</span>
                        {item.email && <span className="text-xs text-gray-500">({item.email})</span>}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message Template
                </label>
                <textarea
                  value={formData.messageTemplate}
                  onChange={(e) => setFormData({ ...formData, messageTemplate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                  rows={4}
                  placeholder="Enter your message template here..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available variables: {`{{task.title}}, {{task.assignee}}, {{project.name}}, {{team.name}}, {{user.name}}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="active" className="text-sm text-gray-700">
                  Active
                </label>
              </div>

              <div className="sticky bottom-0 left-0 right-0 bg-white pt-2 pb-2 mt-2 flex justify-between gap-3 lg:static lg:bg-transparent lg:p-0 lg:mt-0 lg:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingConfig(null);
                  }}
                  className="px-4 py-2 lg:px-3 lg:py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-1 text-center lg:flex-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 lg:px-3 lg:py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex-1 text-center lg:flex-none"
                >
                  {loading ? 'Saving...' : editingConfig ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationConfigPanel;