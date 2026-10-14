import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
  ssl: connectionString && !connectionString.includes('localhost') && !connectionString.includes('.railway.internal')
    ? { rejectUnauthorized: false }
    : (connectionString && !connectionString.includes('localhost') ? { rejectUnauthorized: false } : false),
});

/**
 * Execute a query with error logging
 */
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error('Database query error:', { text, error: err.message });
    throw err;
  }
}

/**
 * Auto-migrate and create tables if they do not exist
 */
export async function initDatabase() {
  if (!connectionString) {
    console.warn('⚠️ DATABASE_URL is not set. Database operations will fail until configured.');
    return;
  }

  console.log('🔄 Initializing database tables...');

  const migrationSql = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      telegram_id BIGINT UNIQUE,
      telegram_username VARCHAR(100),
      student_id VARCHAR(50),
      full_name VARCHAR(150),
      department VARCHAR(100),
      academic_year INT,
      role VARCHAR(30) DEFAULT 'student',
      email VARCHAR(150) UNIQUE,
      password_hash VARCHAR(255),
      avatar_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Telegram Auth Codes (One-time login codes)
    CREATE TABLE IF NOT EXISTS telegram_auth_codes (
      code VARCHAR(10) PRIMARY KEY,
      telegram_id BIGINT NOT NULL,
      user_id VARCHAR(64) NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      used BOOLEAN DEFAULT FALSE
    );

    -- Categories table
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(64) PRIMARY KEY,
      slug VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      icon VARCHAR(50),
      color VARCHAR(50),
      display_order INT DEFAULT 0
    );

    -- Content table (Resources, Articles, Tools, Opportunities)
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

    -- Submissions table (Student content peer-review queue)
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

    -- Bookmarks table
    CREATE TABLE IF NOT EXISTS bookmarks (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      content_id VARCHAR(64) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE (user_id, content_id)
    );

    -- Audit Logs table
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      admin_name VARCHAR(150),
      action VARCHAR(100),
      target_type VARCHAR(50),
      target_id VARCHAR(64),
      details JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  try {
    await pool.query(migrationSql);
    console.log('✅ Database schema verified.');
    await seedDefaultData();
  } catch (err) {
    console.error('❌ Error running database migration:', err.message);
  }
}

/**
 * Seed initial categories and default admin if not existing
 */
async function seedDefaultData() {
  const catCheck = await pool.query('SELECT COUNT(*) FROM categories');
  if (parseInt(catCheck.rows[0].count, 10) === 0) {
    console.log('🌱 Seeding initial categories...');
    const categories = [
      ['cat-core', 'core-cs', 'Core Computer Science', 'Algorithms, Data Structures, Operating Systems, & Architecture', 'BookOpen', 'indigo', 1],
      ['cat-web', 'web-development', 'Web & Cloud Systems', 'Modern Full-Stack, REST APIs, Microservices, and DevOps', 'Code', 'teal', 2],
      ['cat-ai', 'ai-machine-learning', 'AI & Machine Learning', 'Neural networks, computer vision, NLP, and model deployment', 'Sparkles', 'purple', 3],
      ['cat-sec', 'cybersecurity', 'Cybersecurity & Systems', 'Ethical hacking, network protocols, cryptography, and defense', 'Shield', 'rose', 4],
      ['cat-cheatsheets', 'cheatsheets', 'Exam Cheatsheets & Reference', 'High-density revision summaries for finals and midterm exams', 'FileText', 'amber', 5],
      ['cat-tools', 'dev-tools', 'Developer Tools & CLI', 'Production IDE configs, Git workflows, Docker compose templates', 'Wrench', 'cyan', 6],
    ];

    for (const [id, slug, name, desc, icon, color, order] of categories) {
      await pool.query(
        `INSERT INTO categories (id, slug, name, description, icon, color, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
        [id, slug, name, desc, icon, color, order]
      );
    }
  }

  // Seed default admin user if not present
  const adminCheck = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'admin' OR role = 'super_admin'");
  if (parseInt(adminCheck.rows[0].count, 10) === 0) {
    console.log('🌱 Seeding default administrator account...');
    await pool.query(`
      INSERT INTO users (id, student_id, full_name, role, email, password_hash)
      VALUES (
        'admin-primary',
        'ADMIN-001',
        'CS Hub Administrator',
        'super_admin',
        'admin@cshub.edu',
        '$2a$10$wKxN74jB4J5n8fP75dG7sOBvLwD9UqTshj2PjI1Pj5kE4w4lZ7Zje' -- bcrypt for 'Admin@123'
      ) ON CONFLICT (id) DO NOTHING
    `);
  }
}
