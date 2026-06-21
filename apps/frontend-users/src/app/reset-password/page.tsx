import { Suspense } from 'react';
import { t } from '@workarmy/ui';
import { AuthShell } from '@/components/AuthShell';
import { ResetForm } from '@/components/auth/ResetForm';

export default function ResetPasswordPage() {
  return (
    <AuthShell title={t('auth.reset.title')} subtitle={t('auth.reset.subtitle')}>
      <Suspense>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
