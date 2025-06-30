import React, { useState, useEffect } from 'react'; // Gives access to React library with 2 hooks
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Lets me turn app into a multi-page app
import './App.css'; // Imports css file

// Components
import Header from './components/Header';
import LocationSelector from './components/LocationSelector';
import PreferencesForm from './components/PreferencesForm';
import SpotList from './components/SpotList';
import SpotDetail from './components/SpotDetail';

// Services
import { generateSessionId } from './utils/sessionUtils'; // Imports generateSessionId function

// Defines a react functional component called App
function App() {
  const [sessionId, setSessionId] = useState(''); // Session ID for user
  const [userLocation, setUserLocation] = useState(null); // Set location
  const [preferences, setPreferences] = useState(null); // Set preferences
  const [rankedSpots, setRankedSpots] = useState([]); // List of spots
  const [loading, setLoading] = useState(false); // Loading

  useEffect(() => { // React hook that lets you run code
    // Generate or retrieve session ID
    const storedSessionId = localStorage.getItem('surf-app-session-id'); // Checks browser's localStoragefor an existing session ID
    // If a session ID is found, its saved into state
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else { // Generate new session ID and saves it
      const newSessionId = generateSessionId();
      localStorage.setItem('surf-app-session-id', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  const handleLocationChange = (location) => { // Defines a function called handleLocationChange taking 1 parameter location
    setUserLocation(location); // Updates user location
  };

  // Handles changes in user's preferences
  const handlePreferencesChange = (newPreferences) => {
    setPreferences(newPreferences);
  };

  // Handles changes in surf spots
  const handleSpotsUpdate = (spots) => {
    setRankedSpots(spots);
  };
  
  return ( // Tells React what it should render on the screen
    <Router> {/* Enables routing/navigation based on the URL */}
      <div className="App"> {/* Main container div with app-level styling */}
        
        <Header /> {/* Reusable header component (likely shows title/nav bar) */}
        
        <main className="main-content"> {/* Main content area of the app */}
          <Routes> {/* Defines different routes (pages) for the app */}

            <Route 
              path="/" // The root path (home page)
              element={
                <HomePage
                  sessionId={sessionId} // Unique ID for this user's session
                  userLocation={userLocation} // The user's chosen or detected location
                  preferences={preferences} // The user's surf preferences (skill, wave height, wind)
                  rankedSpots={rankedSpots} // List of surf spots ranked based on preferences
                  loading={loading} // Boolean to track if the app is loading data
                  onLocationChange={handleLocationChange} // Function to update user location
                  onPreferencesChange={handlePreferencesChange} // Function to update preferences
                  onSpotsUpdate={handleSpotsUpdate} // Function to update surf spot results
                  setLoading={setLoading} // Function to toggle loading state
                />
              }
            />

            <Route 
              path="/spot/:id" // Dynamic route for individual surf spot pages (e.g. /spot/123)
              element={<SpotDetail />} // Component that shows details for one surf spot
            />

          </Routes>
        </main>
      </div>
    </Router>
  );
}

// Defines Home page component and what info/functions it needs
function HomePage({ 
  sessionId, 
  userLocation, 
  preferences, 
  rankedSpots, 
  loading,
  onLocationChange, 
  onPreferencesChange, 
  onSpotsUpdate,
  setLoading 
}) {
  const [showPreferences, setShowPreferences] = useState(!preferences); // Whether to show preferences or not

  return (
    <div className="home-page"> {/* Main container for the homepage content */}
        {/* Hero Section: Title and intro */}
        <div className="hero-section">
          <h1>California Surf Forecast</h1>
          <p>Find the best surf spots based on your preferences and current conditions</p>
        </div>

      {/* Main content area for location, preferences, and results */}
      <div className="app-sections">
        {/* Location Section: User selects or shares their location */}
        <section className="location-section">
          <LocationSelector 
            onLocationChange={onLocationChange}
            currentLocation={userLocation}
          />
        </section>

        {/* Preferences Section: Surf skill, wave height, wind settings */}
        <section className="preferences-section">
          <div className="section-header">
            <h2>Your Surf Preferences</h2>
            {preferences && (
              <button 
                className="edit-button"
                onClick={() => setShowPreferences(!showPreferences)}
              >
                {showPreferences ? 'Hide' : 'Edit'}
              </button>
            )}
          </div>
          
          {/* Show "Edit" or "Hide" button if preferences already exist */}
          {(showPreferences || !preferences) && (
            <PreferencesForm
              sessionId={sessionId}
              userLocation={userLocation}
              onPreferencesChange={onPreferencesChange}
              onComplete={() => setShowPreferences(false)}
            />
          )}
          
          {/* If preferences exist and form is hidden, show summary */}
          {preferences && !showPreferences && (
            <div className="preferences-summary">
              <p><strong>Skill Level:</strong> {preferences.skillLevel}</p>
              <p><strong>Wave Height:</strong> {preferences.minWaveHeight}ft - {preferences.maxWaveHeight}ft</p>
              <p><strong>Max Wind:</strong> {preferences.maxWindSpeed} mph</p>
            </div>
          )}
        </section>

        {/* Surf Spots Section: Show ranked surf spots if data is ready */}
        {preferences && userLocation && (
          <section className="spots-section">
            <h2>Recommended Surf Spots</h2>
            <SpotList
              sessionId={sessionId}
              userLocation={userLocation}
              preferences={preferences}
              spots={rankedSpots}
              loading={loading}
              onSpotsUpdate={onSpotsUpdate}
              setLoading={setLoading}
            />
          </section>
        )}

        {/* Instructions Section: Shown when location or preferences are missing */}
        {(!preferences || !userLocation) && ( 
          <section className="instructions">
            <div className="instruction-card">
              <h3>Get Started</h3>
              <ol>
                <li>Allow location access or enter your location manually</li>
                <li>Set your surf preferences (skill level, wave height, wind tolerance)</li>
                <li>View ranked surf spots based on current conditions</li>
              </ol>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
