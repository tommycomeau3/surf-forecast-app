import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API service methods
export const apiService = {
  // Health check
  healthCheck: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Surf spots
  getAllSpots: async () => {
    const response = await apiClient.get('/spots');
    return response.data;
  },

  getNearbySpots: async (lat, lng, radius = 50) => {
    const response = await apiClient.get('/spots/nearby', {
      params: { lat, lng, radius }
    });
    return response.data;
  },

  getSpotById: async (id) => {
    const response = await apiClient.get(`/spots/${id}`);
    return response.data;
  },

  // User preferences
  savePreferences: async (preferences) => {
    const response = await apiClient.post('/preferences', preferences);
    return response.data;
  },

  getPreferences: async (sessionId) => {
    const response = await apiClient.get(`/preferences/${sessionId}`);
    return response.data;
  },

  // Forecast
  getSpotForecast: async (spotId) => {
    const response = await apiClient.get(`/forecast/spot/${spotId}`);
    return response.data;
  },

  getRankedSpots: async (sessionId, lat, lng, radius) => {
    const response = await apiClient.post('/forecast/ranked', {
      sessionId,
      lat,
      lng,
      radius
    });
    return response.data;
  },

  getConditions: async (spotIds) => {
    const response = await apiClient.post('/forecast/conditions', {
      spotIds
    });
    return response.data;
  }
};

// Error handling interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.response) {
      // Server responded with error status
      throw new Error(error.response.data.error || 'Server error occurred');
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Unable to connect to server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error('An unexpected error occurred');
    }
  }
);

export default apiService;