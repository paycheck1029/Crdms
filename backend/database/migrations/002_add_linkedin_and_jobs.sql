-- Migration 002: Add LinkedIn Auth support, User Approval Status, and Jobs Posting schema

-- Add new columns to Users table
ALTER TABLE Users 
ADD COLUMN status VARCHAR(50) DEFAULT 'Pending',
ADD COLUMN linkedin_id VARCHAR(255) UNIQUE DEFAULT NULL,
ADD COLUMN profile_pic_url TEXT DEFAULT NULL;

-- Create Jobs table
CREATE TABLE IF NOT EXISTS Jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT DEFAULT NULL,
  location VARCHAR(255) NOT NULL,
  salary_range VARCHAR(100) DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_jobs_status (status),
  INDEX idx_jobs_creator (created_by)
);
