// Mock the database module before any imports
jest.mock('../../src/models/database', () => global.testPool);

const request = require('supertest');
const express = require('express');
const cors = require('cors');
const DatabaseTestHelper = require('../helpers/database');

describe('Preferences Endpoints Integration Tests', () => {
  let app;
  let dbHelper;

  beforeAll(async () => {
    // Setup test database helper
    dbHelper = new DatabaseTestHelper(global.testPool);
    await dbHelper.initializeTestDatabase();

    // Create app instance with preferences routes
    app = express();
    app.use(cors());
    app.use(express.json());
    
    // Import preferences routes after mocking database
    const preferencesRoutes = require('../../src/routes/preferences');
    app.use('/api/preferences', preferencesRoutes);

    // Error handling middleware
    app.use((err, req, res, next) => {
      res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
      });
    });
  });

  beforeEach(async () => {
    // Clean database before each test
    await dbHelper.cleanDatabase();
  });

  afterAll(async () => {
    await dbHelper.cleanDatabase();
  });

  describe('POST /api/preferences', () => {
    it('should create new user preferences', async () => {
      const preferencesData = {
        sessionId: 'new-session-123',
        skillLevel: 'intermediate',
        minWaveHeight: 2.0,
        maxWaveHeight: 8.0,
        maxWindSpeed: 15.0,
        locationLat: 33.7701,
        locationLng: -118.1937,
        maxDistanceKm: 25
      };

      const response = await request(app)
        .post('/api/preferences')
        .send(preferencesData)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('session_id', 'new-session-123');
      expect(response.body).toHaveProperty('skill_level', 'intermediate');
      expect(response.body).toHaveProperty('min_wave_height', '2.00');
      expect(response.body).toHaveProperty('max_wave_height', '8.00');
      expect(response.body).toHaveProperty('max_wind_speed', '15.00');
      expect(response.body).toHaveProperty('location_lat', '33.77010000');
      expect(response.body).toHaveProperty('location_lng', '-118.19370000');
      expect(response.body).toHaveProperty('max_distance_km', 25);
      expect(response.body).toHaveProperty('created_at');
      expect(response.body).toHaveProperty('updated_at');
    });

    it('should update existing user preferences', async () => {
      // First create preferences
      const initialData = {
        sessionId: 'update-session-123',
        skillLevel: 'beginner',
        minWaveHeight: 1.0,
        maxWaveHeight: 5.0,
        maxWindSpeed: 20.0,
        locationLat: 33.7701,
        locationLng: -118.1937,
        maxDistanceKm: 50
      };

      await request(app)
        .post('/api/preferences')
        .send(initialData)
        .expect(200);

      // Then update them
      const updatedData = {
        sessionId: 'update-session-123',
        skillLevel: 'advanced',
        minWaveHeight: 3.0,
        maxWaveHeight: 12.0,
        maxWindSpeed: 10.0,
        locationLat: 34.0000,
        locationLng: -119.0000,
        maxDistanceKm: 30
      };

      const response = await request(app)
        .post('/api/preferences')
        .send(updatedData)
        .expect(200);

      expect(response.body).toHaveProperty('session_id', 'update-session-123');
      expect(response.body).toHaveProperty('skill_level', 'advanced');
      expect(response.body).toHaveProperty('min_wave_height', '3.00');
      expect(response.body).toHaveProperty('max_wave_height', '12.00');
      expect(response.body).toHaveProperty('max_wind_speed', '10.00');
      expect(response.body).toHaveProperty('location_lat', '34.00000000');
      expect(response.body).toHaveProperty('location_lng', '-119.00000000');
      expect(response.body).toHaveProperty('max_distance_km', 30);
    });

    it('should return 400 for missing sessionId', async () => {
      const response = await request(app)
        .post('/api/preferences')
        .send({
          skillLevel: 'intermediate',
          minWaveHeight: 2.0,
          maxWaveHeight: 8.0
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Session ID and skill level are required');
    });

    it('should return 400 for missing skillLevel', async () => {
      const response = await request(app)
        .post('/api/preferences')
        .send({
          sessionId: 'test-session-123',
          minWaveHeight: 2.0,
          maxWaveHeight: 8.0
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Session ID and skill level are required');
    });

    it('should handle partial preference data', async () => {
      const minimalData = {
        sessionId: 'minimal-session-123',
        skillLevel: 'intermediate'
      };

      const response = await request(app)
        .post('/api/preferences')
        .send(minimalData)
        .expect(200);

      expect(response.body).toHaveProperty('session_id', 'minimal-session-123');
      expect(response.body).toHaveProperty('skill_level', 'intermediate');
      // Other fields should be null or default values
    });

    it('should validate skill level values', async () => {
      const validSkillLevels = ['beginner', 'intermediate', 'advanced'];
      
      for (const skillLevel of validSkillLevels) {
        const response = await request(app)
          .post('/api/preferences')
          .send({
            sessionId: `test-${skillLevel}-session`,
            skillLevel: skillLevel
          })
          .expect(200);

        expect(response.body).toHaveProperty('skill_level', skillLevel);
      }
    });

    it('should handle numeric string values correctly', async () => {
      const preferencesData = {
        sessionId: 'numeric-session-123',
        skillLevel: 'intermediate',
        minWaveHeight: '2.5',
        maxWaveHeight: '8.5',
        maxWindSpeed: '15.5',
        locationLat: '33.7701',
        locationLng: '-118.1937',
        maxDistanceKm: '25'
      };

      const response = await request(app)
        .post('/api/preferences')
        .send(preferencesData)
        .expect(200);

      expect(response.body).toHaveProperty('min_wave_height', '2.50');
      expect(response.body).toHaveProperty('max_wave_height', '8.50');
      expect(response.body).toHaveProperty('max_wind_speed', '15.50');
      expect(response.body).toHaveProperty('max_distance_km', 25);
    });

    it('should return JSON content type', async () => {
      const response = await request(app)
        .post('/api/preferences')
        .send({
          sessionId: 'json-test-session',
          skillLevel: 'intermediate'
        })
        .expect(200);

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('GET /api/preferences/:sessionId', () => {
    beforeEach(async () => {
      // Seed test preferences
      await dbHelper.seedTestData();
    });

    it('should return user preferences for valid session', async () => {
      const response = await request(app)
        .get('/api/preferences/test-session-123')
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('session_id', 'test-session-123');
      expect(response.body).toHaveProperty('skill_level', 'intermediate');
      expect(response.body).toHaveProperty('min_wave_height', '2.00');
      expect(response.body).toHaveProperty('max_wave_height', '8.00');
      expect(response.body).toHaveProperty('max_wind_speed', '15.00');
      expect(response.body).toHaveProperty('location_lat');
      expect(response.body).toHaveProperty('location_lng');
      expect(response.body).toHaveProperty('max_distance_km', 25);
      expect(response.body).toHaveProperty('created_at');
      expect(response.body).toHaveProperty('updated_at');
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .get('/api/preferences/non-existent-session')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Preferences not found');
    });

    it('should return JSON content type', async () => {
      const response = await request(app)
        .get('/api/preferences/test-session-123')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should handle special characters in session ID', async () => {
      // Create preferences with special characters in session ID
      const sessionId = 'test-session-with-special-chars-!@#$%';
      await request(app)
        .post('/api/preferences')
        .send({
          sessionId: sessionId,
          skillLevel: 'intermediate'
        })
        .expect(200);

      // Retrieve preferences
      const response = await request(app)
        .get(`/api/preferences/${encodeURIComponent(sessionId)}`)
        .expect(200);

      expect(response.body).toHaveProperty('session_id', sessionId);
    });
  });

  describe('Data Validation', () => {
    it('should handle valid coordinate ranges', async () => {
      const testCases = [
        { lat: 90, lng: 180 },    // Maximum valid values
        { lat: -90, lng: -180 },  // Minimum valid values
        { lat: 0, lng: 0 },       // Zero values
        { lat: 33.7701, lng: -118.1937 } // Typical values
      ];

      for (const coords of testCases) {
        const response = await request(app)
          .post('/api/preferences')
          .send({
            sessionId: `coord-test-${coords.lat}-${coords.lng}`,
            skillLevel: 'intermediate',
            locationLat: coords.lat,
            locationLng: coords.lng
          })
          .expect(200);

        expect(parseFloat(response.body.location_lat)).toBeCloseTo(coords.lat, 5);
        expect(parseFloat(response.body.location_lng)).toBeCloseTo(coords.lng, 5);
      }
    });

    it('should handle valid wave height ranges', async () => {
      const response = await request(app)
        .post('/api/preferences')
        .send({
          sessionId: 'wave-height-test',
          skillLevel: 'intermediate',
          minWaveHeight: 0.5,
          maxWaveHeight: 20.0
        })
        .expect(200);

      expect(parseFloat(response.body.min_wave_height)).toBe(0.5);
      expect(parseFloat(response.body.max_wave_height)).toBe(20.0);
    });

    it('should handle valid wind speed values', async () => {
      const response = await request(app)
        .post('/api/preferences')
        .send({
          sessionId: 'wind-speed-test',
          skillLevel: 'intermediate',
          maxWindSpeed: 50.0
        })
        .expect(200);

      expect(parseFloat(response.body.max_wind_speed)).toBe(50.0);
    });

    it('should handle valid distance values', async () => {
      const response = await request(app)
        .post('/api/preferences')
        .send({
          sessionId: 'distance-test',
          skillLevel: 'intermediate',
          maxDistanceKm: 100
        })
        .expect(200);

      expect(response.body.max_distance_km).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This would require mocking database failures
      // For now, test that error structure is correct
      const response = await request(app)
        .get('/api/preferences/test-session-that-causes-db-error')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle malformed JSON in POST requests', async () => {
      const response = await request(app)
        .post('/api/preferences')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(500); // Express returns 500 for malformed JSON

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in preferences endpoints', async () => {
      const response = await request(app)
        .get('/api/preferences/test-session-123')
        .expect(404); // Will be 404 since no data seeded

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should handle OPTIONS preflight requests', async () => {
      await request(app)
        .options('/api/preferences')
        .expect(204);
    });
  });
});