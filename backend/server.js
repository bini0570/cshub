import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db.js';
import authRoutes from './routes/auth.js';
import contentRoutes from './routes/content.js';
import categoriesRoutes from './routes/categories.js';
import submissionsRoutes from './routes/submissions.js';
import usersRoutes from './routes/users.js';
import bookmarksRoutes from './routes/bookmarks.js';
import auditLogsRoutes from './routes/auditLogs.js';
import { startTelegramBot } from './bot.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allows Vercel deployments and local development
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/audit-logs', auditLogsRoutes);

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
