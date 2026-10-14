import { Router } from 'express';
import { query } from '../db.js';
import { requireAdmin } from './auth.js';

const router = Router();

/**
 * Fetch all categories
 * GET /api/categories
 */
router.get('/', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM categories ORDER BY display_order ASC, name ASC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * Create a new category (Admin only)
 * POST /api/categories
 */
router.post('/', requireAdmin, async (req, res) => {
  const { name, slug, description, icon, color, display_order = 0 } = req.body;
  if (!name || !slug) {
    return res.status(400).json({ error: 'Name and slug are required' });
  }

  const id = `cat-${slug}`;
  try {
    const result = await query(
      `INSERT INTO categories (id, slug, name, description, icon, color, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, slug, name, description, icon, color, display_order]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

export default router;
