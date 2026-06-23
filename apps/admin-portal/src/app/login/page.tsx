import { Suspense } from 'react';
import { AuthShell } from '@/components/AuthShell';
import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <AuthShell title="WorkArmy Admin" subtitle="Sign in to the operations console.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
