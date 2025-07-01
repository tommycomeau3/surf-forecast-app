const { Pool } = require('pg');
require('dotenv').config();

console.log('🔧 Database Configuration:');
console.log('- Host:', process.env.DB_HOST || 'localhost');
console.log('- Port:', process.env.DB_PORT || 5432);
console.log('- Database:', process.env.DB_NAME || 'surf_forecast');
console.log('- User:', process.env.DB_USER || 'postgres');
console.log('- Password:', process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'surf_forecast',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err.message);
  console.error('💡 Troubleshooting tips:');
  console.error('   1. Make sure PostgreSQL is running: brew services start postgresql@15');
  console.error('   2. Check your database credentials in server/.env');
  console.error('   3. Ensure the database "surf_forecast" exists: createdb surf_forecast');
  console.error('   4. Initialize database: psql -d surf_forecast -f server/src/models/init.sql');
});

// Test the connection immediately
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Failed to connect to database:', err.message);
    console.error('💡 The server will start but routes may not work properly');
    console.error('💡 Fix the database connection to enable full functionality');
  } else {
    console.log('✅ Database connection test successful');
    release();
  }
});

module.exports = pool;