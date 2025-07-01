const express = require('express');
const router = express.Router();
const pool = require('../models/database');
const forecastService = require('../services/forecastService');
const rankingService = require('../services/rankingService');

// Get forecast for a specific spot
router.get('/spot/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get spot details
    const spotResult = await pool.query('SELECT * FROM surf_spots WHERE id = $1', [id]);
    if (spotResult.rows.length === 0) {
      return res.status(404).json({ error: 'Surf spot not found' });
    }
    
    const spot = spotResult.rows[0];
    
    // Get forecast data
    const forecastData = await forecastService.getForecastForSpot(
      spot.id,
      spot.latitude,
      spot.longitude
    );
    
    res.json({
      spot,
      forecast: forecastData
    });
  } catch (error) {
    console.error('Error fetching spot forecast:', error);
    res.status(500).json({ error: 'Failed to fetch forecast' });
  }
});

// Get ranked spots based on user preferences
router.post('/ranked', async (req, res) => {
  try {
    const { sessionId, lat, lng, radius = 50 } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    // Get user preferences
    const prefsResult = await pool.query(
      'SELECT * FROM user_preferences WHERE session_id = $1',
      [sessionId]
    );
    
    if (prefsResult.rows.length === 0) {
      return res.status(404).json({ error: 'User preferences not found' });
    }
    
    const userPreferences = prefsResult.rows[0];
    
    // Use user's saved location if not provided
    const searchLat = lat || userPreferences.location_lat;
    const searchLng = lng || userPreferences.location_lng;
    const searchRadius = radius || userPreferences.max_distance_km || 50;
    
    if (!searchLat || !searchLng) {
      return res.status(400).json({ error: 'Location is required' });
    }
    
    // Get nearby spots - Fixed SQL query
    const spotsQuery = `
      SELECT *,
        (6371 * acos(
          cos(radians($1)) * cos(radians(latitude)) *
          cos(radians(longitude) - radians($2)) +
          sin(radians($1)) * sin(radians(latitude))
        )) AS distance_km
      FROM surf_spots
      WHERE (6371 * acos(
        cos(radians($1)) * cos(radians(latitude)) *
        cos(radians(longitude) - radians($2)) +
        sin(radians($1)) * sin(radians(latitude))
      )) <= $3
      ORDER BY distance_km
    `;
    
    const spotsResult = await pool.query(spotsQuery, [
      parseFloat(searchLat),
      parseFloat(searchLng),
      parseFloat(searchRadius)
    ]);
    
    if (spotsResult.rows.length === 0) {
      return res.json({ rankedSpots: [], message: 'No surf spots found in the specified area' });
    }
    
    // Rank the spots
    const rankedSpots = await rankingService.rankSpots(userPreferences, spotsResult.rows);
    
    res.json({
      rankedSpots,
      userPreferences: {
        skillLevel: userPreferences.skill_level,
        waveHeightRange: [userPreferences.min_wave_height, userPreferences.max_wave_height],
        maxWindSpeed: userPreferences.max_wind_speed,
        maxDistance: userPreferences.max_distance_km
      }
    });
  } catch (error) {
    console.error('Error getting ranked spots:', error);
    res.status(500).json({ error: 'Failed to get ranked spots' });
  }
});

// Get current conditions for multiple spots
router.post('/conditions', async (req, res) => {
  try {
    const { spotIds } = req.body;
    
    if (!spotIds || !Array.isArray(spotIds)) {
      return res.status(400).json({ error: 'Spot IDs array is required' });
    }
    
    const conditions = [];
    
    for (const spotId of spotIds) {
      try {
        // Get spot details
        const spotResult = await pool.query('SELECT * FROM surf_spots WHERE id = $1', [spotId]);
        if (spotResult.rows.length === 0) continue;
        
        const spot = spotResult.rows[0];
        
        // Get forecast data
        const forecastData = await forecastService.getForecastForSpot(
          spot.id,
          spot.latitude,
          spot.longitude
        );
        
        // Get current conditions
        const currentConditions = rankingService.getCurrentConditions(forecastData);
        
        conditions.push({
          spotId: spot.id,
          spotName: spot.name,
          conditions: currentConditions,
          lastUpdated: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Error getting conditions for spot ${spotId}:`, error);
      }
    }
    
    res.json({ conditions });
  } catch (error) {
    console.error('Error fetching conditions:', error);
    res.status(500).json({ error: 'Failed to fetch conditions' });
  }
});

module.exports = router;