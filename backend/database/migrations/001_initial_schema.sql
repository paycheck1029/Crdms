-- Migration: Initial Schema definition for CRDMS (MySQL Production Ready)

-- 1. Create migrations tracking table first
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS Users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(100) NOT NULL, -- Admin, HR Manager, Recruiter, Interviewer, Data Entry, Viewer
  email_verified BOOLEAN DEFAULT FALSE,
  refresh_token VARCHAR(500) DEFAULT NULL,
  login_attempts INT DEFAULT 0,
  locked_until DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_username (username),
  INDEX idx_users_email (email)
);

-- 3. Create Candidates Table (with Soft Deletes)
CREATE TABLE IF NOT EXISTS Candidates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(100) DEFAULT NULL,
  skills TEXT NOT NULL,
  location VARCHAR(255) NOT NULL,
  experience_years REAL NOT NULL,
  status VARCHAR(100) NOT NULL, -- Applied, Screening, Interviewing, Offered, Rejected, Hired, Selected, Joining, Pending
  current_ctc REAL DEFAULT NULL,
  expected_ctc REAL DEFAULT NULL,
  notice_period_days INT DEFAULT NULL,
  linkedin_url TEXT DEFAULT NULL,
  company VARCHAR(255) DEFAULT NULL,
  preferred_location VARCHAR(255) DEFAULT NULL,
  remarks TEXT DEFAULT NULL,
  comment TEXT DEFAULT NULL,
  deleted_at DATETIME DEFAULT NULL,
  deleted_by INT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (deleted_by) REFERENCES Users(id) ON DELETE SET NULL,
  INDEX idx_candidates_status (status),
  INDEX idx_candidates_location (location),
  INDEX idx_candidates_experience (experience_years),
  INDEX idx_candidates_email (email),
  INDEX idx_candidates_phone (phone),
  INDEX idx_candidates_created (created_at)
);

-- 4. Create Documents Table (for attachments & resumes)
CREATE TABLE IF NOT EXISTS Documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES Candidates(id) ON DELETE CASCADE,
  INDEX idx_documents_candidate (candidate_id)
);

-- 5. Create CandidateTimeline Table
CREATE TABLE IF NOT EXISTS CandidateTimeline (
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,
  event VARCHAR(255) NOT NULL, -- Created, Updated, Assigned, Interview Scheduled, Interview Completed, Offer Sent, Hired, Rejected
  details TEXT DEFAULT NULL,
  performed_by INT DEFAULT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES Candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (performed_by) REFERENCES Users(id) ON DELETE SET NULL,
  INDEX idx_timeline_candidate (candidate_id)
);

-- 6. Create ActivityLogs Table (Audit Logs)
CREATE TABLE IF NOT EXISTS ActivityLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  username VARCHAR(255) DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT DEFAULT NULL,
  ip_address VARCHAR(100) DEFAULT NULL,
  browser VARCHAR(255) DEFAULT NULL,
  os VARCHAR(255) DEFAULT NULL,
  old_value TEXT DEFAULT NULL,
  new_value TEXT DEFAULT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL,
  INDEX idx_logs_timestamp (timestamp),
  INDEX idx_logs_username (username),
  INDEX idx_logs_action (action)
);
