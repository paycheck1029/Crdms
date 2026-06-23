import { API_URL } from '@/config';

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
};

export const apiClient = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  
  // Set default headers
  const headers = {
    ...options.headers
  };

  // Skip content-type header for FormData (e.g. file uploads) so browser sets boundary
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach access token if exists
  const token = typeof window !== 'undefined' ? localStorage.getItem('crdms_token') : null;
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, fetchOptions);

    // Enforce access token refresh on 401 Unauthorized (expired token)
    if (response.status === 401 && token) {
      if (endpoint === '/auth/refresh' || endpoint === '/auth/login') {
        // If the refresh endpoint itself fails or login fails, do not try refreshing again
        throw new Error('Auth failed');
      }

      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          // Fetch new access token using httpOnly refresh token cookie
          const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newAccessToken = refreshData.data.accessToken;

            localStorage.setItem('crdms_token', newAccessToken);
            isRefreshing = false;
            
            // Notify subscribers
            onRefreshed(newAccessToken);
          } else {
            // Refresh token expired or invalid, force logout
            isRefreshing = false;
            localStorage.removeItem('crdms_token');
            localStorage.removeItem('crdms_user');
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            throw new Error('Session expired');
          }
        } catch (refreshErr) {
          isRefreshing = false;
          throw refreshErr;
        }
      }

      // Queue original request until token refreshed
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          headers['Authorization'] = `Bearer ${newToken}`;
          resolve(fetch(url, { ...options, headers }));
        });
      }).then(res => res.json());
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    if (error.message === 'Session expired' || error.message === 'Auth failed') {
      throw error;
    }
    throw new Error(error.message || 'Network request failed');
  }
};

export default apiClient;
