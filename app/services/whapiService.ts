/**
 * WhatsApp API (WHAPI) Service for sending notifications
 */

import { extractPhoneNumber, isPhoneEmail } from '../utils/emailUtils';

export interface WhapiMessagePayload {
  to: string;
  body: string;
  typing_time?: number;
}

export interface WhapiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

class WhapiService {
  private baseUrl: string;
  private token: string;
  private enabled: boolean;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_WHAPI_BASE_URL || 'https://gate.whapi.cloud';
    this.token = process.env.NEXT_PUBLIC_WHAPI_TOKEN || '';
    this.enabled = !!this.token;
  }

  /**
   * Send WhatsApp message to a phone number
   */
  async sendMessage(phoneNumber: string, message: string): Promise<WhapiResponse> {
    if (!this.enabled) {
      console.warn('WHAPI service is not enabled - no token configured');
      return { success: false, error: 'WHAPI service not configured' };
    }

    try {
      // Clean phone number (remove any whitespace, special chars except +)
      const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
      
      const payload: WhapiMessagePayload = {
        to: cleanPhone,
        body: message,
        typing_time: 1
      };

      const response = await fetch(`${this.baseUrl}/messages/text`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: 'WhatsApp message sent successfully'
      };
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send notification to user if they have a phone-based email
   */
  async notifyUserIfPhoneEmail(
    userEmail: string | undefined | null,
    message: string
  ): Promise<WhapiResponse | null> {
    if (!userEmail || !isPhoneEmail(userEmail)) {
      return null; // Not a phone-based email, skip
    }

    const phoneNumber = extractPhoneNumber(userEmail);
    if (!phoneNumber) {
      console.error('Failed to extract phone number from email:', userEmail);
      return null;
    }

    console.log(`📱 Sending WhatsApp notification to ${phoneNumber}`);
    return await this.sendMessage(phoneNumber, message);
  }

  /**
   * Notify multiple users (filters for phone-based emails only)
   */
  async notifyUsers(
    users: Array<{ email?: string | null; name?: string | null }>,
    message: string
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const user of users) {
      if (user.email && isPhoneEmail(user.email)) {
        const result = await this.notifyUserIfPhoneEmail(user.email, message);
        if (result?.success) {
          sent++;
        } else {
          failed++;
        }
      }
    }

    return { sent, failed };
  }

  /**
   * Format a task assignment notification message
   */
  formatTaskAssignmentMessage(taskData: {
    title: string;
    project?: string;
    assignee?: string;
    dueDate?: string;
    priority?: string;
    description?: string;
  }): string {
    const lines = [
      '🎯 *New Task Assignment*',
      '',
      `📋 *Task:* ${taskData.title}`,
    ];

    if (taskData.project) {
      lines.push(`📁 *Project:* ${taskData.project}`);
    }

    if (taskData.assignee) {
      lines.push(`👤 *Assigned by:* ${taskData.assignee}`);
    }

    if (taskData.priority) {
      const priorityEmoji = taskData.priority === 'High' ? '🔴' : 
                           taskData.priority === 'Medium' ? '🟡' : '🟢';
      lines.push(`${priorityEmoji} *Priority:* ${taskData.priority}`);
    }

    if (taskData.dueDate) {
      lines.push(`📅 *Due:* ${taskData.dueDate}`);
    }

    if (taskData.description) {
      lines.push('', `📝 *Description:* ${taskData.description}`);
    }

    return lines.join('\n');
  }

  /**
   * Format a project assignment notification message
   */
  formatProjectAssignmentMessage(projectData: {
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    team?: string;
  }): string {
    const lines = [
      '📁 *Project Assignment*',
      '',
      `🏗️ *Project:* ${projectData.name}`,
    ];

    if (projectData.description) {
      lines.push(`📝 *Description:* ${projectData.description}`);
    }

    if (projectData.team) {
      lines.push(`👥 *Team:* ${projectData.team}`);
    }

    if (projectData.startDate) {
      lines.push(`📅 *Start:* ${projectData.startDate}`);
    }

    if (projectData.endDate) {
      lines.push(`🏁 *End:* ${projectData.endDate}`);
    }

    return lines.join('\n');
  }

  /**
   * Format a team assignment notification message
   */
  formatTeamAssignmentMessage(teamData: {
    name: string;
    description?: string;
    role?: string;
  }): string {
    const lines = [
      '👥 *Team Assignment*',
      '',
      `🏢 *Team:* ${teamData.name}`,
    ];

    if (teamData.description) {
      lines.push(`📝 *Description:* ${teamData.description}`);
    }

    if (teamData.role) {
      lines.push(`🎭 *Your Role:* ${teamData.role}`);
    }

    lines.push('', '✨ Welcome to the team!');

    return lines.join('\n');
  }

  /**
   * Format a sprint/story assignment notification message
   */
  formatSprintStoryAssignmentMessage(data: {
    title: string;
    type: 'sprint' | 'story';
    project?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }): string {
    const emoji = data.type === 'sprint' ? '🏃' : '📖';
    const typeLabel = data.type === 'sprint' ? 'Sprint' : 'Story';
    
    const lines = [
      `${emoji} *${typeLabel} Assignment*`,
      '',
      `📌 *${typeLabel}:* ${data.title}`,
    ];

    if (data.project) {
      lines.push(`📁 *Project:* ${data.project}`);
    }

    if (data.description) {
      lines.push(`📝 *Description:* ${data.description}`);
    }

    if (data.startDate) {
      lines.push(`📅 *Start:* ${data.startDate}`);
    }

    if (data.endDate) {
      lines.push(`🏁 *End:* ${data.endDate}`);
    }

    return lines.join('\n');
  }

  /**
   * Format a calendar event notification message
   */
  formatCalendarEventMessage(eventData: {
    title: string;
    start: string;
    end?: string;
    location?: string;
    description?: string;
  }): string {
    const lines = [
      '📅 *Calendar Event*',
      '',
      `📍 *Event:* ${eventData.title}`,
      `🕐 *Start:* ${eventData.start}`,
    ];

    if (eventData.end) {
      lines.push(`🕐 *End:* ${eventData.end}`);
    }

    if (eventData.location) {
      lines.push(`📍 *Location:* ${eventData.location}`);
    }

    if (eventData.description) {
      lines.push('', `📝 *Description:* ${eventData.description}`);
    }

    return lines.join('\n');
  }

  /**
   * Format a company/department assignment notification message
   */
  formatOrgAssignmentMessage(data: {
    name: string;
    type: 'company' | 'department';
    description?: string;
    role?: string;
  }): string {
    const emoji = data.type === 'company' ? '🏢' : '🏛️';
    const typeLabel = data.type === 'company' ? 'Company' : 'Department';
    
    const lines = [
      `${emoji} *${typeLabel} Assignment*`,
      '',
      `🏗️ *${typeLabel}:* ${data.name}`,
    ];

    if (data.description) {
      lines.push(`📝 *Description:* ${data.description}`);
    }

    if (data.role) {
      lines.push(`🎭 *Your Role:* ${data.role}`);
    }

    return lines.join('\n');
  }
}

export const whapiService = new WhapiService();

