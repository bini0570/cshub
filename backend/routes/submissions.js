import { Router } from 'express';
import { query } from '../db.js';
import { authenticateToken, requireAdmin } from './auth.js';

const router = Router();

/**
 * Fetch submissions
 * GET /api/submissions
 */
router.get('/', authenticateToken, async (req, res) => {
  const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'moderator';

  try {
    let result;
    if (isAdmin) {
      result = await query(`
        SELECT s.*, cat.name as category_name
        FROM submissions s
        LEFT JOIN categories cat ON s.category_id = cat.id
        ORDER BY s.created_at DESC
      `);
    } else {
      result = await query(`
        SELECT s.*, cat.name as category_name
        FROM submissions s
        LEFT JOIN categories cat ON s.category_id = cat.id
        WHERE s.submitter_id = $1
        ORDER BY s.created_at DESC
      `, [req.user.id]);
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

/**
 * Create submission
 * POST /api/submissions
 */
router.post('/', authenticateToken, async (req, res) => {
  const { title, content_type, description, category_id, external_url, file_url } = req.body;
  if (!title || !content_type) {
    return res.status(400).json({ error: 'Title and content type are required' });
  }

  const id = `sub-${Date.now()}`;
  try {
    const result = await query(
      `INSERT INTO submissions (
        id, submitter_id, submitter_name, submitter_telegram,
        title, content_type, description, category_id, external_url, file_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
      RETURNING *`,
      [
        id,
        req.user.id,
        req.user.full_name || req.user.email || 'Student',
        req.user.telegram_username || null,
        title,
        content_type,
        description,
        category_id,
        external_url,
        file_url,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

/**
 * Review submission (Admin only)
 * PATCH /api/submissions/:id/review
 */
router.patch('/:id/review', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, review_note, publish } = req.body;

  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid review status' });
  }

  try {
    const result = await query(
      `UPDATE submissions SET
        status = $1,
        review_note = $2,
        reviewer_id = $3,
        reviewed_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, review_note || '', req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submission = result.rows[0];

    // If approved and publish flag is true, create content entry
    if (status === 'approved' && publish) {
      const slug = submission.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);
      await query(
        `INSERT INTO content (
          id, slug, title, description, content_type, category_id,
          author_id, author_name, external_url, download_url, status, visibility
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'published', 'public')`,
        [
          `content-${Date.now()}`,
          slug,
          submission.title,
          submission.description,
          submission.content_type,
          submission.category_id,
          submission.submitter_id,
          submission.submitter_name,
          submission.external_url,
          submission.file_url,
        ]
      );
    }

    // Add audit log
    await query(
      `INSERT INTO audit_logs (id, admin_name, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        `log-${Date.now()}`,
        req.user.email || req.user.full_name || 'Admin',
        `SUBMISSION_${status.toUpperCase()}`,
        'submission',
        id,
        JSON.stringify({ status, review_note, publish }),
      ]
    );

    // Notify student via Telegram Bot if available
    try {
      if (submission.submitter_id) {
        const userRes = await query('SELECT telegram_id FROM users WHERE id = $1', [submission.submitter_id]);
        if (userRes.rows.length > 0 && userRes.rows[0].telegram_id) {
          const { notifyStudent } = await import('../bot.js');
          if (status === 'approved') {
            await notifyStudent(
              userRes.rows[0].telegram_id,
              `🎉 **Great news!** Your study material submission *"${submission.title}"* has been approved and published to CS Hub!`
            );
          } else if (status === 'rejected') {
            await notifyStudent(
              userRes.rows[0].telegram_id,
              `ℹ️ Your submission *"${submission.title}"* was reviewed. Note: ${review_note || 'Please check requirements.'}`
            );
          }
        }
      }
    } catch (botErr) {
      console.warn('Could not notify student via bot:', botErr.message);
    }

    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: 'Failed to review submission' });
  }
});

export default router;
