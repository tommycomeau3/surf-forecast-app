const { Pool } = require('pg');
require('dotenv').config();

// Set test environment first
process.env.NODE_ENV = 'test';

// Test database configuration
const testDbConfig = {
  host: process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.TEST_DB_PORT || process.env.DB_PORT || 5432,
  database: process.env.TEST_DB_NAME || 'surf_forecast_test',
  user: process.env.TEST_DB_USER || process.env.DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || '',
};

// Create test pool immediately
const testPool = new Pool(testDbConfig);

// Export test pool for use in tests
global.testPool = testPool;

// Setup test database connection
beforeAll(async () => {
  // Test connection
  try {
    await testPool.query('SELECT NOW()');
    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Test database connection failed:', error.message);
    console.error('💡 Make sure test database exists: npm run test:setup');
    throw error;
  }
});

// Clean up after all tests
afterAll(async () => {
  if (testPool) {
    await testPool.end();
    console.log('✅ Test database connection closed');
  }
});

// Mock external APIs by default
jest.mock('axios');