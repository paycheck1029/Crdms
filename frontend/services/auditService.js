import apiClient from './apiClient';

export const listLogs = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return apiClient(`/logs?${queryParams}`);
};

export default {
  listLogs
};
