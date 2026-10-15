import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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

const DEFAULT_ADMIN = {
  id: 'admin-primary',
  student_id: 'ADMIN-001',
  full_name: 'CS Hub Administrator',
  role: 'super_admin',
  email: 'admin@cshub.edu',
  password_hash: '$2a$10$wKxN74jB4J5n8fP75dG7sOBvLwD9UqTshj2PjI1Pj5kE4w4lZ7Zje', // Admin@123
  created_at: new Date().toISOString(),
};

// ==============================================================================
// LOCAL JSON STORE (Fallback when Postgres is unreachable or on Railway Trial)
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
// DATABASE INITIALIZATION
// ==============================================================================
export async function initDatabase() {
  if (connectionString && !connectionString.includes('postgres.railway.internal')) {
    try {
      console.log('🔄 Attempting PostgreSQL connection...');
      pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 5000,
        ssl: !connectionString.includes('localhost') ? { rejectUnauthorized: false } : false,
      });

      const testRes = await pool.query('SELECT NOW()');
      if (testRes.rows.length > 0) {
        console.log('✅ PostgreSQL connected successfully at', testRes.rows[0].now);
        isPostgresAvailable = true;
        await runPostgresMigrations();
        return;
      }
    } catch (pgErr) {
      console.warn(`⚠️ PostgreSQL connection failed (${pgErr.message}). Switching to persistent local storage fallback.`);
      isPostgresAvailable = false;
    }
  } else {
    console.log('ℹ️ No external PostgreSQL URL detected (or internal DNS unresolvable). Using built-in persistent storage.');
  }

  // Ensure local store is initialized
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
      email VARCHAR(150) UNIQUE,
      password_hash VARCHAR(255),
      avatar_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

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

  // Seed default admin
  await pool.query(
    `INSERT INTO users (id, student_id, full_name, role, email, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
    [DEFAULT_ADMIN.id, DEFAULT_ADMIN.student_id, DEFAULT_ADMIN.full_name, DEFAULT_ADMIN.role, DEFAULT_ADMIN.email, DEFAULT_ADMIN.password_hash]
  );
}

// ==============================================================================
// RESILIENT QUERY DISPATCHER (Postgres -> Local Store Fallback)
// ==============================================================================
export async function query(text, params = []) {
  if (isPostgresAvailable && pool) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.warn('Postgres query failed, falling back to local store:', err.message);
    }
  }

  // --- Local Fallback Query Handler ---
  const store = getLocalStore();
  const trimmed = text.trim();

  // 1. SELECT * FROM users WHERE telegram_id = $1
  if (trimmed.toLowerCase().includes('from users where telegram_id = $1')) {
    const tId = Number(params[0]);
    const found = store.users.filter((u) => Number(u.telegram_id) === tId);
    return { rows: found };
  }

  // 2. INSERT INTO users ... ON CONFLICT (telegram_id)
  if (trimmed.toLowerCase().startsWith('insert into users')) {
    const tId = Number(params[1]);
    const existingIndex = store.users.findIndex((u) => Number(u.telegram_id) === tId);
    let userRecord = existingIndex >= 0 ? { ...store.users[existingIndex] } : {
      id: params[0] || `student-${tId}`,
      telegram_id: tId,
      role: 'student',
      created_at: new Date().toISOString(),
    };

    if (trimmed.includes('phone') && params.length >= 5) {
      // (id, telegram_id, telegram_username, full_name, phone, role)
      userRecord.telegram_username = params[2] || userRecord.telegram_username || null;
      userRecord.full_name = params[3] || userRecord.full_name || '';
      userRecord.phone = params[4] || userRecord.phone || '';
      if (params[5]) userRecord.role = params[5];
    } else if (params.length === 4) {
      // (id, telegram_id, telegram_username, full_name, role)
      userRecord.telegram_username = params[2] || userRecord.telegram_username || null;
      userRecord.full_name = params[3] || userRecord.full_name || '';
      userRecord.role = 'student';
    } else {
      userRecord.telegram_username = params[2] || userRecord.telegram_username || null;
      userRecord.student_id = params[3] || userRecord.student_id || '';
      userRecord.full_name = params[4] || userRecord.full_name || '';
      userRecord.department = params[5] || userRecord.department || '';
      userRecord.academic_year = Number(params[6]) || userRecord.academic_year || 1;
      if (params[7]) userRecord.role = params[7];
    }

    if (existingIndex >= 0) {
      store.users[existingIndex] = userRecord;
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

  // 4. UPDATE telegram_auth_codes SET used = TRUE
  if (trimmed.includes('UPDATE telegram_auth_codes SET used = TRUE')) {
    const codeOrTid = params[0];
    store.telegram_auth_codes = store.telegram_auth_codes.map((c) => {
      if (c.code === String(codeOrTid) || Number(c.telegram_id) === Number(codeOrTid)) {
        return { ...c, used: true };
      }
      return c;
    });
    saveLocalStore(store);
    return { rows: [] };
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

  // 8. SELECT * FROM categories
  if (trimmed.includes('FROM categories')) {
    return { rows: store.categories || DEFAULT_CATEGORIES };
  }

  // 9. SELECT * FROM content
  if (trimmed.includes('FROM content')) {
    let list = store.content || [];
    if (params.length > 0 && trimmed.includes('c.slug = $1')) {
      list = list.filter((c) => c.slug === params[0]);
    }
    return { rows: list };
  }

  // 10. SELECT * FROM submissions
  if (trimmed.includes('FROM submissions')) {
    let list = store.submissions || [];
    if (params.length > 0 && trimmed.includes('submitter_id = $1')) {
      list = list.filter((s) => s.submitter_id === params[0]);
    }
    return { rows: list };
  }

  // 11. INSERT INTO submissions
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

  // 12. SELECT * FROM users
  if (trimmed.includes('FROM users')) {
    return { rows: store.users || [] };
  }

  // 13. SELECT * FROM audit_logs
  if (trimmed.includes('FROM audit_logs')) {
    return { rows: store.audit_logs || [] };
  }

  // 14. INSERT INTO exam_attempts
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

  // 15. SELECT ... FROM exam_attempts
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
      return { rows: list.slice(0, 20) };
    }
    return { rows: list };
  }

  // Default fallback empty result
  return { rows: [] };
}
