import { Router } from 'express';
import { query } from '../db.js';
import { authenticateToken, rateLimit } from './auth.js';

const router = Router();

// Authoritative Server-Side Question Bank & Answer Keys (Problem 17)
export const AUTHORITATIVE_QUESTION_BANK = {
  'Data Structures': [
    {
      q: 'What is the tightest worst-case time complexity of QuickSort when a naive first-element pivot selection is used on an already sorted array?',
      options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'],
      correct: 1,
      explanation: 'When quicksort always picks the first element in an already sorted array, partitions become maximally unbalanced, degrading time complexity to O(n²).'
    },
    {
      q: 'Which of the following data structures operates strictly on a First-In, First-Out (FIFO) principle?',
      options: ['Stack', 'Queue', 'Binary Search Tree', 'Max Heap'],
      correct: 1,
      explanation: 'A Queue enforces FIFO (First-In, First-Out), where items are inserted at the back and removed from the front.'
    },
    {
      q: 'In a Binary Search Tree (BST), which tree traversal visits all nodes in sorted ascending order?',
      options: ['Pre-order', 'In-order', 'Post-order', 'Level-order'],
      correct: 1,
      explanation: 'In-order traversal (Left, Root, Right) of a valid BST always visits keys in non-decreasing sorted order.'
    },
    {
      q: 'What technique resolves hash collisions by placing colliding elements into a linked list at the same bucket?',
      options: ['Linear Probing', 'Quadratic Probing', 'Separate Chaining', 'Double Hashing'],
      correct: 2,
      explanation: 'Separate chaining stores all elements hashing to the same bucket in an auxiliary linked list or tree.'
    },
  ],
  'Database Systems': [
    {
      q: 'Which Normal Form requires 1NF compliance and mandates that every non-prime attribute is fully functionally dependent on the entire candidate key, eliminating partial dependencies?',
      options: ['1NF', '2NF', '3NF', 'BCNF'],
      correct: 1,
      explanation: 'Second Normal Form (2NF) eliminates partial functional dependencies on composite primary keys.'
    },
    {
      q: 'Which property of ACID transactions guarantees that committed transactions survive subsequent power failures or server crashes?',
      options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
      correct: 3,
      explanation: 'Durability guarantees that once a transaction commits, its effects remain permanently recorded in the database.'
    },
    {
      q: 'What index structure is most widely used in relational databases to support fast range queries and equality lookups?',
      options: ['Hash Index', 'B+ Tree', 'Inverted Index', 'Bitmap Index'],
      correct: 1,
      explanation: 'B+ Trees keep data sorted with sequential leaf pointers, providing O(log n) searches and efficient range traversals.'
    },
  ],
  'Computer Networks': [
    {
      q: 'Which layer of the OSI 7-layer model is responsible for reliable process-to-process communication, flow control, and end-to-end congestion management?',
      options: ['Network Layer', 'Transport Layer', 'Data Link Layer', 'Application Layer'],
      correct: 1,
      explanation: 'The Transport Layer (Layer 4, including TCP) provides process-to-process delivery, flow control, and error recovery.'
    },
    {
      q: 'During the standard TCP 3-way handshake to establish a connection, which flags are set in the second packet sent from the server back to the client?',
      options: ['SYN only', 'ACK only', 'SYN + ACK', 'FIN + ACK'],
      correct: 2,
      explanation: 'The server responds with SYN + ACK, simultaneously acknowledging the client sequence number and proposing its own starting sequence.'
    },
    {
      q: 'How many usable host IP addresses are available in a subnet with the CIDR prefix /28?',
      options: ['14', '16', '30', '32'],
      correct: 0,
      explanation: 'A /28 subnet leaves 4 host bits (16 total addresses). Subtracting network and broadcast addresses leaves 14 usable hosts.'
    },
  ],
  'Operating Systems': [
    {
      q: 'Which condition is NOT one of Coffman\'s four necessary conditions for deadlock to occur?',
      options: ['Mutual Exclusion', 'Hold and Wait', 'No Preemption', 'Round Robin Scheduling'],
      correct: 3,
      explanation: 'Coffman conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Round Robin is a CPU scheduling algorithm.'
    },
    {
      q: 'What page replacement algorithm suffers from Belady\'s Anomaly, where increasing the number of page frames can result in an increase in page faults?',
      options: ['LRU (Least Recently Used)', 'Optimal Algorithm', 'FIFO (First-In, First-Out)', 'LFU (Least Frequently Used)'],
      correct: 2,
      explanation: 'FIFO page replacement can exhibit Belady\'s Anomaly because it does not follow the stack inclusion property.'
    },
  ],
  'Artificial Intelligence': [
    {
      q: 'Which search algorithm is guaranteed to find the shortest path in a weighted graph if all edge weights are positive?',
      options: ['Breadth-First Search', 'Depth-First Search', 'Uniform Cost Search (Dijkstra)', 'Greedy Best-First Search'],
      correct: 2,
      explanation: 'Uniform Cost Search expands nodes in order of path cost g(n) and is optimal for positive edge weights.'
    },
  ],
  'Software Engineering': [
    {
      q: 'Which design pattern restricts the instantiation of a class to one single object throughout the application lifetime?',
      options: ['Factory Pattern', 'Singleton Pattern', 'Observer Pattern', 'Adapter Pattern'],
      correct: 1,
      explanation: 'The Singleton pattern ensures a class has only one instance and provides a global access point to it.'
    },
  ],
};

/**
 * Fetch official questions for a course
 * GET /api/exams/questions/:course
 */
router.get('/questions/:course', (req, res) => {
  const { course } = req.params;
  const questions = AUTHORITATIVE_QUESTION_BANK[course] || AUTHORITATIVE_QUESTION_BANK['Data Structures'];

  // Return question structure
  const publicQuestions = questions.map((q, idx) => ({
    id: idx,
    q: q.q,
    options: q.options,
    explanation: q.explanation,
  }));

  res.json(publicQuestions);
});

/**
 * Submit an Exit Exam or Quiz attempt with Server-Side Grading (Problem 15, 17, 18, 31)
 * POST /api/exams/submit
 */
router.post(
  '/submit',
  authenticateToken,
  rateLimit({ windowMs: 10 * 1000, max: 2, message: 'Please wait between test submissions' }),
  async (req, res) => {
    const { course_name, answers, time_taken_seconds } = req.body;

    if (!course_name) {
      return res.status(400).json({ error: 'Course name is required' });
    }

    // Server-enforced identity from authenticated token only (Problem 18)
    const userId = req.user.id;
    const studentName = req.user.full_name || req.user.email || 'Student';

    // Retrieve official questions
    const matchedCourse = Object.keys(AUTHORITATIVE_QUESTION_BANK).find(
      (k) => k.toLowerCase() === course_name.toLowerCase()
    ) || 'Data Structures';

    const questionSet = AUTHORITATIVE_QUESTION_BANK[matchedCourse];
    const totalQuestions = questionSet.length;

    // Server-side grading against authoritative answer key (Problem 17)
    let calculatedScore = 0;
    const studentAnswers = answers && typeof answers === 'object' ? answers : {};

    questionSet.forEach((q, idx) => {
      if (studentAnswers[idx] !== undefined && Number(studentAnswers[idx]) === q.correct) {
        calculatedScore++;
      }
    });

    const percentage = Math.round((calculatedScore / totalQuestions) * 100);
    const validTimeTaken = Math.max(Number(time_taken_seconds) || 1, 1);
    const id = `attempt-${Date.now()}`;

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
          studentName,
          matchedCourse,
          totalQuestions,
          calculatedScore,
          percentage,
          validTimeTaken,
          JSON.stringify(studentAnswers),
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Failed to record exam attempt:', err);
      res.status(500).json({ error: 'Failed to record exam attempt' });
    }
  }
);

/**
 * Fetch Department Leaderboard for a course (Problem 31)
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
 * Fetch authenticated student's previous test history (Problem 16: Derived strictly from token)
 * GET /api/exams/my-history
 */
router.get('/my-history', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, course_name, score, total_questions, percentage, time_taken_seconds, created_at
       FROM exam_attempts
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 25`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch personal exam history' });
  }
});

export default router;
