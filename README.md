# Project Management System

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.5.6-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![License](https://img.shields.io/badge/License-Private-red?style=for-the-badge)

**A modern, full-featured project management platform built with Next.js 15 and React 19**

[Features](#-features) • [Installation](#-installation) • [Documentation](#-documentation) • [Architecture](#-architecture) • [API](#-api-integration)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Architecture](#-architecture)
- [API Integration](#-api-integration)
- [Role-Based Access Control](#-role-based-access-control-rbac)
- [Integrations](#-integrations)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [Support](#-support)

---

## Overview

**BRMH Project Management System** is a comprehensive, enterprise-grade project management platform designed for modern teams. Built with cutting-edge technologies, it provides a seamless experience for managing projects, tasks, teams, and organizational structures with real-time notifications and calendar integrations.

### Key Highlights

- 🎯 **Complete Project Lifecycle Management** - From planning to execution
- 👥 **Team & Organizational Hierarchy** - Companies, Departments, Teams
- 📊 **Real-time Analytics Dashboard** - Visualize project metrics
- 🔐 **Enterprise-Grade Security** - SSO, RBAC, Token-based Auth
- 📱 **Mobile-First Design** - Responsive UI for all devices
- 🔔 **Smart Notifications** - WhatsApp integration via WHAPI
- 📅 **Calendar Integration** - Google Calendar with Meet links
- 🎨 **Modern UI/UX** - Beautiful, intuitive interface

---

## ✨ Features

### Core Features

#### 1. **Dashboard & Analytics**
- Real-time project and task statistics
- Interactive charts and visualizations (Recharts)
- Quick access to recent activities
- Performance metrics and KPIs
- Custom widgets and layouts

#### 2. **Project Management**
- Create, update, and track projects
- Project status tracking (Planning, In Progress, Completed)
- Priority management (Low, Medium, High)
- Project timelines and milestones
- Advanced filtering and search
- Bulk operations support

#### 3. **Task Management**
- Comprehensive task creation and assignment
- Task status workflow (To Do, In Progress, Review, Done)
- Priority levels and due dates
- File attachments via Drive API
- Task dependencies and relationships
- Sprint planning support

#### 4. **Sprint Stories**
- Agile sprint planning
- User story creation and management
- Sprint backlog management
- Story point estimation
- Sprint retrospectives

#### 5. **Team Management**
- Team creation and organization
- Member assignment and roles
- Team performance tracking
- Collaboration tools
- Team-based permissions

#### 6. **Organizational Structure**
- **Companies**: Top-level organizational entities
- **Departments**: Departmental organization within companies
- **Teams**: Working groups within departments
- Hierarchical view and management
- Active/Inactive status tracking

### Advanced Features

#### 7. **Role-Based Access Control (RBAC)**
- **4 Role Types**: Super Admin, Admin, Manager, User
- Granular permission system
- Feature-level access control
- UI components automatically adapt to user roles
- Backend validation and enforcement

**Roles & Permissions:**
| Role | Permissions |
|------|-------------|
| **Super Admin** | Full access to all features including role management |
| **Admin** | Full access except role management |
| **Manager** | Read all + limited create/update on tasks and projects |
| **User** | Read-only access (default) |

#### 8. **Authentication & Security**
- Single Sign-On (SSO) integration
- Token-based authentication
- OAuth 2.0 with PKCE flow
- Session management
- Secure token storage
- Auto-redirect for unauthenticated users

#### 9. **Google Calendar Integration**
- OAuth 2.0 authentication
- Create events with Google Meet links
- Automatic event synchronization
- Month view calendar
- Event management (create, view)
- Mobile-responsive calendar UI

#### 10. **Notification System**
- WhatsApp notifications via WHAPI
- Configurable notification triggers
- Event-based notifications (Task, Project, Team events)
- Custom message templates with variables
- Multiple recipient types:
  - User-based notifications
  - Team-based notifications
  - Community/Group notifications
  - Broadcast notifications
- Delivery logs and status tracking
- Test mode for development

#### 11. **File Management**
- File upload and storage via Drive API
- Multiple file type support
- File download with presigned URLs
- File tagging and organization
- Task-level file attachments
- Secure file access control

#### 12. **Mobile Experience**
- Responsive design for all screen sizes
- Mobile bottom navigation
- Touch-optimized interface
- Offline capability (cached data)
- Mobile-friendly forms and modals
- Gesture support

#### 13. **Theme Support**
- Light/Dark mode toggle
- System preference detection
- Persistent theme settings
- Consistent theming across components

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js 15.5.6](https://nextjs.org/) (App Router)
- **UI Library**: [React 19.1.0](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [TailwindCSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Build Tool**: [Turbopack](https://turbo.build/pack)

### Backend & Infrastructure
- **Database**: DynamoDB (AWS)
- **API**: BRMH API (https://brmh.in)
- **Authentication**: Token-based auth with SSO
- **File Storage**: Drive API
- **Notifications**: WHAPI (WhatsApp API)
- **Calendar**: Google Calendar API
- **Deployment**: Vercel

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Version Control**: Git

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: >= 20.x
- **npm**: >= 10.x
- **Git**: Latest version

### External Services (Required)
- Google Cloud Console account (for Calendar API)
- WHAPI account (for WhatsApp notifications)
- Access to BRMH API backend

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd project-management-latest
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Google Calendar API
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# Drive API Configuration
NEXT_PUBLIC_DRIVE_API_URL=http://localhost:3000
NEXT_PUBLIC_DRIVE_NAMESPACE_ID=ns_project_management
NEXT_PUBLIC_DRIVE_NAMESPACE_NAME=ProjectManagement

# BRMH API (Optional - if different from default)
NEXT_PUBLIC_API_URL=https://brmh.in

# WHAPI Configuration (Optional - configured in UI)
# Configured through the Notifications page UI
```

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 5. Build for Production

```bash
npm run build
npm start
```

---

## ⚙️ Configuration

### Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Calendar API**
4. Create **OAuth 2.0 credentials**
5. Add authorized redirect URI: `http://localhost:3000/oauth2callback`
6. Copy Client ID and Client Secret to `.env.local`

📖 **Detailed Guide**: See [GOOGLE_CALENDAR_SETUP.md](./GOOGLE_CALENDAR_SETUP.md)

### WHAPI Notification Setup

1. Sign up at [WHAPI](https://whapi.cloud/)
2. Get your API token
3. Navigate to **Notifications** page in the app
4. Configure WHAPI connection in the UI
5. Create message templates
6. Set up event triggers

📖 **Detailed Guide**: See [NOTIFICATION_SYSTEM.md](./NOTIFICATION_SYSTEM.md)

### Drive API Setup

The Drive API is used for file attachments:

1. Set `NEXT_PUBLIC_DRIVE_API_URL` to your Drive API endpoint
2. Configure namespace ID and name
3. Ensure user authentication is working

📖 **Detailed Guide**: See [ENV_SETUP.md](./ENV_SETUP.md)

### Role-Based Access Control

Roles are fetched from the backend API:

- **Endpoint**: `https://brmh.in/namespace-roles/:userId/projectmanagement`
- **Default Role**: `user` (read-only)
- **Role Assignment**: Configure through backend API

📖 **Detailed Guide**: See [RBAC_IMPLEMENTATION.md](./RBAC_IMPLEMENTATION.md)

---

## 📖 Usage

### First Time Setup

1. **Start the Application**
   ```bash
   npm run dev
   ```

2. **Access the Application**
   - Open [http://localhost:3000](http://localhost:3000)
   - You'll be redirected to the login page

3. **Login**
   - Use your SSO credentials
   - System will fetch your role automatically
   - You'll be redirected to the Dashboard

### Navigation

#### Desktop
- **Sidebar**: Main navigation on the left
- **Top Bar**: User profile and notifications
- **Main Content**: Central workspace

#### Mobile
- **Bottom Navigation**: Quick access to main features
- **Hamburger Menu**: Additional options
- **Swipe Gestures**: Navigate between sections

### Creating Your First Project

1. Navigate to **Projects** page
2. Click **"+ New Project"** button (requires create permission)
3. Fill in project details:
   - Name (required)
   - Description
   - Team assignment
   - Start and end dates
   - Priority level
4. Click **"Create Project"**

### Managing Tasks

1. Navigate to **Tasks** page
2. Click **"+ New Task"** button
3. Fill in task details:
   - Title (required)
   - Description
   - Assignee
   - Project association
   - Status and priority
   - Due date
   - Attachments (optional)
4. Click **"Create Task"**

### Sprint Planning

1. Navigate to **Sprint Stories**
2. Create user stories
3. Estimate story points
4. Assign to sprints
5. Track progress

### Calendar Events

1. Navigate to **Calendar**
2. Click **"Connect Google Calendar"** (first time)
3. Authorize with Google
4. Click **"New Event"** to create events
5. Events automatically get Google Meet links

### Notifications

1. Navigate to **Notifications**
2. Configure WHAPI connection
3. Create message templates
4. Set up event triggers
5. Test notifications
6. Monitor delivery logs

---

## 🏗 Architecture

### Application Structure

```
project-management-latest/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── google/               # Google Calendar API
│   │   ├── roles/                # RBAC endpoints
│   │   └── debug/                # Debug utilities
│   ├── components/               # React Components
│   │   ├── ui/                   # UI Components
│   │   ├── AppLayout.tsx         # Main layout wrapper
│   │   ├── AuthGuard.tsx         # Auth protection
│   │   ├── Navigation.tsx        # Top navigation
│   │   ├── Sidebar.tsx           # Left sidebar
│   │   ├── MobileBottomNav.tsx   # Mobile navigation
│   │   ├── RoleBasedUI.tsx       # RBAC components
│   │   ├── NotificationConfigPanel.tsx
│   │   └── NotificationTemplates.tsx
│   ├── contexts/                 # React Contexts
│   │   └── ThemeContext.tsx      # Theme management
│   ├── hooks/                    # Custom React Hooks
│   │   ├── useAuth.ts            # Authentication hook
│   │   └── useTabs.ts            # Tab management
│   ├── services/                 # API Services
│   │   ├── api.ts                # Main API service
│   │   ├── drive.ts              # Drive API service
│   │   └── notificationService.ts
│   ├── utils/                    # Utility Functions
│   │   ├── rbac.ts               # RBAC utilities
│   │   ├── sso-utils.ts          # SSO utilities
│   │   ├── googleCalendarApi.ts
│   │   └── googleCalendarClient.ts
│   ├── Dashboard/                # Dashboard page
│   ├── project/                  # Projects page
│   ├── task/                     # Tasks page
│   ├── sprint-stories/           # Sprint Stories page
│   ├── team/                     # Teams page
│   ├── companies/                # Companies page
│   ├── departments/              # Departments page
│   ├── calander/                 # Calendar page
│   ├── notifications/            # Notifications page
│   ├── settings/                 # Settings page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page (redirects)
│   └── globals.css               # Global styles
├── public/                       # Static assets
├── middleware.ts                 # Next.js middleware
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── vercel.json                   # Vercel deployment config
└── package.json                  # Dependencies
```

### Data Flow

```
User Action → Component → API Service → BRMH API → DynamoDB
                ↓
        Update UI State
                ↓
        Trigger Notifications (if configured)
```

### Authentication Flow

```
1. User Access → AuthGuard
2. Check localStorage for token
3. If no token → Redirect to Login
4. Validate token with API
5. Fetch user role from /api/roles
6. Store role & permissions
7. Render protected content
```

### Role Permission Check Flow

```
1. User attempts action (e.g., Create Project)
2. Component checks userRole from localStorage
3. RBAC utility validates permission
4. If authorized → Show button/form
5. If unauthorized → Hide button/show read-only
6. Backend validates again (security layer)
```

---

## 🔌 API Integration

### BRMH API Endpoints

Base URL: `https://brmh.in`

#### Authentication
- `POST /auth/token` - Token exchange
- `POST /auth/sync-tokens` - Token sync

#### Projects
- `GET /tables/project-management-projects/records` - Get all projects
- `POST /tables/project-management-projects/records` - Create project
- `PUT /tables/project-management-projects/records/:id` - Update project
- `DELETE /tables/project-management-projects/records/:id` - Delete project

#### Tasks
- `GET /tables/project-management-tasks/records` - Get all tasks
- `POST /tables/project-management-tasks/records` - Create task
- `PUT /tables/project-management-tasks/records/:id` - Update task
- `DELETE /tables/project-management-tasks/records/:id` - Delete task

#### Teams
- `GET /tables/project-management-teams/records` - Get all teams
- `POST /tables/project-management-teams/records` - Create team
- `PUT /tables/project-management-teams/records/:id` - Update team
- `DELETE /tables/project-management-teams/records/:id` - Delete team

#### Companies
- `GET /tables/project-management-companies/records` - Get all companies
- `POST /tables/project-management-companies/records` - Create company
- `PUT /tables/project-management-companies/records/:id` - Update company
- `DELETE /tables/project-management-companies/records/:id` - Delete company

#### Departments
- `GET /tables/project-management-departments/records` - Get all departments
- `POST /tables/project-management-departments/records` - Create department
- `PUT /tables/project-management-departments/records/:id` - Update department
- `DELETE /tables/project-management-departments/records/:id` - Delete department

#### Roles
- `GET /namespace-roles/:userId/projectmanagement` - Get user role
- `POST /namespace-roles` - Assign role (admin only)

#### Notifications
- `POST /notify/send` - Send notification
- `GET /notify/logs` - Get notification logs

### API Service Usage

```typescript
import { apiService } from '@/app/services/api';

// Get all projects
const projects = await apiService.getProjects();

// Create a project
const newProject = await apiService.createProject({
  name: 'New Project',
  description: 'Project description',
  team: 'team-id',
  priority: 'high',
  status: 'planning'
});

// Update a project
const updated = await apiService.updateProject('project-id', {
  status: 'in-progress'
});

// Delete a project
await apiService.deleteProject('project-id');
```

---

## 🔐 Role-Based Access Control (RBAC)

### Role Hierarchy

```
Super Admin (Full Access)
    ↓
Admin (All except role management)
    ↓
Manager (Read all + Limited create/update)
    ↓
User (Read-only)
```

### Permission Matrix

| Feature | Super Admin | Admin | Manager | User |
|---------|-------------|-------|---------|------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| View Projects | ✅ | ✅ | ✅ | ✅ |
| Create Projects | ✅ | ✅ | ✅ | ❌ |
| Update Projects | ✅ | ✅ | ✅ | ❌ |
| Delete Projects | ✅ | ✅ | ❌ | ❌ |
| View Tasks | ✅ | ✅ | ✅ | ✅ |
| Create Tasks | ✅ | ✅ | ✅ | ❌ |
| Update Tasks | ✅ | ✅ | ✅ | ❌ |
| Delete Tasks | ✅ | ✅ | ❌ | ❌ |
| Manage Teams | ✅ | ✅ | ❌ | ❌ |
| Manage Companies | ✅ | ✅ | ❌ | ❌ |
| Manage Departments | ✅ | ✅ | ❌ | ❌ |
| Manage Settings | ✅ | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ❌ |
| Manage Roles | ✅ | ❌ | ❌ | ❌ |

### Using RBAC Components

```tsx
import { 
  CreateButton, 
  UpdateButton, 
  DeleteButton, 
  RoleGuard,
  usePermissions 
} from '@/app/components/RoleBasedUI';

// Conditional button rendering
<CreateButton resource="projects" onClick={handleCreate}>
  Create Project
</CreateButton>

// Guard entire sections
<RoleGuard permission="manage:settings">
  <AdvancedSettings />
</RoleGuard>

// Use permissions in logic
const { canCreate, canUpdate, isAdmin } = usePermissions();

if (canCreate('tasks')) {
  // Show create form
}
```

---

## 🔗 Integrations

### Google Calendar

**Features:**
- OAuth 2.0 PKCE authentication
- Create events with descriptions
- Automatic Google Meet link generation
- Calendar sync
- Month view display

**Setup:**
1. Configure Google Cloud Console
2. Enable Calendar API
3. Set OAuth credentials in `.env.local`
4. Connect through Calendar page

**Documentation**: [CALENDAR_INTEGRATION_SUMMARY.md](./CALENDAR_INTEGRATION_SUMMARY.md)

### WhatsApp Notifications (WHAPI)

**Features:**
- Event-triggered notifications
- Custom message templates
- Multiple recipient types
- Delivery tracking
- Test mode

**Setup:**
1. Get WHAPI token
2. Configure in Notifications page
3. Create templates
4. Set up triggers

**Documentation**: [NOTIFICATION_SYSTEM.md](./NOTIFICATION_SYSTEM.md)

### Drive API

**Features:**
- File upload and storage
- Task-level attachments
- Secure file access
- Multiple file types
- Download with presigned URLs

**Setup:**
1. Configure Drive API URL
2. Set namespace settings
3. Ensure user authentication

**Documentation**: [ENV_SETUP.md](./ENV_SETUP.md)

---

## 🚢 Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**
   - Import project to Vercel
   - Connect your Git repository

2. **Configure Environment Variables**
   - Add all `.env.local` variables to Vercel
   - Ensure Google OAuth redirect URI includes production domain

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Post-Deployment**
   - Update Google OAuth authorized redirect URIs
   - Update WHAPI webhook URLs (if applicable)
   - Test all integrations

### Production URL

- Production: `https://pm.brmh.in`
- API: `https://brmh.in`

### Environment Variables for Production

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<production_client_id>
GOOGLE_CLIENT_SECRET=<production_secret>
NEXT_PUBLIC_DRIVE_API_URL=<production_drive_url>
NEXT_PUBLIC_API_URL=https://brmh.in
```

**Documentation**: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📁 Project Structure

### Key Files and Their Purpose

| File/Directory | Purpose |
|----------------|---------|
| `app/page.tsx` | Home page (redirects to Dashboard) |
| `app/layout.tsx` | Root layout with providers |
| `app/Dashboard/page.tsx` | Main dashboard with analytics |
| `app/components/AuthGuard.tsx` | Authentication wrapper |
| `app/components/RoleBasedUI.tsx` | RBAC components |
| `app/services/api.ts` | Central API service |
| `app/utils/rbac.ts` | RBAC utility functions |
| `middleware.ts` | Next.js middleware for routing |
| `vercel.json` | Vercel deployment configuration |

### Database Schema

Tables in DynamoDB:

1. **project-management-projects**
   - Partition Key: `id`
   - Attributes: name, description, team, status, priority, dates, tags

2. **project-management-tasks**
   - Partition Key: `id`
   - Attributes: title, description, assignee, project, status, priority, dueDate, attachments

3. **project-management-teams**
   - Partition Key: `id`
   - Attributes: name, description, members, active, tags

4. **project-management-companies**
   - Partition Key: `id`
   - Attributes: name, description, departments, active, tags
   - GSI: name-index, active-index

5. **project-management-departments**
   - Partition Key: `id`
   - Attributes: name, description, companyId, teams, active, tags
   - GSI: companyId-index, name-index, active-index

**Documentation**: [COMPANY-DEPARTMENT-SCHEMA.md](./COMPANY-DEPARTMENT-SCHEMA.md)

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Authentication Not Working

**Problem**: Redirecting to login repeatedly

**Solutions**:
- Clear browser localStorage
- Check if token is valid
- Verify SSO endpoint is accessible
- Check browser console for errors

```bash
# Clear localStorage
localStorage.clear()
# Then refresh the page
```

#### 2. Role Not Loading

**Problem**: User shows as "user" despite having different role

**Solutions**:
- Check network tab for `/api/roles` response
- Verify backend endpoint: `https://brmh.in/namespace-roles/:userId/projectmanagement`
- Clear localStorage and login again
- Check browser console for role fetch logs

#### 3. Google Calendar Connection Fails

**Problem**: OAuth redirect fails or calendar doesn't connect

**Solutions**:
- Verify Google Client ID in `.env.local`
- Check authorized redirect URIs in Google Console
- Ensure Calendar API is enabled
- Check browser console for OAuth errors

#### 4. Notifications Not Sending

**Problem**: WHAPI notifications not being sent

**Solutions**:
- Verify WHAPI token is valid
- Test connection in Notifications page
- Check notification configuration is active
- Review delivery logs for errors

#### 5. Build Errors

**Problem**: `npm run build` fails

**Solutions**:
```bash
# Clear cache and rebuild
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

#### 6. File Uploads Failing

**Problem**: Can't upload attachments to tasks

**Solutions**:
- Check Drive API URL in environment variables
- Verify namespace configuration
- Check browser console for API errors
- Ensure user is authenticated

### Debug Mode

Enable debug logging:

```typescript
// In browser console
localStorage.setItem('debug', 'true');
```

### Getting Help

1. Check existing documentation:
   - [RBAC_IMPLEMENTATION.md](./RBAC_IMPLEMENTATION.md)
   - [CALENDAR_INTEGRATION_SUMMARY.md](./CALENDAR_INTEGRATION_SUMMARY.md)
   - [NOTIFICATION_SYSTEM.md](./NOTIFICATION_SYSTEM.md)
   - [TROUBLESHOOTING.md](./EMERGENCY_DEBUG.md)

2. Check browser console for errors
3. Review network tab for failed requests
4. Check deployment logs on Vercel

---

## 🤝 Contributing

### Development Workflow

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**
   - Follow existing code style
   - Add TypeScript types
   - Update documentation

3. **Test changes**
   ```bash
   npm run dev
   # Test in browser
   ```

4. **Build and verify**
   ```bash
   npm run build
   ```

5. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style Guidelines

- Use TypeScript for all new files
- Follow existing naming conventions
- Add JSDoc comments for complex functions
- Use Tailwind classes for styling
- Keep components small and focused
- Use hooks for stateful logic

### Adding New Features

1. **Create feature branch**
2. **Implement feature** with proper types
3. **Add RBAC** if needed (permissions)
4. **Update documentation**
5. **Test thoroughly** (desktop + mobile)
6. **Create pull request**

---

## 📚 Documentation

### Available Documentation

- [README.md](./README.md) - This file
- [ENV_SETUP.md](./ENV_SETUP.md) - Environment configuration
- [RBAC_IMPLEMENTATION.md](./RBAC_IMPLEMENTATION.md) - Role-based access control
- [GOOGLE_CALENDAR_SETUP.md](./GOOGLE_CALENDAR_SETUP.md) - Calendar integration
- [CALENDAR_INTEGRATION_SUMMARY.md](./CALENDAR_INTEGRATION_SUMMARY.md) - Calendar summary
- [NOTIFICATION_SYSTEM.md](./NOTIFICATION_SYSTEM.md) - Notification system
- [COMPANY-DEPARTMENT-SCHEMA.md](./COMPANY-DEPARTMENT-SCHEMA.md) - Database schema
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [AUTH_FLOW_DIAGRAM.md](./AUTH_FLOW_DIAGRAM.md) - Authentication flow

---

## 🆘 Support

### Resources

- **Documentation**: Check the `/docs` directory for detailed guides
- **Issue Tracker**: Report bugs and request features
- **API Status**: Check [https://brmh.in/health](https://brmh.in/health)

### Contact

For technical support or inquiries about the project, please contact the development team.

---

## 📝 License

This project is private and proprietary. All rights reserved.

---

## 🎉 Acknowledgments

Built with ❤️ using:
- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Recharts](https://recharts.org/)

---

## 📊 Project Status

- ✅ **Authentication & Authorization**: Complete
- ✅ **Core Features**: Complete (Projects, Tasks, Teams)
- ✅ **RBAC**: Complete
- ✅ **Google Calendar Integration**: Complete
- ✅ **Notification System**: Complete
- ✅ **Mobile Responsive**: Complete
- ✅ **Organizational Structure**: Complete (Companies, Departments)
- ✅ **File Attachments**: Complete
- ✅ **Dashboard Analytics**: Complete

---

## 🚀 Quick Start Checklist

- [ ] Install Node.js >= 20.x
- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Create `.env.local` with required variables
- [ ] Configure Google Calendar API (optional)
- [ ] Configure WHAPI (optional)
- [ ] Run `npm run dev`
- [ ] Access [http://localhost:3000](http://localhost:3000)
- [ ] Login with SSO credentials
- [ ] Explore the dashboard!

---

## 🌟 Feature Roadmap

### Planned Features
- [ ] Advanced analytics and reporting
- [ ] Export functionality (PDF, Excel)
- [ ] Email integration
- [ ] Real-time collaboration (WebSockets)
- [ ] Advanced search with filters
- [ ] Custom dashboards
- [ ] Time tracking
- [ ] Budget management
- [ ] Gantt charts
- [ ] Kanban board view

### Future Enhancements
- [ ] Mobile apps (iOS/Android)
- [ ] Desktop apps (Electron)
- [ ] AI-powered insights
- [ ] Automation workflows
- [ ] Third-party integrations (Slack, Jira, etc.)
- [ ] Advanced permissions (resource-level)
- [ ] Multi-language support
- [ ] Dark mode enhancements

---

<div align="center">

**Made with ❤️ for modern teams**

[Back to Top](#project-management-system)

</div>
