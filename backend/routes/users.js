import { Router } from 'express';
import { query } from '../db.js';
import { requireAdmin } from './auth.js';

const router = Router();

/**
 * List all users (Admin only)
 * GET /api/users
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, telegram_id, telegram_username, student_id, full_name, phone,
              department, academic_year, role, email, avatar_url, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * Update user role (Admin only)
 * PATCH /api/users/:id/role
 */
router.patch('/:id/role', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['student', 'moderator', 'admin', 'super_admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid user role' });
  }

  try {
    const result = await query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, full_name, role, email`,
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add audit log
    await query(
      `INSERT INTO audit_logs (id, admin_name, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        `log-${Date.now()}`,
        req.user.email || 'Admin',
        'USER_ROLE_CHANGE',
        'user',
        id,
        JSON.stringify({ new_role: role }),
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

export default router;
