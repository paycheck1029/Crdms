import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';

// Middleware & Configs
import requestLogger from './middleware/requestLogger.js';
import errorHandler from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import swaggerSpec from './config/swagger.js';
import { getPool } from './database/connection.js';
import { logApp, logError } from './services/loggerService.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import candidateRoutes from './routes/candidateRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import logRoutes from './routes/logRoutes.js';

// Health Check Utility
import os from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadDir = process.env.UPLOAD_DIR || join(__dirname, 'uploads');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// SECURITY & UTILITY MIDDLEWARES (Phase 8 & 9)
// ==========================================
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow loading local uploads in browser
}));

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'https://crdms-production.netlify.app']; // Fallbacks

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true
}));

app.use(compression()); // Payload Compression
app.use(express.json()); // JSON parser

// Request Access Logging
app.use(requestLogger);

// Serve uploads folder static files
app.use('/uploads', express.static(uploadDir));

// ==========================================
// PUBLIC & HEALTH CHECK ENDPOINTS
// ==========================================

// Health Check API (Phase 13)
app.get('/health', async (req, res) => {
  const start = Date.now();
  let dbStatus = 'UP';
  let dbError = null;

  try {
    const pool = getPool();
    await pool.query('SELECT 1');
  } catch (err) {
    dbStatus = 'DOWN';
    dbError = err.message;
  }

  const responseTime = Date.now() - start;

  res.status(dbStatus === 'UP' ? 200 : 503).json({
    status: dbStatus === 'UP' ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTimeMs: responseTime,
    db: {
      status: dbStatus,
      error: dbError
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      cpuCores: os.cpus().length,
      freeMemoryBytes: os.freemem(),
      totalMemoryBytes: os.totalmem(),
      loadAverage: os.loadavg()
    }
  });
});

// Swagger Interactive API Docs (Phase 12)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Redirect root to api docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// ==========================================
// ROUTING REGISTRATION (Phase 3)
// ==========================================
app.use('/auth', authRoutes);
app.use('/users', apiLimiter, userRoutes);
app.use('/candidates', apiLimiter, candidateRoutes);
app.use('/uploads', apiLimiter, uploadRoutes);
app.use('/reports', apiLimiter, reportRoutes);
app.use('/logs', apiLimiter, logRoutes);

// Catch 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Centralized Exception Error Handler (Phase 11)
app.use(errorHandler);

// ==========================================
// START SERVER
// ==========================================
const init = async () => {
  try {
    // Initialise DB pool connection
    const pool = getPool();
    await pool.query('SELECT 1');
    logApp('Connected to MySQL Database Pool successfully.');

    app.listen(PORT, () => {
      logApp(`Backend Express server is running on port ${PORT}`);
      logApp(`API Documentation available at: http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    logError(new Error(`Failed to bootstrap Express server: ${err.message}`));
    process.exit(1);
  }
};

init();
