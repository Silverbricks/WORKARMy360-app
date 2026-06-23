import { Suspense } from 'react';
import { AuthShell } from '@/components/AuthShell';
import { VerifyForm } from '@/components/auth/VerifyForm';

export default function VerifyPage() {
  return (
    <AuthShell title="Verify your email">
      <Suspense>
        <VerifyForm />
      </Suspense>
    </AuthShell>
  );
}
