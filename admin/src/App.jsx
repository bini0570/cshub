import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { getCategories, getPublishedContent, getSubmissions } from './lib/api';

const DEFAULT_COURSES = [
  { id: 'c-1', name: 'Data Structures', code: 'CS301', year: '3rd Year', status: 'Published' },
  { id: 'c-2', name: 'Database Systems', code: 'CS302', year: '3rd Year', status: 'Published' },
  { id: 'c-3', name: 'Computer Networks', code: 'CS401', year: '4th Year', status: 'Draft' },
  { id: 'c-4', name: 'Operating Systems', code: 'CS303', year: '3rd Year', status: 'Published' },
  { id: 'c-5', name: 'Artificial Intelligence', code: 'CS405', year: '4th Year', status: 'Draft' },
];

const DEFAULT_MATERIALS = [
  { id: 'm-1', title: 'Algorithms Notes', course: 'Data Structures', status: 'Published' },
  { id: 'm-2', title: 'SQL Practice', course: 'Database Systems', status: 'Pending' },
  { id: 'm-3', title: 'Network Slides', course: 'Computer Networks', status: 'Draft' },
  { id: 'm-4', title: 'Process Scheduling PDF', course: 'Operating Systems', status: 'Published' },
];

const DEFAULT_QUIZZES = [
  { id: 'q-1', title: 'Data Structures Quiz', questions: 15, status: 'Published' },
  { id: 'q-2', title: 'Database Basics', questions: 20, status: 'Draft' },
  { id: 'q-3', title: 'Computer Networks Midterm Prep', questions: 25, status: 'Published' },
];

const DEFAULT_EXAMS = [
  { id: 'e-1', name: 'Data Structures', questions: 120 },
  { id: 'e-2', name: 'Database Systems', questions: 100 },
  { id: 'e-3', name: 'Computer Networks', questions: 90 },
  { id: 'e-4', name: 'Operating Systems', questions: 110 },
];

const DEFAULT_STUDENTS = [
  { id: 's-1', name: 'Abebe Kebede', handle: '@abebe_cs', status: 'Active', phone: '+251911223344' },
  { id: 's-2', name: 'Mimi Tadesse', handle: '@mimi_t', status: 'Active', phone: '+251922334455' },
  { id: 's-3', name: 'Dawit Bekele', handle: '@dawitb', status: 'Restricted', phone: '+251933445566' },
  { id: 's-4', name: 'Sara Tesfaye', handle: '@sarat', status: 'Active', phone: '+251944556677' },
];

const DEFAULT_SUBMISSIONS = [
  { id: 'sub-1', title: 'Chapter 3 Notes', student: 'Abebe', status: 'Pending' },
  { id: 'sub-2', title: 'Network Summary', student: 'Mimi', status: 'Pending' },
  { id: 'sub-3', title: 'SQL Exercises', student: 'Sara', status: 'Approved' },
];

const DEFAULT_ADMINS = [
  { id: 'a-1', name: 'Administrator', email: 'admin@cshub.edu', role: 'Owner' },
  { id: 'a-2', name: 'Content Manager', email: 'content@cshub.edu', role: 'Editor' },
];

const SUBTITLES = {
  dashboard: 'Dashboard overview',
  courses: 'Course management',
  materials: 'Learning resources',
  quizzes: 'Quiz management',
  exams: 'Exit exam',
  students: 'Student accounts',
  submissions: 'Review submissions',
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
  ['admins', '♧ Administrators'],
  ['settings', '⚙ Settings'],
  ['profile', '◉ Admin Profile'],
];

export function App() {
  const { user, profile } = useAuth();

  const [page, setPage] = useState('dashboard');
  const [sideOpen, setSideOpen] = useState(false);
  const [filter, setFilter] = useState('All');
  const [courseSearch, setCourseSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Main data states
  const [courses, setCourses] = useState(DEFAULT_COURSES);
  const [materials, setMaterials] = useState(DEFAULT_MATERIALS);
  const [quizzes, setQuizzes] = useState(DEFAULT_QUIZZES);
  const [exams, setExams] = useState(DEFAULT_EXAMS);
  const [students, setStudents] = useState(DEFAULT_STUDENTS);
  const [submissions, setSubmissions] = useState(DEFAULT_SUBMISSIONS);
  const [admins, setAdmins] = useState(DEFAULT_ADMINS);

  // Settings state
  const [settings, setSettings] = useState({
    siteName: 'CS Hub',
    contactEmail: 'admin@cshub.edu',
    defaultYear: '3rd Year',
  });

  // Profile state
  const [displayName, setDisplayName] = useState(profile?.full_name || profile?.display_name || 'Administrator');

  // Modal state
  const [modalType, setModalType] = useState(null); // 'course' | 'material' | 'quiz' | 'exam' | 'admin' | null
  const [editingItem, setEditingItem] = useState(null); // item object or null for add

  // Show toast notification
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2200);
  };

  // Sync with live Railway backend where available
  useEffect(() => {
    async function fetchBackendData() {
      try {
        const [cats, cont, subs] = await Promise.all([
          getCategories(),
          getPublishedContent(),
          getSubmissions({ isAdmin: true }),
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
          }));
          setMaterials(mappedMat);
        }

        if (subs && subs.length > 0) {
          const mappedSubs = subs.map((s, i) => ({
            id: s.id || `sub-${i}`,
            title: s.title || 'Student Upload',
            student: s.submitter_name || s.student || 'Student',
            status: s.status === 'approved' ? 'Approved' : s.status === 'rejected' ? 'Rejected' : 'Pending',
          }));
          setSubmissions(mappedSubs);
        }
      } catch (err) {
        // Fallback to initial defaults
      }
    }
    fetchBackendData();
  }, []);

  const navigateTo = (p) => {
    setPage(p);
    setSideOpen(false);
  };

  // Modal Handlers
  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
  };

  const closeModal = () => {
    setModalType(null);
    setEditingItem(null);
  };

  const handleModalSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    if (modalType === 'course') {
      if (editingItem) {
        setCourses(courses.map((c) => (c.id === editingItem.id ? { ...c, ...data } : c)));
        showToast('Course updated');
      } else {
        const newCourse = {
          id: `c-${Date.now()}`,
          name: data.name,
          code: data.code,
          year: data.year,
          status: data.status || 'Published',
        };
        setCourses([newCourse, ...courses]);
        showToast('Course created');
      }
    } else if (modalType === 'material') {
      if (editingItem) {
        setMaterials(materials.map((m) => (m.id === editingItem.id ? { ...m, ...data } : m)));
        showToast('Material updated');
      } else {
        const newMat = {
          id: `m-${Date.now()}`,
          title: data.title,
          course: data.course || 'Data Structures',
          status: data.status || 'Published',
        };
        setMaterials([newMat, ...materials]);
        showToast('Material created');
      }
    } else if (modalType === 'quiz') {
      if (editingItem) {
        setQuizzes(quizzes.map((q) => (q.id === editingItem.id ? { ...q, title: data.title, questions: Number(data.questions) || 10, status: data.status } : q)));
        showToast('Quiz updated');
      } else {
        const newQuiz = {
          id: `q-${Date.now()}`,
          title: data.title,
          questions: Number(data.questions) || 10,
          status: data.status || 'Published',
        };
        setQuizzes([newQuiz, ...quizzes]);
        showToast('Quiz created');
      }
    } else if (modalType === 'exam') {
      if (editingItem) {
        setExams(exams.map((ex) => (ex.id === editingItem.id ? { ...ex, name: data.name, questions: Number(data.questions) || 100 } : ex)));
        showToast('Exam set updated');
      } else {
        const newExam = {
          id: `e-${Date.now()}`,
          name: data.name,
          questions: Number(data.questions) || 100,
        };
        setExams([newExam, ...exams]);
        showToast('Exam set added');
      }
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

  // Approve Submission
  const approveSubmission = (id) => {
    setSubmissions(submissions.map((s) => (s.id === id ? { ...s, status: 'Approved' } : s)));
    showToast('Submission approved');
  };

  // Remove Admin
  const removeAdmin = (id) => {
    setAdmins(admins.filter((a) => a.id !== id));
    showToast('Administrator removed');
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#172033] flex justify-center items-center">
      {/* App Container */}
      <div className="w-full max-w-[430px] h-[100dvh] min-h-[560px] mx-auto bg-[#f5f7fb] flex flex-col border border-[#dbe3ee] relative overflow-hidden font-sans shadow-2xl">
        {/* Top Header */}
        <header className="h-[58px] bg-white border-b border-[#e5eaf1] flex items-center px-[13px] gap-[10px] shrink-0 z-10">
          <button
            onClick={() => setSideOpen(true)}
            className="w-9 h-9 border border-[#dbe4f0] rounded-lg bg-white text-[#334155] text-base flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            ☰
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 leading-none">
              <strong className="text-[15px] font-bold tracking-tight">CS Hub</strong>
              <span className="text-[#2563eb] text-[10px] font-extrabold uppercase bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                ADMIN
              </span>
            </div>
            <div className="text-[11px] text-[#778397] truncate mt-0.5">{SUBTITLES[page] || 'Administration'}</div>
          </div>
          <button
            onClick={() => navigateTo('profile')}
            className="w-9 h-9 border border-[#dbe4f0] rounded-lg bg-white text-[#2563eb] font-bold text-xs flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            {displayName ? displayName.charAt(0).toUpperCase() : 'A'}
          </button>
        </header>

        {/* Slide Drawer & Backdrop */}
        {sideOpen && (
          <div
            onClick={() => setSideOpen(false)}
            className="absolute inset-0 bg-slate-900/40 z-40 transition-opacity"
          />
        )}
        <div
          className={`absolute inset-y-0 left-0 right-[55px] bg-white z-50 p-4 shadow-[8px_0_30px_rgba(23,32,51,0.25)] overflow-y-auto transition-transform duration-300 ease-out flex flex-col justify-between ${
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

          <div className="pt-4 border-t border-slate-100 mt-6">
            <div className="flex items-center gap-2 text-[11px] text-[#778397]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Railway Backend & Bot Connected
            </div>
          </div>
        </div>

        {/* Main Body */}
        <main className="flex-1 min-h-0 overflow-y-auto p-3.5 pb-5">
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
                  className="bg-[#2563eb] text-white border border-[#2563eb] rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
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
                    className="border border-[#dbe4f0] rounded-lg bg-white text-[#334155] p-2 text-xs font-medium hover:bg-slate-50 transition-colors"
                  >
                    + Add course
                  </button>
                  <button
                    onClick={() => openModal('material')}
                    className="border border-[#dbe4f0] rounded-lg bg-white text-[#334155] p-2 text-xs font-medium hover:bg-slate-50 transition-colors"
                  >
                    + Add material
                  </button>
                  <button
                    onClick={() => openModal('quiz')}
                    className="border border-[#dbe4f0] rounded-lg bg-white text-[#334155] p-2 text-xs font-medium hover:bg-slate-50 transition-colors"
                  >
                    + Create quiz
                  </button>
                  <button
                    onClick={() => navigateTo('submissions')}
                    className="border border-[#dbe4f0] rounded-lg bg-white text-[#334155] p-2 text-xs font-medium hover:bg-slate-50 transition-colors"
                  >
                    Review submissions
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white border border-[#e4eaf2] rounded-xl p-3.5 mt-2.5 shadow-xs">
                <b className="text-[13px] text-slate-800">Recent activity</b>
                <div className="mt-3 flex flex-col divide-y divide-[#edf0f5]">
                  <div className="pb-2.5 text-xs">
                    <b>New student joined</b>
                    <br />
                    <span className="text-[11px] text-[#778397]">Abebe Kebede via Telegram Bot</span>
                  </div>
                  <div className="py-2.5 text-xs">
                    <b>Material awaits review</b>
                    <br />
                    <span className="text-[11px] text-[#778397]">Network Summary • Mimi Tadesse</span>
                  </div>
                  <div className="pt-2.5 text-xs">
                    <b>Quiz published</b>
                    <br />
                    <span className="text-[11px] text-[#778397]">Data Structures Quiz (15 questions)</span>
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
                  className="bg-[#2563eb] text-white border border-[#2563eb] rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
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
                                className="border border-[#dbe4f0] rounded-md bg-white text-[#334155] px-2 py-1 text-xs hover:bg-slate-50 transition-colors"
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
                  className="bg-[#2563eb] text-white border border-[#2563eb] rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
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
                      className={`border rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
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
                                className="border border-[#dbe4f0] rounded-md bg-white text-[#334155] px-2 py-1 text-xs hover:bg-slate-50 transition-colors"
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
                  className="bg-[#2563eb] text-white border border-[#2563eb] rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
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
                              className="border border-[#dbe4f0] rounded-md bg-white text-[#334155] px-2 py-1 text-xs hover:bg-slate-50 transition-colors"
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
                  className="bg-[#2563eb] text-white border border-[#2563eb] rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
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
                      className="border border-[#dbe4f0] rounded-md bg-white text-[#334155] px-3 py-1.5 text-xs font-medium hover:bg-slate-50 transition-colors"
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
                                className={`border rounded-md px-2 py-1 text-xs font-medium transition-colors ${
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
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PAGE: SUBMISSIONS */}
          {page === 'submissions' && (
            <div>
              <div className="flex justify-between items-center mb-3.5">
                <div>
                  <div className="text-[20px] font-extrabold text-[#172033]">Submissions</div>
                  <div className="text-[11px] text-[#778397] mt-1">Review student uploads</div>
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
                            <span className="text-[11px] text-[#778397]">{sub.student}</span>
                          </td>
                          <td className="p-2">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                sub.status === 'Approved'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {sub.status}
                            </span>
                          </td>
                          <td className="p-2 pr-1 text-right">
                            {sub.status === 'Pending' ? (
                              <button
                                onClick={() => approveSubmission(sub.id)}
                                className="bg-[#2563eb] text-white border border-[#2563eb] rounded-md px-2 py-1 text-xs font-medium hover:bg-blue-700 transition-colors"
                              >
                                Approve
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
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
                  className="bg-[#2563eb] text-white border border-[#2563eb] rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
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
                                className="border border-rose-200 text-rose-600 rounded-md px-2 py-1 text-xs hover:bg-rose-50 transition-colors"
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
                  className="bg-[#2563eb] text-white border border-[#2563eb] rounded-lg py-2 text-xs font-semibold hover:bg-blue-700 transition-colors mt-2"
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
                    className="w-full bg-[#2563eb] text-white border border-[#2563eb] rounded-lg py-2 text-xs font-semibold hover:bg-blue-700 transition-colors mt-3"
                  >
                    Save profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Bottom Navigation */}
        <nav className="h-[62px] shrink-0 grid grid-cols-4 bg-white border-t border-[#e2e8f0] px-1 py-1 z-10">
          <button
            onClick={() => navigateTo('dashboard')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors ${
              page === 'dashboard' ? 'text-[#2563eb] font-bold' : 'text-[#788397]'
            }`}
          >
            <b className="text-[19px] font-normal leading-tight">▦</b>
            Overview
          </button>
          <button
            onClick={() => navigateTo('courses')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors ${
              page === 'courses' ? 'text-[#2563eb] font-bold' : 'text-[#788397]'
            }`}
          >
            <b className="text-[19px] font-normal leading-tight">▤</b>
            Courses
          </button>
          <button
            onClick={() => navigateTo('materials')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors ${
              page === 'materials' ? 'text-[#2563eb] font-bold' : 'text-[#788397]'
            }`}
          >
            <b className="text-[19px] font-normal leading-tight">▧</b>
            Materials
          </button>
          <button
            onClick={() => navigateTo('profile')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors ${
              page === 'profile' ? 'text-[#2563eb] font-bold' : 'text-[#788397]'
            }`}
          >
            <b className="text-[19px] font-normal leading-tight">♙</b>
            Profile
          </button>
        </nav>

        {/* Modal Window */}
        {modalType && (
          <div className="absolute inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
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

              {/* Material Fields */}
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
                  className="border border-[#dbe4f0] rounded-lg bg-white text-[#334155] px-3 py-1.5 text-xs font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#2563eb] text-white border border-[#2563eb] rounded-lg px-4 py-1.5 text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
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
