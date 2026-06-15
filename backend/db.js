import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'crdms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;

// Helper functions to wrap mysql2 methods
export const query = async (sql, params = []) => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  const [rows] = await pool.execute(sql, params);
  return rows;
};

export const queryGet = async (sql, params = []) => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  const [rows] = await pool.execute(sql, params);
  return rows[0] || null;
};

export const queryRun = async (sql, params = []) => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  const [result] = await pool.execute(sql, params);
  return {
    id: result.insertId || null,
    changes: result.affectedRows || 0
  };
};

// Initialize schema
export const initDB = async () => {
  console.log('Initializing database connection...');
  
  try {
    // 1. Create a temporary connection without database selected to ensure DB exists
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await tempConnection.end();
    console.log(`Database "${dbConfig.database}" verified/created successfully.`);
  } catch (err) {
    console.warn('Warning: Could not automatically verify/create MySQL database. Proceeding with pool creation:', err.message);
  }

  // 2. Initialize the main connection pool
  pool = mysql.createPool(dbConfig);

  console.log('Connected to MySQL database pool.');

  // Users Table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS Users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      role VARCHAR(100) NOT NULL, -- Admin, Recruitment Team, IT Team, Management
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Candidates Table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS Candidates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(100),
      skills TEXT NOT NULL, -- Comma-separated search list
      location VARCHAR(255) NOT NULL,
      experience_years REAL NOT NULL,
      status VARCHAR(100) NOT NULL, -- Applied, Screening, Interviewing, Offered, Rejected, Hired
      current_ctc REAL,
      expected_ctc REAL,
      notice_period_days INT,
      linkedin_url TEXT,
      company VARCHAR(255),
      preferred_location VARCHAR(255),
      remarks TEXT,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_candidates_status (status),
      INDEX idx_candidates_location (location)
    )
  `);

  // Documents Table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS Documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      candidate_id INT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_path TEXT NOT NULL,
      file_size INT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES Candidates (id) ON DELETE CASCADE
    )
  `);

  // ActivityLogs Table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS ActivityLogs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      username VARCHAR(255),
      action VARCHAR(100) NOT NULL,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Try creating indexes as standalone commands for backward compatibility
  try {
    await queryRun('CREATE INDEX idx_candidates_status ON Candidates(status)');
  } catch (err) {}
  try {
    await queryRun('CREATE INDEX idx_candidates_location ON Candidates(location)');
  } catch (err) {}

  console.log('Database tables verified/created successfully.');
};

export default pool;
