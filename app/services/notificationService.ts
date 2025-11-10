'use client';

import { apiService } from './api';
import { whapiService } from './whapiService';
import { isPhoneEmail } from '../utils/emailUtils';

export interface NotificationEvent {
  type: 'task_created' | 'task_updated' | 'task_deleted' | 'task_assigned' | 'project_created' | 'project_updated' | 'project_deleted' | 'project_assigned' | 'team_created' | 'team_updated' | 'team_deleted' | 'team_assigned' | 'sprint_created' | 'sprint_assigned' | 'story_created' | 'story_assigned' | 'calendar_event_created' | 'calendar_event_assigned' | 'company_assigned' | 'department_assigned';
  entityType: 'task' | 'project' | 'team' | 'sprint' | 'story' | 'calendar' | 'company' | 'department';
  entityId: string;
  data: any;
  timestamp: string;
  assignedUsers?: Array<{ email?: string; name?: string; id?: string; userId?: string }>;
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

  // Send notification for task events with WhatsApp support
  async notifyTaskEvent(eventType: 'created' | 'updated' | 'deleted' | 'assigned', taskData: any, assignedUsers?: Array<{ email?: string; name?: string; id?: string; userId?: string }>): Promise<void> {
    const event: NotificationEvent = {
      type: `task_${eventType}` as any,
      entityType: 'task',
      entityId: taskData.id,
      data: taskData,
      timestamp: new Date().toISOString(),
      assignedUsers
    };

    await this.sendNotification(event);

    // Send WhatsApp notifications to phone-based users
    if (assignedUsers && assignedUsers.length > 0) {
      await this.sendWhatsAppToPhoneUsers(assignedUsers, 'task', taskData);
    }
  }

  // Send notification for project events with WhatsApp support
  async notifyProjectEvent(eventType: 'created' | 'updated' | 'deleted' | 'assigned', projectData: any, assignedUsers?: Array<{ email?: string; name?: string; id?: string; userId?: string }>): Promise<void> {
    const event: NotificationEvent = {
      type: `project_${eventType}` as any,
      entityType: 'project',
      entityId: projectData.id,
      data: projectData,
      timestamp: new Date().toISOString(),
      assignedUsers
    };

    await this.sendNotification(event);

    // Send WhatsApp notifications to phone-based users
    if (assignedUsers && assignedUsers.length > 0) {
      await this.sendWhatsAppToPhoneUsers(assignedUsers, 'project', projectData);
    }
  }

  // Send notification for team events with WhatsApp support
  async notifyTeamEvent(eventType: 'created' | 'updated' | 'deleted' | 'assigned', teamData: any, assignedUsers?: Array<{ email?: string; name?: string; id?: string; userId?: string }>): Promise<void> {
    const event: NotificationEvent = {
      type: `team_${eventType}` as any,
      entityType: 'team',
      entityId: teamData.id,
      data: teamData,
      timestamp: new Date().toISOString(),
      assignedUsers
    };

    await this.sendNotification(event);

    // Send WhatsApp notifications to phone-based users
    if (assignedUsers && assignedUsers.length > 0) {
      await this.sendWhatsAppToPhoneUsers(assignedUsers, 'team', teamData);
    }
  }

  // Send notification for sprint/story events
  async notifySprintStoryEvent(eventType: 'created' | 'assigned', type: 'sprint' | 'story', data: any, assignedUsers?: Array<{ email?: string; name?: string; id?: string; userId?: string }>): Promise<void> {
    const event: NotificationEvent = {
      type: `${type}_${eventType}` as any,
      entityType: type,
      entityId: data.id,
      data,
      timestamp: new Date().toISOString(),
      assignedUsers
    };

    await this.sendNotification(event);

    // Send WhatsApp notifications to phone-based users
    if (assignedUsers && assignedUsers.length > 0) {
      await this.sendWhatsAppToPhoneUsers(assignedUsers, type, data);
    }
  }

  // Send notification for calendar events
  async notifyCalendarEvent(eventType: 'created' | 'assigned', eventData: any, assignedUsers?: Array<{ email?: string; name?: string; id?: string; userId?: string }>): Promise<void> {
    const event: NotificationEvent = {
      type: `calendar_event_${eventType}` as any,
      entityType: 'calendar',
      entityId: eventData.id,
      data: eventData,
      timestamp: new Date().toISOString(),
      assignedUsers
    };

    await this.sendNotification(event);

    // Send WhatsApp notifications to phone-based users
    if (assignedUsers && assignedUsers.length > 0) {
      await this.sendWhatsAppToPhoneUsers(assignedUsers, 'calendar', eventData);
    }
  }

  // Send notification for company/department assignments
  async notifyOrgAssignment(type: 'company' | 'department', data: any, assignedUsers?: Array<{ email?: string; name?: string; id?: string; userId?: string }>): Promise<void> {
    const event: NotificationEvent = {
      type: `${type}_assigned` as any,
      entityType: type,
      entityId: data.id,
      data,
      timestamp: new Date().toISOString(),
      assignedUsers
    };

    await this.sendNotification(event);

    // Send WhatsApp notifications to phone-based users
    if (assignedUsers && assignedUsers.length > 0) {
      await this.sendWhatsAppToPhoneUsers(assignedUsers, type, data);
    }
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

  // Send WhatsApp notifications to users with phone-based emails
  private async sendWhatsAppToPhoneUsers(
    users: Array<{ email?: string; name?: string; id?: string; userId?: string }>,
    entityType: 'task' | 'project' | 'team' | 'sprint' | 'story' | 'calendar' | 'company' | 'department',
    data: any
  ): Promise<void> {
    try {
      // Filter users with phone-based emails
      const phoneUsers = users.filter(user => user.email && isPhoneEmail(user.email));
      
      if (phoneUsers.length === 0) {
        return; // No phone-based users to notify
      }

      console.log(`📱 Sending WhatsApp notifications to ${phoneUsers.length} phone-based users`);

      // Format message based on entity type
      let message = '';
      
      switch (entityType) {
        case 'task':
          message = whapiService.formatTaskAssignmentMessage({
            title: data.title || data.name || 'New Task',
            project: data.project || data.projectName,
            assignee: data.createdBy || data.assignedBy || 'Team',
            dueDate: data.dueDate ? new Date(data.dueDate).toLocaleDateString() : undefined,
            priority: data.priority,
            description: data.description
          });
          break;

        case 'project':
          message = whapiService.formatProjectAssignmentMessage({
            name: data.name || data.title || 'New Project',
            description: data.description,
            startDate: data.startDate ? new Date(data.startDate).toLocaleDateString() : undefined,
            endDate: data.endDate ? new Date(data.endDate).toLocaleDateString() : undefined,
            team: data.team || data.teamName
          });
          break;

        case 'team':
          message = whapiService.formatTeamAssignmentMessage({
            name: data.name || 'New Team',
            description: data.description,
            role: data.role
          });
          break;

        case 'sprint':
        case 'story':
          message = whapiService.formatSprintStoryAssignmentMessage({
            title: data.title || data.name || `New ${entityType}`,
            type: entityType,
            project: data.project || data.projectName,
            startDate: data.startDate ? new Date(data.startDate).toLocaleDateString() : undefined,
            endDate: data.endDate ? new Date(data.endDate).toLocaleDateString() : undefined,
            description: data.description
          });
          break;

        case 'calendar':
          message = whapiService.formatCalendarEventMessage({
            title: data.title || data.summary || 'New Event',
            start: data.start ? new Date(data.start).toLocaleString() : new Date().toLocaleString(),
            end: data.end ? new Date(data.end).toLocaleString() : undefined,
            location: data.location,
            description: data.description
          });
          break;

        case 'company':
        case 'department':
          message = whapiService.formatOrgAssignmentMessage({
            name: data.name || `New ${entityType}`,
            type: entityType,
            description: data.description,
            role: data.role
          });
          break;
      }

      // Send WhatsApp message to each phone-based user
      const results = await whapiService.notifyUsers(phoneUsers, message);
      
      console.log(`📱 WhatsApp notifications sent: ${results.sent} success, ${results.failed} failed`);
    } catch (error) {
      console.error('Failed to send WhatsApp notifications to phone users:', error);
      // Don't throw - we don't want WhatsApp failures to break the main flow
    }
  }
}

export const notificationService = new NotificationService();
