const fs = require('fs');
const path = require('path');

/**
 * Database test utilities
 */
class DatabaseTestHelper {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Initialize test database with schema
   */
  async initializeTestDatabase() {
    try {
      // Read and execute the init.sql file
      const initSqlPath = path.join(__dirname, '../../src/models/init.sql');
      const initSql = fs.readFileSync(initSqlPath, 'utf8');
      
      await this.pool.query(initSql);
      console.log('✅ Test database initialized with schema');
    } catch (error) {
      console.error('❌ Failed to initialize test database:', error.message);
      throw error;
    }
  }

  /**
   * Clean all tables for fresh test state
   */
  async cleanDatabase() {
    try {
      await this.pool.query('TRUNCATE TABLE forecast_cache, user_preferences, surf_spots RESTART IDENTITY CASCADE');
      console.log('✅ Test database cleaned');
    } catch (error) {
      console.error('❌ Failed to clean test database:', error.message);
      throw error;
    }
  }

  /**
   * Seed test data
   */
  async seedTestData() {
    try {
      // Insert test surf spots
      await this.pool.query(`
        INSERT INTO surf_spots (name, latitude, longitude, region, break_type, difficulty_level) VALUES
        ('Test Beach', 33.7701, -118.1937, 'Test Region', 'beach_break', 'beginner'),
        ('Advanced Reef', 33.8000, -118.2000, 'Test Region', 'reef_break', 'advanced'),
        ('Intermediate Point', 33.7500, -118.1500, 'Test Region', 'point_break', 'intermediate')
      `);

      // Insert test user preferences
      await this.pool.query(`
        INSERT INTO user_preferences (session_id, skill_level, min_wave_height, max_wave_height, max_wind_speed, location_lat, location_lng, max_distance_km) VALUES
        ('test-session-123', 'intermediate', 2.0, 8.0, 15.0, 33.7701, -118.1937, 25),
        ('test-session-456', 'beginner', 1.0, 5.0, 20.0, 33.8000, -118.2000, 50)
      `);

      console.log('✅ Test data seeded');
    } catch (error) {
      console.error('❌ Failed to seed test data:', error.message);
      throw error;
    }
  }

  /**
   * Get test spot by name
   */
  async getTestSpot(name) {
    const result = await this.pool.query('SELECT * FROM surf_spots WHERE name = $1', [name]);
    return result.rows[0];
  }

  /**
   * Get test user preferences by session ID
   */
  async getTestUserPreferences(sessionId) {
    const result = await this.pool.query('SELECT * FROM user_preferences WHERE session_id = $1', [sessionId]);
    return result.rows[0];
  }

  /**
   * Insert forecast cache data for testing
   */
  async insertTestForecastData(spotId, forecastData) {
    await this.pool.query(`
      INSERT INTO forecast_cache (spot_id, source, wave_height, wave_period, wind_speed, wind_direction, tide_height, forecast_time)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      spotId,
      forecastData.source || 'test',
      forecastData.waveHeight || 3.0,
      forecastData.wavePeriod || 10.0,
      forecastData.windSpeed || 12.0,
      forecastData.windDirection || 180,
      forecastData.tideHeight || 2.5,
      forecastData.forecastTime || new Date()
    ]);
  }
}

module.exports = DatabaseTestHelper;