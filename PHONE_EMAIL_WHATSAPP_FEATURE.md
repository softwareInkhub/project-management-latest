# Phone-Based Email & WhatsApp Notification Feature

## Overview

This document describes the implementation of phone-based email handling and automatic WhatsApp notifications for users with `@phone.brmh.in` email addresses.

## Features

### 1. Email Display Formatting

Users with email addresses ending in `@phone.brmh.in` will have this suffix hidden in the UI across the entire application.

**Example:**
- Database email: `+911234567890@phone.brmh.in`
- Displayed in UI: `+911234567890`

### 2. Automatic WhatsApp Notifications

When a user with a `@phone.brmh.in` email is assigned to any entity (task, project, team, sprint, story, calendar event, company, or department), they automatically receive a WhatsApp notification via WHAPI service.

## Implementation Details

### Core Utility Files

#### `/app/utils/emailUtils.ts`

Provides utility functions for handling phone-based emails:

- `formatEmailForDisplay(email)` - Removes `@phone.brmh.in` suffix for display
- `isPhoneEmail(email)` - Checks if email is phone-based
- `extractPhoneNumber(email)` - Extracts phone number from email
- `formatUserDisplayName(name, username, email)` - Smart display name formatting

#### `/app/services/whapiService.ts`

WhatsApp notification service with the following features:

- Sends WhatsApp messages via WHAPI API
- Formats messages for different entity types:
  - Task assignments
  - Project assignments
  - Team assignments
  - Sprint/Story assignments
  - Calendar events
  - Company/Department assignments
- Automatically filters and notifies only users with phone-based emails

#### `/app/services/notificationService.ts`

Enhanced notification service that:

- Integrates with existing notification system
- Automatically sends WhatsApp notifications to phone-based users
- Supports all entity types (tasks, projects, teams, sprints, stories, calendar, company, department)
- Maintains existing notification implementations

## Environment Variables Required

Add the following to your `.env.local` file:

```bash
# WhatsApp API (WHAPI) Configuration
NEXT_PUBLIC_WHAPI_BASE_URL=https://gate.whapi.cloud
NEXT_PUBLIC_WHAPI_TOKEN=your_whapi_bearer_token_here
```

**Note:** The WHAPI service will only be active if the token is configured. If not configured, the app will continue to work normally without WhatsApp notifications.

## UI Updates

The following UI components have been updated to use the new email formatting:

### Pages
- **Settings Page** (`/app/settings/page.tsx`) - Profile email display
- **Team Page** (`/app/team/page.tsx`) - Team member email displays
- **Task Page** (`/app/task/page.tsx`) - User assignment emails
- **Project Page** (`/app/project/page.tsx`) - Added email utility imports

### Components
- **Navigation** (`/app/components/Navigation.tsx`) - User email in navbar
- **Sidebar** (`/app/components/Sidebar.tsx`) - User email in sidebar

## WhatsApp Notification Integration

### Task Assignments

When a user is assigned to a task (via `handleAddUser` in task page):
1. Task assignment is saved to database
2. User object is retrieved
3. If user has phone-based email, WhatsApp notification is sent
4. Message includes: Task title, project, assignee, priority, due date, description

### Team Assignments

When a team is assigned to a task:
1. Team assignment is saved
2. All team members are retrieved
3. Phone-based email users receive WhatsApp notifications
4. Team-specific message format is used

### Message Formats

Each entity type has a custom message format:

#### Task Assignment
```
🎯 *New Task Assignment*

📋 *Task:* {title}
📁 *Project:* {project}
👤 *Assigned by:* {assignee}
🔴 *Priority:* {priority}
📅 *Due:* {dueDate}

📝 *Description:* {description}
```

#### Project Assignment
```
📁 *Project Assignment*

🏗️ *Project:* {name}
📝 *Description:* {description}
👥 *Team:* {team}
📅 *Start:* {startDate}
🏁 *End:* {endDate}
```

#### Team Assignment
```
👥 *Team Assignment*

🏢 *Team:* {name}
📝 *Description:* {description}
🎭 *Your Role:* {role}

✨ Welcome to the team!
```

## Usage Examples

### Example 1: User Registration

When creating a user with a phone-based email:

```typescript
const user = {
  name: "John Doe",
  email: "+911234567890@phone.brmh.in", // Phone-based email
  role: "member"
};

// In the UI, this will display as: +911234567890
// When assigned to tasks, WhatsApp notifications will be sent to +911234567890
```

### Example 2: Task Assignment

```typescript
// When a user with phone email is assigned to a task:
await handleAddUser(userId);

// Automatically:
// 1. Updates database
// 2. Sends WhatsApp notification if user has @phone.brmh.in email
// 3. Continues with existing notification implementations
```

### Example 3: Manual Notification

```typescript
import { notificationService } from './services/notificationService';

// Send notification for any event
await notificationService.notifyTaskEvent('assigned', taskData, [
  { email: '+911234567890@phone.brmh.in', name: 'John Doe' }
]);

// WhatsApp notification will be sent automatically
```

## Error Handling

The implementation includes comprehensive error handling:

1. **WHAPI Service Not Configured**: App continues normally, just skips WhatsApp notifications
2. **Invalid Phone Number**: Error logged, operation continues
3. **WHAPI API Failure**: Error logged, doesn't break main application flow
4. **Network Issues**: Errors are caught and logged, UI remains functional

## Testing Checklist

- [x] Email display hides `@phone.brmh.in` in Settings page
- [x] Email display hides `@phone.brmh.in` in Navigation
- [x] Email display hides `@phone.brmh.in` in Sidebar
- [x] Email display hides `@phone.brmh.in` in Team page
- [x] Task assignment sends WhatsApp notification
- [x] Team assignment sends WhatsApp notifications to all members
- [x] Project assignments handled through notification service
- [x] Sprint/Story assignments supported
- [x] Calendar event notifications supported
- [x] Company/Department assignments supported
- [ ] Integration testing with actual WHAPI service
- [ ] Load testing with multiple simultaneous notifications

## Future Enhancements

1. **Notification Preferences**: Allow users to opt-in/out of WhatsApp notifications
2. **Message Templates**: Admin configurable message templates
3. **Delivery Status**: Track WhatsApp message delivery status
4. **Retry Logic**: Implement retry mechanism for failed notifications
5. **Batch Notifications**: Group multiple assignments into single message
6. **Rich Media**: Support for images, documents in WhatsApp messages

## Troubleshooting

### WhatsApp Notifications Not Sending

1. Check that `NEXT_PUBLIC_WHAPI_TOKEN` is set in environment variables
2. Verify WHAPI service is accessible
3. Check browser console for error messages
4. Verify phone number format (should include country code with +)

### Email Display Still Showing @phone.brmh.in

1. Check that `formatEmailForDisplay` is being used in the component
2. Clear browser cache and reload
3. Verify email ends exactly with `@phone.brmh.in` (case sensitive)

### Notifications Sent to Wrong Numbers

1. Verify email format: `{phone_number}@phone.brmh.in`
2. Phone number must include country code (e.g., +91 for India)
3. Check user data in database

## Support

For issues or questions, please:
1. Check the console logs for detailed error messages
2. Verify environment variables are properly configured
3. Test with a single user before bulk operations
4. Contact the development team with error logs

## Version History

- **v1.0.0** (2025-11-10): Initial implementation
  - Email formatting utilities
  - WHAPI service integration
  - Notification service updates
  - UI component updates across all pages

