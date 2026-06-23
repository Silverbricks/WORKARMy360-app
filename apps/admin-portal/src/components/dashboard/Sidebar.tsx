'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AdminRole } from '@workarmy/types';
import { Icon, cn } from '@workarmy/ui';
import { ADMIN_SECTIONS } from '@/lib/dashboard-sections';

export function Sidebar({ adminRole, onLogout }: { adminRole: AdminRole; onLogout: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="md:sticky md:top-20 md:self-start">
      <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
        {adminRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Sub Admin'}
      </div>
      <nav className="space-y-0.5">
        {ADMIN_SECTIONS.map((s) => {
          const href = s.slug === 'home' ? '/dashboard' : `/dashboard/${s.slug}`;
          const active = s.slug === 'home' ? pathname === '/dashboard' : pathname === href;
          return (
            <Link
              key={s.slug}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition',
                active ? 'font-semibold' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]',
              )}
              style={
                active
                  ? { backgroundColor: 'color-mix(in srgb, var(--accent) 14%, white)', color: 'var(--accent)' }
                  : undefined
              }
            >
              <Icon name={s.icon} size={18} />
              <span className="truncate">{s.navLabel}</span>
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={onLogout}
        className="mt-3 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#1E293B]"
      >
        <Icon name="logout" size={18} /> Log out
      </button>
    </aside>
  );
}
