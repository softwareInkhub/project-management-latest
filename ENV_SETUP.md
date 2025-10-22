# Environment Variables Setup

This document describes the environment variables required for the file attachment feature.

## Drive API Configuration

Create a `.env.local` file in the root of your project with the following variables:

```env
# Drive API Configuration
NEXT_PUBLIC_DRIVE_API_URL=http://localhost:3000
NEXT_PUBLIC_DRIVE_NAMESPACE_ID=ns_project_management
NEXT_PUBLIC_DRIVE_NAMESPACE_NAME=ProjectManagement
```

### Variable Descriptions

- **NEXT_PUBLIC_DRIVE_API_URL**: The base URL of your drive API backend
  - For local development: `http://localhost:3000`
  - For production: Your actual API URL

- **NEXT_PUBLIC_DRIVE_NAMESPACE_ID**: The namespace ID for organizing files
  - Example: `ns_project_management`
  - This should match your backend namespace configuration

- **NEXT_PUBLIC_DRIVE_NAMESPACE_NAME**: The human-readable namespace name
  - Example: `ProjectManagement`
  - Used for organizing files in the drive system

## How It Works

1. **User Authentication**: The system retrieves the user ID from `localStorage` (stored during login)
2. **File Upload**: Files are uploaded to your drive API using multipart/form-data
3. **File Storage**: File IDs are stored in the task's `attachments` field as a JSON array
4. **File Retrieval**: Files are fetched from the drive API when viewing a task
5. **File Download**: Presigned URLs are generated for secure file downloads

## API Endpoints Used

- `POST /drive/upload` - Upload files
- `GET /drive/files/{userId}` - List files
- `GET /drive/file/{userId}/{fileId}` - Get file details
- `GET /drive/download/{userId}/{fileId}` - Get download URL
- `DELETE /drive/file/{userId}/{fileId}` - Delete file

## Notes

- All files are tagged with `task-{taskId}` for easy filtering
- Files are stored in the `ROOT` directory by default
- The system supports all file types
- File sizes are displayed in MB
- Files can be uploaded, downloaded, and deleted from the task preview

## Restart Required

After creating or modifying `.env.local`, restart your Next.js development server:

```bash
npm run dev
```

