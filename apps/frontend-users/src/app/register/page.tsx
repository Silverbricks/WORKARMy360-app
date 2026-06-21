import { Suspense } from 'react';
import Link from 'next/link';
import { t } from '@workarmy/ui';
import { AuthShell } from '@/components/AuthShell';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <AuthShell
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footer={
        <>
          {t('auth.haveAccount')}{' '}
          <Link href="/login" style={{ color: 'var(--accent)' }}>
            {t('auth.register.toLogin')}
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
