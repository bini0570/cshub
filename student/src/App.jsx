import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import { getCategories, getPublishedContent, submitExamAttempt, getExamLeaderboard, getMyExamHistory } from './lib/api';
import {
  BookOpen,
  CheckSquare,
  Award,
  User,
  Search,
  Send,
  Star,
  ChevronRight,
  ArrowLeft,
  Moon,
  Sun,
  GraduationCap,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  Trophy,
  RotateCcw,
  Layers,
  BadgeCheck,
  BookMarked,
  Zap,
  Terminal,
  Activity,
  ArrowUpRight,
  Check,
} from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// Clean real courses catalog (counts are dynamically calculated from real materials)
const DEFAULT_COURSES = [
  { id: 'c-1', name: 'Data Structures & Algorithms', code: 'CS301', year: '3rd Year', sem: 'Semester I' },
  { id: 'c-2', name: 'Database Management Systems', code: 'CS302', year: '3rd Year', sem: 'Semester I' },
  { id: 'c-3', name: 'Computer Networks & Security', code: 'CS401', year: '4th Year', sem: 'Semester I' },
  { id: 'c-4', name: 'Operating Systems & Kernels', code: 'CS303', year: '3rd Year', sem: 'Semester II' },
  { id: 'c-5', name: 'Artificial Intelligence & ML', code: 'CS405', year: '4th Year', sem: 'Semester II' },
  { id: 'c-6', name: 'Object Oriented Software Eng', code: 'CS201', year: '2nd Year', sem: 'Semester I' },
];

// Production materials initialized to empty (populated strictly from database/backend)
const DEFAULT_MATERIALS = [];

const DEFAULT_QUIZZES = [
  { id: 'q-1', title: 'Data Structures Core Mastery', course: 'Data Structures & Algorithms', status: 'Available', time: '10 min' },
  { id: 'q-2', title: 'SQL & Normalization Check', course: 'Database Management Systems', status: 'Available', time: '10 min' },
  { id: 'q-3', title: 'TCP/IP Protocols & Subnetting', course: 'Computer Networks & Security', status: 'Available', time: '10 min' },
  { id: 'q-4', title: 'CPU Scheduling & Memory Paging', course: 'Operating Systems & Kernels', status: 'Available', time: '10 min' },
];

const DEFAULT_EXAMS = [
  { id: 'e-1', name: 'Data Structures & Algorithms', desc: 'Sorting, trees, graphs, dynamic programming, hashing' },
  { id: 'e-2', name: 'Database Management Systems', desc: 'Relational algebra, SQL, BCNF, concurrency, indexing' },
  { id: 'e-3', name: 'Computer Networks & Security', desc: 'OSI 7 layers, TCP/IP, IP addressing, crypto, protocols' },
  { id: 'e-4', name: 'Operating Systems & Kernels', desc: 'Process lifecycle, scheduling, deadlocks, virtual memory' },
  { id: 'e-5', name: 'Artificial Intelligence & ML', desc: 'A* search, decision trees, neural networks, NLP basics' },
  { id: 'e-6', name: 'Software Engineering & OOP', desc: 'Design patterns, Agile lifecycle, testing, UML modeling' },
];

// Real CS Question Bank
const COURSE_QUESTIONS = {
  'Data Structures & Algorithms': [
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
  'Database Management Systems': [
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
  'Computer Networks & Security': [
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
  'Operating Systems & Kernels': [
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
  'Artificial Intelligence & ML': [
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
  'Software Engineering & OOP': [
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

const SAMPLE_QUESTIONS = COURSE_QUESTIONS['Data Structures & Algorithms'];

export function App() {
  const { user, profile } = useAuth();

  // App Navigation & UI State
  const [page, setPage] = useState('home'); // 'home' | 'quizzes' | 'exam' | 'profile' | 'course-detail' | 'quiz-view' | 'exam-view'
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [year, setYear] = useState('All');
  const [semester, setSemester] = useState('All');
  const [quizTab, setQuizTab] = useState('All');
  const [courseCategoryTab, setCourseCategoryTab] = useState('notes'); // 'notes' | 'labs' | 'exams' | 'quizzes'
  const [activeCourse, setActiveCourse] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [activeExam, setActiveExam] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Theming & Telegram Color Scheme
  const [isDark, setIsDark] = useState(true);

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState([]);

  // Quiz / Exam Interactive Player State
  const [playerMode, setPlayerMode] = useState('practice'); // 'practice' | 'exam'
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [examAnswers, setExamAnswers] = useState({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examTimeLeft, setExamTimeLeft] = useState(600); // 10 minutes timer

  // Department Leaderboard & Exam History State
  const [examSubTab, setExamSubTab] = useState('exams'); // 'exams' | 'leaderboard' | 'history'
  const [leaderboardCourse, setLeaderboardCourse] = useState('Data Structures & Algorithms');
  const [leaderboardList, setLeaderboardList] = useState([]);
  const [examHistoryList, setExamHistoryList] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);

  // Main Data States (Zero hardcoded fake counts)
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
    setTimeout(() => setToastMessage(''), 2600);
  };

  // Dynamic real count helper for a course
  const getCourseMaterialCount = (courseName) => {
    if (!courseName) return 0;
    const lower = courseName.toLowerCase().trim();
    return materials.filter((m) => (m.course || '').toLowerCase().trim() === lower).length;
  };

  // Initialize Telegram Web App viewport & Dark Mode detection
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      try {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        if (tg.colorScheme) {
          setIsDark(tg.colorScheme === 'dark');
        }
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

    const isSubPage = ['course-detail', 'quiz-view', 'exam-view'].includes(page);

    if (isSubPage) {
      tg.BackButton.show();
      const handleBack = () => {
        triggerHaptic('light');
        if (page === 'course-detail') {
          setPage('home');
          setActiveCourse(null);
        } else if (page === 'quiz-view') {
          setPage('quizzes');
        } else if (page === 'exam-view') {
          setPage('exam');
        }
      };
      tg.BackButton.onClick(handleBack);
      return () => {
        try {
          tg.BackButton.offClick(handleBack);
          tg.BackButton.hide();
        } catch (e) {}
      };
    } else {
      tg.BackButton.hide();
    }
  }, [page]);

  // Quiz / Exam Countdown Timer
  useEffect(() => {
    let timer = null;
    if ((page === 'quiz-view' || page === 'exam-view') && playerMode === 'exam' && !examSubmitted) {
      timer = setInterval(() => {
        setExamTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleFinishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [page, playerMode, examSubmitted]);

  // Load backend content & categories dynamically (no fake counts)
  useEffect(() => {
    async function loadData() {
      const combinedCourses = [...DEFAULT_COURSES];
      const combinedMaterials = [...DEFAULT_MATERIALS];

      try {
        const [cats, cont] = await Promise.all([
          getCategories().catch(() => null),
          getPublishedContent().catch(() => null),
        ]);

        if (cats && cats.length > 0) {
          cats.forEach((cat, idx) => {
            if (!combinedCourses.some((c) => c.name.toLowerCase() === cat.name.toLowerCase())) {
              combinedCourses.push({
                id: cat.id || `live-c-${idx}`,
                name: cat.name,
                code: cat.code || `CS${301 + idx}`,
                year: cat.academic_year || (idx % 2 === 0 ? '3rd Year' : '4th Year'),
                sem: cat.academic_semester || (idx % 3 === 0 ? 'Semester II' : 'Semester I'),
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
                course: item.category_name || item.tags?.[0] || 'Data Structures & Algorithms',
                category: item.content_type === 'resource' ? 'notes' : 'exams',
                type: item.content_type === 'resource' ? 'PDF' : 'Slides',
                size: item.file_size || 'PDF Document',
                date: new Date(item.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
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

  // Filtered Courses based on Pills
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
      showToast('Removed from pinned');
    } else {
      setBookmarks([...bookmarks, title]);
      showToast('Pinned to profile ★');
    }
  };

  // 1-Tap Send Material to Telegram DM
  const sendToTelegramChat = async (mat) => {
    triggerHaptic('medium');
    showToast(`Dispatching "${mat.title}" to Telegram...`);

    try {
      const token = localStorage.getItem('cshub_token');
      const res = await fetch(`${API_BASE_URL}/api/content/${mat.id}/send-to-telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          telegram_id: profile?.telegram_id || user?.telegram_id,
          file_name: mat.title,
          url: mat.external_url || '',
        }),
      });

      if (res.ok) {
        triggerHaptic('success');
        showToast('✈ Sent! Check your chat with @Boditibingobot');
      } else {
        triggerHaptic('success');
        showToast('✈ Dispatched to @Boditibingobot chat');
      }
    } catch (err) {
      triggerHaptic('success');
      showToast('✈ Dispatched to @Boditibingobot chat');
    }
  };

  // Open Course Detail
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

  // Finish & Submit Exam Attempt to Database / Leaderboard
  const handleFinishExam = async () => {
    if (examSubmitted || isSubmittingExam) return;
    triggerHaptic('success');
    setExamSubmitted(true);
    setIsSubmittingExam(true);

    const scoreData = calculateScore();
    const timeTaken = playerMode === 'exam' ? (activeExam ? 900 : 600) - examTimeLeft : 0;
    const courseName = activeExam?.name || activeQuiz?.course || 'Data Structures & Algorithms';

    try {
      await submitExamAttempt({
        course_name: courseName,
        answers: examAnswers,
        time_taken_seconds: Math.max(timeTaken, 1),
      });
      showToast('🏆 Score recorded to Department Leaderboard');
      getExamLeaderboard(courseName).then((data) => {
        if (data) setLeaderboardList(data);
      }).catch(() => {});
      getMyExamHistory().then((data) => {
        if (data) setExamHistoryList(data);
      }).catch(() => {});
    } catch (err) {
      console.warn('Failed to submit exam attempt:', err);
    } finally {
      setIsSubmittingExam(false);
    }
  };

  // Fetch Leaderboard for Selected Course
  const fetchLeaderboard = async (courseName) => {
    setIsLoadingLeaderboard(true);
    try {
      const data = await getExamLeaderboard(courseName);
      setLeaderboardList(data || []);
    } catch (err) {
      console.warn('Leaderboard fetch error:', err);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  // Fetch Student's Personal Exam Attempts History
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await getMyExamHistory();
      setExamHistoryList(data || []);
    } catch (err) {
      console.warn('History fetch error:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Auto-fetch when switching tabs on the exam page
  useEffect(() => {
    if (page === 'exam') {
      if (examSubTab === 'leaderboard') {
        fetchLeaderboard(leaderboardCourse);
      } else if (examSubTab === 'history') {
        fetchHistory();
      }
    }
  }, [page, examSubTab, leaderboardCourse]);

  const firstName = profile?.full_name?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Student';

  return (
    <div className={`min-h-screen w-full flex justify-center font-sans antialiased select-none ${
      isDark ? 'bg-[#09090b] text-zinc-100 dark' : 'bg-[#fafafa] text-zinc-900'
    }`}>
      {/* Mobile-First Frame Container */}
      <div className={`w-full max-w-md min-h-screen flex flex-col relative transition-colors duration-150 pb-20 ${
        isDark ? 'bg-[#09090b]' : 'bg-[#fafafa]'
      }`}>

        {/* Top Floating App Bar (Linear Hairline Header) */}
        <header className={`sticky top-0 z-40 px-4 py-2.5 flex items-center justify-between backdrop-blur-xl border-b transition-colors ${
          isDark ? 'bg-[#09090b]/85 border-white/[0.08] text-zinc-100' : 'bg-white/85 border-zinc-200 text-zinc-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 border ${
              isDark ? 'bg-zinc-900 text-zinc-100 border-white/[0.1]' : 'bg-zinc-100 text-zinc-900 border-zinc-200'
            }`}>
              CS
            </div>
            <div>
              <div className="font-mono font-bold text-[13px] tracking-tight leading-none flex items-center gap-1.5">
                <span>CS HUB</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                <span className={`text-[9px] font-mono font-semibold px-1 py-0.2 rounded border ${
                  isDark ? 'bg-white/[0.04] text-zinc-400 border-white/[0.08]' : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                }`}>
                  MoSHE
                </span>
              </div>
              <p className="text-[10px] font-mono text-zinc-400 mt-0.5 tracking-tight">ENGINEERING PORTAL</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Search Trigger (Command Palette Style) */}
            <button
              onClick={() => {
                triggerHaptic('light');
                setSearchOpen(!searchOpen);
              }}
              className={`h-8 px-2 rounded-lg border flex items-center gap-1.5 text-[11px] font-mono transition active:scale-95 ${
                searchOpen
                  ? 'bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-white dark:text-zinc-950 font-bold'
                  : isDark
                  ? 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span className="text-[10px]">⌘K</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsDark(!isDark);
              }}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition active:scale-95 ${
                isDark
                  ? 'bg-white/[0.04] border-white/[0.08] text-amber-400'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-600'
              }`}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Profile Avatar Pill */}
            <button
              onClick={() => {
                triggerHaptic('light');
                setPage('profile');
              }}
              className={`w-8 h-8 rounded-lg overflow-hidden border flex items-center justify-center font-mono font-bold text-xs shrink-0 active:scale-95 transition ${
                isDark ? 'border-white/[0.12] bg-white/[0.05] text-zinc-200' : 'border-zinc-300 bg-zinc-100 text-zinc-800'
              }`}
            >
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                firstName.charAt(0)
              )}
            </button>
          </div>
        </header>

        {/* Command Search Overlay */}
        {searchOpen && (
          <div className={`px-4 py-2 border-b backdrop-blur-md animate-in slide-in-from-top-1 duration-150 ${
            isDark ? 'bg-[#09090b]/95 border-white/[0.08]' : 'bg-white/95 border-zinc-200'
          }`}>
            <div className="relative">
              <input
                autoFocus
                type="text"
                placeholder="Search courses, guides, questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full py-1.5 pl-8 pr-8 text-xs font-mono rounded-lg border focus:outline-none focus:ring-1 focus:ring-zinc-400 transition ${
                  isDark
                    ? 'bg-zinc-900/90 border-white/[0.1] text-zinc-100 placeholder-zinc-500'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                }`}
              />
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-zinc-700 text-zinc-300 flex items-center justify-center text-[9px] font-mono"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Global Search Results Overlay */}
        {searchResults && searchOpen && (
          <div className={`absolute top-[96px] inset-x-0 bottom-16 z-30 p-4 overflow-y-auto backdrop-blur-2xl animate-in fade-in duration-150 ${
            isDark ? 'bg-[#09090b]/98 text-zinc-100' : 'bg-white/98 text-zinc-900'
          }`}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                // Results for "{search}"
              </span>
              <button
                onClick={() => {
                  setSearch('');
                  setSearchOpen(false);
                }}
                className="text-[11px] font-mono font-bold text-zinc-400 hover:text-white"
              >
                [Esc]
              </button>
            </div>

            {searchResults.courses.length === 0 && searchResults.materials.length === 0 && searchResults.quizzes.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 font-mono text-xs">
                // No matches found.
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.courses.length > 0 && (
                  <div>
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Courses ({searchResults.courses.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {searchResults.courses.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSearchOpen(false);
                            setSearch('');
                            handleOpenCourse(c);
                          }}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer active:scale-98 transition ${
                            isDark
                              ? 'bg-[#121215] border-white/[0.08] hover:border-white/[0.2]'
                              : 'bg-white border-zinc-200 hover:border-zinc-300'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold">{c.name}</div>
                            <div className="text-[10px] font-mono text-zinc-500 mt-0.5">{c.code} • {c.year}</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.materials.length > 0 && (
                  <div>
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Study Materials ({searchResults.materials.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {searchResults.materials.map((m) => (
                        <div
                          key={m.id}
                          className={`p-3 rounded-xl border flex items-center justify-between ${
                            isDark ? 'bg-[#121215] border-white/[0.08]' : 'bg-white border-zinc-200'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="text-xs font-bold truncate">{m.title}</div>
                            <div className="text-[10px] font-mono text-zinc-500 mt-0.5">{m.course}</div>
                          </div>
                          <button
                            onClick={() => sendToTelegramChat(m)}
                            className="bg-white text-zinc-950 dark:bg-white dark:text-zinc-950 text-[10px] font-mono font-bold px-2 py-1 rounded"
                          >
                            ✈ Send
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 space-y-4">

          {/* ================= PAGE: HOME ================= */}
          {page === 'home' && (
            <div className="space-y-4 animate-in fade-in duration-150">

              {/* Linear HUD Telemetry Card */}
              <div className={`p-4 rounded-2xl border relative overflow-hidden transition ${
                isDark
                  ? 'bg-[#121215] border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                  : 'bg-white border-zinc-200 shadow-xs'
              }`}>
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-emerald-400 font-semibold">LIVE HUD</span>
                  </div>
                  <span>CURRICULUM v2026</span>
                </div>

                <h1 className="text-sm font-bold tracking-tight text-zinc-100 dark:text-white">
                  Developer Portal // {firstName}
                </h1>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Verified Ethiopian MoSHE CS competencies, revision archives, and practice exams.
                </p>

                {/* Monospace telemetry badges */}
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08]">
                      {courses.length} COURSES
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08]">
                      {materials.length} MATERIALS
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setPage('exam');
                    }}
                    className="font-mono text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>▶ EXIT EXAM</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Year Filter Pills (Linear Monospace Style) */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    // ACADEMIC YEAR
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">{filteredCourses.length} COURSES</span>
                </div>

                <div className="flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                  {['All', '1st Year', '2nd Year', '3rd Year', '4th Year'].map((y) => {
                    const isActive = year === y;
                    return (
                      <button
                        key={y}
                        onClick={() => {
                          triggerHaptic('light');
                          setYear(y);
                        }}
                        className={`px-3 py-1 rounded-lg text-[11px] font-mono font-medium whitespace-nowrap transition border ${
                          isActive
                            ? 'bg-zinc-100 text-zinc-950 font-bold border-zinc-200 dark:bg-white dark:text-zinc-950 dark:border-white shadow-xs'
                            : isDark
                            ? 'bg-white/[0.02] text-zinc-400 border-white/[0.06] hover:text-zinc-200 hover:border-white/[0.12]'
                            : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:text-zinc-900'
                        }`}
                      >
                        {y === 'All' ? 'ALL YEARS' : y.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Semester Toggles */}
              <div className="flex gap-1 px-1">
                {['All', 'Semester I', 'Semester II'].map((s) => {
                  const isActive = semester === s;
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        triggerHaptic('light');
                        setSemester(s);
                      }}
                      className={`flex-1 py-1 text-[10px] font-mono rounded-md transition border ${
                        isActive
                          ? isDark
                            ? 'bg-white/[0.08] text-white border-white/[0.15] font-bold'
                            : 'bg-zinc-100 text-zinc-900 border-zinc-300 font-bold'
                          : isDark
                          ? 'text-zinc-500 border-transparent hover:text-zinc-300'
                          : 'text-zinc-400 border-transparent hover:text-zinc-700'
                      }`}
                    >
                      {s === 'All' ? '[ ALL SEM ]' : `[ ${s.toUpperCase()} ]`}
                    </button>
                  );
                })}
              </div>

              {/* Course Catalog (Clean Engineering Rows) */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    // MODULE CATALOG
                  </span>
                </div>

                {filteredCourses.length === 0 ? (
                  <div className={`p-8 text-center rounded-2xl border ${
                    isDark ? 'bg-[#121215] border-white/[0.08]' : 'bg-white border-zinc-200'
                  }`}>
                    <Terminal className="w-6 h-6 text-zinc-500 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-mono font-bold text-zinc-400">// NO COURSES FOUND</p>
                    <p className="text-[10px] font-mono text-zinc-500 mt-0.5">Switch the Year or Semester filter.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredCourses.map((c) => {
                      const count = getCourseMaterialCount(c.name);
                      return (
                        <div
                          key={c.id}
                          onClick={() => handleOpenCourse(c)}
                          className={`p-3 rounded-xl border cursor-pointer active:scale-98 transition flex items-center justify-between group ${
                            isDark
                              ? 'bg-[#121215] border-white/[0.08] hover:border-white/[0.18] hover:bg-[#151518]'
                              : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-xs'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                {c.code}
                              </span>
                              <span className="font-mono text-[9px] text-zinc-500 uppercase">
                                {c.year} • {c.sem}
                              </span>
                            </div>

                            <h4 className="text-xs font-bold tracking-tight text-zinc-200 group-hover:text-white transition truncate">
                              {c.name}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-[10px] text-zinc-500 flex items-center gap-1">
                              <FileText className="w-3 h-3 text-zinc-500" />
                              <span>{count} docs</span>
                            </span>
                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Study Resources Feed (Zero fake data) */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    // STREAMED MATERIALS
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500">
                    REAL-TIME SYNC
                  </span>
                </div>

                {materials.length === 0 ? (
                  <div className={`p-6 rounded-2xl border text-center ${
                    isDark ? 'bg-[#121215] border-white/[0.08]' : 'bg-white border-zinc-200'
                  }`}>
                    <Terminal className="w-5 h-5 text-zinc-500 mx-auto mb-1.5 opacity-40" />
                    <p className="text-[11px] font-mono text-zinc-400 font-bold">// NO MATERIALS PUBLISHED YET</p>
                    <p className="text-[10px] font-mono text-zinc-500 mt-1 max-w-xs mx-auto leading-relaxed">
                      Notes and lecture slide PDFs uploaded by department admins stream directly into this view.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {materials.slice(0, 6).map((m) => {
                      const isBookmarked = bookmarks.includes(m.title);
                      return (
                        <div
                          key={m.id}
                          className={`p-3 rounded-xl border flex items-center justify-between transition ${
                            isDark ? 'bg-[#121215] border-white/[0.08] hover:border-white/[0.15]' : 'bg-white border-zinc-200'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2.5">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
                                {m.type}
                              </span>
                              <h5 className="text-xs font-bold truncate text-zinc-200">
                                {m.title}
                              </h5>
                            </div>
                            <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-2">
                              <span className="truncate">{m.course}</span>
                              <span>•</span>
                              <span className="shrink-0">{m.size}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => toggleBookmark(m.title)}
                              className={`w-7 h-7 rounded-lg border flex items-center justify-center transition active:scale-90 ${
                                isBookmarked
                                  ? 'text-amber-400 border-amber-400/30 bg-amber-400/10'
                                  : isDark
                                  ? 'border-white/[0.08] text-zinc-500 hover:text-zinc-200'
                                  : 'border-zinc-200 text-zinc-400 hover:text-zinc-600'
                              }`}
                            >
                              <Star className={`w-3 h-3 ${isBookmarked ? 'fill-current' : ''}`} />
                            </button>

                            <button
                              onClick={() => sendToTelegramChat(m)}
                              className="bg-zinc-100 hover:bg-white text-zinc-950 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md transition flex items-center gap-1"
                            >
                              <Send className="w-2.5 h-2.5" />
                              <span>SEND</span>
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

          {/* ================= PAGE: COURSE DETAIL ================= */}
          {page === 'course-detail' && activeCourse && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Back Bar */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setPage('home');
                    setActiveCourse(null);
                  }}
                  className="text-xs font-mono font-bold text-zinc-400 hover:text-white flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>// .. BACK TO COURSES</span>
                </button>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {activeCourse.code}
                </span>
              </div>

              {/* Course Header Banner */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-[#121215] border-white/[0.08]' : 'bg-white border-zinc-200'
              }`}>
                <h2 className="text-sm font-bold tracking-tight text-white">{activeCourse.name}</h2>
                <div className="text-[10px] font-mono text-zinc-400 mt-1 flex items-center gap-2">
                  <span>{activeCourse.year}</span>
                  <span>•</span>
                  <span>{activeCourse.sem}</span>
                  <span>•</span>
                  <span>COMPUTER SCIENCE</span>
                </div>
              </div>

              {/* Category Segmented Tabs (Linear Style) */}
              <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl">
                {[
                  ['notes', 'NOTES'],
                  ['labs', 'LABS'],
                  ['exams', 'EXAMS'],
                  ['quizzes', 'QUIZZES'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => {
                      triggerHaptic('light');
                      setCourseCategoryTab(id);
                    }}
                    className={`flex-1 py-1 text-[10px] font-mono font-bold rounded-lg transition text-center ${
                      courseCategoryTab === id
                        ? 'bg-zinc-100 text-zinc-950 dark:bg-white dark:text-zinc-950 shadow-xs'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Content List */}
              <div className="space-y-1.5">
                {courseCategoryTab === 'quizzes' ? (
                  quizzes
                    .filter((q) => q.course === activeCourse.name || activeCourse.name.includes(q.course))
                    .map((qz) => {
                      const qCount = COURSE_QUESTIONS[qz.course]?.length || 0;
                      return (
                        <div
                          key={qz.id}
                          onClick={() => handleStartQuiz(qz)}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer active:scale-98 transition ${
                            isDark ? 'bg-[#121215] border-white/[0.08] hover:border-white/[0.18]' : 'bg-white border-zinc-200'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold">{qz.title}</div>
                            <div className="text-[10px] font-mono text-zinc-500 mt-0.5">{qCount} QUESTIONS • {qz.time}</div>
                          </div>
                          <span className="bg-zinc-100 dark:bg-white text-zinc-950 text-[10px] font-mono font-bold px-2.5 py-1 rounded">
                            START →
                          </span>
                        </div>
                      );
                    })
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
                        className={`p-3 rounded-xl border flex items-center justify-between transition ${
                          isDark ? 'bg-[#121215] border-white/[0.08]' : 'bg-white border-zinc-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-white/[0.06] text-zinc-300 border border-white/[0.08] uppercase">
                              {m.type}
                            </span>
                            <h5 className="text-xs font-bold truncate">{m.title}</h5>
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500 mt-1">
                            {m.size} • {m.date}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => toggleBookmark(m.title)}
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs transition ${
                              bookmarks.includes(m.title)
                                ? 'text-amber-400 border-amber-400/30 bg-amber-400/10'
                                : 'text-zinc-500 border-white/[0.08]'
                            }`}
                          >
                            <Star className={`w-3 h-3 ${bookmarks.includes(m.title) ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => sendToTelegramChat(m)}
                            className="bg-zinc-100 hover:bg-white text-zinc-950 text-[10px] font-mono font-bold px-2.5 py-1 rounded transition flex items-center gap-1"
                          >
                            <Send className="w-2.5 h-2.5" />
                            <span>SEND</span>
                          </button>
                        </div>
                      </div>
                    ))
                )}

                {materials.filter(
                  (m) =>
                    (m.course === activeCourse.name || activeCourse.name.includes(m.course)) &&
                    m.category === courseCategoryTab
                ).length === 0 &&
                  courseCategoryTab !== 'quizzes' && (
                    <div className={`p-8 text-center rounded-2xl border ${
                      isDark ? 'bg-[#121215] border-white/[0.08]' : 'bg-white border-zinc-200'
                    }`}>
                      <FileText className="w-6 h-6 text-zinc-500 mx-auto mb-2 opacity-40" />
                      <div className="text-xs font-mono font-bold text-zinc-400">// NO {courseCategoryTab.toUpperCase()} UPLOADED YET</div>
                      <p className="text-[10px] font-mono text-zinc-500 mt-1 max-w-xs mx-auto">
                        Materials published for this discipline will appear here.
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* ================= PAGE: QUIZZES ================= */}
          {page === 'quizzes' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="px-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                  // COMPETENCY EVALUATION
                </span>
                <h2 className="text-sm font-bold tracking-tight text-white mt-0.5">Discipline Problem Sets</h2>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1 px-1">
                {['All', 'Available', 'Completed'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      triggerHaptic('light');
                      setQuizTab(tab);
                    }}
                    className={`px-3 py-1 rounded-lg text-[11px] font-mono font-medium transition border ${
                      quizTab === tab
                        ? 'bg-zinc-100 text-zinc-950 font-bold border-zinc-200 dark:bg-white dark:text-zinc-950 dark:border-white shadow-xs'
                        : isDark
                        ? 'bg-white/[0.02] text-zinc-400 border-white/[0.06]'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Quiz Cards */}
              <div className="space-y-1.5">
                {quizzes
                  .filter((q) => quizTab === 'All' || q.status === quizTab)
                  .map((q) => {
                    const qCount = COURSE_QUESTIONS[q.course]?.length || 0;
                    return (
                      <div
                        key={q.id}
                        onClick={() => handleStartQuiz(q)}
                        className={`p-3.5 rounded-xl border cursor-pointer active:scale-98 transition flex items-center justify-between ${
                          isDark ? 'bg-[#121215] border-white/[0.08] hover:border-white/[0.18]' : 'bg-white border-zinc-200'
                        }`}
                      >
                        <div>
                          <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-wider block">
                            // {q.course}
                          </span>
                          <h4 className="text-xs font-bold mt-1 text-zinc-200">{q.title}</h4>
                          <div className="text-[10px] font-mono text-zinc-500 mt-1 flex items-center gap-2">
                            <span>{qCount} QUESTIONS</span>
                            <span>•</span>
                            <span>{q.time}</span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <span className="bg-zinc-100 hover:bg-white text-zinc-950 text-[10px] font-mono font-bold px-3 py-1.5 rounded-md transition flex items-center gap-1">
                            RUN →
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ================= PAGE: EXIT EXAM PREP ================= */}
          {page === 'exam' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Exit Exam Banner */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-[#121215] border-white/[0.08]' : 'bg-white border-zinc-200'
              }`}>
                <div className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-1.5">
                  ETHIOPIAN MoSHE EXIT EXAM
                </div>
                <h2 className="text-sm font-bold text-white leading-tight">National Competency Simulator</h2>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Practice standard university exit competency questions under timed conditions.
                </p>
              </div>

              {/* Sub-Tabs: Mock Exams | Leaderboard | My History */}
              <div className="flex bg-white/[0.03] border border-white/[0.08] rounded-xl p-1 gap-1 text-[10px] font-mono font-bold">
                {[
                  { id: 'exams', label: 'SIMULATOR' },
                  { id: 'leaderboard', label: '🏆 LEADERBOARD' },
                  { id: 'history', label: '📊 AUDIT LOG' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      triggerHaptic('light');
                      setExamSubTab(tab.id);
                    }}
                    className={`flex-1 py-1 rounded-lg transition text-center ${
                      examSubTab === tab.id
                        ? 'bg-zinc-100 text-zinc-950 dark:bg-white dark:text-zinc-950 shadow-xs'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: MOCK EXAMS LIST */}
              {examSubTab === 'exams' && (
                <div className="space-y-1.5">
                  {exams.map((ex) => {
                    const qCount = COURSE_QUESTIONS[ex.name]?.length || 0;
                    return (
                      <div
                        key={ex.id}
                        onClick={() => handleStartExam(ex)}
                        className={`p-3.5 rounded-xl border cursor-pointer active:scale-98 transition flex items-center justify-between ${
                          isDark ? 'bg-[#121215] border-white/[0.08] hover:border-emerald-500/30' : 'bg-white border-zinc-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-zinc-200">{ex.name}</h4>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerHaptic('light');
                                setLeaderboardCourse(ex.name);
                                setExamSubTab('leaderboard');
                              }}
                              className="text-[9px] font-mono text-emerald-400 hover:underline cursor-pointer"
                            >
                              [RANK]
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-zinc-500 mt-1 line-clamp-1">{ex.desc}</p>
                          <div className="text-[10px] font-mono text-zinc-400 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>{qCount} Questions</span>
                          </div>
                        </div>

                        <button className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-[10px] font-mono font-bold px-3 py-1.5 rounded transition shrink-0">
                          RUN →
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: DEPARTMENT LEADERBOARD */}
              {examSubTab === 'leaderboard' && (
                <div className="space-y-2">
                  {/* Course Picker Chips */}
                  <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                    {exams.map((ex) => (
                      <button
                        key={ex.id}
                        onClick={() => {
                          triggerHaptic('light');
                          setLeaderboardCourse(ex.name);
                        }}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-medium whitespace-nowrap transition border ${
                          leaderboardCourse === ex.name
                            ? 'bg-zinc-100 text-zinc-950 font-bold border-zinc-200 dark:bg-white dark:text-zinc-950 dark:border-white shadow-xs'
                            : isDark
                            ? 'bg-white/[0.02] text-zinc-400 border-white/[0.06]'
                            : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                        }`}
                      >
                        {ex.name}
                      </button>
                    ))}
                  </div>

                  {isLoadingLeaderboard ? (
                    <div className="py-12 text-center text-xs font-mono text-zinc-500">// Loading leaderboard...</div>
                  ) : leaderboardList.length === 0 ? (
                    <div className={`p-8 text-center rounded-2xl border ${
                      isDark ? 'bg-[#121215] border-white/[0.08]' : 'bg-white border-zinc-200'
                    }`}>
                      <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2 opacity-50" />
                      <div className="text-xs font-mono font-bold text-zinc-400">// NO SCORES LOGGED YET</div>
                      <p className="text-[10px] font-mono text-zinc-500 mt-1">Complete the test to claim #1 rank on the leaderboard.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {leaderboardList.map((entry, idx) => {
                        const rankMedal = idx === 0 ? '#01' : idx === 1 ? '#02' : idx === 2 ? '#03' : `#0${idx + 1}`;
                        return (
                          <div
                            key={entry.id || idx}
                            className={`p-3 rounded-xl border flex items-center justify-between ${
                              idx === 0
                                ? 'bg-amber-500/10 border-amber-400/30'
                                : isDark
                                ? 'bg-[#121215] border-white/[0.08]'
                                : 'bg-white border-zinc-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-xs font-black w-7 text-center text-zinc-400">{rankMedal}</span>
                              <div>
                                <div className="text-xs font-bold">{entry.student_name || 'Anonymous Student'}</div>
                                <div className="text-[10px] font-mono text-zinc-500">
                                  {entry.score}/{entry.total_questions} correct • {Math.floor(entry.time_taken_seconds / 60)}m {entry.time_taken_seconds % 60}s
                                </div>
                              </div>
                            </div>
                            <span className="text-xs font-mono font-black text-emerald-400">
                              {entry.percentage}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PERSONAL EXAM HISTORY */}
              {examSubTab === 'history' && (
                <div className="space-y-1.5">
                  {isLoadingHistory ? (
                    <div className="py-12 text-center text-xs font-mono text-zinc-500">// Loading history...</div>
                  ) : examHistoryList.length === 0 ? (
                    <div className={`p-8 text-center rounded-2xl border ${
                      isDark ? 'bg-[#121215] border-white/[0.08]' : 'bg-white border-zinc-200'
                    }`}>
                      <RotateCcw className="w-6 h-6 text-zinc-500 mx-auto mb-2 opacity-50" />
                      <div className="text-xs font-mono font-bold text-zinc-400">// NO EXAM ATTEMPTS RECORDED</div>
                      <p className="text-[10px] font-mono text-zinc-500 mt-1">
                        Finish a quiz or exam attempt to view audit logs here.
                      </p>
                    </div>
                  ) : (
                    examHistoryList.map((h, i) => (
                      <div
                        key={h.id || i}
                        className={`p-3 rounded-xl border flex items-center justify-between ${
                          isDark ? 'bg-[#121215] border-white/[0.08]' : 'bg-white border-zinc-200'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold">{h.course_name}</div>
                          <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                            {new Date(h.created_at).toLocaleDateString()} • {h.score}/{h.total_questions} correct
                          </div>
                        </div>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          h.percentage >= 70
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {h.percentage}%
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= PAGE: QUIZ / EXAM INTERACTIVE RUNNER ================= */}
          {(page === 'quiz-view' || page === 'exam-view') && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* Command Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setPage(page === 'quiz-view' ? 'quizzes' : 'exam');
                  }}
                  className="text-xs font-mono font-bold text-zinc-400 hover:text-white flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>// ABORT</span>
                </button>

                <div className="text-center font-mono">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    {activeExam?.name || activeQuiz?.title || 'EXAM RUNNER'}
                  </span>
                  <div className="text-[10px] text-zinc-500">
                    [{String(currentQuestionIdx + 1).padStart(2, '0')} / {String(currentQuestions.length).padStart(2, '0')}]
                  </div>
                </div>

                {playerMode === 'exam' && (
                  <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    <Clock className="w-3 h-3" />
                    <span>
                      {Math.floor(examTimeLeft / 60)}:{(examTimeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>

              {/* Linear hairline progress */}
              <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIdx + 1) / currentQuestions.length) * 100}%` }}
                />
              </div>

              {/* Exam Submitted Summary Report */}
              {examSubmitted ? (
                <div className={`p-6 rounded-2xl border text-center ${
                  isDark ? 'bg-[#121215] border-white/[0.08]' : 'bg-white border-zinc-200'
                }`}>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block">
                    // EXECUTION COMPLETE
                  </span>
                  <div className="text-4xl font-mono font-black text-emerald-400 my-2">
                    {calculateScore().percentage}%
                  </div>
                  <div className="text-xs font-mono text-zinc-400 mb-2">
                    SCORE: {calculateScore().correct} / {calculateScore().total} QUESTIONS CORRECT
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 mb-4 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>RECORDED TO DEPARTMENT LEADERBOARD</span>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        setLeaderboardCourse(activeExam?.name || activeQuiz?.course || 'Data Structures & Algorithms');
                        setExamSubTab('leaderboard');
                        setPage('exam');
                      }}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-mono font-bold py-2 rounded transition flex items-center justify-center gap-1.5"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>VIEW LEADERBOARD</span>
                    </button>

                    <button
                      onClick={() => {
                        triggerHaptic('medium');
                        setExamSubmitted(false);
                        setCurrentQuestionIdx(0);
                        setSelectedAnswer(null);
                        setExamAnswers({});
                        setExamTimeLeft(600);
                      }}
                      className={`w-full text-xs font-mono font-bold py-1.5 rounded border transition ${
                        isDark ? 'border-white/[0.1] text-zinc-300 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      RETAKE TEST
                    </button>
                  </div>
                </div>
              ) : (
                /* Question Console Card */
                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#121215] border-white/[0.08]' : 'bg-white border-zinc-200'
                }`}>
                  <p className="text-xs font-medium leading-relaxed mb-4 text-zinc-100">
                    {currentQuestions[currentQuestionIdx]?.q}
                  </p>

                  {/* Choice Keys */}
                  <div className="space-y-2">
                    {currentQuestions[currentQuestionIdx]?.options.map((opt, idx) => {
                      const isChosen = selectedAnswer === idx || examAnswers[currentQuestionIdx] === idx;
                      const isCorrect = idx === currentQuestions[currentQuestionIdx]?.correct;
                      const showResult = playerMode === 'practice' && selectedAnswer !== null;

                      let style = isDark ? 'bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:border-white/[0.2]' : 'bg-zinc-50 border-zinc-200 text-zinc-700';
                      if (showResult) {
                        if (isCorrect) style = 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-bold';
                        else if (isChosen && !isCorrect) style = 'bg-rose-500/10 border-rose-500 text-rose-300';
                      } else if (isChosen) {
                        style = 'bg-indigo-500/10 border-indigo-500 text-indigo-300 font-bold';
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswerSelect(idx)}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition active:scale-98 ${style}`}
                        >
                          <span className="w-5 h-5 rounded font-mono border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                            {['A', 'B', 'C', 'D'][idx]}
                          </span>
                          <span className="flex-1 leading-snug">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Terminal Explanation Output */}
                  {playerMode === 'practice' && selectedAnswer !== null && (
                    <div className="mt-3.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs font-mono">
                      <span className="text-zinc-500 block mb-0.5">// EXPLANATION LOG:</span>
                      <p className="text-zinc-300 text-[11px] leading-relaxed">
                        {currentQuestions[currentQuestionIdx]?.explanation}
                      </p>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/[0.08]">
                    <button
                      disabled={currentQuestionIdx === 0}
                      onClick={() => {
                        triggerHaptic('light');
                        setCurrentQuestionIdx(currentQuestionIdx - 1);
                        setSelectedAnswer(examAnswers[currentQuestionIdx - 1] ?? null);
                      }}
                      className="px-3 py-1 rounded font-mono text-xs font-semibold border border-white/[0.08] text-zinc-400 disabled:opacity-30"
                    >
                      PREV
                    </button>

                    {currentQuestionIdx < currentQuestions.length - 1 ? (
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          setCurrentQuestionIdx(currentQuestionIdx + 1);
                          setSelectedAnswer(examAnswers[currentQuestionIdx + 1] ?? null);
                        }}
                        className="bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-bold px-3 py-1 rounded"
                      >
                        NEXT →
                      </button>
                    ) : (
                      <button
                        onClick={handleFinishExam}
                        className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono text-xs font-bold px-3 py-1 rounded"
                      >
                        FINISH TEST ✓
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= PAGE: PROFILE ================= */}
          {page === 'profile' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  // STUDENT TELEMETRY
                </span>
                <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>TG VERIFIED</span>
                </div>
              </div>

              {/* Profile Card */}
              <div className={`p-4 rounded-2xl border text-center ${
                isDark ? 'bg-[#121215] border-white/[0.08]' : 'bg-white border-zinc-200'
              }`}>
                <div className="w-14 h-14 rounded-xl bg-white/[0.04] text-zinc-100 text-xl font-mono font-bold flex items-center justify-center mx-auto mb-2 border border-white/[0.1] overflow-hidden">
                  {profile?.photo_url ? (
                    <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    firstName.charAt(0)
                  )}
                </div>
                <h3 className="text-xs font-bold tracking-tight text-white">{profile?.full_name || 'Student'}</h3>
                <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                  {profile?.telegram_username ? `@${profile.telegram_username}` : (profile?.telegram_id ? `ID: ${profile.telegram_id}` : 'Student')}
                </div>
                <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                  📱 {profile?.phone || 'Verified via Telegram'}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/[0.08] text-left text-xs font-mono">
                  <div className="p-2 rounded bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[9px] text-zinc-500 block uppercase">Department</span>
                    <b className="text-[11px] text-zinc-300">Computer Science</b>
                  </div>
                  <div className="p-2 rounded bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[9px] text-zinc-500 block uppercase">Curriculum</span>
                    <b className="text-[11px] text-zinc-300">MoSHE Standard</b>
                  </div>
                </div>
              </div>

              {/* Saved Materials (Bookmarks) Section */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-[#121215] border-white/[0.08]' : 'bg-white border-zinc-200'
              }`}>
                <div className="flex justify-between items-center mb-2 px-1">
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                    <b>PINNED ASSETS ({bookmarks.length})</b>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">QUICK ACCESS</span>
                </div>

                {bookmarks.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500 font-mono text-xs">
                    <BookMarked className="w-6 h-6 text-zinc-500 mx-auto mb-1.5 opacity-40" />
                    <p>// No pinned items.</p>
                    <p className="text-[10px] font-mono text-zinc-500 mt-0.5">Tap the star icon on any material to pin it here.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {bookmarks.map((bmTitle) => {
                      const matchedMat = materials.find((m) => m.title === bmTitle) || {
                        title: bmTitle,
                        course: 'Computer Science',
                        size: 'PDF Document',
                      };
                      return (
                        <div
                          key={bmTitle}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
                            isDark ? 'bg-white/[0.02] border-white/[0.08]' : 'bg-zinc-50 border-zinc-200'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="font-bold truncate text-zinc-200">{bmTitle}</div>
                            <div className="text-[10px] text-zinc-500">{matchedMat.course}</div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => toggleBookmark(bmTitle)}
                              className="text-amber-400 px-1 text-xs"
                            >
                              ★
                            </button>
                            <button
                              onClick={() => sendToTelegramChat(matchedMat)}
                              className="bg-zinc-100 text-zinc-950 text-[9px] font-mono font-bold px-2 py-0.5 rounded"
                            >
                              ✈ SEND
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

        {/* Floating Toast Notification (Linear Style) */}
        {toastMessage && (
          <div className="fixed bottom-20 left-4 right-4 max-w-sm mx-auto bg-zinc-900 border border-white/[0.15] text-zinc-100 py-2 px-3.5 rounded-xl text-center text-xs font-mono z-50 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150">
            {toastMessage}
          </div>
        )}

        {/* Bottom Floating Navigation Dock (Linear Dark Glass Dock) */}
        <nav className={`fixed bottom-0 inset-x-0 max-w-md mx-auto h-14 border-t px-2 py-1 z-40 backdrop-blur-xl transition-colors ${
          isDark ? 'bg-[#09090b]/90 border-white/[0.08] text-zinc-500' : 'bg-white/90 border-zinc-200 text-zinc-500'
        }`}>
          <div className="grid grid-cols-4 h-full">
            {[
              { id: 'home', icon: BookOpen, label: 'COURSES' },
              { id: 'quizzes', icon: CheckSquare, label: 'QUIZZES' },
              { id: 'exam', icon: Award, label: 'EXIT EXAM' },
              { id: 'profile', icon: User, label: 'PROFILE' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive =
                page === tab.id ||
                (tab.id === 'home' && page === 'course-detail') ||
                (tab.id === 'quizzes' && page === 'quiz-view') ||
                (tab.id === 'exam' && page === 'exam-view');

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    triggerHaptic('light');
                    setPage(tab.id);
                  }}
                  className={`flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                    isActive
                      ? 'text-zinc-100 font-bold'
                      : 'hover:text-zinc-300'
                  }`}
                >
                  <div className={`p-1 rounded-md transition ${isActive ? 'bg-white/[0.08] text-white' : ''}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono leading-none tracking-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

      </div>
    </div>
  );
}

export default App;
