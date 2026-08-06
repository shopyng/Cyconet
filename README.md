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

For production, seed only records you actually want live. Replace the demo admin
password immediately or create a real admin account and remove demo users.

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

## Real Data Flow

- Public programme applications are saved directly to PostgreSQL and appear in
  the admin admissions queue.
- Accepting an application creates or reuses a student account, enrolls the
  student on the selected programme, and returns a one-time temporary password.
- Lesson progress, exam attempts, project submissions, reviews, timetable
  entries and certificates are all stored in PostgreSQL.
- Resend email configuration is recommended for staff notifications, but
  admissions data no longer depends on email delivery succeeding.

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

1. Rotate any database password that has appeared in chat, screenshots or git.
2. Set environment variables from `.env.example` in your host dashboard.
3. Run `npx prisma db push`.
4. Create real programmes/admin users or run a production-safe seed.
5. Build: `npm run build`.
6. Start: `npm start`.
7. Configure DNS for the apex, `learning`, and `admin` subdomains.

SSL required in production for secure cookies.

## Production Checklist

- Rotate `DATABASE_URL` and `SESSION_SECRET` before launch.
- Run `npx prisma db push` against Supabase after every schema change.
- Create a real admin account and remove demo users before opening admissions.
- Configure Resend so staff receive application, enquiry and tour alerts.
- Enable daily Supabase backups and point-in-time recovery if your plan supports it.
- Set `SUPER_ADMIN_EMAILS` so only trusted owners can change curriculum content.
- Set `BACKUPS_VERIFIED_AT` after verifying Supabase backups in the provider dashboard.
- Keep `admin.cyconet.ng` private: strong passwords, HTTPS only and least-privilege staff access.
- Review `AuditLog` regularly for admissions, certificate and curriculum changes.

## License

Proprietary — Cyconet Nigeria
