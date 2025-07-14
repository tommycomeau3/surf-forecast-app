const nock = require('nock');

/**
 * Mock helpers for external APIs and services
 */
class MockHelper {
  /**
   * Mock weather API responses
   */
  static mockWeatherAPI() {
    // Mock successful weather API response
    nock('https://api.openweathermap.org')
      .persist()
      .get(/.*/)
      .reply(200, {
        current: {
          temp: 20,
          wind_speed: 12,
          wind_deg: 180,
          weather: [{ main: 'Clear', description: 'clear sky' }]
        },
        hourly: Array.from({ length: 24 }, (_, i) => ({
          dt: Date.now() / 1000 + (i * 3600),
          temp: 20 + Math.random() * 5,
          wind_speed: 10 + Math.random() * 10,
          wind_deg: 150 + Math.random() * 60,
          weather: [{ main: 'Clear', description: 'clear sky' }]
        }))
      });

    // Mock marine weather API
    nock('https://marine-api.open-meteo.com')
      .persist()
      .get(/.*/)
      .reply(200, {
        hourly: {
          time: Array.from({ length: 24 }, (_, i) => new Date(Date.now() + (i * 3600000)).toISOString()),
          wave_height: Array.from({ length: 24 }, () => 2 + Math.random() * 4),
          wave_period: Array.from({ length: 24 }, () => 8 + Math.random() * 6),
          wave_direction: Array.from({ length: 24 }, () => 180 + Math.random() * 60),
          wind_wave_height: Array.from({ length: 24 }, () => 1 + Math.random() * 2),
          swell_wave_height: Array.from({ length: 24 }, () => 1.5 + Math.random() * 3)
        }
      });
  }

  /**
   * Mock weather API failure
   */
  static mockWeatherAPIFailure() {
    nock.cleanAll();
    
    nock('https://api.openweathermap.org')
      .persist()
      .get(/.*/)
      .reply(500, { error: 'Internal Server Error' });

    nock('https://marine-api.open-meteo.com')
      .persist()
      .get(/.*/)
      .reply(503, { error: 'Service Unavailable' });
  }

  /**
   * Mock tide API responses
   */
  static mockTideAPI() {
    nock('https://api.tidesandcurrents.noaa.gov')
      .persist()
      .get(/.*/)
      .reply(200, {
        predictions: Array.from({ length: 24 }, (_, i) => ({
          t: new Date(Date.now() + (i * 3600000)).toISOString(),
          v: (2 + Math.sin(i * 0.5) * 1.5).toFixed(2)
        }))
      });
  }

  /**
   * Generate mock forecast data
   */
  static generateMockForecastData(spotId = 1) {
    return {
      spotId,
      current: {
        waveHeight: 3.2,
        wavePeriod: 12,
        waveDirection: 225,
        windSpeed: 15,
        windDirection: 180,
        temperature: 22,
        tideHeight: 1.8,
        conditions: 'Good'
      },
      hourly: Array.from({ length: 24 }, (_, i) => ({
        time: new Date(Date.now() + (i * 3600000)).toISOString(),
        waveHeight: 2.5 + Math.random() * 2,
        wavePeriod: 10 + Math.random() * 4,
        waveDirection: 200 + Math.random() * 50,
        windSpeed: 10 + Math.random() * 10,
        windDirection: 160 + Math.random() * 40,
        temperature: 20 + Math.random() * 5,
        tideHeight: 1 + Math.sin(i * 0.5) * 1.5
      })),
      daily: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() + (i * 86400000)).toISOString().split('T')[0],
        maxWaveHeight: 3 + Math.random() * 3,
        minWaveHeight: 1 + Math.random() * 2,
        avgWindSpeed: 12 + Math.random() * 8,
        conditions: ['Poor', 'Fair', 'Good', 'Excellent'][Math.floor(Math.random() * 4)]
      }))
    };
  }

  /**
   * Clean all mocks
   */
  static cleanAll() {
    nock.cleanAll();
  }

  /**
   * Setup default mocks for all external APIs
   */
  static setupDefaultMocks() {
    this.mockWeatherAPI();
    this.mockTideAPI();
  }
}

module.exports = MockHelper;