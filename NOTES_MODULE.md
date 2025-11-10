# Notes Module - Complete Documentation

## 🎯 Overview

The Notes module is a production-ready, feature-rich note-taking system integrated into the BRMH Project Management platform. It provides a modern, Notion-like experience with Markdown support, file attachments, and seamless task conversion.

## ✨ Key Features

### 1. **Modern Two-Column Layout**
- **Left Sidebar**: Scrollable list of all notes with preview
- **Right Editor**: Full-featured Markdown editor with preview mode
- Clean, minimal design inspired by Notion and Linear

### 2. **Markdown Editor with Toolbar**
The editor includes a comprehensive toolbar with the following features:
- **Bold** (`**text**`) - Make text bold
- **Italic** (`*text*`) - Italicize text
- **Headers** (`# H1`, `## H2`, `### H3`) - Create headers
- **Lists** (`- item`) - Unordered lists
- **Numbered Lists** (`1. item`) - Ordered lists
- **Code** (`` `code` ``) - Inline code
- **Code Blocks** (` ```code``` `) - Multi-line code blocks
- **Links** (`[text](url)`) - Hyperlinks
- **Real-time Preview** - Toggle between edit and preview mode

### 3. **Attachments System**
- **Drag & Drop Support** - Easy file uploads
- **Multiple Files** - Attach multiple files to a single note
- **File Preview** - See attached files with icons
- **Download Support** - Download attachments
- **File Management** - Remove attachments easily

### 4. **Convert to Task**
Transform any note into a task with one click:
- **Auto-mapping**: Note title → Task title
- **Content Transfer**: Note content → Task description
- **Preserve Attachments**: Files carry over to task
- **Full Customization**: Edit all task fields before creation
- **Project Linking**: Maintain project associations

### 5. **Search & Filters**
- **Real-time Search**: Instant search through titles and content
- **Tag Filtering**: Filter notes by tags
- **Smart Sorting**:
  - Most Recent (default)
  - Oldest First
  - Title A-Z

### 6. **Tags System**
- **Add Multiple Tags**: Organize notes with custom tags
- **Visual Tags**: Color-coded badges
- **Quick Filter**: Click to filter by tag
- **Auto-complete**: Reuse existing tags

### 7. **Auto-save**
- Automatic saving every 3 seconds
- No manual save needed while editing
- Visual save confirmation

### 8. **Metadata Display**
- Created by (user)
- Last updated timestamp
- Smart date formatting (e.g., "2 hours ago", "3 days ago")
- Project linkage

## 🎨 UI/UX Highlights

### Design Principles
- **Clean & Minimal**: Focus on content, not clutter
- **Modern**: Inspired by Notion, Linear, and ClickUp
- **Responsive**: Works on desktop and mobile
- **Dark Mode**: Full dark mode support
- **Smooth Animations**: Hover effects and transitions

### Color Scheme
- **Primary**: Blue (#2563EB) for CTAs and active states
- **Success**: Green for convert-to-task
- **Neutral**: Grays for backgrounds and text
- **Semantic**: Color-coded tags and badges

### Typography
- **Headings**: Bold, clear hierarchy
- **Body**: Readable font sizes
- **Code**: Monospace for markdown editor
- **Preview**: Prose styling for rendered content

## 🔧 Technical Implementation

### Architecture
```
notes/
├── page.tsx              # Main Notes component
└── NOTES_MODULE.md       # This documentation

app/services/
└── api.ts                # Note interface & API methods
```

### Data Structure

```typescript
interface Note {
  id: string;
  title: string;
  content: string;           // Markdown content
  tags: string;              // JSON string array
  project?: string;          // Linked project name
  attachments?: string;      // JSON string array of files
  createdBy: string;         // User email/username
  createdAt: string;         // ISO timestamp
  updatedAt: string;         // ISO timestamp
}
```

### API Endpoints

All notes are stored in the `project-management-notes` table via the CRUD API.

**Available Methods:**
- `getNotes()` - Fetch all notes
- `getNoteById(id)` - Get a single note
- `createNote(note)` - Create new note
- `updateNote(id, note)` - Update existing note
- `deleteNote(id)` - Delete a note

### State Management
- **Local State**: React hooks for UI state
- **Auto-save**: Debounced save with 3-second delay
- **Optimistic Updates**: Immediate UI feedback

## 📱 User Workflows

### Creating a New Note
1. Click **"New Note"** button in header
2. Enter note title
3. Write content with Markdown
4. Add tags (optional)
5. Upload attachments (optional)
6. Link to project (optional)
7. Auto-saves every 3 seconds
8. Click **"Save"** or it auto-saves

### Editing a Note
1. Click on a note in the left sidebar
2. Click **"Edit"** button
3. Modify content
4. Toggle **"Preview"** to see rendered markdown
5. Click **"Save"** or wait for auto-save

### Converting Note to Task
1. Open a note
2. Click **"Convert to Task"** button
3. Review and edit task details:
   - Title (pre-filled from note)
   - Description (pre-filled from content)
   - Priority (Low/Medium/High)
   - Status (To Do/In Progress/Completed)
   - Project
   - Assignee
   - Due Date
4. Click **"Create Task"**
5. Task is created with all note data
6. Note remains unchanged

### Searching & Filtering
1. Use search bar to search titles and content
2. Select a tag from dropdown to filter
3. Change sort order (Recent/Oldest/Title)
4. Clear filters to see all notes

### Managing Attachments
1. While editing, click paperclip icon or drag files
2. Files appear in attachments section
3. Remove files with X button
4. In preview, download files with download icon

## 🎯 Use Cases

### Meeting Notes
- Record meeting discussions
- Attach meeting files (agendas, PDFs)
- Tag with meeting type
- Convert action items to tasks

### Project Documentation
- Document project decisions
- Link to specific projects
- Maintain project knowledge base
- Quick reference for team

### Quick Ideas
- Capture thoughts quickly
- Organize with tags
- Expand into full tasks when ready

### Code Snippets
- Store useful code snippets
- Use markdown code blocks
- Tag by language or purpose
- Search when needed

## 🚀 Future Enhancements

### Potential Features
- [ ] Collaborative editing (real-time)
- [ ] Note templates
- [ ] Rich text editor (WYSIWYG)
- [ ] Note sharing & permissions
- [ ] Version history
- [ ] Note folders/categories
- [ ] Export to PDF/Markdown
- [ ] Note linking (wiki-style)
- [ ] Comments on notes
- [ ] Favorites/Pinned notes
- [ ] Note archiving
- [ ] Better file storage integration
- [ ] Image preview thumbnails
- [ ] Draw/sketch integration

### Technical Improvements
- [ ] Offline support with sync
- [ ] Better markdown parser (use library)
- [ ] Syntax highlighting for code blocks
- [ ] Keyboard shortcuts
- [ ] Mobile app version
- [ ] Performance optimization for large notes

## 🔒 Security & Permissions

Currently, notes follow the same RBAC (Role-Based Access Control) as the rest of the platform:
- **Admin**: Full access to all notes
- **Project Manager**: Access to project-linked notes
- **Team Member**: Access to own notes
- **Viewer**: Read-only access

## 📊 Database Schema

```sql
CREATE TABLE `project-management-notes` (
  `id` VARCHAR(36) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT,
  `tags` JSON,
  `project` VARCHAR(255),
  `attachments` JSON,
  `createdBy` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🎓 Markdown Guide for Users

### Basic Formatting
```markdown
# Heading 1
## Heading 2
### Heading 3

**Bold Text**
*Italic Text*

[Link Text](https://example.com)
```

### Lists
```markdown
- Unordered item 1
- Unordered item 2

1. Ordered item 1
2. Ordered item 2
```

### Code
```markdown
Inline `code` here

```
Multi-line
code block
```
```

## 🐛 Known Issues

- Attachments currently store filenames only (need full file storage integration)
- Markdown rendering is basic (consider using a library like `marked` or `react-markdown`)
- No real-time collaboration yet
- Large notes (>100KB) may have performance issues

## 📞 Support

For issues or feature requests related to the Notes module:
1. Check this documentation first
2. Review the code in `notes/page.tsx`
3. Test API endpoints in `app/services/api.ts`
4. Contact the development team

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Author**: BRMH Development Team


