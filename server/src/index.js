const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.log('🚀 Starting Surf Forecast API Server...');
console.log('📍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔌 Port:', process.env.PORT || 5000);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route (no database required)
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({ 
    status: 'OK', 
    message: 'Surf Forecast API is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Test route to check if server is responding
app.get('/api/test', (req, res) => {
  console.log('🧪 Test endpoint hit');
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Import route modules with error handling
let forecastRoutes, spotsRoutes, preferencesRoutes;

try {
  console.log('📦 Loading route modules...');
  forecastRoutes = require('./routes/forecast');
  spotsRoutes = require('./routes/spots');
  preferencesRoutes = require('./routes/preferences');
  console.log('✅ All route modules loaded successfully');
} catch (error) {
  console.error('❌ Error loading route modules:', error.message);
  console.error('💡 This might be due to database connection issues');
  console.error('Full error:', error);
}

// Use routes only if they loaded successfully
if (forecastRoutes && spotsRoutes && preferencesRoutes) {
  try {
    console.log('📋 Registering API routes...');
    app.use('/api/forecast', forecastRoutes);
    console.log('✅ Forecast routes registered');
    app.use('/api/spots', spotsRoutes);
    console.log('✅ Spots routes registered');
    app.use('/api/preferences', preferencesRoutes);
    console.log('✅ Preferences routes registered');
    console.log('✅ All API routes registered successfully');
  } catch (error) {
    console.error('❌ Error registering routes:', error.message);
    console.error('Full error:', error);
  }
} else {
  console.log('⚠️  Some routes not loaded - running in limited mode');
  
  // Fallback routes for debugging
  app.get('/api/spots', (req, res) => {
    res.status(503).json({ error: 'Database not available - check server logs' });
  });
  
  app.get('/api/preferences/*', (req, res) => {
    res.status(503).json({ error: 'Database not available - check server logs' });
  });
  
  app.post('/api/forecast/ranked', (req, res) => {
    res.status(503).json({ error: 'Database not available - check server logs' });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Server error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Simple 404 handler (avoid problematic wildcard)
app.use((req, res) => {
  console.log('🔍 404 - Route not found:', req.originalUrl);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    availableRoutes: ['/api/health', '/api/test', '/api/spots', '/api/preferences', '/api/forecast']
  });
});

// Start server with error handling
const server = app.listen(PORT, (err) => {
  if (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
  
  console.log('🎉 Server started successfully!');
  console.log(`🌐 Server running on http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log(`   - Health: http://localhost:${PORT}/api/health`);
  console.log(`   - Test: http://localhost:${PORT}/api/test`);
  console.log(`   - Spots: http://localhost:${PORT}/api/spots`);
  console.log('');
  console.log('💡 If you see database errors above, the routes will run in limited mode');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  console.error('🛑 Shutting down due to uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('🛑 Shutting down due to unhandled promise rejection');
  process.exit(1);
});