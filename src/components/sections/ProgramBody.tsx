/**
 * Shared body for every program page.
 *
 * Both `/cybersecurity-academy` and `/programs/[slug]` render this, so the two
 * routes cannot drift in structure — only in content. Kept a Server Component;
 * only the application form inside it is interactive.
 */

import ApplicationForm from '@/components/forms/ApplicationForm';
import SectionShell from '@/components/ui/SectionShell';
import { Check } from '@/components/ui/Icons';
import { color, container, font, layout, radius } from '@/lib/theme';
import type { Program, ProgramDetail } from '@/lib/content';

export default function ProgramBody({
  program,
  detail,
}: {
  program: Program;
  detail: ProgramDetail;
}) {
  return (
    <>
      {/* — Overview + practical facts — */}
      <section aria-labelledby="overview-heading" style={styles.section}>
        <div style={styles.split}>
          <div>
            <h2 id="overview-heading" style={styles.h2}>
              What you will actually do
            </h2>
            <p style={styles.overview}>{detail.overview}</p>
          </div>

          <dl style={styles.facts}>
            <div style={styles.fact}>
              <dt style={styles.factKey}>Duration</dt>
              <dd style={styles.factValue}>{program.duration}</dd>
            </div>
            <div style={styles.fact}>
              <dt style={styles.factKey}>Level</dt>
              <dd style={styles.factValue}>{program.level}</dd>
            </div>
            <div style={styles.fact}>
              <dt style={styles.factKey}>Prerequisites</dt>
              <dd style={styles.factValue}>{detail.prerequisites}</dd>
            </div>
            <div style={styles.fact}>
              <dt style={styles.factKey}>Schedule</dt>
              <dd style={styles.factValue}>{detail.schedule}</dd>
            </div>
            <div style={styles.fact}>
              <dt style={styles.factKey}>Tuition</dt>
              <dd style={styles.factValue}>{detail.tuition}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* — Curriculum — */}
      <SectionShell
        id="curriculum"
        eyebrow="Curriculum"
        heading="Module by"
        headingAccent="module."
        lead="Taught in this order because each block depends on the one before it. Nothing is presented as magic you are expected to accept."
      >
        <ol style={styles.modules}>
          {detail.modules.map((module, index) => (
            <li key={module.title} style={styles.module}>
              <span aria-hidden="true" style={styles.moduleNum}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 style={styles.moduleTitle}>{module.title}</h3>
                <p style={styles.moduleBody}>{module.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </SectionShell>

      {/* — Outcomes and roles — */}
      <SectionShell
        id="outcomes"
        eyebrow="Outcomes"
        heading="What you can do"
        headingAccent="afterwards."
        lead="Capabilities, not certificates. Each of these is something you will have done under review before you graduate."
      >
        <div style={styles.outcomeGrid}>
          <ul style={styles.outcomes}>
            {detail.outcomes.map((outcome) => (
              <li key={outcome} style={styles.outcome}>
                <span style={styles.check} aria-hidden="true">
                  <Check />
                </span>
                {outcome}
              </li>
            ))}
          </ul>

          <div style={styles.rolesCard}>
            <h3 style={styles.rolesTitle}>Roles this feeds into</h3>
            <ul style={styles.roles}>
              {detail.roles.map((role) => (
                <li key={role} style={styles.role}>
                  {role}
                </li>
              ))}
            </ul>
            <p style={styles.rolesNote}>
              92% of graduates are placed within six months, with job support
              continuing until you sign an offer.
            </p>
          </div>
        </div>
      </SectionShell>

      {/* — Apply — */}
      <SectionShell
        id="apply"
        eyebrow="Apply"
        heading={`Apply to ${program.title}`}
        lead="No application fee and no degree required. We reply within five working days."
      >
        <div style={styles.formCard}>
          <ApplicationForm defaultTrack={program.id} />
        </div>
      </SectionShell>
    </>
  );
}

const styles = {
  section: {
    position: 'relative',
    paddingBlock: layout.sectionY,
  },
  split: {
    ...container,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
    gap: 'clamp(2rem, 1.4rem + 2.5vw, 3.5rem)',
    alignItems: 'start',
  },
  h2: {
    fontSize: font.display2,
    fontWeight: 700,
    color: color.text,
  },
  overview: {
    marginTop: '1.35rem',
    maxWidth: '60ch',
    fontSize: font.bodyLg,
    lineHeight: 1.75,
    color: color.textMuted,
  },
  facts: {
    display: 'flex',
    flexDirection: 'column',
    padding: 'clamp(1.35rem, 1.1rem + 1vw, 1.9rem)',
    border: `1px solid ${color.border}`,
    borderRadius: radius.lg,
    background: color.surface,
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  },
  fact: {
    paddingBlock: '0.9rem',
    borderBottom: `1px solid ${color.border}`,
  },
  factKey: {
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: color.cyan,
  },
  factValue: {
    marginTop: '0.35rem',
    fontSize: '0.94rem',
    lineHeight: 1.6,
    color: color.text,
  },
  modules: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
    gap: '1.25rem',
  },
  module: {
    display: 'flex',
    gap: '1.1rem',
    padding: 'clamp(1.35rem, 1.1rem + 0.9vw, 1.75rem)',
    border: `1px solid ${color.border}`,
    borderRadius: radius.lg,
    background: color.surface,
  },
  moduleNum: {
    flexShrink: 0,
    fontFamily: 'var(--font-display), system-ui, sans-serif',
    fontSize: '0.95rem',
    fontWeight: 800,
    color: color.cyan,
  },
  moduleTitle: {
    fontSize: '1.08rem',
    fontWeight: 700,
    color: color.text,
  },
  moduleBody: {
    marginTop: '0.6rem',
    fontSize: '0.94rem',
    lineHeight: 1.7,
    color: color.textMuted,
  },
  outcomeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
    gap: '1.5rem',
    alignItems: 'start',
  },
  outcomes: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  outcome: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 11,
    fontSize: '1rem',
    lineHeight: 1.6,
    color: color.text,
  },
  check: {
    display: 'inline-flex',
    marginTop: 4,
    color: color.cyan,
    flexShrink: 0,
  },
  rolesCard: {
    padding: 'clamp(1.35rem, 1.1rem + 1vw, 1.9rem)',
    border: `1px solid ${color.border}`,
    borderRadius: radius.lg,
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)',
  },
  rolesTitle: {
    fontSize: font.h3,
    fontWeight: 700,
    color: color.text,
  },
  roles: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '1.15rem',
  },
  role: {
    padding: '0.4rem 0.8rem',
    borderRadius: radius.pill,
    border: '1px solid rgba(0, 229, 255, 0.28)',
    background: 'rgba(0, 229, 255, 0.09)',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: color.cyan,
  },
  rolesNote: {
    marginTop: '1.35rem',
    fontSize: '0.9rem',
    lineHeight: 1.65,
    color: color.textMuted,
  },
  formCard: {
    maxWidth: 780,
    padding: 'clamp(1.5rem, 1.2rem + 1.5vw, 2.5rem)',
    border: `1px solid ${color.border}`,
    borderRadius: radius.xl,
    background: color.surface,
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  },
} satisfies Record<string, React.CSSProperties>;
