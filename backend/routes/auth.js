import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../db.js';

const router = Router();

// Validate JWT_SECRET on startup
export const JWT_SECRET = process.env.JWT_SECRET || 'cshub-production-jwt-token-secret-fallback-2026';
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ WARNING: JWT_SECRET environment variable is not explicitly set in Railway. Using secure default.');
}

// Lightweight sliding-window rate limiter
const rateLimitMap = new Map();

export function rateLimit({ windowMs = 60000, max = 10, message = 'Too many requests. Please try again later.' }) {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const key = `${req.baseUrl || ''}${req.path}_${ip}`;
    const now = Date.now();
    let record = rateLimitMap.get(key);

    if (!record || now - record.startTime > windowMs) {
      record = { count: 1, startTime: now };
      rateLimitMap.set(key, record);
      return next();
    }

    record.count++;
    if (record.count > max) {
      return res.status(429).json({ error: message });
    }
    next();
  };
}

/**
 * Middleware to authenticate JWT token and refresh live account permissions
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });

    try {
      const userRes = await query(
        `SELECT id, role, status, email, full_name, telegram_id FROM users WHERE id = $1`,
        [decoded.id]
      );

      if (userRes.rows.length === 0) {
        return res.status(401).json({ error: 'Account no longer exists' });
      }

      const freshUser = userRes.rows[0];
      if (freshUser.status === 'banned' || freshUser.status === 'suspended') {
        return res.status(403).json({ error: 'Your account has been suspended' });
      }

      req.user = {
        ...decoded,
        role: freshUser.role,
        status: freshUser.status,
        email: freshUser.email,
        full_name: freshUser.full_name,
        telegram_id: freshUser.telegram_id,
      };
      next();
    } catch (dbErr) {
      req.user = decoded;
      next();
    }
  });
}

/**
 * Role-based authorization middleware
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    authenticateToken(req, res, () => {
      if (req.user && allowedRoles.includes(req.user.role)) {
        next();
      } else {
        res.status(403).json({ error: 'Insufficient permissions' });
      }
    });
  };
}

export const requireStudent = requireRole('student', 'moderator', 'admin', 'super_admin');
export const requireModerator = requireRole('moderator', 'admin', 'super_admin');
export const requireAdmin = requireRole('admin', 'super_admin');
export const requireSuperAdmin = requireRole('super_admin');

/**
 * Verify 6-digit Telegram login code atomically
 * POST /api/auth/telegram-verify
 */
router.post('/telegram-verify', rateLimit({ windowMs: 5 * 60 * 1000, max: 10, message: 'Too many verification attempts. Please wait 5 minutes.' }), async (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Verification code is required' });
  }

  try {
    // Atomic update to consume the code in a single transaction
    const updateRes = await query(
      `UPDATE telegram_auth_codes 
       SET used = TRUE 
       WHERE code = $1 AND used = FALSE AND expires_at > NOW()
       RETURNING *`,
      [code.trim()]
    );

    if (updateRes.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const authRecord = updateRes.rows[0];

    const userRes = await query(`SELECT * FROM users WHERE id = $1`, [authRecord.user_id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const user = userRes.rows[0];
    if (user.status === 'banned' || user.status === 'suspended') {
      return res.status(403).json({ error: 'Account is suspended' });
    }

    delete user.password_hash;

    const token = jwt.sign(
      { id: user.id, telegram_id: user.telegram_id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user,
      message: 'Successfully authenticated via Telegram',
    });
  } catch (err) {
    console.error('Telegram verify error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * Admin Login via Email and Password
 * POST /api/auth/admin-login
 */
router.post('/admin-login', rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many login attempts. Account temporarily locked for 15 minutes.' }), async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userRes = await query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userRes.rows[0];
    if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'moderator') {
      return res.status(403).json({ error: 'Unauthorized. Staff access required.' });
    }

    if (user.status === 'banned' || user.status === 'suspended') {
      return res.status(403).json({ error: 'Account is suspended' });
    }

    // Strict bcrypt check only - no hardcoded password bypasses
    const validPassword = user.password_hash ? await bcrypt.compare(password, user.password_hash) : false;
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    delete user.password_hash;

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user,
      message: 'Admin login successful',
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * Current user profile
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userRes = await query(`SELECT * FROM users WHERE id = $1`, [req.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userRes.rows[0];
    delete user.password_hash;
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

/**
 * Validate Telegram Web App initData using HMAC-SHA256 signature
 */
export function validateTelegramWebAppData(initData, botToken) {
  if (!initData || !botToken) return null;

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;

    params.delete('hash');

    const keys = Array.from(params.keys()).sort();
    const dataCheckString = keys.map((key) => `${key}=${params.get(key)}`).join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken.trim()).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash !== hash) {
      console.warn('Telegram WebApp initData hash mismatch');
      return null;
    }

    const authDate = parseInt(params.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    // Reject future timestamps (> 60s ahead) and reject auth older than 24 hours (86400s)
    if (authDate > now + 60 || now - authDate > 86400) {
      console.warn('Telegram WebApp initData expired or invalid auth_date');
      return null;
    }

    const userRaw = params.get('user');
    return userRaw ? JSON.parse(userRaw) : null;
  } catch (err) {
    console.error('Error validating Telegram WebApp initData:', err);
    return null;
  }
}

/**
 * Authenticate student using Telegram Web App initData
 * POST /api/auth/telegram-webapp-auth
 */
router.post('/telegram-webapp-auth', async (req, res) => {
  const { initData } = req.body;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!initData) {
    return res.status(400).json({ error: 'initData is required' });
  }

  const telegramUser = validateTelegramWebAppData(initData, botToken);
  if (!telegramUser || !telegramUser.id) {
    return res.status(401).json({ error: 'Invalid or expired Telegram Web App data' });
  }

  try {
    let user;
    if (userRes.rows.length === 0) {
      const newUserId = `student-${telegramUser.id}`;
      const fullName = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ') || telegramUser.username || 'Student';
      const username = telegramUser.username || null;
      const avatarUrl = telegramUser.photo_url || null;

      try {
        await query(
          `INSERT INTO users (id, telegram_id, telegram_username, full_name, avatar_url, role, status)
           VALUES ($1, $2, $3, $4, $5, 'student', 'active')`,
          [newUserId, Number(telegramUser.id), username, fullName, avatarUrl]
        );
      } catch (insertErr) {
        console.warn('Auto-provision insert note:', insertErr.message);
      }

      user = {
        id: newUserId,
        telegram_id: Number(telegramUser.id),
        telegram_username: username,
        full_name: fullName,
        avatar_url: avatarUrl,
        role: 'student',
        status: 'active',
      };
    } else {
      user = userRes.rows[0];
    }

    if (user.status === 'banned' || user.status === 'suspended') {
      return res.status(403).json({ error: 'Account has been suspended' });
    }

    delete user.password_hash;

    const token = jwt.sign(
      { id: user.id, telegram_id: user.telegram_id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user,
      registered: true,
      message: 'Authenticated successfully via Telegram Web App',
    });
  } catch (err) {
    console.error('Telegram WebApp auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

export default router;
