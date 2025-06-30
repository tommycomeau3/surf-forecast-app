// Import axios library which used to make HTTP requests to the api
import axios from 'axios';

// Setting up address so axios knows where to send requests
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Creates an axios instance called apiClient 
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // If server doesn't respond in 10 seconds, throws an error
  headers: {
    'Content-Type': 'application/json', // Tells server I'm sending in JSON format 
  },
});

// Creating an object called apiService that other parts of App can use
export const apiService = {
  // Health check
  healthCheck: async () => { // Defines a function called healthCheck
    const response = await apiClient.get('/health'); // Sends a get response to the /health endpoint
    return response.data; // Returns data from response 
  },

  // Surf spots
  getAllSpots: async () => {
    const response = await apiClient.get('/spots'); // Sends a get response to the /spots endpoint
    return response.data;
  },

  getNearbySpots: async (lat, lng, radius = 50) => { // Function named getNearbySpots that takes in lat, lng, and radius (default is 50)
    const response = await apiClient.get('/spots/nearby', {
      params: { lat, lng, radius } // Uses axios param options to pass query parameters
    });
    return response.data;
  },

  getSpotById: async (id) => { // Takes in id parameter
    const response = await apiClient.get(`/spots/${id}`); // Sends get request to /spots/{id}
    return response.data;
  },

  // User preferences
  savePreferences: async (preferences) => { // Function named savePreferences that takes in preferences parameter
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
apiClient.interceptors.response.use( // Interceptors let you modify responses or handle errors before they reach your .then() or await
  (response) => response, // If response is successful, return as is
  (error) => {
    console.error('API Error:', error); // If error occurs this functions runs
    
    if (error.response) { // If there was a reponse with an error status
      // Server responded with error status
      throw new Error(error.response.data.error || 'Server error occurred');
    } else if (error.request) { // Server never responds
      // Request was made but no response received
      throw new Error('Unable to connect to server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error('An unexpected error occurred');
    }
  }
);

export default apiService;