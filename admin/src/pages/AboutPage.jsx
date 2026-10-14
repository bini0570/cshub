import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Code2,
  Users,
  CheckCircle,
  FileCheck,
  Send,
  Sparkles,
} from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function AboutPage() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      <Breadcrumbs items={[{ label: 'About CS Hub' }]} />

      {/* Hero */}
      <div className="space-y-4">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Empowering Computer Science Students through Shared Knowledge.
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          CS Hub is an independent, community-driven content platform engineered to give students
          direct access to high-quality technical notes, study cheatsheets, curated developer tools,
          and career opportunities.
        </p>
      </div>

      {/* Independent Notice Card */}
      <Card className="p-6 sm:p-8 border-teal-500/30 bg-teal-50/50 dark:bg-teal-950/30">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-teal-600 text-white shrink-0 mt-1">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Independent Platform Philosophy
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              CS Hub is <strong>not</strong> an official university website, university administration
              portal, learning management system (LMS), or course registration registry.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              We do not track student GPAs, course enrollments, or official university records. Our sole
              mandate is sharing useful engineering insights, open-source resources, and practical developer skills.
            </p>
          </div>
        </div>
      </Card>

      {/* How CS Hub Works */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          The Material Curation Workflow
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Student Submission</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Any registered student can submit a lecture cheatsheet, tutorial article, or developer
              tool. Files are stored securely in a private staging bucket.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Editorial Review</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Administrators and senior reviewers verify code accuracy, formatting, and safety.
              Feedback or approval is communicated directly to the student.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Public Distribution</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Approved materials are indexed with categories, tags, and search metadata, becoming
              freely accessible to students globally without paywalls.
            </p>
          </Card>
        </div>
      </div>

      {/* Technology Architecture */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Engineered for Performance and Security
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          CS Hub is built on a modern, zero-trust cloud architecture:
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
          <li className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
            <span>React + Vite client with mobile-first Tailwind styling</span>
          </li>
          <li className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
            <span>PostgreSQL Row Level Security (RLS) zero-trust policies</span>
          </li>
          <li className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
            <span>Private staging buckets with cryptographic isolation</span>
          </li>
          <li className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
            <span>DOMPurify sanitized rich text to eliminate XSS risks</span>
          </li>
        </ul>
      </div>

      {/* CTA */}
      <div className="pt-6 border-t border-slate-200 dark:border-navy-800 flex items-center justify-between gap-4">
        <Link to="/submit">
          <Button variant="primary" size="md" icon={Send}>
            Submit Your First Material
          </Button>
        </Link>
        <Link to="/contact">
          <Button variant="outline" size="md">
            Contact Editorial Staff
          </Button>
        </Link>
      </div>
    </div>
  );
}
