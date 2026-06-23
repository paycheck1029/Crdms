import apiClient from './apiClient';

export const getUsers = async () => {
  return apiClient('/users');
};

export const createUser = async (userData) => {
  return apiClient('/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
};

export const updateUser = async (id, userData) => {
  return apiClient(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  });
};

export const deleteUser = async (id) => {
  return apiClient(`/users/${id}`, {
    method: 'DELETE'
  });
};

export default {
  getUsers,
  createUser,
  updateUser,
  deleteUser
};
