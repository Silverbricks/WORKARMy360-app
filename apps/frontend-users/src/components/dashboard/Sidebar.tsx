'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Icon, cn } from '@workarmy/ui';
import { DASHBOARD_NAV, type NavItem } from '@/lib/dashboard-nav';

function splitHref(href: string): { path: string; tab: string | null } {
  const [path, query = ''] = href.split('?');
  const tab = new URLSearchParams(query).get('tab');
  return { path, tab };
}

export function Sidebar({
  onLogout,
  onNavigate,
  badges,
}: {
  onLogout: () => void;
  onNavigate?: () => void;
  badges?: { messages?: number; notifications?: number };
}) {
  const pathname = usePathname();
  const currentTab = useSearchParams().get('tab');

  function isActive(item: NavItem): boolean {
    const { path, tab } = splitHref(item.href);
    if (path !== pathname) return false;
    if (tab) return tab === currentTab;
    // Untabbed item: active when there's no tab in the URL.
    return !currentTab;
  }

  function badgeFor(item: NavItem): number | undefined {
    if (item.badge === 'messages') return badges?.messages;
    if (item.badge === 'notifications') return badges?.notifications;
    return undefined;
  }

  return (
    <aside className="flex h-full flex-col">
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {DASHBOARD_NAV.map((group, gi) => (
          <div key={group.title ?? `group-${gi}`}>
            {group.title ? (
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                {group.title}
              </p>
            ) : null}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item);
                const count = badgeFor(item);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition',
                      active
                        ? 'font-semibold'
                        : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#1E293B]',
                    )}
                    style={
                      active
                        ? {
                            backgroundColor: 'color-mix(in srgb, var(--accent) 12%, white)',
                            color: 'var(--accent)',
                          }
                        : undefined
                    }
                  >
                    <Icon name={item.icon} size={18} />
                    <span className="truncate">{item.label}</span>
                    {count ? (
                      <span
                        className="ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                        style={{ backgroundColor: 'var(--accent)' }}
                      >
                        {count > 9 ? '9+' : count}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[#E5E7EB] px-3 py-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#475569] transition hover:bg-[#F1F5F9] hover:text-[#1E293B]"
        >
          <Icon name="logout" size={18} />
          Log out
        </button>
      </div>
    </aside>
  );
}
