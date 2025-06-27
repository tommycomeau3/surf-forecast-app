import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Components
import Header from './components/Header';
import LocationSelector from './components/LocationSelector';
import PreferencesForm from './components/PreferencesForm';
import SpotList from './components/SpotList';
import SpotDetail from './components/SpotDetail';

// Services
import { generateSessionId } from './utils/sessionUtils';

function App() {
  const [sessionId, setSessionId] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [rankedSpots, setRankedSpots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Generate or retrieve session ID
    const storedSessionId = localStorage.getItem('surf-app-session-id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = generateSessionId();
      localStorage.setItem('surf-app-session-id', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  const handleLocationChange = (location) => {
    setUserLocation(location);
  };

  const handlePreferencesChange = (newPreferences) => {
    setPreferences(newPreferences);
  };

  const handleSpotsUpdate = (spots) => {
    setRankedSpots(spots);
  };

  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route 
              path="/" 
              element={
                <HomePage
                  sessionId={sessionId}
                  userLocation={userLocation}
                  preferences={preferences}
                  rankedSpots={rankedSpots}
                  loading={loading}
                  onLocationChange={handleLocationChange}
                  onPreferencesChange={handlePreferencesChange}
                  onSpotsUpdate={handleSpotsUpdate}
                  setLoading={setLoading}
                />
              } 
            />
            <Route 
              path="/spot/:id" 
              element={<SpotDetail />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// Home page component
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
  const [showPreferences, setShowPreferences] = useState(!preferences);

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>California Surf Forecast</h1>
        <p>Find the best surf spots based on your preferences and current conditions</p>
      </div>

      <div className="app-sections">
        {/* Location Section */}
        <section className="location-section">
          <LocationSelector 
            onLocationChange={onLocationChange}
            currentLocation={userLocation}
          />
        </section>

        {/* Preferences Section */}
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
          
          {(showPreferences || !preferences) && (
            <PreferencesForm
              sessionId={sessionId}
              userLocation={userLocation}
              onPreferencesChange={onPreferencesChange}
              onComplete={() => setShowPreferences(false)}
            />
          )}
          
          {preferences && !showPreferences && (
            <div className="preferences-summary">
              <p><strong>Skill Level:</strong> {preferences.skillLevel}</p>
              <p><strong>Wave Height:</strong> {preferences.minWaveHeight}ft - {preferences.maxWaveHeight}ft</p>
              <p><strong>Max Wind:</strong> {preferences.maxWindSpeed} mph</p>
            </div>
          )}
        </section>

        {/* Surf Spots Section */}
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

        {/* Instructions */}
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
