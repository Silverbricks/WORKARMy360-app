import { Suspense } from 'react';
import Link from 'next/link';
import { AuthShell } from '@/components/AuthShell';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your WorkArmy business account."
      footer={
        <>
          New to WorkArmy?{' '}
          <Link href="/register" style={{ color: 'var(--accent)' }}>
            Create one
          </Link>
        </>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
