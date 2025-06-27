const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Surf Forecast API is running' });
});

// Import route modules
const forecastRoutes = require('./routes/forecast');
const spotsRoutes = require('./routes/spots');
const preferencesRoutes = require('./routes/preferences');

// Use routes
app.use('/api/forecast', forecastRoutes);
app.use('/api/spots', spotsRoutes);
app.use('/api/preferences', preferencesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});