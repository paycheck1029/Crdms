import { query, queryGet, queryRun } from '../database/connection.js';

export const buildCandidateQuery = (params, onlyDeleted = false) => {
  let sql = 'SELECT * FROM Candidates WHERE ';
  sql += onlyDeleted ? 'deleted_at IS NOT NULL' : 'deleted_at IS NULL';
  
  const queryParams = [];

  // Advanced Search Filters
  if (params.search) {
    sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR company LIKE ?)';
    const searchVal = `%${params.search}%`;
    queryParams.push(searchVal, searchVal, searchVal, searchVal);
  }

  if (params.name) {
    sql += ' AND name LIKE ?';
    queryParams.push(`%${params.name}%`);
  }

  if (params.email) {
    sql += ' AND email LIKE ?';
    queryParams.push(`%${params.email}%`);
  }

  if (params.phone) {
    sql += ' AND phone LIKE ?';
    queryParams.push(`%${params.phone}%`);
  }

  if (params.status) {
    sql += ' AND status = ?';
    queryParams.push(params.status);
  }

  if (params.location) {
    sql += ' AND location LIKE ?';
    queryParams.push(`%${params.location}%`);
  }

  if (params.company) {
    sql += ' AND company LIKE ?';
    queryParams.push(`%${params.company}%`);
  }

  if (params.minExp !== undefined && params.minExp !== '') {
    sql += ' AND experience_years >= ?';
    queryParams.push(parseFloat(params.minExp));
  }

  if (params.maxExp !== undefined && params.maxExp !== '') {
    sql += ' AND experience_years <= ?';
    queryParams.push(parseFloat(params.maxExp));
  }

  if (params.skills) {
    const skillList = params.skills.split(',').map(s => s.trim().toLowerCase());
    skillList.forEach(skill => {
      sql += ' AND LOWER(skills) LIKE ?';
      queryParams.push(`%${skill}%`);
    });
  }

  if (params.dateFrom) {
    sql += ' AND created_at >= ?';
    queryParams.push(params.dateFrom);
  }

  if (params.dateTo) {
    sql += ' AND created_at <= ?';
    queryParams.push(params.dateTo);
  }

  return { sql, queryParams };
};

export const findActive = async (params = {}) => {
  const { sql, queryParams } = buildCandidateQuery(params, false);

  // Sorting
  const allowedSortFields = ['name', 'experience_years', 'status', 'created_at', 'updated_at'];
  const sort = allowedSortFields.includes(params.sort) ? params.sort : 'updated_at';
  const order = params.order === 'asc' ? 'ASC' : 'DESC';
  let finalSql = `${sql} ORDER BY ${sort} ${order}`;

  // Pagination
  const page = parseInt(params.page || '1', 10);
  const limit = parseInt(params.limit || '20', 10);
  const offset = (page - 1) * limit;

  finalSql += ' LIMIT ? OFFSET ?';
  queryParams.push(limit, offset);

  return query(finalSql, queryParams);
};

export const countActive = async (params = {}) => {
  const { sql, queryParams } = buildCandidateQuery(params, false);
  const countSql = `SELECT COUNT(*) as count FROM (${sql}) as temp`;
  const result = await queryGet(countSql, queryParams);
  return result ? result.count : 0;
};

export const findDeleted = async (params = {}) => {
  const { sql, queryParams } = buildCandidateQuery(params, true);
  
  const sort = 'deleted_at';
  const order = 'DESC';
  let finalSql = `${sql} ORDER BY ${sort} ${order}`;

  const page = parseInt(params.page || '1', 10);
  const limit = parseInt(params.limit || '20', 10);
  const offset = (page - 1) * limit;

  finalSql += ' LIMIT ? OFFSET ?';
  queryParams.push(limit, offset);

  return query(finalSql, queryParams);
};

export const countDeleted = async (params = {}) => {
  const { sql, queryParams } = buildCandidateQuery(params, true);
  const countSql = `SELECT COUNT(*) as count FROM (${sql}) as temp`;
  const result = await queryGet(countSql, queryParams);
  return result ? result.count : 0;
};

export const findById = async (id, includeDeleted = false) => {
  if (includeDeleted) {
    return queryGet('SELECT * FROM Candidates WHERE id = ?', [id]);
  }
  return queryGet('SELECT * FROM Candidates WHERE id = ? AND deleted_at IS NULL', [id]);
};

export const create = async (c) => {
  return queryRun(
    `INSERT INTO Candidates 
     (name, email, phone, skills, location, experience_years, status, current_ctc, expected_ctc, notice_period_days, linkedin_url, company, preferred_location, remarks, comment)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      c.name, c.email, c.phone || null, c.skills, c.location, parseFloat(c.experience_years), c.status,
      c.current_ctc ? parseFloat(c.current_ctc) : null,
      c.expected_ctc ? parseFloat(c.expected_ctc) : null,
      c.notice_period_days ? parseInt(c.notice_period_days, 10) : null,
      c.linkedin_url || null, c.company || null, c.preferred_location || null, c.remarks || null, c.comment || null
    ]
  );
};

export const update = async (id, c) => {
  return queryRun(
    `UPDATE Candidates SET 
       name = COALESCE(?, name),
       email = COALESCE(?, email),
       phone = COALESCE(?, phone),
       skills = COALESCE(?, skills),
       location = COALESCE(?, location),
       experience_years = COALESCE(?, experience_years),
       status = COALESCE(?, status),
       current_ctc = COALESCE(?, current_ctc),
       expected_ctc = COALESCE(?, expected_ctc),
       notice_period_days = COALESCE(?, notice_period_days),
       linkedin_url = COALESCE(?, linkedin_url),
       company = COALESCE(?, company),
       preferred_location = COALESCE(?, preferred_location),
       remarks = COALESCE(?, remarks),
       comment = COALESCE(?, comment),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND deleted_at IS NULL`,
    [
      c.name, c.email, c.phone, c.skills, c.location,
      c.experience_years !== undefined ? parseFloat(c.experience_years) : null,
      c.status,
      c.current_ctc !== undefined ? parseFloat(c.current_ctc) : null,
      c.expected_ctc !== undefined ? parseFloat(c.expected_ctc) : null,
      c.notice_period_days !== undefined ? parseInt(c.notice_period_days, 10) : null,
      c.linkedin_url, c.company, c.preferred_location, c.remarks, c.comment,
      id
    ]
  );
};

export const softDelete = async (id, userId) => {
  return queryRun(
    'UPDATE Candidates SET deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE id = ? AND deleted_at IS NULL',
    [userId, id]
  );
};

export const restore = async (id) => {
  return queryRun(
    'UPDATE Candidates SET deleted_at = NULL, deleted_by = NULL WHERE id = ? AND deleted_at IS NOT NULL',
    [id]
  );
};

export const hardDelete = async (id) => {
  return queryRun('DELETE FROM Candidates WHERE id = ?', [id]);
};

export default {
  findActive,
  countActive,
  findDeleted,
  countDeleted,
  findById,
  create,
  update,
  softDelete,
  restore,
  hardDelete
};
