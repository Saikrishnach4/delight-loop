// API service utility for handling API calls with correct base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Helper function to get the full API URL
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // In development, use relative path (proxy will handle it)
  if (process.env.NODE_ENV === 'development') {
    return `/${cleanEndpoint}`;
  }
  
  // In production, use the full URL
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Fetch wrapper with proper URL handling
export const apiFetch = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  return fetch(url, options);
};

// Axios wrapper for API calls
export const apiRequest = async (method, endpoint, data = null, config = {}) => {
  const url = getApiUrl(endpoint);
  
  const axios = (await import('axios')).default;
  
  const requestConfig = {
    method,
    url,
    ...config
  };
  
  if (data) {
    if (method.toLowerCase() === 'get') {
      requestConfig.params = data;
    } else {
      requestConfig.data = data;
    }
  }
  
  return axios(requestConfig);
};

// Convenience methods
export const apiGet = (endpoint, params = null, config = {}) => 
  apiRequest('GET', endpoint, params, config);

export const apiPost = (endpoint, data = null, config = {}) => 
  apiRequest('POST', endpoint, data, config);

export const apiPut = (endpoint, data = null, config = {}) => 
  apiRequest('PUT', endpoint, data, config);

export const apiDelete = (endpoint, config = {}) => 
  apiRequest('DELETE', endpoint, null, config); 