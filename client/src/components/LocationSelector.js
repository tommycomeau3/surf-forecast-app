import React, { useState, useEffect } from 'react';
import './LocationSelector.css';

const LocationSelector = ({ onLocationChange, currentLocation }) => {
  const [location, setLocation] = useState(currentLocation || null);
  const [manualLocation, setManualLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useManual, setUseManual] = useState(false);

  useEffect(() => {
    if (currentLocation) {
      setLocation(currentLocation);
    }
  }, [currentLocation]);

  const getCurrentLocation = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'gps'
        };
        setLocation(newLocation);
        onLocationChange(newLocation);
        setLoading(false);
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred while getting location.';
            break;
        }
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleManualLocationSubmit = async (e) => {
    e.preventDefault();
    if (!manualLocation.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Simple geocoding using a free service (you might want to use a proper geocoding API)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocation + ', California')}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const newLocation = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          address: data[0].display_name,
          source: 'manual'
        };
        setLocation(newLocation);
        onLocationChange(newLocation);
        setUseManual(false);
      } else {
        setError('Location not found. Please try a different search term.');
      }
    } catch (err) {
      setError('Error searching for location. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="location-selector">
      <h3>📍 Your Location</h3>
      
      {location && (
        <div className="current-location">
          <p className="location-info">
            <strong>Current Location:</strong> 
            {location.address ? (
              <span> {location.address}</span>
            ) : (
              <span> {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
            )}
            <span className="location-source"> ({location.source === 'gps' ? 'GPS' : 'Manual'})</span>
          </p>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="location-actions">
        {!useManual ? (
          <div className="gps-section">
            <button 
              onClick={getCurrentLocation}
              disabled={loading}
              className="gps-button"
            >
              {loading ? '📍 Getting Location...' : '📍 Use My Current Location'}
            </button>
            <button 
              onClick={() => setUseManual(true)}
              className="manual-button"
            >
              🔍 Enter Location Manually
            </button>
          </div>
        ) : (
          <div className="manual-section">
            <form onSubmit={handleManualLocationSubmit}>
              <div className="input-group">
                <input
                  type="text"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  placeholder="Enter city or address in California..."
                  className="location-input"
                  disabled={loading}
                />
                <button 
                  type="submit" 
                  disabled={loading || !manualLocation.trim()}
                  className="search-button"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>
            <button 
              onClick={() => setUseManual(false)}
              className="back-button"
            >
              ← Back to GPS
            </button>
          </div>
        )}
      </div>

      {!location && (
        <div className="location-help">
          <p>We need your location to find nearby surf spots and provide accurate forecasts.</p>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;