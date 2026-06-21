import Link from 'next/link';
import { Logo } from '@workarmy/ui';
import { PublicNav } from './PublicNav';

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#2A2F36] bg-[#1B1F24]">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="WorkArmy home">
          <Logo onDark />
        </Link>
        <PublicNav />
      </div>
    </header>
  );
}
