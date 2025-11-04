# Company and Department Schema Documentation

## Overview

This document describes the schema for Company and Department tables in DynamoDB for the project management system.

## Hierarchy Structure

```
Company
  └── Department (multiple)
       └── Team (multiple)
            └── Project (multiple)
                 └── Task (multiple)
```

## Table Names

- **Companies**: `project-management-companies`
- **Departments**: `project-management-departments`

---

## 📋 Company Schema

### Table: `project-management-companies`

#### Primary Key
- **Partition Key**: `id` (String) - Format: `company-{timestamp}`

#### Attributes

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String | ✅ | Unique company identifier |
| `name` | String | ✅ | Company name |
| `description` | String | ❌ | Brief description of the company |
| `departments` | String[] | ❌ | Array of department IDs |
| `active` | String | ✅ | Status: "active" or "inactive" |
| `tags` | String[] | ❌ | Tags for categorization |
| `createdAt` | String (ISO) | ✅ | Creation timestamp |
| `updatedAt` | String (ISO | ✅ | Last update timestamp |

#### Global Secondary Indexes

1. **name-index**
   - Partition Key: `name`
   - Use: Query/search by company name

2. **active-index**
   - Partition Key: `active`
   - Sort Key: `createdAt`
   - Use: Filter active/inactive companies, sorted by creation date

#### TypeScript Interface

```typescript
interface Company {
  id: string;
  name: string;
  description?: string;
  departments?: string[];
  active: 'active' | 'inactive';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}
```

#### Example Data

```json
{
  "id": "company-1730745600000",
  "name": "BRMH Technologies",
  "description": "Main technology company",
  "departments": ["dept-001", "dept-002", "dept-003"],
  "active": "active",
  "tags": ["tech", "software"],
  "createdAt": "2024-11-04T10:00:00Z",
  "updatedAt": "2024-11-04T10:00:00Z"
}
```

---

## 📋 Department Schema

### Table: `project-management-departments`

#### Primary Key
- **Partition Key**: `id` (String) - Format: `dept-{timestamp}`

#### Attributes

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String | ✅ | Unique department identifier |
| `name` | String | ✅ | Department name |
| `description` | String | ❌ | Brief description of the department |
| `companyId` | String | ✅ | Parent company ID |
| `teams` | String[] | ❌ | Array of team IDs |
| `active` | String | ✅ | Status: "active" or "inactive" |
| `tags` | String[] | ❌ | Tags for categorization |
| `createdAt` | String (ISO) | ✅ | Creation timestamp |
| `updatedAt` | String (ISO) | ✅ | Last update timestamp |

#### Global Secondary Indexes

1. **companyId-index** ⭐ Most Important
   - Partition Key: `companyId`
   - Sort Key: `createdAt`
   - Use: Query all departments for a specific company

2. **name-index**
   - Partition Key: `name`
   - Use: Query/search by department name

3. **active-index**
   - Partition Key: `active`
   - Sort Key: `createdAt`
   - Use: Filter active/inactive departments, sorted by creation date

#### TypeScript Interface

```typescript
interface Department {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  teams?: string[];
  active: 'active' | 'inactive';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}
```

#### Example Data

```json
{
  "id": "dept-1730745600000",
  "name": "Engineering",
  "description": "Product development and engineering",
  "companyId": "company-1730745600000",
  "teams": ["team-001", "team-002", "team-003"],
  "active": "active",
  "tags": ["development", "product"],
  "createdAt": "2024-11-04T10:00:00Z",
  "updatedAt": "2024-11-04T10:00:00Z"
}
```

---

## 🔄 Relationships

### Company → Department (One-to-Many)
- A Company has a `departments` array with department IDs
- Each Department has a `companyId` field referencing its parent company
- Query pattern: Use `companyId-index` on departments table

### Department → Team (One-to-Many)
- A Department has a `teams` array with team IDs
- Teams should be updated to include a `departmentId` field (future enhancement)
- Query pattern: Filter teams array or add `departmentId` to teams table

---

## 📊 Query Patterns

### Get all departments for a company
```javascript
const params = {
  TableName: 'project-management-departments',
  IndexName: 'companyId-index',
  KeyConditionExpression: 'companyId = :companyId',
  ExpressionAttributeValues: {
    ':companyId': 'company-1730745600000'
  }
};
```

### Get all active companies
```javascript
const params = {
  TableName: 'project-management-companies',
  IndexName: 'active-index',
  KeyConditionExpression: 'active = :active',
  ExpressionAttributeValues: {
    ':active': 'active'
  }
};
```

### Get company by name
```javascript
const params = {
  TableName: 'project-management-companies',
  IndexName: 'name-index',
  KeyConditionExpression: 'name = :name',
  ExpressionAttributeValues: {
    ':name': 'BRMH Technologies'
  }
};
```

---

## 🚀 Setup Instructions

### 1. Create Companies Table
```bash
node create-companies-table.js
```

### 2. Create Departments Table
```bash
node create-departments-table.js
```

### 3. Verify Tables
```bash
aws dynamodb list-tables --region us-east-1
```

---

## 🔧 API Integration

Add these methods to `app/services/api.ts`:

### Company Methods
```typescript
// Get all companies
async getCompanies(): Promise<ApiResponse<Company[]>>

// Get company by ID
async getCompanyById(id: string): Promise<ApiResponse<Company>>

// Create company
async createCompany(company: Partial<Company>): Promise<ApiResponse<Company>>

// Update company
async updateCompany(id: string, updates: Partial<Company>): Promise<ApiResponse<Company>>

// Delete company
async deleteCompany(id: string): Promise<ApiResponse<void>>
```

### Department Methods
```typescript
// Get all departments
async getDepartments(): Promise<ApiResponse<Department[]>>

// Get departments by company
async getDepartmentsByCompany(companyId: string): Promise<ApiResponse<Department[]>>

// Get department by ID
async getDepartmentById(id: string): Promise<ApiResponse<Department>>

// Create department
async createDepartment(department: Partial<Department>): Promise<ApiResponse<Department>>

// Update department
async updateDepartment(id: string, updates: Partial<Department>): Promise<ApiResponse<Department>>

// Delete department
async deleteDepartment(id: string): Promise<ApiResponse<void>>
```

---

## 💡 Best Practices

1. **Always set timestamps**: Use ISO 8601 format for all date fields
2. **Use active status**: Mark entities as "active" or "inactive" instead of deleting
3. **Maintain relationships**: Update parent arrays when creating/deleting child entities
4. **Use GSI efficiently**: Query by companyId for departments, not by scanning
5. **Consistent ID format**: Use `{entity}-{timestamp}` pattern for all IDs
6. **Validate relationships**: Ensure parent entity exists before creating child
7. **Cascading updates**: When archiving a company, consider archiving its departments

---

## 🔐 Access Patterns

| Use Case | Table | Index | Key Condition |
|----------|-------|-------|---------------|
| Get company by ID | Companies | Primary | `id = ?` |
| List all active companies | Companies | active-index | `active = 'active'` |
| Search company by name | Companies | name-index | `name = ?` |
| Get department by ID | Departments | Primary | `id = ?` |
| List departments in company | Departments | companyId-index | `companyId = ?` |
| List all active departments | Departments | active-index | `active = 'active'` |
| Search department by name | Departments | name-index | `name = ?` |

---

## 📝 Notes

- **Minimal Design**: No budget, revenue, or size fields - only what's needed for management
- **Scalable**: GSI structure allows efficient querying as data grows
- **Consistent**: Follows same patterns as existing teams, projects, tasks tables
- **Future-proof**: Easy to add fields without schema changes (NoSQL benefit)

---

## 🎯 Next Steps

1. Run the table creation scripts
2. Update TypeScript interfaces in `app/services/api.ts`
3. Implement CRUD methods in ApiService class
4. Create UI components for company/department management
5. Update team creation to include departmentId reference
6. Update project creation to show company hierarchy

