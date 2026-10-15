import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cshub-railway-secret-key-change-in-production';

// Helper to extract authenticated user if token is present
function extractUser(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (e) {
      // ignore invalid/expired tokens
    }
  }
  return null;
}

/**
 * Submit an Exit Exam or Quiz attempt
 * POST /api/exams/submit
 */
router.post('/submit', async (req, res) => {
  const { course_name, total_questions, score, percentage, time_taken_seconds, answers_breakdown, student_name, user_id } = req.body;
  if (!course_name || score === undefined) {
    return res.status(400).json({ error: 'Course name and score are required' });
  }

  const authenticatedUser = extractUser(req);
  const id = `attempt-${Date.now()}`;
  const userId = authenticatedUser?.id || user_id || 'student-guest';
  const resolvedStudentName = authenticatedUser?.full_name || authenticatedUser?.email || student_name || 'Student';

  try {
    const result = await query(
      `INSERT INTO exam_attempts (
        id, user_id, student_name, course_name, total_questions,
        score, percentage, time_taken_seconds, answers_breakdown
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        id,
        userId,
        resolvedStudentName,
        course_name,
        Number(total_questions) || 0,
        Number(score) || 0,
        Number(percentage) || 0,
        Number(time_taken_seconds) || 0,
        typeof answers_breakdown === 'string' ? answers_breakdown : JSON.stringify(answers_breakdown || {}),
      ]
    );

    res.status(201).json(result.rows[0] || { id, score, percentage, student_name: resolvedStudentName });
  } catch (err) {
    console.error('Failed to record exam attempt:', err);
    res.status(500).json({ error: 'Failed to record exam attempt' });
  }
});

/**
 * Fetch Department Leaderboard for a course
 * GET /api/exams/leaderboard/:course
 */
router.get('/leaderboard/:course', async (req, res) => {
  const { course } = req.params;
  try {
    const result = await query(
      `SELECT student_name, course_name, score, total_questions, percentage, time_taken_seconds, created_at
       FROM exam_attempts
       WHERE LOWER(course_name) = LOWER($1)
       ORDER BY score DESC, time_taken_seconds ASC
       LIMIT 10`,
      [course]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * Fetch student's previous test history
 * GET /api/exams/my-history
 */
router.get('/my-history', async (req, res) => {
  const authenticatedUser = extractUser(req);
  const userId = authenticatedUser?.id || req.query.user_id;

  if (!userId) {
    return res.json([]);
  }

  try {
    const result = await query(
      `SELECT id, course_name, score, total_questions, percentage, time_taken_seconds, created_at
       FROM exam_attempts
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch personal exam history' });
  }
});

export default router;
