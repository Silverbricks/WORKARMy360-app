'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MeResponse } from '@workarmy/types';
import { Button, Card, Icon, t } from '@workarmy/ui';
import { api, bootstrapSession, clearAuthHint, setAccessToken } from '@/lib/api';

const NAV_ITEMS = ['Dashboard', 'My Profile', 'Find Jobs', 'Applications', 'Documents', 'Settings'];

export function DashboardClient() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const ok = await bootstrapSession();
      if (!ok) {
        clearAuthHint();
        router.replace('/login');
        return;
      }
      try {
        const data = await api.auth.me();
        if (active) setMe(data);
      } catch {
        clearAuthHint();
        router.replace('/login');
        return;
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  async function logout() {
    try {
      await api.auth.logout();
    } catch {
      // ignore — clear locally regardless
    }
    setAccessToken(null);
    clearAuthHint();
    router.replace('/login');
  }

  if (loading) {
    return <div className="py-24 text-center text-[#64748B]">{t('common.loading')}</div>;
  }

  const name = me?.person?.firstName ? `, ${me.person.firstName}` : '';
  const complete = me?.person?.profileComplete ?? false;

  return (
    <div className="grid gap-6 py-10 md:grid-cols-[220px_1fr]">
      <aside className="hidden md:block">
        <nav className="space-y-1">
          {NAV_ITEMS.map((item, i) => (
            <span
              key={item}
              className="flex cursor-default items-center gap-2 rounded-lg px-3 py-2 text-sm"
              style={
                i === 0
                  ? { backgroundColor: 'color-mix(in srgb, var(--accent) 12%, white)', color: 'var(--accent)', fontWeight: 600 }
                  : { color: '#64748B' }
              }
            >
              {item}
            </span>
          ))}
        </nav>
      </aside>

      <div className="space-y-6">
        <h1 className="text-2xl">{t('dashboard.greeting', { name })}</h1>

        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[#64748B]">{t('dashboard.profileStatus.label')}</p>
              <p className="mt-1 text-lg font-medium" style={{ color: 'var(--accent)' }}>
                {complete
                  ? t('dashboard.profileStatus.complete')
                  : t('dashboard.profileStatus.incomplete')}
              </p>
            </div>
            {me?.person ? (
              <span
                className="rounded-full px-3 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {me.person.accountType.replace(/_/g, ' ')}
              </span>
            ) : null}
          </div>
          <div className="mt-4 border-t border-[#E5E7EB] pt-4 text-sm text-[#64748B]">
            {t('dashboard.waId.label')}:{' '}
            <span className="font-mono text-[#1E293B]">{me?.person?.waId ?? '—'}</span>
          </div>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button>{t('dashboard.completeProfile.cta')}</Button>
          <Button variant="secondary">{t('dashboard.findWork.cta')}</Button>
        </div>

        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2 text-sm text-[#64748B] transition hover:text-[#1E293B]"
        >
          <Icon name="logout" size={16} /> {t('dashboard.logout')}
        </button>
      </div>
    </div>
  );
}
