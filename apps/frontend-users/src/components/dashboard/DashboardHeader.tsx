'use client';

import Link from 'next/link';
import type { MeResponse } from '@workarmy/types';
import { Icon, Logo } from '@workarmy/ui';

/** The dashboard's own app header (separate from the marketing site chrome). */
export function DashboardHeader({ me, onLogout }: { me: MeResponse | null; onLogout: () => void }) {
  const person = me?.person ?? null;
  const accountType = (person?.accountType ?? 'JOB_SEEKER').replace(/_/g, ' ');

  return (
    <header className="sticky top-0 z-40 border-b border-[#2A2F36] bg-[#1B1F24]">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/dashboard" aria-label="WorkArmy dashboard">
          <Logo onDark />
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-[#CBD5E1] transition hover:bg-white/5 hover:text-white"
          >
            Visit site ↗
          </Link>
          <span
            className="hidden rounded-full px-3 py-1 text-xs font-medium text-white sm:inline"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {accountType}
          </span>
          {person?.waId ? (
            <span className="hidden rounded-md border border-[#2A2F36] bg-[#2A2930] px-2.5 py-1 font-mono text-xs text-[#CBD5E1] sm:inline">
              {person.waId}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[#CBD5E1] transition hover:bg-white/5 hover:text-white"
          >
            <Icon name="logout" size={16} />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
