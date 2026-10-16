import { Router } from 'express';
import { query } from '../db.js';
import { authenticateToken, requireAdmin, rateLimit } from './auth.js';

const router = Router();

// Helper to generate a collision-free slug
function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Fetch published content with filtering
 * GET /api/content
 */
router.get('/', async (req, res) => {
  const { type, categorySlug, search, isFeatured, limit } = req.query;

  try {
    let sql = `
      SELECT c.*, cat.name as category_name, cat.slug as category_slug
      FROM content c
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.status = 'published' AND c.visibility = 'public'
    `;
    const params = [];

    if (type) {
      params.push(type);
      sql += ` AND c.content_type = $${params.length}`;
    }

    if (categorySlug) {
      params.push(categorySlug);
      sql += ` AND cat.slug = $${params.length}`;
    }

    if (isFeatured !== undefined) {
      params.push(isFeatured === 'true');
      sql += ` AND c.is_featured = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase().trim()}%`);
      sql += ` AND (LOWER(c.title) LIKE $${params.length} OR LOWER(c.description) LIKE $${params.length})`;
    }

    sql += ` ORDER BY c.published_at DESC`;

    if (limit) {
      params.push(parseInt(limit, 10));
      sql += ` LIMIT $${params.length}`;
    }

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching content:', err);
    res.status(500).json({ error: 'Failed to fetch content list' });
  }
});

/**
 * Fetch single content record by slug (Problem 19: drafts only accessible to staff)
 * GET /api/content/:slug
 */
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
    const result = await query(
      `SELECT c.*, cat.name as category_name, cat.slug as category_slug
       FROM content c
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE c.slug = $1`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const item = result.rows[0];

    // If item is not public/published, verify staff authorization
    if (item.status !== 'published' || item.visibility !== 'public') {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) {
        return res.status(404).json({ error: 'Content not found' });
      }
      try {
        const { JWT_SECRET } = await import('./auth.js');
        const jwt = (await import('jsonwebtoken')).default;
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!['admin', 'super_admin', 'moderator'].includes(decoded.role)) {
          return res.status(404).json({ error: 'Content not found' });
        }
      } catch (tokenErr) {
        return res.status(404).json({ error: 'Content not found' });
      }
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch content details' });
  }
});

/**
 * Track view count (Problem 21: only published content, with rate-limiting)
 * POST /api/content/:id/view
 */
router.post('/:id/view', rateLimit({ windowMs: 60 * 1000, max: 20, message: 'Too many view pings' }), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      `UPDATE content SET view_count = view_count + 1 WHERE id = $1 AND status = 'published' RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found or not published' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record view' });
  }
});

/**
 * Track download count (Problem 22: only published content, with rate-limiting)
 * POST /api/content/:id/download
 */
router.post('/:id/download', rateLimit({ windowMs: 60 * 1000, max: 20, message: 'Too many download pings' }), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      `UPDATE content SET download_count = download_count + 1 WHERE id = $1 AND status = 'published' RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found or not published' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record download' });
  }
});

/**
 * Create content (Admin only - Problem 24, 25, 28)
 * POST /api/content
 */
router.post('/', requireAdmin, async (req, res) => {
  const {
    title,
    slug,
    description,
    content_type,
    body,
    category_id,
    author_name,
    tags,
    difficulty_level,
    academic_year,
    academic_subject,
    external_url,
    download_url,
    is_featured,
    status = 'published',
  } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  if (!content_type) {
    return res.status(400).json({ error: 'Content type is required' });
  }

  const id = `content-${Date.now()}`;
  let baseSlug = slugify(slug || title);
  if (!baseSlug) baseSlug = `item-${Date.now()}`;

  // Collision-resistant slug resolution (Problem 25)
  let finalSlug = baseSlug;
  const existing = await query(`SELECT id FROM content WHERE slug = $1`, [finalSlug]);
  if (existing.rows.length > 0) {
    finalSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
  }

  try {
    const result = await query(
      `INSERT INTO content (
        id, slug, title, description, content_type, body, category_id,
        author_id, author_name, tags, difficulty_level, academic_year,
        academic_subject, external_url, download_url, is_featured, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        id,
        finalSlug,
        title.trim(),
        description || '',
        content_type,
        body || '',
        category_id || null,
        req.user?.id || 'admin',
        author_name || req.user?.full_name || 'Admin',
        JSON.stringify(tags || []),
        difficulty_level || null,
        academic_year ? Number(academic_year) : null,
        academic_subject || null,
        external_url || null,
        download_url || null,
        Boolean(is_featured),
        status,
      ]
    );

    // Record audit log (Problem 28)
    await query(
      `INSERT INTO audit_logs (id, admin_name, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [`log-${Date.now()}`, req.user?.email || 'Admin', 'CONTENT_CREATE', 'content', id, JSON.stringify({ title, finalSlug })]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Content create error:', err);
    res.status(500).json({ error: 'Failed to create content' });
  }
});

/**
 * Update content (Admin only - Problem 28)
 * PUT /api/content/:id
 */
router.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    title,
    slug,
    description,
    content_type,
    body,
    category_id,
    author_name,
    tags,
    difficulty_level,
    academic_year,
    academic_subject,
    external_url,
    download_url,
    is_featured,
    status,
  } = req.body;

  try {
    const result = await query(
      `UPDATE content SET
        title = COALESCE($1, title),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        content_type = COALESCE($4, content_type),
        body = COALESCE($5, body),
        category_id = COALESCE($6, category_id),
        author_name = COALESCE($7, author_name),
        tags = COALESCE($8, tags),
        difficulty_level = COALESCE($9, difficulty_level),
        academic_year = COALESCE($10, academic_year),
        academic_subject = COALESCE($11, academic_subject),
        external_url = COALESCE($12, external_url),
        download_url = COALESCE($13, download_url),
        is_featured = COALESCE($14, is_featured),
        status = COALESCE($15, status),
        updated_at = NOW()
      WHERE id = $16
      RETURNING *`,
      [
        title ? title.trim() : null,
        slug ? slugify(slug) : null,
        description,
        content_type,
        body,
        category_id,
        author_name,
        tags ? JSON.stringify(tags) : null,
        difficulty_level,
        academic_year ? Number(academic_year) : null,
        academic_subject,
        external_url,
        download_url,
        is_featured !== undefined ? Boolean(is_featured) : null,
        status,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Record audit log
    await query(
      `INSERT INTO audit_logs (id, admin_name, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [`log-${Date.now()}`, req.user?.email || 'Admin', 'CONTENT_UPDATE', 'content', id, JSON.stringify({ id, title })]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update content' });
  }
});

/**
 * Delete content (Admin only - Problem 28 & 29)
 * DELETE /api/content/:id
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(`DELETE FROM content WHERE id = $1 RETURNING id, title`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Record audit log
    await query(
      `INSERT INTO audit_logs (id, admin_name, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [`log-${Date.now()}`, req.user?.email || 'Admin', 'CONTENT_DELETE', 'content', id, JSON.stringify(result.rows[0])]
    );

    res.json({ success: true, message: 'Content deleted successfully' });
  } catch (err) {
    console.error('Delete content error:', err);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

/**
 * Send content document directly to student's Telegram chat (Problem 5 & 23: Authorized student or admin only)
 * POST /api/content/:id/send-to-telegram
 */
router.post('/:id/send-to-telegram', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { telegram_id } = req.body;

  // Student can only request documents for their own telegram ID; admins may dispatch to others
  const isStaff = ['admin', 'super_admin', 'moderator'].includes(req.user.role);
  const targetTelegramId = isStaff ? (telegram_id || req.user.telegram_id) : req.user.telegram_id;

  if (!targetTelegramId) {
    return res.status(400).json({ error: 'No Telegram ID associated with this account' });
  }

  try {
    const contentRes = await query(
      `SELECT * FROM content WHERE id = $1 AND status = 'published' AND visibility = 'public'`,
      [id]
    );
    if (contentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Published study material not found' });
    }
    const item = contentRes.rows[0];
    const fileTarget = item.download_url || item.external_url || item.file_url;

    const { sendDocumentToUser } = await import('../bot.js');
    const success = await sendDocumentToUser(
      targetTelegramId,
      fileTarget || `https://cshub-student.vercel.app`,
      `📚 <b>${item.title}</b>\n${item.description || 'Study Material from CS Hub'}`
    );

    if (success) {
      res.json({ success: true, message: 'Document sent to your Telegram chat' });
    } else {
      res.status(500).json({ error: 'Failed to dispatch document to Telegram' });
    }
  } catch (err) {
    console.error('Send to telegram error:', err);
    res.status(500).json({ error: 'Failed to send document to Telegram' });
  }
});

export default router;
