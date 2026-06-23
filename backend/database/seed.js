import bcrypt from 'bcryptjs';
import { queryRun, queryGet } from './connection.js';
import { seedUsers, seedCandidates } from './seeders/seed_data.js';

const runSeeder = async () => {
  console.log('--- STARTING DATABASE SEEDING ---');

  try {
    // 1. Seed Users
    console.log('Seeding system user roles...');
    for (const user of seedUsers) {
      const exists = await queryGet('SELECT id FROM Users WHERE username = ?', [user.username]);
      if (!exists) {
        const passwordHash = await bcrypt.hash(user.password, 10);
        const result = await queryRun(
          'INSERT INTO Users (username, password_hash, email, role, email_verified) VALUES (?, ?, ?, ?, TRUE)',
          [user.username, passwordHash, user.email, user.role]
        );
        console.log(`✓ Created User: ${user.username} (${user.role}) - ID: ${result.id}`);
      } else {
        console.log(`User "${user.username}" already exists. Skipping.`);
      }
    }

    // 2. Seed Candidates
    console.log('Seeding candidate talent pool...');
    for (const c of seedCandidates) {
      const exists = await queryGet('SELECT id FROM Candidates WHERE email = ?', [c.email]);
      if (!exists) {
        const result = await queryRun(
          `INSERT INTO Candidates 
           (name, email, phone, skills, location, experience_years, status, current_ctc, expected_ctc, notice_period_days, linkedin_url, company, preferred_location, remarks, comment)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            c.name, c.email, c.phone, c.skills, c.location, c.experience_years, c.status,
            c.current_ctc, c.expected_ctc, c.notice_period_days, c.linkedin_url, c.company,
            c.preferred_location, c.remarks, c.comment
          ]
        );
        console.log(`✓ Created Candidate: ${c.name} - ID: ${result.id}`);

        // Seed initial timeline entries for candidates
        await queryRun(
          'INSERT INTO CandidateTimeline (candidate_id, event, details, performed_by) VALUES (?, ?, ?, ?)',
          [result.id, 'Created', 'Candidate profile initially created/imported.', 1]
        );
        
        if (c.status !== 'Applied') {
          await queryRun(
            'INSERT INTO CandidateTimeline (candidate_id, event, details, performed_by) VALUES (?, ?, ?, ?)',
            [result.id, c.status === 'Rejected' ? 'Rejected' : (c.status === 'Hired' ? 'Hired' : 'Updated'), `Candidate status updated to '${c.status}'.`, 1]
          );
        }
      } else {
        console.log(`Candidate "${c.email}" already exists. Skipping.`);
      }
    }

    // 3. Seed initial activity logs
    const logsCount = await queryGet('SELECT COUNT(*) as count FROM ActivityLogs');
    if (logsCount.count === 0) {
      await queryRun(
        `INSERT INTO ActivityLogs (user_id, username, action, details, ip_address, browser, os) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [1, 'admin', 'Database Setup', 'System database setup populated default credentials and candidate pool.', '127.0.0.1', 'Node-Seeder', 'Server']
      );
      console.log('✓ Seeded database initial activity logs.');
    }

    console.log('--- DATABASE SEEDING COMPLETED SUCCESSFULLY ---');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder execution failed:', error.message);
    process.exit(1);
  }
};

runSeeder();
