import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10),
  user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'crdms',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: 0
};

export default dbConfig;
