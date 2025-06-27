import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import './SpotDetail.css';

const SpotDetail = () => {
  const { id } = useParams();
  const [spot, setSpot] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchSpotDetails();
    }
  }, [id]);

  const fetchSpotDetails = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiService.getSpotForecast(id);
      setSpot(response.spot);
      setForecast(response.forecast || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch spot details');
    }

    setLoading(false);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const formatWaveHeight = (height) => {
    return height ? `${height.toFixed(1)}ft` : 'N/A';
  };

  const formatWindSpeed = (speed) => {
    return speed ? `${speed.toFixed(0)} mph` : 'N/A';
  };

  const getWindDirection = (degrees) => {
    if (!degrees) return 'N/A';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'green';
      case 'intermediate': return 'orange';
      case 'advanced': return 'red';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="spot-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading spot details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="spot-detail-error">
        <p className="error-message">{error}</p>
        <Link to="/" className="back-button">← Back to Home</Link>
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="spot-detail-error">
        <p>Surf spot not found</p>
        <Link to="/" className="back-button">← Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="spot-detail">
      <div className="spot-detail-header">
        <Link to="/" className="back-button">← Back to Spots</Link>
        <button onClick={fetchSpotDetails} className="refresh-button">
          🔄 Refresh
        </button>
      </div>

      <div className="spot-info-card">
        <h1 className="spot-title">{spot.name}</h1>
        
        <div className="spot-meta">
          <div className="meta-item">
            <span className="meta-label">📍 Region:</span>
            <span>{spot.region}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">🌊 Break Type:</span>
            <span>{spot.break_type?.replace('_', ' ') || 'N/A'}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">🏄‍♂️ Difficulty:</span>
            <span 
              className={`difficulty-badge ${getDifficultyColor(spot.difficulty_level)}`}
            >
              {spot.difficulty_level}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">📍 Coordinates:</span>
            <span>{spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}</span>
          </div>
        </div>
      </div>

      {forecast.length > 0 ? (
        <div className="forecast-section">
          <h2>📊 Forecast</h2>
          <div className="forecast-table-container">
            <table className="forecast-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Wave Height</th>
                  <th>Wave Period</th>
                  <th>Wind Speed</th>
                  <th>Wind Direction</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {forecast.slice(0, 24).map((item, index) => {
                  const dateTime = formatDateTime(item.forecast_time || item.time);
                  return (
                    <tr key={index}>
                      <td>{dateTime.date}</td>
                      <td>{dateTime.time}</td>
                      <td>{formatWaveHeight(item.wave_height || item.waveHeight)}</td>
                      <td>{item.wave_period || item.wavePeriod ? `${(item.wave_period || item.wavePeriod).toFixed(1)}s` : 'N/A'}</td>
                      <td>{formatWindSpeed(item.wind_speed || item.windSpeed)}</td>
                      <td>{getWindDirection(item.wind_direction || item.windDirection)}</td>
                      <td className="source-badge">{item.source}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {forecast.length > 24 && (
            <p className="forecast-note">
              Showing next 24 hours. Total forecast data: {forecast.length} entries.
            </p>
          )}
        </div>
      ) : (
        <div className="no-forecast">
          <h2>📊 Forecast</h2>
          <p>No forecast data available for this spot.</p>
          <p>This might be due to API limitations or the spot being outside the coverage area.</p>
        </div>
      )}

      <div className="spot-tips">
        <h3>💡 Tips</h3>
        <div className="tips-content">
          {spot.difficulty_level === 'beginner' && (
            <div className="tip">
              <strong>Beginner Friendly:</strong> This spot is great for learning. 
              Consider taking a lesson or going with an experienced surfer.
            </div>
          )}
          {spot.difficulty_level === 'advanced' && (
            <div className="tip">
              <strong>Advanced Spot:</strong> This location can have challenging conditions. 
              Only recommended for experienced surfers.
            </div>
          )}
          {spot.break_type === 'reef_break' && (
            <div className="tip">
              <strong>Reef Break:</strong> Be aware of shallow reef. Wear reef booties and 
              be cautious of the bottom.
            </div>
          )}
          {spot.break_type === 'beach_break' && (
            <div className="tip">
              <strong>Beach Break:</strong> Sandy bottom makes this a safer option. 
              Conditions can change with tides and sand movement.
            </div>
          )}
          <div className="tip">
            <strong>Safety:</strong> Always check local conditions, surf with others, 
            and respect local surfers and rules.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotDetail;