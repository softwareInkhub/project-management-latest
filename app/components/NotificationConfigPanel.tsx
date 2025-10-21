'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Users, Building2, CheckSquare, Settings, Plus, Edit, Trash2, Smartphone, MessageSquare, Globe } from 'lucide-react';

interface NotificationConfig {
  id: string;
  name: string;
  eventType: 'task_created' | 'task_updated' | 'task_deleted' | 'project_created' | 'project_updated' | 'project_deleted' | 'team_created' | 'team_updated' | 'team_deleted';
  entityType: 'task' | 'project' | 'team';
  recipients: {
    type: 'user' | 'team' | 'community' | 'all';
    ids: string[];
  };
  messageTemplate: string;
  active: boolean;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Team {
  id: string;
  name: string;
  members: User[];
}

interface Community {
  id: string;
  name: string;
  subgroups: string[];
}

const NotificationConfigPanel = () => {
  const [configs, setConfigs] = useState<NotificationConfig[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingConfig, setEditingConfig] = useState<NotificationConfig | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    eventType: 'task_created' as NotificationConfig['eventType'],
    entityType: 'task' as NotificationConfig['entityType'],
    recipientType: 'user' as 'user' | 'team' | 'community' | 'all',
    recipientIds: [] as string[],
    messageTemplate: '',
    active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch users, teams, communities, and existing configs
      // This would be replaced with actual API calls
      const mockUsers = [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        { id: '3', name: 'Bob Johnson', email: 'bob@example.com' }
      ];
      
      const mockTeams = [
        { id: '1', name: 'Development Team', members: mockUsers.slice(0, 2) },
        { id: '2', name: 'Design Team', members: mockUsers.slice(1) }
      ];
      
      const mockCommunities = [
        { id: '1', name: 'Project Updates', subgroups: ['announcements', 'discussions'] },
        { id: '2', name: 'Team Communications', subgroups: ['general', 'meetings'] }
      ];
      
      const mockConfigs = [
        {
          id: '1',
          name: 'Task Assignment Notifications',
          eventType: 'task_created' as const,
          entityType: 'task' as const,
          recipients: { type: 'user' as const, ids: ['1', '2'] },
          messageTemplate: 'New task assigned: {{task.title}}',
          active: true,
          createdAt: new Date().toISOString()
        }
      ];

      setUsers(mockUsers);
      setTeams(mockTeams);
      setCommunities(mockCommunities);
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
      case 'community':
        return <Globe size={16} className="text-purple-600" />;
      case 'all':
        return <MessageSquare size={16} className="text-orange-600" />;
      default:
        return <Bell size={16} className="text-gray-600" />;
    }
  };

  const getRecipientName = (type: string, ids: string[]) => {
    switch (type) {
      case 'user':
        return users.filter(u => ids.includes(u.id)).map(u => u.name).join(', ');
      case 'team':
        return teams.filter(t => ids.includes(t.id)).map(t => t.name).join(', ');
      case 'community':
        return communities.filter(c => ids.includes(c.id)).map(c => c.name).join(', ');
      case 'all':
        return 'All Users';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Notification Configuration</h2>
          <p className="text-sm text-gray-500">Configure notifications for tasks, projects, and teams</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Add Configuration
        </button>
      </div>

      {/* Configuration List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {configs.map((config) => (
          <div key={config.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getEventIcon(config.eventType)}
                <h3 className="font-medium text-gray-900">{config.name}</h3>
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
                <p className="text-xs text-gray-500 mt-1 truncate">{config.messageTemplate}</p>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingConfig ? 'Edit Configuration' : 'Create New Configuration'}
              </h3>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingConfig(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
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
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value as any })}
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
                  <option value="community">Community/Group</option>
                  <option value="all">All Users</option>
                </select>
              </div>

              {formData.recipientType !== 'all' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Recipients
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {formData.recipientType === 'user' && users.map(user => (
                      <label key={user.id} className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          checked={formData.recipientIds.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, recipientIds: [...formData.recipientIds, user.id] });
                            } else {
                              setFormData({ ...formData, recipientIds: formData.recipientIds.filter(id => id !== user.id) });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{user.name}</span>
                      </label>
                    ))}
                    {formData.recipientType === 'team' && teams.map(team => (
                      <label key={team.id} className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          checked={formData.recipientIds.includes(team.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, recipientIds: [...formData.recipientIds, team.id] });
                            } else {
                              setFormData({ ...formData, recipientIds: formData.recipientIds.filter(id => id !== team.id) });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{team.name}</span>
                      </label>
                    ))}
                    {formData.recipientType === 'community' && communities.map(community => (
                      <label key={community.id} className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          checked={formData.recipientIds.includes(community.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, recipientIds: [...formData.recipientIds, community.id] });
                            } else {
                              setFormData({ ...formData, recipientIds: formData.recipientIds.filter(id => id !== community.id) });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{community.name}</span>
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
                  rows={3}
                  placeholder="e.g., New {{entityType}} created: {{title}}"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available variables: {`{{entityType}}, {{title}}, {{assignee}}, {{priority}}, etc.`}
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

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingConfig(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
