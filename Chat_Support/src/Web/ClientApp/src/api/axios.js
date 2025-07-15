import axios from 'axios';
import {getAuthTokens, setAuthTokens, clearAuthTokens} from '../contexts/AuthContext';

// تنظیم URL سرور
const getServerUrl = () => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  return `${protocol}//${hostname}${port}`;
};

const api = axios.create({
  baseURL: getServerUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to safely decode JWT
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    // Replace non-base64 characters and add padding
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    
    const jsonPayload = atob(padded);
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

api.interceptors.request.use(
  (config) => {
    const {token} = getAuthTokens();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

      const decodedToken = decodeJWT(token);
      if (decodedToken?.RegionId) {
        config.headers['X-Region-Id'] = decodedToken.RegionId;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const {token, refreshToken} = getAuthTokens();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const {data} = await axios.post(`${getServerUrl()}/api/AuthEndpoints/refresh-token`, {
          accessToken: token,
          refreshToken: refreshToken,
        });

        setAuthTokens(data.accessToken, data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (err) {
        clearAuthTokens();
        window.location.href = '/Home/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// API functions
export const getRoles = async () => {
  try {
    const {token} = getAuthTokens();
    if (!token) {
      console.warn('No token available for getRoles');
      return [];
    }

    // Validate token format before making the request
    if (!token.split('.')[1]) {
      console.warn('Invalid token format');
      return [];
    }

    const response = await api.get('/api/AuthEndpoints/roles');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching roles:', error);
    return []; // Return empty array instead of throwing
  }
};

export default api;
