'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, cn, t } from '@workarmy/ui';
import { DASHBOARD_SECTIONS, sectionHref } from '@/lib/dashboard-sections';
import { useMe } from './DashboardShell';

export function Sidebar({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();
  const me = useMe();
  const complete = me?.person?.profileComplete ?? false;

  return (
    <aside className="md:sticky md:top-20 md:self-start">
      <nav className="space-y-0.5">
        {DASHBOARD_SECTIONS.map((section) => {
          const href = sectionHref(section.slug);
          const active = section.slug === 'home' ? pathname === '/dashboard' : pathname === href;
          // Everything except Home + My Profile is locked until the profile is complete.
          const locked = !complete && section.slug !== 'home' && section.slug !== 'profile';
          return (
            <Link
              key={section.slug}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition',
                active ? 'font-semibold' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]',
                locked && !active && 'opacity-55',
              )}
              style={
                active
                  ? { backgroundColor: 'color-mix(in srgb, var(--accent) 12%, white)', color: 'var(--accent)' }
                  : undefined
              }
            >
              <Icon name={section.icon} size={18} />
              <span className="truncate">{t(section.navLabelKey)}</span>
              {locked ? <Icon name="lock" size={13} className="ml-auto text-[#94A3B8]" /> : null}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onLogout}
        className="mt-3 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#1E293B]"
      >
        <Icon name="logout" size={18} />
        {t('dashboard.logout')}
      </button>
    </aside>
  );
}
