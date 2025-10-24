/**
 * Drive API Service
 * Handles file upload, download, listing, and deletion operations
 */

interface DriveConfig {
  apiUrl: string;
  namespaceId: string;
  namespaceName: string;
}

interface UploadFileParams {
  userId: string;
  file: File;
  parentId?: string;
  tags?: string;
}

interface FileItem {
  id: string;
  name: string;
  type: string;
  parentId: string;
  path: string;
  size: number;
  mimeType: string;
  namespaceId: string;
  createdAt: string;
}

interface UploadResponse {
  success: boolean;
  fileId: string;
  name: string;
  s3Key: string;
  size: number;
  createdAt: string;
}

interface ListFilesResponse {
  files: FileItem[];
  count: number;
}

interface DownloadResponse {
  downloadUrl: string;
  expiresIn: number;
  fileName: string;
}

class DriveService {
  private config: DriveConfig;

  constructor() {
    // Get configuration from environment variables
    this.config = {
      apiUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in',
      namespaceId: process.env.NEXT_PUBLIC_NAMESPACE_ID || '779f7250-b99e-46ca-9462-2e1008a365b8',
      namespaceName: process.env.NEXT_PUBLIC_NAMESPACE_NAME || 'BRMH Project Management',
    };

    console.log('🚗 Drive Service initialized with config:', this.config);
  }

  /**
   * Get user ID from localStorage
   */
  private getUserId(): string {
    if (typeof window === 'undefined') return '';
    
    // First try to get user_id directly from localStorage
    const userId = localStorage.getItem('user_id');
    if (userId) {
      console.log('🔑 Found user_id in localStorage:', userId);
      return userId;
    }
    
    // Fallback: try to get from user object
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const id = user.id || user.userId || '';
        if (id) {
          console.log('🔑 Found user ID from user object:', id);
          return id;
        }
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
    
    console.warn('⚠️ No user ID found in localStorage');
    return '';
  }

  /**
   * Upload a file to the drive
   */
  async uploadFile(params: UploadFileParams): Promise<UploadResponse> {
    const { userId: providedUserId, file, parentId = 'ROOT', tags = '' } = params;
    const userId = providedUserId;

    if (!userId) {
      throw new Error('User ID is required for file operations.');
    }

    console.log('📤 Uploading file:', {
      fileName: file.name,
      size: file.size,
      userId,
      parentId,
      namespaceId: this.config.namespaceId
    });

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('namespaceId', this.config.namespaceId);
    formData.append('namespaceName', this.config.namespaceName);
    formData.append('file', file);
    formData.append('parentId', parentId);
    if (tags) {
      formData.append('tags', tags);
    }

    const response = await fetch(`${this.config.apiUrl}/drive/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload failed:', errorText);
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ File uploaded successfully:', result);
    return result;
  }

  /**
   * List files for a specific parent ID
   */
  async listFiles(parentId: string = 'ROOT'): Promise<ListFilesResponse> {
    const userId = this.getUserId();

    if (!userId) {
      throw new Error('User ID not found. Please log in.');
    }

    console.log('📂 Listing files:', {
      userId,
      namespaceId: this.config.namespaceId,
      parentId
    });

    const url = `${this.config.apiUrl}/drive/files/${userId}?namespaceId=${this.config.namespaceId}&parentId=${parentId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ List files failed:', errorText);
      throw new Error(`Failed to list files: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Files listed successfully:', result);
    return result;
  }

  /**
   * Get file details
   */
  async getFileDetails(fileId: string, userId?: string): Promise<FileItem> {
    const finalUserId = userId;

    if (!finalUserId) {
      throw new Error('User ID is required for file operations.');
    }

    const url = `${this.config.apiUrl}/drive/file/${finalUserId}/${fileId}?namespaceId=${this.config.namespaceId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Get file details failed:', errorText);
      throw new Error(`Failed to get file details: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  }

  /**
   * Download a file (get presigned URL)
   */
  async downloadFile(fileId: string, userId?: string): Promise<DownloadResponse> {
    const finalUserId = userId;

    if (!finalUserId) {
      throw new Error('User ID is required for file operations.');
    }

    console.log('📥 Getting download URL for file:', fileId);

    const url = `${this.config.apiUrl}/drive/download/${finalUserId}/${fileId}?namespaceId=${this.config.namespaceId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Download URL generation failed:', errorText);
      throw new Error(`Failed to get download URL: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Download URL generated successfully');
    return result;
  }

  /**
   * Rename a file
   */
  async renameFile(fileId: string, newName: string): Promise<void> {
    const userId = this.getUserId();

    if (!userId) {
      throw new Error('User ID not found. Please log in.');
    }

    console.log('✏️ Renaming file:', { fileId, newName });

    const response = await fetch(`${this.config.apiUrl}/drive/rename/${userId}/${fileId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newName,
        namespaceId: this.config.namespaceId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Rename failed:', errorText);
      throw new Error(`Failed to rename file: ${response.statusText}`);
    }

    console.log('✅ File renamed successfully');
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string, userId?: string): Promise<void> {
    const finalUserId = userId;

    if (!finalUserId) {
      throw new Error('User ID is required for file operations.');
    }

    console.log('🗑️ Deleting file:', fileId);

    const url = `${this.config.apiUrl}/drive/file/${finalUserId}/${fileId}?namespaceId=${this.config.namespaceId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Delete failed:', errorText);
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }

    console.log('✅ File deleted successfully');
  }
}

// Export singleton instance
export const driveService = new DriveService();

// Export types
export type { FileItem, UploadResponse, ListFilesResponse, DownloadResponse };

