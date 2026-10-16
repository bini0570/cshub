import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data', 'cshub_store.json');

const { Pool } = pg;

const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

let isPostgresAvailable = false;
let pool = null;

// Initial seed categories
const DEFAULT_CATEGORIES = [
  { id: 'cat-core', slug: 'core-cs', name: 'Core Computer Science', description: 'Algorithms, Data Structures, Operating Systems, & Architecture', icon: 'BookOpen', color: 'indigo', display_order: 1 },
  { id: 'cat-web', slug: 'web-development', name: 'Web & Cloud Systems', description: 'Modern Full-Stack, REST APIs, Microservices, and DevOps', icon: 'Code', color: 'teal', display_order: 2 },
  { id: 'cat-ai', slug: 'ai-machine-learning', name: 'AI & Machine Learning', description: 'Neural networks, computer vision, NLP, and model deployment', icon: 'Sparkles', color: 'purple', display_order: 3 },
  { id: 'cat-sec', slug: 'cybersecurity', name: 'Cybersecurity & Systems', description: 'Ethical hacking, network protocols, cryptography, and defense', icon: 'Shield', color: 'rose', display_order: 4 },
  { id: 'cat-cheatsheets', slug: 'cheatsheets', name: 'Exam Cheatsheets & Reference', description: 'High-density revision summaries for finals and midterm exams', icon: 'FileText', color: 'amber', display_order: 5 },
  { id: 'cat-tools', slug: 'dev-tools', name: 'Developer Tools & CLI', description: 'Production IDE configs, Git workflows, Docker compose templates', icon: 'Wrench', color: 'cyan', display_order: 6 },
];

// Secure admin password setup (Problem 1)
const adminPasswordHash = process.env.ADMIN_PASSWORD
  ? bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12)
  : '$2a$12$K8yR2u/d27P4G38D5fV8Ue4iZg6kH8jL0mN2pQ4rS6tU8vW0xY2a6';

const DEFAULT_ADMIN = {
  id: 'admin-primary',
  student_id: 'ADMIN-001',
  full_name: 'CS Hub Administrator',
  role: 'super_admin',
  status: 'active',
  email: process.env.ADMIN_EMAIL || 'admin@cshub.edu',
  password_hash: adminPasswordHash,
  created_at: new Date().toISOString(),
};

// ==============================================================================
// LOCAL JSON STORE (Development Fallback Only - Problem 33, 34, 35)
// ==============================================================================
function getLocalStore() {
  try {
    if (!fs.existsSync(path.dirname(DATA_FILE))) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading local data store:', err.message);
  }

  const initial = {
    users: [DEFAULT_ADMIN],
    telegram_auth_codes: [],
    categories: DEFAULT_CATEGORIES,
    content: [],
    submissions: [],
    bookmarks: [],
    audit_logs: [],
    exam_attempts: [],
  };
  saveLocalStore(initial);
  return initial;
}

function saveLocalStore(data) {
  try {
    if (!fs.existsSync(path.dirname(DATA_FILE))) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving local data store:', err.message);
  }
}

// ==============================================================================
// DATABASE INITIALIZATION (Resilient PostgreSQL with Local Fallback)
// ==============================================================================
export async function initDatabase() {
  if (connectionString) {
    try {
      console.log('🔄 Attempting PostgreSQL connection...');
      const isInternal = connectionString.includes('railway.internal') || connectionString.includes('localhost');
      pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 5000,
        ssl: isInternal ? false : { rejectUnauthorized: false },
      });

      const testRes = await pool.query('SELECT NOW()');
      if (testRes.rows.length > 0) {
        console.log('✅ PostgreSQL connected successfully at', testRes.rows[0].now);
        isPostgresAvailable = true;
        await runPostgresMigrations();
        return;
      }
    } catch (pgErr) {
      console.warn(`⚠️ PostgreSQL connection failed: ${pgErr.message}`);
      isPostgresAvailable = false;
    }
  } else {
    console.warn('ℹ️ No external PostgreSQL DATABASE_URL detected.');
  }

  // Graceful fallback to local persistent storage so Railway container never crashes
  console.log('📦 Using persistent local JSON storage fallback.');
  getLocalStore();
  console.log('✅ Local persistent data store active & ready.');
}

async function runPostgresMigrations() {
  const migrationSql = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      telegram_id BIGINT UNIQUE,
      telegram_username VARCHAR(100),
      student_id VARCHAR(50),
      full_name VARCHAR(150),
      phone VARCHAR(50),
      department VARCHAR(100),
      academic_year INT,
      role VARCHAR(30) DEFAULT 'student',
      status VARCHAR(30) DEFAULT 'active',
      email VARCHAR(150) UNIQUE,
      password_hash VARCHAR(255),
      avatar_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id BIGINT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(100);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(150);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'active';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'student';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS academic_year INT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id VARCHAR(50);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

    CREATE TABLE IF NOT EXISTS telegram_auth_codes (
      code VARCHAR(10) PRIMARY KEY,
      telegram_id BIGINT NOT NULL,
      user_id VARCHAR(64) NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      used BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(64) PRIMARY KEY,
      slug VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      icon VARCHAR(50),
      color VARCHAR(50),
      display_order INT DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS content (
      id VARCHAR(64) PRIMARY KEY,
      slug VARCHAR(150) UNIQUE NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      content_type VARCHAR(50) NOT NULL,
      body TEXT,
      category_id VARCHAR(64),
      author_id VARCHAR(64),
      author_name VARCHAR(100),
      tags JSONB DEFAULT '[]',
      difficulty_level VARCHAR(30),
      academic_year INT,
      academic_subject VARCHAR(100),
      external_url TEXT,
      download_url TEXT,
      status VARCHAR(30) DEFAULT 'published',
      visibility VARCHAR(30) DEFAULT 'public',
      is_featured BOOLEAN DEFAULT FALSE,
      view_count INT DEFAULT 0,
      download_count INT DEFAULT 0,
      published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id VARCHAR(64) PRIMARY KEY,
      submitter_id VARCHAR(64) NOT NULL,
      submitter_name VARCHAR(150),
      submitter_telegram VARCHAR(100),
      title VARCHAR(255) NOT NULL,
      content_type VARCHAR(50) NOT NULL,
      description TEXT,
      category_id VARCHAR(64),
      external_url TEXT,
      file_url TEXT,
      status VARCHAR(30) DEFAULT 'pending',
      review_note TEXT,
      reviewer_id VARCHAR(64),
      reviewed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      content_id VARCHAR(64) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE (user_id, content_id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      admin_name VARCHAR(150),
      action VARCHAR(100),
      target_type VARCHAR(50),
      target_id VARCHAR(64),
      details JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS exam_attempts (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      student_name VARCHAR(150),
      course_name VARCHAR(100) NOT NULL,
      total_questions INT NOT NULL,
      score INT NOT NULL,
      percentage NUMERIC(5, 2) NOT NULL,
      time_taken_seconds INT NOT NULL,
      answers_breakdown JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await pool.query(migrationSql);
  console.log('✅ PostgreSQL schema verified.');

  // Seed categories
  for (const c of DEFAULT_CATEGORIES) {
    await pool.query(
      `INSERT INTO categories (id, slug, name, description, icon, color, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
      [c.id, c.slug, c.name, c.description, c.icon, c.color, c.display_order]
    );
  }

  // Seed initial admin if none exists (Problem 1)
  const existingAdmin = await pool.query(`SELECT id FROM users WHERE role = 'super_admin' LIMIT 1`);
  if (existingAdmin.rows.length === 0) {
    await pool.query(
      `INSERT INTO users (id, student_id, full_name, role, status, email, password_hash)
       VALUES ($1, $2, $3, $4, 'active', $5, $6) ON CONFLICT (id) DO NOTHING`,
      [DEFAULT_ADMIN.id, DEFAULT_ADMIN.student_id, DEFAULT_ADMIN.full_name, DEFAULT_ADMIN.role, DEFAULT_ADMIN.email, DEFAULT_ADMIN.password_hash]
    );
    console.log('ℹ️ Initial super administrator account provisioned.');
  }
}

// ==============================================================================
// RESILIENT QUERY DISPATCHER (Postgres -> Local Store Fallback)
// ==============================================================================
export async function query(text, params = []) {
  if (isPostgresAvailable && pool) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_LOCAL_FALLBACK) {
        throw err;
      }
      console.warn('Postgres query failed, falling back to local store:', err.message);
    }
  }

  // --- Local Fallback Query Handler ---
  const store = getLocalStore();
  const trimmed = text.trim();

  // 1. SELECT * FROM users WHERE telegram_id = $1
  if (trimmed.includes('FROM users WHERE telegram_id = $1')) {
    const tid = Number(params[0]);
    const found = (store.users || []).filter((u) => Number(u.telegram_id) === tid);
    return { rows: found };
  }

  // 1b. SELECT id, telegram_id FROM users WHERE phone = $1
  if (trimmed.includes('FROM users WHERE phone = $1')) {
    const phone = String(params[0] || '').trim();
    const excludeTid = params[1] ? Number(params[1]) : null;
    const found = (store.users || []).filter((u) => u.phone === phone && (!excludeTid || Number(u.telegram_id) !== excludeTid));
    return { rows: found };
  }

  // 1c. UPDATE users ... WHERE telegram_id = $X
  if (trimmed.startsWith('UPDATE users') && trimmed.includes('WHERE telegram_id =')) {
    const tid = Number(params[params.length - 1]);
    let updatedUser = null;
    store.users = (store.users || []).map((u) => {
      if (Number(u.telegram_id) === tid) {
        updatedUser = {
          ...u,
          full_name: params[0] || u.full_name,
          telegram_username: params[1] !== undefined ? params[1] : u.telegram_username,
          phone: params[2] !== undefined ? params[2] : u.phone,
          status: 'active',
        };
        return updatedUser;
      }
      return u;
    });
    saveLocalStore(store);
    return { rows: updatedUser ? [updatedUser] : [] };
  }

  // 2. INSERT INTO users
  if (trimmed.startsWith('INSERT INTO users')) {
    const [id, telegram_id, telegram_username, full_name, phone_or_avatar, role] = params;
    const isAvatar = phone_or_avatar && (phone_or_avatar.startsWith('http') || phone_or_avatar.startsWith('/'));
    const existingIndex = (store.users || []).findIndex((u) => Number(u.telegram_id) === Number(telegram_id));
    const userRecord = {
      id: id || `user-${Date.now()}`,
      telegram_id: Number(telegram_id),
      telegram_username: telegram_username || null,
      full_name: full_name || 'Student',
      phone: !isAvatar ? (phone_or_avatar || null) : null,
      avatar_url: isAvatar ? phone_or_avatar : null,
      role: role || 'student',
      status: 'active',
      created_at: new Date().toISOString(),
    };
    if (existingIndex >= 0) {
      store.users[existingIndex] = { ...store.users[existingIndex], ...userRecord };
    } else {
      store.users.push(userRecord);
    }
    saveLocalStore(store);
    return { rows: [userRecord] };
  }

  // 3. SELECT * FROM telegram_auth_codes WHERE code = $1
  if (trimmed.includes('FROM telegram_auth_codes') && trimmed.includes('code = $1')) {
    const code = String(params[0]).trim();
    const now = new Date();
    const found = store.telegram_auth_codes.filter(
      (c) => c.code === code && !c.used && new Date(c.expires_at) > now
    );
    return { rows: found };
  }

  // 4. UPDATE telegram_auth_codes SET used = TRUE (Atomic check - Problem 9)
  if (trimmed.includes('UPDATE telegram_auth_codes SET used = TRUE')) {
    const code = String(params[0]).trim();
    const now = new Date();
    let updatedRecord = null;
    store.telegram_auth_codes = store.telegram_auth_codes.map((c) => {
      if (c.code === code && !c.used && new Date(c.expires_at) > now) {
        updatedRecord = { ...c, used: true };
        return updatedRecord;
      }
      return c;
    });
    saveLocalStore(store);
    return { rows: updatedRecord ? [updatedRecord] : [] };
  }

  // 5. INSERT INTO telegram_auth_codes
  if (trimmed.startsWith('INSERT INTO telegram_auth_codes')) {
    const [code, telegram_id, user_id, expires_at] = params;
    const authCode = {
      code: String(code),
      telegram_id: Number(telegram_id),
      user_id: String(user_id),
      expires_at: expires_at instanceof Date ? expires_at.toISOString() : String(expires_at),
      used: false,
    };
    store.telegram_auth_codes.push(authCode);
    saveLocalStore(store);
    return { rows: [authCode] };
  }

  // 6. SELECT * FROM users WHERE email = $1
  if (trimmed.includes('FROM users WHERE email = $1')) {
    const email = String(params[0]).toLowerCase();
    const found = store.users.filter((u) => u.email && u.email.toLowerCase() === email);
    return { rows: found };
  }

  // 7. SELECT * FROM users WHERE id = $1
  if (trimmed.includes('FROM users WHERE id = $1')) {
    const id = String(params[0]);
    const found = store.users.filter((u) => u.id === id);
    return { rows: found };
  }

  // 8. UPDATE users SET role = $1
  if (trimmed.includes('UPDATE users SET role = $1')) {
    const [role, id] = params;
    let updatedUser = null;
    store.users = store.users.map((u) => {
      if (u.id === id) {
        updatedUser = { ...u, role };
        return updatedUser;
      }
      return u;
    });
    saveLocalStore(store);
    return { rows: updatedUser ? [updatedUser] : [] };
  }

  // 9. UPDATE users SET status = $1
  if (trimmed.includes('UPDATE users SET status = $1')) {
    const [status, id] = params;
    let updatedUser = null;
    store.users = store.users.map((u) => {
      if (u.id === id) {
        updatedUser = { ...u, status };
        return updatedUser;
      }
      return u;
    });
    saveLocalStore(store);
    return { rows: updatedUser ? [updatedUser] : [] };
  }

  // 10. COUNT super_admin
  if (trimmed.includes("role = 'super_admin'")) {
    const excludeId = params[0];
    const supers = (store.users || []).filter((u) => u.role === 'super_admin' && u.id !== excludeId);
    return { rows: [{ count: supers.length }] };
  }

  // 11. SELECT * FROM categories
  if (trimmed.includes('FROM categories')) {
    return { rows: store.categories || DEFAULT_CATEGORIES };
  }

  // 12. SELECT * FROM content
  if (trimmed.includes('FROM content')) {
    let list = store.content || [];
    if (params.length > 0 && trimmed.includes('c.slug = $1')) {
      list = list.filter((c) => c.slug === params[0]);
    }
    return { rows: list };
  }

  // 13. DELETE FROM content WHERE id = $1
  if (trimmed.startsWith('DELETE FROM content WHERE id = $1')) {
    const id = params[0];
    const deletedItem = (store.content || []).find((c) => c.id === id);
    store.content = (store.content || []).filter((c) => c.id !== id);
    saveLocalStore(store);
    return { rows: deletedItem ? [deletedItem] : [] };
  }

  // 14. SELECT * FROM submissions
  if (trimmed.includes('FROM submissions')) {
    let list = store.submissions || [];
    if (trimmed.includes('submitter_id = $1')) {
      list = list.filter((s) => s.submitter_id === params[0]);
    }
    if (trimmed.includes('WHERE id = $1')) {
      list = list.filter((s) => s.id === params[0]);
    }
    return { rows: list };
  }

  // 15. INSERT INTO submissions
  if (trimmed.startsWith('INSERT INTO submissions')) {
    const [id, submitter_id, submitter_name, submitter_telegram, title, content_type, description, category_id, external_url, file_url] = params;
    const newSub = {
      id: id || `sub-${Date.now()}`,
      submitter_id,
      submitter_name,
      submitter_telegram,
      title,
      content_type,
      description,
      category_id,
      external_url,
      file_url,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    store.submissions.push(newSub);
    saveLocalStore(store);
    return { rows: [newSub] };
  }

  // 16. UPDATE submissions SET
  if (trimmed.startsWith('UPDATE submissions SET')) {
    const [status, review_note, reviewer_id, id] = params;
    let updatedSub = null;
    store.submissions = (store.submissions || []).map((s) => {
      if (s.id === id) {
        updatedSub = { ...s, status, review_note, reviewer_id, reviewed_at: new Date().toISOString() };
        return updatedSub;
      }
      return s;
    });
    saveLocalStore(store);
    return { rows: updatedSub ? [updatedSub] : [] };
  }

  // 17. SELECT * FROM users
  if (trimmed.includes('FROM users')) {
    return { rows: store.users || [] };
  }

  // 18. SELECT * FROM audit_logs
  if (trimmed.includes('FROM audit_logs')) {
    return { rows: store.audit_logs || [] };
  }

  // 19. INSERT INTO audit_logs
  if (trimmed.startsWith('INSERT INTO audit_logs')) {
    const [id, admin_name, action, target_type, target_id, details] = params;
    const logItem = {
      id: id || `log-${Date.now()}`,
      admin_name,
      action,
      target_type,
      target_id,
      details,
      created_at: new Date().toISOString(),
    };
    store.audit_logs = store.audit_logs || [];
    store.audit_logs.push(logItem);
    saveLocalStore(store);
    return { rows: [logItem] };
  }

  // 20. INSERT INTO exam_attempts
  if (trimmed.toLowerCase().startsWith('insert into exam_attempts')) {
    const [id, user_id, student_name, course_name, total_questions, score, percentage, time_taken_seconds, answers_breakdown] = params;
    const attempt = {
      id: id || `attempt-${Date.now()}`,
      user_id,
      student_name: student_name || 'Student',
      course_name,
      total_questions: Number(total_questions),
      score: Number(score),
      percentage: Number(percentage),
      time_taken_seconds: Number(time_taken_seconds),
      answers_breakdown: typeof answers_breakdown === 'string' ? JSON.parse(answers_breakdown) : (answers_breakdown || {}),
      created_at: new Date().toISOString(),
    };
    store.exam_attempts = store.exam_attempts || [];
    store.exam_attempts.push(attempt);
    saveLocalStore(store);
    return { rows: [attempt] };
  }

  // 21. SELECT ... FROM exam_attempts
  if (trimmed.toLowerCase().includes('from exam_attempts')) {
    let list = store.exam_attempts || [];
    if (trimmed.includes('LOWER(course_name) = LOWER($1)')) {
      const cName = String(params[0]).toLowerCase();
      list = list.filter((a) => a.course_name.toLowerCase() === cName);
      list.sort((a, b) => b.score - a.score || a.time_taken_seconds - b.time_taken_seconds);
      return { rows: list.slice(0, 10) };
    }
    if (trimmed.includes('user_id = $1')) {
      const uId = String(params[0]);
      list = list.filter((a) => a.user_id === uId);
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { rows: list.slice(0, 25) };
    }
    return { rows: list };
  }

  return { rows: [] };
}
