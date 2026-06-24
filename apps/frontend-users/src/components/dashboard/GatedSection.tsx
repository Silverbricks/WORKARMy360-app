'use client';

import Link from 'next/link';
import { Button, Card, Icon } from '@workarmy/ui';
import { useMe } from './DashboardShell';

/** Locks a section until the profile is marked complete. `profile` is never gated. */
export function GatedSection({ slug, children }: { slug: string; children: React.ReactNode }) {
  const me = useMe();
  const complete = me?.person?.profileComplete ?? false;
  if (slug === 'profile' || complete) return <>{children}</>;

  return (
    <Card className="mx-auto max-w-xl p-8 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#F1F5F9] text-[#64748B]">
        <Icon name="lock" size={24} />
      </div>
      <h2 className="text-xl text-[#1E293B]">Complete your profile to unlock this</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-[#64748B]">
        Finish the quick profile wizard to access jobs, work &amp; earnings, messages and the rest of
        your dashboard.
      </p>
      <div className="mt-5">
        <Link href="/dashboard/profile">
          <Button>Complete my profile →</Button>
        </Link>
      </div>
    </Card>
  );
}
