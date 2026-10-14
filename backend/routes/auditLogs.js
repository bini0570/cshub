import { Router } from 'express';
import { query } from '../db.js';
import { requireAdmin } from './auth.js';

const router = Router();

/**
 * Fetch audit logs (Admin only)
 * GET /api/audit-logs
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
