import { Router } from 'express';
import { query } from '../db.js';
import { requireAdmin } from './auth.js';

const router = Router();

/**
 * Fetch all courses
 * GET /api/courses
 */
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM courses ORDER BY academic_year ASC, semester ASC, code ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

/**
 * Create a new course (Admin only)
 * POST /api/courses
 */
router.post('/', requireAdmin, async (req, res) => {
  const { code, name, academic_year = '3rd Year', semester = 'Semester I', description = '', status = 'Published' } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: 'Course code and name are required' });
  }

  const id = `c-${Date.now()}`;
  try {
    const result = await query(
      `INSERT INTO courses (id, code, name, academic_year, semester, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, code.trim().toUpperCase(), name.trim(), academic_year, semester, description, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create course' });
  }
});

/**
 * Update an existing course (Admin only)
 * PUT /api/courses/:id
 */
router.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { code, name, academic_year, semester, description, status } = req.body;

  try {
    const result = await query(
      `UPDATE courses
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           academic_year = COALESCE($3, academic_year),
           semester = COALESCE($4, semester),
           description = COALESCE($5, description),
           status = COALESCE($6, status),
           updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [code ? code.trim().toUpperCase() : null, name ? name.trim() : null, academic_year, semester, description, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update course' });
  }
});

/**
 * Delete a course (Admin only)
 * DELETE /api/courses/:id
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(`DELETE FROM courses WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

export default router;
