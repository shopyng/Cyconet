import LoginForm from '@/components/app/LoginForm';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) {
    redirect(session.role === 'ADMIN' ? '/admin' : '/learning');
  }

  return (
    <LoginForm
      heading="Admin Login"
      sub="Sign in to manage applications, students, and certificates."
    />
  );
}
