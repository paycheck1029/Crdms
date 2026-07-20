import apiClient from './apiClient';

export const getJobs = async () => {
  return apiClient('/jobs');
};

export const createJob = async (jobData) => {
  return apiClient('/jobs', {
    method: 'POST',
    body: JSON.stringify(jobData)
  });
};

export const deleteJob = async (id) => {
  return apiClient(`/jobs/${id}`, {
    method: 'DELETE'
  });
};

export const approveJob = async (id) => {
  return apiClient(`/jobs/${id}/approve`, {
    method: 'PUT'
  });
};

export const rejectJob = async (id) => {
  return apiClient(`/jobs/${id}/reject`, {
    method: 'PUT'
  });
};

export default {
  getJobs,
  createJob,
  deleteJob,
  approveJob,
  rejectJob
};
