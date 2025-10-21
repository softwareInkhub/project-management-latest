# Notification Management System

This document describes the mobile-friendly notification management system implemented for the BRMH Project Management application.

## Overview

The notification system provides a comprehensive solution for managing WhatsApp notifications for project management events including:

- **Task Events**: Created, Updated, Deleted
- **Project Events**: Created, Updated, Deleted  
- **Team Events**: Created, Updated, Deleted

## Features

### 🎯 Mobile-First Design
- Responsive UI that works seamlessly on mobile devices
- Touch-friendly interface with intuitive navigation
- Mobile bottom navigation integration
- Collapsible sidebar for desktop users

### 📱 Notification Configuration
- **User-based notifications**: Send to specific users
- **Team-based notifications**: Send to team members
- **Community notifications**: Send to WhatsApp groups/communities
- **Broadcast notifications**: Send to all users

### 🔧 WHAPI Integration
- Full integration with WHAPI (WhatsApp API)
- Support for individual messages, group messages, and community announcements
- Test mode for development and testing
- Connection management with multiple WHAPI instances

### 📝 Template Management
- Pre-built templates for common events
- Custom template creation with variable support
- Template categories (Task, Project, Team, General)
- Copy and reuse functionality

### 🎛️ Event Triggers
- Automatic event detection for CRUD operations
- Configurable filters (HTTP method, table name, path)
- Namespace-based filtering
- Manual trigger execution for testing

## File Structure

```
app/
├── notifications/
│   └── page.tsx                 # Main notifications page
├── components/
│   ├── NotificationConfigPanel.tsx  # Configuration management
│   └── NotificationTemplates.tsx    # Template management
└── services/
    ├── notificationService.ts   # Core notification logic
    └── api.ts                   # Enhanced with notification integration
```

## Key Components

### 1. Notifications Page (`/notifications`)
- **Overview**: System overview and quick setup guide
- **WHAPI Config**: Connection management and testing
- **Triggers**: Event trigger configuration
- **Templates**: Message template management
- **Configuration**: User/team/community notification settings
- **Test Send**: Testing and debugging tools
- **Logs**: Delivery logs and status tracking

### 2. Notification Service
- Handles event processing and notification sending
- Integrates with existing API service
- Supports multiple recipient types
- Template variable replacement
- Error handling and logging

### 3. Configuration Panel
- Visual configuration management
- Drag-and-drop interface for setting up notifications
- Real-time preview of notification settings
- Bulk operations for multiple configurations

## Usage

### Setting Up Notifications

1. **Configure WHAPI Connection**
   - Navigate to `/notifications` → WHAPI Config
   - Add your WHAPI token and base URL
   - Test the connection

2. **Create Message Templates**
   - Go to Templates tab
   - Use pre-built templates or create custom ones
   - Use variables like `{{task.title}}`, `{{project.name}}`, etc.

3. **Configure Event Triggers**
   - Go to Triggers tab
   - Select event types (task_created, project_updated, etc.)
   - Choose recipients (users, teams, communities)
   - Set up filters and namespace tags

4. **Test Notifications**
   - Use the Test Send tab to test your configurations
   - Check logs for delivery status
   - Monitor notification performance

### Event Variables

The system supports the following template variables:

#### Task Variables
- `{{task.title}}` - Task title
- `{{task.assignee}}` - Assigned user
- `{{task.status}}` - Current status
- `{{task.priority}}` - Priority level
- `{{task.dueDate}}` - Due date
- `{{task.project}}` - Associated project

#### Project Variables
- `{{project.name}}` - Project name
- `{{project.description}}` - Project description
- `{{project.team}}` - Project team
- `{{project.startDate}}` - Start date
- `{{project.endDate}}` - End date

#### Team Variables
- `{{team.name}}` - Team name
- `{{team.description}}` - Team description
- `{{team.members}}` - Team members

#### General Variables
- `{{event.type}}` - Event type
- `{{timestamp}}` - Event timestamp
- `{{user.name}}` - User name

## API Integration

The notification system integrates seamlessly with the existing BRMH API:

- **Automatic Event Detection**: CRUD operations automatically trigger notifications
- **Backend Integration**: Uses `brmh.in/notify/` endpoints
- **Real-time Processing**: Notifications are sent immediately after events
- **Error Handling**: Failed notifications are logged for debugging

## Mobile Experience

The notification system is optimized for mobile use:

- **Touch-friendly Interface**: Large buttons and touch targets
- **Responsive Design**: Adapts to different screen sizes
- **Mobile Navigation**: Integrated with bottom navigation
- **Gesture Support**: Swipe and tap interactions
- **Offline Capability**: Works with cached data when offline

## Security & Privacy

- **Token Management**: Secure storage of WHAPI tokens
- **User Permissions**: Role-based access to notification settings
- **Data Privacy**: No sensitive data stored in notification logs
- **Test Mode**: Safe testing without sending real messages

## Troubleshooting

### Common Issues

1. **Notifications Not Sending**
   - Check WHAPI connection status
   - Verify token permissions
   - Check notification configuration is active

2. **Template Variables Not Working**
   - Ensure correct variable syntax: `{{variable.name}}`
   - Check that the event data contains the required fields
   - Use the Test Send feature to debug

3. **Mobile UI Issues**
   - Clear browser cache
   - Check responsive design settings
   - Ensure JavaScript is enabled

### Debug Tools

- **Test Send**: Test individual notifications
- **Logs Tab**: View delivery status and errors
- **Connection Test**: Verify WHAPI connectivity
- **Console Logs**: Detailed debugging information

## Future Enhancements

- **Scheduled Notifications**: Time-based notification delivery
- **Rich Media Support**: Images and documents in notifications
- **Advanced Filtering**: More sophisticated event filtering
- **Analytics Dashboard**: Notification performance metrics
- **Multi-language Support**: Localized notification templates

## Support

For technical support or feature requests, please refer to the main project documentation or contact the development team.
