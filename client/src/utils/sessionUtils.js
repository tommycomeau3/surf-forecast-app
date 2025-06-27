// Generate a unique session ID
export const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Get session ID from localStorage
export const getSessionId = () => {
  return localStorage.getItem('surf-app-session-id');
};

// Set session ID in localStorage
export const setSessionId = (sessionId) => {
  localStorage.setItem('surf-app-session-id', sessionId);
};