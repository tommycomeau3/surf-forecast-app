const express = require('express');
const router = express.Router();
const pool = require('../models/database');

// Save user preferences
router.post('/', async (req, res) => {
  try {
    const {
      sessionId,
      skillLevel,
      minWaveHeight,
      maxWaveHeight,
      maxWindSpeed,
      locationLat,
      locationLng,
      maxDistanceKm
    } = req.body;

    // Validate required fields
    if (!sessionId || !skillLevel) {
      return res.status(400).json({ error: 'Session ID and skill level are required' });
    }

    // Check if preferences already exist for this session
    const existingPrefs = await pool.query(
      'SELECT id FROM user_preferences WHERE session_id = $1',
      [sessionId]
    );

    let result;
    if (existingPrefs.rows.length > 0) {
      // Update existing preferences
      result = await pool.query(`
        UPDATE user_preferences 
        SET skill_level = $2, min_wave_height = $3, max_wave_height = $4,
            max_wind_speed = $5, location_lat = $6, location_lng = $7,
            max_distance_km = $8, updated_at = CURRENT_TIMESTAMP
        WHERE session_id = $1
        RETURNING *
      `, [sessionId, skillLevel, minWaveHeight, maxWaveHeight, maxWindSpeed, 
          locationLat, locationLng, maxDistanceKm]);
    } else {
      // Insert new preferences
      result = await pool.query(`
        INSERT INTO user_preferences 
        (session_id, skill_level, min_wave_height, max_wave_height, 
         max_wind_speed, location_lat, location_lng, max_distance_km)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [sessionId, skillLevel, minWaveHeight, maxWaveHeight, maxWindSpeed,
          locationLat, locationLng, maxDistanceKm]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving preferences:', error);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

// Get user preferences
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM user_preferences WHERE session_id = $1',
      [sessionId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Preferences not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

module.exports = router;