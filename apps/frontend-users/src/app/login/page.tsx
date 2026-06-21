import { Suspense } from 'react';
import Link from 'next/link';
import { t } from '@workarmy/ui';
import { AuthShell } from '@/components/AuthShell';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <AuthShell
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={
        <>
          {t('auth.noAccount')}{' '}
          <Link href="/register" style={{ color: 'var(--accent)' }}>
            {t('auth.login.toRegister')}
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
