import { Suspense } from 'react';
import Link from 'next/link';
import { AuthShell } from '@/components/AuthShell';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your business account"
      subtitle="Set up your organisation in under a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--accent)' }}>
            Log in
          </Link>
        </>
      }
    >
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
