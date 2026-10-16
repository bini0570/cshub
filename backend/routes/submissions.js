import { Router } from 'express';
import { query } from '../db.js';
import { authenticateToken, requireModerator, rateLimit } from './auth.js';

const router = Router();

function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Fetch submissions
 * GET /api/submissions
 */
router.get('/', authenticateToken, async (req, res) => {
  const isStaff = ['admin', 'super_admin', 'moderator'].includes(req.user.role);

  try {
    let result;
    if (isStaff) {
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
 * Create submission (Student: rate limited, validated - Problem 56, 57, 58)
 * POST /api/submissions
 */
router.post(
  '/',
  authenticateToken,
  rateLimit({ windowMs: 10 * 60 * 1000, max: 6, message: 'Submission limit reached. Please wait 10 minutes.' }),
  async (req, res) => {
    const { title, content_type, description, category_id, external_url, file_url } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({ error: 'A valid title of at least 3 characters is required' });
    }

    if (!content_type) {
      return res.status(400).json({ error: 'Content type is required' });
    }

    // URL validation (Problem 57)
    const validUrlPrefix = (u) => !u || u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/uploads/');
    if (!validUrlPrefix(external_url) || !validUrlPrefix(file_url)) {
      return res.status(400).json({ error: 'Invalid URL format' });
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
          title.trim(),
          content_type,
          description || '',
          category_id || null,
          external_url || null,
          file_url || null,
        ]
      );

      const submission = result.rows[0];

      // Alert admins on Telegram using safe formatting (Problem 51)
      try {
        const adminRes = await query(`SELECT telegram_id FROM users WHERE role IN ('admin', 'super_admin') AND telegram_id IS NOT NULL`);
        if (adminRes.rows.length > 0) {
          const { notifyStudent } = await import('../bot.js');
          const studentName = (req.user.full_name || req.user.email || 'Student').replace(/[<>&]/g, '');
          const safeTitle = title.trim().replace(/[<>&]/g, '');
          for (const aRow of adminRes.rows) {
            if (aRow.telegram_id) {
              await notifyStudent(
                aRow.telegram_id,
                `📥 <b>New Study Note Submitted for Review!</b>\n\n` +
                `• <b>Title:</b> ${safeTitle}\n` +
                `• <b>Student:</b> ${studentName}\n` +
                `• <b>Subject:</b> ${category_id || 'General CS'}\n\n` +
                `Open the Admin Console to review and approve.`
              ).catch(() => {});
            }
          }
        }
      } catch (botErr) {
        console.warn('Admin submission alert warning:', botErr.message);
      }

      res.status(201).json(submission);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create submission' });
    }
  }
);

/**
 * Review submission (Staff / Moderator - Problem 13, 30, 32, 53, 54, 55, 59)
 * PATCH /api/submissions/:id/review
 */
router.patch('/:id/review', requireModerator, async (req, res) => {
  const { id } = req.params;
  const { status, review_note, publish } = req.body;

  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid review status. Must be approved, rejected, or pending.' });
  }

  try {
    // 1. Fetch current submission state
    const currentSubRes = await query(`SELECT * FROM submissions WHERE id = $1`, [id]);
    if (currentSubRes.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    const currentSub = currentSubRes.rows[0];

    // Idempotent guard: if already approved, do not publish duplicate content (Problem 53)
    const alreadyApproved = currentSub.status === 'approved';

    // 2. Update submission record
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

    const submission = result.rows[0];

    // 3. If approved, publish is true, and NOT already published, create content entry
    if (status === 'approved' && publish && !alreadyApproved) {
      let slug = slugify(submission.title) + '-' + Date.now().toString().slice(-4);
      await query(
        `INSERT INTO content (
          id, slug, title, description, content_type, category_id,
          author_id, author_name, external_url, download_url, status, visibility
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'published', 'public')`,
        [
          `content-${Date.now()}`,
          slug,
          submission.title,
          submission.description || '',
          submission.content_type || 'notes',
          submission.category_id || null,
          submission.submitter_id,
          submission.submitter_name || 'Student Contributor',
          submission.external_url || null,
          submission.file_url || null,
        ]
      );
    }

    // 4. Record audit log (Problem 28)
    await query(
      `INSERT INTO audit_logs (id, admin_name, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        `log-${Date.now()}`,
        req.user.email || req.user.full_name || 'Staff',
        `SUBMISSION_${status.toUpperCase()}`,
        'submission',
        id,
        JSON.stringify({ status, review_note, publish, was_already_approved: alreadyApproved }),
      ]
    );

    // 5. Notify student via Telegram Bot if available (Safe HTML escaping - Problem 51)
    if (!alreadyApproved && submission.submitter_id) {
      try {
        const userRes = await query('SELECT telegram_id FROM users WHERE id = $1', [submission.submitter_id]);
        if (userRes.rows.length > 0 && userRes.rows[0].telegram_id) {
          const { notifyStudent } = await import('../bot.js');
          const safeTitle = submission.title.replace(/[<>&]/g, '');

          if (status === 'approved') {
            await notifyStudent(
              userRes.rows[0].telegram_id,
              `🎉 <b>Great news!</b> Your study material submission <i>"${safeTitle}"</i> has been approved and published to CS Hub!`
            );

            // Channel auto-post if TELEGRAM_CHANNEL_ID is set
            try {
              const channelId = process.env.TELEGRAM_CHANNEL_ID;
              if (channelId) {
                const { getBotInstance } = await import('../bot.js');
                const b = getBotInstance();
                if (b) {
                  await b.sendMessage(
                    channelId,
                    `📚 <b>New Study Material Published to CS Hub!</b>\n\n` +
                    `📖 <b>${safeTitle}</b>\n` +
                    `👤 Contributed by: ${submission.submitter_name || 'Student'}\n\n` +
                    `Open the CS Hub Mini App to access the resource:`,
                    {
                      parse_mode: 'HTML',
                      reply_markup: {
                        inline_keyboard: [
                          [
                            {
                              text: '🚀 Open Student Web App',
                              web_app: { url: process.env.FRONTEND_URL || 'https://cshub-student.vercel.app' },
                            },
                          ],
                        ],
                      },
                    }
                  );
                }
              }
            } catch (chanErr) {
              console.warn('Channel post warning:', chanErr.message);
            }
          } else if (status === 'rejected') {
            const safeNote = (review_note || 'Please check requirements.').replace(/[<>&]/g, '');
            await notifyStudent(
              userRes.rows[0].telegram_id,
              `ℹ️ Your submission <i>"${safeTitle}"</i> was reviewed.\nFeedback: ${safeNote}`
            );
          }
        }
      } catch (botErr) {
        console.warn('Could not notify student via bot:', botErr.message);
      }
    }

    res.json(submission);
  } catch (err) {
    console.error('Review submission error:', err);
    res.status(500).json({ error: 'Failed to review submission' });
  }
});

export default router;
