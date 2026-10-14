import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  BookOpen,
  Download,
  Search,
  Filter,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  ACADEMIC_YEARS,
  ACADEMIC_SUBJECTS,
  STUDENT_STUDY_MATERIALS,
} from '../../data/mockData';
import { formatBytes } from '../../utils/formatters';

export function AcademicStudyMaterials() {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [materials, setMaterials] = useState(() => {
    const saved = localStorage.getItem('cshub_student_materials');
    return saved ? JSON.parse(saved) : STUDENT_STUDY_MATERIALS;
  });
  const [downloadingId, setDownloadingId] = useState(null);

  const materialFormats = [
    'All Formats',
    'Exam Cheatsheet',
    'Lecture Notes',
    'Lab Guide',
    'Revision Summary',
  ];

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (selectedYear && m.academic_year !== selectedYear) return false;
      if (selectedSubject && m.subject !== selectedSubject) return false;
      if (selectedFormat && selectedFormat !== 'All Formats' && m.material_type !== selectedFormat) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesDesc = m.description.toLowerCase().includes(q);
        const matchesSubject = m.subject.toLowerCase().includes(q);
        const matchesCode = m.course_code.toLowerCase().includes(q);
        const matchesTags = m.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesSubject && !matchesCode && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  }, [materials, selectedYear, selectedSubject, selectedFormat, searchQuery]);

  const handleDownload = (mat) => {
    setDownloadingId(mat.id);

    // Update download count
    const updated = materials.map((m) =>
      m.id === mat.id ? { ...m, download_count: (m.download_count || 0) + 1 } : m
    );
    setMaterials(updated);
    localStorage.setItem('cshub_student_materials', JSON.stringify(updated));

    // Simulate safe file download
    const blob = new Blob(
      [
        `CS HUB EDUCATIONAL STUDY MATERIAL\n\nTitle: ${mat.title}\nCourse: ${mat.course_code} - ${mat.subject}\nAcademic Year: ${mat.academic_year}\nFormat: ${mat.material_type} (${mat.format})\nContributor: ${mat.contributor}\n\nSummary:\n${mat.description}\n\nDownloaded from CS Hub (cshub.dev) - An Independent Tech Learning Platform.`
      ],
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mat.file_name || `${mat.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTimeout(() => {
      setDownloadingId(null);
    }, 600);
  };

  const handleClearFilters = () => {
    setSelectedYear('');
    setSelectedSubject('');
    setSelectedFormat('');
    setSearchQuery('');
  };

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-navy-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-bold mb-2">
            <GraduationCap className="w-4 h-4" />
            <span>Academic Curriculum Library</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Student Study Materials & Cheatsheets
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Filter high-yield lecture summaries, exam cheat sheets, and lab solutions by your current
            academic year or course subject.
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Showing <span className="text-teal-600 dark:text-teal-400 font-bold">{filteredMaterials.length}</span> of {materials.length} verified packages
        </div>
      </div>

      {/* Interactive Academic Filter Bar */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Academic Year Dropdown */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Academic Year
            </label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-950/70 text-xs text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
              >
                {ACADEMIC_YEARS.map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Course Subject Name Dropdown */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Course / Subject Name
            </label>
            <div className="relative">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-950/70 text-xs text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
              >
                {ACADEMIC_SUBJECTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Search */}
          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Keyword or Course Code
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search 'CS 201', 'Dijkstra', 'MIPS'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-950/70 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Format Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-navy-800/80">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Format:</span>
            {materialFormats.map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setSelectedFormat(fmt === 'All Formats' ? '' : fmt)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  (fmt === 'All Formats' && !selectedFormat) || selectedFormat === fmt
                    ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-navy-950 shadow-2xs'
                    : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          {(selectedYear || selectedSubject || selectedFormat || searchQuery) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-navy-800 bg-white/40 dark:bg-navy-900/30 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No study materials found for this selection
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Try adjusting your academic year or course subject dropdown, or clear search keywords.
          </p>
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            View All Study Materials
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredMaterials.map((mat) => (
            <Card
              key={mat.id}
              hover
              className="p-5 flex flex-col justify-between border-slate-200/90 dark:border-navy-800 group"
            >
              <div className="space-y-3">
                {/* Header badges */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy-100 dark:bg-navy-800 text-navy-800 dark:text-teal-300 border border-navy-200 dark:border-navy-700 font-mono">
                    {mat.course_code}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    {mat.academic_year}
                  </span>
                </div>

                {/* Subject & Title */}
                <div>
                  <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 block line-clamp-1">
                    {mat.subject}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mt-0.5">
                    {mat.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {mat.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {mat.tags.slice(0, 3).map((t, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400 font-mono"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action / Meta Footer */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-navy-800/80 flex items-center justify-between gap-2">
                <div className="text-[11px] text-slate-400 truncate">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block truncate">
                    {mat.contributor}
                  </span>
                  <span>
                    {mat.format} • {formatBytes(mat.size_bytes)}
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDownload(mat)}
                  isLoading={downloadingId === mat.id}
                  icon={Download}
                  className="shrink-0 text-xs px-2.5 py-1"
                  title="Download student study material"
                >
                  <span className="hidden sm:inline">Get</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
