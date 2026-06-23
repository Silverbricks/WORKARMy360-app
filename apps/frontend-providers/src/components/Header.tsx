import Link from 'next/link';
import { Logo } from '@workarmy/ui';
import { USERS_URL } from '@/lib/api';

const linkClass = 'rounded-md px-3 py-2 text-[#CBD5E1] transition hover:bg-white/5 hover:text-white';

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#2A2F36] bg-[#1B1F24]">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="WorkArmy for Business">
          <Logo onDark />
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <a href={USERS_URL} className={`hidden sm:block ${linkClass}`}>
            Find Work
          </a>
          <Link href="/login" className={linkClass}>
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-lg px-3 py-2 font-medium text-white transition hover:brightness-95"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Register
          </Link>
        </nav>
      </div>
    </header>
  );
}
