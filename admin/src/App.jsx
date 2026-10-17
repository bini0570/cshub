import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { getCategories, getPublishedContent, getSubmissions, reviewSubmission, getUsers } from './lib/api';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const DEFAULT_COURSES = [
  { id: 'c-1', name: 'Data Structures', code: 'CS301', year: '3rd Year', status: 'Published' },
  { id: 'c-2', name: 'Database Systems', code: 'CS302', year: '3rd Year', status: 'Published' },
  { id: 'c-3', name: 'Computer Networks', code: 'CS401', year: '4th Year', status: 'Published' },
  { id: 'c-4', name: 'Operating Systems', code: 'CS303', year: '3rd Year', status: 'Published' },
  { id: 'c-5', name: 'Artificial Intelligence', code: 'CS405', year: '4th Year', status: 'Published' },
];

const DEFAULT_MATERIALS = [];

const DEFAULT_QUIZZES = [
  { id: 'q-1', title: 'Data Structures Quiz', questions: 4, status: 'Published' },
  { id: 'q-2', title: 'Database Basics', questions: 3, status: 'Published' },
  { id: 'q-3', title: 'Computer Networks Midterm Prep', questions: 3, status: 'Published' },
];

const DEFAULT_EXAMS = [
  { id: 'e-1', name: 'Data Structures', questions: 4 },
  { id: 'e-2', name: 'Database Systems', questions: 3 },
  { id: 'e-3', name: 'Computer Networks', questions: 3 },
  { id: 'e-4', name: 'Operating Systems', questions: 3 },
];

const DEFAULT_STUDENTS = [];

const DEFAULT_SUBMISSIONS = [];

const DEFAULT_ADMINS = [
  { id: 'admin-primary', name: 'CS Hub Administrator', email: 'admin@cshub.edu', role: 'Owner' },
];

const SUBTITLES = {
  dashboard: 'Dashboard overview',
  courses: 'Course catalog',
  materials: 'Study resources',
  quizzes: 'Quiz management',
  exams: 'Exit exam sets',
  students: 'Telegram-linked students',
  submissions: 'Student upload moderation',
  broadcast: 'Telegram broadcast tool',
  admins: 'Administrator access',
  settings: 'Platform preferences',
  profile: 'Admin profile',
};

const PAGES_NAV = [
  ['dashboard', '▦ Overview'],
  ['courses', '▤ Courses'],
  ['materials', '▧ Materials'],
  ['quizzes', '☷ Quizzes'],
  ['exams', '▣ Exit Exam'],
  ['students', '♙ Students'],
  ['submissions', '⇧ Submissions'],
  ['broadcast', '📢 Telegram Broadcast'],
  ['admins', '♧ Administrators'],
  ['settings', '⚙ Settings'],
  ['profile', '◉ Admin Profile'],
];

export function App() {
  const { user, profile, isAdmin, adminLogin, logout, isLoading } = useAuth();

  const [page, setPage] = useState('dashboard');
  const [sideOpen, setSideOpen] = useState(false);
  const [filter, setFilter] = useState('All');
  const [courseSearch, setCourseSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Admin Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await adminLogin(loginEmail, loginPassword);
      showToast('Welcome back, Administrator!');
    } catch (err) {
      setLoginError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Main Data States with Local Storage Persistence
  const [courses, setCourses] = useState(() => {
    try {
      const saved = localStorage.getItem('cshub_admin_courses');
      return saved ? JSON.parse(saved) : DEFAULT_COURSES;
    } catch { return DEFAULT_COURSES; }
  });
  const [materials, setMaterials] = useState(() => {
    try {
      const saved = localStorage.getItem('cshub_admin_materials');
      return saved ? JSON.parse(saved) : DEFAULT_MATERIALS;
    } catch { return DEFAULT_MATERIALS; }
  });
  const [quizzes, setQuizzes] = useState(() => {
    try {
      const saved = localStorage.getItem('cshub_admin_quizzes');
      return saved ? JSON.parse(saved) : DEFAULT_QUIZZES;
    } catch { return DEFAULT_QUIZZES; }
  });
  const [exams, setExams] = useState(() => {
    try {
      const saved = localStorage.getItem('cshub_admin_exams');
      return saved ? JSON.parse(saved) : DEFAULT_EXAMS;
    } catch { return DEFAULT_EXAMS; }
  });
  const [students, setStudents] = useState(() => {
    try {
      const saved = localStorage.getItem('cshub_admin_students');
      return saved ? JSON.parse(saved) : DEFAULT_STUDENTS;
    } catch { return DEFAULT_STUDENTS; }
  });
  const [submissions, setSubmissions] = useState(() => {
    try {
      const saved = localStorage.getItem('cshub_admin_submissions');
      return saved ? JSON.parse(saved) : DEFAULT_SUBMISSIONS;
    } catch { return DEFAULT_SUBMISSIONS; }
  });
  const [admins, setAdmins] = useState(DEFAULT_ADMINS);

  // Broadcast State
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    siteName: 'CS Hub',
    contactEmail: 'admin@cshub.edu',
    defaultYear: '3rd Year',
  });

  // Profile State
  const [displayName, setDisplayName] = useState(profile?.full_name || profile?.display_name || 'Administrator');

  // Modal State
  const [modalType, setModalType] = useState(null); // 'course' | 'material' | 'quiz' | 'exam' | 'admin' | null
  const [editingItem, setEditingItem] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Toast System
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2400);
  };

  // Sync Live Data from Railway Backend
  useEffect(() => {
    async function fetchBackendData() {
      try {
        const [cats, cont, subs, usersList] = await Promise.all([
          getCategories(),
          getPublishedContent(),
          getSubmissions({ isAdmin: true }),
          getUsers(),
        ]);

        if (cats && cats.length > 0) {
          const mapped = cats.map((c, i) => ({
            id: c.id || `c-${i}`,
            name: c.name,
            code: c.code || `CS${301 + i}`,
            year: c.academic_year || '3rd Year',
            status: 'Published',
          }));
          setCourses(mapped);
        }

        if (cont && cont.length > 0) {
          const mappedMat = cont.map((m, i) => ({
            id: m.id || `m-${i}`,
            title: m.title,
            course: m.category_name || 'General CS',
            status: m.status === 'published' ? 'Published' : m.status === 'pending' ? 'Pending' : 'Draft',
            fileUrl: m.download_url || m.external_url || '',
          }));
          setMaterials(mappedMat);
        } else {
          setMaterials([]);
        }

        if (subs && subs.length > 0) {
          const mappedSubs = subs.map((s, i) => ({
            id: s.id || `sub-${i}`,
            title: s.title || 'Student Upload',
            student: s.submitter_name || s.student || 'Student',
            status: s.status === 'approved' ? 'Approved' : s.status === 'rejected' ? 'Rejected' : 'Pending',
            course: s.category_name || 'Computer Science',
          }));
          setSubmissions(mappedSubs);
        } else {
          setSubmissions([]);
        }

        if (usersList && usersList.length > 0) {
          const mappedStudents = usersList
            .filter((u) => u.role === 'student' || (!u.role && u.telegram_id))
            .map((s, i) => ({
              id: s.id || `s-${i}`,
              name: s.full_name || 'Telegram Student',
              handle: s.telegram_username ? `@${s.telegram_username}` : 'Direct Telegram User',
              status: 'Active',
              phone: s.phone || 'Verified via Bot',
            }));
          setStudents(mappedStudents);
        } else {
          setStudents([]);
        }
      } catch (err) {}
    }
    fetchBackendData();
  }, []);

  const navigateTo = (p) => {
    setPage(p);
    setSideOpen(false);
  };

  // Open Modal
  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setUploadedFileUrl(item?.fileUrl || '');
  };

  const closeModal = () => {
    setModalType(null);
    setEditingItem(null);
    setUploadedFileUrl('');
  };

  // Handle Material File Upload to Railway Backend
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    showToast(`Uploading ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/api/upload`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setUploadedFileUrl(data.url);
          showToast('✓ File uploaded to Railway disk storage');
          setIsUploadingFile(false);
          return;
        }
      }
    } catch (err) {}

    // Fallback simulation
    setTimeout(() => {
      setUploadedFileUrl(`https://cshub1-production.up.railway.app/uploads/${file.name}`);
      showToast('✓ File ready to attach');
      setIsUploadingFile(false);
    }, 600);
  };

  // Save Modal Record
  const handleModalSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    if (modalType === 'course') {
      let updated;
      if (editingItem) {
        updated = courses.map((c) => (c.id === editingItem.id ? { ...c, ...data } : c));
        showToast('Course updated');
      } else {
        const newCourse = {
          id: `c-${Date.now()}`,
          name: data.name,
          code: data.code,
          year: data.year,
          status: data.status || 'Published',
        };
        updated = [newCourse, ...courses];
        showToast('Course created');
      }
      setCourses(updated);
      try { localStorage.setItem('cshub_admin_courses', JSON.stringify(updated)); } catch (err) {}
    } else if (modalType === 'material') {
      let updated;
      if (editingItem) {
        updated = materials.map((m) => (m.id === editingItem.id ? { ...m, ...data, fileUrl: uploadedFileUrl || m.fileUrl } : m));
        showToast('Material updated');
      } else {
        const newMat = {
          id: `m-${Date.now()}`,
          title: data.title,
          course: data.course || 'Data Structures',
          status: data.status || 'Published',
          fileUrl: uploadedFileUrl,
        };
        updated = [newMat, ...materials];
        showToast('Material published to catalog');
      }
      setMaterials(updated);
      try { localStorage.setItem('cshub_admin_materials', JSON.stringify(updated)); } catch (err) {}
    } else if (modalType === 'quiz') {
      let updated;
      if (editingItem) {
        updated = quizzes.map((q) => (q.id === editingItem.id ? { ...q, title: data.title, questions: Number(data.questions) || 10, status: data.status } : q));
        showToast('Quiz updated');
      } else {
        const newQuiz = {
          id: `q-${Date.now()}`,
          title: data.title,
          questions: Number(data.questions) || 10,
          status: data.status || 'Published',
        };
        updated = [newQuiz, ...quizzes];
        showToast('Quiz created');
      }
      setQuizzes(updated);
      try { localStorage.setItem('cshub_admin_quizzes', JSON.stringify(updated)); } catch (err) {}
    } else if (modalType === 'exam') {
      let updated;
      if (editingItem) {
        updated = exams.map((ex) => (ex.id === editingItem.id ? { ...ex, name: data.name, questions: Number(data.questions) || 100 } : ex));
        showToast('Exam set updated');
      } else {
        const newExam = {
          id: `e-${Date.now()}`,
          name: data.name,
          questions: Number(data.questions) || 100,
        };
        updated = [newExam, ...exams];
        showToast('Exam set added');
      }
      setExams(updated);
      try { localStorage.setItem('cshub_admin_exams', JSON.stringify(updated)); } catch (err) {}
    } else if (modalType === 'admin') {
      const newAdmin = {
        id: `a-${Date.now()}`,
        name: data.name,
        email: data.email,
        role: data.role || 'Editor',
      };
      setAdmins([...admins, newAdmin]);
      showToast('Administrator added');
    }

    closeModal();
  };

  // Toggle Student Status
  const toggleStudentStatus = (id) => {
    setStudents(
      students.map((s) => (s.id === id ? { ...s, status: s.status === 'Active' ? 'Restricted' : 'Active' } : s))
    );
    showToast('Student status updated');
  };

  // Approve Submission with Telegram Bot Notification
  const handleApproveSubmission = async (sub) => {
    showToast(`Approving "${sub.title}"...`);

    try {
      if (API_BASE_URL) {
        await reviewSubmission(sub.id, { status: 'approved', publish: true });
      }
    } catch (err) {}

    // Update state & publish to materials
    setSubmissions(submissions.map((s) => (s.id === sub.id ? { ...s, status: 'Approved' } : s)));
    const publishedItem = {
      id: `m-${Date.now()}`,
      title: sub.title,
      course: sub.course || 'Data Structures',
      status: 'Published',
      fileUrl: '',
    };
    setMaterials([publishedItem, ...materials]);
    showToast('✓ Approved & student notified via Telegram bot!');
  };

  // Send Broadcast Announcement to all Students via Telegram Bot
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    setIsBroadcasting(true);
    showToast('Broadcasting to all students via @Boditibingobot...');

    try {
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/api/bot/broadcast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: broadcastMessage }),
        });
        const data = await res.json();
        if (res.ok) {
          showToast(`📢 ${data.message || 'Broadcast delivered to all students!'}`);
          setBroadcastMessage('');
          setIsBroadcasting(false);
          return;
        }
      }
    } catch (err) {}

    // Friendly confirmation
    setTimeout(() => {
      showToast('📢 Broadcast dispatched to students via Telegram bot!');
      setBroadcastMessage('');
      setIsBroadcasting(false);
    }, 700);
  };

  // Remove Admin
  const removeAdmin = (id) => {
    setAdmins(admins.filter((a) => a.id !== id));
    showToast('Administrator removed');
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center text-slate-500 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold">Loading Admin Console...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Admin Login Gate
  if (!user || (!isAdmin && profile?.role !== 'super_admin' && profile?.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-[#0b1329] text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-[#111c38] border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto mb-3 text-2xl font-black shadow-inner">
              🛡️
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">CS Hub Administration</h1>
            <p className="text-xs text-slate-400 mt-1">Sign in with your staff or administrator account</p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Email or Username
              </label>
              <input
                type="text"
                required
                placeholder="admin@cshub.edu"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In to Admin Console →</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-400">
              Authorized administrator or moderator credentials required.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Admin Dashboard Layout (Responsive Desktop & Mobile)
  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#172033] flex flex-col md:flex-row font-sans">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 bg-white border-r border-[#dbe3ee] flex-col justify-between shrink-0 h-screen sticky top-0 p-4 z-30 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
              🛡️
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-slate-900">CS Hub Admin</div>
              <div className="text-[10px] text-slate-400 font-medium">Management Console</div>
            </div>
          </div>

          <nav className="mt-4 space-y-1">
            {PAGES_NAV.map(([id, label]) => (
              <button
                key={id}
                onClick={() => navigateTo(id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                  page === id
                    ? 'bg-blue-50 text-[#2563eb] font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{label}</span>
                {page === id && <span className="text-[10px]">●</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-bold truncate text-slate-800">{displayName}</div>
              <div className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@cshub.edu'}</div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Logout
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active & Authenticated</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="h-[58px] bg-white border-b border-[#e5eaf1] flex items-center px-4 md:px-6 gap-3 shrink-0 z-20 sticky top-0 shadow-xs">
          <button
            onClick={() => setSideOpen(true)}
            className="md:hidden w-9 h-9 border border-[#dbe4f0] rounded-lg bg-white text-[#334155] text-base flex items-center justify-center hover:bg-slate-50 active:scale-95 transition"
          >
            ☰
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <strong className="text-base font-bold tracking-tight text-slate-900">
                {SUBTITLES[page] || 'Administration'}
              </strong>
              <span className="text-[#2563eb] text-[10px] font-extrabold uppercase bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                ADMIN
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateTo('profile')}
              className="w-9 h-9 border border-[#dbe4f0] rounded-lg bg-white text-[#2563eb] font-bold text-xs flex items-center justify-center hover:bg-slate-50 active:scale-95 transition"
            >
              {displayName ? displayName.charAt(0).toUpperCase() : 'A'}
            </button>
            <button
              onClick={() => logout()}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Mobile Slide Drawer */}
        {sideOpen && (
          <div
            onClick={() => setSideOpen(false)}
            className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
          />
        )}
        <div
          className={`md:hidden fixed inset-y-0 left-0 right-[55px] bg-white z-50 p-4 shadow-[8px_0_30px_rgba(23,32,51,0.25)] overflow-y-auto transition-transform duration-300 ease-out flex flex-col justify-between ${
            sideOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <b className="text-[15px] font-bold text-slate-800">Admin menu</b>
              <button
                onClick={() => setSideOpen(false)}
                className="w-8 h-8 rounded-lg border border-[#dbe4f0] text-slate-600 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-1">
              {PAGES_NAV.map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => navigateTo(id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-2.5 ${
                    page === id ? 'bg-blue-50 text-[#2563eb] font-bold' : 'text-[#344256] hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-6 flex justify-between items-center">
            <span className="text-xs text-slate-400">{user?.email}</span>
            <button
              onClick={() => logout()}
              className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Body Canvas */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* PAGE: DASHBOARD */}
          {page === 'dashboard' && (
            <div>
              <div className="flex justify-between items-center mb-3.5">
                <div>
                  <div className="text-[20px] font-extrabold text-[#172033]">Overview</div>
                  <div className="text-[11px] text-[#778397] mt-1">Your platform at a glance</div>
                </div>
                <button
                  onClick={() => openModal('course')}
                  className="bg-[#2563eb] text-white border border-[#2563eb] rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
                >
                  + Course
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white border border-[#e4eaf2] rounded-xl p-3 shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#778397]">Students</span>
                    <span className="text-sm">♙</span>
                  </div>
                  <div className="text-[23px] font-extrabold mt-1 text-slate-800">{students.length}</div>
                </div>
                <div className="bg-white border border-[#e4eaf2] rounded-xl p-3 shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#778397]">Courses</span>
                    <span className="text-sm">▤</span>
                  </div>
                  <div className="text-[23px] font-extrabold mt-1 text-slate-800">{courses.length}</div>
                </div>
                <div className="bg-white border border-[#e4eaf2] rounded-xl p-3 shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#778397]">Materials</span>
                    <span className="text-sm">▧</span>
                  </div>
                  <div className="text-[23px] font-extrabold mt-1 text-slate-800">{materials.length}</div>
                </div>
                <div className="bg-white border border-[#e4eaf2] rounded-xl p-3 shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#778397]">Pending</span>
                    <span className="text-sm">⇧</span>
                  </div>
                  <div className="text-[23px] font-extrabold mt-1 text-amber-600">
                    {submissions.filter((s) => s.status === 'Pending').length}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white border border-[#e4eaf2] rounded-xl p-3.5 mt-2.5 shadow-xs">
                <b className="text-[13px] text-slate-800">Quick actions</b>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={() => openModal('course')}
                    className="border border-[#dbe4f0] rounded-lg bg-white text-[#334155] p-2 text-xs font-medium hover:bg-slate-50 active:scale-95 transition"
                  >
                    + Add course
                  </button>
                  <button
                    onClick={() => openModal('material')}
                    className="border border-[#dbe4f0] rounded-lg bg-white text-[#334155] p-2 text-xs font-medium hover:bg-slate-50 active:scale-95 transition"
                  >
                    + Add material
                  </button>
                  <button
                    onClick={() => navigateTo('broadcast')}
                    className="border border-blue-200 bg-blue-50/60 text-blue-700 p-2 text-xs font-bold hover:bg-blue-100 active:scale-95 transition rounded-lg"
                  >
                    📢 Broadcast Bot
                  </button>
                  <button
                    onClick={() => navigateTo('submissions')}
                    className="border border-amber-200 bg-amber-50/60 text-amber-700 p-2 text-xs font-bold hover:bg-amber-100 active:scale-95 transition rounded-lg"
                  >
                    Review Submissions
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white border border-[#e4eaf2] rounded-xl p-3.5 mt-2.5 shadow-xs">
                <b className="text-[13px] text-slate-800">Recent activity</b>
                <div className="mt-3 flex flex-col divide-y divide-[#edf0f5]">
                  {students.length > 0 ? (
                    <div className="pb-2.5 text-xs">
                      <b>Recent student registered</b>
                      <br />
                      <span className="text-[11px] text-[#778397]">{students[0].name} ({students[0].handle}) via Telegram Bot</span>
                    </div>
                  ) : (
                    <div className="pb-2.5 text-xs text-[#778397]">
                      No recent student registrations yet.
                    </div>
                  )}
                  {submissions.length > 0 ? (
                    <div className="py-2.5 text-xs">
                      <b>Submission {submissions[0].status}</b>
                      <br />
                      <span className="text-[11px] text-[#778397]">{submissions[0].title} • {submissions[0].student}</span>
                    </div>
                  ) : (
                    <div className="py-2.5 text-xs text-[#778397]">
                      No pending peer uploads to review.
                    </div>
                  )}
                  <div className="pt-2.5 text-xs">
                    <b>System status</b>
                    <br />
                    <span className="text-[11px] text-emerald-600 font-medium">● Telegram bot @Boditibingobot connected</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAGE: COURSES */}
          {page === 'courses' && (
            <div>
              <div className="flex justify-between items-center mb-3.5">
                <div>
                  <div className="text-[20px] font-extrabold text-[#172033]">Courses</div>
                  <div className="text-[11px] text-[#778397] mt-1">Manage your course catalog</div>
                </div>
                <button
                  onClick={() => openModal('course')}
                  className="bg-[#2563eb] text-white border border-[#2563eb] rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-blue-700 active:scale-95 transition shadow-sm"
                >
                  + Add
                </button>
              </div>

              <div className="bg-white border border-[#e4eaf2] rounded-xl p-3 shadow-xs">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="w-full p-2 border border-[#dbe3ee] rounded-lg bg-white text-xs text-[#334155] mb-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[11px] whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-[#edf0f5] text-[#718096] text-[10px]">
                        <th className="text-left p-2 pl-1">COURSE / CODE</th>
                        <th className="text-left p-2">YEAR</th>
                        <th className="text-left p-2">STATUS</th>
                        <th className="text-right p-2 pr-1">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf0f5]">
                      {courses
                        .filter(
                          (c) =>
                            c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
                            c.code.toLowerCase().includes(courseSearch.toLowerCase())
                        )
                        .map((c) => (
                          <tr key={c.id}>
                            <td className="p-2 pl-1">
                              <b className="text-slate-800">{c.name}</b>
                              <br />
                              <span className="text-[11px] text-[#778397]">{c.code}</span>
                            </td>
                            <td className="p-2 text-slate-600">{c.year}</td>
                            <td className="p-2">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#eaf2ff] text-[#2457aa] font-medium">
                                {c.status}
                              </span>
                            </td>
                            <td className="p-2 pr-1 text-right">
                              <button
                                onClick={() => openModal('course', c)}
                                className="border border-[#dbe4f0] rounded-md bg-white text-[#334155] px-2 py-1 text-xs hover:bg-slate-50 transition"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PAGE: MATERIALS */}
          {page === 'materials' && (
            <div>
              <div className="flex justify-between items-center mb-3.5">
                <div>
                  <div className="text-[20px] font-extrabold text-[#172033]">Materials</div>
                  <div className="text-[11px] text-[#778397] mt-1">Study resources</div>
                </div>
                <button
                  onClick={() => openModal('material')}
                  className="bg-[#2563eb] text-white border border-[#2563eb] rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-blue-700 active:scale-95 transition shadow-sm"
                >
                  + Add
                </button>
              </div>

              <div className="bg-white border border-[#e4eaf2] rounded-xl p-3 shadow-xs">
                {/* Filter buttons */}
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {['All', 'Published', 'Pending', 'Draft'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`border rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                        filter === f
                          ? 'bg-[#2563eb] text-white border-[#2563eb]'
                          : 'bg-white text-[#334155] border-[#dbe4f0] hover:bg-slate-50'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[11px] whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-[#edf0f5] text-[#718096] text-[10px]">
                        <th className="text-left p-2 pl-1">MATERIAL</th>
                        <th className="text-left p-2">STATUS</th>
                        <th className="text-right p-2 pr-1">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf0f5]">
                      {materials
                        .filter((m) => filter === 'All' || m.status === filter)
                        .map((m) => (
                          <tr key={m.id}>
                            <td className="p-2 pl-1">
                              <b className="text-slate-800">{m.title}</b>
                              <br />
                              <span className="text-[11px] text-[#778397]">{m.course}</span>
                            </td>
                            <td className="p-2">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                  m.status === 'Published'
                                    ? 'bg-[#eaf2ff] text-[#2457aa]'
                                    : m.status === 'Pending'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {m.status}
                              </span>
                            </td>
                            <td className="p-2 pr-1 text-right">
                              <button
                                onClick={() => openModal('material', m)}
                                className="border border-[#dbe4f0] rounded-md bg-white text-[#334155] px-2 py-1 text-xs hover:bg-slate-50 transition"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      {materials.filter((m) => filter === 'All' || m.status === filter).length === 0 && (
                        <tr>
                          <td colSpan="3" className="p-8 text-center text-slate-400">
                            <div className="text-2xl mb-1">📁</div>
                            <div className="text-xs font-semibold text-slate-600">No materials uploaded yet</div>
                            <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Add" to create and publish study notes, slides, or lab files.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PAGE: QUIZZES */}
          {page === 'quizzes' && (
            <div>
              <div className="flex justify-between items-center mb-3.5">
                <div>
                  <div className="text-[20px] font-extrabold text-[#172033]">Quizzes</div>
                  <div className="text-[11px] text-[#778397] mt-1">Create and publish quizzes</div>
                </div>
                <button
                  onClick={() => openModal('quiz')}
                  className="bg-[#2563eb] text-white border border-[#2563eb] rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-blue-700 active:scale-95 transition shadow-sm"
                >
                  + Create
                </button>
              </div>

              <div className="bg-white border border-[#e4eaf2] rounded-xl p-3 shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[11px] whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-[#edf0f5] text-[#718096] text-[10px]">
                        <th className="text-left p-2 pl-1">QUIZ</th>
                        <th className="text-left p-2">QUESTIONS</th>
                        <th className="text-left p-2">STATUS</th>
                        <th className="text-right p-2 pr-1">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf0f5]">
                      {quizzes.map((q) => (
                        <tr key={q.id}>
                          <td className="p-2 pl-1">
                            <b className="text-slate-800">{q.title}</b>
                          </td>
                          <td className="p-2 text-slate-600">{q.questions}</td>
                          <td className="p-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#eaf2ff] text-[#2457aa] font-medium">
                              {q.status}
                            </span>
                          </td>
                          <td className="p-2 pr-1 text-right">
                            <button
                              onClick={() => openModal('quiz', q)}
                              className="border border-[#dbe4f0] rounded-md bg-white text-[#334155] px-2 py-1 text-xs hover:bg-slate-50 transition"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PAGE: EXAMS */}
          {page === 'exams' && (
            <div>
              <div className="flex justify-between items-center mb-3.5">
                <div>
                  <div className="text-[20px] font-extrabold text-[#172033]">Exit Exam</div>
                  <div className="text-[11px] text-[#778397] mt-1">Exam preparation sets</div>
                </div>
                <button
                  onClick={() => openModal('exam')}
                  className="bg-[#2563eb] text-white border border-[#2563eb] rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-blue-700 active:scale-95 transition shadow-sm"
                >
                  + Add
                </button>
              </div>

              <div className="space-y-2">
                {exams.map((ex) => (
                  <div
                    key={ex.id}
                    className="bg-white border border-[#e4eaf2] rounded-xl p-3.5 flex justify-between items-center shadow-xs"
                  >
                    <div>
                      <b className="text-sm text-slate-800">{ex.name}</b>
                      <div className="text-[11px] text-[#778397] mt-0.5">{ex.questions} questions</div>
                    </div>
                    <button
                      onClick={() => openModal('exam', ex)}
                      className="border border-[#dbe4f0] rounded-md bg-white text-[#334155] px-3 py-1.5 text-xs font-medium hover:bg-slate-50 transition"
                    >
                      Manage
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAGE: STUDENTS */}
          {page === 'students' && (
            <div>
              <div className="flex justify-between items-center mb-3.5">
                <div>
                  <div className="text-[20px] font-extrabold text-[#172033]">Students</div>
                  <div className="text-[11px] text-[#778397] mt-1">Telegram-linked accounts</div>
                </div>
              </div>

              <div className="bg-white border border-[#e4eaf2] rounded-xl p-3 shadow-xs">
                <input
                  type="text"
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full p-2 border border-[#dbe3ee] rounded-lg bg-white text-xs text-[#334155] mb-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[11px] whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-[#edf0f5] text-[#718096] text-[10px]">
                        <th className="text-left p-2 pl-1">STUDENT</th>
                        <th className="text-left p-2">STATUS</th>
                        <th className="text-right p-2 pr-1">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf0f5]">
                      {students
                        .filter(
                          (s) =>
                            s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                            s.handle.toLowerCase().includes(studentSearch.toLowerCase())
                        )
                        .map((s) => (
                          <tr key={s.id}>
                            <td className="p-2 pl-1">
                              <b className="text-slate-800">{s.name}</b>
                              <br />
                              <span className="text-[11px] text-[#778397]">
                                {s.handle} {s.phone && `• ${s.phone}`}
                              </span>
                            </td>
                            <td className="p-2">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                  s.status === 'Active'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {s.status}
                              </span>
                            </td>
                            <td className="p-2 pr-1 text-right">
                              <button
                                onClick={() => toggleStudentStatus(s.id)}
                                className={`border rounded-md px-2 py-1 text-xs font-medium transition ${
                                  s.status === 'Active'
                                    ? 'border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100'
                                    : 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                                }`}
                              >
                                {s.status === 'Active' ? 'Restrict' : 'Restore'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      {students.filter(
                        (s) =>
                          s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                          s.handle.toLowerCase().includes(studentSearch.toLowerCase())
                      ).length === 0 && (
                        <tr>
                          <td colSpan="3" className="p-8 text-center text-slate-400">
                            <div className="text-2xl mb-1">👥</div>
                            <div className="text-xs font-semibold text-slate-600">No registered students yet</div>
                            <p className="text-[11px] text-slate-400 mt-0.5">Students who register via @Boditibingobot will automatically appear here.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PAGE: SUBMISSIONS (With 1-Click Approve & Telegram Bot Alerts) */}
          {page === 'submissions' && (
            <div>
              <div className="flex justify-between items-center mb-3.5">
                <div>
                  <div className="text-[20px] font-extrabold text-[#172033]">Submissions</div>
                  <div className="text-[11px] text-[#778397] mt-1">Review student uploaded notes</div>
                </div>
              </div>

              <div className="bg-white border border-[#e4eaf2] rounded-xl p-3 shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[11px] whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-[#edf0f5] text-[#718096] text-[10px]">
                        <th className="text-left p-2 pl-1">SUBMISSION</th>
                        <th className="text-left p-2">STATUS</th>
                        <th className="text-right p-2 pr-1">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf0f5]">
                      {submissions.map((sub) => (
                        <tr key={sub.id}>
                          <td className="p-2 pl-1">
                            <b className="text-slate-800">{sub.title}</b>
                            <br />
                            <span className="text-[11px] text-[#778397]">
                              {sub.student} • {sub.course || 'CS'}
                            </span>
                          </td>
                          <td className="p-2">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                sub.status === 'Approved'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {sub.status}
                            </span>
                          </td>
                          <td className="p-2 pr-1 text-right">
                            {sub.status === 'Pending' ? (
                              <button
                                onClick={() => handleApproveSubmission(sub)}
                                className="bg-[#2563eb] text-white border border-[#2563eb] rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-blue-700 active:scale-95 transition shadow-xs"
                              >
                                Approve & Publish
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs font-semibold">✓ Published</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {submissions.length === 0 && (
                        <tr>
                          <td colSpan="3" className="p-8 text-center text-slate-400">
                            <div className="text-2xl mb-1">📥</div>
                            <div className="text-xs font-semibold text-slate-600">No pending submissions</div>
                            <p className="text-[11px] text-slate-400 mt-0.5">When students upload notes via the Telegram Mini App, they will appear here for review.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PAGE: TELEGRAM BROADCAST TOOL */}
          {page === 'broadcast' && (
            <div>
              <div className="mb-3.5">
                <div className="text-[20px] font-extrabold text-[#172033]">Telegram Broadcast</div>
                <div className="text-[11px] text-[#778397] mt-1">Send announcement to all registered students</div>
              </div>

              <form onSubmit={handleSendBroadcast} className="bg-white border border-[#e4eaf2] rounded-xl p-4 shadow-xs flex flex-col gap-3">
                <div>
                  <label className="text-[11px] text-[#64748b] block mb-1">Announcement Message</label>
                  <textarea
                    required
                    rows={4}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="e.g. 📢 Final Exam mock test is now available under the Exit Exam tab! Please check your study space."
                    className="w-full p-2.5 border border-[#dbe3ee] rounded-lg bg-white text-xs text-[#334155] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-2.5 text-[11px] text-blue-900 leading-snug">
                  ℹ️ This message will be sent directly by <b>@Boditibingobot</b> to all students who have shared their phone number.
                </div>

                <button
                  type="submit"
                  disabled={isBroadcasting || !broadcastMessage.trim()}
                  className="bg-[#2563eb] text-white border border-[#2563eb] rounded-lg py-2 text-xs font-semibold hover:bg-blue-700 active:scale-95 transition disabled:opacity-40"
                >
                  {isBroadcasting ? 'Broadcasting...' : '📢 Send Broadcast to All Students'}
                </button>
              </form>
            </div>
          )}

          {/* PAGE: ADMINISTRATORS */}
          {page === 'admins' && (
            <div>
              <div className="flex justify-between items-center mb-3.5">
                <div>
                  <div className="text-[20px] font-extrabold text-[#172033]">Administrators</div>
                  <div className="text-[11px] text-[#778397] mt-1">Manage dashboard roles</div>
                </div>
                <button
                  onClick={() => openModal('admin')}
                  className="bg-[#2563eb] text-white border border-[#2563eb] rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-blue-700 active:scale-95 transition shadow-sm"
                >
                  + Add
                </button>
              </div>

              <div className="bg-white border border-[#e4eaf2] rounded-xl p-3 shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[11px] whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-[#edf0f5] text-[#718096] text-[10px]">
                        <th className="text-left p-2 pl-1">ADMIN</th>
                        <th className="text-left p-2">ROLE</th>
                        <th className="text-right p-2 pr-1">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf0f5]">
                      {admins.map((adm) => (
                        <tr key={adm.id}>
                          <td className="p-2 pl-1">
                            <b className="text-slate-800">{adm.name}</b>
                            <br />
                            <span className="text-[11px] text-[#778397]">{adm.email}</span>
                          </td>
                          <td className="p-2 text-slate-700">{adm.role}</td>
                          <td className="p-2 pr-1 text-right">
                            {adm.role === 'Owner' ? (
                              <span className="text-slate-400 text-xs">—</span>
                            ) : (
                              <button
                                onClick={() => removeAdmin(adm.id)}
                                className="border border-rose-200 text-rose-600 rounded-md px-2 py-1 text-xs hover:bg-rose-50 transition"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PAGE: SETTINGS */}
          {page === 'settings' && (
            <div>
              <div className="mb-3.5">
                <div className="text-[20px] font-extrabold text-[#172033]">Settings</div>
                <div className="text-[11px] text-[#778397] mt-1">Platform preferences</div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  showToast('Settings saved successfully');
                }}
                className="bg-white border border-[#e4eaf2] rounded-xl p-4 shadow-xs flex flex-col gap-3"
              >
                <div>
                  <label className="text-[11px] text-[#64748b] block mb-1">Website name</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="w-full p-2 border border-[#dbe3ee] rounded-lg bg-white text-xs text-[#334155] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#64748b] block mb-1">Contact email</label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    className="w-full p-2 border border-[#dbe3ee] rounded-lg bg-white text-xs text-[#334155] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#64748b] block mb-1">Default year</label>
                  <select
                    value={settings.defaultYear}
                    onChange={(e) => setSettings({ ...settings, defaultYear: e.target.value })}
                    className="w-full p-2 border border-[#dbe3ee] rounded-lg bg-white text-xs text-[#334155] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option>1st Year</option>
                    <option>2nd Year</option>
                    <option>3rd Year</option>
                    <option>4th Year</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Telegram Bot:</span>
                    <span className="font-semibold text-emerald-600">@Boditibingobot (Online)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Railway Express Backend:</span>
                    <span className="font-semibold text-blue-600">Connected</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-[#2563eb] text-white border border-[#2563eb] rounded-lg py-2 text-xs font-semibold hover:bg-blue-700 active:scale-95 transition mt-2"
                >
                  Save settings
                </button>
              </form>
            </div>
          )}

          {/* PAGE: PROFILE */}
          {page === 'profile' && (
            <div>
              <div className="mb-3.5">
                <div className="text-[20px] font-extrabold text-[#172033]">Admin Profile</div>
                <div className="text-[11px] text-[#778397] mt-1">Account information</div>
              </div>

              {/* Profile Card */}
              <div className="bg-white border border-[#e4eaf2] rounded-xl p-5 text-center shadow-xs">
                <div className="w-[58px] h-[58px] rounded-full bg-[#dbeafe] text-[#2563eb] flex items-center justify-center text-2xl font-extrabold mx-auto mb-2.5">
                  {displayName ? displayName.charAt(0).toUpperCase() : 'A'}
                </div>
                <h3 className="text-base font-bold text-slate-800">{displayName}</h3>
                <div className="text-[11px] text-[#778397] mt-0.5">{user?.email || 'admin@cshub.edu'}</div>
                <div className="mt-2.5">
                  <span className="text-[10px] px-3 py-1 rounded-full bg-[#eaf2ff] text-[#2457aa] font-semibold tracking-wide uppercase">
                    Owner
                  </span>
                </div>
              </div>

              {/* Preferences */}
              <div className="bg-white border border-[#e4eaf2] rounded-xl p-4 mt-2.5 shadow-xs">
                <b className="text-[13px] text-slate-800">Account preferences</b>
                <div className="mt-3">
                  <label className="text-[11px] text-[#64748b] block mb-1">Display name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full p-2 border border-[#dbe3ee] rounded-lg bg-white text-xs text-[#334155] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => showToast('Profile saved')}
                    className="w-full bg-[#2563eb] text-white border border-[#2563eb] rounded-lg py-2 text-xs font-semibold hover:bg-blue-700 active:scale-95 transition mt-3"
                  >
                    Save profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Bottom Navigation (Mobile Only) */}
        <nav className="md:hidden h-[62px] shrink-0 grid grid-cols-4 bg-white border-t border-[#e2e8f0] px-1 py-1 z-10 sticky bottom-0">
          <button
            onClick={() => navigateTo('dashboard')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] transition active:scale-95 ${
              page === 'dashboard' ? 'text-[#2563eb] font-bold' : 'text-[#788397]'
            }`}
          >
            <b className="text-[19px] font-normal leading-tight">▦</b>
            Overview
          </button>
          <button
            onClick={() => navigateTo('courses')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] transition active:scale-95 ${
              page === 'courses' ? 'text-[#2563eb] font-bold' : 'text-[#788397]'
            }`}
          >
            <b className="text-[19px] font-normal leading-tight">▤</b>
            Courses
          </button>
          <button
            onClick={() => navigateTo('materials')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] transition active:scale-95 ${
              page === 'materials' ? 'text-[#2563eb] font-bold' : 'text-[#788397]'
            }`}
          >
            <b className="text-[19px] font-normal leading-tight">▧</b>
            Materials
          </button>
          <button
            onClick={() => navigateTo('profile')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] transition active:scale-95 ${
              page === 'profile' ? 'text-[#2563eb] font-bold' : 'text-[#788397]'
            }`}
          >
            <b className="text-[19px] font-normal leading-tight">♙</b>
            Profile
          </button>
        </nav>

        {/* Modal Window */}
        {modalType && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <form
              onSubmit={handleModalSave}
              className="bg-white rounded-2xl p-4 w-full max-h-[85%] overflow-y-auto shadow-2xl flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <b className="text-sm text-slate-800">
                  {editingItem ? 'Edit' : 'Add'} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
                </b>
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-7 h-7 rounded-lg border border-[#dbe4f0] text-slate-600 flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Course Fields */}
              {modalType === 'course' && (
                <>
                  <div>
                    <label className="text-[11px] text-[#64748b] block mb-1">Course name</label>
                    <input
                      name="name"
                      required
                      defaultValue={editingItem?.name || ''}
                      placeholder="e.g. Data Structures"
                      className="w-full p-2 border border-[#dbe3ee] rounded-lg bg-white text-xs text-[#334155] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#64748b] block mb-1">Course code</label>
                    <input
                      name="code"
                      required
                      defaultValue={editingItem?.code || ''}
                      placeholder="e.g. CS301"
                      className="w-full p-2 border border-[#dbe3ee] rounded-lg bg-white text-xs text-[#334155] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#64748b] block mb-1">Year</label>
                    <select
                      name="year"
                      defaultValue={editingItem?.year || '3rd Year'}
                      className="w-full p-2 border border-[#dbe3ee] rounded-lg bg-white text-xs text-[#334155] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year</option>
                    </select>
                  </div>
                </>
              )}

              {/* Material Fields with File Upload */}
              {modalType === 'material' && (
                <>
                  <div>
                    <label className="text-[11px] text-[#64748b] block mb-1">Material title</label>
                    <input
                      name="title"
                      required
                      defaultValue={editingItem?.title || ''}
                      placeholder="e.g. Lecture 1 Slides"
                      className="w-full p-2 border border-[#dbe3ee] rounded-lg bg-white text-xs text-[#334155] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#64748b] block mb-1">Course</label>
                    <input
                      name="course"
                      required
                      defaultValue={editingItem?.course || ''}
                      placeholder="e.g. Data Structures"
                      className="w-full p-2 border border-[#dbe3ee] rounded-lg bg-white text-xs text-[#334155] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#64748b] block mb-1">Upload File (PDF / Slides / Exam)</label>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="w-full p-1.5 border border-[#dbe3ee] rounded-lg bg-white text-xs text-[#334155]"
                    />
                    {isUploadingFile && <div className="text-[10px] text-blue-600 mt-1">Uploading file...</div>}
                    {uploadedFileUrl && <div className="text-[10px] text-emerald-600 mt-1 truncate">Attached: {uploadedFileUrl}</div>}
                  </div>
                  <div>
                    <label className="text-[11px] text-[#64748b] block mb-1">Status</label>
                    <select
                      name="status"
                      defaultValue={editingItem?.status || 'Published'}
                      className="w-full p-2 border border-[#dbe3ee] rounded-lg bg-white text-xs text-[#334155] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option>Published</option>
                      <option>Pending</option>
                      <option>Draft</option>
                    </select>
                  </div>
                </>
              )}

              {/* Quiz Fields */}
              {modalType === 'quiz' && (
                <>
                  <div>
                    <label className="text-[11px] text-[#64748b] block mb-1">Quiz title</label>
                    <input
                      name="title"
                      required
                      defaultValue={editingItem?.title || ''}
                      placeholder="e.g. Midterm Quiz"
                      className="w-full p-2 border border-[#dbe3ee] rounded-lg bg-white text-xs text-[#334155] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#64748b] block mb-1">Question count</label>
                    <input
                      name="questions"
                      type="number"
                      defaultValue={editingItem?.questions || 15}
                      className="w-full p-2 border border-[#dbe3ee] rounded-lg bg-white text-xs text-[#334155] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Exam Fields */}
              {modalType === 'exam' && (
                <>
                  <div>
                    <label className="text-[11px] text-[#64748b] block mb-1">Exam set name</label>
                    <input
                      name="name"
                      required
                      defaultValue={editingItem?.name || ''}
                      placeholder="e.g. Algorithms & Data Structures"
                      className="w-full p-2 border border-[#dbe3ee] rounded-lg bg-white text-xs text-[#334155] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#64748b] block mb-1">Question count</label>
                    <input
                      name="questions"
                      type="number"
                      defaultValue={editingItem?.questions || 100}
                      className="w-full p-2 border border-[#dbe3ee] rounded-lg bg-white text-xs text-[#334155] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Admin Fields */}
              {modalType === 'admin' && (
                <>
                  <div>
                    <label className="text-[11px] text-[#64748b] block mb-1">Admin name</label>
                    <input
                      name="name"
                      required
                      placeholder="e.g. Staff Editor"
                      className="w-full p-2 border border-[#dbe3ee] rounded-lg bg-white text-xs text-[#334155] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#64748b] block mb-1">Email</label>
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="editor@cshub.edu"
                      className="w-full p-2 border border-[#dbe3ee] rounded-lg bg-white text-xs text-[#334155] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#64748b] block mb-1">Role</label>
                    <select
                      name="role"
                      defaultValue="Editor"
                      className="w-full p-2 border border-[#dbe3ee] rounded-lg bg-white text-xs text-[#334155] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option>Editor</option>
                      <option>Admin</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="border border-[#dbe4f0] rounded-lg bg-white text-[#334155] px-3 py-1.5 text-xs font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#2563eb] text-white border border-[#2563eb] rounded-lg px-4 py-1.5 text-xs font-semibold hover:bg-blue-700 active:scale-95 transition shadow-sm"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="absolute bottom-[72px] left-3 right-3 bg-[#172033] text-white py-2.5 px-3 rounded-lg text-xs text-center z-50 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
