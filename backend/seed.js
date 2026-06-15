import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { initDB, queryRun, queryGet } from './db.js';

const seed = async () => {
  try {
    // 1. Initialize schema
    await initDB();

    console.log('Seeding initial data...');

    // 2. Add system users
    const roles = [
      { username: 'admin', email: 'admin@crdms.com', password: 'adminpassword', role: 'Admin' },
      { username: 'recruiter', email: 'recruiter@crdms.com', password: 'recruiterpassword', role: 'Recruitment Team' },
      { username: 'manager', email: 'manager@crdms.com', password: 'managerpassword', role: 'Management' },
      { username: 'it_support', email: 'it@crdms.com', password: 'itpassword', role: 'IT Team' },
    ];

    for (const r of roles) {
      const exists = await queryGet('SELECT id FROM Users WHERE username = ?', [r.username]);
      if (!exists) {
        const passwordHash = await bcrypt.hash(r.password, 10);
        await queryRun(
          'INSERT INTO Users (username, password_hash, email, role) VALUES (?, ?, ?, ?)',
          [r.username, passwordHash, r.email, r.role]
        );
        console.log(`Created user: ${r.username} (${r.role}) - Password is ${r.password}`);
      } else {
        console.log(`User ${r.username} already exists, skipping.`);
      }
    }

    // 3. Add sample candidates
    const candidates = [
      {
        name: 'John Doe',
        email: 'john.doe@gmail.com',
        phone: '+1 (555) 019-2834',
        skills: 'React, JavaScript, CSS, HTML5, Webpack',
        location: 'New York',
        experience_years: 4.5,
        status: 'Applied',
        current_ctc: 95000,
        expected_ctc: 110000,
        notice_period_days: 30
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@yahoo.com',
        phone: '+1 (555) 014-9982',
        skills: 'Node.js, Express, SQLite, PostgreSQL, Redis, REST APIs',
        location: 'San Francisco',
        experience_years: 6.0,
        status: 'Interviewing',
        current_ctc: 130000,
        expected_ctc: 155000,
        notice_period_days: 60
      },
      {
        name: 'Vijay Kumar',
        email: 'vijay.k@techcorp.in',
        phone: '+91 98765 43210',
        skills: 'React, Node.js, AWS, MongoDB, Docker, TypeScript',
        location: 'Bangalore',
        experience_years: 3.2,
        status: 'Offered',
        current_ctc: 1500000,
        expected_ctc: 1800000,
        notice_period_days: 15
      },
      {
        name: 'Sarah Jenkins',
        email: 'sarah.j@outlook.com',
        phone: '+44 20 7946 0912',
        skills: 'Python, Django, AWS, CI/CD, PostgreSQL',
        location: 'London',
        experience_years: 7.5,
        status: 'Hired',
        current_ctc: 75000,
        expected_ctc: 85000,
        notice_period_days: 90
      },
      {
        name: 'Carlos Mendez',
        email: 'carlos.m@devs.net',
        phone: '+52 55 1234 5678',
        skills: 'Java, Spring Boot, MySQL, Kubernetes, Microservices',
        location: 'Austin',
        experience_years: 5.0,
        status: 'Screening',
        current_ctc: 115000,
        expected_ctc: 130000,
        notice_period_days: 0
      },
      {
        name: 'Emily Wong',
        email: 'emily.wong@consulting.org',
        phone: '+65 6789 0123',
        skills: 'Product Management, Agile, Scrum, Jira, Product Roadmap',
        location: 'Singapore',
        experience_years: 8.0,
        status: 'Offered',
        current_ctc: 140000,
        expected_ctc: 160000,
        notice_period_days: 45
      },
      {
        name: 'Liam Davies',
        email: 'liam.davies@recruit.co.uk',
        phone: '+44 1632 960012',
        skills: 'React Native, Flutter, Swift, Kotlin, iOS, Android',
        location: 'London',
        experience_years: 2.0,
        status: 'Rejected',
        current_ctc: 40000,
        expected_ctc: 50000,
        notice_period_days: 30
      }
    ];

    for (const c of candidates) {
      const exists = await queryGet('SELECT id FROM Candidates WHERE email = ?', [c.email]);
      if (!exists) {
        await queryRun(
          `INSERT INTO Candidates (name, email, phone, skills, location, experience_years, status, current_ctc, expected_ctc, notice_period_days)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [c.name, c.email, c.phone, c.skills, c.location, c.experience_years, c.status, c.current_ctc, c.expected_ctc, c.notice_period_days]
        );
        console.log(`Added candidate: ${c.name}`);
      } else {
        console.log(`Candidate ${c.email} already exists, skipping.`);
      }
    }

    // 4. Add initial activity logs
    const logs = await queryGet('SELECT count(*) as count FROM ActivityLogs');
    if (logs.count === 0) {
      await queryRun(
        `INSERT INTO ActivityLogs (user_id, username, action, details) VALUES (?, ?, ?, ?)`,
        [1, 'admin', 'Database Setup', 'Initialized SQLite database tables and populated default admin, recruiter, manager, and IT support accounts.']
      );
      console.log('Seeded database activity logs.');
    }

    console.log('Seeding finished successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seed();
