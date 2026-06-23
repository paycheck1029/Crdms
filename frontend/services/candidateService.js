import apiClient from './apiClient';

export const getCandidates = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return apiClient(`/candidates?${queryParams}`);
};

export const getRecycleBin = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return apiClient(`/candidates/recycle-bin?${queryParams}`);
};

export const getCandidate = async (id, includeDeleted = false) => {
  return apiClient(`/candidates/${id}?includeDeleted=${includeDeleted}`);
};

export const createCandidate = async (candidateData) => {
  return apiClient('/candidates', {
    method: 'POST',
    body: JSON.stringify(candidateData)
  });
};

export const updateCandidate = async (id, candidateData) => {
  return apiClient(`/candidates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(candidateData)
  });
};

export const softDeleteCandidate = async (id) => {
  return apiClient(`/candidates/${id}`, {
    method: 'DELETE'
  });
};

export const restoreCandidate = async (id) => {
  return apiClient(`/candidates/restore/${id}`, {
    method: 'POST'
  });
};

export const hardDeleteCandidate = async (id) => {
  return apiClient(`/candidates/hard-delete/${id}`, {
    method: 'DELETE'
  });
};

export const importCandidates = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient('/candidates/import', {
    method: 'POST',
    body: formData
  });
};

export const uploadResume = async (candidateId, file) => {
  const formData = new FormData();
  formData.append('resume', file);
  formData.append('candidate_id', candidateId);

  return apiClient('/uploads', {
    method: 'POST',
    body: formData
  });
};

export const deleteResume = async (docId) => {
  return apiClient(`/uploads/${docId}`, {
    method: 'DELETE'
  });
};

export default {
  getCandidates,
  getRecycleBin,
  getCandidate,
  createCandidate,
  updateCandidate,
  softDeleteCandidate,
  restoreCandidate,
  hardDeleteCandidate,
  importCandidates,
  uploadResume,
  deleteResume
};
