import apiClient from './apiClient';

export const getReports = async () => {
  return apiClient('/reports');
};

export default {
  getReports
};
