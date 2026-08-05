import { myProjects, mySubmissions } from '@/lib/dal';
import {
  PageTitle,
  Card,
  EmptyState,
  Badge,
  statusTone,
  humanStatus,
  formatDate,
} from '@/components/app/Primitives';
import { color, font } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Projects' };

/**
 * Project index across every enrolled programme, each showing the state of the
 * student's latest submission.
 */
export default async function ProjectsPage() {
  const [projects, latest] = await Promise.all([myProjects(), mySubmissions()]);

  if (projects.length === 0) {
    return (
      <>
        <PageTitle title="Projects" />
        <div style={{ marginTop: '1.5rem' }}>
          <EmptyState
            title="No projects yet"
            body="Practical briefs appear here once your instructor publishes them for a programme you are enrolled on."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle
        title="Projects"
        lede="Every project must be approved before a certificate can be issued."
      />

      <div style={styles.list}>
        {projects.map((project) => {
          const submission = latest.get(project.id);

          return (
            <Card key={project.id}>
              <div style={styles.head}>
                <div style={{ minWidth: 0 }}>
                  <span style={styles.eyebrow}>{project.program.title}</span>
                  <h2 style={styles.title}>{project.title}</h2>
                </div>
                {submission ? (
                  <Badge tone={statusTone(submission.status)}>
                    {humanStatus(submission.status)}
                  </Badge>
                ) : (
                  <Badge tone="neutral">Not submitted</Badge>
                )}
              </div>

              <p style={styles.desc}>{project.description}</p>

              {submission ? (
                <p style={styles.meta}>
                  Submitted {formatDate(submission.submittedAt)}
                  {submission.reviewedAt ? ` · reviewed ${formatDate(submission.reviewedAt)}` : ''}
                </p>
              ) : null}

              <a href={`/projects/${project.id}`} style={styles.link}>
                {submission ? 'View brief and feedback' : 'View brief and submit'} →
              </a>
            </Card>
          );
        })}
      </div>
    </>
  );
}

const styles = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    marginTop: '1.75rem',
  },
  head: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  eyebrow: {
    fontSize: font.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: color.textFaint,
  },
  title: {
    marginTop: '0.15rem',
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: font.h3,
    fontWeight: 600,
    color: color.text,
  },
  desc: {
    marginTop: '0.5rem',
    fontSize: font.small,
    lineHeight: 1.6,
    color: color.textMuted,
  },
  meta: {
    marginTop: '0.5rem',
    fontSize: font.small,
    color: color.textFaint,
  },
  link: {
    display: 'inline-block',
    marginTop: '1.1rem',
    color: color.cyan,
    fontSize: font.small,
    fontWeight: 500,
    textDecoration: 'none',
  },
} satisfies Record<string, React.CSSProperties>;
