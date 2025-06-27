const pool = require('../models/database');
const forecastService = require('./forecastService');

class RankingService {
  // Calculate wave height score based on user preferences
  calculateWaveHeightScore(waveHeight, minHeight, maxHeight) {
    if (waveHeight < minHeight || waveHeight > maxHeight) {
      return 0;
    }
    
    // Perfect score if within range
    const midPoint = (minHeight + maxHeight) / 2;
    const distance = Math.abs(waveHeight - midPoint);
    const maxDistance = (maxHeight - minHeight) / 2;
    
    return Math.max(0, 1 - (distance / maxDistance));
  }

  // Calculate wind score (offshore winds are preferred)
  calculateWindScore(windSpeed, windDirection, maxWindSpeed) {
    if (windSpeed > maxWindSpeed) {
      return 0;
    }
    
    // Wind speed score (lower is better)
    const windSpeedScore = Math.max(0, 1 - (windSpeed / maxWindSpeed));
    
    // Wind direction score (offshore winds: 45-135 degrees are good for most spots)
    let windDirectionScore = 0.5; // neutral score
    if (windDirection >= 45 && windDirection <= 135) {
      windDirectionScore = 1; // offshore winds
    } else if (windDirection >= 225 && windDirection <= 315) {
      windDirectionScore = 0.2; // onshore winds (not ideal)
    }
    
    return (windSpeedScore * 0.7) + (windDirectionScore * 0.3);
  }

  // Calculate skill level compatibility score
  calculateSkillScore(spotDifficulty, userSkill) {
    const skillLevels = { beginner: 1, intermediate: 2, advanced: 3 };
    const spotLevel = skillLevels[spotDifficulty] || 2;
    const userLevel = skillLevels[userSkill] || 2;
    
    // Perfect match
    if (spotLevel === userLevel) {
      return 1;
    }
    
    // Beginner at advanced spot = dangerous
    if (userLevel === 1 && spotLevel === 3) {
      return 0;
    }
    
    // Advanced surfer at beginner spot = less ideal but safe
    if (userLevel === 3 && spotLevel === 1) {
      return 0.6;
    }
    
    // One level difference
    return 0.7;
  }

  // Calculate distance score (closer is better)
  calculateDistanceScore(distance, maxDistance) {
    if (distance > maxDistance) {
      return 0;
    }
    
    return Math.max(0, 1 - (distance / maxDistance));
  }

  // Get current forecast conditions for scoring
  getCurrentConditions(forecastData) {
    if (!forecastData || forecastData.length === 0) {
      return {
        waveHeight: 0,
        windSpeed: 0,
        windDirection: 0
      };
    }

    // Get the most recent forecast
    const now = new Date();
    const currentForecast = forecastData.reduce((closest, forecast) => {
      const forecastTime = new Date(forecast.forecast_time || forecast.time);
      const closestTime = new Date(closest.forecast_time || closest.time);
      
      return Math.abs(forecastTime - now) < Math.abs(closestTime - now) ? forecast : closest;
    });

    return {
      waveHeight: parseFloat(currentForecast.wave_height || currentForecast.waveHeight || 0),
      windSpeed: parseFloat(currentForecast.wind_speed || currentForecast.windSpeed || 0),
      windDirection: parseFloat(currentForecast.wind_direction || currentForecast.windDirection || 0)
    };
  }

  // Rank surf spots based on user preferences
  async rankSpots(userPreferences, spots) {
    const rankedSpots = [];

    for (const spot of spots) {
      try {
        // Get forecast data for the spot
        const forecastData = await forecastService.getForecastForSpot(
          spot.id, 
          spot.latitude, 
          spot.longitude
        );

        const conditions = this.getCurrentConditions(forecastData);

        // Calculate individual scores
        const waveHeightScore = this.calculateWaveHeightScore(
          conditions.waveHeight,
          userPreferences.min_wave_height || 0,
          userPreferences.max_wave_height || 20
        );

        const windScore = this.calculateWindScore(
          conditions.windSpeed,
          conditions.windDirection,
          userPreferences.max_wind_speed || 25
        );

        const skillScore = this.calculateSkillScore(
          spot.difficulty_level,
          userPreferences.skill_level
        );

        const distanceScore = this.calculateDistanceScore(
          spot.distance_km || 0,
          userPreferences.max_distance_km || 50
        );

        // Calculate weighted total score
        const totalScore = (
          waveHeightScore * 0.4 +
          windScore * 0.3 +
          skillScore * 0.2 +
          distanceScore * 0.1
        );

        rankedSpots.push({
          ...spot,
          score: totalScore,
          conditions,
          scores: {
            waveHeight: waveHeightScore,
            wind: windScore,
            skill: skillScore,
            distance: distanceScore
          },
          forecastData: forecastData.slice(0, 24) // Include next 24 hours
        });

      } catch (error) {
        console.error(`Error ranking spot ${spot.name}:`, error);
        // Include spot with zero score if there's an error
        rankedSpots.push({
          ...spot,
          score: 0,
          conditions: { waveHeight: 0, windSpeed: 0, windDirection: 0 },
          scores: { waveHeight: 0, wind: 0, skill: 0, distance: 0 },
          forecastData: []
        });
      }
    }

    // Sort by score (highest first)
    return rankedSpots.sort((a, b) => b.score - a.score);
  }
}

module.exports = new RankingService();