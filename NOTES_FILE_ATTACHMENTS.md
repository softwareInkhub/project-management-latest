# Notes Module - File Attachments with BRMH Drive Integration

## 🎯 Overview

The Notes module now features **full integration with BRMH Drive API**, enabling real file uploads, storage, and downloads using the enterprise file management system.

---

## ✨ Key Features

### 1. **Real File Upload to BRMH Drive**
- ✅ Uploads files to `https://brmh.in/drive/upload`
- ✅ Returns unique `fileId` for each file
- ✅ Stores file metadata (name, size, upload date)
- ✅ Organized in `NOTES` parent folder

### 2. **File Metadata Storage**
```typescript
interface NoteAttachment {
  fileId: string;      // Unique ID from BRMH Drive
  fileName: string;    // Original filename (e.g., "report.pdf")
  fileSize: number;    // Size in bytes
  uploadedAt: string;  // ISO timestamp
}
```

### 3. **Download Functionality**
- Click download icon → Generates presigned URL
- Opens file in new tab
- URL expires after set time (from API)
- Works with any file type

### 4. **Backward Compatibility**
- ✅ Handles old notes with string arrays
- ✅ Handles old notes with JSON strings
- ✅ Seamlessly migrates data on load
- ✅ No data loss

---

## 🔧 How It Works

### **Upload Flow:**

```
User selects file
      ↓
Upload to BRMH Drive API
      ↓
Receive response:
{
  fileId: "uuid-123",
  name: "document.pdf",
  size: 52428,
  createdAt: "2025-11-08T..."
}
      ↓
Store in note as NoteAttachment
      ↓
Save note with file metadata
```

### **Download Flow:**

```
User clicks Download
      ↓
Call driveService.downloadFile(fileId, userId)
      ↓
Receive response:
{
  downloadUrl: "https://s3.../file?signature=...",
  expiresIn: 3600,
  fileName: "document.pdf"
}
      ↓
Open URL in new tab
      ↓
Browser downloads file
```

### **Delete Flow:**

```
User clicks X to remove
      ↓
Delete from BRMH Drive (optional)
      ↓
Remove from note.attachments array
      ↓
Save updated note
```

---

## 📊 Data Structure

### **In Database:**
```json
{
  "id": "note-1699999999",
  "title": "Meeting Notes",
  "content": "# Meeting summary...",
  "attachments": [
    {
      "fileId": "file-abc123",
      "fileName": "slides.pdf",
      "fileSize": 1048576,
      "uploadedAt": "2025-11-08T10:30:00Z"
    },
    {
      "fileId": "file-def456",
      "fileName": "timeline.xlsx",
      "fileSize": 52428,
      "uploadedAt": "2025-11-08T10:31:00Z"
    }
  ]
}
```

### **In BRMH Drive:**
```
Namespace: BRMH Project Management (779f7250-b99e-46ca-9462-2e1008a365b8)
Parent Folder: NOTES
Tags: note,note-1699999999

Files:
├── file-abc123 (slides.pdf)
└── file-def456 (timeline.xlsx)
```

---

## 🎨 UI/UX

### **Upload Area (Edit Mode):**
```
┌─────────────────────────────────────┐
│        🗂️ Upload Icon               │
│                                     │
│   Drag and drop files here, or     │
│                                     │
│      [Browse Files]                 │
└─────────────────────────────────────┘

Attached Files:
┌─────────────────────────────────┐
│ 📄 slides.pdf        1024.5 KB  │ ❌
│ 📄 timeline.xlsx       51.2 KB  │ ❌
└─────────────────────────────────┘
```

### **Attachments (Preview Mode):**
```
Attachments
┌─────────────────────────────────┐
│ 📄 slides.pdf        1024.5 KB  │ 📥
│ 📄 timeline.xlsx       51.2 KB  │ 📥
└─────────────────────────────────┘
```

**Features:**
- File icon with name
- File size in KB
- Delete (❌) in edit mode
- Download (📥) in preview mode
- Hover effects

---

## 🔒 Security & Permissions

### **Upload Requirements:**
- User must be authenticated
- `userId` extracted from user session
- Files tagged with note ID
- Stored in user's namespace

### **Download Security:**
- Presigned URLs with expiration
- User validation required
- Temporary access only
- No public file access

### **Delete Safety:**
- Confirmation prompt before delete
- Graceful failure if file doesn't exist
- Note updated even if drive delete fails

---

## 🚀 API Integration

### **Drive Service Methods Used:**

#### **1. Upload File**
```typescript
await driveService.uploadFile({
  userId: string,        // User email or ID
  file: File,           // Browser File object
  parentId: 'NOTES',    // Folder organization
  tags: string          // Metadata tags
});

// Returns:
{
  fileId: string,       // ← Store this!
  name: string,
  size: number,
  createdAt: string
}
```

#### **2. Download File**
```typescript
await driveService.downloadFile(
  fileId: string,
  userId: string
);

// Returns:
{
  downloadUrl: string,  // ← Open this URL
  expiresIn: number,    // Seconds until expiration
  fileName: string
}
```

#### **3. Delete File**
```typescript
await driveService.deleteFile(
  fileId: string,
  userId: string
);

// Returns: void (or throws error)
```

---

## 📝 Code Examples

### **Creating Note with Attachments:**

```typescript
// User uploads files via drag-and-drop
const handleFiles = async (files: FileList) => {
  for (let file of files) {
    // 1. Upload to Drive
    const response = await driveService.uploadFile({
      userId: user.email,
      file: file,
      parentId: 'NOTES'
    });
    
    // 2. Store metadata
    const attachment: NoteAttachment = {
      fileId: response.fileId,    // ← Key identifier
      fileName: response.name,
      fileSize: response.size,
      uploadedAt: response.createdAt
    };
    
    // 3. Add to note
    formData.attachments.push(attachment);
  }
};
```

### **Downloading Attachment:**

```typescript
const handleDownloadAttachment = async (attachment: NoteAttachment) => {
  // 1. Get presigned download URL
  const response = await driveService.downloadFile(
    attachment.fileId,
    user.email
  );
  
  // 2. Open in new tab (triggers download)
  window.open(response.downloadUrl, '_blank');
};
```

### **Converting Note to Task:**

```typescript
// Extract file IDs for task
const fileIds = note.attachments.map(att => att.fileId);

// Create task with file IDs
await apiService.createTask({
  title: note.title,
  description: note.content,
  attachments: JSON.stringify(fileIds)  // Task format
});
```

---

## 🔄 Migration & Backward Compatibility

### **Old Format → New Format:**

```typescript
// Old note (legacy):
{
  attachments: '["file1.pdf", "file2.png"]'  // JSON string
}

// Auto-converted to:
{
  attachments: [
    { fileId: "file1.pdf", fileName: "file1.pdf", fileSize: 0, uploadedAt: "..." },
    { fileId: "file2.png", fileName: "file2.png", fileSize: 0, uploadedAt: "..." }
  ]
}
```

**Migration happens automatically** when:
- Loading existing notes
- Selecting a note
- Viewing note details

**Handled formats:**
1. ✅ `NoteAttachment[]` (new format)
2. ✅ `string[]` (old format - filenames)
3. ✅ `"[...]"` (JSON string)
4. ✅ `undefined` or `null`

---

## 🎯 User Experience

### **Upload Process:**
1. **Drag & Drop** or **Browse Files**
2. Shows "Uploading..." indicator
3. Files upload to BRMH Drive in background
4. Success → File appears in list with size
5. Error → Alert with error message

### **Download Process:**
1. Click download icon (📥)
2. Generates presigned URL from Drive
3. Opens in new tab
4. Browser handles download

### **Delete Process:**
1. Click X button
2. Deletes from Drive (if exists)
3. Removes from note
4. Updates UI immediately

---

## 💾 Database Schema Update

```sql
-- Attachments column stores JSON array of objects
ALTER TABLE `project-management-notes` 
MODIFY COLUMN `attachments` JSON;

-- Example data:
[
  {
    "fileId": "file-abc123",
    "fileName": "document.pdf",
    "fileSize": 1048576,
    "uploadedAt": "2025-11-08T10:30:00Z"
  }
]
```

---

## 🐛 Error Handling

### **Upload Failures:**
- Network errors → Alert user
- Invalid file type → Filter on input
- Size limits → Handled by Drive API
- Quota exceeded → Drive API error

### **Download Failures:**
- File not found → Alert user
- Expired URL → Regenerate
- Permission denied → Auth check
- Network error → Retry option

### **Safety Checks:**
```typescript
// Always check if attachments is array
if (Array.isArray(formData.attachments)) {
  formData.attachments.map(...)
}

// Safe spreading
const current = Array.isArray(formData.attachments) 
  ? formData.attachments 
  : [];
const newAttachments = [...current];
```

---

## 📈 Benefits

### **1. Centralized Storage**
- All files in BRMH Drive
- No duplicate storage
- Consistent backup
- Easy quota management

### **2. Security**
- Presigned URLs (temporary access)
- User-based permissions
- Encrypted storage
- Audit trails

### **3. Scalability**
- Handle any file size
- S3-backed storage
- CDN delivery
- Global availability

### **4. Integration**
- Files shared across modules
- Tasks can reference same files
- Projects can access note files
- Team collaboration ready

---

## 🔮 Future Enhancements

### **Immediate:**
- [ ] File type icons (PDF, Excel, Word)
- [ ] Image thumbnail previews
- [ ] Progress bars for uploads
- [ ] Batch delete

### **Advanced:**
- [ ] In-browser preview (PDF, images)
- [ ] File versioning
- [ ] Shared file permissions
- [ ] File comments
- [ ] OCR for document search
- [ ] Virus scanning
- [ ] Compression options

---

## 🎓 Developer Guide

### **Adding File Support to Your Note:**

```typescript
// 1. Get file from input
const file = e.target.files[0];

// 2. Upload to Drive
const response = await driveService.uploadFile({
  userId: user.email,
  file: file,
  parentId: 'NOTES',
  tags: 'note,important'
});

// 3. Create attachment object
const attachment: NoteAttachment = {
  fileId: response.fileId,
  fileName: response.name,
  fileSize: response.size,
  uploadedAt: response.createdAt
};

// 4. Add to note
formData.attachments.push(attachment);

// 5. Save note
await apiService.createNote(formData);
```

### **Downloading a File:**

```typescript
const attachment = note.attachments[0];

const downloadResponse = await driveService.downloadFile(
  attachment.fileId,
  user.email
);

window.open(downloadResponse.downloadUrl, '_blank');
```

---

## ✅ Testing Checklist

- [x] Upload single file
- [x] Upload multiple files
- [x] Drag and drop upload
- [x] Browse files upload
- [x] Delete attachment
- [x] Download attachment
- [x] File size display
- [x] Loading states
- [x] Error handling
- [x] Backward compatibility
- [x] Convert note with files to task
- [x] Safety checks (array validation)

---

## 🎉 Summary

The Notes module now has **enterprise-grade file attachment** functionality:

✅ **Real file uploads** to BRMH Drive  
✅ **Unique file IDs** for tracking  
✅ **Metadata storage** (name, size, date)  
✅ **Secure downloads** with presigned URLs  
✅ **Delete from drive** when removed  
✅ **Backward compatible** with old data  
✅ **Type-safe** implementation  
✅ **Error handling** throughout  
✅ **Professional UI** with file info display  

Files are now properly stored in the BRMH Drive system and can be accessed, shared, and managed across your entire project management platform! 🚀

---

**Version**: 2.1.0  
**Feature**: BRMH Drive Integration  
**Status**: ✅ Production Ready  
**Last Updated**: November 2025


