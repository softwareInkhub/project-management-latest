'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Trash2, Copy, Check, Sparkles } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  category: 'task' | 'project' | 'team' | 'general';
  eventType: string;
  template: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

const NotificationTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'task' as Template['category'],
    eventType: '',
    template: '',
    variables: [] as string[]
  });

  const predefinedTemplates: Template[] = [
    {
      id: 'task-created',
      name: 'Task Assignment',
      category: 'task' as const,
      eventType: 'task_created',
      template: '🎯 New task assigned to you!\n\n📋 **{{task.title}}**\n👤 Project: {{project.name}}\n📅 Due: {{task.dueDate}}\n⭐ Priority: {{task.priority}}\n\nGood luck! 🚀',
      variables: ['task.title', 'task.assignee', 'task.dueDate', 'task.priority', 'project.name'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task-updated',
      name: 'Task Update',
      category: 'task' as const,
      eventType: 'task_updated',
      template: '📝 Task updated!\n\n📋 **{{task.title}}**\n🔄 Status: {{task.status}}\n👤 Assigned to: {{task.assignee}}\n📅 Due: {{task.dueDate}}\n\nProject: {{project.name}}',
      variables: ['task.title', 'task.status', 'task.assignee', 'task.dueDate', 'project.name'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'project-created',
      name: 'Project Launch',
      category: 'project' as const,
      eventType: 'project_created',
      template: '🚀 New project launched!\n\n📁 **{{project.name}}**\n📝 {{project.description}}\n👥 Team: {{team.name}}\n📅 Start: {{project.startDate}}\n\nLet\'s make it amazing! 💪',
      variables: ['project.name', 'project.description', 'team.name', 'project.startDate'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'project-updated',
      name: 'Project Update',
      category: 'project' as const,
      eventType: 'project_updated',
      template: '📁 Project updated!\n\n**{{project.name}}**\n📝 {{project.description}}\n👥 Team: {{team.name}}\n📊 Progress: {{project.progress}}%',
      variables: ['project.name', 'project.description', 'team.name', 'project.progress'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'team-assignment',
      name: 'Team Assignment',
      category: 'team' as const,
      eventType: 'team_created',
      template: '👥 Welcome to the team!\n\n🏢 **{{team.name}}**\n📝 {{team.description}}\n👤 Members: {{team.members}}\n\nLet\'s collaborate and achieve great things! 🤝',
      variables: ['team.name', 'team.description', 'team.members'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'deadline-reminder',
      name: 'Deadline Reminder',
      category: 'task' as const,
      eventType: 'task_deadline',
      template: '⏰ Deadline approaching!\n\n📋 **{{task.title}}**\n📅 Due: {{task.dueDate}}\n👤 Assigned to: {{task.assignee}}\n⭐ Priority: {{task.priority}}\n\nDon\'t forget to complete it! ⚡',
      variables: ['task.title', 'task.dueDate', 'task.assignee', 'task.priority'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      // In a real app, this would fetch from an API
      setTemplates(predefinedTemplates);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const newTemplate: Template = {
        id: editingTemplate?.id || Date.now().toString(),
        name: formData.name,
        category: formData.category,
        eventType: formData.eventType,
        template: formData.template,
        variables: formData.variables,
        createdAt: editingTemplate?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingTemplate) {
        setTemplates(templates.map(t => t.id === editingTemplate.id ? newTemplate : t));
      } else {
        setTemplates([...templates, newTemplate]);
      }

      // Reset form
      setFormData({
        name: '',
        category: 'task',
        eventType: '',
        template: '',
        variables: []
      });
      setIsCreating(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Failed to save template:', error);
    }
    setLoading(false);
  };

  const handleEdit = (template: Template) => {
    setFormData({
      name: template.name,
      category: template.category,
      eventType: template.eventType,
      template: template.template,
      variables: template.variables
    });
    setEditingTemplate(template);
    setIsCreating(true);
  };

  const handleDelete = async (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(templates.filter(t => t.id !== templateId));
    }
  };

  const handleCopy = async (template: Template) => {
    try {
      await navigator.clipboard.writeText(template.template);
      setCopiedId(template.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy template:', error);
    }
  };

  const handleUseTemplate = (template: Template) => {
    setFormData({
      name: template.name,
      category: template.category,
      eventType: template.eventType,
      template: template.template,
      variables: template.variables
    });
    setIsCreating(true);
  };

  const extractVariables = (template: string): string[] => {
    const matches = template.match(/\{\{([^}]+)\}\}/g);
    return matches ? matches.map(match => match.slice(2, -2)) : [];
  };

  const handleTemplateChange = (template: string) => {
    const variables = extractVariables(template);
    setFormData({ ...formData, template, variables });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'task':
        return '📋';
      case 'project':
        return '📁';
      case 'team':
        return '👥';
      case 'general':
        return '📝';
      default:
        return '📄';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'task':
        return 'bg-green-100 text-green-800';
      case 'project':
        return 'bg-blue-100 text-blue-800';
      case 'team':
        return 'bg-purple-100 text-purple-800';
      case 'general':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Message Templates</h3>
          <p className="text-sm text-gray-500">Pre-built templates for different notification types</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Create Template
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            selectedCategory === 'all' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Templates
        </button>
        {['task', 'project', 'team', 'general'].map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 rounded-full text-sm transition-colors capitalize ${
              selectedCategory === category 
                ? getCategoryColor(category)
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {getCategoryIcon(category)} {category}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getCategoryIcon(template.category)}</span>
                <h4 className="font-medium text-gray-900">{template.name}</h4>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopy(template)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Copy template"
                >
                  {copiedId === template.id ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <button
                  onClick={() => handleEdit(template)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit template"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete template"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(template.category)}`}>
                  {template.category}
                </span>
                <span className="text-xs text-gray-500">{template.eventType}</span>
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="line-clamp-3">{template.template}</p>
              </div>
              
              {template.variables.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {template.variables.slice(0, 3).map(variable => (
                    <span key={variable} className="text-xs px-1 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {`{{${variable}}}`}
                    </span>
                  ))}
                  {template.variables.length > 3 && (
                    <span className="text-xs text-gray-500">+{template.variables.length - 3} more</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleUseTemplate(template)}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
              >
                Use Template
              </button>
              <span className="text-xs text-gray-500">
                {new Date(template.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Form Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h3>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingTemplate(null);
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
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                    placeholder="e.g., Task Assignment Notification"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                  >
                    <option value="task">Task</option>
                    <option value="project">Project</option>
                    <option value="team">Team</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type
                </label>
                <input
                  type="text"
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                  placeholder="e.g., task_created, project_updated"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message Template
                </label>
                <textarea
                  value={formData.template}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                  rows={8}
                  placeholder="Enter your message template here..."
                />
                <div className="mt-2 text-xs text-gray-500">
                  <p className="font-medium">Available Variables:</p>
                  <div className="mt-1 space-y-1">
                    <p><strong>Task:</strong> {`{{task.title}}, {{task.assignee}}, {{task.status}}, {{task.priority}}, {{task.dueDate}}`}</p>
                    <p><strong>Project:</strong> {`{{project.name}}, {{project.description}}, {{project.team}}, {{project.startDate}}`}</p>
                    <p><strong>Team:</strong> {`{{team.name}}, {{team.description}}, {{team.members}}`}</p>
                    <p><strong>General:</strong> {`{{user.name}}, {{timestamp}}, {{event.type}}`}</p>
                  </div>
                </div>
              </div>

              {formData.variables.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Detected Variables
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formData.variables.map(variable => (
                      <span key={variable} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingTemplate(null);
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
                  {loading ? 'Saving...' : editingTemplate ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationTemplates;