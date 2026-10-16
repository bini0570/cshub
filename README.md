# CS HUB — Computer Science Student Content Platform & Telegram Mini App

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Telegram](https://img.shields.io/badge/Telegram_Bot-Mini_App-26A5E4?logo=telegram&logoColor=white)](https://telegram.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

An independent, production-ready educational platform designed specifically for Computer Science students, software engineering majors, and tech enthusiasts. CS Hub unites a mobile-optimized Telegram Mini App, an administrative operations portal, an Express REST API, and an automated Telegram Bot.

> **Important Platform Distinction:**  
> CS Hub is **NOT** an administrative university portal or official student grading registrar. Its sole focus is delivering high-value academic resources, MoSHE exit exam preparation questions, department cheatsheets, vetted developer tools, and student study notes.

---

## 1. System Architecture

```mermaid
flowchart TD
    subgraph Telegram_Ecosystem["Telegram Client & Ecosystem"]
        TGUser["CS Student (Telegram Client)"]
        Bot["@Boditibingobot (Bot Daemon)"]
        MiniApp["Student Mini App (React / Vercel)"]
    end

    subgraph Backend_Infrastructure["Railway Backend Services"]
        API["Express 4 REST API (:5000)"]
        AuthMiddleware["JWT & HMAC InitData Auth Engine"]
        ExamEngine["Authoritative Server-Side Exam Grader"]
        DB[("PostgreSQL Database")]
    end

    subgraph Admin_Portal["Operations Portal"]
        AdminWeb["Admin Operations Dashboard (Vite / Vercel)"]
    end

    TGUser -->|"1. /start & Share Contact"| Bot
    Bot -->|"2. Verify Phone Ownership & Upsert Student"| DB
    TGUser -->|"3. Launch Mini App"| MiniApp
    MiniApp -->|"4. Authenticate initData (HMAC-SHA256)"| API
    API --> AuthMiddleware
    AuthMiddleware --> DB
    MiniApp -->|"5. Submit Exit Exam Answers"| ExamEngine
    ExamEngine -->|"6. Authoritative Scoring & History"| DB
    AdminWeb -->|"7. Moderate Notes, Content & Roles"| API
    API -->|"8. Direct Delivery & Alerts"| Bot
```

### Component Breakdown
1. **Student Mini App (`/student`):**
   - Built with Vite, React 18, and Tailwind CSS.
   - Designed for Telegram Mini App mobile viewports with haptic feedback, theme synchronization (dark/light), and native back-button integration.
   - Displays real verified Telegram student identities directly from native Telegram contexts.
2. **Admin Operations Portal (`/admin`):**
   - Management dashboard for course catalogs, study notes review queue, student directory, broadcasts, and immutable audit logs.
3. **Backend API & Bot (`/backend`):**
   - Express REST server enforcing JWT authentication, rate limiting, and CORS allowlisting.
   - Telegram Bot daemon (`backend/bot.js`) running via Telegraf for contact verification and 1-tap PDF delivery.
   - Authoritative PostgreSQL data store (`backend/db.js`).

---

## 2. Directory Structure

```text
cshub/
├── backend/
│   ├── .env.example                     # Backend environment template
│   ├── package.json                     # Express, Telegraf, pg, bcryptjs, jsonwebtoken
│   ├── server.js                        # Express server, security headers, rate limits
│   ├── bot.js                           # Telegram bot: /start, contact share, /login
│   ├── db.js                            # PostgreSQL pool & auto-migrations
│   └── routes/
│       ├── auth.js                      # Telegram WebApp HMAC auth, login, token refresh
│       ├── content.js                   # Course notes, resources, downloads, send-to-bot
│       ├── submissions.js               # Student study note uploads & review queue
│       ├── exams.js                     # Server-side exam grading & leaderboards
│       └── users.js                     # Student directories, role management, audit
├── student/
│   ├── index.html                       # Telegram Mini App entry point
│   ├── package.json                     # Vite + React + Lucide icons
│   ├── tailwind.config.js               # Telegram dark/light theme tokens
│   └── src/
│       ├── App.jsx                      # Mini App views: Home, Quizzes, Exit Exam, Profile
│       ├── context/AuthContext.jsx      # Native WebApp initData validation & session
│       └── lib/api.js                   # Authenticated API client
├── admin/
│   ├── index.html                       # Admin portal entry point
│   ├── package.json                     # Vite + React admin suite
│   └── src/
│       ├── App.jsx                      # Moderation, Content CRUD, Users, Audit Logs
│       ├── context/AuthContext.jsx      # Admin session & privilege guards
│       └── lib/api.js                   # Admin API client
└── README.md
```

---

## 3. Database Schema (PostgreSQL)

All production records reside in persistent PostgreSQL tables:

| Table | Description | Access Rules |
| :--- | :--- | :--- |
| `users` | Telegram-verified students and staff administrators | Authenticated session; self-profile only; super-admin role changes |
| `telegram_auth_codes` | One-time 5-minute login codes for desktop login | Single-use atomic consumption (`UPDATE ... RETURNING *`) |
| `categories` | Computer Science subjects and curriculum taxonomies | Public read; Admin CRUD |
| `content` | Curated course materials, lecture slides, cheatsheets | Public for published items; Staff for drafts/private |
| `submissions` | Student study notes uploaded for peer review | Submitter reads own; Moderator/Admin reviews |
| `bookmarks` | Saved study materials per student account | Student-scoped |
| `audit_logs` | Immutable log of administrative decisions | Staff read-only; Append-only on sensitive actions |
| `exam_attempts` | Authoritative server-graded exit exam scores | Authenticated student history; Anonymized leaderboard |

---

## 4. Security & Data Integrity Features

- **No Hardcoded Bypasses:** Passwords verified strictly with `bcrypt`. Hardcoded bypasses and default credentials have been eradicated.
- **Strict JWT Secret:** Server refuses production boot without a strong `JWT_SECRET`.
- **Contact Ownership Verification:** Telegram Bot strictly verifies `contact.user_id === message.from.id` before creating or updating student records.
- **HMAC-SHA256 InitData Freshness:** Mini App authentication cryptographically verifies the bot secret hash and enforces a 24-hour freshness window, rejecting future timestamps.
- **Atomic Verification Codes:** Desktop login codes expire in 5 minutes and are marked `used = TRUE` in an atomic database statement to prevent race conditions.
- **Authoritative Server-Side Exam Grading:** Exam answer keys remain confidential on the server. Scores are computed exclusively server-side from raw student answer submissions.
- **Role Escalation Defense:** Role changes require `super_admin` privilege. Modifying own role or removing the last active super-administrator is transactionally blocked.
- **File Upload Security:** Upload endpoints enforce authentication, 50MB size ceilings, and a strict academic filetype allowlist (`.pdf`, `.docx`, `.pptx`, `.txt`, `.zip`, `.png`, `.jpg`, `.jpeg`).

---

## 5. Environment Variables & Setup

### Backend (`backend/.env`)

```env
# PostgreSQL connection URL (Provided automatically by Railway)
DATABASE_URL=postgresql://postgres:password@roundhouse.proxy.rlwy.net:5432/railway

# Server Port
PORT=5000

# JSON Web Token Secret (Long random string)
JWT_SECRET=cshub_super_secret_jwt_key_railway_production_2026

# Telegram Bot Token (from @BotFather)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ

# Frontend Origin URLs (for CORS allowlisting)
FRONTEND_URL=https://cshub-student.vercel.app
ADMIN_URL=https://cshub-admin.vercel.app

# Default Primary Admin (Auto-provisioned on clean DB initialize)
ADMIN_EMAIL=admin@cshub.edu
ADMIN_PASSWORD=SetAStrongPasswordHere2026!
```

### Student Mini App (`student/.env`)

```env
# Backend REST API endpoint
VITE_API_URL=https://cshub-production.up.railway.app
```

### Admin Dashboard (`admin/.env`)

```env
# Backend REST API endpoint
VITE_API_URL=https://cshub-production.up.railway.app
```

---

## 6. Local Development

### 1. Backend & Bot
```bash
cd backend
npm install
npm run dev
```

### 2. Student Mini App
```bash
cd student
npm install
npm run dev
```

### 3. Admin Dashboard
```bash
cd admin
npm install
npm run dev
```

---

## 7. Deployment Instructions

### Backend (Railway)
1. Create a project in [Railway](https://railway.app) and attach a **PostgreSQL** service.
2. Connect your GitHub repository and set the root directory to `/backend`.
3. Configure the environment variables (`DATABASE_URL`, `JWT_SECRET`, `TELEGRAM_BOT_TOKEN`, `FRONTEND_URL`, `ADMIN_URL`).
4. Railway runs `npm start`, which applies PostgreSQL migrations automatically.

### Student Mini App (Vercel)
1. In [Vercel](https://vercel.com), import your repository and set the root directory to `student`.
2. Framework Preset: **Vite**.
3. Set Environment Variable: `VITE_API_URL` pointing to your deployed Railway backend.
4. Add the deployed Vercel domain to your Bot via `@BotFather` (`/setmenubutton` or Mini App configuration).

### Admin Dashboard (Vercel)
1. In [Vercel](https://vercel.com), import your repository and set the root directory to `admin`.
2. Framework Preset: **Vite**.
3. Set Environment Variable: `VITE_API_URL` pointing to your deployed Railway backend.
