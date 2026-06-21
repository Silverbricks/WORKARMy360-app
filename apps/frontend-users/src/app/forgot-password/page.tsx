import { Suspense } from 'react';
import Link from 'next/link';
import { t } from '@workarmy/ui';
import { AuthShell } from '@/components/AuthShell';
import { ForgotForm } from '@/components/auth/ForgotForm';

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title={t('auth.forgot.title')}
      subtitle={t('auth.forgot.subtitle')}
      footer={
        <Link href="/login" style={{ color: 'var(--accent)' }}>
          {t('auth.login.title')}
        </Link>
      }
    >
      <Suspense>
        <ForgotForm />
      </Suspense>
    </AuthShell>
  );
}
