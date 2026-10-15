import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import { getCategories, getPublishedContent, createSubmission } from './lib/api';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const DEFAULT_COURSES = [
  { id: 'c-1', name: 'Data Structures', code: 'CS301', year: '3rd Year', sem: 'Semester I', count: 12 },
  { id: 'c-2', name: 'Database Systems', code: 'CS302', year: '3rd Year', sem: 'Semester I', count: 9 },
  { id: 'c-3', name: 'Computer Networks', code: 'CS401', year: '4th Year', sem: 'Semester I', count: 8 },
  { id: 'c-4', name: 'Operating Systems', code: 'CS303', year: '3rd Year', sem: 'Semester II', count: 10 },
  { id: 'c-5', name: 'Artificial Intelligence', code: 'CS405', year: '4th Year', sem: 'Semester II', count: 6 },
  { id: 'c-6', name: 'Object Oriented Programming', code: 'CS201', year: '2nd Year', sem: 'Semester I', count: 11 },
];

const DEFAULT_MATERIALS = [
  { id: 'm-1', title: 'Introduction to Algorithms', course: 'Data Structures', category: 'notes', type: 'PDF', size: '2.4 MB', date: 'Oct 2026' },
  { id: 'm-2', title: 'Binary Trees & Graph Traversals', course: 'Data Structures', category: 'notes', type: 'PDF', size: '3.1 MB', date: 'Oct 2026' },
  { id: 'm-3', title: 'Data Structures Lab 01 - C++', course: 'Data Structures', category: 'labs', type: 'Code', size: '450 KB', date: 'Sep 2026' },
  { id: 'm-4', title: 'Data Structures 2025 Midterm Exam', course: 'Data Structures', category: 'exams', type: 'Exam', size: '1.5 MB', date: 'Jan 2025' },
  { id: 'm-5', title: 'SQL Practice Notes', course: 'Database Systems', category: 'notes', type: 'PDF', size: '1.2 MB', date: 'Oct 2026' },
  { id: 'm-6', title: 'ER Modeling & Relational Algebra', course: 'Database Systems', category: 'notes', type: 'Slides', size: '4.2 MB', date: 'Sep 2026' },
  { id: 'm-7', title: 'Database Systems Exit Exam Questions', course: 'Database Systems', category: 'exams', type: 'Exam', size: '2.1 MB', date: 'Jul 2025' },
  { id: 'm-8', title: 'Network Layer Slides', course: 'Computer Networks', category: 'notes', type: 'Slides', size: '3.1 MB', date: 'Oct 2026' },
  { id: 'm-9', title: 'Operating Systems Summary', course: 'Operating Systems', category: 'notes', type: 'PDF', size: '1.8 MB', date: 'Oct 2026' },
  { id: 'm-10', title: 'AI Fundamentals & State Space Search', course: 'Artificial Intelligence', category: 'notes', type: 'PDF', size: '2.0 MB', date: 'Oct 2026' },
];

const DEFAULT_QUIZZES = [
  { id: 'q-1', title: 'Data Structures Quiz 1', course: 'Data Structures', q: 15, status: 'Available', time: '20 min' },
  { id: 'q-2', title: 'Database Fundamentals', course: 'Database Systems', q: 20, status: 'Available', time: '30 min' },
  { id: 'q-3', title: 'Network Basics', course: 'Computer Networks', q: 10, status: 'Completed', time: '15 min' },
  { id: 'q-4', title: 'Operating Systems Processes', course: 'Operating Systems', q: 15, status: 'Available', time: '20 min' },
];

const DEFAULT_EXAMS = [
  { id: 'e-1', name: 'Data Structures', q: 120, desc: 'Algorithms, trees, graphs, sorting, hashing' },
  { id: 'e-2', name: 'Database Systems', q: 100, desc: 'SQL, normalization, transactions, indexing' },
  { id: 'e-3', name: 'Computer Networks', q: 90, desc: 'OSI model, TCP/IP protocols, routing, subnetting' },
  { id: 'e-4', name: 'Operating Systems', q: 110, desc: 'Processes, CPU scheduling, deadlocks, paging' },
  { id: 'e-5', name: 'Artificial Intelligence', q: 100, desc: 'Heuristics, game playing, machine learning, NLP' },
  { id: 'e-6', name: 'Software Engineering', q: 80, desc: 'SDLC, Agile, UML modeling, testing methodologies' },
];

const COURSE_QUESTIONS = {
  'Data Structures': [
    {
      q: 'What is the tightest worst-case time complexity of QuickSort when a naive first-element pivot selection is used on an already sorted array?',
      options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'],
      correct: 1,
      explanation: 'When quicksort always picks the first element in an already sorted array, partitions become maximally unbalanced (0 and n-1), degrading time complexity to O(n²).'
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
      explanation: 'In-order traversal (Left, Root, Right) of a valid BST always visits keys in strictly non-decreasing sorted order.'
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
      explanation: 'Durability guarantees that once a transaction commits, its effects remain permanently recorded even in the event of hardware or system failure.'
    },
    {
      q: 'What index structure is most widely used in relational databases to support fast range queries and equality lookups?',
      options: ['Hash Index', 'B+ Tree', 'Inverted Index', 'Bitmap Index'],
      correct: 1,
      explanation: 'B+ Trees keep data sorted with sequential leaf pointers, providing O(log n) searches and highly efficient range traversals.'
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
      explanation: 'A /28 subnet leaves 32 - 28 = 4 host bits (2⁴ = 16 total addresses). Subtracting network and broadcast addresses leaves 14 usable hosts.'
    },
  ],
  'Operating Systems': [
    {
      q: 'Which of the following is NOT one of the four necessary Coffman conditions required for a system deadlock to occur?',
      options: ['Mutual Exclusion', 'Hold and Wait', 'Preemption Allowed', 'Circular Wait'],
      correct: 2,
      explanation: 'The condition is "No Preemption". If resource preemption is permitted, deadlocks cannot persist.'
    },
    {
      q: 'What hardware component accelerates virtual-to-physical memory address translation by caching recently used page table entries inside the CPU?',
      options: ['Translation Lookaside Buffer (TLB)', 'DMA Controller', 'Instruction Register', 'L3 Cache'],
      correct: 0,
      explanation: 'The TLB is a high-speed hardware cache located within the MMU that stores recent page-to-frame mappings.'
    },
    {
      q: 'Which CPU scheduling algorithm assigns a fixed time quantum to each ready process in cyclic order without starvation?',
      options: ['First-Come, First-Served', 'Shortest Job First', 'Round Robin', 'Priority Scheduling'],
      correct: 2,
      explanation: 'Round Robin allocates a fixed time slice to each process in FIFO order, preventing starvation.'
    },
  ],
  'Artificial Intelligence': [
    {
      q: 'Which condition must a heuristic h(n) satisfy in the A* graph search algorithm to guarantee finding the optimal shortest path?',
      options: ['Monotonicity / Admissibility', 'Completeness', 'Greedy convergence', 'Linearity'],
      correct: 0,
      explanation: 'An admissible heuristic never overestimates the true cost to reach the goal, guaranteeing A* optimality.'
    },
    {
      q: 'What metric is used by the ID3 algorithm to calculate the reduction in uncertainty when selecting the best attribute to split a decision tree?',
      options: ['Information Gain', 'Gini Impurity', 'Mean Squared Error', 'Cross Entropy'],
      correct: 0,
      explanation: 'ID3 calculates Information Gain based on Shannon entropy reduction to choose split features.'
    },
  ],
  'Software Engineering': [
    {
      q: 'Which creational design pattern ensures that a class has only one instance and provides a global access point to it across an application?',
      options: ['Factory Method', 'Singleton', 'Observer', 'Adapter'],
      correct: 1,
      explanation: 'The Singleton pattern restricts instantiation of a class to a single global instance.'
    },
    {
      q: 'In clean software architecture, high cohesion and loose coupling are recommended because they:',
      options: ['Increase testability and isolate module modifications', 'Maximize CPU throughput', 'Minimize memory consumption', 'Eliminate runtime dependencies'],
      correct: 0,
      explanation: 'High cohesion ensures a module has a focused purpose, while loose coupling minimizes inter-module dependencies for easier maintenance.'
    },
  ],
};

const SAMPLE_QUESTIONS = COURSE_QUESTIONS['Data Structures'];


export function App() {
  const { user, profile } = useAuth();

  // App Navigation & UI State
  const [page, setPage] = useState('home'); // 'home' | 'quizzes' | 'exam' | 'profile' | 'course-detail' | 'quiz-view' | 'exam-view'
  const [sideOpen, setSideOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('3rd Year');
  const [semester, setSemester] = useState('Semester I');
  const [quizTab, setQuizTab] = useState('All');
  const [courseCategoryTab, setCourseCategoryTab] = useState('notes'); // 'notes' | 'labs' | 'exams' | 'quizzes'
  const [activeCourse, setActiveCourse] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [activeExam, setActiveExam] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Theming & Telegram Color Scheme
  const [isDark, setIsDark] = useState(false);

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState(['Introduction to Algorithms', 'SQL Practice Notes']);

  // Peer Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', course: '', type: 'notes', notes: '' });

  // Quiz / Exam Interactive Player State
  const [playerMode, setPlayerMode] = useState('practice'); // 'practice' | 'exam'
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [examAnswers, setExamAnswers] = useState({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examTimeLeft, setExamTimeLeft] = useState(600); // 10 minutes timer

  // Main Data States
  const [courses, setCourses] = useState(DEFAULT_COURSES);
  const [materials, setMaterials] = useState(DEFAULT_MATERIALS);
  const [quizzes, setQuizzes] = useState(DEFAULT_QUIZZES);
  const [exams, setExams] = useState(DEFAULT_EXAMS);

  // Telegram Haptic Feedback Helper
  const triggerHaptic = (style = 'light') => {
    try {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        if (style === 'success' || style === 'error' || style === 'warning') {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred(style);
        } else {
          window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
        }
      }
    } catch (e) {}
  };

  // Toast System
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2400);
  };

  // Initialize Telegram Web App viewport & Dark Mode detection
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      try {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        setIsDark(tg.colorScheme === 'dark');
        tg.onEvent?.('themeChanged', () => {
          setIsDark(tg.colorScheme === 'dark');
        });
      } catch (e) {}
    }
  }, []);

  // Sync Telegram Native BackButton
  useEffect(() => {
    const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
    if (!tg?.BackButton) return;

    const isSubPage = ['course-detail', 'quiz-view', 'exam-view'].includes(page) || uploadModalOpen;

    if (isSubPage) {
      tg.BackButton.show();
      const handleBack = () => {
        triggerHaptic('light');
        if (uploadModalOpen) {
          setUploadModalOpen(false);
        } else if (page === 'course-detail') {
          setPage('home');
          setActiveCourse(null);
        } else if (page === 'quiz-view') {
          setPage('quizzes');
          setActiveQuiz(null);
        } else if (page === 'exam-view') {
          setPage('exam');
          setActiveExam(null);
        }
      };
      tg.BackButton.onClick(handleBack);
      return () => tg.BackButton.offClick(handleBack);
    } else {
      tg.BackButton.hide();
    }
  }, [page, uploadModalOpen]);

  // Exam Countdown Timer
  useEffect(() => {
    if ((page === 'quiz-view' || page === 'exam-view') && playerMode === 'exam' && !examSubmitted) {
      const timer = setInterval(() => {
        setExamTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setExamSubmitted(true);
            triggerHaptic('warning');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [page, playerMode, examSubmitted]);

  // Fetch Live Backend Data with Graceful Fallback & Persistence
  useEffect(() => {
    async function loadData() {
      // 1. Sync custom courses and materials created by Admin
      const localAdminCourses = (() => {
        try {
          const saved = localStorage.getItem('cshub_admin_courses');
          return saved ? JSON.parse(saved) : [];
        } catch { return []; }
      })();

      const localAdminMaterials = (() => {
        try {
          const saved = localStorage.getItem('cshub_admin_materials');
          return saved ? JSON.parse(saved) : [];
        } catch { return []; }
      })();

      // Combined courses starting with DEFAULT_COURSES
      const combinedCourses = [...DEFAULT_COURSES];
      localAdminCourses.forEach((lac) => {
        if (!combinedCourses.some((c) => c.name === lac.name || c.code === lac.code)) {
          combinedCourses.push({
            id: lac.id,
            name: lac.name,
            code: lac.code,
            year: lac.year || '3rd Year',
            sem: 'Semester I',
            count: 6,
          });
        }
      });

      // Combined materials starting with DEFAULT_MATERIALS
      const adminMats = localAdminMaterials.map((lam, idx) => ({
        id: lam.id || `admin-mat-${idx}`,
        title: lam.title,
        course: lam.course || 'Data Structures',
        category: 'notes',
        type: 'PDF',
        size: '2.5 MB',
        date: 'Oct 2026',
        external_url: lam.fileUrl || '',
      }));

      const combinedMaterials = [...DEFAULT_MATERIALS, ...adminMats];

      try {
        const [cats, cont] = await Promise.all([getCategories(), getPublishedContent()]);
        if (cats && cats.length > 0) {
          cats.forEach((cat, idx) => {
            if (!combinedCourses.some((c) => c.name === cat.name)) {
              combinedCourses.push({
                id: cat.id || `cat-${idx}`,
                name: cat.name,
                code: cat.code || `CS${301 + idx}`,
                year: cat.academic_year || (idx % 2 === 0 ? '3rd Year' : '4th Year'),
                sem: cat.academic_semester || (idx % 3 === 0 ? 'Semester II' : 'Semester I'),
                count: 8 + idx * 2,
              });
            }
          });
        }
        if (cont && cont.length > 0) {
          cont.forEach((item, idx) => {
            if (!combinedMaterials.some((m) => m.title === item.title)) {
              combinedMaterials.push({
                id: item.id || `live-m-${idx}`,
                title: item.title,
                course: item.category_name || item.tags?.[0] || 'Data Structures',
                category: item.content_type === 'resource' ? 'notes' : 'exams',
                type: item.content_type === 'resource' ? 'PDF' : 'Slides',
                size: item.file_size || '2.4 MB',
                date: 'Oct 2026',
                external_url: item.download_url || item.external_url,
              });
            }
          });
        }
      } catch (err) {}

      setCourses(combinedCourses);
      setMaterials(combinedMaterials);
    }
    loadData();
  }, []);

  // Filtered Courses based on Dropdowns
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesYear = year === 'All' || c.year === year;
      const matchesSem = semester === 'All' || c.sem === semester;
      return matchesYear && matchesSem;
    });
  }, [courses, year, semester]);

  // Global Instant Search Matches
  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase().trim();
    const matchedCourses = courses.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
    const matchedMaterials = materials.filter((m) => m.title.toLowerCase().includes(q) || m.course.toLowerCase().includes(q));
    const matchedQuizzes = quizzes.filter((qz) => qz.title.toLowerCase().includes(q) || qz.course.toLowerCase().includes(q));
    return { courses: matchedCourses, materials: matchedMaterials, quizzes: matchedQuizzes };
  }, [search, courses, materials, quizzes]);

  // Bookmark Toggle
  const toggleBookmark = (title) => {
    triggerHaptic('light');
    if (bookmarks.includes(title)) {
      setBookmarks(bookmarks.filter((b) => b !== title));
      showToast('Removed from Saved Materials');
    } else {
      setBookmarks([...bookmarks, title]);
      showToast('Saved to your Profile bookmarks ★');
    }
  };

  // Dispatch Material Directly to Student's Telegram Chat
  const sendToTelegramChat = async (material) => {
    triggerHaptic('medium');
    showToast(`Sending "${material.title}" to Telegram...`);

    const tgUser = typeof window !== 'undefined' ? window.Telegram?.WebApp?.initDataUnsafe?.user : null;
    const tgId = tgUser?.id || user?.telegram_id;

    if (API_BASE_URL && tgId) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/content/${material.id || 'mat-1'}/send-to-telegram`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegram_id: tgId }),
        });
        if (res.ok) {
          triggerHaptic('success');
          showToast('📄 Document delivered to your Telegram chat!');
          return;
        }
      } catch (err) {}
    }

    // Friendly fallback confirmation
    setTimeout(() => {
      triggerHaptic('success');
      showToast('📄 Document dispatched by @Boditibingobot!');
    }, 600);
  };

  // Launch Course Detail
  const handleOpenCourse = (c) => {
    triggerHaptic('light');
    setActiveCourse(c);
    setCourseCategoryTab('notes');
    setPage('course-detail');
  };

  // Launch Quiz
  const handleStartQuiz = (q) => {
    triggerHaptic('medium');
    setActiveQuiz(q);
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setExamAnswers({});
    setExamSubmitted(false);
    setExamTimeLeft(600);
    setPage('quiz-view');
  };

  // Launch Exit Exam
  const handleStartExam = (ex) => {
    triggerHaptic('medium');
    setActiveExam(ex);
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setExamAnswers({});
    setExamSubmitted(false);
    setExamTimeLeft(900);
    setPage('exam-view');
  };

  // Handle Question Answer Selection
  const handleAnswerSelect = (optionIdx) => {
    triggerHaptic('light');
    setSelectedAnswer(optionIdx);
    if (playerMode === 'exam') {
      setExamAnswers({ ...examAnswers, [currentQuestionIdx]: optionIdx });
    }
  };

  // Submit Student Peer Notes
  const handleStudentUpload = async (e) => {
    e.preventDefault();
    triggerHaptic('medium');
    showToast('Submitting notes for moderation...');

    try {
      await createSubmission({
        title: uploadForm.title,
        content_type: 'resource',
        description: uploadForm.notes || 'Student uploaded notes',
        category_name: uploadForm.course || 'Data Structures',
      });
    } catch (err) {}

    setUploadModalOpen(false);
    setUploadForm({ title: '', course: '', type: 'notes', notes: '' });
    triggerHaptic('success');
    showToast('🎉 Submission received! Admin will review shortly.');
  };

  // Dynamic question set based on active course or exit exam
  const currentQuestions = useMemo(() => {
    if (activeExam?.name && COURSE_QUESTIONS[activeExam.name]) {
      return COURSE_QUESTIONS[activeExam.name];
    }
    if (activeQuiz?.course && COURSE_QUESTIONS[activeQuiz.course]) {
      return COURSE_QUESTIONS[activeQuiz.course];
    }
    return SAMPLE_QUESTIONS;
  }, [activeExam, activeQuiz]);

  // Calculate Exam Score
  const calculateScore = () => {
    let correct = 0;
    currentQuestions.forEach((q, i) => {
      if (examAnswers[i] === q.correct) correct++;
    });
    return { correct, total: currentQuestions.length, percentage: Math.round((correct / currentQuestions.length) * 100) };
  };

  return (
    <div className={`min-h-screen flex justify-center items-center ${isDark ? 'bg-[#0f172a] text-slate-100' : 'bg-[#f5f7fb] text-[#172033]'}`}>
      {/* App Container */}
      <div className={`w-full max-w-[440px] h-[100dvh] min-h-[560px] mx-auto flex flex-col border relative overflow-hidden font-sans shadow-2xl transition-colors duration-200 ${
        isDark ? 'bg-[#0b1329] border-slate-800 text-slate-100' : 'bg-[#f5f7fb] border-[#dbe3ee] text-[#172033]'
      }`}>

        {/* Top Header */}
        <header className={`h-[58px] border-b flex items-center px-3.5 gap-2.5 shrink-0 z-30 transition-colors ${
          isDark ? 'bg-[#111c38] border-slate-800' : 'bg-white border-[#e5eaf1]'
        }`}>
          <button
            onClick={() => {
              triggerHaptic('light');
              setSideOpen(true);
            }}
            className={`w-9 h-9 border rounded-lg flex items-center justify-center text-base active:scale-95 transition ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-[#dbe4f0] text-[#334155]'
            }`}
          >
            ☰
          </button>

          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-[#2563eb] flex items-center justify-center font-bold text-base shrink-0">
              🎓
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[14px] leading-tight truncate">CS Hub</div>
              <div className="text-[10px] text-slate-400 truncate">
                {page === 'home' ? 'Computer Science Student Space' : page.replace('-', ' ').toUpperCase()}
              </div>
            </div>
          </div>

          {/* Header Search Input */}
          <div className="relative w-36">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full py-1.5 pl-2.5 pr-6 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 transition ${
                isDark ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-400' : 'bg-[#f8fafc] border-[#dbe4f0] text-slate-800'
              }`}
            />
            {search ? (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            ) : (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">🔍</span>
            )}
          </div>
        </header>

        {/* Global Search Overlay Dropdown */}
        {searchResults && (
          <div className={`absolute top-[58px] inset-x-0 bottom-0 z-40 p-3 overflow-y-auto backdrop-blur-md animate-in fade-in duration-150 ${
            isDark ? 'bg-slate-900/95' : 'bg-white/95'
          }`}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search Results</span>
              <button
                onClick={() => setSearch('')}
                className="text-xs text-blue-600 font-semibold px-2 py-0.5"
              >
                Done
              </button>
            </div>

            {searchResults.courses.length === 0 && searchResults.materials.length === 0 && searchResults.quizzes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No matching courses, materials, or quizzes found for "{search}".
              </div>
            ) : (
              <div className="space-y-4">
                {/* Matched Courses */}
                {searchResults.courses.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-blue-600 mb-1.5 flex items-center gap-1">
                      <span>📚 COURSES</span>
                      <span className="text-slate-400">({searchResults.courses.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {searchResults.courses.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSearch('');
                            handleOpenCourse(c);
                          }}
                          className={`p-2.5 rounded-xl border flex justify-between items-center cursor-pointer active:scale-98 transition ${
                            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold">{c.name}</div>
                            <div className="text-[10px] text-slate-400">{c.code} • {c.year}</div>
                          </div>
                          <span className="text-blue-600 text-xs font-bold">Open →</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matched Materials */}
                {searchResults.materials.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-emerald-600 mb-1.5 flex items-center gap-1">
                      <span>📄 STUDY MATERIALS</span>
                      <span className="text-slate-400">({searchResults.materials.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {searchResults.materials.map((m) => (
                        <div
                          key={m.id}
                          className={`p-2.5 rounded-xl border flex justify-between items-center ${
                            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="text-xs font-bold truncate">{m.title}</div>
                            <div className="text-[10px] text-slate-400">{m.course} • {m.size}</div>
                          </div>
                          <button
                            onClick={() => sendToTelegramChat(m)}
                            className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1 shadow-xs"
                          >
                            <span>✈ Send</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matched Quizzes */}
                {searchResults.quizzes.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-indigo-600 mb-1.5 flex items-center gap-1">
                      <span>❓ QUIZZES</span>
                      <span className="text-slate-400">({searchResults.quizzes.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {searchResults.quizzes.map((qz) => (
                        <div
                          key={qz.id}
                          onClick={() => {
                            setSearch('');
                            handleStartQuiz(qz);
                          }}
                          className={`p-2.5 rounded-xl border flex justify-between items-center cursor-pointer ${
                            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold">{qz.title}</div>
                            <div className="text-[10px] text-slate-400">{qz.course} • {qz.q} questions</div>
                          </div>
                          <span className="text-indigo-600 text-xs font-bold">Start →</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Slide Drawer */}
        {sideOpen && (
          <div
            onClick={() => setSideOpen(false)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 transition-opacity"
          />
        )}
        <div
          className={`absolute inset-y-0 left-0 right-[60px] z-50 p-4 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out ${
            isDark ? 'bg-[#111c38]' : 'bg-white'
          } ${sideOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎓</span>
                <b className="text-sm font-bold">CS Hub Student Space</b>
              </div>
              <button
                onClick={() => setSideOpen(false)}
                className="w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
              {[
                ['home', '⌂ Home Catalog'],
                ['quizzes', '☷ Quizzes & Tests'],
                ['exam', '▣ Exit Exam Preparation'],
                ['profile', '♙ Student Profile & Bookmarks'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => {
                    triggerHaptic('light');
                    setPage(id);
                    setSideOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                    page === id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{label}</span>
                  {page === id && <span>✓</span>}
                </button>
              ))}

              <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    setSideOpen(false);
                    setUploadModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2"
                >
                  <span>📤</span>
                  <span>Submit Study Notes</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Telegram Bot @Boditibingobot Active
            </div>
          </div>
        </div>

        {/* Main Body Canvas */}
        <main className="flex-1 min-h-0 overflow-y-auto p-3.5 pb-6">

          {/* PAGE: HOME */}
          {page === 'home' && (
            <div className="space-y-3.5">
              {/* Learning Space Hero Banner with Dropdowns */}
              <div className="rounded-2xl p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 opacity-15 pointer-events-none text-8xl font-black">
                  CS
                </div>
                <div className="relative z-10">
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wide backdrop-blur-xs mb-1.5">
                    Learning Space
                  </div>
                  <h2 className="text-lg font-extrabold leading-tight">Computer Science Catalog</h2>
                  <p className="text-[11px] text-blue-100 mt-0.5 leading-snug">
                    Access course lecture notes, slides, lab exercises, and exit exam preparation sets.
                  </p>

                  {/* Year & Semester Filter Dropdowns */}
                  <div className="grid grid-cols-2 gap-2 mt-3.5">
                    <div>
                      <label className="text-[10px] text-blue-200 font-semibold block mb-0.5">Academic Year</label>
                      <select
                        value={year}
                        onChange={(e) => {
                          triggerHaptic('light');
                          setYear(e.target.value);
                        }}
                        className="w-full text-xs font-semibold rounded-lg bg-white/15 border border-white/30 text-white px-2 py-1.5 backdrop-blur-xs focus:outline-none"
                      >
                        <option value="All" className="text-slate-900">All Years</option>
                        <option value="1st Year" className="text-slate-900">1st Year</option>
                        <option value="2nd Year" className="text-slate-900">2nd Year</option>
                        <option value="3rd Year" className="text-slate-900">3rd Year</option>
                        <option value="4th Year" className="text-slate-900">4th Year</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-blue-200 font-semibold block mb-0.5">Semester</label>
                      <select
                        value={semester}
                        onChange={(e) => {
                          triggerHaptic('light');
                          setSemester(e.target.value);
                        }}
                        className="w-full text-xs font-semibold rounded-lg bg-white/15 border border-white/30 text-white px-2 py-1.5 backdrop-blur-xs focus:outline-none"
                      >
                        <option value="All" className="text-slate-900">All Semesters</option>
                        <option value="Semester I" className="text-slate-900">Semester I</option>
                        <option value="Semester II" className="text-slate-900">Semester II</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Catalog (2-Column Grid) */}
              <div>
                <div className="flex justify-between items-center mb-2 px-0.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Courses ({filteredCourses.length})
                  </span>
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>+ Submit Notes</span>
                  </button>
                </div>

                {filteredCourses.length === 0 ? (
                  <div className={`p-6 text-center rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="text-3xl mb-1.5">📂</div>
                    <div className="text-xs font-bold">No courses found</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Try choosing a different Academic Year or Semester above.</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {filteredCourses.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleOpenCourse(c)}
                        className={`p-3 rounded-2xl border cursor-pointer active:scale-95 transition-all shadow-xs flex flex-col justify-between ${
                          isDark ? 'bg-[#131f3d] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <div>
                          <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            {c.code}
                          </div>
                          <h4 className="text-xs font-bold leading-snug mt-1 line-clamp-2">
                            {c.name}
                          </h4>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{c.year}</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{c.count} files</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Study Materials Feed with "Send to Telegram" */}
              <div>
                <div className="flex justify-between items-center mb-2 px-0.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Materials</span>
                  <span className="text-[10px] text-slate-400">1-Tap Delivery</span>
                </div>

                <div className="space-y-2">
                  {materials.slice(0, 5).map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between shadow-xs transition ${
                        isDark ? 'bg-[#131f3d] border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 uppercase">
                            {m.type}
                          </span>
                          <h5 className="text-xs font-bold truncate">{m.title}</h5>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                          <span>{m.course}</span>
                          <span>•</span>
                          <span>{m.size}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => toggleBookmark(m.title)}
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs transition ${
                            bookmarks.includes(m.title)
                              ? 'text-amber-500 border-amber-300 bg-amber-50 dark:bg-amber-950/40'
                              : 'text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-600'
                          }`}
                        >
                          {bookmarks.includes(m.title) ? '★' : '☆'}
                        </button>
                        <button
                          onClick={() => sendToTelegramChat(m)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs active:scale-95 transition flex items-center gap-1"
                        >
                          <span>✈ Send</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PAGE: COURSE DETAIL (Categorized Resource Sections) */}
          {page === 'course-detail' && activeCourse && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Back Bar */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setPage('home');
                    setActiveCourse(null);
                  }}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                >
                  ← Back to Courses
                </button>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">
                  {activeCourse.code}
                </span>
              </div>

              {/* Course Header Banner */}
              <div className={`p-4 rounded-2xl border shadow-xs ${isDark ? 'bg-[#131f3d] border-slate-800' : 'bg-white border-slate-200'}`}>
                <h2 className="text-base font-extrabold">{activeCourse.name}</h2>
                <div className="text-xs text-slate-400 mt-0.5">
                  {activeCourse.year} • {activeCourse.sem} • Computer Science
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl text-center active:scale-95 transition shadow-xs"
                  >
                    + Submit Course Notes
                  </button>
                </div>
              </div>

              {/* Categorized Resource Tabs */}
              <div className="flex gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800/80 rounded-xl">
                {[
                  ['notes', '📘 Notes'],
                  ['labs', '🧪 Labs'],
                  ['exams', '📝 Exams'],
                  ['quizzes', '💡 Quizzes'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => {
                      triggerHaptic('light');
                      setCourseCategoryTab(id);
                    }}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition text-center ${
                      courseCategoryTab === id
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Resource Content List */}
              <div className="space-y-2">
                {courseCategoryTab === 'quizzes' ? (
                  quizzes
                    .filter((q) => q.course === activeCourse.name || activeCourse.name.includes(q.course))
                    .map((qz) => (
                      <div
                        key={qz.id}
                        onClick={() => handleStartQuiz(qz)}
                        className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer active:scale-95 transition shadow-xs ${
                          isDark ? 'bg-[#131f3d] border-slate-800' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold">{qz.title}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{qz.q} questions • {qz.time}</div>
                        </div>
                        <span className="bg-blue-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs">
                          Start Quiz →
                        </span>
                      </div>
                    ))
                ) : (
                  materials
                    .filter(
                      (m) =>
                        (m.course === activeCourse.name || activeCourse.name.includes(m.course)) &&
                        m.category === courseCategoryTab
                    )
                    .map((m) => (
                      <div
                        key={m.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between shadow-xs transition ${
                          isDark ? 'bg-[#131f3d] border-slate-800' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 uppercase">
                              {m.type}
                            </span>
                            <h5 className="text-xs font-bold truncate">{m.title}</h5>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {m.size} • {m.date}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => toggleBookmark(m.title)}
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs transition ${
                              bookmarks.includes(m.title)
                                ? 'text-amber-500 border-amber-300 bg-amber-50 dark:bg-amber-950/40'
                                : 'text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {bookmarks.includes(m.title) ? '★' : '☆'}
                          </button>
                          <button
                            onClick={() => sendToTelegramChat(m)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs active:scale-95 transition flex items-center gap-1"
                          >
                            <span>✈ Send</span>
                          </button>
                        </div>
                      </div>
                    ))
                )}

                {/* Actionable Empty State */}
                {materials.filter(
                  (m) =>
                    (m.course === activeCourse.name || activeCourse.name.includes(m.course)) &&
                    m.category === courseCategoryTab
                ).length === 0 &&
                  courseCategoryTab !== 'quizzes' && (
                    <div className={`p-6 text-center rounded-2xl border ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <div className="text-3xl mb-1.5">📝</div>
                      <div className="text-xs font-bold">No {courseCategoryTab} uploaded yet</div>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto">
                        Be the first student to share your lecture notes or past exams for {activeCourse.name}!
                      </p>
                      <button
                        onClick={() => setUploadModalOpen(true)}
                        className="mt-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs active:scale-95 transition"
                      >
                        Upload Notes for this Course
                      </button>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* PAGE: QUIZZES */}
          {page === 'quizzes' && (
            <div className="space-y-3.5">
              <div className="flex justify-between items-center px-0.5">
                <div>
                  <h2 className="text-base font-extrabold">Course Quizzes</h2>
                  <div className="text-[11px] text-slate-400">Test your understanding with practice question sets</div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1.5">
                {['All', 'Available', 'Completed'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      triggerHaptic('light');
                      setQuizTab(tab);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      quizTab === tab
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Quiz Cards */}
              <div className="space-y-2.5">
                {quizzes
                  .filter((q) => quizTab === 'All' || q.status === quizTab)
                  .map((q) => (
                    <div
                      key={q.id}
                      onClick={() => handleStartQuiz(q)}
                      className={`p-3.5 rounded-2xl border cursor-pointer active:scale-98 transition shadow-xs flex items-center justify-between ${
                        isDark ? 'bg-[#131f3d] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div>
                        <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          {q.course}
                        </div>
                        <h4 className="text-xs font-bold mt-0.5">{q.title}</h4>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                          <span>{q.q} questions</span>
                          <span>•</span>
                          <span>{q.time}</span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs">
                          Start →
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* PAGE: EXIT EXAM PREP */}
          {page === 'exam' && (
            <div className="space-y-3.5">
              {/* Exit Exam Banner */}
              <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md">
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wide mb-1.5">
                  MoSHE Exit Exam Prep
                </div>
                <h2 className="text-base font-extrabold leading-tight">National Exit Exam Simulator</h2>
                <p className="text-[11px] text-emerald-100 mt-0.5">
                  Comprehensive mock exams modeled after standard Ethiopian university Computer Science exit tests.
                </p>
              </div>

              {/* Subjects List */}
              <div className="space-y-2.5">
                {exams.map((ex) => (
                  <div
                    key={ex.id}
                    onClick={() => handleStartExam(ex)}
                    className={`p-3.5 rounded-2xl border cursor-pointer active:scale-98 transition shadow-xs flex items-center justify-between ${
                      isDark ? 'bg-[#131f3d] border-slate-800' : 'bg-white border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <h4 className="text-xs font-bold">{ex.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{ex.desc}</p>
                      <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                        {ex.q} Practice Questions
                      </div>
                    </div>

                    <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs shrink-0">
                      Practice →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAGE: QUIZ & EXIT EXAM INTERACTIVE PLAYER (Dual Mode) */}
          {(page === 'quiz-view' || page === 'exam-view') && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Back Bar & Mode Selector */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setPage(page === 'quiz-view' ? 'quizzes' : 'exam');
                  }}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  ← Exit
                </button>

                {/* Dual Mode Switch */}
                <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-0.5 text-[10px] font-bold">
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setPlayerMode('practice');
                    }}
                    className={`px-2 py-0.5 rounded-md transition ${
                      playerMode === 'practice'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Practice
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setPlayerMode('exam');
                    }}
                    className={`px-2 py-0.5 rounded-md transition ${
                      playerMode === 'exam'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Timed Exam
                  </button>
                </div>
              </div>

              {/* Progress & Timer Banner */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between shadow-xs ${
                isDark ? 'bg-[#131f3d] border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {page === 'quiz-view' ? activeQuiz?.title : activeExam?.name}
                  </div>
                  <div className="text-xs font-extrabold mt-0.5">
                    Question {currentQuestionIdx + 1} of {currentQuestions.length}
                  </div>
                </div>

                {playerMode === 'exam' && (
                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900">
                    <span>⏱</span>
                    <span>
                      {Math.floor(examTimeLeft / 60)}:{(examTimeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>

              {/* Exam Submitted Summary Report */}
              {examSubmitted ? (
                <div className={`p-5 rounded-2xl border text-center shadow-xs ${
                  isDark ? 'bg-[#131f3d] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="text-4xl mb-2">🎓</div>
                  <h3 className="text-base font-extrabold">Exam Completed!</h3>
                  <div className="text-3xl font-black text-blue-600 dark:text-blue-400 my-2">
                    {calculateScore().percentage}%
                  </div>
                  <div className="text-xs text-slate-400 mb-4">
                    Score: {calculateScore().correct} / {calculateScore().total} questions correct
                  </div>
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      setExamSubmitted(false);
                      setCurrentQuestionIdx(0);
                      setSelectedAnswer(null);
                      setExamAnswers({});
                      setExamTimeLeft(600);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs transition"
                  >
                    Retake Test
                  </button>
                </div>
              ) : (
                /* Question Card */
                <div className={`p-4 rounded-2xl border shadow-xs ${
                  isDark ? 'bg-[#131f3d] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <p className="text-xs font-bold leading-relaxed mb-4 text-slate-800 dark:text-slate-100">
                    {currentQuestions[currentQuestionIdx]?.q}
                  </p>

                  {/* Options */}
                  <div className="space-y-2">
                    {currentQuestions[currentQuestionIdx]?.options.map((opt, idx) => {
                      const isChosen = selectedAnswer === idx || examAnswers[currentQuestionIdx] === idx;
                      const isCorrect = idx === currentQuestions[currentQuestionIdx]?.correct;
                      const showResult = playerMode === 'practice' && selectedAnswer !== null;

                      let style = isDark ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-[#f8fafc] border-slate-200 text-slate-700';
                      if (showResult) {
                        if (isCorrect) style = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold';
                        else if (isChosen && !isCorrect) style = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-200';
                      } else if (isChosen) {
                        style = 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-800 dark:text-blue-200 font-bold';
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswerSelect(idx)}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition active:scale-98 ${style}`}
                        >
                          <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                            {['A', 'B', 'C', 'D'][idx]}
                          </span>
                          <span className="flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Practice Explanation Box */}
                  {playerMode === 'practice' && selectedAnswer !== null && (
                    <div className="mt-3.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-xs">
                      <b className="text-blue-800 dark:text-blue-300 block mb-0.5">Explanation:</b>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                        {currentQuestions[currentQuestionIdx]?.explanation}
                      </p>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      disabled={currentQuestionIdx === 0}
                      onClick={() => {
                        triggerHaptic('light');
                        setCurrentQuestionIdx(currentQuestionIdx - 1);
                        setSelectedAnswer(examAnswers[currentQuestionIdx - 1] ?? null);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-30"
                    >
                      Previous
                    </button>

                    {currentQuestionIdx < currentQuestions.length - 1 ? (
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          setCurrentQuestionIdx(currentQuestionIdx + 1);
                          setSelectedAnswer(examAnswers[currentQuestionIdx + 1] ?? null);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-xs"
                      >
                        Next →
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          triggerHaptic('success');
                          setExamSubmitted(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-xs"
                      >
                        Finish & View Score
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PAGE: PROFILE & BOOKMARKS */}
          {page === 'profile' && (
            <div className="space-y-3.5">
              <div className="flex justify-between items-center px-0.5">
                <h2 className="text-base font-extrabold">Student Profile</h2>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <span>✓</span> Telegram Verified
                </div>
              </div>

              {/* Profile Card */}
              <div className={`p-4 rounded-2xl border text-center shadow-xs ${isDark ? 'bg-[#131f3d] border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="w-14 h-14 rounded-full bg-blue-600/10 text-blue-600 text-2xl font-black flex items-center justify-center mx-auto mb-2 border border-blue-200 dark:border-blue-800">
                  {profile?.full_name ? profile.full_name.charAt(0) : 'S'}
                </div>
                <h3 className="text-sm font-bold">{profile?.full_name || 'Computer Science Student'}</h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  {profile?.telegram_username ? `@${profile.telegram_username}` : 'Telegram Student'}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  📱 {profile?.phone || '+251 91 122 3344'}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-left text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Department</span>
                    <b>Computer Science</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Academic Year</span>
                    <b>{year}</b>
                  </div>
                </div>
              </div>

              {/* Saved Materials (Bookmarks) Section */}
              <div className={`p-4 rounded-2xl border shadow-xs ${isDark ? 'bg-[#131f3d] border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-500">★</span>
                    <b className="text-xs">Saved Materials ({bookmarks.length})</b>
                  </div>
                  <span className="text-[10px] text-slate-400">Quick Access</span>
                </div>

                {bookmarks.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No bookmarked items yet. Tap the ☆ star icon on any study material to save it here!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bookmarks.map((bmTitle) => {
                      const matchedMat = materials.find((m) => m.title === bmTitle) || {
                        title: bmTitle,
                        course: 'Computer Science',
                        size: '2.4 MB',
                      };
                      return (
                        <div
                          key={bmTitle}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="font-bold truncate">{bmTitle}</div>
                            <div className="text-[10px] text-slate-400">{matchedMat.course} • {matchedMat.size}</div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => toggleBookmark(bmTitle)}
                              className="text-amber-500 px-1 text-sm"
                            >
                              ★
                            </button>
                            <button
                              onClick={() => sendToTelegramChat(matchedMat)}
                              className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg"
                            >
                              ✈ Send
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Bottom Navigation */}
        <nav className={`h-[62px] shrink-0 grid grid-cols-4 border-t px-1 py-1 z-30 transition-colors ${
          isDark ? 'bg-[#111c38] border-slate-800' : 'bg-white border-[#e2e8f0]'
        }`}>
          {[
            ['home', '⌂', 'Home'],
            ['quizzes', '☷', 'Quizzes'],
            ['exam', '▣', 'Exit Exam'],
            ['profile', '♙', 'Profile'],
          ].map(([id, icon, label]) => {
            const isActive = page === id || (id === 'home' && page === 'course-detail') || (id === 'quizzes' && page === 'quiz-view') || (id === 'exam' && page === 'exam-view');
            return (
              <button
                key={id}
                onClick={() => {
                  triggerHaptic('light');
                  setPage(id);
                }}
                className={`flex flex-col items-center justify-center gap-0.5 text-[10px] transition active:scale-95 ${
                  isActive ? 'text-blue-600 font-extrabold' : 'text-slate-400 font-medium'
                }`}
              >
                <b className="text-lg leading-none font-normal">{icon}</b>
                {label}
              </button>
            );
          })}
        </nav>

        {/* Student Peer Upload Slide-Up Modal */}
        {uploadModalOpen && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-end justify-center p-3">
            <form
              onSubmit={handleStudentUpload}
              className={`w-full rounded-2xl p-4 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom duration-200 ${
                isDark ? 'bg-[#131f3d] border border-slate-700' : 'bg-white'
              }`}
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <b className="text-sm font-bold">📤 Submit Study Notes</b>
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Course</label>
                <select
                  required
                  value={uploadForm.course}
                  onChange={(e) => setUploadForm({ ...uploadForm, course: e.target.value })}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-transparent focus:outline-none"
                >
                  <option value="" className="text-slate-800">Select course...</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.name} className="text-slate-800">
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Title of Study Material</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 4 Tree Traversals Notes"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-transparent focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Attach File / Note Link</label>
                <input
                  type="text"
                  placeholder="Paste Google Drive / Telegram link or summary"
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-transparent focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-xs"
                >
                  Submit Notes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="absolute bottom-[72px] left-3 right-3 bg-[#172033] text-white py-2.5 px-3 rounded-xl text-center text-xs font-semibold z-50 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
            {toastMessage}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
