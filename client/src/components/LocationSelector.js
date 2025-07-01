import React, { useState, useEffect } from 'react'; // Import react and 2 hooks
import './LocationSelector.css'; // Import css file

const LocationSelector = ({ onLocationChange, currentLocation }) => { // Defines a functional react component named LocationSelector that recieves two props
  const [location, setLocation] = useState(currentLocation || null); // Initializes location if exists else null
  const [manualLocation, setManualLocation] = useState(''); // Stores the text the user types in if they choose to enter a location manually
  const [loading, setLoading] = useState(false); // Boolean flag indicating if its loading
  const [error, setError] = useState(''); // Stores error messages
  const [useManual, setUseManual] = useState(false); // A toggle that tracks whether the user is typing in a location manually

  // If currentLocation changes run this effect
  useEffect(() => {
    if (currentLocation) {
      setLocation(currentLocation);
    }
  }, [currentLocation]);

  
  const getCurrentLocation = () => {
    // Sets flag to indicate loading
    setLoading(true);
    // Clears out any previous errors
    setError('');

    // Checks if geolocation is supported by browser
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(   // Calls the Geolocation API to get the user’s current location
      (position) => { // First argument is a callback function that runs if the location is successfully retrieved
        // Extract data from position arg
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'gps'
        };
        setLocation(newLocation); // Updates local state
        onLocationChange(newLocation); // Sends the newLocation back up so the parent knows what location the user selected
        setLoading(false); // Ends loading
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
      { // Third argument passed that tells browser how to handle GPS
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleManualLocationSubmit = async (e) => { // Triggered when user enter manual location (e is event object)
    e.preventDefault(); // Prevents default form bahavior
    if (!manualLocation.trim()) return; // Checks if manual input is empty

    setLoading(true);
    setError('');

    try {
      // Simple geocoding using a free service (you might want to use a proper geocoding API)
      // Sends a GET request to Nominatim (manualLocation + ', California' helps narrow the search to California)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocation + ', California')}&limit=1`
      );
      // Converts raw HTTP to json
      const data = await response.json();

      if (data && data.length > 0) { // Checking if API returned something 
        // Converts lat and lng to strings, displays the address, and labels it as manual
        const newLocation = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          address: data[0].display_name,
          source: 'manual'
        };
        setLocation(newLocation);
        onLocationChange(newLocation);
        setUseManual(false);
      } else { // If Location not found
        setError('Location not found. Please try a different search term.');
      }
    } catch (err) { // If it completely breaks
      setError('Error searching for location. Please try again.');
    }

    setLoading(false);
  };

  return (
    // Main container for the location selector UI
    <div className="location-selector">
      <h3>📍 Your Location</h3>

      {/* Show current location details if a location is set */}
      {location && (
        <div className="current-location">
          <p className="location-info">
            <strong>Current Location:</strong> 
            
            {/* If we have the full address, show it. Otherwise, show lat/lng */}
            {location.address ? (
              <span> {location.address}</span>
            ) : (
              <span> {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
            )}
            
            {/* Show whether location came from GPS or was entered manually */}
            <span className="location-source"> ({location.source === 'gps' ? 'GPS' : 'Manual'})</span>
          </p>
        </div>
      )}

      {/* Show error message if one exists */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Section for selecting location (GPS or manual input) */}
      <div className="location-actions">
        {/* Show GPS location buttons if not in manual mode */}
        {!useManual ? (
          <div className="gps-section">
            <button 
              onClick={getCurrentLocation}
              disabled={loading}
              className="gps-button"
            >
              {loading ? '📍 Getting Location...' : '📍 Use My Current Location'}
            </button>

            {/* Switch to manual input mode */}
            <button 
              onClick={() => setUseManual(true)}
              className="manual-button"
            >
              🔍 Enter Location Manually
            </button>
          </div>
        ) : (
          // Show manual location form if in manual mode
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

            {/* Go back to GPS mode */}
            <button 
              onClick={() => setUseManual(false)}
              className="back-button"
            >
              ← Back to GPS
            </button>
          </div>
        )}
      </div>

      {/* If no location is currently selected, show a help message */}
      {!location && (
        <div className="location-help">
          <p>We need your location to find nearby surf spots and provide accurate forecasts.</p>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;