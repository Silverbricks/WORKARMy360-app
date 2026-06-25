'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';

/**
 * Marketing chrome (charcoal nav + footer) wraps every public/auth page.
 * The dashboard is a SEPARATE area — it renders its own app header
 * (see DashboardShell), so we skip the marketing chrome there.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/dashboard')) return <>{children}</>;
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4">{children}</main>
      <Footer />
    </>
  );
}
