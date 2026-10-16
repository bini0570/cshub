import { Router } from 'express';
import { query } from '../db.js';
import { requireAdmin, requireSuperAdmin } from './auth.js';

const router = Router();

/**
 * List all users (Admin only)
 * GET /api/users
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, telegram_id, telegram_username, student_id, full_name, phone,
              department, academic_year, role, status, email, avatar_url, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * Update user role (Super Admin only - Problem 26 & 27)
 * PATCH /api/users/:id/role
 */
router.patch('/:id/role', requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['student', 'moderator', 'admin', 'super_admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid user role' });
  }

  // Prevent users from changing their own role
  if (req.user.id === id) {
    return res.status(400).json({ error: 'Cannot modify your own administrator role' });
  }

  try {
    // Check target user
    const targetUserRes = await query(`SELECT id, role, email FROM users WHERE id = $1`, [id]);
    if (targetUserRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentRole = targetUserRes.rows[0].role;

    // Enforce last super-admin protection rule (Problem 27)
    if (currentRole === 'super_admin' && role !== 'super_admin') {
      const superCountRes = await query(
        `SELECT COUNT(*) as count FROM users WHERE role = 'super_admin' AND id != $1`,
        [id]
      );
      const remainingSupers = parseInt(superCountRes.rows[0]?.count || '0', 10);
      if (remainingSupers < 1) {
        return res.status(400).json({ error: 'Cannot demote the last active super administrator' });
      }
    }

    const result = await query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, full_name, role, email`,
      [role, id]
    );

    // Record audit log (Problem 28)
    await query(
      `INSERT INTO audit_logs (id, admin_name, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        `log-${Date.now()}`,
        req.user.email || req.user.full_name || 'SuperAdmin',
        'USER_ROLE_CHANGE',
        'user',
        id,
        JSON.stringify({ previous_role: currentRole, new_role: role }),
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

/**
 * Update user account status (e.g. suspend or activate - Problem 44 & 45)
 * PATCH /api/users/:id/status
 */
router.patch('/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'suspended', 'banned'].includes(status)) {
    return res.status(400).json({ error: 'Invalid account status' });
  }

  if (req.user.id === id) {
    return res.status(400).json({ error: 'Cannot change your own account status' });
  }

  try {
    const result = await query(
      `UPDATE users SET status = $1 WHERE id = $2 RETURNING id, full_name, role, status, email`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Record audit log
    await query(
      `INSERT INTO audit_logs (id, admin_name, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        `log-${Date.now()}`,
        req.user.email || req.user.full_name || 'Admin',
        'USER_STATUS_CHANGE',
        'user',
        id,
        JSON.stringify({ status }),
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

export default router;
