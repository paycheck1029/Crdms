import { query, queryGet, queryRun } from '../database/connection.js';

export const create = async ({ title, description, requirements, location, salaryRange, createdBy }) => {
  return queryRun(
    'INSERT INTO Jobs (title, description, requirements, location, salary_range, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    [title, description, requirements, location, salaryRange, createdBy]
  );
};

export const findById = async (id) => {
  return queryGet('SELECT * FROM Jobs WHERE id = ?', [id]);
};

export const listAll = async () => {
  return query('SELECT j.*, u.username as creator_name FROM Jobs j JOIN Users u ON j.created_by = u.id ORDER BY j.created_at DESC');
};

export const listApproved = async () => {
  return query('SELECT j.*, u.username as creator_name FROM Jobs j JOIN Users u ON j.created_by = u.id WHERE j.status = "Active" ORDER BY j.created_at DESC');
};

export const listByCreator = async (createdBy) => {
  return query('SELECT * FROM Jobs WHERE created_by = ? ORDER BY created_at DESC', [createdBy]);
};

export const updateStatus = async (id, status) => {
  return queryRun('UPDATE Jobs SET status = ? WHERE id = ?', [status, id]);
};

export const update = async (id, { title, description, requirements, location, salaryRange }) => {
  return queryRun(
    'UPDATE Jobs SET title = ?, description = ?, requirements = ?, location = ?, salary_range = ? WHERE id = ?',
    [title, description, requirements, location, salaryRange, id]
  );
};

export const deleteJob = async (id) => {
  return queryRun('DELETE FROM Jobs WHERE id = ?', [id]);
};

export default {
  create,
  findById,
  listAll,
  listApproved,
  listByCreator,
  updateStatus,
  update,
  deleteJob
};
