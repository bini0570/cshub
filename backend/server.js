import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';
import authRoutes from './routes/auth.js';
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

// Middleware
app.use(
  cors({
    origin: '*', // Allows Vercel deployments and local development
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploaded study materials
app.use('/uploads', express.static(uploadsDir));

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
  });
} catch (e) {
  console.log('Multer upload module initialized with standard fallback');
}

// File Upload Endpoint
app.post('/api/upload', (req, res) => {
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
    // Base64 upload fallback
    const { filename, base64Data } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'No file data provided' });
    }
    try {
      const buffer = Buffer.from(base64Data, 'base64');
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

// Admin Broadcast Announcement Endpoint
app.post('/api/bot/broadcast', async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  try {
    const formatted = `📢 **CS Hub Announcement**\n\n${message.trim()}\n\n— *CS Hub Administration*`;
    const result = await broadcastToStudents(formatted);
    res.json({
      success: true,
      message: `Announcement sent to ${result.sent} students`,
      details: result,
    });
  } catch (err) {
    res.status(500).json({ error: 'Broadcast failed', details: err.message });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/exams', examsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
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
