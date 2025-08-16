const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// --- Token Management ---
const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('accessToken', accessToken);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};
const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// --- Logout Function ---
// Export this so you can call it from a logout button or other parts of your app
export const logout = () => {
  clearTokens();
  // Use window.location to force a full page reload, clearing any in-memory state.
  window.location.href = '/signin';
};

// --- Refresh Logic with Race Condition Prevention ---
// This ensures that if multiple API calls fail at once, we only try to refresh the token one time.
let isRefreshing = false;
let refreshPromise = null;

const handleRefreshToken = async () => {
  if (!isRefreshing) {
    isRefreshing = true;
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      console.error("No refresh token available. Logging out.");
      logout();
      return Promise.reject(new Error("No refresh token"));
    }
    
    // Create the refresh promise
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ refreshToken }),
    })
    .then(async (res) => {
      if (!res.ok) {
        // If refresh fails (e.g., token is invalid/expired), log the user out.
        console.error("Refresh token failed. Logging out.", await res.json());
        logout();
        throw new Error("Token refresh failed");
      }
      const data = await res.json();
      setTokens(data.accessToken); // Only the access token is returned
      return data.accessToken;
    })
    .catch((err) => {
      // Ensure logout on any kind of failure in the refresh chain
      logout();
      throw err; // Re-throw to reject subsequent calls
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
  }

  return refreshPromise;
};


// --- Core Request Function ---
const request = async (endpoint, options = {}, isRetry = false) => {
  const { body, ...customOptions } = options;
  const headers = {
    'Content-Type': 'application/json',
    ...customOptions.headers,
  };

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...customOptions,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // If response is 401 (Unauthorized) and this is not a retry attempt
    if (response.status === 401 && !isRetry) {
      console.log('Access token expired. Attempting to refresh...');
      try {
        const newAccessToken = await handleRefreshToken();
        // If refresh was successful, retry the original request with the new token
        if (newAccessToken) {
          console.log('Token refreshed successfully. Retrying original request.');
          return request(endpoint, options, true); // Set isRetry to true
        }
      } catch (refreshError) {
        // The handleRefreshToken function already logs the user out on failure.
        // We just need to stop the current execution flow.
        return Promise.reject(refreshError);
      }
    }
    
    // For non-JSON or empty responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return response.ok ? {} : Promise.reject(response);
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      // Attach status to the error object for better error handling in components
      const error = new Error(data.detail || 'An API error occurred');
      error.response = response;
      error.data = data;
      return Promise.reject(error);
    }

    return data;
  } catch (error) {
    console.error('Network or request error:', error);
    return Promise.reject(error);
  }
};

// --- Exported HTTP Client Methods ---
export const apiClient = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};
