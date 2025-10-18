// API Service for BRMH Project Management System
// Base URLs: CRUD API: https://brmh.in/crud, Notification API: https://brmh.in/notify

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
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  progress: number;
  team: any[];
  createdAt: string;
  updatedAt: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: any[];
  createdAt: string;
  updatedAt: string;
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
    const payload = {
      item: {
        ...task,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    };

    return this.makeRequest<Task>('?tableName=project-management-tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
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

    return this.makeRequest<Task>('?tableName=project-management-tasks', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteTask(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`?tableName=project-management-tasks&id=${id}`, {
      method: 'DELETE',
    });
  }

  // Project Operations
  async getProjects(): Promise<ApiResponse<Project[]>> {
    return this.makeRequest<Project[]>('?tableName=projects', {
      method: 'GET',
    });
  }

  async getProjectById(id: string): Promise<ApiResponse<Project>> {
    return this.makeRequest<Project>(`?tableName=projects&id=${id}`, {
      method: 'GET',
    });
  }

  async createProject(project: Partial<Project>): Promise<ApiResponse<Project>> {
    const payload = {
      item: {
        ...project,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    };

    return this.makeRequest<Project>('?tableName=projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<ApiResponse<Project>> {
    const payload = {
      id,
      updates: {
        ...updates,
        updatedAt: new Date().toISOString(),
      }
    };

    return this.makeRequest<Project>('?tableName=projects', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteProject(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`?tableName=projects&id=${id}`, {
      method: 'DELETE',
    });
  }

  // Team Operations
  async getTeams(): Promise<ApiResponse<Team[]>> {
    return this.makeRequest<Team[]>('?tableName=teams', {
      method: 'GET',
    });
  }

  async getTeamById(id: string): Promise<ApiResponse<Team>> {
    return this.makeRequest<Team>(`?tableName=teams&id=${id}`, {
      method: 'GET',
    });
  }

  async createTeam(team: Partial<Team>): Promise<ApiResponse<Team>> {
    const payload = {
      item: {
        ...team,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    };

    return this.makeRequest<Team>('?tableName=teams', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<ApiResponse<Team>> {
    const payload = {
      id,
      updates: {
        ...updates,
        updatedAt: new Date().toISOString(),
      }
    };

    return this.makeRequest<Team>('?tableName=teams', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteTeam(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`?tableName=teams&id=${id}`, {
      method: 'DELETE',
    });
  }

  // User Operations
  async getUsers(): Promise<ApiResponse<User[]>> {
    return this.makeRequest<User[]>('?tableName=brmh-users', {
      method: 'GET',
    });
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
      id,
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
export type { Task, Project, Team, User, ApiResponse };
