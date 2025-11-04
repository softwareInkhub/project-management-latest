#!/usr/bin/env node

/**
 * Script to create the project-management-departments DynamoDB table
 * Run: node create-departments-table.js
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const TABLE_NAME = 'project-management-departments';

console.log('🔧 AWS Configuration:');
console.log(`   Region: ${process.env.AWS_REGION || 'us-east-1'}`);
console.log(`   AWS Access Key: ${process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Not Set'}`);
console.log(`   AWS Secret Key: ${process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Not Set'}`);
console.log('');

async function tableExists() {
  try {
    const command = new DescribeTableCommand({ TableName: TABLE_NAME });
    await client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

async function createDepartmentsTable() {
  console.log(`📦 Creating table: ${TABLE_NAME}...`);

  const params = {
    TableName: TABLE_NAME,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }, // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'companyId', AttributeType: 'S' },
      { AttributeName: 'name', AttributeType: 'S' },
      { AttributeName: 'active', AttributeType: 'S' }, // 'active' or 'inactive'
      { AttributeName: 'createdAt', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'companyId-index',
        KeySchema: [
          { AttributeName: 'companyId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
      {
        IndexName: 'name-index',
        KeySchema: [
          { AttributeName: 'name', KeyType: 'HASH' },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
      {
        IndexName: 'active-index',
        KeySchema: [
          { AttributeName: 'active', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST', // On-demand billing
    Tags: [
      {
        Key: 'Project',
        Value: 'BRMH',
      },
      {
        Key: 'Purpose',
        Value: 'Department Management',
      },
      {
        Key: 'Environment',
        Value: process.env.NODE_ENV || 'development',
      },
    ],
  };

  try {
    const command = new CreateTableCommand(params);
    const result = await client.send(command);
    console.log('✅ Table created successfully!');
    console.log(`   Table Name: ${TABLE_NAME}`);
    console.log(`   Table ARN: ${result.TableDescription.TableArn}`);
    console.log(`   Status: ${result.TableDescription.TableStatus}`);
    console.log('\n⏳ Waiting for table to become active...');
    
    // Wait for table to become active
    let tableActive = false;
    while (!tableActive) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const describeCommand = new DescribeTableCommand({ TableName: TABLE_NAME });
      const description = await client.send(describeCommand);
      if (description.Table.TableStatus === 'ACTIVE') {
        tableActive = true;
        console.log('✅ Table is now active and ready to use!');
      }
    }
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🔍 Checking if departments table exists...');
  
  const exists = await tableExists();
  
  if (exists) {
    console.log(`✅ Table "${TABLE_NAME}" already exists. No action needed.`);
    return;
  }
  
  console.log(`❌ Table "${TABLE_NAME}" does not exist.`);
  await createDepartmentsTable();
  
  console.log('\n🎉 Setup completed successfully!');
  console.log('\n📋 Table Structure:');
  console.log('   Primary Key:');
  console.log('     - Partition Key: id (String)');
  console.log('   Global Secondary Indexes:');
  console.log('     - companyId-index: Query all departments by company ID');
  console.log('     - name-index: Query by department name');
  console.log('     - active-index: Query by active status and creation date');
  console.log('\n💾 Data Schema Example:');
  console.log('   {');
  console.log('     id: "dept-1730745600000",');
  console.log('     name: "Engineering",');
  console.log('     description: "Product development and engineering",');
  console.log('     companyId: "company-1730745600000",');
  console.log('     teams: ["team-001", "team-002"],');
  console.log('     active: "active",');
  console.log('     tags: ["development", "product"],');
  console.log('     createdAt: "2024-11-04T10:00:00Z",');
  console.log('     updatedAt: "2024-11-04T10:00:00Z"');
  console.log('   }');
  console.log('\n💡 Usage:');
  console.log('   - Department belongs to one Company (via companyId)');
  console.log('   - Department contains multiple Teams');
  console.log('   - Teams field stores array of team IDs');
  console.log('   - Use companyId-index to query all departments for a company');
  console.log('   - Use active-index to filter active/inactive departments');
  console.log('   - Use name-index to search by department name');
}

main().catch((error) => {
  console.error('\n❌ Setup failed:', error);
  process.exit(1);
});

