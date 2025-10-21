'use client';

import { apiService } from './api';

export interface NotificationEvent {
  type: 'task_created' | 'task_updated' | 'task_deleted' | 'project_created' | 'project_updated' | 'project_deleted' | 'team_created' | 'team_updated' | 'team_deleted';
  entityType: 'task' | 'project' | 'team';
  entityId: string;
  data: any;
  timestamp: string;
}

export interface NotificationConfig {
  id: string;
  name: string;
  eventType: string;
  entityType: 'task' | 'project' | 'team';
  recipients: {
    type: 'user' | 'team' | 'community' | 'all';
    ids: string[];
  };
  messageTemplate: string;
  active: boolean;
  createdAt: string;
}

class NotificationService {
  private baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in';

  // Send notification for task events
  async notifyTaskEvent(eventType: 'created' | 'updated' | 'deleted', taskData: any): Promise<void> {
    const event: NotificationEvent = {
      type: `task_${eventType}` as any,
      entityType: 'task',
      entityId: taskData.id,
      data: taskData,
      timestamp: new Date().toISOString()
    };

    await this.sendNotification(event);
  }

  // Send notification for project events
  async notifyProjectEvent(eventType: 'created' | 'updated' | 'deleted', projectData: any): Promise<void> {
    const event: NotificationEvent = {
      type: `project_${eventType}` as any,
      entityType: 'project',
      entityId: projectData.id,
      data: projectData,
      timestamp: new Date().toISOString()
    };

    await this.sendNotification(event);
  }

  // Send notification for team events
  async notifyTeamEvent(eventType: 'created' | 'updated' | 'deleted', teamData: any): Promise<void> {
    const event: NotificationEvent = {
      type: `team_${eventType}` as any,
      entityType: 'team',
      entityId: teamData.id,
      data: teamData,
      timestamp: new Date().toISOString()
    };

    await this.sendNotification(event);
  }

  // Generic notification sender
  private async sendNotification(event: NotificationEvent): Promise<void> {
    try {
      // First, get active notification configurations for this event type
      const configs = await this.getNotificationConfigs(event.type);
      
      if (configs.length === 0) {
        console.log(`No notification configurations found for event type: ${event.type}`);
        return;
      }

      // Process each configuration
      for (const config of configs) {
        if (!config.active) continue;

        try {
          // Format the message using the template
          const message = this.formatMessage(config.messageTemplate, event);
          
          // Send notification based on recipient type
          await this.sendToRecipients(config.recipients, message, event);
          
          console.log(`Notification sent for ${event.type} to ${config.recipients.type}`);
        } catch (error) {
          console.error(`Failed to send notification for config ${config.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to process notification:', error);
    }
  }

  // Get notification configurations for a specific event type
  private async getNotificationConfigs(eventType: string): Promise<NotificationConfig[]> {
    try {
      // In a real implementation, this would fetch from your backend
      // For now, return mock data
      const mockConfigs: NotificationConfig[] = [
        {
          id: '1',
          name: 'Task Assignment Notifications',
          eventType: 'task_created',
          entityType: 'task',
          recipients: {
            type: 'user',
            ids: ['1', '2'] // Mock user IDs
          },
          messageTemplate: '🎯 New task created!\n\n📋 **{{task.title}}**\n👤 Assigned to: {{task.assignee}}\n📅 Due: {{task.dueDate}}\n⭐ Priority: {{task.priority}}',
          active: true,
          createdAt: new Date().toISOString()
        }
      ];

      return mockConfigs.filter(config => config.eventType === eventType);
    } catch (error) {
      console.error('Failed to fetch notification configs:', error);
      return [];
    }
  }

  // Format message template with event data
  private formatMessage(template: string, event: NotificationEvent): string {
    let message = template;
    
    // Replace common variables
    const variables: Record<string, string> = {
      '{{event.type}}': event.type,
      '{{event.timestamp}}': new Date(event.timestamp).toLocaleString(),
      '{{timestamp}}': new Date(event.timestamp).toLocaleString(),
    };

    // Add entity-specific variables
    if (event.entityType === 'task') {
      variables['{{task.title}}'] = event.data.title || 'Untitled Task';
      variables['{{task.assignee}}'] = event.data.assignee || 'Unassigned';
      variables['{{task.status}}'] = event.data.status || 'To Do';
      variables['{{task.priority}}'] = event.data.priority || 'Medium';
      variables['{{task.dueDate}}'] = event.data.dueDate ? new Date(event.data.dueDate).toLocaleDateString() : 'No due date';
      variables['{{task.project}}'] = event.data.project || 'No project';
    } else if (event.entityType === 'project') {
      variables['{{project.name}}'] = event.data.name || 'Untitled Project';
      variables['{{project.description}}'] = event.data.description || 'No description';
      variables['{{project.team}}'] = event.data.team || 'No team';
      variables['{{project.startDate}}'] = event.data.startDate ? new Date(event.data.startDate).toLocaleDateString() : 'No start date';
      variables['{{project.endDate}}'] = event.data.endDate ? new Date(event.data.endDate).toLocaleDateString() : 'No end date';
    } else if (event.entityType === 'team') {
      variables['{{team.name}}'] = event.data.name || 'Untitled Team';
      variables['{{team.description}}'] = event.data.description || 'No description';
      variables['{{team.members}}'] = event.data.members ? event.data.members.join(', ') : 'No members';
    }

    // Replace all variables in the template
    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return message;
  }

  // Send notification to recipients
  private async sendToRecipients(recipients: NotificationConfig['recipients'], message: string, event: NotificationEvent): Promise<void> {
    try {
      if (recipients.type === 'all') {
        // Send to all users - this would be implemented based on your user management system
        console.log('Sending notification to all users:', message);
        return;
      }

      if (recipients.type === 'user') {
        // Send to specific users
        for (const userId of recipients.ids) {
          await this.sendToUser(userId, message, event);
        }
      } else if (recipients.type === 'team') {
        // Send to team members
        for (const teamId of recipients.ids) {
          await this.sendToTeam(teamId, message, event);
        }
      } else if (recipients.type === 'community') {
        // Send to community/group
        for (const communityId of recipients.ids) {
          await this.sendToCommunity(communityId, message, event);
        }
      }
    } catch (error) {
      console.error('Failed to send to recipients:', error);
    }
  }

  // Send notification to a specific user
  private async sendToUser(userId: string, message: string, event: NotificationEvent): Promise<void> {
    try {
      // This would integrate with your notification system
      // For now, we'll use the existing WhatsApp notification system
      const response = await fetch(`${this.baseUrl}/notify/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: event.type,
          event: {
            type: event.type,
            method: 'POST',
            path: `/${event.entityType}s`,
            resource: 'notification_service',
            data: {
              message,
              userId,
              eventData: event.data
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send notification to user ${userId}`);
      }
    } catch (error) {
      console.error(`Failed to send notification to user ${userId}:`, error);
    }
  }

  // Send notification to team members
  private async sendToTeam(teamId: string, message: string, event: NotificationEvent): Promise<void> {
    try {
      // Get team members and send to each
      // This would integrate with your team management system
      console.log(`Sending notification to team ${teamId}:`, message);
    } catch (error) {
      console.error(`Failed to send notification to team ${teamId}:`, error);
    }
  }

  // Send notification to community/group
  private async sendToCommunity(communityId: string, message: string, event: NotificationEvent): Promise<void> {
    try {
      // This would integrate with your community/group system
      console.log(`Sending notification to community ${communityId}:`, message);
    } catch (error) {
      console.error(`Failed to send notification to community ${communityId}:`, error);
    }
  }

  // Test notification
  async testNotification(eventType: string, testData: any): Promise<void> {
    const event: NotificationEvent = {
      type: eventType as any,
      entityType: eventType.split('_')[0] as any,
      entityId: testData.id || 'test-id',
      data: testData,
      timestamp: new Date().toISOString()
    };

    await this.sendNotification(event);
  }
}

export const notificationService = new NotificationService();
