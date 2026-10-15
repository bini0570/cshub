import { Router } from 'express';
import { query } from '../db.js';
import { requireAdmin } from './auth.js';

const router = Router();

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
 * Fetch single content record by slug
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

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch content details' });
  }
});

/**
 * Track view count
 * POST /api/content/:id/view
 */
router.post('/:id/view', async (req, res) => {
  const { id } = req.params;
  try {
    await query(`UPDATE content SET view_count = view_count + 1 WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record view' });
  }
});

/**
 * Track download count
 * POST /api/content/:id/download
 */
router.post('/:id/download', async (req, res) => {
  const { id } = req.params;
  try {
    await query(`UPDATE content SET download_count = download_count + 1 WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record download' });
  }
});

/**
 * Create content (Admin only)
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

  const id = `content-${Date.now()}`;
  const genSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

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
        genSlug,
        title,
        description,
        content_type,
        body,
        category_id,
        req.user?.id || 'admin',
        author_name || 'Admin',
        JSON.stringify(tags || []),
        difficulty_level,
        academic_year,
        academic_subject,
        external_url,
        download_url,
        Boolean(is_featured),
        status,
      ]
    );

    // Record audit log
    await query(
      `INSERT INTO audit_logs (id, admin_name, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [`log-${Date.now()}`, req.user?.email || 'Admin', 'CONTENT_CREATE', 'content', id, JSON.stringify({ title, content_type })]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Content create error:', err);
    res.status(500).json({ error: 'Failed to create content' });
  }
});

/**
 * Update content (Admin only)
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
        title,
        slug,
        description,
        content_type,
        body,
        category_id,
        author_name,
        tags ? JSON.stringify(tags) : null,
        difficulty_level,
        academic_year,
        academic_subject,
        external_url,
        download_url,
        is_featured,
        status,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update content' });
  }
});

/**
 * Delete content (Admin only)
 * DELETE /api/content/:id
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await query(`DELETE FROM content WHERE id = $1`, [id]);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

/**
 * Send content document directly to student's Telegram chat
 * POST /api/content/:id/send-to-telegram
 */
router.post('/:id/send-to-telegram', async (req, res) => {
  const { id } = req.params;
  const { telegram_id } = req.body;
  const targetTelegramId = telegram_id || req.user?.telegram_id;

  if (!targetTelegramId) {
    return res.status(400).json({ error: 'telegram_id is required' });
  }

  try {
    const contentRes = await query(`SELECT * FROM content WHERE id = $1`, [id]);
    if (contentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }
    const item = contentRes.rows[0];
    const fileTarget = item.download_url || item.external_url || item.file_url;

    const { sendDocumentToUser } = await import('../bot.js');
    const success = await sendDocumentToUser(
      targetTelegramId,
      fileTarget || `https://cshub-student.vercel.app`,
      `📚 *${item.title}*\n${item.description || 'Study Material from CS Hub'}`
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

