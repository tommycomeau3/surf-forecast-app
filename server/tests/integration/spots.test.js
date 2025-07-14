// Mock the database module before any imports
jest.mock('../../src/models/database', () => global.testPool);

const request = require('supertest');
const express = require('express');
const cors = require('cors');
const DatabaseTestHelper = require('../helpers/database');

describe('Spots Endpoints Integration Tests', () => {
  let app;
  let dbHelper;

  beforeAll(async () => {
    // Setup test database helper
    dbHelper = new DatabaseTestHelper(global.testPool);
    await dbHelper.initializeTestDatabase();

    // Create app instance with spots routes
    app = express();
    app.use(cors());
    app.use(express.json());
    
    // Import spots routes after mocking database
    const spotsRoutes = require('../../src/routes/spots');
    app.use('/api/spots', spotsRoutes);

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
  });

  afterAll(async () => {
    await dbHelper.cleanDatabase();
  });

  describe('GET /api/spots', () => {
    it('should return all surf spots', async () => {
      const response = await request(app)
        .get('/api/spots')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Check structure of first spot
      const spot = response.body[0];
      expect(spot).toHaveProperty('id');
      expect(spot).toHaveProperty('name');
      expect(spot).toHaveProperty('latitude');
      expect(spot).toHaveProperty('longitude');
      expect(spot).toHaveProperty('region');
      expect(spot).toHaveProperty('break_type');
      expect(spot).toHaveProperty('difficulty_level');
    });

    it('should return spots ordered by name', async () => {
      const response = await request(app)
        .get('/api/spots')
        .expect(200);

      const names = response.body.map(spot => spot.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    it('should return JSON content type', async () => {
      const response = await request(app)
        .get('/api/spots')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('GET /api/spots/nearby', () => {
    it('should return nearby spots with valid coordinates', async () => {
      const response = await request(app)
        .get('/api/spots/nearby')
        .query({
          lat: 33.7701,
          lng: -118.1937,
          radius: 50
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // Each spot should have distance_km property
      response.body.forEach(spot => {
        expect(spot).toHaveProperty('distance_km');
        expect(typeof spot.distance_km).toBe('number'); // PostgreSQL returns as number
        expect(spot.distance_km).toBeLessThanOrEqual(50);
      });
    });

    it('should return spots ordered by distance', async () => {
      const response = await request(app)
        .get('/api/spots/nearby')
        .query({
          lat: 33.7701,
          lng: -118.1937,
          radius: 100
        })
        .expect(200);

      if (response.body.length > 1) {
        const distances = response.body.map(spot => spot.distance_km);
        for (let i = 1; i < distances.length; i++) {
          expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]);
        }
      }
    });

    it('should return 400 for missing latitude', async () => {
      const response = await request(app)
        .get('/api/spots/nearby')
        .query({
          lng: -118.1937,
          radius: 50
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Latitude and longitude are required');
    });

    it('should return 400 for missing longitude', async () => {
      const response = await request(app)
        .get('/api/spots/nearby')
        .query({
          lat: 33.7701,
          radius: 50
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Latitude and longitude are required');
    });

    it('should use default radius of 50km when not specified', async () => {
      const response = await request(app)
        .get('/api/spots/nearby')
        .query({
          lat: 33.7701,
          lng: -118.1937
        })
        .expect(200);

      // All spots should be within 50km
      response.body.forEach(spot => {
        expect(spot.distance_km).toBeLessThanOrEqual(50);
      });
    });

    it('should handle custom radius parameter', async () => {
      const response = await request(app)
        .get('/api/spots/nearby')
        .query({
          lat: 33.7701,
          lng: -118.1937,
          radius: 25
        })
        .expect(200);

      // All spots should be within 25km
      response.body.forEach(spot => {
        expect(spot.distance_km).toBeLessThanOrEqual(25);
      });
    });

    it('should return empty array for location with no nearby spots', async () => {
      const response = await request(app)
        .get('/api/spots/nearby')
        .query({
          lat: 0,
          lng: 0,
          radius: 1
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /api/spots/:id', () => {
    it('should return specific spot by ID', async () => {
      // Get a test spot first
      const testSpot = await dbHelper.getTestSpot('Test Beach');
      
      const response = await request(app)
        .get(`/api/spots/${testSpot.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testSpot.id);
      expect(response.body).toHaveProperty('name', 'Test Beach');
      expect(response.body).toHaveProperty('latitude');
      expect(response.body).toHaveProperty('longitude');
      expect(response.body).toHaveProperty('region');
      expect(response.body).toHaveProperty('break_type');
      expect(response.body).toHaveProperty('difficulty_level');
    });

    it('should return 404 for non-existent spot ID', async () => {
      const response = await request(app)
        .get('/api/spots/99999')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Surf spot not found');
    });

    it('should handle invalid spot ID format', async () => {
      const response = await request(app)
        .get('/api/spots/invalid-id')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should return JSON content type', async () => {
      const testSpot = await dbHelper.getTestSpot('Test Beach');
      
      const response = await request(app)
        .get(`/api/spots/${testSpot.id}`)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database failures
      // For now, we'll test that the error structure is correct
      const response = await request(app)
        .get('/api/spots/invalid-id')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Data Validation', () => {
    it('should return valid latitude and longitude ranges', async () => {
      const response = await request(app)
        .get('/api/spots')
        .expect(200);

      response.body.forEach(spot => {
        expect(parseFloat(spot.latitude)).toBeGreaterThanOrEqual(-90);
        expect(parseFloat(spot.latitude)).toBeLessThanOrEqual(90);
        expect(parseFloat(spot.longitude)).toBeGreaterThanOrEqual(-180);
        expect(parseFloat(spot.longitude)).toBeLessThanOrEqual(180);
      });
    });

    it('should return valid difficulty levels', async () => {
      const response = await request(app)
        .get('/api/spots')
        .expect(200);

      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      response.body.forEach(spot => {
        if (spot.difficulty_level) {
          expect(validDifficulties).toContain(spot.difficulty_level);
        }
      });
    });
  });
});