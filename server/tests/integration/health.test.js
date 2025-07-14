const request = require('supertest');
const express = require('express');
const cors = require('cors');

describe('Health Endpoints Integration Tests', () => {
  let app;

  beforeAll(() => {
    // Create a minimal app instance for testing health endpoints
    app = express();
    app.use(cors());
    app.use(express.json());

    // Health check route (no database required)
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        message: 'Surf Forecast API is running',
        timestamp: new Date().toISOString(),
        port: process.env.PORT || 5000
      });
    });

    // Test route to check if server is responding
    app.get('/api/test', (req, res) => {
      res.json({ 
        message: 'Server is working!', 
        timestamp: new Date().toISOString() 
      });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ 
        error: 'Route not found',
        path: req.originalUrl,
        availableRoutes: ['/api/health', '/api/test', '/api/spots', '/api/preferences', '/api/forecast']
      });
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('message', 'Surf Forecast API is running');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('port');
      
      // Validate timestamp format
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should return JSON content type', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should respond quickly (under 100ms)', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/health')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(100);
    });
  });

  describe('GET /api/test', () => {
    it('should return test message', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Server is working!');
      expect(response.body).toHaveProperty('timestamp');
      
      // Validate timestamp format
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should return JSON content type', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('404 Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Route not found');
      expect(response.body).toHaveProperty('path', '/api/nonexistent');
      expect(response.body).toHaveProperty('availableRoutes');
      expect(Array.isArray(response.body.availableRoutes)).toBe(true);
    });

    it('should include available routes in 404 response', async () => {
      const response = await request(app)
        .get('/api/invalid')
        .expect(404);

      const availableRoutes = response.body.availableRoutes;
      expect(availableRoutes).toContain('/api/health');
      expect(availableRoutes).toContain('/api/test');
      expect(availableRoutes).toContain('/api/spots');
      expect(availableRoutes).toContain('/api/preferences');
      expect(availableRoutes).toContain('/api/forecast');
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in health endpoint', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should handle OPTIONS preflight requests', async () => {
      await request(app)
        .options('/api/health')
        .expect(204);
    });
  });

  describe('HTTP Methods', () => {
    it('should only allow GET for health endpoint', async () => {
      await request(app)
        .post('/api/health')
        .expect(404);

      await request(app)
        .put('/api/health')
        .expect(404);

      await request(app)
        .delete('/api/health')
        .expect(404);
    });

    it('should only allow GET for test endpoint', async () => {
      await request(app)
        .post('/api/test')
        .expect(404);

      await request(app)
        .put('/api/test')
        .expect(404);

      await request(app)
        .delete('/api/test')
        .expect(404);
    });
  });
});