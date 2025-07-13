const pool = require('../models/database');
const forecastService = require('./forecastService');

class RankingService {
  // Calculate wave height score based on user preferences
  calculateWaveHeightScore(waveHeight, minHeight, maxHeight) {
    // Convert string preferences to numbers
    const minHeightNum = parseFloat(minHeight);
    const maxHeightNum = parseFloat(maxHeight);
    
    // More lenient scoring - give partial credit for waves close to range
    if (waveHeight < minHeightNum * 0.7) {
      return 0;
    }
    
    if (waveHeight > maxHeightNum * 1.3) {
      return 0;
    }
    
    // Perfect score if within preferred range
    if (waveHeight >= minHeightNum && waveHeight <= maxHeightNum) {
      const midPoint = (minHeightNum + maxHeightNum) / 2;
      const distance = Math.abs(waveHeight - midPoint);
      const maxDistance = (maxHeightNum - minHeightNum) / 2;
      return Math.max(0, 1 - (distance / maxDistance));
    }
    
    // Partial score for waves close to range
    let score = 0;
    if (waveHeight < minHeightNum) {
      // Below range - give partial credit
      const deficit = minHeightNum - waveHeight;
      const allowedDeficit = minHeightNum * 0.3;
      score = Math.max(0, 0.5 * (1 - deficit / allowedDeficit));
    } else {
      // Above range - give partial credit
      const excess = waveHeight - maxHeightNum;
      const allowedExcess = maxHeightNum * 0.3;
      score = Math.max(0, 0.5 * (1 - excess / allowedExcess));
    }
    
    return score;
  }

  // Calculate wind score (offshore winds are preferred)
  calculateWindScore(windSpeed, windDirection, maxWindSpeed) {
    const maxWindSpeedNum = parseFloat(maxWindSpeed);
    
    if (windSpeed > maxWindSpeedNum) {
      return 0;
    }
    
    // Wind speed score (lower is better, but give more variation)
    const windSpeedScore = Math.max(0, 1 - (windSpeed / maxWindSpeedNum));
    
    // Improved wind direction scoring with more granular scoring
    let windDirectionScore = 0.5; // neutral score
    
    // Normalize direction to 0-360
    const normalizedDirection = ((windDirection % 360) + 360) % 360;
    
    if (normalizedDirection >= 45 && normalizedDirection <= 135) {
      // Offshore winds (NE to SE) - best for most California spots
      windDirectionScore = 1.0;
    } else if (normalizedDirection >= 315 || normalizedDirection <= 45) {
      // North winds - good but not perfect
      windDirectionScore = 0.8;
    } else if (normalizedDirection >= 135 && normalizedDirection <= 180) {
      // South winds - decent
      windDirectionScore = 0.7;
    } else if (normalizedDirection >= 180 && normalizedDirection <= 225) {
      // SW winds - not great but manageable
      windDirectionScore = 0.4;
    } else {
      // W to NW winds (225-315) - onshore, not ideal
      const distanceFromWorst = Math.min(
        Math.abs(normalizedDirection - 270), // Distance from due west (worst)
        45 // Max distance in this range
      );
      windDirectionScore = 0.1 + (distanceFromWorst / 45) * 0.3; // 0.1 to 0.4 range
    }
    
    return (windSpeedScore * 0.6) + (windDirectionScore * 0.4);
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