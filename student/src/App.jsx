import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { getCategories, getPublishedContent } from './lib/api';

const DEFAULT_COURSES = [
  { name: 'Data Structures', code: 'CS301', year: '3rd Year', sem: 'Semester I', count: 12 },
  { name: 'Database Systems', code: 'CS302', year: '3rd Year', sem: 'Semester I', count: 9 },
  { name: 'Computer Networks', code: 'CS401', year: '4th Year', sem: 'Semester I', count: 8 },
  { name: 'Operating Systems', code: 'CS303', year: '3rd Year', sem: 'Semester II', count: 10 },
  { name: 'Artificial Intelligence', code: 'CS405', year: '4th Year', sem: 'Semester II', count: 6 },
  { name: 'Object Oriented Programming', code: 'CS201', year: '2nd Year', sem: 'Semester I', count: 11 },
];

const DEFAULT_MATERIALS = [
  { title: 'Introduction to Algorithms', course: 'Data Structures', type: 'PDF', size: '2.4 MB' },
  { title: 'SQL Practice Notes', course: 'Database Systems', type: 'PDF', size: '1.2 MB' },
  { title: 'Network Layer Slides', course: 'Computer Networks', type: 'Slides', size: '3.1 MB' },
  { title: 'Operating Systems Summary', course: 'Operating Systems', type: 'PDF', size: '1.8 MB' },
  { title: 'AI Fundamentals', course: 'Artificial Intelligence', type: 'PDF', size: '2.0 MB' },
];

const DEFAULT_QUIZZES = [
  { title: 'Data Structures Quiz 1', course: 'Data Structures', q: 15, status: 'Available', time: '20 min' },
  { title: 'Database Fundamentals', course: 'Database Systems', q: 20, status: 'Available', time: '30 min' },
  { title: 'Network Basics', course: 'Computer Networks', q: 10, status: 'Completed', time: '15 min' },
  { title: 'Operating Systems Quiz', course: 'Operating Systems', q: 15, status: 'Available', time: '20 min' },
];

const DEFAULT_EXAMS = [
  { name: 'Data Structures', q: 120, desc: 'Algorithms, trees, graphs' },
  { name: 'Database Systems', q: 100, desc: 'SQL, normalization, transactions' },
  { name: 'Computer Networks', q: 90, desc: 'Networking concepts and protocols' },
  { name: 'Operating Systems', q: 110, desc: 'Processes, memory, scheduling' },
  { name: 'Artificial Intelligence', q: 100, desc: 'Search, reasoning, machine learning' },
  { name: 'Software Engineering', q: 80, desc: 'Design, testing, project methods' },
];

export function App() {
  const { user, profile, isTelegramWebApp, telegramUnregistered } = useAuth();

  const [page, setPage] = useState('home'); // 'home' | 'quizzes' | 'exam' | 'profile' | 'course-detail' | 'quiz-view' | 'exam-view'
  const [sideOpen, setSideOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('3rd Year');
  const [semester, setSemester] = useState('Semester I');
  const [quizTab, setQuizTab] = useState('All');
  const [activeCourse, setActiveCourse] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [activeExam, setActiveExam] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const [courses, setCourses] = useState(DEFAULT_COURSES);
  const [materials, setMaterials] = useState(DEFAULT_MATERIALS);
  const [quizzes, setQuizzes] = useState(DEFAULT_QUIZZES);
  const [exams, setExams] = useState(DEFAULT_EXAMS);

  // Initialize Telegram Web App viewport
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      } catch (e) {}
    }
  }, []);

  // Fetch live backend materials and categories if available
  useEffect(() => {
    async function loadData() {
      try {
        const [cats, cont] = await Promise.all([getCategories(), getPublishedContent()]);
        if (cats && cats.length > 0) {
          // Map backend categories to courses if available
          const mappedCourses = cats.map((cat, idx) => ({
            name: cat.name,
            code: `CS${301 + idx}`,
            year: idx % 2 === 0 ? '3rd Year' : '4th Year',
            sem: idx % 3 === 0 ? 'Semester II' : 'Semester I',
            count: 8 + (idx * 2),
          }));
          if (mappedCourses.length > 0) setCourses(mappedCourses);
        }
        if (cont && cont.length > 0) {
          const mappedMat = cont.map((item) => ({
            title: item.title,
            course: item.category_name || item.tags?.[0] || 'General CS',
            type: item.content_type === 'resource' ? 'PDF' : 'Slides',
            size: '2.4 MB',
            external_url: item.external_url,
          }));
          setMaterials(mappedMat);
        }
      } catch (err) {
        // Fallback to defaults
      }
    }
    loadData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2200);
  };

  const filteredCourses = courses.filter((c) => c.year === year && c.sem === semester);
  const filteredMaterials = materials.filter((m) =>
    (m.title + ' ' + m.course).toLowerCase().includes(search.toLowerCase())
  );

  const studentName = profile?.full_name || user?.full_name || 'Student';
  const studentUsername = profile?.telegram_username ? `@${profile.telegram_username}` : (profile?.phone || '@student_account');

  const pageSubtitles = {
    home: 'Learn. Practice. Prepare.',
    quizzes: 'Quiz practice',
    exam: 'Exit exam preparation',
    profile: 'Student profile',
    'course-detail': activeCourse?.name || 'Course Resources',
    'quiz-view': activeQuiz?.title || 'Practice Quiz',
    'exam-view': activeExam?.name || 'Exam Practice',
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#172033] flex justify-center items-center font-sans antialiased sm:py-6">
      <div className="w-full max-w-[430px] h-[100dvh] min-h-[580px] bg-[#f5f7fb] flex flex-col border border-[#dbe3ee] sm:rounded-2xl relative overflow-hidden shadow-xl">
        
        {/* Unregistered Telegram notice banner */}
        {telegramUnregistered && (
          <div className="bg-amber-500 text-slate-950 px-3 py-1.5 text-[11px] font-bold flex items-center justify-between z-20">
            <span>Share your phone in the bot to unlock your account.</span>
            <button
              onClick={() => {
                if (window.Telegram?.WebApp) {
                  window.Telegram.WebApp.close();
                } else {
                  window.open('https://t.me/Boditibingobot', '_blank');
                }
              }}
              className="bg-slate-950 text-white px-2 py-0.5 rounded text-[10px]"
            >
              Open Bot
            </button>
          </div>
        )}

        {/* Top Header */}
        <header className="h-[58px] bg-white border-b border-[#e5eaf1] flex items-center px-3.5 gap-2.5 shrink-0 z-10">
          <button
            onClick={() => setSideOpen(true)}
            className="border border-[#dbe4f0] rounded-lg bg-white text-[#334155] px-2.5 py-1.5 text-xs hover:bg-slate-50 transition"
          >
            ☰
          </button>
          
          <div className="bg-[#2563eb] text-white rounded-lg w-[33px] h-[33px] grid place-items-center shrink-0 font-bold text-sm">
            🎓
          </div>

          <div className="flex-1 min-w-0">
            <strong className="text-base font-extrabold text-[#172033] tracking-tight block truncate">
              CS Hub
            </strong>
            <div className="text-[11px] text-[#778397] truncate">
              {pageSubtitles[page] || 'Learn. Practice. Prepare.'}
            </div>
          </div>

          <button
            onClick={() => {
              const query = prompt('Search courses, materials or quizzes:');
              if (query !== null) {
                setSearch(query);
                if (page !== 'home' && page !== 'quizzes') setPage('home');
              }
            }}
            className="border border-[#dbe4f0] rounded-lg bg-white text-[#334155] px-2.5 py-1.5 text-xs hover:bg-slate-50 transition"
          >
            ⌕
          </button>
        </header>

        {/* Slide-out Sidebar Menu */}
        {sideOpen && (
          <div className="absolute inset-0 bg-[#0f172a55] z-30 transition-opacity">
            <div className="absolute inset-y-0 left-0 w-[78%] max-w-[310px] bg-white p-4 shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-200">
              <div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                  <b className="text-sm font-extrabold text-[#172033]">CS Hub Menu</b>
                  <button
                    onClick={() => setSideOpen(false)}
                    className="border border-[#dbe4f0] rounded-lg px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1.5">
                  <button
                    onClick={() => { setPage('home'); setSideOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${page === 'home' ? 'bg-[#eaf2ff] text-[#2563eb]' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    <span className="text-base">⌂</span> Home
                  </button>
                  <button
                    onClick={() => { setPage('quizzes'); setSideOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${page === 'quizzes' ? 'bg-[#eaf2ff] text-[#2563eb]' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    <span className="text-base">☷</span> Quizzes
                  </button>
                  <button
                    onClick={() => { setPage('exam'); setSideOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${page === 'exam' ? 'bg-[#eaf2ff] text-[#2563eb]' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    <span className="text-base">▣</span> Exit Exam
                  </button>
                  <button
                    onClick={() => { setPage('profile'); setSideOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${page === 'profile' ? 'bg-[#eaf2ff] text-[#2563eb]' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    <span className="text-base">♙</span> My Profile
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-800">{studentName}</div>
                <div className="text-[11px] text-[#778397]">{studentUsername}</div>
                <div className="mt-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#eaf2ff] text-[#2457aa]">
                  Telegram Verified
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Body Content */}
        <main className="flex-1 min-h-0 overflow-y-auto p-3.5 pb-6">
          
          {/* ==================== HOME TAB ==================== */}
          {page === 'home' && (
            <div>
              <div className="mb-3.5">
                <div className="text-xl font-extrabold tracking-tight text-[#172033]">
                  Welcome back, {studentName} 👋
                </div>
                <div className="text-[11px] text-[#778397] mt-0.5">
                  Find your course materials and keep learning.
                </div>
              </div>

              {/* Learning Space Hero Card */}
              <div className="rounded-2xl bg-gradient-to-r from-[#1d4ed8] to-[#3b82f6] text-white p-4 mb-3.5 shadow-sm">
                <div className="text-[10px] font-bold tracking-wider opacity-90 uppercase">
                  Your Learning Space
                </div>
                <div className="text-lg font-extrabold mt-1">
                  {year} · {semester}
                </div>
                <div className="text-[11px] text-blue-100 mt-1">
                  Study materials, quizzes and exam practice
                </div>
              </div>

              {/* Academic Filters */}
              <div className="grid grid-cols-2 gap-2 mb-3.5">
                <label className="text-[11px] text-[#64748b]">
                  Academic year
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full p-2 border border-[#dbe3ee] rounded-lg bg-white text-xs mt-1 text-[#334155] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'].map((y) => (
                      <option key={y}>{y}</option>
                    ))}
                  </select>
                </label>
                <label className="text-[11px] text-[#64748b]">
                  Semester
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full p-2 border border-[#dbe3ee] rounded-lg bg-white text-xs mt-1 text-[#334155] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {['Semester I', 'Semester II'].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Course Tiles */}
              <div className="flex justify-between items-center mt-3.5 mb-2.5">
                <b className="text-xs font-extrabold text-[#172033]">Your courses</b>
                <span className="text-[11px] text-[#778397]">{filteredCourses.length} courses</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {filteredCourses.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => { setActiveCourse(c); setPage('course-detail'); }}
                    className="bg-white border border-[#e4eaf2] rounded-xl p-3 min-h-[110px] flex flex-col justify-between text-left hover:border-blue-300 transition shadow-sm group"
                  >
                    <span className="bg-[#eaf2ff] text-[#2563eb] w-8 h-8 rounded-lg grid place-items-center font-bold text-sm">
                      ▤
                    </span>
                    <div>
                      <b className="text-xs font-bold text-[#172033] block truncate group-hover:text-blue-600 transition">
                        {c.name}
                      </b>
                      <span className="text-[10px] text-[#778397] block mt-0.5">
                        {c.code} · {c.count} resources
                      </span>
                    </div>
                  </button>
                ))}
                {filteredCourses.length === 0 && (
                  <div className="col-span-2 bg-white border border-[#e4eaf2] rounded-xl p-4 text-center text-xs text-[#778397]">
                    No courses found for {year} - {semester}.
                  </div>
                )}
              </div>

              {/* Recent Materials */}
              <div className="flex justify-between items-center mt-4 mb-2.5">
                <b className="text-xs font-extrabold text-[#172033]">Recent materials</b>
                <button
                  onClick={() => showToast('Displaying all semester materials')}
                  className="border border-[#dbe4f0] rounded-lg bg-white text-[#334155] px-2.5 py-1 text-[11px] hover:bg-slate-50 transition"
                >
                  See all
                </button>
              </div>

              <div className="space-y-2">
                {filteredMaterials.slice(0, 3).map((m, idx) => (
                  <div
                    key={idx}
                    className="flex gap-2.5 items-center p-2.5 bg-white border border-[#e4eaf2] rounded-xl shadow-sm"
                  >
                    <div className="w-[38px] h-[40px] rounded-lg bg-[#eaf2ff] text-[#2563eb] grid place-items-center font-bold text-base shrink-0">
                      {m.type === 'PDF' ? '▤' : '▧'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#172033] truncate">{m.title}</div>
                      <div className="text-[10px] text-[#778397] mt-0.5">{m.course} · {m.size}</div>
                    </div>
                    <button
                      onClick={() => showToast(`Opening ${m.title}...`)}
                      className="border border-[#dbe4f0] rounded-lg bg-white text-[#334155] px-2.5 py-1 text-xs font-semibold hover:bg-slate-50 shrink-0"
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== COURSE DETAIL VIEW ==================== */}
          {page === 'course-detail' && activeCourse && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setPage('home')}
                  className="border border-[#dbe4f0] rounded-lg bg-white text-[#334155] px-2.5 py-1 text-xs font-semibold hover:bg-slate-50"
                >
                  ← Back to courses
                </button>
              </div>

              <div className="mb-3.5">
                <div className="text-xl font-extrabold text-[#172033]">{activeCourse.name}</div>
                <div className="text-[11px] text-[#778397] mt-0.5">{activeCourse.code} · Learning resources</div>
              </div>

              <div className="space-y-2">
                {materials
                  .filter((m) => m.course.toLowerCase() === activeCourse.name.toLowerCase() || m.course.includes('General'))
                  .map((m, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2.5 items-center p-2.5 bg-white border border-[#e4eaf2] rounded-xl shadow-sm"
                    >
                      <div className="w-[38px] h-[40px] rounded-lg bg-[#eaf2ff] text-[#2563eb] grid place-items-center font-bold text-base shrink-0">
                        {m.type === 'PDF' ? '▤' : '▧'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-[#172033] truncate">{m.title}</div>
                        <div className="text-[10px] text-[#778397] mt-0.5">{m.course} · {m.size}</div>
                      </div>
                      <button
                        onClick={() => showToast(`Opening ${m.title}...`)}
                        className="border border-[#dbe4f0] rounded-lg bg-white text-[#334155] px-2.5 py-1 text-xs font-semibold hover:bg-slate-50 shrink-0"
                      >
                        Open
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ==================== QUIZZES TAB ==================== */}
          {page === 'quizzes' && (
            <div>
              <div className="mb-3.5">
                <div className="text-xl font-extrabold text-[#172033]">Quizzes</div>
                <div className="text-[11px] text-[#778397] mt-0.5">Test your knowledge and track progress.</div>
              </div>

              <input
                type="text"
                placeholder="Search quizzes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-2.5 border border-[#dbe3ee] rounded-xl bg-white text-xs text-[#334155] mb-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <div className="flex gap-2 mb-3.5">
                {['All', 'Available', 'Completed'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setQuizTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      quizTab === tab
                        ? 'bg-[#2563eb] text-white border border-[#2563eb]'
                        : 'bg-white border border-[#dbe4f0] text-[#334155] hover:bg-slate-50'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="space-y-2.5">
                {quizzes
                  .filter((q) => (quizTab === 'All' || q.status === quizTab) && (q.title + ' ' + q.course).toLowerCase().includes(search.toLowerCase()))
                  .map((q, idx) => (
                    <div key={idx} className="bg-white border border-[#e4eaf2] rounded-xl p-3 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#eaf2ff] text-[#2457aa]">
                          {q.status}
                        </span>
                        <span className="text-[11px] text-[#778397]">{q.time}</span>
                      </div>
                      <b className="block text-xs font-bold text-[#172033] mt-2.5">{q.title}</b>
                      <div className="text-[11px] text-[#778397] mt-0.5">{q.course} · {q.q} questions</div>
                      <div className="mt-3">
                        <button
                          onClick={() => { setActiveQuiz(q); setSelectedAnswer(null); setPage('quiz-view'); }}
                          className="w-full bg-[#2563eb] text-white py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                        >
                          {q.status === 'Completed' ? 'Review quiz' : 'Start quiz'}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ==================== QUIZ INTERACTIVE VIEW ==================== */}
          {page === 'quiz-view' && activeQuiz && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setPage('quizzes')}
                  className="border border-[#dbe4f0] rounded-lg bg-white text-[#334155] px-2.5 py-1 text-xs font-semibold hover:bg-slate-50"
                >
                  ← Back to quizzes
                </button>
              </div>

              <div className="mb-3.5">
                <div className="text-xl font-extrabold text-[#172033]">{activeQuiz.title}</div>
                <div className="text-[11px] text-[#778397] mt-0.5">Practice quiz · {activeQuiz.q} questions</div>
              </div>

              <div className="bg-white border border-[#e4eaf2] rounded-xl p-3.5 shadow-sm space-y-3">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#eaf2ff] text-[#2457aa]">
                  Question 1 of {activeQuiz.q}
                </span>

                <p className="text-xs font-bold text-[#172033] leading-relaxed">
                  What is the primary characteristic of an algorithm?
                </p>

                <div className="space-y-2 pt-1">
                  {[
                    'A well-defined finite sequence of computational steps',
                    'A hardware component inside the CPU core',
                    'A physical Ethernet routing protocol',
                    'A relational database normalization technique',
                  ].map((option, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedAnswer(i)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs transition border ${
                        selectedAnswer === i
                          ? 'bg-[#eaf2ff] border-[#93c5fd] font-bold text-blue-900'
                          : 'bg-white border-[#dbe4f0] text-[#334155] hover:bg-slate-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      if (selectedAnswer === null) {
                        showToast('Please select an answer first.');
                      } else {
                        showToast(selectedAnswer === 0 ? 'Correct answer! Score recorded.' : 'Answer submitted. Score recorded.');
                        setTimeout(() => setPage('quizzes'), 1200);
                      }
                    }}
                    className="flex-1 bg-[#2563eb] text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                  >
                    Submit answer
                  </button>
                  <button
                    onClick={() => setPage('quizzes')}
                    className="border border-[#dbe4f0] rounded-lg px-3 py-2 text-xs text-[#334155] hover:bg-slate-50"
                  >
                    Back
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== EXIT EXAM TAB ==================== */}
          {page === 'exam' && (
            <div>
              <div className="mb-3.5">
                <div className="text-xl font-extrabold text-[#172033]">Exit Exam</div>
                <div className="text-[11px] text-[#778397] mt-0.5">Practice by course for your comprehensive exam.</div>
              </div>

              {/* Alert card */}
              <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-xl p-3 mb-3.5">
                <b className="text-xs font-bold text-[#1d4ed8]">Exam Preparation Pool</b>
                <p className="text-[11px] text-[#64748b] leading-relaxed mt-1">
                  Choose a subject to practice real previous questions and comprehensive syllabus topics.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {exams.map((x, idx) => (
                  <div key={idx} className="bg-white border border-[#e4eaf2] rounded-xl p-3 flex flex-col justify-between shadow-sm">
                    <div className="bg-[#eaf2ff] text-[#2563eb] w-8 h-8 rounded-lg grid place-items-center font-bold text-sm mb-2">
                      ▣
                    </div>
                    <div>
                      <b className="text-xs font-bold text-[#172033] block truncate">{x.name}</b>
                      <div className="text-[10px] text-[#778397] mt-0.5">{x.q} questions</div>
                    </div>
                    <div className="mt-2.5">
                      <button
                        onClick={() => { setActiveExam(x); setPage('exam-view'); }}
                        className="w-full border border-[#dbe4f0] rounded-lg bg-white text-[#334155] py-1 text-xs font-semibold hover:bg-slate-50"
                      >
                        Practice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== EXAM VIEW ==================== */}
          {page === 'exam-view' && activeExam && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setPage('exam')}
                  className="border border-[#dbe4f0] rounded-lg bg-white text-[#334155] px-2.5 py-1 text-xs font-semibold hover:bg-slate-50"
                >
                  ← Back to Exit Exam
                </button>
              </div>

              <div className="mb-3.5">
                <div className="text-xl font-extrabold text-[#172033]">{activeExam.name}</div>
                <div className="text-[11px] text-[#778397] mt-0.5">Comprehensive Practice Session</div>
              </div>

              <div className="bg-white border border-[#e4eaf2] rounded-xl p-4 shadow-sm space-y-3">
                <b className="text-xs font-bold text-[#172033]">{activeExam.q} Practice Questions Ready</b>
                <p className="text-xs text-[#778397] leading-relaxed">
                  {activeExam.desc}. Questions are drawn directly from the national curriculum questions bank.
                </p>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      showToast('Starting exam practice session...');
                    }}
                    className="flex-1 bg-[#2563eb] text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                  >
                    Start practice
                  </button>
                  <button
                    onClick={() => setPage('exam')}
                    className="border border-[#dbe4f0] rounded-lg px-3 py-2 text-xs text-[#334155] hover:bg-slate-50"
                  >
                    Back
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== PROFILE TAB ==================== */}
          {page === 'profile' && (
            <div>
              <div className="mb-3.5">
                <div className="text-xl font-extrabold text-[#172033]">My Profile</div>
                <div className="text-[11px] text-[#778397] mt-0.5">Your verified student account details.</div>
              </div>

              {/* Student Card */}
              <div className="bg-white border border-[#e4eaf2] rounded-xl p-5 text-center mb-3 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#dbeafe] text-[#1d4ed8] grid place-items-center text-2xl font-extrabold mx-auto">
                  {studentName.charAt(0).toUpperCase()}
                </div>
                <div className="text-base font-extrabold text-[#172033] mt-3">
                  {studentName}
                </div>
                <div className="text-xs text-[#778397] mt-0.5">
                  {studentUsername}
                </div>
                <div className="mt-2.5">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-[#eaf2ff] text-[#2457aa]">
                    {isTelegramWebApp ? 'Telegram Mini App · Verified' : 'Telegram Linked'}
                  </span>
                </div>
              </div>

              {/* Academic Info */}
              <div className="bg-white border border-[#e4eaf2] rounded-xl p-3.5 mb-3 shadow-sm space-y-2.5">
                <b className="text-xs font-extrabold text-[#172033] block border-b border-slate-100 pb-2">
                  Academic Information
                </b>
                <div className="flex justify-between items-center text-xs py-1 border-b border-slate-100">
                  <span className="text-[#778397]">Academic year</span>
                  <b className="text-[#172033]">{year}</b>
                </div>
                <div className="flex justify-between items-center text-xs py-1">
                  <span className="text-[#778397]">Semester</span>
                  <b className="text-[#172033]">{semester}</b>
                </div>
              </div>

              {/* Account Access */}
              <div className="bg-white border border-[#e4eaf2] rounded-xl p-3.5 shadow-sm space-y-2.5">
                <b className="text-xs font-extrabold text-[#172033] block">Account Verification</b>
                <p className="text-[11px] text-[#778397] leading-relaxed">
                  Your identity is linked and verified through our official Telegram Bot (@Boditibingobot).
                </p>
                <button
                  onClick={() => showToast('Profile refreshed with live Telegram identity')}
                  className="w-full border border-[#dbe4f0] rounded-lg bg-white text-[#334155] py-2 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Refresh profile
                </button>
              </div>
            </div>
          )}

        </main>

        {/* Bottom Navigation */}
        <nav className="h-[62px] shrink-0 grid grid-cols-4 bg-white border-t border-[#e2e8f0] px-1 py-1 z-10">
          <button
            onClick={() => setPage('home')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] cursor-pointer transition ${
              page === 'home' || page === 'course-detail' ? 'text-[#2563eb] font-extrabold' : 'text-[#788397] font-medium'
            }`}
          >
            <b className="text-lg leading-none font-normal">⌂</b>
            Home
          </button>
          
          <button
            onClick={() => setPage('quizzes')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] cursor-pointer transition ${
              page === 'quizzes' || page === 'quiz-view' ? 'text-[#2563eb] font-extrabold' : 'text-[#788397] font-medium'
            }`}
          >
            <b className="text-lg leading-none font-normal">☷</b>
            Quizzes
          </button>

          <button
            onClick={() => setPage('exam')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] cursor-pointer transition ${
              page === 'exam' || page === 'exam-view' ? 'text-[#2563eb] font-extrabold' : 'text-[#788397] font-medium'
            }`}
          >
            <b className="text-lg leading-none font-normal">▣</b>
            Exit Exam
          </button>

          <button
            onClick={() => setPage('profile')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] cursor-pointer transition ${
              page === 'profile' ? 'text-[#2563eb] font-extrabold' : 'text-[#788397] font-medium'
            }`}
          >
            <b className="text-lg leading-none font-normal">♙</b>
            Profile
          </button>
        </nav>

        {/* Bottom Floating Toast */}
        {toastMessage && (
          <div className="absolute bottom-[72px] left-3 right-3 bg-[#172033] text-white py-2 px-3 rounded-lg text-center text-xs font-semibold z-40 shadow-lg animate-in fade-in duration-150">
            {toastMessage}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
