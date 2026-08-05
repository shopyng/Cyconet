# Cyconet Learning Platform

Multi-tenant learning management system serving students and administrators on separate subdomains.

## Architecture

- **Next.js 16** with App Router and React Server Components
- **Prisma 7** with PostgreSQL (connection via driver adapter)
- **Multi-tenant proxy** routing subdomains to internal route groups
- **Session-based auth** with encrypted JWT cookies
- **Role-based access**: students access courses/exams, admins manage applications/certificates

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Installation

```bash
npm install
cp .env.example .env
# Edit .env and set DATABASE_URL, SESSION_SECRET, NEXT_PUBLIC_ROOT_DOMAIN
```

### Database Setup

```bash
npx prisma db push    # Apply schema
npx prisma db seed    # Load demo data
```

The seed creates:
- Admin: `admin@cyconet.ng` / `admin123`
- Student: `student@example.com` / `student123`  
- 5 programs with lessons, exams, projects, timetable

### Development

```bash
npm run dev
```

Visit:
- Main site: http://localhost:3000
- Learning hub: http://learning.localhost:3000
- Admin dashboard: http://admin.localhost:3000

Modern browsers support `*.localhost` subdomains without `/etc/hosts` changes.

## Subdomain Routing

The proxy (`src/proxy.ts`) rewrites requests:
- `learning.cyconet.ng/*` → `/learning/*`
- `admin.cyconet.ng/*` → `/admin/*`

Layouts under `(app)` route groups gate on session and role. Login pages sit outside the gate.

## Authentication

1. User submits credentials to `signIn` Server Action
2. Action verifies password, creates encrypted JWT
3. Session stored in httpOnly cookie (subdomain-scoped)
4. Layouts call `verifySession()` / `verifyAdmin()` to gate pages
5. Invalid session → redirect to login

## Database Schema

- **Users**: email, bcrypt password, name, role (STUDENT | ADMIN)
- **Programs**: title, duration, modules → lessons
- **Enrollments**: student progress tracking
- **Exams**: multiple-choice questions, attempts, scores
- **Projects**: submission URLs, review status, feedback
- **Certificates**: issued when student completes all requirements
- **Applications**: pending/accepted/rejected
- **TimetableEntry**: scheduled sessions per program

## Commands

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run start        # Serve production
npm run lint         # ESLint

npx prisma studio    # Database GUI
npx prisma db push   # Apply schema changes
npx prisma db seed   # Re-run seed (idempotent)
```

## Deployment

1. Set environment variables
2. Run `npx prisma db push`
3. Build: `npm run build`
4. Start: `npm start`
5. Configure DNS to point all subdomains to the same server

SSL required in production for secure cookies.

## License

Proprietary — Cyconet Nigeria
