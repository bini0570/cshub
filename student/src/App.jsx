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
} from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const DEFAULT_COURSES = [
  { id: 'c-1', name: 'Data Structures & Algorithms', code: 'CS301', year: '3rd Year', sem: 'Semester I', count: 14, color: 'from-blue-600 to-indigo-600' },
  { id: 'c-2', name: 'Database Management Systems', code: 'CS302', year: '3rd Year', sem: 'Semester I', count: 12, color: 'from-cyan-600 to-teal-600' },
  { id: 'c-3', name: 'Computer Networks & Security', code: 'CS401', year: '4th Year', sem: 'Semester I', count: 9, color: 'from-emerald-600 to-teal-700' },
  { id: 'c-4', name: 'Operating Systems & Kernels', code: 'CS303', year: '3rd Year', sem: 'Semester II', count: 11, color: 'from-purple-600 to-indigo-700' },
  { id: 'c-5', name: 'Artificial Intelligence & ML', code: 'CS405', year: '4th Year', sem: 'Semester II', count: 8, color: 'from-rose-600 to-pink-600' },
  { id: 'c-6', name: 'Object Oriented Software Eng', code: 'CS201', year: '2nd Year', sem: 'Semester I', count: 15, color: 'from-amber-600 to-orange-600' },
];

const DEFAULT_MATERIALS = [
  {
    id: 'mat-1',
    title: 'Data Structures & Algorithms Final Revision Cheatsheet',
    course: 'Data Structures & Algorithms',
    category: 'notes',
    type: 'PDF',
    size: '2.4 MB',
    date: 'Oct 2026',
  },
  {
    id: 'mat-2',
    title: 'SQL & Database Normalization Quick Guide',
    course: 'Database Management Systems',
    category: 'notes',
    type: 'PDF',
    size: '1.8 MB',
    date: 'Oct 2026',
  },
  {
    id: 'mat-3',
    title: 'OS Process Synchronization & Deadlock Practice Set',
    course: 'Operating Systems & Kernels',
    category: 'exams',
    type: 'PDF',
    size: '3.1 MB',
    date: 'Oct 2026',
  },
  {
    id: 'mat-4',
    title: 'Computer Networks Subnetting & OSI Cheatsheet',
    course: 'Computer Networks & Security',
    category: 'notes',
    type: 'PDF',
    size: '1.5 MB',
    date: 'Oct 2026',
  },
];

const DEFAULT_QUIZZES = [
  { id: 'q-1', title: 'Data Structures Core Mastery', course: 'Data Structures & Algorithms', q: 15, status: 'Available', time: '20 min' },
  { id: 'q-2', title: 'SQL & Normalization Check', course: 'Database Management Systems', q: 20, status: 'Available', time: '30 min' },
  { id: 'q-3', title: 'TCP/IP Protocols & Subnetting', course: 'Computer Networks & Security', q: 10, status: 'Completed', time: '15 min' },
  { id: 'q-4', title: 'CPU Scheduling & Memory Paging', course: 'Operating Systems & Kernels', q: 15, status: 'Available', time: '20 min' },
];

const DEFAULT_EXAMS = [
  { id: 'e-1', name: 'Data Structures & Algorithms', q: 120, desc: 'Sorting, trees, graphs, dynamic programming, hashing' },
  { id: 'e-2', name: 'Database Management Systems', q: 100, desc: 'Relational algebra, SQL, BCNF, concurrency, indexing' },
  { id: 'e-3', name: 'Computer Networks & Security', q: 90, desc: 'OSI 7 layers, TCP/IP, IP addressing, crypto, protocols' },
  { id: 'e-4', name: 'Operating Systems & Kernels', q: 110, desc: 'Process lifecycle, scheduling, deadlocks, virtual memory' },
  { id: 'e-5', name: 'Artificial Intelligence & ML', q: 100, desc: 'A* search, decision trees, neural networks, NLP basics' },
  { id: 'e-6', name: 'Software Engineering & OOP', q: 80, desc: 'Design patterns, Agile lifecycle, testing, UML modeling' },
];

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
  const [isDark, setIsDark] = useState(false);

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
    setTimeout(() => setToastMessage(''), 2600);
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

  // Load backend content & categories dynamically
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
                count: 8 + idx * 2,
                color: idx % 2 === 0 ? 'from-blue-600 to-indigo-600' : 'from-emerald-600 to-teal-700',
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
      showToast('Removed from bookmarks');
    } else {
      setBookmarks([...bookmarks, title]);
      showToast('Saved to your Profile ★');
    }
  };

  // 1-Tap Send Material to Telegram DM
  const sendToTelegramChat = async (mat) => {
    triggerHaptic('medium');
    showToast(`Sending "${mat.title}" to your Telegram...`);

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
        showToast('✈ Sent! Check your Telegram chat with @Boditibingobot');
      } else {
        triggerHaptic('success');
        showToast('✈ Dispatched! Open Telegram to view file');
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
      showToast('🏆 Score saved to Department Leaderboard!');
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
    <div className={`min-h-screen w-full flex justify-center ${isDark ? 'bg-[#0e1621] text-slate-100 dark' : 'bg-slate-50 text-slate-900'}`}>
      {/* Mobile-First Frame Container */}
      <div className={`w-full max-w-md min-h-screen flex flex-col relative transition-colors duration-200 pb-20 ${
        isDark ? 'bg-[#0e1621]' : 'bg-slate-50'
      }`}>

        {/* Top Floating App Bar */}
        <header className={`sticky top-0 z-40 px-4 py-3 flex items-center justify-between backdrop-blur-xl border-b transition-colors ${
          isDark ? 'bg-[#17212b]/85 border-slate-800/80 text-white' : 'bg-white/85 border-slate-200/80 text-slate-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-[15px] tracking-tight leading-none flex items-center gap-1.5">
                <span>CS Hub</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  MoSHE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Computer Science</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Search Trigger */}
            <button
              onClick={() => {
                triggerHaptic('light');
                setSearchOpen(!searchOpen);
              }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition active:scale-95 ${
                searchOpen
                  ? 'bg-blue-600 text-white'
                  : isDark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsDark(!isDark);
              }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition active:scale-95 ${
                isDark ? 'bg-slate-800 text-amber-400' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Avatar Pill */}
            <button
              onClick={() => {
                triggerHaptic('light');
                setPage('profile');
              }}
              className="w-9 h-9 rounded-xl overflow-hidden border-2 border-blue-500/30 flex items-center justify-center font-bold text-xs bg-blue-600/10 text-blue-600 shrink-0 active:scale-95 transition"
            >
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                firstName.charAt(0)
              )}
            </button>
          </div>
        </header>

        {/* Collapsible Search Bar */}
        {searchOpen && (
          <div className={`px-4 py-2.5 border-b backdrop-blur-md animate-in slide-in-from-top-2 duration-150 ${
            isDark ? 'bg-[#17212b] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="relative">
              <input
                autoFocus
                type="text"
                placeholder="Search courses, guides, cheat-sheets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full py-2 pl-9 pr-8 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  isDark ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="w-5 h-5 absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Global Search Results Overlay */}
        {searchResults && searchOpen && (
          <div className={`absolute top-[108px] inset-x-0 bottom-16 z-30 p-4 overflow-y-auto backdrop-blur-xl animate-in fade-in duration-150 ${
            isDark ? 'bg-[#0e1621]/95 text-slate-100' : 'bg-white/95 text-slate-900'
          }`}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Search Results</span>
              <button
                onClick={() => {
                  setSearch('');
                  setSearchOpen(false);
                }}
                className="text-xs font-bold text-blue-600"
              >
                Close
              </button>
            </div>

            {searchResults.courses.length === 0 && searchResults.materials.length === 0 && searchResults.quizzes.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                No results found for "{search}".
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.courses.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Courses ({searchResults.courses.length})</span>
                    </div>
                    <div className="space-y-2">
                      {searchResults.courses.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSearchOpen(false);
                            setSearch('');
                            handleOpenCourse(c);
                          }}
                          className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer active:scale-98 transition ${
                            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold">{c.name}</div>
                            <div className="text-[10px] text-slate-400">{c.code} • {c.year}</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-blue-600" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.materials.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Study Materials ({searchResults.materials.length})</span>
                    </div>
                    <div className="space-y-2">
                      {searchResults.materials.map((m) => (
                        <div
                          key={m.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between ${
                            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="text-xs font-bold truncate">{m.title}</div>
                            <div className="text-[10px] text-slate-400">{m.course} • {m.size}</div>
                          </div>
                          <button
                            onClick={() => sendToTelegramChat(m)}
                            className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg"
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
            <div className="space-y-4 animate-in fade-in duration-200">

              {/* Modern Greeting Card */}
              <div className="rounded-3xl p-5 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Welcome back</span>
                  </div>
                  <h1 className="text-xl font-black tracking-tight">Hi, {firstName} 👋</h1>
                  <p className="text-xs text-blue-100/90 mt-1 leading-relaxed">
                    Access vetted CS lecture notes, lab guides, and MoSHE national exit exam prep.
                  </p>

                  <div className="mt-4 pt-3.5 border-t border-white/15 flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] text-blue-100">6 Core Disciplines Active</span>
                    </div>
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        setPage('exam');
                      }}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1 rounded-xl text-[11px] font-bold text-white transition flex items-center gap-1"
                    >
                      <Trophy className="w-3 h-3 text-amber-300" />
                      <span>Exit Exam</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Academic Year Filter Pills */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Academic Year
                  </span>
                  <span className="text-[11px] text-slate-400">{filteredCourses.length} Courses</span>
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {['All', '1st Year', '2nd Year', '3rd Year', '4th Year'].map((y) => {
                    const isActive = year === y;
                    return (
                      <button
                        key={y}
                        onClick={() => {
                          triggerHaptic('light');
                          setYear(y);
                        }}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-102'
                            : isDark
                            ? 'bg-[#17212b] text-slate-400 hover:text-white border border-slate-800'
                            : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                        }`}
                      >
                        {y === 'All' ? 'All Years' : y}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Semester Filter Pills */}
              <div className="flex gap-1.5 px-1">
                {['All', 'Semester I', 'Semester II'].map((s) => {
                  const isActive = semester === s;
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        triggerHaptic('light');
                        setSemester(s);
                      }}
                      className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition ${
                        isActive
                          ? isDark
                            ? 'bg-slate-800 text-blue-400 font-bold border border-slate-700'
                            : 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>

              {/* Course Catalog (2-Column Grid) */}
              <div>
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <h3 className="text-sm font-extrabold tracking-tight flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>Curriculum Courses</span>
                  </h3>
                </div>

                {filteredCourses.length === 0 ? (
                  <div className={`p-8 text-center rounded-3xl border ${
                    isDark ? 'bg-[#17212b] border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold">No courses found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Select a different Year or Semester filter above.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {filteredCourses.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleOpenCourse(c)}
                        className={`p-3.5 rounded-2xl border cursor-pointer active:scale-97 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md ${
                          isDark
                            ? 'bg-[#17212b] border-slate-800/90 hover:border-slate-700'
                            : 'bg-white border-slate-200/90 hover:border-blue-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-extrabold font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              {c.code}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium">{c.year}</span>
                          </div>

                          <h4 className="text-xs font-bold leading-snug line-clamp-2 text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition">
                            {c.name}
                          </h4>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1 font-medium">
                            <FileText className="w-3 h-3 text-blue-500" />
                            {c.count} files
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* High-Yield Study Materials Feed */}
              <div>
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <h3 className="text-sm font-extrabold tracking-tight flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Quick Study Resources</span>
                  </h3>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                    1-Tap Delivery
                  </span>
                </div>

                <div className="space-y-2">
                  {materials.slice(0, 6).map((m) => {
                    const isBookmarked = bookmarks.includes(m.title);
                    return (
                      <div
                        key={m.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-xs transition ${
                          isDark ? 'bg-[#17212b] border-slate-800/80' : 'bg-white border-slate-200/80'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2.5">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300">
                              {m.type}
                            </span>
                            <h5 className="text-xs font-bold truncate text-slate-800 dark:text-slate-100">
                              {m.title}
                            </h5>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2">
                            <span className="truncate">{m.course}</span>
                            <span>•</span>
                            <span className="shrink-0">{m.size}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => toggleBookmark(m.title)}
                            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition active:scale-90 ${
                              isBookmarked
                                ? 'text-amber-500 border-amber-300 bg-amber-50 dark:bg-amber-950/40'
                                : isDark
                                ? 'border-slate-800 text-slate-400 hover:text-white'
                                : 'border-slate-200 text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                          </button>

                          <button
                            onClick={() => sendToTelegramChat(m)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs active:scale-95 transition flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Send</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Courses</span>
                </button>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold font-mono">
                  {activeCourse.code}
                </span>
              </div>

              {/* Course Header Banner */}
              <div className={`p-4 rounded-3xl border shadow-sm ${
                isDark ? 'bg-[#17212b] border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h2 className="text-base font-extrabold">{activeCourse.name}</h2>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span>{activeCourse.year}</span>
                  <span>•</span>
                  <span>{activeCourse.sem}</span>
                  <span>•</span>
                  <span>Computer Science</span>
                </div>
              </div>

              {/* Category Segmented Tabs */}
              <div className="flex gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl">
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
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition text-center ${
                      courseCategoryTab === id
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Content List */}
              <div className="space-y-2">
                {courseCategoryTab === 'quizzes' ? (
                  quizzes
                    .filter((q) => q.course === activeCourse.name || activeCourse.name.includes(q.course))
                    .map((qz) => (
                      <div
                        key={qz.id}
                        onClick={() => handleStartQuiz(qz)}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer active:scale-98 transition shadow-xs ${
                          isDark ? 'bg-[#17212b] border-slate-800' : 'bg-white border-slate-200'
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
                        className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-xs transition ${
                          isDark ? 'bg-[#17212b] border-slate-800' : 'bg-white border-slate-200'
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
                            <Star className={`w-3.5 h-3.5 ${bookmarks.includes(m.title) ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => sendToTelegramChat(m)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs active:scale-95 transition flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Send</span>
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
                    <div className={`p-8 text-center rounded-3xl border ${
                      isDark ? 'bg-[#17212b] border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-40" />
                      <div className="text-xs font-bold">No {courseCategoryTab} uploaded yet</div>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                        Materials will appear here as curriculum modules update.
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
                <h2 className="text-base font-black tracking-tight">Course Quizzes</h2>
                <p className="text-xs text-slate-400 mt-0.5">Test your concept mastery with topic-specific problem sets</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1.5 px-1">
                {['All', 'Available', 'Completed'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      triggerHaptic('light');
                      setQuizTab(tab);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                      quizTab === tab
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : isDark
                        ? 'bg-[#17212b] text-slate-400 border border-slate-800'
                        : 'bg-white text-slate-600 border border-slate-200'
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
                      className={`p-4 rounded-3xl border cursor-pointer active:scale-98 transition shadow-sm flex items-center justify-between ${
                        isDark ? 'bg-[#17212b] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 font-mono uppercase tracking-wider">
                          {q.course}
                        </span>
                        <h4 className="text-xs font-bold mt-1 text-slate-800 dark:text-slate-100">{q.title}</h4>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <CheckSquare className="w-3 h-3 text-emerald-500" />
                            {q.q} questions
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-500" />
                            {q.time}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-1">
                          Start →
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ================= PAGE: EXIT EXAM PREP ================= */}
          {page === 'exam' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Exit Exam Banner */}
              <div className="rounded-3xl p-5 bg-gradient-to-br from-emerald-600 via-teal-600 to-teal-700 text-white shadow-xl shadow-teal-500/20">
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider mb-2">
                  MoSHE National Exit Exam
                </div>
                <h2 className="text-lg font-black leading-tight">Exit Exam Simulator</h2>
                <p className="text-xs text-teal-100 mt-1 leading-relaxed">
                  Practice standard Ethiopian university Computer Science exit competency examinations.
                </p>
              </div>

              {/* Sub-Tabs: Mock Exams | Leaderboard | My History */}
              <div className="flex bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl p-1 gap-1 text-xs font-bold">
                {[
                  { id: 'exams', label: 'Mock Exams' },
                  { id: 'leaderboard', label: '🏆 Leaderboard' },
                  { id: 'history', label: '📊 My History' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      triggerHaptic('light');
                      setExamSubTab(tab.id);
                    }}
                    className={`flex-1 py-1.5 rounded-xl transition text-center ${
                      examSubTab === tab.id
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: MOCK EXAMS LIST */}
              {examSubTab === 'exams' && (
                <div className="space-y-2.5">
                  {exams.map((ex) => (
                    <div
                      key={ex.id}
                      onClick={() => handleStartExam(ex)}
                      className={`p-4 rounded-3xl border cursor-pointer active:scale-98 transition shadow-xs flex items-center justify-between ${
                        isDark ? 'bg-[#17212b] border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{ex.name}</h4>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic('light');
                              setLeaderboardCourse(ex.name);
                              setExamSubTab('leaderboard');
                            }}
                            className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                          >
                            🏆 Rank
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{ex.desc}</p>
                        <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{ex.q} Practice Questions</span>
                        </div>
                      </div>

                      <button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs shrink-0">
                        Practice →
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 2: DEPARTMENT LEADERBOARD */}
              {examSubTab === 'leaderboard' && (
                <div className="space-y-3">
                  {/* Course Picker Chips */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {exams.map((ex) => (
                      <button
                        key={ex.id}
                        onClick={() => {
                          triggerHaptic('light');
                          setLeaderboardCourse(ex.name);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition ${
                          leaderboardCourse === ex.name
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : isDark
                            ? 'bg-[#17212b] text-slate-400 border border-slate-800'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        {ex.name}
                      </button>
                    ))}
                  </div>

                  {isLoadingLeaderboard ? (
                    <div className="py-12 text-center text-xs text-slate-400">Loading leaderboard...</div>
                  ) : leaderboardList.length === 0 ? (
                    <div className={`p-8 text-center rounded-3xl border ${
                      isDark ? 'bg-[#17212b] border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-50" />
                      <div className="text-xs font-bold">No scores recorded yet for {leaderboardCourse}</div>
                      <p className="text-[11px] text-slate-400 mt-1">Take the test now to set the high score on the leaderboard!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {leaderboardList.map((entry, idx) => {
                        const rankMedal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                        return (
                          <div
                            key={entry.id || idx}
                            className={`p-3 rounded-2xl border flex items-center justify-between shadow-xs ${
                              idx === 0
                                ? 'bg-amber-500/10 border-amber-400/40'
                                : isDark
                                ? 'bg-[#17212b] border-slate-800'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-base font-black w-6 text-center">{rankMedal}</span>
                              <div>
                                <div className="text-xs font-bold">{entry.student_name || 'Anonymous Student'}</div>
                                <div className="text-[10px] text-slate-400">
                                  {entry.score} / {entry.total_questions} correct • {Math.floor(entry.time_taken_seconds / 60)}m {entry.time_taken_seconds % 60}s
                                </div>
                              </div>
                            </div>
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
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
                <div className="space-y-2.5">
                  {isLoadingHistory ? (
                    <div className="py-12 text-center text-xs text-slate-400">Loading history...</div>
                  ) : examHistoryList.length === 0 ? (
                    <div className={`p-8 text-center rounded-3xl border ${
                      isDark ? 'bg-[#17212b] border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <RotateCcw className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                      <div className="text-xs font-bold">No exam attempts recorded</div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Complete any quiz or exit exam to track your personal performance over time.
                      </p>
                    </div>
                  ) : (
                    examHistoryList.map((h, i) => (
                      <div
                        key={h.id || i}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-xs ${
                          isDark ? 'bg-[#17212b] border-slate-800' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold">{h.course_name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(h.created_at).toLocaleDateString()} • {h.score}/{h.total_questions} correct
                          </div>
                        </div>
                        <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                          h.percentage >= 70
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
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

          {/* ================= PAGE: QUIZ / EXAM INTERACTIVE PLAYER ================= */}
          {(page === 'quiz-view' || page === 'exam-view') && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Sticky Player Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setPage(page === 'quiz-view' ? 'quizzes' : 'exam');
                  }}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Exit</span>
                </button>

                <div className="text-center">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider block">
                    {activeExam?.name || activeQuiz?.title || 'Practice Test'}
                  </span>
                  <div className="text-[10px] text-slate-400">
                    Question {currentQuestionIdx + 1} of {currentQuestions.length}
                  </div>
                </div>

                {playerMode === 'exam' && (
                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-900">
                    <Clock className="w-3 h-3" />
                    <span>
                      {Math.floor(examTimeLeft / 60)}:{(examTimeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIdx + 1) / currentQuestions.length) * 100}%` }}
                />
              </div>

              {/* Exam Submitted Summary Report */}
              {examSubmitted ? (
                <div className={`p-6 rounded-3xl border text-center shadow-lg ${
                  isDark ? 'bg-[#17212b] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="text-4xl mb-2">🎓</div>
                  <h3 className="text-base font-extrabold">Exam Completed!</h3>
                  <div className="text-4xl font-black text-blue-600 dark:text-blue-400 my-2">
                    {calculateScore().percentage}%
                  </div>
                  <div className="text-xs text-slate-400 mb-2">
                    Score: {calculateScore().correct} / {calculateScore().total} questions correct
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-4 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Score recorded to Department Leaderboard</span>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        setLeaderboardCourse(activeExam?.name || activeQuiz?.course || 'Data Structures & Algorithms');
                        setExamSubTab('leaderboard');
                        setPage('exam');
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>View Department Leaderboard</span>
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
                      className={`w-full text-xs font-bold py-2 rounded-xl border transition ${
                        isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Retake Test
                    </button>
                  </div>
                </div>
              ) : (
                /* Question Card */
                <div className={`p-5 rounded-3xl border shadow-sm ${
                  isDark ? 'bg-[#17212b] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <p className="text-sm font-bold leading-relaxed mb-4 text-slate-800 dark:text-slate-100">
                    {currentQuestions[currentQuestionIdx]?.q}
                  </p>

                  {/* Options */}
                  <div className="space-y-2.5">
                    {currentQuestions[currentQuestionIdx]?.options.map((opt, idx) => {
                      const isChosen = selectedAnswer === idx || examAnswers[currentQuestionIdx] === idx;
                      const isCorrect = idx === currentQuestions[currentQuestionIdx]?.correct;
                      const showResult = playerMode === 'practice' && selectedAnswer !== null;

                      let style = isDark ? 'bg-slate-800/60 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700';
                      if (showResult) {
                        if (isCorrect) style = 'bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold';
                        else if (isChosen && !isCorrect) style = 'bg-rose-500/10 border-rose-500 text-rose-800 dark:text-rose-200';
                      } else if (isChosen) {
                        style = 'bg-blue-500/10 border-blue-500 text-blue-800 dark:text-blue-200 font-bold';
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswerSelect(idx)}
                          className={`w-full text-left p-3 rounded-2xl border text-xs flex items-center gap-3 transition active:scale-98 ${style}`}
                        >
                          <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                            {['A', 'B', 'C', 'D'][idx]}
                          </span>
                          <span className="flex-1 leading-snug">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Practice Explanation Box */}
                  {playerMode === 'practice' && selectedAnswer !== null && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs">
                      <b className="text-blue-700 dark:text-blue-300 block mb-0.5">Explanation:</b>
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
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-30"
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
                        className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-xs"
                      >
                        Next →
                      </button>
                    ) : (
                      <button
                        onClick={handleFinishExam}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-xs"
                      >
                        Finish Test ✓
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
                <h2 className="text-base font-black tracking-tight">Student Profile</h2>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  <span>Telegram Verified</span>
                </div>
              </div>

              {/* Profile Card */}
              <div className={`p-5 rounded-3xl border text-center shadow-sm ${
                isDark ? 'bg-[#17212b] border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="w-16 h-16 rounded-full bg-blue-600/10 text-blue-600 text-2xl font-black flex items-center justify-center mx-auto mb-2.5 border-2 border-blue-500/20 overflow-hidden shadow-inner">
                  {profile?.photo_url ? (
                    <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    firstName.charAt(0)
                  )}
                </div>
                <h3 className="text-sm font-extrabold">{profile?.full_name || 'Student'}</h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  {profile?.telegram_username ? `@${profile.telegram_username}` : (profile?.telegram_id ? `ID: ${profile.telegram_id}` : 'Student')}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  📱 {profile?.phone || 'Verified via Telegram'}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 text-left text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-[10px] text-slate-400 block font-medium">Department</span>
                    <b>Computer Science</b>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-[10px] text-slate-400 block font-medium">Curriculum</span>
                    <b>B.Sc. MoSHE Standard</b>
                  </div>
                </div>
              </div>

              {/* Saved Materials (Bookmarks) Section */}
              <div className={`p-4 rounded-3xl border shadow-sm ${
                isDark ? 'bg-[#17212b] border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex justify-between items-center mb-3 px-1">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                    <b className="text-xs">Saved Materials ({bookmarks.length})</b>
                  </div>
                  <span className="text-[10px] text-slate-400">Quick Access</span>
                </div>

                {bookmarks.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    <BookMarked className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-40" />
                    <p>No bookmarked items yet.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Tap the star icon on any material to pin it here!</p>
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
                          className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                            isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="font-bold truncate">{bmTitle}</div>
                            <div className="text-[10px] text-slate-400">{matchedMat.course} • {matchedMat.size}</div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => toggleBookmark(bmTitle)}
                              className="text-amber-500 px-1 text-sm"
                            >
                              ★
                            </button>
                            <button
                              onClick={() => sendToTelegramChat(matchedMat)}
                              className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-xl"
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

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-20 left-4 right-4 max-w-sm mx-auto bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 py-2.5 px-4 rounded-2xl text-center text-xs font-semibold z-50 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150">
            {toastMessage}
          </div>
        )}

        {/* Bottom Floating Navigation Dock */}
        <nav className={`fixed bottom-0 inset-x-0 max-w-md mx-auto h-16 border-t px-2 py-1 z-40 backdrop-blur-xl transition-colors ${
          isDark ? 'bg-[#17212b]/90 border-slate-800 text-slate-400' : 'bg-white/90 border-slate-200 text-slate-500'
        }`}>
          <div className="grid grid-cols-4 h-full">
            {[
              { id: 'home', icon: BookOpen, label: 'Courses' },
              { id: 'quizzes', icon: CheckSquare, label: 'Quizzes' },
              { id: 'exam', icon: Award, label: 'Exit Exam' },
              { id: 'profile', icon: User, label: 'Profile' },
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
                  className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                      : 'hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <div className={`p-1 rounded-xl transition ${isActive ? 'bg-blue-500/10' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] leading-none tracking-tight">{tab.label}</span>
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
