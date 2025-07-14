// Mock the database module before any imports
jest.mock('../../src/models/database', () => global.testPool);

const request = require('supertest');
const express = require('express');
const cors = require('cors');
const DatabaseTestHelper = require('../helpers/database');
const MockHelper = require('../helpers/mocks');

describe('Forecast Endpoints Integration Tests', () => {
  let app;
  let dbHelper;

  beforeAll(async () => {
    // Setup test database helper
    dbHelper = new DatabaseTestHelper(global.testPool);
    await dbHelper.initializeTestDatabase();

    // Setup external API mocks
    MockHelper.setupDefaultMocks();

    // Create app instance with forecast routes
    app = express();
    app.use(cors());
    app.use(express.json());
    
    // Import forecast routes after mocking database
    const forecastRoutes = require('../../src/routes/forecast');
    app.use('/api/forecast', forecastRoutes);

    // Error handling middleware
    app.use((err, req, res, next) => {
      res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
      });
    });
  });

  beforeEach(async () => {
    // Clean and seed database before each test
    await dbHelper.cleanDatabase();
    await dbHelper.seedTestData();
    
    // Reset mocks
    MockHelper.cleanAll();
    MockHelper.setupDefaultMocks();
  });

  afterAll(async () => {
    await dbHelper.cleanDatabase();
    MockHelper.cleanAll();
  });

  describe('GET /api/forecast/spot/:id', () => {
    it('should return forecast for valid spot ID', async () => {
      const testSpot = await dbHelper.getTestSpot('Test Beach');
      
      const response = await request(app)
        .get(`/api/forecast/spot/${testSpot.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('spot');
      expect(response.body).toHaveProperty('forecast');
      
      // Validate spot data
      expect(response.body.spot).toHaveProperty('id', testSpot.id);
      expect(response.body.spot).toHaveProperty('name', 'Test Beach');
      
      // Validate forecast structure
      expect(response.body.forecast).toBeDefined();
    });

    it('should return 404 for non-existent spot ID', async () => {
      const response = await request(app)
        .get('/api/forecast/spot/99999')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Surf spot not found');
    });

    it('should handle external API failures gracefully', async () => {
      // Mock external API failure
      MockHelper.mockWeatherAPIFailure();
      
      const testSpot = await dbHelper.getTestSpot('Test Beach');
      
      const response = await request(app)
        .get(`/api/forecast/spot/${testSpot.id}`)
        .expect(200);
  
      // Should return empty forecast array when APIs fail
      expect(response.body).toHaveProperty('spot');
      expect(response.body).toHaveProperty('forecast');
      expect(Array.isArray(response.body.forecast)).toBe(true);
    });

    it('should return JSON content type', async () => {
      const testSpot = await dbHelper.getTestSpot('Test Beach');
      
      const response = await request(app)
        .get(`/api/forecast/spot/${testSpot.id}`)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('POST /api/forecast/ranked', () => {
    it('should return ranked spots for valid session', async () => {
      const response = await request(app)
        .post('/api/forecast/ranked')
        .send({
          sessionId: 'test-session-123',
          lat: 33.7701,
          lng: -118.1937,
          radius: 25
        })
        .expect(200);

      expect(response.body).toHaveProperty('rankedSpots');
      expect(response.body).toHaveProperty('userPreferences');
      
      // Validate ranked spots structure
      expect(Array.isArray(response.body.rankedSpots)).toBe(true);
      
      // Validate user preferences structure
      const userPrefs = response.body.userPreferences;
      expect(userPrefs).toHaveProperty('skillLevel');
      expect(userPrefs).toHaveProperty('waveHeightRange');
      expect(userPrefs).toHaveProperty('maxWindSpeed');
      expect(userPrefs).toHaveProperty('maxDistance');
    });

    it('should return 400 for missing sessionId', async () => {
      const response = await request(app)
        .post('/api/forecast/ranked')
        .send({
          lat: 33.7701,
          lng: -118.1937,
          radius: 25
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Session ID is required');
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .post('/api/forecast/ranked')
        .send({
          sessionId: 'non-existent-session',
          lat: 33.7701,
          lng: -118.1937,
          radius: 25
        })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User preferences not found');
    });

    it('should use user saved location when lat/lng not provided', async () => {
      const response = await request(app)
        .post('/api/forecast/ranked')
        .send({
          sessionId: 'test-session-123',
          radius: 25
        })
        .expect(200);

      expect(response.body).toHaveProperty('rankedSpots');
      expect(response.body).toHaveProperty('userPreferences');
    });

    it('should return 400 when no location is available', async () => {
      // Create user preferences without location
      await global.testPool.query(`
        INSERT INTO user_preferences (session_id, skill_level, min_wave_height, max_wave_height, max_wind_speed, max_distance_km) 
        VALUES ('no-location-session', 'intermediate', 2.0, 8.0, 15.0, 25)
      `);

      const response = await request(app)
        .post('/api/forecast/ranked')
        .send({
          sessionId: 'no-location-session',
          radius: 25
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Location is required');
    });

    it('should handle custom radius parameter', async () => {
      const response = await request(app)
        .post('/api/forecast/ranked')
        .send({
          sessionId: 'test-session-123',
          lat: 33.7701,
          lng: -118.1937,
          radius: 10
        })
        .expect(200);

      expect(response.body).toHaveProperty('rankedSpots');
      
      // All spots should be within 10km
      response.body.rankedSpots.forEach(spot => {
        if (spot.distance_km) {
          expect(parseFloat(spot.distance_km)).toBeLessThanOrEqual(10);
        }
      });
    });

    it('should return empty results for location with no nearby spots', async () => {
      const response = await request(app)
        .post('/api/forecast/ranked')
        .send({
          sessionId: 'test-session-123',
          lat: 90, // North Pole - no surf spots nearby
          lng: 0,
          radius: 1
        })
        .expect(200);
  
      expect(response.body).toHaveProperty('rankedSpots');
      expect(response.body.rankedSpots).toEqual([]);
      expect(response.body).toHaveProperty('message', 'No surf spots found in the specified area');
    });
  });

  describe('POST /api/forecast/conditions', () => {
    it('should return conditions for valid spot IDs', async () => {
      const testSpot1 = await dbHelper.getTestSpot('Test Beach');
      const testSpot2 = await dbHelper.getTestSpot('Advanced Reef');
      
      const response = await request(app)
        .post('/api/forecast/conditions')
        .send({
          spotIds: [testSpot1.id, testSpot2.id]
        })
        .expect(200);

      expect(response.body).toHaveProperty('conditions');
      expect(Array.isArray(response.body.conditions)).toBe(true);
      expect(response.body.conditions.length).toBeGreaterThan(0);
      
      // Validate conditions structure
      response.body.conditions.forEach(condition => {
        expect(condition).toHaveProperty('spotId');
        expect(condition).toHaveProperty('spotName');
        expect(condition).toHaveProperty('conditions');
        expect(condition).toHaveProperty('lastUpdated');
      });
    });

    it('should return 400 for missing spotIds', async () => {
      const response = await request(app)
        .post('/api/forecast/conditions')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Spot IDs array is required');
    });

    it('should return 400 for invalid spotIds format', async () => {
      const response = await request(app)
        .post('/api/forecast/conditions')
        .send({
          spotIds: 'not-an-array'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Spot IDs array is required');
    });

    it('should handle empty spotIds array', async () => {
      const response = await request(app)
        .post('/api/forecast/conditions')
        .send({
          spotIds: []
        })
        .expect(200);

      expect(response.body).toHaveProperty('conditions');
      expect(response.body.conditions).toEqual([]);
    });

    it('should skip non-existent spot IDs gracefully', async () => {
      const testSpot = await dbHelper.getTestSpot('Test Beach');
      
      const response = await request(app)
        .post('/api/forecast/conditions')
        .send({
          spotIds: [testSpot.id, 99999, 99998]
        })
        .expect(200);

      expect(response.body).toHaveProperty('conditions');
      expect(response.body.conditions.length).toBe(1);
      expect(response.body.conditions[0].spotId).toBe(testSpot.id);
    });

    it('should handle external API failures for individual spots', async () => {
      // Mock external API failure
      MockHelper.mockWeatherAPIFailure();
      
      const testSpot = await dbHelper.getTestSpot('Test Beach');
      
      const response = await request(app)
        .post('/api/forecast/conditions')
        .send({
          spotIds: [testSpot.id]
        })
        .expect(200);
  
      // Should still return conditions with default values when external APIs fail
      expect(response.body).toHaveProperty('conditions');
      expect(Array.isArray(response.body.conditions)).toBe(true);
      // The service returns default conditions even when APIs fail
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      const response = await request(app)
        .get('/api/forecast/spot/invalid-id')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should return JSON content type for all endpoints', async () => {
      const testSpot = await dbHelper.getTestSpot('Test Beach');
      
      // Test spot forecast endpoint
      const spotResponse = await request(app)
        .get(`/api/forecast/spot/${testSpot.id}`)
        .expect(200);
      expect(spotResponse.headers['content-type']).toMatch(/json/);

      // Test ranked forecast endpoint
      const rankedResponse = await request(app)
        .post('/api/forecast/ranked')
        .send({
          sessionId: 'test-session-123',
          lat: 33.7701,
          lng: -118.1937
        })
        .expect(200);
      expect(rankedResponse.headers['content-type']).toMatch(/json/);

      // Test conditions endpoint
      const conditionsResponse = await request(app)
        .post('/api/forecast/conditions')
        .send({
          spotIds: [testSpot.id]
        })
        .expect(200);
      expect(conditionsResponse.headers['content-type']).toMatch(/json/);
    });
  });
});