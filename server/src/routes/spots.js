const express = require('express');
const router = express.Router();
const pool = require('../models/database');

// Get all surf spots
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM surf_spots ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching surf spots:', error);
    res.status(500).json({ error: 'Failed to fetch surf spots' });
  }
});

// Get surf spots near a location
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Calculate distance using Haversine formula in SQL
    const query = `
      SELECT *,
        (6371 * acos(
          cos(radians($1)) * cos(radians(latitude)) *
          cos(radians(longitude) - radians($2)) +
          sin(radians($1)) * sin(radians(latitude))
        )) AS distance_km
      FROM surf_spots
      HAVING (6371 * acos(
        cos(radians($1)) * cos(radians(latitude)) *
        cos(radians(longitude) - radians($2)) +
        sin(radians($1)) * sin(radians(latitude))
      )) <= $3
      ORDER BY distance_km
    `;

    const result = await pool.query(query, [parseFloat(lat), parseFloat(lng), parseFloat(radius)]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching nearby spots:', error);
    res.status(500).json({ error: 'Failed to fetch nearby spots' });
  }
});

// Get a specific surf spot by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM surf_spots WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Surf spot not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching surf spot:', error);
    res.status(500).json({ error: 'Failed to fetch surf spot' });
  }
});

module.exports = router;