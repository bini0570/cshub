# CS HUB — Computer Science Student Content Platform

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%26_Auth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/Tests-16_Passing-brightgreen)](https://vitest.dev/)

An independent, production-oriented content platform designed specifically for Computer Science students, software engineering majors, and aspiring developers. 

> **Important Platform Distinction:**  
> CS Hub is **NOT** an official university website, school administrative management system, LMS, or course registration portal. It deliberately does not contain student grades, attendance records, university bureaucracy, or course enrollment features. Its sole focus is delivering high-value technical tutorials, downloadable exam cheatsheets, vetted developer tools, open-source projects, and career opportunities.

---

## 1. Architectural Highlights

- **Mobile-First Responsive UX:** Optimized for Android and desktop viewports with a 44px minimum touch target, dark navy & teal color scheme, custom restrained transitions, and fluid light/dark mode.
- **Zero-Trust Security & RLS:** PostgreSQL Row Level Security (RLS) policies enforce least privilege. Ordinary students can never elevate roles or access private submission staging.
- **Dual-Storage Isolation:**
  - `submissions` bucket: Strictly private bucket for student uploads during peer review.
  - `public-content` bucket: Public CDN bucket for approved, downloadable materials.
  - 20 MB size ceiling per file, with hard-coded rejection of executable binaries (`.exe`, `.bat`, `.cmd`, `.sh`, `.bin`, `.msi`).
- **XSS Defense:** DOMPurify sanitization pipeline cleanses rich-text HTML rendering across all tutorials and articles.
- **Zero-Config Demonstration Fallback:** If live Supabase credentials are not yet supplied in `.env`, the frontend gracefully falls back to an interactive client-side repository with sample data, role preview switcher, bookmarking, and moderation workflows.

---

## 2. Directory Structure

```text
cshub/
├── .env.example                     # Environment template without secrets
├── .gitignore                       # Git exclusions
├── index.html                       # HTML5 entry with Inter & JetBrains Mono fonts
├── package.json                     # Version-pinned dependencies
├── vite.config.js                   # Vite & Vitest configuration
├── tailwind.config.js               # Brand navy (#0b132b) & teal (#14b8a6) themes
├── postcss.config.js                # PostCSS Tailwind plugins
├── supabase/
│   ├── migrations/
│   │   ├── 20261013000001_initial_schema.sql    # Tables, keys, and indexes
│   │   ├── 20261013000002_rls_policies.sql      # RLS policies & admin bootstrap
│   │   └── 20261013000003_storage_buckets.sql   # Private & public storage buckets
│   └── seed.sql                                 # 12 categories, tags, settings & seed posts
├── tests/
│   ├── setup.js                     # DOM cleanup & window mocks
│   ├── validators.test.js           # File size limits, extensions, URLs & slugs
│   ├── security_and_rls.test.js     # DOMPurify XSS defenses & formatters
│   ├── components.test.jsx          # UI render tests (Logo, Badge, Button, EmptyState)
│   └── routes.test.jsx              # Public browsing & unauthenticated flows
└── src/
    ├── main.jsx                     # StrictMode root mount
    ├── App.jsx                      # Router with all 21 routes & role guards
    ├── index.css                    # Tailwind directives & CSS custom variables
    ├── context/
    │   ├── AuthContext.jsx          # Supabase Auth, profiles, and demo role switcher
    │   └── ThemeContext.jsx         # Dark/light theme persistence
    ├── lib/
    │   └── supabase.js              # Supabase client & repository abstraction
    ├── utils/
    │   ├── sanitize.js              # DOMPurify sanitization
    │   ├── formatters.js            # Human bytes, reading times, relative dates
    │   └── validators.js            # Size, MIME, URL & slug validators
    ├── components/
    │   ├── common/                  # Logo, Breadcrumbs, Pagination, RichText, Share
    │   ├── layout/                  # Navbar, Footer, MobileBottomNav, AdminLayout
    │   └── ui/                      # Button, Card, Badge, Input, Select, Modal, Skeleton
    ├── features/
    │   ├── auth/                    # ProtectedRoute, AdminRoute guards
    │   ├── bookmarks/               # BookmarkButton & saved lists
    │   ├── content/                 # ContentCard, ContentGrid, CategoryFilter
    │   └── search/                  # GlobalSearchModal with Cmd+K shortcuts
    └── pages/
        ├── HomePage.jsx             # Hero, featured picks, resources, tools, CTA
        ├── ResourcesPage.jsx        # Searchable downloadable resource library
        ├── ResourceDetailPage.jsx  # Download tracking & study notes
        ├── ArticlesPage.jsx         # Tech articles & tutorials
        ├── ArticleDetailPage.jsx   # Full sanitized guide with reading time
        ├── ToolsPage.jsx            # Developer tools & AI utilities
        ├── ToolDetailPage.jsx       # Tool launch card & features
        ├── OpportunitiesPage.jsx    # Tech internships & GSoC listings
        ├── OpportunityDetailPage.jsx# Application guidelines & link
        ├── SearchPage.jsx           # Cross-platform full search & filter
        ├── AboutPage.jsx            # Mission, independent status, workflow
        ├── ContactPage.jsx          # Contact & content correction ticket form
        ├── LoginPage.jsx            # Authentication & quick role exploration
        ├── RegisterPage.jsx         # Minimal student registration
        ├── ForgotPasswordPage.jsx   # Password recovery flow
        ├── ProfilePage.jsx          # Student profile & attribution
        ├── BookmarksPage.jsx        # Saved material collections
        ├── SubmitPage.jsx           # Student material submission & file staging
        ├── MySubmissionsPage.jsx    # Submission history, statuses & review notes
        ├── SettingsPage.jsx         # Notification toggles & security details
        ├── NotFoundPage.jsx         # 404 handler
        └── admin/
            ├── AdminDashboardPage.jsx      # Real database metrics & activity
            ├── AdminModerationPage.jsx     # Moderation queue & approve/reject
            ├── AdminContentPage.jsx        # Content CRUD & featured toggle
            ├── AdminContentEditorPage.jsx  # Content editor with HTML preview
            ├── AdminUsersPage.jsx          # User search, suspension & roles
            ├── AdminAuditLogsPage.jsx      # Immutable administrative audit log
            └── AdminSettingsPage.jsx       # Global platform settings & caps
```

---

## 3. Database Schema & Row Level Security (RLS)

All tables strictly enforce PostgreSQL Row Level Security:

| Table | Anonymous Visitors | Authenticated Students | Administrators |
| :--- | :--- | :--- | :--- |
| `profiles` | Read active public profiles | Read & edit own record (no role escalation) | Full CRUD |
| `categories` | Read only | Read only | Full CRUD |
| `tags` | Read only | Read only | Full CRUD |
| `content` | Read `status='published'` & `visibility='public'` | Read published + own drafts | Full CRUD |
| `content_files` | Read files of published content | Read files of published content | Full CRUD |
| `submissions` | No access (0 rows) | Read & create own; edit if `changes_requested` | Full review & CRUD |
| `submission_files` | No access (0 rows) | Upload & read own submission files | Full review & CRUD |
| `bookmarks` | No access | Manage only own bookmarks (`user_id = auth.uid()`) | Read all |
| `reports` | Create ticket | Create ticket | Review & resolve |
| `admin_audit_logs` | No access | No access | Read & write logs |
| `site_settings` | Read only | Read only | Full CRUD |

### Secure First-Admin Bootstrap Function

To avoid insecure self-registration or exposing service-role keys:

```sql
-- Run in the Supabase SQL Editor:
SELECT public.bootstrap_first_admin('your-registered-email@example.com');
```

This procedure checks whether any administrator already exists. If none exist, it elevates the account to `super_admin`. Once an admin exists, subsequent calls fail immediately.

---

## 4. Local Development Setup

### Prerequisites
- Node.js (v18+ recommended; verified on Node v24.18)
- npm (v9+)

### Installation Steps

1. **Clone the repository and enter the directory:**
   ```bash
   git clone https://github.com/your-username/cshub.git
   cd cshub
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to include your Supabase project credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
   *(If left empty, CS Hub operates seamlessly in local demonstration mode using the verified mock repository).*

4. **Apply Supabase Migrations & Seed Data:**
   In your Supabase project dashboard SQL Editor, execute in order:
   - `supabase/migrations/20261013000001_initial_schema.sql`
   - `supabase/migrations/20261013000002_rls_policies.sql`
   - `supabase/migrations/20261013000003_storage_buckets.sql`
   - `supabase/seed.sql`

5. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 5. Verification & Testing

Run the automated test suite powered by Vitest and React Testing Library:

```bash
npm test
```

### Verified Test Suites:
- `tests/validators.test.js` (5 tests): Enforces 20MB file limit, executable rejection (`.exe`, `.bat`, `.cmd`, `.sh`, `.bin`), safe URL checks, and slug generation.
- `tests/security_and_rls.test.js` (6 tests): Validates DOMPurify sanitization stripping `<script>`, inline `onerror`, `<iframe>`, while preserving code blocks and links. Verifies human byte and reading time calculations.
- `tests/components.test.jsx` (4 tests): Tests rendering of the CS Hub geometric logo, status badges, buttons in loading/disabled states, and empty states.
- `tests/routes.test.jsx` (1 test): Verifies public browsing and unauthenticated exploration across the application.

### Production Build:
```bash
npm run build
```
Generates an optimized bundle in `dist/`.

---

## 6. Vercel Deployment

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/), select **Add New Project** and import the GitHub repo.
3. Framework Preset: **Vite**.
4. Configure Environment Variables in Vercel:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase public anonymous key
5. Deploy. Rewrites for single-page React apps are handled automatically.

---

## 7. Status & Manual Configuration Requirements

- [x] Responsive React + Vite application with Tailwind CSS (navy & teal theme).
- [x] All 21 specified public, student, and admin routes implemented.
- [x] SQL migrations with complete table schemas, foreign keys, and indexes.
- [x] PostgreSQL Row Level Security (RLS) policies for zero-trust authorization.
- [x] Private staging storage bucket (`submissions`) and public CDN bucket (`public-content`).
- [x] Material submission workflow with file validation (20MB ceiling, executable ban).
- [x] Admin dashboard with live metrics, moderation queue, content editor, user management, and audit logs.
- [x] DOMPurify rich-text XSS sanitization.
- [x] 16 automated Vitest tests passing.
- [ ] **External Configuration Required:** To connect to a live Supabase instance, create a project at [supabase.com](https://supabase.com), run the 3 SQL migrations and seed file in the Supabase SQL editor, and paste the URL and anon key into `.env`.
