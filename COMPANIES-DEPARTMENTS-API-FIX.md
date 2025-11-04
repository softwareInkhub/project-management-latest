# Companies & Departments API Integration Fix

## Problem
The initial implementation used direct AWS SDK imports which caused build failures because:
1. AWS SDK packages (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`) were not installed
2. The project uses a centralized BRMH CRUD API pattern instead of direct AWS SDK usage

## Solution
Updated to use the existing BRMH CRUD API pattern that's used throughout the project (like in task and team pages).

## Changes Made

### 1. Removed AWS SDK-based API Routes
- ❌ Deleted `/app/api/companies/route.ts`
- ❌ Deleted `/app/api/departments/route.ts`

### 2. Updated API Service (`/app/services/api.ts`)

#### Added Interface Definitions
```typescript
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
```

#### Added Company Methods
- `getCompanies()` - Fetch all companies
- `getCompanyById(id)` - Fetch specific company
- `createCompany(company)` - Create new company
- `updateCompany(id, updates)` - Update company
- `deleteCompany(id)` - Delete company

#### Added Department Methods
- `getDepartments()` - Fetch all departments
- `getDepartmentById(id)` - Fetch specific department
- `getDepartmentsByCompany(companyId)` - Filter by company
- `createDepartment(department)` - Create new department
- `updateDepartment(id, updates)` - Update department
- `deleteDepartment(id)` - Delete department

#### Updated Exports
```typescript
export const apiService = new ApiService();
export type { 
  Task, Project, Team, TeamMember, User, 
  Sprint, Story, Company, Department, ApiResponse 
};
```

### 3. Updated Frontend Pages

#### Companies Page (`/app/companies/page.tsx`)
**Before:**
```typescript
const response = await fetch('/api/companies');
const data = await response.json();
```

**After:**
```typescript
import { apiService, Company } from '../services/api';

const response = await apiService.getCompanies();
if (response.success && response.data) {
  setCompanies(response.data);
}
```

#### Departments Page (`/app/departments/page.tsx`)
**Before:**
```typescript
const [deptResponse, compResponse] = await Promise.all([
  fetch('/api/departments'),
  fetch('/api/companies')
]);
```

**After:**
```typescript
import { apiService, Department, Company } from '../services/api';

const [deptResponse, compResponse] = await Promise.all([
  apiService.getDepartments(),
  apiService.getCompanies()
]);
```

#### Dashboard Page (`/app/Dashboard/page.tsx`)
**Before:**
```typescript
fetch('/api/companies').then(res => res.json()),
fetch('/api/departments').then(res => res.json())
```

**After:**
```typescript
apiService.getCompanies(),
apiService.getDepartments()
```

## API Endpoints Used

All requests go through the centralized BRMH CRUD API:

### Base URL
```
https://brmh.in/crud
```

### Companies Table
- Table: `project-management-companies`
- GET: `?tableName=project-management-companies&pagination=true`
- POST: `?tableName=project-management-companies`
- PUT: `?tableName=project-management-companies` (with key and updates)
- DELETE: `?tableName=project-management-companies&id={id}`

### Departments Table
- Table: `project-management-departments`
- GET: `?tableName=project-management-departments&pagination=true`
- POST: `?tableName=project-management-departments`
- PUT: `?tableName=project-management-departments` (with key and updates)
- DELETE: `?tableName=project-management-departments&id={id}`

## Request/Response Format

### Create Request (POST)
```json
{
  "item": {
    "id": "company-1234567890",
    "name": "Company Name",
    "description": "Description",
    "departments": [],
    "active": "active",
    "tags": ["tag1", "tag2"],
    "createdAt": "2024-11-04T10:00:00Z",
    "updatedAt": "2024-11-04T10:00:00Z"
  }
}
```

### Update Request (PUT)
```json
{
  "key": {
    "id": "company-1234567890"
  },
  "updates": {
    "name": "Updated Name",
    "description": "Updated Description",
    "updatedAt": "2024-11-04T11:00:00Z"
  }
}
```

### Response Format
```json
{
  "success": true,
  "data": { /* item data */ }
}
```

or

```json
{
  "success": true,
  "items": [ /* array of items */ ]
}
```

## Benefits

1. **Consistent Pattern**: Uses the same API pattern as tasks, teams, projects, etc.
2. **No Additional Dependencies**: No need to install AWS SDK packages
3. **Centralized Logic**: All DynamoDB format conversion handled in one place
4. **Better Error Handling**: Consistent error handling across all API calls
5. **Easier Maintenance**: One place to update API logic if needed

## Build Status

✅ **Build successful** - No AWS SDK dependency errors
✅ **No linter errors**
✅ **All pages properly typed**

## Testing

To test the implementation:

1. **Ensure tables exist** (run if not already created):
   ```bash
   node create-companies-table.js
   node create-departments-table.js
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Test the pages**:
   - Companies: http://localhost:3000/companies
   - Departments: http://localhost:3000/departments
   - Dashboard: http://localhost:3000/Dashboard (with analytics)

## Notes

- All CRUD operations now go through the BRMH API
- The DynamoDB format conversion is automatic via `apiService.makeRequest()`
- No direct AWS SDK usage in the application code
- Tables must already exist in DynamoDB (created via the setup scripts)

