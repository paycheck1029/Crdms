import { query, queryGet, queryRun } from '../database/connection.js';

export const create = async ({ candidateId, fileName, filePath, fileSize, mimeType }) => {
  return queryRun(
    'INSERT INTO Documents (candidate_id, file_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?)',
    [candidateId, fileName, filePath, fileSize, mimeType]
  );
};

export const findById = async (id) => {
  return queryGet('SELECT * FROM Documents WHERE id = ?', [id]);
};

export const findByCandidateId = async (candidateId) => {
  return query('SELECT * FROM Documents WHERE candidate_id = ? ORDER BY uploaded_at DESC', [candidateId]);
};

export const deleteDoc = async (id) => {
  return queryRun('DELETE FROM Documents WHERE id = ?', [id]);
};

export default {
  create,
  findById,
  findByCandidateId,
  deleteDoc
};
