import LoginForm from '@/components/app/LoginForm';
import { getSession } from '@/lib/auth';
import { tenantUrl } from '@/lib/tenant';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login',
  robots: { index: false, follow: false },
};

/**
 * Staff login page.
 *
 * Sits outside the (app) route group so it is not wrapped by the auth-gated
 * layout — a session check there would redirect this page to itself forever.
 */
export default async function AdminLoginPage() {
  /*
   * Already signed in? Skip the form. An admin goes to the dashboard on this
   * same host, so a bare '/' is right; a student belongs on the learning host
   * entirely, which needs an absolute URL to cross origins.
   */
  const session = await getSession();
  if (session) {
    redirect(session.role === 'ADMIN' ? '/' : await tenantUrl('learning'));
  }

  return (
    <LoginForm
      heading="Staff sign in"
      sub="Manage applications, review submissions and issue certificates."
      eyebrow="Staff access"
      highlights={[
        'Review and decide on applications',
        'Grade project submissions with feedback',
        'Issue verifiable certificates',
      ]}
    />
  );
}
