import { query, queryRun } from '../database/connection.js';

export const create = async ({ candidateId, event, details, performedBy }) => {
  return queryRun(
    'INSERT INTO CandidateTimeline (candidate_id, event, details, performed_by) VALUES (?, ?, ?, ?)',
    [candidateId, event, details || null, performedBy || null]
  );
};

export const findByCandidateId = async (candidateId) => {
  return query(
    `SELECT t.*, u.username as performed_by_username 
     FROM CandidateTimeline t
     LEFT JOIN Users u ON t.performed_by = u.id
     WHERE t.candidate_id = ? 
     ORDER BY t.timestamp DESC`,
    [candidateId]
  );
};

export default {
  create,
  findByCandidateId
};
