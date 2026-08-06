import LoginForm from '@/components/app/LoginForm';
import { getSession } from '@/lib/auth';
import { tenantUrl } from '@/lib/tenant';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Login',
  robots: { index: false, follow: false },
};

/**
 * Student login page.
 *
 * Sits outside the (app) route group so it is not wrapped by the auth-gated
 * layout — a session check on the login page would redirect it to itself
 * forever.
 */
export default async function LearningLoginPage() {
  /*
   * Already signed in? Skip straight to the hub. This catches the case where
   * a student bookmarked the login URL or a password manager lands them here
   * after the cookie is already set.
   *
   * A student stays on this host, so a bare '/' is right. An admin belongs on
   * the admin host entirely, which needs an absolute URL to cross origins.
   */
  const session = await getSession();
  if (session) {
    redirect(session.role === 'ADMIN' ? await tenantUrl('admin') : '/');
  }

  return (
    <LoginForm
      heading="Welcome back"
      sub="Sign in to continue your programme."
      eyebrow="Student portal"
      highlights={[
        'Track progress across every module',
        'Sit exams and submit graded projects',
        'Earn certificates employers can verify',
      ]}
    />
  );
}
