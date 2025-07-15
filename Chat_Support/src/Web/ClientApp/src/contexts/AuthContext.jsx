import {createContext, useContext, useEffect} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {startActivityMonitoring, stopActivityMonitoring, resetInactivityTimer} from '../Session/sessionManager';
import api from '../api/axios';

let inMemoryToken = null;
let inMemoryRefreshToken = null;
let tokenExpiryTime = null;

const AuthContext = createContext(null);

try {
  inMemoryToken = localStorage.getItem('token');
  inMemoryRefreshToken = localStorage.getItem('refreshToken');

  const expiryTimeStr = localStorage.getItem('tokenExpiryTime');
  tokenExpiryTime = expiryTimeStr ? new Date(expiryTimeStr) : null;
} catch (error) {
  console.error('Error loading tokens from storage:', error);
}

export const setAuthTokens = (accessToken, refreshToken) => {
  if (!accessToken || !refreshToken) {
    console.error('Invalid tokens provided');
    return;
  }

  inMemoryToken = accessToken;
  inMemoryRefreshToken = refreshToken;

  tokenExpiryTime = new Date();
  tokenExpiryTime.setMinutes(tokenExpiryTime.getMinutes() + 15);

  try {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('tokenExpiryTime', tokenExpiryTime.toISOString());
  } catch (error) {
    console.error('Error saving tokens to storage:', error);
  }
};

export const getAuthTokens = () => {
  return {
    token: inMemoryToken,
    refreshToken: inMemoryRefreshToken,
    expiryTime: tokenExpiryTime,
  };
};

export const clearAuthTokens = () => {
  inMemoryToken = null;
  inMemoryRefreshToken = null;
  tokenExpiryTime = null;

  try {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiryTime');
  } catch (error) {
    console.error('Error clearing tokens from storage:', error);
  }
};

const fetchUserData = async () => {
  const {token} = getAuthTokens();
  if (!token) return null;

  try {
    const {data} = await api.get('/api/AuthEndpoints/profile');
    return data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    if (error.response?.status === 401) {
      clearAuthTokens();
    }
    return null;
  }
};

const loginRequest = async ({username, password}) => {
  try {
    const {data} = await api.post('/api/AuthEndpoints/login', {
      username,
      password,
    });

    if (data.availableRegions && data.availableRegions.length > 1) {
      setAuthTokens(data.accessToken, data.refreshToken);
      return {
        ...data,
        requiresRegionSelection: true,
      };
    }

    if (data.accessToken) {
      setAuthTokens(data.accessToken, data.refreshToken);
    }

    return data;
  } catch (error) {
    throw new Error(error.response?.data || 'خطا در ورود به سیستم');
  }
};

const forgotPasswordRequest = async (mobile) => {
  try {
    const {data} = await api.post('/api/AuthEndpoints/forgot-password', {mobile});
    return data;
  } catch (error) {
    throw new Error(error.response?.data || 'خطا در بازیابی رمز عبور');
  }
};

const resetPasswordRequest = async ({mobile, code, newPassword}) => {
  try {
    const {data} = await api.post('/api/AuthEndpoints/reset-password', {
      mobile,
      code,
      newPassword,
    });
    return data;
  } catch (error) {
    throw new Error(error.response?.data || 'خطا در تغییر رمز عبور');
  }
};

const selectRegionRequest = async (regionId) => {
  try {
    const {data} = await api.post('/api/AuthEndpoints/select-region', {
      regionId,
    });

    setAuthTokens(data.accessToken, data.refreshToken);

    return data;
  } catch (error) {
    throw new Error(error.response?.data || 'خطا در انتخاب ناحیه');
  }
};

const refreshTokenIfNeeded = async () => {
  const {token, refreshToken, expiryTime} = getAuthTokens();

  if (!token || !refreshToken || !expiryTime) return;

  const expiryDate = new Date(expiryTime);
  const now = new Date();

  if (expiryDate - now < 2 * 60 * 1000) {
    try {
      const {data} = await api.post('/api/AuthEndpoints/refresh-token', {
        accessToken: token,
        refreshToken: refreshToken,
      });

      if (data.accessToken) {
        setAuthTokens(data.accessToken, data.refreshToken);
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      clearAuthTokens();
    }
  }
};

export const AuthProvider = ({children}) => {
  const queryClient = useQueryClient();

  const {data: user, isLoading} = useQuery({
    queryKey: ['user'],
    queryFn: fetchUserData,
    staleTime: 1000 * 60 * 14,
  });

  useEffect(() => {
    const {token} = getAuthTokens();
    if (token) {
      startActivityMonitoring();

      const tokenCheckInterval = setInterval(() => {
        refreshTokenIfNeeded();
      }, 60 * 1000);

      return () => {
        stopActivityMonitoring();
        clearInterval(tokenCheckInterval);
      };
    }

    return () => {
      stopActivityMonitoring();
    };
  }, [user]);

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: async (data) => {
      if (data.availableRegions?.length > 1) {
        queryClient.setQueryData(['availableRegions'], data.availableRegions);
        return data;
      }

      if (data.accessToken) {
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        const userData = await fetchUserData();
        queryClient.setQueryData(['user'], userData);
      }
    },
  });

  const selectRegionMutation = useMutation({
    mutationFn: selectRegionRequest,
    onSuccess: async (data) => {
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      const userData = await fetchUserData();
      queryClient.setQueryData(['user'], userData);
      queryClient.setQueryData(['availableRegions'], null);
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPasswordRequest,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: resetPasswordRequest,
  });

  const logout = async () => {
    try {
      await api.post('/api/AuthEndpoints/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthTokens();
      queryClient.setQueryData(['user'], null);
      queryClient.clear();
    }
  };

  const refreshSession = () => {
    resetInactivityTimer();
  };

  const value = {
    user,
    isLoading,
    login: loginMutation.mutateAsync,
    selectRegion: selectRegionMutation.mutateAsync,
    logout,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    isLoginLoading: loginMutation.isLoading,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
