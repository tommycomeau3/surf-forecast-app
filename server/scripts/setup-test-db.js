#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Script to set up the test database for integration tests
 */
async function setupTestDatabase() {
  const dbConfig = {
    host: process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost',
    port: process.env.TEST_DB_PORT || process.env.DB_PORT || 5432,
    user: process.env.TEST_DB_USER || process.env.DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || '',
  };

  const testDbName = process.env.TEST_DB_NAME || 'surf_forecast_test';

  console.log('🔧 Setting up test database...');
  console.log(`📍 Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`👤 User: ${dbConfig.user}`);
  console.log(`🗄️  Database: ${testDbName}`);

  // Connect to PostgreSQL (without specifying database)
  const client = new Client({
    ...dbConfig,
    database: 'postgres' // Connect to default postgres database first
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if test database exists
    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
    const result = await client.query(checkDbQuery, [testDbName]);

    if (result.rows.length === 0) {
      // Create test database
      console.log(`🔨 Creating test database: ${testDbName}`);
      await client.query(`CREATE DATABASE "${testDbName}"`);
      console.log('✅ Test database created');
    } else {
      console.log('ℹ️  Test database already exists');
    }

    await client.end();

    // Connect to the test database to initialize schema
    const testClient = new Client({
      ...dbConfig,
      database: testDbName
    });

    await testClient.connect();
    console.log('✅ Connected to test database');

    // Read and execute init.sql
    const initSqlPath = path.join(__dirname, '../src/models/init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');

    console.log('📋 Initializing database schema...');
    await testClient.query(initSql);
    console.log('✅ Database schema initialized');

    await testClient.end();

    console.log('🎉 Test database setup complete!');
    console.log('');
    console.log('You can now run tests with:');
    console.log('  npm test');
    console.log('  npm run test:watch');
    console.log('  npm run test:coverage');

  } catch (error) {
    console.error('❌ Error setting up test database:', error.message);
    console.error('');
    console.error('💡 Troubleshooting tips:');
    console.error('   1. Make sure PostgreSQL is running');
    console.error('   2. Check your database credentials in .env or .env.test');
    console.error('   3. Ensure the user has permission to create databases');
    console.error('   4. Try connecting manually: psql -h localhost -U postgres');
    process.exit(1);
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupTestDatabase();
}

module.exports = setupTestDatabase;