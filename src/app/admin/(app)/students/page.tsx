import { allStudents } from '@/lib/dal';
import {
  PageTitle,
  Card,
  EmptyState,
  Badge,
  formatDate,
} from '@/components/app/Primitives';
import { color, font } from '@/lib/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Students' };

export default async function StudentsPage() {
  const students = await allStudents();

  if (students.length === 0) {
    return (
      <>
        <PageTitle title="Students" />
        <div style={{ marginTop: '1.5rem' }}>
          <EmptyState
            title="No students yet"
            body="Accepting an application creates the student's account and enrols them, and they appear here."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle
        title="Students"
        lede={`${students.length} enrolled ${students.length === 1 ? 'student' : 'students'}.`}
      />

      <div style={styles.list}>
        {students.map((student) => (
          <Card key={student.id} padded={false}>
            <a href={`/students/${student.id}`} style={styles.row}>
              <div style={styles.main}>
                <strong style={styles.name}>{student.name}</strong>
                <span style={styles.email}>{student.email}</span>
              </div>

              <div style={styles.meta}>
                {student.enrollments.length === 0 ? (
                  <Badge tone="warning">No programme</Badge>
                ) : (
                  student.enrollments.map((enrollment) => (
                    <Badge key={enrollment.id} tone="accent">
                      {enrollment.program.title}
                    </Badge>
                  ))
                )}
                {student.certificates.length > 0 ? (
                  <Badge tone="positive">
                    {student.certificates.length}{' '}
                    {student.certificates.length === 1 ? 'certificate' : 'certificates'}
                  </Badge>
                ) : null}
                <span style={styles.date}>Joined {formatDate(student.createdAt)}</span>
              </div>
            </a>
          </Card>
        ))}
      </div>
    </>
  );
}

const styles = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    marginTop: '1.75rem',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
    padding: '1rem 1.15rem',
    color: 'inherit',
    textDecoration: 'none',
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
    minWidth: 0,
  },
  name: {
    color: color.text,
  },
  email: {
    fontSize: font.small,
    color: color.textMuted,
    overflowWrap: 'anywhere',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    flexWrap: 'wrap',
  },
  date: {
    fontSize: font.small,
    color: color.textFaint,
  },
} satisfies Record<string, React.CSSProperties>;
