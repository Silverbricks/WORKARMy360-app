import { Suspense } from 'react';
import Link from 'next/link';
import { AuthShell } from '@/components/AuthShell';
import { ForgotForm } from '@/components/auth/ForgotForm';

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we’ll send a reset link."
      footer={
        <Link href="/login" style={{ color: 'var(--accent)' }}>
          Back to log in
        </Link>
      }
    >
      <Suspense>
        <ForgotForm />
      </Suspense>
    </AuthShell>
  );
}
