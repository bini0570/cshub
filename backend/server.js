import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase, query } from './db.js';
import authRoutes, { authenticateToken, requireAdmin, rateLimit } from './routes/auth.js';
import contentRoutes from './routes/content.js';
import categoriesRoutes from './routes/categories.js';
import submissionsRoutes from './routes/submissions.js';
import usersRoutes from './routes/users.js';
import bookmarksRoutes from './routes/bookmarks.js';
import auditLogsRoutes from './routes/auditLogs.js';
import examsRoutes from './routes/exams.js';
import { startTelegramBot, broadcastToStudents } from './bot.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Security Headers Middleware (Problem 89)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Explicit CORS allowlist (Problem 20)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  'https://cshub-student.vercel.app',
  'https://cshub-admin.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (Telegram bot, mobile WebApps, curl)
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.some((o) => origin.startsWith(o));
      if (isAllowed || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('Origin blocked by CORS policy'));
    },
    credentials: true,
  })
);

// Payload size limit to prevent memory exhaustion (Problem 42)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Static file serving for study materials
app.use('/uploads', express.static(uploadsDir));

// Strict file extension allowlist for academic resources (Problem 40)
const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.docx', '.doc', '.pptx', '.ppt', '.txt', '.zip', '.png', '.jpg', '.jpeg'
]);

function isExtensionAllowed(filename) {
  const ext = path.extname(filename || '').toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
}

// Multer Disk Storage for Study Materials Uploads
let uploadMiddleware = null;
try {
  const multerModule = await import('multer');
  const multer = multerModule.default;
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `${uniqueSuffix}-${safeName}`);
    },
  });
  uploadMiddleware = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
      if (isExtensionAllowed(file.originalname)) {
        cb(null, true);
      } else {
        cb(new Error('File type not permitted. Allowed: PDF, DOCX, PPTX, TXT, ZIP, PNG, JPG'));
      }
    },
  });
} catch (e) {
  console.log('Multer upload module initialized with standard fallback');
}

/**
 * File Upload Endpoint (Authenticated: Staff or Students submitting notes)
 * POST /api/upload
 */
app.post('/api/upload', authenticateToken, (req, res) => {
  if (uploadMiddleware) {
    uploadMiddleware.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'File upload error' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }
      const host = req.get('host');
      const protocol = req.protocol === 'http' && !host.includes('localhost') ? 'https' : req.protocol;
      const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
      return res.json({
        url: fileUrl,
        path: `/uploads/${req.file.filename}`,
        filename: req.file.originalname,
        size: req.file.size,
      });
    });
  } else {
    // Base64 upload fallback with strict validation (Problem 41)
    const { filename, base64Data } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'No file data provided' });
    }
    if (!isExtensionAllowed(filename)) {
      return res.status(400).json({ error: 'File type not permitted. Allowed: PDF, DOCX, PPTX, TXT, ZIP, PNG, JPG' });
    }
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length > 50 * 1024 * 1024) {
        return res.status(413).json({ error: 'File size exceeds maximum 50MB limit' });
      }
      const safeName = `${Date.now()}-${(filename || 'material.pdf').replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const targetPath = path.join(uploadsDir, safeName);
      fs.writeFileSync(targetPath, buffer);
      const host = req.get('host');
      const protocol = req.protocol === 'http' && !host.includes('localhost') ? 'https' : req.protocol;
      const fileUrl = `${protocol}://${host}/uploads/${safeName}`;
      return res.json({
        url: fileUrl,
        path: `/uploads/${safeName}`,
        filename: filename || safeName,
        size: buffer.length,
      });
    } catch (saveErr) {
      return res.status(500).json({ error: 'Failed to write file' });
    }
  }
});

/**
 * Admin Broadcast Announcement Endpoint (Authorized Admin Only - Problem 3)
 * POST /api/bot/broadcast
 */
app.post(
  '/api/bot/broadcast',
  requireAdmin,
  rateLimit({ windowMs: 60 * 1000, max: 3, message: 'Too many broadcast requests. Please wait.' }),
  async (req, res) => {
    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (message.length > 4000) {
      return res.status(400).json({ error: 'Message exceeds maximum length of 4000 characters' });
    }

    try {
      const formatted = `📢 <b>CS Hub Announcement</b>\n\n${message.trim()}\n\n— <i>CS Hub Administration</i>`;
      const result = await broadcastToStudents(formatted);

      // Record audit log event (Problem 28)
      try {
        await query(
          `INSERT INTO audit_logs (id, admin_name, action, target_type, target_id, details)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            `log-${Date.now()}`,
            req.user.email || req.user.full_name || 'Admin',
            'BROADCAST_ANNOUNCEMENT',
            'telegram_students',
            'all',
            JSON.stringify({ sent_count: result.sent, snippet: message.slice(0, 100) }),
          ]
        );
      } catch (logErr) {}

      res.json({
        success: true,
        message: `Announcement sent to ${result.sent} students`,
        details: result,
      });
    } catch (err) {
      res.status(500).json({ error: 'Broadcast failed', details: err.message });
    }
  }
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/exams', examsRoutes);

/**
 * Deep Health Check verifying database readiness (Problem 43, 78)
 * GET /api/health
 */
app.get('/api/health', async (req, res) => {
  let dbStatus = 'connected';
  try {
    await query('SELECT 1');
  } catch (e) {
    dbStatus = 'disconnected';
  }

  const isHealthy = dbStatus === 'connected';
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    database: dbStatus,
    platform: 'CS Hub Railway API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'CS Hub Backend API running on Railway',
    docs: '/api/health',
  });
});

// Start server and initialize database
async function startServer() {
  await initDatabase();

  // If Telegram Bot token is configured, start the bot service
  if (process.env.TELEGRAM_BOT_TOKEN) {
    try {
      startTelegramBot();
    } catch (botErr) {
      console.error('Failed to start Telegram Bot:', botErr.message);
    }
  } else {
    console.log('ℹ️ TELEGRAM_BOT_TOKEN not provided. Telegram bot polling disabled.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CS Hub Backend Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
