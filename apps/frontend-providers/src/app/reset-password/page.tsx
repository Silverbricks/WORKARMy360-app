import { Suspense } from 'react';
import { AuthShell } from '@/components/AuthShell';
import { ResetForm } from '@/components/auth/ResetForm';

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Choose a new password" subtitle="Pick a strong password you don’t use elsewhere.">
      <Suspense>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
