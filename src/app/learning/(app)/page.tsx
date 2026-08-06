import {
  myEnrollments,
  myCompletedLessonIds,
  myBestAttempts,
  eligibility,
  verifySession,
} from '@/lib/dal';
import { db } from '@/lib/db';
import { StatGrid, StatTile, formatWhen } from '@/components/app/Primitives';
import { font, radius } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function StudentDashboard() {
  const user = await verifySession();
  const [enrollments, completedIds, attempts] = await Promise.all([
    myEnrollments(),
    myCompletedLessonIds(),
    myBestAttempts(),
  ]);

  // Next scheduled session across every programme this student is on.
  const programIds = enrollments.map((e) => e.programId);
  const nextClass = programIds.length
    ? await db.timetableEntry.findFirst({
        where: { programId: { in: programIds }, startTime: { gte: new Date() } },
        orderBy: { startTime: 'asc' },
      })
    : null;

  const firstName = user.name.split(' ')[0];

  if (enrollments.length === 0) {
    return (
      <div style={styles.empty}>
        <h1 style={styles.h1}>Welcome, {firstName}</h1>
        <p style={styles.emptyBody}>
          You are not enrolled on a programme yet. Once admissions accept your
          application, your track will appear here with its curriculum, exams
          and timetable.
        </p>
      </div>
    );
  }

  /*
   * Per-programme progress, computed once and reused by both the summary tiles
   * and the cards below — `eligibility()` is the shared definition of "finished",
   * so the headline numbers can never disagree with the per-programme detail.
   */
  const programs = await Promise.all(
    enrollments.map(async (enrollment) => {
      const { program } = enrollment;
      const lessons = program.modules.flatMap((m) => m.lessons);
      const done = lessons.filter((l) => completedIds.has(l.id)).length;
      return {
        enrollment,
        program,
        lessons,
        done,
        pct: lessons.length ? Math.round((done / lessons.length) * 100) : 0,
        status: await eligibility(user.id, program.id),
      };
    }),
  );

  const totals = programs.reduce(
    (acc, p) => ({
      lessons: acc.lessons + p.lessons.length,
      done: acc.done + p.done,
      examsPassed: acc.examsPassed + p.status.exams.passed,
      exams: acc.exams + p.status.exams.total,
      projectsApproved: acc.projectsApproved + p.status.projects.approved,
      projects: acc.projects + p.status.projects.total,
    }),
    { lessons: 0, done: 0, examsPassed: 0, exams: 0, projectsApproved: 0, projects: 0 },
  );

  const overallPct = totals.lessons
    ? Math.round((totals.done / totals.lessons) * 100)
    : 0;

  // The programme with the most ground left to cover — the natural thing to
  // put in front of someone when they land on the dashboard.
  const resume = programs
    .filter((p) => p.pct < 100)
    .sort((a, b) => b.pct - a.pct)[0];

  return (
    <div>
      <h1 style={styles.h1}>Welcome back, {firstName}</h1>
      <p style={styles.lede}>
        {enrollments.length === 1
          ? 'Your programme at a glance.'
          : `You are enrolled on ${enrollments.length} programmes.`}
      </p>

      <div style={styles.stats}>
        <StatGrid>
          <StatTile
            label="Overall progress"
            value={`${overallPct}%`}
            hint={`${totals.done} of ${totals.lessons} lessons`}
          />
          <StatTile
            label="Exams passed"
            value={`${totals.examsPassed}/${totals.exams}`}
            hint={attempts.size ? `${attempts.size} attempted` : 'None attempted yet'}
            href="/exams"
          />
          <StatTile
            label="Projects approved"
            value={`${totals.projectsApproved}/${totals.projects}`}
            href="/projects"
          />
          <StatTile
            label="Programmes"
            value={enrollments.length}
            href="/courses"
          />
        </StatGrid>
      </div>

      {nextClass ? (
        <section style={styles.nextClass} aria-label="Next scheduled class">
          <span style={styles.eyebrow}>Next class</span>
          <strong style={styles.nextTitle}>{nextClass.title}</strong>
          <span style={styles.nextMeta}>
            {formatWhen(nextClass.startTime, nextClass.endTime)}
            {nextClass.location ? ` · ${nextClass.location}` : ''}
          </span>
        </section>
      ) : null}

      {resume ? (
        <section style={styles.resume} aria-label="Continue learning">
          <span style={styles.eyebrow}>Continue learning</span>
          <h2 style={styles.resumeTitle}>{resume.program.title}</h2>
          <Track pct={resume.pct} label={`${resume.program.title} progress`} />
          <p style={styles.pct}>
            {resume.done} of {resume.lessons.length} lessons · {resume.pct}%
          </p>
          <a href={`/courses/${resume.program.id}`} style={styles.cta}>
            Resume programme →
          </a>
        </section>
      ) : null}

      <h2 style={styles.sectionHeading}>Your programmes</h2>

      <div style={styles.grid}>
        {programs.map(({ enrollment, program, lessons, done, pct, status }) => (
          <article key={enrollment.id} style={styles.card}>
            <h3 style={styles.cardTitle}>{program.title}</h3>
            <p style={styles.cardMeta}>{program.duration}</p>

            <Track pct={pct} label={`${program.title} progress`} />
            <p style={styles.pct}>
              {done} of {lessons.length} lessons · {pct}%
            </p>

            <ul style={styles.gates}>
              <Gate label="Lessons" done={status.lessons.done} total={status.lessons.total} />
              <Gate label="Exams passed" done={status.exams.passed} total={status.exams.total} />
              <Gate
                label="Projects approved"
                done={status.projects.approved}
                total={status.projects.total}
              />
            </ul>

            <a href={`/courses/${program.id}`} style={styles.link}>
              Continue →
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}

function Track({ pct, label }: { pct: number; label: string }) {
  return (
    <div
      style={styles.track}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div style={{ ...styles.fill, width: `${pct}%` }} />
    </div>
  );
}

function Gate({ label, done, total }: { label: string; done: number; total: number }) {
  const complete = total > 0 && done === total;
  return (
    <li style={styles.gate}>
      <span
        aria-hidden="true"
        style={{ color: complete ? 'var(--success)' : 'var(--textFaint)' }}
      >
        {complete ? '●' : '○'}
      </span>
      <span style={{ color: 'var(--textMuted)' }}>{label}</span>
      <span style={{ marginLeft: 'auto', color: 'var(--textFaint)' }}>
        {done}/{total}
      </span>
    </li>
  );
}

const styles = {
  h1: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: 'clamp(1.5rem, 1.3rem + 0.9vw, 2rem)',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: 'var(--text)',
  },
  lede: {
    marginTop: '0.4rem',
    color: 'var(--textMuted)',
  },
  empty: { maxWidth: 560 },
  emptyBody: {
    marginTop: '0.75rem',
    color: 'var(--textMuted)',
    lineHeight: 1.6,
  },
  stats: {
    marginTop: '1.75rem',
  },
  nextClass: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    marginTop: '1.25rem',
    padding: '1rem 1.25rem',
    background: 'var(--primarySoft)',
    border: '1px solid var(--border)',
    borderRadius: radius.md,
  },
  eyebrow: {
    fontSize: font.eyebrow,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--textFaint)',
  },
  nextTitle: { color: 'var(--text)' },
  nextMeta: { fontSize: font.small, color: 'var(--textMuted)' },
  resume: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '1.25rem',
    padding: '1.25rem',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: radius.md,
  },
  resumeTitle: {
    marginTop: '0.35rem',
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: '1.25rem',
    fontWeight: 600,
    color: 'var(--text)',
  },
  cta: {
    marginTop: '1rem',
    alignSelf: 'flex-start',
    padding: '0.55rem 1rem',
    borderRadius: radius.sm,
    background: 'var(--primary)',
    color: '#fff',
    fontSize: font.small,
    fontWeight: 600,
    textDecoration: 'none',
  },
  sectionHeading: {
    marginTop: '2rem',
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: '1.15rem',
    fontWeight: 600,
    color: 'var(--text)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
    gap: '1rem',
    marginTop: '0.9rem',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    padding: '1.25rem',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: radius.md,
  },
  cardTitle: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: '1.05rem',
    fontWeight: 600,
    color: 'var(--text)',
  },
  cardMeta: {
    marginTop: '0.15rem',
    fontSize: font.small,
    color: 'var(--textFaint)',
  },
  track: {
    height: 8,
    marginTop: '1rem',
    borderRadius: 999,
    background: 'var(--surfaceHover)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    background: 'var(--primary)',
  },
  pct: {
    marginTop: '0.5rem',
    fontSize: font.small,
    color: 'var(--textMuted)',
  },
  gates: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    margin: '1rem 0 0',
    padding: 0,
    listStyle: 'none',
    fontSize: font.small,
  },
  gate: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  link: {
    marginTop: '1.25rem',
    color: 'var(--primary)',
    fontSize: font.small,
    fontWeight: 600,
    textDecoration: 'none',
  },
} satisfies Record<string, React.CSSProperties>;
