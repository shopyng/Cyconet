import { myEnrollments, myCompletedLessonIds, eligibility, verifySession } from '@/lib/dal';
import { db } from '@/lib/db';
import { color, font, glass, radius } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function StudentDashboard() {
  const user = await verifySession('learning');
  const [enrollments, completedIds] = await Promise.all([
    myEnrollments(),
    myCompletedLessonIds(),
  ]);

  // Next scheduled session across every programme this student is on.
  const programIds = enrollments.map((e) => e.programId);
  const nextClass = programIds.length
    ? await db.timetableEntry.findFirst({
        where: { programId: { in: programIds }, startTime: { gte: new Date() } },
        orderBy: { startTime: 'asc' },
      })
    : null;

  if (enrollments.length === 0) {
    return (
      <div style={styles.empty}>
        <h1 style={styles.h1}>Welcome, {user.name.split(' ')[0]}</h1>
        <p style={styles.emptyBody}>
          You are not enrolled on a programme yet. Once admissions accept your
          application, your track will appear here with its curriculum, exams
          and timetable.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={styles.h1}>Welcome back, {user.name.split(' ')[0]}</h1>
      <p style={styles.lede}>
        {enrollments.length === 1
          ? 'Your programme at a glance.'
          : `You are enrolled on ${enrollments.length} programmes.`}
      </p>

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

      <div style={styles.grid}>
        {await Promise.all(
          enrollments.map(async (enrollment) => {
            const { program } = enrollment;
            const lessons = program.modules.flatMap((m) => m.lessons);
            const done = lessons.filter((l) => completedIds.has(l.id)).length;
            const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
            const status = await eligibility(user.id, program.id);

            return (
              <article key={enrollment.id} style={styles.card}>
                <h2 style={styles.cardTitle}>{program.title}</h2>
                <p style={styles.cardMeta}>{program.duration}</p>

                <div
                  style={styles.track}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${program.title} progress`}
                >
                  <div style={{ ...styles.fill, width: `${pct}%` }} />
                </div>
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

                <a href={`/learning/courses/${program.id}`} style={styles.link}>
                  Continue →
                </a>
              </article>
            );
          }),
        )}
      </div>
    </div>
  );
}

function Gate({ label, done, total }: { label: string; done: number; total: number }) {
  const complete = total > 0 && done === total;
  return (
    <li style={styles.gate}>
      <span aria-hidden="true" style={{ color: complete ? color.cyan : color.textFaint }}>
        {complete ? '●' : '○'}
      </span>
      <span style={{ color: color.textMuted }}>{label}</span>
      <span style={{ marginLeft: 'auto', color: color.textFaint }}>
        {done}/{total}
      </span>
    </li>
  );
}

/** "Thu 7 Aug, 09:00–12:00" — en-GB because the school is in Nigeria. */
function formatWhen(start: Date, end: Date): string {
  const day = start.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const time = (d: Date) =>
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time(start)}–${time(end)}`;
}

const styles = {
  h1: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: font.display2,
    fontWeight: 700,
    letterSpacing: '-0.03em',
    color: color.text,
  },
  lede: {
    marginTop: '0.4rem',
    color: color.textMuted,
  },
  empty: { maxWidth: 560 },
  emptyBody: {
    marginTop: '0.75rem',
    color: color.textMuted,
    lineHeight: 1.6,
  },
  nextClass: {
    ...glass,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    marginTop: '1.75rem',
    padding: '1rem 1.25rem',
    borderRadius: radius.md,
  },
  eyebrow: {
    fontSize: font.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: color.textFaint,
  },
  nextTitle: { color: color.text },
  nextMeta: { fontSize: font.small, color: color.textMuted },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
    gap: '1.25rem',
    marginTop: '1.75rem',
  },
  card: {
    ...glass,
    display: 'flex',
    flexDirection: 'column',
    padding: '1.25rem',
    borderRadius: radius.lg,
  },
  cardTitle: {
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: font.h3,
    fontWeight: 600,
    color: color.text,
  },
  cardMeta: {
    marginTop: '0.15rem',
    fontSize: font.small,
    color: color.textFaint,
  },
  track: {
    height: 6,
    marginTop: '1rem',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    background: `linear-gradient(90deg, ${color.cyan}, ${color.violetSoft})`,
  },
  pct: {
    marginTop: '0.5rem',
    fontSize: font.small,
    color: color.textMuted,
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
    color: color.cyan,
    fontSize: font.small,
    fontWeight: 500,
    textDecoration: 'none',
  },
} satisfies Record<string, React.CSSProperties>;
