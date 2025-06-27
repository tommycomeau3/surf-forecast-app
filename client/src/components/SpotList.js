import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import './SpotList.css';

const SpotList = ({ 
  sessionId, 
  userLocation, 
  preferences, 
  spots, 
  loading, 
  onSpotsUpdate, 
  setLoading 
}) => {
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (sessionId && userLocation && preferences) {
      fetchRankedSpots();
    }
  }, [sessionId, userLocation, preferences]);

  const fetchRankedSpots = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiService.getRankedSpots(
        sessionId,
        userLocation.lat,
        userLocation.lng,
        preferences.maxDistanceKm
      );

      onSpotsUpdate(response.rankedSpots || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Failed to fetch surf spots');
      onSpotsUpdate([]);
    }

    setLoading(false);
  };

  const handleRefresh = () => {
    fetchRankedSpots();
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'fair';
    return 'poor';
  };

  const getScoreLabel = (score) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Poor';
  };

  const formatWaveHeight = (height) => {
    return height ? `${height.toFixed(1)}ft` : 'N/A';
  };

  const formatWindSpeed = (speed) => {
    return speed ? `${speed.toFixed(0)} mph` : 'N/A';
  };

  const formatDistance = (distance) => {
    return distance ? `${distance.toFixed(1)}km` : 'N/A';
  };

  if (loading) {
    return (
      <div className="spot-list-loading">
        <div className="loading-spinner"></div>
        <p>Finding the best surf spots for you...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="spot-list-error">
        <p className="error-message">{error}</p>
        <button onClick={handleRefresh} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  if (!spots || spots.length === 0) {
    return (
      <div className="spot-list-empty">
        <p>No surf spots found in your area. Try increasing your search radius.</p>
        <button onClick={handleRefresh} className="retry-button">
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="spot-list">
      <div className="spot-list-header">
        <div className="header-info">
          <h3>Ranked Surf Spots ({spots.length})</h3>
          {lastUpdated && (
            <p className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button onClick={handleRefresh} className="refresh-button">
          🔄 Refresh
        </button>
      </div>

      <div className="spots-grid">
        {spots.map((spot, index) => (
          <div key={spot.id} className="spot-card">
            <div className="spot-rank">#{index + 1}</div>
            
            <div className="spot-header">
              <h4 className="spot-name">{spot.name}</h4>
              <div className={`spot-score ${getScoreColor(spot.score)}`}>
                <span className="score-value">{(spot.score * 100).toFixed(0)}%</span>
                <span className="score-label">{getScoreLabel(spot.score)}</span>
              </div>
            </div>

            <div className="spot-info">
              <div className="spot-location">
                <span className="info-label">📍</span>
                <span>{spot.region}</span>
                <span className="distance">({formatDistance(spot.distance_km)})</span>
              </div>
              
              <div className="spot-difficulty">
                <span className="info-label">🏄‍♂️</span>
                <span className="difficulty-badge">{spot.difficulty_level}</span>
              </div>
            </div>

            <div className="spot-conditions">
              <div className="condition-item">
                <span className="condition-label">Waves</span>
                <span className="condition-value">
                  {formatWaveHeight(spot.conditions?.waveHeight)}
                </span>
              </div>
              <div className="condition-item">
                <span className="condition-label">Wind</span>
                <span className="condition-value">
                  {formatWindSpeed(spot.conditions?.windSpeed)}
                </span>
              </div>
            </div>

            <div className="spot-scores">
              <div className="score-breakdown">
                <div className="score-item">
                  <span>Wave</span>
                  <div className="score-bar">
                    <div 
                      className="score-fill" 
                      style={{ width: `${(spot.scores?.waveHeight || 0) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="score-item">
                  <span>Wind</span>
                  <div className="score-bar">
                    <div 
                      className="score-fill" 
                      style={{ width: `${(spot.scores?.wind || 0) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="score-item">
                  <span>Skill</span>
                  <div className="score-bar">
                    <div 
                      className="score-fill" 
                      style={{ width: `${(spot.scores?.skill || 0) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="spot-actions">
              <Link to={`/spot/${spot.id}`} className="view-details-button">
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpotList;