import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import './PreferencesForm.css';

const PreferencesForm = ({ sessionId, userLocation, onPreferencesChange, onComplete }) => {
  const [preferences, setPreferences] = useState({
    skillLevel: 'beginner',
    minWaveHeight: 2,
    maxWaveHeight: 8,
    maxWindSpeed: 15,
    maxDistanceKm: 50
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Load existing preferences if available
    if (sessionId) {
      loadExistingPreferences();
    }
  }, [sessionId]);

  const loadExistingPreferences = async () => {
    try {
      const existingPrefs = await apiService.getPreferences(sessionId);
      setPreferences({
        skillLevel: existingPrefs.skill_level || 'beginner',
        minWaveHeight: existingPrefs.min_wave_height || 2,
        maxWaveHeight: existingPrefs.max_wave_height || 8,
        maxWindSpeed: existingPrefs.max_wind_speed || 15,
        maxDistanceKm: existingPrefs.max_distance_km || 50
      });
    } catch (err) {
      // Preferences don't exist yet, use defaults
      console.log('No existing preferences found, using defaults');
    }
  };

  const handleInputChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!sessionId) {
      setError('Session not initialized');
      return;
    }

    // Validation
    if (preferences.minWaveHeight >= preferences.maxWaveHeight) {
      setError('Minimum wave height must be less than maximum wave height');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const preferencesData = {
        sessionId,
        skillLevel: preferences.skillLevel,
        minWaveHeight: preferences.minWaveHeight,
        maxWaveHeight: preferences.maxWaveHeight,
        maxWindSpeed: preferences.maxWindSpeed,
        maxDistanceKm: preferences.maxDistanceKm,
        locationLat: userLocation?.lat,
        locationLng: userLocation?.lng
      };

      await apiService.savePreferences(preferencesData);
      
      setSuccess(true);
      onPreferencesChange(preferences);
      
      // Auto-complete after a short delay
      setTimeout(() => {
        onComplete();
      }, 1500);

    } catch (err) {
      setError(err.message || 'Failed to save preferences');
    }

    setLoading(false);
  };

  const skillLevelDescriptions = {
    beginner: 'New to surfing, comfortable with small waves (1-4ft)',
    intermediate: 'Some experience, can handle moderate waves (3-8ft)',
    advanced: 'Experienced surfer, comfortable with larger waves (6ft+)'
  };

  return (
    <div className="preferences-form">
      <form onSubmit={handleSubmit}>
        {/* Skill Level */}
        <div className="form-group">
          <label htmlFor="skillLevel">
            <strong>🏄‍♂️ Skill Level</strong>
          </label>
          <select
            id="skillLevel"
            value={preferences.skillLevel}
            onChange={(e) => handleInputChange('skillLevel', e.target.value)}
            className="form-select"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <p className="form-help">
            {skillLevelDescriptions[preferences.skillLevel]}
          </p>
        </div>

        {/* Wave Height Range */}
        <div className="form-group">
          <label>
            <strong>🌊 Preferred Wave Height Range</strong>
          </label>
          <div className="range-inputs">
            <div className="range-input">
              <label htmlFor="minWaveHeight">Min Height (ft)</label>
              <input
                type="number"
                id="minWaveHeight"
                min="0"
                max="20"
                step="0.5"
                value={preferences.minWaveHeight}
                onChange={(e) => handleInputChange('minWaveHeight', parseFloat(e.target.value))}
                className="form-input"
              />
            </div>
            <div className="range-separator">to</div>
            <div className="range-input">
              <label htmlFor="maxWaveHeight">Max Height (ft)</label>
              <input
                type="number"
                id="maxWaveHeight"
                min="1"
                max="30"
                step="0.5"
                value={preferences.maxWaveHeight}
                onChange={(e) => handleInputChange('maxWaveHeight', parseFloat(e.target.value))}
                className="form-input"
              />
            </div>
          </div>
          <p className="form-help">
            Current range: {preferences.minWaveHeight}ft - {preferences.maxWaveHeight}ft
          </p>
        </div>

        {/* Wind Tolerance */}
        <div className="form-group">
          <label htmlFor="maxWindSpeed">
            <strong>💨 Maximum Wind Speed (mph)</strong>
          </label>
          <input
            type="number"
            id="maxWindSpeed"
            min="5"
            max="50"
            step="1"
            value={preferences.maxWindSpeed}
            onChange={(e) => handleInputChange('maxWindSpeed', parseInt(e.target.value))}
            className="form-input"
          />
          <p className="form-help">
            Higher wind speeds can make surfing more challenging
          </p>
        </div>

        {/* Search Radius */}
        <div className="form-group">
          <label htmlFor="maxDistanceKm">
            <strong>📍 Search Radius (km)</strong>
          </label>
          <input
            type="number"
            id="maxDistanceKm"
            min="10"
            max="200"
            step="5"
            value={preferences.maxDistanceKm}
            onChange={(e) => handleInputChange('maxDistanceKm', parseInt(e.target.value))}
            className="form-input"
          />
          <p className="form-help">
            How far are you willing to travel? ({Math.round(preferences.maxDistanceKm * 0.621)} miles)
          </p>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            ✅ Preferences saved successfully!
          </div>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={loading}
          className="submit-button"
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </form>
    </div>
  );
};

export default PreferencesForm;