/*
AI Assistance Disclosure:
Tool: ChatGPT (model: GPT‑5), Gemini 2.5 Pro
Scope: 
- Generated initial template
- Kept it as it is for nginx routing 
Author review: 
- Verfied for correctness by reading code
- Tested using local 
*/



import axios from 'axios';

/**
 * API Client configured to work with nginx reverse proxy.
 * 
 * In development: All requests go through nginx on localhost:80
 * In production: All requests go through nginx on your domain
 * 
 * This eliminates CORS issues since everything appears to come from the same origin.
 */
const apiClient = axios.create({
  // Use relative path - nginx will handle the routing
  baseURL: '/api',
  
  // Optional: Set default timeout
  timeout: 10000,
  
  // Optional: Include credentials (cookies) with requests
  withCredentials: false, // Set to true if using cookies for auth
  
  // Default headers
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - runs before every request
 * Useful for logging or modifying requests
 */
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - runs after every response
 * Useful for handling common error cases
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Response Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });
      
      // Handle common error cases
      switch (error.response.status) {
        case 401:
          console.warn('Unauthorized - Token may be invalid or expired');
          // Optional: Trigger logout or token refresh here
          break;
        case 403:
          console.warn('Forbidden - Insufficient permissions');
          break;
        case 404:
          console.warn('Resource not found');
          break;
        case 500:
          console.error('Server error');
          break;
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('No response received:', error.request);
    } else {
      // Error in request setup
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Set the authentication token on the apiClient instance.
 * This function should be called from AuthProvider whenever the token changes.
 *
 * @param token The JWT string, or null to remove it.
 */
export const setAuthToken = (token: string | null) => {
  if (token) {
    // Apply the Authorization header for all subsequent requests
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('API Client: Token has been set.');
  } else {
    // Remove the Authorization header
    delete apiClient.defaults.headers.common['Authorization'];
    console.log('API Client: Token has been removed.');
  }
};

export default apiClient;