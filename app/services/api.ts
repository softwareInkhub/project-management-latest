// API Service for BRMH Project Management System
// Base URLs: CRUD API: https://brmh.in/crud, Notification API: https://brmh.in/notify

import { notificationService } from './notificationService';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  project: string;
  assignee: string;
  assignedTeams?: string[];
  assignedUsers?: string[];
  status: 'To Do' | 'In Progress' | 'Completed' | 'Overdue';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
  startDate: string;
  estimatedHours: number;
  tags: string;
  subtasks: string; // JSON string array
  comments: string; // Number as string
  progress: number;
  timeSpent: string; // Hours as string
  parentId: string | null;
  attachments?: string; // JSON string array of file IDs
  createdAt: string;
  updatedAt: string;
}

interface Project {
  // Identity
  id: string;
  projectId?: string;
  
  // Basic Information
  name: string;
  title?: string;
  description?: string;
  company: string;
  department?: string;  // Optional department
  
  // Status & Priority
  status: string;
  priority: 'Low' | 'Medium' | 'High';
  
  // Timeline
  startDate: string;
  endDate: string;
  
  // Resources & Budget
  budget: string;
  team: string | string[];
  assignee: string;
  
  // Progress & Tasks
  progress: number;
  tasks: string | string[];
  
  // Additional Metadata
  tags: string | string[];
  notes?: string;
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
  timestamp?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email?: string;
  role: 'admin' | 'member' | 'viewer';
}

interface Team {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[] | string;
  memberCount?: number;
  projects?: string[];
  budget?: string;
  startDate?: string;
  archived?: boolean;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface NoteAttachment {
  fileId: string;      // File ID from BRMH Drive
  fileName: string;    // Original filename
  fileSize: number;    // File size in bytes
  uploadedAt: string;  // Upload timestamp
}

interface Note {
  id: string; // UUID
  title: string; // Short title or summary of the note
  content: string; // Markdown text content
  projectId?: string; // Link to related project (if any)
  authorId: string; // User who created the note
  tags?: string[]; // Optional tags for filtering
  attachments?: NoteAttachment[]; // Array of file metadata from BRMH Drive
  relatedTaskId?: string; // If this note was converted to a Task
  isConvertedToTask: boolean; // True if linked/converted
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

interface Company {
  id: string;
  name: string;
  description: string;
  departments: string[];
  active: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Department {
  id: string;
  name: string;
  description: string;
  companyId: string;
  teams: string[];
  active: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Sprint {
  id: string; // Partition key
  sprint_id: string;
  name: string;
  goal: string;
  start_date: string;
  end_date: string;
  status: 'planned' | 'active' | 'completed';
  created_by: string;
  project_id: string;
  team_id: string;
  velocity: number;
  stories: string[];
  retrospective_notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Story {
  id: string; // Partition key
  story_id: string;
  title: string;
  description: string;
  acceptance_criteria: string[];
  story_points: number;
  priority: 'low' | 'medium' | 'high';
  status: 'backlog' | 'in_progress' | 'review' | 'done';
  sprint_id: string;
  project_id: string;
  assigned_to: string;
  tags: string[];
  tasks: Array<{
    task_id: string;
    title: string;
    status: string;
  }>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

class ApiService {
  private crudBaseUrl = 'https://brmh.in/crud';
  private notifyBaseUrl = 'https://brmh.in/notify';
  private notificationTriggerId = '11d0d0c0-9745-48bd-bbbe-9aa0c517f294';

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.crudBaseUrl}${endpoint}`;
      
      // Log request details
      console.log('🚀 API Request Details:');
      console.log('URL:', url);
      console.log('Method:', options.method || 'GET');
      console.log('Headers:', {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      });
      
      if (options.body) {
        console.log('Request Body:', options.body);
        try {
          const parsedBody = JSON.parse(options.body as string);
          console.log('Parsed Request Body:', parsedBody);
        } catch (e) {
          console.log('Request Body (raw):', options.body);
        }
      }
      
      const requestOptions = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        ...options,
      };
      
      console.log('Full Request Options:', requestOptions);
      
      const response = await fetch(url, requestOptions);
      
      console.log('📡 Response Details:');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Try to get error details from response
        let errorDetails = '';
        try {
          const errorText = await response.text();
          console.log('Error Response Body:', errorText);
          errorDetails = errorText;
        } catch (e) {
          console.log('Could not read error response body');
        }
        
        throw new Error(`HTTP error! status: ${response.status}${errorDetails ? ` - ${errorDetails}` : ''}`);
      }

      const responseText = await response.text();
      console.log('Response Body (raw):', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed Response Data:', data);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('Invalid JSON response from server');
      }
      
      // Convert DynamoDB format to plain objects
      if (data.success && data.items) {
        // The API returns items in "items" array, not "data"
        data.data = data.items.map((item: any) => this.convertDynamoDBItem(item));
        console.log('Converted Data:', data);
      } else if (data.success && data.updatedItem) {
        // Handle PUT/UPDATE response which returns "updatedItem"
        data.data = this.convertDynamoDBItem(data.updatedItem);
        console.log('Converted updatedItem to data:', data);
      } else if (data.success && data.createdItem) {
        // Handle POST/CREATE response which returns "createdItem"
        data.data = this.convertDynamoDBItem(data.createdItem);
        console.log('Converted createdItem to data:', data);
      } else if (data.success && data.item) {
        // Handle single item GET response
        data.data = this.convertDynamoDBItem(data.item);
        console.log('Converted item to data:', data);
      } else if (data.success && data.id && !data.data) {
        // Handle CREATE response that only returns success and id
        // For now, we'll return the id as the data since we don't have the full object
        data.data = { id: data.id } as any;
        console.log('Handled create response with only id:', data);
      } else if (data.success && data.data) {
        // Fallback for other endpoints that might use "data"
        if (Array.isArray(data.data)) {
          data.data = data.data.map((item: any) => this.convertDynamoDBItem(item));
        } else {
          data.data = this.convertDynamoDBItem(data.data);
        }
        console.log('Converted Data:', data);
      }

      return data;
    } catch (error) {
      console.error('❌ API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private convertDynamoDBItem(item: any): any {
    if (!item || typeof item !== 'object') return item;

    const converted: any = {};
    
    for (const [key, value] of Object.entries(item)) {
      // Skip _metadata and other internal fields
      if (key === '_metadata' || key === 'timestamp') {
        continue;
      }
      
      if (value && typeof value === 'object') {
        const dynamoValue = value as any;
        
        if (dynamoValue.S !== undefined) {
          converted[key] = dynamoValue.S;
        } else if (dynamoValue.N !== undefined) {
          converted[key] = parseFloat(dynamoValue.N);
        } else if (dynamoValue.BOOL !== undefined) {
          converted[key] = dynamoValue.BOOL;
        } else if (dynamoValue.L !== undefined) {
          converted[key] = dynamoValue.L.map((item: any) => this.convertDynamoDBItem(item));
        } else if (dynamoValue.M !== undefined) {
          converted[key] = this.convertDynamoDBItem(dynamoValue.M);
        } else if (dynamoValue.NULL !== undefined) {
          converted[key] = null;
        } else {
          converted[key] = value;
        }
      } else {
        converted[key] = value;
      }
    }
    
    return converted;
  }

  // Test API connectivity
  async testApiConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing API connection...');
      const response = await fetch(`${this.crudBaseUrl}?tableName=project-management-tasks`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log('🔍 Test response status:', response.status);
      console.log('🔍 Test response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        console.log('✅ API connection test successful');
        return true;
      } else {
        console.log('❌ API connection test failed with status:', response.status);
        const errorText = await response.text();
        console.log('❌ Error response:', errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ API connection test error:', error);
      return false;
    }
  }

  // Task CRUD Operations
  async getTasks(): Promise<ApiResponse<Task[]>> {
    console.log('📋 Fetching tasks from API...');
    
    // Test connection first
    const isConnected = await this.testApiConnection();
    if (!isConnected) {
      console.log('❌ API connection test failed, returning error');
      return {
        success: false,
        error: 'API connection failed'
      };
    }
    
    const result = await this.makeRequest<Task[]>('?tableName=project-management-tasks', {
      method: 'GET',
    });
    console.log('📋 Tasks fetch result:', result);
    return result;
  }

  async getTaskById(id: string): Promise<ApiResponse<Task>> {
    return this.makeRequest<Task>(`?tableName=project-management-tasks&id=${id}`, {
      method: 'GET',
    });
  }

  async createTask(task: Partial<Task>): Promise<ApiResponse<Task>> {
    // Generate unique ID for the task
    const taskId = `task-${Date.now()}`;
    
    const payload = {
      item: {
        ...task,
        id: taskId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    };

    console.log('🆕 Creating task with ID:', taskId);
    console.log('📦 Task payload:', payload);

    const result = await this.makeRequest<Task>('?tableName=project-management-tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // Handle the response format from your CRUD API
    if (result.success) {
      // The API returns success: true and the key fields, but we need the full item
      // Let's fetch the created task to get the complete data
      const getResult = await this.getTaskById(taskId);
      if (getResult.success) {
        // Send notification for task creation
        try {
          await notificationService.notifyTaskEvent('created', getResult.data);
        } catch (error) {
          console.error('Failed to send task creation notification:', error);
        }
        
        return {
          success: true,
          data: getResult.data,
          error: undefined
        };
      }
    }

    return result;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<ApiResponse<Task>> {
    console.log('🔄 Updating task with ID:', id);
    console.log('📝 Update data:', updates);
    
    // Filter out key fields that cannot be updated
    const { id: taskId, createdAt, ...updateableFields } = updates;
    
    const payload = {
      key: {
        id: id
      },
      updates: {
        ...updateableFields,
        updatedAt: new Date().toISOString(),
      }
    };

    console.log('📦 Update payload:', payload);

    const result = await this.makeRequest<Task>('?tableName=project-management-tasks', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    // Send notification for task update
    if (result.success && result.data) {
      try {
        await notificationService.notifyTaskEvent('updated', result.data);
      } catch (error) {
        console.error('Failed to send task update notification:', error);
      }
    }

    return result;
  }

  async deleteTask(id: string): Promise<ApiResponse<void>> {
    // Get task data before deletion for notification
    let taskData: Task | undefined;
    try {
      const getResult = await this.getTaskById(id);
      if (getResult.success) {
        taskData = getResult.data;
      }
    } catch (error) {
      console.error('Failed to get task data before deletion:', error);
    }

    const result = await this.makeRequest<void>(`?tableName=project-management-tasks&id=${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });

    // Send notification for task deletion
    if (result.success && taskData) {
      try {
        await notificationService.notifyTaskEvent('deleted', taskData);
      } catch (error) {
        console.error('Failed to send task deletion notification:', error);
      }
    }

    return result;
  }

  // Project Operations
  async getProjects(): Promise<ApiResponse<Project[]>> {
    // Use pagination to get all projects
    const result = await this.makeRequest<Project[]>('?tableName=project-management-projects&pagination=true', {
      method: 'GET',
    });

    // Handle the response format from your CRUD API
    if (result.success && result.data && Array.isArray(result.data)) {
      return {
        success: true,
        data: result.data,
        error: undefined
      };
    }

    return result;
  }

  async getProjectById(id: string): Promise<ApiResponse<Project>> {
    const result = await this.makeRequest<Project>(`?tableName=project-management-projects&id=${id}`, {
      method: 'GET',
    });

    // Handle the response format from your CRUD API
    if (result.success && result.data) {
      return {
        success: true,
        data: result.data,
        error: undefined
      };
    }

    return result;
  }

  async createProject(project: Partial<Project>): Promise<ApiResponse<Project>> {
    try {
      // Clean the project data to remove any circular references
      const cleanProject = JSON.parse(JSON.stringify(project, (key, value) => {
        // Remove any React DOM elements or circular references
        if (value && typeof value === 'object') {
          if (value.constructor && value.constructor.name === 'HTMLOptionElement') {
            return value.value || value.textContent || '';
          }
          if (value.constructor && value.constructor.name === 'FiberNode') {
            return undefined;
          }
        }
        return value;
      }));
      
      // Generate unique ID for the project
      const projectId = `project-${Date.now()}`;
      
      const payload = {
        item: {
          ...cleanProject,
          id: projectId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      };

      console.log('🧹 Cleaned project data:', cleanProject);
      console.log('📦 Payload:', payload);

      const result = await this.makeRequest<Project>('?tableName=project-management-projects', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Handle the response format from your CRUD API
      if (result.success) {
        // The API returns success: true and the key fields, but we need the full item
        // Let's fetch the created project to get the complete data
        const getResult = await this.getProjectById(projectId);
        if (getResult.success) {
          // Send notification for project creation
          try {
            await notificationService.notifyProjectEvent('created', getResult.data);
          } catch (error) {
            console.error('Failed to send project creation notification:', error);
          }
          
          return {
            success: true,
            data: getResult.data,
            error: undefined
          };
        }
      }

      return result;
    } catch (error) {
      console.error('❌ Error cleaning project data:', error);
      // Fallback: create a minimal clean project
      const projectId = `project-${Date.now()}`;
      const fallbackProject = {
        name: String(project.name || ''),
        description: String(project.description || ''),
        company: String(project.company || ''),
        assignee: String(project.assignee || ''),
        startDate: String(project.startDate || ''),
        endDate: String(project.endDate || ''),
        status: String(project.status || 'Planning'),
        team: Array.isArray(project.team) ? project.team.map(String) : [],
        id: projectId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const payload = {
        item: fallbackProject
      };

      console.log('🔄 Using fallback project data:', fallbackProject);

      const result = await this.makeRequest<Project>('?tableName=project-management-projects', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Fetch the created project to get complete data
      if (result.success) {
        const getResult = await this.getProjectById(projectId);
        if (getResult.success) {
          return {
            success: true,
            data: getResult.data,
            error: undefined
          };
        }
      }

      return result;
    }
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<ApiResponse<Project>> {
    console.log('🔄 Updating project with ID:', id);
    console.log('📝 Update data:', updates);
    
    // Clean the update data to remove any circular references
    const cleanUpdates = JSON.parse(JSON.stringify(updates, (key, value) => {
      // Remove any React DOM elements or circular references
      if (value && typeof value === 'object') {
        if (value.constructor && value.constructor.name === 'HTMLOptionElement') {
          return value.value || value.textContent || '';
        }
        if (value.constructor && value.constructor.name === 'FiberNode') {
          return undefined;
        }
      }
      return value;
    }));
    
    console.log('🧹 Cleaned update data:', cleanUpdates);
    
    // Filter out key fields that cannot be updated
    const { id: projectId, projectId: altId, createdAt, timestamp, ...updateableFields } = cleanUpdates;
    
    const payload = {
      key: {
        id: id
      },
      updates: {
        ...updateableFields,
        updatedAt: new Date().toISOString(),
      }
    };

    console.log('📦 Update payload:', payload);

    const result = await this.makeRequest<Project>('?tableName=project-management-projects', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    // Handle the response format from your CRUD API
    if (result.success && result.data) {
      // The API returns the updated item in the data field
      return {
        success: true,
        data: result.data,
        error: undefined
      };
    }

    return result;
  }

  async deleteProject(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`?tableName=project-management-projects&id=${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  }

  // Team Operations
  async getTeams(): Promise<ApiResponse<Team[]>> {
    const result = await this.makeRequest<Team[]>('?tableName=project-management-teams&pagination=true', {
      method: 'GET',
    });

    // Handle the response format from your CRUD API
    if (result.success && result.data && Array.isArray(result.data)) {
      return {
        success: true,
        data: result.data,
        error: undefined
      };
    }

    return result;
  }

  async getTeamById(id: string): Promise<ApiResponse<Team>> {
    return this.makeRequest<Team>(`?tableName=project-management-teams&id=${id}`, {
      method: 'GET',
    });
  }

  async createTeam(team: Partial<Team>): Promise<ApiResponse<Team>> {
    // Generate unique ID for the team
    const teamId = `team-${Date.now()}`;
    
    const payload = {
      item: {
        ...team,
        id: teamId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    };

    console.log('🆕 Creating team with ID:', teamId);
    console.log('📦 Team payload:', payload);

    const result = await this.makeRequest<Team>('?tableName=project-management-teams', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // Handle the response format from your CRUD API
    if (result.success) {
      // The API returns success: true and the key fields, but we need the full item
      // Let's fetch the created team to get the complete data
      const getResult = await this.getTeamById(teamId);
      if (getResult.success) {
        return {
          success: true,
          data: getResult.data,
          error: undefined
        };
      }
    }

    return result;
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<ApiResponse<Team>> {
    const payload = {
      key: {
        id: id
      },
      updates: {
        ...updates,
        updatedAt: new Date().toISOString(),
      }
    };

    return this.makeRequest<Team>('?tableName=project-management-teams', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteTeam(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`?tableName=project-management-teams&id=${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  }

  // User Operations
  async getUsers(): Promise<ApiResponse<User[]>> {
    const result = await this.makeRequest<User[]>('?tableName=brmh-users&pagination=true', {
      method: 'GET',
    });

    // Handle the response format from your CRUD API
    if (result.success && result.data && Array.isArray(result.data)) {
      return {
        success: true,
        data: result.data,
        error: undefined
      };
    }

    return result;
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    return this.makeRequest<User>(`?tableName=brmh-users&id=${id}`, {
      method: 'GET',
    });
  }

  async createUser(user: Partial<User>): Promise<ApiResponse<User>> {
    const payload = {
      item: {
        ...user,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    };

    return this.makeRequest<User>('?tableName=brmh-users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateUser(id: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    const payload = {
      key: {
        id: id
      },
      updates: {
        ...updates,
        updatedAt: new Date().toISOString(),
      }
    };

    return this.makeRequest<User>('?tableName=brmh-users', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`?tableName=brmh-users&id=${id}`, {
      method: 'DELETE',
    });
  }

  // Company CRUD Operations
  async getCompanies(): Promise<ApiResponse<Company[]>> {
    const result = await this.makeRequest<Company[]>('?tableName=project-management-companies&pagination=true', {
      method: 'GET',
    });

    if (result.success && result.data && Array.isArray(result.data)) {
      return {
        success: true,
        data: result.data,
        error: undefined
      };
    }

    return result;
  }

  async getCompanyById(id: string): Promise<ApiResponse<Company>> {
    return this.makeRequest<Company>(`?tableName=project-management-companies&id=${id}`, {
      method: 'GET',
    });
  }

  async createCompany(company: Partial<Company>): Promise<ApiResponse<Company>> {
    const companyId = `company-${Date.now()}`;
    
    const payload = {
      item: {
        ...company,
        id: companyId,
        departments: company.departments || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    };

    console.log('🆕 Creating company with ID:', companyId);
    console.log('📦 Company payload:', payload);

    const result = await this.makeRequest<Company>('?tableName=project-management-companies', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (result.success) {
      const getResult = await this.getCompanyById(companyId);
      if (getResult.success) {
        return {
          success: true,
          data: getResult.data,
          error: undefined
        };
      }
    }

    return result;
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<ApiResponse<Company>> {
    console.log('🔄 Updating company with ID:', id);
    console.log('📝 Update data:', updates);
    
    const { id: companyId, createdAt, ...updateableFields } = updates;
    
    const payload = {
      key: {
        id: id
      },
      updates: {
        ...updateableFields,
        updatedAt: new Date().toISOString(),
      }
    };

    console.log('📦 Update payload:', payload);

    const result = await this.makeRequest<Company>('?tableName=project-management-companies', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (result.success && result.data) {
      return {
        success: true,
        data: result.data,
        error: undefined
      };
    }

    return result;
  }

  async deleteCompany(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`?tableName=project-management-companies&id=${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  }

  // Department CRUD Operations
  async getDepartments(): Promise<ApiResponse<Department[]>> {
    const result = await this.makeRequest<Department[]>('?tableName=project-management-departments&pagination=true', {
      method: 'GET',
    });

    if (result.success && result.data && Array.isArray(result.data)) {
      return {
        success: true,
        data: result.data,
        error: undefined
      };
    }

    return result;
  }

  async getDepartmentById(id: string): Promise<ApiResponse<Department>> {
    return this.makeRequest<Department>(`?tableName=project-management-departments&id=${id}`, {
      method: 'GET',
    });
  }

  async getDepartmentsByCompany(companyId: string): Promise<ApiResponse<Department[]>> {
    const result = await this.makeRequest<Department[]>(`?tableName=project-management-departments&companyId=${companyId}`, {
      method: 'GET',
    });

    if (result.success && result.data && Array.isArray(result.data)) {
      return {
        success: true,
        data: result.data,
        error: undefined
      };
    }

    return result;
  }

  async createDepartment(department: Partial<Department>): Promise<ApiResponse<Department>> {
    const departmentId = `dept-${Date.now()}`;
    
    const payload = {
      item: {
        ...department,
        id: departmentId,
        teams: department.teams || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    };

    console.log('🆕 Creating department with ID:', departmentId);
    console.log('📦 Department payload:', payload);

    const result = await this.makeRequest<Department>('?tableName=project-management-departments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (result.success) {
      const getResult = await this.getDepartmentById(departmentId);
      if (getResult.success) {
        return {
          success: true,
          data: getResult.data,
          error: undefined
        };
      }
    }

    return result;
  }

  async updateDepartment(id: string, updates: Partial<Department>): Promise<ApiResponse<Department>> {
    console.log('🔄 Updating department with ID:', id);
    console.log('📝 Update data:', updates);
    
    const { id: deptId, createdAt, ...updateableFields } = updates;
    
    const payload = {
      key: {
        id: id
      },
      updates: {
        ...updateableFields,
        updatedAt: new Date().toISOString(),
      }
    };

    console.log('📦 Update payload:', payload);

    const result = await this.makeRequest<Department>('?tableName=project-management-departments', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (result.success && result.data) {
      return {
        success: true,
        data: result.data,
        error: undefined
      };
    }

    return result;
  }

  async deleteDepartment(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`?tableName=project-management-departments&id=${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  }

  // Sprint Operations
  async getSprints(): Promise<ApiResponse<Sprint[]>> {
    const result = await this.makeRequest<Sprint[]>('?tableName=project-management-sprints&pagination=true', {
      method: 'GET',
    });

    if (result.success && result.data && Array.isArray(result.data)) {
      return {
        success: true,
        data: result.data,
        error: undefined
      };
    }

    return result;
  }

  async getSprintById(id: string): Promise<ApiResponse<Sprint>> {
    return this.makeRequest<Sprint>(`?tableName=project-management-sprints&id=${id}`, {
      method: 'GET',
    });
  }

  async createSprint(sprint: Partial<Sprint>): Promise<ApiResponse<Sprint>> {
    const sprintId = `SPRT_${String(Date.now()).slice(-3)}`;
    
    const payload = {
      item: {
        ...sprint,
        id: sprintId, // Use id as partition key
        sprint_id: sprintId, // Keep sprint_id for reference
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    };

    console.log('🆕 Creating sprint with ID:', sprintId);
    console.log('📦 Sprint payload:', payload);

    const result = await this.makeRequest<Sprint>('?tableName=project-management-sprints', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (result.success) {
      const getResult = await this.getSprintById(sprintId);
      if (getResult.success) {
        return {
          success: true,
          data: getResult.data,
          error: undefined
        };
      }
    }

    return result;
  }

  async updateSprint(id: string, updates: Partial<Sprint>): Promise<ApiResponse<Sprint>> {
    const payload = {
      key: {
        id: id
      },
      updates: {
        ...updates,
        updatedAt: new Date().toISOString(),
      }
    };

    return this.makeRequest<Sprint>('?tableName=project-management-sprints', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteSprint(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`?tableName=project-management-sprints&id=${id}`, {
      method: 'DELETE',
    });
  }

  // Story Operations
  async getStories(): Promise<ApiResponse<Story[]>> {
    const result = await this.makeRequest<Story[]>('?tableName=project-management-stories&pagination=true', {
      method: 'GET',
    });

    if (result.success && result.data && Array.isArray(result.data)) {
      return {
        success: true,
        data: result.data,
        error: undefined
      };
    }

    return result;
  }

  async getStoryById(id: string): Promise<ApiResponse<Story>> {
    return this.makeRequest<Story>(`?tableName=project-management-stories&id=${id}`, {
      method: 'GET',
    });
  }

  async createStory(story: Partial<Story>): Promise<ApiResponse<Story>> {
    const storyId = `ST_${String(Date.now()).slice(-3)}`;
    
    const payload = {
      item: {
        ...story,
        id: storyId, // Use id as partition key
        story_id: storyId, // Keep story_id for reference
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    };

    console.log('🆕 Creating story with ID:', storyId);
    console.log('📦 Story payload:', payload);

    const result = await this.makeRequest<Story>('?tableName=project-management-stories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (result.success) {
      const getResult = await this.getStoryById(storyId);
      if (getResult.success) {
        return {
          success: true,
          data: getResult.data,
          error: undefined
        };
      }
    }

    return result;
  }

  async updateStory(id: string, updates: Partial<Story>): Promise<ApiResponse<Story>> {
    const payload = {
      key: {
        id: id
      },
      updates: {
        ...updates,
        updated_at: new Date().toISOString(),
      }
    };

    return this.makeRequest<Story>('?tableName=project-management-stories', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteStory(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`?tableName=project-management-stories&id=${id}`, {
      method: 'DELETE',
    });
  }

  // Notes CRUD operations
  async getNotes(): Promise<ApiResponse<Note[]>> {
    return this.makeRequest<Note[]>('?tableName=project-management-notes');
  }

  async getNoteById(id: string): Promise<ApiResponse<Note>> {
    return this.makeRequest<Note>(`?tableName=project-management-notes&id=${id}`);
  }

  async createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Note>> {
    // Generate unique ID for the note
    const noteId = `note-${Date.now()}`;
    
    const payload = {
      item: {
        ...note,
        id: noteId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    };

    return this.makeRequest<Note>('?tableName=project-management-notes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateNote(id: string, note: Partial<Note>): Promise<ApiResponse<Note>> {
    const payload = {
      key: { id },
      updates: {
        ...note,
        updatedAt: new Date().toISOString(),
      }
    };

    return this.makeRequest<Note>('?tableName=project-management-notes', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteNote(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`?tableName=project-management-notes&id=${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  }

  // WhatsApp Notification
  async sendWhatsAppNotification(taskData: any): Promise<ApiResponse<any>> {
    try {
      // Prepare assignment details
      const assignmentDetails = [];
      
      if (taskData.assignedTeams && taskData.assignedTeams.length > 0) {
        assignmentDetails.push(`Teams: ${taskData.assignedTeams.join(', ')}`);
      }
      
      if (taskData.assignedUsers && taskData.assignedUsers.length > 0) {
        assignmentDetails.push(`Users: ${taskData.assignedUsers.join(', ')}`);
      }

      const message = `New task created: ${taskData.title}

Project: ${taskData.project}
Assigned to: ${taskData.assignee}
Due: ${taskData.dueDate}
Priority: ${taskData.priority}

📋 Assignments:
${assignmentDetails.join('\n')}`;

      const payload = {
        message,
        data: {
          title: taskData.title,
          project: taskData.project,
          assignee: taskData.assignee,
          dueDate: taskData.dueDate,
          priority: taskData.priority,
          assignmentDetails: assignmentDetails.join(' | '),
          assignedTeams: taskData.assignedTeams || [],
          assignedUsers: taskData.assignedUsers || []
        }
      };

      const response = await fetch(`${this.notifyBaseUrl}/${this.notificationTriggerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('WhatsApp notification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification'
      };
    }
  }
}

export const apiService = new ApiService();
export type { Task, Project, Team, TeamMember, User, Sprint, Story, Company, Department, Note, NoteAttachment, ApiResponse };
