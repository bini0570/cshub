import { Router } from 'express';
import { query } from '../db.js';
import { authenticateToken } from './auth.js';

const router = Router();

/**
 * Get user bookmarks
 * GET /api/bookmarks
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, cat.name as category_name, cat.slug as category_slug
       FROM bookmarks b
       JOIN content c ON b.content_id = c.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

/**
 * Toggle bookmark
 * POST /api/bookmarks/toggle
 * Body: { content_id: '...' }
 */
router.post('/toggle', authenticateToken, async (req, res) => {
  const { content_id } = req.body;
  if (!content_id) {
    return res.status(400).json({ error: 'content_id is required' });
  }

  try {
    const existing = await query(
      `SELECT id FROM bookmarks WHERE user_id = $1 AND content_id = $2`,
      [req.user.id, content_id]
    );

    if (existing.rows.length > 0) {
      await query(`DELETE FROM bookmarks WHERE id = $1`, [existing.rows[0].id]);
      res.json({ bookmarked: false });
    } else {
      const id = `bm-${Date.now()}`;
      await query(
        `INSERT INTO bookmarks (id, user_id, content_id) VALUES ($1, $2, $3)`,
        [id, req.user.id, content_id]
      );
      res.json({ bookmarked: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
});

export default router;
