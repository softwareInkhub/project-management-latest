#!/usr/bin/env node

/**
 * Script to create the project-management-companies DynamoDB table
 * Run: node create-companies-table.js
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const TABLE_NAME = 'project-management-companies';

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

async function createCompaniesTable() {
  console.log(`📦 Creating table: ${TABLE_NAME}...`);

  const params = {
    TableName: TABLE_NAME,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }, // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'name', AttributeType: 'S' },
      { AttributeName: 'active', AttributeType: 'S' }, // 'active' or 'inactive'
      { AttributeName: 'createdAt', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
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
        Value: 'Company Management',
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
  console.log('🔍 Checking if companies table exists...');
  
  const exists = await tableExists();
  
  if (exists) {
    console.log(`✅ Table "${TABLE_NAME}" already exists. No action needed.`);
    return;
  }
  
  console.log(`❌ Table "${TABLE_NAME}" does not exist.`);
  await createCompaniesTable();
  
  console.log('\n🎉 Setup completed successfully!');
  console.log('\n📋 Table Structure:');
  console.log('   Primary Key:');
  console.log('     - Partition Key: id (String)');
  console.log('   Global Secondary Indexes:');
  console.log('     - name-index: Query by company name');
  console.log('     - active-index: Query by active status and creation date');
  console.log('\n💾 Data Schema Example:');
  console.log('   {');
  console.log('     id: "company-1730745600000",');
  console.log('     name: "BRMH Technologies",');
  console.log('     description: "Main technology company",');
  console.log('     departments: ["dept-001", "dept-002"],');
  console.log('     active: "active",');
  console.log('     tags: ["tech", "software"],');
  console.log('     createdAt: "2024-11-04T10:00:00Z",');
  console.log('     updatedAt: "2024-11-04T10:00:00Z"');
  console.log('   }');
  console.log('\n💡 Usage:');
  console.log('   - Company contains multiple Departments');
  console.log('   - Departments field stores array of department IDs');
  console.log('   - Use active-index to query active/inactive companies');
  console.log('   - Use name-index to search by company name');
}

main().catch((error) => {
  console.error('\n❌ Setup failed:', error);
  process.exit(1);
});

