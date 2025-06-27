const axios = require('axios');
const pool = require('../models/database');

class ForecastService {
  constructor() {
    this.stormglassApiKey = process.env.STORMGLASS_API_KEY;
    this.openWeatherApiKey = process.env.OPENWEATHERMAP_API_KEY;
    this.cacheTimeout = process.env.FORECAST_CACHE_DURATION || 7200000; // 2 hours default
  }

  // Get forecast from Stormglass API
  async getStormglassForecast(lat, lng) {
    try {
      if (!this.stormglassApiKey) {
        throw new Error('Stormglass API key not configured');
      }

      const params = [
        'waveHeight',
        'wavePeriod',
        'waveDirection',
        'windSpeed',
        'windDirection'
      ].join(',');

      const response = await axios.get('https://api.stormglass.io/v2/weather/point', {
        params: {
          lat,
          lng,
          params,
          start: Math.floor(Date.now() / 1000),
          end: Math.floor(Date.now() / 1000) + 86400 * 3 // 3 days
        },
        headers: {
          'Authorization': this.stormglassApiKey
        }
      });

      return this.formatStormglassData(response.data);
    } catch (error) {
      console.error('Stormglass API error:', error.message);
      return null;
    }
  }

  // Get forecast from OpenWeatherMap API
  async getOpenWeatherForecast(lat, lng) {
    try {
      if (!this.openWeatherApiKey) {
        throw new Error('OpenWeatherMap API key not configured');
      }

      const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
        params: {
          lat,
          lon: lng,
          appid: this.openWeatherApiKey,
          units: 'metric'
        }
      });

      return this.formatOpenWeatherData(response.data);
    } catch (error) {
      console.error('OpenWeatherMap API error:', error.message);
      return null;
    }
  }

  // Format Stormglass data
  formatStormglassData(data) {
    return data.hours.map(hour => ({
      time: hour.time,
      waveHeight: hour.waveHeight?.sg || 0,
      wavePeriod: hour.wavePeriod?.sg || 0,
      windSpeed: hour.windSpeed?.sg || 0,
      windDirection: hour.windDirection?.sg || 0,
      source: 'stormglass'
    }));
  }

  // Format OpenWeatherMap data
  formatOpenWeatherData(data) {
    return data.list.map(item => ({
      time: new Date(item.dt * 1000).toISOString(),
      waveHeight: 0, // OpenWeatherMap doesn't provide wave data in free tier
      wavePeriod: 0,
      windSpeed: item.wind?.speed || 0,
      windDirection: item.wind?.deg || 0,
      source: 'openweathermap'
    }));
  }

  // Get cached forecast data
  async getCachedForecast(spotId) {
    try {
      const cutoffTime = new Date(Date.now() - this.cacheTimeout);
      const result = await pool.query(`
        SELECT * FROM forecast_cache 
        WHERE spot_id = $1 AND cached_at > $2
        ORDER BY forecast_time
      `, [spotId, cutoffTime]);

      return result.rows;
    } catch (error) {
      console.error('Error fetching cached forecast:', error);
      return [];
    }
  }

  // Cache forecast data
  async cacheForecast(spotId, forecastData) {
    try {
      for (const forecast of forecastData) {
        await pool.query(`
          INSERT INTO forecast_cache 
          (spot_id, source, wave_height, wave_period, wind_speed, wind_direction, forecast_time)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT DO NOTHING
        `, [
          spotId,
          forecast.source,
          forecast.waveHeight,
          forecast.wavePeriod,
          forecast.windSpeed,
          forecast.windDirection,
          forecast.time
        ]);
      }
    } catch (error) {
      console.error('Error caching forecast:', error);
    }
  }

  // Get forecast for a specific spot
  async getForecastForSpot(spotId, lat, lng) {
    try {
      // Check cache first
      const cachedData = await this.getCachedForecast(spotId);
      if (cachedData.length > 0) {
        return cachedData;
      }

      // Fetch from APIs
      const forecasts = [];
      
      const stormglassData = await this.getStormglassForecast(lat, lng);
      if (stormglassData) {
        forecasts.push(...stormglassData);
      }

      const openWeatherData = await this.getOpenWeatherForecast(lat, lng);
      if (openWeatherData) {
        forecasts.push(...openWeatherData);
      }

      // Cache the data
      if (forecasts.length > 0) {
        await this.cacheForecast(spotId, forecasts);
      }

      return forecasts;
    } catch (error) {
      console.error('Error getting forecast for spot:', error);
      return [];
    }
  }
}

module.exports = new ForecastService();