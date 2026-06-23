import mysql from 'mysql2/promise';
import dbConfig from '../config/dbConfig.js';

let pool = null;

export const getPool = () => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
};

// Raw Query execution: returns rows array
export const query = async (sql, params = []) => {
  const connectionPool = getPool();
  const [rows] = await connectionPool.query(sql, params);
  return rows;
};

// Get single record: returns single row or null
export const queryGet = async (sql, params = []) => {
  const connectionPool = getPool();
  const [rows] = await connectionPool.query(sql, params);
  return rows[0] || null;
};

// Run modifying query: returns insert ID and affected rows
export const queryRun = async (sql, params = []) => {
  const connectionPool = getPool();
  const [result] = await connectionPool.query(sql, params);
  return {
    id: result.insertId || null,
    changes: result.affectedRows || 0
  };
};

export default {
  getPool,
  query,
  queryGet,
  queryRun
};
