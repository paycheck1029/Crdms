import mysql from 'mysql2/promise';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dbConfig from '../config/dbConfig.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, 'migrations');

const runMigrations = async () => {
  console.log('--- STARTING DATABASE MIGRATIONS ---');
  let connection = null;

  try {
    // 1. Create temporary connection without database selected to ensure DB exists
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await tempConnection.end();
    console.log(`Database "${dbConfig.database}" verified/created.`);

    // 2. Connect to the target database
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      multipleStatements: true // Essential for running full DDL scripts
    });

    // 3. Create schema_migrations table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Get executed migrations list
    const [executedRows] = await connection.query('SELECT name FROM schema_migrations');
    const executedMigrations = new Set(executedRows.map(row => row.name));

    // 5. Read local migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Run in alphabetical order

    let runCount = 0;

    for (const file of migrationFiles) {
      if (!executedMigrations.has(file)) {
        console.log(`Running migration: ${file}...`);
        const filePath = join(migrationsDir, file);
        const sqlContent = fs.readFileSync(filePath, 'utf-8');

        // Execute sql statements
        await connection.query(sqlContent);

        // Record execution
        await connection.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
        console.log(`✓ Migration ${file} executed successfully.`);
        runCount++;
      } else {
        console.log(`Migration ${file} already executed. Skipping.`);
      }
    }

    console.log(`--- MIGRATIONS COMPLETED. Total run: ${runCount} ---`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration execution failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

runMigrations();
