import { Suspense } from 'react';
import { t } from '@workarmy/ui';
import { AuthShell } from '@/components/AuthShell';
import { VerifyForm } from '@/components/auth/VerifyForm';

export default function VerifyPage() {
  return (
    <AuthShell title={t('auth.verify.title')}>
      <Suspense>
        <VerifyForm />
      </Suspense>
    </AuthShell>
  );
}
