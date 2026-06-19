import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { query, queryGet, queryRun, initDB } from './db.js';
import { authenticateToken, checkRole } from './middleware/authMiddleware.js';
import xlsx from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadDir = join(__dirname, 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'crdms_default_secret_key_123456';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// Helpers for salary and notice period parsing
const parsePay = (val) => {
  if (val === undefined || val === null) return null;
  const cleaned = String(val).replace(/[,]/g, '').trim();
  const match = cleaned.match(/([0-9.]+)/);
  if (match) {
    let num = parseFloat(match[1]);
    if (/lakh|l/i.test(cleaned)) {
      num = num * 100000;
    } else if (/k/i.test(cleaned)) {
      num = num * 1000;
    }
    return num;
  }
  return null;
};

const parseNoticePeriod = (val) => {
  if (val === undefined || val === null) return null;
  const cleaned = String(val).toLowerCase().trim();
  const match = cleaned.match(/([0-9]+)/);
  if (match) {
    let days = parseInt(match[1]);
    if (cleaned.includes('month')) {
      days = days * 30;
    }
    return days;
  }
  if (cleaned.includes('immediate') || cleaned.includes('now') || cleaned.includes('0')) {
    return 0;
  }
  return null;
};

// Helper: Log activities into database
const logActivity = async (req, action, details) => {
  try {
    const userId = req.user ? req.user.id : null;
    const username = req.user ? req.user.username : 'system';
    await queryRun(
      'INSERT INTO ActivityLogs (user_id, username, action, details) VALUES (?, ?, ?, ?)',
      [userId, username, action, details]
    );
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// POST /auth/login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await queryGet('SELECT * FROM Users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    await logActivity({ user }, 'User Login', `${user.username} logged in successfully.`);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// 2. USER MANAGEMENT ENDPOINTS (Admin Only)
// ==========================================

// GET /users
app.get('/users', authenticateToken, checkRole(['Admin']), async (req, res) => {
  try {
    const users = await query('SELECT id, username, email, role, created_at FROM Users ORDER BY created_at DESC');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /users
app.post('/users', authenticateToken, checkRole(['Admin']), async (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: 'Username, email, password, and role are required' });
  }

  const validRoles = ['Admin', 'Recruitment Team', 'IT Team', 'Management'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid user role' });
  }

  try {
    // Check duplication
    const existingUser = await queryGet('SELECT id FROM Users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await queryRun(
      'INSERT INTO Users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, passwordHash, role]
    );

    await logActivity(req, 'Create User', `Created new user account: ${username} (${role})`);
    
    res.status(201).json({ id: result.id, username, email, role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /users/:id
app.put('/users/:id', authenticateToken, checkRole(['Admin']), async (req, res) => {
  const { id } = req.params;
  const { email, password, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ error: 'Email and role are required' });
  }

  const validRoles = ['Admin', 'Recruitment Team', 'IT Team', 'Management'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid user role' });
  }

  try {
    const user = await queryGet('SELECT username, email, role FROM Users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check duplicate email
    const emailExists = await queryGet('SELECT id FROM Users WHERE email = ? AND id != ?', [email, id]);
    if (emailExists) {
      return res.status(400).json({ error: 'Email already in use by another user' });
    }

    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    if (passwordHash) {
      await queryRun(
        'UPDATE Users SET email = ?, role = ?, password_hash = ? WHERE id = ?',
        [email, role, passwordHash, id]
      );
    } else {
      await queryRun(
        'UPDATE Users SET email = ?, role = ? WHERE id = ?',
        [email, role, id]
      );
    }

    // Dynamic audit details logging
    let details = `Updated user account @${user.username}:`;
    if (email !== user.email) details += ` email changed to ${email};`;
    if (role !== user.role) details += ` role changed from ${user.role} to ${role};`;
    if (password) details += ' password reset successfully;';

    await logActivity(req, 'Update User', details);

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /users/:id
app.delete('/users/:id', authenticateToken, checkRole(['Admin']), async (req, res) => {
  const { id } = req.params;
  
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own admin account' });
  }

  try {
    const user = await queryGet('SELECT username FROM Users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await queryRun('DELETE FROM Users WHERE id = ?', [id]);
    await logActivity(req, 'Delete User', `Deleted user account: ${user.username}`);

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// 3. CANDIDATE MANAGEMENT ENDPOINTS
// ==========================================

// GET /candidates (Advanced Search & Filter)
// Access: Management, Recruitment Team, Admin
app.get('/candidates', authenticateToken, checkRole(['Admin', 'Recruitment Team', 'Management']), async (req, res) => {
  const { q, status, location, minExp, maxExp, skills } = req.query;
  
  let sql = 'SELECT * FROM Candidates WHERE 1=1';
  const params = [];

  // 1. Text Search (Name, email, phone)
  if (q) {
    sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
    const searchVal = `%${q}%`;
    params.push(searchVal, searchVal, searchVal);
  }

  // 2. Status filter
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  // 3. Location filter
  if (location) {
    sql += ' AND location LIKE ?';
    params.push(`%${location}%`);
  }

  // 4. Experience bounds
  if (minExp) {
    sql += ' AND experience_years >= ?';
    params.push(parseFloat(minExp));
  }
  if (maxExp) {
    sql += ' AND experience_years <= ?';
    params.push(parseFloat(maxExp));
  }

  // 5. Skills query (comma-separated skills match)
  if (skills) {
    const skillList = skills.split(',').map(s => s.trim().toLowerCase());
    skillList.forEach(skill => {
      sql += ' AND LOWER(skills) LIKE ?';
      params.push(`%${skill}%`);
    });
  }

  // Sorting
  sql += ' ORDER BY updated_at DESC';

  try {
    const start = Date.now();
    const candidates = await query(sql, params);
    const timeTakenMs = Date.now() - start;

    // Verify sub-2 seconds requirement (just log warnings internally)
    if (timeTakenMs > 2000) {
      console.warn(`Performance alert: candidate query took ${timeTakenMs}ms`);
    }

    res.json(candidates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /candidates/:id
// Access: Management, Recruitment Team, Admin
app.get('/candidates/:id', authenticateToken, checkRole(['Admin', 'Recruitment Team', 'Management']), async (req, res) => {
  const { id } = req.params;
  try {
    const candidate = await queryGet('SELECT * FROM Candidates WHERE id = ?', [id]);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate profile not found' });
    }

    // Attach documents
    const documents = await query('SELECT * FROM Documents WHERE candidate_id = ?', [id]);
    candidate.documents = documents;

    res.json(candidate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Configure memory storage multer for Excel uploads
const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel files (.xlsx, .xls) are supported.'));
    }
  }
});

// POST /candidates/import
// Access: Recruitment Team, Admin
app.post('/candidates/import', authenticateToken, checkRole(['Admin', 'Recruitment Team']), excelUpload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please upload an Excel file' });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet);

    let imported = 0;
    let duplicates = 0;
    let invalid = 0;

    for (const rawRow of rows) {
      // Normalize columns: trim spaces and lowercase the keys
      const row = {};
      Object.keys(rawRow).forEach(key => {
        row[key.trim().toLowerCase()] = rawRow[key];
      });

      const rawName = row['name'] || row['candidate name'] || row['  name'];
      const rawLink = row['link'] || row['linkedin'] || row['   link'] || row['linkedin link'];
      const rawExperience = row['exprience'] || row['experience'] || row[' exprience'];
      const rawCompany = row['company'] || row['  company'];

      const name = rawName ? String(rawName).trim() : '';
      const linkedin = rawLink ? String(rawLink).trim() : '';

      // Validate name (required field)
      if (!name) {
        invalid++;
        continue;
      }

      // Parse experience_years (extract floating number)
      let experience_years = 0;
      if (rawExperience !== undefined) {
        const match = String(rawExperience).match(/([0-9.]+)/);
        if (match) {
          experience_years = parseFloat(match[1]);
        }
      }

      // Normalize LinkedIn URL
      let normalizedLinkedin = '';
      let emailLocalSlug = '';
      if (linkedin) {
        normalizedLinkedin = linkedin;
        if (!normalizedLinkedin.startsWith('http://') && !normalizedLinkedin.startsWith('https://')) {
          if (normalizedLinkedin.startsWith('www.')) {
            normalizedLinkedin = 'https://' + normalizedLinkedin;
          } else if (normalizedLinkedin.startsWith('linkedin.com')) {
            normalizedLinkedin = 'https://www.' + normalizedLinkedin;
          } else {
            normalizedLinkedin = 'https://www.linkedin.com/in/' + normalizedLinkedin;
          }
        }

        // Extract username slug for email generation
        let slug = normalizedLinkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//i, '');
        slug = slug.split(/[?\/]/)[0].trim().toLowerCase();
        if (slug) {
          emailLocalSlug = slug;
        }
      }

      // If no slug from linkedin, sanitize candidate's name to generate email slug
      if (!emailLocalSlug) {
        emailLocalSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      }

      // Generate email matching requested format: slug@import.local
      let email = `${emailLocalSlug}@import.local`;
      
      let isDuplicate = false;
      
      // 1. Primary check: duplicate linkedin_url
      if (normalizedLinkedin) {
        const dupLinkedIn = await queryGet('SELECT id FROM Candidates WHERE linkedin_url = ?', [normalizedLinkedin]);
        if (dupLinkedIn) {
          isDuplicate = true;
        }
      }

      // 2. Secondary check: duplicate email
      if (!isDuplicate) {
        const dupEmail = await queryGet('SELECT id FROM Candidates WHERE email = ?', [email]);
        if (dupEmail) {
          isDuplicate = true;
        }
      }

      if (isDuplicate) {
        duplicates++;
        continue;
      }

      // Dynamic parsing matching user Excel columns
      // Dynamic parsing matching user Excel columns
      const rawSkills = row['skills'] || row['skill'] || row['key skills'];
      const skills = rawSkills ? String(rawSkills).trim() : (rawCompany ? `AI, Machine Learning, ${String(rawCompany).trim()}` : 'AI, Machine Learning');
      
      const rawLocation = row['current location'] || row['location'] || row['current_location'];
      const location = rawLocation ? String(rawLocation).trim() : 'Remote';
      
      const rawPhone = row['mobile number'] || row['phone'] || row['mobile'] || row['mobile_number'];
      const phone = rawPhone ? String(rawPhone).trim() : null;

      const rawStatus = row['status'];
      let status = 'Applied';
      if (rawStatus) {
        const trimmed = String(rawStatus).trim();
        const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
        const validStatuses = ['Applied', 'Screening', 'Interviewing', 'Offered', 'Hired', 'Rejected'];
        if (validStatuses.includes(capitalized)) {
          status = capitalized;
        } else if (capitalized === 'Interview') {
          status = 'Interviewing';
        }
      }

      const rawCurrentPay = row['current pay'] || row['current_pay'] || row['current ctc'] || row['current_ctc'];
      const rawExpectedPay = row['expected pay'] || row['expected_pay'] || row['expected ctc'] || row['expected_ctc'];
      const rawNoticePeriod = row['notice period'] || row['notice_period'];

      const current_ctc = rawCurrentPay !== undefined && rawCurrentPay !== null ? parsePay(rawCurrentPay) : null;
      const expected_ctc = rawExpectedPay !== undefined && rawExpectedPay !== null ? parsePay(rawExpectedPay) : null;
      const notice_period_days = rawNoticePeriod !== undefined && rawNoticePeriod !== null ? parseNoticePeriod(rawNoticePeriod) : null;

      const company = rawCompany ? String(rawCompany).trim() : null;
      const rawPrefLoc = row['preferred location'] || row['preferred_location'] || row['preferred place'];
      const preferred_location = rawPrefLoc ? String(rawPrefLoc).trim() : null;
      
      const rawRemarks = row['remarks'] || row['remark'];
      const remarks = rawRemarks ? String(rawRemarks).trim() : null;
      
      const rawComment = row['comment'] || row['comments'];
      const comment = rawComment ? String(rawComment).trim() : null;

      try {
        await queryRun(
          `INSERT INTO Candidates 
           (name, email, phone, skills, location, experience_years, status, current_ctc, expected_ctc, notice_period_days, linkedin_url, company, preferred_location, remarks, comment)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            name, 
            email, 
            phone, 
            skills, 
            location, 
            experience_years, 
            status, 
            current_ctc, 
            expected_ctc, 
            notice_period_days, 
            normalizedLinkedin,
            company,
            preferred_location,
            remarks,
            comment
          ]
        );
        imported++;
      } catch (err) {
        console.error(`Error importing candidate ${name}:`, err.message);
        invalid++;
      }
    }

    const summaryDetails = `Imported ${imported} candidates (${duplicates} duplicates skipped, ${invalid} invalid/failed rows skipped)`;
    await logActivity(req, 'Import Candidates', summaryDetails);

    res.json({
      total: rows.length,
      imported,
      duplicates,
      invalid
    });
  } catch (err) {
    console.error('Error parsing Excel import:', err);
    res.status(500).json({ error: 'Failed to process Excel file' });
  }
});

// POST /candidates (Create)
// Access: Recruitment Team, Admin
app.post('/candidates', authenticateToken, checkRole(['Admin', 'Recruitment Team']), async (req, res) => {
  const {
    name,
    email,
    phone,
    skills,
    location,
    experience_years,
    status,
    current_ctc,
    expected_ctc,
    notice_period_days,
    linkedin_url,
    company,
    preferred_location,
    remarks,
    comment
  } = req.body;

  if (!name || !email || !skills || !location || experience_years === undefined || !status) {
    return res.status(400).json({ error: 'Required fields: name, email, skills, location, experience_years, status' });
  }

  try {
    const exists = await queryGet('SELECT id FROM Candidates WHERE email = ?', [email]);
    if (exists) {
      return res.status(400).json({ error: 'A candidate with this email address already exists' });
    }

    const result = await queryRun(
      `INSERT INTO Candidates 
       (name, email, phone, skills, location, experience_years, status, current_ctc, expected_ctc, notice_period_days, linkedin_url, company, preferred_location, remarks, comment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        phone,
        skills,
        location,
        parseFloat(experience_years),
        status,
        current_ctc ? parseFloat(current_ctc) : null,
        expected_ctc ? parseFloat(expected_ctc) : null,
        notice_period_days ? parseInt(notice_period_days) : null,
        linkedin_url || null,
        company || null,
        preferred_location || null,
        remarks || null,
        comment || null
      ]
    );

    await logActivity(req, 'Create Candidate', `Added profile for candidate: ${name} (${email})`);

    res.status(201).json({ id: result.id, name, email, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /candidates/:id (Update)
// Access: Recruitment Team, Admin
app.put('/candidates/:id', authenticateToken, checkRole(['Admin', 'Recruitment Team']), async (req, res) => {
  const { id } = req.params;
  const {
    name,
    email,
    phone,
    skills,
    location,
    experience_years,
    status,
    current_ctc,
    expected_ctc,
    notice_period_days,
    linkedin_url,
    company,
    preferred_location,
    remarks,
    comment
  } = req.body;

  try {
    const candidate = await queryGet('SELECT name, email, status FROM Candidates WHERE id = ?', [id]);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate profile not found' });
    }

    // Check email uniqueness if modified
    if (email && email !== candidate.email) {
      const emailExists = await queryGet('SELECT id FROM Candidates WHERE email = ? AND id != ?', [email, id]);
      if (emailExists) {
        return res.status(400).json({ error: 'Another candidate already uses this email address' });
      }
    }

    await queryRun(
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
       WHERE id = ?`,
      [
        name,
        email,
        phone,
        skills,
        location,
        experience_years !== undefined ? parseFloat(experience_years) : null,
        status,
        current_ctc !== undefined ? parseFloat(current_ctc) : null,
        expected_ctc !== undefined ? parseFloat(expected_ctc) : null,
        notice_period_days !== undefined ? parseInt(notice_period_days) : null,
        linkedin_url !== undefined ? linkedin_url : null,
        company !== undefined ? company : null,
        preferred_location !== undefined ? preferred_location : null,
        remarks !== undefined ? remarks : null,
        comment !== undefined ? comment : null,
        id
      ]
    );

    let details = `Updated profile for candidate ${name || candidate.name}`;
    if (status && status !== candidate.status) {
      details += ` (Status changed from '${candidate.status}' to '${status}')`;
    }
    await logActivity(req, 'Update Candidate', details);

    res.json({ message: 'Candidate updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /candidates/:id
// Access: Admin only
app.delete('/candidates/:id', authenticateToken, checkRole(['Admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const candidate = await queryGet('SELECT name FROM Candidates WHERE id = ?', [id]);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Delete associated files
    const docs = await query('SELECT file_path FROM Documents WHERE candidate_id = ?', [id]);
    docs.forEach(doc => {
      try {
        if (fs.existsSync(doc.file_path)) {
          fs.unlinkSync(doc.file_path);
        }
      } catch (err) {
        console.error('Failed to delete resume file:', err);
      }
    });

    await queryRun('DELETE FROM Candidates WHERE id = ?', [id]);
    await logActivity(req, 'Delete Candidate', `Deleted candidate profile and associated resumes: ${candidate.name}`);

    res.json({ message: 'Candidate deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// 4. RESUME UPLOAD ENDPOINTS
// ==========================================

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const originalExt = file.originalname.split('.').pop();
    cb(null, `resume-${uniqueSuffix}.${originalExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Max 10MB
  fileFilter: (req, file, cb) => {
    // PDF, DOCX, DOC, TXT allowed
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, DOC, and TXT are supported.'));
    }
  }
});

// POST /uploads
// Access: Recruitment Team, Admin
app.post('/uploads', authenticateToken, checkRole(['Admin', 'Recruitment Team']), (req, res) => {
  upload.single('resume')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const { candidate_id } = req.body;
    if (!candidate_id || !req.file) {
      return res.status(400).json({ error: 'Missing candidate_id or file' });
    }

    try {
      const candidate = await queryGet('SELECT name FROM Candidates WHERE id = ?', [candidate_id]);
      if (!candidate) {
        // Delete uploaded file if candidate does not exist
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ error: 'Candidate not found' });
      }

      // Record in Documents table
      const result = await queryRun(
        'INSERT INTO Documents (candidate_id, file_name, file_path, file_size) VALUES (?, ?, ?, ?)',
        [candidate_id, req.file.originalname, req.file.path, req.file.size]
      );

      await logActivity(req, 'Upload Resume', `Uploaded resume '${req.file.originalname}' for candidate: ${candidate.name}`);

      res.status(201).json({
        id: result.id,
        candidate_id,
        file_name: req.file.originalname,
        file_size: req.file.size
      });
    } catch (dbErr) {
      console.error(dbErr);
      res.status(500).json({ error: 'Internal database error' });
    }
  });
});

// DELETE /uploads/:id
// Access: Admin, Recruitment Team
app.delete('/uploads/:id', authenticateToken, checkRole(['Admin', 'Recruitment Team']), async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await queryGet('SELECT * FROM Documents WHERE id = ?', [id]);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const candidate = await queryGet('SELECT name FROM Candidates WHERE id = ?', [doc.candidate_id]);

    // Delete file
    if (fs.existsSync(doc.file_path)) {
      fs.unlinkSync(doc.file_path);
    }

    await queryRun('DELETE FROM Documents WHERE id = ?', [id]);
    await logActivity(req, 'Delete Resume', `Deleted resume '${doc.file_name}' for candidate: ${candidate ? candidate.name : 'Unknown'}`);

    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// 5. REPORTS ENDPOINT (Management, Admin)
// ==========================================

// GET /reports
app.get('/reports', authenticateToken, checkRole(['Admin', 'Management', 'Recruitment Team', 'IT Team']), async (req, res) => {
  try {
    // 1. Candidate count by Status
    const statusCounts = await query('SELECT status, COUNT(*) as count FROM Candidates GROUP BY status');

    // 2. Candidate count by Location
    const locationCounts = await query('SELECT location, COUNT(*) as count FROM Candidates GROUP BY location ORDER BY count DESC LIMIT 8');

    // 3. Experience stats
    const expStats = await queryGet('SELECT AVG(experience_years) as avgExp, MIN(experience_years) as minExp, MAX(experience_years) as maxExp, COUNT(*) as total FROM Candidates');

    // 4. Skills Analytics (Extract top skills)
    const candidates = await query('SELECT skills FROM Candidates');
    const skillsMap = {};
    candidates.forEach(c => {
      if (c.skills) {
        c.skills.split(',').forEach(skill => {
          const trimmed = skill.trim().toLowerCase();
          if (trimmed) {
            skillsMap[trimmed] = (skillsMap[trimmed] || 0) + 1;
          }
        });
      }
    });

    const topSkills = Object.entries(skillsMap)
      .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({
      statusCounts,
      locationCounts,
      experienceStats: {
        avgExperience: Math.round((expStats.avgExp || 0) * 10) / 10,
        minExperience: expStats.minExp || 0,
        maxExperience: expStats.maxExp || 0,
        totalCandidates: expStats.total || 0
      },
      topSkills
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// 6. ACTIVITY LOGS (Admin, IT Team)
// ==========================================

// GET /logs
app.get('/logs', authenticateToken, checkRole(['Admin', 'IT Team']), async (req, res) => {
  try {
    const logs = await query('SELECT * FROM ActivityLogs ORDER BY timestamp DESC LIMIT 100');
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// START SERVER
// ==========================================
const init = async () => {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`Backend Express server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database schema:', err);
    process.exit(1);
  }
};

init();
