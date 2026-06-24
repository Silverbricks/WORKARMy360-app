'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { t, type LabelKey } from '@workarmy/ui';
import { PROVIDERS_URL } from '@/lib/api';

interface NavLink {
  key: LabelKey;
  href: string;
  external: boolean;
}

const links: NavLink[] = [
  { key: 'nav.findWork', href: '/find-work', external: false },
  { key: 'nav.forEmployers', href: `${PROVIDERS_URL}/employers`, external: true },
  { key: 'nav.forFarms', href: `${PROVIDERS_URL}/farms`, external: true },
  { key: 'nav.forContractors', href: `${PROVIDERS_URL}/contractors`, external: true },
  { key: 'nav.forLabourHire', href: `${PROVIDERS_URL}/labour-hire`, external: true },
  { key: 'nav.forRecruitment', href: `${PROVIDERS_URL}/recruitment`, external: true },
];

const linkClass = 'rounded-md px-3 py-2 text-[#CBD5E1] transition hover:bg-white/5 hover:text-white';

export function PublicNav() {
  // Detect the non-httpOnly auth hint cookie (set on login). Default to the
  // logged-out nav for SSR, then swap after mount to avoid hydration mismatch.
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    setAuthed(typeof document !== 'undefined' && document.cookie.includes('wa_auth='));
  }, []);

  if (authed) {
    return (
      <nav className="flex items-center gap-1 text-sm">
        <Link href="/" className={linkClass}>
          Visit site ↗
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg px-3 py-2 font-medium text-white transition hover:brightness-95"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          Dashboard
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-1 text-sm">
      <div className="hidden items-center gap-1 lg:flex">
        {links.map((link) =>
          link.external ? (
            <a key={link.key} href={link.href} className={linkClass}>
              {t(link.key)}
            </a>
          ) : (
            <Link key={link.key} href={link.href} className={linkClass}>
              {t(link.key)}
            </Link>
          ),
        )}
      </div>
      <Link href="/login" className={linkClass}>
        {t('nav.login')}
      </Link>
      <Link
        href="/register"
        className="rounded-lg px-3 py-2 font-medium text-white transition hover:brightness-95"
        style={{ backgroundColor: 'var(--accent)' }}
      >
        {t('nav.register')}
      </Link>
    </nav>
  );
}
