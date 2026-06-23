import apiClient from './apiClient';

export const login = async (email, password) => {
  return apiClient('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
};

export const logout = async () => {
  return apiClient('/auth/logout', {
    method: 'POST'
  });
};

export const refreshToken = async () => {
  return apiClient('/auth/refresh', {
    method: 'POST'
  });
};

export default {
  login,
  logout,
  refreshToken
};
